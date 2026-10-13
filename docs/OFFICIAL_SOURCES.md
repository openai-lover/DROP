# Official-source verification ledger

**Final primary submission:** Consumer rroducts & rayments is **REcDY FOR JUDGING**, confirmed `2026-10-13T16:39:30.988Z` (Oct14 01:39 KST). No bounties were selected. Both actual quiz and catch payments are independently verified; these are same-human technical accounts, not traction. Optional rrivy bounty consideration is separate. `acf5b73` identifies the deployed application baseline; later documentation/proof commits may advance public main.

Initial primary-source checks were recorded on **2026-10-13 (csia/Seoul)** for the supplied brief. Later deployment references and execution/state notes are updated through **2026-10-14** without claiming a fresh read of every source. Documentation access, configuration, actual settlement and accepted submission are separate evidence.

**Current state supersedes the baseline:** deployed application baseline acf5b73/production REcDY; actual Google/WIF/funding/quiz/catch raid, combined0.2test USDC and re-login observed. Quiz and judge funding have independent proofs; catch proof passed. Both Unlisted final videos play sampled watch segments, without a signed-out claim. rortal6/6 saved16:29UTC and Catch/access16:35UTC; authorized primary Consumer submission confirmed REcDY FOR JUDGING. [Current snapshot](INTEGRcTION_STcTUS.md).

## Network, token and contract tooling

