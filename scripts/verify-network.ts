import { existsSync } from 'node:fs';
import { createPublicClient, getAddress, http, isAddress, keccak256, parseAbi } from 'viem';
import { NETWORKS } from '../src/server/config';

// This command performs read-only RPC calls. It never signs or broadcasts a transaction.
if (existsSync('.env')) process.loadEnvFile('.env');
const deploymentAbi = parseAbi([
  'function supportedToken() view returns (address)',
  'function deploymentChainId() view returns (uint256)',
  'function eip712Domain() view returns (bytes1 fields,string name,string version,uint256 chainId,address verifyingContract,bytes32 salt,uint256[] extensions)',
]);
const tokenAbi = parseAbi(['function decimals() view returns (uint8)']);

async function main() {
  const requested = Number(process.env.DROP_CHAIN_ID ?? 10143);
  if (requested !== 10143 && requested !== 143) throw new Error('UNSUPPORTED_NETWORK');
  const network = NETWORKS[requested];
  const client = createPublicClient({ transport: http(process.env.DROP_RPC_URL || network.rpc, { timeout: 15_000, retryCount: 1 }) });
  const token = getAddress(network.usdc);
  const [chainId, tokenCode, decimals, finalized] = await Promise.all([
    client.getChainId(), client.getCode({ address: token }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'decimals' }),
    client.getBlock({ blockTag: 'finalized' }),
  ]);
  if (chainId !== requested || !tokenCode || tokenCode === '0x' || decimals !== 6 || finalized.number === null) throw new Error('NETWORK_VERIFICATION_FAILED');
  const report: Record<string, unknown> = { mode: 'read-only', network: network.name, chainId, officialUsdc: token, decimals, finalizedBlock: finalized.number.toString(), networkVerified: true, escrowVerified: false };
  const escrowInput = process.env.DROP_ESCROW_ADDRESS;
  if (!escrowInput) {
    report.remaining = 'Configure a deployed DROP_ESCROW_ADDRESS. No escrow deployment or reward payment was verified.';
    console.log(JSON.stringify(report, null, 2));
    if (!process.argv.includes('--network-only')) process.exitCode = 2;
    return;
  }
  if (!isAddress(escrowInput) || /^0x0{40}$/i.test(escrowInput)) throw new Error('INVALID_ESCROW');
  const escrow = getAddress(escrowInput);
  const [code, supportedToken, deploymentChainId, domain] = await Promise.all([
    client.getCode({ address: escrow, blockNumber: finalized.number }),
    client.readContract({ address: escrow, abi: deploymentAbi, functionName: 'supportedToken', blockNumber: finalized.number }),
    client.readContract({ address: escrow, abi: deploymentAbi, functionName: 'deploymentChainId', blockNumber: finalized.number }),
    client.readContract({ address: escrow, abi: deploymentAbi, functionName: 'eip712Domain', blockNumber: finalized.number }),
  ]);
  if (!code || code === '0x' || getAddress(supportedToken) !== token || deploymentChainId !== BigInt(chainId) || domain[1] !== 'DROPRewardEscrow' || domain[2] !== '1' || domain[3] !== BigInt(chainId) || getAddress(domain[4]) !== escrow) throw new Error('ESCROW_VERIFICATION_FAILED');
  report.escrow = escrow;
  report.escrowCodeHash = keccak256(code);
  report.escrowVerified = true;
  report.scope = 'Network, official token, deployed escrow getters and EIP-712 domain. This is not source verification, an audit, funding proof, or payout proof.';
  console.log(JSON.stringify(report, null, 2));
}
main().catch(() => {
  // RPC error details can contain a private provider URL. Keep those out of logs.
  console.error('Read-only verification failed. Check the network, deployed contract and private RPC configuration.');
  process.exitCode = 1;
});
