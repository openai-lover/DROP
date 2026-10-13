import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeAbiParameters, encodeEventTopics, type Hex } from "viem";
const provider = vi.hoisted(() => ({ getTransactionReceipt: vi.fn(), getBlockNumber: vi.fn(), getBlock: vi.fn(), readContract: vi.fn(), getChainId: vi.fn(), getCode: vi.fn() }));
vi.mock("viem", async original => ({ ...await original<typeof import("viem")>(), createPublicClient: () => provider }));
import { escrowAbi, receiptForReward, verifyChainConfiguration, type RewardAuthorization } from "../../src/server/chain";
const escrow = "0x0000000000000000000000000000000000000022";
const original = { chainId: process.env.DROP_CHAIN_ID, escrow: process.env.DROP_ESCROW_ADDRESS };
const proof: RewardAuthorization = { campaignId: `0x${"11".repeat(32)}`, rewardId: `0x${"22".repeat(32)}`, slotIndex: 0n, recipient: "0x0000000000000000000000000000000000000033", token: "0x534b2f3A21130d7a60830c2Df862319e593943A3", amount: 1_000_000n, participantNullifier: `0x${"44".repeat(32)}`, qualifiedAt: 100n, deadline: 1000n, rulesHash: `0x${"55".repeat(32)}` };
const hash = `0x${"aa".repeat(32)}` as Hex;
const blockHash = `0x${"bb".repeat(32)}` as Hex;
function receipt(amount = proof.amount) {
  return { status: "success", blockNumber: 42n, blockHash, logs: [{ address: escrow, topics: encodeEventTopics({ abi: escrowAbi, eventName: "RewardPaid", args: { campaignId: proof.campaignId, rewardId: proof.rewardId, recipient: proof.recipient } }), data: encodeAbiParameters([{ type: "address" }, { type: "uint256" }, { type: "uint256" }, { type: "bytes32" }], [proof.token, amount, proof.slotIndex, proof.participantNullifier]) }] };
}
beforeAll(() => { process.env.DROP_CHAIN_ID = "10143"; process.env.DROP_ESCROW_ADDRESS = escrow; });
afterAll(() => { for (const [name, value] of [["DROP_CHAIN_ID", original.chainId], ["DROP_ESCROW_ADDRESS", original.escrow]]) { if (value === undefined) delete process.env[name!]; else process.env[name!] = value; } });
beforeEach(() => { vi.clearAllMocks(); provider.getTransactionReceipt.mockResolvedValue(receipt()); provider.getBlockNumber.mockResolvedValue(43n); provider.getBlock.mockImplementation(async args => ({ number: args.blockTag === "finalized" ? 43n : args.blockNumber, hash: blockHash })); provider.readContract.mockResolvedValue(true); });
describe("receipt-based payout confirmation", () => {
  it("requires a matching event, successful receipt, contract state and depth", async () => expect((await receiptForReward(hash, proof)).state).toBe("confirmed"));
  it("keeps an unconfirmed transaction pending", async () => { provider.getBlock.mockResolvedValue({ number: 42n, hash: blockHash }); expect((await receiptForReward(hash, proof)).state).toBe("pending"); });
  it("does not label a hash or a missing receipt as paid", async () => { provider.getTransactionReceipt.mockRejectedValue({ name: "TransactionReceiptNotFoundError" }); expect((await receiptForReward(hash, proof)).state).toBe("pending"); });
  it("rejects a receipt with a different amount", async () => { provider.getTransactionReceipt.mockResolvedValue(receipt(2_000_000n)); await expect(receiptForReward(hash, proof)).rejects.toMatchObject({ code: "SETTLEMENT_EVENT_MISMATCH" }); });
  it("rejects a successful receipt without the expected escrow event", async () => { provider.getTransactionReceipt.mockResolvedValue({ ...receipt(), logs: [] }); await expect(receiptForReward(hash, proof)).rejects.toMatchObject({ code: "SETTLEMENT_EVENT_MISMATCH" }); });
  it("rejects disagreement with on-chain claimed state", async () => { provider.readContract.mockResolvedValue(false); await expect(receiptForReward(hash, proof)).rejects.toMatchObject({ code: "SETTLEMENT_STATE_MISMATCH" }); });
  it("waits for finalized depth before treating a reverted nonce as consumed", async () => { provider.getTransactionReceipt.mockResolvedValue({ ...receipt(), status: "reverted" }); provider.getBlock.mockResolvedValue({ number: 42n, hash: blockHash }); expect((await receiptForReward(hash, proof)).state).toBe("pending"); provider.getBlock.mockResolvedValue({ number: 43n, hash: blockHash }); expect((await receiptForReward(hash, proof)).state).toBe("reverted"); });
  it("ignores a speculative latest head even when it is far ahead", async () => { provider.getBlockNumber.mockResolvedValue(5000n); provider.getBlock.mockResolvedValue({ number: 41n, hash: blockHash }); expect((await receiptForReward(hash, proof)).state).toBe("pending"); expect(provider.getBlockNumber).not.toHaveBeenCalled(); expect(provider.getBlock).toHaveBeenCalledWith({ blockTag: "finalized" }); expect(provider.readContract).not.toHaveBeenCalled(); });
  it("does not settle a receipt whose block was replaced at the same height", async () => { provider.getBlock.mockImplementation(async args => args.blockTag === "finalized" ? { number: 43n, hash: blockHash } : { number: 42n, hash: `0x${"cc".repeat(32)}` }); expect((await receiptForReward(hash, proof)).state).toBe("pending"); expect(provider.readContract).not.toHaveBeenCalled(); });
  it("fails closed when the provider does not supply finalized state", async () => { provider.getBlock.mockResolvedValue({ number: null, hash: null }); await expect(receiptForReward(hash, proof)).rejects.toMatchObject({ code: "FINALITY_UNAVAILABLE" }); });
  it("reads claimed state from the verified finalized snapshot", async () => { expect((await receiptForReward(hash, proof)).state).toBe("confirmed"); expect(provider.readContract).toHaveBeenCalledWith(expect.objectContaining({ functionName: "isRewardClaimed", blockNumber: 43n })); });
  it("rejects an event which pays another recipient", async () => { const value = receipt(); value.logs[0].topics = encodeEventTopics({ abi: escrowAbi, eventName: "RewardPaid", args: { campaignId: proof.campaignId, rewardId: proof.rewardId, recipient: "0x0000000000000000000000000000000000000099" } }); provider.getTransactionReceipt.mockResolvedValue(value); await expect(receiptForReward(hash, proof)).rejects.toMatchObject({ code: "SETTLEMENT_EVENT_MISMATCH" }); });
});
describe("deployment and ABI guardrails", () => {
  it("rejects wrong network, missing code and non-six-decimal tokens", async () => {
    provider.getChainId.mockResolvedValue(10143); provider.getCode.mockResolvedValue("0x6000"); provider.readContract.mockResolvedValue(6);
    await expect(verifyChainConfiguration()).resolves.toHaveProperty("config.chainId", 10143);
    provider.getChainId.mockResolvedValue(143); await expect(verifyChainConfiguration()).rejects.toMatchObject({ code: "CHAIN_CONFIGURATION_INVALID" });
    provider.getChainId.mockResolvedValue(10143); provider.getCode.mockResolvedValue("0x"); await expect(verifyChainConfiguration()).rejects.toMatchObject({ code: "CHAIN_CONFIGURATION_INVALID" });
    provider.getCode.mockResolvedValue("0x6000"); provider.readContract.mockResolvedValue(18); await expect(verifyChainConfiguration()).rejects.toMatchObject({ code: "CHAIN_CONFIGURATION_INVALID" });
  });
  it("matches compiled event signatures and indexed fields", () => {
    const compiled = JSON.parse(readFileSync(new URL("../../contracts/abi/DROPRewardEscrow.json", import.meta.url), "utf8")) as { type: string; name?: string; inputs?: { name: string; type: string; indexed?: boolean }[] }[];
    for (const event of escrowAbi.filter(item => item.type === "event")) {
      const actual = compiled.find(item => item.type === "event" && item.name === event.name);
      expect(actual?.inputs?.map(({ name, type, indexed }) => ({ name, type, indexed: Boolean(indexed) }))).toEqual(event.inputs.map(input => ({ name: input.name, type: input.type, indexed: Boolean("indexed" in input && input.indexed) })));
    }
  });
});
