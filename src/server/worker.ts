import { randomUUID } from "node:crypto";
import { parseTransaction, parseUnits, type Hex } from "viem";
import { type Transaction } from "firebase-admin/firestore";
import { chainClients, escrowAbi, finalizedBlock, prepareClaim, proofFromJson, proofJson, receiptForReward, signAuthorization, verifyChainConfiguration, type RewardAuthorization } from "./chain";
import { relayerAccount, signingAccount } from "./config";
import { database, read, record, type Award, type Campaign, type Coupon, type PayoutJob } from "./db";
import { DomainError } from "./errors";
const LEASE_MS = 120_000;
type RecoverableJob = PayoutJob & { recoveryCursor?: string; settlementTxHash?: string };
export type LeasedJob = RecoverableJob & { award: Award & { campaign: Campaign } };
const col = (name: string) => database().collection(name);
const terminal = (a: Award) => a.status === "CONFIRMED" || a.status === "DELIVERED";
const validLease = (current: PayoutJob, expected: LeasedJob) => !current.completedAt && current.leaseOwner === expected.leaseOwner && current.leasedUntil !== null && current.leasedUntil.getTime() > Date.now();
function proofFor(a: Award, c: Campaign): RewardAuthorization { return { campaignId: c.chainCampaignId as Hex, rewardId: a.rewardId as Hex, slotIndex: BigInt(a.slotIndex), recipient: a.recipient as `0x${string}`, token: c.token as `0x${string}`, amount: BigInt(a.amount), participantNullifier: a.participantNullifier as Hex, qualifiedAt: BigInt(Math.floor(a.qualifiedAt.getTime() / 1000)), deadline: BigInt(Math.floor(a.deadline.getTime() / 1000)), rulesHash: c.rulesHash as Hex }; }
async function leasedRecords(tx: Transaction, job: LeasedJob) { const [j, a] = await tx.getAll(col("payoutJobs").doc(job.id), col("awards").doc(job.awardId)); const current = record<RecoverableJob>(j), award = record<Award>(a); if (!current || !award || !validLease(current, job)) throw new DomainError("LEASE_LOST", "Worker lease changed.", 409); return { current, award }; }
async function assertLease(job: LeasedJob) { const current = await read<PayoutJob>("payoutJobs", job.id); if (!current || !validLease(current, job)) throw new DomainError("LEASE_LOST", "Worker lease changed.", 409); }

