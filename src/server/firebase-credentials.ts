import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";
import { DomainError, required } from "./errors";

export const FEDERATION_ENV_NAMES = ["FIREBASE_PROJECT_ID", "GCP_PROJECT_NUMBER", "GCP_SERVICE_ACCOUNT_EMAIL", "GCP_WORKLOAD_IDENTITY_POOL_ID", "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID"] as const;
const unavailable = () => new DomainError("INTEGRATION_UNCONFIGURED", "Service connections for this feature are not configured yet.", 503);

export function federationConfigured() {
  return process.env.FIREBASE_CREDENTIAL_MODE === "vercel-oidc" && FEDERATION_ENV_NAMES.every(name => Boolean(process.env[name]?.trim()));
}

export function federationOptions() {
  const projectId = required("FIREBASE_PROJECT_ID");
  const projectNumber = required("GCP_PROJECT_NUMBER");
  const serviceAccount = required("GCP_SERVICE_ACCOUNT_EMAIL");
  const pool = required("GCP_WORKLOAD_IDENTITY_POOL_ID");
  const provider = required("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");
  // Construct every endpoint from constrained identifiers. No caller-supplied token URLs.
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) || !/^[1-9][0-9]{4,20}$/.test(projectNumber) || !/^[a-z][a-z0-9-]{3,31}$/.test(pool) || !/^[a-z][a-z0-9-]{3,31}$/.test(provider)) throw unavailable();
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]@[a-z][a-z0-9-]{4,28}[a-z0-9]\.iam\.gserviceaccount\.com$/.test(serviceAccount) || !serviceAccount.endsWith(`@${projectId}.iam.gserviceaccount.com`)) throw unavailable();
  const resource = `iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${pool}/providers/${provider}`;
  const customAudience = process.env.GCP_OIDC_AUDIENCE?.trim();
  if (customAudience && customAudience !== `https://${resource}`) throw unavailable();
  return {
    type: "external_account" as const,
    audience: `//${resource}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
    scopes: ["https://www.googleapis.com/auth/datastore"],
    subject_token_supplier: {
      // Fetch a fresh, request-aware Vercel token when Google's SDK refreshes credentials.
      // Neither Vercel nor Google tokens are persisted or logged by DROP.
      getSubjectToken: () => getVercelOidcToken(customAudience ? { audience: customAudience } : undefined),
    },
  };
}

export function federatedFirestoreAuth() {
  const client = ExternalAccountClient.fromJSON(federationOptions());
  if (!client) throw unavailable();
  return client;
}
