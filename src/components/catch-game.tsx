'use client';
import {useEffect,useRef,useState,type PointerEvent,type KeyboardEvent} from 'react';
import Image from 'next/image';
import {catchTarget,DEFAULT_CATCH,type CatchInput} from '@/server/catch-engine';
import {useLanguage} from './shell';
type Props={seed:string;nonce:string;practice?:boolean;phrase?:string;targetImage?:string;onComplete:(input:CatchInput)=>void;onExpire:()=>void;};
export function CatchGame({seed,nonce,practice=false,phrase,targetImage,onComplete,onExpire}:Props){
 const {t}=useLanguage(); const [started,setStarted]=useState(!practice);const [elapsed,setElapsed]=useState(0);const [hits,setHits]=useState(0); const start=useRef(0);const input=useRef<CatchInput['events']>([]);const finished=useRef(false);const area=useRef<HTMLDivElement>(null);
 const begin=()=>{start.current=performance.now();setStarted(true);};
 useEffect(()=>{if(!started)return;if(start.current===0)start.current=performance.now();let frame:number;const tick=()=>{const at=Math.floor(performance.now()-start.current);setElapsed(at);if(at>=DEFAULT_CATCH.durationMs){if(!finished.current){finished.current=true;onExpire();}return;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);},[started,onExpire]);
 const target=catchTarget(seed,hits,elapsed);
 const recordHit=(at:number,point:{x:number;y:number})=>{
  if(!started||finished.current||at<100||at-(input.current.at(-1)?.at??-350)<350)return;
  const exact=catchTarget(seed,hits,at);if(Math.hypot(point.x-exact.x,point.y-exact.y)>DEFAULT_CATCH.radius)return;
  const events=[...input.current,{at,...point,target:hits}];input.current=events;setHits(events.length);
  if(events.length===DEFAULT_CATCH.targetHits){finished.current=true;onComplete({nonce,events});}
 };
 const catchIt=(event:PointerEvent<HTMLButtonElement>)=>{
  if(!started||finished.current||!area.current)return;
  const at=Math.floor(performance.now()-start.current);if(at<100||at-(input.current.at(-1)?.at??-350)<350)return;
  const rect=area.current.getBoundingClientRect();const point={x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height};
  recordHit(at,point);
 };
 const keyboardHit=(event:KeyboardEvent<HTMLButtonElement>)=>{if(event.key!=='Enter'&&event.key!==' ')return;event.preventDefault();const at=Math.floor(performance.now()-start.current);recordHit(at,catchTarget(seed,hits,at));};
 return <div className="game"><div className="game-bar"><span>{practice?t('연습 · 보상 없음','Practice · No payout'):t('보상 참여','Reward attempt')}</span><strong>{hits} / 3</strong><span>{Math.max(0,Math.ceil((18000-elapsed)/1000))}{t('초','s')}</span></div><div className="game-area" ref={area}><div className="game-orbit orbit-one"/><div className="game-orbit orbit-two"/>{!started?<div className="game-intro"><div className="mascot-intro"><Image className="game-mascot" src="/brand/monad/molandak-cute.png" alt="Molandak" width={140} height={120}/><div className="cup-icon" aria-hidden="true">☕</div></div><h3>{phrase??t('커피는 잡고 가야지.','Catch your coffee.')}</h3><p>{t('18초 안에 움직이는 커피를 3번 잡아 주세요.','Catch the moving coffee three times in 18 seconds.')}</p><button className="button" onClick={begin}>{t('시작하기','Start playing')} ↗</button></div>:hits===3?<div className="game-intro"><span className="success-icon">✓</span><h3>{practice?t('잡았다! 연습 성공','Caught it! Practice complete'):t('잡았다! 보상 확인 중','Caught it! Verifying reward')}</h3><p>{practice?t('이 연습에서는 보상을 지급하지 않습니다.','Practice does not issue a reward.'):t('최종 결과는 서버 확인 후 안내합니다.','Your server-verified result will appear shortly.')}</p></div>:<><button aria-label={t('커피 잡기','Catch coffee')} className="catch-target" aria-keyshortcuts="Enter Space" style={{width:`${DEFAULT_CATCH.radius*200}%`,height:`${DEFAULT_CATCH.radius*200}%`,left:`${target.x*100}%`,top:`${target.y*100}%`}} onPointerDown={catchIt} onKeyDown={keyboardHit}>{targetImage?<Image src={targetImage} alt="" width={60} height={60} unoptimized/>:"☕"}</button><p className="game-hint">{hits===2?t('거의 잡았어!','Almost there!'):phrase??t('커피를 터치해 주세요.','Tap the coffee.')}</p></>}</div><div className="timer-track"><div style={{width:`${Math.max(0,100-elapsed/180)}%`}}/></div></div>;
}
