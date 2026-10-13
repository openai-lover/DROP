# DROP requirements and completion audit

**Final submission:** Consumer Products & Payments + **Privy** is **READY FOR JUDGING**, re-submission confirmed `2026-10-13T16:57:26.785Z` (Oct14 01:57 KST); portal Save16:56UTC7/7. Initial primary confirmation: `2026-10-13T16:39:30.988Z`. Required Privy integration description:1,808characters. Separate optional Privy video omitted. Actual wallet creation/creator contract transactions are verified; DROP pays receiving gas through its own relayer, not Privy sponsorship. `acf5b73` is the deployed app baseline; same-human technical accounts are not traction.

Scope: the original 18-section brief, Consumer Products & Payments product, public source and submission artifacts. **Current update: 2026-10-14.** Public application baseline acf5b73 and production are READY; real Privy/Google, WIF Firestore, actual creator funding and one 0.1 test USDC quiz payout/receipt are verified. Refresh and sign-out/re-login retained Paid; duplicate participation was blocked. The separate20-slot catch judge event is actually funded. [Current evidence](INTEGRATION_STATUS.md), [payment proof](../contracts/deployment/live-participant-payment.public.json), [judge funding](../contracts/deployment/judge-event-funding.public.json).

The user now authorizes final submission after readiness, superseding the initial hold. Portal **6/6** progress was saved at2026-10-13 16:29UTC; primary Consumer submission is confirmed READY FOR JUDGING. Final155.32s demo and107.94s pitch are uploaded Unlisted and sampled watch playback succeeded; signed-out verification is not claimed. Independent research/traction remains absent. The technical accounts are controlled by one human. No billing upgrade/mainnet is authorized.

The deployed free architecture is Vercel Hobby + Firestore/Spark + bounded request-assisted processing with persistent outbox/leases/nonces and capped daily recovery. Request processing executed the live quiz payment; daily invocation/live outage recovery is unverified. Optional Functions source is undeployed on Spark. Latest recorded local tests are96server/language plus3wallet-request tests;26actual emulator cases use explicit chain mocks, alongside42contract unit/fuzz+2invariants and2actual isolated Anvil/Firestore cases. Earlier browser suites and all detailed matrices/logs below are **historical baseline evidence**, not current missing-integration assertions. Later facts supersede their old unset/403/hold statuses without rewriting the executed runs.

The authenticated portal deadline is **2026-10-14 at 12:59 GMT+9 (Asia/Seoul)**. Its official weights are Technical Execution 20%, Design & Craft 20%, Originality & Track Insight 15%, Founder & Market Readiness 25%, and Traction & Path Forward 20%. These now have independent official-page evidence; their earlier user-provided provenance remains recorded in [OFFICIAL_SOURCES.md](OFFICIAL_SOURCES.md).

## Evidence rules

Use `verified`, `incomplete`, `unverified`, or `deferred` for each item. Verified means current evidence proves the named requirement at its full scope. Link a path/run/receipt, command, commit, date and mode. Tests prove only the behaviors they actually exercise; contract tests are not Privy/browser/real-device checks, and browser mocks are not real chain settlement. State skips and limitations.

`deferred` is valid only for explicitly P1/P2 features. An external prerequisite does not redefine P0 or mandatory submission artifacts as optional. Update this file after implementation and each material verification run.

## Historical baseline: original-section coverage

