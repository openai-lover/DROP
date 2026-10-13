# Official-source verification ledger

**Final submission:** Consumer Products & Payments + **Privy** is **READY FOR JUDGING**, re-submission confirmed `2026-10-13T16:57:26.785Z` (Oct14 01:57 KST); portal Save16:56UTC7/7. Initial primary confirmation: `2026-10-13T16:39:30.988Z`. Required Privy integration description:1,808characters. Separate optional Privy video omitted. Actual wallet creation/creator contract transactions are verified; DROP pays receiving gas through its own relayer, not Privy sponsorship. `acf5b73` is the deployed app baseline; same-human technical accounts are not traction.

**Historical source record —2026-10-13:** The body below preserves the earlier source/research baseline exactly. Its old unset integrations,403,hold,unselected bounty and asset counts describe that date, not current status. Later actual source/login/WIF/funding/quiz+catch payments/video/submission evidence supersedes those states. See [current integration status](INTEGRATION_STATUS.md) and [submission checklist](SUBMISSION_CHECKLIST.md).


Checked on **2026-10-13 (Asia/Seoul)** for the user-supplied DROP brief. Links below are primary documentation or the event's own organizer page. Read access is not proof of a configured account, integration, deployment, financial authorization, or contest submission.

## Network, token and contract tooling

