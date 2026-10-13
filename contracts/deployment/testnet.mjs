import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
const require = createRequire(new URL('../../package.json', import.meta.url));
const {
  createPublicClient, encodeAbiParameters, encodeDeployData, formatEther, formatUnits,
  getAddress, getContractAddress, http, keccak256, parseAbi, parseEther, parseTransaction,
  recoverTransactionAddress,
} = require('viem');
const { generatePrivateKey, privateKeyToAccount } = require('viem/accounts');

const root = fileURLToPath(new URL('../../', import.meta.url));
const chainId = 10143;
const token = getAddress('0x534b2f3A21130d7a60830c2Df862319e593943A3');
const keyFile = join(root, '.local', 'testnet-only.env');
const output = join(root, '.local', 'testnet-deployment');
const pendingFile = join(output, 'pending-deployment.json');
const reportFile = join(output, 'report.json');
const forge = process.env.FORGE_PATH || join(root, 'contracts', '.tools', process.platform === 'win32' ? 'forge.exe' : 'forge');
const sourceFile = join(root, 'contracts', 'src', 'DROPRewardEscrow.sol');
const contractName = 'src/DROPRewardEscrow.sol:DROPRewardEscrow';
const tokenAbi = parseAbi(['function decimals() view returns (uint8)', 'function balanceOf(address) view returns (uint256)']);
const escrowAbi = parseAbi([
  'function supportedToken() view returns (address)',
  'function deploymentChainId() view returns (uint256)',
  'function eip712Domain() view returns (bytes1 fields,string name,string version,uint256 chainId,address verifyingContract,bytes32 salt,uint256[] extensions)',
]);

