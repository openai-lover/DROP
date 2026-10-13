import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { keccak256, serializeTransaction, toBytes } from "viem";
import type { Principal } from "../../src/server/auth";
import { database, read, type Award, type Campaign, type PayoutJob } from "../../src/server/db";
import { catchTarget, DEFAULT_CATCH } from "../../src/server/catch-engine";
import { createGameSession, creatorCampaign, importCoupons, listRewards, publicCampaign, publishCouponCampaign, revealCoupon, submitGameSession, verifyFunding, verifyRefund } from "../../src/server/api";
import { leaseNextJob, processJob, reconcileCampaign } from "../../src/server/worker";
import { proofJson } from "../../src/server/chain";
import { rateLimit } from "../../src/server/rate-limit";
const chainMocks = vi.hoisted(() => ({ claimed: vi.fn(), logs: vi.fn(), receipt: vi.fn(), prepare: vi.fn(), nonce: vi.fn(), broadcast: vi.fn(), head: vi.fn(), wait: vi.fn(), block: vi.fn(), rawReceipt: vi.fn() }));
vi.mock("../../src/server/chain", async original => {
  const actual = await original<typeof import("../../src/server/chain")>();
  const config = { chainId: 10143, escrow: "0x0000000000000000000000000000000000000022", usdc: "0x534b2f3a21130d7a60830c2df862319e593943a3", confirmations: 2 };
  const publicClient = { readContract: chainMocks.claimed, getContractEvents: chainMocks.logs, getTransactionCount: chainMocks.nonce, sendRawTransaction: chainMocks.broadcast, getBlockNumber: chainMocks.head, waitForTransactionReceipt: chainMocks.wait, getBlock: chainMocks.block, getTransactionReceipt: chainMocks.rawReceipt };
  return { ...actual, chainClients: () => ({ config, publicClient }), verifyChainConfiguration: async () => ({ config, publicClient }), receiptForReward: chainMocks.receipt, prepareClaim: chainMocks.prepare };
});
vi.mock("../../src/server/config", async original => { const actual = await original<typeof import("../../src/server/config")>(); return { ...actual, signingAccount: () => ({ address: "0x0000000000000000000000000000000000000033" }) }; });
const enabled = process.env.FIRESTORE_EMULATOR_HOST === "127.0.0.1:8089" && process.env.FIREBASE_PROJECT_ID === "demo-drop";
const userIds: string[] = [], campaignIds: string[] = [];
const col = (name: string) => database().collection(name);
async function user(): Promise<Principal> { const id = `it-${randomUUID()}`, p = { userId: id, privyId: `did:privy:${id}`, wallet: `0x${randomBytes(20).toString("hex")}` }; await col("users").doc(id).set(p); userIds.push(id); return p; }
async function campaign(owner: Principal, overrides: Partial<Campaign> = {}) { const id = `it-${randomUUID()}`; const c: Campaign = { id, chainCampaignId: keccak256(toBytes(id)), slug: id, ownerId: owner.userId, ownerWallet: owner.wallet!, title: "Integration fixture", organizer: "Test fixture", description: "Not a public event", gameType: "CATCH", rewardType: "COUPON_DEMO", rewardAmount: "1", maxRecipients: 1, reservedCount: 0, status: "DRAFT", startsAt: new Date(Date.now() - 60_000), endsAt: new Date(Date.now() + 120_000), claimDeadline: new Date(Date.now() + 240_000), maxAttempts: 1, configVersion: 1, gameConfig: DEFAULT_CATCH, rulesHash: keccak256(toBytes(`rules:${id}`)), chainId: 10143, signer: null, token: null, escrow: null, fundingTx: null, fundingBlock: null, refundTx: null, refundBlock: null, createdAt: new Date(), ...overrides }; await col("campaigns").doc(id).set(c); await col("campaignSlugs").doc(id).set({ campaignId: id }); campaignIds.push(id); return c; }
async function inventory(owner: Principal, c: Campaign) { await importCoupons(owner, c.id, { coupons: Array.from({ length: c.maxRecipients }, (_, i) => ({ reference: `test-${randomUUID()}-${i}`, merchant: "Test merchant", expiresAt: new Date(Date.now() + 86400_000).toISOString(), content: "Not redeemable integration content" })) }); await publishCouponCampaign(owner, c.id); }
async function attempt(p: Principal, slug: string) { const s = await createGameSession(p, slug); await col("gameSessions").doc(s.id).update({ startsAt: new Date(Date.now() - 5000) }); return { session: s, input: { nonce: s.nonce, events: [1000, 2000, 3000].map((at, target) => ({ at, target, ...catchTarget(s.seed, target, at) })) } }; }
async function queueUsdc() { const owner = await user(), participant = await user(), c = await campaign(owner, { rewardType: "USDC", rewardAmount: "1000000", status: "OPEN", escrow: "0x0000000000000000000000000000000000000022", token: "0x534b2f3a21130d7a60830c2df862319e593943a3", signer: "0x0000000000000000000000000000000000000033", fundingBlock: "1" }); const a = await attempt(participant, c.slug), outcome = await submitGameSession(participant, a.session.id, a.input); return { c, id: outcome.award!.id }; }
async function preparedFixture(expired = false) { const { c, id } = await queueUsdc(), a = (await read<Award>("awards", id))!; const proof = { campaignId: c.chainCampaignId as `0x${string}`, rewardId: a.rewardId as `0x${string}`, slotIndex: BigInt(a.slotIndex), recipient: a.recipient as `0x${string}`, token: c.token as `0x${string}`, amount: BigInt(a.amount), participantNullifier: a.participantNullifier as `0x${string}`, qualifiedAt: BigInt(Math.floor(a.qualifiedAt.getTime() / 1000)), deadline: BigInt(Math.floor(a.deadline.getTime() / 1000)), rulesHash: c.rulesHash as `0x${string}` }; await col("awards").doc(id).update({ proof: proofJson(proof), signature: `0x${"aa".repeat(65)}`, ...(expired ? { deadline: new Date(Date.now() - 1000) } : {}) }); await col("payoutJobs").doc(id).update({ serializedTx: "0x1234", txHash: `0x${"41".repeat(32)}`, txHistory: [`0x${"41".repeat(32)}`], nonce: 7, relayer: "0x0000000000000000000000000000000000000044", chainId: 10143, preparedAt: new Date() }); return { id, job: (await leaseNextJob(id))! }; }

