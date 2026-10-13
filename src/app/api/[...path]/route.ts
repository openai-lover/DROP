import {NextResponse} from 'next/server';
import {ZodError} from 'zod';
import * as service from '@/server/api';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
async function handle(request:Request,context:Context){
 const {path}=await context.params;const key=path.join('/');const method=request.method;
 try{
  let data:unknown;
  if(method==='GET'&&key==='status')data=service.getIntegrationStatus();
  else if(method==='GET'&&key==='campaigns')data=await service.listPublicCampaigns();
  else if(method==='GET'&&path[0]==='campaigns'&&path.length===2)data=await service.publicCampaign(path[1]);
  else if(method==='GET'&&path[0]==='campaigns'&&path[2]==='answers')data=await service.quizReveal(path[1]);
  else{
   const principal=await service.authenticate(request);
   let body:unknown;
   if(method==='POST'){
    const text=await request.text();if(text.length>600_000)throw new service.DomainError('PAYLOAD_TOO_LARGE','Request content is too large.',413);
    try{body=JSON.parse(text);}catch{throw new service.DomainError('INVALID_JSON','Invalid request content.');}
   }
   const obj=(body??{}) as Record<string,unknown>;
   if(method==='GET'&&key==='creator/campaigns')data=await service.creatorCampaigns(principal);
   else if(method==='POST'&&key==='creator/campaigns')data=await service.createCampaign(principal,body);
   else if(path[0]==='creator'&&path[1]==='campaigns'&&path[2]){
    const id=path[2],action=path[3];
    if(method==='GET'&&!action)data=await service.creatorCampaign(principal,id);
    else if(method==='GET'&&action==='funding')data=await service.getFundingPlan(principal,id);
    else if(method==='POST'&&action==='funding')data=await service.verifyFunding(principal,id,String(obj.txHash??''));
    else if(method==='POST'&&action==='coupons')data=await service.importCoupons(principal,id,body);
    else if(method==='POST'&&action==='publish')data=await service.publishCouponCampaign(principal,id);
    else if(method==='GET'&&action==='refund')data=await service.getRefundPlan(principal,id);
    else if(method==='POST'&&action==='refund')data=await service.verifyRefund(principal,id,String(obj.txHash??''));
    else throw new service.DomainError('NOT_FOUND','Not found.',404);
   }
   else if(method==='POST'&&path[0]==='campaigns'&&path[2]==='sessions')data=await service.createGameSession(principal,path[1]);
   else if(method==='POST'&&path[0]==='sessions'&&path[2]==='submit')data=await service.submitGameSession(principal,path[1],body);
   else if(method==='GET'&&key==='rewards')data=await service.listRewards(principal);
   else if(method==='GET'&&key==='wallet')data=await service.getWalletOverview(principal);
   else if(method==='GET'&&path[0]==='rewards'&&path[2]==='coupon')data=await service.revealCoupon(principal,path[1]);
   else if(method==='POST'&&path[0]==='rewards'&&path[2]==='retry')data=await service.queueReward(principal,path[1]);
   else if(method==='GET'&&path[0]==='rewards'&&path[2]==='proof')data=await service.getRewardProof(principal,path[1]);
   else throw new service.DomainError('NOT_FOUND','Not found.',404);
  }
  return NextResponse.json({data}, {headers:{'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer'}});
 }catch(error){
  if(error instanceof ZodError)return NextResponse.json({error:{code:'INVALID_INPUT',message:'입력 내용을 확인해 주세요.',fields:error.issues.map(issue=>({path:issue.path.join('.'),message:issue.message}))}},{status:400,headers:{'Cache-Control':'no-store, private'}});
  if(error instanceof service.DomainError){const message=error.code==='INTEGRATION_UNCONFIGURED'?'이 기능을 위한 서비스 연결이 아직 완료되지 않았습니다.':error.message;return NextResponse.json({error:{code:error.code,message}},{status:error.status,headers:{'Cache-Control':'no-store, private'}});}
  console.error('DROP request failed',{path:key,error:error instanceof Error?error.name:'UnknownError'});
  return NextResponse.json({error:{code:'SERVICE_UNAVAILABLE',message:'요청을 처리하지 못했습니다. 잠시 후 다시 확인해 주세요.'}},{status:503,headers:{'Cache-Control':'no-store, private'}});
 }
}
export const GET=handle;export const POST=handle;
