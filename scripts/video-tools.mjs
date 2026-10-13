import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile, stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from '@playwright/test';

export const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function localOutput(value) {
  const target = resolve(repository, value);
  const root = join(repository, '.local');
  if (target !== root && !target.startsWith(root + '/')) {
    // Windows paths use backslashes; compare again with the platform separator.
    if (!target.startsWith(root + '\\')) throw new Error('Video outputs must stay inside ignored .local/.');
  }
  return target;
}
export function argumentsFor(argv = process.argv.slice(2)) {
  const result = {};
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    result[key.slice(2)] = argv[index + 1]?.startsWith('--') || !argv[index + 1] ? true : argv[++index];
  }
  return result;
}
export async function jsonFile(path) { return JSON.parse((await readFile(resolve(repository, path), 'utf8')).replace(/^\uFEFF/, '')); }
export async function fileEvidence(path) {
  const data = await readFile(path);
  return {bytes: (await stat(path)).size, sha256: createHash('sha256').update(data).digest('hex')};
}
export async function run(executable, args, {allowFailure = false} = {}) {
  return await new Promise((accept, reject) => {
    const child = spawn(executable, args, {windowsHide: true, shell: false});
    let stdout = '', stderr = '';
    child.stdout.on('data', data => {stdout += data;});
    child.stderr.on('data', data => {stderr += data;});
    child.once('error', reject);
    child.once('exit', code => {
      if (code === 0 || allowFailure) accept({code, stdout, stderr});
      else reject(new Error(`${executable} exited ${code}: ${stderr.slice(-4000)}`));
    });
  });
}
export function playwrightFfmpeg() {
  const require = createRequire(import.meta.url);
  const testRequire = createRequire(require.resolve('@playwright/test'));
  const core = dirname(testRequire.resolve('playwright-core'));
  const browsers = testRequire(join(core, 'browsers.json'));
  const revision = browsers.browsers.find(browser => browser.name === 'ffmpeg').revision;
  const browserPath = chromium.executablePath();
  // Installed Chromium currently lives <cache>/chromium-<revision>/<platform>/<binary>.
  const cache = resolve(browserPath, '../../..');
  const filename = process.platform === 'win32' ? 'ffmpeg-win64.exe' : process.platform === 'darwin' ? 'ffmpeg-mac' : 'ffmpeg-linux';
  const path = join(cache, `ffmpeg-${revision}`, filename);
  if (!existsSync(path)) throw new Error('Installed Playwright FFmpeg was not found. Check the existing browser runtime; this script never downloads tools.');
  return path;
}
export async function fullFfmpeg(value) {
  const executable = value || process.env.DROP_VIDEO_FFMPEG;
  if (!executable || !existsSync(executable)) throw new Error('Set --ffmpeg or DROP_VIDEO_FFMPEG to a verified full FFmpeg executable. The Playwright build cannot mux narration.');
  const encoders = await run(executable, ['-hide_banner', '-encoders']);
  const filters = await run(executable, ['-hide_banner', '-filters']);
  if (!/\blibx264\b/.test(encoders.stdout) || !/\baac\b/.test(encoders.stdout) || !/\bsubtitles\b/.test(filters.stdout)) {
    throw new Error('Full FFmpeg needs libx264, AAC and the subtitles filter. No package is installed automatically.');
  }
  return executable;
}
export async function probeMedia(ffmpeg, path) {
  const sibling = join(dirname(ffmpeg), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
  if (!existsSync(sibling)) throw new Error('The verified full FFmpeg bundle must also contain ffprobe for measured duration and stream checks.');
  const result = await run(sibling, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path]);
  return JSON.parse(result.stdout);
}
export async function waveDuration(path) {
  const data = await readFile(path);
  if (data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Expected a PCM WAV file.');
  let offset = 12, bytesPerSecond = 0, audioBytes = 0;
  while (offset + 8 <= data.length) {
    const size = data.readUInt32LE(offset + 4), kind = data.toString('ascii', offset, offset + 4);
    if (kind === 'fmt ' && size >= 16) bytesPerSecond = data.readUInt32LE(offset + 16);
    if (kind === 'data') audioBytes += Math.min(size, data.length - offset - 8);
    offset += 8 + size + (size % 2);
  }
  if (!bytesPerSecond || !audioBytes) throw new Error('WAV duration could not be read.');
  return audioBytes / bytesPerSecond;
}