| Brief section | Requirement retained | Authoritative evidence to inspect | Recorded baseline status |
| --- | --- | --- | --- |
| 1. Product | KOL/operator rewards; play → real payout; no pivot to gifting, crowdfunding, exchange, launchpad or generic quests | PRODUCT.md and rendered complete participant/operator routes | Scope retained; local and public hosted anonymous/practice UI verified; real authenticated payout incomplete |
| 2. Entry/priorities | Requested Consumer Products & Payments; consumer-led demo; matching official weights; P0 before P1/P2; honest Social-fit limitation | Official track, PRODUCT.md, submission fields, feature code, scripts | Official rubric/requirements and existing Consumer selection verified read-only; submission remains on explicit hold |
| 3. Official docs | Read current primary docs; preserve stricter supplied private requirements; never invent access | OFFICIAL_SOURCES.md and deployed version/network checks | Source ledger verified; inaccessible sources explicitly recorded |
| 4. Telegram | Independent HTTPS web; no Mini App/SDK/initData/web_app/startapp/redirect evasion; no spam | Source search, rendered links, auth provider configuration | Architecture/source retained; real Telegram OAuth and actual in-app browser incomplete |
| 5. Stack/network | Next/TS/Tailwind on Vercel, Firestore transactions/guards/outbox, Firebase Functions processing, Solidity/Foundry/OZ, EVM client, one Privy provider, pinned compatible versions + lockfile, Windows/WSL instructions | package/lockfile, Firestore records/rules/indexes, Functions, README, install/build, network reads | Locked builds/local scope, cloud data config and Vercel web build/deploy verified; app-data IAM/Privy/escrow/worker and Functions execution incomplete |
| 6. Participant | Preview/auth/play/status/rewards/approved same-chain transfer; persistent actual balance and account security; first receipt without wallet setup/gas | Real-auth browser runs plus token/payout/transfer receipts | Unverified |
| 7. Catch | 15–20s, three targets, safe hit geometry, click/touch, reduced motion, server session/seed/time/event validation | Catch code, adversarial tests, mobile rendered/run evidence | Server geometry/time/forgery tests and 18-second practice keyboard/touch/expiry verified locally; real-auth game flow incomplete |
| 8. Quiz | Three questions; frozen configuration; server grading; no pre-exposed answers; planned disclosure time | Public/private Firestore record separation, API/browser bundle inspection, grading/freeze tests | Local private grading/public metadata-session answer exclusion and three-answer practice verified; complete bundle/disclosure/config-mutation coverage incomplete |
| 9. Award policy | FIRST_N_VERIFIED; atomic server order; one account + wallet per campaign; no P0 random draw; published attempts/expiry/sold-out rules | Actual Firestore concurrency tests, deterministic transactional guard documents, preview, award code | Real emulator verifies last-slot/single-coupon/outbox atomicity and account/wallet duplicate rejection; live campaign flow incomplete |
| 10. Onchain | Funded escrow; EIP-712 bound awards; fixed limits; duplicate prevention; claim/reclaim events; restricted relayer; honest signer trust | Contract/current ABI, test coverage, real deploy/deposit/claim/reclaim receipts | Local contract and integrated Anvil deposit/signing/payout/recovery/refund scope verified; public Monad deployment/funding/settlement incomplete |
| 11. Server/queue | Required Firestore records, tenant auth, verified tokens, transactional awards/outbox, idempotence, separate keys, accurate states, Function-trigger/retry recovery/reconciliation | Firestore records/rules/indexes, routes, worker/Functions, restart/retry/concurrency runs, cloud observations | Local 61-test mock-chain suite plus two actual Anvil/Firestore worker cases verify stated local persistence/settlement recovery; cloud Functions not deployed on Spark |
| 12. Coupons | Authorized inventory, encrypted/private/no-cache, atomic allocation, explicit demo mode, no fabricated provider API/redemption | Inventory model, access/duplicate/security tests, actual inventory rights | Local encryption/tamper/campaign binding, winner-only access, atomic allocation and anonymous no-cache APIs verified; real inventory rights/redemption incomplete |
| 13. Design/routes | All requested routes, clear brand, mobile/admin hierarchy, KO/EN, judge English path, dimensions/devices/in-app fallback/share privacy | Rendered routes, screenshots, keyboard/device runs, metadata | Same30Chromium checks passed locally and publicly/six profile skips each; four widths/KO-EN/keyboard-touch/validation/privacy; real devices/authenticated screens incomplete |
| 14. Research/business | Real operator questions, 5-person form, repeat-use measure, 100-person plan, price/cost hypotheses, no generated traction | USER_TESTS.md, DISTRIBUTION.md, actual consented study records | Forms/plan prepared; actual interviews/test results/traction absent |
| 15. Tests | Contract, Firestore/server, E2E matrices below; actual lint/type/unit/E2E/contract/build; no fake receipts/TODO core | Executed command logs, inspected tests, real network/browser evidence | Contract, 61 server, 30 browser, two local-chain cases, locked install, clean lint, typecheck and both builds passed at stated scope |
| 16. Submission | Raster ≤3MB, public repository, actual ≤3min demo, ≤2min pitch, hosted Vercel/Firebase product with Monad deployment/judge access; optional ≤30s ad | Official track, SUBMISSION_CHECKLIST.md plus actual files/URLs/metadata/access checks | Logo/public web-practice ready; full real-payment product and videos incomplete; GitHub403/empty; submission explicitly on hold |
| 17. Documents | README + product/architecture/security/deployment/integration/research/distribution/scripts/checklist/AI docs updated with code | Actual current file inventory/content and external evidence links | Owned product/submission docs prepared; full document set requires final inspection |
| 18. Working boundaries | Preserve changes/sources, separate modes/keys, no fake public fallback, no unsafe unauthorized actions, genuine history, truthful report | Git diff/history, secret scan, env, mode guards, deployment evidence | Initial state recorded; final audit outstanding |

