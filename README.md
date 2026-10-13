# DROP

**Make your community's next reward drop a game.**

DROP turns a shared link into a short catch game or quiz, with a fixed reward budget and a receipt participants can keep. Community operators create an event; players sign in with Privy and use an embedded wallet. The Monad arcade, English default and five languages make the first visit approachable.

[**Play DROP**](https://drop-omega-five.vercel.app/) · [**Judge guide**](https://drop-omega-five.vercel.app/judges) · [**Public source**](https://github.com/openai-lover/DROP)

## Try it in two minutes

1. Open [practice](https://drop-omega-five.vercel.app/practice) and try catch or quiz without an account. Practice awards no tokens or redeemable coupons.
2. Open [My rewards](https://drop-omega-five.vercel.app/me/rewards), sign in with Google or email, and let Privy create your embedded wallet. Google sign-in, persistent cloud records and actual Monad Testnet balance reads have been verified on production.
3. Join [the live funded judge catch event](https://drop-omega-five.vercel.app/d/metropolis-play): three catches in 18 seconds, up to three attempts, 20 total rewards of 0.1 test USDC (19 allocations remained after verification). Play closes 20 October 2026 at 16:18 UTC. After qualifying, watch My rewards for the confirmed receipt. No MON is needed to receive through DROP's relayer.

Choose English, 한국어, 日本語, 简体中文 or Español in the header. The selected language persists; organizer-written titles and questions retain their original text. DROP is an ordinary HTTPS website suitable for sharing in Telegram, rather than a Telegram Mini App.

Built by **solo developer Gyu-min Kim**. [Technical demo](https://youtu.be/Lfuvsvowj30) · [Founder pitch](https://youtu.be/AlWM6csYk5w). Final155.32s/107.94s exports are uploaded Unlisted and watch playback is observed; signed-out verification is not claimed.

## Why DROP

- **A reward promise with a budget:** the operator fixes reward, quantity, game rules and deadlines before publication, then funds a USDC escrow.
- **A fair allocation order:** FIRST_N_VERIFIED atomically assigns the first N server-accepted completions, with account and wallet duplicate guards.
- **A receipt rather than a score:** gameplay, reward reservation, pending transaction and finalized payment are separate states. Confirmed payments require the exact onchain event and canonical finalized receipt.
- **A complete reward loop:** persistent rewards, private encrypted coupon delivery, user-approved USDC transfers and unused-budget reclaim share the same operator/participant journey.
- **Recovery that survives a restart:** signed transactions, nonces, leases and progress live in Firestore. Retries preserve the reward and reconcile previous broadcasts before another payment attempt.

## Live status and proof

**Final submission:** Consumer Products & Payments + **Privy** is **READY FOR JUDGING**, re-submission confirmed `2026-10-13T16:57:26.785Z` (Oct14 01:57 KST); portal Save16:56UTC7/7. Initial primary confirmation: `2026-10-13T16:39:30.988Z`. Required Privy integration description:1,808characters. Separate optional Privy video omitted. Actual wallet creation/creator contract transactions are verified; DROP pays receiving gas through its own relayer, not Privy sponsorship. `acf5b73` is the deployed app baseline; same-human technical accounts are not traction.

Snapshot: **2026-10-14, Asia/Seoul**. Production [DROP](https://drop-omega-five.vercel.app/) is READY at deployed application baseline [`acf5b73`](https://github.com/openai-lover/DROP/commit/acf5b73). Public source, real Google login, embedded wallet creation, server token verification, keyless Vercel-to-Firestore access and a real quiz-to-payment flow are verified. Email login is configured but its delivery flow has not yet been exercised.

The real Monad Testnet escrow is **`0x22acf105A1af3f104f62e06fD813e49Af9358379`**, chain **10143**, using Circle's official testnet USDC. Its deployment receipt, compiled runtime and immutable settings were verified; [Sourcify records a perfect source match](https://sourcify-api-monad.blockvision.org/check-by-addresses?addresses=0x22acf105A1af3f104f62e06fD813e49Af9358379&chainIds=10143). The isolated payout relayer received **0.5 test MON**, then a verified **3.4 test MON** replenishment after the first claim. [Deployment](contracts/deployment/testnet-deployment.public.json) · [Initial funding](contracts/deployment/relayer-funding.public.json) · [Replenishment](contracts/deployment/relayer-topup.public.json).

The first campaign's **5 test USDC budget (0.1 × 50)** was funded through two visible Privy approvals and reconciled by the server. Independent public-chain reads verified the canonical finalized receipt, exact approval/deposit, rules and actual USDC balance deltas. [Funding evidence](contracts/deployment/live-campaign-funding.public.json) · [Funding transaction](https://testnet.monadvision.com/tx/0x4f10e52e5a77c8c24c42dc605e6e3413010fb2ae9dd1b13657eb897f30576637). This first rehearsal event has a short play window; use the judge guide for current event availability.

**Actual production payout:** a separate authenticated participant completed the quiz, moved from QUEUED to **Paid**, and saw **0.1 test USDC** plus its receipt in My rewards. Independent chain verification matched the canonical finalized receipt, EIP-712 signer, exact RewardPaid/USDC Transfer and claimed state. The participant's USDC rose from 0 to 0.1 while MON remained 0 and wallet nonce remained 0; DROP's relayer paid 0.043855716 test MON. [Payment proof](contracts/deployment/live-participant-payment.public.json) · [Actual receipt](https://testnet.monadvision.com/tx/0x9cbb35fcc0ba09119e87452ff5f2d6d534d4a1ae55682ce0c080260f98c5678c).

Reloading and actual sign-out/re-login preserved Paid/0.1 test USDC; a repeat attempt was rejected without a second award. This is one technical verification payout; both accounts were controlled by the same human. It is not independent traction or proof all 50 rewards were paid. Outgoing transfer, refund, independent research and final video playback checks remain open. [Current evidence](docs/INTEGRATION_STATUS.md).

The separate [judge catch event](https://drop-omega-five.vercel.app/d/metropolis-play) is actually funded with **2 test USDC (0.1 × 20)**. Independent finalized reads verify its [funding/rules](contracts/deployment/judge-event-funding.public.json). The same technical participant completed Catch and the app showed its second **Paid/0.1** receipt, bringing the real wallet balance to **0.2 test USDC**. [Independent catch proof](contracts/deployment/judge-event-payment.public.json) · [Actual catch receipt](https://testnet.monadvision.com/tx/0xbd8d5ce90d6d059931f19050744b546567215f337532a59fa8a481fe4d15ce6e). Independent catch-payment audit passed; these are two technical payouts controlled by one human, not independent traction.

Recorded checks:

| Evidence | Scope |
| --- | --- |
| 96 passing server/language tests; three additional wallet-request tests | Includes 26 real Firestore emulator cases; chain responses and wallet SDK calls are explicit test adapters |
| 42 contract unit/fuzz tests + two invariant properties | Official Forge 1.8.5 / Monad execution; local token fixtures |
| Two actual local chain/worker integration cases | Anvil + Firestore + production signing/receipt code; isolated chain 31337, mock token |
| Earlier hosted browser suite: 48 passed / six intentional profile skips | Anonymous/practice, languages, responsive layout and private API boundaries on the prior public release |
| Latest UI: 20 focused browser cases + 20 language/width combinations | Local desktop/mobile Chromium; all five languages at 360/390/768/1440px; no horizontal overflow |

The production funding and quiz payout were checked through the actual authenticated UI and independent public-chain reads. A fresh complete hosted browser regression and the remaining feature branches are separate checks. Test counts are not user counts.

## Deployment model and limits

Next.js runs on **Vercel Hobby**, data on **Firebase Spark**, and identity/wallets through **Privy**. Firestore uses keyless Vercel OIDC / GCP Workload Identity Federation, with production-specific trust and no generated service-account private key.

The free worker mode processes at most one of the authenticated user's rewards after eligible requests; this path completed the real payout above. A protected daily Vercel cron attempts at most three jobs and three expired-award probes, with its hosted invocation still unverified. Firestore keeps the outbox durable; execution is bounded and depends on requests or the daily invocation. It is not a continuously running or minute-scheduled worker. Prepared Firebase Functions are not deployed because Spark cannot deploy them. [Runtime setup and limits](docs/FIREBASE_VERCEL.md).

Receiving a reward uses DROP's restricted relayer and its test MON. Operator funding, refund and participant outgoing transfers require a visible user approval and wallet-paid test MON unless genuine Privy sponsorship is separately enabled. No universal zero-fee claim is made.

This release is **testnet only**: test USDC has no financial value. The contract is unaudited; server grading/signing and RPC providers remain trust dependencies. Authentication is not proof of a unique human. Coupon delivery is not store redemption; demo coupons cannot be redeemed. Mainnet and paid plan upgrades are outside the approved scope. [Security](docs/SECURITY.md).

## Local development

Use Node **22.12+**, pnpm **11.25.0**, Java **21+** for Firestore tests, and official Foundry **1.8+** for contract checks. Package manifests and the lockfile are authoritative.

```text
pnpm install --frozen-lockfile
```

Copy `.env.example` to ignored `.env.local`, then start the local Firestore emulator with `./scripts/start-firebase-emulator.ps1` on Windows or `pnpm firebase:emulators` on other platforms. Use only synthetic project `demo-drop` and loopback `127.0.0.1:8089`; load the generated `.local/firestore-test.env` in the test shell. Start the web with `DROP_LOCAL_EMULATOR=true` and `pnpm dev`. Real login still requires your own Privy configuration; there is no public test identity or fake payout fallback. [Detailed setup](docs/FIREBASE_VERCEL.md).

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:contracts
pnpm functions:build
pnpm build
```

Firestore integration cases skip without their isolated emulator settings. Browser tests and local-chain verification have separate prerequisites; see [local chain evidence](docs/LOCAL_CHAIN_VERIFICATION.md) and [deployment](docs/DEPLOYMENT.md). Keep secrets, tokens, real coupon payloads and private research out of source and screenshots.

## Further reading

- [Product](docs/PRODUCT.md), [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md)
- [Integration status](docs/INTEGRATION_STATUS.md), [deployment](docs/DEPLOYMENT.md), [Firebase/Vercel](docs/FIREBASE_VERCEL.md)
- [User research](docs/USER_TESTS.md), [distribution](docs/DISTRIBUTION.md), [AI disclosure](docs/AI_USAGE.md)
- [Technical demo](docs/DEMO_3MIN.md), [founder pitch](docs/PITCH_2MIN.md), [submission checklist](docs/SUBMISSION_CHECKLIST.md)
- [Official Metropolis sources](docs/OFFICIAL_SOURCES.md), [한국어 대회 안내](docs/METROPOLIS_GUIDE.ko.md), [경쟁력 검토](docs/COMPETITION_REVIEW.ko.md)

The user authorizes final submission after readiness. Portal6/6 was saved at16:29UTC and actual catch/access updates at16:35UTC on13October; the primary Consumer entry is confirmed READY FOR JUDGING at2026-10-13T16:39:30.988Z. The recorded deadline is **2026-10-14 12:59GMT+9 /Asia/Seoul**. [Submission record](docs/SUBMISSION_CHECKLIST.md).
