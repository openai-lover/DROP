import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateFundingTransaction } from './fund-relayer.mjs';
const require = createRequire(new URL('../../package.json', import.meta.url));
const { keccak256, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
// Public offline test fixture, never used for a real transfer or read from the isolated key file.
const account = privateKeyToAccount(`0x${'55'.repeat(32)}`);
const recipient = '0xc67AABf3Ded43fA2C2E29e24809C1BD50af9393f';
async function fixture(overrides = {}) {
  const serializedTransaction = await account.signTransaction({ chainId: 10143, type: 'legacy', nonce: 1,
    to: recipient, value: parseEther('0.5'), gas: 21_000n, gasPrice: 100_000_000_000n, ...overrides });
  return { chainId: 10143, sender: account.address, recipient, nonce: 1, serializedTransaction, transactionHash: keccak256(serializedTransaction) };
}
test('fixed 0.5 test MON funding validates an actual offline signature and bounded gas', async () => {
  const tx = await validateFundingTransaction(await fixture(), account.address, recipient, parseEther('0.02'));
  assert.equal(tx.value, parseEther('0.5')); assert.equal(tx.chainId, 10143);
});
test('funding refuses mainnet, amount/recipient substitutions and nonempty call data', async () => {
  for (const change of [{ chainId: 143 }, { value: parseEther('0.500001') }, { to: account.address }, { data: '0x00' }]) {
    await assert.rejects(validateFundingTransaction(await fixture(change), account.address, recipient, parseEther('0.02')), /TRANSACTION_INVALID/);
  }
});
test('persisted funding cannot evade the authorized gas ceiling or change its hash', async () => {
  const pending = await fixture();
  await assert.rejects(validateFundingTransaction(pending, account.address, recipient, parseEther('0.001')), /GAS_CAP/);
  await assert.rejects(validateFundingTransaction(pending, account.address, recipient, parseEther('0.03')), /GAS_CAP/);
  await assert.rejects(validateFundingTransaction({ ...pending, transactionHash: `0x${'66'.repeat(32)}` }, account.address, recipient, parseEther('0.02')), /HASH_INVALID/);
  await assert.rejects(validateFundingTransaction({ ...pending, nonce: 99 }, account.address, recipient, parseEther('0.02')), /TRANSACTION_INVALID/);
});
test('CLI stops implicit transfer, over-budget fee and mutation through confirm before network/keys', () => {
  for (const [args, reason] of [
    [['fund'], 'EXPLICIT_TESTNET_BROADCAST_FLAG_REQUIRED'],
    [['fund', '--broadcast-testnet', '--max-gas-cost-mon', '0.03'], 'FUNDING_GAS_CAP_MUST_NOT_EXCEED_POINT_ZERO_TWO_MON'],
    [['confirm', '--broadcast-testnet'], 'READ_ONLY_FUNDING_COMMAND_REJECTS_ACTION_FLAGS'],
  ]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./fund-relayer.mjs', import.meta.url)), ...args], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 1); assert.equal(result.stdout, ''); assert.equal(result.stderr.trim(), reason);
  }
});
