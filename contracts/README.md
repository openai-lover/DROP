# DROP reward escrow

`src/DROPRewardEscrow.sol` settles fixed rewards from fully funded campaign budgets. A creator approves exactly `rewardAmount * maxRecipients`, then `createCampaign` transfers that entire budget and freezes the signer, amount, capacity, participation window, claim deadline and rules hash. There is no unfunded campaign state.

The supported token is immutable. Deployment on Monad Testnet (10143) accepts only Circle's `0x534b2f3A21130d7a60830c2Df862319e593943A3`; Monad Mainnet (143) accepts only `0x754704Bc059F8C67012fEd69BC8A327a5aafb603`. A local six-decimal mock is permitted only on chain 31337. Deployment checks contract bytecode and decimals, rather than trusting the token symbol.

## Settlement boundary

The backend judges games and quizzes, serializes FIRST_N_VERIFIED allocation, and issues a persisted award. The escrow cannot prove that a participant is human or that the server judged a game honestly. It verifies a signature from the campaign's fixed signer and the immutable payment rules. `rulesHash` detects changes to published rules; it is not proof of game truth.

EIP-712 domain:

```text
name: DROPRewardEscrow
version: 1
chainId: connected chain
verifyingContract: deployed escrow
```

Primary type (field order and numeric types are significant):

```text
RewardAuthorization(bytes32 campaignId,bytes32 rewardId,uint256 slotIndex,address recipient,address token,uint256 amount,bytes32 participantNullifier,uint256 qualifiedAt,uint256 deadline,bytes32 rulesHash)
```

Anyone may submit `claim(authorization, signature)`, including a sponsored relayer. Tokens always go to the signed recipient. A copied authorization cannot redirect payment. Slot, participant nullifier and recipient are unique within a campaign; reward IDs are unique across this escrow. The nullifier must be a secret-keyed, campaign-scoped pseudonym created offchain, not a plain hash of a Telegram ID.

Participation is `[startsAt, endsAt)`. A qualification cannot be in the future. An authorization can settle after participation ends but only until its deadline, which must be no later than the campaign deadline. Claiming exactly at the deadline is allowed. Refunds become available strictly after that deadline.

`refund(campaignId)` can be called only by the original owner and returns only that campaign's unspent budget. Each campaign's `paid + refunded` is bounded by its own `deposited` balance. `totalLiability` tracks all remaining budgets. Direct unsolicited transfers are **not** campaign funding and have no recovery mechanism: there is intentionally no sweep or administrative withdrawal.

OpenZeppelin SafeERC20, SignatureChecker (EOA and ERC-1271), EIP712 and ReentrancyGuard are imported from the root project's pinned dependency. Checks and accounting updates precede token transfers; failed transfers revert all reservations. Exact transfer balance checks reject fee-on-transfer behavior. USDC issuer freezes or pauses still can prevent payouts and refunds. The contract is not independently audited.

## Local verification

Install the root project's locked dependencies first. With an official compatible Foundry installation:

```sh
cd contracts
forge build
forge test -vv
```

The test token and stateful tests use local chain 31337, never real USDC. Tests cover authorization substitution/domain separation, four independent replay defenses, time boundaries, failure rollback, reentrancy during funding and payment, exact-budget deposits, cross-campaign accounting, ERC-1271, fuzzed payment/refund arithmetic, and stateful randomized claims/replays/time/refunds over two budgets.

`foundry.toml` follows Monad's current official guide: `network = "monad"`; Foundry chooses the active execution hardfork. Do not replace this with a remembered Ethereum fork. The guide requires official Foundry v1.8 or later. Older Forge can perform generic local EVM tests, but those results do not establish Monad execution compatibility.

## Explicit testnet deployment

Deployment has not happened merely because the source or a dry-run compiles. Use approved testnet credentials and budget only. The script requires all of these settings and deliberately rejects mainnet:

```powershell
$env:DROP_DEPLOY_CHAIN_ID = '10143'
$env:DROP_DEPLOY_USDC_ADDRESS = '0x534b2f3A21130d7a60830c2Df862319e593943A3'
$env:DROP_DEPLOYER_ADDRESS = '<approved testnet deployer address>'
forge script script/DeployDROP.s.sol:DeployDROP --rpc-url monad_testnet --account drop-testnet
```

That command is a dry-run. Once the connected chain, official USDC bytecode/decimals, deployer and budget are reviewed and approved, explicitly add `--broadcast`. Prefer an encrypted Foundry keystore; do not paste private keys in commands. No campaign or user payment is created by the deploy script.

After a confirmed deployment, verify the contract source, record its actual address/transaction receipt in `docs/DEPLOYMENT.md`, export the actual compiled ABI, and set the server's allowed escrow address to that exact deployment. Reconcile emitted CampaignFunded/RewardPaid/CampaignRefunded events with persisted awards before showing confirmations. A transaction hash alone is insufficient.

Windows: official binaries can be used directly when available. WSL is an alternative; keep its Node installation and dependencies consistent with the workspace. Missing or older Foundry must be reported as an execution limitation, not silently counted as a passing Monad deployment.

## Sources checked

- [Monad Foundry guide](https://docs.monad.xyz/guides/deploy-smart-contract/foundry): official Foundry version requirement and Monad execution setting.
- [Circle USDC contract addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses): official Monad Mainnet/Testnet addresses; testnet USDC has no financial value.
- [OpenZeppelin Contracts 5.x](https://docs.openzeppelin.com/contracts/5.x): use a pinned published release; do not copy or modify dependency code.

These public pages were checked on 2026-10-13. No live chain deployment or payment is implied by that documentation check.
