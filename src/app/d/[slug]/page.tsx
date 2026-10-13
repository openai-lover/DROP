import {Event} from '@/components/event';
import type {Metadata} from 'next';
import {campaignShare} from '@/server/share';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 try{const share=await campaignShare((await params).slug);return {title:share.title,description:share.description,openGraph:{title:share.title,description:share.description,type:'website'},twitter:{card:'summary_large_image',title:share.title,description:share.description}};}
 catch{return {title:'Community event',description:'View the published rules and available rewards on DROP.'};}
}
export default async function Page({params}:{params:Promise<{slug:string}>}){return <Event slug={(await params).slug}/>;}
