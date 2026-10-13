# DROP distribution and business hypotheses

**No agreed KOL partners, customer revenue, real campaign reach, or repeat-use data are recorded.** This is an executable pilot plan. Names and outcomes remain empty until there is actual evidence and permission to publish them.

## The next 100 participants

Target operators already running small reward events for active Telegram communities. First offer an observed testnet pilot, then discuss a real-value event only after the relevant approvals and launch gates. Never collect channel members, scrape contacts, send unsolicited DMs, or automatically publish promotions.

Pilot prerequisites include the hosted Vercel website, configured Firestore and Firebase Functions payout/retry/reconciliation, real Privy onboarding, and authorized Monad Testnet funding. The local emulator is ready for engineering tests; it is not a partner-facing hosted pilot. Functions deployment needs the owner's Firebase billing/project setup, which remains uncompleted.

| Stage | Owner action | Target (not achieved) | Evidence before advancing |
| --- | --- | --- | --- |
| Week 1: problem validation | Human team recruits/interviews three real operators through existing relationships or consent-based outreach | 3 interviews; 5 independent participant sessions | Dated consented notes and observed failures in USER_TESTS.md |
| Week 2: first event | One consenting operator shares an ordinary HTTPS link in its own channel | About 35 authenticated pilot participants | Channel permission, event dates, mode, server funnel, confirmation data |
| Week 3: repeat and expand | Fix observed friction; same operator repeats; two other consenting operators pilot | About 35 participants in each of three communities total | One completed repeated campaign, three independently verified event records |
| Week 4: evaluate | Deduplicate account counts; exclude staff/bots; review retention, support time, and delivery reliability | First 100 distinct external authenticated accounts; planning capacity 105 | Raw cohort export, mode separation, honest unique-human limitation |

“3 communities × approximately 35 participants” is planning arithmetic (105 capacity), not a claim of three signed communities or 105 people. If only 74 eligible external accounts participate, report 74. Do not reset the target denominator to hide failed authentication or payment.

| Candidate community / KOL | Contact permission | Discussion date | Agreement / event date | Intended participants | Actual accounts / observed humans | Repeat event | Evidence reference |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Not yet agreed — A | Not obtained | None | None | ~35 target | 0 recorded / 0 recorded | None | None |
| Not yet agreed — B | Not obtained | None | None | ~35 target | 0 recorded / 0 recorded | None | None |
| Not yet agreed — C | Not obtained | None | None | ~35 target | 0 recorded / 0 recorded | None | None |

## Why an operator might return

Test whether DROP removes reward-delivery work the operator already does, rather than relying on game novelty. Compare measured active minutes for the operator's last event with its DROP event; include setup, reconciliation, failures, and support. Ask it to schedule and complete another event. A positive quote or willingness to try is not repeat usage.

Distribution stays anchored in existing event moments: AMA conclusion, project onboarding, community competition, and member appreciation. Sharing a result is optional and cannot be an extra condition imposed after a legitimate award. There is no promised viral coefficient.

## Revenue hypotheses

Proposed experiment A is a **KRW 10,000 fee per campaign**, with reward budget supplied separately by the operator. Proposed experiment B is **KRW 39,000 per month for up to four campaigns**, then a clearly quoted additional-event fee. These are unvalidated price hypotheses, not a launched pricing page, payment integration, subscription sale, or revenue forecast. Ask actual operators which structure matches usage before choosing.

Reward principal should not be counted as platform revenue. Record how refunds, unused escrow funds, payment processing, sponsorship credits, taxes, currency conversion, and supplier margins would work before charging real customers. DROP currently does not promise automatic fiat conversion or a path from USDC into coffee purchasing.

## Unit economics worksheet

Use the deployment's actual measured costs; no public service rate or MON exchange rate is assumed here. Enter all currencies and valuation dates explicitly. Testnet gas measurements can inform transaction counts, but testnet assets cannot establish real-value cost or revenue.

| Input per event | Symbol / calculation | Illustrative assumption only | Measured value / evidence |
| --- | --- | --- | --- |
| Participant accounts | `P` | 100 | Not measured |
| Confirmed rewarded recipients | `W` | 30 | Not measured |
| Operator event fee | `F` | KRW 10,000 | No sale |
| Reward principal | `R` | Enter operator budget; excluded from revenue/margin | Not funded for a real event |
| Gas including retries | `G = claims + funding + reclaim + sponsored sends` valued at actual gas and MON price | KRW 300 placeholder | Not measured; do not quote as expected Monad cost |
| Authentication/wallet allocation | `A = billable auth/wallet usage + allocated plan cost` | KRW 600 placeholder | Not measured |
| Firebase/Vercel infrastructure | `I = Firestore reads/writes/storage + Functions execution/retries + Cloud Scheduler + Vercel + monitoring` | KRW 300 total placeholder | No cloud bill or production usage measured |
| Coupon procurement/fulfilment | `C` | 0 in illustrative USDC-only event; enter supplier cost for coffee | No API/supplier contract |
| Active support/operator work | `S = minutes × fully loaded KRW/minute` | 15 minutes × KRW 200 = KRW 3,000 | Not measured |
| Processing/refund/tax allocation | `O` | 0 omitted for illustration; must be measured before pricing | Not established |
| Contribution before fixed costs | `F − G − A − I − C − S − O` | KRW 5,800 with placeholders above | Not actual margin |
| Illustrative contribution ratio | `contribution / F` | 58% before omitted costs | Not actual margin |

The illustration demonstrates the worksheet; it does not prove economic viability. At the same assumed non-support costs, 30 minutes of support at KRW 200/minute would reduce illustrative contribution to KRW 2,800. Higher sponsorship/auth costs, refunds, or supplier fees can erase it. Measure support time and fees before publishing prices or claiming high margins.

Count Firestore transaction retries, duplicate trigger deliveries, scheduled recovery and idle polling when estimating infrastructure. Firebase Functions deployment requires Blaze; do not describe the production payout service as guaranteed free. Local emulator use is not a measured production cost. Refer to actual billing and [FIREBASE_VERCEL.md](FIREBASE_VERCEL.md) before a paid pilot.

## Decisions after the pilot

Continue if recipients complete the actual flow, operators finish another event, and measured contribution remains positive at a price operators accept. If rewards generate one-off activity but operators do not repeat, investigate the failed event outcome before adding games. If payments or recovery remain unreliable, stop public reward-event expansion and fix that path. This is a decision framework, not a signed market result.
