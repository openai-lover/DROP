import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({ verifyAuthToken: vi.fn(), getUser: vi.fn() }));
vi.mock("@privy-io/server-auth", () => ({ PrivyClient: class { verifyAuthToken = sdk.verifyAuthToken; getUser = sdk.getUser; } }));
import { authenticate, requireWallet, verifyIdentity } from "../../src/server/auth";
const original = { id: process.env.NEXT_PUBLIC_PRIVY_APP_ID, secret: process.env.PRIVY_APP_SECRET };
beforeAll(() => { process.env.NEXT_PUBLIC_PRIVY_APP_ID = "test-app-only"; process.env.PRIVY_APP_SECRET = "test-secret-only"; });
afterAll(() => {
  if (original.id === undefined) delete process.env.NEXT_PUBLIC_PRIVY_APP_ID; else process.env.NEXT_PUBLIC_PRIVY_APP_ID = original.id;
  if (original.secret === undefined) delete process.env.PRIVY_APP_SECRET; else process.env.PRIVY_APP_SECRET = original.secret;
});
beforeEach(() => vi.clearAllMocks());
describe("Privy authentication trust boundary", () => {
  it("rejects a forged token before trusting userId in the request body", async () => {
    sdk.verifyAuthToken.mockRejectedValueOnce(new Error("bad signature"));
    const request = new Request("https://drop.example/api/rewards", { method: "POST", headers: { authorization: "Bearer forged.jwt" }, body: JSON.stringify({ userId: "victim", telegramId: "victim", wallet: "0x0000000000000000000000000000000000000001" }) });
    await expect(authenticate(request)).rejects.toMatchObject({ code: "UNAUTHENTICATED", status: 401 });
    expect(sdk.getUser).not.toHaveBeenCalled();
  });
  it("rejects a user profile that differs from the verified token", async () => {
    sdk.verifyAuthToken.mockResolvedValueOnce({ userId: "did:privy:alice" });
    sdk.getUser.mockResolvedValueOnce({ id: "did:privy:bob", linkedAccounts: [] });
    await expect(verifyIdentity("valid-sdk-test-token")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
  it("gets the recipient from the verified embedded wallet account", async () => {
    sdk.verifyAuthToken.mockResolvedValueOnce({ userId: "did:privy:alice" });
    sdk.getUser.mockResolvedValueOnce({ id: "did:privy:alice", linkedAccounts: [{ type: "wallet", chainType: "ethereum", walletClientType: "privy", address: "0x0000000000000000000000000000000000000011" }] });
    await expect(verifyIdentity("valid-sdk-test-token")).resolves.toEqual({ privyId: "did:privy:alice", wallet: "0x0000000000000000000000000000000000000011" });
  });
  it("does not substitute an arbitrary external wallet for an embedded account", async () => {
    sdk.verifyAuthToken.mockResolvedValueOnce({ userId: "did:privy:alice" });
    sdk.getUser.mockResolvedValueOnce({ id: "did:privy:alice", linkedAccounts: [{ type: "wallet", chainType: "ethereum", walletClientType: "metamask", address: "0x0000000000000000000000000000000000000011" }] });
    await expect(verifyIdentity("valid-sdk-test-token")).resolves.toEqual({ privyId: "did:privy:alice", wallet: null });
    expect(() => requireWallet({ userId: "alice", privyId: "did:privy:alice", wallet: null })).toThrow();
  });
  it("requires a bearer token and rejects ambiguous headers", async () => {
    await expect(authenticate(new Request("https://drop.example/api/rewards"))).rejects.toMatchObject({ status: 401 });
    await expect(authenticate(new Request("https://drop.example/api/rewards", { headers: { authorization: "Bearer first, second" } }))).rejects.toMatchObject({ status: 401 });
    expect(sdk.verifyAuthToken).not.toHaveBeenCalled();
  });
});
