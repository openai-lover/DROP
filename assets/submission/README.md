# DROP temporary submission graphics

These are **original temporary branding assets**, prepared for the hackathon's raster-logo requirement. They are not an approved final brand or a third-party brand kit.

| File | Intended use |
| --- | --- |
| `drop-wordmark.png` | 1200 × 600 horizontal DROP wordmark |
| `drop-square.png` | 1024 × 1024 square monogram with a small full wordmark |
| Matching `.svg` files | Editable vector sources |
| `manifest.json` | Actual decoded format, dimensions, bytes and SHA-256 evidence |

The palette matches the current application: ink `#20231e`, coral `#f6503d`, paper `#faf9f5`. The letter outlines are directly coded geometric paths created with Codex assistance; no external font, downloaded artwork or existing bitmap was used. Sharp renders the SVG sources to PNG. The PNGs are the permitted submission artifacts; SVG is retained as editable source.

**License status:** no asset-specific public license has been assigned (`NOASSERTION`). This task does not grant a new license on behalf of the owner. There are no third-party font/artwork dependencies in these files. Final branding and publication/license choices remain with the project owner.

Regenerate from the repository root:

```text
node scripts/render-wordmark.mjs
```

The authenticated portal's upload guidance is stricter than the public track description: PNG/JPG/WEBP, maximum 2 MB, at least 500 px and no larger than 2000 × 2000 px. The renderer checks both dimensions against 500–2000 px and uses a conservative decimal 2,000,000-byte maximum, then writes actual hashes and sizes to the manifest. The public track's 3 MB limit is also satisfied. Visual pixel inspection is recorded separately in `docs/SUBMISSION_CHECKLIST.md`; a successfully generated file alone does not establish that inspection. Nothing has been uploaded or submitted.
