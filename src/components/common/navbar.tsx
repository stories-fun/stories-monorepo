// src/components/common/navbar.tsx
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
import { useSolanaAuth } from '@/context/appkit'; // Import your auth context

const Navbar = () => {
  const pathname = usePathname();
  const { address, isConnected } = useAppKitAccount();
  
  // Use the authentication status from your auth context
  const { isAuthenticated } = useSolanaAuth();
  
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showTradeDropdown, setShowTradeDropdown] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
      checkAdminStatus(address);
    } else {
      setWalletAddress(null);
      setIsAdmin(false);
    }
  }, [isConnected, address]);

  // Check if connected wallet is an admin
  const checkAdminStatus = async (walletAddress: string) => {
    try {
      console.log('🔍 Checking admin status for:', walletAddress);
      const response = await fetch(`/api/admin/stories?wallet_address=${walletAddress}&limit=1`);
      console.log('📡 Admin check response:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Admin check success:', result.data?.admin);
        setIsAdmin(true);
        toast.success('Admin access granted!');
      } else {
        console.log('❌ Admin check failed');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('💥 Admin check error:', error);
      setIsAdmin(false);
    }
  };

  const navItems = [
    { path: '/', label: 'S.', protected: false, isLogo: true },
    { path: '/stories', label: 'Stories', protected: true },
    { path: '/swap', label: 'Trade', protected: true },
    // Admin link - only show if user is admin
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', protected: false, adminOnly: true }] : []),
  ];

  const getNavItemClass = (path: string) => {
    const isActive = pathname === path;
    const isAdminPath = path === '/admin';
    return `font-bold hover:underline transition-colors whitespace-nowrap ${
      isActive 
        ? 'text-yellow-400' 
        : isAdminPath 
          ? 'text-red-400 hover:text-red-300' 
          : 'text-[#FFEEBA]'
    }`;
  };

  const handleProtectedRouteClick = (e: React.MouseEvent, isProtected: boolean, adminOnly?: boolean) => {
    console.log('🔗 Route click:', { isProtected, adminOnly, isAuthenticated, isAdmin, isConnected });
    
    // PRIORITY 1: Admin routes - if user is admin, allow immediate access
    if (adminOnly) {
      if (isAdmin) {
        console.log('✅ Admin access granted - bypassing auth check');
        return; // Allow navigation immediately
      } else {
        e.preventDefault();
        toast.error('Admin Access Required', {
          description: 'You need admin privileges to access this page',
          position: 'top-center',
        });
        return;
      }
    }
    
    // PRIORITY 2: Other protected routes - check authentication
    if (isProtected && !isAuthenticated) {
      e.preventDefault();
      toast.error('Authentication Required', {
        description: 'Please connect and authenticate your wallet to access this page',
        position: 'top-center',
      });
      return;
    }
  };

  return (
    <>
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
                  onClick={(e) => handleProtectedRouteClick(e, item.protected, item.adminOnly)}
                  title={item.adminOnly ? 'Admin Dashboard' : undefined}
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
    </>
  );
};

export default Navbar;