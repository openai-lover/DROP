import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { createPublicClient, createWalletClient, createTestClient, defineChain, http, keccak256, toBytes, type Address, type Hex, type Abi } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import type { Principal } from '../../src/server/auth';
import { database, read, type Campaign, type Award, type PayoutJob } from '../../src/server/db';
import { createGameSession, getFundingPlan, listRewards, queueReward, submitGameSession, verifyFunding, verifyRefund } from '../../src/server/api';
import { DEFAULT_CATCH, catchTarget } from '../../src/server/catch-engine';
import { escrowAbi } from '../../src/server/chain';
import { leaseNextJob, processJob, reconcileCampaign } from '../../src/server/worker';

// Only network/account configuration is substituted. The actual viem RPC clients,
// receipt validation, escrow bytecode, API allocation and payout worker all execute.
const fixture = vi.hoisted(() => ({ token: '' as Address, escrow: '' as Address }));
vi.mock('../../src/server/config', async original => {
  const actual = await original<typeof import('../../src/server/config')>();
  const { mnemonicToAccount: account } = await import('viem/accounts');
  const mnemonic = 'test test test test test test test test test test test junk';
  return { ...actual,
    chainConfig: () => ({ chainId: 31337, name: 'Isolated local Anvil fixture', rpc: 'http://127.0.0.1:18547', usdc: fixture.token, escrow: fixture.escrow, explorer: '', testnet: true, confirmations: 2 }),
    signingAccount: () => account(mnemonic, { addressIndex: 1 }),
    relayerAccount: () => account(mnemonic, { addressIndex: 2 }),
  };
});

const rpc = 'http://127.0.0.1:18547';
const chain = defineChain({ id: 31337, name: 'Local fixture', nativeCurrency: { name: 'Local MON', symbol: 'MON', decimals: 18 }, rpcUrls: { default: { http: [rpc] } } });
const mnemonic = 'test test test test test test test test test test test junk';
const creator = mnemonicToAccount(mnemonic, { addressIndex: 0 });
const signer = mnemonicToAccount(mnemonic, { addressIndex: 1 });
const relayer = mnemonicToAccount(mnemonic, { addressIndex: 2 });
const publicClient = createPublicClient({ chain, transport: http(rpc), pollingInterval: 250 });
const creatorClient = createWalletClient({ chain, account: creator, transport: http(rpc) });
const control = createTestClient({ chain, mode: 'anvil', transport: http(rpc) });
const campaigns: Campaign[] = [];
const participants: Principal[] = [];
const evidence: Record<string, unknown> = { scope: 'Real local Anvil RPC and isolated Firestore emulator; no public chain or cloud deployment', chainId: 31337, networkFamily: 'monad', mockToken: true, rpc, projectId: process.env.FIREBASE_PROJECT_ID, recordedAtUtc: new Date().toISOString() };
let tokenAbi: Abi;
let owner: Principal;