## Historical baseline: P0 behavior gates

| ID | Exact completion gate | Evidence required | Status |
| --- | --- | --- | --- |
| A1 | Official token allowlist, correct chain ID, bytecode and decimals, integer amount math | Actual network-verification output with chain/date/address | Verified network/token scope: real chain 10143, official USDC bytecode/six decimals, finalized block 70687560; precision rejection tested locally; live escrow missing |
| A2 | Operator deposits exact budget; event cannot open before confirmed funding | Real deposit receipt/event, campaign checks, failed/unfunded test | Verified isolated local Anvil actual deposit/server funding verification and mocked provisional rejection; public Monad deposit missing |
| A3 | New participant authenticates once and receives an embedded wallet without extension or MON | Clean real-auth session and actual wallet/account evidence | Unverified |
| A4 | Catch success is server-validated and award is persisted atomically before signing | Real flow + forged-event/replay + last-slot concurrency tests | Local forgery/time/geometry/replay plus actual Firestore/Anvil two-of-three award/signing flow verified; real-auth public flow incomplete |
| A5 | Restricted relayer submits the fixed award; receipt/event confirms payout to bound recipient | Real escrow claim receipt, server state, recipient balance | Actual local Anvil production signer/worker receipts/events/two balances verified; local mock token/fixture identities only, public Monad payout incomplete |
| A6 | Reward survives re-login; outward transfer is explicitly approved and truly sponsored | Independent auth browser run, zero-MON wallet, actual transfer receipt/cancellation checks | Unverified |
| A7 | Expired unclaimed budget returns only to original operator; totals reconcile | Real reclaim receipt after genuine deadline + accounting checks | Local Anvil early-refund rejection, actual unused-budget refund and reconciliation verified after isolated test-time advancement; genuine public expiry/refund incomplete |
| B1 | Quiz reuses award engine with answers private and published immutable rules | Browser/API answer-leak scan + grading/config-lock tests + real quiz flow | Incomplete — local private grading/metadata/session exclusion verified; complete immutable-rule/live quiz coverage missing |
| B2 | Dashboard distinguishes reserved/confirmed/failed/remaining; tenant isolation holds | Authenticated operator flow + reconciliation + cross-tenant tests | Incomplete — private detail tenant rejection and chain-mocked reconciliation verified locally; full authenticated dashboard missing |
| B3 | Private encrypted coupon inventory allocates once; original content only winner can read | Concurrent allocation/access/no-cache tests and clear demo label | Verified local demo-stock allocation/encryption/access/no-cache scope; real authorized stock and hosted flow incomplete |
| B4 | Duplicate/out-of-order Function invocation, restart/network timeout/already-mined retry recovers without double payment | Real Firestore transaction/lease runs, scheduled overlap tests, chain-used-state checks and observed cloud processing | Local mock-chain cases plus actual Anvil broadcast→mined restart/stale lease/repeated retries with no extra transaction/payment verified; public recovery and cloud invocation incomplete |
| B5 | Five real independent people and real operator evidence are collected honestly | Dated consented research records; no staff/bot substitution | Incomplete — forms only |
| B6 | Complete submission artifacts accessible to signed-out judges | Raster/video/app/repo metadata and actual access rehearsal | Incomplete / unverified |

