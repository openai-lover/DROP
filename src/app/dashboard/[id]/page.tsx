import {Dashboard} from '@/components/dashboard';export default async function Page({params}:{params:Promise<{id:string}>}){return <Dashboard id={(await params).id}/>;}
