'use client';
import {createContext,useContext,type ReactNode} from 'react';
import {PrivyProvider,usePrivy,useWallets,useSendTransaction} from '@privy-io/react-auth';
import {monadTestnet} from 'viem/chains';
import {isAddress,type Address,type Hex} from 'viem';

type Session = {configured:boolean;ready:boolean;authenticated:boolean;wallet?:Address;login:()=>void;logout:()=>void;token:()=>Promise<string|null>;send:(to:Address,data:Hex)=>Promise<Hex>;error?:string};
const Context=createContext<Session>({configured:false,ready:true,authenticated:false,login:()=>{},logout:()=>{},token:async()=>null,send:async()=>{throw new Error('Wallet integration is not configured.');}});
export const useSession=()=>useContext(Context);
export function transactionFeeHint(t:(korean:string,english:string)=>string){return process.env.NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED==='true'?t('가스 대납을 요청합니다. 승인 화면에 표시된 수수료를 확인해 주세요.','Gas sponsorship is requested. Confirm the fee shown before approving.'):t('네트워크 수수료는 내 지갑의 테스트 MON으로 냅니다. 승인 전에 수수료를 확인해 주세요.','Network fees are paid from your wallet in test MON. Review the fee before approving.');}
function Connected({children}:{children:ReactNode}) {
 const {ready,authenticated,login,logout,getAccessToken}=usePrivy();
 const {wallets}=useWallets(); const {sendTransaction}=useSendTransaction();
 const embedded=wallets.find(wallet=>wallet.walletClientType==='privy');
 const send=async(to:Address,data:Hex)=>{
   if(!ready||!authenticated)throw new Error('Please sign in to continue.');
   if(!embedded)throw new Error('지갑을 준비 중입니다.');
   if(!isAddress(embedded.address)||!isAddress(to))throw new Error('A valid wallet address is required.');
   const result=await sendTransaction({from:embedded.address as Address,to,data,chainId:monadTestnet.id},{address:embedded.address,sponsor:process.env.NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED==='true',uiOptions:{showWalletUIs:true,isCancellable:true}});
   return result.hash;
 };
 return <Context.Provider value={{configured:true,ready,authenticated,wallet:embedded?.address as Address|undefined,login:()=>login({loginMethods:['email','google']}),logout:()=>{void logout();},token:getAccessToken,send}}>{children}</Context.Provider>;
}
export function SessionProvider({children}:{children:ReactNode}) {
 const appId=process.env.NEXT_PUBLIC_PRIVY_APP_ID;
 if(!appId)return <Context.Provider value={{configured:false,ready:true,authenticated:false,login:()=>{},logout:()=>{},token:async()=>null,send:async()=>{throw new Error('로그인과 지갑 설정이 필요합니다.');}}}>{children}</Context.Provider>;
 return <PrivyProvider appId={appId} config={{defaultChain:monadTestnet,supportedChains:[monadTestnet],loginMethods:['email','google'],appearance:{theme:'light',accentColor:'#6E54FF'},embeddedWallets:{ethereum:{createOnLogin:'users-without-wallets'}}}}><Connected>{children}</Connected></PrivyProvider>;
}
