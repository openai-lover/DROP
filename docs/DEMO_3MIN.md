# DROP technical demo — uploaded and playback checked

**2026-10-14: uploaded to YouTube as Unlisted; playback confirmed in the signed-in account.** [Watch the demo](https://youtu.be/Lfuvsvowj30). The player advanced from 0 to 13 seconds before being paused. Signed-out playback remains unverified. The measured local file is **155.32 seconds (2:35)**, within the 3-minute limit. The [official track](https://hackathon.monad.xyz/tracks/consumer-payments) requires a working product demo and a separate pitch.

DROP is built by **solo developer Gyu-min Kim**. **SLIME CEO!** is only the authorized YouTube upload channel, not the developer or team name. The supplied X profile is [AlphaGgang](https://x.com/AlphaGgang).

## Delivered local files

| Item | Local artifact / result |
| --- | --- |
| Final video | `.local/video/final/DROP-demo.mp4` — ignored local media |
| Measured duration | 155.32 seconds; limit 180 seconds |
| Video / audio | 1920 × 1080, 30 fps, H.264 / AAC, 48 kHz |
| English captions | Burned in a separate 180-pixel bottom band; companion `DROP-demo.srt` |
| Evidence and hashes | `.local/video/final/DROP-demo.mp4.json` |
| Upload title / description | `.local/video/upload-metadata.json` |
| YouTube URL | [Unlisted demo](https://youtu.be/Lfuvsvowj30); signed-in playback confirmed; signed-out playback pending |

## What the video establishes

The genuine hosted sequence shows a creator fixing a 50 × 0.1 test USDC campaign, funding its 5 test USDC budget, a different user-owned account completing the three-question quiz, delivery queued, the **Paid** receipt and 0.1 test USDC balance, a rejected repeat attempt, and the creator dashboard with Attempts 1 / Reserved 1 / Delivered 1 / Delayed 0. The catch-game clip is explicitly unpaid practice.

Actual production Google/Privy login, embedded wallets, Firestore access, funding and request-assisted payout were observed. [independent public payout proof](../contracts/deployment/live-participant-payment.public.json) verifies the canonical finalized receipt, signer signature, exact escrow and token transfer events, and recipient balance changing from 0 to 0.1 test USDC. The recipient retained 0 test MON; the relayer paid the receiving gas. This does not imply creator funding or outgoing transfers are sponsored.

- Funding: [5 test USDC transaction](https://testnet.monadvision.com/tx/0x4f10e52e5a77c8c24c42dc605e6e3413010fb2ae9dd1b13657eb897f30576637).
- Reward: [0.1 test USDC transaction](https://testnet.monadvision.com/tx/0x9cbb35fcc0ba09119e87452ff5f2d6d534d4a1ae55682ce0c080260f98c5678c).
- Funding and rule checks: [public campaign evidence](../contracts/deployment/live-campaign-funding.public.json).

Processing uses a persistent Firestore outbox and bounded request-assisted recovery. The final-export evidence gate is named `hostedRequestRecovery`, not an always-on cloud-worker claim. The live demonstration uses two accounts controlled by the same human for technical verification, not an independent user study.

## Editing and QA

All visuals are actual DROP screens. Authenticated interactions were captured as genuine browser screenshots; anonymous homepage and practice clips are normal-speed browser recordings. The edit uses cuts and screen holds, not reconstructed UI or altered state. Waiting is omitted, and the video makes no end-to-end latency claim. Login account-picker pages, private email, credentials, wallet keys and tokens are excluded.

Narration is **neutral synthetic Microsoft Zira Desktop**, not a recording or clone of the developer's voice. The narration distinguishes game verification from confirmed payment and labels practice as unpaid. Testnet tokens have no financial value. No real coffee redemption, outgoing transfer, refund or independent external audit is claimed.

FFprobe confirmed both streams and the duration; the complete exports decoded without error. Sampled chapter frames were inspected for legibility, privacy, claims and unobscured payment states. Audio decoded successfully, had nonempty narration and no clipping (final peak −2.4 dB). These are signal checks; an independent human listening review is not claimed. Caption timing is approximate.

## Final narration and edit timing

### 0:00 — Small games. Shared rewards.

DROP turns a community reward into a short game and a payment people can inspect. This is the live product on Monad Testnet. The test tokens shown here have no financial value.

### 0:12 — Fix the promise

The creator chooses the game, reward amount, number of recipients, and deadlines before sharing. This campaign uses three questions, with zero point one test U S D C for each of the first fifty qualifying accounts. Its total reward budget is five test U S D C.

### 0:32 — Fund before sharing

The creator approves the token allowance, then deposits the reward budget into the Monad escrow. The dashboard records the funding transaction before opening the event. The public page shows the published rules, remaining rewards, and payment details. Members enter from one shared link.

### 0:52 — Sign in. Play. Verify.

Here, Google sign in creates an embedded wallet for the participant. No separate wallet installation is needed. The participant answers the three questions and submits them. The server checks the attempt against the campaign rules. Passing reserves a reward; it is not yet a confirmed payment.

### 1:12 — A confirmed receipt

The reward moves through delivery to Paid. Now My rewards shows the received amount and the actual wallet balance. Expanding the receipt reveals the public transaction. This payment was checked on Monad Testnet, including the escrow event, recipient, and token amount. These cuts show observed states, not a settlement speed benchmark.

### 1:36 — One reward per account and wallet

A repeat attempt from this account is blocked. The campaign permits only one reward per account and wallet.

### 1:45 — See what was delivered

The operator dashboard keeps the fixed budget and delivery records together. Reserved awards and confirmed payouts have separate counts, so a pending job is not reported as a successful payment. The same award identity is retained when the processor retries a delivery.

### 2:02 — Another way to play

DROP also offers a catch game: catch the moving coffee three times within eighteen seconds. This clip is the clearly labelled practice mode. It lets people try the interaction without signing in or creating a reward record.

### 2:17 — Playful participation. Verifiable rewards.

A small game for members. A fixed reward promise for creators. An inspectable receipt on Monad. The judge guide links the live product and supporting evidence. DROP is a working testnet prototype built by solo developer Gyu-min Kim.

## Reproduction

The sanitized edit manifest is [video-demo-final.json](../scripts/video-demo-final.json). All original screenshots, browser clips, generated audio, evidence gate files, assembly parts and exports remain in ignored `.local/`. The repository keeps only scripts, public proof records and documentation. Reproduction requires those original genuine capture inputs; do not recreate a success state or extract a logged-in browser session.

```powershell

powershell -NoProfile -ExecutionPolicy Bypass -File scripts/video-speech.ps1 -ScenarioPath scripts/video-demo-final.json -OutputDirectory .local/video/demo-candidate/audio

node scripts/video-final.mjs --manifest scripts/video-demo-final.json --audio-dir .local/video/demo-candidate/audio --out .local/video/final/DROP-demo.mp4 --max-seconds 180 --verified-evidence .local/video/verified-evidence.json --ffmpeg .local/video-tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe

```

The portable Gyan FFmpeg 9.0.2 essentials build is linked by the [official FFmpeg download page](https://ffmpeg.org/download.html#build-windows). Its downloaded archive matched the published SHA-256 `60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba`. Provenance is in ignored `.local/video-tools/source.json`; no global installation is required. Speech uses the installed Microsoft Zira Desktop voice through Windows System.Speech.

The authorized upload is complete and its title, description and synthetic-narration disclosure were checked. Signed-in playback evidence is saved locally in `.local/qa/youtube-demo-published.jpg`. Verify signed-out playback and record final submission status in [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md). Video upload does not establish an accepted application.
