import {Practice} from '@/components/practice';
export default async function Page({searchParams}:{searchParams:Promise<{game?:string}>}) {
  const {game}=await searchParams;
  return <Practice initialGame={game==='quiz'?'quiz':'catch'}/>;
}
