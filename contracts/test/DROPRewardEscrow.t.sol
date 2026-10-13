// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {DROPRewardEscrow} from "../src/DROPRewardEscrow.sol";
import {Assertions, TestVm, MockUSDC, WrongDecimalsToken} from "./TestSupport.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ContractSigner is IERC1271 {
    address private immutable owner;

    constructor(address owner_) {
        owner = owner_;
    }

    function isValidSignature(bytes32 digest, bytes memory signature) external view returns (bytes4) {
        return ECDSA.recover(digest, signature) == owner ? IERC1271.isValidSignature.selector : bytes4(0xffffffff);
    }
}

contract DROPRewardEscrowTest is Assertions {
    DROPRewardEscrow private escrow;
    MockUSDC private token;
    uint256 private constant SIGNER_KEY = 0xB0B;
    address private signer;
    address private constant OWNER = address(0xA11CE);
    address private constant OWNER_TWO = address(0xA11CE2);
    address private constant RECIPIENT = address(0xCAFE);
    address private constant RELAYER = address(0xFEED);
    bytes32 private constant ID = keccak256("campaign one");
    bytes32 private constant ID_TWO = keccak256("campaign two");
    bytes32 private constant RULES = keccak256("locked rules version 1");
    uint256 private constant START = 1000;
    uint256 private constant END = 2000;
    uint256 private constant DEADLINE = 3000;
    uint256 private constant REWARD = 1_000_000;

    function setUp() public {
        vm.chainId(31337);
        vm.warp(900);
        signer = vm.addr(SIGNER_KEY);
        token = new MockUSDC();
        escrow = new DROPRewardEscrow(address(token), 31337);
        token.mint(OWNER, 1_000_000_000);
        vm.prank(OWNER);
        token.approve(address(escrow), 3 * REWARD);
        vm.prank(OWNER);
        escrow.createCampaign(ID, signer, REWARD, 3, START, END, DEADLINE, RULES);
        vm.warp(START);
    }

    function _authorization() private view returns (DROPRewardEscrow.RewardAuthorization memory) {
        return DROPRewardEscrow.RewardAuthorization({
            campaignId: ID,
            rewardId: keccak256("award one"),
            slotIndex: 0,
            recipient: RECIPIENT,
            token: address(token),
            amount: REWARD,
            participantNullifier: keccak256("private campaign-scoped identifier"),
            qualifiedAt: START,
            deadline: DEADLINE,
            rulesHash: RULES
        });
    }

    function _sign(DROPRewardEscrow.RewardAuthorization memory authorization) private returns (bytes memory) {
        return _signDigest(escrow.hashAuthorization(authorization), SIGNER_KEY);
    }

    function _signDigest(bytes32 digest, uint256 key) private returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        return abi.encodePacked(r, s, v);
    }

    function _createSecond(uint256 reward, uint256 slots) private {
        token.mint(OWNER_TWO, reward * slots);
        vm.startPrank(OWNER_TWO);
        token.approve(address(escrow), reward * slots);
        escrow.createCampaign(ID_TWO, signer, reward, slots, block.timestamp, END, DEADLINE, RULES);
        vm.stopPrank();
    }

    function testCreationStoresFullBudgetAndConsumesOnlyExactApproval() public view {
        DROPRewardEscrow.Campaign memory campaign = escrow.getCampaign(ID);
        assertEq(campaign.owner, OWNER);
        assertEq(campaign.signer, signer);
        assertEq(campaign.token, address(token));
        assertEq(campaign.deposited, 3 * REWARD);
        assertEq(campaign.paid, 0);
        assertEq(campaign.refunded, 0);
        assertEq(token.balanceOf(address(escrow)), 3 * REWARD);
        assertEq(token.allowance(OWNER, address(escrow)), 0);
        assertEq(escrow.totalLiability(), 3 * REWARD);
    }

    function testFundingEmitsCreatedAndFundedEvents() public {
        token.mint(OWNER_TWO, REWARD);
        vm.prank(OWNER_TWO);
        token.approve(address(escrow), REWARD);
        vm.recordLogs();
        vm.prank(OWNER_TWO);
        escrow.createCampaign(ID_TWO, signer, REWARD, 1, START, END, DEADLINE, RULES);
        TestVm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 3);
        assertTrue(
            logs[1].topics[0]
                == keccak256(
                    "CampaignCreated(bytes32,address,address,address,uint256,uint256,uint256,uint256,uint256,bytes32)"
                )
        );
        assertTrue(logs[2].topics[0] == keccak256("CampaignFunded(bytes32,address,address,uint256)"));
        assertTrue(logs[2].topics[1] == ID_TWO);
    }

    function testRelayerPaysOnlySignedRecipientAndRecordsEvent() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        bytes memory signature = _sign(authorization);
        vm.recordLogs();
        vm.prank(RELAYER);
        escrow.claim(authorization, signature);
        assertEq(token.balanceOf(RECIPIENT), REWARD);
        assertEq(token.balanceOf(RELAYER), 0);
        assertTrue(escrow.isRewardClaimed(ID, authorization.rewardId));
        assertTrue(escrow.usedSlot(ID, 0));
        assertTrue(escrow.usedParticipant(ID, authorization.participantNullifier));
        assertTrue(escrow.usedRecipient(ID, RECIPIENT));
        assertEq(escrow.getCampaign(ID).paid, REWARD);
        assertEq(escrow.getCampaign(ID).claimedCount, 1);
        assertEq(escrow.totalLiability(), 2 * REWARD);
        TestVm.Log[] memory logs = vm.getRecordedLogs();
        assertEq(logs.length, 2);
        assertTrue(
            logs[1].topics[0] == keccak256("RewardPaid(bytes32,bytes32,address,address,uint256,uint256,bytes32)")
        );
        assertTrue(logs[1].topics[1] == ID);
        assertTrue(logs[1].topics[2] == authorization.rewardId);
        assertTrue(logs[1].topics[3] == bytes32(uint256(uint160(RECIPIENT))));
    }

    function testWrongSignerRejected() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        bytes memory signature = _signDigest(escrow.hashAuthorization(authorization), 0xBAD);
        vm.expectRevert(DROPRewardEscrow.InvalidSignature.selector);
        escrow.claim(authorization, signature);
    }

    function testMalformedSignatureRejectedWithoutUsingSlot() public {
        vm.expectRevert(DROPRewardEscrow.InvalidSignature.selector);
        escrow.claim(_authorization(), hex"00");
        assertFalse(escrow.usedSlot(ID, 0));
    }

    function testRecipientCannotBeSubstituted() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        bytes memory signature = _sign(authorization);
        authorization.recipient = RELAYER;
        vm.expectRevert(DROPRewardEscrow.InvalidSignature.selector);
        escrow.claim(authorization, signature);
    }

    function testWrongAmountRejectedEvenIfSignerApproves() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.amount += 1;
        bytes memory signature = _sign(authorization);
        vm.expectRevert(DROPRewardEscrow.InvalidAuthorization.selector);
        escrow.claim(authorization, signature);
    }

    function testWrongTokenRejectedEvenIfSignerApproves() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.token = address(0xBEEF);
        bytes memory signature = _sign(authorization);
        vm.expectRevert(DROPRewardEscrow.InvalidAuthorization.selector);
        escrow.claim(authorization, signature);
    }

    function testChangedRulesRejectedEvenIfSignerApproves() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.rulesHash = keccak256("changed");
        bytes memory signature = _sign(authorization);
        vm.expectRevert(DROPRewardEscrow.InvalidAuthorization.selector);
        escrow.claim(authorization, signature);
    }

    function testUnknownCampaignRejected() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.campaignId = ID_TWO;
        vm.expectRevert(DROPRewardEscrow.UnknownCampaign.selector);
        escrow.claim(authorization, hex"");
    }

    function testWrongChainDomainRejected() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        vm.chainId(143);
        bytes memory signature = _sign(authorization);
        vm.chainId(31337);
        vm.expectRevert(DROPRewardEscrow.InvalidSignature.selector);
        escrow.claim(authorization, signature);
    }

    function testWrongContractDomainRejected() public {
        DROPRewardEscrow otherEscrow = new DROPRewardEscrow(address(token), 31337);
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        bytes memory signature = _signDigest(otherEscrow.hashAuthorization(authorization), SIGNER_KEY);
        vm.expectRevert(DROPRewardEscrow.InvalidSignature.selector);
        escrow.claim(authorization, signature);
    }

    function testDuplicateSlotRejected() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        escrow.claim(authorization, _sign(authorization));
        authorization.rewardId = keccak256("different reward");
        authorization.recipient = address(0xBABE);
        authorization.participantNullifier = keccak256("different identity");
        bytes memory signature = _sign(authorization);
        vm.expectRevert(DROPRewardEscrow.DuplicateSlot.selector);
        escrow.claim(authorization, signature);
    }

    function testDuplicateRewardRejectedIndependently() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        escrow.claim(authorization, _sign(authorization));
        authorization.slotIndex = 1;
        authorization.recipient = address(0xBABE);
        authorization.participantNullifier = keccak256("different identity");
        bytes memory signature = _sign(authorization);
        vm.expectRevert(DROPRewardEscrow.DuplicateReward.selector);
        escrow.claim(authorization, signature);
    }

    function testDuplicateParticipantRejectedIndependently() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        escrow.claim(authorization, _sign(authorization));
        authorization.slotIndex = 1;
        authorization.rewardId = keccak256("different reward");
        authorization.recipient = address(0xBABE);
        bytes memory signature = _sign(authorization);
        vm.expectRevert(DROPRewardEscrow.DuplicateParticipant.selector);
        escrow.claim(authorization, signature);
    }

    function testDuplicateRecipientRejectedIndependently() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        escrow.claim(authorization, _sign(authorization));
        authorization.slotIndex = 1;
        authorization.rewardId = keccak256("different reward");
        authorization.participantNullifier = keccak256("different identity");
        bytes memory signature = _sign(authorization);
        vm.expectRevert(DROPRewardEscrow.DuplicateRecipient.selector);
        escrow.claim(authorization, signature);
    }

    function testOutOfRangeSlotCannotSpendAnotherCampaign() public {
        _createSecond(30 * REWARD, 3);
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.slotIndex = 3;
        bytes memory signature = _sign(authorization);
        vm.expectRevert(DROPRewardEscrow.SlotOutOfRange.selector);
        escrow.claim(authorization, signature);
        assertEq(escrow.remainingBudget(ID), 3 * REWARD);
        assertEq(escrow.remainingBudget(ID_TWO), 90 * REWARD);
    }

    function testQualificationBeforeStartRejected() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.qualifiedAt = START - 1;
        vm.expectRevert(DROPRewardEscrow.InvalidQualificationTime.selector);
        escrow.claim(authorization, hex"");
    }

    function testQualificationAtEndRejected() public {
        vm.warp(END);
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.qualifiedAt = END;
        vm.expectRevert(DROPRewardEscrow.InvalidQualificationTime.selector);
        escrow.claim(authorization, hex"");
    }

    function testFutureQualificationRejected() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.qualifiedAt = START + 1;
        vm.expectRevert(DROPRewardEscrow.InvalidQualificationTime.selector);
        escrow.claim(authorization, hex"");
    }

    function testLateSettlementAllowedForPriorQualificationUntilInclusiveDeadline() public {
        vm.warp(DEADLINE);
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        escrow.claim(authorization, _sign(authorization));
        assertEq(token.balanceOf(RECIPIENT), REWARD);
    }

    function testClaimAfterCampaignDeadlineRejected() public {
        vm.warp(DEADLINE + 1);
        vm.expectRevert(DROPRewardEscrow.ClaimExpired.selector);
        escrow.claim(_authorization(), hex"");
    }

    function testAuthorizationDeadlineCannotExtendCampaign() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.deadline = DEADLINE + 1;
        vm.expectRevert(DROPRewardEscrow.ClaimExpired.selector);
        escrow.claim(authorization, hex"");
    }

    function testExpiredAuthorizationRejectedBeforeCampaignExpiry() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.deadline = START;
        vm.warp(START + 1);
        vm.expectRevert(DROPRewardEscrow.ClaimExpired.selector);
        escrow.claim(authorization, hex"");
    }

    function testZeroRewardNullifierAndRecipientRejected() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.rewardId = bytes32(0);
        vm.expectRevert(DROPRewardEscrow.InvalidAuthorization.selector);
        escrow.claim(authorization, hex"");
        authorization = _authorization();
        authorization.participantNullifier = bytes32(0);
        vm.expectRevert(DROPRewardEscrow.InvalidAuthorization.selector);
        escrow.claim(authorization, hex"");
        authorization = _authorization();
        authorization.recipient = address(0);
        vm.expectRevert(DROPRewardEscrow.InvalidAuthorization.selector);
        escrow.claim(authorization, hex"");
    }

    function testRefundEarlyAndAtDeadlineRejected() public {
        vm.prank(OWNER);
        vm.expectRevert(DROPRewardEscrow.RefundTooEarly.selector);
        escrow.refund(ID);
        vm.warp(DEADLINE);
        vm.prank(OWNER);
        vm.expectRevert(DROPRewardEscrow.RefundTooEarly.selector);
        escrow.refund(ID);
    }

    function testRefundOnlyOriginalOwnerAndOnlyUnspentBudget() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        escrow.claim(authorization, _sign(authorization));
        vm.warp(DEADLINE + 1);
        vm.prank(RELAYER);
        vm.expectRevert(DROPRewardEscrow.UnauthorizedOwner.selector);
        escrow.refund(ID);
        uint256 ownerBefore = token.balanceOf(OWNER);
        vm.recordLogs();
        vm.prank(OWNER);
        assertEq(escrow.refund(ID), 2 * REWARD);
        assertEq(token.balanceOf(OWNER), ownerBefore + 2 * REWARD);
        assertEq(token.balanceOf(address(escrow)), 0);
        assertEq(escrow.totalLiability(), 0);
        assertEq(escrow.getCampaign(ID).refunded, 2 * REWARD);
        TestVm.Log[] memory logs = vm.getRecordedLogs();
        assertTrue(logs[1].topics[0] == keccak256("CampaignRefunded(bytes32,address,address,uint256)"));
        vm.prank(OWNER);
        vm.expectRevert(DROPRewardEscrow.NothingToRefund.selector);
        escrow.refund(ID);
    }

    function testRefundPreservesOtherCampaignLiability() public {
        _createSecond(30 * REWARD, 3);
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        escrow.claim(authorization, _sign(authorization));
        vm.warp(DEADLINE + 1);
        vm.prank(OWNER);
        escrow.refund(ID);
        assertEq(token.balanceOf(address(escrow)), 90 * REWARD);
        assertEq(escrow.remainingBudget(ID_TWO), 90 * REWARD);
        assertEq(escrow.getCampaign(ID_TWO).paid, 0);
        assertEq(escrow.getCampaign(ID_TWO).refunded, 0);
        assertEq(escrow.totalLiability(), 90 * REWARD);
    }

    function testRecipientCanReceiveDifferentCampaignWithDistinctRewardId() public {
        _createSecond(REWARD, 3);
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        escrow.claim(authorization, _sign(authorization));
        authorization.campaignId = ID_TWO;
        authorization.rewardId = keccak256("award in campaign two");
        escrow.claim(authorization, _sign(authorization));
        assertEq(token.balanceOf(RECIPIENT), 2 * REWARD);
        assertEq(escrow.remainingBudget(ID), 2 * REWARD);
        assertEq(escrow.remainingBudget(ID_TWO), 2 * REWARD);
    }

    function testGlobalRewardIdCannotBeReusedAcrossCampaigns() public {
        _createSecond(REWARD, 3);
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        escrow.claim(authorization, _sign(authorization));
        authorization.campaignId = ID_TWO;
        vm.expectRevert(DROPRewardEscrow.DuplicateReward.selector);
        escrow.claim(authorization, hex"");
    }

    function testTransferFailureRollsBackReservationAndCanBeRetried() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        bytes memory signature = _sign(authorization);
        token.setFailure(true);
        vm.expectRevert();
        escrow.claim(authorization, signature);
        assertFalse(escrow.usedSlot(ID, 0));
        assertFalse(escrow.isRewardClaimed(ID, authorization.rewardId));
        assertEq(escrow.remainingBudget(ID), 3 * REWARD);
        token.setFailure(false);
        escrow.claim(authorization, signature);
        assertEq(token.balanceOf(RECIPIENT), REWARD);
    }

    function testReentrantClaimCannotConsumeSecondSlot() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        DROPRewardEscrow.RewardAuthorization memory nested = _authorization();
        nested.rewardId = keccak256("nested reward");
        nested.slotIndex = 1;
        nested.recipient = address(0xBABE);
        nested.participantNullifier = keccak256("nested identity");
        token.setCallback(address(escrow), abi.encodeCall(escrow.claim, (nested, _sign(nested))));
        escrow.claim(authorization, _sign(authorization));
        assertTrue(token.callbackRejected());
        bytes memory revertData = token.callbackRevertData();
        bytes4 selector;
        assembly { selector := mload(add(revertData, 32)) }
        assertTrue(selector == bytes4(keccak256("ReentrancyGuardReentrantCall()")));
        assertFalse(escrow.usedSlot(ID, 1));
        assertEq(token.balanceOf(RECIPIENT), REWARD);
        assertEq(token.balanceOf(address(0xBABE)), 0);
    }

    function testReentrantCreationDuringFundingRejected() public {
        token.mint(OWNER_TWO, REWARD);
        vm.prank(OWNER_TWO);
        token.approve(address(escrow), REWARD);
        token.setCallback(
            address(escrow),
            abi.encodeCall(
                escrow.createCampaign, (keccak256("nested campaign"), signer, REWARD, 1, START, END, DEADLINE, RULES)
            )
        );
        vm.prank(OWNER_TWO);
        escrow.createCampaign(ID_TWO, signer, REWARD, 1, START, END, DEADLINE, RULES);
        assertTrue(token.callbackRejected());
        assertEq(escrow.totalLiability(), 4 * REWARD);
    }

    function testFeeTokenFundingRejectedAndCampaignRolledBack() public {
        token.mint(OWNER_TWO, REWARD);
        vm.prank(OWNER_TWO);
        token.approve(address(escrow), REWARD);
        token.setFee(true);
        vm.prank(OWNER_TWO);
        vm.expectRevert(DROPRewardEscrow.UnexpectedTokenBalance.selector);
        escrow.createCampaign(ID_TWO, signer, REWARD, 1, START, END, DEADLINE, RULES);
        assertEq(escrow.getCampaign(ID_TWO).owner, address(0));
        assertEq(escrow.totalLiability(), 3 * REWARD);
    }

    function testFeeTokenPayoutRejectedAndCanRetry() public {
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        bytes memory signature = _sign(authorization);
        token.setFee(true);
        vm.expectRevert(DROPRewardEscrow.UnexpectedTokenBalance.selector);
        escrow.claim(authorization, signature);
        assertFalse(escrow.usedSlot(ID, 0));
        assertEq(token.balanceOf(RECIPIENT), 0);
        token.setFee(false);
        escrow.claim(authorization, signature);
        assertEq(token.balanceOf(RECIPIENT), REWARD);
    }

    function testCreationWithoutEnoughBudgetCannotLeaveUnfundedCampaign() public {
        vm.prank(OWNER_TWO);
        vm.expectRevert();
        escrow.createCampaign(ID_TWO, signer, REWARD, 1, START, END, DEADLINE, RULES);
        assertEq(escrow.getCampaign(ID_TWO).owner, address(0));
    }

    function testCreationCannotReplaceExistingCampaign() public {
        vm.prank(OWNER);
        vm.expectRevert(DROPRewardEscrow.CampaignAlreadyExists.selector);
        escrow.createCampaign(ID, address(0xBAD), REWARD, 3, START, END, DEADLINE, RULES);
        assertEq(escrow.getCampaign(ID).signer, signer);
    }

    function testInvalidCampaignWindowsAndZeroConfigurationRejected() public {
        vm.prank(OWNER);
        vm.expectRevert(DROPRewardEscrow.InvalidConfiguration.selector);
        escrow.createCampaign(ID_TWO, signer, REWARD, 1, START - 1, END, DEADLINE, RULES);
        vm.prank(OWNER);
        vm.expectRevert(DROPRewardEscrow.InvalidConfiguration.selector);
        escrow.createCampaign(ID_TWO, signer, REWARD, 1, START, START, DEADLINE, RULES);
        vm.prank(OWNER);
        vm.expectRevert(DROPRewardEscrow.InvalidConfiguration.selector);
        escrow.createCampaign(ID_TWO, signer, REWARD, 1, START, END, END, RULES);
        vm.prank(OWNER);
        vm.expectRevert(DROPRewardEscrow.InvalidConfiguration.selector);
        escrow.createCampaign(ID_TWO, address(0), REWARD, 1, START, END, DEADLINE, RULES);
        vm.prank(OWNER);
        vm.expectRevert(DROPRewardEscrow.InvalidConfiguration.selector);
        escrow.createCampaign(ID_TWO, signer, 0, 1, START, END, DEADLINE, RULES);
    }

    function testConstructorRejectsWrongChainNoCodeAndWrongDecimals() public {
        vm.expectRevert(DROPRewardEscrow.UnsupportedChain.selector);
        new DROPRewardEscrow(address(token), 10143);
        vm.expectRevert(DROPRewardEscrow.UnsupportedToken.selector);
        new DROPRewardEscrow(address(0xCAFE), 31337);
        WrongDecimalsToken wrongDecimals = new WrongDecimalsToken();
        vm.expectRevert(DROPRewardEscrow.UnsupportedToken.selector);
        new DROPRewardEscrow(address(wrongDecimals), 31337);
    }

    function testMonadConstructorRejectsMockEvenIfSymbolWereUSDC() public {
        vm.chainId(10143);
        vm.expectRevert(DROPRewardEscrow.UnsupportedToken.selector);
        new DROPRewardEscrow(address(token), 10143);
    }

    function testERC1271SignerSupportedAndFixed() public {
        ContractSigner contractSigner = new ContractSigner(signer);
        token.mint(OWNER_TWO, REWARD);
        vm.startPrank(OWNER_TWO);
        token.approve(address(escrow), REWARD);
        escrow.createCampaign(ID_TWO, address(contractSigner), REWARD, 1, START, END, DEADLINE, RULES);
        vm.stopPrank();
        DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
        authorization.campaignId = ID_TWO;
        escrow.claim(authorization, _sign(authorization));
        assertEq(token.balanceOf(RECIPIENT), REWARD);
    }

    function testFuzz_PayoutPlusRefundNeverExceedsDeposit(uint64 rewardSeed, uint8 slotSeed, uint8 paidSeed) public {
        uint256 reward = uint256(rewardSeed) % 100_000_000 + 1;
        uint256 slots = uint256(slotSeed) % 40 + 1;
        uint256 paidCount = uint256(paidSeed) % (slots + 1);
        _createSecond(reward, slots);
        for (uint256 i = 0; i < paidCount; i++) {
            DROPRewardEscrow.RewardAuthorization memory authorization = _authorization();
            authorization.campaignId = ID_TWO;
            authorization.rewardId = keccak256(abi.encode("fuzz award", i));
            authorization.slotIndex = i;
            authorization.recipient = address(uint160(10_000 + i));
            authorization.amount = reward;
            authorization.participantNullifier = keccak256(abi.encode("fuzz identity", i));
            escrow.claim(authorization, _sign(authorization));
        }
        vm.warp(DEADLINE + 1);
        if (paidCount < slots) {
            vm.prank(OWNER_TWO);
            escrow.refund(ID_TWO);
        }
        DROPRewardEscrow.Campaign memory campaign = escrow.getCampaign(ID_TWO);
        assertEq(campaign.paid + campaign.refunded, campaign.deposited);
        assertEq(campaign.paid, paidCount * reward);
        assertEq(token.balanceOf(address(escrow)), 3 * REWARD);
        assertEq(escrow.totalLiability(), 3 * REWARD);
    }
}
