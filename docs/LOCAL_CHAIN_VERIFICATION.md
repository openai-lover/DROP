# Local escrow and worker integration

This opt-in verification connects the compiled `DROPRewardEscrow` to the **actual production payout worker and actual viem RPC/receipt logic**, with Firestore transactions persisted in the local emulator. It fills the gap between isolated Solidity tests and database tests whose chain responses are mocked.

Run from the repository root:

```powershell
# Install the locked project dependencies and official Foundry >= 1.8 first.
forge build --root contracts
# Keep the loopback Firestore emulator running on port 8089.
pnpm firebase:emulators
```

In another terminal:

```powershell
node scripts/local-chain-verify.mjs
```

The runner uses `contracts/.tools/anvil.exe` when present on Windows, or `anvil` from PATH. `ANVIL_PATH` can point to an existing official binary. It does not install tools, deploy Firebase resources, request credentials, or use a public RPC.

## Isolation

- Anvil listens only at `127.0.0.1:18547`, uses chain ID **31337**, and runs Foundry's **Monad network family** with interval mining.
- Each execution uses a fresh Firestore emulator project named `demo-drop-local-chain-<random run ID>`. Existing `demo-drop` QA data is not touched.
- The test refuses to run without `NODE_ENV=test`, the exact loopback emulator, that project prefix, and the fixed local RPC.
- The runner refuses an already occupied Anvil port and stops only the child processes it starts.
- Only test-scoped network/account configuration is substituted. `src/server/config.ts` keeps its production Monad allowlist and gains no 31337 bypass. No public authentication fallback is added.
- Accounts come from Anvil's publicly known development mnemonic. They are local fixtures, not deployment credentials. Never fund these keys on a public network.
- Fixture documents are removed only from the isolated test project. Its analytics are not production users, traction, or mainnet activity.

## What executes

The test deploys the compiled local mock token and actual escrow bytecode. The mock is explicitly a six-decimal **local test token**, not Circle USDC. The escrow constructor accepts it only because the node is chain 31337.

It then exercises real transactions and state:

1. Fund two immutable campaigns through the server's funding plan and verify the actual deposit event and finalized receipt.
2. Start three local identity fixtures against a two-slot campaign, submit server-validated game inputs concurrently, and assert two awards plus one exhausted result. The fixture identities do not claim to have passed Privy login.
3. Execute the actual outbox worker, including real EIP-712 signing, relayer nonce allocation, signed transaction persistence, broadcast, canonical finalized receipt validation, and token settlement.
4. Recover an interrupted worker lease and reject its stale owner. Pause only the local miner until the worker persists and broadcasts a real transaction and its bounded wait expires; then mine it and resume the durable job, asserting no additional relayer transaction. Repeat completed reward retries without another payment.
5. Inspect actual recipient balances, RewardPaid events, persisted receipts and campaign reconciliation.
6. Reject an early refund, explicitly advance **only the isolated local node's test time**, and execute and verify the unused campaign refund.

The local time change is a contract boundary test. It is not a product feature, live campaign expiry, or a hackathon demo shortcut. Gameplay uses actual elapsed server time; this test does not patch game scores, payout receipts, token balances or contract results.

## Evidence and limits

Successful runs write `.local/local-chain-verification.json` with the local deployment addresses, actual transaction hashes, source hash, payment/reconciliation assertions and refund result. This file is an ignored execution artifact; rerun the command to reproduce it.

Verified on **2026-10-13** with official Anvil **1.8.5**: **2 integration tests passed in 62.72 seconds**, including persisted broadcast/mined-transaction recovery with no additional relayer transaction. Root TypeScript checking and static checks for the added files also passed. These are local execution results.

This verifies the **local EVM + Firestore + payout worker** path. Anvil simulates a network; it cannot prove Monad validator consensus, public RPC availability, issuer behavior of actual Circle USDC, or live integration permissions. Privy token validation, first-time embedded wallet creation, consumer browser flows, user-approved wallet transfers, production Functions scheduling and real coupons are outside this test's scope. Those need their respective tests and approved integration credentials.

No public Monad deployment or payment, cloud mutation, hackathon submission, billing action, or real user activity is implied by a passing result.
