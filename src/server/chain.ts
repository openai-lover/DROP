import { createPublicClient, createWalletClient, decodeEventLog, defineChain, encodeFunctionData, getAddress, http, keccak256, parseAbi, type Address, type Hex, type TransactionReceipt } from "viem";
import { chainConfig, relayerAccount, signingAccount } from "./config";
import { DomainError } from "./errors";

export const escrowAbi = parseAbi([
  "function createCampaign(bytes32 campaignId,address signer,uint256 rewardAmount,uint256 maxRecipients,uint256 startsAt,uint256 endsAt,uint256 claimDeadline,bytes32 rulesHash)",
  "function claim((bytes32 campaignId,bytes32 rewardId,uint256 slotIndex,address recipient,address token,uint256 amount,bytes32 participantNullifier,uint256 qualifiedAt,uint256 deadline,bytes32 rulesHash) authorization,bytes signature)",
  "function refund(bytes32 campaignId)",
  "function getCampaign(bytes32 campaignId) view returns ((address owner,address signer,address token,uint256 rewardAmount,uint256 maxRecipients,uint256 startsAt,uint256 endsAt,uint256 claimDeadline,bytes32 rulesHash,uint256 deposited,uint256 paid,uint256 refunded,uint256 claimedCount))",
  "function isRewardClaimed(bytes32 campaignId,bytes32 rewardId) view returns (bool)",
  "function usedSlot(bytes32 campaignId,uint256 slotIndex) view returns (bool)",
  "event CampaignCreated(bytes32 indexed campaignId,address indexed owner,address indexed signer,address token,uint256 rewardAmount,uint256 maxRecipients,uint256 startsAt,uint256 endsAt,uint256 claimDeadline,bytes32 rulesHash)",
  "event CampaignFunded(bytes32 indexed campaignId,address indexed owner,address token,uint256 amount)",
  "event RewardPaid(bytes32 indexed campaignId,bytes32 indexed rewardId,address indexed recipient,address token,uint256 amount,uint256 slotIndex,bytes32 participantNullifier)",
  "event CampaignRefunded(bytes32 indexed campaignId,address indexed owner,address token,uint256 amount)",
]);
export const usdcAbi = parseAbi(["function decimals() view returns (uint8)", "function balanceOf(address account) view returns (uint256)", "function approve(address spender,uint256 amount) returns (bool)"]);

export function chainClients() {
  const config = chainConfig();
  const chain = defineChain({ id: config.chainId, name: config.name, nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [config.rpc] } } });
  return { config, chain, publicClient: createPublicClient({ chain, transport: http(config.rpc, { timeout: 15_000, retryCount: 1 }) }) };
}

type BlockReader = Pick<ReturnType<typeof chainClients>["publicClient"], "getBlock">;

/** Monad's latest/pending heads are speculative. Settlement never falls back to them. */
export async function finalizedBlock(publicClient: BlockReader) {
  const block = await publicClient.getBlock({ blockTag: "finalized" });
  if (block.number === null || block.hash === null) throw new DomainError("FINALITY_UNAVAILABLE", "The provider has not supplied a finalized block.", 503);
  return block;
}

/** Return the state snapshot to read, or null while a receipt is provisional/non-canonical. */
export async function receiptFinalizedAt(publicClient: BlockReader, receipt: Pick<TransactionReceipt, "blockNumber" | "blockHash">, confirmations: number): Promise<bigint | null> {
  const finalized = await finalizedBlock(publicClient);
  if (finalized.number - receipt.blockNumber + 1n < BigInt(confirmations)) return null;
  const canonical = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
  if (!canonical.hash || canonical.hash.toLowerCase() !== receipt.blockHash.toLowerCase()) return null;
  return finalized.number;
}

export async function verifyChainConfiguration() {
  const { config, publicClient } = chainClients();
  const [chainId, tokenCode, escrowCode, decimals] = await Promise.all([publicClient.getChainId(), publicClient.getCode({ address: config.usdc }), publicClient.getCode({ address: config.escrow }), publicClient.readContract({ address: config.usdc, abi: usdcAbi, functionName: "decimals" })]);
  if (chainId !== config.chainId || !tokenCode || tokenCode === "0x" || !escrowCode || escrowCode === "0x" || decimals !== 6) throw new DomainError("CHAIN_CONFIGURATION_INVALID", "Network, escrow and official USDC deployment could not be verified.", 503);
  return { config, publicClient };
}

