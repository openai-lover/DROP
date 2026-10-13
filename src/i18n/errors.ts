import { TRANSLATIONS, type Locale } from './catalog';

// Exact service messages only. Server codes, status codes, and unknown error text stay unchanged.
// Tuple order: Korean, Japanese, simplified Chinese, Spanish.
const API_ERRORS: Readonly<Record<string, readonly [string, string, string, string]>> = {
  'Service connections for this feature are not configured yet.': ['이 기능을 위한 서비스 연결이 아직 완료되지 않았습니다.', 'この機能に必要なサービスの接続設定がまだ完了していません。', '此功能所需的服务连接尚未配置完成。', 'Las conexiones de servicio para esta función aún no están configuradas.'],
  'Please check your input.': ['입력 내용을 확인해 주세요.', '入力内容を確認してください。', '请检查输入内容。', 'Revisa los datos introducidos.'],
  'We could not process your request. Please try again shortly.': ['요청을 처리하지 못했습니다. 잠시 후 다시 확인해 주세요.', 'リクエストを処理できませんでした。少し待ってから再試行してください。', '无法处理请求，请稍后重试。', 'No pudimos procesar tu solicitud. Inténtalo de nuevo en unos momentos.'],
  'We could not process your request.': ['요청을 처리하지 못했습니다.', 'リクエストを処理できませんでした。', '无法处理请求。', 'No pudimos procesar tu solicitud.'],
  'Not found.': ['찾을 수 없습니다.', '見つかりません。', '未找到。', 'No se ha encontrado.'],
  'Request content is too large.': ['요청 내용이 너무 큽니다.', 'リクエストの内容が大きすぎます。', '请求内容过大。', 'El contenido de la solicitud es demasiado grande.'],
  'Invalid request content.': ['요청 내용이 올바르지 않습니다.', 'リクエストの内容が無効です。', '请求内容无效。', 'El contenido de la solicitud no es válido.'],
  'Campaign not found.': ['캠페인을 찾을 수 없습니다.', 'キャンペーンが見つかりません。', '未找到活动。', 'No se ha encontrado la campaña.'],
  'This event is not published.': ['이 이벤트는 아직 게시되지 않았습니다.', 'このイベントはまだ公開されていません。', '此活动尚未发布。', 'Este evento aún no está publicado.'],
  'Start at least one minute from now and choose valid event and receipt deadlines within 30 days.': ['시작은 현재보다 1분 이후로, 참여와 수령 기한은 각각 30일 이내의 올바른 순서로 설정해 주세요.', '開始は現在より1分以上後にし、参加期間と受け取り期限をそれぞれ30日以内で正しく設定してください。', '开始时间至少晚于当前1分钟，并按顺序设置各自不超过30天的活动及领取期限。', 'Fija el inicio al menos un minuto después de ahora y plazos válidos de participación y recepción, cada uno dentro de 30 días.'],
  'Provide exactly three quiz questions.': ['퀴즈는 정확히 세 문제를 작성해 주세요.', 'クイズは3問ちょうど入力してください。', '请提供正好3道问答题。', 'Introduce exactamente tres preguntas.'],
  'Catch events do not accept quiz answers.': ['잡기 이벤트에는 퀴즈 답안을 등록할 수 없습니다.', 'キャッチイベントにはクイズの回答を登録できません。', '抓取活动不接受问答答案。', 'Los eventos de captura no aceptan respuestas de cuestionarios.'],
  'Reward amount must be greater than zero.': ['보상 금액은 0보다 커야 합니다.', '報酬の金額は0より大きくしてください。', '奖励金额必须大于0。', 'La cantidad de la recompensa debe ser mayor que cero.'],
  'That event link is already in use.': ['이미 사용 중인 이벤트 주소입니다.', 'そのイベントURLは使用済みです。', '该活动链接已被使用。', 'Ese enlace de evento ya está en uso.'],
  'This event belongs to another escrow deployment.': ['이 이벤트는 다른 보상 계약에 연결되어 있습니다.', 'このイベントは別の報酬契約に紐づいています。', '此活动属于另一个托管合约部署。', 'Este evento pertenece a otro contrato de depósito.'],
  'Only an unfunded USDC event can be funded.': ['아직 입금하지 않은 USDC 이벤트에만 예산을 입금할 수 있습니다.', '未入金のUSDCイベントにのみ入金できます。', '只有尚未入金的USDC活动可以存入预算。', 'Solo se pueden depositar fondos en un evento USDC que aún no esté financiado.'],
  'Provide a valid funding transaction.': ['올바른 입금 거래를 입력해 주세요.', '有効な入金取引を入力してください。', '请提供有效的入金交易。', 'Introduce una transacción de depósito válida.'],
  'This event cannot accept funding confirmation.': ['이 이벤트에서는 입금 확인을 처리할 수 없습니다.', 'このイベントでは入金確認を受け付けられません。', '此活动无法接受入金确认。', 'Este evento no admite la confirmación de un depósito.'],
  'Funding is not confirmed yet.': ['예산 입금이 아직 확인되지 않았습니다.', '入金はまだ確認されていません。', '预算入金尚未确认。', 'El depósito aún no está confirmado.'],
  'The deployed budget and rules do not match this event.': ['배포된 계약의 예산과 규칙이 이 이벤트와 일치하지 않습니다.', '契約の予算と規則がこのイベントと一致しません。', '已部署的预算和规则与此活动不符。', 'El presupuesto y las reglas del contrato no coinciden con este evento.'],
  'The expected deposit is absent from this transaction.': ['이 거래에서 예상한 입금 기록을 찾지 못했습니다.', 'この取引に必要な入金記録がありません。', '该交易中没有预期的入金记录。', 'Esta transacción no contiene el depósito esperado.'],
  'This event has already been published.': ['이미 게시된 이벤트입니다.', 'このイベントはすでに公開されています。', '此活动已发布。', 'Este evento ya está publicado.'],
  'Only draft coupon events accept inventory.': ['초안 상태의 쿠폰 이벤트에만 재고를 등록할 수 있습니다.', '下書きのクーポンイベントにのみ在庫を登録できます。', '只有草稿状态的优惠券活动可登记库存。', 'Solo los eventos de cupones en borrador aceptan inventario.'],
  'Coupons must remain valid past the receipt deadline.': ['쿠폰 유효기간은 수령 기한보다 이후여야 합니다.', 'クーポンの有効期限は受け取り期限より後にしてください。', '优惠券有效期必须晚于领取截止时间。', 'Los cupones deben seguir vigentes después del plazo de recepción.'],
  'Duplicate coupon references are not allowed.': ['쿠폰 식별번호는 중복될 수 없습니다.', 'クーポンの管理番号は重複できません。', '优惠券识别编号不可重复。', 'No se permiten referencias de cupones duplicadas.'],
  'Inventory is locked.': ['쿠폰 재고가 잠겨 있습니다.', 'クーポン在庫は固定されています。', '优惠券库存已锁定。', 'El inventario está bloqueado.'],
  'Inventory exceeds the fixed reward quantity.': ['재고가 확정된 보상 수량을 초과합니다.', '在庫が確定した報酬の数量を超えています。', '库存超过固定奖励数量。', 'El inventario supera la cantidad fijada de recompensas.'],
  'A coupon reference is already registered.': ['이미 등록된 쿠폰 식별번호입니다.', 'そのクーポン管理番号は登録済みです。', '该优惠券识别编号已登记。', 'Esa referencia de cupón ya está registrada.'],
  'This event cannot be published this way.': ['이 방식으로는 이벤트를 게시할 수 없습니다.', 'この方法ではイベントを公開できません。', '此活动无法通过该方式发布。', 'Este evento no se puede publicar de esta manera.'],
  'Import the full promised coupon quantity before publishing.': ['게시 전 약속한 전체 수량의 쿠폰을 등록해 주세요.', '公開前に約束した数量のクーポンをすべて登録してください。', '发布前请导入承诺的全部优惠券数量。', 'Importa todos los cupones prometidos antes de publicar.'],
  'Event not found.': ['이벤트를 찾을 수 없습니다.', 'イベントが見つかりません。', '未找到活动。', 'No se ha encontrado el evento.'],
  'This event is not accepting attempts.': ['현재 참여할 수 없는 이벤트입니다.', 'このイベントは現在参加を受け付けていません。', '此活动当前不接受参与。', 'Este evento no acepta intentos en este momento.'],
  'All rewards have been reserved.': ['모든 보상이 예약되었습니다.', 'すべての報酬が予約済みです。', '全部奖励已预留。', 'Todas las recompensas están reservadas.'],
  'This account or wallet already has a reward.': ['이 계정 또는 지갑에는 이미 보상이 배정되었습니다.', 'このアカウントまたはウォレットには報酬が割り当てられています。', '该账户或钱包已分配奖励。', 'Esta cuenta o cartera ya tiene una recompensa.'],
  "You have used this event's allowed attempts.": ['이 이벤트의 허용된 시도 횟수를 모두 사용했습니다.', 'このイベントで許可された挑戦回数を使い切りました。', '你已用完该活动允许的尝试次数。', 'Has agotado los intentos permitidos en este evento.'],
  'Campaign privacy configuration is invalid.': ['캠페인 개인정보 보호 설정이 올바르지 않습니다.', 'キャンペーンのプライバシー設定が無効です。', '活动隐私配置无效。', 'La configuración de privacidad de la campaña no es válida.'],
  'Attempt not found.': ['참여 기록을 찾을 수 없습니다.', '挑戦の記録が見つかりません。', '未找到尝试记录。', 'No se ha encontrado el intento.'],
  'This attempt has already been checked.': ['이미 검증한 참여 기록입니다.', 'この挑戦は確認済みです。', '该次尝试已验证。', 'Este intento ya se ha verificado.'],
  'This attempt could not be verified.': ['참여 기록을 검증하지 못했습니다.', 'この挑戦を確認できませんでした。', '无法验证本次尝试。', 'No se pudo verificar este intento.'],
  'Quiz grading is unavailable.': ['퀴즈 채점을 사용할 수 없습니다.', 'クイズの採点を利用できません。', '问答评分暂不可用。', 'La evaluación del cuestionario no está disponible.'],
  'Reward details are unavailable.': ['보상 상세 정보를 사용할 수 없습니다.', '報酬の詳細を利用できません。', '奖励详情暂不可用。', 'Los detalles de la recompensa no están disponibles.'],
  'This coupon is unavailable for your account.': ['이 계정으로는 해당 쿠폰을 열 수 없습니다.', 'このアカウントではこのクーポンを開けません。', '你的账户无法访问此优惠券。', 'Este cupón no está disponible para tu cuenta.'],
  'Reward not found.': ['보상을 찾을 수 없습니다.', '報酬が見つかりません。', '未找到奖励。', 'No se ha encontrado la recompensa.'],
  'This reward is no longer payable.': ['이 보상은 더 이상 지급할 수 없습니다.', 'この報酬はもう支払えません。', '此奖励已无法支付。', 'Esta recompensa ya no se puede pagar.'],
  'The durable reward authorization is not available yet.': ['저장된 보상 승인 증명을 아직 사용할 수 없습니다.', '保存された報酬の承認証明はまだ利用できません。', '已保存的奖励授权暂不可用。', 'La autorización de recompensa guardada aún no está disponible.'],
  'No on-chain authorization exists for this reward.': ['이 보상에는 체인 지급 승인 증명이 없습니다.', 'この報酬にはチェーン上の支払い承認がありません。', '此奖励没有链上支付授权。', 'No existe una autorización en cadena para esta recompensa.'],
  'Unused funds are recoverable only after the receipt deadline.': ['남은 예산은 수령 기한이 지난 뒤에만 회수할 수 있습니다.', '未使用の資金は受け取り期限後にのみ回収できます。', '领取期限过后才能回收未使用资金。', 'Los fondos no utilizados solo se pueden recuperar tras el plazo de recepción.'],
  'Provide a valid refund transaction.': ['올바른 회수 거래를 입력해 주세요.', '有効な回収取引を入力してください。', '请提供有效的回收交易。', 'Introduce una transacción de recuperación válida.'],
  'Recovery has not been confirmed.': ['예산 회수가 아직 확인되지 않았습니다.', '予算の回収はまだ確認されていません。', '预算回收尚未确认。', 'La recuperación aún no se ha confirmado.'],
  'The expected recovery settlement could not be verified.': ['예상한 예산 회수 정산을 확인하지 못했습니다.', '必要な予算回収の決済を確認できませんでした。', '无法验证预期的预算回收结算。', 'No se pudo verificar la liquidación esperada de la recuperación.'],
  'Quiz not found.': ['퀴즈를 찾을 수 없습니다.', 'クイズが見つかりません。', '未找到问答。', 'No se ha encontrado el cuestionario.'],
  'Answers are released after this event ends.': ['정답은 이 이벤트가 끝난 후 공개됩니다.', '正解はこのイベントの終了後に公開されます。', '答案将在此活动结束后公开。', 'Las respuestas se publican cuando termina este evento.'],
  'Please sign in to continue.': ['계속하려면 로그인해 주세요.', '続けるにはログインしてください。', '请登录后继续。', 'Inicia sesión para continuar.'],
  'Your sign-in session could not be verified. Please sign in again.': ['로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.', 'ログイン状態を確認できませんでした。もう一度ログインしてください。', '无法验证登录会话，请重新登录。', 'No se pudo verificar tu sesión. Inicia sesión de nuevo.'],
  'This wallet is already linked to another account.': ['이미 다른 계정에 연결된 지갑입니다.', 'このウォレットは別のアカウントに紐づいています。', '此钱包已关联其他账户。', 'Esta cartera ya está vinculada a otra cuenta.'],
  'Your account wallet is still being created. Please retry when it is ready.': ['계정 지갑을 만들고 있습니다. 준비되면 다시 시도해 주세요.', 'アカウントのウォレットを作成中です。準備ができてから再試行してください。', '正在创建账户钱包，请准备好后重试。', 'Tu cartera se está creando. Vuelve a intentarlo cuando esté lista.'],
  'The provider has not supplied a finalized block.': ['네트워크 공급자가 확정 블록을 아직 제공하지 않았습니다.', 'ネットワーク提供元から確定ブロックがまだ提供されていません。', '网络服务商尚未提供最终确认区块。', 'El proveedor aún no ha facilitado un bloque finalizado.'],
  'Network, escrow and official USDC deployment could not be verified.': ['네트워크, 보상 계약, 공식 USDC 배포를 검증하지 못했습니다.', 'ネットワーク、報酬契約、公式USDCの配備を確認できませんでした。', '无法验证网络、托管合约和官方USDC部署。', 'No se pudieron verificar la red, el contrato de depósito y el USDC oficial.'],
  'The transaction does not contain the expected settlement.': ['이 거래에 예상한 정산 기록이 없습니다.', 'この取引に必要な決済記録がありません。', '此交易不含预期的结算记录。', 'La transacción no contiene la liquidación esperada.'],
  'The contract has not confirmed this reward.': ['계약에서 이 보상을 아직 확인하지 않았습니다.', '契約はこの報酬をまだ確認していません。', '合约尚未确认此奖励。', 'El contrato aún no ha confirmado esta recompensa.'],
  'Only the configured Monad network is supported.': ['설정된 Monad 네트워크만 지원합니다.', '設定されたMonadネットワークのみ対応しています。', '仅支持已配置的Monad网络。', 'Solo se admite la red Monad configurada.'],
  'A deployed reward escrow address is required.': ['배포된 보상 계약 주소가 필요합니다.', '配備済みの報酬契約アドレスが必要です。', '需要已部署的奖励托管合约地址。', 'Se necesita la dirección de un contrato de recompensas desplegado.'],
  'Mainnet actions have not been enabled.': ['메인넷 기능이 활성화되지 않았습니다.', 'メインネットの操作は有効になっていません。', '主网操作尚未启用。', 'Las acciones en la red principal no están activadas.'],
  'Authorization signer configuration is invalid.': ['승인 서명자 설정이 올바르지 않습니다.', '承認署名者の設定が無効です。', '授权签名者配置无效。', 'La configuración del firmante de autorizaciones no es válida.'],
  'Relayer configuration is invalid.': ['지급 전송 설정이 올바르지 않습니다.', '支払い送信の設定が無効です。', '支付中继配置无效。', 'La configuración del relé de pagos no es válida.'],
  'Authorization signer and relayer must use separate keys.': ['승인 서명자와 지급 전송자는 서로 다른 키를 사용해야 합니다.', '承認署名者と支払い送信者は別々の鍵を使用してください。', '授权签名者与支付中继必须使用不同密钥。', 'El firmante de autorizaciones y el relé deben usar claves distintas.'],
  'A valid wallet address is required.': ['올바른 지갑 주소가 필요합니다.', '有効なウォレットアドレスが必要です。', '需要有效的钱包地址。', 'Se necesita una dirección de cartera válida.'],
  'Coupon encryption must use a 32-byte hex key.': ['쿠폰 암호화에는 32바이트 16진수 키가 필요합니다.', 'クーポンの暗号化には32バイトの16進数鍵が必要です。', '优惠券加密需要32字节十六进制密钥。', 'El cifrado de cupones requiere una clave hexadecimal de 32 bytes.'],
  'Coupon content could not be opened.': ['쿠폰 내용을 열지 못했습니다.', 'クーポンの内容を開けませんでした。', '无法打开优惠券内容。', 'No se pudo abrir el contenido del cupón.'],
  'The local database emulator is not allowed in this deployment.': ['이 배포에서는 로컬 데이터베이스 에뮬레이터를 사용할 수 없습니다.', 'この配備ではローカルデータベースのエミュレーターを利用できません。', '此部署不允许使用本地数据库模拟器。', 'Este despliegue no permite usar el emulador local de base de datos.'],
  'Hosted deployments cannot use a local database emulator.': ['호스팅된 배포에서는 로컬 데이터베이스 에뮬레이터를 사용할 수 없습니다.', 'ホスティング環境ではローカルデータベースのエミュレーターを利用できません。', '托管部署无法使用本地数据库模拟器。', 'Los despliegues alojados no pueden usar un emulador local de base de datos.'],
  'Too many requests. Please wait and try again.': ['요청이 너무 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.', 'リクエストが多すぎます。少し待ってから再試行してください。', '请求过多，请稍等后重试。', 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.'],
  'Wallet integration is not configured.': ['지갑 연결 설정이 완료되지 않았습니다.', 'ウォレットの接続設定が完了していません。', '钱包连接尚未配置。', 'La conexión con la cartera no está configurada.'],
  'Your wallet is getting ready.': ['지갑을 준비 중입니다.', 'ウォレットを準備中です。', '正在准备钱包。', 'Tu cartera se está preparando.'],
  'Gas sponsorship is not configured yet.': ['가스 대납 설정이 아직 완료되지 않았습니다.', 'ガス代の代納設定がまだ完了していません。', 'Gas代付尚未配置。', 'El patrocinio del gas aún no está configurado.'],
  'Authentication and wallet configuration are required.': ['로그인과 지갑 설정이 필요합니다.', 'ログインとウォレットの設定が必要です。', '需要配置登录和钱包。', 'Se necesita configurar la autenticación y la cartera.'],
  'Final settlement is still pending. Check the transaction record and refresh.': ['최종 정산을 확인 중입니다. 거래 기록을 확인하고 새로고침해 주세요.', '最終決済はまだ確認中です。取引記録を確認し、更新してください。', '最终结算仍待确认。请查看交易记录并刷新。', 'La liquidación final sigue pendiente. Consulta el registro de la transacción y actualiza.'],
};

const CLIENT_ERRORS: Readonly<Record<string, string>> = {
  'Check the event owner and Monad Testnet wallet.': '이벤트 소유자와 Monad Testnet 지갑을 확인해 주세요.',
  'Funding failed. Check the transaction record.': '예산 준비 거래가 실패했습니다. 거래 기록을 확인해 주세요.',
  'Only Monad Testnet recovery is supported.': 'Monad Testnet 회수만 지원합니다.',
  'Recovery failed.': '회수 거래가 실패했습니다.',
  'Confirm your right to distribute these coupons.': '쿠폰 배포 권한을 확인해 주세요.',
  'Import at most 100 coupons per batch.': '한 번에 최대 100개를 등록할 수 있습니다.',
  'Copying failed. Copy the address below manually.': '링크를 복사하지 못했습니다. 아래 주소를 직접 복사해 주세요.',
  'The play window has ended. Retries follow the published attempt limit.': '참여 시간이 끝났습니다. 재시도는 사전 규칙의 허용 횟수 안에서 가능합니다.',
  'Choose a PNG, JPEG or WEBP image under 200 KB.': 'PNG/JPEG/WEBP, 200KB 이하의 이미지를 선택해 주세요.',
  'The image could not be read. Choose another file.': '이미지를 읽지 못했습니다. 다른 파일을 선택해 주세요.',
  'Check the title, organizer, description and lowercase event address.': '제목·운영자·설명과 영문 소문자 이벤트 주소를 확인해 주세요.',
  'Write all three questions and their answer options.': '3문제와 각 보기를 모두 작성해 주세요.',
  'Set a whole number of rewards between 1 and 500.': '보상 수량은 1~500명 사이 정수로 입력해 주세요.',
  'Enter a test USDC amount greater than zero.': '0보다 큰 테스트 USDC 금액을 입력해 주세요.',
  'Start at least one minute from now, then set the closing time and receipt deadline in order.': '시작은 현재보다 1분 이후, 참여 종료와 수령 기한은 순서대로 설정해 주세요.',
  'Check the Monad Testnet recipient address.': 'Monad Testnet 수령 주소를 확인해 주세요.',
  'Check the amount and your actual balance.': '전송 금액과 실제 잔액을 확인해 주세요.',
  'Transfer confirmation could not be verified. Check the transaction record.': '전송 완료를 확인하지 못했습니다. 거래 기록을 확인해 주세요.',
};

export const SERVICE_ERROR_MESSAGES: Readonly<Record<string, readonly [string, string, string, string]>> = {
  ...API_ERRORS,
  ...Object.fromEntries(Object.entries(CLIENT_ERRORS).map(([english, korean]) => [english, [korean, ...TRANSLATIONS[english]] as const])),
};

const canonicalMessages = new Map<string, string>();
for (const [english, translations] of Object.entries(SERVICE_ERROR_MESSAGES)) {
  canonicalMessages.set(english, english);
  for (const text of translations) canonicalMessages.set(text, english);
}

export function localizeServiceError(locale: Locale, message: string): string {
  const english = canonicalMessages.get(message);
  if (!english) return message;
  if (locale === 'en') return english;
  const index = locale === 'ko' ? 0 : locale === 'ja' ? 1 : locale === 'zh-CN' ? 2 : 3;
  return SERVICE_ERROR_MESSAGES[english][index];
}
