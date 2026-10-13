import {mkdir, writeFile} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {argumentsFor, fileEvidence, fullFfmpeg, jsonFile, localOutput, probeMedia, run, waveDuration} from './video-tools.mjs';

const args = argumentsFor();
if (args.help) {
  console.log('node scripts/video-assemble.mjs --manifest .local/video/rehearsal/capture.json --audio-dir .local/video/voice --out .local/video/rehearsal.mp4 --max-seconds 180 --ffmpeg <verified-full-build> [--allow-rehearsal]');
  process.exit(0);
}
if (!args.manifest || !args['audio-dir'] || !args.out) throw new Error('Supply --manifest, --audio-dir and --out.');
const manifest = await jsonFile(args.manifest);
if (manifest.status !== 'captured-not-reviewed') throw new Error('All capture shots must finish before assembly.');
if (manifest.kind !== 'verified-demo' && !args['allow-rehearsal']) throw new Error('Preparation footage requires --allow-rehearsal. It is not a final payout demo.');
const maximum = Number(args['max-seconds'] || 180);
if (![120, 180].includes(maximum)) throw new Error('Use 120 seconds for the pitch or 180 for the technical demo.');
const ffmpeg = await fullFfmpeg(args.ffmpeg), output = localOutput(args.out), scratch = join(dirname(output), 'assembly');
await mkdir(scratch, {recursive: true});
const parts = [], timings = [];
let total = 0;
function stamp(seconds) {
  const ms = Math.round(seconds * 1000), hours = Math.floor(ms / 3600000), minutes = Math.floor(ms / 60000) % 60, secs = Math.floor(ms / 1000) % 60;
  return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(secs).padStart(2,'0')},${String(ms % 1000).padStart(3,'0')}`;
}
function captions(text, duration) {
  const words = text.trim().split(/\s+/), chunks = [];
  for (let index = 0; index < words.length; index += 12) chunks.push(words.slice(index, index + 12).join(' '));
  return chunks.map((chunk, index) => `${index + 1}\n${stamp(index * duration / chunks.length)} --> ${stamp((index + 1) * duration / chunks.length)}\n${chunk}\n`).join('\n');
}
function filterPath(path) {return path.replaceAll('\\', '/').replaceAll(':', '\\:').replaceAll("'", "'\\''");}
for (const shot of manifest.shots) {
  const source = localOutput(shot.file), audio = join(localOutput(args['audio-dir']), `${shot.id}.wav`);
  const videoProbe = await probeMedia(ffmpeg, source), voiceSeconds = await waveDuration(audio);
  const seconds = Math.max(Number(videoProbe.format.duration), voiceSeconds + 0.5);
  const srt = join(scratch, `${shot.id}.srt`), part = join(scratch, `${shot.id}.mp4`);
  await writeFile(srt, captions(shot.narration, voiceSeconds));
  const filters = `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x101018,tpad=stop_mode=clone:stop_duration=${Math.max(0, seconds - Number(videoProbe.format.duration)) + 0.1},subtitles='${filterPath(srt)}':force_style='FontName=Arial,FontSize=20,Outline=2,MarginV=38'`;
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-vf', filters, '-af', 'apad', '-t', String(seconds), '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', part]);
  parts.push(part);
  timings.push({id: shot.id, startsAtSecondsApprox: total, durationSecondsApprox: seconds, narrationSeconds: voiceSeconds});
  total += seconds;
}
if (total > maximum - 0.5) throw new Error(`Prepared parts total ${total.toFixed(2)}s exceeds the ${maximum}s limit. Shorten wording or explicitly cut real waiting; do not speed up a claimed interaction.`);
const list = join(scratch, 'concat.txt');
await writeFile(list, parts.map(part => `file '${part.replaceAll('\\', '/').replaceAll("'", "'\\''")}'`).join('\n') + '\n');
await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', output]);
const measured = await probeMedia(ffmpeg, output), duration = Number(measured.format.duration);
if (duration > maximum || !measured.streams.some(stream => stream.codec_type === 'video') || !measured.streams.some(stream => stream.codec_type === 'audio')) throw new Error('The exported file failed its measured duration or audio/video-stream gate.');
await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', output, '-f', 'null', '-']);
await writeFile(output + '.json', JSON.stringify({status:'assembled-not-reviewed-or-uploaded', kind: manifest.kind, sourceUrl: manifest.sourceUrl, file: output, durationSeconds:duration, maximumSeconds:maximum, captions:'Approximate narration timing; visually review and listen before upload.', voice:'Neutral synthetic narration, not founder identity or voice.', editing:'Product clips concatenated; no playback-speed change. Final screen may hold for narration.', timings, ...await fileEvidence(output), streams:measured.streams.map(stream=>({type:stream.codec_type,codec:stream.codec_name,width:stream.width,height:stream.height}))},null,2)+'\n');
console.log(`Assembled ${duration.toFixed(2)}s video: ${output}. Review footage, audio, privacy and claims before any upload.`);
