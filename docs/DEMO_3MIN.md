# DROP technical demo — maximum 3 minutes

**2026-10-14 status: storyboard and reusable recording tools; final payout footage and uploaded video are not established.** Record the real deployed product after the gates below pass. Current unpaid practice is not an actual conditional-settlement demo.

The ≤3-minute limit, YouTube/Loom/Vimeo hosts and working-product requirement are independently confirmed on the authenticated official [Consumer Products & Payments page](https://hackathon.monad.xyz/tracks/consumer-payments). A code/slides-only demonstration does not qualify. The deadline is 2026-10-14 12:59 GMT+9 / Asia/Seoul. The user has now authorized video upload and final application submission, superseding the earlier hold. Account actions and submission are handled by the main task; authorization does not establish completion. See [OFFICIAL_SOURCES.md](OFFICIAL_SOURCES.md).

The user confirmed: **DROP is built by solo developer Gyu-min Kim.** **SLIME CEO! is only the YouTube upload channel name**, not the developer or team name. The supplied X profile is [AlphaGgang](https://x.com/AlphaGgang). Prior employment, relevant biography and traction remain unprovided. The latest public [DROP](https://drop-omega-five.vercel.app/) offers the Monad arcade design, cute community Molandak reinterpretation, two actual unpaid practice games and five languages with English default; its hosted UI suite passed 48 checks with six intentional profile skips. Root is now configuring real authentication, keyless Firestore access and authorized public Testnet funding. Confirm their final results before recording a successful integrated flow.

## Before recording

- Record commit, public app URL, mode, chain ID, escrow address, official token address, and verified deposit/payout/reclaim transaction receipts in DEPLOYMENT.md.
- Use a new recipient account with no prior Monad wallet. Configure real Telegram OAuth or email OTP, embedded wallet creation, and allowed origins/redirects. Hide inbox details and credentials.
- Provide limited, sufficient authorized testnet USDC/MON budget for both games and retries. Testnet labels remain visible. Never show testnet USDC as dollars paid in real life.
- Prepare a real, separately expired campaign for reclaim; do not alter time on a normal funded campaign to imitate expiry.
- For an optional outgoing-transfer shot, prepare a permitted same-network test recipient and obtain user approval. Show the actual fee mode: a sponsorship request is not proof of zero cost. If native fees apply, disclose test MON paid from the wallet; claim an empty-MON transfer only after it actually succeeds.
- Prepare a demo coupon with unmistakable “test coupon — cannot redeem” copy unless authorized real stock exists. Do not expose real coupon contents in a public video.
- Confirm the Vercel app and a durable payout/retry/reconciliation processor are actually running; auth works from a clean session and receipts survive re-login. Firestore database/rules/indexes alone do not establish application IAM or processor execution. Functions cannot deploy on Spark without a separately approved Blaze upgrade. Its source/build and local tests are not a cloud processor; no billing upgrade is established in this document.
- Rehearse an interrupted worker or duplicate trigger safely: the persisted lease and fixed award identity must recover without a second payout. A request finishing on Vercel must not abandon the Firestore outbox job.

If a gate is missing, the corresponding shot is **not ready**. Fix/configure it; do not replace it with a simulated success.

Earlier engineering evidence includes 42 escrow unit/fuzz tests + two invariant properties, 61 server tests, clean install/lint/typecheck/builds and two actual local Anvil/Firestore/worker settlement cases. The latest hosted UI release passed 48 checks with six profile skips. The local chain tests use chain31337, a mock token and fixture identities; local time advancement for refund is a test, never a public-demo shortcut. None replaces a shot requiring hosted login or public Monad funding, receipt, transfer and genuine expired reclaim. Recheck [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md) for newly verified public integration before final narration.

## Shot list and English narration

| Time | Actual product shot | Narration / point to demonstrate |
| --- | --- | --- |
| 0:00–0:20 | Mobile `/d/[slug]` showing organizer, reward, fixed rule, quantity, end/claim times, testnet label, funded status | “DROP turns a community reward into a short game and a funded payout. This event pays the first verified accounts that finish the game. The amount, limit, and deadline are fixed before it opens. This demonstration uses Monad Testnet; these tokens have no financial value.” |
| 0:20–1:00 | One authentication, catch game, server result, live queued/submitted/confirmed progression, recipient receipt | “I join with Telegram or email. I do not install a wallet or buy gas. Catching the third target starts verification; it does not mean payment is complete. The server reserves an award, the relayer submits it, and the escrow pays this recipient. Now the receipt is confirmed.” |
| 1:00–1:30 | `/me/rewards`, actual balance, short re-login proof if time permits, confirmed user-approved outgoing USDC transaction | “The reward stays in my account. I can see its details and choose to send it on the same network. I check the address, amount, and cost before approving. Receiving a reward and sending it are separate actions.” |
| 1:30–1:55 | Real quiz questions and server result; authenticated coupon detail with visible demo warning | “The same award engine also serves a three-question quiz. Answers are checked on the server. This coupon is a non-redeemable test coupon. Real coffee delivery requires authorized operator stock; automatic supplier issuance is future work.” |
| 1:55–2:25 | `/dashboard/[id]`: actual funding/deposit detail, Firestore-persisted allocated slots, confirmed/failed jobs, verified processor recovery/reconciliation and remaining budget | “The operator funds the campaign before sharing. This view distinguishes reserved rewards from confirmed payouts and shows failures to recover. Rules cannot be silently changed after publication. Retry jobs keep the same award identity.” |
| 2:25–2:50 | Actual duplicate-rejection response **or** actual reclaim receipt for separately expired campaign | “An account and recipient wallet cannot receive twice in one campaign. Unclaimed budget can return to the original operator only after the claim deadline. The contract enforces these limits; the server still decides valid game results.” |
| 2:50–3:00 | Product screen, `/judges` link, plain limitation footnote | “Playful rewards, real payout controls. Try both games and inspect the evidence from the judge guide. Our server verification is not proof of a unique human, and this contract has not received an external audit.” |

The narration is a draft. Replace claims only with demonstrated current behavior. Aim for 2:40–2:55; measured duration must stay within 3:00. The core sign-in/game/actual-payout sequence has priority over optional coupon, outgoing transfer and refund scenes. Omit an optional claim if its shot is not verified. Show the actual product throughout; slides, source code and architecture explanations cannot replace the core flow.

## Recording and publishing checks

Use real normal-speed interaction for the core flow. Cuts to remove idle waiting are acceptable only when marked so they do not imply a measured end-to-end latency. Keep network and mode labels legible at mobile resolution. Blur email addresses, private identifiers, test credentials, account tokens, private keys, and real coupon secrets. Onchain recipient addresses and hashes are public but should not disclose unrelated accounts.

Record actual duration from the exported file, file metadata, host availability, unauthenticated video playback, and link accessibility. Save the final URL in SUBMISSION_CHECKLIST.md. A prepared script, local video file, and successfully uploaded accessible video are three different completion states.

| Artifact | Current evidence |
| --- | --- |
| Final video file | None supplied |
| Measured duration ≤ 3:00 | Not measured |
| YouTube/Loom/Vimeo URL | None supplied |
| Unauthenticated playback | Not verified |

## Reusable local video tools

[Playwright video recording](https://playwright.dev/docs/videos) saves the recording when the page/context closes. `scripts/video-capture.mjs` records actual DROP pages with fixed viewport/video size, normal-time keyboard interactions, no API mocks and no patched clock. Files, narration and optional authorized storage-state files stay in ignored `.local/`. Keep inboxes, OTPs, tokens, private keys and credential-bearing screens out of raw footage; this recorder does not automatically redact them or automate external OAuth/account pages.

Installed Playwright FFmpeg 1013 is a VP9/PNG-only build and cannot mix narration. Audio, subtitles and MP4 use a portable **Gyan FFmpeg 9.0.2 essentials build**, a Windows distributor linked by [the official FFmpeg download page](https://ffmpeg.org/download.html#build-windows). The pinned [archive](https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-9.0.2-essentials_build.zip) matches its [published SHA-256](https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-9.0.2-essentials_build.zip.sha256): `60f467265b1e312373dbcd92200c2618a74850f98d3d078e94296bb3fa2047ba`. Provenance is `.local/video-tools/source.json`; nothing is installed globally.

Windows **Microsoft Zira Desktop** can produce neutral English WAV narration with [Microsoft's SpeechSynthesizer](https://learn.microsoft.com/en-us/dotnet/api/system.speech.synthesis.speechsynthesizer.setoutputtowavefile?view=netframework-4.8.1). It is a synthetic narrator, not the developer's voice or a voice clone. Review DROP, Monad, USDC and Gyu-min Kim pronunciation.

The supplied scene is explicitly a rehearsal of unpaid public practice. The completed tool rehearsal used the previous published home and produced a 58.56-second H.264/AAC MP4; it is neither final payout footage nor an uploaded video. The scene's headline assertions now follow the new quiet home.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/video-speech.ps1 -ScenarioPath scripts/video-rehearsal.json -OutputDirectory .local/video/rehearsal-voice
node scripts/video-capture.mjs --scenario scripts/video-rehearsal.json --url https://drop-omega-five.vercel.app --audio-dir .local/video/rehearsal-voice --out .local/video/rehearsal
node scripts/video-assemble.mjs --manifest .local/video/rehearsal/capture.json --audio-dir .local/video/rehearsal-voice --out .local/video/rehearsal.mp4 --max-seconds 180 --allow-rehearsal --ffmpeg .local/video-tools/ffmpeg-9.0.2-essentials_build/bin/ffmpeg.exe
```

For a final demo, prepare an ignored scenario using real funded event paths and current selectors, set `kind` to `verified-demo`, and supply `--verified-evidence .local/video/verified-evidence.json`. Reviewed evidence must identify hosted authentication, Firestore app access, public Monad funding/payout, durable processing, chain 10143 and the payout transaction. This metadata gate is not a chain audit; actual RPC receipt checks remain necessary. Do not extract the user's logged-in browser storage, tokens or private authentication. The main task will capture the genuinely authenticated UI and confirmed receipt through its authorized browser; local assembly may combine those supplied artifacts with actual anonymous product footage. `--storage-state` is restricted to a separately authorized disposable test fixture, never an extracted user session; `--allow-product-actions` is required outside practice.

`scripts/video-assemble.mjs` normalizes clips to 1920×1080, adds neutral narration and approximate English captions without changing playback speed, checks measured duration and actual audio/video streams with FFprobe, and decodes the export for corruption. Review pixels, captions, pronunciation, privacy and all claims before upload. Holding a genuine screen for narration does not prove faster settlement. Local rehearsal, final edited file, published video and submitted application remain distinct completion states.
