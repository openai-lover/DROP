import { generateKeyPairSync, sign } from "node:crypto";
import { PrivyClient } from "@privy-io/server-auth";
import { describe, expect, it } from "vitest";

// Ephemeral keys exist only inside this test; no app credential or bypass is supplied.
const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const verificationKey = publicKey.export({ type: "spki", format: "pem" }).toString();
const verifier = new PrivyClient("drop-unit-crypto-app", "unit-test-not-a-real-app-secret");
function token(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "ES256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iss: "privy.io", aud: "drop-unit-crypto-app", sub: "did:privy:crypto-test", sid: "crypto-test-session", iat: now, exp: now + 60, ...overrides })).toString("base64url");
  const message = `${header}.${payload}`;
  return `${message}.${sign("sha256", Buffer.from(message), { key: privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
}
describe("actual Privy SDK JWT cryptographic verification", () => {
  it("verifies an ES256 signature and returns the signed identity", async () => expect((await verifier.verifyAuthToken(token(), verificationKey)).userId).toBe("did:privy:crypto-test"));
  it("rejects a different application audience", async () => expect(verifier.verifyAuthToken(token({ aud: "another-app" }), verificationKey)).rejects.toThrow());
  it("rejects a different issuer", async () => expect(verifier.verifyAuthToken(token({ iss: "attacker.example" }), verificationKey)).rejects.toThrow());
  it("rejects an expired signed token", async () => expect(verifier.verifyAuthToken(token({ exp: Math.floor(Date.now() / 1000) - 60 }), verificationKey)).rejects.toThrow());
  it("rejects a token signed with another private key", async () => {
    const alternate = generateKeyPairSync("ec", { namedCurve: "prime256v1" }).publicKey.export({ type: "spki", format: "pem" }).toString();
    await expect(verifier.verifyAuthToken(token(), alternate)).rejects.toThrow();
  });
  it("rejects payload manipulation without a valid replacement signature", async () => {
    const signed = token().split(".");
    signed[1] = Buffer.from(JSON.stringify({ sub: "did:privy:victim", iss: "privy.io", aud: "drop-unit-crypto-app", exp: Math.floor(Date.now() / 1000) + 60 })).toString("base64url");
    await expect(verifier.verifyAuthToken(signed.join("."), verificationKey)).rejects.toThrow();
  });
});
