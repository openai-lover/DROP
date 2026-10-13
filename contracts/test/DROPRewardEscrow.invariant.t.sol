// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {DROPRewardEscrow} from "../src/DROPRewardEscrow.sol";
import {Assertions, MockUSDC} from "./TestSupport.sol";

/// @dev Stateful adversary interleaves payments, replay attempts, expiry and refunds across two budgets.
contract EscrowHandler is Assertions {
    DROPRewardEscrow public immutable escrow;
    MockUSDC public immutable token;
    uint256 private constant SIGNER_KEY = 0x5151;
    bytes32 public constant ID_A = keccak256("invariant campaign A");
    bytes32 public constant ID_B = keccak256("invariant campaign B");
    bytes32 private constant RULES = keccak256("invariant immutable rules");
    uint256 private constant START = 10_000;
    uint256 private constant END = 11_000;
    uint256 private constant DEADLINE = 12_000;
    uint256 public ghostDeposited;
    uint256 public ghostPaid;
    uint256 public ghostRefunded;

    constructor(DROPRewardEscrow escrow_, MockUSDC token_) {
        escrow = escrow_;
        token = token_;
        address signer = vm.addr(SIGNER_KEY);
        token.mint(address(this), 50_000_000);
        token.approve(address(escrow), 50_000_000);
        escrow.createCampaign(ID_A, signer, 1_000_000, 20, START, END, DEADLINE, RULES);
        escrow.createCampaign(ID_B, signer, 3_000_000, 10, START, END, DEADLINE + 500, RULES);
        ghostDeposited = 50_000_000;
    }

    function claim(uint256 seed) external {
        bytes32 id = seed % 2 == 0 ? ID_A : ID_B;
        DROPRewardEscrow.Campaign memory campaign = escrow.getCampaign(id);
        uint256 slot = (seed / 2) % campaign.maxRecipients;
        DROPRewardEscrow.RewardAuthorization memory authorization = DROPRewardEscrow.RewardAuthorization({
            campaignId: id,
            rewardId: keccak256(abi.encode(id, slot)),
            slotIndex: slot,
            recipient: address(uint160(1_000_000 + slot + (id == ID_A ? 100 : 200))),
            token: address(token),
            amount: campaign.rewardAmount,
            participantNullifier: keccak256(abi.encode("secret keyed identifier", id, slot)),
            qualifiedAt: START,
            deadline: campaign.claimDeadline,
            rulesHash: RULES
        });
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_KEY, escrow.hashAuthorization(authorization));
        try escrow.claim(authorization, abi.encodePacked(r, s, v)) {
            ghostPaid += authorization.amount;
        } catch {}
    }

    function refund(uint256 seed) external {
        bytes32 id = seed % 2 == 0 ? ID_A : ID_B;
        try escrow.refund(id) returns (uint256 amount) {
            ghostRefunded += amount;
        } catch {}
    }

    function advanceTime(uint256 seed) external {
        // Monotonic block time; tests include exact deadlines as well as many mixed intermediate states.
        vm.warp(block.timestamp + seed % 201);
    }
}

contract DROPRewardEscrowInvariantTest is Assertions {
    struct FuzzSelector {
        address addr;
        bytes4[] selectors;
    }

    struct FuzzArtifactSelector {
        string artifact;
        bytes4[] selectors;
    }

    struct FuzzInterface {
        address addr;
        string[] artifacts;
    }
    DROPRewardEscrow private escrow;
    MockUSDC private token;
    EscrowHandler private handler;
    address[] private _targets;

    function setUp() public {
        vm.chainId(31337);
        vm.warp(9_000);
        token = new MockUSDC();
        escrow = new DROPRewardEscrow(address(token), 31337);
        handler = new EscrowHandler(escrow, token);
        _targets.push(address(handler));
        vm.warp(10_000);
    }

    // Foundry discovers this target list without relying on forge-std or an unpinned dependency.
    function targetContracts() external view returns (address[] memory) {
        return _targets;
    }

    function excludeContracts() external pure returns (address[] memory) {
        return new address[](0);
    }

    function targetSenders() external pure returns (address[] memory) {
        return new address[](0);
    }

    function excludeSenders() external pure returns (address[] memory) {
        return new address[](0);
    }

    function targetArtifacts() external pure returns (string[] memory) {
        return new string[](0);
    }

    function excludeArtifacts() external pure returns (string[] memory) {
        return new string[](0);
    }

    function targetArtifactSelectors() external pure returns (FuzzArtifactSelector[] memory) {
        return new FuzzArtifactSelector[](0);
    }

    function targetInterfaces() external pure returns (FuzzInterface[] memory) {
        return new FuzzInterface[](0);
    }

    function targetSelectors() external pure returns (FuzzSelector[] memory) {
        return new FuzzSelector[](0);
    }

    function excludeSelectors() external pure returns (FuzzSelector[] memory) {
        return new FuzzSelector[](0);
    }

    function invariant_AccountingMatchesActualTokenBalancesAcrossCampaigns() public view {
        DROPRewardEscrow.Campaign memory a = escrow.getCampaign(handler.ID_A());
        DROPRewardEscrow.Campaign memory b = escrow.getCampaign(handler.ID_B());
        uint256 remainingA = a.deposited - a.paid - a.refunded;
        uint256 remainingB = b.deposited - b.paid - b.refunded;
        assertLe(a.paid + a.refunded, a.deposited);
        assertLe(b.paid + b.refunded, b.deposited);
        assertEq(token.balanceOf(address(escrow)), remainingA + remainingB);
        assertEq(escrow.totalLiability(), remainingA + remainingB);
        assertEq(a.paid + b.paid, handler.ghostPaid());
        assertEq(a.refunded + b.refunded, handler.ghostRefunded());
        assertLe(handler.ghostPaid() + handler.ghostRefunded(), handler.ghostDeposited());
        assertEq(a.paid, a.claimedCount * a.rewardAmount);
        assertEq(b.paid, b.claimedCount * b.rewardAmount);
        assertLe(a.claimedCount, a.maxRecipients);
        assertLe(b.claimedCount, b.maxRecipients);
    }

    function invariant_EachSignedRecipientReceivesAtMostOneRewardPerCampaign() public view {
        for (uint256 slot = 0; slot < 20; slot++) {
            assertLe(token.balanceOf(address(uint160(1_000_100 + slot))), 1_000_000);
        }
        for (uint256 slot = 0; slot < 10; slot++) {
            assertLe(token.balanceOf(address(uint160(1_000_200 + slot))), 3_000_000);
        }
    }
}
