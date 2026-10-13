import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ownerTransferSpec, validateOwnerFundingTransaction } from './fund-owner.mjs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { decodeFunctionData, encodeFunctionData, getAddress, keccak256, parseAbi, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
// Public offline signing fixture only; not a generated service key or a production Privy account.
const account = privateKeyToAccount(`0x${'77'.repeat(32)}`);
const owner = getAddress('0xa896d06aa2888a749b5460df3d407f2d9ed666b3');
const other = getAddress('0x2222222222222222222222222222222222222222');
const token = getAddress('0x534b2f3A21130d7a60830c2Df862319e593943A3');
const transferAbi = parseAbi(['function transfer(address to,uint256 amount) returns (bool)']);
async function fixture(kind, overrides = {}) {
  const spec = ownerTransferSpec(kind, owner);
  const serializedTransaction = await account.signTransaction({ chainId: 10143, type: 'legacy', nonce: kind === 'native' ? 2 : 3,
    to: spec.to, value: spec.value, data: spec.data, gas: 60_000n, gasPrice: 100_000_000_000n, ...overrides });
  return { kind, chainId: 10143, sender: account.address, owner, nonce: kind === 'native' ? 2 : 3,
    serializedTransaction, transactionHash: keccak256(serializedTransaction) };
}
test('fixed owner specifications contain exact 0.5 MON and official six-decimal 10 USDC calldata', () => {
  const native = ownerTransferSpec('native', owner), usdc = ownerTransferSpec('usdc', owner);
  assert.equal(native.to, owner); assert.equal(native.value, parseEther('0.5')); assert.equal(native.data, '0x');
  assert.equal(usdc.to, token); assert.equal(usdc.value, 0n);
  const decoded = decodeFunctionData({ abi: transferAbi, data: usdc.data });
  assert.equal(decoded.functionName, 'transfer'); assert.equal(getAddress(decoded.args[0]), owner); assert.equal(decoded.args[1], 10_000_000n);
});
test('each persisted step recovers a genuine offline signature and fixed-chain nonce/value/input', async () => {
  for (const kind of ['native', 'usdc']) {
    const tx = await validateOwnerFundingTransaction(await fixture(kind), account.address, owner, parseEther('0.02'));
    assert.equal(tx.chainId, 10143); assert.equal(tx.nonce, kind === 'native' ? 2 : 3);
  }
});
test('native funding refuses mainnet, changed owner/amount and unexpected contract calldata', async () => {
  for (const change of [{ chainId: 143 }, { to: other }, { value: parseEther('0.6') }, { data: '0x00' }]) {
    await assert.rejects(validateOwnerFundingTransaction(await fixture('native', change), account.address, owner, parseEther('0.02')), /TRANSACTION_INVALID/);
  }
});
test('USDC funding refuses another token, recipient/amount substitution and attached native value', async () => {
  for (const change of [
    { to: getAddress('0x754704Bc059F8C67012fEd69BC8A327a5aafb603') },
    { data: encodeFunctionData({ abi: transferAbi, functionName: 'transfer', args: [other, 10_000_000n] }) },
    { data: encodeFunctionData({ abi: transferAbi, functionName: 'transfer', args: [owner, 11_000_000n] }) },
    { value: parseEther('0.1') },
  ]) await assert.rejects(validateOwnerFundingTransaction(await fixture('usdc', change), account.address, owner, parseEther('0.02')), /TRANSACTION_INVALID/);
});
test('resume cannot raise authorized fee, tamper nonce/hash or swap native and USDC records', async () => {
  const pending = await fixture('usdc');
  await assert.rejects(validateOwnerFundingTransaction(pending, account.address, owner, parseEther('0.03')), /CAP_EXCEEDS_AUTHORIZATION/);
  await assert.rejects(validateOwnerFundingTransaction(pending, account.address, owner, parseEther('0.005')), /FEE_EXCEEDS_CURRENT_CAP/);
  await assert.rejects(validateOwnerFundingTransaction({ ...pending, nonce: 99 }, account.address, owner, parseEther('0.02')), /TRANSACTION_INVALID/);
  await assert.rejects(validateOwnerFundingTransaction({ ...pending, kind: 'native' }, account.address, owner, parseEther('0.02')), /TRANSACTION_INVALID/);
  await assert.rejects(validateOwnerFundingTransaction({ ...pending, transactionHash: `0x${'88'.repeat(32)}` }, account.address, owner, parseEther('0.02')), /HASH_INVALID/);
});
test('no-owner plan is read-only and CLI rejects unconfirmed/foreign owners, over-cap and action through confirm', () => {
  const script = fileURLToPath(new URL('./fund-owner.mjs', import.meta.url));
  const plan = spawnSync(process.execPath, [script, 'prepare'], { encoding: 'utf8', windowsHide: true });
  assert.equal(plan.status, 0); const result = JSON.parse(plan.stdout); assert.equal(result.recipient, null); assert.equal(result.signedOrBroadcast, false);
  for (const [args, reason] of [
    [['fund', '--owner', owner], 'EXPLICIT_BROADCAST_AND_VERIFIED_PRIVY_OWNER_CONFIRMATION_REQUIRED'],
    [['prepare', '--owner', other], 'OWNER_DIFFERS_FROM_ROOT_APPROVED_PRIVY_WALLET'],
    [['fund', '--owner', owner, '--broadcast-testnet', '--confirm-verified-privy-owner', '--max-gas-cost-mon', '0.03'], 'OWNER_FUNDING_FEE_CAP_EXCEEDS_AUTHORIZATION'],
    [['confirm', '--owner', owner, '--broadcast-testnet'], 'READ_ONLY_OWNER_COMMAND_REJECTS_ACTION_FLAGS'],
    [['prepare', '--owner', '0x0000000000000000000000000000000000000000'], 'VALID_NONZERO_PRIVY_OWNER_ADDRESS_REQUIRED'],
  ]) {
    const check = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', windowsHide: true });
    assert.equal(check.status, 1); assert.equal(check.stdout, ''); assert.equal(check.stderr.trim(), reason);
  }
});