export async function leaseNextJob(onlyId?: string): Promise<LeasedJob | null> {
  const candidates = onlyId ? [col("payoutJobs").doc(onlyId)] : (await col("payoutJobs").where("completedAt", "==", null).where("availableAt", "<=", new Date()).orderBy("availableAt").limit(30).get()).docs.map(d => d.ref);
  for (const ref of candidates) {
    const leased = await database().runTransaction(async tx => {
      const current = record<RecoverableJob>(await tx.get(ref));
      if (!current || current.completedAt || current.availableAt.getTime() > Date.now() || (current.leasedUntil && current.leasedUntil.getTime() > Date.now())) return null;
      const a = record<Award>(await tx.get(col("awards").doc(current.awardId))); if (!a) throw new DomainError("AWARD_MISSING", "Persisted award missing.", 503);
      const c = record<Campaign>(await tx.get(col("campaigns").doc(a.campaignId))); if (!c) throw new DomainError("CAMPAIGN_MISSING", "Persisted campaign missing.", 503);
      const updated = { ...current, attempts: current.attempts + 1, leaseOwner: randomUUID(), leasedUntil: new Date(Date.now() + LEASE_MS) };
      tx.set(ref, updated); return { ...updated, award: { ...a, campaign: c } };
    });
    if (leased) return leased;
  }
  return null;
}
async function retryLater(job: LeasedJob, code: string, submitted = false) {
  await database().runTransaction(async tx => {
    const { award } = await leasedRecords(tx, job);
    const waitMs = submitted ? 10_000 : Math.min(300_000, 2 ** Math.min(job.attempts, 8) * 1000);
    tx.update(col("payoutJobs").doc(job.id), { availableAt: new Date(Date.now() + waitMs), lastError: code, leasedUntil: null, leaseOwner: null });
    if (!terminal(award) && award.status !== "EXPIRED") tx.update(col("awards").doc(award.id), { status: submitted ? "SUBMITTED" : "RETRYABLE_FAILED", lastError: code, ...(job.txHash ? { txHash: job.txHash } : {}) });
  });
}
async function finalizeConfirmed(job: LeasedJob, txHash: Hex, block: bigint, nonceDrained: boolean) {
  await database().runTransaction(async tx => {
    const { award } = await leasedRecords(tx, job);
    tx.update(col("awards").doc(award.id), { status: "CONFIRMED", txHash, confirmedBlock: block.toString(), confirmedAt: award.confirmedAt ?? new Date(), lastError: null });
    tx.update(col("payoutJobs").doc(job.id), { completedAt: nonceDrained ? new Date() : null, availableAt: new Date(), leasedUntil: nonceDrained ? null : job.leasedUntil, leaseOwner: nonceDrained ? null : job.leaseOwner, lastError: nonceDrained ? null : "PAID_NONCE_DRAIN_PENDING" });
    if (award.status !== "CONFIRMED") { tx.create(col("auditLogs").doc(), { campaignId: award.campaignId, action: "PAYOUT_CONFIRMED", properties: { awardId: award.id, txHash, block: block.toString() }, createdAt: new Date() }); tx.create(col("analyticsEvents").doc(), { campaignId: award.campaignId, name: "reward_confirmed", context: job.award.campaign.chainId === 10143 ? "testnet" : "mainnet", properties: { rewardType: "USDC" }, createdAt: new Date() }); }
  });
}
async function completeExpired(job: LeasedJob, nonceDrained: boolean) {
  if (!nonceDrained) throw new DomainError("NONCE_NOT_DRAINED", "A prepared transaction must consume its nonce before finishing.", 503);
  await database().runTransaction(async tx => { const { award } = await leasedRecords(tx, job); tx.update(col("payoutJobs").doc(job.id), { completedAt: new Date(), leasedUntil: null, leaseOwner: null, lastError: terminal(award) ? null : "RECEIPT_DEADLINE_PASSED" }); if (!terminal(award)) tx.update(col("awards").doc(award.id), { status: "EXPIRED", lastError: "RECEIPT_DEADLINE_PASSED" }); });
}
async function deliverCoupon(job: LeasedJob) {
  await database().runTransaction(async tx => {
    const { award } = await leasedRecords(tx, job);
    const coupon = award.couponId ? record<Coupon>(await tx.get(col("coupons").doc(award.couponId))) : null;
    if (!coupon || coupon.awardId !== award.id || (coupon.status !== "RESERVED" && coupon.status !== "DELIVERED")) throw new DomainError("COUPON_RESERVATION_MISSING", "Reserved inventory is unavailable.", 503);
    if (coupon.status === "DELIVERED" && award.status === "DELIVERED") { tx.update(col("payoutJobs").doc(job.id), { completedAt: new Date(), leasedUntil: null, leaseOwner: null }); return; }
    if (award.deadline.getTime() <= Date.now() || coupon.expiresAt.getTime() <= Date.now()) { tx.update(col("awards").doc(award.id), { status: "EXPIRED", lastError: "RECEIPT_DEADLINE_PASSED" }); tx.update(col("payoutJobs").doc(job.id), { completedAt: new Date(), leasedUntil: null, leaseOwner: null }); return; }
    tx.update(col("coupons").doc(coupon.id), { status: "DELIVERED", deliveredAt: new Date() }); tx.update(col("awards").doc(award.id), { status: "DELIVERED", confirmedAt: new Date(), lastError: null }); tx.update(col("payoutJobs").doc(job.id), { completedAt: new Date(), leasedUntil: null, leaseOwner: null, lastError: null });
    tx.create(col("analyticsEvents").doc(), { campaignId: award.campaignId, name: "coupon_delivered", context: coupon.isDemo ? "demo" : "live-coupon", properties: { isDemo: coupon.isDemo }, createdAt: new Date() });
  });
}
async function nonceIsDrained(job: LeasedJob) { if (job.nonce === null || !job.relayer) return true; const { config, publicClient } = chainClients(); const finalized = await finalizedBlock(publicClient), depth = BigInt(config.confirmations - 1), confirmedBlock = finalized.number > depth ? finalized.number - depth : 0n; return (await publicClient.getTransactionCount({ address: job.relayer as `0x${string}`, blockNumber: confirmedBlock })) > job.nonce; }

