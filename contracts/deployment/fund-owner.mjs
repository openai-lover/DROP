// Exact, one-time development funding for a root-confirmed real Privy embedded owner.
// prepare [--owner ADDRESS] = read only; fund requires all explicit action flags below.
// Fixed amounts: 0.5 test MON, then 10 Circle test USDC, chain 10143 only.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadKeys } from './testnet.mjs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { createPublicClient, decodeEventLog, encodeFunctionData, formatEther, formatUnits, getAddress, http, isAddress, keccak256, parseAbi, parseEther, parseTransaction, recoverTransactionAddress } = require('viem');
const root = fileURLToPath(new URL('../../', import.meta.url));
const chainId = 10143;
const sender = getAddress('0xCe5FaB914C165ED28DF1886341f644Adb4C39b0b');
const token = getAddress('0x534b2f3A21130d7a60830c2Df862319e593943A3');
// Root observed this wallet after a real production Privy Google login and explicitly authorized it.
const approvedOwner = getAddress('0xa896d06aa2888a749b5460df3d407f2d9ed666b3');
const nativeAmount = parseEther('0.5'), tokenAmount = 10_000_000n, maximumFee = parseEther('0.02');
const directory = join(root, '.local', 'testnet-deployment', 'owner-funding');
const intentFile = join(directory, 'intent.json'), reportFile = join(directory, 'report.json');
const kinds = ['native', 'usdc'];
const tokenAbi = parseAbi([
  'function decimals() view returns (uint8)', 'function balanceOf(address) view returns (uint256)',
  'function transfer(address to,uint256 amount) returns (bool)',
  'event Transfer(address indexed from,address indexed to,uint256 value)',
]);
function assert(condition, code) { if (!condition) throw new Error(code); }
function writeJson(path, value, exclusive = false) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, ...(exclusive ? { flag: 'wx' } : {}) });
}
function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function pendingPath(kind) { return join(directory, `${kind}.pending.json`); }
export function ownerTransferSpec(kind, owner) {
  assert(isAddress(owner) && !/^0x0{40}$/i.test(owner), 'VALID_NONZERO_PRIVY_OWNER_ADDRESS_REQUIRED');
  const recipient = getAddress(owner);
  assert(kinds.includes(kind), 'UNKNOWN_OWNER_FUNDING_KIND');
  return kind === 'native' ? { kind, to: recipient, value: nativeAmount, data: '0x' }
    : { kind, to: token, value: 0n, data: encodeFunctionData({ abi: tokenAbi, functionName: 'transfer', args: [recipient, tokenAmount] }) };
}
export async function validateOwnerFundingTransaction(pending, expectedSender, owner, cap) {
  assert(cap > 0n && cap <= maximumFee, 'OWNER_FUNDING_FEE_CAP_EXCEEDS_AUTHORIZATION');
  const spec = ownerTransferSpec(pending.kind, owner), transaction = parseTransaction(pending.serializedTransaction);
  assert(pending.chainId === chainId && pending.sender === expectedSender && pending.owner === getAddress(owner), 'OWNER_FUNDING_PERSISTED_IDENTITY_CHANGED');
  assert(transaction.chainId === chainId && transaction.nonce === pending.nonce && transaction.to && getAddress(transaction.to) === spec.to && (transaction.value ?? 0n) === spec.value && (transaction.data ?? '0x').toLowerCase() === spec.data.toLowerCase(), 'OWNER_FUNDING_PERSISTED_TRANSACTION_INVALID');
  assert(await recoverTransactionAddress({ serializedTransaction: pending.serializedTransaction }) === expectedSender && keccak256(pending.serializedTransaction) === pending.transactionHash, 'OWNER_FUNDING_PERSISTED_SIGNATURE_OR_HASH_INVALID');
  assert(transaction.gas && transaction.gasPrice && transaction.gas * transaction.gasPrice <= cap, 'OWNER_FUNDING_PERSISTED_FEE_EXCEEDS_CURRENT_CAP');
  return transaction;
}
async function networkContext(client, owner) {
  assert(await client.getChainId() === chainId, 'RPC_IS_NOT_MONAD_TESTNET');
  const finalized = await client.getBlock({ blockTag: 'finalized' });
  assert(finalized.number !== null, 'FINALIZED_TESTNET_BLOCK_UNAVAILABLE');
  const [code, decimals, senderMon, ownerMon, senderUsdc, ownerUsdc] = await Promise.all([
    client.getCode({ address: token, blockNumber: finalized.number }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'decimals', blockNumber: finalized.number }),
    client.getBalance({ address: sender }), client.getBalance({ address: owner }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [sender], blockNumber: finalized.number }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [owner], blockNumber: finalized.number }),
  ]);
  assert(code && code !== '0x' && decimals === 6, 'OFFICIAL_TEST_USDC_CODE_OR_DECIMALS_FAILED');
  return { finalizedBlock: finalized.number.toString(), tokenCodeHash: keccak256(code), senderMon, ownerMon, senderUsdc, ownerUsdc };
}
async function quote(client, kind, owner) {
  const spec = ownerTransferSpec(kind, owner);
  const [gas, price] = await Promise.all([client.estimateGas({ account: sender, to: spec.to, value: spec.value, data: spec.data }), client.getGasPrice()]);
  const gasLimit = (gas * 120n + 99n) / 100n, gasPrice = (price * 110n + 99n) / 100n;
  assert(gasLimit * gasPrice <= maximumFee, 'OWNER_FUNDING_ESTIMATE_EXCEEDS_AUTHORIZED_FEE');
  return { spec, gasLimit, gasPrice, maximumGasCost: gasLimit * gasPrice };
}
async function confirmStep(client, pending, timeoutMs = 45_000) {
  const spec = ownerTransferSpec(pending.kind, pending.owner), stopAt = Date.now() + timeoutMs;
  while (Date.now() < stopAt) {
    let receipt;
    try { receipt = await client.getTransactionReceipt({ hash: pending.transactionHash }); }
    catch (error) { if (error.name !== 'TransactionReceiptNotFoundError') throw new Error('OWNER_FUNDING_RECEIPT_RPC_UNAVAILABLE'); }
    if (receipt) {
      assert(receipt.status === 'success', 'OWNER_FUNDING_TRANSACTION_REVERTED');
      assert(receipt.transactionHash === pending.transactionHash && getAddress(receipt.from) === sender && receipt.to && getAddress(receipt.to) === spec.to, 'OWNER_FUNDING_RECEIPT_IDENTITY_MISMATCH');
      const finalized = await client.getBlock({ blockTag: 'finalized' });
      if (finalized.number !== null && finalized.number >= receipt.blockNumber) {
        const [block, transaction, senderMonBefore, senderMonAfter, ownerMonBefore, ownerMonAfter] = await Promise.all([
          client.getBlock({ blockNumber: receipt.blockNumber }), client.getTransaction({ hash: pending.transactionHash }),
          client.getBalance({ address: sender, blockNumber: receipt.blockNumber - 1n }), client.getBalance({ address: sender, blockNumber: receipt.blockNumber }),
          client.getBalance({ address: pending.owner, blockNumber: receipt.blockNumber - 1n }), client.getBalance({ address: pending.owner, blockNumber: receipt.blockNumber }),
        ]);
        assert(block.hash === receipt.blockHash, 'OWNER_FUNDING_RECEIPT_NOT_CANONICAL');
        assert(transaction.nonce === pending.nonce && transaction.to && getAddress(transaction.to) === spec.to && transaction.value === spec.value && transaction.input.toLowerCase() === spec.data.toLowerCase(), 'OWNER_FUNDING_MINED_TRANSACTION_MISMATCH');
        const gasCost = receipt.gasUsed * receipt.effectiveGasPrice;
        assert(gasCost <= maximumFee, 'OWNER_FUNDING_MINED_FEE_EXCEEDS_AUTHORIZATION');
        const proof = { kind: pending.kind, transactionHash: pending.transactionHash, nonce: pending.nonce,
          blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash, finalizedBlock: finalized.number.toString(),
          actualGasCostMon: formatEther(gasCost), gasUsed: receipt.gasUsed.toString(), canonicalFinalizedReceiptVerified: true,
          exactMinedInputVerified: true, senderMonBefore: formatEther(senderMonBefore), senderMonAfter: formatEther(senderMonAfter),
          ownerMonBefore: formatEther(ownerMonBefore), ownerMonAfter: formatEther(ownerMonAfter) };
        if (pending.kind === 'native') {
          assert(ownerMonAfter - ownerMonBefore === nativeAmount && senderMonBefore - senderMonAfter === nativeAmount + gasCost, 'OWNER_NATIVE_FUNDING_BALANCE_DELTA_REQUIRES_REVIEW');
          return { ...proof, amountMon: '0.5', exactBalanceDeltasVerified: true };
        }
        const [senderBefore, senderAfter, ownerBefore, ownerAfter] = await Promise.all([
          client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [sender], blockNumber: receipt.blockNumber - 1n }),
          client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [sender], blockNumber: receipt.blockNumber }),
          client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [pending.owner], blockNumber: receipt.blockNumber - 1n }),
          client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [pending.owner], blockNumber: receipt.blockNumber }),
        ]);
        const transferEvent = receipt.logs.some(log => {
          if (getAddress(log.address) !== token) return false;
          try { const event = decodeEventLog({ abi: tokenAbi, eventName: 'Transfer', data: log.data, topics: log.topics });
            return getAddress(event.args.from) === sender && getAddress(event.args.to) === pending.owner && event.args.value === tokenAmount;
          } catch { return false; }
        });
        assert(transferEvent, 'OFFICIAL_USDC_TRANSFER_EVENT_MISSING');
        assert(senderBefore - senderAfter === tokenAmount && ownerAfter - ownerBefore === tokenAmount && senderMonBefore - senderMonAfter === gasCost, 'OWNER_USDC_FUNDING_BALANCE_DELTA_REQUIRES_REVIEW');
        return { ...proof, token, amountUsdc: '10', exactBalanceDeltasVerified: true, exactTransferEventVerified: true,
          senderUsdcBefore: formatUnits(senderBefore, 6), senderUsdcAfter: formatUnits(senderAfter, 6), ownerUsdcBefore: formatUnits(ownerBefore, 6), ownerUsdcAfter: formatUnits(ownerAfter, 6) };
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('OWNER_FUNDING_PENDING_FINALITY_RERUN_SAME_COMMAND');
}
async function executeStep(client, deployer, kind, owner, cap) {
  const path = pendingPath(kind), spec = ownerTransferSpec(kind, owner);
  let pending;
  if (existsSync(path)) {
    pending = readJson(path);
    assert(pending.kind === kind, 'OWNER_FUNDING_PERSISTED_STEP_KIND_MISMATCH');
    const transaction = await validateOwnerFundingTransaction(pending, sender, owner, cap);
    try { await client.getTransactionReceipt({ hash: pending.transactionHash }); return confirmStep(client, pending); }
    catch (error) { if (error.name !== 'TransactionReceiptNotFoundError') throw error; }
    assert(await client.getBalance({ address: sender }) >= spec.value + transaction.gas * transaction.gasPrice, 'INSUFFICIENT_TEST_MON_TO_RETRY_OWNER_FUNDING');
  } else {
    const quoted = await quote(client, kind, owner);
    assert(quoted.maximumGasCost <= cap, 'OWNER_FUNDING_ESTIMATE_EXCEEDS_CURRENT_CAP');
    const [latest, next, balance] = await Promise.all([
      client.getTransactionCount({ address: sender, blockTag: 'latest' }), client.getTransactionCount({ address: sender, blockTag: 'pending' }), client.getBalance({ address: sender }),
    ]);
    assert(latest === next, 'DEPLOYER_ALREADY_HAS_ANOTHER_PENDING_TRANSACTION');
    assert(balance >= spec.value + quoted.maximumGasCost, 'INSUFFICIENT_TEST_MON_FOR_OWNER_FUNDING');
    if (kind === 'usdc') assert(await client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [sender] }) >= tokenAmount, 'INSUFFICIENT_TEST_USDC_FOR_OWNER_FUNDING');
    const serializedTransaction = await deployer.signTransaction({ chainId, type: 'legacy', nonce: latest, to: spec.to, value: spec.value, data: spec.data, gas: quoted.gasLimit, gasPrice: quoted.gasPrice });
    pending = { kind, chainId, sender, owner, nonce: latest, transactionHash: keccak256(serializedTransaction), serializedTransaction,
      maximumGasCostMon: formatEther(quoted.maximumGasCost), preparedAtUtc: new Date().toISOString() };
    writeJson(path, pending, true);
    await validateOwnerFundingTransaction(pending, sender, owner, cap);
  }
  assert(await client.getChainId() === chainId, 'RPC_CHAIN_CHANGED_BEFORE_OWNER_FUNDING');
  try { const hash = await client.sendRawTransaction({ serializedTransaction: pending.serializedTransaction }); assert(hash === pending.transactionHash, 'OWNER_FUNDING_BROADCAST_HASH_MISMATCH'); }
  catch { /* Only check this durable hash after an ambiguous response; never make a new transaction. */ }
  return confirmStep(client, pending);
}
function options(argv) {
  const [command = 'prepare', ...args] = argv;
  assert(['prepare', 'fund', 'confirm'].includes(command), 'UNKNOWN_OWNER_FUNDING_COMMAND');
  const valueFlags = ['--owner', '--max-gas-cost-mon'], actionFlags = ['--broadcast-testnet', '--confirm-verified-privy-owner'];
  const values = {}, flags = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    assert(!flags.has(flag), 'DUPLICATE_OWNER_FUNDING_OPTION'); flags.add(flag);
    if (valueFlags.includes(flag)) { assert(args[i + 1] && !args[i + 1].startsWith('--'), 'OWNER_FUNDING_OPTION_VALUE_REQUIRED'); values[flag] = args[++i]; }
    else assert(actionFlags.includes(flag), 'UNKNOWN_OWNER_FUNDING_OPTION');
  }
  if (command !== 'fund') assert([...flags].every(flag => flag === '--owner'), 'READ_ONLY_OWNER_COMMAND_REJECTS_ACTION_FLAGS');
  if (command === 'fund') {
    assert(flags.has('--broadcast-testnet') && flags.has('--confirm-verified-privy-owner'), 'EXPLICIT_BROADCAST_AND_VERIFIED_PRIVY_OWNER_CONFIRMATION_REQUIRED');
    assert(/^\d+(\.\d{1,18})?$/.test(values['--max-gas-cost-mon'] ?? ''), 'EXPLICIT_OWNER_FUNDING_GAS_CAP_REQUIRED');
  }
  const cap = values['--max-gas-cost-mon'] ? parseEther(values['--max-gas-cost-mon']) : maximumFee;
  assert(cap > 0n && cap <= maximumFee, 'OWNER_FUNDING_FEE_CAP_EXCEEDS_AUTHORIZATION');
  const owner = values['--owner'];
  if (owner) ownerTransferSpec('native', owner);
  assert(owner || command === 'prepare', 'ROOT_CONFIRMED_PRIVY_OWNER_ADDRESS_REQUIRED');
  return { command, owner: owner ? getAddress(owner) : null, cap };
}
async function main() {
  const { command, owner, cap } = options(process.argv.slice(2));
  assert(!process.env.DROP_CHAIN_ID || process.env.DROP_CHAIN_ID === '10143', 'PROCESS_CHAIN_IS_NOT_TESTNET');
  assert(!process.env.DROP_DEPLOY_CHAIN_ID || process.env.DROP_DEPLOY_CHAIN_ID === '10143', 'PROCESS_DEPLOY_CHAIN_IS_NOT_TESTNET');
  assert(process.env.DROP_ENABLE_MAINNET !== 'true', 'PROCESS_MAINNET_ENABLE_FLAG_REJECTED');
  if (!owner) {
    console.log(JSON.stringify({ mode: 'read-only-plan', chainId, sender, officialUsdc: token, recipient: null,
      remainingPrerequisite: 'Root must provide and confirm the actual authenticated Privy embedded owner address.',
      exactAmounts: { nativeMon: '0.5', testUsdc: '10' }, feeCapPerTransactionMon: '0.02', signedOrBroadcast: false }, null, 2)); return;
  }
  assert(owner === approvedOwner, 'OWNER_DIFFERS_FROM_ROOT_APPROVED_PRIVY_WALLET');
  const roles = loadKeys(), deployer = roles.find(role => role.role === 'deployer').account;
  assert(deployer.address === sender && !roles.some(role => role.account.address === owner), 'PRIVY_OWNER_MUST_DIFFER_FROM_ISOLATED_SERVICE_ROLES');
  if (existsSync(intentFile)) { const intent = readJson(intentFile); assert(intent.chainId === chainId && intent.sender === sender && intent.owner === owner, 'OWNER_FUNDING_ALREADY_BOUND_TO_ANOTHER_RECIPIENT'); }
  const client = createPublicClient({ transport: http(process.env.DROP_RPC_URL || 'https://testnet-rpc.monad.xyz', { timeout: 15_000, retryCount: 1 }) });
  const context = await networkContext(client, owner);
  const report = { mode: command === 'fund' ? 'explicit-testnet-owner-funding' : 'read-only', chainId, sender, owner, officialUsdc: token,
    exactAmounts: { nativeMon: '0.5', testUsdc: '10' }, feeCapPerTransactionMon: formatEther(cap), steps: [],
    ownerIdentity: 'Supplied and confirmed by root; this script does not authenticate or create a Privy user.', complete: false };
  if (command === 'prepare') {
    const quotes = await Promise.all(kinds.map(kind => quote(client, kind, owner)));
    report.balances = { senderMon: formatEther(context.senderMon), senderUsdc: formatUnits(context.senderUsdc, 6), ownerMon: formatEther(context.ownerMon), ownerUsdc: formatUnits(context.ownerUsdc, 6) };
    report.estimates = quotes.map(q => ({ kind: q.spec.kind, gasLimit: q.gasLimit.toString(), gasPriceGwei: formatUnits(q.gasPrice, 9), maximumGasCostMon: formatEther(q.maximumGasCost), withinRequestedFeeCap: q.maximumGasCost <= cap }));
    report.signedOrBroadcast = false; console.log(JSON.stringify(report, null, 2)); return;
  }
  if (command === 'fund' && !existsSync(intentFile)) {
    const quotes = await Promise.all(kinds.map(kind => quote(client, kind, owner)));
    assert(quotes.every(q => q.maximumGasCost <= cap), 'OWNER_FUNDING_INITIAL_ESTIMATE_EXCEEDS_CAP');
    assert(context.senderUsdc >= tokenAmount && context.senderMon >= nativeAmount + quotes.reduce((sum, q) => sum + q.maximumGasCost, 0n), 'INSUFFICIENT_TEST_FUNDS_FOR_BOTH_FIXED_OWNER_TRANSFERS');
    writeJson(intentFile, { chainId, sender, owner, nativeMon: '0.5', testUsdc: '10', verifiedPrivyOwnerConfirmedByRoot: true, createdAtUtc: new Date().toISOString() }, true);
  }
  assert(existsSync(intentFile), 'NO_PERSISTED_OWNER_FUNDING_INTENT');
  for (const kind of kinds) {
    if (command === 'confirm') {
      assert(existsSync(pendingPath(kind)), 'OWNER_FUNDING_INCOMPLETE_NO_TRANSACTION_FOR_STEP');
      const pending = readJson(pendingPath(kind)); assert(pending.kind === kind, 'OWNER_FUNDING_PERSISTED_STEP_KIND_MISMATCH');
      await validateOwnerFundingTransaction(pending, sender, owner, cap);
      report.steps.push(await confirmStep(client, pending));
    } else report.steps.push(await executeStep(client, deployer, kind, owner, cap));
    writeJson(reportFile, report);
  }
  const after = await networkContext(client, owner);
  report.finalBalances = { senderMon: formatEther(after.senderMon), senderUsdc: formatUnits(after.senderUsdc, 6), ownerMon: formatEther(after.ownerMon), ownerUsdc: formatUnits(after.ownerUsdc, 6) };
  report.complete = true; report.verifiedAtUtc = new Date().toISOString(); writeJson(reportFile, report);
  // Public facts only. Private values and serialized signed transaction bytes are never printed.
  console.log(JSON.stringify(report, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(/^[A-Z][A-Z0-9_]+$/.test(error.message ?? '') ? error.message : 'OWNER_FUNDING_FAILED_CHECK_LOCAL_CONFIGURATION_OR_RPC'); process.exitCode = 1; });
}
