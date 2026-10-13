# Monad UI and language update

Implementation commits: `427b0fd` and `35ad6d7`. Production target: [DROP](https://drop-omega-five.vercel.app/), existing `teamstartup/drop` project.

## Delivered changes

- Replaced the home page with a Monad purple arcade layout, original official logos, game cards, a character scene and creator entry points.
- Used the user's requested cute Molandak interpretation in the home, practice header and catch-game introduction. It is an AI-reimagined community illustration, not an official original. [Exact sources, prompt, file and hash](MONAD_BRAND_ASSETS.md).
- English is the server and fresh-visitor default. English, Korean, Japanese, simplified Chinese and Spanish are selectable and persisted. Service text, quiz choices, known errors, date formats, 404 and accessibility labels follow the choice; organizer-authored content is preserved.
- The home quiz card opens the quiz directly. Mobile navigation retains Play, For creators and My rewards. Reduced-motion settings disable the floating mascot.
- Unpaid practice, unconfigured authentication and test-token disclosures remain visible. No real account, payout, balance, user research or contest submission is implied by this release.

## Local verification

- Production build and TypeScript passed, including the service-error translations. Final asset/CSS refinements are also compiled by the cloud deployment.
- ESLint passed for the application and changed localization files.
- Final Vitest run: **56 passed, 20 skipped**. These 20 emulator-dependent cases were not rerun for this UI release; earlier emulator evidence remains separately recorded.
- Browser run initially passed 41 cases and exposed seven test setup failures. The two Korean-fixture English cases interacted before the saved Korean language was restored; they now explicitly wait for that state. The fresh-English disclosure assertion needed to allow its decorative checkmark. Image capture needed reduced motion so the floating character could become stable. No functional assertions were removed.
- The eight affected browser profile cases then passed. The six final multilingual-width/image cases passed after the English heading adjustment, and both asset cases passed again after the cute character replacement.
- Full-page desktop and mobile screenshots were visually inspected. At 360px and 390px, all five languages fit home and quiz; existing coverage also checks 768px and 1440px layouts. Keyboard, touch, real 18-second expiry, retry and absence of practice payout writes were exercised.

## Release boundaries

The Vercel public web release does not configure Privy, cloud application IAM, a public Monad escrow or a durable payout worker. The GitHub push authorization issue also remains separate. Competition requirements and the remaining evidence gaps are recorded in [the Korean review](COMPETITION_REVIEW.ko.md). The hackathon application was not edited, uploaded or submitted.

## Public deployment verification

- Official Vercel CLI 63.1.2 exited 0. Deployment `dpl_82EWRBJkEaBE6RsWcWFYnVPYcRsS` is **READY**, production, with [deployment record](https://vercel.com/teamstartup/drop/82EWRBJkEaBE6RsWcWFYnVPYcRsS) and [public alias](https://drop-omega-five.vercel.app/). Uploaded the normal file list (1.7 MB of changes); cloud build downloaded 145 files. No archive upload or plan change.
- Cloud frozen installation, Next.js build (35.1s compilation), TypeScript (26.3s) and all 11 static-page builds passed. Deployed source is `35ad6d7`.
- Full hosted browser suite: **48 passed, 6 intentionally skipped, exit 0, 1.1 minutes**. The skips are device-specific keyboard/touch cases and duplicate viewport checks; they are not failures. No configured-login or live-payout success is claimed.
- Hosted `molandak-cute.png` returned HTTP 200 and its SHA-256 exactly matched the committed asset: `0816b2d0b9ba20ab88c989552e966c4c5725e3cc8c386ba202462cd8706e73c8`.
- The user's open public-site tab was refreshed and the new English home, five-language selector and cute mascot were visually confirmed. Hosted screenshots are retained locally in `.local/qa/monad-hero-desktop.png`, `monad-hero-mobile.png`, `monad-desktop.png` and `monad-mobile.png`.