function requireCondition(condition, code) { if (!condition) throw new Error(code); }
function hashBytes(value) { return createHash('sha256').update(value).digest('hex'); }
function writeJson(path, value, exclusive = false) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, ...(exclusive ? { flag: 'wx' } : {}) });
}
function readJson(path) { return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, '')); }
function forgeRun(args, includeStatusStream = false) {
  const result = spawnSync(forge, args, { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
  requireCondition(result.status === 0, 'LOCAL_FOUNDRY_COMMAND_FAILED');
  // Forge sends verifier progress to stderr even on success; compiler-input stdout stays separate.
  return includeStatusStream ? `${result.stdout}\n${result.stderr}` : result.stdout;
}
function loadKeys() {
  requireCondition(existsSync(keyFile), 'MISSING_ISOLATED_TESTNET_KEY_FILE');
  const values = Object.fromEntries(readFileSync(keyFile, 'utf8').split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
  requireCondition(values.DROP_CHAIN_ID === '10143' && values.DROP_DEPLOY_CHAIN_ID === '10143' && values.DROP_ENABLE_MAINNET === 'false', 'TESTNET_KEY_FILE_CHAIN_GUARD_FAILED');
  requireCondition(getAddress(values.DROP_DEPLOY_USDC_ADDRESS) === token, 'TESTNET_KEY_FILE_TOKEN_GUARD_FAILED');
  const roles = [
    ['deployer', 'DROP_DEPLOYER_PRIVATE_KEY', 'DROP_DEPLOYER_ADDRESS'],
    ['authorizationSigner', 'DROP_AUTHORIZATION_PRIVATE_KEY', 'DROP_AUTHORIZATION_SIGNER_ADDRESS'],
    ['relayer', 'DROP_RELAYER_PRIVATE_KEY', 'DROP_RELAYER_ADDRESS'],
  ].map(([role, secretName, addressName]) => {
    requireCondition(/^0x[0-9a-fA-F]{64}$/.test(values[secretName] ?? ''), 'INVALID_ISOLATED_TESTNET_KEY');
    const account = privateKeyToAccount(values[secretName]);
    requireCondition(account.address === getAddress(values[addressName]), 'ISOLATED_TESTNET_ADDRESS_MISMATCH');
    return { role, account };
  });
  requireCondition(new Set(roles.map(role => role.account.address)).size === 3, 'TESTNET_ROLES_MUST_BE_DISTINCT');
  return roles;
}
function initialize() {
  if (!existsSync(keyFile)) {
    mkdirSync(dirname(keyFile), { recursive: true });
    const deployer = generatePrivateKey(), signer = generatePrivateKey(), relayer = generatePrivateKey();
    writeFileSync(keyFile, [
      '# Isolated DROP Monad Testnet keys. Never fund or use on mainnet.',
      'DROP_CHAIN_ID=10143', 'DROP_DEPLOY_CHAIN_ID=10143', 'DROP_ENABLE_MAINNET=false',
      `DROP_DEPLOY_USDC_ADDRESS=${token}`,
      `DROP_DEPLOYER_PRIVATE_KEY=${deployer}`, `DROP_DEPLOYER_ADDRESS=${privateKeyToAccount(deployer).address}`,
      `DROP_AUTHORIZATION_PRIVATE_KEY=${signer}`, `DROP_AUTHORIZATION_SIGNER_ADDRESS=${privateKeyToAccount(signer).address}`,
      `DROP_RELAYER_PRIVATE_KEY=${relayer}`, `DROP_RELAYER_ADDRESS=${privateKeyToAccount(relayer).address}`, '',
    ].join('\n'), { flag: 'wx', mode: 0o600 });
  }
  // Only public addresses are returned. Existing isolated keys are never overwritten.
  return { chainId, file: '.local/testnet-only.env', roles: loadKeys().map(({ role, account }) => ({ role, address: account.address })) };
}
function prepareSources() {
  forgeRun(['build', '--root', 'contracts']);
  const artifact = readJson(join(root, 'contracts', 'out', 'DROPRewardEscrow.sol', 'DROPRewardEscrow.json'));
  // Foundry's typed metadata omits NatSpec fields/empty ABI arrays and normalizes remappings.
  // Preserve solc's canonical raw metadata for an exact public verifier comparison.
  const metadata = typeof artifact.rawMetadata === 'string' ? JSON.parse(artifact.rawMetadata)
    : typeof artifact.metadata === 'string' ? JSON.parse(artifact.metadata) : artifact.metadata;
  requireCondition(metadata.compiler.version.startsWith('0.8.28+'), 'COMPILER_VERSION_CHANGED');
  requireCondition(metadata.settings.viaIR === true && metadata.settings.optimizer.enabled === true && metadata.settings.optimizer.runs === 200, 'COMPILER_SETTINGS_CHANGED');
  // This mode only prints compiler input locally; it does not contact an explorer.
  const standardInput = JSON.parse(forgeRun([
    'verify-contract', '--root', 'contracts', '0x0000000000000000000000000000000000000001', contractName,
    '--chain', String(chainId), '--show-standard-json-input',
  ]));
  const constructorArgs = encodeAbiParameters([{ type: 'address' }, { type: 'uint256' }], [token, BigInt(chainId)]);
  const creationData = encodeDeployData({ abi: artifact.abi, bytecode: artifact.bytecode.object, args: [token, BigInt(chainId)] });
  writeJson(join(output, 'compiler-input.json'), standardInput);
  writeJson(join(output, 'metadata.json'), metadata);
  writeJson(join(output, 'abi.json'), artifact.abi);
  writeFileSync(join(output, 'constructor-args.txt'), `${constructorArgs}\n`, { mode: 0o600 });
  const packageInfo = {
    compiler: metadata.compiler.version, evmVersion: metadata.settings.evmVersion, viaIR: true, optimizerRuns: 200,
    openZeppelinVersion: readJson(join(root, 'node_modules', '@openzeppelin', 'contracts', 'package.json')).version,
    sourceSha256: hashBytes(readFileSync(sourceFile)), compilerInputSha256: hashBytes(readFileSync(join(output, 'compiler-input.json'))),
    abiSha256: hashBytes(readFileSync(join(output, 'abi.json'))), metadataSha256: hashBytes(readFileSync(join(output, 'metadata.json'))), creationDataHash: keccak256(creationData),
    publicSourceCount: Object.keys(standardInput.sources).length,
  };
  writeJson(join(output, 'package.json'), packageInfo);
  return { artifact, creationData, packageInfo };
}
function normalizedRuntime(bytecode, references) {
  let result = bytecode.slice(2).toLowerCase();
  for (const reference of Object.values(references).flat()) {
    const offset = reference.start * 2, length = reference.length * 2;
    requireCondition(offset + length <= result.length, 'INVALID_COMPILER_IMMUTABLE_REFERENCE');
    result = `${result.slice(0, offset)}${'0'.repeat(length)}${result.slice(offset + length)}`;
  }
  return result;
}
async function networkReport(client, roles, prepared) {
  requireCondition(await client.getChainId() === chainId, 'RPC_IS_NOT_MONAD_TESTNET');
  const finalized = await client.getBlock({ blockTag: 'finalized' });
  requireCondition(finalized.number !== null, 'FINALIZED_BLOCK_UNAVAILABLE');
  const [code, decimals, gasPrice] = await Promise.all([
    client.getCode({ address: token, blockNumber: finalized.number }),
    client.readContract({ address: token, abi: tokenAbi, functionName: 'decimals', blockNumber: finalized.number }),
    client.getGasPrice(),
  ]);
  requireCondition(code && code !== '0x' && decimals === 6, 'OFFICIAL_USDC_CODE_OR_DECIMALS_FAILED');
  const balances = await Promise.all(roles.map(async ({ role, account }) => ({
    role, address: account.address,
    mon: formatEther(await client.getBalance({ address: account.address })),
    usdc: formatUnits(await client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [account.address], blockNumber: finalized.number }), 6),
  })));
  const deployer = roles[0].account.address;
  let estimate;
  try {
    // A balance override is confined to this RPC simulation. No funds are created or transferred.
    const gas = await client.estimateGas({ account: deployer, data: prepared.creationData, stateOverride: [{ address: deployer, balance: parseEther('1') }] });
    const gasLimit = (gas * 120n + 99n) / 100n;
    const gasPriceCap = (gasPrice * 110n + 99n) / 100n;
    estimate = { gas: gas.toString(), gasLimitWith20PercentMargin: gasLimit.toString(), gasPriceWith10PercentMarginGwei: formatUnits(gasPriceCap, 9), boundedMaximumMon: formatEther(gasLimit * gasPriceCap), simulationOnlyBalanceOverride: true };
  } catch { estimate = { available: false, reason: 'RPC deployment simulation unavailable; no deployment attempted.' }; }
  return {
    checkedAtUtc: new Date().toISOString(), mode: 'read-only', chainId, officialUsdc: token, usdcDecimals: decimals,
    finalizedBlock: finalized.number.toString(), finalizedBlockHash: finalized.hash, tokenCodeHash: keccak256(code),
    gasPriceGwei: formatUnits(gasPrice, 9), roles: balances, estimate, compilerPackage: prepared.packageInfo,
    liveDeployment: false, sourceVerified: false, signedOrBroadcast: false,
  };
}
async function checkFinalizedDeployment(client, pending, prepared, timeoutMs = 45_000) {
  const stopAt = Date.now() + timeoutMs;
  while (Date.now() < stopAt) {
    let receipt;
    try { receipt = await client.getTransactionReceipt({ hash: pending.transactionHash }); } catch (error) {
      if (error.name !== 'TransactionReceiptNotFoundError') throw new Error('DEPLOYMENT_RECEIPT_RPC_UNAVAILABLE');
    }
    if (receipt) {
      requireCondition(receipt.status === 'success', 'DEPLOYMENT_TRANSACTION_REVERTED');
      requireCondition(receipt.transactionHash.toLowerCase() === pending.transactionHash.toLowerCase(), 'DEPLOYMENT_RECEIPT_HASH_MISMATCH');
      requireCondition(receipt.contractAddress && getAddress(receipt.contractAddress) === pending.expectedEscrow && getAddress(receipt.from) === pending.deployer && receipt.to === null, 'DEPLOYMENT_RECEIPT_IDENTITY_MISMATCH');
      const finalized = await client.getBlock({ blockTag: 'finalized' });
      if (finalized.number !== null && finalized.number >= receipt.blockNumber) {
        const canonical = await client.getBlock({ blockNumber: receipt.blockNumber });
        requireCondition(canonical.hash === receipt.blockHash, 'DEPLOYMENT_RECEIPT_NOT_CANONICAL');
        const [code, supportedToken, deploymentChainId, domain, transaction] = await Promise.all([
          client.getCode({ address: pending.expectedEscrow, blockNumber: finalized.number }),
          client.readContract({ address: pending.expectedEscrow, abi: escrowAbi, functionName: 'supportedToken', blockNumber: finalized.number }),
          client.readContract({ address: pending.expectedEscrow, abi: escrowAbi, functionName: 'deploymentChainId', blockNumber: finalized.number }),
          client.readContract({ address: pending.expectedEscrow, abi: escrowAbi, functionName: 'eip712Domain', blockNumber: finalized.number }),
          client.getTransaction({ hash: pending.transactionHash }),
        ]);
        requireCondition(code && code !== '0x' && normalizedRuntime(code, prepared.artifact.deployedBytecode.immutableReferences) === normalizedRuntime(prepared.artifact.deployedBytecode.object, prepared.artifact.deployedBytecode.immutableReferences), 'DEPLOYED_RUNTIME_DIFFERS_FROM_COMPILED_SOURCE');
        requireCondition(getAddress(supportedToken) === token && deploymentChainId === BigInt(chainId) && domain[1] === 'DROPRewardEscrow' && domain[2] === '1' && domain[3] === BigInt(chainId) && getAddress(domain[4]) === pending.expectedEscrow, 'DEPLOYMENT_IMMUTABLE_OR_DOMAIN_MISMATCH');
        requireCondition(transaction.input.toLowerCase() === prepared.creationData.toLowerCase() && transaction.value === 0n, 'DEPLOYMENT_CREATION_INPUT_MISMATCH');
        return { escrow: pending.expectedEscrow, transactionHash: pending.transactionHash, blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash, finalizedBlock: finalized.number.toString(), gasUsed: receipt.gasUsed.toString(), actualGasCostMon: formatEther(receipt.gasUsed * receipt.effectiveGasPrice), runtimeCodeHash: keccak256(code), canonicalReceiptVerified: true, compiledRuntimeVerified: true, immutableGettersVerified: true };
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('DEPLOYMENT_PENDING_FINALITY_RUN_SAME_COMMAND_TO_RESUME');
}
async function validatePersistedTransaction(pending, prepared, deployer, costCap) {
  const transaction = parseTransaction(pending.serializedTransaction);
  requireCondition(pending.chainId === chainId && pending.deployer === deployer && pending.creationDataHash === prepared.packageInfo.creationDataHash && pending.sourceSha256 === prepared.packageInfo.sourceSha256, 'PERSISTED_DEPLOYMENT_CONFIGURATION_CHANGED');
  requireCondition(transaction.chainId === chainId && !transaction.to && (transaction.value ?? 0n) === 0n && transaction.data?.toLowerCase() === prepared.creationData.toLowerCase(), 'PERSISTED_DEPLOYMENT_TRANSACTION_INVALID');
  requireCondition(await recoverTransactionAddress({ serializedTransaction: pending.serializedTransaction }) === deployer && keccak256(pending.serializedTransaction) === pending.transactionHash, 'PERSISTED_DEPLOYMENT_SIGNATURE_OR_HASH_INVALID');
  requireCondition(transaction.gas && transaction.gasPrice && transaction.gas * transaction.gasPrice <= costCap, 'PERSISTED_DEPLOYMENT_EXCEEDS_CURRENT_COST_CAP');
  requireCondition(getContractAddress({ from: deployer, nonce: BigInt(transaction.nonce) }) === pending.expectedEscrow, 'PERSISTED_DEPLOYMENT_ADDRESS_INVALID');
  return transaction;
}
async function deploy(client, roles, prepared, report, args) {
  requireCondition(args.includes('--broadcast-testnet'), 'EXPLICIT_TESTNET_BROADCAST_FLAG_REQUIRED');
  const capIndex = args.indexOf('--max-cost-mon');
  requireCondition(capIndex >= 0 && /^\d+(\.\d{1,18})?$/.test(args[capIndex + 1] ?? ''), 'EXPLICIT_TEST_MON_COST_CAP_REQUIRED');
  const costCap = parseEther(args[capIndex + 1]);
  requireCondition(costCap > 0n && costCap <= parseEther('1'), 'TEST_MON_COST_CAP_MUST_BE_BETWEEN_ZERO_AND_ONE');
  const deployer = roles[0].account;
  let pending;
  if (existsSync(pendingFile)) {
    pending = readJson(pendingFile);
    await validatePersistedTransaction(pending, prepared, deployer.address, costCap);
    // Receipt lookup precedes all retries. Never allocate another nonce or a second deployment.
    try {
      await client.getTransactionReceipt({ hash: pending.transactionHash });
      return checkFinalizedDeployment(client, pending, prepared);
    } catch (error) { if (error.name !== 'TransactionReceiptNotFoundError') throw error; }
  } else {
    const [latestNonce, pendingNonce, gasPrice, gas] = await Promise.all([
      client.getTransactionCount({ address: deployer.address, blockTag: 'latest' }),
      client.getTransactionCount({ address: deployer.address, blockTag: 'pending' }),
      client.getGasPrice(),
      client.estimateGas({ account: deployer.address, data: prepared.creationData }),
    ]);
    requireCondition(latestNonce === pendingNonce, 'DEPLOYER_ALREADY_HAS_PENDING_TRANSACTION');
    const gasLimit = (gas * 120n + 99n) / 100n, fee = (gasPrice * 110n + 99n) / 100n;
    requireCondition(gasLimit * fee <= costCap, 'DEPLOYMENT_ESTIMATE_EXCEEDS_COST_CAP');
    requireCondition(await client.getBalance({ address: deployer.address }) >= gasLimit * fee, 'INSUFFICIENT_TEST_MON_FOR_BOUNDED_DEPLOYMENT');
    const serializedTransaction = await deployer.signTransaction({ chainId, type: 'legacy', nonce: latestNonce, gas: gasLimit, gasPrice: fee, value: 0n, data: prepared.creationData });
    pending = { chainId, deployer: deployer.address, nonce: latestNonce, expectedEscrow: getContractAddress({ from: deployer.address, nonce: BigInt(latestNonce) }), transactionHash: keccak256(serializedTransaction), serializedTransaction, creationDataHash: prepared.packageInfo.creationDataHash, sourceSha256: prepared.packageInfo.sourceSha256, maximumGasCostMon: formatEther(gasLimit * fee), preparedAtUtc: new Date().toISOString() };
    writeJson(pendingFile, pending, true);
  }
  const persisted = await validatePersistedTransaction(pending, prepared, deployer.address, costCap);
  requireCondition(await client.getBalance({ address: deployer.address }) >= persisted.gas * persisted.gasPrice, 'INSUFFICIENT_TEST_MON_FOR_PERSISTED_DEPLOYMENT');
  report.mode = 'explicit-testnet-deployment'; report.signedOrBroadcast = true;
  report.pendingTransactionHash = pending.transactionHash; report.expectedEscrow = pending.expectedEscrow;
  writeJson(reportFile, report);
  try {
    const hash = await client.sendRawTransaction({ serializedTransaction: pending.serializedTransaction });
    requireCondition(hash === pending.transactionHash, 'BROADCAST_HASH_MISMATCH');
  } catch {
    // A timeout or "already known" response is ambiguous. Check the persisted hash, never make a new tx.
  }
  return checkFinalizedDeployment(client, pending, prepared);
}
function verifySource(deployment) {
  const outputText = forgeRun([
    'verify-contract', '--root', 'contracts', deployment.escrow, contractName, '--chain', String(chainId),
    '--verifier', 'sourcify', '--verifier-url', 'https://sourcify-api-monad.blockvision.org/',
    '--creation-transaction-hash', deployment.transactionHash,
  ], true);
  requireCondition(/successfully verified|verified successfully|already verified|perfect match/i.test(outputText), 'SOURCE_VERIFICATION_RESULT_NOT_CONFIRMED');
}
async function confirmPublishedSource(deployment, prepared) {
  const base = 'https://sourcify-api-monad.blockvision.org';
  const statusUrl = `${base}/check-by-addresses?addresses=${deployment.escrow}&chainIds=${chainId}`;
  const metadataUrl = `${base}/repository/contracts/full_match/${chainId}/${deployment.escrow}/metadata.json`;
  // GET only: confirm an existing public record; never upload or disclose local source here.
  const [statusResponse, metadataResponse] = await Promise.all([
    fetch(statusUrl, { method: 'GET', signal: AbortSignal.timeout(20_000) }),
    fetch(metadataUrl, { method: 'GET', signal: AbortSignal.timeout(20_000) }),
  ]);
  requireCondition(statusResponse.ok && metadataResponse.ok, 'PUBLISHED_SOURCE_RECORD_UNAVAILABLE');
  const statusResult = await statusResponse.json();
  const status = Array.isArray(statusResult) ? statusResult.find(item => getAddress(item.address) === deployment.escrow) : statusResult;
  requireCondition(status && getAddress(status.address) === deployment.escrow && status.status === 'perfect' && status.chainIds.map(String).includes(String(chainId)), 'PUBLISHED_SOURCE_IS_NOT_TESTNET_PERFECT_MATCH');
  const metadata = await metadataResponse.json();
  const compiledMetadata = typeof prepared.artifact.rawMetadata === 'string' ? JSON.parse(prepared.artifact.rawMetadata)
    : typeof prepared.artifact.metadata === 'string' ? JSON.parse(prepared.artifact.metadata) : prepared.artifact.metadata;
  requireCondition(isDeepStrictEqual(metadata, compiledMetadata), 'PUBLISHED_SOURCE_METADATA_DIFFERS_FROM_COMPILED_ARTIFACT');
  writeJson(join(output, 'published-metadata.json'), metadata);
  return { status: 'perfect', mode: 'read-only-public-record', statusUrl, metadataUrl, metadataMatchesCompiledArtifact: true, checkedAtUtc: new Date().toISOString() };
}
async function main() {
  const [command = 'prepare', ...args] = process.argv.slice(2);
  requireCondition(['init', 'prepare', 'deploy', 'verify', 'confirm'].includes(command), 'UNKNOWN_TESTNET_WORKFLOW_COMMAND');
  requireCondition(args.every((value, index) => ['--broadcast-testnet', '--verify-source', '--max-cost-mon'].includes(value) || args[index - 1] === '--max-cost-mon'), 'UNKNOWN_TESTNET_WORKFLOW_OPTION');
  if (['init', 'prepare', 'confirm'].includes(command)) requireCondition(args.length === 0, 'READ_ONLY_OR_INIT_COMMAND_REJECTS_ACTION_FLAGS');
  if (command === 'deploy') {
    // Reject incomplete action requests before reading credentials or contacting the network.
    requireCondition(args.includes('--broadcast-testnet'), 'EXPLICIT_TESTNET_BROADCAST_FLAG_REQUIRED');
    requireCondition(args.includes('--max-cost-mon'), 'EXPLICIT_TEST_MON_COST_CAP_REQUIRED');
  }
  if (command === 'verify') requireCondition(args.includes('--verify-source'), 'EXPLICIT_SOURCE_UPLOAD_FLAG_REQUIRED');
  requireCondition(!process.env.DROP_CHAIN_ID || process.env.DROP_CHAIN_ID === '10143', 'PROCESS_CHAIN_IS_NOT_TESTNET');
  requireCondition(!process.env.DROP_DEPLOY_CHAIN_ID || process.env.DROP_DEPLOY_CHAIN_ID === '10143', 'PROCESS_DEPLOY_CHAIN_IS_NOT_TESTNET');
  requireCondition(process.env.DROP_ENABLE_MAINNET !== 'true', 'PROCESS_MAINNET_ENABLE_FLAG_REJECTED');
  if (command === 'init') { console.log(JSON.stringify(initialize(), null, 2)); return; }
  const roles = loadKeys(), prepared = prepareSources();
  const client = createPublicClient({ transport: http(process.env.DROP_RPC_URL || 'https://testnet-rpc.monad.xyz', { timeout: 15_000, retryCount: 1 }) });
  const report = await networkReport(client, roles, prepared);
  if (command === 'deploy') {
    report.deployment = await deploy(client, roles, prepared, report, args);
    report.mode = 'explicit-testnet-deployment'; report.signedOrBroadcast = true; report.liveDeployment = true;
  } else if (command === 'verify' || command === 'confirm') {
    if (command === 'verify') requireCondition(args.includes('--verify-source'), 'EXPLICIT_SOURCE_UPLOAD_FLAG_REQUIRED');
    requireCondition(existsSync(pendingFile), 'NO_PERSISTED_DEPLOYMENT_TO_VERIFY');
    const pending = readJson(pendingFile);
    await validatePersistedTransaction(pending, prepared, roles[0].account.address, parseEther('1'));
    report.deployment = await checkFinalizedDeployment(client, pending, prepared);
    report.liveDeployment = true;
    report.mode = command === 'verify' ? 'explicit-public-source-verification' : 'read-only-deployment-confirmation';
    if (command === 'confirm') {
      report.sourceVerification = await confirmPublishedSource(report.deployment, prepared);
      report.sourceVerified = true;
    }
  }
  if (args.includes('--verify-source')) {
    requireCondition(report.liveDeployment, 'SOURCE_UPLOAD_REQUIRES_VERIFIED_REAL_DEPLOYMENT');
    // Persist finalized chain proof even if the external source verifier fails or times out.
    writeJson(reportFile, report);
    verifySource(report.deployment); report.sourceVerified = true;
  }
  writeJson(reportFile, report);
  // Public metadata only; key files, private RPC URL and raw transaction bytes never enter this report.
  console.log(JSON.stringify(report, null, 2));
}
export { loadKeys, normalizedRuntime, validatePersistedTransaction };
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    const known = typeof error.message === 'string' && /^[A-Z][A-Z0-9_]+$/.test(error.message) ? error.message : 'TESTNET_WORKFLOW_FAILED_CHECK_LOCAL_CONFIGURATION_OR_RPC';
    console.error(known);
    process.exitCode = 1;
  });
}
