import {createPublicClient,http,type Hex} from 'viem';
import {monadTestnet} from 'viem/chains';

export const testnetClient=()=>createPublicClient({chain:monadTestnet,transport:http('https://testnet-rpc.monad.xyz',{timeout:15000,retryCount:1})});

/** A submitted hash or speculative receipt never means a completed payment. */
export async function waitForFinalizedTransaction(hash:Hex){
 const client=testnetClient();
 const initial=await client.waitForTransactionReceipt({hash,confirmations:2,timeout:120000});
 const deadline=Date.now()+120000;
 while(Date.now()<deadline){
  const finalized=await client.getBlock({blockTag:'finalized'});
  if(finalized.number!==null&&finalized.number>=initial.blockNumber){
   const receipt=await client.getTransactionReceipt({hash});
   const canonical=await client.getBlock({blockNumber:receipt.blockNumber});
   if(receipt.blockNumber<=finalized.number&&canonical.hash===receipt.blockHash)return receipt;
  }
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 throw new Error('Final settlement is still pending. Check the transaction record and refresh.');
}
