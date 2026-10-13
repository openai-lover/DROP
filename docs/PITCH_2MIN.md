# DROP founder pitch — uploaded and playback checked

**2026-10-14: uploaded to YouTube as Unlisted; playback confirmed in the signed-in account.** [Watch the pitch](https://youtu.be/AlWM6csYk5w). The player showed 0:19 / 1:47. Signed-out playback remains unverified. The measured local file is **107.94 seconds (1:47)**, within the 2-minute limit. The [official track](https://hackathon.monad.xyz/tracks/consumer-payments) requires a working product demo and a separate pitch.

DROP is built by **solo developer Gyu-min Kim**. **SLIME CEO!** is only the authorized YouTube upload channel, not the developer or team name. The supplied X profile is [AlphaGgang](https://x.com/AlphaGgang).

## Delivered local files

| Item | Local artifact / result |
| --- | --- |
| Final video | `.local/video/final/DROP-pitch.mp4` — ignored local media |
| Measured duration | 107.94 seconds; limit 120 seconds |
| Video / audio | 1920 × 1080, 30 fps, H.264 / AAC, 48 kHz |
| English captions | Burned in a separate 180-pixel bottom band; companion `DROP-pitch.srt` |
| Evidence and hashes | `.local/video/final/DROP-pitch.mp4.json` |
| Upload title / description | `.local/video/upload-metadata.json` |
| YouTube URL | [Unlisted pitch](https://youtu.be/AlWM6csYk5w); signed-in playback confirmed; signed-out playback pending |

## What the video establishes

The pitch leads with community giveaways and the operator problem, demonstrates a fixed budget and confirmed payment in the actual product, explains the Monad settlement role and embedded-wallet experience, and ends with a concrete future pilot. Five observed participants, ten operator interviews, and five pilot creators × twenty participants are **future targets**, not existing traction, completed studies or partnerships. An operator fee is a business-model hypothesis.

Actual production Google/Privy login, embedded wallets, Firestore access, funding and request-assisted payout were observed. [independent public payout proof](../contracts/deployment/live-participant-payment.public.json) verifies the canonical finalized receipt, signer signature, exact escrow and token transfer events, and recipient balance changing from 0 to 0.1 test USDC. The recipient retained 0 test MON; the relayer paid the receiving gas. This does not imply creator funding or outgoing transfers are sponsored.

- Funding: [5 test USDC transaction](https://testnet.monadvision.com/tx/0x4f10e52e5a77c8c24c42dc605e6e3413010fb2ae9dd1b13657eb897f30576637).
- Reward: [0.1 test USDC transaction](https://testnet.monadvision.com/tx/0x9cbb35fcc0ba09119e87452ff5f2d6d534d4a1ae55682ce0c080260f98c5678c).
- Funding and rule checks: [public campaign evidence](../contracts/deployment/live-campaign-funding.public.json).

Processing uses a persistent Firestore outbox and bounded request-assisted recovery. The final-export evidence gate is named `hostedRequestRecovery`, not an always-on cloud-worker claim. The live demonstration uses two accounts controlled by the same human for technical verification, not an independent user study.

## Editing and QA

All visuals are actual DROP screens. Authenticated interactions were captured as genuine browser screenshots; anonymous homepage and practice clips are normal-speed browser recordings. The edit uses cuts and screen holds, not reconstructed UI or altered state. Waiting is omitted, and the video makes no end-to-end latency claim. Login account-picker pages, private email, credentials, wallet keys and tokens are excluded.

Narration is **neutral synthetic Microsoft Zira Desktop**, not a recording or clone of the developer's voice. The first-person creator pitch is read by that synthetic narrator; the upload description explicitly discloses this. Testnet tokens have no financial value. No real coffee redemption, outgoing transfer, refund or independent external audit is claimed.

FFprobe confirmed both streams and the duration; the complete exports decoded without error. Sampled chapter frames were inspected for legibility, privacy, claims and unobscured payment states. Audio decoded successfully, had nonempty narration and no clipping (final peak −2.7 dB). These are signal checks; an independent human listening review is not claimed. Caption timing is approximate.

## Final narration and edit timing

### 0:00 — Make a community reward playable

Giveaways attract a crowd. DROP turns the reward into something they can play. I'm Gyu-min Kim, the solo creator of DROP. I'm building for Telegram KOLs and community operators running an AMA, a launch, or a thank you event.

### 0:16 — Keep every promised reward accountable

A reward announcement is easy to share. Completing it means checking who qualified, collecting delivery details, and resolving missing payments. Our customer hypothesis is that operators need one flow that keeps the excitement and makes each promised reward accountable.

### 0:34 — One link. A game. A confirmed payment.

The operator fixes a budget, reward limit, and deadline, then shares one link. Members sign in and play a catch game or three question quiz. Valid play reserves a reward. Paid appears after the payment is confirmed. The server checks participation; a funded Monad escrow enforces payout limits. Monad is our settlement layer for many small rewards, with individually inspectable payments. An embedded wallet keeps the ordinary signup flow. This demonstration uses testnet tokens with no financial value.

### 1:10 — The next pilot

We're at the working testnet prototype stage. Our next pilot observes five people without Monad wallets and interviews ten community operators. We will track unaided completion, confirmed receipt, failures, and whether an operator runs a second event.

### 1:27 — A path to the first hundred participants

Our first hundred participant goal is five pilot creators inviting twenty people each. We will test an operator fee separately from the reward budget. The next step is to turn a verified prototype into repeatable community events. DROP: playable participation, verifiable rewards.

## Reproduction

The sanitized edit manifest is [video-pitch-final.json](../scripts/video-pitch-final.json). All original screenshots, browser clips, generated audio, evidence gate files, assembly parts and exports remain in ignored `.local/`. The repository keeps only scripts, public proof records and documentation. Reproduction requires those original genuine capture inputs; do not recreate a success state or extract a logged-in browser session.

```powershell

powershell -NoProfile -ExecutionPolicy Bypass -File scripts/video-speech.ps1 -ScenarioPath scripts/video-pitch-final.json -OutputDirectory .local/video/pitch-final/audio

node scripts/video-final.mjs --manifest scripts/video-pitch-final.json --audio-dir .local/video/pitch-final/audio --out .local/video/final/DROP-pitch.mp4 --max-seconds 120 --verified-evidence .local/video/verified-evidence.json --ffmpeg .local/video-tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe

```

The portable Gyan FFmpeg 9.0.2 essentials build is linked by the [official FFmpeg download page](https://ffmpeg.org/download.html#build-windows). Its downloaded archive matched the published SHA-256 `60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba`. Provenance is in ignored `.local/video-tools/source.json`; no global installation is required. Speech uses the installed Microsoft Zira Desktop voice through Windows System.Speech.

The authorized upload is complete and its title, description, synthetic-narration disclosure and signed-in playback were checked. The actual player showed 0:19 / 1:47 in ignored `.local/qa/youtube-pitch-published.jpg`. Signed-out access remains unverified. Record any later access check in [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md). Video upload does not establish an accepted application.
