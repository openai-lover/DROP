'use client';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {type ReactNode} from 'react';
import {LanguageProvider, LanguageSelector, useLanguage} from '@/i18n';
import {useSession} from './session';
export {useLanguage} from '@/i18n';
function Chrome({children}:{children:ReactNode}) {
  const {t}=useLanguage(); const session=useSession(); const path=usePathname();
  return <div className="site-shell">
    <header className="header">
      <Link className="wordmark" href="/" aria-label={t('DROP 홈','DROP home')}>DROP<span className="logo-period">✳</span></Link>
      <span className="brand-divider" aria-hidden="true"/>
      <a className="monad-brand" href="https://monad.xyz/" target="_blank" rel="noreferrer" aria-label="Monad"><Image src="/brand/monad/Full.svg" alt="Monad" width={112} height={22}/></a>
      <nav aria-label={t('주요 메뉴','Main navigation')}>
        <Link href="/practice" aria-current={path==='/practice'?'page':undefined}>{t('플레이','Play')}</Link>
        <Link href="/creators" aria-current={path==='/creators'?'page':undefined}>{t('운영자에게','For creators')}</Link>
        <Link href="/me/rewards" aria-current={path==='/me/rewards'?'page':undefined}>{t('내 보상','My rewards')}</Link>
      </nav>
      <div className="header-actions"><LanguageSelector/><button className="button button-small" disabled={!session.configured||!session.ready} onClick={session.authenticated?session.logout:session.login}>{session.authenticated?t('로그아웃','Sign out'):t('로그인','Sign in')}</button></div>
    </header>
    {children}
    <footer className="footer">
      <div className="footer-identity"><Link className="wordmark" href="/">DROP<span className="logo-period">✳</span></Link><p>{t('모여서 놀고, 즐거움을 나눠요.','Good people. Great drops.')}</p></div>
      <div className="footer-links"><Link href="/judges">{t('체험 안내','Experience guide')}</Link><Link href="/security">{t('보안·계정 복구','Security & recovery')}</Link><a href="https://github.com/openai-lover/DROP" target="_blank" rel="noreferrer">GitHub ↗</a></div>
      <a className="footer-monad" href="https://monad.xyz/" target="_blank" rel="noreferrer"><span>{t('함께 만드는 즐거움','Community energy on')}</span><Image src="/brand/monad/Full.svg" alt="Monad" width={124} height={24}/></a>
      <div className="footer-bottom"><small>{t('Monad 위에 만드는 독립 커뮤니티 프로젝트.','An independent community project on Monad.')}</small><small className="network-label"><span className="status-dot"/>{t('Monad Testnet · 테스트 보상에는 금전적 가치가 없습니다.','Monad Testnet · Test rewards have no monetary value.')}</small></div>
    </footer>
  </div>;
}
export function Shell({children}:{children:ReactNode}) {return <LanguageProvider><Chrome>{children}</Chrome></LanguageProvider>;}
