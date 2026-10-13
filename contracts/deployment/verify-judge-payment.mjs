// Public RPC reads only: no key loading, transaction signing, or broadcasting.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createPublicClient, decodeEventLog, decodeFunctionData, formatEther, formatUnits, getAddress, http, keccak256, parseAbi, toBytes, verifyTypedData } = require('viem');
const root = fileURLToPath(new URL('../../', import.meta.url));
const chainId = 10143;
const uuid = '3f4d5e79-4b58-4b4c-ac0e-7a77e948f267';
const campaignId = keccak256(toBytes(uuid));
const originalCampaignId = keccak256(toBytes('05460454-aacd-4f18-8843-c7b31f2bb76a'));
const hash = '0xbd8d5ce90d6d059931f19050744b546567215f337532a59fa8a481fe4d15ce6e';
const escrow = getAddress('0x22acf105A1af3f104f62e06fD813e49Af9358379');
const token = getAddress('0x534b2f3A21130d7a60830c2Df862319e593943A3');
const participant = getAddress('0x5e4c082c7cff436d9ce8fb7da32672b32540313d');
const relayer = getAddress('0xc67AABf3Ded43fA2C2E29e24809C1BD50af9393f');
const owner = getAddress('0xa896d06aa2888a749b5460df3d407f2d9ed666b3');
const signer = getAddress('0x9bD494B659B1D96b91Ae5fA6C8Af677cB793d872');
const rulesHash = '0xbb56906a475fb68034a0da83f0589d4c01d64b67498294f2a05938c8a9a45043';
const starts = BigInt(Date.parse('2026-10-13T16:33:00Z') / 1000);
const ends = BigInt(Date.parse('2026-10-20T16:18:00Z') / 1000);
const deadline = BigInt(Date.parse('2026-10-27T16:18:00Z') / 1000);
const abi = JSON.parse(readFileSync(join(root, 'contracts/abi/DROPRewardEscrow.json'), 'utf8'));
const tokenAbi = parseAbi(['function balanceOf(address) view returns (uint256)', 'event Transfer(address indexed from,address indexed to,uint256 value)']);
const types = { RewardAuthorization: [
  { name: 'campaignId', type: 'bytes32' }, { name: 'rewardId', type: 'bytes32' }, { name: 'slotIndex', type: 'uint256' },
  { name: 'recipient', type: 'address' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' },
  { name: 'participantNullifier', type: 'bytes32' }, { name: 'qualifiedAt', type: 'uint256' },
  { name: 'deadline', type: 'uint256' }, { name: 'rulesHash', type: 'bytes32' },
] };
function assert(ok, code) { if (!ok) throw new Error(code); }
function logs(receipt, address, eventAbi) {
  return receipt.logs.filter(log => getAddress(log.address) === address).map(log => {
    try { return decodeEventLog({ abi: eventAbi, data: log.data, topics: log.topics }); } catch { return null; }
  }).filter(Boolean);
}
function validateCampaign(state) {
  assert(getAddress(state.owner) === owner && getAddress(state.signer) === signer && getAddress(state.token) === token,
    'JUDGE_OWNER_SIGNER_OR_TOKEN_MISMATCH');
  assert(state.rewardAmount === 100_000n && state.maxRecipients === 20n && state.deposited === 2_000_000n,
    'JUDGE_REWARD_CAPACITY_OR_DEPOSIT_MISMATCH');
  assert(state.startsAt === starts && state.endsAt === ends && state.claimDeadline === deadline && state.rulesHash === rulesHash,
    'JUDGE_IMMUTABLE_PERIOD_OR_RULES_MISMATCH');
  assert(state.paid + state.refunded <= state.deposited && state.claimedCount <= state.maxRecipients,
    'JUDGE_ACCOUNTING_BOUNDS_FAILED');
}
async function main() {
  assert(process.argv.length === 2, 'THIS_READ_ONLY_PROOF_ACCEPTS_NO_OPTIONS');
  const client = createPublicClient({ transport: http('https://testnet-rpc.monad.xyz', { timeout: 15_000, retryCount: 1 }) });
  assert(await client.getChainId() === chainId, 'RPC_IS_NOT_MONAD_TESTNET');
  const receipt = await client.getTransactionReceipt({ hash });
  const [transaction, finalized, block] = await Promise.all([
    client.getTransaction({ hash }), client.getBlock({ blockTag: 'finalized' }), client.getBlock({ blockNumber: receipt.blockNumber }),
  ]);
  assert(receipt.status === 'success' && receipt.transactionHash === hash && receipt.to && getAddress(receipt.to) === escrow
    && getAddress(receipt.from) === relayer && finalized.number >= receipt.blockNumber && block.hash === receipt.blockHash,
    'JUDGE_RECEIPT_NOT_SUCCESSFUL_CANONICAL_AND_FINALIZED');
  assert(transaction.hash === hash && transaction.blockHash === receipt.blockHash && transaction.blockNumber === receipt.blockNumber
    && getAddress(transaction.from) === relayer && transaction.to && getAddress(transaction.to) === escrow
    && transaction.value === 0n && transaction.chainId === chainId, 'JUDGE_CLAIM_TRANSACTION_MISMATCH');
  const decoded = decodeFunctionData({ abi, data: transaction.input });
  assert(decoded.functionName === 'claim', 'JUDGE_PAYMENT_NOT_ESCROW_CLAIM');
  const [authorization, signature] = decoded.args;
  assert(authorization.campaignId === campaignId && getAddress(authorization.recipient) === participant
    && getAddress(authorization.token) === token && authorization.amount === 100_000n && authorization.slotIndex === 0n
    && authorization.rulesHash === rulesHash && authorization.qualifiedAt >= starts && authorization.qualifiedAt < ends
    && authorization.qualifiedAt <= block.timestamp && authorization.deadline >= block.timestamp && authorization.deadline <= deadline,
    'JUDGE_AUTHORIZATION_DIFFERS_FROM_FIXED_CAMPAIGN_RULES');
  assert(await verifyTypedData({ address: signer, domain: { name: 'DROPRewardEscrow', version: '1', chainId, verifyingContract: escrow },
    primaryType: 'RewardAuthorization', types, message: authorization, signature }), 'JUDGE_SIGNATURE_FAILED_INDEPENDENT_VERIFICATION');
  const paid = logs(receipt, escrow, abi).filter(event => event.eventName === 'RewardPaid');
  assert(paid.length === 1 && paid[0].args.campaignId === campaignId && paid[0].args.rewardId === authorization.rewardId
    && getAddress(paid[0].args.recipient) === participant && getAddress(paid[0].args.token) === token
    && paid[0].args.amount === 100_000n && paid[0].args.slotIndex === 0n
    && paid[0].args.participantNullifier === authorization.participantNullifier, 'JUDGE_EXACT_REWARD_PAID_EVENT_MISSING');
  const transfers = logs(receipt, token, tokenAbi).filter(event => event.eventName === 'Transfer');
  assert(transfers.length === 1 && getAddress(transfers[0].args.from) === escrow && getAddress(transfers[0].args.to) === participant
    && transfers[0].args.value === 100_000n, 'JUDGE_EXACT_USDC_TRANSFER_MISSING');
  async function snapshot(blockNumber) {
    const [usdc, mon, nonce, code, campaign, original, escrowUsdc, liability, relayerMon] = await Promise.all([
      client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [participant], blockNumber }),
      client.getBalance({ address: participant, blockNumber }), client.getTransactionCount({ address: participant, blockNumber }),
      client.getCode({ address: participant, blockNumber }),
      client.readContract({ address: escrow, abi, functionName: 'getCampaign', args: [campaignId], blockNumber }),
      client.readContract({ address: escrow, abi, functionName: 'getCampaign', args: [originalCampaignId], blockNumber }),
      client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [escrow], blockNumber }),
      client.readContract({ address: escrow, abi, functionName: 'totalLiability', blockNumber }),
      client.getBalance({ address: relayer, blockNumber }),
    ]);
    return { usdc, mon, nonce, code, campaign, original, escrowUsdc, liability, relayerMon };
  }
  const [before, after, claimed, rewardUsed, slotUsed, recipientUsed] = await Promise.all([
    snapshot(receipt.blockNumber - 1n), snapshot(receipt.blockNumber),
    client.readContract({ address: escrow, abi, functionName: 'isRewardClaimed', args: [campaignId, authorization.rewardId], blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi, functionName: 'usedRewardId', args: [authorization.rewardId], blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi, functionName: 'usedSlot', args: [campaignId, 0n], blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi, functionName: 'usedRecipient', args: [campaignId, participant], blockNumber: receipt.blockNumber }),
  ]);
  validateCampaign(before.campaign); validateCampaign(after.campaign);
  assert(before.usdc === 100_000n && after.usdc === 200_000n && before.mon === 0n && after.mon === 0n
    && before.nonce === 0 && after.nonce === 0 && (!before.code || before.code === '0x') && (!after.code || after.code === '0x'),
    'JUDGE_REAL_RECIPIENT_BALANCE_OR_GASLESS_RECEIVING_MISMATCH');
  const fee = receipt.gasUsed * receipt.effectiveGasPrice;
  assert(before.campaign.paid === 0n && after.campaign.paid === 100_000n && before.campaign.claimedCount === 0n
    && after.campaign.claimedCount === 1n && before.campaign.refunded === 0n && after.campaign.refunded === 0n
    && before.escrowUsdc === 6_900_000n && after.escrowUsdc === 6_800_000n
    && before.liability === before.escrowUsdc && after.liability === after.escrowUsdc
    && before.relayerMon - after.relayerMon === fee && claimed && rewardUsed && slotUsed && recipientUsed,
    'JUDGE_EXACT_ACCOUNTING_REPLAY_FLAGS_OR_RELAYER_FEE_MISMATCH');
  assert(before.original.deposited === 5_000_000n && before.original.paid === 100_000n && after.original.paid === before.original.paid
    && after.original.refunded === before.original.refunded && after.original.claimedCount === before.original.claimedCount,
    'ORIGINAL_CAMPAIGN_ACCOUNTING_CHANGED_DURING_JUDGE_CLAIM');
  const proof = {
    scope: 'Real authenticated production CATCH game payout, independently verified on Monad Testnet; two accounts controlled by the same human for technical verification, no traction claim.',
    mode: 'read-only', chainId, campaignUuid: uuid, chainCampaignId: campaignId, slug: 'metropolis-play', gameType: 'CATCH',
    escrow, owner, signer, participant, relayer, token, rulesHash, rewardId: authorization.rewardId, slotIndex: '0', amountUsdc: '0.1',
    transactionHash: hash, blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash, finalizedBlock: finalized.number.toString(),
    canonicalFinalizedReceiptVerified: true, exactZeroValueClaimInputVerified: true, independentEip712SignatureVerified: true,
    exactRewardPaidAndTokenTransferEventsVerified: true, qualifiedAtUtc: new Date(Number(authorization.qualifiedAt) * 1000).toISOString(),
    participantBeforeUsdc: '0.1', participantAfterUsdc: '0.2', participantBeforeMon: '0', participantAfterMon: '0',
    participantNonceBefore: before.nonce, participantNonceAfter: after.nonce, zeroMonGaslessReceivingVerified: true,
    accounting: {
      campaignDepositedUsdc: '2', campaignPaidBeforeUsdc: '0', campaignPaidAfterUsdc: '0.1', campaignRefundedUsdc: '0',
      claimCountBefore: '0', claimCountAfter: '1', campaignRemainingUsdc: '1.9',
      escrowBeforeUsdc: formatUnits(before.escrowUsdc, 6), escrowAfterUsdc: formatUnits(after.escrowUsdc, 6),
      totalLiabilityBeforeUsdc: formatUnits(before.liability, 6), totalLiabilityAfterUsdc: formatUnits(after.liability, 6),
      relayerBeforeMon: formatEther(before.relayerMon), relayerAfterMon: formatEther(after.relayerMon),
      relayerPaidExactlyReceiptGasVerified: true, campaignAndEscrowLiabilityDeltasVerified: true,
      globalRewardIdSlotAndRecipientReplayFlagsVerified: true, originalQuizCampaignAccountingUnchangedVerified: true,
    },
    gasUsed: receipt.gasUsed.toString(), effectiveGasPriceGwei: formatUnits(receipt.effectiveGasPrice, 9), actualGasCostMon: formatEther(fee),
    publicUrl: 'https://drop-omega-five.vercel.app/d/metropolis-play', verifiedAtUtc: new Date().toISOString(),
    limitations: 'This verifies the canonical claim and accounting. Game interaction and Privy login were observed separately in the production UI; public chain reads alone do not establish player identity or traction.',
  };
  const text = `${JSON.stringify(proof, null, 2)}\n`;
  const privateDirectory = join(root, '.local', 'testnet-deployment'); mkdirSync(privateDirectory, { recursive: true });
  writeFileSync(join(privateDirectory, 'judge-event-payment.public.json'), text);
  writeFileSync(join(root, 'contracts/deployment/judge-event-payment.public.json'), text);
  console.log(text);
}
main().catch(error => {
  console.error(/^[A-Z][A-Z0-9_]+$/.test(error.message ?? '') ? error.message : 'READ_ONLY_JUDGE_PAYMENT_PROOF_FAILED_CHECK_PUBLIC_RPC');
  process.exitCode = 1;
});