function assertIsolation() {
  if (process.env.NODE_ENV !== 'test' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8089' || !/^demo-drop-local-chain-[a-f0-9]{8}$/.test(process.env.FIREBASE_PROJECT_ID ?? '') || process.env.DROP_LOCAL_CHAIN_RPC !== rpc) throw new Error('This test only runs through the isolated local-chain runner.');
}
function artifact(path: string): { abi: Abi; bytecode: { object: Hex } } { return JSON.parse(readFileSync(path, 'utf8')); }
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
async function principal(index: number): Promise<Principal> {
  const userId = `local-chain-${process.env.DROP_LOCAL_CHAIN_RUN_ID}-${index}`;
  const p = { userId, privyId: `fixture:${userId}`, wallet: mnemonicToAccount(mnemonic, { addressIndex: index }).address.toLowerCase() };
  await database().collection('users').doc(userId).set({ ...p, fixture: true, createdAt: new Date() });
  participants.push(p); return p;
}
async function confirmed(hash: Hex) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 2, pollingInterval: 250, timeout: 20_000 });
  // Anvil's finalized epoch trails latest. Wait on its real finalized header too;
  // observing a mined transaction alone must not weaken the production gate.
  for (let attempt = 0; attempt < 40; attempt++) {
    const finalized = await publicClient.getBlock({ blockTag: 'finalized' });
    if (finalized.number !== null && finalized.number >= receipt.blockNumber + 1n) return receipt;
    await wait(250);
  }
  throw new Error('The local node did not finalize the receipt at the required depth.');
}
async function campaign(name: string, slots: number, startsAt: Date, deadline?: Date): Promise<Campaign> {
  const id = `local-chain-${process.env.DROP_LOCAL_CHAIN_RUN_ID}-${name}`;
  const c: Campaign = { id, chainCampaignId: keccak256(toBytes(id)), slug: id, ownerId: owner.userId, ownerWallet: owner.wallet!, title: 'Local QA fixture', organizer: 'Local verification', description: 'Not a public event or real customer data', gameType: 'CATCH', rewardType: 'USDC', rewardAmount: '1000000', maxRecipients: slots, reservedCount: 0, status: 'DRAFT', startsAt, endsAt: new Date(startsAt.getTime() + 120_000), claimDeadline: deadline ?? new Date(startsAt.getTime() + 240_000), maxAttempts: 1, configVersion: 1, gameConfig: DEFAULT_CATCH, rulesHash: keccak256(toBytes(`immutable local rules:${id}`)), signer: signer.address.toLowerCase(), chainId: 31337, token: fixture.token.toLowerCase(), escrow: fixture.escrow.toLowerCase(), fundingTx: null, fundingBlock: null, refundTx: null, refundBlock: null, createdAt: new Date() };
  await database().collection('campaigns').doc(id).set({ ...c, fixture: true });
  await database().collection('campaignSlugs').doc(id).set({ campaignId: id });
  campaigns.push(c);
  const plan = await getFundingPlan(owner, id);
  for (const transaction of plan.transactions) {
    const hash = await creatorClient.sendTransaction({ to: transaction.to, data: transaction.data as Hex, value: BigInt(transaction.value) });
    await confirmed(hash);
    if (transaction.to.toLowerCase() === fixture.escrow.toLowerCase()) {
      await verifyFunding(owner, id, hash);
      evidence[`${name}FundingTx`] = hash;
    }
  }
  return c;
}
async function processUntilComplete(id: string) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const job = await read<PayoutJob>('payoutJobs', id);
    if (job?.completedAt) return;
    await database().collection('payoutJobs').doc(id).update({ availableAt: new Date() });
    const leased = await leaseNextJob(id);
    if (leased) await processJob(leased);
    await wait(500);
  }
  throw new Error(`Local payout did not complete: ${(await read<PayoutJob>('payoutJobs', id))?.lastError}`);
}

beforeAll(async () => {
  assertIsolation();
  expect(await publicClient.getChainId()).toBe(31337);
  expect(signer.address).not.toBe(relayer.address);
  process.env.PARTICIPANT_NULLIFIER_SECRET = 'local-chain-only-fixture-privacy-secret-32-chars';
  const mock = artifact('contracts/out/TestSupport.sol/MockUSDC.json'), escrow = artifact('contracts/out/DROPRewardEscrow.sol/DROPRewardEscrow.json');
  tokenAbi = mock.abi;
  const tokenDeployment = await creatorClient.deployContract({ abi: mock.abi, bytecode: mock.bytecode.object });
  const tokenReceipt = await confirmed(tokenDeployment);
  fixture.token = tokenReceipt.contractAddress!;
  const escrowDeployment = await creatorClient.deployContract({ abi: escrow.abi, bytecode: escrow.bytecode.object, args: [fixture.token, 31337n] });
  const escrowReceipt = await confirmed(escrowDeployment);
  fixture.escrow = escrowReceipt.contractAddress!;
  await confirmed(await creatorClient.writeContract({ address: fixture.token, abi: tokenAbi, functionName: 'mint', args: [creator.address, 10_000_000n] }));
  owner = await principal(0);
  evidence.tokenAddress = fixture.token; evidence.escrowAddress = fixture.escrow;
  evidence.tokenDeploymentTx = tokenDeployment; evidence.escrowDeploymentTx = escrowDeployment;
  evidence.escrowSourceSha256 = createHash('sha256').update(readFileSync('contracts/src/DROPRewardEscrow.sol')).digest('hex');
});

