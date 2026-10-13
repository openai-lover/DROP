# DROP product brief

DROP helps Telegram KOLs and community operators turn a reward event into a short game, then finish the payout. **Playful rewards for communities. Real payouts, without the wallet hassle.**

한국어 소개: KOL이 커피와 코인을 재미있게 뿌리고, 지급까지 관리하는 도구. 슬로건: **그냥 뿌리지 말고, 플레이하게 하자.**

This is the product specified by the supplied implementation brief. It remains a B2B2C community rewards product entered under **Consumer Products & Payments**. It is an independent mobile website shared through ordinary HTTPS links in Telegram. It is not a Telegram Mini App.

The selected deployment is **Vercel Next.js + Firebase Firestore**, with prepared Firebase Functions durable-processing source, following the user's later hosting instruction. Privy remains the single authentication/wallet provider. The actual project `drop-5a400` remains Spark with no billing upgrade authorized, so cloud Functions are not operating. See [FIREBASE_VERCEL.md](FIREBASE_VERCEL.md) for local runtime and deployment requirements.

The authenticated official [Consumer Products & Payments page](https://hackathon.monad.xyz/tracks/consumer-payments) confirms Technical Execution 20%, Design & Craft 20%, Originality & Track Insight 15%, Founder & Market Readiness 25%, Traction & Path Forward 20%, plus an actual user study and next-100 plan. The deadline is 2026-10-14 12:59 GMT+9 / Asia/Seoul. Contest submission remains on the user's explicit hold; the already selected track was only inspected, never changed or submitted.

## The customer and the moment

The paying customer is a KOL, community operator, or crypto project team running an AMA, project introduction, community competition, or thank-you event. The recipient is a community member who wants the advertised reward without installing a Monad wallet or buying gas first.

The initial market and problems below are **hypotheses, not interview findings**:

| Person | Present task to investigate | DROP outcome to test |
| --- | --- | --- |
| Participant | Understand eligibility, join the event, work out whether and how a promised reward arrived | Open a link, understand the rules, play, receive a clear payout status, and find the reward again |
| Operator | Set a reward budget, record eligible people, collect delivery details, send rewards, handle missing-payment questions | Commit a budget before publication, share one link, and reconcile qualified, paid, failed, and remaining amounts |
| Returning operator | Decide whether the event was worth repeating | See recipient completion and payout reliability, then run a second event without rebuilding the process |

No interviews, partnerships, external-user test results, revenue, or repeat-use evidence have been supplied. See [USER_TESTS.md](USER_TESTS.md) and [DISTRIBUTION.md](DISTRIBUTION.md) for the collection plan.

## The improvement that matters to a judge

The short game is the invitation. The important product result is that the reward promise becomes a funded, constrained, traceable payout, and the consumer can keep or send the received USDC. A successful tap animation alone is not the result.

1. **Make the promise explicit before login.** Show the organizer, asset and network, reward amount, number of recipients, exact success rule, retry limit, close time, and claim deadline. Practice must say it cannot earn a reward.
2. **Fund before sharing.** A USDC event cannot open until the escrow deposit is verified. Rules and budget are fixed after publication. The participant should be able to inspect funding without becoming an operator.
3. **Treat receipt as a first-class screen.** Separate game success, qualification, reservation, submission, and confirmed delivery. Give a retry/recheck route during service disruption. Show the real balance only after reading it from the chain.
4. **Complete the consumer's next action.** Keep the reward through logout and login, explain security/recovery, and support a deliberate same-network USDC transfer with recipient, amount, network, and fee confirmation.
5. **Close the operator's books.** A dashboard must reconcile deposited, reserved, submitted, confirmed, expired, reclaimed, and remaining funds. Repeated worker execution must not create repeated payments.
6. **Earn market claims.** Observe at least five independent participants and interview actual operators. Automated checks and team trials do not count as real customer traction.

These are proposed ways to strengthen the supplied product, not a claim that any judge will award it a prize.

## Complete participant path

`/d/[slug] → rule/reward preview → Telegram or email authentication → play → server verification → payout status → /me/rewards`

| Step | Consumer sees | Required truth |
| --- | --- | --- |
| Preview | Who is hosting, what is offered, how many rewards exist, when it ends | Testnet USDC has no financial value; demo coffee cannot be redeemed |
| Authentication | One account login; wallet creation when needed | Verified provider identity, no body-supplied identity, no second wallet login |
| Play | Catch three moving targets or answer three operator-written questions | Server-issued session; scoring happens on the server |
| Result | Verified / no more rewards / try again / expired | Success animation does not mean payment confirmation |
| Delivery | Reward reserved, processing, sent, or a recoverable failure | Fixed recipient and reward; receipt plus matching event before confirmation |
| Reward box | Read balance, payout receipt, or privately accessible coupon details | Account ownership enforced; persistence across login; no fake balance |
| Send | Same-network address, amount, cost, and user confirmation | User authorizes a real transaction; the operator cannot withdraw recipient funds |

The first receipt does not require an extension, seed phrase, manual network switch, or MON purchase. The claim relayer and user-approved outgoing transfer have separate gas arrangements. Unconfigured integrations must remain visibly unavailable.

## Complete operator path

`/creators → /dashboard/new → choose game → reward and inventory → period and rules → fund → publish HTTPS link → /dashboard/[id]`

An operator controls its own campaigns only. Publishing locks game configuration and reward policy. USDC budget is held in campaign escrow; expired unclaimed budget returns to the original operator after the claim deadline, through a transaction. Coupons use operator-owned authorized inventory; they are not purchased automatically with USDC.

The payout policy is **FIRST_N_VERIFIED**: the first N authenticated accounts whose valid results are atomically accepted by the server receive an identical fixed reward, once per campaign and wallet. Client click time does not determine the final order. A verified account is not proof of one unique human.

## Data and payout operations

Vercel handles web pages and authenticated APIs. A Firestore transaction consumes the attempt, assigns the first-N slot, reserves an inventory item when applicable, and persists the award plus payout-job outbox. Deterministic guard documents enforce uniqueness within the same transaction; Firestore does not supply SQL unique constraints.

Prepared Firebase Functions source consumes created payout jobs and schedules retry/reconciliation. Its build passes, but it is not deployed on Spark. Events and schedules may run more than once or overlap, so persistent leases and immutable reward identities guard every worker transition. No payment should depend on a Vercel request staying alive after its response. A compatible authorized durable runtime must be operating before funded public events open.

## What the two games add

| Game | Participant experience | Verification and limit |
| --- | --- | --- |
| Catch / 잡아봐 | A 15–20 second touch/click game with three accessible hits, optional sound, restrained motion | Server checks session, seed, time, coordinate, and event order; this does not prove human participation |
| Quiz / 나 얼마나 알아? | Three operator-written questions about an AMA, project, KOL, or community | Answers stay server-side; questions and scoring rule lock before start; correct-answer rate does not prove AMA attendance |

Use meaningful copy and generous hit targets. Reduced motion, keyboard access where applicable, focus states, screen reader labels, and actionable failure messages are part of quality, not polish deferred until after payout.

## Why Monad is used

DROP's onchain component constrains funded reward promises: a fixed token, amount, recipient, claim window, rules hash, signer, and duplicate guards are verified by escrow. The offchain server evaluates games and allocates the first N places. The chain settles authorized awards and caps spending; it does not verify that a human played honestly.

Fast EVM settlement can make a short-game reward feel continuous, but DROP must measure the whole journey including authentication, queueing, RPC, and confirmation. Canonical network information and source dates are in [OFFICIAL_SOURCES.md](OFFICIAL_SOURCES.md). Protocol performance figures must not be described as measured DROP latency.

## Track fit and honest differentiation

The Consumer Products & Payments case depends on the complete recipient journey: authentication without wallet setup, funded USDC delivery, a persistent balance, and user-approved onward transfer. The operational dashboard makes the service repeatable, but the consumer remains the demo's protagonist.

If only games and coffee giveaways work, the product would fit Social, Attention & Culture more naturally and its payments evidence would be weak. We retain the requested track and fix the payments gap rather than silently changing the entry. Coffee inventory shows another delivery workflow; it does not prove onchain payments. There is no verified market comparison supporting a “first”, “unique”, or “no competitors” claim.

## Scope and order

| Priority | Deliverable | Completion gate |
| --- | --- | --- |
| P0-A | Catch, authentication, official USDC deposit, funded event, qualification, gas-paid escrow payout, real recipient receipt | One independently reproduced Monad Testnet path, then reliable failure/retry cases |
| P0-B | Quiz on the same engine, operator accounting, private coupon inventory, user tests, submission materials | Both complete paths, data isolation, verified payout/inventory accounting, real evidence or explicitly missing evidence |
| P1 | MON, verifiable drawing, approved coupon issuance API | Start only after P0 gates; each feature needs separately verified prerequisites |
| P2 | USDT0, extra chains, complex automation | Not part of current implementation commitment |

No personal-gifting pivot, crowdfunding, exchange, token launchpad, generic quest platform, cash-out promise, quiz-generation AI, random draw, or mainnet spending is needed for P0.

## Success measures

Measure unaided task completion, time from campaign opening to confirmed receipt, time from qualification to confirmation, failure/recovery rate, repeat operator use, and willingness to pay. Segment `practice`, `local`, `demo`, `testnet`, and `mainnet`, plus staff/bot/real-user origin. A confirmed testnet reward is a technical result, not revenue or real-value money paid.

Current completion is determined by [REQUIREMENTS_AUDIT.md](REQUIREMENTS_AUDIT.md), [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md), and actual execution evidence. This product brief is a target behavior specification, not a deployment certificate.

Current engineering evidence includes locked install/lint/builds, 61 server tests, 42 contract unit/fuzz tests +two invariants and two actual local Anvil/Firestore worker cases. Real Testnet network/token reads and Firestore cloud configuration are confirmed. **Public web/practice is deployed at [drop-omega-five.vercel.app](https://drop-omega-five.vercel.app/)** and the same30Chromium cases/six profile skips pass locally and hosted. Real Privy, Vercel app-data IAM, public escrow/worker/funding, cloud Functions, real coupons and independent adoption remain incomplete. GitHub push403 leaves the requested remote empty; direct web deployment is not source publication or contest submission.
