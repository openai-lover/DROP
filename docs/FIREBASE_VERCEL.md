# Firebase + Vercel deployment and local verification

The user's later deployment instruction selects **Firebase Firestore for durable data and Vercel for the Next.js website**. It supersedes the initial PostgreSQL/Prisma choice. Privy remains the single participant authentication and wallet provider; Firebase Authentication is not added as a second login. The Telegram app remains a standalone HTTPS website.

The public web is now deployed at [drop-omega-five.vercel.app](https://drop-omega-five.vercel.app/), READY production in `teamstartup/drop` /Hobby. Real login/database IAM/escrow/payment processing remain unconfigured; unpaid practice and protected unavailable states are the verified hosted scope.

## Service responsibilities

| Service | Responsibility | Required boundary |
| --- | --- | --- |
| Vercel Next.js | Render web pages; verify Privy tokens; authorize APIs; write transactional game/award/outbox records; read payout status | API requests must not depend on work continuing after the response or an in-process timer |
| Firestore | Durable users, campaigns, sessions, qualifications, awards, jobs, coupons, analytics and audit data | Transactionally assign the last reward and inventory; deterministic unique-document guards; server-enforced tenant ownership |
| Firebase Functions | Firestore-triggered payout processing plus scheduled recovery/reconciliation | Persistent leases, immutable award identity, chain-used-state checks and accurate receipt/event confirmation |
| Privy | Telegram/email identity, embedded recipient wallet and user-approved sponsored outgoing transfer | No administrator withdrawal signer on recipient wallets; credentials and real sponsorship setup still required |
| Monad escrow | Fixed funded reward promises, signed authorization, duplicate guards, actual payout and post-deadline reclaim | Testnet is the default; actual deployment/receipts remain mandatory |

Firestore/Admin SDK access is server-only. Security Rules do not replace API authorization because Admin/server SDKs bypass them. Public clients should not directly read secret quiz answers, jobs, coupon contents or privileged campaign records. Deploy reviewed rules and indexes even when the web uses server APIs. [Firebase trigger documentation](https://firebase.google.com/docs/functions/firestore-events)

## Durable processing

Firebase's `onDocumentCreated`/`onDocumentWritten` event handlers are asynchronous and must await/return their work. Firestore events can be delivered more than once and out of order. A worker must atomically acquire an expiring lease, preserve the same reward/slot/recipient, reconcile a known transaction or used award before retrying, and condition every later state update on current lease ownership. Do not assume exactly-once execution. [Firestore triggers](https://firebase.google.com/docs/functions/firestore-events), [Functions getting started](https://firebase.google.com/docs/functions/get-started)

Scheduled `onSchedule` recovery must revisit retryable/pending jobs and reconcile escrow funding, confirmations, expirations and permitted refunds. Scheduled invocations may overlap, so they use the same lease/idempotence rules. A time passing does not execute a reclaim transaction. [Scheduled functions](https://firebase.google.com/docs/functions/schedule-functions)

Vercel request execution has duration limits. Keep persistent work in the durable Firebase processor; a Vercel deployment alone does not prove a running payment worker. [Vercel Functions limits](https://vercel.com/docs/functions/limitations)

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

## Cloud setup still needed

The actual project is **drop-5a400 / DROP / Spark**. CLI inspection confirms `(default)` Standard / Native Firestore in `asia-northeast3`, created `2026-10-13T13:01:16.609278Z`. Rules/indexes-only deployment exited 0. Actual Vercel credentials/IAM/app-data access remain unverified.

Deploying Firebase Functions requires **Blaze**; scheduled recovery also uses Cloud Scheduler. **No billing upgrade is currently authorized. Do not deploy Functions, activate paid processing/scheduling resources or change the plan without a new owner instruction.** Functions source and build are prepared but no cloud payout processor is operating. [Functions deployment prerequisites](https://firebase.google.com/docs/functions/get-started), [Scheduling prerequisites](https://firebase.google.com/docs/functions/schedule-functions)

Before enabling authenticated/funded flows:

1. Preserve the confirmed Firestore project/database/region and Spark plan. Source Functions region is also asia-northeast3, but no Function is deployed. Separate development/testnet from mainnet data and keys. [Functions locations](https://firebase.google.com/docs/functions/locations)
2. Use the repository's final `.env.example` as the variable-name authority. Configure server-only Firebase credentials on Vercel, least-privilege processor identity/secrets on Firebase, Privy credentials and allowed origins, RPC/escrow settings, and separate approval/relayer/coupon keys. Never prefix private credentials with `NEXT_PUBLIC_`.
3. Rules/indexes are already deployed. Verify actual server data access and an owner-approved durable processor compatible with the no-upgrade instruction before funded public events open. Observe confirmed receipts and safe recovery; do not treat source/build or local execution as cloud processing.
4. Vercel direct normal-file upload is complete from local commit3ff3025; GitHub push403 leaves the requested remote empty. The approved public/practice deployment keeps credentials unset and login/payment actions disabled. Use the pinned normal-upload command in [DEPLOYMENT.md](DEPLOYMENT.md); do not use `--archive tgz` for this checkout, whose excluded directory placeholders were recursively packaged in the aborted large-archive attempt.
5. Public-page/practice checks passed on the actual URL, including30 Chromium checks /six profile skips and direct HTTP/privacy checks. Before enabling paid/authenticated paths, separately verify real Privy, both funded games, persistence, approved sponsored transfer, tenant isolation and a durable processor. Record actual contract/source/video evidence; web hosting alone does not satisfy them.

All variable values must match actual deployed services. Source publication, Vercel preview, Firestore configuration, durable runtime, actual Monad contract deployment and accepted contest submission are separate artifacts. Missing credentials or runtime remain visibly incomplete and never trigger fake authentication or payouts. Contest submission is explicitly on hold; portal activity is read-only.

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
| Real Firestore transaction tests | Final server run: 61 passing total, including 20 actual emulator cases with chain-response mocks |
| Actual local chain/worker integration | Two passed in 62.72s; Anvil31337/local mock token/isolated Firestore/production RPC-signing-worker; no public chain proof |
| Cloud Firestore configuration | Real database/region/mode confirmed; rules/indexes-only deployment exit 0 |
| Vercel production web | drop-omega-five.vercel.app; READY teamstartup/drop/Hobby, CLI63.1.2 exit0, normal118records/1.2MB/cloud118files |
| Hosted checks | Production Playwright30passed/6profile skips44.7s; public pages/status/OG200, anonymous rewards/coupon401 no-store/private; real integrations false/demoFallbackfalse |
| Functions / actual app-data access | Functions blocked on Spark; Vercel Firebase IAM and Privy/escrow/worker unset; no billing change |

In this Codex workspace sandbox, ordinary execution was denied local socket/CIM access. The approved local-runtime verification ran with the tool's required escalation; this is an execution-environment permission boundary, not a cloud credential requirement. Tests must be allowed to reach this local emulator rather than treating a sandbox socket failure as a dead process.
