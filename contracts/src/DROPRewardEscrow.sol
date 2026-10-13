// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Fixed-budget reward settlement. Game judging and slot assignment remain offchain.
/// @dev No administrator, upgrade, signer rotation, early cancellation, or token sweep exists.
contract DROPRewardEscrow is EIP712, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant MONAD_TESTNET_USDC = 0x534b2f3A21130d7a60830c2Df862319e593943A3;
    address public constant MONAD_MAINNET_USDC = 0x754704Bc059F8C67012fEd69BC8A327a5aafb603;

    bytes32 public constant REWARD_AUTHORIZATION_TYPEHASH = keccak256(
        "RewardAuthorization(bytes32 campaignId,bytes32 rewardId,uint256 slotIndex,address recipient,address token,uint256 amount,bytes32 participantNullifier,uint256 qualifiedAt,uint256 deadline,bytes32 rulesHash)"
    );

    struct Campaign {
        address owner;
        address signer;
        address token;
        uint256 rewardAmount;
        uint256 maxRecipients;
        uint256 startsAt;
        uint256 endsAt;
        uint256 claimDeadline;
        bytes32 rulesHash;
        uint256 deposited;
        uint256 paid;
        uint256 refunded;
        uint256 claimedCount;
    }

    struct RewardAuthorization {
        bytes32 campaignId;
        bytes32 rewardId;
        uint256 slotIndex;
        address recipient;
        address token;
        uint256 amount;
        bytes32 participantNullifier;
        uint256 qualifiedAt;
        uint256 deadline;
        bytes32 rulesHash;
    }

    IERC20 public immutable supportedToken;
    uint256 public immutable deploymentChainId;
    uint256 public totalLiability;

    mapping(bytes32 => Campaign) private _campaigns;
    mapping(bytes32 => mapping(uint256 => bool)) public usedSlot;
    mapping(bytes32 => mapping(bytes32 => bool)) public usedParticipant;
    mapping(bytes32 => mapping(address => bool)) public usedRecipient;
    mapping(bytes32 => mapping(bytes32 => bool)) private _campaignRewardClaimed;
    mapping(bytes32 => bool) public usedRewardId;

    error UnsupportedChain();
    error UnsupportedToken();
    error InvalidConfiguration();
    error CampaignAlreadyExists();
    error UnknownCampaign();
    error InvalidAuthorization();
    error InvalidSignature();
    error InvalidQualificationTime();
    error ClaimExpired();
    error SlotOutOfRange();
    error DuplicateSlot();
    error DuplicateReward();
    error DuplicateParticipant();
    error DuplicateRecipient();
    error InsufficientCampaignBudget();
    error UnauthorizedOwner();
    error RefundTooEarly();
    error NothingToRefund();
    error UnexpectedTokenBalance();

    event CampaignCreated(
        bytes32 indexed campaignId,
        address indexed owner,
        address indexed signer,
        address token,
        uint256 rewardAmount,
        uint256 maxRecipients,
        uint256 startsAt,
        uint256 endsAt,
        uint256 claimDeadline,
        bytes32 rulesHash
    );
    event CampaignFunded(bytes32 indexed campaignId, address indexed owner, address token, uint256 amount);
    event RewardPaid(
        bytes32 indexed campaignId,
        bytes32 indexed rewardId,
        address indexed recipient,
        address token,
        uint256 amount,
        uint256 slotIndex,
        bytes32 participantNullifier
    );
    event CampaignRefunded(bytes32 indexed campaignId, address indexed owner, address token, uint256 amount);

    /// @dev Local mocks are permitted only on chain 31337. Production chain addresses are fixed.
    constructor(address token, uint256 expectedChainId) EIP712("DROPRewardEscrow", "1") {
        if (block.chainid != expectedChainId) revert UnsupportedChain();
        if (expectedChainId == 10143) {
            if (token != MONAD_TESTNET_USDC) revert UnsupportedToken();
        } else if (expectedChainId == 143) {
            if (token != MONAD_MAINNET_USDC) revert UnsupportedToken();
        } else if (expectedChainId != 31337) {
            revert UnsupportedChain();
        }
        if (token.code.length == 0 || IERC20Metadata(token).decimals() != 6) revert UnsupportedToken();
        supportedToken = IERC20(token);
        deploymentChainId = expectedChainId;
    }

    /// @notice Creates immutable rules and funds the entire promised budget in one transaction.
    /// @dev Approve exactly rewardAmount * maxRecipients before calling this function.
    function createCampaign(
        bytes32 campaignId,
        address signer,
        uint256 rewardAmount,
        uint256 maxRecipients,
        uint256 startsAt,
        uint256 endsAt,
        uint256 claimDeadline,
        bytes32 rulesHash
    ) external nonReentrant {
        if (_campaigns[campaignId].owner != address(0)) revert CampaignAlreadyExists();
        if (
            campaignId == bytes32(0) || signer == address(0) || rewardAmount == 0 || maxRecipients == 0
                || startsAt < block.timestamp || endsAt <= startsAt || claimDeadline <= endsAt
                || rulesHash == bytes32(0)
        ) revert InvalidConfiguration();

        uint256 budget = rewardAmount * maxRecipients;
        _campaigns[campaignId] = Campaign({
            owner: msg.sender,
            signer: signer,
            token: address(supportedToken),
            rewardAmount: rewardAmount,
            maxRecipients: maxRecipients,
            startsAt: startsAt,
            endsAt: endsAt,
            claimDeadline: claimDeadline,
            rulesHash: rulesHash,
            deposited: budget,
            paid: 0,
            refunded: 0,
            claimedCount: 0
        });
        totalLiability += budget;

        uint256 beforeBalance = supportedToken.balanceOf(address(this));
        supportedToken.safeTransferFrom(msg.sender, address(this), budget);
        if (supportedToken.balanceOf(address(this)) != beforeBalance + budget) revert UnexpectedTokenBalance();

        emit CampaignCreated(
            campaignId,
            msg.sender,
            signer,
            address(supportedToken),
            rewardAmount,
            maxRecipients,
            startsAt,
            endsAt,
            claimDeadline,
            rulesHash
        );
        emit CampaignFunded(campaignId, msg.sender, address(supportedToken), budget);
    }

    /// @notice Anyone may relay a valid proof. Its recipient is the only address that receives tokens.
    function claim(RewardAuthorization calldata authorization, bytes calldata signature) external nonReentrant {
        Campaign storage campaign = _campaigns[authorization.campaignId];
        if (campaign.owner == address(0)) revert UnknownCampaign();
        if (
            authorization.rewardId == bytes32(0) || authorization.participantNullifier == bytes32(0)
                || authorization.recipient == address(0) || authorization.recipient == address(this)
                || authorization.token != campaign.token || authorization.amount != campaign.rewardAmount
                || authorization.rulesHash != campaign.rulesHash
        ) revert InvalidAuthorization();
        if (
            authorization.qualifiedAt < campaign.startsAt || authorization.qualifiedAt >= campaign.endsAt
                || authorization.qualifiedAt > block.timestamp
        ) revert InvalidQualificationTime();
        if (
            block.timestamp > campaign.claimDeadline || block.timestamp > authorization.deadline
                || authorization.deadline > campaign.claimDeadline || authorization.deadline < authorization.qualifiedAt
        ) revert ClaimExpired();
        if (authorization.slotIndex >= campaign.maxRecipients) revert SlotOutOfRange();
        if (usedSlot[authorization.campaignId][authorization.slotIndex]) revert DuplicateSlot();
        if (usedRewardId[authorization.rewardId]) revert DuplicateReward();
        if (usedParticipant[authorization.campaignId][authorization.participantNullifier]) {
            revert DuplicateParticipant();
        }
        if (usedRecipient[authorization.campaignId][authorization.recipient]) revert DuplicateRecipient();
        if (campaign.deposited - campaign.paid - campaign.refunded < authorization.amount) {
            revert InsufficientCampaignBudget();
        }
        if (!SignatureChecker.isValidSignatureNow(campaign.signer, hashAuthorization(authorization), signature)) {
            revert InvalidSignature();
        }

        usedSlot[authorization.campaignId][authorization.slotIndex] = true;
        usedRewardId[authorization.rewardId] = true;
        _campaignRewardClaimed[authorization.campaignId][authorization.rewardId] = true;
        usedParticipant[authorization.campaignId][authorization.participantNullifier] = true;
        usedRecipient[authorization.campaignId][authorization.recipient] = true;
        campaign.paid += authorization.amount;
        campaign.claimedCount += 1;
        totalLiability -= authorization.amount;

        _transferExact(authorization.recipient, authorization.amount);
        emit RewardPaid(
            authorization.campaignId,
            authorization.rewardId,
            authorization.recipient,
            authorization.token,
            authorization.amount,
            authorization.slotIndex,
            authorization.participantNullifier
        );
    }

    /// @notice The original owner may recover only this campaign's unspent budget after claims close.
    function refund(bytes32 campaignId) external nonReentrant returns (uint256 amount) {
        Campaign storage campaign = _campaigns[campaignId];
        if (campaign.owner == address(0)) revert UnknownCampaign();
        if (msg.sender != campaign.owner) revert UnauthorizedOwner();
        if (block.timestamp <= campaign.claimDeadline) revert RefundTooEarly();
        amount = campaign.deposited - campaign.paid - campaign.refunded;
        if (amount == 0) revert NothingToRefund();

        campaign.refunded += amount;
        totalLiability -= amount;
        _transferExact(campaign.owner, amount);
        emit CampaignRefunded(campaignId, campaign.owner, campaign.token, amount);
    }

    function hashAuthorization(RewardAuthorization memory authorization) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    REWARD_AUTHORIZATION_TYPEHASH,
                    authorization.campaignId,
                    authorization.rewardId,
                    authorization.slotIndex,
                    authorization.recipient,
                    authorization.token,
                    authorization.amount,
                    authorization.participantNullifier,
                    authorization.qualifiedAt,
                    authorization.deadline,
                    authorization.rulesHash
                )
            )
        );
    }

    function isRewardClaimed(bytes32 campaignId, bytes32 rewardId) external view returns (bool) {
        return _campaignRewardClaimed[campaignId][rewardId];
    }

    function campaigns(bytes32 campaignId) external view returns (Campaign memory) {
        return _campaigns[campaignId];
    }

    function getCampaign(bytes32 campaignId) external view returns (Campaign memory) {
        return _campaigns[campaignId];
    }

    function remainingBudget(bytes32 campaignId) external view returns (uint256) {
        Campaign storage campaign = _campaigns[campaignId];
        if (campaign.owner == address(0)) revert UnknownCampaign();
        return campaign.deposited - campaign.paid - campaign.refunded;
    }

    function _transferExact(address recipient, uint256 amount) private {
        uint256 escrowBefore = supportedToken.balanceOf(address(this));
        uint256 recipientBefore = supportedToken.balanceOf(recipient);
        supportedToken.safeTransfer(recipient, amount);
        if (
            supportedToken.balanceOf(address(this)) != escrowBefore - amount
                || supportedToken.balanceOf(recipient) != recipientBefore + amount
        ) revert UnexpectedTokenBalance();
    }
}
