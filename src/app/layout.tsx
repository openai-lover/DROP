import type {Metadata} from 'next';
import {SessionProvider} from '@/components/session';import {Shell} from '@/components/shell';import './globals.css';import './monad-theme.css';
const origin=process.env.NEXT_PUBLIC_APP_URL||(process.env.VERCEL_PROJECT_PRODUCTION_URL?`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`:process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:'http://localhost:3000');
export const metadata:Metadata={metadataBase:new URL(origin),title:{default:'DROP — Good vibes. Great drops.',template:'%s · DROP'},description:'A little play for your community. Catch a coffee, try a quiz, and create playful rewards on Monad.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><SessionProvider><Shell>{children}</Shell></SessionProvider></body></html>;}
