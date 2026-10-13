import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../../src/app/api/internal/recovery/route";
const recover = vi.hoisted(() => vi.fn());
vi.mock("../../src/server/request-recovery", async original => ({ ...await original<typeof import("../../src/server/request-recovery")>(), recoverDaily: recover }));

describe("protected free daily recovery endpoint", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("CRON_SECRET", "unit-only-cron-secret-at-least-32-characters"); vi.stubEnv("DROP_WORKER_MODE", "request"); recover.mockResolvedValue({ accepted: true, processed: 2, revived: 0 }); });
  afterEach(() => vi.unstubAllEnvs());
  const request = (authorization?: string) => new Request("https://drop.example/api/internal/recovery", { headers: authorization ? { authorization } : {} });

  it("rejects anonymous and incorrect credentials without running any work", async () => {
    for (const input of [request(), request("Bearer incorrect"), request("Basic unit-only-cron-secret-at-least-32-characters")]) {
      const response = await GET(input);
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toContain("no-store");
    }
    expect(recover).not.toHaveBeenCalled();
  });

  it("fails closed for absent/short secrets and an explicitly disabled worker", async () => {
    vi.stubEnv("CRON_SECRET", "short");
    expect((await GET(request("Bearer short"))).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "unit-only-cron-secret-at-least-32-characters");
    vi.stubEnv("DROP_WORKER_MODE", "disabled");
    expect((await GET(request("Bearer unit-only-cron-secret-at-least-32-characters"))).status).toBe(503);
    expect(recover).not.toHaveBeenCalled();
  });

  it("runs only the bounded recovery service and exposes counts, not private job data", async () => {
    const response = await GET(request("Bearer unit-only-cron-secret-at-least-32-characters"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { accepted: true, processed: 2, revived: 0 } });
    expect(recover).toHaveBeenCalledTimes(1);
  });

  it("does not disclose SDK exceptions or credentials on provider failure", async () => {
    recover.mockRejectedValue(new Error("private provider URL must not be disclosed"));
    const response = await GET(request("Bearer unit-only-cron-secret-at-least-32-characters"));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private provider");
  });
});