## Contract test coverage requirements

Recorded evidence: [contracts/verification.json](../contracts/verification.json), `2026-10-13T12:01:20.5477522Z`, `forge test --root contracts -vv`, official Forge `1.8.5`, `solc 0.8.28`, OpenZeppelin `5.6.1`, `network = "monad"`. **42 unit/fuzz tests and two properties in one invariant suite passed, zero failures/skips.** Fuzz uses 256 runs; the invariant record reports 256 runs and 16,384 calls. These are local tests with test token fixtures, not Circle USDC funding on live Monad.

The current contract SHA-256 is `1df6b743f59935af9814e786f04cf1d8984960a797ee1ebaa16c020482115fa6`; ABI SHA-256 is `a99deb44f206733fd7c8133fe98283d87b789f8882f1c00f2b97d7f049f39a20`. Both match the record. Assertions in the unit/fuzz and invariant sources were inspected for the cases below. Any contract/ABI change invalidates this hash-bound record until rerun.

| Case | Required proof | Status |
| --- | --- | --- |
| Normal create/deposit/pay/reclaim | Correct balances and exact events, full periods/deadlines | Verified locally: creation/funding/payment/refund assertions |
| Wrong signer/signature | Reject malformed/unauthorized proof without payment | Verified locally: wrong signer and malformed signature cases |
| Wrong recipient/amount/token | Proof alteration cannot redirect or inflate the reward | Verified locally: substitution/amount/token cases |
| Wrong chain/contract | EIP-712 domain replay across either boundary rejected | Verified locally: separate chain-domain and contract-domain cases |
| Full authorization binding | `campaignId`, `rewardId`, `slotIndex`, `recipient`, `token`, `amount`, `participantNullifier`, `qualifiedAt`, `deadline`, `rulesHash`; domain `chainId` + `verifyingContract` | Hash-bound source/type layout inspected; representative tampering/domain cases verified locally; no live proof claimed |
| Duplicate slot | Same or alternate proof cannot reuse a slot | Verified locally: independent duplicate-slot rejection |
| Duplicate reward ID | New proof cannot reuse award identity | Verified locally: per-attempt and cross-campaign reward rejection |
| Duplicate participant nullifier | Same participant cannot be paid twice | Verified locally: independent duplicate-participant rejection |
| Duplicate recipient | Different account proof cannot pay same wallet twice per campaign | Verified locally: independent rejection and recipient invariant |
| Invalid slot range | Outside fixed maximum rejected | Verified locally: out-of-range slot and other-campaign budget check |
| Qualification/payout time bounds | Before start, after close qualification, future qualification or expired claim rejected | Verified locally, including inclusive claim deadline and qualification end boundary |
| Early reclaim / wrong operator | Before/at deadline or by another account rejected | Verified locally: early/deadline/owner cases |
| Replay already-paid proof | Public submission cannot repeat; third-party submit still pays bound recipient | Verified locally: duplicate identity guards and relayer recipient assertion |
| Reentrancy and token transfer failure | State and budget remain safe; failure does not record false successful payment | Verified locally: nested claim/creation and rollback/retry cases |
| Campaign isolation | One campaign cannot spend another's deposited funds | Verified locally: refund liability/isolation and invariant across campaigns |
| Immutable campaign and withdrawal limits | Fixed configuration/no early withdrawal; no upgrade/admin sweep or unnecessary infinite allowance | Hash-bound public interface inspected; creation replacement, early reclaim and exact allowance cases verified locally |
| Fuzz/invariant accounting | `total paid + total reclaimed ≤ original deposit`, liability/balance agreement and one reward per recipient | Verified locally: one fuzz test + two invariant properties; 256 runs/16,384 invariant calls recorded |

Use official Foundry v1.8+ and `network = "monad"`. A fallback compiler or conventional EVM test runner may supply narrower supplementary evidence, but must not be called the required Monad Foundry run.

## Integrated local chain / worker evidence

