/** Shared deterministic movement. Coordinates and hit radius are fractions of the game area. */
export type CatchConfig = { durationMs: number; targetHits: number; radius: number; minGapMs: number };
export const DEFAULT_CATCH: CatchConfig = { durationMs: 18_000, targetHits: 3, radius: 0.105, minGapMs: 350 };
export function catchTarget(seed: string, index: number, elapsedMs: number, durationMs = 18_000) {
  const base = parseInt(seed.slice(0, 8), 16) >>> 0;
  const mixed = (Math.imul(base ^ Math.imul(index + 1, 0x9e3779b1), 0x85ebca6b) >>> 0) / 0xffffffff;
  const phase = mixed * Math.PI * 2;
  const speed = 0.00045 + Math.min(elapsedMs / durationMs, 1) * 0.00018;
  return { x: 0.5 + 0.31 * Math.sin(elapsedMs * speed + phase), y: 0.5 + 0.29 * Math.cos(elapsedMs * speed * 0.79 + phase * 1.7) };
}
export type CatchInput = { nonce: string; events: { at: number; x: number; y: number; target: number }[] };
export function verifyCatch(config: CatchConfig, seed: string, input: CatchInput, serverElapsedMs: number): { passed: boolean; reason?: string } {
  if (input.events.length !== config.targetHits) return { passed: false, reason: "HIT_COUNT" };
  let previous = -config.minGapMs;
  for (let index = 0; index < input.events.length; index++) {
    const event = input.events[index];
    if (!Number.isInteger(event.at) || event.at < 100 || event.at > config.durationMs || event.at > serverElapsedMs + 500 || event.at - previous < config.minGapMs || event.target !== index) return { passed: false, reason: "INVALID_TIMING" };
    if (!Number.isFinite(event.x) || !Number.isFinite(event.y) || event.x < 0 || event.x > 1 || event.y < 0 || event.y > 1) return { passed: false, reason: "INVALID_COORDINATES" };
    const target = catchTarget(seed, index, event.at, config.durationMs);
    if (Math.hypot(event.x - target.x, event.y - target.y) > config.radius) return { passed: false, reason: "TARGET_MISSED" };
    previous = event.at;
  }
  return { passed: true };
}
