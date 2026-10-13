import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { federationConfigured, federationOptions, federatedFirestoreAuth } from "../../src/server/firebase-credentials";
const token = vi.hoisted(() => vi.fn());
vi.mock("@vercel/oidc", () => ({ getVercelOidcToken: token }));

describe("explicit Vercel to Firestore federation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FIREBASE_CREDENTIAL_MODE", "vercel-oidc");
    vi.stubEnv("FIREBASE_PROJECT_ID", "demo-drop");
    vi.stubEnv("GCP_PROJECT_NUMBER", "12345678901");
    vi.stubEnv("GCP_SERVICE_ACCOUNT_EMAIL", "drop-runtime@demo-drop.iam.gserviceaccount.com");
    vi.stubEnv("GCP_WORKLOAD_IDENTITY_POOL_ID", "drop-vercel");
    vi.stubEnv("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID", "vercel-production");
    vi.stubEnv("GCP_OIDC_AUDIENCE", "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("does not treat a Vercel token alone as a configured Google identity", () => {
    vi.stubEnv("FIREBASE_CREDENTIAL_MODE", "");
    vi.stubEnv("VERCEL_OIDC_TOKEN", "unit-only-placeholder");
    expect(federationConfigured()).toBe(false);
    vi.stubEnv("FIREBASE_CREDENTIAL_MODE", "vercel-oidc");
    vi.stubEnv("GCP_SERVICE_ACCOUNT_EMAIL", "");
    expect(federationConfigured()).toBe(false);
    expect(() => federationOptions()).toThrow();
  });

  it("uses Google's fixed exchange endpoints and the explicit pool/service account", () => {
    const config = federationOptions();
    expect(config.audience).toBe("//iam.googleapis.com/projects/12345678901/locations/global/workloadIdentityPools/drop-vercel/providers/vercel-production");
    expect(config.token_url).toBe("https://sts.googleapis.com/v1/token");
    expect(config.service_account_impersonation_url).toBe("https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/drop-runtime@demo-drop.iam.gserviceaccount.com:generateAccessToken");
    expect(config.scopes).toEqual(["https://www.googleapis.com/auth/datastore"]);
    expect(federatedFirestoreAuth()).not.toBeNull();
    expect(token).not.toHaveBeenCalled();
  });

  it("gets the current Vercel token on each Google refresh without storing a subject token", async () => {
    token.mockResolvedValueOnce("unit-subject-first").mockResolvedValueOnce("unit-subject-next");
    const config = federationOptions();
    await config.subject_token_supplier.getSubjectToken();
    await config.subject_token_supplier.getSubjectToken();
    expect(token).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(config)).not.toContain("unit-subject");
  });

  it("supports only the exact configured provider URL for a custom audience", async () => {
    const audience = "https://iam.googleapis.com/projects/12345678901/locations/global/workloadIdentityPools/drop-vercel/providers/vercel-production";
    vi.stubEnv("GCP_OIDC_AUDIENCE", audience);
    token.mockResolvedValue("unit-subject");
    await federationOptions().subject_token_supplier.getSubjectToken();
    expect(token).toHaveBeenCalledWith({ audience });
    vi.stubEnv("GCP_OIDC_AUDIENCE", "https://untrusted.example/token");
    expect(() => federationOptions()).toThrow();
  });

  it("rejects malformed identifiers, cross-project accounts and endpoint injection", () => {
    for (const value of ["drop-runtime@other-project.iam.gserviceaccount.com", "drop-runtime@evil/path/@demo-drop.iam.gserviceaccount.com", "drop-runtime@demo-drop.iam.gserviceaccount.com?key=bad"]) {
      vi.stubEnv("GCP_SERVICE_ACCOUNT_EMAIL", value);
      expect(() => federationOptions()).toThrow();
    }
    vi.stubEnv("GCP_SERVICE_ACCOUNT_EMAIL", "drop-runtime@demo-drop.iam.gserviceaccount.com");
    vi.stubEnv("GCP_WORKLOAD_IDENTITY_POOL_ID", "pool/../../token");
    expect(() => federationOptions()).toThrow();
  });
});
