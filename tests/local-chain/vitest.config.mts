import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['tests/local-chain/escrow-worker.local.spec.ts'], testTimeout: 90_000, hookTimeout: 90_000, fileParallelism: false } });
