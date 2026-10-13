'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {formatUnits} from 'viem';
import {api,type CampaignView,type GameSessionView} from './api';
import {useSession} from './session';
import {useLanguage} from './shell';
import {CatchGame} from './catch-game';

export function Event({slug}:{slug:string}){
 const {t,en}=useLanguage(),auth=useSession();
 const [campaign,setCampaign]=useState<CampaignView>();
 const [attempt,setAttempt]=useState<GameSessionView>();
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [answers,setAnswers]=useState<number[]>([]),[outcome,setOutcome]=useState('');
 useEffect(()=>{let active=true;void api<CampaignView>(`/campaigns/${encodeURIComponent(slug)}`).then(value=>{if(active)setCampaign(value);}).catch(error=>{if(active)setError(error.message);});return()=>{active=false;};},[slug]);
 const start=async()=>{
  if(!auth.authenticated){auth.login();return;}
  if(!auth.wallet)return;
  setBusy(true);setError('');
  try{setAttempt(await api<GameSessionView>(`/campaigns/${encodeURIComponent(slug)}/sessions`,await auth.token(),{}));setAnswers([]);setOutcome('');}
  catch(error){setError((error as Error).message);}finally{setBusy(false);}
 };
 const submit=async(input:unknown)=>{
  if(!attempt)return;setBusy(true);setError('');
  try{const result=await api<{outcome:string}>(`/sessions/${attempt.id}/submit`,await auth.token(),input);setOutcome(result.outcome);setAttempt(undefined);}
  catch(error){setError((error as Error).message);}finally{setBusy(false);}
 };
 const expire=useCallback(()=>{setAttempt(undefined);setError(en?'The play window has ended. Retries follow the published attempt limit.':'참여 시간이 끝났습니다. 재시도는 사전 규칙의 허용 횟수 안에서 가능합니다.');},[en]);
 const date=(value:string)=>new Date(value).toLocaleString(en?'en-US':'ko-KR');
 if(!campaign)return <main className="page narrow">{error?<div role="alert" className="notice error">{error}<Link className="text-button" href="/practice">{t('보상 없는 연습하기','Try without a reward')} →</Link></div>:<p className="loading">{t('이벤트 확인 중…','Loading event…')}</p>}</main>;
 const reward=campaign.rewardType==='USDC'?`${formatUnits(BigInt(campaign.rewardAmountAtomic),6)} USDC`:campaign.rewardType==='COUPON_DEMO'?t('테스트 커피 쿠폰','Test coffee coupon'):t('커피 쿠폰','Coffee coupon');
 const open=campaign.status==='OPEN'&&new Date(campaign.startsAt)<=new Date()&&new Date(campaign.endsAt)>new Date()&&campaign.remaining>0;
 const walletPending=auth.authenticated&&!auth.wallet;
 return <main className="page narrow">
  <p className="eyebrow">{campaign.organizer} · DROP</p>
  <span className="pill accent">{campaign.rewardType==='USDC'?'Monad Testnet':campaign.rewardType==='COUPON_DEMO'?t('사용 불가 테스트 쿠폰','Non-redeemable test coupon'):t('운영자 제공 쿠폰','Organizer-provided coupon')}</span>
  <h1 style={{marginTop:20}}>{campaign.title}</h1><p className="lead">{campaign.description}</p>
  <div className="card"><div className="reward-title"><div className="reward-emoji">{campaign.rewardType==='USDC'?'↗':'☕'}</div><div><h3>{reward}</h3><p>{t('서버 검증 완료 선착순','First server-verified qualifiers')} {campaign.maxRecipients}{t('명 · 계정·지갑당 1회',' rewards · Once per account and wallet')}</p></div><span className="pill reward-status">{t('남은 수량','Remaining')} {campaign.remaining}</span></div>
   <ul className="rules-list">
    <li><span>{t('성공 조건','Pass condition')}</span><strong>{campaign.gameType==='CATCH'?t('18초 안에 커피 3번 잡기','Catch coffee three times in 18 seconds'):`${campaign.config.passScore??3} / 3 ${t('정답','correct')}`}</strong></li>
    <li><span>{t('참여 기간','Play window')}</span><strong>{date(campaign.startsAt)} — {date(campaign.endsAt)}</strong></li>
    <li><span>{t('수령 기한','Receipt deadline')}</span><strong>{date(campaign.claimDeadline)}</strong></li>
    <li><span>{t('시도 횟수','Allowed attempts')}</span><strong>{campaign.maxAttempts}{t('회',' attempts')}</strong></li>
    <li><span>{t('최종 배정','Allocation')}</span><strong>{t('서버의 확정 순서','Server confirmation order')}</strong></li>
   </ul><p className="fine-print">{t('표시된 잔여 수량은 지급·예약 상태에 따라 바뀝니다. 서버 확인 전에는 보상이 확정되지 않습니다. 인증 계정은 현실의 한 사람을 보장하지 않습니다.','Availability changes with payments and reservations. Rewards are final only after server verification. An authenticated account is not proof of a unique person.')}</p>
   {campaign.rewardType==='USDC'&&<p className="fine-print">{t('테스트넷 USDC에는 금전적 가치가 없으며 커피로 교환할 수 없습니다.','Testnet USDC has no monetary value and cannot be redeemed for coffee.')}</p>}
  </div>
  {error&&<div role="alert" className="notice error">{error}</div>}{auth.error&&<div role="alert" className="notice error">{auth.error}</div>}
  {outcome&&<div role="status" className="notice"><h3>{outcome==='QUEUED'?t('보상 지급 중','Your reward is being delivered'):outcome==='SOLD_OUT'?t('보상 수량이 모두 배정됐어요','All rewards have been allocated'):outcome==='ALREADY_REWARDED'?t('이미 보상을 받은 계정이에요','This account already has a reward'):t('이번에는 조건을 통과하지 못했어요','This attempt did not pass')}</h3><p>{outcome==='QUEUED'?t('서버 검증을 통과했습니다. 실제 지급 확인 후 내 보상에 영수증이 표시됩니다.','Your attempt passed verification. A receipt appears once delivery is confirmed.'):t('공개된 규칙과 시도 횟수를 확인해 주세요.','Review the published rules and attempt limit.')}</p><Link className="button" href="/me/rewards">{t('내 보상 확인','View my rewards')} →</Link></div>}
  {attempt?(attempt.gameType==='CATCH'?<div style={{marginTop:24}}><CatchGame seed={attempt.seed} nonce={attempt.nonce} phrase={campaign.config.catchPhrase} targetImage={campaign.config.targetImage} onComplete={submit} onExpire={expire}/></div>:<div className="card quiz" style={{marginTop:24}}>{campaign.config.questions?.map((question,index)=><fieldset key={index}><legend>{index+1}. {question.prompt}</legend>{question.options.map((option,choice)=><label key={choice} className={answers[index]===choice?'answer selected':'answer'}><input type="radio" name={`quiz${index}`} checked={answers[index]===choice} onChange={()=>setAnswers(current=>{const next=[...current];next[index]=choice;return next;})}/>{option}</label>)}</fieldset>)}<p className="fine-print">{t('정답·해설은 이벤트 종료 후 공개됩니다.','Answers are released after the event ends.')}</p><button className="button" disabled={busy||answers.filter(value=>value!==undefined).length!==3} onClick={()=>{void submit({nonce:attempt.nonce,answers});}}>{t('결과 확인하기','Verify my answers')}</button></div>):!outcome&&<div className="actions" style={{marginTop:24}}><button className="button" onClick={()=>{void start();}} disabled={busy||!auth.configured||!auth.ready||walletPending||!open}>{busy||walletPending?t('준비 중…','Getting ready…'):!open?t('현재 참여할 수 없어요','Not accepting attempts'):auth.authenticated?t('참여하기','Play for a reward'):t('로그인하고 참여하기','Sign in to participate')} ↗</button><Link className="button button-ghost" href="/practice">{t('먼저 연습하기','Practice first')}</Link></div>}
  {!auth.configured&&<p className="fine-print">{t('현재 로그인 연결이 준비되지 않아 실제 보상 참여가 비활성화돼 있습니다.','Reward participation is disabled until authentication is configured.')}</p>}
  <details style={{marginTop:30}}><summary>{t('지급 규칙·거래 기록 상세','Payment rules and transaction details')}</summary><p className="monospace">Rules: {campaign.rulesHash}</p>{campaign.escrow&&<a className="proof-link" href={`https://testnet.monadvision.com/address/${campaign.escrow}`} target="_blank" rel="noreferrer">{t('계약 확인','View contract')} ↗</a>}{campaign.fundingTx&&<p><a className="proof-link" href={`https://testnet.monadvision.com/tx/${campaign.fundingTx}`} target="_blank" rel="noreferrer">{t('예산 입금 확인','View funded budget')} ↗</a></p>}</details>
 </main>;
}