[LOCAL_CHAIN_VERIFICATION.md](LOCAL_CHAIN_VERIFICATION.md) and [scripts/local-chain-verify.mjs](../scripts/local-chain-verify.mjs) describe the opt-in run: **two integration tests passed in 62.72s** on official Anvil 1.8.5, loopback chain 31337 / Monad execution family, isolated `demo-drop-local-chain-*` Firestore and a local mock six-decimal token. Production chain/receipt/signing/worker code executes without chain or receipt mocks; test configuration and identity fixtures are substituted. No production network allowlist bypass or real Privy identity is implied.

The ignored `.local/local-chain-verification.json` was inspected: `completed: true`, recorded `2026-10-13T13:21:32.383Z`, source hash matches the contract above. It records two qualifiers / one sold-out, two actual local paid events, both recipients holding 1,000,000 atomic units, reclaimed worker lease, persisted broadcast/mined recovery, **zero** added relayer transactions after recovery and zero added payments on completed retries. The actual unused-budget refund is 2,000,000 units, with early refund rejected. Only isolated local time was advanced for expiry. Those local hashes/addresses are not public explorer or official Circle USDC proof.

Actual public Monad consensus, official issuer behavior, live Privy first-time wallet creation, user-approved outgoing transfer, production Functions scheduling and real coupon rights remain outside this run. Its tests are separate from the 61-test chain-mocked server suite and 30 anonymous browser checks; do not combine them into a claim of live product completion.

## Server and persistence coverage requirements

| Case | Required proof | Status |
| --- | --- | --- |
| Auth forgery | Invalid signature/issuer/audience/expiry/body user ID cannot authenticate | Verified locally: real SDK signed-JWT checks, request identity rejection and anonymous API 401; live provider login incomplete |
| Wallet ownership | Client wallet address cannot override verified linked wallet; duplicate account wallet blocked | Verified locally: verified embedded-wallet selection and real-emulator account/wallet duplicates; live account linking incomplete |
| Tenant isolation | List/read/create/update/fund/reclaim/coupon actions reject another operator | Partial local evidence: private campaign detail and coupon winner rejection; anonymous private APIs rejected; all authenticated mutation routes not exhaustively proven |
| Catch manipulation | Client score/success ignored; invalid time/coordinates/order/seed rejected | Verified local cases: forged score/success, future time, coordinates, order, instant/incomplete attempts and bounded geometry |
| Session reuse/expiry | Nonce, config version, attempt policy, expiration and replay enforced | Session-replay rejection verified in real emulator; every expiry/config/attempt boundary not separately covered |
| Quiz secret leakage | No correct answer in public HTML/JS/API before allowed time | Public metadata/session answer and salt exclusion verified in emulator; full HTML/JS exposure scan incomplete |
| Quiz manipulation/config changes | Server grading; invalid answers/retries; no post-publication rules change | Server grading/wrong answers and claimed-score rejection verified locally; config-change boundary incomplete |
| Quiz disclosure timing | Answers/explanations revealed only under the announced timing rule, default after campaign close | Unverified |
| Final slot concurrency | Parallel successful accounts create only one last award/outbox reservation | Verified in actual Firestore emulator contention test; hosted scope incomplete |
| Duplicate payout reservation | Firestore deterministic account/recipient/reward/slot guard documents and transactional create preserve one award | Account/wallet/final-slot/outbox duplication verified in emulator; real chain payment separately incomplete |
| Coupon concurrency | Same stock item cannot be assigned to two accounts | Verified actual emulator: one reserved coupon for one final slot |
| Coupon privacy | Unauthorized user rejected; no cache/log/analytics/OG/public-file exposure | Winner-only emulator access, campaign-bound authenticated encryption and anonymous private/no-store APIs verified; complete log/analytics/OG scan not asserted |
| Process restart/multiple workers | Firestore outbox/leases and same reward identity survive Function retry/overlap or local process interruption | Real Firestore lease/fencing/cursor cases plus actual Anvil persisted broadcast/mined restart with zero extra transaction verified; cloud overlap unverified |
| Already-mined retry/timeout | Existing tx/contract state checked before resubmit; confirmed event reconciled | Mock-chain receipt/nonce scenarios plus actual local mined-restart and completed retry without extra payments verified; public network settlement incomplete |
| Rate limits | Persistent appropriate limits and actionable error under excessive requests | Verified emulator-shared request limit returns RATE_LIMITED / 429 |
| RPC/relayer/gas failures | No invented success; retryable/expired status and recovery path | Local unit/emulator finality, replaced-block, event/state mismatch, fee/total-MON caps and retry tests passed; actual outage/recovery incomplete |
| Reconciliation | Deposit, reserved, paid, reclaimed and remaining amounts match chain | Mock-chain cases and actual isolated Anvil payment balances/events/unused refund reconciled; public totals incomplete |
| Sensitive config/mode guard | Missing production integrations disable; no public fake-login/payment fallback | Verified locally and at public alias: auth/create unavailable, actual status all integration booleansfalse/demoFallbackfalse, private API401/no-store; real integration enablement incomplete |
| Campaign-private nullifier | Unpredictable campaign-scoped identifier; no simple Telegram-ID hash represented as anonymity | Unverified |
| Key/role separation | Distinct signer/relayer/coupon keys; restricted relayer contract/function; no general arbitrary-calldata endpoint or admin recipient-withdrawal authority | Unverified |
| Data model and analytics | User, Campaign, GameSession, Qualification, Award, PayoutJob, Coupon, AnalyticsEvent, AuditLog; private data/answers/coupons excluded from analytics; experiment modes separated | Unverified |
| Relayer recovery | Persisted usable proof can be re-requested/submitted safely; direct submission may require gas and is an optional documented recovery path | Unverified |
| Firestore/Functions production | Reviewed rules/indexes, server tenant authorization, deployment region/secrets, created-job trigger and scheduled retry/reconciliation actually run | Cloud Firestore database/region/rules/indexes verified; Vercel IAM/data access and Function execution incomplete, Functions blocked on Spark |

