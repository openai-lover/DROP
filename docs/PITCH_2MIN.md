# DROP founder pitch — maximum 2 minutes

**2026-10-14 status: truthful draft and recording plan. Actual study results, final recording and upload are not established.** The user confirmed: **DROP is built by solo developer Gyu-min Kim.** **SLIME CEO! is only the YouTube upload channel**, not the developer/team name. The supplied X profile is [AlphaGgang](https://x.com/AlphaGgang). Relevant biography and prior experience remain unprovided. The ≤2-minute pitch requirement is confirmed on the official [Consumer Products & Payments page](https://hackathon.monad.xyz/tracks/consumer-payments); it does not establish an exemption from live judging. The user now authorizes video upload and final application submission, superseding the earlier hold. No completed upload or application is implied here.

Runtime context: Vercel web/API, Firestore awards and a durable payout/retry/reconciliation processor, with Privy as identity/wallet provider. Root is connecting real Privy, approved keyless database access and authorized Testnet funding. Check their actual final results before declaring a working payment. Functions requires a separately approved Blaze plan; no such upgrade is established here. Local settlement tests and the 48-check hosted UI suite are engineering evidence. The official Technical 20% / Design 20% / Originality 15% / Founder–market fit 25% / Traction 20% rubric also requires real market/user evidence; study forms and the next-100 plan are not results. Keep the pitch focused on demonstrated consumer outcomes.

## English script

### 0:00–0:20 — the hook and creator

“Giveaways attract a crowd. DROP turns the reward into something they can play. I’m Gyu-min Kim, the creator of DROP. I’m building for Telegram KOLs and community operators running an AMA, a launch or a thank-you event.”

The first-person script uses only the identity supplied by the user. If synthetic narration reads it, identify that voice as synthetic in the video description; do not label it the creator's recorded voice. No retention improvement, relevant employment, previous projects or users is claimed by the hook.

### 0:20–0:45 — the problem to validate

“A reward announcement is easy to share. Completing it means checking who qualified, collecting delivery details and resolving missing payments. Our customer hypothesis is that operators need one flow that keeps the excitement and makes each promised reward accountable.”

### 0:45–1:15 — product and Monad

“The operator fixes a budget, reward limit and deadline, then shares one link. Members sign in and play an eighteen-second catch game or a three-question quiz. Valid play reserves a reward; a receipt appears only after payment is confirmed. The server checks participation. A funded Monad escrow enforces payout limits. Monad makes the settlement inspectable while an embedded wallet keeps the ordinary signup flow. This demo uses testnet tokens with no financial value.”

Use this section only after those behaviors are actually demonstrated. Otherwise name the unfinished integration and do not submit the pitch as a completed-product claim.

### 1:15–1:40 — prototype and next pilot

Positive stage wording, without inventing completed research:

“We’re at the working testnet prototype stage. Our next pilot observes five people without Monad wallets and interviews ten community operators. We will track unaided completion, confirmed receipt, failures and whether an operator runs a second event.”

Once the main task verifies an actual hosted end-to-end payment, add that concrete receipt as an engineering milestone. Replace pilot wording with results only after actual research: exact counts, dates, mode, assistance and observed failures from USER_TESTS.md. Do not infer unique humans from account counts or call testnet rewards real-value payouts.

### 1:40–2:00 — the next step

“Our first-hundred-user target is five pilot creators inviting twenty participants each. These are future targets, with no existing partners claimed. We will test an operator fee separately from the reward budget. DROP: playable participation, verifiable rewards.”

## Pitch discipline

- Keep the consumer receiving and using a reward at the center; the dashboard supports the service.
- Do not say “world first”, “fully decentralized”, “perfect bot prevention”, “human proof”, or “guaranteed cash-out”.
- Do not turn a non-redeemable demo coupon into a claim of coffee delivered in real life.
- Present prices, costs, and next-100 growth as hypotheses until measured. Do not list unagreed KOLs as partners.
- Aim for roughly 210–250 spoken English words after inserting team information, then measure the exported recording. Timing labels are a storyboard, not proof of duration.

## Capture checklist

| Required item | Evidence |
| --- | --- |
| Developer / team | User confirmed solo developer Gyu-min Kim |
| Upload channel / X | SLIME CEO! channel / AlphaGgang profile; not the developer/team name |
| Relevant biography and prior experience | Not supplied |
| Verifiable team biography | Not supplied |
| Current product/demo state | Review REQUIREMENTS_AUDIT.md before recording |
| Research result or explicit pilot-plan wording | Pilot-plan wording prepared; real results absent |
| Final video file | Not recorded |
| Measured duration ≤ 2:00 | Not measured |
| Accepted accessible host URL | Not uploaded |

Record a concise spoken explanation and the actual team identity with consent. Check audio, captions, intelligibility, final duration, and unauthenticated video access. Add a completed URL only after upload and independent playback verification.

## Reusable local draft capture

`scripts/video-pitch-draft.json` contains the truthful preparation version. It explicitly identifies current public practice as unpaid and unfinished public payment integration as unfinished. Refresh these lines only after actual proof exists; it is not a substitute for the required live-payout technical demo.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/video-speech.ps1 -ScenarioPath scripts/video-pitch-draft.json -OutputDirectory .local/video/pitch-voice
node scripts/video-capture.mjs --scenario scripts/video-pitch-draft.json --url https://drop-omega-five.vercel.app --audio-dir .local/video/pitch-voice --out .local/video/pitch-draft
node scripts/video-assemble.mjs --manifest .local/video/pitch-draft/capture.json --audio-dir .local/video/pitch-voice --out .local/video/pitch-draft.mp4 --max-seconds 120 --allow-rehearsal --ffmpeg .local/video-tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe
```

The Windows voice is a neutral synthetic narrator. No voice cloning, external music, paid TTS account, upload or browser-account action is performed by these scripts. Review measured duration ≤120 seconds, captions, pronunciation, privacy and product truthfulness before the authorized upload. Tool provenance and recording restrictions are in [DEMO_3MIN.md](DEMO_3MIN.md).
