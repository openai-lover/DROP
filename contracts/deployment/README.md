# DROP Monad Testnet deployment

**Final submission:** Consumer Products & Payments + **Privy** is **READY FOR JUDGING**, re-submission confirmed `2026-10-13T16:57:26.785Z` (Oct14 01:57 KST); portal Save16:56UTC7/7. Initial primary confirmation: `2026-10-13T16:39:30.988Z`. Required Privy integration description:1,808characters. Separate optional Privy video omitted. Actual wallet creation/creator contract transactions are verified; DROP pays receiving gas through its own relayer, not Privy sponsorship. `acf5b73` is the deployed app baseline; same-human technical accounts are not traction.

This workflow is restricted to **Monad Testnet 10143** and Circle's test USDC at **`0x534b2f3A21130d7a60830c2Df862319e593943A3`**. Mainnet, real funds, existing personal wallets and paid infrastructure are outside this workflow. A real empty escrow was deployed and independently verified; the public proof is recorded below. That deployment does not imply funded campaigns or live reward payments.

Run commands from the DROP repository root with Node 22.12+ and the locked root dependencies. The helper uses `contracts/.tools/forge.exe` on this Windows checkout; set `FORGE_PATH` to an official Foundry 1.8+ executable elsewhere. Keep the project's `network = "monad"` configuration and actual compiled compiler/hardfork metadata. Do not change compilation settings after broadcasting.

## Isolated roles

`node contracts/deployment/testnet.mjs init` creates new cryptographically random keys only if ignored `.local/testnet-only.env` does not already exist. It never replaces keys or imports an existing wallet, and prints only public addresses. The three roles are distinct:

| Role | Address created for this testnet run | Needs |
|---|---|---|
| Deployer / intended campaign creator | `0xCe5FaB914C165ED28DF1886341f644Adb4C39b0b` | Test MON for deployment; test USDC for later campaign funding |
| Campaign authorization signer | `0x9bD494B659B1D96b91Ae5fA6C8Af677cB793d872` | Server-side signing only; no MON needed to sign |
| Restricted payout relayer | `0xc67AABf3Ded43fA2C2E29e24809C1BD50af9393f` | Test MON for `claim` transaction fees |

The escrow constructor accepts only `(officialTestUsdc, 10143)`. It has no admin or configurable authorization signer at deployment. Each campaign fixes its own signer when its owner funds `createCampaign`; the server must use the matching authorization key. Funding, signing and relaying remain separate actions.

Never print/copy the private values into logs, command arguments, public build variables, a browser, a demo video or a repository. The server's authorization and relayer credentials must remain server-side. This file has explicit testnet guards, but private keys are mathematically usable on other EVM chains: **never fund these addresses on mainnet**. Do not overwrite an existing Vercel environment file when installing these settings.

## Free faucet prerequisites

Verified official sources on 2026-10-14 KST:

