import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "../../src/server/errors";
import { GET, POST } from "../../src/app/api/[...path]/route";
const mocks = vi.hoisted(() => ({ after: vi.fn(), authenticate: vi.fn(), listRewards: vi.fn(), submit: vi.fn(), retry: vi.fn(), recover: vi.fn(), status: vi.fn() }));
vi.mock("next/server", async original => ({ ...await original<typeof import("next/server")>(), after: mocks.after }));
vi.mock("../../src/server/api", () => ({ DomainError, authenticate: mocks.authenticate, listRewards: mocks.listRewards, submitGameSession: mocks.submit, queueReward: mocks.retry, getIntegrationStatus: mocks.status }));
vi.mock("../../src/server/request-recovery", async original => ({ ...await original<typeof import("../../src/server/request-recovery")>(), recoverOwnRewards: mocks.recover }));
const principal = { userId: "unit-user", privyId: "unit-identity", wallet: null };
const context = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe("authenticated response recovery hooks", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("DROP_WORKER_MODE", "request"); mocks.authenticate.mockResolvedValue(principal); mocks.listRewards.mockResolvedValue([]); mocks.status.mockReturnValue({ database: false }); mocks.recover.mockResolvedValue({ enabled: true, processed: 0 }); });
  afterEach(() => vi.unstubAllEnvs());

  it("does not schedule a worker on anonymous or rejected authenticated requests", async () => {
    const request = new Request("https://drop.example/api/rewards");
    mocks.authenticate.mockRejectedValue(new DomainError("UNAUTHENTICATED", "Please sign in to continue.", 401));
    expect((await GET(request, context(["rewards"]))).status).toBe(401);
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.recover).not.toHaveBeenCalled();
  });

  it("keeps public status reads free of worker invocations", async () => {
    expect((await GET(new Request("https://drop.example/api/status"), context(["status"]))).status).toBe(200);
    expect(mocks.authenticate).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("schedules only the verified principal after delivering the normal reward response", async () => {
    const response = await GET(new Request("https://drop.example/api/rewards"), context(["rewards"]));
    expect(await response.json()).toEqual({ data: [] });
    expect(mocks.recover).not.toHaveBeenCalled();
    expect(mocks.after).toHaveBeenCalledTimes(1);
    await mocks.after.mock.calls[0][0]();
    expect(mocks.recover).toHaveBeenCalledWith(principal, undefined);
  });

  it("targets the award actually returned by successful server verification", async () => {
    mocks.submit.mockResolvedValue({ outcome: "QUEUED", award: { id: "unit-allocated-award" } });
    const response = await POST(new Request("https://drop.example/api/sessions/unit-session/submit", { method: "POST", body: JSON.stringify({ nonce: "unit-input" }) }), context(["sessions", "unit-session", "submit"]));
    expect(response.status).toBe(200);
    await mocks.after.mock.calls[0][0]();
    expect(mocks.recover).toHaveBeenCalledWith(principal, "unit-allocated-award");
  });

  it("respects the explicit disabled deployment mode", async () => {
    vi.stubEnv("DROP_WORKER_MODE", "disabled");
    expect((await GET(new Request("https://drop.example/api/rewards"), context(["rewards"]))).status).toBe(200);
    expect(mocks.after).not.toHaveBeenCalled();
  });
});