export type RewardAuthorization = {
  campaignId: Hex; rewardId: Hex; slotIndex: bigint; recipient: Address; token: Address; amount: bigint;
  participantNullifier: Hex; qualifiedAt: bigint; deadline: bigint; rulesHash: Hex;
};
export const authorizationTypes = {
  RewardAuthorization: [
    { name: "campaignId", type: "bytes32" }, { name: "rewardId", type: "bytes32" }, { name: "slotIndex", type: "uint256" },
    { name: "recipient", type: "address" }, { name: "token", type: "address" }, { name: "amount", type: "uint256" },
    { name: "participantNullifier", type: "bytes32" }, { name: "qualifiedAt", type: "uint256" }, { name: "deadline", type: "uint256" }, { name: "rulesHash", type: "bytes32" },
  ],
} as const;
export async function signAuthorization(authorization: RewardAuthorization): Promise<Hex> {
  const config = chainConfig();
  return signingAccount().signTypedData({ domain: { name: "DROPRewardEscrow", version: "1", chainId: config.chainId, verifyingContract: config.escrow }, types: authorizationTypes, primaryType: "RewardAuthorization", message: authorization });
}
export function proofJson(proof: RewardAuthorization) {
  return { ...proof, slotIndex: proof.slotIndex.toString(), amount: proof.amount.toString(), qualifiedAt: proof.qualifiedAt.toString(), deadline: proof.deadline.toString() };
}
export function proofFromJson(value: unknown): RewardAuthorization {
  const proof = value as ReturnType<typeof proofJson>;
  return { ...proof, slotIndex: BigInt(proof.slotIndex), amount: BigInt(proof.amount), qualifiedAt: BigInt(proof.qualifiedAt), deadline: BigInt(proof.deadline) };
}

export async function prepareClaim(proof: RewardAuthorization, signature: Hex, nonce: number, replacement?: { gas: bigint; maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }) {
  const { config, chain, publicClient } = chainClients();
  const account = relayerAccount();
  const data = encodeFunctionData({ abi: escrowAbi, functionName: "claim", args: [proof, signature] });
  // Only this fixed escrow claim function is ever signed by the relayer.
  const estimatedGas = replacement?.gas ?? await publicClient.estimateGas({ account, to: config.escrow, data });
  const estimatedFees = await publicClient.estimateFeesPerGas();
  const fees = { maxFeePerGas: replacement && replacement.maxFeePerGas > estimatedFees.maxFeePerGas ? replacement.maxFeePerGas : estimatedFees.maxFeePerGas, maxPriorityFeePerGas: replacement && replacement.maxPriorityFeePerGas > estimatedFees.maxPriorityFeePerGas ? replacement.maxPriorityFeePerGas : estimatedFees.maxPriorityFeePerGas };
  const gas = replacement ? estimatedGas : estimatedGas + estimatedGas / 5n;
  const wallet = createWalletClient({ account, chain, transport: http(config.rpc) });
  const serializedTx = await wallet.signTransaction({ to: config.escrow, data, nonce, gas, ...fees, type: "eip1559" });
  return { serializedTx, txHash: keccak256(serializedTx), relayer: account.address.toLowerCase(), chainId: config.chainId, nonce, gas: gas.toString(), maxFeePerGas: fees.maxFeePerGas.toString(), maxPriorityFeePerGas: fees.maxPriorityFeePerGas.toString() };
}

export async function receiptForReward(txHash: Hex, proof: RewardAuthorization) {
  const { config, publicClient } = chainClients();
  let receipt;
  try { receipt = await publicClient.getTransactionReceipt({ hash: txHash }); }
  catch (error) {
    if ((error as { name?: string }).name === "TransactionReceiptNotFoundError") return { state: "pending" as const };
    throw error;
  }
  const finalizedAt = await receiptFinalizedAt(publicClient, receipt, config.confirmations);
  if (finalizedAt === null) return { state: "pending" as const };
  if (receipt.status !== "success") return { state: "reverted" as const, receipt };
  const matching = receipt.logs.some((log) => {
    if (log.address.toLowerCase() !== config.escrow.toLowerCase()) return false;
    try {
      const decoded = decodeEventLog({ abi: escrowAbi, eventName: "RewardPaid", data: log.data, topics: log.topics });
      const args = decoded.args;
      return args.campaignId === proof.campaignId && args.rewardId === proof.rewardId && args.recipient.toLowerCase() === proof.recipient.toLowerCase() && args.token.toLowerCase() === proof.token.toLowerCase() && args.amount === proof.amount && args.slotIndex === proof.slotIndex && args.participantNullifier === proof.participantNullifier;
    } catch { return false; }
  });
  if (!matching) throw new DomainError("SETTLEMENT_EVENT_MISMATCH", "The transaction does not contain the expected settlement.", 503);
  const claimed = await publicClient.readContract({ address: config.escrow, abi: escrowAbi, functionName: "isRewardClaimed", args: [proof.campaignId, proof.rewardId], blockNumber: finalizedAt });
  if (!claimed) throw new DomainError("SETTLEMENT_STATE_MISMATCH", "The contract has not confirmed this reward.", 503);
  return { state: "confirmed" as const, receipt };
}

export async function walletBalance(address: string) {
  const { config, publicClient } = await verifyChainConfiguration();
  const amount = await publicClient.readContract({ address: config.usdc, abi: usdcAbi, functionName: "balanceOf", args: [getAddress(address)] });
  return { amountAtomic: amount.toString(), decimals: 6, chainId: config.chainId, token: config.usdc, testnet: config.testnet };
}
