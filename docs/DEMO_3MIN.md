# DROP technical demo — maximum 3 minutes

**Status: script and recording checklist. No recorded/uploaded video URL is supplied.** Record only the real deployed product after the gates below pass. A local browser walkthrough cannot be labelled a Monad deployment.

The ≤3-minute limit, YouTube/Loom/Vimeo hosts and working-product requirement were originally user-supplied and are now independently confirmed on the authenticated official [Consumer Products & Payments page](https://hackathon.monad.xyz/tracks/consumer-payments). A code/slides-only demonstration does not qualify. The deadline is 2026-10-14 12:59 GMT+9 / Asia/Seoul. Contest submission remains on the user's explicit hold; no portal values or uploads were changed. See [OFFICIAL_SOURCES.md](OFFICIAL_SOURCES.md).

## Before recording

- Record commit, public app URL, mode, chain ID, escrow address, official token address, and verified deposit/payout/reclaim transaction receipts in DEPLOYMENT.md.
- Use a new recipient account with no prior Monad wallet. Configure real Telegram OAuth or email OTP, embedded wallet creation, and allowed origins/redirects. Hide inbox details and credentials.
- Provide limited, sufficient authorized testnet USDC/MON budget for both games and retries. Testnet labels remain visible. Never show testnet USDC as dollars paid in real life.
- Prepare a real, separately expired campaign for reclaim; do not alter time on a normal funded campaign to imitate expiry.
- Prepare a permitted same-network test recipient for outgoing transfer; obtain user approval. Confirm sponsorship works with an empty-MON embedded wallet.
- Prepare a demo coupon with unmistakable “test coupon — cannot redeem” copy unless authorized real stock exists. Do not expose real coupon contents in a public video.
- Confirm the Vercel app and a durable payout/retry/reconciliation processor compatible with the no-billing-upgrade instruction are actually running; auth works from a clean session and receipts survive re-login. Firestore database/rules/indexes are deployed, but Functions cannot deploy on the current Spark plan. Its source/build and local tests are not a cloud processor. Do not upgrade billing to fill this shot.
- Rehearse an interrupted worker or duplicate trigger safely: the persisted lease and fixed award identity must recover without a second payout. A request finishing on Vercel must not abandon the Firestore outbox job.

If a gate is missing, the corresponding shot is **not ready**. Fix/configure it; do not replace it with a simulated success.

Engineering evidence now includes 42 escrow unit/fuzz tests + two invariant properties, 61 server tests, 30 anonymous Chromium checks / six profile skips, clean install/lint/typecheck/builds and two actual local Anvil/Firestore/worker settlement cases. The latter uses chain31337, a mock token and fixture identities; local time advancement for refund is a test, never a public-demo shortcut. Real Testnet network/token reads and cloud Firestore configuration are confirmed. None replaces a shot requiring hosted login or public Monad funding, receipt, transfer and genuine expired reclaim.

## Shot list and English narration

| Time | Actual product shot | Narration / point to demonstrate |
| --- | --- | --- |
| 0:00–0:20 | Mobile `/d/[slug]` showing organizer, reward, fixed rule, quantity, end/claim times, testnet label, funded status | “DROP turns a community reward into a short game and a funded payout. This event pays the first verified accounts that finish the game. The amount, limit, and deadline are fixed before it opens. This demonstration uses Monad Testnet; these tokens have no financial value.” |
| 0:20–1:00 | One authentication, catch game, server result, live queued/submitted/confirmed progression, recipient receipt | “I join with Telegram or email. I do not install a wallet or buy gas. Catching the third target starts verification; it does not mean payment is complete. The server reserves an award, the relayer submits it, and the escrow pays this recipient. Now the receipt is confirmed.” |
| 1:00–1:30 | `/me/rewards`, actual balance, short re-login proof if time permits, confirmed user-approved outgoing USDC transaction | “The reward stays in my account. I can see its details and choose to send it on the same network. I check the address, amount, and cost before approving. Receiving a reward and sending it are separate actions.” |
| 1:30–1:55 | Real quiz questions and server result; authenticated coupon detail with visible demo warning | “The same award engine also serves a three-question quiz. Answers are checked on the server. This coupon is a non-redeemable test coupon. Real coffee delivery requires authorized operator stock; automatic supplier issuance is future work.” |
| 1:55–2:25 | `/dashboard/[id]`: actual funding/deposit detail, Firestore-persisted allocated slots, confirmed/failed jobs, verified processor recovery/reconciliation and remaining budget | “The operator funds the campaign before sharing. This view distinguishes reserved rewards from confirmed payouts and shows failures to recover. Rules cannot be silently changed after publication. Retry jobs keep the same award identity.” |
| 2:25–2:50 | Actual duplicate-rejection response **or** actual reclaim receipt for separately expired campaign | “An account and recipient wallet cannot receive twice in one campaign. Unclaimed budget can return to the original operator only after the claim deadline. The contract enforces these limits; the server still decides valid game results.” |
| 2:50–3:00 | Product screen, `/judges` link, plain limitation footnote | “Playful rewards, real payout controls. Try both games and inspect the evidence from the judge guide. Our server verification is not proof of a unique human, and this contract has not received an external audit.” |

The narration is a draft. Replace claims only with demonstrated current behavior. Use a natural recorded pace and cut words if the measured duration exceeds 3:00. Show the actual product throughout; slides, source code, and architecture explanations cannot replace the core flow.

## Recording and publishing checks

Use real normal-speed interaction for the core flow. Cuts to remove idle waiting are acceptable only when marked so they do not imply a measured end-to-end latency. Keep network and mode labels legible at mobile resolution. Blur email addresses, private identifiers, test credentials, account tokens, private keys, and real coupon secrets. Onchain recipient addresses and hashes are public but should not disclose unrelated accounts.

Record actual duration from the exported file, file metadata, host availability, unauthenticated video playback, and link accessibility. Save the final URL in SUBMISSION_CHECKLIST.md. A prepared script, local video file, and successfully uploaded accessible video are three different completion states.

| Artifact | Current evidence |
| --- | --- |
| Final video file | None supplied |
| Measured duration ≤ 3:00 | Not measured |
| YouTube/Loom/Vimeo URL | None supplied |
| Unauthenticated playback | Not verified |
