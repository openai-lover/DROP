# DROP deployment and operations

Target: **Vercel Next.js web/API + Firebase Firestore + durable payout/retry/reconciliation + Privy + Monad Testnet escrow**. Firebase Functions source implements the planned processor, but its cloud deployment is blocked by the confirmed free Spark plan. Privy remains the sole user identity/wallet provider. DROP uses ordinary HTTPS links, never Telegram Mini App authentication.

The user-confirmed Firebase project is **`drop-5a400`**, display name **DROP**, on the free **Spark** plan. Its **`(default)` Standard / Native Firestore database in `asia-northeast3`** was confirmed by the CLI, created `2026-10-13T13:01:16.609278Z`. Reviewed rules and indexes were successfully deployed. **No billing upgrade is currently authorized; do not upgrade without a new owner instruction.** No hosted app URL, deployed Functions, Privy live flow, live Monad contract/funding or final judge access has been verified. No billing-plan upgrade was performed. The procedures below distinguish completed data configuration from setup still required.

**The user explicitly forbids contest submission at this stage.** Portal inspection is read-only; no application fields, saved drafts, uploads or final submission are authorized.

## Runtime and build

The root package requires Node `>=22.12`, pins pnpm `11.25.0`, and defines direct Next.js/TypeScript build commands. The Functions package targets Node `22` with `firebase-admin 14.5.0` and `firebase-functions 7.4.0`; root CLI is `firebase-tools 15.33.0`. Use the actual lockfile and package manifests.

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm functions:build
pnpm build
```

Frozen-lockfile installation passed for both workspace packages; clean lint, app typechecking, the Functions TypeScript build and the final Next production rebuild passed. The latter followed the actual Open Graph layout fix; the development image endpoint returned HTTP 200 / PNG, 49,610 bytes. The final server run passed 61 tests in seven files, and Playwright passed 30 checks with six intentional profile skips. Two separate actual local chain/worker integration cases also passed. Firebase's `predeploy` runs the Functions build; its entry point is `functions/lib/functions/src/index.js` as declared by the Functions package. A successful build or development response does not prove hosting or live integrations.

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
| `DROP_FUNCTION_REGION` | Functions deployment | Source default `asia-northeast3`, matching the confirmed database region; no Function deployed |
| `FIRESTORE_EMULATOR_HOST`, `DROP_LOCAL_EMULATOR` | Local only | Never configure on hosted Vercel or live Functions |

Use `.env.example` as the authoritative template. Next reads ignored `.env.local`; standalone processing needs process variables or an explicit environment file. Functions secrets are bound by `defineSecret` in `functions/src/index.ts`. Other Functions settings belong in the chosen environment's private configuration. Do not publish a filled template, downloaded service-account file, coupon content or private key.

## Firebase cloud data and durable processing

Deploying Functions requires **Blaze**, and scheduled retry/reconciliation uses billable Cloud Scheduler. The confirmed project remains **Spark** and **no billing upgrade is currently authorized**. Therefore **do not deploy Functions, activate paid scheduling/Secret Manager resources, or change the plan as part of these steps**. A future owner instruction can change that authorization; it has not happened. Local Functions source/build is useful engineering work, but it does not operate a cloud payout queue. [Firebase deployment prerequisites](https://firebase.google.com/docs/functions/get-started), [Scheduler prerequisites](https://firebase.google.com/docs/functions/schedule-functions)

The currently allowed data/web setup is:

1. The intended `(default)` database in `drop-5a400` is confirmed in `asia-northeast3`. Preserve it and review Spark quotas against the planned pilot. The `icn1` Vercel setting is still a source configuration, not a verified hosted region.
2. Configure a least-privilege Vercel server identity for actual Firestore access. Browser clients never receive private credentials. Privy remains the user login provider.
3. The reviewed `firestore.rules` and `firestore.indexes.json` were deployed successfully. Current rules deny direct clients; server/Admin APIs still enforce authentication and tenant permissions themselves. Configuration deployment is not an actual Vercel data-access test.
4. Configure the approved testnet app parameters privately, but keep funded public events closed until a compatible, owner-approved durable processor is actually running and verified. Firestore/Vercel setup alone cannot satisfy the payout/recovery gate.

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

Configure the owner's actual Privy app and allowed web origins/OAuth redirects for local, Vercel preview and final production separately. Enable ordinary Telegram OAuth plus email OTP. Do not enable/copy Telegram Mini App seamless login. For a custom direct OAuth/email flow, explicitly ensure/create an embedded wallet; the modal's automatic-wallet setting alone does not cover direct methods.

Receiving from escrow uses DROP's restricted relayer and its MON balance. Sending received USDC is a distinct, user-approved Privy wallet transaction. Before enabling that button, configure **TEE execution**, app-pays gas sponsorship, Monad Testnet in its supported-chain settings, **allow client transactions**, and available sponsorship funding/credits. The UI flag alone is insufficient. Verify actual sending from a recipient wallet with zero MON and verify cancellation moves nothing. [Privy gas setup](https://docs.privy.io/wallets/gas-and-asset-management/gas/setup), [wallet-creation caveat](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation)

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

Import [the requested GitHub source](https://github.com/openai-lover/DROP) into the owner's Vercel project. The repository's `vercel.json` selects Next.js, `pnpm install --frozen-lockfile`, `pnpm build`, and `icn1`; validate those against the selected runtime and current lockfile.

Set the required server-only/private variables and the public Privy app identifier before deploying. Keep emulator flags absent. Use a preview to verify public pages and live Privy behavior, add its precise allowed origins/redirects, then check the final production origin separately. The web/API runtime is Node.js; there is no Firebase Authentication login layer or Vercel timer-based payout worker.

Before treating a hosted URL as ready, verify a clean-account catch/quiz flow, actual deposit/payout/transfer receipts, persistent reward access, pending/failure recovery, tenant isolation and coupon privacy. Check mobile widths plus real Android Chrome, iOS Safari and Telegram external-web use. Merely serving the homepage or passing a build is narrower evidence.

## Operations and recovery

Observe Firestore outbox age, pending/submitted/confirmed/expired jobs, Function errors/retries, relayer MON and fee caps, provider sponsorship balance, reconciliation differences and coupon inventory. Use least-privilege private logs; never log provider secrets, identity tokens, quiz answers or coupons.

A timeout may leave a live or already-mined transaction. Inspect persisted transaction bytes/hash/history and contract used-award state before resubmission; retain the same award identity. An expired prepared transaction must resolve its nonce before completion so later payouts are not blocked. Stale worker leases must not overwrite a confirmed award. The 61-test suite exercises chain response scenarios with mocks; the separate two-case local Anvil run additionally exercises actual broadcast/mining/receipt and durable restart without an extra relayer transaction. Public-network recovery remains to be observed.

Authenticated winners can request the persisted fixed-recipient proof when available. Direct recovery submission may require MON gas and is optional; do not make it the default consumer path. Preserve keys, project data, proofs and current campaign budgets when changing configuration. New data/project/secret settings require an explicit migration plan for outstanding campaigns, not a silent reset.

## Actual deployment record

| Artifact | Verified value |
| --- | --- |
| Local Next website | `http://127.0.0.1:3000`, homepage HTTP 200 and anonymous/practice Chromium coverage verified; no real-auth/live-payout claim |
| Local Firestore | Synthetic `demo-drop`, `127.0.0.1:8089`, live Hub/Java process verified |
| Server checks | Final Vitest run: 61 passed across seven files, exit 0; includes 20 real Firestore emulator cases, ephemeral signed JWTs and mocked chain responses |
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
| Vercel IAM / actual cloud application data access | Not verified by configuration deployment |
| Firebase Functions / scheduled processor | Not deployed; blocked by Spark under the no-upgrade instruction |
| Firebase Blaze upgrade | Not performed; do not upgrade |
| Vercel preview / production URL | Not verified |
| Live Monad escrow / deploy transaction / verified explorer | Not deployed or evidenced here |
| Real Monad Testnet network/token reads | Read-only network-only pass: chain 10143, official USDC bytecode / six decimals, finalized block 70687560; no escrow verified |
| Live campaign deposit / payout / user transfer / reclaim | Not evidenced |
| Real Privy Telegram/email and zero-MON transfer | Not verified |
| Public source commit / judge access / videos | Final artifacts not recorded here |
| Contest application | Explicit user hold: read-only portal research only; no submission or accepted receipt |

Update this record only from actual current-state evidence. Root runtime/tool sessions and local ports are not public hosting URLs.