## Historical baseline: browser, network and device coverage

| Run | Required coverage | Status |
| --- | --- | --- |
| Catch end-to-end | Preview → real auth → session → play → verification → actual escrow receipt | Unverified |
| Quiz end-to-end | Preview → auth → private grading → inventory allocation → authenticated coupon access | Unverified |
| No pre-existing wallet | Creation works with one account login; no wallet installation/network switching/MON purchase | Unverified |
| Persistence | Logout/re-login and process restart do not lose awards/confirmed receipt | Unverified |
| Outgoing transfer | Address/network/amount/cost preview; user approval, cancellation, sponsorship, real receipt | Unverified |
| No inventory/budget | Sold out and insufficient funding never promise an award | Local last-slot SOLD_OUT/provisional-funding and unavailable-event boundaries verified; full real-auth budget flow incomplete |
| Time | Campaign close, claim expiry, genuine refund eligibility displayed/enforced | Practice 18-second expiry and local contract/server time/finality boundaries verified; live refund eligibility/receipt incomplete |
| Authentication failure | Rejected/cancelled popup and safe retry/external-browser path | Unverified |
| Service failure | RPC/relayer/auth outage and pending recheck recover without fake balance | Unverified |
| Coupon attack | Other account/public URL cannot read coupon; demo content unmistakable | Winner-only real-emulator access and anonymous API privacy verified; hosted authenticated attack coverage incomplete |
| Mobile dimensions | 360, 390, 768 and 1440 px; no clipped action/game/input collision | Local and actual hosted Chromium layout checks passed at all four widths; mobile touch flow passed, actual devices separate |
| Actual browsers | Android Chrome, iOS Safari, ordinary Telegram in-app external web | Unverified; emulation alone cannot prove actual-device support |
| Accessibility/localization | KO/EN separate, judge English, focus/labels/reduced-motion/input methods | KO/EN persistence, English creator errors/images, judge English and keyboard/touch verified locally; complete accessibility and real-device audit incomplete |
| Share metadata | Organizer/game/reward/count; no user identity/answers/coupon secrets | Generic local production OG HTTP200 PNG1200×630 / 49,610bytes inspected; published-campaign title/metadata fixture and complete privacy scan not claimed |

## Historical commands and evidence log

Use the Firebase-backed commands below from the repository root with supported runtime/dependencies. Current package scripts were inspected: web build/typecheck run directly against Next.js/TypeScript, and Functions build is separate. No SQL generation or migration is required. A command's definition is not a successful run.

