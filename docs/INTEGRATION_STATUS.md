# DROP integration status

**Final primary submission:** Consumer Products & Payments is **READY FOR JUDGING**, confirmed `2026-10-13T16:39:30.988Z` (Oct14 01:39 KST). No bounties were selected. Both actual quiz and catch payments are independently verified; these are same-human technical accounts, not traction. Optional Privy bounty consideration is separate. `acf5b73` identifies the deployed application baseline; later documentation/proof commits may advance public main.

Snapshot: **2026-10-14, Asia/Seoul**. [Production](https://drop-omega-five.vercel.app/) is READY at deployed application baseline [`acf5b73`](https://github.com/openai-lover/DROP/commit/acf5b73), deployment `dpl_DWyZ5hV9WFPTyVs551DqjTKWmqss` in `teamstartup/drop` / Hobby. The [public repository](https://github.com/openai-lover/DROP) is populated on `main`. Real Google login/wallet, server identity verification, production WIF Firestore transactions, creator funding and a participant quiz payout are verified. The new release includes the reviewed dates and automatic opening/closing UI.

DROP is built by solo developer **Gyu-min Kim**. Both final Unlisted videos now play on their watch pages; no signed-out verification is claimed. Portal **6/6** was saved2026-10-13 16:29UTC and actual catch/access updates were saved16:35UTC. The primary Consumer submission is confirmed READY FOR JUDGING at2026-10-13T16:39:30.988Z. SLIME CEO! is the upload channel, not the developer identity; X is AlphaGgang. Best Community was removed for absent campus evidence. Billing upgrades/mainnet remain outside scope.

## Current evidence

| Component | Verified now | Still open |
| --- | --- | --- |
| Public website/source | Current production READY; public `openai-lover/DROP` main at `acf5b73`; normal Vercel upload/build | Fresh full hosted regression after this release |
| Privy | Actual Google onboarding, embedded EVM wallet, JWT/profile verification and sign-out/re-login retaining the paid reward succeeded | Email OTP delivery and failure/cancellation cases |
| Cloud Firestore | Real cloud WIF/data, account/campaign/session/atomic award/outbox/Paid records; paid receipt persisted after actual sign-out/re-login | Additional feature/adversarial branches |
| Wallet balance | Actual participant began with zero USDC/MON, then My rewards showed 0.1 test USDC, Paid and a real receipt | Approved outgoing transfer; MON-free sending is not configured/proven |
| Monad / USDC | Actual chain 10143, Circle testnet token bytecode and six decimals | Mainnet is disabled and unverified |
| DROP escrow | Real deployment/runtime/perfect source match; first 5-USDC quiz funding/payout and separate 2-USDC judge catch funding independently verified | Catch payment, unused-budget refund and additional recovery cases |
| Relayer | Exact initial 0.5 test MON funding; actual claim fee 0.043855716; subsequent 3.4 test MON replenishment independently verified, leaving 3.856144284 at that snapshot | Variable future gas/retries and outage recovery; budget is finite |
| Free worker mode | Persistent outbox/leases/nonces; actual production request-assisted processor delivered the quiz award and persisted Paid | Protected daily invocation and live restart/outage recovery; no continuously running service claimed |
| Functions | Node 22 source and typechecking/build prepared | **Not deployed:** Spark blocks Functions deployment; no Blaze upgrade authorized |
| Native transactions | Explicit selected embedded wallet, chain 10143, visible/cancellable Privy approval; sponsor-off path tested and real operator approval/funding completed | Real refund and participant USDC transfer; provider sponsorship is not configured/proven |
| Games/allocation | Real quiz and catch each produced Paid/0.1; actual balance0.2; quiz re-login and duplicate guard verified; 19/20 judge allocations remained | Independent catch-payment audit passed; additional adversarial cases |
| Coupons | Encrypted private inventory, atomic assignment and winner-only no-store access tested with real emulator | Authorized real supplier stock, live delivery and store redemption; demo coupons remain non-redeemable |
| Submission | Current source/live/logo/copy/video links saved6/6; both Unlisted watch pages play; actual catch/access update saved16:35UTC | Final Submit/accepted receipt; signed-out playback not separately verified |
| User/market evidence | Solo developer Gyu-min Kim identified; research forms and future next-100 plan prepared | Independent participant study, actual operator interviews/reuse and pricing validation |

Production identity verification used the normal Google/Privy flow, not a test bypass. The user's private profile and login wallet are deliberately omitted from these public records. Configuration flags alone are weaker than the observed successful authenticated calls.

## Public chain evidence

- [Escrow deployment record](../contracts/deployment/testnet-deployment.public.json): chain10143, deployment transaction `0xb17568879280ebdd217af621d0d7aab95aa2bf8f421bbc66e890e6c3d69cfeb5`, block70715601, canonical receipt/runtime/immutable checks passed.
- [Perfect source match](https://sourcify-api-monad.blockvision.org/check-by-addresses?addresses=0x22acf105A1af3f104f62e06fD813e49Af9358379&chainIds=10143) and [verified compiler metadata](https://sourcify-api-monad.blockvision.org/repository/contracts/full_match/10143/0x22acf105A1af3f104f62e06fD813e49Af9358379/metadata.json).
- [Relayer funding record](../contracts/deployment/relayer-funding.public.json): exact 0.5 test MON, transaction `0xbbaf81383995baa5b1162bd5b67781d6d69e2e62d2083582eae02c70bd407d2c`, canonical finalized receipt and balance deltas passed.
- [Relayer replenishment](../contracts/deployment/relayer-topup.public.json): after the first payout, an exact 3.4 test MON native transfer was independently verified; its resulting balance snapshot was 3.856144284. Future capacity depends on gas/retries, not a guaranteed recipient count.

These records prove a real escrow deployment and native relayer funding. Neither of those two transactions is a USDC campaign deposit or participant payout.

The first app campaign `/d/metropolis-first-drop` separately funded **5 test USDC = 0.1 × 50**, transaction [`0x4f10…6637`](https://testnet.monadvision.com/tx/0x4f10e52e5a77c8c24c42dc605e6e3413010fb2ae9dd1b13657eb897f30576637). Two visible Privy confirmations completed; the dashboard became OPEN after server canonical receipt/event/state checks. [Independent public-chain proof](../contracts/deployment/live-campaign-funding.public.json) verifies the canonical finalized approval/deposit, exact owner/signer/token/rules/periods, owner USDC 10→5, escrow 0→5 and liability 5. Actual deposit gas was 0.036737238 MON; prior exact-budget approval used 0.008939586 MON. Its initial short window is 2026-10-14 01:11–02:11 KST; it is a rehearsal event rather than a persistent judge-access promise. Screenshot `.local/qa/production-funded-dashboard.jpg` is retained privately.

The creator and participant technical-verification accounts are controlled by the same human. They establish integration behavior, not two independent users, interviews or traction.

## Actual participant payout

The participant completed the production quiz through normal Privy authentication and the server accepted the attempt as QUEUED. My rewards then showed **Paid**, actual balance **0.1 test USDC** and transaction [`0x9cbb…678c`](https://testnet.monadvision.com/tx/0x9cbb35fcc0ba09119e87452ff5f2d6d534d4a1ae55682ce0c080260f98c5678c). The request-assisted processor actually executed; this is not a manually invented balance or receipt.

[Independent payment proof](../contracts/deployment/live-participant-payment.public.json) checks canonical finalized block 70725899, fixed-signer EIP-712 authorization, the exact RewardPaid and Circle Transfer events, the claimed flag, slot 0, campaign paid 0.1 and claimedCount 1. The independently recorded baseline and post-payment balances show participant USDC **0→0.1**, MON **0→0**, and wallet nonce **0**. Relayer gas was **0.043855716 test MON**. This proves gasless receiving for this one actual payout; outgoing transfer remains a separately approved user-wallet action.

The final proof also reconciles escrow USDC **5→4.9**, total liability **5→4.9**, campaign paid **0→0.1**, claimed count **0→1** and relayer MON **0.5→0.456144284** before replenishment. Global reward ID, campaign slot and recipient replay flags are true. This accounts for exactly one paid allocation, not all 50 promised slots.

Refresh and subsequent actual sign-out/Google re-login retained **Paid/0.1 test USDC**. Trying to participate again showed **“This account or wallet already has a reward.”** and created no second award. Private evidence is `.local/qa/production-duplicate-blocked.jpg` and `production-relogin-paid.jpg`. This verifies persistence/duplicate behavior for the technical account, not independent user research.

## Funded judge event and video links

Independent [Catch payment proof](../contracts/deployment/judge-event-payment.public.json) passed at canonical finalized block70730030: exact signer/RewardPaid/USDC Transfer, participant0.1→0.2USDC withMON0/nonce0, judge escrow2→1.9, combined liability6.9→6.8 and replay flags. Gas0.041758392test MON, relayer3.814385892 at that snapshot. Original quiz unchanged; two same-human technical payouts, not traction.

[Metropolis Play](https://drop-omega-five.vercel.app/d/metropolis-play) is live and funded **2 test USDC =20×0.1**, with18seconds/3catches and3attempts. It opened2026-10-13 16:33UTC, closes2026-10-20 16:18UTC (Oct21 01:18KST), and claims expire2026-10-27 16:18UTC. The technical participant completed the first attempt via keyboard and the app displayed a second Paid/0.1test-USDC receipt, actual combined balance0.2. **19/20 allocations remained** after verification. [Catch transaction](https://testnet.monadvision.com/tx/0xbd8d5ce90d6d059931f19050744b546567215f337532a59fa8a481fe4d15ce6e); independent payment audit passed. Private screenshot `.local/qa/judge-catch-paid.jpg`.

[Independent judge funding proof](../contracts/deployment/judge-event-funding.public.json) verifies transaction [`0xad192…751b5`](https://testnet.monadvision.com/tx/0xad192c4e6e3449a2382f74c326abeb411b8787f4a712bf76bb7a5d0b947751b5), canonical finalized block70728309, exact immutable rules/periods/events, owner USDC5→3 and combined escrow/liability4.9→6.9. Actual deposit gas was0.033241698 test MON. This replaces the previously planned20slots with an actual funded campaign, not20paid users.

Both final files are **Unlisted** and watch playback was observed: [technical demo](https://youtu.be/Lfuvsvowj30),155seconds with0→13s sampled; [pitch](https://youtu.be/AlWM6csYk5w),107seconds with0→2s and continued playback. Exact local exports155.32s/107.94s meet3min/2min limits. No signed-out verification or full human viewing is claimed. [Demo QA](DEMO_3MIN.md), [pitch QA](PITCH_2MIN.md).

## Free runtime scope

Vercel remains **Hobby** and Firebase `drop-5a400` remains **Spark**. `FIREBASE_CREDENTIAL_MODE=vercel-oidc` uses production-specific GCP federation and service-account impersonation without a generated private key. The actual production login has now demonstrated working Firestore access. Privy is the single login; Firebase Authentication is not added.

With `DROP_WORKER_MODE=request`, successful authenticated reward-list, game-submit and retry responses schedule bounded work through Next `after()`. A persistent 15-second user throttle permits at most one job per invocation; automatic scanning considers the latest eight awards, while explicit retry can target an older owned award. All state remains in Firestore, with lease-fenced writes and persisted signed transaction bytes/nonces.

The protected Vercel cron route is scheduled **once daily at 03:00 UTC**. Each accepted run attempts at most **three jobs and three expired-award probes**, with durable cooldown/cursor state and a soft 25-second budget inside a 60-second platform limit. RPC calls may exceed the soft budget. Hobby execution can vary within its scheduled hour. This is a capped pilot fallback, not unlimited backlog processing or a minute-scheduled worker. The request-assisted path completed the real award; the daily cron invocation and actual restart/outage recovery remain unverified. [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [runtime setup](FIREBASE_VERCEL.md).

Prepared Functions use Firestore triggers and frequent schedules, but cannot deploy on Spark. No paid processing, scheduler or billing upgrade is claimed. [Functions prerequisite](https://firebase.google.com/docs/functions/get-started).

Receiving uses the restricted relayer's MON budget. Operator funding/refund and outgoing USDC sends use the user's selected Privy wallet and wallet-paid test MON unless genuine sponsorship is separately configured. The UI shows the fee hint and preserves visible approval/cancellation. A public flag never proves sponsorship or zero-fee transfer.

## Test evidence and boundaries

| Recorded result | Actual environment / boundary |
| --- | --- |
| 96 passing tests across 12 files | Server + language suites, including 26 actual loopback Firestore emulator cases; chain RPC responses are mocked and JWTs are test-generated |
| Three additional wallet-request tests | Explicit chain/address, sponsor-off visible cancellable send, sponsor-only-when-enabled and rejection before invalid SDK sends; wallet SDK adapter only |
| 42 contract unit/fuzz tests + two invariant properties | Official Forge1.8.5, Solidity0.8.28, Monad execution settings; source/ABI hashes match [verification.json](../contracts/verification.json) |
| Two actual local Anvil/Firestore worker cases | Production signing/RPC/receipt/worker, deposit/last-slot/payout/restart/refund; isolated chain31337 and mock token, not public USDC. [Record](LOCAL_CHAIN_VERIFICATION.md) |
| Prior hosted suite48passed/6intentional skips | Anonymous practice, privacy, five languages and desktop/mobile Chromium on deployment35ad6d7. [Historical release record](MONAD_UI_VERIFICATION.md) |
| Latest focused UI suite20passed | Local desktop/mobile Chromium; new copy, header and CTA checks; not a fresh hosted full run |
| Latest 20 locale/width combinations | Local five languages × 360/390/768/1440px; no horizontal overflow or runtime errors; scroll reveal observed. Ignored evidence `.local/qa/quiet-ui-verification.json` |
| Web/Functions typechecks and focused lint | Passed after free-recovery and wallet fee changes; latest production cloud build also passed |
| Current direct production flow | Real creator login/draft/approval/funding; separate participant login/quiz/QUEUED/My rewards Paid/0.1 USDC/receipt; independent finalized chain proof |
| Current anonymous production APIs | `/api/status` 200 with authentication/database/recovery/escrow/key-availability true and gasSponsorship false; `/api/rewards`, `/api/creator/campaigns`, `/api/internal/recovery` 401 without authentication |
| Small timing/creator UX regression | Local desktop/mobile: existing wizard validation and new default-period/review checks passed; opening/closing without refresh or periodic refetch passed after accounting for development Strict Mode's initial double read |

These counts overlap earlier suites where stated; they are not independent users, distinct product cohorts or public payout counts. Browser emulation is not actual iOS Safari, Android hardware or Telegram's in-app browser. Earlier anonymous HTTP records prove200public pages/status/OG and401private APIs with private/no-store caching, but their all-false integration flags are historical rather than the current deployment state.

The follow-up UX patch defaults participation to seven days and receipt deadline to fourteen days, reviews all three dates in the selected locale, and reevaluates event opening/closing every five seconds. It adds no polling calls and leaves the server authoritative. Local desktop/mobile checks passed, and the patch is deployed in READY release acf5b73; a complete fresh hosted regression is separate.

No production mode silently substitutes fake identity, balances, receipts or coupon value. Mainnet remains disabled. Tests, source verification and deployed settings do not replace a real finalized campaign payment.

## Next evidence to record

1. Primary Consumer submission is READY FOR JUDGING; both independent payment proofs and re-login are verified. Maintain the live judge event and honest remaining count.
2. Additional product checks as relevant: retry handling, approved outgoing transfer and unused-budget reclaim. These are not separate mandatory portal uploads.
3. Protected daily recovery and live outage/restart behavior; the normal request-assisted payout path is already observed.
4. Keep video watch playback distinct from an optional additional signed-out check, and gather actual independent user/operator evidence.
5. Primary Consumer submitted/READY FOR JUDGING; optional Privy bounty remains separate. The unqualified Community bounty is already deselected.

See [submission checklist](SUBMISSION_CHECKLIST.md), [deployment](DEPLOYMENT.md) and [competition review](COMPETITION_REVIEW.ko.md). This snapshot supersedes older “integrations unset / GitHub403 / submission hold” statements; those remain historical in earlier run logs.
