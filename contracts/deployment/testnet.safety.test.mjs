import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { normalizedRuntime, validatePersistedTransaction } from './testnet.mjs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { getContractAddress, keccak256, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Public offline test fixture; this is never the isolated testnet key or a broadcast transaction.
const account = privateKeyToAccount(`0x${'11'.repeat(32)}`);
const data = '0x6001600055';
const prepared = { creationData: data, packageInfo: { creationDataHash: keccak256(data), sourceSha256: 'offline-fixture' } };
async function fixture(overrides = {}) {
  const serializedTransaction = await account.signTransaction({
    chainId: 10143, type: 'legacy', nonce: 0, gas: 100_000n,
    gasPrice: 100_000_000_000n, value: 0n, data, ...overrides,
  });
  return { chainId: 10143, deployer: account.address, serializedTransaction,
    transactionHash: keccak256(serializedTransaction), expectedEscrow: getContractAddress({ from: account.address, nonce: 0n }),
    ...prepared.packageInfo };
}

test('resume verifies a real offline signature/hash, nonce-derived address and exact deployment input', async () => {
  const transaction = await validatePersistedTransaction(await fixture(), prepared, account.address, parseEther('0.02'));
  assert.equal(transaction.chainId, 10143);
  assert.equal(transaction.nonce, 0);
});
test('resume rejects a mainnet-signed transaction even if stored labels say testnet', async () => {
  await assert.rejects(validatePersistedTransaction(await fixture({ chainId: 143 }), prepared, account.address, parseEther('1')), /TRANSACTION_INVALID/);
});
test('resume rejects token transfers/nonzero value and changed constructor bytes', async () => {
  for (const change of [{ to: account.address }, { value: 1n }, { data: '0x6002600055' }]) {
    await assert.rejects(validatePersistedTransaction(await fixture(change), prepared, account.address, parseEther('1')), /TRANSACTION_INVALID/);
  }
});
test('resume refuses a lower current budget, tampered hash and nonce/address substitution', async () => {
  const pending = await fixture();
  await assert.rejects(validatePersistedTransaction(pending, prepared, account.address, parseEther('0.005')), /COST_CAP/);
  await assert.rejects(validatePersistedTransaction({ ...pending, transactionHash: `0x${'22'.repeat(32)}` }, prepared, account.address, parseEther('1')), /HASH_INVALID/);
  await assert.rejects(validatePersistedTransaction({ ...pending, expectedEscrow: account.address }, prepared, account.address, parseEther('1')), /ADDRESS_INVALID/);
});
test('runtime comparison allows only compiler-declared immutable offsets', () => {
  const references = { 1: [{ start: 1, length: 1 }] };
  assert.equal(normalizedRuntime('0x601160', references), normalizedRuntime('0x602260', references));
  assert.notEqual(normalizedRuntime('0x601160', references), normalizedRuntime('0x612260', references));
  assert.throws(() => normalizedRuntime('0x60', references), /IMMUTABLE_REFERENCE/);
});
test('CLI rejects source upload through confirm, implicit broadcast and mainnet before credentials/network', () => {
  for (const [args, env, reason] of [
    [['confirm', '--verify-source'], {}, 'READ_ONLY_OR_INIT_COMMAND_REJECTS_ACTION_FLAGS'],
    [['deploy'], {}, 'EXPLICIT_TESTNET_BROADCAST_FLAG_REQUIRED'],
    [['prepare'], { DROP_CHAIN_ID: '143' }, 'PROCESS_CHAIN_IS_NOT_TESTNET'],
  ]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./testnet.mjs', import.meta.url)), ...args], { env: { ...process.env, ...env }, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr.trim(), reason);
  }
});