| Command | What it can prove | Current inspected result |
| --- | --- | --- |
| `pnpm lint` | Static lint checks, not functional behavior | Root clean lint passed exit 0 / zero warnings; added local-chain files' static checks passed |
| `pnpm install --frozen-lockfile` | Manifest/lockfile alignment and actual dependency install | Verified exit 0 for both workspace packages |
| `pnpm typecheck` / `pnpm exec tsc --noEmit` | TypeScript checks for the Firebase-backed app | Passed locally |
| `pnpm test` | Cases actually implemented in Vitest | Verified final run: 61 passed in seven files, exit 0; includes 20 actual emulator tests |
| `pnpm test:e2e` / `pnpm exec playwright test` | Implemented Playwright coverage; record environment/mode | Local30passed/6skips45.5s; PLAYWRIGHT_BASE_URL=https://drop-omega-five.vercel.app production30passed/6skips44.7s, both exit0; anonymous/practice only |
| `pnpm exec vitest run tests/server/database.integration.test.ts` | Real loopback Firestore data/lease tests with stated RPC mocking; requires the demo project environment | Source/assertions inspected; 20 passed within final suite and separate overlapping focused audit |
| `pnpm test:contracts` | `forge test --root contracts`; version/network execution must match docs | Verified scoped record: 42 unit/fuzz tests + two invariant properties, no live deployment |
| `node scripts/local-chain-verify.mjs` | Actual local RPC/signing/worker/Firestore settlement and recovery without chain-response mocks | Two passed in 62.72s, isolated31337/local mock token; inspected completed source-hash-matched run record |
| `pnpm build` / `pnpm exec next build` | Next production build for Vercel | Passed, exit 0; routes/Open Graph compiled; not hosting proof |
| `pnpm functions:build` / `pnpm --dir functions run build` | Firebase Functions TypeScript build | Passed locally; not cloud deployment/invocation |
| `pnpm verify:network --network-only` | Actual read-only network/token checks without an escrow | Passed: chain 10143, official USDC code/six decimals, finalized block 70687560, escrowVerified false |
| `pnpm verify:network` | Deployed escrow getters/code/EIP-712 checks in addition to the network | Incomplete — no actual escrow configured/deployed; network-only result cannot satisfy this full mode |
| `pnpm exec firebase deploy --only firestore:rules,firestore:indexes --project drop-5a400 --non-interactive` | Cloud data configuration only | Verified exit 0: compiled/uploaded/released rules, deployed indexes; no Functions/billing change |
| `pnpm dlx vercel@63.1.2 deploy --project drop --scope teamstartup --prod --yes` | Normal-file upload and actual Vercel web deployment | Exit0, READY production/Hobby; local commit3ff3025,118records/1.2MB/cloud118files; no archive, no auth/payment integrations inferred |
| `./scripts/start-firebase-emulator.ps1` | Actual local emulator process/Hub readiness; no cloud login | Verified live start and same-PID reuse; loopback only |
| `pnpm firebase:emulators` | Foreground CLI emulator command with the same demo project/config | Defined; actual managed runtime was started through the PowerShell lifecycle script |
| `pnpm worker` | Standalone local/manual processor CLI; not cloud Function deployment | Standalone CLI not executed in this audit; underlying production worker exercised by actual Anvil integration |

