# DROP user research and usability evidence

**Evidence status: no actual operator interviews or independent participant tests recorded.** The tables below are blank collection forms. Automated tests, developer trials, synthetic sessions, demo accounts, and testnet payouts are not interview answers or customer traction.

The selected product runtime is Vercel web + Firestore durable data + Firebase Functions payout processing, with Privy authentication. Local Firestore emulator readiness and [recorded local contract checks](../contracts/verification.json) are engineering evidence only. A synthetic or emulator test cannot be entered as one of the five observed people or as a real deployed campaign.

## Operator interview (20 minutes)

Recruit people who have run a Telegram community reward event in the last three months. Obtain consent for notes and recordings; record only a participant code in this public document. Keep names, account handles, and sensitive campaign records in a private research store.

Ask about the most recent real event before showing DROP:

1. What was the event for? How often do you run events? How many people participated?
2. What reward and budget did you use? Who funded and approved it?
3. Walk through selection, identity checking, delivery, and reconciliation. Which tools and steps did you use?
4. How much active operator time did each step take? Ask for a permitted artifact or timestamp, rather than inventing a baseline.
5. Tell us about a payment/coupon failure, duplicate, or participant complaint. What did recovery cost?
6. What do members need to do before they can receive a crypto reward? Where do they drop out?
7. Which rules must be clear before participation? What proof of payment do you need afterwards?
8. After seeing a real DROP flow, which part would you use for your next event, and which part would you reject?
9. Would you actually schedule another campaign? Record an action and date if agreed; positive comments alone do not prove reuse.
10. Would you pay an event fee or recurring subscription separately from reward budget? Ask which real alternative they would replace. Record a range and the conditions, without implying a purchase.

| Interview code | Date / role | Real recent-event baseline | Delivery failure evidence | Reuse action | Willingness-to-pay observation | Consent / private evidence reference |
| --- | --- | --- | --- | --- | --- | --- |
| O-01 | Not collected | Not collected | Not collected | Not collected | Not collected | Not collected |
| O-02 | Not collected | Not collected | Not collected | Not collected | Not collected | Not collected |
| O-03 | Not collected | Not collected | Not collected | Not collected | Not collected | Not collected |

Interview findings are descriptive; a small convenience sample cannot establish market size or conversion rate.

## Five-person participant study (15–25 minutes each)

Target people who use Telegram but do not already have a Monad wallet. Recruit at least five independently, with a mix of devices and familiarity. Record staff status and existing-wallet status. Do not count the researcher, AI agents, automated browsers, or team members toward the minimum five.

Use Monad Testnet with a limited authorized budget, or clearly labeled local mode if live prerequisites are missing. Explain that testnet tokens have no financial value and demo coupons cannot be redeemed. Do not frame test funds as participant payment. Consent and a private test address must be arranged before any optional outgoing transaction.

Give task statements without telling them where to click:

1. Open the event link. Explain who is hosting, what you might receive, how selection works, and when it closes.
2. Join the rewarded catch game. Authenticate, play, then determine whether a reward actually arrived.
3. Find the reward again after logout and login. Explain what can be done with it and what cannot.
4. View the send flow. Identify address, network, amount, and cost. With the participant's approval, send only the authorized test amount to the arranged test address; verify receipt. Cancellation must not move assets.
5. Join a quiz event and find the assigned coupon. Ask whether it can be used in a store and how they know. Use real authorized inventory only when separately approved; otherwise the answer must be “demo coupon, cannot redeem”.
6. Show a funded-but-sold-out or expired campaign. Ask why no reward was granted and how to check a delayed payment.

Let participants think aloud. After 60 seconds stuck on one step, offer help and mark that step **assisted**. Do not retroactively record it as unaided success. Keep failed runs in the denominator.

| Participant | Date / device / browser | Existing Monad wallet? | Mode / staff or independent | Unaided catch → receipt? | First open → confirmed receipt (s) | Blocked screen / help | Re-login persistence | Send / cancel comprehension | Quiz / coupon comprehension | Private evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P-01 | Not tested | Unknown | Not tested | Not tested | Not measured | Not observed | Not tested | Not tested | Not tested | None |
| P-02 | Not tested | Unknown | Not tested | Not tested | Not measured | Not observed | Not tested | Not tested | Not tested | None |
| P-03 | Not tested | Unknown | Not tested | Not tested | Not measured | Not observed | Not tested | Not tested | Not tested | None |
| P-04 | Not tested | Unknown | Not tested | Not tested | Not measured | Not observed | Not tested | Not tested | Not tested | None |
| P-05 | Not tested | Unknown | Not tested | Not tested | Not measured | Not observed | Not tested | Not tested | Not tested | None |

## Timing, definitions, and proposed release gates

Record observed wall-clock task time and system timestamps separately. `first_open` begins when the participant opens the event; `qualified_at` comes from the server; `confirmed_at` is recorded only after a verified receipt and matching payment event. A transaction hash alone is not confirmation. Include failed and still-pending runs.

Also record the Vercel deployment version, actual Firebase project/environment, worker-trigger/retry timestamps and service outages privately. Use only public, non-sensitive evidence references in this document. A Firestore outbox write or successful Function invocation is not itself a confirmed onchain receipt.

The following are **proposed targets**, not measured results:

| Measure | Definition | Proposed gate |
| --- | --- | --- |
| Unaided receipt | Independent participant explains rules, joins, receives, and finds the receipt without researcher help | At least 4 of first 5; report exact count, never claim population-wide 80% |
| Asset understanding | Correctly distinguishes no-value testnet USDC, actual mainnet value, and non-redeemable demo coupons | 5 of 5 in the study |
| First receipt time | Open → confirmed, authentication included | Report median/range; aim under 90 seconds, then improve observed bottleneck |
| Payout delay | Server qualification → confirmed receipt | Report median/p95 only with enough observations; no invented p95 from five runs |
| Transfer consent | Participant can identify and cancel a proposed transfer; approval is explicit | No unauthorized transfer in any run |
| Recoverability | User can find a pending reward after restart/relogin without earning again | All applicable runs |
| Operator repeat | Same real operator creates and completes a second real event | Observe at least one; intention is a different field |

## Event measurement

Track campaign view, authentication completion, game start/completion, qualification, reward queue/confirmation, coupon delivery/open, campaign creation, and campaign repetition. Do not store answers, Telegram IDs, contact details, coupon contents, barcodes, or private keys in analytics. Use anonymized experiment codes and obtain appropriate consent for recordings.

Every report must state its date range, mode, inclusion/exclusion rules, distinct authenticated accounts, staff/bot exclusions, and number of real observed people. Duplicate accounts are not verified unique humans. Coupon **delivered**, **viewed**, and supplier-verified **redeemed** are separate states.

## Findings log

| Observation | Private evidence | Severity / affected task | Change | Retest result |
| --- | --- | --- | --- | --- |
| No observations collected | None | Unknown | None yet | Not tested |

Published quotes require participant permission and exact attribution to a coded interview. Do not generate responses or testimonials to fill this form.
