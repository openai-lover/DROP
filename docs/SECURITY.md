# DROP security boundaries

DROP is unaudited application and contract code. Automated tests are evidence for their exercised cases; they are not an external security audit or proof that the system cannot fail. Mainnet use requires explicit authorization, deployment review, bounded budgets and independent review.

## Trusted components

Privy establishes authentication and embedded-wallet ownership. The server decides game qualifications and first-N allocation. The authorization signer can approve a false qualification if compromised. The escrow enforces fixed amounts, token, budget, recipient, deadlines and duplicate protection, but does not prove a game was played. `rulesHash` detects configuration divergence; it does not attest to truthful server grading.

One verified account is not one real-world person. Multiple accounts, shared devices, automated inputs and organized participants remain possible. The deterministic catch verification is deliberately an accessible game consistency check, not a CAPTCHA or perfect bot detector. Quiz correctness does not prove AMA listening or humanity.

## Authentication and authorization

- Privy access tokens are verified server-side. No public development-token bypass exists.
- The recipient comes from a verified Privy Ethereum wallet profile. The body cannot override identity or recipient.
- Every creator read and mutation checks `ownerId`. A missing or foreign campaign returns a generic not-found response.
- Every reward, retry, proof and coupon endpoint checks the authenticated winner. Coupon plaintext is never returned by creator/public metadata or reward lists.
- Deterministic claim documents created in the allocation transaction prevent account, wallet, slot and nullifier reuse even when callers race. Reward IDs are generated from cryptographic UUIDs and rejected if reused by the contract.
- Shared transactional Firestore rate limits constrain authenticated creation, attempts, submissions, retries and coupon reads across instances. An edge/service-level unauthenticated request limit should additionally protect the login and public endpoints. Direct Firestore client access is denied; only the server Admin SDK reads private collections.

## Signing and chain controls

Authorization and relayer keys are separate. EIP-712 includes chain ID and verifying contract, and the proof binds every payout dimension. Participant identifiers use a campaign-scoped secret HMAC rather than a simple hash of Telegram IDs. Public proofs reveal neither the Privy DID nor a stable cross-campaign identifier.

The payout worker constructs only the configured escrow's `claim` calldata. It does not expose an arbitrary relayer transaction endpoint. No server key has authority to withdraw recipient wallets. Operator approvals are exact-budget approvals, and escrow recovery returns funds to the original owner after the receipt deadline.

Official Circle addresses are allowlisted per supported chain. Server and contract checks enforce deployment code and six decimals; token symbol alone is never accepted. Testnet USDC and MON have no monetary value. Real merchant coupons are separate inventory and are never purchased using testnet funds.

Funding, payout and refund confirmation require a successful canonical receipt whose block is covered by the provider's finalized head at the configured confirmation depth. The receipt block hash must match the header fetched at that height, and payment/accounting state is read at the finalized snapshot. `latest`/`pending` advancement, an unfinalized event, or a reverted receipt before sufficient finalized coverage is not proof of settlement or safe nonce consumption. A provider that cannot supply finalized headers or required historical state leaves the operation pending/failed; the implementation does not silently weaken the gate. RPC responses remain a trust dependency rather than independent consensus verification.

Outgoing transfers require the participant's approval. The client verifies finalized coverage, a canonical block hash, receipt success, and a USDC `Transfer` event with the exact sender, approved recipient and integer amount before showing completion. Neither a wallet-returned hash nor a success-looking unrelated receipt is sufficient. This guard does not establish that live Privy sponsorship is configured or has been tested.

## Storage and coupon privacy

AES-256-GCM uses random nonces and binds each coupon to its campaign. Its encryption key belongs in a private secret store. Rotation needs an explicit migration that decrypts with the old key and re-encrypts with the new key; replacing the key without migration makes current inventory unreadable. Coupon references are keyed hashes and contents are excluded from audit and analytics properties.

Databases and backups still contain sensitive user identity mappings and encrypted inventory. Apply private networking, least-privilege database access, backup encryption and retention policies. API handlers serving coupon content use no-store/private caching and no-referrer controls. Never place real coupon content or barcode assets under `public/`, generated OG images, analytics or Git.

## Queue and failure handling

Awards and payout outbox records commit together. Leases recover after process interruption. Signed transaction bytes and actual hashes commit before broadcast. Known stored transaction hashes are checked before historical log queries. Receipt success, matching settlement event, canonical/finalized block coverage and finalized contract state are necessary for confirmed status. A provider timeout produces a recheck state rather than a fabricated success. Every later write verifies lease ownership and terminal award state so an old invocation cannot overwrite a confirmed or delivered reward.

