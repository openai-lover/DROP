import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { ApiError } from '../../src/components/api';
import { localizeServiceError, SERVICE_ERROR_MESSAGES } from '../../src/i18n/errors';
import { LanguageProvider, useLanguage } from '../../src/i18n/provider';

describe('known service error localization', () => {
  it('shows the current Korean API defaults in English and the selected language', () => {
    const unconfigured = '이 기능을 위한 서비스 연결이 아직 완료되지 않았습니다.';
    expect(localizeServiceError('en', unconfigured)).toBe('Service connections for this feature are not configured yet.');
    expect(localizeServiceError('ja', unconfigured)).toBe('この機能に必要なサービスの接続設定がまだ完了していません。');
    expect(localizeServiceError('zh-CN', unconfigured)).toBe('此功能所需的服务连接尚未配置完成。');
    expect(localizeServiceError('es', '입력 내용을 확인해 주세요.')).toBe('Revisa los datos introducidos.');
    expect(localizeServiceError('en', '요청을 처리하지 못했습니다. 잠시 후 다시 확인해 주세요.')).toBe('We could not process your request. Please try again shortly.');
  });

  it('translates display text without changing the API error code, status, or stored message', () => {
    const error = new ApiError('This coupon is unavailable for your account.', 'NOT_FOUND', 404);
    expect(localizeServiceError('ko', error.message)).toBe('이 계정으로는 해당 쿠폰을 열 수 없습니다.');
    expect(localizeServiceError('es', error.message)).toBe('Este cupón no está disponible para tu cuenta.');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
    expect(error.message).toBe('This coupon is unavailable for your account.');
  });

  it('retranslates an already displayed validation error after a language change', () => {
    const english = 'Check the title, organizer, description and lowercase event address.';
    const japanese = localizeServiceError('ja', english);
    const spanish = localizeServiceError('es', japanese);
    expect(japanese).toBe('タイトル、主催者、説明、英小文字のイベントURLを確認してください。');
    expect(spanish).toBe('Revisa el título, organizador, descripción y dirección del evento en minúsculas.');
    expect(localizeServiceError('en', spanish)).toBe(english);
    expect(localizeServiceError('ko', spanish)).toBe('제목·운영자·설명과 영문 소문자 이벤트 주소를 확인해 주세요.');
  });

  it('preserves unknown messages exactly and lets React safely render them as text', () => {
    const unknown = '<script>unexpected provider error</script> · reference: 0x123';
    expect(localizeServiceError('ja', unknown)).toBe(unknown);
    expect(localizeServiceError('es', ' This event is not published. ')).toBe(' This event is not published. ');
    function ErrorDisplay() {
      const { errorText } = useLanguage();
      return createElement('p', { role: 'alert' }, errorText(unknown));
    }
    const html = renderToString(createElement(LanguageProvider, null, createElement(ErrorDisplay)));
    expect(html).toContain('&lt;script&gt;unexpected provider error&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('renders sanitized API errors in English on the initial server-rendered page', () => {
    function ErrorDisplay() {
      const { errorText } = useLanguage();
      return createElement('p', { role: 'alert' }, errorText('이 기능을 위한 서비스 연결이 아직 완료되지 않았습니다.'));
    }
    const html = renderToString(createElement(LanguageProvider, null, createElement(ErrorDisplay)));
    expect(html).toContain('Service connections for this feature are not configured yet.');
    expect(html).not.toContain('서비스 연결');
  });

  it('covers fixed public API error messages while retaining all five languages', () => {
    const files = ['src/server/api.ts', 'src/server/auth.ts', 'src/server/chain.ts', 'src/server/config.ts', 'src/server/coupons.ts', 'src/server/db.ts', 'src/server/rate-limit.ts', 'src/app/api/[...path]/route.ts'];
    const messages = new Set<string>();
    for (const file of files) {
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
      const visit = (node: ts.Node) => {
        if (ts.isNewExpression(node) && /(?:^|\.)DomainError$/.test(node.expression.getText(source))) {
          const message = node.arguments?.[1];
          if (message && ts.isStringLiteralLike(message)) messages.add(message.text);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect([...messages].filter(message => !Object.hasOwn(SERVICE_ERROR_MESSAGES, message))).toEqual([]);
    for (const message of messages) {
      expect(SERVICE_ERROR_MESSAGES[message]).toHaveLength(4);
      expect(SERVICE_ERROR_MESSAGES[message].every(text => text.trim().length > 0)).toBe(true);
    }
  });
});
