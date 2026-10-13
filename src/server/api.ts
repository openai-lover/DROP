import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { decodeEventLog, encodeFunctionData, keccak256, parseUnits, toBytes, type Hex } from "viem";
import { z } from "zod";
import { authenticate, requireWallet, type Principal } from "./auth";
import { DEFAULT_CATCH, verifyCatch, type CatchConfig, type CatchInput } from "./catch-engine";
import { chainConfig, signingAccount } from "./config";
import { chainClients, escrowAbi, receiptFinalizedAt, usdcAbi, verifyChainConfiguration, walletBalance } from "./chain";
import { couponReferenceHash, decryptCoupon, encryptCoupon } from "./coupons";
import { database, read, record, type Award, type Campaign, type Coupon, type GameSession, type PayoutJob, type QuizSecret } from "./db";
import { DomainError, required } from "./errors";
import { rateLimit } from "./rate-limit";
export { authenticate, DomainError };
export type { Principal };
const iso = z.string().datetime({ offset: true });
const quizQuestion = z.object({ prompt: z.string().trim().min(3).max(240), options: z.array(z.string().trim().min(1).max(120)).min(2).max(4), correctIndex: z.number().int().min(0).max(3), explanation: z.string().max(400).optional() }).strict().refine(q => q.correctIndex < q.options.length, "The correct option must exist.");
const targetImage = z.string().max(280_000).refine(value => { const match = /^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/]+={0,2})$/.exec(value); if (!match) return false; const bytes = Buffer.from(match[2], "base64"); if (bytes.length > 200 * 1024 || bytes.length < 12) return false; return match[1] === "png" ? bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" : match[1] === "jpeg" ? bytes.subarray(0, 3).toString("hex") === "ffd8ff" : bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP"; }, "Use a PNG, JPEG or WEBP image under 200 KB.");
export const createCampaignSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(3).max(60), title: z.string().trim().min(3).max(100), organizer: z.string().trim().min(2).max(80), description: z.string().trim().min(10).max(1000), gameType: z.enum(["CATCH", "QUIZ"]), rewardType: z.enum(["USDC", "COUPON", "COUPON_DEMO"]), rewardAmount: z.string().regex(/^(?:0|[1-9]\d{0,5})(?:\.\d{1,6})?$/), maxRecipients: z.number().int().min(1).max(500), startsAt: iso, endsAt: iso, claimDeadline: iso, maxAttempts: z.number().int().min(1).max(3).default(1), catchPhrase: z.string().trim().min(1).max(80).optional(), targetImage: targetImage.optional(), quiz: z.array(quizQuestion).length(3).optional(), passScore: z.number().int().min(1).max(3).default(3) }).strict();
export type CreateCampaignInput = z.input<typeof createCampaignSchema>;
export const catchSubmissionSchema = z.object({ nonce: z.string().regex(/^[0-9a-f]{48}$/), events: z.array(z.object({ at: z.number().int().min(0).max(20_000), x: z.number().min(0).max(1), y: z.number().min(0).max(1), target: z.number().int().min(0).max(9) }).strict()).max(10) }).strict();
export const quizSubmissionSchema = z.object({ nonce: z.string().regex(/^[0-9a-f]{48}$/), answers: z.array(z.number().int().min(0).max(3)).length(3) }).strict();
export const couponImportSchema = z.object({ coupons: z.array(z.object({ reference: z.string().trim().min(3).max(120), merchant: z.string().trim().min(2).max(120), expiresAt: iso, content: z.string().min(3).max(10_000) }).strict()).min(1).max(100) }).strict();
const seconds = (date: Date) => BigInt(Math.floor(date.getTime() / 1000));
const normalizedDate = (value: string) => new Date(Math.floor(new Date(value).getTime() / 1000) * 1000);
const privateKey = (value: string) => createHash("sha256").update(value).digest("hex");
const collection = (name: string) => database().collection(name);
export function publicDto(c: Campaign) {
  return { id: c.id, slug: c.slug, title: c.title, organizer: c.organizer, description: c.description, gameType: c.gameType, rewardType: c.rewardType, rewardAmountAtomic: c.rewardAmount, rewardDecimals: c.rewardType === "USDC" ? 6 : 0, maxRecipients: c.maxRecipients, reservedCount: c.reservedCount, remaining: Math.max(0, c.maxRecipients - c.reservedCount), status: c.status, startsAt: c.startsAt.toISOString(), endsAt: c.endsAt.toISOString(), claimDeadline: c.claimDeadline.toISOString(), maxAttempts: c.maxAttempts, configVersion: c.configVersion, config: c.gameConfig, rulesHash: c.rulesHash, chainId: c.chainId, token: c.token, escrow: c.escrow, chainCampaignId: c.chainCampaignId, fundingTx: c.fundingTx, testnet: c.chainId === 10143, policy: "FIRST_N_VERIFIED" as const,
    rewardDisclosure: c.rewardType === "USDC" && c.chainId === 10143 ? "Testnet USDC has no monetary value." : c.rewardType === "COUPON_DEMO" ? "Test coupon. Cannot be redeemed." : c.rewardType === "COUPON" ? "Operator-supplied coupon inventory." : "Circle USDC on Monad." };
}
async function owned(p: Principal, id: string) { const c = await read<Campaign>("campaigns", id); if (!c || c.ownerId !== p.userId) throw new DomainError("NOT_FOUND", "Campaign not found.", 404); return c; }
async function bySlug(slug: string) { const link = await read<{ campaignId: string }>("campaignSlugs", slug); return link ? read<Campaign>("campaigns", link.campaignId) : null; }
const eventContext = (c: Campaign) => c.rewardType === "COUPON_DEMO" ? "demo" : c.chainId === 10143 ? "testnet" : "mainnet";

