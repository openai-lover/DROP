import { PrivyClient } from "@privy-io/server-auth";
import { createHash } from "node:crypto";
import { database } from "./db";
import { canonicalWallet } from "./config";
import { DomainError, required } from "./errors";

export type Principal = { userId: string; privyId: string; wallet: string | null };
type AuthenticatedIdentity = { privyId: string; wallet: string | null };
let privy: PrivyClient | undefined;

export async function verifyIdentity(token: string): Promise<AuthenticatedIdentity> {
  if (!token || token.length > 8192) throw new DomainError("UNAUTHENTICATED", "Please sign in to continue.", 401);
  if (!privy) privy = new PrivyClient(required("NEXT_PUBLIC_PRIVY_APP_ID"), required("PRIVY_APP_SECRET"));
  try {
    // SDK verifies ES256 signature, expiry, issuer and this application's audience.
    const claims = await privy.verifyAuthToken(token);
    const user = await privy.getUser(claims.userId);
    if (!user || user.id !== claims.userId) throw new Error("Identity mismatch");
    const wallet = user.linkedAccounts.find((account) => account.type === "wallet" && account.chainType === "ethereum" && account.walletClientType === "privy");
    return { privyId: user.id, wallet: wallet?.type === "wallet" ? canonicalWallet(wallet.address) : null };
  } catch {
    throw new DomainError("UNAUTHENTICATED", "Your sign-in session could not be verified. Please sign in again.", 401);
  }
}

export async function authenticate(request: Request): Promise<Principal> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ") || header.includes(",")) throw new DomainError("UNAUTHENTICATED", "Please sign in to continue.", 401);
  const identity = await verifyIdentity(header.slice(7));
  // A verified wallet can only belong to one user. A second account cannot silently take it over.
  const userId = `u-${createHash("sha256").update(identity.privyId).digest("hex")}`;
  return database().runTransaction(async tx => {
    const userRef = database().collection("users").doc(userId);
    const existing = await tx.get(userRef);
    const walletRef = identity.wallet ? database().collection("walletOwners").doc(identity.wallet) : null;
    const walletOwner = walletRef ? await tx.get(walletRef) : null;
    if (walletOwner?.exists && walletOwner.data()?.userId !== userId) throw new DomainError("WALLET_ALREADY_LINKED", "This wallet is already linked to another account.", 409);
    const wallet = identity.wallet ?? existing.data()?.wallet ?? null;
    tx.set(userRef, { privyId: identity.privyId, wallet, createdAt: existing.data()?.createdAt ?? new Date() }, { merge: true });
    if (walletRef) tx.set(walletRef, { userId });
    return { userId, privyId: identity.privyId, wallet };
  });
}

export function requireWallet(principal: Principal): string {
  if (!principal.wallet) throw new DomainError("WALLET_REQUIRED", "Your account wallet is still being created. Please retry when it is ready.", 409);
  return canonicalWallet(principal.wallet);
}