// Every request stays inside even Monad's smallest public getLogs limit. The backwards
// cursor is committed after each page so interrupted Functions runs continue their work.
const RECOVERY_PAGE_BLOCKS = 100n;
const RECOVERY_PAGES_PER_TICK = 3;
async function persistRecovery(job: LeasedJob, recoveryCursor: string, settlementTxHash?: Hex) {
  await database().runTransaction(async tx => {
    await leasedRecords(tx, job);
    tx.update(col("payoutJobs").doc(job.id), { recoveryCursor, ...(settlementTxHash ? { settlementTxHash } : {}) });
  });
}
async function recoverExistingSettlement(job: LeasedJob, proof: RewardAuthorization): Promise<"unpaid" | "done" | "paid-needs-drain"> {
  const { config, publicClient } = chainClients();
  const finalized = await finalizedBlock(publicClient);
  if (!await publicClient.readContract({ address: config.escrow, abi: escrowAbi, functionName: "isRewardClaimed", args: [proof.campaignId, proof.rewardId], blockNumber: finalized.number })) return "unpaid";
  const floor = job.award.campaign.fundingBlock ? BigInt(job.award.campaign.fundingBlock) : 0n;
  let toBlock = job.recoveryCursor === undefined ? finalized.number : BigInt(job.recoveryCursor);
  if (toBlock > finalized.number) toBlock = finalized.number;
  for (let page = 0; page < RECOVERY_PAGES_PER_TICK && toBlock >= floor; page++) {
    const fromBlock = toBlock >= floor + RECOVERY_PAGE_BLOCKS ? toBlock - RECOVERY_PAGE_BLOCKS + 1n : floor;
    const logs = await publicClient.getContractEvents({ address: config.escrow, abi: escrowAbi, eventName: "RewardPaid", args: { campaignId: proof.campaignId, rewardId: proof.rewardId }, fromBlock, toBlock });
    const event = logs.find(log => log.transactionHash);
    const next = fromBlock - 1n;
    await persistRecovery(job, next.toString(), event?.transactionHash ?? undefined);
    if (event?.transactionHash) {
      const result = await receiptForReward(event.transactionHash, proof);
      if (result.state !== "confirmed") { await retryLater(job, "AWAITING_CONFIRMATIONS", true); return "done"; }
      const drained = await nonceIsDrained(job);
      await finalizeConfirmed(job, event.transactionHash, result.receipt.blockNumber, drained);
      return drained ? "done" : "paid-needs-drain";
    }
    toBlock = next;
  }
  if (toBlock < floor) throw new DomainError("SETTLEMENT_LOG_UNAVAILABLE", "The reward is paid but its finalized receipt is unavailable. Supply its transaction record for recovery.", 503);
  await retryLater(job, "SETTLEMENT_RECEIPT_LOCATING", true);
  return "done";
}
async function ensureDurableTransaction(job: LeasedJob, proof: RewardAuthorization, signature: Hex): Promise<LeasedJob> {
  if (job.serializedTx && job.txHash) return job;
  const { config, publicClient } = chainClients(), account = relayerAccount();
  return database().runTransaction(async tx => {
    const { current, award } = await leasedRecords(tx, job);
    const nonceRef = col("relayerNonces").doc(`${config.chainId}-${account.address.toLowerCase()}`), stored = await tx.get(nonceRef);
    if (current.serializedTx && current.txHash) return { ...current, award: { ...award, campaign: job.award.campaign } };
    const pending = await publicClient.getTransactionCount({ address: account.address, blockTag: "pending" });
    const nonce = Math.max(pending, Number(stored.data()?.nextNonce ?? 0));
    const prepared = await prepareClaim(proof, signature, nonce);
    enforceFeeCap(prepared.maxFeePerGas, prepared.gas);
    const updated = { ...current, ...prepared, preparedAt: new Date(), txHistory: [...current.txHistory, prepared.txHash] };
    tx.set(nonceRef, { nextNonce: nonce + 1 }); tx.set(col("payoutJobs").doc(job.id), updated);
    return { ...updated, award: { ...award, campaign: job.award.campaign } };
  });
}
export function enforceFeeCap(fee: string, gas?: string) { const cap = process.env.DROP_MAX_RELAYER_FEE_GWEI ?? "500"; if (!/^\d+(?:\.\d{1,9})?$/.test(cap) || BigInt(fee) > parseUnits(cap, 9)) throw new DomainError("RELAYER_FEE_CAP", "Relayer transaction fee exceeds the configured cap.", 503); if (gas) { const budget = process.env.DROP_MAX_RELAYER_TX_COST_MON ?? "0.25"; if (!/^\d+(?:\.\d{1,18})?$/.test(budget) || BigInt(gas) * BigInt(fee) > parseUnits(budget, 18)) throw new DomainError("RELAYER_TRANSACTION_BUDGET", "The signed transaction exceeds the configured MON budget.", 503); } }
async function bumpPendingFee(job: LeasedJob, proof: RewardAuthorization, signature: Hex): Promise<LeasedJob> {
  if (!job.serializedTx || job.nonce === null || !job.preparedAt || Date.now() - job.preparedAt.getTime() < 60_000) return job;
  const existing = parseTransaction(job.serializedTx as Hex); if (!existing.gas || !existing.maxFeePerGas || existing.maxPriorityFeePerGas === undefined) throw new DomainError("INVALID_PREPARED_TRANSACTION", "Prepared transaction cannot be replaced safely.", 503);
  // A policy change can prohibit the old transaction too. Never bypass either cap.
  enforceFeeCap(existing.maxFeePerGas.toString(), existing.gas.toString());
  const prepared = await prepareClaim(proof, signature, job.nonce, { gas: existing.gas, maxFeePerGas: existing.maxFeePerGas * 125n / 100n + 1n, maxPriorityFeePerGas: existing.maxPriorityFeePerGas * 125n / 100n + 1n });
  try { enforceFeeCap(prepared.maxFeePerGas, prepared.gas); }
  catch (error) {
    if (error instanceof DomainError && (error.code === "RELAYER_FEE_CAP" || error.code === "RELAYER_TRANSACTION_BUDGET")) return job;
    throw error;
  }
  return database().runTransaction(async tx => { const { current, award } = await leasedRecords(tx, job); if (current.txHash !== job.txHash) throw new DomainError("LEASE_LOST", "Prepared transaction changed.", 409); const updated = { ...current, ...prepared, preparedAt: new Date(), txHistory: [...current.txHistory, prepared.txHash] }; tx.set(col("payoutJobs").doc(job.id), updated); return { ...updated, award: { ...award, campaign: job.award.campaign } }; });
}
async function resetConsumedTransaction(job: LeasedJob): Promise<LeasedJob> { return database().runTransaction(async tx => { const { current, award } = await leasedRecords(tx, job); const updated = { ...current, serializedTx: null, txHash: null, nonce: null, relayer: null, chainId: null, preparedAt: null, maxFeePerGas: null, maxPriorityFeePerGas: null, txHistory: [] }; tx.set(col("payoutJobs").doc(job.id), updated); tx.create(col("auditLogs").doc(), { campaignId: award.campaignId, action: "CONSUMED_TRANSACTION_RETRY", properties: { awardId: award.id, nonce: current.nonce, hashes: current.txHistory }, createdAt: new Date() }); return { ...updated, award: { ...award, campaign: job.award.campaign } }; }); }

