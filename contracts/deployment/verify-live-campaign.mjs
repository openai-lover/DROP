// Read-only proof for the actual authenticated production demo. No key loading, signing or writes to a chain.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createPublicClient, decodeEventLog, decodeFunctionData, formatEther, formatUnits, getAddress, http, keccak256, parseAbi, toBytes, verifyTypedData } = require('viem');
const root = fileURLToPath(new URL('../../', import.meta.url));
const chainId = 10143;
const uuid = '05460454-aacd-4f18-8843-c7b31f2bb76a';
const campaignId = keccak256(toBytes(uuid));
const escrow = getAddress('0x22acf105A1af3f104f62e06fD813e49Af9358379');
const token = getAddress('0x534b2f3A21130d7a60830c2Df862319e593943A3');
const owner = getAddress('0xa896d06aa2888a749b5460df3d407f2d9ed666b3');
const signer = getAddress('0x9bD494B659B1D96b91Ae5fA6C8Af677cB793d872');
const relayer = getAddress('0xc67AABf3Ded43fA2C2E29e24809C1BD50af9393f');
const participant = getAddress('0x5e4c082c7cff436d9ce8fb7da32672b32540313d');
const fundingHash = '0x4f10e52e5a77c8c24c42dc605e6e3413010fb2ae9dd1b13657eb897f30576637';
const approvalHash = '0xc38249778662235f0d95b1b642bfb071001d7cdedc2e21e5e25d97bc6e370c4c';
const rulesHash = '0x409262bde7874e3be7454bf2655a3e1022646c86d56c5cf4460485be928080ec';
const starts = BigInt(Date.parse('2026-10-13T16:11:00Z') / 1000), ends = BigInt(Date.parse('2026-10-13T17:11:00Z') / 1000), deadline = BigInt(Date.parse('2026-10-14T17:11:00Z') / 1000);
const escrowAbi = JSON.parse(readFileSync(join(root, 'contracts', 'abi', 'DROPRewardEscrow.json'), 'utf8'));
const tokenAbi = parseAbi(['function balanceOf(address) view returns (uint256)', 'event Transfer(address indexed from,address indexed to,uint256 value)', 'event Approval(address indexed owner,address indexed spender,uint256 value)']);
const publicApi = 'https://drop-omega-five.vercel.app/api/campaigns/metropolis-first-drop';
const rewardTypes = { RewardAuthorization: [
  { name: 'campaignId', type: 'bytes32' }, { name: 'rewardId', type: 'bytes32' }, { name: 'slotIndex', type: 'uint256' },
  { name: 'recipient', type: 'address' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' },
  { name: 'participantNullifier', type: 'bytes32' }, { name: 'qualifiedAt', type: 'uint256' }, { name: 'deadline', type: 'uint256' }, { name: 'rulesHash', type: 'bytes32' },
] };
function assert(condition, code) { if (!condition) throw new Error(code); }
function save(name, proof) {
  const text = `${JSON.stringify(proof, null, 2)}\n`;
  const directory = join(root, '.local', 'testnet-deployment'); mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, name), text);
  writeFileSync(join(root, 'contracts', 'deployment', name), text);
}
function eventLogs(receipt, address, abi) {
  return receipt.logs.filter(log => getAddress(log.address) === address).map(log => {
    try { return decodeEventLog({ abi, data: log.data, topics: log.topics }); } catch { return null; }
  }).filter(Boolean);
}
async function canonicalReceipt(client, hash, expectedSender, expectedTo) {
  const receipt = await client.getTransactionReceipt({ hash });
  const [finalized, block] = await Promise.all([client.getBlock({ blockTag: 'finalized' }), client.getBlock({ blockNumber: receipt.blockNumber })]);
  assert(receipt.status === 'success' && receipt.transactionHash === hash && getAddress(receipt.from) === expectedSender && receipt.to && getAddress(receipt.to) === expectedTo, 'RECEIPT_STATUS_SENDER_OR_DESTINATION_MISMATCH');
  assert(finalized.number !== null && finalized.number >= receipt.blockNumber && block.hash === receipt.blockHash, 'RECEIPT_IS_NOT_CANONICAL_AND_FINALIZED');
  return { receipt, block, finalized, publicReceipt: { transactionHash: hash, blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash, finalizedBlock: finalized.number.toString(), gasUsed: receipt.gasUsed.toString(), effectiveGasPriceGwei: formatUnits(receipt.effectiveGasPrice, 9), actualGasCostMon: formatEther(receipt.gasUsed * receipt.effectiveGasPrice), canonicalFinalizedReceiptVerified: true } };
}
export function validateDemoCampaign(state) {
  assert(getAddress(state.owner) === owner && getAddress(state.signer) === signer && getAddress(state.token) === token, 'DEMO_CAMPAIGN_OWNER_SIGNER_OR_TOKEN_MISMATCH');
  assert(state.rewardAmount === 100_000n && state.maxRecipients === 50n && state.deposited === 5_000_000n, 'DEMO_CAMPAIGN_AMOUNT_CAPACITY_OR_BUDGET_MISMATCH');
  assert(state.startsAt === starts && state.endsAt === ends && state.claimDeadline === deadline && state.rulesHash === rulesHash, 'DEMO_CAMPAIGN_PERIOD_OR_RULES_HASH_MISMATCH');
  assert(state.paid + state.refunded <= state.deposited && state.claimedCount <= state.maxRecipients, 'DEMO_CAMPAIGN_ACCOUNTING_BOUNDS_FAILED');
}
async function verifyFunding(client) {
  const verified = await canonicalReceipt(client, fundingHash, owner, escrow), { receipt, publicReceipt } = verified;
  const state = await client.readContract({ address: escrow, abi: escrowAbi, functionName: 'getCampaign', args: [campaignId], blockNumber: receipt.blockNumber });
  validateDemoCampaign(state);
  assert(state.paid === 0n && state.refunded === 0n && state.claimedCount === 0n, 'FUNDING_BLOCK_ALREADY_CONTAINS_REWARD_SETTLEMENT');
  const transaction = await client.getTransaction({ hash: fundingHash });
  const decoded = decodeFunctionData({ abi: escrowAbi, data: transaction.input });
  assert(decoded.functionName === 'createCampaign' && transaction.value === 0n && decoded.args[0] === campaignId && getAddress(decoded.args[1]) === signer && decoded.args[2] === 100_000n && decoded.args[3] === 50n && decoded.args[4] === starts && decoded.args[5] === ends && decoded.args[6] === deadline && decoded.args[7] === rulesHash, 'FUNDING_CREATION_INPUT_DIFFERS_FROM_FIXED_RULES');
  const logs = eventLogs(receipt, escrow, escrowAbi);
  const created = logs.find(event => event.eventName === 'CampaignCreated' && event.args.campaignId === campaignId);
  const funded = logs.find(event => event.eventName === 'CampaignFunded' && event.args.campaignId === campaignId);
  assert(created && getAddress(created.args.owner) === owner && getAddress(created.args.signer) === signer && created.args.rulesHash === rulesHash && funded && getAddress(funded.args.owner) === owner && getAddress(funded.args.token) === token && funded.args.amount === 5_000_000n, 'EXPECTED_CAMPAIGN_CREATED_AND_FUNDED_EVENTS_MISSING');
  assert(eventLogs(receipt, token, tokenAbi).some(event => event.eventName === 'Transfer' && getAddress(event.args.from) === owner && getAddress(event.args.to) === escrow && event.args.value === 5_000_000n), 'EXPECTED_OWNER_TO_ESCROW_USDC_TRANSFER_MISSING');
  const [ownerBefore, ownerAfter, escrowBefore, escrowAfter, liability] = await Promise.all([
    client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [owner], blockNumber: receipt.blockNumber - 1n }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [owner], blockNumber: receipt.blockNumber }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [escrow], blockNumber: receipt.blockNumber - 1n }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [escrow], blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi: escrowAbi, functionName: 'totalLiability', blockNumber: receipt.blockNumber }),
  ]);
  assert(ownerBefore - ownerAfter === 5_000_000n && escrowAfter - escrowBefore === 5_000_000n && liability === 5_000_000n, 'FUNDING_TOKEN_BALANCE_OR_LIABILITY_MISMATCH');
  const response = await fetch(publicApi, { method: 'GET', headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15_000) });
  assert(response.ok, 'PUBLISHED_CAMPAIGN_PUBLIC_API_UNAVAILABLE');
  const body = await response.json(), published = body.data;
  assert(published?.id === uuid && published.chainCampaignId === campaignId && published.chainId === chainId && getAddress(published.escrow) === escrow && getAddress(published.token) === token && published.rulesHash === rulesHash && published.rewardAmountAtomic === '100000' && published.maxRecipients === 50 && published.startsAt === new Date(Number(starts) * 1000).toISOString() && published.endsAt === new Date(Number(ends) * 1000).toISOString() && published.claimDeadline === new Date(Number(deadline) * 1000).toISOString() && published.fundingTx === fundingHash && published.status !== 'DRAFT', 'PUBLIC_SERVER_RULES_DIFFER_FROM_ACTUAL_FUNDED_CAMPAIGN');
  const proof = { scope: 'Real Privy creator UI funded an immutable 5 test USDC campaign; independently checked via public reads.', mode: 'read-only', chainId, campaignUuid: uuid, chainCampaignId: campaignId, escrow, owner, signer, token,
    rewardUsdc: '0.1', maxRecipients: 50, depositedUsdc: '5', rulesHash, ...publicReceipt,
    exactCreationInputVerified: true, exactFundingEventsVerified: true, publicServerRulesMatchOnchain: true,
    fundingBlockBalances: { ownerBeforeUsdc: formatUnits(ownerBefore, 6), ownerAfterUsdc: formatUnits(ownerAfter, 6), escrowBeforeUsdc: formatUnits(escrowBefore, 6), escrowAfterUsdc: formatUnits(escrowAfter, 6), totalLiabilityUsdc: formatUnits(liability, 6) },
    startsAt: published.startsAt, endsAt: published.endsAt, claimDeadline: published.claimDeadline, publicUrl: 'https://drop-omega-five.vercel.app/d/metropolis-first-drop', verifiedAtUtc: new Date().toISOString() };
  // This actual preceding approval was located using bounded log pages. Rechecks use its exact hash.
  const approvalReceipt = await canonicalReceipt(client, approvalHash, owner, token);
  const approvalTransaction = await client.getTransaction({ hash: approvalHash });
  const approvalCall = decodeFunctionData({ abi: parseAbi(['function approve(address spender,uint256 amount) returns (bool)']), data: approvalTransaction.input });
  assert(approvalTransaction.value === 0n && approvalCall.functionName === 'approve' && getAddress(approvalCall.args[0]) === escrow && approvalCall.args[1] === 5_000_000n, 'PRECEDING_APPROVAL_INPUT_DIFFERS_FROM_EXACT_BUDGET');
  proof.approval = { ...approvalReceipt.publicReceipt, exactBudgetAtomic: '5000000', exactApproveInputVerified: true };
  save('live-campaign-funding.public.json', proof); return proof;
}
async function verifyPayment(client, hash) {
  const baselineFile = join(root, 'contracts', 'deployment', 'live-participant-before.public.json');
  assert(existsSync(baselineFile), 'ACTUAL_PARTICIPANT_ZERO_BALANCE_BASELINE_REQUIRED');
  const baseline = JSON.parse(readFileSync(baselineFile, 'utf8'));
  assert(getAddress(baseline.participant) === participant && baseline.chainId === chainId && baseline.mon === '0' && baseline.usdc === '0' && baseline.zeroMonAndUsdcVerified, 'PARTICIPANT_BASELINE_IDENTITY_OR_ZERO_BALANCE_MISMATCH');
  const verified = await canonicalReceipt(client, hash, relayer, escrow), { receipt, block, publicReceipt } = verified;
  const transaction = await client.getTransaction({ hash });
  const decoded = decodeFunctionData({ abi: escrowAbi, data: transaction.input });
  assert(decoded.functionName === 'claim' && transaction.value === 0n, 'PAYOUT_IS_NOT_ZERO_VALUE_ESCROW_CLAIM');
  const [authorization, signature] = decoded.args;
  assert(authorization.campaignId === campaignId && getAddress(authorization.recipient) === participant && getAddress(authorization.token) === token && authorization.amount === 100_000n && authorization.slotIndex < 50n && authorization.rulesHash === rulesHash && authorization.qualifiedAt >= starts && authorization.qualifiedAt < ends && authorization.qualifiedAt <= block.timestamp && authorization.deadline <= deadline && authorization.deadline >= block.timestamp, 'PAYOUT_AUTHORIZATION_DIFFERS_FROM_REAL_DEMO_RULES');
  assert(await verifyTypedData({ address: signer, domain: { name: 'DROPRewardEscrow', version: '1', chainId, verifyingContract: escrow }, primaryType: 'RewardAuthorization', types: rewardTypes, message: authorization, signature }), 'PAYOUT_EIP712_SIGNATURE_FAILED_INDEPENDENT_VERIFICATION');
  const paid = eventLogs(receipt, escrow, escrowAbi).find(event => event.eventName === 'RewardPaid' && event.args.campaignId === campaignId && event.args.rewardId === authorization.rewardId);
  assert(paid && getAddress(paid.args.recipient) === participant && getAddress(paid.args.token) === token && paid.args.amount === 100_000n && paid.args.slotIndex === authorization.slotIndex && paid.args.participantNullifier === authorization.participantNullifier, 'EXPECTED_REAL_PARTICIPANT_REWARD_PAID_EVENT_MISSING');
  assert(eventLogs(receipt, token, tokenAbi).some(event => event.eventName === 'Transfer' && getAddress(event.args.from) === escrow && getAddress(event.args.to) === participant && event.args.value === 100_000n), 'EXPECTED_ESCROW_TO_PARTICIPANT_USDC_TRANSFER_MISSING');
  const [before, after, monBefore, monAfter, nonceAfter, claimed, state,
    stateBefore, escrowBefore, escrowAfter, liabilityBefore, liabilityAfter, relayerBefore, relayerAfter,
    globalRewardUsed, slotUsed, recipientUsed] = await Promise.all([
    client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [participant], blockNumber: receipt.blockNumber - 1n }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [participant], blockNumber: receipt.blockNumber }),
    client.getBalance({ address: participant, blockNumber: receipt.blockNumber - 1n }), client.getBalance({ address: participant, blockNumber: receipt.blockNumber }),
    client.getTransactionCount({ address: participant, blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi: escrowAbi, functionName: 'isRewardClaimed', args: [campaignId, authorization.rewardId], blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi: escrowAbi, functionName: 'getCampaign', args: [campaignId], blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi: escrowAbi, functionName: 'getCampaign', args: [campaignId], blockNumber: receipt.blockNumber - 1n }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [escrow], blockNumber: receipt.blockNumber - 1n }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [escrow], blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi: escrowAbi, functionName: 'totalLiability', blockNumber: receipt.blockNumber - 1n }),
    client.readContract({ address: escrow, abi: escrowAbi, functionName: 'totalLiability', blockNumber: receipt.blockNumber }),
    client.getBalance({ address: relayer, blockNumber: receipt.blockNumber - 1n }), client.getBalance({ address: relayer, blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi: escrowAbi, functionName: 'usedRewardId', args: [authorization.rewardId], blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi: escrowAbi, functionName: 'usedSlot', args: [campaignId, authorization.slotIndex], blockNumber: receipt.blockNumber }),
    client.readContract({ address: escrow, abi: escrowAbi, functionName: 'usedRecipient', args: [campaignId, participant], blockNumber: receipt.blockNumber }),
  ]);
  validateDemoCampaign(state); validateDemoCampaign(stateBefore);
  assert(before === 0n && after - before === 100_000n && monBefore === 0n && monAfter === 0n && nonceAfter === 0 && claimed, 'PARTICIPANT_PAYMENT_OR_ZERO_MON_GASLESS_RECEIVING_PROOF_FAILED');
  assert(escrowBefore - escrowAfter === 100_000n && liabilityBefore - liabilityAfter === 100_000n
    && state.paid - stateBefore.paid === 100_000n && state.refunded === stateBefore.refunded
    && state.claimedCount - stateBefore.claimedCount === 1n
    && relayerBefore - relayerAfter === receipt.gasUsed * receipt.effectiveGasPrice
    && globalRewardUsed && slotUsed && recipientUsed, 'PAYOUT_ACCOUNTING_OR_REPLAY_FLAG_PROOF_FAILED');
  const proof = { scope: 'Actual production game/receipt technical verification with two accounts controlled by the same human; no traction claim.', mode: 'read-only', chainId, campaignUuid: uuid, chainCampaignId: campaignId, escrow, participant, relayer, token, rewardId: authorization.rewardId, slotIndex: authorization.slotIndex.toString(), amountUsdc: '0.1', ...publicReceipt,
    independentEip712SignatureVerified: true, exactRewardPaidAndTokenTransferEventsVerified: true, claimedFlagVerified: true,
    participantBeforeUsdc: formatUnits(before, 6), participantAfterUsdc: formatUnits(after, 6), participantBeforeMon: '0', participantAfterMon: '0', participantNonceAfter: nonceAfter, zeroMonGaslessReceivingVerified: true,
    campaignPaidUsdc: formatUnits(state.paid, 6), campaignClaimedCount: state.claimedCount.toString(), baselineBlock: baseline.finalizedBlock,
    accounting: { escrowBeforeUsdc: formatUnits(escrowBefore, 6), escrowAfterUsdc: formatUnits(escrowAfter, 6),
      totalLiabilityBeforeUsdc: formatUnits(liabilityBefore, 6), totalLiabilityAfterUsdc: formatUnits(liabilityAfter, 6),
      campaignPaidBeforeUsdc: formatUnits(stateBefore.paid, 6), campaignPaidAfterUsdc: formatUnits(state.paid, 6), campaignRefundedUsdc: formatUnits(state.refunded, 6),
      claimCountBefore: stateBefore.claimedCount.toString(), claimCountAfter: state.claimedCount.toString(),
      relayerBeforeMon: formatEther(relayerBefore), relayerAfterMon: formatEther(relayerAfter),
      relayerPaidExactlyReceiptGasVerified: true, campaignAndEscrowLiabilityDeltasVerified: true,
      globalRewardIdSlotAndRecipientReplayFlagsVerified: true }, verifiedAtUtc: new Date().toISOString() };
  save('live-participant-payment.public.json', proof); return proof;
}
async function main() {
  const args = process.argv.slice(2);
  assert(args.length === 0 || (args.length === 2 && args[0] === '--payment-tx' && /^0x[0-9a-fA-F]{64}$/.test(args[1])), 'ONLY_READ_ONLY_PAYMENT_HASH_OPTION_IS_SUPPORTED');
  const client = createPublicClient({ transport: http(process.env.DROP_RPC_URL || 'https://testnet-rpc.monad.xyz', { timeout: 15_000, retryCount: 1 }) });
  assert(await client.getChainId() === chainId, 'RPC_IS_NOT_MONAD_TESTNET');
  console.log(JSON.stringify(await verifyFunding(client), null, 2));
  if (args.length) console.log(JSON.stringify(await verifyPayment(client, args[1]), null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(/^[A-Z][A-Z0-9_]+$/.test(error.message ?? '') ? error.message : 'READ_ONLY_LIVE_CAMPAIGN_PROOF_FAILED_CHECK_PUBLIC_RPC'); process.exitCode = 1; });
}
