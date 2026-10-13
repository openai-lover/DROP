import { describe, expect, it } from "vitest";
import { catchTarget, DEFAULT_CATCH, verifyCatch } from "../../src/server/catch-engine";
import { catchSubmissionSchema, createCampaignSchema, quizSubmissionSchema } from "../../src/server/api";

const seed = "a24892fb34e11dc22c129ab293119faf";
const nonce = "a".repeat(48);
const events = [1000, 2000, 3000].map((at, target) => ({ at, target, ...catchTarget(seed, target, at) }));
describe("server-authoritative catch verification", () => {
  it("accepts in-bounds targets with server-observed time", () => expect(verifyCatch(DEFAULT_CATCH, seed, { nonce, events }, 3100).passed).toBe(true));
  it("rejects forged score and success fields", () => expect(catchSubmissionSchema.safeParse({ nonce, events, score: 999, success: true }).success).toBe(false));
  it("rejects client time ahead of actual elapsed server time", () => expect(verifyCatch(DEFAULT_CATCH, seed, { nonce, events }, 800).passed).toBe(false));
  it("rejects touch events outside the target", () => expect(verifyCatch(DEFAULT_CATCH, seed, { nonce, events: events.map(e => ({ ...e, x: 0, y: 0 })) }, 3100).passed).toBe(false));
  it("rejects reordered targets, instant clicks and incomplete attempts", () => {
    expect(verifyCatch(DEFAULT_CATCH, seed, { nonce, events: events.map(e => ({ ...e, target: 0 })) }, 3100).passed).toBe(false);
    expect(verifyCatch(DEFAULT_CATCH, seed, { nonce, events: events.map(e => ({ ...e, at: 0 })) }, 3100).passed).toBe(false);
    expect(verifyCatch(DEFAULT_CATCH, seed, { nonce, events: events.slice(0, 2) }, 3100).passed).toBe(false);
  });
  it("keeps every target and its touch radius inside the game area", () => {
    for (let target = 0; target < 3; target++) for (let at = 0; at <= 18_000; at += 50) {
      const point = catchTarget(seed, target, at);
      expect(point.x).toBeGreaterThan(DEFAULT_CATCH.radius);
      expect(point.x).toBeLessThan(1 - DEFAULT_CATCH.radius);
      expect(point.y).toBeGreaterThan(DEFAULT_CATCH.radius);
      expect(point.y).toBeLessThan(1 - DEFAULT_CATCH.radius);
    }
  });
});
describe("strict submission and campaign schemas", () => {
  it("never accepts a claimed quiz score", () => expect(quizSubmissionSchema.safeParse({ nonce, answers: [0, 1, 2], score: 3 }).success).toBe(false));
  it("rejects decimal amounts beyond official USDC precision", () => {
    const input = { slug: "community-event", title: "Community event", organizer: "Community", description: "A community reward event", gameType: "CATCH", rewardType: "USDC", rewardAmount: "1.0000001", maxRecipients: 10, startsAt: "2026-10-14T00:00:00Z", endsAt: "2026-10-15T00:00:00Z", claimDeadline: "2026-10-16T00:00:00Z" };
    expect(createCampaignSchema.safeParse(input).success).toBe(false);
  });
});
