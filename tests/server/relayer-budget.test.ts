import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseUnits } from "viem";
import { enforceFeeCap } from "../../src/server/worker";
const original = { fee: process.env.DROP_MAX_RELAYER_FEE_GWEI, budget: process.env.DROP_MAX_RELAYER_TX_COST_MON };
beforeAll(() => { delete process.env.DROP_MAX_RELAYER_FEE_GWEI; delete process.env.DROP_MAX_RELAYER_TX_COST_MON; });
afterAll(() => { for (const [name, value] of [["DROP_MAX_RELAYER_FEE_GWEI", original.fee], ["DROP_MAX_RELAYER_TX_COST_MON", original.budget]]) { if (value === undefined) delete process.env[name!]; else process.env[name!] = value; } });
describe("Monad relayer gas and signed cost budgets", () => {
  it("accepts representative 122 MON-gwei above Monad's published 100-gwei minimum", () => expect(() => enforceFeeCap(parseUnits("122", 9).toString(), "200000")).not.toThrow());
  it("rejects fees above the bounded default 500-gwei cap", () => expect(() => enforceFeeCap(parseUnits("501", 9).toString(), "200000")).toThrow("fee exceeds"));
  it("enforces the MON budget using gas limit rather than estimated gas used", () => expect(() => enforceFeeCap(parseUnits("500", 9).toString(), "2000000")).toThrow("MON budget"));
  it("honors a tighter configured cap without silently increasing it", () => { process.env.DROP_MAX_RELAYER_FEE_GWEI = "110"; expect(() => enforceFeeCap(parseUnits("122", 9).toString(), "200000")).toThrow("fee exceeds"); delete process.env.DROP_MAX_RELAYER_FEE_GWEI; });
});