| Date / commit | Command / environment | Result | Scope / skips / artifact |
| --- | --- | --- | --- |
| 2026-10-13 / current contract+ABI hashes match record | `forge test --root contracts -vv`; Forge 1.8.5 / Monad execution | 42 unit/fuzz + two invariant properties passed; 0 fail/skip | contracts/verification.json; local fixtures only, no network deployment |
| 2026-10-13 / local runtime | Firebase CLI 15.33.0, Firestore emulator 1.22.0, Java 21; start script and HTTP/process inspection | Ready, actual Hub/Firestore process, expected missing-document 404, same-PID reuse | FIREBASE_VERCEL.md; all listeners 127.0.0.1, no application transaction or cloud deployment result inferred |
| 2026-10-13 / local app | Final full Vitest; demo-drop emulator | 61 passed in seven files, exit 0 | Includes 20 actual Firestore cases; test JWTs / mocked blockchain responses; focused 14 RPC + 20 emulator run overlaps these tests |
| 2026-10-13 / local browser | Final Playwright desktop/mobile Chromium | 30 passed / six profile skips, exit 0, 45.5s | tests/e2e/anonymous-product.spec.ts; four widths, touch/keyboard, unpaid practice, validation/language/privacy; no live auth/payout |
| 2026-10-13 / actual hosted browser | Same Playwright suite with public production base URL | 30passed /six intentional profile skips, exit0,44.7s; no runtime page errors | Actual catch/quiz unpaid practice, expiry/retry, disabled creation, KO/EN, four widths, private GET/spoof POST401/no-store; current QA screenshots are production captures |
| 2026-10-13 / actual Vercel web | Official CLI63.1.2 normal upload; deployment dpl_3o35jn53ucDDU46NBHZZeD9BgeM4 | READY production teamstartup/drop/Hobby; locked install, Next42s/TS19.7s/all11pages cloud build passed | Public alias above; Node24.21/pnpm11.25.0; source3ff3025,118records/1.2MB/cloud118files; GitHub still403/empty |
| 2026-10-13 / hosted HTTP | Direct unauthenticated fetches to public alias | Public/practice/judges/status200; unpublished OG200/PNG1200×630; rewards/coupon401/no-store/private | .local/qa/public-production-http.json; actual status authentication/database/escrow/authorization/relayer/coupons/gasSponsorshipfalse/demoFallbackfalse/chain10143; no Vercel auth redirect |
| 2026-10-13 / local builds | App typecheck, Functions build, Next production build | Passed; Next exit 0 | Routes/Open Graph compiled; frozen install exit 0 for both packages; no hosted deployment inferred |
| 2026-10-13 / isolated local RPC | Anvil 1.8.5, Monad family / chain31337, mock token, real Firestore + production worker | Two integration cases passed in 62.72s | LOCAL_CHAIN_VERIFICATION.md; ignored completed record inspected at 13:21:32.383Z; no public chain, real login or cloud mutations |
| 2026-10-13 / final static/rebuild / production server | Clean lint, typecheck, final Next rebuild and local production HTTP checks | Passed; zero lint warnings, Next exit 0 | Production home/judges200, OG200 PNG1200×630 /49,610bytes pixel-inspected; status200 and anonymous rewards/coupon401 no-store/private; no published campaign/auth/live payment claimed |
| 2026-10-13 / real RPC, read-only | Monad Testnet network-only verifier | Chain 10143, official USDC code/six decimals, finalized 70687560 | scripts/verify-network.ts; escrowVerified false; no signing/broadcast |
| 2026-10-13 / real Firebase project | drop-5a400 database CLI inspection and rules/indexes-only deploy | `(default)` Standard / Native, asia-northeast3; deployment exit 0 | Database creation 2026-10-13T13:01:16.609278Z; no Functions, billing upgrade or application-data access inferred |
| 2026-10-13 / authenticated official portal | Consumer Products & Payments and Resources, read-only | Rubric, deadline and deliverable limits verified | OFFICIAL_SOURCES.md; no form fill/save/upload/submission; user hold remains active |

## Evidence still needed before claiming full completion

Current remaining evidence includes outgoing transfer/refund and live restart/outage/daily recovery as relevant product checks; actual independent participant/operator research and authorized real coupon stock if real coffee is claimed; a complete fresh hosted regression; video signed-out playback. Primary Consumer submission and both independent game payments are confirmed. Real Google/WIF, source publication, verified escrow/funding/quiz payment/re-login, exported/uploaded videos and judge-event funding are already evidenced. Each feature branch is not a separately mandatory portal upload. Functions remains blocked on Spark; no paid upgrade is authorized. [Current checklist](SUBMISSION_CHECKLIST.md) supersedes historical baseline statuses above.

P1 MON, verifiable drawing and approved supplier API; P2 USDT0, additional chains and complex automation remain deferred under the original priorities. They are not missing P0 work and are not advertised as available.
