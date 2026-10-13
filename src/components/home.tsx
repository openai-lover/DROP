'use client';
import {useEffect, useRef} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {useLanguage} from './shell';
import {useSession} from './session';

export function Home() {
  const {t} = useLanguage();
  const session = useSession();
  const story = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = story.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    const connect = () => {
      observer?.disconnect();
      delete root.dataset.motion;
      if (motion.matches) return;
      root.dataset.motion = 'ready';
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer?.unobserve(entry.target);
        }
      }, {threshold: 0.12, rootMargin: '0px 0px -24px 0px'});
      root.querySelectorAll('[data-reveal]').forEach(element => observer?.observe(element));
    };
    connect();
    motion.addEventListener('change', connect);
    return () => {observer?.disconnect(); motion.removeEventListener('change', connect); delete root.dataset.motion;};
  }, []);

  return <main className="quiet-home">
    <section className="drop-hero">
      <div className="drop-hero-copy">
        <h1>{t('작은 플레이.', 'Small games.')}<br/><span>{t('함께 나누는 보상.', 'Shared rewards.')}</span></h1>
        <p className="drop-hero-description">{t('커뮤니티 보상을 짧은 게임으로. 참여는 쉽게, 지급 확인은 명확하게.', 'Short games for community rewards. Easy to join, clear to follow.')}</p>
        <div className="actions"><Link className="button button-primary" href="/practice">{t('플레이 시작', 'Let’s play')} <span aria-hidden="true">↗</span></Link><Link className="button button-ghost" href="/creators">{t('드롭 만들기', 'Make a drop')}</Link></div>
        <p className="hero-footnote">{t('가입 없이 체험 · 연습 보상 없음', 'No signup to try · Practice has no payout')}</p>
      </div>
      <div className="hero-character">
        <span className="hero-aura" aria-hidden="true"/>
        <Image className="hero-monanimal" src="/brand/monad/molandak-cute.png" alt="Molandak" width={480} height={480} priority/>
        <span className="character-shadow" aria-hidden="true"/>
      </div>
    </section>

    <section className="scroll-story" id="how-it-works" ref={story} aria-labelledby="story-heading">
      <div className="story-intro" data-reveal>
        <p className="eyebrow">{t('우리 커뮤니티를 위한 작은 순간', 'A LITTLE MOMENT FOR YOUR PEOPLE')}</p>
        <h2 id="story-heading">{t('함께할 이유를, 하나 더.', 'One more reason to show up.')}</h2>
        <p>{t('AMA가 끝난 뒤에도, 새로운 소식을 전할 때도. 작은 플레이로 대화를 이어 가세요.', 'After the AMA. Before the announcement. Turn a small game into your community’s next shared moment.')}</p>
      </div>

      <div className="story-step" data-reveal>
        <div className="story-copy">
          <p className="story-number">01 <span aria-hidden="true">—</span> {t('만들기', 'CREATE')}</p>
          <h2>{t('보상 약속부터,', 'Your rules.')}<br/>{t('우리답게.', 'Your kind of reward.')}</h2>
          <p>{t('게임과 보상을 고르고 수량과 기한을 정해요. 약속을 먼저 준비한 뒤, 링크 하나로 초대하세요.', 'Choose a game and a reward. Fix the count and deadline, prepare the budget, then invite your community with one link.')}</p>
          <Link className="text-link" href="/creators">{t('운영자 도구 살펴보기', 'Explore creator tools')} <span aria-hidden="true">→</span></Link>
        </div>
        <div className="story-visual create-visual" aria-label={t('이벤트 설정 예시', 'Event setup preview')}>
          <p className="visual-caption">{t('이렇게 시작해요', 'START WITH A PROMISE')}</p>
          <div className="preview-note"><span className="preview-note-icon" aria-hidden="true">✳</span><h3>{t('AMA 뒤, 작은 즐거움', 'A little joy after the AMA')}</h3><p>{t('함께 즐기는 커피 잡기', 'A coffee catch for your people')}</p></div>
          <div className="preview-rule"><span>{t('게임', 'Game')}</span><strong>{t('잡아봐', 'Catch it')}</strong></div>
          <div className="preview-rule"><span>{t('보상 약속', 'Reward promise')}</span><strong>{t('고정 수량 · 정해진 기한', 'Fixed count · Clear deadline')}</strong></div>
          <p className="visual-disclaimer">{t('화면 예시 · 실제 이벤트 아님', 'Flow preview · Not a live event')}</p>
        </div>
      </div>

      <div className="story-step story-step-reverse" data-reveal>
        <div className="story-copy">
          <p className="story-number">02 <span aria-hidden="true">—</span> {t('플레이', 'PLAY')}</p>
          <h2>{t('이메일 하나로,', 'One email.')}<br/>{t('재미는 바로.', 'Straight to the fun.')}</h2>
          <p>{session.configured ? t('공개 이벤트에서는 이메일로 로그인해요. 지갑은 DROP 안에서 만들어져요. 별도 앱 없이, 게임에 집중하세요.', 'Sign in to a published event with email. Your wallet is created inside DROP. No extra wallet app, just a little play.') : t('보상 이벤트는 이메일 로그인으로 시작해요. 로그인 연결을 준비하는 동안, 가입 없이 게임부터 즐겨보세요.', 'Reward events start with email sign-in. While sign-in is being connected, try the games without an account.')}</p>
          <div className="story-game-links"><Link className="text-link" href="/practice">{t('커피 잡기 해보기', 'Try the catch game')} <span aria-hidden="true">→</span></Link><Link className="text-link quiz-card" href="/practice?game=quiz">{t('퀴즈 해보기', 'Try the quiz')} <span aria-hidden="true">→</span></Link></div>
        </div>
        <div className="story-visual play-visual" aria-label={t('18초 커피 잡기 게임 예시', '18-second coffee catch preview')}>
          <span className="visual-caption">{t('짧게 놀고, 함께 웃고', 'A LITTLE PLAY GOES A LONG WAY')}</span>
          <div className="quiet-game-scene" aria-hidden="true"><span className="quiet-game-ring"/><span className="quiet-coffee">☕</span><span className="quiet-game-pointer">↖</span></div>
          <h3>{t('세 번 잡으면, 성공.', 'Three catches. One happy moment.')}</h3>
          <p>{t('18초 커피 잡기 · 또는 3문제 퀴즈', 'An 18-second catch · Or a three-question quiz')}</p>
          <p className="visual-disclaimer">{t('연습 · 보상 없음', 'Practice · No payout')}</p>
        </div>
      </div>

      <div className="story-step" data-reveal>
        <div className="story-copy">
          <p className="story-number">03 <span aria-hidden="true">—</span> {t('보상 확인', 'RECEIVE')}</p>
          <h2>{t('즐거움의 끝에,', 'A reward to return to.')}<br/>{t('확인할 수 있는 보상.', 'A receipt to trust.')}</h2>
          <p>{t('게임 성공과 지급 완료는 달라요. 공개 이벤트에서 서버 검증을 통과한 보상은 실제 지급 확인 뒤 영수증으로 남아요.', 'Winning the game and receiving a reward are different. In published events, a verified reward gets a receipt only after payment is confirmed.')}</p>
          <Link className="text-link" href="/me/rewards">{t('내 보상 살펴보기', 'Explore my rewards')} <span aria-hidden="true">→</span></Link>
          <p className="story-fine-print">{t('Monad Testnet의 테스트 토큰에는 금전적 가치가 없습니다.', 'Monad Testnet tokens have no monetary value.')}</p>
        </div>
        <div className="story-visual receive-visual" aria-label={t('보상 지급 상태 흐름 예시', 'Reward delivery flow preview')}>
          <span className="visual-caption">{t('결과는, 명확하게', 'FOLLOW THE GOOD STUFF')}</span>
          <div className="receipt-symbol" aria-hidden="true">✓</div>
          <h3>{t('플레이에서 영수증까지.', 'From play to a receipt.')}</h3>
          <ol className="receipt-flow"><li><span className="flow-dot" aria-hidden="true"/>{t('게임 결과 검증', 'Play verified')}</li><li><span className="flow-dot" aria-hidden="true"/>{t('지급 상태 확인', 'Payment checked')}</li><li><span className="flow-dot" aria-hidden="true"/>{t('내 보상에서 다시 확인', 'Find it in My rewards')}</li></ol>
          <div className="receipt-network stage-coin"><Image src="/brand/monad/Logomark.svg" alt="" width={18} height={18}/><span>Monad Testnet</span></div>
          <p className="visual-disclaimer">{t('흐름 예시 · 실제 지급 기록 아님', 'Flow preview · Not a payment record')}</p>
        </div>
      </div>
    </section>

    <section className="quiet-closing">
      <p className="eyebrow">{t('우리끼리의 순간을 더 특별하게', 'FOR YOUR PEOPLE, NOT JUST YOUR FEED.')}</p>
      <h2>{t('다음 드롭은, 너답게.', 'Your people. Your next DROP.')}</h2>
      <p>{t('작은 플레이 하나로, 함께할 이유를 만들어 봐요.', 'Start with one little game. Make the moment yours.')}</p>
      <div className="actions"><Link className="button button-primary" href="/practice">{t('플레이 시작', 'Let’s play')} <span aria-hidden="true">↗</span></Link><Link className="button button-ghost" href="/dashboard/new">{t('드롭 만들기', 'Make a drop')}</Link></div>
    </section>
  </main>;
}
