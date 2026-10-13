import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { required, DomainError } from "./errors";

function key() {
  const value = required("COUPON_ENCRYPTION_KEY");
  if (!/^[0-9a-f]{64}$/i.test(value)) throw new DomainError("INVALID_COUPON_KEY", "Coupon encryption must use a 32-byte hex key.", 503);
  return Buffer.from(value, "hex");
}
export function encryptCoupon(campaignId: string, payload: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(`DROP:coupon:v1:${campaignId}`));
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}
export function decryptCoupon(campaignId: string, encryptedPayload: string): string {
  const [version, iv, tag, body] = encryptedPayload.split(".");
  if (version !== "v1" || !iv || !tag || !body) throw new DomainError("COUPON_UNAVAILABLE", "Coupon content could not be opened.", 503);
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
    decipher.setAAD(Buffer.from(`DROP:coupon:v1:${campaignId}`));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
  } catch { throw new DomainError("COUPON_UNAVAILABLE", "Coupon content could not be opened.", 503); }
}
export function couponReferenceHash(reference: string) {
  return createHmac("sha256", key()).update(`DROP:coupon-reference:v1:${reference}`).digest("hex");
}
