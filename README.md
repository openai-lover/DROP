# DROP

**Playful rewards for communities. Real payouts, without the wallet hassle.**

DROP lets Telegram KOLs and community operators share a short catch game or quiz, then manage its rewards. Participants use an ordinary HTTPS website, one Privy login and an embedded wallet. DROP is not a Telegram Mini App.

한국어: KOL이 커피와 코인을 재미있게 뿌리고, 지급까지 관리하는 도구. **그냥 뿌리지 말고, 플레이하게 하자.**

## Current state

**Public web deployment:** [drop-omega-five.vercel.app](https://drop-omega-five.vercel.app/), production **READY** on `teamstartup/drop` (Hobby). The public homepage and anonymous practice are accessible. Login, authenticated creation, app-data access and real payouts remain explicitly unavailable until their integrations are configured.

The implementation targets **Vercel Next.js + Firebase Firestore**, with prepared Firebase Functions processing source and **Monad Testnet** as the default. The confirmed Firebase project is **`drop-5a400`**, display name **DROP**, on the free **Spark** plan. **No billing upgrade is currently authorized; do not upgrade it without a new owner instruction.** Functions cloud deployment requires Blaze and is blocked under the current plan; its durable processing is not operating in the cloud.

The cloud **`(default)` Firestore database exists in `asia-northeast3`**, using Standard edition / Native mode. Its rules and indexes were deployed successfully. This verifies data configuration; hosted application access and cloud payout processing remain unverified.

Local checks passed: **frozen installation for both workspace packages**, **clean lint**, **61 server tests across seven files**, **30 Playwright checks with six intentional profile skips**, app typechecking and the Functions build. The server suite includes 20 actual Firestore emulator cases and test-generated Privy JWT signature checks; blockchain responses in those tests are mocked. Browser coverage uses desktop/mobile Chromium against the local app, covering unpaid practice, creator validation, four widths, language, keyboard/touch input and anonymous API/privacy boundaries. Contract checks remain **42 unit/fuzz tests + two invariant properties**, using official Forge 1.8.5 with Monad execution rules.

Two additional [local chain/worker integration tests](docs/LOCAL_CHAIN_VERIFICATION.md) passed with actual Anvil RPC, actual production signing/receipt/worker code and real Firestore transactions. They verify deposit, two-slot/three-player allocation, actual local token balances/events, persisted broadcast→mined restart without another relayer transaction, stale leases and unused-budget refund. Only test configuration is substituted: **isolated chain 31337 and a local mock token**, with test-only time advancement for refund. They are not public Monad/official USDC transactions or real user login.

A read-only real Monad Testnet check verified chain `10143`, official USDC bytecode and six decimals, and finalized block `70687560`. It did **not** verify a public escrow deployment or payment. The Vercel cloud build passed locked installation, Next compilation and TypeScript with Node 24.21 / pnpm 11.25.0. A separate run against the actual public URL passed **30 Playwright checks / six intentional profile skips in 44.7s**, covering unpaid catch/quiz, expiry/retry, disabled creation/login, KO/EN, four widths, keyboard/touch and anonymous API privacy, with no runtime page errors. This is the same browser coverage as the local run, not 60 unique tests. **Real Privy onboarding, Vercel app-data IAM, public Monad funding/payout, authenticated browser flows, a cloud payment worker, user interviews/traction and final videos remain incomplete.**

**Contest submission is on hold at the user's explicit instruction.** Reading the logged-in portal does not authorize filling, saving, uploading or submitting an application.

The authenticated portal's displayed deadline is **2026-10-14 12:59 GMT+9 (Asia/Seoul)**. Use this local deadline rather than the public date-only “Oct 13” label. Confirmed portal resources and their limits are recorded in [official sources](docs/OFFICIAL_SOURCES.md).

See [integration status](docs/INTEGRATION_STATUS.md), [requirements audit](docs/REQUIREMENTS_AUDIT.md) and the [contract run record](contracts/verification.json) for the scope of evidence.

## Product paths

| Route | Purpose |
| --- | --- |
| `/` | Product introduction; actual event availability |
| `/practice` | Anonymous practice with no reward entitlement |
| `/d/[slug]` | Public rules → authentication → catch/quiz → verified reward status |
| `/me/rewards` | Persistent receipts, chain balance, private coupons and approved same-network transfer |
| `/creators` | Operator introduction |
| `/dashboard/new` | Game, reward, limits, deadlines and budget preparation |
| `/dashboard/[id]` | Owner-only participation, funding, payouts and remaining-budget information |
| `/judges` | Judge entry point and integration-readiness guidance |
| `/security` | Account, asset and trust-boundary information |

The policy is **FIRST_N_VERIFIED**: the first N authenticated accounts accepted atomically by the server receive one identical reward each, subject to wallet/account duplicate guards. Game success is not payment confirmation. Authentication does not prove a unique human. Coupon delivery/viewing does not prove store redemption. Demo coupons cannot be redeemed; testnet USDC has no financial value.

## Runtime

- Node.js `>=22.12`; Node 22 is the configured Firebase Functions runtime.
- pnpm `11.25.0`, with the repository lockfile.
- Java **21+** for the Firebase CLI v15 Firestore emulator.
- Official Foundry **1.8+** for contract checks/deployment; the recorded run used 1.8.5 and Solidity 0.8.28.

Pinned application packages include Next 16.4.0, React 19.3.0, Tailwind 4.3.3, Privy React 3.48.1, Privy server-auth 1.32.5, firebase-admin 14.5.0, firebase-functions 7.4.0, firebase-tools 15.33.0, viem 2.57.5 and OpenZeppelin 5.6.1. `package.json` and the lockfile are authoritative; these are implementation pins, not a claim that each is globally latest.

Install [Node.js](https://nodejs.org/), [Java 21+](https://adoptium.net/temurin/releases/?version=21) and the supported tools if missing. Match the package manager pin, then install the repository dependencies:

```text
node --version
npm install --global pnpm@11.25.0
pnpm --version
pnpm install --frozen-lockfile
```

Do not use an unlocked install to hide a manifest/lockfile mismatch. Resolve the mismatch and record the successful locked installation before publishing.

## Windows local setup

Use PowerShell with Node/pnpm available. Copy the template:

```powershell
Copy-Item -LiteralPath '.env.example' -Destination '.env.local'
./scripts/start-firebase-emulator.ps1
# Optional explicit runtime paths:
# ./scripts/start-firebase-emulator.ps1 -NodePath 'C:/tools/node/node.exe' -JavaHome 'C:/tools/jdk-21'
```

The emulator uses only `demo-drop`, `127.0.0.1:8089` and an ignored local cache. Load its non-secret test settings into this shell, then start the website:

```powershell
Get-Content -LiteralPath '.local/firestore-test.env' | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}
$env:DROP_LOCAL_EMULATOR = 'true'
pnpm dev
```

Open [the local website](http://127.0.0.1:3000). Set actual Privy credentials in the ignored `.env.local` when you are ready to test real login. Without those credentials, the public/practice experience can be inspected, while authenticated rewards remain explicitly unavailable. A synthetic test identity is never a public login option.

After testing, stop only this checkout's emulator with `./scripts/stop-firebase-emulator.ps1`. See [Firebase/Vercel local operations](docs/FIREBASE_VERCEL.md). If Foundry setup on Windows is inconvenient, use an official supported binary or WSL for the contract commands; do not substitute an unrelated EVM runner and report it as Monad Foundry.

## Linux / macOS / WSL local setup

Use the same Node/pnpm pins and Java 21+, then run these in separate shells from the repository root:

```bash
cp .env.example .env.local
pnpm firebase:emulators
```

```bash
export FIREBASE_PROJECT_ID=demo-drop
export GCLOUD_PROJECT=demo-drop
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8089
export DROP_LOCAL_EMULATOR=true
pnpm dev
```

Stop the foreground emulator with Ctrl+C after tests finish. In WSL, keep the application and emulator in the same environment; `127.0.0.1` cannot be assumed to refer to the other environment. No database migrations or additional authentication provider are needed.

## Checks and local processing

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:contracts
pnpm functions:build
pnpm build
```

With compiled contracts and the loopback Firestore emulator available, `node scripts/local-chain-verify.mjs` reproduces the separate opt-in local settlement run. It starts/stops its own isolated Anvil child and project, never a public-network deployment. See its [scope and prerequisites](docs/LOCAL_CHAIN_VERIFICATION.md).

For real Firestore integration coverage, load the emulator settings above before `pnpm test`. Those cases otherwise skip, so a green run without the emulator is narrower evidence. Contract tests use local fixtures. Neither case proves a live Monad transaction or real Telegram/email login. Browser and real-device coverage must be recorded separately.

Next loads `.env.local`; standalone scripts do not automatically inherit it. With an approved private configuration, a Node 22 environment-file invocation can run the diagnostic processor without printing values:

```text
node --env-file=.env.local --import=tsx scripts/worker.ts --once
node --env-file=.env.local --import=tsx scripts/worker.ts --reconcile
```

`pnpm worker` is also available when server variables are already in the process environment. It is a local/manual processor. The prepared Functions created-job, one-minute retry and ten-minute reconciliation handlers define the durable cloud-processing design, but cannot be deployed on the confirmed Spark plan. No timer attached to a Vercel request replaces the missing durable processor. Do not open funded public events until an approved running processor is verified.

## Configuration and deployment

The template lists the exact names. The approved public/practice deployment deliberately leaves integration credentials unset and protected actions disabled. Enable authenticated rewards only after privately configuring and verifying Firebase app access, Privy settings, the approved testnet escrow and separate authorization/relayer/coupon/nullifier secrets plus a durable processor. Never expose private variables through `NEXT_PUBLIC_`.

Receiving a reward uses DROP's restricted claim relayer and its MON budget. Sending received USDC uses the user's Privy wallet and a different sponsorship path: **TEE execution, enabled app-pays sponsorship, configured Monad Testnet support, allowed client transactions and available sponsorship budget** must all be configured. `NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED=true` only enables the UI; it does not activate or prove the provider service.

Firebase Functions deployment requires **Blaze billing**, while `drop-5a400` remains on **Spark**. No plan upgrade was performed or authorized; the cloud processor is not running. The Vercel website is deployed, and Firestore database/rules/indexes are confirmed; Vercel server identity/data access still needs configuration. Local tests use synthetic emulator projects. Follow [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the pinned normal-upload CLI workflow and evidence. Mainnet remains disabled and unverified.

## Documentation

- [Product](docs/PRODUCT.md), [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md)
- [Deployment](docs/DEPLOYMENT.md), [integration status](docs/INTEGRATION_STATUS.md), [Firebase/Vercel](docs/FIREBASE_VERCEL.md)
- [Research forms](docs/USER_TESTS.md), [distribution and economics hypotheses](docs/DISTRIBUTION.md)
- [3-minute demo](docs/DEMO_3MIN.md), [2-minute pitch](docs/PITCH_2MIN.md), [submission checklist](docs/SUBMISSION_CHECKLIST.md)
- [Official sources](docs/OFFICIAL_SOURCES.md), [Korean Metropolis guide](docs/METROPOLIS_GUIDE.ko.md), [AI disclosure](docs/AI_USAGE.md), [requirements audit](docs/REQUIREMENTS_AUDIT.md)

The requested source destination is [openai-lover/DROP](https://github.com/openai-lover/DROP). The GitHub push returned **403**, and that remote repository remains empty. Vercel received the local source at commit `3ff3025`; direct deployment is not public GitHub publication or an accepted contest submission. Keep actual credentials, coupon contents and private research outside public source and artifacts.
