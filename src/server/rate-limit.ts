import { createHash } from "node:crypto";
import { database } from "./db";
import { DomainError } from "./errors";

export async function rateLimit(identity: string, action: string, limit: number, windowSeconds: number): Promise<void> {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = createHash("sha256").update(`${identity}:${action}:${bucket}`).digest("hex");
  const ref = database().collection("rateLimits").doc(key);
  const count = await database().runTransaction(async tx => {
    const snapshot = await tx.get(ref), next = Number(snapshot.data()?.count ?? 0) + 1;
    tx.set(ref, { count: next, windowStart: new Date(), expiresAt: new Date((bucket + 2) * windowSeconds * 1000) });
    return next;
  });
  if (count > limit) throw new DomainError("RATE_LIMITED", "Too many requests. Please wait and try again.", 429);
}
