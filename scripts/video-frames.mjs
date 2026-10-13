import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {argumentsFor, fileEvidence, fullFfmpeg, jsonFile, localOutput, probeMedia, run} from './video-tools.mjs';

// Assemble screenshots supplied by the authorized browser operator. This does
// not attach to a browser, export storage, recreate UI or fabricate game states.
const args = argumentsFor();
if (args.help) {
  console.log('node scripts/video-frames.mjs --manifest .local/video/real-ui-frames.json --out .local/video/real-ui.mp4 --ffmpeg <verified-full-build>');
  process.exit(0);
}
if (!args.manifest || !args.out) throw new Error('Supply --manifest and --out.');
const capture = await jsonFile(args.manifest);
if (capture.source !== 'genuine-product-browser-capture' || !capture.sourceUrl?.startsWith('https://drop-omega-five.vercel.app')) throw new Error('Frames must be actual authorized DROP captures, not reconstructed screens or external account pages.');
if (capture.frames?.length < 2 || capture.frames?.[0]?.atSeconds !== 0) throw new Error('Provide at least two actual frames, starting at zero seconds.');
if (!Number.isFinite(capture.endSeconds) || capture.endSeconds <= capture.frames.at(-1).atSeconds || capture.endSeconds > 180) throw new Error('A valid observed end time ≤180 seconds is required.');
const ffmpeg = await fullFfmpeg(args.ffmpeg), output = localOutput(args.out);
await mkdir(dirname(output), {recursive:true});
const evidence = [], entries = [];
for (let index = 0; index < capture.frames.length; index++) {
  const frame = capture.frames[index], nextAt = capture.frames[index + 1]?.atSeconds ?? capture.endSeconds;
  if (!Number.isFinite(frame.atSeconds) || nextAt <= frame.atSeconds) throw new Error('Frame times must strictly increase. Preserve observed timing; do not invent faster interactions.');
  const file = localOutput(frame.file);
  if (!/\.(png|jpe?g|webp)$/i.test(file)) throw new Error('Expected an actual captured PNG/JPEG/WebP.');
  evidence.push({atSeconds:frame.atSeconds, file, ...await fileEvidence(file)});
  entries.push(`file '${file.replaceAll('\\','/').replaceAll("'","'\\''")}'`, `duration ${nextAt - frame.atSeconds}`);
}
// Concat requires the final image again so its last duration is honored.
entries.push(entries.at(-2));
const list = join(dirname(output), 'browser-frame-list.txt');
await writeFile(list, entries.join('\n')+'\n');
await run(ffmpeg, ['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',list,'-vf','scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x101018','-t',String(capture.endSeconds),'-fps_mode','vfr','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-an','-movflags','+faststart',output]);
const media = await probeMedia(ffmpeg, output);
await writeFile(output+'.json',JSON.stringify({status:'assembled-from-real-frames-not-reviewed',source:capture.source,sourceUrl:capture.sourceUrl,recordedAt:capture.recordedAt,durationSeconds:Number(media.format.duration),disclosure:'Real browser frame captures at observed timing; not a continuous screen recording. No synthesized cursor, reconstructed UI, altered state or playback acceleration.',frames:evidence,...await fileEvidence(output)},null,2)+'\n');
console.log('Prepared actual-browser frame clip. Disclose frame-based capture and visually review before using in a final demo.');
