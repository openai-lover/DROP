# Firebase + Vercel deployment and local verification

The user's later deployment instruction selects **Firebase Firestore for durable data and Vercel for the Next.js website**. It supersedes the initial PostgreSQL/Prisma choice. Privy remains the single participant authentication and wallet provider; Firebase Authentication is not added as a second login. The Telegram app remains a standalone HTTPS website.

The public web is deployed at [drop-omega-five.vercel.app](https://drop-omega-five.vercel.app/), production in `teamstartup/drop` / Hobby. On 2026-10-14 owner-approved production WIF trust and private Vercel settings were configured. The actual Privy server API returned successfully with zero users; production origin, email/Google and automatic EVM wallet creation were configured. Root verification also reports a verified testnet escrow and a relayer balance of 0.5 test MON. The new release, real production sign-in/data access and dapp funding/payment receipts still require separate verification. Earlier hosted checks proved unpaid practice and protected unavailable states.

## Service responsibilities

| Service | Responsibility | Required boundary |
| --- | --- | --- |
| Vercel Next.js | Verify Privy tokens; authorize APIs; persist transactional records; run bounded own-user recovery after eligible responses and a protected daily recovery route | Persist before scheduling; response/background interruption must retain recoverable jobs; execution is not a continuously running worker |
| Firestore | Durable users, campaigns, sessions, qualifications, awards, jobs, coupons, analytics and audit data | Transactionally assign the last reward and inventory; deterministic unique-document guards; server-enforced tenant ownership |
| Firebase Functions | Optional prepared Firestore-triggered processing and frequent scheduled recovery | Not deployed on Spark; separate Blaze authorization required |
| Privy | Currently configured email/Google identity, embedded wallet and visible user-approved testnet transactions | Explicit embedded address; Monad Testnet only; wallet-paid test MON unless genuine sponsorship is enabled |
| Monad escrow | Fixed funded reward promises, signed authorization, duplicate guards, actual payout and post-deadline reclaim | Testnet is the default; actual deployment/receipts remain mandatory |

Firestore/Admin SDK access is server-only. Security Rules do not replace API authorization because Admin/server SDKs bypass them. Public clients should not directly read secret quiz answers, jobs, coupon contents or privileged campaign records. Deploy reviewed rules and indexes even when the web uses server APIs. [Firebase trigger documentation](https://firebase.google.com/docs/functions/firestore-events)

## Durable processing

Firebase's `onDocumentCreated`/`onDocumentWritten` event handlers are asynchronous and must await/return their work. Firestore events can be delivered more than once and out of order. A worker must atomically acquire an expiring lease, preserve the same reward/slot/recipient, reconcile a known transaction or used award before retrying, and condition every later state update on current lease ownership. Do not assume exactly-once execution. [Firestore triggers](https://firebase.google.com/docs/functions/firestore-events), [Functions getting started](https://firebase.google.com/docs/functions/get-started)

Scheduled `onSchedule` recovery must revisit retryable/pending jobs and reconcile escrow funding, confirmations, expirations and permitted refunds. Scheduled invocations may overlap, so they use the same lease/idempotence rules. A time passing does not execute a reclaim transaction. [Scheduled functions](https://firebase.google.com/docs/functions/schedule-functions)

Vercel request execution has duration limits. The free source mode `DROP_WORKER_MODE=request` uses Next `after()` only after successful authenticated reward-list, game-submit and reward-retry responses. It processes the verified user's own rewards, with a persistent 15-second dispatch throttle and at most one job per invocation. It does not use browser-only timers or detached promises. Persisted signed bytes, nonce, leases and receipts retain their existing safeguards. [Next after](https://nextjs.org/docs/app/api-reference/functions/after)

The Hobby-compatible cron in `vercel.json` invokes `/api/internal/recovery` once per day at `0 3 * * *` UTC. A private `CRON_SECRET` of at least 32 characters is mandatory. Each accepted run attempts at most three jobs and three expired-award probes, with persistent cooldown/cursor state and a soft 25-second budget. An in-flight RPC may outlast that soft budget; both routes have a 60-second platform limit, and interrupted jobs remain recoverable through their persisted leases. Known receipts and finalized chain state remain necessary before confirmation. The daily path is a low-volume fallback, not minute-by-minute scheduling or unlimited backlog processing. Hobby cron timing can vary within its hour. [Vercel Hobby cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)

`DROP_WORKER_MODE=disabled` is the template default. `external` leaves execution to an independently running approved processor. No mode or status flag proves that a real invocation completed. Firebase Functions still cannot be deployed on Spark.

## Keyless production Firestore access

Set `FIREBASE_CREDENTIAL_MODE=vercel-oidc` explicitly, plus `FIREBASE_PROJECT_ID`, `GCP_PROJECT_NUMBER`, `GCP_SERVICE_ACCOUNT_EMAIL`, `GCP_WORKLOAD_IDENTITY_POOL_ID` and `GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID`. The current approved identifiers are project `drop-5a400`, project number `70252046671`, pool `drop-vercel`, provider `vercel-production`, and service account `drop-vercel-runtime@drop-5a400.iam.gserviceaccount.com`. These are metadata, not private keys.

The GCP provider must trust the exact Vercel issuer and production project subject. Give only that subject `roles/iam.workloadIdentityUser` on the runtime service account, and the service account `roles/datastore.user` on the selected project. STS and IAM Credentials APIs must support exchange and impersonation. No service-account private key is generated for this route. `VERCEL_OIDC_TOKEN` alone does not grant Firestore access. [Vercel GCP federation](https://vercel.com/docs/oidc/gcp), [Google federation](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-other-providers)

The adapter obtains the current Vercel OIDC token through the official SDK when Google refreshes its short-lived credentials. It constrains exchange URLs and identifiers, uses a same-project service account, and does not save or log either token. The optional `GCP_OIDC_AUDIENCE` accepts only the exact HTTPS provider resource URL; if omitted, configure GCP to accept the default Vercel team audience. The Admin-exported Firestore constructor receives the Google auth client with REST transport; existing certificate, ADC and isolated-emulator paths remain supported. Uploaded metadata and IAM policy are not proof of a successful production exchange.

## Local Firestore emulator on Windows

Use a supported Node runtime and the pinned repository `firebase-tools` dependency. Firebase CLI v15 removed support for Java below 21, despite an older installation-overview minimum. Use **Java 21+**. [CLI release notes](https://firebase.google.com/support/release-notes/cli), [Firestore emulator connection guide](https://firebase.google.com/docs/emulator-suite/connect_firestore)

The local test project is `demo-drop`, with no cloud credentials or login. Repo configuration must bind only:

| Component | Local address |
| --- | --- |
| Firestore | `127.0.0.1:8089` |
| Emulator Hub | `127.0.0.1:4409` |
| Logging | `127.0.0.1:4509` |
| Emulator UI | Disabled |

The running Firestore emulator also exposes its local WebSocket on `127.0.0.1:9150` and internal ephemeral listener ports. The prepared run inspected all Node/Java listeners and confirmed every address was `127.0.0.1`; none was publicly bound.

Start from the repository root:

```powershell
./scripts/start-firebase-emulator.ps1
# If Node or Java is not on PATH:
./scripts/start-firebase-emulator.ps1 -NodePath 'C:/tools/node/node.exe' -JavaHome 'C:/tools/jdk-21'
```

The start script uses a hidden local process, records its actual PID/start time, waits for the running Hub and Firestore listener, and writes `.local/firestore-test.env`. A live process that has not become ready is re-observed; an observation timeout is not treated as proof it stopped. It does not start a global Windows service, Docker, PostgreSQL, Firebase Auth or public hosting.

Load test-only values into the current PowerShell session without printing secrets:

```powershell
Get-Content -LiteralPath '.local/firestore-test.env' | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
    }
}
pnpm test
```

The file supplies `FIRESTORE_EMULATOR_HOST=127.0.0.1:8089`, `FIREBASE_PROJECT_ID=demo-drop` and `GCLOUD_PROJECT=demo-drop`. Keep emulator environment variables out of deployed production. Actual database integration tests must reject absent/non-local emulator settings, never silently test against a cloud project. Official emulator integration uses the host variable without `http://`. [Firestore emulator guide](https://firebase.google.com/docs/emulator-suite/connect_firestore)

The process metadata and logs are `.local/firebase-emulator-process.json` and `.local/firebase-logs/`. Download/cache files stay under ignored `.local/`. The prepared machine used official Eclipse Adoptium Temurin 21.0.12.1+1 portable Java; the download SHA-256 was checked against its official API metadata. This does not install Java globally. [Adoptium releases](https://adoptium.net/temurin/releases/?os=windows&arch=x64&version=21&package=jdk)

Stop only after all root/backend tests finish:

```powershell
./scripts/stop-firebase-emulator.ps1
```

The stop script checks the saved PID, start time and actual command before stopping that checkout's descendant tree. It leaves runtimes/logs in place and does not stop unrelated Java/Node processes. The emulator is a local test environment, not a deployed product or evidence of real Monad settlement.

## Cloud configuration and verification

The actual project is **drop-5a400 / DROP / Spark**. CLI inspection confirms `(default)` Standard / Native Firestore in `asia-northeast3`, created `2026-10-13T13:01:16.609278Z`. Rules/indexes-only deployment exited 0. Production WIF trust and private Vercel settings were subsequently configured with owner approval. Actual app-data access and authentication must still be verified on the new deployment.

Deploying Firebase Functions requires **Blaze**; scheduled recovery also uses Cloud Scheduler. **No billing upgrade is currently authorized. Do not deploy Functions, activate paid processing/scheduling resources or change the plan without a new owner instruction.** Functions source and build are prepared but no cloud payout processor is operating. [Functions deployment prerequisites](https://firebase.google.com/docs/functions/get-started), [Scheduling prerequisites](https://firebase.google.com/docs/functions/schedule-functions)

Before enabling authenticated/funded flows:

1. Preserve the confirmed Firestore project/database/region and Spark plan. Source Functions region is also asia-northeast3, but no Function is deployed. Separate development/testnet from mainnet data and keys. [Functions locations](https://firebase.google.com/docs/functions/locations)
2. Use `.env.example` as the variable-name authority. Production WIF, Privy and testnet/recovery settings have been uploaded privately; verify their actual operation. Preserve approval/relayer key separation and encryption continuity. Never prefix private credentials with `NEXT_PUBLIC_`.
3. Rules/indexes are already deployed. Verify server data access, eligible authenticated after-work, daily recovery and actual confirmed receipts before opening funded public events. Do not describe this free cadence as an independent minute-scheduled worker.
4. Earlier Vercel normal upload succeeded; source publication and the revised release remain separate checks. Use the normal-upload workflow in [DEPLOYMENT.md](DEPLOYMENT.md); avoid the previously observed large archive packaging issue.
5. Public-page/practice checks passed on the actual URL, including30 Chromium checks /six profile skips and direct HTTP/privacy checks. Before enabling paid/authenticated paths, separately verify real Privy, both funded games, persistence, approved sponsored transfer, tenant isolation and a durable processor. Record actual contract/source/video evidence; web hosting alone does not satisfy them.

All values must match actual services. Source publication, hosted code, IAM configuration, actual worker invocation, chain receipts and accepted submission are separate artifacts. Missing integrations never trigger fake authentication or payouts. The user now authorizes final submission after readiness checks, including actual demo/pitch upload to SLIME CEO! and the supplied X profile; the earlier submission hold is superseded. No billing upgrade or mainnet action is authorized.

## Verification record

| Check | Evidence at document preparation |
| --- | --- |
| Official Java origin + checksum | Verified local portable runtime; `java -version` executed |
| PostgreSQL process | Never initialized or started; download/extraction stopped after Firebase steering |
| Repository Firebase config | Inspected root/backend config: exact loopback `8089/4409/4509`, UI disabled |
| Pinned CLI version | `firebase-tools 15.33.0` executed; actual Firestore emulator `1.22.0` downloaded/started |
| Actual emulator PID / ready Hub | Verified live Node PID `29048` and Java PID `5036`; Hub identifies real Firestore process and listener |
| Readiness/idempotence | Re-running start script reused PID `29048`; live Firestore data API returned expected HTTP 404 for a missing document |
| Shutdown script | PowerShell syntax parsed; shutdown deliberately not executed while root/backend tests need the live emulator |
| Server/language tests after free recovery changes | 96 passing across 12 files, including 26 actual emulator cases with explicit chain-response mocks; web and Functions typechecks passed |
| Actual local chain/worker integration | Two passed in 62.72s; Anvil31337/local mock token/isolated Firestore/production RPC-signing-worker; no public chain proof |
| Cloud Firestore configuration | Real database/region/mode confirmed; rules/indexes-only deployment exit 0 |
| Vercel production web | drop-omega-five.vercel.app; READY teamstartup/drop/Hobby, CLI63.1.2 exit0, normal118records/1.2MB/cloud118files |
| Hosted checks | Production Playwright30passed/6profile skips44.7s; public pages/status/OG200, anonymous rewards/coupon401 no-store/private; real integrations false/demoFallbackfalse |
| Production integration configuration | Owner-approved exact-subject WIF trust and private Vercel settings configured; deployed real sign-in/data/worker/chain verification pending |
| Functions / free recovery | Functions blocked on Spark; request-assisted and daily recovery source prepared; no billing change or proof of hosted recovery invocation |

In this Codex workspace sandbox, ordinary execution was denied local socket/CIM access. The approved local-runtime verification ran with the tool's required escalation; this is an execution-environment permission boundary, not a cloud credential requirement. Tests must be allowed to reach this local emulator rather than treating a sandbox socket failure as a dead process.
