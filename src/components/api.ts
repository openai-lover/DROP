export class ApiError extends Error { constructor(message:string,public code:string,public status:number){super(message);} }
export async function api<T>(path:string,token?:string|null,body?:unknown,method?:string):Promise<T>{
 const response=await fetch(`/api${path}`,{method:method??(body?'POST':'GET'),headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'});
 const value=await response.json();
 if(!response.ok)throw new ApiError(value.error?.message??'요청을 처리하지 못했습니다.',value.error?.code??'REQUEST_FAILED',response.status);
 return value.data as T;
}
export type CampaignView={id:string;slug:string;title:string;organizer:string;description:string;gameType:'CATCH'|'QUIZ';rewardType:'USDC'|'COUPON'|'COUPON_DEMO';rewardAmountAtomic:string;rewardDecimals:number;maxRecipients:number;remaining:number;reservedCount:number;startsAt:string;endsAt:string;claimDeadline:string;maxAttempts:number;status:string;rulesHash:string;chainId:number;escrow?:string;config:{questions?:{prompt:string;options:string[]}[];passScore?:number;catchPhrase?:string;targetImage?:string};participants?:number;payouts?:Record<string,number>;inventory?:Record<string,number>;fundingTx?:string;refundTx?:string;totalBudgetAtomic?:string};
export type GameSessionView={id:string;nonce:string;seed:string;gameType:'CATCH'|'QUIZ';startsAt:string;expiresAt:string;configVersion:number;config:Record<string,unknown>};
export type AwardView={id:string;rewardId?:string;status:string;amountAtomic:string;txHash?:string;campaign:CampaignView;coupon?:{merchant:string;expiresAt:string;status:string;isDemo:boolean};deadline:string;lastError?:string;confirmedAt?:string};
