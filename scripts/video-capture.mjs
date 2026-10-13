import {mkdir, rename, writeFile} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {chromium, expect} from '@playwright/test';
import {argumentsFor, fileEvidence, jsonFile, localOutput, repository, waveDuration} from './video-tools.mjs';

const args = argumentsFor();
if (args.help) {
  console.log('node scripts/video-capture.mjs --scenario scripts/video-rehearsal.json --url https://drop-omega-five.vercel.app --out .local/video/rehearsal [--audio-dir .local/video/voice] [--storage-state .local/video/session.json] [--allow-product-actions]');
  process.exit(0);
}
const scenario = await jsonFile(args.scenario || 'scripts/video-rehearsal.json');
const base = new URL(args.url || 'https://drop-omega-five.vercel.app');
if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password) throw new Error('Use a product HTTP(S) URL without credentials.');
if (!['drop-omega-five.vercel.app', 'localhost', '127.0.0.1'].includes(base.hostname)) throw new Error('Recording is limited to the authorized DROP site or its local development server.');
const out = localOutput(args.out || `.local/video/${scenario.id}`);
await mkdir(out, {recursive: true});
const manifestPath = join(out, 'capture.json');
const manifest = {version: 1, scenario: scenario.id, kind: scenario.kind, sourceUrl: base.origin, recordedAt: new Date().toISOString(), status: 'recording', actualProductScreen: true, apiMocking: false, clockManipulation: false, browserAudioRecorded: false, notes: scenario.notes, shots: []};
if (scenario.kind === 'verified-demo') {
  if (!args['verified-evidence']) throw new Error('A final demo requires --verified-evidence pointing to an actual current integration evidence JSON.');
  const evidence = await jsonFile(args['verified-evidence']);
  const required = ['hostedAuthentication', 'firestoreAppAccess', 'publicMonadFunding', 'publicMonadPayout', 'durableProcessor'];
  if (required.some(key => evidence[key] !== true) || evidence.chainId !== 10143 || !/^0x[\da-f]{64}$/i.test(evidence.payoutTx || '')) throw new Error('Final recording gates have not passed. Record rehearsal explicitly instead.');
  manifest.verification = {chainId: evidence.chainId, payoutTx: evidence.payoutTx, reviewedAt: evidence.reviewedAt, evidenceFile: resolve(repository, args['verified-evidence'])};
}
let browser, context;
const locatorFor = (page, target) => {
  if (target.selector) return page.locator(target.selector);
  if (target.role) return page.getByRole(target.role, {name: target.name, exact: target.exact !== false});
  if (target.text) return page.getByText(target.text, {exact: target.exact !== false});
  throw new Error('A capture action needs a selector, role/name or exact text.');
};
const hold = ms => new Promise(accept => setTimeout(accept, ms));
try {
  browser = await chromium.launch({headless: true});
  context = await browser.newContext({viewport: scenario.viewport || {width: 1280, height: 720}, reducedMotion: 'reduce', locale: 'en-US', ...(args['storage-state'] ? {storageState: localOutput(args['storage-state'])} : {}), recordVideo: {dir: out, size: scenario.viewport || {width: 1280, height: 720}}});
  await context.addInitScript(() => {if (!localStorage.getItem('drop-language')) localStorage.setItem('drop-language', 'en');});
  for (const shot of scenario.shots) {
    if (!/^[a-z0-9-]+$/.test(shot.id)) throw new Error('Shot IDs must use lower-case letters, numbers and hyphens.');
    const page = await context.newPage();
    const video = page.video(), started = performance.now();
    const url = new URL(shot.path, base);
    if (url.origin !== base.origin) throw new Error('No external account, OAuth or explorer page is automated by this recorder.');
    await page.goto(url.href, {waitUntil: 'domcontentloaded'});
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.locator('.language-select').selectOption('en');
    await page.evaluate(() => document.fonts.ready);
    for (const action of shot.actions || []) {
      if (action.type === 'wait') {await hold(action.ms); continue;}
      if (action.type === 'catchPractice') {
        if (new URL(page.url()).pathname !== '/practice') throw new Error('catchPractice only acts in the explicitly unpaid practice route.');
        const target = page.getByRole('button', {name: 'Catch coffee', exact: true});
        await target.focus();
        for (let hit = 1; hit <= 3; hit++) {await hold(650); await target.press('Enter'); await expect(page.locator('.game-bar strong')).toHaveText(`${hit} / 3`);}
        continue;
      }
      const locator = locatorFor(page, action);
      if (action.type === 'visible') await expect(locator).toBeVisible();
      else if (action.type === 'disabled') await expect(locator).toBeDisabled();
      else if (action.type === 'scroll') await locator.scrollIntoViewIfNeeded();
      else if (action.type === 'text') await expect(locator).toContainText(action.value);
      else {
        const practice = new URL(page.url()).pathname === '/practice';
        if (!practice && !args['allow-product-actions']) throw new Error('Actions outside practice require --allow-product-actions and an approved real scenario.');
        if (action.type === 'click') await locator.click();
        else if (action.type === 'check') await locator.check();
        else if (action.type === 'fill') await locator.fill(action.value);
        else if (action.type === 'press') await locator.press(action.value);
        else throw new Error(`Unsupported action ${action.type}`);
        if (new URL(page.url()).origin !== base.origin) throw new Error('Capture left the authorized developed site.');
      }
    }
    // Hold the genuine current screen at normal speed; never alter payment or game state.
    const narrationSeconds = args['audio-dir'] && shot.narration ? await waveDuration(join(localOutput(args['audio-dir']), `${shot.id}.wav`)) : 0;
    const minimumSeconds = Math.max(shot.minimumSeconds || 5, narrationSeconds + 1);
    await hold(Math.max(0, minimumSeconds * 1000 - (performance.now() - started)));
    await page.screenshot({path: join(out, `${shot.id}.png`), animations: 'disabled'});
    await page.close();
    const rawPath = await video.path(), path = join(out, `${shot.id}.webm`);
    await rename(rawPath, path);
    manifest.shots.push({id: shot.id, title: shot.title, path: shot.path, file: path, narration: shot.narration || '', recordedSecondsApprox: (performance.now() - started) / 1000, ...await fileEvidence(path)});
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Recorded ${shot.id}; product state unchanged by mocks or clock patches.`);
  }
  manifest.status = 'captured-not-reviewed';
} catch (error) {
  manifest.status = 'failed-not-final';
  manifest.failure = error.message;
  throw error;
} finally {
  await context?.close();
  await browser?.close();
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
console.log(`Capture manifest: ${manifestPath}. Local capture is not an uploaded or judge-accessible video.`);
