'use client';
import {createContext,useContext,type ReactNode} from 'react';
import {PrivyProvider,usePrivy,useWallets,useSendTransaction} from '@privy-io/react-auth';
import {monadTestnet} from 'viem/chains';
import type {Address,Hex} from 'viem';

type Session = {configured:boolean;ready:boolean;authenticated:boolean;wallet?:Address;login:()=>void;logout:()=>void;token:()=>Promise<string|null>;send:(to:Address,data:Hex)=>Promise<Hex>;error?:string};
const Context=createContext<Session>({configured:false,ready:true,authenticated:false,login:()=>{},logout:()=>{},token:async()=>null,send:async()=>{throw new Error('Wallet integration is not configured.');}});
export const useSession=()=>useContext(Context);
function Connected({children}:{children:ReactNode}) {
 const {ready,authenticated,login,logout,getAccessToken}=usePrivy();
 const {wallets}=useWallets(); const {sendTransaction}=useSendTransaction();
 const embedded=wallets.find(wallet=>wallet.walletClientType==='privy');
 const send=async(to:Address,data:Hex)=>{
   if(!embedded)throw new Error('지갑을 준비 중입니다.');
   if(process.env.NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED!=='true')throw new Error('가스 대납 설정이 아직 완료되지 않았습니다.');
   const result=await sendTransaction({from:embedded.address as Address,to,data,chainId:monadTestnet.id},{sponsor:true});
   return result.hash;
 };
 return <Context.Provider value={{configured:true,ready,authenticated,wallet:embedded?.address as Address|undefined,login:()=>login({loginMethods:['telegram','email']}),logout:()=>{void logout();},token:getAccessToken,send}}>{children}</Context.Provider>;
}
export function SessionProvider({children}:{children:ReactNode}) {
 const appId=process.env.NEXT_PUBLIC_PRIVY_APP_ID;
 if(!appId)return <Context.Provider value={{configured:false,ready:true,authenticated:false,login:()=>{},logout:()=>{},token:async()=>null,send:async()=>{throw new Error('로그인과 지갑 설정이 필요합니다.');}}}>{children}</Context.Provider>;
 return <PrivyProvider appId={appId} config={{defaultChain:monadTestnet,supportedChains:[monadTestnet],loginMethods:['telegram','email'],appearance:{theme:'light',accentColor:'#f6503d'},embeddedWallets:{ethereum:{createOnLogin:'users-without-wallets'}}}}><Connected>{children}</Connected></PrivyProvider>;
}