afterAll(async () => {
  assertIsolation();
  for (const c of campaigns) {
    for (const name of ['payoutJobs', 'awards', 'gameSessions', 'qualifications', 'analyticsEvents', 'auditLogs']) {
      const rows = name === 'payoutJobs' ? await database().collection('awards').where('campaignId', '==', c.id).get() : await database().collection(name).where('campaignId', '==', c.id).get();
      const batch = database().batch();
      for (const row of rows.docs) batch.delete(name === 'payoutJobs' ? database().collection(name).doc(row.id) : row.ref);
      if (!rows.empty) await batch.commit();
    }
    await database().recursiveDelete(database().collection('campaigns').doc(c.id));
    await database().collection('campaignSlugs').doc(c.slug).delete();
  }
  for (const p of participants) await database().collection('users').doc(p.userId).delete();
  await database().collection('relayerNonces').doc(`31337-${relayer.address.toLowerCase()}`).delete();
});

describe('real local escrow + actual durable payout worker', () => {
  it('funds immutable budgets, allocates FIRST_N under contention, pays and recovers without double settlement', async () => {
    const start = new Date(Math.ceil(Date.now() / 1000) * 1000 + 15_000);
    const c = await campaign('first-n', 2, start);
    // A separate funded fixture leaves a budget to recover after the local deadline.
    await campaign('refund', 2, new Date(start.getTime() + 60_000));
    const remainingWait = start.getTime() - Date.now(); if (remainingWait > 0) await wait(remainingWait + 200);
    const entrants = await Promise.all([principal(4), principal(5), principal(6)]);
    const sessions = await Promise.all(entrants.map(p => createGameSession(p, c.slug)));
    await wait(2300);
    const results = await Promise.all(sessions.map((session, i) => submitGameSession(entrants[i], session.id, { nonce: session.nonce, events: [1000, 1400, 1800].map((at, target) => ({ at, target, ...catchTarget(session.seed, target, at) })) })));
    expect(results.map(result => result.outcome).sort()).toEqual(['QUEUED', 'QUEUED', 'SOLD_OUT']);
    expect((await read<Campaign>('campaigns', c.id))!.reservedCount).toBe(2);
    const winners = results.flatMap((result, index) => result.award ? [{ id: result.award.id, principal: entrants[index] }] : []);
    const interrupted = (await leaseNextJob(winners[0].id))!;
    await database().collection('payoutJobs').doc(interrupted.id).update({ leasedUntil: new Date(Date.now() - 1000) });
    const recovered = (await leaseNextJob(interrupted.id))!;
    expect(recovered.leaseOwner).not.toBe(interrupted.leaseOwner);
    // Stop mining while the actual worker signs, persists and broadcasts. Its
    // bounded receipt wait times out, leaving a real durable submitted job.
    await control.setIntervalMining({ interval: 0 });
    await control.setAutomine(false);
    try { await processJob(recovered); }
    finally { await control.setAutomine(true); await control.mine({ blocks: 4 }); await control.setIntervalMining({ interval: 1 }); }
    const submitted = (await read<PayoutJob>('payoutJobs', winners[0].id))!;
    expect(submitted.serializedTx).toMatch(/^0x[0-9a-f]+$/);
    expect(keccak256(submitted.serializedTx as Hex)).toBe(submitted.txHash);
    expect(submitted.completedAt).toBeNull();
    expect((await read<Award>('awards', winners[0].id))!.status).toBe('SUBMITTED');
    const consumedNonce = await publicClient.getTransactionCount({ address: relayer.address });
    await processJob(interrupted);
    await processUntilComplete(winners[0].id);
    expect(await publicClient.getTransactionCount({ address: relayer.address })).toBe(consumedNonce);
    expect((await read<Award>('awards', winners[0].id))!.txHash).toBe(submitted.txHash);
    for (const winner of winners.slice(1)) await processUntilComplete(winner.id);
    const awards = await Promise.all(winners.map(winner => read<Award>('awards', winner.id)));
    for (let index = 0; index < winners.length; index++) {
      const award = awards[index]!;
      expect(award.status).toBe('CONFIRMED');
      expect(award.txHash).toMatch(/^0x[0-9a-f]{64}$/);
      const amount = await publicClient.readContract({ address: fixture.token, abi: tokenAbi, functionName: 'balanceOf', args: [winners[index].principal.wallet] });
      expect(amount).toBe(1_000_000n);
      expect((await listRewards(winners[index].principal))[0].txHash).toBe(award.txHash);
      await queueReward(winners[index].principal, winners[index].id);
      expect(await leaseNextJob(winners[index].id)).toBeNull();
      const hash = award.txHash as Hex;
      const receipt = await publicClient.getTransactionReceipt({ hash });
      const finalized = await publicClient.getBlock({ blockTag: 'finalized' });
      expect(finalized.number!).toBeGreaterThanOrEqual(receipt.blockNumber);
    }
    const paid = await publicClient.getContractEvents({ address: fixture.escrow, abi: escrowAbi, eventName: 'RewardPaid', args: { campaignId: c.chainCampaignId as Hex }, fromBlock: 0n, toBlock: 'latest' });
    expect(paid).toHaveLength(2);
    expect(new Set(paid.map(event => event.args.rewardId)).size).toBe(2);
    expect(await reconcileCampaign(c.id)).toMatchObject({ paidAtomic: '2000000', confirmedDatabaseAtomic: '2000000', mismatch: false });
    evidence.firstN = { qualified: 2, soldOut: 1, rewardIds: awards.map(a => a!.rewardId), paymentTxs: awards.map(a => a!.txHash), paidEvents: paid.length, recipientBalancesAtomic: ['1000000', '1000000'], restartLeaseRecovered: true, minedTransactionRecoveredFromDurableBytes: true, recoveryAddedRelayerTransactions: 0, repeatedRetryAddedPayments: 0 };
  });
  it('rejects early recovery and refunds only the remaining local campaign budget', async () => {
    const c = campaigns.find(campaign => campaign.id.endsWith('-refund'))!;
    await expect(creatorClient.writeContract({ address: fixture.escrow, abi: escrowAbi, functionName: 'refund', args: [c.chainCampaignId as Hex] })).rejects.toThrow();
    const before = await publicClient.readContract({ address: fixture.token, abi: tokenAbi, functionName: 'balanceOf', args: [creator.address] });
    // Explicit local test time advancement, never a production/demo expiry shortcut.
    await control.setNextBlockTimestamp({ timestamp: BigInt(Math.floor(c.claimDeadline.getTime() / 1000)) + 1n });
    await control.mine({ blocks: 1 });
    const hash = await creatorClient.writeContract({ address: fixture.escrow, abi: escrowAbi, functionName: 'refund', args: [c.chainCampaignId as Hex] });
    await confirmed(hash);
    await verifyRefund(owner, c.id, hash);
    const after = await publicClient.readContract({ address: fixture.token, abi: tokenAbi, functionName: 'balanceOf', args: [creator.address] });
    expect(BigInt(after as bigint) - BigInt(before as bigint)).toBe(2_000_000n);
    expect((await read<Campaign>('campaigns', c.id))!.status).toBe('REFUNDED');
    expect(await reconcileCampaign(c.id)).toMatchObject({ depositedAtomic: '2000000', refundedAtomic: '2000000', onchainRemainingAtomic: '0', invariantHolds: true, mismatch: false });
    expect(await publicClient.readContract({ address: fixture.token, abi: tokenAbi, functionName: 'balanceOf', args: [fixture.escrow] })).toBe(0n);
    evidence.refund = { txHash: hash, amountAtomic: '2000000', earlyRefundRejected: true, localTimeAdvance: true };
    evidence.completed = true;
    mkdirSync('.local', { recursive: true });
    writeFileSync('.local/local-chain-verification.json', JSON.stringify(evidence, null, 2));
  });
});
