import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp, type DocumentSnapshot, type Firestore } from "firebase-admin/firestore";
import { DomainError, required } from "./errors";
let storage: Firestore | undefined;
export function database(): Firestore {
  if (storage) return storage;
  const projectId = required("FIREBASE_PROJECT_ID");
  if (process.env.FIRESTORE_EMULATOR_HOST && process.env.NODE_ENV !== "test" && !(process.env.NODE_ENV === "development" && process.env.DROP_LOCAL_EMULATOR === "true")) throw new DomainError("EMULATOR_FORBIDDEN", "The local database emulator is not allowed in this deployment.", 503);
  if (process.env.FIRESTORE_EMULATOR_HOST && process.env.VERCEL) throw new DomainError("EMULATOR_FORBIDDEN", "Hosted deployments cannot use a local database emulator.", 503);
  const app = getApps().find(app => app.name === "drop-server") ?? initializeApp({ projectId, ...(process.env.FIRESTORE_EMULATOR_HOST ? {} : { credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) : applicationDefault() }) }, "drop-server");
  storage = getFirestore(app);
  storage.settings({ ignoreUndefinedProperties: true });
  return storage;
}
export function hydrate<T>(value: unknown): T {
  if (value instanceof Timestamp) return value.toDate() as T;
  if (Array.isArray(value)) return value.map(item => hydrate(item)) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, hydrate(item)])) as T;
  return value as T;
}
export function record<T>(snapshot: DocumentSnapshot): T | null { return snapshot.exists ? hydrate<T>({ id: snapshot.id, ...snapshot.data() }) : null; }
export async function read<T>(collection: string, id: string) { return record<T>(await database().collection(collection).doc(id).get()); }
export type CampaignStatus = "DRAFT" | "OPEN" | "CLOSED" | "REFUNDED";
export type AwardStatus = "QUEUED" | "SUBMITTED" | "CONFIRMED" | "RETRYABLE_FAILED" | "EXPIRED" | "DELIVERED";
export type Campaign = { id: string; chainCampaignId: string; slug: string; ownerId: string; ownerWallet: string; title: string; organizer: string; description: string; gameType: "CATCH" | "QUIZ"; rewardType: "USDC" | "COUPON" | "COUPON_DEMO"; rewardAmount: string; maxRecipients: number; reservedCount: number; status: CampaignStatus; startsAt: Date; endsAt: Date; claimDeadline: Date; maxAttempts: number; configVersion: number; gameConfig: unknown; rulesHash: string; signer: string | null; chainId: number; token: string | null; escrow: string | null; fundingTx: string | null; fundingBlock: string | null; refundTx: string | null; refundBlock: string | null; createdAt: Date };
export type GameSession = { id: string; userId: string; campaignId: string; nonce: string; seed: string; configVersion: number; startsAt: Date; expiresAt: Date; submittedAt: Date | null; passed: boolean | null; failureCode: string | null };
export type Award = { id: string; rewardId: string; campaignId: string; userId: string; qualificationId: string; slotIndex: number; recipient: string; participantNullifier: string; amount: string; status: AwardStatus; qualifiedAt: Date; deadline: Date; txHash: string | null; confirmedBlock: string | null; confirmedAt: Date | null; lastError: string | null; proof: unknown | null; signature: string | null; couponId: string | null; createdAt: Date };
export type PayoutJob = { id: string; awardId: string; attempts: number; availableAt: Date; leasedUntil: Date | null; leaseOwner: string | null; completedAt: Date | null; serializedTx: string | null; txHash: string | null; nonce: number | null; relayer: string | null; chainId: number | null; lastError: string | null; txHistory: string[]; preparedAt: Date | null; maxFeePerGas: string | null; maxPriorityFeePerGas: string | null; createdAt: Date };
export type Coupon = { id: string; campaignId: string; referenceHash: string; merchant: string; expiresAt: Date; encryptedPayload: string; status: "AVAILABLE" | "RESERVED" | "DELIVERED"; isDemo: boolean; awardId: string | null; deliveredAt: Date | null; lastViewedAt: Date | null; createdAt: Date };
export type QuizSecret = { questions: { prompt: string; options: string[]; correctIndex: number; explanation?: string }[]; passScore: number; commitmentSalt: string };