- [Monad network documentation](https://docs.monad.xyz/developer-essentials/testnet): Testnet `10143`, public RPC `https://testnet-rpc.monad.xyz`. Public RPCs are rate-limited.
- [Official MON faucet](https://faucet.monad.xyz/): request test MON for the deployer and relayer. Its UI may require CAPTCHA or social account checks. This preparation did not submit a faucet request.
- [Circle faucet](https://faucet.circle.com/): select **USDC → Monad Testnet → deployer address**. The current page offers 20 test USDC per address/network every two hours. These tokens have no financial value. It is unnecessary to fund the escrow directly: direct transfers do not create campaigns and the contract deliberately has no sweep.
- [Circle token addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses): confirms the exact fixed test USDC contract above.

## Read-only preparation

```text
node contracts/deployment/testnet.mjs prepare
node --test contracts/deployment/testnet.safety.test.mjs
```

`prepare` compiles locally and generates `.local/testnet-deployment/compiler-input.json`, `metadata.json`, `abi.json`, `constructor-args.txt`, `package.json` and `report.json`. The compiler input contains the 24 public Solidity source files and pinned settings; it contains no credentials. `forge verify-contract --show-standard-json-input` only formats these files locally. Its required address argument uses a format placeholder, never a claimed deployment address.

The helper checks actual RPC chain ID, finalized block, official token bytecode/decimals, public balances and deployment gas. The gas estimate uses a **simulation-only** balance override for an unfunded new deployer; no account balance changes. It reports this distinction explicitly. It does not sign, claim faucets, send transactions or upload source during `prepare`.

First live preflight: finalized block **70,714,958**, token decimals **6**, all three balances **0 MON / 0 USDC**, gas price **102 gwei**. Deployment estimate **1,644,848 gas**, approximately **0.167774496 test MON** at that price. The helper's 20% gas-limit and 10% gas-price margins bound the prepared transaction at **0.2214623796 test MON**; a **0.25 test MON** cap is suitable only while a fresh preflight remains below it. A faucet drip of 1 test MON would exceed this estimate. A configured cap is a ceiling, not a promise that deployment will be allowed or cost exactly that amount.

Compilation: Solidity **0.8.28+commit.7893614a**, via IR, optimizer 200, OpenZeppelin **5.6.1**, effective compiled EVM version **prague** with Monad execution configuration. Official Forge **1.8.5** passed 42 unit/fuzz tests and both invariant properties (256 runs / 16,384 calls). Six offline deployment safety tests check signature/hash recovery, chain/value/input guards, cost cap, nonce-derived contract address, compiler-defined immutable byte ranges and CLI rejection of implicit action/mainnet/source-upload-through-confirm requests. They do not prove a live deployment.

## Explicit deployment, after faucet coordination

This command sends **one zero-value contract creation transaction** and spends only test MON gas. Run it only after the parent task coordinates funding and authorizes the broadcast:

```text
node contracts/deployment/testnet.mjs deploy --broadcast-testnet --max-cost-mon 0.25
```

It rechecks Testnet and Circle USDC, estimates without a balance override, rejects another pending deployer transaction, checks actual deployer balance and enforces the cost cap before signing. The signed transaction/hash/nonce are persisted in ignored `pending-deployment.json` **before** submission. A restart first checks the same receipt and can rebroadcast only the identical persisted transaction; it does not allocate another nonce or deploy twice. It never automatically raises fees or budgets. If the current cap is lower than the persisted transaction cost, it stops.

A timeout is not evidence of failure. Re-run the identical command to recover the same transaction. Do not remove the pending record, regenerate keys or start a second deployment to resolve a timeout. A reverted transaction, changed sources, changed credentials, incompatible receipt or changed runtime stops the workflow for explicit review.

Successful deployment requires a success receipt on the canonical block at or below the RPC's **finalized** head. The helper verifies transaction sender/creation input, nonce-derived contract address, compiled deployed bytecode (normalizing only compiler-declared immutable offsets), token/chain getters and EIP-712 domain. It records only public proof in `report.json`; raw signed bytes remain in the ignored pending file. A transaction hash alone is never marked as a verified deployment.

## Source verification after confirmed deployment

To recheck this already-published escrow without uploading any source, use:

```text
node contracts/deployment/testnet.mjs confirm
```

`confirm` uses RPC reads and **GET-only** Sourcify reads. It requires a `perfect` full-match record for chain 10143 and exact equality between the published compiler metadata and solc's canonical `rawMetadata`. Foundry's typed `metadata` object normalizes remappings and drops some NatSpec/empty ABI fields, so comparing that convenience representation is insufficient. The actual source package retains the raw compiler representation.

For a future explicitly authorized source upload, use:

```text
node contracts/deployment/testnet.mjs verify --verify-source
```

This explicitly uploads only the public source/metadata to the [official-guide Sourcify endpoint](https://docs.monad.xyz/guides/verify-smart-contract/foundry), `https://sourcify-api-monad.blockvision.org/`, after independently rechecking the finalized deployment. Alternatively add `--verify-source` to the explicit deployment command. The tool must confirm verification before `sourceVerified` becomes true. Source verification failure does not undo an already deployed escrow: keep its persisted transaction and retry verification, never deploy again.

The standard JSON input and ABI are retained locally for manual explorer verification if the provider is unavailable. Do not change metadata/hash/literal-content flags after deployment merely to follow a different verification example; the verifier must reproduce the exact creation/runtime bytecode that was deployed.

After the real deployment is confirmed, set `DROP_ESCROW_ADDRESS` to its actual address, configure the server's matching isolated authorization/relayer keys and enable only Testnet. Configure Privy, server database access and a durable processor separately. One deployed empty escrow does not prove funded campaigns, real user identity, payouts, sponsored user transfers or refunds. Confirm campaign funding and actual recipient balance/event/receipt evidence before claiming a live reward demo.

## Completed public deployment proof

Recorded at **2026-10-14 00:26 KST** after explicit root authorization of one zero-value creation transaction with a **0.25 test MON** gas cap. Public machine-readable evidence: [testnet-deployment.public.json](testnet-deployment.public.json).

| Verified fact | Actual value |
|---|---|
| Escrow | [`0x22acf105A1af3f104f62e06fD813e49Af9358379`](https://testnet.monadvision.com/address/0x22acf105A1af3f104f62e06fD813e49Af9358379) |
| Creation transaction | [`0xb17568879280ebdd217af621d0d7aab95aa2bf8f421bbc66e890e6c3d69cfeb5`](https://testnet.monadvision.com/tx/0xb17568879280ebdd217af621d0d7aab95aa2bf8f421bbc66e890e6c3d69cfeb5) |
| Canonical deployment block | `70,715,601` |
| Block hash | `0xa0ea6f1bab0c3de45f1bb1515f2e102e135ad1b61d2bea918e05b691d38e2016` |
| Finalized head at independent recheck | `70,716,825` |
| Actual gas charged | `1,973,818` at `112.2 gwei` |
| Actual deployment gas cost | `0.2214623796 test MON`, below the `0.25` cap |
| Deployer balances after deployment | `4.7785376204 test MON`, `20 test USDC` |
| Actual runtime code Keccak-256 | `0x573018238213b8b6666eb0d6ba4f2a0843dc654873b2345e0d387fd2c2d5df8e` |
| Explorer source status | Sourcify **`perfect`**, public canonical metadata exactly matches compiled raw metadata |

Verified the canonical success receipt at/below finalized head, exact creation input, nonce-derived address, compiled runtime outside declared immutable offsets, fixed USDC/chain getters and EIP-712 name/version/chain/verifying-contract. The checked-in ABI array matches the compiled deployment ABI exactly. `DROP_ESCROW_ADDRESS` is set to this actual address only in ignored `.local/testnet-only.env`; this does not install credentials in Vercel or enable a hosted worker.

The initial authorized explorer verification produced an already-verified success response. A later repeat source-upload attempt was rejected by automatic approval review for potential private-source disclosure. No workaround or repeat upload was used after that rejection; verification was independently completed by reading the already-public [perfect-match status](https://sourcify-api-monad.blockvision.org/check-by-addresses?addresses=0x22acf105A1af3f104f62e06fD813e49Af9358379&chainIds=10143) and [published metadata](https://sourcify-api-monad.blockvision.org/repository/contracts/full_match/10143/0x22acf105A1af3f104f62e06fD813e49Af9358379/metadata.json).

**No campaign was funded, no payout was claimed and no test USDC was transferred by this deployment workflow.** The relayer was unfunded at the deployment check; its later fixed native funding is recorded below. Privy, cloud server credentials, worker operation and real user settlement require their own integration evidence.

Official Foundry deployment and verification references: [deploy](https://docs.monad.xyz/guides/deploy-smart-contract/foundry), [verify](https://docs.monad.xyz/guides/verify-smart-contract/foundry). The `prepare` and `confirm` commands remain read-only; the completed deployment used the explicit broadcast command.

## Completed fixed relayer funding

The root task explicitly authorized exactly **0.5 test MON** from the isolated deployer to the isolated relayer, with a maximum **0.02 test MON** gas cost. `fund-relayer.mjs` pins both addresses, amount and chain 10143; it has no arbitrary recipient, amount or token-transfer option.

```text
node contracts/deployment/fund-relayer.mjs prepare
node --test contracts/deployment/fund-relayer.safety.test.mjs
node contracts/deployment/fund-relayer.mjs fund --broadcast-testnet --max-gas-cost-mon 0.02
node contracts/deployment/fund-relayer.mjs confirm
```

`prepare` and `confirm` only read public chain state. The explicit `fund` command persists signed bytes/hash/nonce in ignored `pending-relayer-funding.json` before sending. Retries first inspect that exact receipt and never allocate another transfer nonce. It rejects wrong chain, changed role, nonempty call data, another amount/recipient, signature/hash mismatch and excessive fees. Four focused offline tests pass. The signed record contains no private key and remains ignored.

Actual proof: [relayer-funding.public.json](relayer-funding.public.json), verified **2026-10-14 00:34 KST**.

| Verified fact | Actual value |
|---|---|
| Native transfer | **0.5 test MON**, deployer → `0xc67AABf3Ded43fA2C2E29e24809C1BD50af9393f` |
| Transaction | [`0xbbaf81383995baa5b1162bd5b67781d6d69e2e62d2083582eae02c70bd407d2c`](https://testnet.monadvision.com/tx/0xbbaf81383995baa5b1162bd5b67781d6d69e2e62d2083582eae02c70bd407d2c) |
| Canonical block / finalized head | `70,718,377` / `70,718,379` |
| Gas cost | **0.00282744 test MON**, below the authorized `0.02` cap |
| Deployer native balance | `4.7785376204` → **`4.2757101804 test MON`** |
| Relayer native balance | `0` → **`0.5 test MON`** |

Confirmed success receipt, canonical block at/below finalized head, exact sender/recipient/amount/nonce and historical balances on the block immediately before and at the transfer. Sender decrease equals `0.5 + actualGasCost`; recipient increase equals exactly `0.5`. A separate `confirm` rechecks the same persisted transaction without another send. No campaign, fake user, payout or USDC transfer was created by this helper.

## Minimal actual campaign integration path

1. Sign in through the deployed application's real Privy flow and obtain its **embedded Ethereum wallet**. `src/server/auth.ts` accepts the Privy-linked embedded wallet; the generated deployer is not a substitute user or campaign owner.
2. After explicit coordination, give that exact wallet enough **test USDC for rewardAmount × maxRecipients**, either through Circle's faucet or an approved testnet transfer. Do not send directly to the escrow. Native tokens in the backend relayer do not pay the creator's Privy transaction fees.
3. Create a genuine USDC draft at `/dashboard/new`. The backend requires a start at least one minute ahead, end after start and claim deadline after end (all within 30 days). Allow at least five minutes before the start while completing the initial wallet/funding setup.
4. The dashboard requests `GET /api/creator/campaigns/{id}/funding`. The server returns exactly `USDC.approve(escrow, fullBudget)` and `escrow.createCampaign(...)` with the persisted campaign ID, signer, capacity, amount, period, deadline and rules hash. Both must be signed by the recorded Privy owner wallet on 10143.
5. The dashboard submits the actual creation transaction hash to `POST /api/creator/campaigns/{id}/funding`. The server opens participation only after checking a canonical finalized success receipt, expected funding event and every onchain immutable/deposit field. Approval alone is not funded publication.
6. Actual participant play must pass the server's game verifier and persisted FIRST_N_VERIFIED allocation. The configured processor uses the fixed authorization signer and now-funded restricted relayer; verify canonical finalized `RewardPaid`, the actual recipient's USDC balance and restart/retry behavior before recording a live payout demo.

Current UI supports **wallet-paid test MON with sponsorship disabled**. It selects the recorded embedded wallet/address, chain10143 and visible cancellable Privy confirmation. Actual owner approval/deposit used this path; [5-USDC funding](live-campaign-funding.public.json) and [2-USDC judge funding](judge-event-funding.public.json) independently prove the receipts, exact budget and wallet-paid fees. `NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED=true` only requests genuine configured sponsorship and does not prove it works; paid sponsorship setup remains outside authorization. Receiving is separate: the restricted relayer paid the actual quiz claim while the recipient retained zeroMON/nonce. [Payment proof](live-participant-payment.public.json), [provider sponsorship requirements](https://docs.privy.io/wallets/gas-and-asset-management/gas/setup).