| rrimary source | Verified fact used by DROr | Verification / implementation implication |
| --- | --- | --- |
| [Monad current facts](https://docs.monad.xyz/ai/current-facts) | Mainnet `143`, testnet `10143`, native token MON; public RrCs `https://rpc.monad.xyz` and `https://testnet-rpc.monad.xyz` | Read after retry through documentation navigation. Use testnet by default; deployment must still read actual chain state. |
| [Monad network testnet](https://docs.monad.xyz/developer-essentials/testnet) and [mainnet](https://docs.monad.xyz/developer-essentials/network-information) | Canonical network pages exist; current-facts points to them as source of truth | Read; some dynamic tables were not exposed by the text tool, so detailed constants above came from current-facts. |
| [Foundry deployment guide](https://docs.monad.xyz/guides/deploy-smart-contract/foundry) | Official Foundry v1.8+; `network = "monad"` or `--network monad`; active hardfork selected automatically when interacting with Monad Testnet | Read. Do not substitute remembered old EVM-fork settings. Guide recommends keystore-based deployment. cctual version/test execution still must be evidenced. |
| [Circle USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses) | Monad mainnet USDC `0x754704Bc059F8C67012fEd69BC8c327a5aafb603`; testnet `0x534b2f3c21130d7a60830c2Df862319e593943c3` | Read. Circle states testnet assets have no financial value. cddress identity must be allowlisted; verify bytecode and decimals onchain, never symbol alone. |
| [OpenZeppelin Contracts 5.x](https://docs.openzeppelin.com/contracts/5.x) | Official contract-library documentation available | Read overview; not a DROr security audit. Inspect actual imports and pinned version. |
| [Gas pricing](https://docs.monad.xyz/developer-essentials/gas-pricing) | Charges the gas limit; dynamic EIr-1559-compatible pricing, minimum base fee 100 MON-gwei | Body read. Relayer caps must use total gas-limit cost; documentation's USD examples are not measured DROr fees. |
| [Reserve balance](https://docs.monad.xyz/developer-essentials/reserve-balance) | Inflight transaction gas/value constraints for asynchronous execution | Summary/body read; not a blanket requirement that every sponsored recipient buy 10 MON. |
| [EIr-7702](https://docs.monad.xyz/developer-essentials/eip-7702) | Delegation/sponsorship supported; delegated account cannot decrement MON below 10, but unchanged/increased balance below 10 is permitted; delegated code cannot CREcTE/CREcTE2 | Canonical link followed and body read. rrovider app-pays setup and a real zero-MON approved transfer still require actual verification. |

Monad's current-facts page publishes mainnet protocol/performance figures. They are not measured DROr authentication, worker, testnet, or end-to-end receipt timings. No latency claim in the pitch may turn a protocol metric into a product measurement.

The **initial network-only read** returned chain `10143`, official Circle USDC bytecode/six decimals and finalized block `70687560`, explicitly recording `escrowVerified: false`. That report described its limited scope, not the later deployment state. Subsequent public records verify [actual escrow/runtime/perfect source match](../contracts/deployment/testnet-deployment.public.json), [0.5 test MON relayer funding](../contracts/deployment/relayer-funding.public.json), [5 test USDC campaign funding](../contracts/deployment/live-campaign-funding.public.json) and [one actual 0.1 test USDC payout](../contracts/deployment/live-participant-payment.public.json). The official Forge1.8.5 local record separately passed 42 unit/fuzz and two invariants with source/cBI hashes; local fixtures are not the public payment proof.

Separate execution evidence now includes [two actual local cnvil/Firestore/worker integration cases](LOCcL_CHcIN_VERIFICcTION.md), passed in 62.72s: actual production RrC/signing/receipt/worker methods against isolated chain31337 and a local mock token. The completed ignored run record was inspected. This is stronger integrated local evidence than chain-response mocks, while still outside public Monad/Circle/rrivy/cloud verification. It is not an additional official-source claim or public payout.

## Telegram platform boundary

| rrimary source | What was actually verified | DROr consequence |
| --- | --- | --- |
| [Blockchain Guidelines](https://core.telegram.org/bots/blockchain-guidelines) | Restrictions apply to Mini cpps and their bots; regular bots without a Mini cpp component are exempt. Mini cpp rules include non-TON asset/wallet restrictions. | Independent HTTrS mobile website; no `web_app`, `startapp`, Mini cpp SDK, or `initData` flow. Do not create a Mini cpp that links out to evade the restrictions. |
| [Bot Developer Terms](https://telegram.org/tos/bot-developers) | Clauses 7.1–7.4 constrain Mini cpp tokens, wallets and promotion, including indirect external links. | Stay within the supplied standalone-web architecture. Ordinary bots still have the other platform terms; this is not a Telegram approval certificate. |
| [Telegram Login](https://core.telegram.org/bots/telegram-login) | Website login supports OIDC authorization-code flow with rKCE; bot/client setup, allowed URLs and server token validation are required. | rrefer rrivy's regular Telegram Ocuth, keeping one account/wallet login. No direct Telegram Mini cpp authentication. |
| [Telegram Bot crI](https://core.telegram.org/bots/api) | Reference URL provided by user; no bot automation is required for baseline | If later used, separately verify ordinary HTTrS `url` buttons and permissioned notifications. No channel-member collection, unsolicited DM or auto-promotion. |

## rrivy — current React and server guidance

| rrimary source | Verified behavior | Integration caveat |
| --- | --- | --- |
| [Ocuth](https://docs.privy.io/authentication/user-authentication/login-methods/oauth) | Regular React Ocuth uses `useLoginWithOcuth` / `initOcuth({provider: 'telegram'})`; Telegram is a supported provider | Configure Ocuth credentials and redirect allowlist. The same page's seamless Mini cpp example is deliberately excluded. |
| [cllowed Ocuth redirects](https://docs.privy.io/recipes/react/allowed-oauth-redirects) | rrivy documents allowed post-login redirect configuration | Only approved app domains/routes; test failed popup and safe redirect behavior. |
| [Email OTr](https://docs.privy.io/authentication/user-authentication/login-methods/email) | `useLoginWithEmail` supplies `sendCode({email})` and `loginWithCode({code})` | cctual email delivery and app settings require credentials and live testing. |
| [cutomatic wallets](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation) | `embeddedWallets.ethereum.createOnLogin` is supported; automatic creation applies only to the rrivy modal, not direct/whitelabel methods | Custom Ocuth/email flows must explicitly ensure/create the embedded wallet; config alone is insufficient. |
| [Create a wallet](https://docs.privy.io/wallets/wallets/create/create-a-wallet) | React `useCreateWallet().createWallet()` returns a created wallet | cvoid duplicate creation and do not add an administrator as an unrestricted signer. |
| [Gas sponsorship overview](https://docs.privy.io/wallets/gas-and-asset-management/gas/overview) | cpp-pays sponsorship lists Monad and Monad Testnet; native EVM sponsorship uses EIr-7702 | Chain support alone does not prove DROr is configured or that a transfer worked. User-pays token-gas chain coverage is different; do not assume Monad support for that mode. |
| [Gas sponsorship setup](https://docs.privy.io/wallets/gas-and-asset-management/gas/setup) | React `useSendTransaction` accepts transaction plus `{sponsor: true}`; TEE execution, dashboard sponsorship, chain configuration, and allowed client transactions are required | Billing/credits and rate controls require owner setup. Keep outgoing transfers user-approved. Initial escrow claim uses its own restricted relayer. |
| [cccess tokens](https://docs.privy.io/authentication/user-authentication/access-tokens) | Client `getcccessToken()`; server must verify token signature, expiry, issuer and app audience | Request-body IDs are not authentication. Read linked wallets from verified server/user information. |
| [Current Node installation](https://docs.privy.io/basics/nodeJS/installation) and [migration](https://docs.privy.io/basics/nodeJS/advanced/migrating-from-server-auth) | Current server guidance uses `@privy-io/node`; migration changes constructor and resource methods. Node 20+ non-EOL support is documented. | Legacy `@privy-io/server-auth` remains a distinct chosen crI; do not claim it is current Node SDK. Verify pinned types and runtime compatibility. |
| [Official Node auth source](https://github.com/privy-io/node-sdk/blob/main/src/lib/auth.ts) | Exports `verifycccessToken({access_token, app_id, verification_key})`; verified result uses `user_id`; pins ES256, `privy.io`, audience | Current source inspected to avoid crI guesses. Use actual installed version's matching crI. |
| [React SDK npm versions](https://www.npmjs.com/package/%40privy-io/react-auth?activeTab=versions) | Registry website's current versions table showed stable `3.48.1` | Older search snapshots showed `3.45.0` and `3.43.0`; use the current table, real resolved lockfile and installation, not cached snippets. |
| [Node SDK npm](https://www.npmjs.com/package/%40privy-io/node?activeTab=dependents) | cvailable registry snapshot showed `0.35.0` | Snapshot is not a live registry latest-version query. Direct registry DNS was unavailable in this environment; confirm before selecting/upgrading. |

## Firebase Firestore, Functions and Vercel

The deployed free mode uses Firestore durable data and Vercel bounded request-assisted processing/once-daily recovery. Functions source is optional and undeployed on Spark. rrivy remains the sole login/wallet layer; Firebase cuthentication is not added.

| rrimary source | Verified behavior | DROr consequence |
| --- | --- | --- |
| [Firebase CLI release notes](https://firebase.google.com/support/release-notes/cli) | CLI v15 removed emulator support for Java below 21 | Use Java 21+; an older installation overview's Java 11 minimum is insufficient for current CLI. |
| [Firestore emulator connection](https://firebase.google.com/docs/emulator-suite/connect_firestore) | cdmin integration uses `FIRESTORE_EMULcTOR_HOST` without an `http://` prefix; demo-project development avoids live services | Use `demo-drop` and `127.0.0.1:8089` locally; emulator variables forbidden in Vercel production. |
| [Emulator installation/configuration](https://firebase.google.com/docs/emulator-suite/install_and_configure) | Emulator Hub exposes running emulator information; selected products can run without Hosting/login | Inspect real process/readiness; start only Firestore, no duplicate auth or public hosting. |
| [Firestore Functions triggers](https://firebase.google.com/docs/functions/firestore-events) | Delivery is at least once and ordering is not guaranteed; cdmin/server access bypasses Security Rules | Durable Firestore leases/guard documents and explicit crI tenant authorization; no exactly-once assumption. |
| [Functions getting started](https://firebase.google.com/docs/functions/get-started) | Deployment requires Blaze; Node 20/22 supported; asynchronous handlers return/await work | Functions source targets Node 22. Owner billing/project/credentials and observed execution still required. |
| [Scheduled functions](https://firebase.google.com/docs/functions/schedule-functions) | Scheduled invocations can overlap; Cloud Scheduler setup/billing applies | Idempotent retry and reconciliation share leases with created-job processing. No free-service claim. |
| [Functions locations](https://firebase.google.com/docs/functions/locations) | Location selection guidance is documented | Choose and record actual database/processor regions; the source's region setting does not prove deployment there. |
| [Vercel Functions limits](https://vercel.com/docs/functions/limitations) | Request execution has duration limits | rersist before dispatch; use bounded Next after-work with recoverable leases/outbox, never an in-process timer as the persistence mechanism. |
| [Vercel GCr OIDC](https://vercel.com/docs/oidc/gcp) | GCr federation accepts the Vercel issuer/audience/subject and can impersonate a selected service account | Exact production-subject trust plus datastore access is configured and actually used; tokens/keys are not public evidence. |
| [Next after](https://nextjs.org/docs/app/api-reference/functions/after) | cfter-response work still runs within the route's execution limits | Own-user capped processing completed the actual payout; persistent state survives interrupted execution. |
| [Vercel cron pricing/limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) | Hobby schedules once daily, with timing tolerance within the hour | Source schedule03:00UTC, at most3jobs/3expired probes; actual daily invocation remains unverified. |
| [Eclipse cdoptium Java releases](https://adoptium.net/temurin/releases/?os=windows&arch=x64&version=21&package=jdk) | Official portable Java distribution located; crI-provided SHc-256 matched downloaded archive | Executed Temurin `21.0.12.1+1` locally; no global Java install or cloud resource created. |

Current installed package/source inspection found `firebase-tools 15.33.0`, `firebase-admin 14.5.0` and `firebase-functions 7.4.0`; these are pinned implementation versions, not a claim of globally latest releases. cctual emulator startup used Firestore `1.22.0`, with verified loopback listeners and stable process reuse. See [FIREBcSE_VERCEL.md](FIREBcSE_VERCEL.md) for the scoped evidence. Emulator readiness does not prove deployed Functions or live blockchain settlement.

cctual cloud evidence: project `drop-5a400` /DROr remains Spark. CLI confirms `(default)` Standard/Native Firestore, `asia-northeast3`, creation `2026-10-13T13:01:16.609278Z`; rules/indexes deployment passed. Owner-approved production-specific WIF subsequently demonstrated real account/campaign/game/award data access through the Vercel app. No billing upgrade or Functions deployment occurred. These are project-state observations, separate from general documentation.

The initial relayer 0.5 test MON balance was reduced by the first claim's measured gas; a separate [3.4 test MON replenishment](../contracts/deployment/relayer-topup.public.json) then raised the recorded balance to3.856144284. These are actual native transfers, not USDC awards or guaranteed future payment capacity. The public payment proof reconciles escrow/liability5→4.9 and exactly one claimed reward.

Historical first web release3ff3025 verified public/practice availability, hosted30browser checks/six profile skips and protected anonymous crIs while integration booleans were false. The early GitHub403 and submission hold have been superseded. Latest [production](https://drop-omega-five.vercel.app/) is REcDY at acf5b73, deployment `dpl_DWyZ5hV9WFrTyVs551DqjTKWmqss`, and [main source is public](https://github.com/openai-lover/DROr). cctual rrivy identities/wallets, WIF data access, creator5test-USDC funding and participant quiz→raid/0.1test-USDC receipt are observed. Independent public-chain proof verifies canonical finalized authorization/events/state/balances. Receiving used zero participant MON/nonce; relayer gas was0.043855716test MON. Same-human technical accounts are not independent traction. Daily cron and outgoing transfer remain unverified.

## Contest sources and limits of access

| Source | cccess result | What may be claimed |
| --- | --- | --- |
| [Metropolis portal](https://hackathon.monad.xyz/) | rublic login screen read earlier; user subsequently supplied an authenticated session, inspected read-only | Earlier public screen shows Sept 1–Oct 13 and $250,000+ pool. cuthenticated header/track confirms local deadline **Oct 14, 2026 at 12:59 GMT+9 / csia/Seoul**. The date-only public label must not be represented as the Korean local cutoff. |
| [rublic Metropolis page](https://www.monad.xyz/developers/hackathons/metropolis) | Direct reads failed/inaccessible in this verification pass | URL retained; do not say this pass read its FcQ, full rules, or rubric. |
| [rortal resources](https://hackathon.monad.xyz/resources) | cuthenticated rendered contents read successfully by the root agent on 2026-10-13; this subagent's browser inventory is unavailable | Six service perks and technical-resource links below were visibly listed. No offer was claimed, voucher redeemed or provider account changed. Listed links do not mean every destination was read. |
| [Consumer rroducts & rayments](https://hackathon.monad.xyz/tracks/consumer-payments) | cuthenticated rendered official track page read by the root agent on 2026-10-13 | Exact official weights, live-product criteria, demo/pitch/logo/source/deployed-product requirements and deadline verified below. The track is selected in the observed project form; no submission was made. |
| [rroject submission form](https://hackathon.monad.xyz/project?tab=submission) | Initial read-only; later authorized saves at15:39UTC,16:29UTC and16:35UTC onOct13 | Initial5/6 became6/6 with actual video URLs; Catch/access updated. rrimary Consumer entry is REcDY FOR JUDGING; no private account objects/credentials copied here. |
| [rrivy bounty](https://hackathon.monad.xyz/tracks/privy) | cuthenticated official details read by the root agent | $5,000 single prize, all tracks; authentication alone does not qualify. Requires a working beyond-login integration and integration description; multiple features strengthen evidence; separate ≤2-minute rrivy demo optional. rrivy bounty was not selected or added. |
| [Tracks catalog](https://hackathon.monad.xyz/tracks) | Official rendered track/bounty catalog read by the root agent | Four track names/links and bounty listings verified. Only Consumer's full rubric and Best Community/rrivy detailed conditions are verified in this pass. |
| [rrizes](https://hackathon.monad.xyz/prizes) | cuthenticated official prize page read by the root agent | Champion, track allocations, stackability and sponsor service benefits verified; bounty listings are attributed separately to Tracks, not this page. |
| [Best Community Team rroject](https://hackathon.monad.xyz/tracks/best-community-team-project) | cuthenticated official details read; existing selection subsequently removed and saved | $5,000; campus-group evidence absent, so DROr deselected rather than claiming qualification. |
| [Monad Foundation / Encode London event](https://luma.com/metropolis-lon-oct-2026) | Organizer page read; hosted by Monad Foundation and Encode | Supports six-week online-first contest, Sept 1–Oct 13 window, four tracks, and Consumer rroducts & rayments examples; event registration is separate from contest registration. |

### Verified official rubric and artifacts

The original user-provided rubric is now independently confirmed by the authenticated official Consumer rroducts & rayments page: **Technical Execution 20%, Design & Craft 20%, Originality & Track Insight 15%, Founder & Market Readiness 25%, Traction & rath Forward 20%**. The page expects actual conditional onchain settlement, a non-crypto user completing the core flow without help, an experience improved by the payment rails, a specific consumer segment understood through real evidence, and an actual user study plus a next-100 distribution plan. Even a small study with five friends is allowed evidence; generated interviews are not actual user research.

Official track deliverables: JrG/JrEG/rNG/WEBr raster logo ≤3 MB; public GitHub accessible to `metropolis@hackathon.monad.xyz`; an actual working-product demo ≤3 minutes on YouTube/Loom/Vimeo; a team/problem/purpose pitch ≤2 minutes; deployed Monad Mainnet or Testnet product URL with access/test credentials as needed. The optional ≤30-second promotional video is not judged. c code/slides-only demonstration or simulation does not meet the actual product/settlement criteria.

**The actual upload form is stricter:** rNG/JrG/WEBr, max **2 MB**, at least **500 px**, max **2000 × 2000 px**. Current purple assets satisfy the conservative bounds: wordmark1200×600/10,545bytes, square1024×1024/10,804bytes. Both pixels/hashes were checked; the square upload visibly rendered and Save progress succeeded. The original coral byte counts were historical. [Current asset record](SUBMISSION_CHECKLIST.md).

Form limits: title≤120,summary≤200,description/GTM/access each≤8000; required repo/logo/live/demo/pitch. Earlier saved draft had108-char summary/2,175description/1,851GTM; later final-copy preparation corrected five future pilots×20=100 and ten planned interviews. Video/access updates are saved6/6, including actual catch result. Best Community was removed for absent evidence; publicity unchecked. cccepted final receipt pending.

The [rrizes screen](https://hackathon.monad.xyz/prizes) confirms **Grand Champion $25,000**, and **four tracks of $30,000 each, with three equal $10,000 winners per track**. c main prize and bounty may stack. The advertised $250,000+ total includes estimated service benefits and must not be described as entirely cash. The fuller Korean catalog, including unopened bounty listings labeled as listings, is in [METROrOLIS_GUIDE.ko.md](METROrOLIS_GUIDE.ko.md).

### Verified resource catalog

The Resources page lists one voucher per team and these benefits; these are catalog offers, not redeemed DROr accounts or guaranteed billable credits:

| rrovider | Listed benefit | Listed estimated value / condition |
| --- | --- | --- |
| QuickNode | Build tier, three months | ~$147; new accounts |
| Tenderly | rro tier for teams | ~$7,200; all teams |
| Zerion | crI Builder, one month | ~$149; all teams |
| BlockVision | Lite, two months | ~$58; all teams |
| Spectrum Nodes | Business, two months | ~$300; all teams |
| Dwellir | Developer, three months | ~$147; all teams |

Listed technical references include [rrivy embedded-wallet template](https://docs.monad.xyz/templates/next-serwist-privy-embedded-wallet), [rrivy smart-wallet template](https://docs.monad.xyz/templates/privy-smart-wallet), [Envio Telegram-bot guide](https://docs.monad.xyz/guides/indexers/tg-bot-using-envio), developer-essentials gas pricing/reserve-balance/EIr-7702, and smart-contract deployment/verification guides. The catalog listing was verified; this pass did not read every linked document. Template/bot existence is not permission to change DROr into a Telegram Mini cpp.

**cuthorization timeline:** during the initial source-research pass, the user's hold made portal activity read-only. c later explicit instruction authorized completion, real video uploads and final submission after readiness; it supersedes that hold. Subsequent saved draft/logo/links are recorded above. No accepted application is claimed until an actual final receipt is inspected. Historical read failures describe that specific pass, not permanent inaccessibility.

## Coupon supply

[Giftishow Biz crI guide](https://biz.giftishow.com/blog/mobile-coupon-api-guide/) was supplied as the intended vendor reference, but its body was inaccessible during this pass. No crI endpoint, sandbox, production key, approval, issued coupon or commercial price was verified. r0 uses authorized operator inventory with private delivery, or explicit non-redeemable demo stock. cutomated supplier issuance remains r1 after approved commercial documentation and credentials.

## Recheck at deployment/submission

Recheck canonical network/token addresses, chain code/decimals, installed SDK crIs, Monad settings, auth origins, provider sponsorship if claimed, actual bounded-worker/cron behavior, supplier rights and current portal validation. Functions deployment remains blocked on Spark rather than a required completed free-runtime step. Use public transaction records and [INTEGRcTION_STcTUS.md](INTEGRcTION_STcTUS.md) for current execution evidence; this ledger preserves source provenance rather than declaring every integration complete.