export async function processJob(job: LeasedJob) {
  try {
    await assertLease(job); if (job.award.campaign.rewardType !== "USDC") { await deliverCoupon(job); return; }
    const { config, publicClient } = await verifyChainConfiguration(), c = job.award.campaign;
    if (c.chainId !== config.chainId || c.escrow !== config.escrow.toLowerCase() || c.token !== config.usdc.toLowerCase()) throw new DomainError("DEPLOYMENT_MISMATCH", "This event belongs to another escrow deployment.", 503);
    let proof = job.award.proof ? proofFromJson(job.award.proof) : proofFor(job.award, c);
    let recovered: "unpaid" | "done" | "paid-needs-drain" = "unpaid";
    let reverted = false;
    // The durably known transaction is the fastest and strongest recovery evidence.
    // Do not let a historical log query block a receipt we can already look up.
    const knownHashes = [...new Set([job.settlementTxHash, job.txHash, ...job.txHistory].filter((hash): hash is string => Boolean(hash)))];
    for (const hash of knownHashes) {
        const result = await receiptForReward(hash as Hex, proof);
        if (result.state === "confirmed") {
          const drained = await nonceIsDrained(job);
          await finalizeConfirmed(job, hash as Hex, result.receipt.blockNumber, drained);
          if (drained) return;
          recovered = "paid-needs-drain";
          break;
        }
        if (result.state === "reverted" && hash !== job.settlementTxHash) reverted = true;
    }
    if (recovered === "unpaid") { recovered = await recoverExistingSettlement(job, proof); if (recovered === "done") return; }
    if (reverted) {
      if (recovered === "paid-needs-drain" || job.award.deadline.getTime() <= Date.now()) { await completeExpired(job, true); return; }
      job = await resetConsumedTransaction(job);
    }
    if (job.txHash) {
      if (job.nonce !== null && await nonceIsDrained(job)) { if (recovered === "paid-needs-drain" || job.award.deadline.getTime() <= Date.now()) { await completeExpired(job, true); return; } job = await resetConsumedTransaction(job); }
    }
    // An unsigned expired award has no nonce to consume. A prepared transaction must
    // still be broadcast and tracked until its nonce is mined, even if claim reverts.
    if (!job.serializedTx && job.award.deadline.getTime() <= Date.now()) { await completeExpired(job, true); return; }
    let signature = job.award.signature as Hex | null;
    if (!signature) {
      if (c.signer !== signingAccount().address.toLowerCase()) throw new DomainError("SIGNER_MISMATCH", "The worker signer differs from this event.", 503);
      signature = await signAuthorization(proof);
      const saved = await database().runTransaction(async tx => { const { award } = await leasedRecords(tx, job); if (award.proof && award.signature) return award; tx.update(col("awards").doc(award.id), { proof: proofJson(proof), signature }); return { ...award, proof: proofJson(proof), signature }; }); proof = proofFromJson(saved.proof); signature = saved.signature as Hex;
    }
    job = await ensureDurableTransaction(job, proof, signature);
    job = await bumpPendingFee(job, proof, signature);
    if (job.maxFeePerGas && job.serializedTx) enforceFeeCap(job.maxFeePerGas, parseTransaction(job.serializedTx as Hex).gas?.toString());
    await assertLease(job);
    try { await publicClient.sendRawTransaction({ serializedTransaction: job.serializedTx as Hex }); }
    catch { await retryLater(job, "BROADCAST_UNCERTAIN_RECHECKING", true); return; }
    // Monad receipts can arrive quickly. Keep this bounded wait in the durable worker,
    // so the consumer need not wait for the next scheduled retry when already settled.
    // A timeout still leaves the persisted outbox/transaction for normal recovery.
    try {
      await publicClient.waitForTransactionReceipt({ hash: job.txHash as Hex, confirmations: config.confirmations, timeout: 15_000, pollingInterval: 1000 });
      const settled = await receiptForReward(job.txHash as Hex, proof);
      if (settled.state === "confirmed") { await finalizeConfirmed(job, job.txHash as Hex, settled.receipt.blockNumber, true); return; }
      if (settled.state === "reverted" && (recovered === "paid-needs-drain" || job.award.deadline.getTime() <= Date.now())) { await completeExpired(job, true); return; }
    } catch (error) { if (error instanceof DomainError && error.code === "LEASE_LOST") return; }
    // CAS after the external call prevents an old worker from downgrading a reward
    // that another worker has already confirmed or delivered.
    await retryLater(job, recovered === "paid-needs-drain" ? "PAID_NONCE_DRAIN_PENDING" : "AWAITING_CONFIRMATIONS", true);
  } catch (error) {
    if (error instanceof DomainError && error.code === "LEASE_LOST") return;
    const code = error instanceof DomainError ? error.code : "PAYOUT_PROVIDER_UNAVAILABLE";
    try { await retryLater(job, code, Boolean(job.txHash)); } catch (retryError) { if (!(retryError instanceof DomainError && retryError.code === "LEASE_LOST")) throw retryError; }
  }
}
export async function workerTick(onlyId?: string) { const job = await leaseNextJob(onlyId); if (!job) return false; await processJob(job); return true; }
export async function reconcileCampaign(id: string) {
  const c = await read<Campaign>("campaigns", id); if (!c || c.rewardType !== "USDC" || !c.fundingTx) return { id, skipped: true };
  const { config, publicClient } = await verifyChainConfiguration(); if (c.chainId !== config.chainId || c.escrow !== config.escrow.toLowerCase()) throw new DomainError("DEPLOYMENT_MISMATCH", "Use the event's deployed escrow.", 503);
  const finalized = await finalizedBlock(publicClient);
  const state = await publicClient.readContract({ address: config.escrow, abi: escrowAbi, functionName: "getCampaign", args: [c.chainCampaignId as Hex], blockNumber: finalized.number });
  const awards = (await col("awards").where("campaignId", "==", id).get()).docs.map(d => record<Award>(d)!);
  const confirmed = awards.filter(a => a.status === "CONFIRMED").reduce((sum, a) => sum + BigInt(a.amount), 0n), pending = awards.filter(a => !["CONFIRMED", "EXPIRED"].includes(a.status)).reduce((sum, a) => sum + BigInt(a.amount), 0n);
  const invariantHolds = state.paid + state.refunded <= state.deposited, mismatch = confirmed !== state.paid || !invariantHolds;
  for (const award of awards) {
    const job = await read<PayoutJob>("payoutJobs", award.id);
    if (job && !job.completedAt) await col("payoutJobs").doc(job.id).update({ availableAt: new Date() });
    else if (job && mismatch && award.status === "EXPIRED" && await publicClient.readContract({ address: config.escrow, abi: escrowAbi, functionName: "isRewardClaimed", args: [c.chainCampaignId as Hex, award.rewardId as Hex], blockNumber: finalized.number })) {
      // Server wall time may expire an unsigned job while a valid direct claim is
      // still settling. A finalized chain payment remains recoverable after that.
      await database().runTransaction(async tx => {
        const jobRef = col("payoutJobs").doc(job.id), awardRef = col("awards").doc(award.id);
        const [storedJob, storedAward] = await tx.getAll(jobRef, awardRef);
        const currentJob = record<PayoutJob>(storedJob), currentAward = record<Award>(storedAward);
        if (currentJob?.completedAt && currentAward?.status === "EXPIRED") tx.update(jobRef, { completedAt: null, availableAt: new Date(), leasedUntil: null, leaseOwner: null, recoveryCursor: finalized.number.toString(), lastError: "FINALIZED_SETTLEMENT_RECOVERY" });
      });
    }
  }
  const result = { id, depositedAtomic: state.deposited.toString(), paidAtomic: state.paid.toString(), refundedAtomic: state.refunded.toString(), onchainRemainingAtomic: (state.deposited - state.paid - state.refunded).toString(), confirmedDatabaseAtomic: confirmed.toString(), pendingReservedAtomic: pending.toString(), invariantHolds, mismatch };
  await col("auditLogs").add({ campaignId: id, action: "RECONCILIATION", properties: result, createdAt: new Date() }); return result;
}
export async function reconcileAll() { const campaigns = (await col("campaigns").where("rewardType", "==", "USDC").get()).docs.map(d => record<Campaign>(d)!); const results = []; for (const c of campaigns) if (c.fundingTx) results.push(await reconcileCampaign(c.id)); const expired = await col("rateLimits").where("expiresAt", "<", new Date()).limit(300).get(); if (!expired.empty) { const batch = database().batch(); for (const doc of expired.docs) batch.delete(doc.ref); await batch.commit(); } return results; }
