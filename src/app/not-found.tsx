'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n';

export default function NotFound() {
  const { t } = useLanguage();
  return <main className="page narrow">
    <p className="eyebrow">{t('이 DROP은 여기에 없어요', 'THIS DROP ISN’T HERE')}</p>
    <h1>{t('페이지를 찾지 못했어요.', 'We couldn’t find this page.')}</h1>
    <p className="lead">{t('공유 주소를 확인하거나 DROP으로 돌아가 주세요.', 'Check the shared link or head back to DROP.')}</p>
    <Link className="button" href="/">{t('DROP으로 돌아가기', 'Back to DROP')} →</Link>
  </main>;
}
