'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {formatUnits,type Address,type Hex} from 'viem';
import {api,type CampaignView} from './api';
import {useSession} from './session';
import {useLanguage} from './shell';
import {waitForFinalizedTransaction} from './transactions';

type CouponInput={reference:string;merchant:string;expiresAt:string;content:string};
const emptyCoupon=():CouponInput=>({reference:'',merchant:'',expiresAt:'',content:''});

export function Dashboard({id}:{id?:string}){
 const {t,locale,errorText}=useLanguage(),auth=useSession(),getToken=auth.token;
 const [campaigns,setCampaigns]=useState<CampaignView[]>([]),[campaign,setCampaign]=useState<CampaignView>();
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const [txHash,setTxHash]=useState(''),[copied,setCopied]=useState(false);
 const [coupons,setCoupons]=useState<CouponInput[]>([emptyCoupon()]),[rights,setRights]=useState(false);
 const fetchCampaigns=useCallback(async()=>{const token=await getToken();return id?{campaign:await api<CampaignView>(`/creator/campaigns/${id}`,token)}:{campaigns:await api<CampaignView[]>('/creator/campaigns',token)};},[getToken,id]);
 const load=async()=>{if(!auth.authenticated)return;const result=await fetchCampaigns();if(result.campaign)setCampaign(result.campaign);if(result.campaigns)setCampaigns(result.campaigns);};
 useEffect(()=>{if(!auth.authenticated)return;let active=true;void fetchCampaigns().then(result=>{if(!active)return;if(result.campaign)setCampaign(result.campaign);if(result.campaigns)setCampaigns(result.campaigns);}).catch(error=>{if(active)setError((error as Error).message);});return()=>{active=false;};},[auth.authenticated,fetchCampaigns]);
 const action=async(run:()=>Promise<void>)=>{setBusy(true);setError('');setMessage('');try{await run();await load();}catch(error){setError((error as Error).message);}finally{setBusy(false);}};
 const fund=()=>action(async()=>{
  if(!id)return;
  const plan=await api<{chainId:number;owner:string;budgetAtomic:string;transactions:{to:Address;data:Hex}[]}>(`/creator/campaigns/${id}/funding`,await getToken());
  if(plan.chainId!==10143||plan.owner.toLowerCase()!==auth.wallet?.toLowerCase())throw new Error(t('이벤트 소유자와 Monad Testnet 지갑을 확인해 주세요.','Check the event owner and Monad Testnet wallet.'));
  let finalHash:Hex|undefined;
  for(let index=0;index<plan.transactions.length;index++){
   setMessage(index===0?t('예산 사용 권한을 확인 중입니다.','Confirming the budget approval.'):t('계약에 예산을 입금 중입니다.','Depositing the fixed budget.'));
   const tx=plan.transactions[index];finalHash=await auth.send(tx.to,tx.data);setTxHash(finalHash);
   if((await waitForFinalizedTransaction(finalHash)).status!=='success')throw new Error(t('예산 준비 거래가 실패했습니다. 거래 기록을 확인해 주세요.','Funding failed. Check the transaction record.'));
  }
  if(finalHash)await api(`/creator/campaigns/${id}/funding`,await getToken(),{txHash:finalHash});
  setMessage(t('예산 입금과 고정 규칙을 확인했습니다. 시작 시각부터 공유 링크로 참가할 수 있습니다.','Funding and fixed rules are confirmed. Participation opens at the published start time.'));
 });
 const verify=()=>action(async()=>{await api(`/creator/campaigns/${id}/funding`,await getToken(),{txHash});setMessage(t('계약의 실제 입금과 규칙을 확인했습니다.','The contract funding and rules were verified.'));});
 const recover=()=>action(async()=>{
  const plan=await api<{chainId:number;to:Address;data:Hex}>(`/creator/campaigns/${id}/refund`,await getToken());
  if(plan.chainId!==10143)throw new Error(t('Monad Testnet 회수만 지원합니다.','Only Monad Testnet recovery is supported.'));
  const hash=await auth.send(plan.to,plan.data);setTxHash(hash);
  if((await waitForFinalizedTransaction(hash)).status!=='success')throw new Error(t('회수 거래가 실패했습니다.','Recovery failed.'));
  await api(`/creator/campaigns/${id}/refund`,await getToken(),{txHash:hash});
  setMessage(t('남은 예산이 원래 운영자 지갑으로 회수됐습니다.','Unused budget returned to the original creator wallet.'));
 });
 const importInventory=()=>action(async()=>{
  if(!rights)throw new Error(t('쿠폰 배포 권한을 확인해 주세요.','Confirm your right to distribute these coupons.'));
  if(coupons.length>100)throw new Error(t('한 번에 최대 100개를 등록할 수 있습니다.','Import at most 100 coupons per batch.'));
  await api(`/creator/campaigns/${id}/coupons`,await getToken(),{coupons:coupons.map(coupon=>({...coupon,expiresAt:new Date(coupon.expiresAt).toISOString()}))});
  setCoupons([emptyCoupon()]);setMessage(t('쿠폰 재고를 안전하게 등록했습니다. 원문은 당첨자에게만 공개됩니다.','Inventory was securely imported. Contents are visible only to the winner.'));
 });
 const publish=()=>action(async()=>{await api(`/creator/campaigns/${id}/publish`,await getToken(),{});setMessage(t('전체 쿠폰 재고를 확인하고 이벤트를 게시했습니다.','The full inventory was verified and the event was published.'));});
 const copy=async()=>{if(!campaign)return;try{await navigator.clipboard.writeText(`${window.location.origin}/d/${campaign.slug}`);setCopied(true);}catch{setError(t('링크를 복사하지 못했습니다. 아래 주소를 직접 복사해 주세요.','Copying failed. Copy the address below manually.'));}};
 const date=(value:string)=>new Date(value).toLocaleString(locale);
 if(!auth.authenticated)return <main className="page narrow"><h1>{t('내 이벤트','My events')}</h1><div className="empty-state"><h3>{t('운영자 계정으로 로그인해 주세요.','Sign in with your creator account.')}</h3><p>{t('이벤트와 예산은 만든 운영자에게만 표시됩니다.','Only the event owner can access its budget and management data.')}</p><button className="button" disabled={!auth.configured||!auth.ready} onClick={auth.login}>{t('로그인','Sign in')}</button>{!auth.configured&&<p>{t('로그인 연결이 아직 준비되지 않았습니다.','Authentication is not configured yet.')}</p>}</div></main>;
 if(!id)return <main className="page"><div className="page-heading"><div><p className="eyebrow">{t('커뮤니티의 순간들','YOUR COMMUNITY MOMENTS')}</p><h1>{t('내 이벤트','My events')}</h1></div><Link className="button" href="/dashboard/new">{t('새 이벤트','Create an event')} ↗</Link></div>{error&&<div role="alert" className="notice error">{errorText(error)}</div>}{campaigns.length===0?<div className="empty-state"><div className="empty-icon">☕</div><h3>{t('첫 DROP을 만들어볼까요?','Create your first drop?')}</h3><p>{t('게임·보상·규칙을 정하고 예산이나 쿠폰 재고를 확보하세요.','Choose the game, reward and rules, then secure the budget or inventory.')}</p><Link href="/dashboard/new" className="button">{t('이벤트 만들기','Create an event')}</Link></div>:<div className="table-wrap"><table><thead><tr><th>{t('이벤트','Event')}</th><th>{t('상태','Status')}</th><th>{t('예약','Reserved')}</th><th>{t('종료','Closes')}</th></tr></thead><tbody>{campaigns.map(item=><tr key={item.id}><td><Link href={`/dashboard/${item.id}`}><strong>{item.title} →</strong></Link></td><td>{item.status}</td><td>{item.reservedCount} / {item.maxRecipients}</td><td>{date(item.endsAt)}</td></tr>)}</tbody></table></div>}</main>;
 if(!campaign)return <main className="page narrow">{error?<div role="alert" className="notice error">{errorText(error)}</div>:<p className="loading">{t('이벤트 확인 중…','Loading event…')}</p>}</main>;
 const paid=(campaign.payouts?.CONFIRMED??0)+(campaign.payouts?.DELIVERED??0),failed=campaign.payouts?.RETRYABLE_FAILED??0;
 const couponLabels={reference:t('관리용 쿠폰 식별번호','Inventory reference'),merchant:t('사용처','Merchant'),expiresAt:t('유효기간','Expiry'),content:t('쿠폰 내용·수령 코드','Coupon content or redemption code')};
 return <main className="page">
  <Link className="back-link" style={{marginTop:0,marginBottom:25}} href="/dashboard">← {t('내 이벤트','My events')}</Link>
  <div className="page-heading"><div><p className="eyebrow">{campaign.organizer} · {campaign.status}</p><h1>{campaign.title}</h1><p className="lead">{t('규칙과 예산을 고정하고 지급이 끝날 때까지 확인하세요.','Fixed rules, secured budget and delivery you can follow through.')}</p></div>{campaign.status!=='DRAFT'&&<button className="button" onClick={()=>{void copy();}}>{copied?t('복사 완료','Copied'):t('공유 링크 복사','Copy share link')} ↗</button>}</div>
  {error&&<div className="notice error" role="alert">{errorText(error)}</div>}{message&&<div className="notice" role="status">{message}</div>}
  <div className="metric-grid">{[[t('참여 시도','Attempts'),campaign.participants??0],[t('보상 예약','Reserved rewards'),campaign.reservedCount],[t('지급 완료','Delivered'),paid],[t('지급 지연','Delayed'),failed]].map(([label,value])=><div className="metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
  <div className="two-column"><section className="card"><h3>{t('예산과 지급','Budget and delivery')}</h3><p className="lead">{campaign.rewardType==='USDC'?`${formatUnits(BigInt(campaign.totalBudgetAtomic??'0'),6)} USDC`:t('운영자 제공 쿠폰 재고','Organizer-supplied coupon inventory')}</p>
   {campaign.rewardType==='USDC'?<>
    <p className="fine-print">{t('Monad Testnet · 금전적 가치 없는 테스트 USDC. 입금 확인 전에는 참여가 열리지 않습니다.','Monad Testnet · USDC without monetary value. Participation stays closed until funding is confirmed.')}</p>
    {campaign.status==='DRAFT'&&<><button className="button" disabled={busy||!auth.wallet||process.env.NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED!=='true'} onClick={()=>{void fund();}}>{busy?t('예산 준비 중…','Preparing budget…'):t('고정 예산 입금하기','Fund the fixed budget')} ↗</button><details style={{marginTop:22}}><summary>{t('이미 입금한 거래 다시 확인','Recheck an existing deposit')}</summary><label className="field" style={{marginTop:15}}>{t('입금 거래 기록','Deposit transaction')}<input value={txHash} onChange={event=>setTxHash(event.target.value)} placeholder="0x…"/></label><button className="button button-small button-ghost" disabled={busy||!/^0x[0-9a-f]{64}$/i.test(txHash)} onClick={()=>{void verify();}}>{t('실제 입금 확인','Verify funding')}</button></details></>}
    {campaign.fundingTx&&<a className="proof-link" href={`https://testnet.monadvision.com/tx/${campaign.fundingTx}`} target="_blank" rel="noreferrer">{t('예산 입금 영수증','Funding receipt')} ↗</a>}
    {campaign.status!=='DRAFT'&&campaign.status!=='REFUNDED'&&<div style={{marginTop:26}}><p className="fine-print">{t('수령 기한 이후 남은 예산을 원래 운영자 지갑으로 회수할 수 있습니다.','Unused budget returns to the original creator after the receipt deadline.')}</p><button className="button button-ghost" disabled={busy||!auth.wallet||process.env.NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED!=='true'||new Date()<=new Date(campaign.claimDeadline)} onClick={()=>{void recover();}}>{t('남은 예산 회수','Recover unused budget')}</button></div>}
    {campaign.refundTx&&<p><a className="proof-link" href={`https://testnet.monadvision.com/tx/${campaign.refundTx}`} target="_blank" rel="noreferrer">{t('회수 영수증','Recovery receipt')} ↗</a></p>}
   </>:<>
    <div className="metric-grid" style={{gridTemplateColumns:'1fr 1fr'}}><div className="metric"><span>{t('배정 가능','Available')}</span><strong>{campaign.inventory?.AVAILABLE??0}</strong></div><div className="metric"><span>{t('전달 완료','Delivered')}</span><strong>{campaign.inventory?.DELIVERED??0}</strong></div></div>
    {campaign.rewardType==='COUPON_DEMO'&&<div className="notice">{t('사용할 수 없는 테스트 쿠폰으로 게시됩니다.','This event issues non-redeemable test coupons.')}</div>}
    {campaign.status==='DRAFT'&&<><h3>{t('쿠폰 재고 등록','Register coupon inventory')}</h3>{coupons.map((coupon,index)=><div key={index} style={{borderBottom:'1px solid var(--line)',marginBottom:20}}><p className="step-label">{t('쿠폰','Coupon')} {index+1}</p>{(['reference','merchant','expiresAt','content'] as const).map(field=><label className="field" key={field}>{couponLabels[field]}{field==='content'?<textarea autoComplete="off" value={coupon[field]} onChange={event=>setCoupons(current=>current.map((value,i)=>i===index?{...value,[field]:event.target.value}:value))}/>:<input type={field==='expiresAt'?'datetime-local':'text'} autoComplete="off" value={coupon[field]} onChange={event=>setCoupons(current=>current.map((value,i)=>i===index?{...value,[field]:event.target.value}:value))}/>}</label>)}</div>)}<button className="text-button" disabled={coupons.length>=Math.min(100,campaign.maxRecipients)} onClick={()=>setCoupons([...coupons,emptyCoupon()])}>+ {t('쿠폰 추가','Add another coupon')}</button><p className="fine-print">{t('한 번에 최대 100개씩 등록할 수 있습니다.','Import up to 100 coupons per batch.')}</p><label className="answer"><input type="checkbox" checked={rights} onChange={event=>setRights(event.target.checked)}/>{t('배포 권한이 있으며 쿠폰 유효기간이 수령 기한 이후임을 확인했습니다.','I may distribute these coupons and their expiry is after the receipt deadline.')}</label><div className="actions" style={{marginTop:20}}><button className="button" disabled={busy||!rights||coupons.some(coupon=>!coupon.reference||!coupon.merchant||!coupon.content||!coupon.expiresAt)} onClick={()=>{void importInventory();}}>{t('재고 안전하게 등록','Securely import inventory')}</button><button className="button button-ghost" disabled={busy||(campaign.inventory?.AVAILABLE??0)!==campaign.maxRecipients} onClick={()=>{void publish();}}>{t('재고 확인하고 게시','Verify inventory and publish')}</button></div></>}
   </>}
  </section><aside className="card"><h3>{t('참여자에게 약속한 규칙','The participant promise')}</h3><ul className="rules-list"><li><span>{t('지급 정책','Policy')}</span><strong>{t('서버 검증 완료 선착순','First server-verified qualifiers')}</strong></li><li><span>{t('총 수량','Total rewards')}</span><strong>{campaign.maxRecipients}</strong></li><li><span>{t('시도 횟수','Attempts allowed')}</span><strong>{campaign.maxAttempts}</strong></li><li><span>{t('참여 종료','Closes')}</span><strong>{date(campaign.endsAt)}</strong></li><li><span>{t('수령 기한','Receipt deadline')}</span><strong>{date(campaign.claimDeadline)}</strong></li></ul><p className="fine-print">{t('게임 판정과 선착순 배정은 서버가 담당합니다. rulesHash는 규칙 변경 탐지를 위한 값입니다. 완벽한 봇 방지를 보장하지 않습니다.','The server checks play and allocates slots. rulesHash detects rule changes. It is not perfect bot prevention.')}</p><details><summary>{t('고정 규칙 기록','Fixed rules record')}</summary><p className="monospace">{campaign.rulesHash}</p></details>{campaign.status!=='DRAFT'&&<><p className="monospace" style={{marginTop:24}}>/d/{campaign.slug}</p><Link className="button button-ghost" href={`/d/${campaign.slug}`}>{t('참여 화면 열기','Open participation page')} ↗</Link></>}</aside></div>
 </main>;
}