| Primary source | Verified fact used by DROP | Verification / implementation implication |
| --- | --- | --- |
| [Monad current facts](https://docs.monad.xyz/ai/current-facts) | Mainnet `143`, testnet `10143`, native token MON; public RPCs `https://rpc.monad.xyz` and `https://testnet-rpc.monad.xyz` | Read after retry through documentation navigation. Use testnet by default; deployment must still read actual chain state. |
| [Monad network testnet](https://docs.monad.xyz/developer-essentials/testnet) and [mainnet](https://docs.monad.xyz/developer-essentials/network-information) | Canonical network pages exist; current-facts points to them as source of truth | Read; some dynamic tables were not exposed by the text tool, so detailed constants above came from current-facts. |
| [Foundry deployment guide](https://docs.monad.xyz/guides/deploy-smart-contract/foundry) | Official Foundry v1.8+; `network = "monad"` or `--network monad`; active hardfork selected automatically when interacting with Monad Testnet | Read. Do not substitute remembered old EVM-fork settings. Guide recommends keystore-based deployment. Actual version/test execution still must be evidenced. |
| [Circle USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses) | Monad mainnet USDC `0x754704Bc059F8C67012fEd69BC8A327a5aafb603`; testnet `0x534b2f3A21130d7a60830c2Df862319e593943A3` | Read. Circle states testnet assets have no financial value. Address identity must be allowlisted; verify bytecode and decimals onchain, never symbol alone. |
| [OpenZeppelin Contracts 5.x](https://docs.openzeppelin.com/contracts/5.x) | Official contract-library documentation available | Read overview; not a DROP security audit. Inspect actual imports and pinned version. |
| [Gas pricing](https://docs.monad.xyz/developer-essentials/gas-pricing) | Charges the gas limit; dynamic EIP-1559-compatible pricing, minimum base fee 100 MON-gwei | Body read. Relayer caps must use total gas-limit cost; documentation's USD examples are not measured DROP fees. |
| [Reserve balance](https://docs.monad.xyz/developer-essentials/reserve-balance) | Inflight transaction gas/value constraints for asynchronous execution | Summary/body read; not a blanket requirement that every sponsored recipient buy 10 MON. |
| [EIP-7702](https://docs.monad.xyz/developer-essentials/eip-7702) | Delegation/sponsorship supported; delegated account cannot decrement MON below 10, but unchanged/increased balance below 10 is permitted; delegated code cannot CREATE/CREATE2 | Canonical link followed and body read. Provider app-pays setup and a real zero-MON approved transfer still require actual verification. |

Monad's current-facts page publishes mainnet protocol/performance figures. They are not measured DROP authentication, worker, testnet, or end-to-end receipt timings. No latency claim in the pitch may turn a protocol metric into a product measurement.

Actual read-only testnet verification on 2026-10-13 returned chain `10143`, official Circle USDC bytecode and six decimals, and finalized block `70687560`. The report explicitly recorded `escrowVerified: false`. This is actual network/token evidence, not an escrow deployment, funding, source verification or payout. The official Forge 1.8.5 local contract record is separately hash-bound to current source/ABI: 42 unit/fuzz tests and two invariant properties passed. See [REQUIREMENTS_AUDIT.md](REQUIREMENTS_AUDIT.md).

Separate execution evidence now includes [two actual local Anvil/Firestore/worker integration cases](LOCAL_CHAIN_VERIFICATION.md), passed in 62.72s: actual production RPC/signing/receipt/worker methods against isolated chain31337 and a local mock token. The completed ignored run record was inspected. This is stronger integrated local evidence than chain-response mocks, while still outside public Monad/Circle/Privy/cloud verification. It is not an additional official-source claim or public payout.

## Telegram platform boundary

| Primary source | What was actually verified | DROP consequence |
| --- | --- | --- |
| [Blockchain Guidelines](https://core.telegram.org/bots/blockchain-guidelines) | Restrictions apply to Mini Apps and their bots; regular bots without a Mini App component are exempt. Mini App rules include non-TON asset/wallet restrictions. | Independent HTTPS mobile website; no `web_app`, `startapp`, Mini App SDK, or `initData` flow. Do not create a Mini App that links out to evade the restrictions. |
| [Bot Developer Terms](https://telegram.org/tos/bot-developers) | Clauses 7.1–7.4 constrain Mini App tokens, wallets and promotion, including indirect external links. | Stay within the supplied standalone-web architecture. Ordinary bots still have the other platform terms; this is not a Telegram approval certificate. |
| [Telegram Login](https://core.telegram.org/bots/telegram-login) | Website login supports OIDC authorization-code flow with PKCE; bot/client setup, allowed URLs and server token validation are required. | Prefer Privy's regular Telegram OAuth, keeping one account/wallet login. No direct Telegram Mini App authentication. |
| [Telegram Bot API](https://core.telegram.org/bots/api) | Reference URL provided by user; no bot automation is required for baseline | If later used, separately verify ordinary HTTPS `url` buttons and permissioned notifications. No channel-member collection, unsolicited DM or auto-promotion. |

## Privy — current React and server guidance

| Primary source | Verified behavior | Integration caveat |
| --- | --- | --- |
| [OAuth](https://docs.privy.io/authentication/user-authentication/login-methods/oauth) | Regular React OAuth uses `useLoginWithOAuth` / `initOAuth({provider: 'telegram'})`; Telegram is a supported provider | Configure OAuth credentials and redirect allowlist. The same page's seamless Mini App example is deliberately excluded. |
| [Allowed OAuth redirects](https://docs.privy.io/recipes/react/allowed-oauth-redirects) | Privy documents allowed post-login redirect configuration | Only approved app domains/routes; test failed popup and safe redirect behavior. |
| [Email OTP](https://docs.privy.io/authentication/user-authentication/login-methods/email) | `useLoginWithEmail` supplies `sendCode({email})` and `loginWithCode({code})` | Actual email delivery and app settings require credentials and live testing. |
| [Automatic wallets](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation) | `embeddedWallets.ethereum.createOnLogin` is supported; automatic creation applies only to the Privy modal, not direct/whitelabel methods | Custom OAuth/email flows must explicitly ensure/create the embedded wallet; config alone is insufficient. |
| [Create a wallet](https://docs.privy.io/wallets/wallets/create/create-a-wallet) | React `useCreateWallet().createWallet()` returns a created wallet | Avoid duplicate creation and do not add an administrator as an unrestricted signer. |
| [Gas sponsorship overview](https://docs.privy.io/wallets/gas-and-asset-management/gas/overview) | App-pays sponsorship lists Monad and Monad Testnet; native EVM sponsorship uses EIP-7702 | Chain support alone does not prove DROP is configured or that a transfer worked. User-pays token-gas chain coverage is different; do not assume Monad support for that mode. |
| [Gas sponsorship setup](https://docs.privy.io/wallets/gas-and-asset-management/gas/setup) | React `useSendTransaction` accepts transaction plus `{sponsor: true}`; TEE execution, dashboard sponsorship, chain configuration, and allowed client transactions are required | Billing/credits and rate controls require owner setup. Keep outgoing transfers user-approved. Initial escrow claim uses its own restricted relayer. |
| [Access tokens](https://docs.privy.io/authentication/user-authentication/access-tokens) | Client `getAccessToken()`; server must verify token signature, expiry, issuer and app audience | Request-body IDs are not authentication. Read linked wallets from verified server/user information. |
| [Current Node installation](https://docs.privy.io/basics/nodeJS/installation) and [migration](https://docs.privy.io/basics/nodeJS/advanced/migrating-from-server-auth) | Current server guidance uses `@privy-io/node`; migration changes constructor and resource methods. Node 20+ non-EOL support is documented. | Legacy `@privy-io/server-auth` remains a distinct chosen API; do not claim it is current Node SDK. Verify pinned types and runtime compatibility. |
| [Official Node auth source](https://github.com/privy-io/node-sdk/blob/main/src/lib/auth.ts) | Exports `verifyAccessToken({access_token, app_id, verification_key})`; verified result uses `user_id`; pins ES256, `privy.io`, audience | Current source inspected to avoid API guesses. Use actual installed version's matching API. |
| [React SDK npm versions](https://www.npmjs.com/package/%40privy-io/react-auth?activeTab=versions) | Registry website's current versions table showed stable `3.48.1` | Older search snapshots showed `3.45.0` and `3.43.0`; use the current table, real resolved lockfile and installation, not cached snippets. |
| [Node SDK npm](https://www.npmjs.com/package/%40privy-io/node?activeTab=dependents) | Available registry snapshot showed `0.35.0` | Snapshot is not a live registry latest-version query. Direct registry DNS was unavailable in this environment; confirm before selecting/upgrading. |

## Firebase Firestore, Functions and Vercel

The selected deployment uses Firebase durable data/processing and Vercel web hosting. Privy remains the sole login/wallet layer; the Firebase choice does not introduce Firebase Authentication.

| Primary source | Verified behavior | DROP consequence |
| --- | --- | --- |
| [Firebase CLI release notes](https://firebase.google.com/support/release-notes/cli) | CLI v15 removed emulator support for Java below 21 | Use Java 21+; an older installation overview's Java 11 minimum is insufficient for current CLI. |
| [Firestore emulator connection](https://firebase.google.com/docs/emulator-suite/connect_firestore) | Admin integration uses `FIRESTORE_EMULATOR_HOST` without an `http://` prefix; demo-project development avoids live services | Use `demo-drop` and `127.0.0.1:8089` locally; emulator variables forbidden in Vercel production. |
| [Emulator installation/configuration](https://firebase.google.com/docs/emulator-suite/install_and_configure) | Emulator Hub exposes running emulator information; selected products can run without Hosting/login | Inspect real process/readiness; start only Firestore, no duplicate auth or public hosting. |
| [Firestore Functions triggers](https://firebase.google.com/docs/functions/firestore-events) | Delivery is at least once and ordering is not guaranteed; Admin/server access bypasses Security Rules | Durable Firestore leases/guard documents and explicit API tenant authorization; no exactly-once assumption. |
| [Functions getting started](https://firebase.google.com/docs/functions/get-started) | Deployment requires Blaze; Node 20/22 supported; asynchronous handlers return/await work | Functions source targets Node 22. Owner billing/project/credentials and observed execution still required. |
| [Scheduled functions](https://firebase.google.com/docs/functions/schedule-functions) | Scheduled invocations can overlap; Cloud Scheduler setup/billing applies | Idempotent retry and reconciliation share leases with created-job processing. No free-service claim. |
| [Functions locations](https://firebase.google.com/docs/functions/locations) | Location selection guidance is documented | Choose and record actual database/processor regions; the source's region setting does not prove deployment there. |
| [Vercel Functions limits](https://vercel.com/docs/functions/limitations) | Request execution has duration limits | Put durable payout/retry/reconciliation in Firebase Functions, not a post-response Vercel timer. |
| [Eclipse Adoptium Java releases](https://adoptium.net/temurin/releases/?os=windows&arch=x64&version=21&package=jdk) | Official portable Java distribution located; API-provided SHA-256 matched downloaded archive | Executed Temurin `21.0.12.1+1` locally; no global Java install or cloud resource created. |

Current installed package/source inspection found `firebase-tools 15.33.0`, `firebase-admin 14.5.0` and `firebase-functions 7.4.0`; these are pinned implementation versions, not a claim of globally latest releases. Actual emulator startup used Firestore `1.22.0`, with verified loopback listeners and stable process reuse. See [FIREBASE_VERCEL.md](FIREBASE_VERCEL.md) for the scoped evidence. Emulator readiness does not prove deployed Functions or live blockchain settlement.

Actual cloud configuration evidence: the selected project is `drop-5a400` / DROP / Spark. CLI inspection confirms `(default)` Firestore, Standard edition / Native mode, `asia-northeast3`, creation `2026-10-13T13:01:16.609278Z`. Rules/indexes-only deployment exited 0, including rules compilation/upload/release and indexes deployment. No billing upgrade or Functions deployment occurred. Vercel IAM and actual app data access are still unverified. This is project-state evidence, separate from general documentation.

Actual public-web evidence: [drop-omega-five.vercel.app](https://drop-omega-five.vercel.app/) is production READY in teamstartup/drop/Hobby. Official CLI63.1.2 normal upload from local commit3ff3025 (118records/1.2MB, cloud118files) passed the cloud build. Hosted Playwright30passed/6profile skips44.7s and direct public/status/OG200 /anonymous private APIs401 checks verified public/practice availability. All real integration availability booleans arefalse, demoFallbackfalse. GitHub push403 leaves the requested source remote empty. Web hosting does not verify real Privy, cloud app IAM or Monad payouts; contest submission remains on hold.

## Contest sources and limits of access

| Source | Access result | What may be claimed |
| --- | --- | --- |
| [Metropolis portal](https://hackathon.monad.xyz/) | Public login screen read earlier; user subsequently supplied an authenticated session, inspected read-only | Earlier public screen shows Sept 1–Oct 13 and $250,000+ pool. Authenticated header/track confirms local deadline **Oct 14, 2026 at 12:59 GMT+9 / Asia/Seoul**. The date-only public label must not be represented as the Korean local cutoff. |
| [Public Metropolis page](https://www.monad.xyz/developers/hackathons/metropolis) | Direct reads failed/inaccessible in this verification pass | URL retained; do not say this pass read its FAQ, full rules, or rubric. |
| [Portal resources](https://hackathon.monad.xyz/resources) | Authenticated rendered contents read successfully by the root agent on 2026-10-13; this subagent's browser inventory is unavailable | Six service perks and technical-resource links below were visibly listed. No offer was claimed, voucher redeemed or provider account changed. Listed links do not mean every destination was read. |
| [Consumer Products & Payments](https://hackathon.monad.xyz/tracks/consumer-payments) | Authenticated rendered official track page read by the root agent on 2026-10-13 | Exact official weights, live-product criteria, demo/pitch/logo/source/deployed-product requirements and deadline verified below. The track is selected in the observed project form; no submission was made. |
| [Project submission form](https://hackathon.monad.xyz/project?tab=submission) | Existing authenticated form inspected read-only by the root agent; no fields changed, saved, uploaded or submitted | Required fields/limits and stricter actual upload guidance verified below. No private draft text, personal information or account details are copied into this ledger. |
| [Privy bounty](https://hackathon.monad.xyz/tracks/privy) | Authenticated official details read by the root agent | $5,000 single prize, all tracks; authentication alone does not qualify. Requires a working beyond-login integration and integration description; multiple features strengthen evidence; separate ≤2-minute Privy demo optional. Privy bounty was not selected or added. |
| [Tracks catalog](https://hackathon.monad.xyz/tracks) | Official rendered track/bounty catalog read by the root agent | Four track names/links and bounty listings verified. Only Consumer's full rubric and Best Community/Privy detailed conditions are verified in this pass. |
| [Prizes](https://hackathon.monad.xyz/prizes) | Authenticated official prize page read by the root agent | Champion, track allocations, stackability and sponsor service benefits verified; bounty listings are attributed separately to Tracks, not this page. |
| [Best Community Team Project](https://hackathon.monad.xyz/tracks/best-community-team-project) | Authenticated official bounty details and existing form read by the root agent | $5,000; onboarded campus-community/group requirement; required group identification remains unproven. Observed existing selection is not an eligibility approval. |
| [Monad Foundation / Encode London event](https://luma.com/metropolis-lon-oct-2026) | Organizer page read; hosted by Monad Foundation and Encode | Supports six-week online-first contest, Sept 1–Oct 13 window, four tracks, and Consumer Products & Payments examples; event registration is separate from contest registration. |

### Verified official rubric and artifacts

The original user-provided rubric is now independently confirmed by the authenticated official Consumer Products & Payments page: **Technical Execution 20%, Design & Craft 20%, Originality & Track Insight 15%, Founder & Market Readiness 25%, Traction & Path Forward 20%**. The page expects actual conditional onchain settlement, a non-crypto user completing the core flow without help, an experience improved by the payment rails, a specific consumer segment understood through real evidence, and an actual user study plus a next-100 distribution plan. Even a small study with five friends is allowed evidence; generated interviews are not actual user research.

Official track deliverables: JPG/JPEG/PNG/WEBP raster logo ≤3 MB; public GitHub accessible to `metropolis@hackathon.monad.xyz`; an actual working-product demo ≤3 minutes on YouTube/Loom/Vimeo; a team/problem/purpose pitch ≤2 minutes; deployed Monad Mainnet or Testnet product URL with access/test credentials as needed. The optional ≤30-second promotional video is not judged. A code/slides-only demonstration or simulation does not meet the actual product/settlement criteria.

**The actual upload form is stricter:** PNG/JPG/WEBP, max **2 MB**, at least **500 px**, max **2000 × 2000 px**. Prepared assets conservatively satisfy both dimensions ≥500 and ≤2000 and ≤2,000,000 bytes. The revised wordmark is 1200×600 / 9,979 bytes; the square is 1024×1024 / 11,914 bytes. No upload was attempted.

Form field limits observed: title ≤120 characters; one-line summary ≤200; description and go-to-market/user acquisition each ≤8000; repository, logo, live-product URL, technical demo and pitch fields. Optional private judge instructions ≤8000, video-publicity checkboxes, short ad and project X link were visible. The observed selected **Best Community** bounty has an additional community/campus-group requirement and required group identification, which remains unfilled/unproven. Selection does not establish eligibility. No bounty choice, checkbox or form value was modified.

The [Prizes screen](https://hackathon.monad.xyz/prizes) confirms **Grand Champion $25,000**, and **four tracks of $30,000 each, with three equal $10,000 winners per track**. A main prize and bounty may stack. The advertised $250,000+ total includes estimated service benefits and must not be described as entirely cash. The fuller Korean catalog, including unopened bounty listings labeled as listings, is in [METROPOLIS_GUIDE.ko.md](METROPOLIS_GUIDE.ko.md).

### Verified resource catalog

The Resources page lists one voucher per team and these benefits; these are catalog offers, not redeemed DROP accounts or guaranteed billable credits:

| Provider | Listed benefit | Listed estimated value / condition |
| --- | --- | --- |
| QuickNode | Build tier, three months | ~$147; new accounts |
| Tenderly | Pro tier for teams | ~$7,200; all teams |
| Zerion | API Builder, one month | ~$149; all teams |
| BlockVision | Lite, two months | ~$58; all teams |
| Spectrum Nodes | Business, two months | ~$300; all teams |
| Dwellir | Developer, three months | ~$147; all teams |

Listed technical references include [Privy embedded-wallet template](https://docs.monad.xyz/templates/next-serwist-privy-embedded-wallet), [Privy smart-wallet template](https://docs.monad.xyz/templates/privy-smart-wallet), [Envio Telegram-bot guide](https://docs.monad.xyz/guides/indexers/tg-bot-using-envio), developer-essentials gas pricing/reserve-balance/EIP-7702, and smart-contract deployment/verification guides. The catalog listing was verified; this pass did not read every linked document. Template/bot existence is not permission to change DROP into a Telegram Mini App.

**Submission hold:** the user explicitly instructs never to submit yet. All authenticated portal activity was read-only. No application content was filled, saved, sent or uploaded; Submit remained untouched and no accepted application is claimed. Earlier access limitations remain historical facts; they no longer imply that the track/form/resources are currently wholly unverified. The public Metropolis marketing page still failed direct web reads in this pass.

## Coupon supply

[Giftishow Biz API guide](https://biz.giftishow.com/blog/mobile-coupon-api-guide/) was supplied as the intended vendor reference, but its body was inaccessible during this pass. No API endpoint, sandbox, production key, approval, issued coupon or commercial price was verified. P0 uses authorized operator inventory with private delivery, or explicit non-redeemable demo stock. Automated supplier issuance remains P1 after approved commercial documentation and credentials.

## Recheck at deployment/submission

Recheck canonical network/USDC addresses, chain bytecode/decimals, installed SDK APIs, Monad execution settings, authentication origin/redirect settings, gas sponsorship, actual Firebase/Vercel configuration, durable Functions execution, supplier rights, and current contest portal requirements. Record executed verification evidence in DEPLOYMENT.md and REQUIREMENTS_AUDIT.md; this source ledger is not a completion report.
