import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateTopupTransaction } from './topup-relayer.mjs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { keccak256, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
// Public offline fixture, never read from a service wallet or used on any network.
const account = privateKeyToAccount(`0x${'99'.repeat(32)}`);
const recipient = '0xc67AABf3Ded43fA2C2E29e24809C1BD50af9393f';
async function fixture(overrides = {}) {
  const serializedTransaction = await account.signTransaction({ chainId: 10143, type: 'legacy', nonce: 4,
    to: recipient, value: parseEther('3.4'), gas: 25_200n, gasPrice: 112_200_000_000n, ...overrides });
  return { chainId: 10143, sender: account.address, recipient, nonce: 4, serializedTransaction, transactionHash: keccak256(serializedTransaction) };
}
test('top-up verifies exact authorized 3.4 MON, chain10143 and an actual offline signature', async () => {
  const tx = await validateTopupTransaction(await fixture(), account.address, recipient, parseEther('0.02'));
  assert.equal(tx.value, parseEther('3.4')); assert.equal(tx.chainId, 10143);
});
test('top-up rejects mainnet and a different recipient', async () => {
  for (const change of [{ chainId: 143 }, { to: account.address }])
    await assert.rejects(validateTopupTransaction(await fixture(change), account.address, recipient, parseEther('0.02')), /TRANSACTION_INVALID/);
});
test('old0.5 transfer, larger3.5 amount and contract calldata cannot substitute for approved top-up', async () => {
  for (const change of [{ value: parseEther('0.5') }, { value: parseEther('3.5') }, { data: '0xa9059cbb' }])
    await assert.rejects(validateTopupTransaction(await fixture(change), account.address, recipient, parseEther('0.02')), /TRANSACTION_INVALID/);
});
test('top-up cannot increase authorized gas ceiling or exceed a lower current ceiling', async () => {
  const pending = await fixture();
  await assert.rejects(validateTopupTransaction(pending, account.address, recipient, parseEther('0.03')), /GAS_CAP/);
  await assert.rejects(validateTopupTransaction(pending, account.address, recipient, parseEther('0.001')), /GAS_CAP/);
});
test('persisted nonce, hash and role metadata remain bound to signed bytes', async () => {
  const pending = await fixture();
  await assert.rejects(validateTopupTransaction({ ...pending, nonce: 5 }, account.address, recipient, parseEther('0.02')), /TRANSACTION_INVALID/);
  await assert.rejects(validateTopupTransaction({ ...pending, transactionHash: `0x${'aa'.repeat(32)}` }, account.address, recipient, parseEther('0.02')), /HASH_INVALID/);
  await assert.rejects(validateTopupTransaction({ ...pending, recipient: account.address }, account.address, recipient, parseEther('0.02')), /ROLES_OR_CHAIN_CHANGED/);
});
test('CLI rejects implicit transfer, fee above0.02, readonly action flags and mainnet before keys/RPC', () => {
  const script = fileURLToPath(new URL('./topup-relayer.mjs', import.meta.url));
  for (const [args, env, reason] of [
    [['fund'], {}, 'EXPLICIT_TESTNET_BROADCAST_FLAG_REQUIRED'],
    [['fund', '--broadcast-testnet', '--max-gas-cost-mon', '0.03'], {}, 'FUNDING_GAS_CAP_MUST_NOT_EXCEED_POINT_ZERO_TWO_MON'],
    [['confirm', '--broadcast-testnet'], {}, 'READ_ONLY_FUNDING_COMMAND_REJECTS_ACTION_FLAGS'],
    [['prepare'], { DROP_CHAIN_ID: '143' }, 'PROCESS_CHAIN_IS_NOT_TESTNET'],
  ]) {
    const check = spawnSync(process.execPath, [script, ...args], { env: { ...process.env, ...env }, encoding: 'utf8', windowsHide: true });
    assert.equal(check.status, 1); assert.equal(check.stdout, ''); assert.equal(check.stderr.trim(), reason);
  }
});
