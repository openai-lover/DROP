import type {Metadata} from 'next';
import {SessionProvider} from '@/components/session';import {Shell} from '@/components/shell';import './globals.css';
const origin=process.env.NEXT_PUBLIC_APP_URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL?`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`:process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'http://localhost:3000');
export const metadata:Metadata={metadataBase:new URL(origin),title:{default:'DROP — Playful rewards for communities',template:'%s · DROP'},description:'KOL이 커피와 코인을 재미있게 뿌리고, 지급까지 관리하는 도구. Playful rewards, without the wallet hassle.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body><SessionProvider><Shell>{children}</Shell></SessionProvider></body></html>;}
