import { ImageResponse } from 'next/og';
import { campaignShare } from '@/server/share';

export const alt = 'DROP community event: organizer, game, reward and quantity';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

export default async function ShareImage({ params }: { params: Promise<{ slug: string }> }) {
  let share: Awaited<ReturnType<typeof campaignShare>> | undefined;
  try { share = await campaignShare((await params).slug); } catch { /* Unpublished or unavailable events expose no details. */ }
  return new ImageResponse(
    <div style={{ width:'100%',height:'100%',display:'flex',flexDirection:'column',background:'#fbf9f5',color:'#151515',padding:'55px 65px',fontFamily:'sans-serif' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}><div style={{ display:'flex',fontSize:48,fontWeight:900,letterSpacing:'-3px' }}>DROP<span style={{ color:'#f6503d' }}>↗</span></div><div style={{ fontSize:22,color:'#777' }}>{share?.organizer??'PLAYFUL REWARDS FOR COMMUNITIES'}</div></div>
      <div style={{ display:'flex',fontSize:72,fontWeight:800,lineHeight:1.08,marginTop:65,maxHeight:180,overflow:'hidden' }}>{share?.title??'Your next community moment.'}</div>
      <div style={{ display:'flex',fontSize:27,color:'#666',marginTop:24 }}>{share?.game??'Catch a little fun. Keep the reward.'}</div>
      <div style={{ display:'flex',marginTop:'auto',justifyContent:'space-between',alignItems:'center',borderTop:'2px solid #dedbd5',paddingTop:25 }}><div style={{ display:'flex',fontSize:30,fontWeight:700 }}>{share?`${share.reward} × ${share.count}`:'View the published event rules'}</div><div style={{ display:'flex',background:'#f6503d',borderRadius:80,width:75,height:75,alignItems:'center',justifyContent:'center',fontSize:50,color:'white' }}>↗</div></div>
    </div>,
    { ...size, headers: { 'Cache-Control':'public, max-age=60' } },
  );
}
