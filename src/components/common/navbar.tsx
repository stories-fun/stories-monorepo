"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ConnectButton from './ConnectBtn';
import { AuthButton } from './AuthButton';

const Navbar = () => {
  const pathname = usePathname();
  const { address, isConnected } = useAppKitAccount();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showTradeDropdown, setShowTradeDropdown] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
    } else {
      setWalletAddress(null);
    }
  }, [isConnected, address]);

  const navItems = [
    { path: '/', label: 'S.', protected: false, isLogo: true },
    { path: '/our-story', label: 'Our Story', protected: false },
    { path: '/swap', label: 'Trade', protected: false },
  ];

  const getNavItemClass = (path: string) => {
    const isActive = pathname === path;
    return `font-bold hover:underline transition-colors whitespace-nowrap ${
      isActive ? 'text-yellow-400' : 'text-[#FFEEBA]'
    }`;
  };

  const handleProtectedRouteClick = (e: React.MouseEvent, isProtected: boolean) => {
    if (isProtected && !isAuthenticated) {
      e.preventDefault();
      toast.error('Authentication Required', {
        description: 'Please connect your wallet to access this page',
        position: 'top-center',
      });
    }
  };

  return (
    <nav className="bg-[#141414] px-4 py-4">
      <div className="w-full max-w-screen-lg mx-auto flex items-center justify-center flex-nowrap gap-4">
        {/* Navigation pill */}
        <div className="flex items-center bg-[#141414] rounded-full px-8 py-2 border border-[#FFFFFF1F] gap-6 flex-shrink text-lg">
          {navItems.map((item) => (
            item.isLogo ? (
              <Link
                key={item.path}
                href={item.path}
                className="text-yellow-400 text-2xl sm:text-3xl font-bold hover:text-yellow-300 transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.path}
                href={item.protected && !isAuthenticated ? '#' : item.path}
                className={getNavItemClass(item.path)}
                onClick={(e) => handleProtectedRouteClick(e, item.protected)}
              >
                {item.label}
              </Link>
            )
          ))}

<div className="flex items-center gap-2 ">
          <ConnectButton />
          {isConnected && <AuthButton/>}
        </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;