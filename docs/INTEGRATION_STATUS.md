# DROP integration status

Snapshot: **2026-10-13 (Asia/Seoul)**. The selected architecture is Vercel + Firebase Firestore/Functions + Privy + Monad Testnet. **The full product and submission are not yet verified complete.** Source code, local fixtures, configured flags, external service support and actual hosted behavior are different evidence levels.

The user-confirmed cloud project is **`drop-5a400`**, display **DROP**, on **Spark (free)**. Its `(default)` Firestore database is confirmed in `asia-northeast3`, Standard edition / Native mode, and reviewed rules/indexes were successfully deployed. **No billing upgrade is currently authorized; do not upgrade without a new owner instruction.** Firebase Functions cloud processing is blocked under this plan; neither the emulator nor a Vercel homepage supplies the missing durable payout service.

**The user explicitly instructs that the contest must not be submitted yet.** Authenticated portal research is read-only. The portal header displays **2026-10-14 12:59 GMT+9**, with timezone **Asia/Seoul**; the date-only public “Oct 13” label is not the local deadline.

## Integration matrix

| Component | Current evidence | Status / next required action |
| --- | --- | --- |
| Next.js web | Final rebuild/typecheck/lint/locked install passed; local production home/judges200 and OG200 PNG1200×630 / 49,610 bytes, pixels inspected | **Local runtime/build verified.** Hosted Vercel URL, actual authentication and real-device QA remain incomplete. No published-campaign OG-title fixture claimed. |
| Browser UI/API | Final Playwright run: 30 passed, six intentional profile skips, exit 0 in 45.5s | **Anonymous/practice coverage verified locally.** Desktop/mobile Chromium, keyboard/touch, 18-second expiry, creator validation, KO/EN persistence, four widths and anonymous privacy/auth checks; no real auth/live receipt coverage. |
| Firestore runtime | Real CLI 15.33.0 / Firestore emulator 1.22.0 / Java 21, Hub/data response and live process verified; every listener loopback | **Local emulator ready.** Synthetic `demo-drop`, port 8089; this is not a cloud project. |
| Firestore transactions/guards | Final Vitest: 61 passing tests in seven files, including 20 actual emulator cases; current assertions inspected | **Local data scope verified.** Last-slot/coupon/outbox contention, duplicate account/wallet, lease fencing, persistent rate limits and recovery exercised. Blockchain responses mocked; cloud app IAM/access still unverified. |
| Privy token verification | Actual SDK checks ephemeral ES256 JWT signatures, issuer, audience, expiry and manipulation in the passing suite | **Local cryptographic checks verified.** No genuine Privy-issued account/token or live provider login claimed. |
| Privy Telegram/email | Source/config hooks and provider documented; one login/wallet architecture | **Live setup pending.** Owner app ID/secret, allowed origins/redirects and actual OAuth/OTP delivery needed. No Mini App seamless login. |
| Embedded wallet | Source connects Privy wallet; creation requirement documented | **Live wallet creation/re-login unverified.** Direct OAuth/email methods require explicit creation handling; do not infer it from modal-only automatic configuration. |
| Escrow contract | Hash-matched current source/ABI and recorded official Forge 1.8.5 Monad run: 42 unit/fuzz + two invariant properties, no failures/skips | **Local contract scope verified.** Live escrow deployment, actual funding and receipts incomplete. Not externally audited. |
| Official USDC / network | Circle source/allowlist plus actual read-only testnet run: chain 10143, official token code, six decimals, finalized block 70687560 | **Network/token scope verified.** `escrowVerified: false`; no deployed DROP escrow, funding or payout inferred. |
| Durable payout worker | Passing chain-mocked Firestore cases plus two separate actual Anvil/Firestore cases using production RPC/signing/receipt/worker methods | **Integrated local settlement verified.** Actual local deposits/payout balances/events, broadcast→mined restart with zero extra transaction, stale lease and refund exercised. Chain31337/local mock token only; public Monad settlement/cloud processing incomplete. |
| Firebase Functions | Node 22 source/config and passing build; `rewardCreated`, one-minute `retryRewards`, ten-minute `reconcileRewards` | **Source/build verified; cloud deployment blocked.** Functions requires Blaze, while `drop-5a400` remains Spark under the no-upgrade instruction. No paid scheduler or cloud processor activated. |
| Firebase cloud data | CLI confirms `(default)`, Standard / Native, `asia-northeast3`, creation 2026-10-13T13:01:16.609278Z; rules/indexes deploy exit 0 | **Database/config deployment verified.** Rules compiled/uploaded/released; indexes deployed. Actual Vercel identity, IAM and application reads/writes still unverified. |
| User-approved USDC transfer | Client uses Privy `sponsor: true`; UI is gated by an explicit flag | **Live integration pending.** TEE execution, app-pays sponsorship, Monad Testnet, allowed client transactions and sponsorship funding required; zero-MON send/cancel/receipt must be tested. |
| Coupons | Encrypted authorized-inventory/delivery source and real-emulator access/concurrency checks | **Local mechanism exercised.** No real authorized supplier stock/issuance/redemption proof supplied. Demo coupons remain non-redeemable. |
| Giftishow automation | Vendor reference retained; commercial body/approved credentials not verified | **P1 deferred.** No guessed endpoint, sandbox or API approval; no automatic USDC-to-coffee conversion. |
| Vercel deployment | `vercel.json` and source target Next.js / locked install / direct build | **Hosted deployment pending.** Actual owner project, private variables, preview/production URL and precise Privy origins unverified. |
| Judge/submit artifacts | Product docs, blank study forms, distribution hypotheses, draft demo/pitch; two original temporary PNGs decoded/pixel-inspected under 3 MB | **Incomplete; submission on explicit hold.** Actual hosted game/payout, independent users, videos and final accessible source absent. No portal submission/accepted receipt claimed. |

