# DROP submission checklist

**The product is not submission-complete merely because its source or scripts exist.** The authenticated official [Consumer Products & Payments track](https://hackathon.monad.xyz/tracks/consumer-payments) and [submission form](https://hackathon.monad.xyz/project?tab=submission) were inspected read-only on 2026-10-13. Their exact limits and weights are now independently verified. Source provenance is in [OFFICIAL_SOURCES.md](OFFICIAL_SOURCES.md).

**Do not submit yet: explicit user hold.** No field was edited, draft saved, asset uploaded or Submit action taken. The verified deadline is **2026-10-14 12:59 GMT+9 / Asia/Seoul**, equivalent to **03:59 UTC**. Preparation does not authorize submission.

## Mandatory artifacts confirmed from the brief and official page

| Item | Acceptance evidence | Status at document preparation |
| --- | --- | --- |
| Raster logo / graphic | Public track: JPG/JPEG/PNG/WEBP ≤3 MB. Actual upload: PNG/JPG/WEBP ≤2 MB, at least 500 px, max 2000×2000. Decode, record origin and conservatively meet both dimensions ≥500 | **Prepared and pixel-inspected:** original temporary wordmark PNG + square PNG; both dimensions 500–2000, both below 2,000,000 bytes. Not an approved final brand; no upload. See evidence below. |
| Public GitHub | [openai-lover/DROP](https://github.com/openai-lover/DROP), actual latest code pushed, accessible to `metropolis@hackathon.monad.xyz`, no secrets | Push returned403; requested remote remains empty. Hosted local commit3ff3025 is not GitHub publication |
| Technical demo | Actual working product, accessible YouTube/Loom/Vimeo URL, measured exported duration ≤ 3:00 | [Script](DEMO_3MIN.md) prepared; no recording/upload supplied |
| Founder pitch | Team, problem, purpose; verifiable biography; accessible accepted-host URL; measured duration ≤ 2:00 | [Script](PITCH_2MIN.md) prepared; biography/recording/upload absent |
| Deployed product | Official: live Monad Mainnet/Testnet product URL and access/test credentials. DROP scope additionally requires actual Vercel/Firestore/Privy/escrow and durable payout | [Public web/practice](https://drop-omega-five.vercel.app/) is deployed; Firestore database/rules/indexes verified. Live Privy/app IAM/escrow/funding/processor remain unset; therefore full official product gate remains incomplete |
| Judge access | Limited testnet budget and roles; two repeatable game flows; private test-account delivery if needed; no public admin bypass | Requires actual configured deployment and rehearsal |

The optional promotional video is ≤30 seconds and is not judged under the verified official track; it is currently absent. No live-judging exemption is inferred from the recorded-pitch requirement.

## Observed form requirements

| Field | Verified limit / requirement | DROP readiness |
| --- | --- | --- |
| Title / one-line summary | ≤120 / ≤200 characters | Product drafts only; no form changes |
| Description | ≤8000 characters | Product/source evidence available; live claims must stay incomplete |
| Go-to-market / user acquisition | ≤8000 characters | Hypotheses and next-100 plan prepared; no invented users/interviews |
| Repository / logo / live URL / demo / pitch | Required fields; exact artifact limits above | PNGs and public web/practice URL ready; GitHub403, actual payout product and videos incomplete; no fields submitted |
| Selected Best Community bounty / group | Observed selection; requires onboarded campus-group eligibility and required group identification | Eligibility and group identification unproven; selected checkbox is not qualification |
| Judge instructions | Optional, private, ≤8000 characters | Actual access instructions needed after a verified deployment; no private draft/PII copied into repository |
| Public video checkboxes / ad / project X | Optional fields visible | No checkbox or value changed; ad absent |

Consumer Products & Payments was already selected in the observed form; no track or bounty choice was changed. The Privy bounty was not selected or added. If later considered, its official $5,000 prize requires demonstrable use beyond authentication and an integration description; a separate ≤2-minute Privy demo is optional. No new selection is authorized by reading those conditions.

## Logo artifact evidence

| Actual raster artifact | Decoded format / dimensions | File bytes | SHA-256 |
| --- | --- | --- | --- |
| [drop-wordmark.png](../assets/submission/drop-wordmark.png) | PNG, 1200 × 600 | 9,979 | `41adccd9bf69ab9dbad15ac3ca3b8bdb24618a5fc2af954879dd7d2ec4f079bd` |
| [drop-square.png](../assets/submission/drop-square.png) | PNG, 1024 × 1024 | 11,914 | `9fa9cd116e95b1d56706979556682d40f093d8740e3a8aa6e039f50c95b0f2d4` |

Both current rendered PNGs were reopened at original pixel resolution using `view_image` after the wordmark was resized to satisfy the stricter portal minimum: clear geometric letter outlines, intact internal counters, visible coral period, balanced off-white margins, and no clipping were observed. Palette: ink `#20231e`, coral `#f6503d`, paper `#faf9f5`, matching the current app.

Source: original code-native geometric SVG paths, rendered by [scripts/render-wordmark.mjs](../scripts/render-wordmark.mjs) through Sharp. No external font, downloaded artwork, existing bitmap, private data or coupon content is used. Editable SVGs, actual metadata/hashes and origin notes are in [assets/submission](../assets/submission/README.md) / [manifest.json](../assets/submission/manifest.json).

Brand status: **original temporary branding, not final approved branding**. License status: **`NOASSERTION`**; no asset-specific public license is assigned by this task. There are no third-party font/artwork dependencies in the assets. This proves a usable raster deliverable exists; it does not prove portal upload/acceptance or owner approval of a final brand.

## Verified official judging basis

The original user-supplied weights match the independently read official Consumer Products & Payments page. They are now verified official criteria, with the following DROP evidence required.

| Category | Weight | DROP evidence required |
| --- | --- | --- |
| Technical Execution | 20% | Actual funding, constrained authorization, payout and unused-budget return on Monad; adversarial/recovery tests |
| Design & Craft | 20% | Independent non-crypto participant completes without coaching; mobile layout and honest failure states |
| Originality & Track Insight | 15% | Game → funded promise → actual receipt → onward transfer in one consumer journey; no unsupported novelty claims |
| Founder & Market Readiness | 25% | Actual operator problem/interview evidence, supplied team biography, reusable event economics |
| Traction & Path Forward | 20% | Actual independent-user and operator-repeat evidence; explicit next-100 plan |

Strong engineering alone cannot fill the missing interview, traction, founder, or recording evidence.

The official criteria require actual onchain conditional settlement, a non-crypto participant completing the core flow without assistance, a distinct experience improved by the rails, a concrete consumer segment understood through real evidence, and an actual user study plus next-100 distribution. A small real study with five friends is permitted; a prepared form or generated response is not a study.

## Technical readiness

- [x] Dependencies are pinned with a real lockfile; frozen installation exited 0 for both workspace packages on the documented runtime.
- [x] App typecheck, Functions build and final Next rebuild after the OG fix passed. Local production OG returned actual HTTP200 PNG1200×630 /49,610bytes and pixels were inspected; home/judges200, status200/private cache and anonymous rewards/coupon401/private cache verified. No published campaign, live auth or hosted URL inferred. Later source changes require revalidation.
- [x] Final Vitest passed 61 tests in seven files, including 20 real Firestore emulator cases with chain responses mocked; actual SDK test-generated JWT signatures exercised.
- [x] Final Playwright passed 30 checks with six intentional profile skips, exit 0 in 45.5s; local unpaid practice/anonymous API, creator validation, KO/EN, four widths and keyboard/touch scope. No real-auth or paid-flow claim.
- [x] Vercel production is READY at [drop-omega-five.vercel.app](https://drop-omega-five.vercel.app/). Actual hosted suite30passed/6intentional profile skips44.7s, exit0, no page errors; direct public/status/OG checks200 and anonymous private APIs401/no-store/private. Status integrationsfalse/demoFallbackfalse. No real-auth/paid-flow claim.
- [x] Clean root lint exited 0 with zero warnings; added local-chain files' static checks passed; final Next rebuild after the OG fix exited 0.
- [x] Recorded official Forge 1.8.5 run uses `network = "monad"`: 42 unit/fuzz tests and two invariant properties passed with zero failures/skips; current contract and ABI hashes match [verification.json](../contracts/verification.json). This is local contract evidence only.
- [x] Real Firestore emulator started with a demo project, all listeners bound to `127.0.0.1`; Hub/data API and reuse of the same process verified. This is local runtime readiness, not a cloud deployment.
- [x] Two separate actual local Anvil/Firestore cases passed in 62.72s using production RPC/signing/receipt/worker methods: deposit/first-N/payout balances/events, persisted broadcast-mined recovery without extra transaction, stale lease and unused refund. Local31337/mock token/fixture identities and test-time advance only; no public Monad or Privy claim. [Scope](LOCAL_CHAIN_VERIFICATION.md).
- [x] Real read-only Monad Testnet network/token verification: chain 10143, official USDC code/six decimals, finalized block 70687560. Network-only mode explicitly leaves escrowVerified false.
- [ ] Complete deployed escrow verification, funding/payout/transfer/reclaim receipts and explorer/source access.
- [ ] Funding transaction and campaign parameters are reconciled before events open.
- [ ] Both games use authenticated, server-verified submissions; first-N allocation is atomic; answers are not pre-exposed.
- [ ] A confirmed award requires the matching receipt/event; replay/restart/retry never repeats an award.
- [ ] Recipient with no wallet and no MON can receive and make an explicitly approved sponsored same-network transfer.
- [ ] Re-login preserves rewards; real chain balance is read; outage/sold-out/expired/login-failure screens are tested.
- [ ] Coupon assignment/access are private, atomic and encrypted; demo stock is visibly non-redeemable; provider redemption is not assumed.
- [x] Cloud `(default)` Firestore is confirmed Standard / Native in asia-northeast3; rules/indexes-only deployment exited 0. No app credentials/data access or Functions inferred.
- [ ] Actual Vercel cloud-data access and a durable outbox/retry/reconciliation processor are verified running. Functions source/build exists but deployment is blocked on Spark; no billing upgrade permitted. Vercel request timers do not satisfy this gate.
- [x] Contract/server/E2E/local-chain coverage and missing live cases are explicitly accounted for in [REQUIREMENTS_AUDIT.md](REQUIREMENTS_AUDIT.md); this does not mark the missing cases passed.
- [ ] 360/390/768/1440px, Android Chrome, iOS Safari and ordinary Telegram in-app external web use are checked; emulation and real device coverage are labelled separately.
- [ ] `local`, `practice`, `demo`, `testnet` and `mainnet` remain distinct; public production never falls back to fake auth or payouts.

## Public evidence and privacy

- [x] Product brief, blank research forms, next-100 plan, draft scripts and AI assistance disclosure are prepared.
- [ ] At least five independent participant sessions are actually observed; results and assistance/failures are recorded.
- [ ] Actual operator interviews and any repeat campaign are recorded with permission. No generated quotes or invented partners.
- [x] Logo PNGs decoded and pixel-inspected; actual dimensions, bytes and hashes recorded above; temporary/original/license status explicit.
- [ ] Final technical/pitch video files are recorded, their actual durations measured, and accessible accepted-host URLs verified. The logo does not satisfy the still-absent videos.
- [ ] GitHub, app, explorer, contract verification, video and supporting-document URLs open for a signed-out judge.
- [ ] Repository and artifacts contain no secrets, private accounts, private keys, real coupon/barcode contents, or production admin credentials.
- [ ] Pre-existing work, build-window work and AI usage disclosures match actual history. Git timestamps are not rewritten.
- [ ] Unfinished integrations, testnet value, centralized game signer, Sybil risk, and unaudited-contract status are visible.

## Final submission record

| Field | Verified value |
| --- | --- |
| Submission date / timezone | Not submitted; user hold. Official deadline 2026-10-14 12:59 GMT+9 / Asia/Seoul (03:59 UTC) |
| Portal account / registered team | Existing authenticated session inspected read-only; no private account/team data reproduced |
| Track | Consumer Products & Payments — user-requested, observed already selected; no choice changed or application submitted |
| Community bounty | Observed already selected; campus-group eligibility and required group identification unproven |
| Deployed local source commit | `3ff3025`; GitHub push403/empty remote means public source requirement is not met |
| Public app URL | https://drop-omega-five.vercel.app/ — production READY /Hobby; anonymous practice only, real integrations unset |
| Vercel deployment / build | dpl_3o35jn53ucDDU46NBHZZeD9BgeM4; CLI63.1.2 exit0; normal1.2MB/118records/cloud118files; locked install/Next/TS/11pages passed |
| Firebase project / Functions / billing | drop-5a400 / DROP / Spark; real Firestore database and rules/indexes verified; no Functions or billing change |
| Chain / escrow / explorer | Real Testnet network/token reads verified; no live DROP escrow/funding/receipt/explorer proof |
| Technical video URL / duration | Not recorded |
| Pitch URL / duration | Not recorded |
| Logo path / format / bytes | `assets/submission/drop-wordmark.png`, PNG 1200×600, 9,979 bytes; `drop-square.png`, PNG 1024×1024, 11,914 bytes; current hashes above, pixel-inspected temporary originals, no upload |
| Private judge access delivery | Not arranged |
| Portal receipt / accepted submission | None; Submit untouched under explicit user hold |

Only mark a row complete after inspecting the current artifact or external state. A URL drafted in text, a script, and a configured environment variable do not prove delivery.
