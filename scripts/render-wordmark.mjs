import {createHash} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = join(repository, 'assets', 'submission');
const colors = {ink: '#17142b', accent: '#6e54ff', paper: '#fbfaff'};
// Authenticated portal upload is stricter than the public track's 3 MB description.
const maxBytes = 2_000_000;
const minDimension = 500;
const maxDimension = 2000;

// Original geometric outlines. No installed font, downloaded artwork or bitmap is used.
const glyphs = {
  D: 'M0 0H93C159 0 196 39 196 128C196 217 159 256 93 256H0Z M58 58V198H86C120 198 138 176 138 128C138 80 120 58 86 58Z',
  R: 'M226 0H321C384 0 414 31 414 88C414 121 395 146 363 158L430 256H361L299 168H284V256H226Z M284 56V114H316C342 114 356 105 356 86C356 67 342 56 316 56Z',
  O: 'M565 0C633 0 670 54 670 128C670 202 633 256 565 256C497 256 460 202 460 128C460 54 497 0 565 0Z M565 57C535 57 518 82 518 128C518 174 535 199 565 199C595 199 612 174 612 128C612 82 595 57 565 57Z',
  P: 'M710 0H804C867 0 897 45 897 98C897 158 867 182 804 182H768V256H710Z M768 56V127H798C824 127 839 116 839 92C839 68 824 56 798 56Z',
};
const fullMark = Object.values(glyphs).map(d => `<path d="${d}" fill="${colors.ink}" fill-rule="evenodd"/>`).join('\n')
  + `\n<circle cx="943" cy="225" r="31" fill="${colors.accent}"/>`;

function svgDocument({width, height, title, body}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
<title id="title">${title}</title>
<desc id="description">Original DROP branding: geometric dark letters, a Monad-purple period and a soft white background.</desc>
<rect width="${width}" height="${height}" fill="${colors.paper}"/>
${body}
</svg>\n`;
}

const designs = [
  {
    base: 'drop-wordmark', width: 1200, height: 600,
    svg: svgDocument({width: 1200, height: 600, title: 'DROP wordmark', body: `<g transform="translate(113 172)">${fullMark}</g>`}),
  },
  {
    base: 'drop-square', width: 1024, height: 1024,
    svg: svgDocument({width: 1024, height: 1024, title: 'DROP square monogram', body: `<g transform="translate(262 142) scale(2.5)"><path d="${glyphs.D}" fill="${colors.ink}" fill-rule="evenodd"/></g>
<circle cx="802" cy="720" r="62" fill="${colors.accent}"/>
<g transform="translate(356 866) scale(.32)">${fullMark}</g>`}),
  },
];

const sha256 = data => createHash('sha256').update(data).digest('hex');
await mkdir(outputDirectory, {recursive: true});
const assets = [];
for (const design of designs) {
  const vector = Buffer.from(design.svg, 'utf8');
  const png = await sharp(vector).png({compressionLevel: 9, effort: 10}).toBuffer();
  const decoded = await sharp(png).metadata();
  if (decoded.format !== 'png' || decoded.width !== design.width || decoded.height !== design.height
      || decoded.width < minDimension || decoded.height < minDimension
      || decoded.width > maxDimension || decoded.height > maxDimension || png.length > maxBytes) {
    throw new Error(`Submission asset validation failed for ${design.base}.`);
  }
  await writeFile(join(outputDirectory, `${design.base}.svg`), vector);
  await writeFile(join(outputDirectory, `${design.base}.png`), png);
  assets.push({
    filename: `${design.base}.png`, source: `${design.base}.svg`, format: decoded.format,
    width: decoded.width, height: decoded.height, bytes: png.length, sha256: sha256(png),
    sourceSha256: sha256(vector), submissionLimitBytes: maxBytes,
    minimumDimension: minDimension, maximumDimension: maxDimension, withinSubmissionLimit: true,
  });
}
const manifest = {
  status: 'original-project-branding',
  origin: 'Original code-native geometric SVG outlines created for DROP; PNGs rendered with the pinned Sharp package.',
  externalFontsOrArtwork: false,
  assetSpecificLicense: 'NOASSERTION',
  licenseNote: 'No asset-specific public license is assigned by this task. The project owner may choose one. No third-party font or artwork license is required by these source assets.',
  palette: colors,
  renderer: {sharp: sharp.versions.sharp, svg: sharp.versions.rsvg},
  assets,
};
await writeFile(join(outputDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
process.stdout.write(JSON.stringify({outputDirectory, status: manifest.status, assets}, null, 2) + '\n');
