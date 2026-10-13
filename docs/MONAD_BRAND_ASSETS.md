# Monad brand assets

Retrieved and checked on **2026-10-13**. The **15 official logo, avatar and token files** listed below are unchanged originals from Monad's own brand downloads. No transformation was applied to those official files. The additional `molandak-cute.png` is an **AI-reimagined community character**, documented separately below; it is not an official original or a pixel-identical extraction.

## Official source chain

The [Monad homepage](https://monad.xyz/) links to the [official Brand & Media Kit](https://monad.xyz/brand-and-media-kit). That page describes its assets as official, links to the [Figma community kit](https://www.figma.com/community/file/1569575393267749711), and provides SVG/PNG downloads plus the [full original ZIP](https://monad.xyz/brand-page-assets/Monad%20Brand%20and%20Media%20Kit.zip).

The exact download paths were read from the official page's download-button code. Direct assets use `https://monad.xyz/brand-page-assets/<filename>`. Additional variants were extracted byte-for-byte from that same official ZIP. The ZIP contains logos, avatar/token assets and **Monad Brand Guidelines - Public.pdf**, version **v.02.01**; it contains no separately named Molandak, Moyaki or Chog asset.

The ZIP and PDF are retained only as ignored research references under `.local/monad-brand-kit-reference/`, rather than adding a 51 MB guideline PDF to the public site.

| Reference | Bytes | SHA-256 |
|---|---:|---|
| Official ZIP | 29,679,666 | `8ee806bce77cc62411df855c6be9ab26fd9ccc4538307c3d040bc7389c15cf5b` |
| Original guideline PDF | 51,611,258 | `a71195f7a266876bb2a9ca43c104d38bf27777062daf21a8eacb90b1bc7fb2d9` |

## Ready-to-use official files

Use `/brand/monad/Full.svg` for the approved purple logomark and black wordmark on a light surface. Use the supplied white/inverted variant on a dark surface. Do not recolor an existing SVG with a CSS filter.

| File in `public/brand/monad/` | Original source | Bytes | SHA-256 |
|---|---|---:|---|
| `Full.svg` | Direct `/brand-page-assets/Full.svg` | 2,660 | `181924bc7fde1efd862058d31c9915f040f314561128c0169642b5e1d3d932c2` |
| `Full.png` | Direct `/brand-page-assets/Full.png` | 12,614 | `2e9853811c9a7c92ea86acc73d12c6f5f741602f0ab7c60be304f1f1b031e4ec` |
| `Full-Black.svg` | ZIP `Logos/Full Logo/Full Logo Black.svg` | 2,656 | `b156cef4b274e80581cedb8302e0eca3ad67e23e4d0de5f181359232c1387b88` |
| `Full-White.svg` | ZIP `Logos/Full Logo/Full Logo White.svg` | 2,660 | `41febbd1b147a56fccf7ac89ed482be8222651d903c94dd398cc6de5e094ac6b` |
| `Full-Inverted.svg` | ZIP `Logos/Full Logo/Full Logo Inverted.svg` | 2,662 | `0694c1d6f4af7d1a526aed80c22504e5d51d72fa043c07e0a2872e5961fcf80c` |
| `Logomark.svg` | Direct `/brand-page-assets/Logomark.svg` | 502 | `32ab1d3ce7ce18e9c7531490c0bfe780d6f679702e88da0204df004ca83b34b9` |
| `Logomark.png` | Direct `/brand-page-assets/Logomark.png` | 7,992 | `d43a7e7260dc52ca54ee349508bf0b2d3fd40475a16fe6330d5342708d894acc` |
| `Wordmark.svg` | Direct `/brand-page-assets/Wordmark.svg` | 2,307 | `c078614a10ac1d567da6cc606ee03f0a3046efc1e82a3438971c5b7fe9779d62` |
| `Wordmark.png` | Direct `/brand-page-assets/Wordmark.png` | 12,861 | `3025cdd6c77e1ea09caf301484da8738a251200e32207809c02bed0381e12f47` |
| `Wordmark-Black.svg` | ZIP `Logos/Wordmark/Wordmark Black.svg` | 2,307 | `c078614a10ac1d567da6cc606ee03f0a3046efc1e82a3438971c5b7fe9779d62` |
| `Wordmark-White.svg` | ZIP `Logos/Wordmark/Wordmark White.svg` | 2,306 | `6b522916518b4c197c2328969bb1dce09318beb8d08320d901886515f345254f` |
| `Avatar480x480.svg` | Direct `/brand-page-assets/Avatar480x480.svg` | 540 | `83c790f985c54c7a975651b2fa7543fd42814f48349c828c8e2f03c33a5ec16c` |
| `Avatar1000x1000.png` | Direct `/brand-page-assets/Avatar1000x1000.png` | 17,802 | `d3ab87d1a0ec63d317b3450cde226d9912f20be63d258713ac829c623eb7db77` |
| `Token.svg` | Direct `/brand-page-assets/Token.svg` | 1,530 | `5ad0b4aa249fa5c3034dd4656195db01c9f0a95320f4aace24309a705d96ea28` |
| `Token1000x1000.png` | Direct `/brand-page-assets/Token1000x1000.png` | 106,457 | `70cbbc2b3378383d63e041efc819f0f7a53077389f1ba1a3c4785d1801eeca0e` |

PNG decoding was checked with Sharp. `Full.png` (845x160), `Logomark.png` (363x368), `Wordmark.png` (970x202), and `Token1000x1000.png` (1000x1000) contain actually transparent pixels. `Avatar1000x1000.png` is **fully opaque**, despite having an alpha channel.

## Visual rules and usage status

The official guideline PDF's pages 5 and 7 were extracted, rendered and visually inspected. Keep clear space equal to the full height/width of one logomark. Preserve approved forms: do not stretch, skew, rotate, distort, change colors, reduce opacity, separate logo elements, outline them, or apply text/image effects or filters.

The [official brand page](https://monad.xyz/brand-and-media-kit) provides these identity resources for use. It does not state a broad Creative Commons or open-source license. [Monad's current Terms](https://monad.xyz/terms-of-service) retain ownership of its identity and restrict general content reuse. This record confirms source and supplied visual rules; it does **not** assert unlimited commercial rights or Monad endorsement. Keep Monad identity separate from DROP's own product name and do not describe DROP as an official Monad product or partner without an actual basis.

No font binaries were downloaded. The kit names Britti Sans for headlines, Inter for body text and Roboto Mono for labels; that naming alone does not establish a license to redistribute a font.

## Official colors

Source: the [brand page's color section](https://monad.xyz/brand-and-media-kit).

| Role | Hex |
|---|---|
| Monad Purple | `#6E54FF` |
| Mist / light purple | `#DDD7FE` |
| Ink | `#0E091C` |
| Black / White | `#000000` / `#FFFFFF` |
| Secondary | `#85E6FF`, `#B9E3F9`, `#FF8EE4`, `#FFAE45` |

## Character search result

**No original transparent Molandak PNG was verified in the source search.** `public/brand/monad/molandak-cute.png` is now supplied as a cute reimagining of the community character, described in the next section. Checked the official brand page/ZIP, current Monad homepage, Monad Foundation, current consumer app and its asset bundles, the official 2048 game, and selected verified `monad-developers` public repositories. `testnet.monad.xyz` now redirects to the developer hub. None provided a separately named Molandak, Moyaki or Chog download.

The user authorized acquiring a community character image with honest attribution. A bounded follow-up checked the [FrenchNads resource page](https://frenchnads.wixsite.com/frenchnads) and its exact linked assets:

- [Skilly's supplemental Monad Media Kit](https://skilly.notion.site/Monad-Media-Kit-0554df533a10449d8dbbf960fd0c52a7) returned **404**.
- [The old Monad meme generator](https://monadmemegenerator.com/) redirected to a parked `ww25.monadmemegenerator.com` domain.
- [Moyaki community character page](https://www.moyakimonad.com/) serves [cast-molandak.png](https://www.moyakimonad.com/assets/cast-molandak.png), a **435×270 PNG without an alpha channel**, with a visible white rectangular background. The page attributes Molandak to Bill Monday. This is a community token site, not an official Monad download. The original file was downloaded unchanged to an ignored research directory and visually inspected; no cutout or background removal was performed.
- That community page links to [ChicoArroz's Monanimals article](https://chicoarroz.com/monanimals-monad), which serves [Molandak.png](https://chicoarroz.com/wp-content/uploads/2025/06/Molandak.png). It is a **499×541 opaque PNG of a Discord post**, rather than the standalone character artwork. It was also downloaded unchanged and inspected.
- [Meme Depot's Monad archive](https://memedepot.com/d/monad) was inspected, but no original transparent Molandak PNG was established in the retrieved page.

| Research candidate (not published) | Bytes | SHA-256 |
|---|---:|---|
| Moyaki community `cast-molandak.png` | 42,825 | `b7cd64242c1ef8dc01459594dc32db155258bd6ad4a5e0772f303381faebb783` |
| ChicoArroz `Molandak.png` | 68,056 | `209737c53b0d9655157e29124b2383bcb41ae04cb770b6457a5f8f53b03fdc51` |

Neither source candidate was published directly because of its unsuitable image content/transparency. No explicit community image license was found on the retrieved pages. The user expressly requested using the Monad character; a community adaptation was prepared with honest provenance rather than treating the absence of an explicit license as an automatic approval requirement. Community art and AI-adapted illustrations must not be described as official Monad assets or endorsement.

## Cute Molandak community reimagining

Ready-to-use file: `/brand/monad/molandak-cute.png`.

Source artwork: [Moyaki community `cast-molandak.png`](https://www.moyakimonad.com/assets/cast-molandak.png), linked and named Molandak on the [community character page](https://www.moyakimonad.com/). That page attributes the character to Bill Monday. This attribution comes from the community page; it does not verify authorship or official Monad approval of this particular image.

The user explicitly rejected the sharp, spiky appearance and requested a much cuter character. The built-in image generation tool was used in its **style-transfer** editing mode with the community character as its reference. The current output reimagines Molandak as a soft purple toy illustration with rounded bumps, a smiling duck-like mouth, friendly glossy eyes and rosy cheeks. **It is an intentional visual redesign, not pixel-identical to the source and not merely the original image with an alpha mask.** It is an AI-reimagined community character for DROP, not an official Monad original or approved brand asset. The official logo files were left unchanged.

The output was decoded and visually inspected. It is a **1254×1254 RGBA PNG**, with actual alpha transparency (minimum alpha 0, maximum 255). Of 1,572,516 pixels, **655,306 are fully transparent**, 915,735 have partial alpha and 1,475 are fully opaque. No asset transformation was performed during this provenance check.

| Adapted public asset | Bytes | SHA-256 |
|---|---:|---|
| `public/brand/monad/molandak-cute.png` | 1,356,671 | `0816b2d0b9ba20ab88c989552e966c4c5725e3cc8c386ba202462cd8706e73c8` |

The earlier rough background-extraction adaptation is no longer published. It is archived only under `.local/monad-brand-kit-reference/molandak-first-adaptation.png` as an ignored research reference.

Exact image editing prompt used:

```text
Use case: style-transfer. Asset type: one transparent mascot sticker for a playful Monad community website. The input is a Molandak community character reference. The user finds this spiky version disgusting and explicitly wants a much cuter version. Reimagine the same recognizable purple round Molandak as an irresistibly cute, friendly collectible vinyl toy. Keep its purple round body, small horizontal duck-like mouth, four little feet and sideways three-quarter pose, but remove every sharp spike, busy fur mark, wrinkle, menacing detail and sad Pepe expression. Smooth plump lavender body, just a few soft rounded bumps suggesting the hedgehog silhouette, stubby rounded paws, a small gentle smile, big glossy friendly eyes with soft highlights, rosy tiny cheek accents. A warm adorable happy expression with a slight mischievous Monad community vibe. Polished soft 3D toy illustration, simple broad color shapes, soft lilac and Monad purple accents. Single character only, full body centered, filling most of a square composition with modest even margins. No text, no lettering, no logos, no additional objects, no scenery, no ground plane, no cast ground shadow, no simulated checkerboard. True transparent alpha background. Prioritize cute and comforting over resemblance to the harsh spiky texture of the reference.
```
