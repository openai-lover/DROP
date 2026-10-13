# DROP — Metropolis 경쟁력 검토

**Final primary submission:** Consumer Products & Payments is **READY FOR JUDGING**, confirmed `2026-10-13T16:39:30.988Z` (Oct14 01:39 KST). No bounties were selected. Both actual quiz and catch payments are independently verified; these are same-human technical accounts, not traction. Optional Privy bounty consideration is separate. `acf5b73` identifies the deployed application baseline; later documentation/proof commits may advance public main.

업데이트: **2026-10-14, Asia/Seoul**. [실제 제품](https://drop-omega-five.vercel.app/)과 [공개 GitHub](https://github.com/openai-lover/DROP)를 심사자가 열 수 있다. 최신 공개 소스 application baseline acf5b73과 배포는 READY다. 실제 Google 로그인·WIF Firestore·운영자의 5 test USDC 입금에 이어 별도 참가자의 **퀴즈→QUEUED→Paid→0.1 test USDC와 영수증**까지 공개 앱에서 확인됐다. 독립 체인 검증도 실제 지급을 확인했다.

**실제 정산의 핵심 흐름은 연결됐다. 다음 경쟁력 증거는 독립 사용자의 경험과 심사자의 재현이다.** 공개 소스·계약·로그인·데이터·실제 퀴즈 지급과 재로그인까지 확인됐다. 충분한 기간의 Catch 이벤트도 실제 입금됐고 최종 demo/pitch는 업로드됐다. 독립 사용자 연구와 영상의 signed-out 재생은 아직 확인 전이다. 아래 판단은 공식 기준과 현재 증거를 비교한 것이며 수상 확률·예상 점수가 아니다.

개발자는 **솔로 개발자 Gyu-min Kim**이다. 사용자는 준비 후 제출을 승인했고 이전 보류는 대체됐다. [X](https://x.com/AlphaGgang), SLIME CEO! 업로드 채널과 개발자 이름을 구분한다. [데모155.32초](https://youtu.be/Lfuvsvowj30)·[피치107.94초](https://youtu.be/AlWM6csYk5w)는 Unlisted watch 일부 재생을 확인했다. signed-out 검증은 요장하지 않는다. 포털6/6을16:29UTC에 저장했고 실제 Catch/접근 안내를16:35UTC에 추가 저장했다. 최종 Consumer 접수는16:39:30.988UTC에 READY FOR JUDGING으로 확인됐으며 Best Community는 근거 없어 해제됐다. 유료 전환·메인넷은 범위 밖이다.

## 공식 기준

대회 기준은2026-10-13에 읽은 공식 Consumer 페이지와 로그인 제출 양식에 근거한다. 이번 문서 업데이트에서 포털을 다시 읽었다고 요장하지 않는다. [기준·접근 범위 기록](OFFICIAL_SOURCES.md), [공식 트랙](https://hackathon.monad.xyz/tracks/consumer-payments), [제출 양식](https://hackathon.monad.xyz/project?tab=submission).

| 항목 | 비중 | DROP의 강점 | 아직 필요한 증거 |
| --- | --- | --- | --- |
| Technical Execution |20%| 실제 Testnet 계약·소스 perfect 검증, 로그인·WIF, 입금·퀴즈·0.1 test USDC 지급과 정규 확정 영수증 | 후속 전송·회수·복구 등의 추가 제품 검증; 실제 정산 영상 |
| Design & Craft |20%| Monad arcade, 영어 기본과5개 언어, 모바일/키보드/터치·명확한 상태, 실제 Google 로그인 | 비암호화폐 독립 사용자가 도움 없이 지급 핵심 흐름을 끝내는 관찰 |
| Originality & Track Insight |15%| 짧은 게임→예산이 확보된 약속→보관 가능한 영수증→후속 전송의 연결 | 그 연결이 실제 정산에서 제공하는 이점을 실사용으로 보여요기 |
| Founder & Market Readiness |25%| Telegram KOL·커뮤니티 운영자라는 구체적 대상과 이벤트 설계 | 실제 운영자의 최근 문제·재사용/지불 의향, 확인 가능한 창업자 배경 |
| Traction & Path Forward |20%| 작은 실험을 위한 양식과 다음100명 확보 계획 | 실제 참가자 연구·운영자 반복 사용·채널별 유입 관찰 |

Founder/Market와 Traction은 합쳐45%다. 디자인·테스트 수가 그 비중의 실제 사람·시장 증거를 대신하지 않는다. 공식 기준은 다섯 친구 수준의 작은 실제 연구도 인정하지만, 생성된 인터뷰나 빈 설문은 연구 결과가 아니다. [공식 Consumer 기준](https://hackathon.monad.xyz/tracks/consumer-payments).

## 확인된 제품 강점

DROP은 운영자가 게임·수량·기한·보상을 고정하고 예산을 넣은 뒤 링크로 배포하는 도구다. 참가자는 한 번의 Privy 로그인과 임베디드 지갑으로 참여한다. FIRST_N_VERIFIED는 게임 점수를 그대로 믿지 않고 서버가 검증한 완료를 Firestore 트랜잭션으로 배정한다. 성공·예약·리리 중·실제 지급 확정을 구분하므로 참여자는 점수와 돈의 상태를 혼동하지 않는다.

실제 Monad Testnet 에스크로 **0x22acf105A1af3f104f62e06fD813e49Af9358379**는 정규 확정 영수증·런타임·불변 설정을 확인했고 Sourcify의 **perfect** 소스 일치를 얻었다. 운영자는 보이는 Privy 승인 두 번을 거쳐 **5 test USDC = 0.1 × 50**을 실제 입금했다. 독립 조회도 정확한 규칙·이벤트·상태와 운영자 USDC 10→5·계약 0→5를 검증했다. 이후 참가자가 퀴즈를 통과해 **0.1 test USDC**를 받고 앱의 **Paid/영수증**을 확인했다. 독립 검증은 정규 확정 영수증·EIP-712 signer·RewardPaid/Circle Transfer·claimed 상태, 참가자 USDC **0→0.1**과 MON **0→0**, nonce **0**을 확인했다. 실제 릴레이어 지급 수수료는 **0.043855716 test MON**이다. [실제 지급 기록](../contracts/deployment/live-participant-payment.public.json), [입금 기록](../contracts/deployment/live-campaign-funding.public.json), [소스 일치](https://sourcify-api-monad.blockvision.org/check-by-addresses?addresses=0x22acf105A1af3f104f62e06fD813e49Af9358379&chainIds=10143).

현재 운영자·참가자 계정은 한 사람이 제어하는 기술 검증용 두 계정이다. 실제 서비스 연결을 보여요지만 독립 사용자 두 명이나 traction으로 세지 않는다.

참가자의 새로고침과 실제 로그아웃/Google 재로그인 모두 Paid와0.1test USDC를 유지했다. 재참여는 “This account or wallet already has a reward.”로 거부돼 두 번째 보상이 생기지 않았다. 기술 계정의 지속성·중복 방지 증거이며 독립 사용자 연구는 아니다.

별도 [심사용 Catch](https://drop-omega-five.vercel.app/d/metropolis-play)는 **20×0.1=2test USDC**를 실제 입금하고16:33UTC에 열렸다. 기술 참가자는 첫3keyboard catches에 성공해 두 번째 Paid/0.1을 받았고 실제 총잔액0.2가 표시됐다. 확인 후19/20배정이 남았다. 독립 catch-payment 검증도 통과했다. 종료10월20일16:18UTC(21일01:18KST), 수령27일16:18UTC. [입금 증거](../contracts/deployment/judge-event-funding.public.json), [실제 catch 거래](https://testnet.monadvision.com/tx/0xbd8d5ce90d6d059931f19050744b546567215f337532a59fa8a481fe4d15ce6e).

보상 지급 엔진은 서명된 거래·nonce·임대·복구 위치를 Firestore에 남기고, 이미 알려진 영수증과 확정 체인 상태부터 확인한다. 정확한 RewardPaid 이벤트와 정규 확정 영수증 없이는 지급 완료를 만들지 않는다. 실제 Google 로그인과 서버 JWT/profile 검증, WIF의 Firestore 쓰기·조회 및 실제 잔액 읽기도 최신 배포에서 확인됐다. 개인 프로필·로그인 지갑은 공개 증거에 넣지 않는다.

무료 범위의 운용은 작은 파일럿에 맞춘다. Vercel Hobby의 인증 요청 후 리리에는 한 번에 최대 1작업, 하루 1회 복구에는 최대 3작업과 3만료 점검을 둔다. **요청 기반 리리기는 이번 실제 지급을 완료했다.** 데이터와 작업은 지속 저장되지만 실행은 요청·일일 호출에 의존한다. 매분 가동되는 독립 worker가 아니며 일일 cron과 실제 장애/재시작 복구는 아직 관찰 전이다. Firebase Spark의 Functions는 배포되지 않았다. [정확한 운용 한도](FIREBASE_VERCEL.md).

수령은 제한된 릴레이어의 MON 예산으로 리리한다. 운영자 입금·회수와 사용자의 외부 USDC 전송은 취소 가능한 지갑 승인을 거치고, 진짜 sponsorship을 별도 설정하지 않았다면 본인 지갑의 test MON이 필요하다. 전 과정이 항상 무료라는 요장은 하지 않는다.

## 테스트를 읽는 방법

| 증거 | 실제 범위 |
| --- | --- |
|96개 서버/언어 테스트 + 추가 지갑 요청3개 통과| 실제 Firestore emulator26사례 포함. 체인 응답·시험 JWT·지갑 SDK는 명시된 테스트 어댑터 |
|계약42unit/fuzz +2invariant 속성| 공식 Forge1.8.5/Monad 실행 설정; 로컬 토큰 fixture |
|실제 로컬 체인/worker 통합2사례| Anvil·Firestore·운영용 서명/영수증 코드; 격리된31337체인·모의 토큰 |
|이전 공개 요소48브라우저 통과/6의도적 생략| 이전35ad6d7배포의 무보상 연습·언어·모바일·비공개 API 경계 |
|최신 UI20E2E +20언어/폭 조합| 로컬 Chromium의 새 카피·CTA·5언어×360/390/768/1440; 가로 넘침·runtime 오류 없음 |
|최신 실제 production 직접 검증| 운영자 로그인·입금, 별도 참가자 로그인·퀴즈·QUEUED·실제 Paid/0.1 test USDC/영수증; 독립 체인 확인 |

테스트 횟수는 사용자 수나 공개 지급 건수가 아니다. 실제 공개 지급은 위 기술 검증 1건이며 50명 모두 지급했다는 뜻이 아니다. 최신 전체 hosted 회귀검사와 실제 기기 연구는 별도 항목이다. 브라우저 에뮬레이션은 실제 iOS Safari·Android·Telegram 내부 브라우저 사용과 다르다. [현재 통합 상태](INTEGRATION_STATUS.md), [로컬 체인 검증](LOCAL_CHAIN_VERIFICATION.md).

## 제출물과 자격

| 제출물 | 기록된 공식 요건 | 현재 상태 |
| --- | --- | --- |
|제품 URL| 실제 Monad Mainnet 또는 Testnet 제품과 필요한 접근 안내 | 진짜 로그인·funding·quiz·Paid/영수증 완료; 지속 judge 접근 안내 마무리 |
|소스| 공개 GitHub, `metropolis@hackathon.monad.xyz` 접근 | application baseline acf5b73 공개 완료; 이전403 해결 |
|기술 데모| 실제 제품≤3분, YouTube/Loom/Vimeo | quiz/funding/Paid155.32초 [Unlisted](https://youtu.be/Lfuvsvowj30); watch 일부 재생 확인 |
|피치| 팀·문제·이유≤2분 | Gyu-min Kim solo107.94초 [Unlisted](https://youtu.be/AlWM6csYk5w); watch 일부 재생 확인 |
|로고| 트랙≤3MB; 실제 양식 PNG/JPG/WEBP≤2MB,500–2000px | purple PNG1200×600/1024×1024 픽셀·해시 확인; square 업로드/표시/저장 완료 |
|선택 광고|≤30초, 심사 대상 아님 | 미완료; 필수 demo/pitch보다 후순위 |

실제 양식이 더 엄격하므로 로고에는2MB/500–2000px조건을 적용한다. 현재 파일과 제출 체크는 [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md)에 기록했다. 공개 FAQ의 일반적인 오픈소스 권장과 개별 Consumer의 공개 저장소 요구를 구분한다. 소스 공개가 자동으로 별도 공개 라이선스를 부여하지는 않는다. [공식 Consumer](https://hackathon.monad.xyz/tracks/consumer-payments), [제출 양식](https://hackathon.monad.xyz/project?tab=submission).

Consumer 선택은 기존 포털에서 확인됐다. Best Community는 캠퍼스 그룹 증거가 없어 선택 해제하고 저장했다. 일반 커뮤니티 제품이라는 사실만으로 해당 바운티 자격이 생기지 않는다. Privy 바운티 역시 로그인 이외의 기능과 설명을 요구하며 완료된 신규 선택은 아직 기록되지 않았다. [Community 조건](https://hackathon.monad.xyz/tracks/best-community-team-project), [Privy 조건](https://hackathon.monad.xyz/tracks/privy).

기록된 구체적 마감은 **2026-10-14 12:59GMT+9 /Asia/Seoul (03:59UTC)**다. 공개 소개에는 심사10월14–27일, 발표11월3일이 있으며 두 일정의 시간대는 명시되지 않았다. Consumer 본상은3팀 각$10,000, Grand Champion은$25,000이다. 광고의$250,000+에는 서비스 혜택도 포함되므로 모두 현금으로 읽지 않는다. [공식 일정·상금·FAQ](https://monad.xyz/developers/hackathons/metropolis?utm_source=luma).

## 마무리 우선순위

1. **완료된 실제 지급을 심사자가 재현할 수 있게 한다.** quiz와Catch 모두 실제 Paid이며 재로그인·영수증·총잔액0.2를 확인했다. 독립 catch proof도 통과했으므로 저장된 접근 안내를 유지한다. 남은 refund 등 기능을 별도 필수 제출물로 부풀리지 않는다.
2. **실제 사람과 운영자의 증거를 남긴다.** 최소5명의 독립 참여에서 도움 여부·막힘·완료 시간·보상 이해를 관찰한다. 최근 보상 이벤트를 진행한 운영자의 과정과 재사용 의사를 확인한다. 연락·연구가 실제로 이루어지기 전에는 가상 인터뷰·파트너·전환율을 쓰지 않는다.
3. **심사자가 확인할 패키지를 마무리한다.** 최종 demo/pitch 파일·길이·업로드 URL은 준비됐다. 리리 완료·signed-out 재생을 확인하고 새 영어 소개/GTM/access를 저장한 뒤 현재 승인에 따라 포털을 검증·제출하고 영수증을 기록한다.

Monad 브랜딩과5언어는 첫인상과 사용성을 돕는 개선이다. 공식 후원·제휴나 별도 가산점으로 표현하지 않는다. 실제 지급과 사람의 사용 증거가 이 디자인을 경쟁력 있는 Consumer 출품작으로 연결할 것이다.
