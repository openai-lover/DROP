import { defineSecret } from "firebase-functions/params";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { reconcileAll, workerTick } from "../../src/server/worker";

process.env.FIREBASE_PROJECT_ID ||= process.env.GCLOUD_PROJECT;
const signer = defineSecret("DROP_AUTHORIZATION_PRIVATE_KEY");
const relayer = defineSecret("DROP_RELAYER_PRIVATE_KEY");
const couponKey = defineSecret("COUPON_ENCRYPTION_KEY");
const secrets = [signer, relayer, couponKey];
const options = { region: process.env.DROP_FUNCTION_REGION || "asia-northeast3", timeoutSeconds: 120, memory: "512MiB" as const, maxInstances: 3, secrets };

/** Outbox creation is delivered at least once; the persisted lease owns execution. */
export const rewardCreated = onDocumentCreated({ ...options, document: "payoutJobs/{jobId}", retry: true }, async event => {
  await workerTick(event.params.jobId);
});

/** Delayed retries and interrupted leases survive Vercel/serverless request lifetimes. */
export const retryRewards = onSchedule({ ...options, schedule: "every 1 minutes", timeZone: "UTC" }, async () => {
  const started = Date.now();
  for (let count = 0; count < 20 && Date.now() - started < 95_000; count++) if (!await workerTick()) break;
});

export const reconcileRewards = onSchedule({ ...options, schedule: "every 10 minutes", timeZone: "UTC" }, async () => {
  await reconcileAll();
});
