import {mkdir, writeFile} from 'node:fs/promises';
import {join, dirname, extname} from 'node:path';
import {argumentsFor, fileEvidence, fullFfmpeg, jsonFile, localOutput, probeMedia, run, waveDuration} from './video-tools.mjs';

const args = argumentsFor();
if (!args.manifest || !args.out || !args['audio-dir']) throw new Error('Supply --manifest, --audio-dir, --out and --ffmpeg.');
const manifest = await jsonFile(args.manifest);
if (manifest.sourceUrl !== 'https://drop-omega-five.vercel.app') throw new Error('Use genuine captures of the authorized production DROP site.');
const maximum = Number(args['max-seconds'] || 180);
if (![120,180].includes(maximum)) throw new Error('Maximum is 120 for pitch or 180 for demo.');
if (!args.preview) {
  if (!args['verified-evidence'] || !['verified-demo','verified-pitch'].includes(manifest.kind)) throw new Error('Final exports require a verified kind and --verified-evidence; use --preview only for internal preparation.');
  const evidence = await jsonFile(args['verified-evidence']);
  for (const key of ['hostedAuthentication','firestoreAppAccess','publicMonadFunding','publicMonadPayout','hostedRequestRecovery']) {
    if (evidence[key] !== true) throw new Error(`Missing verified evidence: ${key}`);
  }
  if (evidence.chainId !== 10143 || !/^0x[\da-f]{64}$/i.test(evidence.payoutTx || '')) throw new Error('Expected a verified Monad Testnet payout.');
  manifest.verification = evidence;
}
const ffmpeg = await fullFfmpeg(args.ffmpeg), output = localOutput(args.out);
const scratch = join(dirname(output), `${output.split(/[\\/]/).at(-1)}-assembly`);
await mkdir(scratch,{recursive:true});
const filterPath = path => path.replaceAll('\\','/').replaceAll(':','\\:').replaceAll("'","'\\''");
const listPath = path => path.replaceAll('\\','/').replaceAll("'","'\\''");
const assText = text => text.replaceAll('{','').replaceAll('}','').replaceAll('\n','\\N');
function assTime(t) {const n=Math.round(t*100);return `${Math.floor(n/360000)}:${String(Math.floor(n/6000)%60).padStart(2,'0')}:${String(Math.floor(n/100)%60).padStart(2,'0')}.${String(n%100).padStart(2,'0')}`;}
function srtTime(t) {const n=Math.round(t*1000);return `${String(Math.floor(n/3600000)).padStart(2,'0')}:${String(Math.floor(n/60000)%60).padStart(2,'0')}:${String(Math.floor(n/1000)%60).padStart(2,'0')},${String(n%1000).padStart(3,'0')}`;}
function cuesFor(text, seconds) {
  const words = text.trim().split(/\s+/), chunks=[];
  let chunk=[];
  for (const word of words) {chunk.push(word);if(chunk.length>=9 || (chunk.length>=5 && /[.!?;]$/.test(word))) {chunks.push(chunk.join(' '));chunk=[];}}
  if(chunk.length) chunks.push(chunk.join(' '));
  const weight = value => value.length + (value.match(/[.,;:!?]/g)||[]).length*3;
  const total = chunks.reduce((sum,value)=>sum+weight(value),0);
  let start=0;
  return chunks.map(value=>{const end=start+seconds*weight(value)/total;const cue={start,end,text:value};start=end;return cue;});
}
const parts=[],timings=[],allCues=[],sourceEvidence=[];
let elapsed=0;
for(const [index,shot] of manifest.shots.entries()) {
  if(!/^[a-z0-9-]+$/.test(shot.id)) throw new Error('Unsafe shot ID.');
  const audio=join(localOutput(args['audio-dir']),`${shot.id}.wav`),voiceSeconds=await waveDuration(audio);
  const visuals=shot.visuals;
  if(!visuals?.length) throw new Error(`No actual UI visual for ${shot.id}`);
  const seconds=Math.max(voiceSeconds+0.45,visuals.reduce((sum,v)=>sum+v.seconds,0));
  const normalized=[];
  for(const [visualIndex,visual] of visuals.entries()) {
    const file=localOutput(visual.file),isImage=/\.(png|jpe?g|webp)$/i.test(extname(file));
    const segment=join(scratch,`${shot.id}-${visualIndex}.mp4`);
    let duration=visual.seconds;
    if(visualIndex===visuals.length-1) duration+=Math.max(0,seconds-visuals.reduce((sum,v)=>sum+v.seconds,0));
    if(!(duration>0)) throw new Error('Invalid visual duration.');
    const input=isImage?['-loop','1','-i',file]:['-ss',String(visual.trimStart||0),'-i',file];
    const filter=`scale=1920:900:force_original_aspect_ratio=decrease:out_range=tv,pad=1920:1080:(ow-iw)/2:(900-ih)/2:color=0x12111B,setsar=1,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709,tpad=stop_mode=clone:stop_duration=${duration}`;
    await run(ffmpeg,['-hide_banner','-loglevel','error','-y',...input,'-vf',filter,'-t',String(duration),'-r','30','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-an',segment]);
    normalized.push(segment);
    sourceEvidence.push({shot:shot.id,file,source:visual.source||'genuine-product-browser-capture',trimStart:visual.trimStart||0,displaySeconds:duration,...await fileEvidence(file)});
  }
  const concat=join(scratch,`${shot.id}-visuals.txt`);
  await writeFile(concat,normalized.map(path=>`file '${listPath(path)}'`).join('\n')+'\n');
  const cues=cuesFor(shot.captions || shot.narration,voiceSeconds);
  const ass=join(scratch,`${shot.id}.ass`);
  const header=`[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 2\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Caption,Arial,40,&H00FFFFFF,&H00FFFFFF,&H0012111B,&H0012111B,0,0,0,0,100,100,0,0,1,0,0,5,100,100,0,1\nStyle: Label,Arial,23,&H00AAA4C8,&H00AAA4C8,&H0012111B,&H0012111B,0,0,0,0,100,100,0,0,1,0,0,7,65,65,0,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
  const label=`${String(index+1).padStart(2,'0')}  /  ${shot.title}`;
  const events=[`Dialogue: 0,${assTime(0)},${assTime(seconds)},Label,,0,0,0,,{\\pos(65,921)}${assText(label)}`];
  if(manifest.disclosure) events.push(`Dialogue: 0,${assTime(0)},${assTime(seconds)},Label,,0,0,0,,{\\an9\\pos(1855,921)}${assText(manifest.disclosure)}`);
  for(const cue of cues) {events.push(`Dialogue: 1,${assTime(cue.start)},${assTime(cue.end)},Caption,,0,0,0,,{\\pos(960,1004)}${assText(cue.text)}`);allCues.push({...cue,start:elapsed+cue.start,end:elapsed+cue.end});}
  await writeFile(ass,header+events.join('\n')+'\n');
  const part=join(scratch,`${shot.id}-narrated.mp4`);
  await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concat,'-i',audio,'-map','0:v:0','-map','1:a:0','-vf',`ass='${filterPath(ass)}'`,'-af','apad','-t',String(seconds),'-r','30','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',part]);
  parts.push(part);timings.push({id:shot.id,title:shot.title,startSeconds:elapsed,durationSeconds:seconds,voiceSeconds});elapsed+=seconds;
  console.log(`Rendered ${shot.id}: ${seconds.toFixed(2)}s`);
}
if(elapsed>maximum-0.25) throw new Error(`Video would exceed ${maximum}s: ${elapsed}`);
const concat=join(scratch,'all-shots.txt');
await writeFile(concat,parts.map(path=>`file '${listPath(path)}'`).join('\n')+'\n');
await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concat,'-c','copy','-movflags','+faststart',output]);
const probe=await probeMedia(ffmpeg,output);
if(Number(probe.format.duration)>maximum || !probe.streams.some(s=>s.codec_type==='audio') || !probe.streams.some(s=>s.codec_type==='video')) throw new Error('Output failed stream/duration checks.');
await run(ffmpeg,['-hide_banner','-loglevel','error','-i',output,'-f','null','-']);
await writeFile(output.replace(/\.mp4$/i,'.srt'),allCues.map((cue,index)=>`${index+1}\n${srtTime(cue.start)} --> ${srtTime(cue.end)}\n${cue.text}\n`).join('\n'));
await writeFile(output+'.json',JSON.stringify({status:args.preview?'preview-not-final':'exported-pending-visual-and-audio-review',kind:manifest.kind,sourceUrl:manifest.sourceUrl,durationSeconds:Number(probe.format.duration),maximumSeconds:maximum,voice:'Microsoft Zira Desktop; neutral synthetic narrator, not founder recorded voice.',editing:'Actual product screenshots and normal-speed browser video; cuts and screen holds for narration. No fabricated UI or state. Caption timing is approximate.',timings,verification:manifest.verification,sourceEvidence,...await fileEvidence(output),streams:probe.streams.map(s=>({type:s.codec_type,codec:s.codec_name,width:s.width,height:s.height}))},null,2)+'\n');
console.log(`Exported ${Number(probe.format.duration).toFixed(2)} seconds: ${output}`);