An authorization already paid on-chain is reconciled before expiry checks. Recovery paths preserve the same reward ID, slot and recipient. Unknown settlement receipts are searched in at most three backwards pages of 100 blocks per tick, with a durable cursor and saved settlement hash. This limits each query/work cycle and survives interruption; unavailable history remains an explicit recovery error. Prepared relayer nonces remain open until finalized consumption even when the award expires or is claimed directly. Reconciliation can reopen an expired job if finalized state proves a real payment. An expired reward does not free the first-N slot for a different participant; historical allocations remain stable. Coupon delivery is not marked merchant-redeemed without supplier confirmation.

Operational limitations remain: a persistent RPC outage, pruned receipts/history, depleted relayer gas, incorrect provider policy or fees above the configured cap can delay payouts until the receipt deadline. Operators must monitor worker errors, queued-age and gas, run reconciliation and offer the durable manual proof recovery path. The worker replaces stalled transactions using the same nonce and fixed payout proof and tracks all candidate hashes for that nonce. If a replacement exceeds the current caps, it rebroadcasts the original only when the original remains permitted; lowering a cap can prohibit that original too. Prepared nonce draining therefore still depends on a usable provider, gas and permitted transaction fees.

The default per-gas cap is 500 MON gwei and is configurable through `DROP_MAX_RELAYER_FEE_GWEI`; it is a ceiling, not a quoted execution cost. Each signed transaction additionally has a default maximum of 0.25 MON using `gasLimit * maxFeePerGas`, configurable through `DROP_MAX_RELAYER_TX_COST_MON`. Monad's published minimum base fee is 100 MON gwei, so a cap below that minimum blocks payouts. Monad charges the gas limit, not gas used. A dedicated relayer account must not also send unrelated transactions. Use bounded campaigns while evaluating live behavior. [Monad gas pricing](https://docs.monad.xyz/developer-essentials/gas-pricing)

## Deployment and credential operations

Cloud Firestore rules/indexes have been deployed to `drop-5a400`, with direct clients denied access. Admin SDK calls bypass client rules, so correct Vercel identity/IAM, Privy verification and server tenant checks remain necessary. The Vercel Firebase API credential is not yet set; database/rules deployment alone does not prove application data access.

The project remains on Spark under the user's explicit no-billing-upgrade instruction. Prepared and locally built Firebase Functions cannot deploy on that plan; no cloud trigger, retry scheduler or reconciliation processor is claimed live. Until an authorized durable processor compatible with that restriction is verified, real reward completion remains an open release gate. Do not upgrade billing to close it without a new explicit instruction. [Functions deployment prerequisite](https://firebase.google.com/docs/functions/get-started)

Avoid account-inspection commands that dump complete credential/account objects. During setup, `firebase login:list --json` unexpectedly included credential material, so it must not be used as a harmless status probe or copied into logs, chat, screenshots or Git. Inspect only non-sensitive project metadata or allowlisted/redacted status fields. Keep service-account JSON, CLI credential stores, OAuth tokens and secret-manager values private; do not print them to debug connectivity. If exposure is suspected, handle revocation/rotation through the owner's private account process without reproducing the secret.

## Verification scope

Unit tests cover forged authentication boundaries, target/time/score manipulation, strict quiz inputs and coupon authenticated encryption. RPC tests exercise finalized/canonical receipt gates and fee policies with synthetic provider responses. Real Firestore emulator integration tests require `NODE_ENV=test`, project `demo-drop` and loopback port 8089. They cover allocation races, session replay, private quiz data, account/wallet duplicates, coupon access, lease restart, bounded durable log recovery, prepared nonce drain, stale-worker fencing, expired-payment reopening and persistent rate limits. Chain-adapter fixtures cannot authenticate or pay in a deployed app. Foundry tests cover the actual escrow contract separately. Browser tests cover rendered practice/unconfigured behavior, responsive layout, keyboard/touch and bilingual validation separately from real Privy login, sponsored outgoing transfers or authenticated testnet settlement. Current execution evidence is recorded in [INTEGRATION_STATUS.md](INTEGRATION_STATUS.md).

No actual interview response, user adoption, deployment address, live coupon stock or testnet payout should be claimed without externally verifiable evidence. Integration and submission documents must identify absent credentials and unexecuted checks explicitly.