describe.skipIf(!enabled)("real Firestore emulator domain integration (demo-drop only)", { timeout: 20_000 }, () => {
  beforeAll(() => { if (process.env.NODE_ENV !== "test" || !enabled) throw new Error("Tests require NODE_ENV=test, demo-drop and the loopback Firestore emulator."); process.env.PARTICIPANT_NULLIFIER_SECRET = "integration-only-nonproduction-secret-32chars"; process.env.COUPON_ENCRYPTION_KEY = "c3".repeat(32); });
  beforeEach(() => { vi.clearAllMocks(); chainMocks.claimed.mockResolvedValue(false); chainMocks.receipt.mockResolvedValue({ state: "pending" }); chainMocks.nonce.mockResolvedValue(7); chainMocks.head.mockResolvedValue(100n); chainMocks.block.mockResolvedValue({ number: 100n, hash: `0x${"55".repeat(32)}` }); chainMocks.broadcast.mockResolvedValue(`0x${"41".repeat(32)}`); chainMocks.wait.mockRejectedValue(new Error("adapter timeout")); });
  afterAll(async () => {
    for (const name of ["payoutJobs", "awards", "coupons", "qualifications", "gameSessions", "analyticsEvents", "auditLogs"]) { const rows = name === "payoutJobs" ? await col(name).get() : await col(name).where("campaignId", "in", campaignIds.slice(0, 30)).get(); const batch = database().batch(); for (const doc of rows.docs) { if (name !== "payoutJobs" || (await read<Award>("awards", doc.id))?.campaignId && campaignIds.includes((await read<Award>("awards", doc.id))!.campaignId)) batch.delete(doc.ref); } if (!rows.empty) await batch.commit(); }
    for (const id of campaignIds) { await database().recursiveDelete(col("campaigns").doc(id)); await col("campaignSlugs").doc(id).delete(); await col("campaignSecrets").doc(id).delete(); }
    for (const id of userIds) await col("users").doc(id).delete();
  });
  it("checks tenant ownership for private campaign details", async () => { const owner = await user(), attacker = await user(), c = await campaign(owner); await expect(creatorCampaign(attacker, c.id)).rejects.toMatchObject({ status: 404 }); });
  it("never exposes quiz answers through public metadata or sessions", async () => { const owner = await user(), participant = await user(), questions = Array.from({ length: 3 }, (_, i) => ({ prompt: `Question ${i}`, options: ["A", "B"], correctIndex: 1, explanation: "Private explanation" })); const c = await campaign(owner, { gameType: "QUIZ", gameConfig: { questions: questions.map(({ prompt, options }) => ({ prompt, options })), passScore: 3 } }); await col("campaignSecrets").doc(c.id).set({ questions, passScore: 3, commitmentSalt: "private test salt" }); await inventory(owner, c); expect(JSON.stringify(await publicCampaign(c.slug)) + JSON.stringify(await createGameSession(participant, c.slug))).not.toMatch(/correctIndex|Private explanation|commitmentSalt/); });
  it("atomically assigns the final slot, a single coupon and one outbox under contention", async () => { const owner = await user(), first = await user(), second = await user(), c = await campaign(owner); await inventory(owner, c); const a = await attempt(first, c.slug), b = await attempt(second, c.slug); const outcomes = await Promise.all([submitGameSession(first, a.session.id, a.input), submitGameSession(second, b.session.id, b.input)]); expect(outcomes.map(r => r.outcome).sort()).toEqual(["QUEUED", "SOLD_OUT"]); expect((await col("awards").where("campaignId", "==", c.id).get()).size).toBe(1); expect((await col("coupons").where("campaignId", "==", c.id).where("status", "==", "RESERVED").get()).size).toBe(1); expect((await read<Campaign>("campaigns", c.id))!.reservedCount).toBe(1); const awardId = outcomes.find(o => o.award)?.award!.id; expect(await read<PayoutJob>("payoutJobs", awardId!)).not.toBeNull(); await expect(submitGameSession(first, a.session.id, a.input)).rejects.toMatchObject({ code: "SESSION_ALREADY_USED" }); });
  it("recovers a stopped worker's lease and enforces winner-only coupon access", async () => { const owner = await user(), participant = await user(), attacker = await user(), c = await campaign(owner); await inventory(owner, c); const a = await attempt(participant, c.slug), result = await submitGameSession(participant, a.session.id, a.input), id = result.award!.id; const interrupted = (await leaseNextJob(id))!; await col("payoutJobs").doc(id).update({ leasedUntil: new Date(Date.now() - 1000) }); const resumed = (await leaseNextJob(id))!; expect(resumed.leaseOwner).not.toBe(interrupted.leaseOwner); await processJob(resumed); await processJob(interrupted); expect((await listRewards(participant))[0].status).toBe("DELIVERED"); await expect(revealCoupon(attacker, id)).rejects.toMatchObject({ status: 404 }); expect((await revealCoupon(participant, id)).content).toContain("TEST COUPON — NOT REDEEMABLE"); });
  it("blocks duplicate account and wallet rewards", async () => { const owner = await user(), first = await user(), second = await user(), c = await campaign(owner, { maxRecipients: 2, maxAttempts: 2 }); await inventory(owner, c); const a = await attempt(first, c.slug); await submitGameSession(first, a.session.id, a.input); await expect(createGameSession(first, c.slug)).rejects.toMatchObject({ code: "ALREADY_REWARDED" }); await expect(createGameSession({ ...second, wallet: first.wallet }, c.slug)).rejects.toMatchObject({ code: "ALREADY_REWARDED" }); });
  it("grades private quiz answers on the server without sending an answer key", async () => { const owner = await user(), participant = await user(), questions = Array.from({ length: 3 }, (_, i) => ({ prompt: `Question ${i}`, options: ["Wrong", "Correct"], correctIndex: 1 })), c = await campaign(owner, { gameType: "QUIZ", maxAttempts: 2, gameConfig: { questions: questions.map(({ prompt, options }) => ({ prompt, options })), passScore: 3 } }); await col("campaignSecrets").doc(c.id).set({ questions, passScore: 3, commitmentSalt: "private test salt" }); await inventory(owner, c); const wrong = await createGameSession(participant, c.slug); await col("gameSessions").doc(wrong.id).update({ startsAt: new Date(Date.now() - 5000) }); const failure = await submitGameSession(participant, wrong.id, { nonce: wrong.nonce, answers: [0, 0, 0] }); expect(failure.outcome).toBe("NOT_QUALIFIED"); const valid = await createGameSession(participant, c.slug); await col("gameSessions").doc(valid.id).update({ startsAt: new Date(Date.now() - 5000) }); const passed = await submitGameSession(participant, valid.id, { nonce: valid.nonce, answers: [1, 1, 1] }); expect(passed.outcome).toBe("QUEUED"); expect(JSON.stringify(failure) + JSON.stringify(passed)).not.toMatch(/correctIndex|commitmentSalt/); });
  it("recovers an already-mined reward without issuing another signed transaction", async () => { const { id } = await queueUsdc(); const hash = `0x${"42".repeat(32)}` as const; chainMocks.claimed.mockResolvedValue(true); chainMocks.logs.mockResolvedValue([{ transactionHash: hash }]); chainMocks.receipt.mockResolvedValue({ state: "confirmed", receipt: { blockNumber: 42n } }); await processJob((await leaseNextJob(id))!); expect((await read<Award>("awards", id))!.status).toBe("CONFIRMED"); expect(chainMocks.prepare).not.toHaveBeenCalled(); expect(chainMocks.broadcast).not.toHaveBeenCalled(); });
  it("drains a durably prepared nonce even after its reward deadline expires", async () => { const { id, job } = await preparedFixture(true); await processJob(job); expect(chainMocks.broadcast).toHaveBeenCalledWith({ serializedTransaction: "0x1234" }); expect((await read<PayoutJob>("payoutJobs", id))!.completedAt).toBeNull(); chainMocks.receipt.mockResolvedValue({ state: "reverted", receipt: { blockNumber: 45n } }); await col("payoutJobs").doc(id).update({ availableAt: new Date() }); await processJob((await leaseNextJob(id))!); expect((await read<PayoutJob>("payoutJobs", id))!.completedAt).not.toBeNull(); expect((await read<Award>("awards", id))!.status).toBe("EXPIRED"); });
  it("fences an old worker after broadcast so a confirmed award cannot regress", async () => { const { id, job } = await preparedFixture(); chainMocks.broadcast.mockImplementationOnce(async () => { const batch = database().batch(); batch.update(col("payoutJobs").doc(id), { leaseOwner: "new-owner", completedAt: new Date() }); batch.update(col("awards").doc(id), { status: "CONFIRMED", confirmedAt: new Date() }); await batch.commit(); return `0x${"41".repeat(32)}`; }); await processJob(job); expect((await read<Award>("awards", id))!.status).toBe("CONFIRMED"); });
  it("confirms an available receipt within the worker's bounded fast path", async () => { const { id, job } = await preparedFixture(); chainMocks.wait.mockImplementationOnce(async () => { chainMocks.receipt.mockResolvedValue({ state: "confirmed", receipt: { blockNumber: 101n } }); return { status: "success" }; }); await processJob(job); expect(chainMocks.wait).toHaveBeenCalledWith(expect.objectContaining({ timeout: 15_000, confirmations: 2 })); expect((await read<Award>("awards", id))!.status).toBe("CONFIRMED"); expect((await read<PayoutJob>("payoutJobs", id))!.completedAt).not.toBeNull(); });
  it("checks known payment receipts before performing any historical log scan", async () => {
    const { id, job } = await preparedFixture();
    chainMocks.receipt.mockResolvedValue({ state: "confirmed", receipt: { blockNumber: 42n } });
    chainMocks.nonce.mockResolvedValue(8);
    await processJob(job);
    expect((await read<Award>("awards", id))!.status).toBe("CONFIRMED");
    expect(chainMocks.claimed).not.toHaveBeenCalled();
    expect(chainMocks.logs).not.toHaveBeenCalled();
    expect(chainMocks.broadcast).not.toHaveBeenCalled();
  });
  it("persists bounded log pages and resumes manual settlement recovery after a process restart", async () => {
    const { id } = await queueUsdc();
    chainMocks.claimed.mockResolvedValue(true);
    chainMocks.block.mockResolvedValue({ number: 1000n, hash: `0x${"55".repeat(32)}` });
    chainMocks.logs.mockResolvedValue([]);
    await processJob((await leaseNextJob(id))!);
    expect(chainMocks.logs).toHaveBeenCalledTimes(3);
    for (const [request] of chainMocks.logs.mock.calls) expect(BigInt(request.toBlock) - BigInt(request.fromBlock) + 1n).toBeLessThanOrEqual(100n);
    const interrupted = await read<PayoutJob & { recoveryCursor: string }>("payoutJobs", id);
    expect(interrupted!.recoveryCursor).toBe("700");
    expect(interrupted!.completedAt).toBeNull();
    chainMocks.logs.mockClear();
    const hash = `0x${"77".repeat(32)}` as const;
    chainMocks.logs.mockResolvedValue([{ transactionHash: hash }]);
    chainMocks.receipt.mockResolvedValue({ state: "confirmed", receipt: { blockNumber: 650n } });
    await col("payoutJobs").doc(id).update({ availableAt: new Date() });
    await processJob((await leaseNextJob(id))!);
    expect(chainMocks.logs).toHaveBeenCalledWith(expect.objectContaining({ fromBlock: 601n, toBlock: 700n }));
    expect((await read<Award>("awards", id))!.txHash).toBe(hash);
    expect((await read<PayoutJob>("payoutJobs", id))!.completedAt).not.toBeNull();
  });
  it("requires finalized nonce consumption before completing an expired prepared payment", async () => {
    const { id, job } = await preparedFixture(true);
    chainMocks.head.mockResolvedValue(5000n);
    chainMocks.nonce.mockResolvedValue(8);
    await processJob(job);
    expect(chainMocks.nonce).toHaveBeenCalledWith(expect.objectContaining({ blockNumber: 99n }));
    expect(chainMocks.head).not.toHaveBeenCalled();
    expect((await read<Award>("awards", id))!.status).toBe("EXPIRED");
    expect(chainMocks.broadcast).not.toHaveBeenCalled();
  });
  it("does not publish a campaign from a provisional funding receipt", async () => {
    const owner = await user(), c = await campaign(owner, { rewardType: "USDC", rewardAmount: "1000000", escrow: "0x0000000000000000000000000000000000000022", token: "0x534b2f3a21130d7a60830c2df862319e593943a3", signer: "0x0000000000000000000000000000000000000033" });
    chainMocks.rawReceipt.mockResolvedValue({ blockNumber: 101n, blockHash: `0x${"66".repeat(32)}`, status: "success", from: c.ownerWallet, to: c.escrow, logs: [] });
    await expect(verifyFunding(owner, c.id, `0x${"88".repeat(32)}`)).rejects.toMatchObject({ code: "FUNDING_NOT_CONFIRMED" });
    expect((await read<Campaign>("campaigns", c.id))!.status).toBe("DRAFT");
  });
  it("does not record a provisional refund as finalized recovery", async () => {
    const owner = await user(), c = await campaign(owner, { rewardType: "USDC", rewardAmount: "1000000", status: "OPEN", escrow: "0x0000000000000000000000000000000000000022", token: "0x534b2f3a21130d7a60830c2df862319e593943a3" });
    chainMocks.rawReceipt.mockResolvedValue({ blockNumber: 101n, blockHash: `0x${"66".repeat(32)}`, status: "success", from: c.ownerWallet, to: c.escrow, logs: [] });
    await expect(verifyRefund(owner, c.id, `0x${"89".repeat(32)}`)).rejects.toMatchObject({ code: "REFUND_NOT_CONFIRMED" });
    expect((await read<Campaign>("campaigns", c.id))!.status).toBe("OPEN");
  });
  it("reopens an expired completed job when reconciliation finds a finalized direct payment", async () => {
    const { c, id } = await queueUsdc();
    await col("campaigns").doc(c.id).update({ fundingTx: `0x${"92".repeat(32)}` });
    await col("awards").doc(id).update({ status: "EXPIRED", deadline: new Date(Date.now() - 1000) });
    await col("payoutJobs").doc(id).update({ completedAt: new Date() });
    chainMocks.claimed.mockImplementation(async request => request.functionName === "getCampaign" ? { deposited: 1_000_000n, paid: 1_000_000n, refunded: 0n } : true);
    expect(await reconcileCampaign(c.id)).toMatchObject({ mismatch: true });
    expect((await read<PayoutJob>("payoutJobs", id))!.completedAt).toBeNull();
    const hash = `0x${"93".repeat(32)}` as const;
    chainMocks.logs.mockResolvedValue([{ transactionHash: hash }]);
    chainMocks.receipt.mockResolvedValue({ state: "confirmed", receipt: { blockNumber: 50n } });
    await processJob((await leaseNextJob(id))!);
    expect((await read<Award>("awards", id))!.status).toBe("CONFIRMED");
    expect((await read<Award>("awards", id))!.txHash).toBe(hash);
    expect(chainMocks.broadcast).not.toHaveBeenCalled();
  });
  it("recovers an older replacement receipt instead of waiting on the newest hash", async () => {
    const { id, job } = await preparedFixture();
    const oldHash = `0x${"94".repeat(32)}` as const;
    await col("payoutJobs").doc(id).update({ txHistory: [oldHash, job.txHash] });
    chainMocks.receipt.mockImplementation(async hash => hash === oldHash ? { state: "confirmed", receipt: { blockNumber: 45n } } : { state: "pending" });
    chainMocks.nonce.mockResolvedValue(8);
    await col("payoutJobs").doc(id).update({ leasedUntil: new Date(Date.now() - 1000) });
    await processJob((await leaseNextJob(id))!);
    expect((await read<Award>("awards", id))!.txHash).toBe(oldHash);
    expect((await read<Award>("awards", id))!.status).toBe("CONFIRMED");
    expect(chainMocks.logs).not.toHaveBeenCalled();
    expect(chainMocks.broadcast).not.toHaveBeenCalled();
  });
  it("rebroadcasts the persisted allowed transaction when a fee bump exceeds the budget cap", async () => {
    const { id, job } = await preparedFixture();
    const bytes = serializeTransaction({ type: "eip1559", chainId: 10143, nonce: 7, to: "0x0000000000000000000000000000000000000022", gas: 300_000n, maxFeePerGas: 450_000_000_000n, maxPriorityFeePerGas: 2_000_000_000n, value: 0n, data: "0x" });
    await col("payoutJobs").doc(id).update({ serializedTx: bytes, preparedAt: new Date(Date.now() - 70_000), maxFeePerGas: "450000000000", maxPriorityFeePerGas: "2000000000", leasedUntil: new Date(Date.now() - 1000) });
    chainMocks.prepare.mockResolvedValue({ serializedTx: "0xdead", txHash: `0x${"95".repeat(32)}`, nonce: 7, chainId: 10143, relayer: job.relayer, gas: "300000", maxFeePerGas: "562500000001", maxPriorityFeePerGas: "2500000001" });
    await processJob((await leaseNextJob(id))!);
    expect(chainMocks.broadcast).toHaveBeenCalledWith({ serializedTransaction: bytes });
    expect((await read<PayoutJob>("payoutJobs", id))!.serializedTx).toBe(bytes);
    expect((await read<PayoutJob>("payoutJobs", id))!.txHash).toBe(job.txHash);
  });
  it("does not rebroadcast an original transaction above the current total MON budget", async () => {
    const { id } = await preparedFixture();
    const bytes = serializeTransaction({ type: "eip1559", chainId: 10143, nonce: 7, to: "0x0000000000000000000000000000000000000022", gas: 1_000_000n, maxFeePerGas: 450_000_000_000n, maxPriorityFeePerGas: 2_000_000_000n, value: 0n, data: "0x" });
    await col("payoutJobs").doc(id).update({ serializedTx: bytes, preparedAt: new Date(Date.now() - 70_000), maxFeePerGas: "450000000000", leasedUntil: new Date(Date.now() - 1000) });
    await processJob((await leaseNextJob(id))!);
    expect(chainMocks.broadcast).not.toHaveBeenCalled();
    expect((await read<PayoutJob>("payoutJobs", id))!.lastError).toBe("RELAYER_TRANSACTION_BUDGET");
    expect((await read<PayoutJob>("payoutJobs", id))!.completedAt).toBeNull();
  });
  it("shares persistent rate limits across requests", async () => { const identity = `it-rate-${randomUUID()}`; await rateLimit(identity, "integration", 2, 60); await rateLimit(identity, "integration", 2, 60); await expect(rateLimit(identity, "integration", 2, 60)).rejects.toMatchObject({ code: "RATE_LIMITED", status: 429 }); });
});
