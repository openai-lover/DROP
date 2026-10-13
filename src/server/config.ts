import { getAddress, isAddress, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { DomainError, required } from "./errors";

export const NETWORKS = {
  10143: { name: "Monad Testnet", rpc: "https://testnet-rpc.monad.xyz", usdc: "0x534b2f3A21130d7a60830c2Df862319e593943A3", explorer: "https://testnet.monadexplorer.com", testnet: true },
  143: { name: "Monad", rpc: "https://rpc.monad.xyz", usdc: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", explorer: "https://monadvision.com", testnet: false },
} as const;

export function chainConfig() {
  const chainId = Number(process.env.DROP_CHAIN_ID ?? 10143);
  if (chainId !== 10143 && chainId !== 143) throw new DomainError("UNSUPPORTED_NETWORK", "Only the configured Monad network is supported.", 503);
  const network = NETWORKS[chainId];
  const escrow = required("DROP_ESCROW_ADDRESS");
  if (!isAddress(escrow) || /^0x0{40}$/i.test(escrow)) throw new DomainError("INVALID_ESCROW", "A deployed reward escrow address is required.", 503);
  if (chainId === 143 && process.env.DROP_ENABLE_MAINNET !== "true") throw new DomainError("MAINNET_DISABLED", "Mainnet actions have not been enabled.", 503);
  return { chainId, ...network, rpc: process.env.DROP_RPC_URL || network.rpc, escrow: getAddress(escrow), usdc: getAddress(network.usdc), confirmations: Math.max(1, Number(process.env.DROP_CONFIRMATIONS ?? 2)) };
}

export function signingAccount() {
  const key = required("DROP_AUTHORIZATION_PRIVATE_KEY");
  if (!/^0x[a-fA-F0-9]{64}$/.test(key)) throw new DomainError("INVALID_SIGNER_KEY", "Authorization signer configuration is invalid.", 503);
  return privateKeyToAccount(key as `0x${string}`);
}

export function relayerAccount() {
  const key = required("DROP_RELAYER_PRIVATE_KEY");
  if (!/^0x[a-fA-F0-9]{64}$/.test(key)) throw new DomainError("INVALID_RELAYER_KEY", "Relayer configuration is invalid.", 503);
  const account = privateKeyToAccount(key as `0x${string}`);
  if (account.address.toLowerCase() === signingAccount().address.toLowerCase()) throw new DomainError("KEY_SEPARATION_REQUIRED", "Authorization signer and relayer must use separate keys.", 503);
  return account;
}

export function canonicalWallet(value: string): Address {
  if (!isAddress(value) || /^0x0{40}$/i.test(value)) throw new DomainError("INVALID_WALLET", "A valid wallet address is required.");
  return getAddress(value).toLowerCase() as Address;
}
