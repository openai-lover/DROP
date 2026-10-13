import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { FieldPath } from "firebase-admin/firestore";
import type { Principal } from "./auth";
import { database, read, record, type Award } from "./db";
import { processJob, leaseNextJob, reviveFinalizedReward, type WorkerBudget } from "./worker";

export type WorkerMode = "disabled" | "request" | "external";
export function workerMode(): WorkerMode { return process.env.DROP_WORKER_MODE === "request" ? "request" : process.env.DROP_WORKER_MODE === "external" ? "external" : "disabled"; }
export function cronSecretConfigured() { return Boolean(process.env.CRON_SECRET && process.env.CRON_SECRET.length >= 32); }
export function authorizedCron(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || expected.length < 32) return false;
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(header.slice(7)), secret = Buffer.from(expected);
  return supplied.length === secret.length && timingSafeEqual(supplied, secret);
}

const deadlineBudget = (): WorkerBudget => ({ deadlineAt: Date.now() + 25_000, receiptWaitMs: 0, recoveryPages: 1 });
const withinBudget = (budget: WorkerBudget) => Date.now() < budget.deadlineAt!;
type Wakeup = { nextAllowedAt: Date };

/** Best-effort work after an authenticated response. Persistent jobs survive interruption;
 * execution itself depends on user requests or the separate daily recovery invocation. */
export async function recoverOwnRewards(principal: Principal, onlyAwardId?: string) {
  if (workerMode() !== "request") return { enabled: false, processed: 0 };
  const budget = deadlineBudget();
  // Check ownership before spending a dispatch or leasing any requested document.
  const awards = onlyAwardId
    ? [await read<Award>("awards", onlyAwardId)].filter((award): award is Award => award !== null && award.userId === principal.userId)
    : (await database().collection("awards").where("userId", "==", principal.userId).orderBy("createdAt", "desc").limit(8).get()).docs.map(doc => record<Award>(doc)!).filter(award => award.userId === principal.userId);
  if (!awards.length) return { enabled: true, processed: 0 };
  const wakeupId = createHash("sha256").update(principal.userId).digest("hex");
  const allowed = await database().runTransaction(async tx => {
    const ref = database().collection("workerWakeups").doc(wakeupId), stored = record<Wakeup>(await tx.get(ref));
    if (stored && stored.nextAllowedAt.getTime() > Date.now()) return false;
    tx.set(ref, { nextAllowedAt: new Date(Date.now() + 15_000) });
    return true;
  });
  if (!allowed) return { enabled: true, processed: 0 };
  let processed = 0;
  for (const award of awards) {
    if (!withinBudget(budget) || processed >= 1) break;
    if (award.status === "EXPIRED") await reviveFinalizedReward(award.id, budget);
    const job = await leaseNextJob(award.id);
    if (!job || job.award.userId !== principal.userId) continue;
    await processJob(job, budget);
    processed++;
  }
  return { enabled: true, processed };
}

type DailyRun = { leaseOwner: string; leasedUntil: Date; nextAllowedAt: Date; expiredCursor?: string };

/** Hobby-compatible daily recovery: three jobs, three expired-award probes, and a soft
 * 25-second budget. An in-flight provider call can outlast the soft budget; persisted
 * leases/CAS and a 60-second platform limit handle interruption without false delivery. */
export async function recoverDaily() {
  if (workerMode() !== "request" || !cronSecretConfigured()) return { accepted: false, processed: 0, revived: 0, reason: "disabled" };
  const owner = randomUUID(), ref = database().collection("recoveryRuns").doc("daily"), budget = deadlineBudget();
  const claimed = await database().runTransaction(async tx => {
    const stored = record<DailyRun>(await tx.get(ref));
    if (stored && (stored.leasedUntil.getTime() > Date.now() || stored.nextAllowedAt.getTime() > Date.now())) return null;
    const next = { leaseOwner: owner, leasedUntil: new Date(Date.now() + 120_000), nextAllowedAt: new Date(Date.now() + 20 * 3600_000), startedAt: new Date(), ...(stored?.expiredCursor ? { expiredCursor: stored.expiredCursor } : {}) };
    tx.set(ref, next, { merge: true });
    return next;
  });
  if (!claimed) return { accepted: false, processed: 0, revived: 0, reason: "cooldown" };
  let processed = 0, revived = 0;
  try {
    for (let count = 0; count < 3 && withinBudget(budget); count++) {
      const job = await leaseNextJob();
      if (!job) break;
      await processJob(job, budget);
      processed++;
    }
    if (withinBudget(budget)) {
      const base = database().collection("awards").where("status", "==", "EXPIRED").orderBy(FieldPath.documentId()).limit(3);
      let expired = await (claimed.expiredCursor ? base.startAfter(claimed.expiredCursor) : base).get();
      if (expired.empty && claimed.expiredCursor) expired = await base.get();
      for (const snapshot of expired.docs) {
        if (!withinBudget(budget)) break;
        if (await reviveFinalizedReward(snapshot.id, budget)) revived++;
        await database().runTransaction(async tx => {
          const current = record<DailyRun>(await tx.get(ref));
          if (current?.leaseOwner === owner) tx.update(ref, { expiredCursor: snapshot.id });
        });
      }
    }
    return { accepted: true, processed, revived, reason: withinBudget(budget) ? "finished" : "budget" };
  } finally {
    await database().runTransaction(async tx => {
      const current = record<DailyRun>(await tx.get(ref));
      if (current?.leaseOwner === owner) tx.update(ref, { leasedUntil: new Date(0), finishedAt: new Date(), processed, revived });
    });
  }
}
