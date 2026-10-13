'use client';
import Link from 'next/link';
import {createContext,useContext,useEffect,useSyncExternalStore,type ReactNode} from 'react';
import {useSession} from './session';
const Language=createContext({en:false,t:(ko:string,english:string)=>{void english;return ko;},toggle:()=>{}});
const subscribeLanguage=(notify:()=>void)=>{window.addEventListener('storage',notify);window.addEventListener('drop-language',notify);return()=>{window.removeEventListener('storage',notify);window.removeEventListener('drop-language',notify);};};
export const useLanguage=()=>useContext(Language);
export function Shell({children}:{children:ReactNode}){
 const en=useSyncExternalStore(subscribeLanguage,()=>localStorage.getItem('drop-language')==='en',()=>false);const session=useSession();
 useEffect(()=>{document.documentElement.lang=en?'en':'ko';},[en]);
 const toggle=()=>{localStorage.setItem('drop-language',en?'ko':'en');window.dispatchEvent(new Event('drop-language'));};
 const t=(ko:string,english:string)=>en?english:ko;
 return <Language.Provider value={{en,t,toggle}}><div className="site-shell"><header className="header"><Link className="wordmark" href="/" aria-label="DROP home">DR<span className="logo-dot">O</span>P<span className="logo-period">.</span></Link><nav aria-label="Main"><Link href="/creators">{t('운영자에게','For creators')}</Link><Link href="/me/rewards">{t('내 보상','My rewards')}</Link><Link href="/judges">{t('심사 체험','Judge guide')}</Link></nav><div className="header-actions"><button className="language" onClick={toggle} aria-label="Change language">{en?'한국어':'EN'}</button><button className="button button-small" disabled={!session.configured||!session.ready} onClick={session.authenticated?session.logout:session.login}>{session.authenticated?t('로그아웃','Sign out'):t('로그인','Sign in')}</button></div></header><div className="network-ribbon"><span className="status-dot"/>{t('Monad Testnet · 테스트 보상에는 금전적 가치가 없습니다.','Monad Testnet · Test rewards have no monetary value.')}</div>{children}<footer className="footer"><Link className="wordmark" href="/">DROP.</Link><p>{t('그냥 뿌리지 말고, 플레이하게 하자.','Playful rewards for communities.')}</p><div><Link href="/security">{t('보안·계정 복구','Security & recovery')}</Link><a href="https://github.com/openai-lover/DROP" target="_blank" rel="noreferrer">GitHub ↗</a></div><small>{t('게임 판정은 서버가, 보상 정산은 Monad가 처리합니다.','Server-verified play. Monad-settled rewards.')}</small></footer></div></Language.Provider>;
}
