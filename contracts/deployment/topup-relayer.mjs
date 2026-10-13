// One root-authorized additional 3.4 test MON top-up; fixed sender/relayer/chain; fees <=0.02 MON.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadKeys } from './testnet.mjs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createPublicClient, formatEther, formatUnits, getAddress, http, keccak256, parseEther, parseTransaction, recoverTransactionAddress } = require('viem');
const root = fileURLToPath(new URL('../../', import.meta.url));
const chainId = 10143;
const sender = getAddress('0xCe5FaB914C165ED28DF1886341f644Adb4C39b0b');
const recipient = getAddress('0xc67AABf3Ded43fA2C2E29e24809C1BD50af9393f');
const amount = parseEther('3.4');
const maximumAuthorizedGasCost = parseEther('0.02');
const output = join(root, '.local', 'testnet-deployment');
const pendingFile = join(output, 'pending-relayer-topup.json');
const reportFile = join(output, 'relayer-topup-report.json');
function assert(condition, code) { if (!condition) throw new Error(code); }
function writeJson(path, value, exclusive = false) {
  mkdirSync(output, { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, ...(exclusive ? { flag: 'wx' } : {}) });
}
export async function validateTopupTransaction(pending, expectedSender, expectedRecipient, cap) {
  const transaction = parseTransaction(pending.serializedTransaction);
  assert(pending.chainId === chainId && pending.sender === expectedSender && pending.recipient === expectedRecipient, 'PERSISTED_FUNDING_ROLES_OR_CHAIN_CHANGED');
  assert(transaction.chainId === chainId && transaction.nonce === pending.nonce && transaction.to && getAddress(transaction.to) === expectedRecipient && transaction.value === amount && (!transaction.data || transaction.data === '0x'), 'PERSISTED_FUNDING_TRANSACTION_INVALID');
  assert(await recoverTransactionAddress({ serializedTransaction: pending.serializedTransaction }) === expectedSender && keccak256(pending.serializedTransaction) === pending.transactionHash, 'PERSISTED_FUNDING_SIGNATURE_OR_HASH_INVALID');
  assert(transaction.gas && transaction.gasPrice && transaction.gas * transaction.gasPrice <= cap && cap <= maximumAuthorizedGasCost, 'PERSISTED_FUNDING_EXCEEDS_AUTHORIZED_GAS_CAP');
  return transaction;
}
async function confirm(client, pending, timeoutMs = 45_000) {
  const stopAt = Date.now() + timeoutMs;
  while (Date.now() < stopAt) {
    let receipt;
    try { receipt = await client.getTransactionReceipt({ hash: pending.transactionHash }); }
    catch (error) { if (error.name !== 'TransactionReceiptNotFoundError') throw new Error('FUNDING_RECEIPT_RPC_UNAVAILABLE'); }
    if (receipt) {
      assert(receipt.status === 'success', 'RELAYER_FUNDING_REVERTED');
      assert(receipt.transactionHash === pending.transactionHash && getAddress(receipt.from) === sender && receipt.to && getAddress(receipt.to) === recipient, 'FUNDING_RECEIPT_IDENTITY_MISMATCH');
      const finalized = await client.getBlock({ blockTag: 'finalized' });
      if (finalized.number !== null && finalized.number >= receipt.blockNumber) {
        const [canonical, transaction, senderBefore, senderAfter, recipientBefore, recipientAfter] = await Promise.all([
          client.getBlock({ blockNumber: receipt.blockNumber }), client.getTransaction({ hash: pending.transactionHash }),
          client.getBalance({ address: sender, blockNumber: receipt.blockNumber - 1n }), client.getBalance({ address: sender, blockNumber: receipt.blockNumber }),
          client.getBalance({ address: recipient, blockNumber: receipt.blockNumber - 1n }), client.getBalance({ address: recipient, blockNumber: receipt.blockNumber }),
        ]);
        assert(canonical.hash === receipt.blockHash, 'FUNDING_RECEIPT_NOT_CANONICAL');
        assert(transaction.value === amount && transaction.input === '0x' && getAddress(transaction.from) === sender && getAddress(transaction.to) === recipient && transaction.nonce === pending.nonce, 'MINED_FUNDING_TRANSACTION_MISMATCH');
        const gasCost = receipt.gasUsed * receipt.effectiveGasPrice;
        assert(gasCost <= maximumAuthorizedGasCost, 'MINED_GAS_COST_EXCEEDS_AUTHORIZED_CAP');
        assert(recipientAfter - recipientBefore === amount && senderBefore - senderAfter === amount + gasCost, 'BLOCK_BALANCE_DELTA_REQUIRES_REVIEW');
        return {
          chainId, sender, recipient, amountMon: '3.4', transactionHash: pending.transactionHash,
          blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash, finalizedBlock: finalized.number.toString(),
          gasUsed: receipt.gasUsed.toString(), effectiveGasPriceGwei: formatUnits(receipt.effectiveGasPrice, 9), actualGasCostMon: formatEther(gasCost),
          balancesAtTransferBlock: { senderBeforeMon: formatEther(senderBefore), senderAfterMon: formatEther(senderAfter), recipientBeforeMon: formatEther(recipientBefore), recipientAfterMon: formatEther(recipientAfter) },
          canonicalFinalizedReceiptVerified: true, exactValueAndRecipientVerified: true, exactBalanceDeltasVerified: true,
          currentSenderMon: formatEther(await client.getBalance({ address: sender })), currentRelayerMon: formatEther(await client.getBalance({ address: recipient })),
          verifiedAtUtc: new Date().toISOString(), liveRelayerTopup: true,
        };
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('FUNDING_PENDING_FINALITY_RERUN_SAME_COMMAND');
}
async function main() {
  const [command = 'prepare', ...args] = process.argv.slice(2);
  assert(['prepare', 'fund', 'confirm'].includes(command), 'UNKNOWN_RELAYER_FUNDING_COMMAND');
  if (command !== 'fund') assert(args.length === 0, 'READ_ONLY_FUNDING_COMMAND_REJECTS_ACTION_FLAGS');
  let cap = maximumAuthorizedGasCost;
  if (command === 'fund') {
    assert(args.includes('--broadcast-testnet'), 'EXPLICIT_TESTNET_BROADCAST_FLAG_REQUIRED');
    const index = args.indexOf('--max-gas-cost-mon');
    assert(index >= 0 && /^\d+(\.\d{1,18})?$/.test(args[index + 1] ?? ''), 'EXPLICIT_FUNDING_GAS_CAP_REQUIRED');
    assert(args.every((value, i) => ['--broadcast-testnet', '--max-gas-cost-mon'].includes(value) || args[i - 1] === '--max-gas-cost-mon'), 'UNKNOWN_FUNDING_OPTION');
    cap = parseEther(args[index + 1]);
    assert(cap > 0n && cap <= maximumAuthorizedGasCost, 'FUNDING_GAS_CAP_MUST_NOT_EXCEED_POINT_ZERO_TWO_MON');
  }
  assert(!process.env.DROP_CHAIN_ID || process.env.DROP_CHAIN_ID === '10143', 'PROCESS_CHAIN_IS_NOT_TESTNET');
  assert(!process.env.DROP_DEPLOY_CHAIN_ID || process.env.DROP_DEPLOY_CHAIN_ID === '10143', 'PROCESS_DEPLOY_CHAIN_IS_NOT_TESTNET');
  assert(process.env.DROP_ENABLE_MAINNET !== 'true', 'PROCESS_MAINNET_ENABLE_FLAG_REJECTED');
  const roles = loadKeys();
  const deployer = roles.find(role => role.role === 'deployer').account;
  const relayer = roles.find(role => role.role === 'relayer').account;
  assert(deployer.address === sender && relayer.address === recipient, 'ISOLATED_FUNDING_ROLES_CHANGED');
  const client = createPublicClient({ transport: http(process.env.DROP_RPC_URL || 'https://testnet-rpc.monad.xyz', { timeout: 15_000, retryCount: 1 }) });
  assert(await client.getChainId() === chainId, 'RPC_IS_NOT_MONAD_TESTNET');
  let pending;
  if (existsSync(pendingFile)) {
    pending = JSON.parse(readFileSync(pendingFile, 'utf8'));
    const transaction = await validateTopupTransaction(pending, sender, recipient, cap);
    if (command === 'confirm') {
      const proof = await confirm(client, pending); writeJson(reportFile, proof); console.log(JSON.stringify(proof, null, 2)); return;
    }
    if (command === 'fund') {
      try {
        await client.getTransactionReceipt({ hash: pending.transactionHash });
        const proof = await confirm(client, pending); writeJson(reportFile, proof); console.log(JSON.stringify(proof, null, 2)); return;
      } catch (error) { if (error.name !== 'TransactionReceiptNotFoundError') throw error; }
      assert(await client.getBalance({ address: sender }) >= amount + transaction.gas * transaction.gasPrice, 'INSUFFICIENT_TEST_MON_TO_RETRY_FUNDING');
    }
  } else assert(command !== 'confirm', 'NO_PERSISTED_RELAYER_FUNDING_TO_CONFIRM');
  if (!pending) {
    const [gas, price, latestNonce, pendingNonce, balance, relayerBalance] = await Promise.all([
      client.estimateGas({ account: sender, to: recipient, value: amount }), client.getGasPrice(),
      client.getTransactionCount({ address: sender, blockTag: 'latest' }), client.getTransactionCount({ address: sender, blockTag: 'pending' }),
      client.getBalance({ address: sender }), client.getBalance({ address: recipient }),
    ]);
    const gasLimit = (gas * 120n + 99n) / 100n, fee = (price * 110n + 99n) / 100n;
    assert(gasLimit * fee <= cap, 'FUNDING_GAS_ESTIMATE_EXCEEDS_CAP');
    const preflight = { mode: 'read-only', chainId, sender, recipient, amountMon: '3.4', senderMon: formatEther(balance), relayerMon: formatEther(relayerBalance), estimatedGas: gas.toString(), gasLimit: gasLimit.toString(), gasPriceGwei: formatUnits(fee, 9), boundedMaximumGasCostMon: formatEther(gasLimit * fee), authorizedGasCapMon: formatEther(cap), signedOrBroadcast: false };
    if (command === 'prepare') { console.log(JSON.stringify(preflight, null, 2)); return; }
    assert(latestNonce === pendingNonce, 'DEPLOYER_ALREADY_HAS_PENDING_TRANSACTION');
    assert(balance >= amount + gasLimit * fee, 'INSUFFICIENT_TEST_MON_FOR_FIXED_AMOUNT_AND_GAS');
    const serializedTransaction = await deployer.signTransaction({ chainId, type: 'legacy', nonce: latestNonce, to: recipient, value: amount, gas: gasLimit, gasPrice: fee });
    pending = { chainId, sender, recipient, amountMon: '3.4', nonce: latestNonce, transactionHash: keccak256(serializedTransaction), serializedTransaction, maximumGasCostMon: formatEther(gasLimit * fee), preparedAtUtc: new Date().toISOString() };
    writeJson(pendingFile, pending, true);
    await validateTopupTransaction(pending, sender, recipient, cap);
  }
  if (command === 'prepare') { console.log(JSON.stringify({ mode: 'read-only', chainId, sender, recipient, amountMon: '3.4', persistedTransactionHash: pending.transactionHash, signedOrBroadcast: false }, null, 2)); return; }
  assert(await client.getChainId() === chainId, 'RPC_CHAIN_CHANGED_BEFORE_FUNDING');
  try { const hash = await client.sendRawTransaction({ serializedTransaction: pending.serializedTransaction }); assert(hash === pending.transactionHash, 'FUNDING_BROADCAST_HASH_MISMATCH'); }
  catch { /* Recover only the persisted hash after ambiguous timeout or already-known response. */ }
  const proof = await confirm(client, pending); writeJson(reportFile, proof); console.log(JSON.stringify(proof, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(/^[A-Z][A-Z0-9_]+$/.test(error.message ?? '') ? error.message : 'RELAYER_FUNDING_FAILED_CHECK_LOCAL_CONFIGURATION_OR_RPC');
    process.exitCode = 1;
  });
}