## Local evidence and limits

The current local web homepage response and Firestore Hub/Java process were inspected. Re-running the Windows emulator start script reused its live process, and all Node/Java listeners were `127.0.0.1`. The ignored `.local/firestore-test.env` contains only synthetic emulator/project settings. No cloud credential is needed for these tests.

The final **61 passing server tests across seven files** include genuine SDK verification of test-generated signatures and **20 actual Firestore persistence/concurrency cases**. The separate focused audit also passed 14 RPC unit and 20 emulator cases; it overlaps the full suite and is not an additional 34 unique tests. Test-generated keys/tokens are not live Privy authorization. The database integration source mocks RPC/chain adapters and test transaction data; those are fixtures, never presented as public transaction hashes or explorer proof.

Final Playwright execution passed **30 checks with six intentional profile skips** across desktop and touch-enabled mobile Chromium. The skips avoid duplicating desktop-only width/keyboard checks and mobile-only touch checks in the wrong profile. This proves local unpaid practice/anonymous boundaries and responsive UI behaviors, not real Telegram/email login, iOS Safari, Telegram's actual browser or a paid campaign flow. Screenshots are local QA artifacts, not user-study or hosted-product evidence.

The separate opt-in [Anvil/worker integration](LOCAL_CHAIN_VERIFICATION.md) passed **two cases in 62.72s**, using actual chain/receipt calls and the production worker rather than mocked responses. The inspected ignored run record is completed, source-hash matched, with two winners/one sold-out, two paid events, recipient balances 1,000,000 atomic units each, no added relayer transaction after mined-restart recovery or completed retries, and a 2,000,000-unit refund after local test-time advancement. This is isolated chain 31337 / mock token / fixture identities. It does not validate real Privy authorization, actual Circle USDC, public Monad consensus or cloud scheduling.

Frozen installation, clean lint, TypeScript, Functions build and the final Next production rebuild passed. The local production Open Graph endpoint returned actual HTTP 200 / PNG, 49,610 bytes, 1200×630 and its pixels were inspected. Production home/judges returned200; status200 and anonymous rewards/coupon401 carried private/no-store caching. No published-campaign title or actual login was inferred. A real read-only RPC run returned chain `10143`, official USDC bytecode/six decimals and finalized block `70687560`, explicitly without an escrow. Cloud Firestore configuration deployment exited 0 for rules/indexes only; it did not deploy Functions, alter billing or verify a Vercel application's data credentials.

[contracts/verification.json](../contracts/verification.json) records **42 unit/fuzz tests plus two invariant properties** with Forge 1.8.5, Solidity 0.8.28, OpenZeppelin 5.6.1 and Monad execution settings. Current contract/ABI hashes were compared successfully. These local test token fixtures do not prove official Circle USDC paid on a live network.

## Configuration is not connectivity

`/api/status` returns non-secret configuration availability booleans and `demoFallback: false`. It does not prove cloud credentials work, an escrow is deployed, a worker is running, or native sponsorship succeeded. Use actual signed-in behavior, chain reads, confirmed receipts/events, Firestore transactions and Functions observations for those claims.

Missing integration settings fail explicitly. The app must not turn missing Firebase/Privy/RPC into fake accounts, balances, payouts or automatically simulated data. Hosted Vercel execution rejects local emulator configuration. Mainnet remains disabled and unverified.

## Release and submission gates still open

- Actual hosted preview/production checks and any revalidation required after later source changes. Locked install/lint/typecheck/builds, local production responses and stated local test scopes now have passing evidence.
- Actual cloud application IAM/server connection and a verified durable processor compatible with the no-billing-upgrade instruction. Database/region/rules/indexes are confirmed; prepared Functions cannot deploy on current Spark.
- Actual Vercel URL, real Privy Telegram/email login, embedded wallet persistence and zero-MON approved transfer.
- Approved Monad Testnet deployer/budget, real verified escrow and deposit/payout/reclaim/transfer receipts.
- Five independent participant sessions, real operator interviews/reuse, authorized inventory if claiming real coffee.
- Recorded accessible ≤3-minute technical demo and ≤2-minute pitch, final public source commit and signed-out judge access. Temporary raster logos already exist and were inspected. Contest submission remains on the user's explicit hold; do not fill/save/upload/submit now.

Use [DEPLOYMENT.md](DEPLOYMENT.md) for setup boundaries and [REQUIREMENTS_AUDIT.md](REQUIREMENTS_AUDIT.md) / [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for requirement-level evidence. No partner, user result, live receipt, hosting URL, account identity or accepted application is invented to close these gates.
