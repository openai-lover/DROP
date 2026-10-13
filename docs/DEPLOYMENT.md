# DROP deployment and operations

Target: **Vercel Next.js web/API + Firebase Firestore + persistent payout/recovery records + Privy + Monad Testnet escrow**. Free request-assisted processing and a protected daily Vercel cron are now prepared. Firebase Functions provides an optional frequent processor, but deployment remains blocked by Spark. Privy is the sole user identity/wallet provider. DROP uses ordinary HTTPS links, never Telegram Mini App authentication.

**Public Vercel web is deployed:** [drop-omega-five.vercel.app](https://drop-omega-five.vercel.app/), in `teamstartup/drop` / Hobby. On 2026-10-14 owner-approved exact-production-subject WIF trust and private Vercel integration settings were configured, including the actual Privy app and testnet/recovery settings. The revised code release, real sign-in/data access, escrow receipts and worker execution still require production verification. Earlier deployment evidence covers anonymous practice; configuration alone does not prove a working payout flow.

Latest root verification reports the real Privy server API succeeded with zero users, the exact production origin and email/Google/EVM wallet settings are configured, the Monad Testnet escrow is verified, and the relayer holds 0.5 test MON. This does not yet prove a real production sign-in, game qualification, funded campaign payout or outgoing user transaction.

The Firebase project is **`drop-5a400` / DROP / Spark**. Its `(default)` Standard / Native Firestore in `asia-northeast3` was CLI-confirmed, created `2026-10-13T13:01:16.609278Z`; reviewed rules/indexes were deployed. **No billing upgrade is currently authorized.** No Functions or live payment deployment is inferred from web hosting. The instructions distinguish completed web/data configuration from the remaining integrations.

**The user now authorizes completing the application, uploading demo/pitch videos to the logged-in SLIME CEO! YouTube channel, improving the product, and final submission after readiness checks.** This supersedes the earlier submission hold. Use `https://x.com/AlphaGgang` as the supplied X profile. Claims must match verified behavior; do not invent traction or team credentials. Billing upgrades and mainnet transactions remain outside the authorized scope.

## Runtime and build

The root package requires Node `>=22.12`, pins pnpm `11.25.0`, and defines direct Next.js/TypeScript build commands. The Functions package targets Node `22` with `firebase-admin 14.5.0` and `firebase-functions 7.4.0`; root CLI is `firebase-tools 15.33.0`. Use the actual lockfile and package manifests.

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm functions:build
pnpm build
```

Earlier locked installation, Functions build and Next production rebuild passed. After the free recovery/OIDC changes, server and language checks passed 96 tests across 12 files, including 26 real isolated Firestore emulator cases; both web and Functions typechecks passed. Chain responses in that emulator suite use explicit test mocks. The separate two-case local Anvil verification remains distinct. The current revised UI/build and real hosted integration must be checked again. Functions predeploy still builds `functions/lib/functions/src/index.js`; it does not authorize or prove a cloud Functions deployment.

## Local development and tests

See [README.md](../README.md) for Windows and Linux/macOS/WSL instructions, and [FIREBASE_VERCEL.md](FIREBASE_VERCEL.md) for managed Windows emulator lifecycle. Java 21+ is required for CLI v15. Use the synthetic `demo-drop` project and `FIRESTORE_EMULATOR_HOST=127.0.0.1:8089`; no cloud credentials are needed for that local Firestore runtime.

The start script writes ignored `.local/firestore-test.env`, verifies an actual process plus Emulator Hub/listener, and reuses that process. Local development requires `DROP_LOCAL_EMULATOR=true`; tests run with `NODE_ENV=test`. Hosted deployments reject emulator use. Local test readiness does not satisfy a hosted product-link requirement.

For opt-in actual local settlement verification, compile the contracts and run `node scripts/local-chain-verify.mjs`. Its isolated Anvil listens at `127.0.0.1:18547`, chain 31337 / Monad execution family, and uses a fresh `demo-drop-local-chain-*` Firestore project. Production chain/receipt/worker methods execute without chain/receipt mocks; only test config and identity fixtures are substituted. It deploys a **local mock six-decimal token**, not Circle USDC. Local expiry testing advances only this isolated node's time. [LOCAL_CHAIN_VERIFICATION.md](LOCAL_CHAIN_VERIFICATION.md) records two passing cases in 62.72s and the reproducible boundaries.

For direct script diagnostics, Node's environment-file loading keeps private values out of command arguments:

```text
node --env-file=.env.local --import=tsx scripts/worker.ts --once
node --env-file=.env.local --import=tsx scripts/worker.ts --reconcile
```

Only run processing against an approved test environment and budget. Reconciliation reports contain operational state; keep them private where they could identify participants or unreleased campaigns. Do not shell-source an unreviewed dotenv file.

## Owner configuration

The actual project identifier was confirmed from the user's exact Firebase console URL: **`drop-5a400`**. The display name is DROP and billing remains Spark. The subsequent CLI verified the `(default)` database, Standard / Native mode, `asia-northeast3`, and successful rules/indexes deployment. These observations do not verify Vercel service-account IAM, app data access, Functions or account details beyond the selected project. Keep the synthetic local `demo-drop` settings separate from this cloud project and from any future mainnet environment.

| Variable / setting | Runtime | Purpose and handling |
| --- | --- | --- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Vercel/browser | Actual Privy app ID; public identifier only |
| `PRIVY_APP_SECRET` | Vercel server | Verify/fetch authenticated Privy users; private |
| `FIREBASE_PROJECT_ID` | Vercel / Functions | Actual environment's Firestore project; Functions can derive runtime `GCLOUD_PROJECT` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Vercel server | Private single-line service-account JSON for the selected project; no public prefix/logging |
| `FIREBASE_CREDENTIAL_MODE` | Vercel server | Explicit `vercel-oidc` selects keyless federation; default `adc` preserves existing certificate/ADC behavior |
| `GCP_PROJECT_NUMBER`, `GCP_SERVICE_ACCOUNT_EMAIL` | Federated Vercel server | Actual project metadata and same-project service account; no private key |
| `GCP_WORKLOAD_IDENTITY_POOL_ID`, `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID` | Federated Vercel server | Exact configured Google pool/provider; production-only subject trust |
| `GCP_OIDC_AUDIENCE` | Federated Vercel server | Optional exact HTTPS provider resource audience; blank uses Vercel's default team audience |
| Runtime application-default identity | Firebase Functions | Use its selected least-privilege runtime service account; do not distribute its private key to the browser |
| `DROP_CHAIN_ID` | Both servers | Default `10143`; mainnet is separately disabled |
| `DROP_RPC_URL` | Both servers | Approved Monad endpoint; provider URLs may contain secrets and must not be logged |
| `DROP_ESCROW_ADDRESS` | Both servers | Actual verified deployed escrow, not a test fixture |
| `DROP_AUTHORIZATION_PRIVATE_KEY` | Secret Manager / signing server | Authorize fixed awards; keep separate from the relayer key |
| `DROP_RELAYER_PRIVATE_KEY` | Secret Manager / payout processor | Sign only constructed escrow claims; dedicated bounded MON budget |
| `PARTICIPANT_NULLIFIER_SECRET` | Vercel server | Campaign-private participant identifiers; protect and preserve for existing campaigns |
| `COUPON_ENCRYPTION_KEY` | Private web/processor configuration | Protect authorized coupon inventory; preserve required decryption continuity |
| `DROP_CONFIRMATIONS` | Both servers | Default `2`; receipts/events/state must agree before confirmation |
| `DROP_MAX_RELAYER_FEE_GWEI`, `DROP_MAX_RELAYER_TX_COST_MON` | Processor | Configured safety caps; template values are caps, not a forecast of transaction cost |
| `NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED` | Vercel/browser | UI availability flag only; provider setup and actual transfer verification remain required |
| `DROP_WORKER_MODE` | Vercel server | `disabled` default; `request` enables bounded authenticated after-work and daily recovery; `external` leaves work to a separately operated consumer |
| `CRON_SECRET` | Vercel server | Private value of at least 32 characters; Vercel cron supplies its Bearer header; never publish or place it in command arguments |
| `DROP_FUNCTION_REGION` | Functions deployment | Source default `asia-northeast3`, matching the confirmed database region; no Function deployed |
| `FIRESTORE_EMULATOR_HOST`, `DROP_LOCAL_EMULATOR` | Local only | Never configure on hosted Vercel or live Functions |

Use `.env.example` as the authoritative template. Next reads ignored `.env.local`; standalone processing needs process variables or an explicit environment file. Functions secrets are bound by `defineSecret` in `functions/src/index.ts`. Other Functions settings belong in the chosen environment's private configuration. Do not publish a filled template, downloaded service-account file, coupon content or private key.

## Free Vercel runtime and keyless Firestore

The approved federation configuration uses Firebase project `drop-5a400`, Google project number `70252046671`, pool `drop-vercel`, provider `vercel-production`, and runtime account `drop-vercel-runtime@drop-5a400.iam.gserviceaccount.com`. Give only the exact Vercel production subject `roles/iam.workloadIdentityUser` on that account, and give the account `roles/datastore.user` on the selected project. The provider must enforce the exact issuer/project/environment; STS and IAM Credentials APIs support exchange/impersonation. No service-account private key is created for this path. [Vercel GCP federation](https://vercel.com/docs/oidc/gcp)

The adapter uses official `@vercel/oidc 4.0.0` and `google-auth-library 11.3.0`. It obtains the current subject token when Google refreshes credentials and sends it only to the fixed Google exchange endpoint. It does not log or persist tokens. A bare `VERCEL_OIDC_TOKEN` does not constitute a Google credential or IAM grant. Existing certificate/ADC and isolated emulator paths remain available. Actual production exchange and data access remain verification gates.

In `DROP_WORKER_MODE=request`, successful authenticated reward-list, game-submit and reward-retry responses schedule Next `after()` work for that verified user's rewards. Dispatch is persistently throttled to once per 15 seconds and one job per invocation. Background interruption leaves the outbox and prepared nonce recoverable; it does not mark delivery complete. [Next after](https://nextjs.org/docs/app/api-reference/functions/after)

`vercel.json` also schedules `/api/internal/recovery` with `0 3 * * *` UTC, once per day. The route rejects absent/incorrect secrets with 401 and rejects disabled recovery. Each accepted run has a persistent lease/cooldown, at most three job attempts and three expired-award probes, and a soft 25-second budget. A pending RPC can exceed the soft budget; the platform limit is 60 seconds. The existing canonical receipt, finalized-state, nonce-drain, lease/CAS and fee checks remain mandatory. Persisted log cursors advance in bounded pages. No request reports a pending transaction as paid. [Hobby scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)

This is request-assisted execution with a low-volume daily fallback, not an independent minute-scheduled consumer. Hobby cron can run at any point within its scheduled hour. Under no traffic or a large backlog, completion can be delayed; do not advertise an unconditional payout-latency guarantee. Full frequent execution still needs a separately authorized consumer. Spark Functions and paid resources remain unavailable under the current no-upgrade instruction.

## Firebase cloud data and durable processing

Deploying Functions requires **Blaze**, and scheduled retry/reconciliation uses billable Cloud Scheduler. The confirmed project remains **Spark** and **no billing upgrade is currently authorized**. Therefore **do not deploy Functions, activate paid scheduling/Secret Manager resources, or change the plan as part of these steps**. A future owner instruction can change that authorization; it has not happened. Local Functions source/build is useful engineering work, but it does not operate a cloud payout queue. [Firebase deployment prerequisites](https://firebase.google.com/docs/functions/get-started), [Scheduler prerequisites](https://firebase.google.com/docs/functions/schedule-functions)

The currently allowed data/web setup is:

1. The intended `(default)` database in `drop-5a400` is confirmed in `asia-northeast3`. Preserve it and review Spark quotas against the planned pilot. The `icn1` Vercel setting is still a source configuration, not a verified hosted region.
2. The exact-production-subject Vercel WIF identity and private environment settings were configured with owner approval. Verify actual app-data access after releasing the adapter; browsers never receive private credentials. Privy remains the user login provider.
3. The reviewed `firestore.rules` and `firestore.indexes.json` were deployed successfully. Current rules deny direct clients; server/Admin APIs still enforce authentication and tenant permissions themselves. Configuration deployment is not an actual Vercel data-access test.
4. Testnet settings and free recovery source are prepared. Keep funded public events closed until actual approved funding, payout receipt and recovery are verified with the deployed code. IAM and environment upload alone cannot satisfy this gate.

The verified data-only command is reusable after reviewing any future configuration change:

```powershell
$dropCloudProject = 'drop-5a400'
pnpm exec firebase deploy --only firestore:rules,firestore:indexes --project $dropCloudProject --non-interactive
```

On Bash, use `pnpm exec firebase deploy --only firestore:rules,firestore:indexes --project drop-5a400 --non-interactive` after the same review and owner/project verification. The recorded execution exited 0: rules compiled, uploaded and released; indexes deployed successfully. No Functions, paid processor or billing upgrade was included.

| Function | Source behavior | Cloud verification required |
| --- | --- | --- |
| `rewardCreated` | `payoutJobs/{jobId}` creation → awaited `workerTick`; retry enabled | Actual Firestore outbox invokes the processor and obtains the persisted lease |
| `retryRewards` | Every minute, bounded retry loop | Stopped/expired leases and delayed jobs are revisited without a second payment |
| `reconcileRewards` | Every ten minutes → `reconcileAll` | Chain deposits/payouts/refunds and database totals reconcile |

The Functions table describes prepared source only, not active resources on Spark. If this architecture is later authorized on a compatible environment, Firestore events are at least once and unordered; schedules can overlap. Persistent leases fence stale workers, and prepared transaction bytes/hash/nonce remain durable across timeout or restart. Every follow-up mutation must respect the lease. A successful function upload/invocation or a transaction hash does not prove confirmed payout. [Firestore trigger semantics](https://firebase.google.com/docs/functions/firestore-events), [scheduled invocation semantics](https://firebase.google.com/docs/functions/schedule-functions)

## Privy and user transfers

The current actual Privy app enables email and Google login plus an Ethereum embedded wallet. The client keeps those methods and selects the embedded address explicitly. Verify the final production origin/OAuth redirects and wallet creation on a real sign-in. Ordinary Telegram OAuth is not currently enabled; do not claim it is working or use Telegram Mini App seamless authentication. Sharing a normal HTTPS link in Telegram remains independent of login.

Receiving from escrow uses DROP's restricted relayer and its MON balance; the recipient need not submit that reward transaction. Funding, budget recovery and outgoing USDC transfers are distinct user-approved transactions on chain `10143`. Without sponsorship, the selected user wallet pays network fees with test MON. The client shows that fee disclosure before the action and explicitly keeps a visible, cancellable Privy confirmation. Funding/refund ownership and outgoing sender wallet must match the current embedded address. [Privy transaction API](https://docs.privy.io/guide/react/wallets/embedded/prompts/transact)

`NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED=true` requests sponsored execution only after actual provider support, settings and credits are configured; the flag alone does not prove a free transaction. Paid sponsorship setup is not authorized. A funded test-MON wallet can use the normal path with the flag false. Test that cancellation sends nothing and that finalized receipts contain the matching USDC transfer before claiming success. The zero-MON outgoing-transfer case remains unverified without real sponsorship. [Privy gas setup](https://docs.privy.io/wallets/gas-and-asset-management/gas/setup)

Do not add an unrestricted administrator/session signer to recipient wallets. Do not promise fiat cash-out, exchange deposit compatibility or coffee conversion. Monad Testnet USDC is not money backed by real dollars and cannot purchase the demo coffee.

## Approved Monad Testnet escrow deployment

Use official Foundry 1.8+, `network = "monad"`, an owner-approved testnet deployer/keystore and bounded testnet budget. The deployment script requires explicit `DROP_DEPLOY_CHAIN_ID=10143`, Circle's official testnet USDC, and the actual deployer address. It rejects another chain/token. A local test fixture is not a Circle deployment.

| Network | Chain ID | Public RPC | Official USDC |
| --- | --- | --- | --- |
| Monad Testnet | `10143` | `https://testnet-rpc.monad.xyz` | `0x534b2f3A21130d7a60830c2Df862319e593943A3` |

On Windows, use a supported official Forge binary or WSL. On Linux/macOS/WSL, use the official installer described in the Monad guide. Configure the explicit public deployment values and a private keystore reference in that shell, then from `contracts/` simulate:

```text
forge script script/DeployDROP.s.sol:DeployDROP --rpc-url https://testnet-rpc.monad.xyz --account YOUR_APPROVED_KEYSTORE
```

Add `--broadcast` only for the approved actual testnet deployment and funded account. Do not paste a private key into shell history. Record the actual transaction receipt/address and verify the deployed source/bytecode using the current explorer workflow. Read chain ID, token/escrow code and six token decimals from the chain; inspect immutable owner/signer/token/rules/period and event data. [Official Monad Foundry guide](https://docs.monad.xyz/guides/deploy-smart-contract/foundry), [Circle addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)

Then configure the actual escrow on Vercel and Functions. Fund a campaign from its operator wallet with exact approval and budget; open it only after deposit receipt/event/contract state match. Measure real qualification → payout confirmation and recipient balance. Test a separately expired campaign's permitted original-operator reclaim; do not alter live time to fake it. No broadcast, funding, transfer or reclaim was performed by these documentation steps.

`pnpm verify:network -- --network-only` performs only network/token reads. The actual testnet run passed with chain `10143`, the official Circle USDC address, token bytecode, six decimals and finalized block `70687560`. Its report explicitly set `escrowVerified: false`. The complete `pnpm verify:network` requires an actual `DROP_ESCROW_ADDRESS` and additionally checks deployed code, token/chain getters and the EIP-712 domain; it exits 2 when no escrow is configured unless network-only mode is requested. Neither mode proves funding or payout. Load private process configuration safely and do not print a secret RPC URL.

## Vercel web deployment

The verified deployment uses the official pinned CLI and **normal file upload** from the checkout. The requested [GitHub destination](https://github.com/openai-lover/DROP) remains empty after a push returned 403, so the successful deploy did not depend on a GitHub import. From the repository root after owner login, the actual command is:

```text
pnpm dlx vercel@63.1.2 deploy --project drop --scope teamstartup --prod --yes
```

Use normal upload and inspect the selected files/count/bytes. **Do not use `--archive tgz` for this checkout.** In the observed CLI run, excluded-directory placeholders such as `.local` and `.tools` were recursively included by archive packaging, expanding it to about 1.1 GB. That attempt was cancelled at 285.2 MB transferred, before a deployment was created. The successful normal upload was **118 records / 1.2 MB**, and the cloud build confirmed **118 downloaded files**. This is an observed repository/CLI packaging issue, not a claim that every Vercel archive workflow fails.

The repository's `vercel.json` selects Next.js, locked pnpm installation, `pnpm build`, and `icn1`. The successful cloud runtime used Node **24.21** / pnpm **11.25.0**, completed locked installation, Next compilation in 42s, TypeScript in 19.7s and all 11 page builds. Firebase Functions independently targets Node22 and remains undeployed.

**Anonymous/practice deployment remains possible without credentials:** unset integrations fail closed and hosted emulator flags are forbidden. Production configuration has now been uploaded with owner approval, but actual functionality must be verified on the revised deployment before making live-flow claims. Check Firestore exchange/data access, Privy origin/login/wallet, the real testnet escrow, funding/receipts and free worker invocation. Sponsorship is optional; normal outgoing operations require test MON. Web availability and status booleans alone do not prove these services work.

At the public URL, a plain unauthenticated request returned200 with DROP content and no Vercel-login page; CUA inspection showed the public homepage and disabled login. Production Playwright then passed **30 checks / six intentional desktop/mobile profile skips**, exit0 in **44.7s**: unpaid catch keyboard/touch/18-second expiry, quiz success/retry, creator validation and disabled creation, KO/EN persistence, widths360/390/768/1440, anonymous API GET/spoofed POST401/no-store, and no runtime page errors. Current `.local/qa/desktop.png` / `mobile.png` capture the deployed site. This repeats the existing suite on hosting, not additional unique tests. Real Android/iOS/Telegram devices and authenticated payout/transfer/recovery still require separate evidence.

## Operations and recovery

Observe Firestore outbox age and job states, request wakeups, `recoveryRuns/daily`, daily cron outcomes, relayer MON/fee caps, test-MON sender balances, reconciliation differences and coupon inventory. Observe Functions only if a separately approved processor is actually deployed. Keep logs private; never log provider secrets, identity tokens, quiz answers or coupons. Avoid CLI commands that dump authenticated account objects.

A timeout may leave a live or already-mined transaction. Inspect persisted transaction bytes/hash/history and contract used-award state before resubmission; retain the same award identity. An expired prepared transaction must resolve its nonce before completion so later payouts are not blocked. Stale worker leases must not overwrite a confirmed award. The 61-test suite exercises chain response scenarios with mocks; the separate two-case local Anvil run additionally exercises actual broadcast/mining/receipt and durable restart without an extra relayer transaction. Public-network recovery remains to be observed.

Authenticated winners can request the persisted fixed-recipient proof when available. Direct recovery submission may require MON gas and is optional; do not make it the default consumer path. Preserve keys, project data, proofs and current campaign budgets when changing configuration. New data/project/secret settings require an explicit migration plan for outstanding campaigns, not a silent reset.

## Actual deployment record

| Artifact | Verified value |
| --- | --- |
| Local Next website | `http://127.0.0.1:3000`, homepage HTTP 200 and anonymous/practice Chromium coverage verified; no real-auth/live-payout claim |
| Local Firestore | Synthetic `demo-drop`, `127.0.0.1:8089`, live Hub/Java process verified |
| Server/language checks after free runtime changes | 96 passed across 12 files, exit 0; includes 26 actual isolated Firestore emulator cases, signed JWT tests and explicit chain-response mocks |
| Browser checks | Playwright: 30 passed + six intentional profile skips, exit 0 in 45.5s; desktop/mobile Chromium, unpaid practice/creator validation/language/privacy, four explicit widths |
| Contract checks | contracts/verification.json: Forge 1.8.5 / Monad execution, 42 unit/fuzz + two invariant properties, 0 fail/skip |
| Local chain/worker integration | Two passed in 62.72s; actual production RPC/signing/worker + Firestore, isolated Anvil chain31337/local mock token; no public deployment/payment |
| App typecheck / Functions build / Next production build | All passed locally; final Next rebuild after Open Graph fix exited 0; no hosting/cloud invocation inferred |
| Local production HTTP checks | Home/judges200; status200 with no-store/private; anonymous rewards/coupon401 with no-store/private |
| Local production Open Graph | Actual HTTP 200 / image/png, 49,610 bytes, 1200×630; pixels inspected; no published-campaign title/fixture claim |
| Final locked install / lint | Both workspace packages frozen install exit 0; root lint exit 0 with zero warnings, added local-chain files' static checks passed |
| Actual Firebase project | User-confirmed `drop-5a400`, display DROP, Spark free plan |
| Cloud Firestore database | `(default)`, Standard edition / Native mode, `asia-northeast3`; creation `2026-10-13T13:01:16.609278Z` confirmed by CLI |
| Cloud Firestore rules / indexes | Data-only deployment exited 0; rules compiled/uploaded/released and indexes deployed |
| Vercel IAM / integration environment | Owner-approved exact-production WIF trust and private settings configured on 2026-10-14; actual deployed exchange/login/app-data access pending |
| Free request/daily recovery | Source and typechecks ready; eligible own-user after-work plus protected once-daily Hobby cron; actual hosted invocation pending |
| Firebase Functions / scheduled processor | Not deployed; blocked by Spark under the no-upgrade instruction |
| Firebase Blaze upgrade | Not performed; do not upgrade |
| Vercel production web | [drop-omega-five.vercel.app](https://drop-omega-five.vercel.app/), READY, targetproduction, `teamstartup/drop`, Hobby |
| Vercel deployment identity | `dpl_3o35jn53ucDDU46NBHZZeD9BgeM4`; official CLI63.1.2 exit0; inspector URL above |
| Deployed local source / transfer | Commit `3ff3025`; normal upload118 records /1.2MB; cloud download118files; no archive |
| Cloud build | Node24.21 /pnpm11.25.0; locked install, Next42s, TypeScript19.7s, 11pages passed |
| Hosted public/browser scope | Plain GET200 /DROP content/no Vercel login; CUA homepage/login disabled; production Playwright30pass/6profile skips,44.7s, no page errors; auth/payment unavailable |
| Live Monad Testnet escrow / relayer | Root reports escrow verification and 0.5 test MON relayer funding; actual dapp campaign/payout evidence still pending |
| Real Monad Testnet network/token reads | Read-only network-only pass: chain 10143, official USDC bytecode / six decimals, finalized block 70687560; no escrow verified |
| Live campaign deposit / payout / user transfer / reclaim | Not evidenced |
| Real Privy email/Google and user-paid test-MON operations | Configured; actual production sign-in and operations pending; Telegram OAuth/zero-MON sponsorship not verified |
| Public GitHub | Push returned403; openai-lover/DROP remains empty. Local/deployed commit3ff3025 is not a public source commit |
| Full judge access / videos | Public web/practice accessible; authenticated funded flows/test credentials and actual videos incomplete |
| Contest application | User explicitly authorizes final submission after readiness checks; no accepted submission receipt is evidenced by these changes |

Update this record only from actual current-state evidence. Root runtime/tool sessions and local ports are not public hosting URLs.
