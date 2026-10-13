'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useLanguage} from './shell';
export function Home() {
 const {t}=useLanguage();
 return <main className="arcade-home">
  <section className="drop-hero">
   <div className="drop-hero-copy">
    <p className="eyebrow"><span className="tiny-spark">✳</span>{t('커뮤니티의 놀이터, 모나드에서','YOUR COMMUNITY. A LITTLE MORE MONAD.')}</p>
    <h1>{t('좋은 바이브.','GOOD VIBES.')}<br/><span>{t('짜릿한 드롭.','GREAT DROPS.')}</span></h1>
    <p className="drop-hero-description">{t('단톡방의 에너지를 플레이로. 커피를 잡고, 퀴즈를 풀고, 함께할 이유를 하나 더 만들어 봐요.','Turn group-chat energy into a little play. Catch a coffee, test your knowledge, and give your community a reason to show up.')}</p>
    <div className="actions"><Link className="button button-primary" href="/practice">{t('플레이 시작','Let’s play')}<span aria-hidden="true">↗</span></Link><Link className="button button-ghost" href="/creators">{t('드롭 만들기','Make a drop')}<span aria-hidden="true">+</span></Link></div>
    <p className="hero-footnote"><span className="small-check">✓</span>{t('가입 없이 체험 · 연습 보상 없음','No signup to try · Practice has no payout')}</p>
    <div className="hero-signature"><span>{t('즐거움이 모이는 곳','A LITTLE PLAY GOES A LONG WAY')}</span><span aria-hidden="true">↓</span></div>
   </div>
   <Link href="/practice" className="arcade-stage" aria-label={t('커피 잡기 연습하기','Try the coffee catching game')}>
    <div className="stage-topline"><span><span className="live-dot"/>{t('플레이할 준비 완료','READY WHEN YOU ARE')}</span><span>DROP / 001</span></div>
    <div className="stage-orbit" aria-hidden="true"/>
    <span className="stage-star star-a" aria-hidden="true">✳</span><span className="stage-star star-b" aria-hidden="true">✧</span>
    <span className="stage-coin" aria-hidden="true"><Image src="/brand/monad/Logomark.svg" alt="" width={55} height={55}/></span>
    <span className="stage-sticker sticker-gm">gmonad<span aria-hidden="true"> ☺</span></span>
    <Image className="hero-monanimal" src="/brand/monad/molandak-cute.png" alt="Molandak" width={480} height={480} priority/>
    <span className="coffee-sticker" aria-hidden="true">☕<span>+1 GOOD DAY</span></span>
    <div className="checker-floor" aria-hidden="true"/>
    <div className="stage-ticket"><span><strong>{t('잡아봐','CATCH IT.')}</strong><small>{t('18초 · 3번의 캐치','18 SECONDS · 3 CATCHES')}</small></span><span className="round-arrow" aria-hidden="true">↗</span></div>
    <span className="stage-no-payout">{t('보상 없는 연습','JUST FOR FUN · NO PAYOUT')}</span>
   </Link>
  </section>
  <div className="culture-strip" aria-hidden="true"><span>PLAY A LITTLE</span><span>✳</span><span>GMONAD</span><span>✳</span><span>DROP SOME JOY</span><span>✳</span><span>STAY PLAYFUL</span><span>✳</span><span>PLAY A LITTLE</span></div>
  <section className="play-section" id="play">
   <div className="section-heading"><div><p className="eyebrow">{t('짧게 놀고, 오래 기억하기','SMALL GAMES. BIG GROUP-CHAT ENERGY.')}</p><h2>{t('오늘은 뭐 하고 놀까?','Pick your play.')}</h2></div><p>{t('두 가지 플레이. 같은 좋은 바이브.','Two ways in. Same good energy.')}</p></div>
   <div className="play-grid">
    <Link href="/practice" className="play-card catch-card"><div className="play-card-top"><span className="game-number">01 / {t('순발력 테스트','QUICK HANDS')}</span><span className="pill">{t('18초','18 seconds')}</span></div><div className="card-visual catch-visual" aria-hidden="true"><span className="mini-orbit"/><span className="visual-cup">☕</span><span className="visual-star">✳</span><span className="tap-sticker">tap! tap! tap!</span></div><div className="play-card-bottom"><div><h3>{t('커피는 잡고 가야지.','Catch a little joy.')}</h3><p>{t('움직이는 커피를 세 번 잡아봐요.','Three catches. One very good coffee break.')}</p></div><span className="round-arrow" aria-hidden="true">↗</span></div></Link>
    <Link href="/practice?game=quiz" className="play-card quiz-card"><div className="play-card-top"><span className="game-number">02 / {t('우리 얼마나 알아?','BIG BRAIN ENERGY')}</span><span className="pill">{t('3문제','3 questions')}</span></div><div className="card-visual quiz-visual" aria-hidden="true"><span className="question-stack stack-back">?</span><span className="question-stack stack-front">?</span><span className="quiz-spark">✧</span><span className="quiz-check">✓</span></div><div className="play-card-bottom"><div><h3>{t('아는 만큼 즐거워.','Know it. Show it.')}</h3><p>{t('세 문제로 알아가는 우리 커뮤니티.','A three-question moment for your community.')}</p></div><span className="round-arrow" aria-hidden="true">↗</span></div></Link>
   </div>
   <p className="practice-disclosure">{t('여기서는 보상 없이 플레이를 체험해요. 실제 보상은 공개 이벤트의 조건을 따라요.','These are unpaid practice games. Rewards in published events follow the organizer’s rules.')}</p>
  </section>
  <section className="community-section">
   <div className="community-copy"><p className="eyebrow">{t('우리끼리의 순간을 더 특별하게','FOR YOUR PEOPLE, NOT JUST YOUR FEED.')}</p><h2>{t('참여할 이유를','Give them a reason')}<br/><span>{t('하나 더 만들어 봐.','to drop in.')}</span></h2><p>{t('AMA가 끝난 뒤, 새로운 소식을 나눌 때, 그냥 고마운 마음을 전할 때. 작은 플레이가 커뮤니티의 다음 이야기가 됩니다.','After the AMA. Before the big announcement. Or just to say thanks. A small game can become your community’s next shared story.')}</p><Link href="/creators" className="text-link">{t('운영자 도구 살펴보기','Explore creator tools')} <span aria-hidden="true">↗</span></Link></div>
   <ol className="community-steps"><li><span>01</span><div><h3>{t('우리만의 드롭 만들기','Make it yours.')}</h3><p>{t('게임, 수량, 보상 약속을 먼저 정해요.','Set the game, the count, and the reward promise.')}</p></div></li><li><span>02</span><div><h3>{t('링크 하나로 함께하기','Send the link.')}</h3><p>{t('텔레그램이든 단톡방이든, 사람들이 모인 곳으로.','Telegram, your group chat, wherever your people are.')}</p></div></li><li><span>03</span><div><h3>{t('즐거움의 끝까지 확인','Follow the good stuff.')}</h3><p>{t('조건과 지급 상태를 한곳에서 확인해요.','Clear rules and delivery status, all in one place.')}</p></div></li></ol>
  </section>
  <section className="closing-banner"><span className="closing-spark" aria-hidden="true">✳</span><div><p className="eyebrow">{t('좋은 커뮤니티에는 좋은 놀이가 필요해','GOOD COMMUNITIES DESERVE GOOD PLAY.')}</p><h2>{t('다음 드롭은, 너답게.','Your people. Your next drop.')}</h2></div><Link className="button button-lime" href="/dashboard/new">{t('드롭 만들기','Make a drop')}<span aria-hidden="true">↗</span></Link></section>
 </main>;
}
