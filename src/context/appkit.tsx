'use client';

import {
  createAppKit,
  useAppKitAccount,
  useAppKitNetworkCore,
  useAppKitProvider,
} from '@reown/appkit/react';
import { SolanaAdapter, BaseWalletAdapter, Provider } from '@reown/appkit-adapter-solana';
import { solana, solanaDevnet, solanaTestnet } from '@reown/appkit/networks';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
// import Cookies from 'js-cookie';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const GATEWAY_URL = "https://gateway.netsepio.com/";
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error('Project ID is not defined. Please set NEXT_PUBLIC_PROJECT_ID in your env.');
}

const metadata = {
  name: 'stories.fun',
  description: "We help Individuals and Businesses tell stories and form meaningful connections. Let your authentic story become your Social Identity. Share your journey. Discover others. Social Media that Invests in truth.",
  url: 'https://app.stories.fun/',
  icons: ['https://framerusercontent.com/images/yoPm7BQ0pno3cZeknmif5tLEf0.png'],
};

const wallets: BaseWalletAdapter[] = [
  new PhantomWalletAdapter() as unknown as BaseWalletAdapter,
  new SolflareWalletAdapter() as unknown as BaseWalletAdapter,
];

const solanaAdapter = new SolanaAdapter({ wallets });

// const COOKIE_OPTIONS = {
//   expires: 7,
//   path: '/',
//   sameSite: 'Strict' as const,
//   secure: process.env.NODE_ENV === 'production',
// };

// const getChainCookieKey = (key: string) => `${key}_solana`;

// const setAuthCookies = (token: string, walletAddress: string, userId: string) => {
//   Cookies.set(getChainCookieKey("erebrus_token"), token, COOKIE_OPTIONS);
//   Cookies.set(getChainCookieKey("erebrus_wallet"), walletAddress.toLowerCase(), COOKIE_OPTIONS);
//   Cookies.set(getChainCookieKey("erebrus_userid"), userId, COOKIE_OPTIONS);
// };

// const clearAuthCookies = () => {
//   Cookies.remove(getChainCookieKey("erebrus_token"));
//   Cookies.remove(getChainCookieKey("erebrus_wallet"));
//   Cookies.remove(getChainCookieKey("erebrus_userid"));
// };

// const getAuthFromCookies = () => ({
//   token: Cookies.get(getChainCookieKey("erebrus_token")),
//   wallet: Cookies.get(getChainCookieKey("erebrus_wallet")),
//   userId: Cookies.get(getChainCookieKey("erebrus_userid")),
// });

const authenticateSolana = async (walletAddress: string, walletProvider: Provider) => {
  try {
    const { data } = await axios.get(`${GATEWAY_URL}api/v1.0/flowid`, {
      params: { walletAddress, chain: 'sol' },
    });

    const { eula: message, flowId } = data.payload;

    const encodedMessage = new TextEncoder().encode(message);
    
    // Use walletProvider.signMessage which works with both wallet and social logins
    const signature = await walletProvider.signMessage(encodedMessage);

    const signatureHex = Array.from(new Uint8Array(signature))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');

    const authResponse = await axios.post(
      `${GATEWAY_URL}api/v1.0/authenticate?walletAddress=${walletAddress}&chain=sol`,
      {
        flowId,
        signature: signatureHex,
        pubKey: walletAddress,
        walletAddress,
        message,
        chainName: 'sol',
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const { token, userId } = authResponse.data.payload;
    // setAuthCookies(token, walletAddress, userId);
    return true;
  } catch (err) {
    console.error('Solana Auth error:', err);
    // clearAuthCookies();
    return false;
  }
};

export function useSolanaAuth() {
  const { isConnected, address } = useAppKitAccount();
  const { chainId, caipNetworkId } = useAppKitNetworkCore();
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  const isAuthenticated = () => {
    // const { token, wallet } = getAuthFromCookies();
    // return !!(token && wallet?.toLowerCase() === address?.toLowerCase());
    return false; // Since cookies are disabled, always return false for now
  };

  const authenticate = async () => {
    if (!isConnected || !address) {
      setAuthError('Wallet not connected');
      return false;
    }

    setIsAuthenticating(true);
    setAuthError(null);
    setAuthSuccess(false);

    // const { token, wallet } = getAuthFromCookies();
    // if (token && wallet?.toLowerCase() === address.toLowerCase()) {
    //   setAuthSuccess(true);
    //   return true;
    // }

    // if (wallet && wallet.toLowerCase() !== address.toLowerCase()) {
    //   clearAuthCookies();
    // }

    try {
      const result = await authenticateSolana(address, walletProvider);
      if (result) {
        setAuthSuccess(true);
        toast.success('Authentication successful');
        return true;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Authentication failed';
      toast.error(msg);
      setAuthError(msg);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      // clearAuthCookies();
      setAuthSuccess(false);
    }
  }, [isConnected]);

  return {
    isConnected,
    address,
    isAuthenticated: isAuthenticated(),
    isAuthenticating,
    authError,
    authSuccess,
    authenticate,
  };
}

export function AppKit({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

createAppKit({
  adapters: [solanaAdapter],
  metadata,
  networks: [solana, solanaDevnet, solanaTestnet],
  projectId,
  defaultNetwork: solana,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': '#3B82F6',
    '--w3m-color-mix': '#3B82F6',
    '--w3m-color-mix-strength': 40,
  },
});