export async function listPublicCampaigns() { const rows = await collection("campaigns").where("status", "in", ["OPEN", "CLOSED", "REFUNDED"]).orderBy("createdAt", "desc").limit(30).get(); return rows.docs.map(d => publicDto(record<Campaign>(d)!)); }
export async function publicCampaign(slug: string) { const c = await bySlug(slug); if (!c || c.status === "DRAFT") throw new DomainError("NOT_FOUND", "This event is not published.", 404); return publicDto(c); }

export async function createCampaign(p: Principal, raw: unknown) {
  await rateLimit(p.userId, "campaign-create", 10, 3600);
  const input = createCampaignSchema.parse(raw), wallet = requireWallet(p);
  const startsAt = normalizedDate(input.startsAt), endsAt = normalizedDate(input.endsAt), claimDeadline = normalizedDate(input.claimDeadline);
  if (startsAt.getTime() < Date.now() + 60_000 || endsAt <= startsAt || claimDeadline <= endsAt || claimDeadline.getTime() - endsAt.getTime() > 30 * 86400_000 || endsAt.getTime() - startsAt.getTime() > 30 * 86400_000) throw new DomainError("INVALID_PERIOD", "Start at least one minute from now and choose valid event and receipt deadlines within 30 days.");
  if (input.gameType === "QUIZ" && !input.quiz) throw new DomainError("QUIZ_REQUIRED", "Provide exactly three quiz questions.");
  if (input.gameType === "CATCH" && input.quiz) throw new DomainError("INVALID_GAME", "Catch events do not accept quiz answers.");
  const amount = input.rewardType === "USDC" ? parseUnits(input.rewardAmount, 6) : 1n;
  if (amount <= 0n) throw new DomainError("INVALID_REWARD", "Reward amount must be greater than zero.");
  const config = input.rewardType === "USDC" ? chainConfig() : null;
  const secret = input.gameType === "QUIZ" ? { questions: input.quiz!, passScore: input.passScore, commitmentSalt: randomBytes(32).toString("hex") } : null;
  const gameConfig = input.gameType === "CATCH" ? { ...DEFAULT_CATCH, catchPhrase: input.catchPhrase ?? "커피는 잡고 가야지", ...(input.targetImage ? { targetImage: input.targetImage } : {}) } : { questions: input.quiz!.map(q => ({ prompt: q.prompt, options: q.options })), passScore: input.passScore, revealAfter: endsAt.toISOString() };
  const rules = { policy: "FIRST_N_VERIFIED", gameType: input.gameType, gameConfig, secret, rewardType: input.rewardType, rewardAmount: amount.toString(), maxRecipients: input.maxRecipients, startsAt: seconds(startsAt).toString(), endsAt: seconds(endsAt).toString(), claimDeadline: seconds(claimDeadline).toString(), maxAttempts: input.maxAttempts };
  const id = randomUUID();
  const c: Campaign = { id, chainCampaignId: keccak256(toBytes(id)), slug: input.slug, ownerId: p.userId, ownerWallet: wallet, title: input.title, organizer: input.organizer, description: input.description, gameType: input.gameType, rewardType: input.rewardType, rewardAmount: amount.toString(), maxRecipients: input.maxRecipients, reservedCount: 0, status: "DRAFT", startsAt, endsAt, claimDeadline, maxAttempts: input.maxAttempts, configVersion: 1, gameConfig, rulesHash: keccak256(toBytes(JSON.stringify(rules))), signer: config ? signingAccount().address.toLowerCase() : null, chainId: config?.chainId ?? 10143, token: config?.usdc.toLowerCase() ?? null, escrow: config?.escrow.toLowerCase() ?? null, fundingTx: null, fundingBlock: null, refundTx: null, refundBlock: null, createdAt: new Date() };
  await database().runTransaction(async tx => {
    const slug = collection("campaignSlugs").doc(input.slug);
    if ((await tx.get(slug)).exists) throw new DomainError("SLUG_TAKEN", "That event link is already in use.", 409);
    tx.create(slug, { campaignId: id }); tx.create(collection("campaigns").doc(id), c);
    if (secret) tx.create(collection("campaignSecrets").doc(id), secret);
    tx.create(collection("auditLogs").doc(), { actorId: p.userId, campaignId: id, action: "CAMPAIGN_CREATED", properties: { rulesHash: c.rulesHash, gameType: c.gameType, rewardType: c.rewardType }, createdAt: new Date() });
  });
  return publicDto(c);
}
export async function creatorCampaigns(p: Principal) { const rows = await collection("campaigns").where("ownerId", "==", p.userId).orderBy("createdAt", "desc").limit(100).get(); return rows.docs.map(d => publicDto(record<Campaign>(d)!)); }
export async function creatorCampaign(p: Principal, id: string) {
  const c = await owned(p, id);
  const [awards, sessions, coupons, secret] = await Promise.all([collection("awards").where("campaignId", "==", id).get(), collection("gameSessions").where("campaignId", "==", id).count().get(), collection("coupons").where("campaignId", "==", id).get(), read<QuizSecret>("campaignSecrets", id)]);
  const payouts: Record<string, number> = {}, inventory: Record<string, number> = {};
  for (const row of awards.docs) payouts[row.data().status] = (payouts[row.data().status] ?? 0) + 1;
  for (const row of coupons.docs) inventory[row.data().status] = (inventory[row.data().status] ?? 0) + 1;
  return { ...publicDto(c), participants: sessions.data().count, payouts, inventory, totalBudgetAtomic: (BigInt(c.rewardAmount) * BigInt(c.maxRecipients)).toString(), quizAnswers: secret, refundTx: c.refundTx };
}
function sameDeployment(c: Campaign, config: { chainId: number; escrow: string; usdc: string }) { if (c.chainId !== config.chainId || c.escrow !== config.escrow.toLowerCase() || c.token !== config.usdc.toLowerCase()) throw new DomainError("DEPLOYMENT_MISMATCH", "This event belongs to another escrow deployment.", 409); }
export async function getFundingPlan(p: Principal, id: string) {
  const c = await owned(p, id);
  if (c.rewardType !== "USDC" || c.status !== "DRAFT") throw new DomainError("FUNDING_UNAVAILABLE", "Only an unfunded USDC event can be funded.", 409);
  const { config } = await verifyChainConfiguration(); sameDeployment(c, config);
  const budget = BigInt(c.rewardAmount) * BigInt(c.maxRecipients);
  return { chainId: config.chainId, owner: c.ownerWallet, token: config.usdc, escrow: config.escrow, budgetAtomic: budget.toString(), transactions: [{ to: config.usdc, value: "0", data: encodeFunctionData({ abi: usdcAbi, functionName: "approve", args: [config.escrow, budget] }) }, { to: config.escrow, value: "0", data: encodeFunctionData({ abi: escrowAbi, functionName: "createCampaign", args: [c.chainCampaignId as Hex, c.signer as `0x${string}`, BigInt(c.rewardAmount), BigInt(c.maxRecipients), seconds(c.startsAt), seconds(c.endsAt), seconds(c.claimDeadline), c.rulesHash as Hex] }) }] };
}
export async function verifyFunding(p: Principal, id: string, txHash: string) {
  await rateLimit(p.userId, "verify-funding", 30, 60);
  if (!/^0x[0-9a-f]{64}$/i.test(txHash)) throw new DomainError("INVALID_TRANSACTION", "Provide a valid funding transaction.");
  const c = await owned(p, id);
  if (c.fundingTx === txHash && c.status !== "DRAFT") return publicDto(c);
  if (c.rewardType !== "USDC" || c.status !== "DRAFT") throw new DomainError("FUNDING_UNAVAILABLE", "This event cannot accept funding confirmation.", 409);
  const { config, publicClient } = await verifyChainConfiguration(); sameDeployment(c, config);
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hex });
  const finalizedAt = await receiptFinalizedAt(publicClient, receipt, config.confirmations);
  if (receipt.status !== "success" || receipt.to?.toLowerCase() !== c.escrow || receipt.from.toLowerCase() !== c.ownerWallet || finalizedAt === null) throw new DomainError("FUNDING_NOT_CONFIRMED", "Funding is not confirmed yet.", 409);
  const state = await publicClient.readContract({ address: config.escrow, abi: escrowAbi, functionName: "getCampaign", args: [c.chainCampaignId as Hex], blockNumber: finalizedAt });
  const budget = BigInt(c.rewardAmount) * BigInt(c.maxRecipients);
  if (state.owner.toLowerCase() !== c.ownerWallet || state.signer.toLowerCase() !== c.signer || state.token.toLowerCase() !== c.token || state.rewardAmount !== BigInt(c.rewardAmount) || state.maxRecipients !== BigInt(c.maxRecipients) || state.startsAt !== seconds(c.startsAt) || state.endsAt !== seconds(c.endsAt) || state.claimDeadline !== seconds(c.claimDeadline) || state.rulesHash !== c.rulesHash || state.deposited !== budget) throw new DomainError("FUNDING_RULES_MISMATCH", "The deployed budget and rules do not match this event.", 409);
  const matches = receipt.logs.some(log => { if (log.address.toLowerCase() !== c.escrow) return false; try { const e = decodeEventLog({ abi: escrowAbi, eventName: "CampaignFunded", data: log.data, topics: log.topics }); return e.args.campaignId === c.chainCampaignId && e.args.owner.toLowerCase() === c.ownerWallet && e.args.token.toLowerCase() === c.token && e.args.amount === budget; } catch { return false; } });
  if (!matches) throw new DomainError("FUNDING_EVENT_MISMATCH", "The expected deposit is absent from this transaction.", 409);
  const updated = await database().runTransaction(async tx => { const ref = collection("campaigns").doc(id), current = record<Campaign>(await tx.get(ref))!; if (current.ownerId !== p.userId || current.status !== "DRAFT") throw new DomainError("EVENT_CHANGED", "This event has already been published.", 409); const result = { ...current, status: "OPEN" as const, fundingTx: txHash, fundingBlock: receipt.blockNumber.toString() }; tx.set(ref, result); return result; });
  return publicDto(updated);
}
export async function importCoupons(p: Principal, id: string, raw: unknown) {
  const c = await owned(p, id);
  if (c.status !== "DRAFT" || c.rewardType === "USDC") throw new DomainError("INVENTORY_LOCKED", "Only draft coupon events accept inventory.", 409);
  const input = couponImportSchema.parse(raw);
  const coupons: Coupon[] = input.coupons.map(item => { if (new Date(item.expiresAt) <= c.claimDeadline) throw new DomainError("COUPON_EXPIRES_TOO_SOON", "Coupons must remain valid past the receipt deadline."); const hash = couponReferenceHash(item.reference); return { id: hash, campaignId: id, referenceHash: hash, merchant: item.merchant, expiresAt: new Date(item.expiresAt), encryptedPayload: encryptCoupon(id, c.rewardType === "COUPON_DEMO" ? `TEST COUPON — NOT REDEEMABLE\n${item.content}` : item.content), isDemo: c.rewardType === "COUPON_DEMO", status: "AVAILABLE", awardId: null, deliveredAt: null, lastViewedAt: null, createdAt: new Date() }; });
  if (new Set(coupons.map(item => item.id)).size !== coupons.length) throw new DomainError("DUPLICATE_COUPON", "Duplicate coupon references are not allowed.", 409);
  return database().runTransaction(async tx => { const ref = collection("campaigns").doc(id), current = record<Campaign>(await tx.get(ref)); const all = await tx.get(collection("coupons").where("campaignId", "==", id)); const existing = await tx.getAll(...coupons.map(item => collection("coupons").doc(item.id))); if (!current || current.ownerId !== p.userId || current.status !== "DRAFT") throw new DomainError("INVENTORY_LOCKED", "Inventory is locked.", 409); if (all.size + coupons.length > c.maxRecipients) throw new DomainError("TOO_MANY_COUPONS", "Inventory exceeds the fixed reward quantity."); if (existing.some(item => item.exists)) throw new DomainError("DUPLICATE_COUPON", "A coupon reference is already registered.", 409); for (const coupon of coupons) tx.create(collection("coupons").doc(coupon.id), coupon); tx.update(ref, { inventoryCount: all.size + coupons.length }); return { imported: coupons.length, inventory: all.size + coupons.length }; });
}
export async function publishCouponCampaign(p: Principal, id: string) {
  const c = await database().runTransaction(async tx => { const ref = collection("campaigns").doc(id), current = record<Campaign>(await tx.get(ref)); const inventory = await tx.get(collection("coupons").where("campaignId", "==", id).where("status", "==", "AVAILABLE")); if (!current || current.ownerId !== p.userId) throw new DomainError("NOT_FOUND", "Campaign not found.", 404); if (current.status !== "DRAFT" || current.rewardType === "USDC") throw new DomainError("PUBLISH_UNAVAILABLE", "This event cannot be published this way.", 409); if (inventory.size !== current.maxRecipients) throw new DomainError("INVENTORY_REQUIRED", "Import the full promised coupon quantity before publishing.", 409); tx.update(ref, { status: "OPEN" }); return { ...current, status: "OPEN" as const }; }); return publicDto(c);
}
export async function createGameSession(p: Principal, slug: string) {
  const wallet = requireWallet(p); await rateLimit(p.userId, "game-session", 10, 60);
  const found = await bySlug(slug); if (!found) throw new DomainError("NOT_FOUND", "Event not found.", 404);
  return database().runTransaction(async tx => {
    const c = record<Campaign>(await tx.get(collection("campaigns").doc(found.id)))!;
    const claims = collection("campaigns").doc(c.id).collection("claims"), attemptsRef = collection("campaigns").doc(c.id).collection("attempts").doc(privateKey(p.userId));
    const [accountClaim, walletClaim, attempts] = await tx.getAll(claims.doc(`u-${privateKey(p.userId)}`), claims.doc(`w-${wallet}`), attemptsRef);
    const now = new Date();
    if (c.status !== "OPEN" || now < c.startsAt || now >= c.endsAt) throw new DomainError("EVENT_UNAVAILABLE", "This event is not accepting attempts.", 409);
    if (c.reservedCount >= c.maxRecipients) throw new DomainError("SOLD_OUT", "All rewards have been reserved.", 409);
    if (accountClaim.exists || walletClaim.exists) throw new DomainError("ALREADY_REWARDED", "This account or wallet already has a reward.", 409);
    const count = Number(attempts.data()?.count ?? 0); if (count >= c.maxAttempts) throw new DomainError("ATTEMPTS_EXHAUSTED", "You have used this event's allowed attempts.", 409);
    const session: GameSession = { id: randomUUID(), userId: p.userId, campaignId: c.id, nonce: randomBytes(24).toString("hex"), seed: randomBytes(16).toString("hex"), configVersion: c.configVersion, startsAt: now, expiresAt: new Date(Math.min(now.getTime() + (c.gameType === "CATCH" ? DEFAULT_CATCH.durationMs + 10_000 : 120_000), c.endsAt.getTime())), submittedAt: null, passed: null, failureCode: null };
    tx.set(attemptsRef, { count: count + 1 }); tx.create(collection("gameSessions").doc(session.id), session);
    tx.create(collection("analyticsEvents").doc(), { name: "game_started", campaignId: c.id, context: eventContext(c), properties: { gameType: c.gameType }, createdAt: now });
    return { id: session.id, nonce: session.nonce, seed: session.seed, gameType: c.gameType, startsAt: session.startsAt.toISOString(), expiresAt: session.expiresAt.toISOString(), configVersion: session.configVersion, config: c.gameConfig };
  });
}
export function newPayoutJob(awardId: string): PayoutJob { return { id: awardId, awardId, attempts: 0, availableAt: new Date(), leasedUntil: null, leaseOwner: null, completedAt: null, serializedTx: null, txHash: null, nonce: null, relayer: null, chainId: null, lastError: null, txHistory: [], preparedAt: null, maxFeePerGas: null, maxPriorityFeePerGas: null, createdAt: new Date() }; }
export async function submitGameSession(p: Principal, sessionId: string, raw: unknown) {
  const recipient = requireWallet(p); await rateLimit(p.userId, "game-submit", 15, 60);
  const privacy = required("PARTICIPANT_NULLIFIER_SECRET"); if (privacy.length < 32) throw new DomainError("INVALID_NULLIFIER_SECRET", "Campaign privacy configuration is invalid.", 503);
  return database().runTransaction(async tx => {
    const sessionRef = collection("gameSessions").doc(sessionId), session = record<GameSession>(await tx.get(sessionRef));
    if (!session || session.userId !== p.userId) throw new DomainError("NOT_FOUND", "Attempt not found.", 404);
    if (session.submittedAt) throw new DomainError("SESSION_ALREADY_USED", "This attempt has already been checked.", 409);
    const campaignRef = collection("campaigns").doc(session.campaignId), c = record<Campaign>(await tx.get(campaignRef))!;
    const input = c.gameType === "CATCH" ? catchSubmissionSchema.parse(raw) : quizSubmissionSchema.parse(raw);
    if (input.nonce !== session.nonce) throw new DomainError("SESSION_MISMATCH", "This attempt could not be verified.", 403);
    const claims = campaignRef.collection("claims"), accountRef = claims.doc(`u-${privateKey(p.userId)}`), walletRef = claims.doc(`w-${recipient}`);
    const [accountClaim, walletClaim] = await tx.getAll(accountRef, walletRef);
    const previousId = accountClaim.data()?.awardId ?? walletClaim.data()?.awardId;
    const previous = previousId ? record<Award>(await tx.get(collection("awards").doc(previousId))) : null;
    const secret = c.gameType === "QUIZ" ? record<QuizSecret>(await tx.get(collection("campaignSecrets").doc(c.id))) : null;
    const inventory = c.rewardType === "USDC" ? null : await tx.get(collection("coupons").where("campaignId", "==", c.id).where("status", "==", "AVAILABLE").orderBy("createdAt").limit(1));
    const now = new Date(); let passed = false, reason: string | null = null;
    if (now > session.expiresAt || c.status !== "OPEN" || now < c.startsAt || now >= c.endsAt || session.configVersion !== c.configVersion) reason = "ATTEMPT_EXPIRED";
    else if (c.gameType === "CATCH") { const result = verifyCatch(c.gameConfig as CatchConfig, session.seed, input as CatchInput, now.getTime() - session.startsAt.getTime()); passed = result.passed; reason = result.reason ?? null; }
    else { if (!secret) throw new DomainError("QUIZ_UNAVAILABLE", "Quiz grading is unavailable.", 503); passed = now.getTime() - session.startsAt.getTime() >= 2000 && secret.questions.filter((q, i) => q.correctIndex === (input as z.infer<typeof quizSubmissionSchema>).answers[i]).length >= secret.passScore; if (!passed) reason = "QUIZ_NOT_PASSED"; }
    tx.update(sessionRef, { submittedAt: now, passed, failureCode: reason });
    tx.create(collection("qualifications").doc(session.id), { campaignId: c.id, userId: p.userId, sessionId: session.id, verifiedAt: now, passed });
    if (!passed) return { outcome: "NOT_QUALIFIED" as const, reason, award: null };
    if (accountClaim.exists || walletClaim.exists) return { outcome: "ALREADY_REWARDED" as const, award: { id: previousId as string, status: previous?.status ?? "QUEUED" } };
    const coupon = inventory?.docs[0] ? record<Coupon>(inventory.docs[0]) : null;
    if (c.reservedCount >= c.maxRecipients || (c.rewardType !== "USDC" && (!coupon || coupon.expiresAt <= c.claimDeadline))) return { outcome: "SOLD_OUT" as const, award: null };
    const id = randomUUID(); const award: Award = { id, rewardId: keccak256(toBytes(id)), campaignId: c.id, userId: p.userId, qualificationId: session.id, slotIndex: c.reservedCount, recipient, participantNullifier: `0x${createHmac("sha256", privacy).update(`DROP:v1:${c.chainCampaignId}:${p.privyId}`).digest("hex")}`, amount: c.rewardAmount, status: "QUEUED", qualifiedAt: now, deadline: c.claimDeadline, txHash: null, confirmedBlock: null, confirmedAt: null, lastError: null, proof: null, signature: null, couponId: coupon?.id ?? null, createdAt: now };
    tx.create(collection("awards").doc(id), award); tx.create(collection("payoutJobs").doc(id), newPayoutJob(id)); tx.create(accountRef, { awardId: id }); tx.create(walletRef, { awardId: id }); tx.create(claims.doc(`s-${award.slotIndex}`), { awardId: id }); tx.create(claims.doc(`n-${award.participantNullifier}`), { awardId: id }); tx.update(campaignRef, { reservedCount: c.reservedCount + 1 });
    if (coupon) tx.update(collection("coupons").doc(coupon.id), { awardId: id, status: "RESERVED" });
    tx.create(collection("auditLogs").doc(), { actorId: p.userId, campaignId: c.id, action: "AWARD_RESERVED", properties: { awardId: id, slotIndex: award.slotIndex, rewardId: award.rewardId }, createdAt: now });
    tx.create(collection("analyticsEvents").doc(), { name: "reward_queued", campaignId: c.id, context: eventContext(c), properties: { gameType: c.gameType, rewardType: c.rewardType }, createdAt: now });
    return { outcome: "QUEUED" as const, award: { id, status: award.status, rewardType: c.rewardType } };
  });
}
export async function listRewards(p: Principal) {
  const rows = await collection("awards").where("userId", "==", p.userId).orderBy("createdAt", "desc").limit(100).get();
  return Promise.all(rows.docs.map(async row => { const a = record<Award>(row)!, c = await read<Campaign>("campaigns", a.campaignId), coupon = a.couponId ? await read<Coupon>("coupons", a.couponId) : null; if (!c) throw new DomainError("EVENT_UNAVAILABLE", "Reward details are unavailable.", 503); return { id: a.id, status: a.status, rewardId: a.rewardId, campaign: publicDto(c), amountAtomic: a.amount, recipient: a.recipient, txHash: a.txHash, confirmedAt: a.confirmedAt?.toISOString() ?? null, deadline: a.deadline.toISOString(), lastError: a.lastError, coupon: coupon ? { merchant: coupon.merchant, expiresAt: coupon.expiresAt.toISOString(), isDemo: coupon.isDemo, status: coupon.status, deliveredAt: coupon.deliveredAt?.toISOString() ?? null } : null }; }));
}
export async function getWalletOverview(p: Principal) { const wallet = requireWallet(p), balance = await walletBalance(wallet); return { wallet, balanceAtomic: balance.amountAtomic, decimals: balance.decimals, chainId: balance.chainId, token: balance.token, testnet: balance.testnet }; }
export async function revealCoupon(p: Principal, awardId: string) { await rateLimit(p.userId, "coupon-reveal", 20, 60); const a = await read<Award>("awards", awardId), coupon = a?.couponId ? await read<Coupon>("coupons", a.couponId) : null; if (!a || a.userId !== p.userId || a.status !== "DELIVERED" || !coupon || coupon.status !== "DELIVERED" || coupon.awardId !== a.id) throw new DomainError("NOT_FOUND", "This coupon is unavailable for your account.", 404); const content = decryptCoupon(a.campaignId, coupon.encryptedPayload); await collection("coupons").doc(coupon.id).update({ lastViewedAt: new Date() }); return { content, merchant: coupon.merchant, expiresAt: coupon.expiresAt.toISOString(), isDemo: coupon.isDemo, redemptionStatus: "UNVERIFIED" as const }; }
export async function queueReward(p: Principal, awardId: string) { await rateLimit(p.userId, "reward-retry", 5, 60); return database().runTransaction(async tx => { const a = record<Award>(await tx.get(collection("awards").doc(awardId))), ref = collection("payoutJobs").doc(awardId), job = record<PayoutJob>(await tx.get(ref)); if (!a || a.userId !== p.userId) throw new DomainError("NOT_FOUND", "Reward not found.", 404); if (a.status === "CONFIRMED" || a.status === "DELIVERED") return { id: a.id, status: a.status }; if (!job || job.completedAt || (a.deadline.getTime() <= Date.now() && !job.txHash)) throw new DomainError("REWARD_EXPIRED", "This reward is no longer payable.", 409); tx.update(ref, { availableAt: new Date() }); return { id: a.id, status: a.status }; }); }
export async function getRewardProof(p: Principal, awardId: string) { const a = await read<Award>("awards", awardId); if (!a || a.userId !== p.userId || !a.proof || !a.signature) throw new DomainError("PROOF_UNAVAILABLE", "The durable reward authorization is not available yet.", 409); const c = await read<Campaign>("campaigns", a.campaignId); if (!c || c.rewardType !== "USDC") throw new DomainError("PROOF_UNAVAILABLE", "No on-chain authorization exists for this reward.", 409); return { chainId: c.chainId, escrow: c.escrow, proof: a.proof, signature: a.signature, gasDisclosure: "Manual recovery requires MON gas. The recipient is fixed and cannot be changed." }; }
export async function getRefundPlan(p: Principal, id: string) { const c = await owned(p, id); if (c.rewardType !== "USDC" || !c.fundingTx || new Date() <= c.claimDeadline) throw new DomainError("REFUND_TOO_EARLY", "Unused funds are recoverable only after the receipt deadline.", 409); const { config } = await verifyChainConfiguration(); sameDeployment(c, config); return { chainId: c.chainId, owner: c.ownerWallet, to: config.escrow, value: "0", data: encodeFunctionData({ abi: escrowAbi, functionName: "refund", args: [c.chainCampaignId as Hex] }) }; }
export async function verifyRefund(p: Principal, id: string, txHash: string) {
  const c = await owned(p, id);
  if (!/^0x[0-9a-f]{64}$/i.test(txHash)) throw new DomainError("INVALID_TRANSACTION", "Provide a valid refund transaction.");
  if (c.refundTx === txHash) return publicDto(c);
  const { config, publicClient } = chainClients(); sameDeployment(c, config);
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hex });
  const finalizedAt = await receiptFinalizedAt(publicClient, receipt, config.confirmations);
  if (receipt.status !== "success" || receipt.from.toLowerCase() !== c.ownerWallet || finalizedAt === null) throw new DomainError("REFUND_NOT_CONFIRMED", "Recovery has not been confirmed.", 409);
  const state = await publicClient.readContract({ address: config.escrow, abi: escrowAbi, functionName: "getCampaign", args: [c.chainCampaignId as Hex], blockNumber: finalizedAt });
  const matches = receipt.logs.some(log => { if (log.address.toLowerCase() !== c.escrow) return false; try { const e = decodeEventLog({ abi: escrowAbi, eventName: "CampaignRefunded", data: log.data, topics: log.topics }); return e.args.campaignId === c.chainCampaignId && e.args.owner.toLowerCase() === c.ownerWallet && e.args.token.toLowerCase() === c.token && e.args.amount === state.refunded; } catch { return false; } });
  if (!matches || state.paid + state.refunded !== state.deposited) throw new DomainError("REFUND_EVENT_MISMATCH", "The expected recovery settlement could not be verified.", 409);
  // Update only settlement fields; never overwrite a more recent reservation counter
  // or campaign audit metadata with the pre-RPC snapshot.
  const updated = await database().runTransaction(async tx => {
    const ref = collection("campaigns").doc(id), current = record<Campaign>(await tx.get(ref));
    if (!current || current.ownerId !== p.userId) throw new DomainError("NOT_FOUND", "Campaign not found.", 404);
    tx.update(ref, { status: "REFUNDED", refundTx: txHash, refundBlock: receipt.blockNumber.toString() });
    return { ...current, status: "REFUNDED" as const, refundTx: txHash, refundBlock: receipt.blockNumber.toString() };
  });
  return publicDto(updated);
}
export async function quizReveal(slug: string) { const c = await bySlug(slug); if (!c || c.status === "DRAFT" || c.gameType !== "QUIZ") throw new DomainError("NOT_FOUND", "Quiz not found.", 404); if (new Date() < c.endsAt) throw new DomainError("ANSWERS_NOT_RELEASED", "Answers are released after this event ends.", 403); return { rulesHash: c.rulesHash, answers: await read<QuizSecret>("campaignSecrets", c.id) }; }
export function getIntegrationStatus() { const configured = (names: string[]) => names.every(name => Boolean(process.env[name]?.trim())); return { authentication: configured(["NEXT_PUBLIC_PRIVY_APP_ID", "PRIVY_APP_SECRET"]), database: configured(["FIREBASE_PROJECT_ID"]) && (Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) || Boolean(process.env.K_SERVICE) || Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.DROP_LOCAL_EMULATOR === "true")), escrow: configured(["DROP_ESCROW_ADDRESS"]), authorization: configured(["DROP_AUTHORIZATION_PRIVATE_KEY", "PARTICIPANT_NULLIFIER_SECRET"]), relayer: configured(["DROP_RELAYER_PRIVATE_KEY"]), coupons: configured(["COUPON_ENCRYPTION_KEY"]), gasSponsorship: process.env.NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED === "true", chainId: Number(process.env.DROP_CHAIN_ID ?? 10143), mode: process.env.DROP_ENABLE_MAINNET === "true" && process.env.DROP_CHAIN_ID === "143" ? "mainnet" : "testnet", demoFallback: false }; }
