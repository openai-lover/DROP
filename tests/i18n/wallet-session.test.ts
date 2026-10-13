import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { SessionProvider, transactionFeeHint, useSession } from '../../src/components/session';
const sdk = vi.hoisted(() => ({ authenticated: true, ready: true, wallets: [{ address: '0x00000000000000000000000000000000000000a1', walletClientType: 'privy' }], send: vi.fn() }));
vi.mock('@privy-io/react-auth', () => ({
  PrivyProvider: ({ children }: { children: ReactNode }) => children,
  usePrivy: () => ({ ready: sdk.ready, authenticated: sdk.authenticated, login: vi.fn(), logout: vi.fn(), getAccessToken: vi.fn() }),
  useWallets: () => ({ wallets: sdk.wallets }),
  useSendTransaction: () => ({ sendTransaction: sdk.send }),
}));
function session() {
  let result: ReturnType<typeof useSession> | undefined;
  function Probe() { result = useSession(); return null; }
  renderToString(createElement(SessionProvider, null, createElement(Probe)));
  return result!;
}

describe('user-approved testnet wallet requests', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('NEXT_PUBLIC_PRIVY_APP_ID', 'unit-public-app'); vi.stubEnv('NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED', 'false'); sdk.authenticated = true; sdk.ready = true; sdk.wallets = [{ address: '0x00000000000000000000000000000000000000a1', walletClientType: 'privy' }]; sdk.send.mockResolvedValue({ hash: `0x${'11'.repeat(32)}` }); });
  afterEach(() => vi.unstubAllEnvs());

  it('allows user-paid test MON without sponsorship, using the selected wallet and visible cancellable confirmation', async () => {
    await session().send('0x00000000000000000000000000000000000000b2', '0x1234');
    expect(sdk.send).toHaveBeenCalledWith({ from: sdk.wallets[0].address, to: '0x00000000000000000000000000000000000000b2', data: '0x1234', chainId: 10143 }, { address: sdk.wallets[0].address, sponsor: false, uiOptions: { showWalletUIs: true, isCancellable: true } });
    expect(transactionFeeHint((_ko, english) => english)).toContain('paid from your wallet in test MON');
  });

  it('requests sponsored execution only when explicitly configured and does not promise it is free', async () => {
    vi.stubEnv('NEXT_PUBLIC_GAS_SPONSORSHIP_ENABLED', 'true');
    await session().send('0x00000000000000000000000000000000000000b2', '0x');
    expect(sdk.send.mock.calls[0][1].sponsor).toBe(true);
    expect(transactionFeeHint((_ko, english) => english)).toContain('Confirm the fee shown');
  });

  it('rejects signed-out, unready and invalid-wallet requests before the SDK can send', async () => {
    sdk.authenticated = false;
    await expect(session().send('0x00000000000000000000000000000000000000b2', '0x')).rejects.toThrow();
    sdk.authenticated = true; sdk.ready = false;
    await expect(session().send('0x00000000000000000000000000000000000000b2', '0x')).rejects.toThrow();
    sdk.ready = true; sdk.wallets = [{ address: 'invalid', walletClientType: 'privy' }];
    await expect(session().send('0x00000000000000000000000000000000000000b2', '0x')).rejects.toThrow();
    expect(sdk.send).not.toHaveBeenCalled();
  });
});
