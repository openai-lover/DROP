import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { couponReferenceHash, decryptCoupon, encryptCoupon } from "../../src/server/coupons";
const original = process.env.COUPON_ENCRYPTION_KEY;
beforeAll(() => { process.env.COUPON_ENCRYPTION_KEY = "f4".repeat(32); });
afterAll(() => { if (original === undefined) delete process.env.COUPON_ENCRYPTION_KEY; else process.env.COUPON_ENCRYPTION_KEY = original; });
describe("private coupon encryption", () => {
  it("encrypts content with fresh authenticated encryption", () => {
    const first = encryptCoupon("campaign-a", "secret redemption value");
    const second = encryptCoupon("campaign-a", "secret redemption value");
    expect(first).not.toEqual(second);
    expect(first).not.toContain("secret redemption value");
    expect(decryptCoupon("campaign-a", first)).toBe("secret redemption value");
  });
  it("rejects ciphertext transplanted into a different campaign", () => expect(() => decryptCoupon("campaign-b", encryptCoupon("campaign-a", "secret"))).toThrow());
  it("rejects tampered content", () => {
    const encrypted = encryptCoupon("campaign-a", "secret").split(".");
    encrypted[2] = Buffer.from("tampered tag data").toString("base64url");
    expect(() => decryptCoupon("campaign-a", encrypted.join("."))).toThrow();
  });
  it("does not keep coupon references as a plain dictionary hash", () => expect(couponReferenceHash("private coupon 123")).toMatch(/^[a-f0-9]{64}$/));
});
