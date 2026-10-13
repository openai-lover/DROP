import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createConnection } from 'node:net';

const root = fileURLToPath(new URL('../', import.meta.url));
const rpc = 'http://127.0.0.1:18547';
const projectId = `demo-drop-local-chain-${randomBytes(4).toString('hex')}`;
const localBinary = join(root, 'contracts', '.tools', process.platform === 'win32' ? 'anvil.exe' : 'anvil');
const anvilBinary = process.env.ANVIL_PATH || (existsSync(localBinary) ? localBinary : 'anvil');

function portOpen(port) {
  return new Promise(resolve => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.setTimeout(1000, () => { socket.destroy(); resolve(false); });
  });
}
async function waitForLocalChain(child) {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error('The isolated Anvil process stopped before startup.');
    try {
      const response = await fetch(rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }), signal: AbortSignal.timeout(1000) });
      if ((await response.json()).result === '0x7a69') return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('The isolated local chain did not report chain ID 31337.');
}

if (!await portOpen(8089)) throw new Error('Start the existing loopback Firestore emulator on 127.0.0.1:8089 first.');
if (await portOpen(18547)) throw new Error('Port 18547 is already owned by another process. The runner will not reuse or stop it.');
for (const path of ['contracts/out/DROPRewardEscrow.sol/DROPRewardEscrow.json', 'contracts/out/TestSupport.sol/MockUSDC.json']) {
  if (!existsSync(join(root, path))) throw new Error(`Compile the contracts first: missing ${path}`);
}

const anvil = spawn(anvilBinary, ['--host', '127.0.0.1', '--port', '18547', '--chain-id', '31337', '--network', 'monad', '--block-time', '1', '--slots-in-an-epoch', '1', '--block-base-fee-per-gas', '100000000000', '--gas-price', '100000000000', '--quiet'], { cwd: root, stdio: 'ignore', windowsHide: true });
let tests;
const stop = () => { tests?.kill(); anvil.kill(); };
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
try {
  await waitForLocalChain(anvil);
  mkdirSync(join(root, '.local'), { recursive: true });
  writeFileSync(join(root, '.local', 'local-chain-verification.json'), JSON.stringify({ completed: false, status: 'running', scope: 'Isolated local Anvil RPC and Firestore emulator', projectId, startedAtUtc: new Date().toISOString() }, null, 2));
  console.log(`Isolated local settlement verification: chain 31337; Firestore ${projectId}. No public network transactions.`);
  tests = spawn(process.execPath, [join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'tests/local-chain/vitest.config.mts'], {
    cwd: root, stdio: 'inherit', windowsHide: true,
    env: { ...process.env, NODE_ENV: 'test', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8089', FIREBASE_PROJECT_ID: projectId, DROP_LOCAL_EMULATOR: 'true', DROP_LOCAL_CHAIN_RPC: rpc, DROP_LOCAL_CHAIN_RUN_ID: projectId.slice(-8), DROP_MAX_RELAYER_FEE_GWEI: '500', DROP_MAX_RELAYER_TX_COST_MON: '0.25' },
  });
  process.exitCode = await new Promise((resolve, reject) => { tests.once('error', reject); tests.once('exit', code => resolve(code ?? 1)); });
} finally {
  stop();
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);
}
