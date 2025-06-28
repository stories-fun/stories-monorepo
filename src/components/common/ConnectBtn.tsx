'use client';

import { Wallet } from 'lucide-react';
import CustomButton from './Button';
import { useAppKit, useAppKitAccount, useWalletInfo } from '@reown/appkit/react';
import { useMemo } from 'react';


const ConnectButton = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletInfo } = useWalletInfo('solana'); // specify namespace

  const shortenedAddress = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [address]);

  const balanceDisplay = useMemo(() => {
    const lamports = Number((walletInfo?.balance as any)?.amount || 0);
    const sol = lamports / 1e9;
    return `${sol.toFixed(2)} SOL`;
  }, [walletInfo]);

  const handleClick = () => {
    if (isConnected) {
      // Open account view to show disconnect option
      open({ view: 'Account' });
    } else {
      // Open connect view
      open({ view: 'Connect' });
    }
  };

  return (
    <CustomButton
      text={
        isConnected ? (
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold">{shortenedAddress}</span>
            <span className="text-xs text-white/80">{balanceDisplay}</span>
          </div>
        ) : (
          <>
            <span className="inline sm:hidden">Connect</span>
            <span className="hidden sm:inline">Connect Wallet</span>
          </>
        )
      }
      icon={Wallet}
      onClick={handleClick}
      className="whitespace-nowrap flex-shrink-0"
    />
  );
};

export default ConnectButton;