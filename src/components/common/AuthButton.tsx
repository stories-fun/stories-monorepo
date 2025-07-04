// src/components/common/AuthButton.tsx
'use client';

import { useAppKitAccount } from '@reown/appkit/react';
import { Loader2, ShieldCheck, Lock, Pen } from 'lucide-react';
import CustomButton from './Button';
import React, { useEffect, useState } from 'react';
import { UserVerificationDialog } from './UserVerificationDialog';
import { useSolanaAuth } from '@/context/appkit';
import { toast } from 'sonner';

export function AuthButton() {
  const { isConnected, address } = useAppKitAccount();
  const {
    isAuthenticated: isSolanaAuthenticated,
    isAuthenticating,
    authenticate: authenticateSolana
  } = useSolanaAuth();
  
  const [userStatus, setUserStatus] = useState<'checking' | 'new' | 'existing' | 'signing' | 'verified'>('checking');
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showVerified, setShowVerified] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Check if user exists in database when wallet connects
  const checkUserExists = async (walletAddress: string) => {
    try {
      console.log('Checking user exists for wallet:', walletAddress);
      setUserStatus('checking');
      
      const response = await fetch(`/api/users/signin?wallet_address=${encodeURIComponent(walletAddress)}`);
      const result = await response.json();

      console.log('API Response:', { status: response.status, result });

      if (response.ok && response.status === 200) {
        // User exists in database - set to existing status
        console.log('User found in database:', result.data.user);
        setUserData(result.data.user);
        setUserStatus('existing');
        return true;
      } else if (response.status === 404) {
        // User doesn't exist in database - set to new status
        console.log('User not found in database - new user');
        setUserStatus('new');
        setUserData(null);
        return false;
      } else {
        // Other error - log and treat as new user
        console.error('Unexpected response:', response.status, result);
        setUserStatus('new');
        setUserData(null);
        return false;
      }
    } catch (error) {
      console.error('Error checking user exists:', error);
      // On network error, default to new user
      setUserStatus('new');
      setUserData(null);
      return false;
    }
  };

  // Handle user verification (for new users) - Sign message first, then open dialog
  const handleVerify = async () => {
    if (!address) return;
    
    try {
      setUserStatus('signing');
      console.log('Starting Solana authentication before registration...');
      
      // First authenticate with Solana (sign message)
      const authSuccess = await authenticateSolana();
      
      if (authSuccess) {
        console.log('Solana authentication successful, opening registration dialog');
        setUserStatus('new'); // Reset to show dialog
        setShowVerificationDialog(true);
      } else {
        console.log('Solana authentication failed during registration');
        setUserStatus('new');
        toast.error('Message signing failed. Please try again.');
      }
    } catch (error) {
      console.error('Authentication error during registration:', error);
      setUserStatus('new');
      toast.error('Authentication failed. Please try again.');
    }
  };

  // Handle successful verification (after user registration) - No need to sign again
  const handleVerificationSuccess = async (newUserData: any) => {
    console.log('User registration successful:', newUserData);
    setUserData(newUserData);
    
    // User is already authenticated from the previous step, just show success
    setUserStatus('verified');
    setShowVerified(true);
    toast.success(`Welcome, ${newUserData?.username || 'User'}! Account created and verified.`);
    
    // Hide the verified animation after 3 seconds
    setTimeout(() => {
      setShowVerified(false);
    }, 3000);
  };

  // Handle existing user login with Solana authentication
  const handleExistingUserLogin = async () => {
    if (!address) return;
    
    try {
      setUserStatus('signing');
      console.log('Starting Solana authentication for existing user:', userData);
      
      // Use the existing Solana auth system
      const authSuccess = await authenticateSolana();
      
      if (authSuccess) {
        console.log('Solana authentication successful for existing user');
        setUserStatus('verified');
        setShowVerified(true);
        toast.success(`Welcome back, ${userData?.username || 'User'}!`);
        
        // Hide the verified animation after 3 seconds
        setTimeout(() => {
          setShowVerified(false);
        }, 3000);
      } else {
        // If signing failed, revert to existing status
        console.log('Solana authentication failed, reverting status');
        setUserStatus('existing');
        toast.error('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setUserStatus('existing');
      toast.error('Authentication failed. Please try again.');
    }
  };

  // Reset state when wallet disconnects
  const resetAuthState = () => {
    setUserStatus('checking');
    setUserData(null);
    setShowVerified(false);
    setShowVerificationDialog(false);
  };

  // Check user status when wallet connects/disconnects
  useEffect(() => {
    if (isConnected && address) {
      console.log('Wallet connected, checking user status for:', address);
      checkUserExists(address);
    } else {
      console.log('Wallet disconnected, resetting auth state');
      resetAuthState();
    }
  }, [isConnected, address]);

  // Handle when Solana auth state changes
  useEffect(() => {
    if (isSolanaAuthenticated && userStatus === 'verified') {
      console.log('Solana authentication confirmed');
    }
  }, [isSolanaAuthenticated, userStatus]);

  // Don't show anything if wallet is not connected
  if (!isConnected || !address) {
    return null;
  }

  // Don't show button if user is verified and animation is not showing
  if (userStatus === 'verified' && !showVerified && isSolanaAuthenticated) {
    return null;
  }

  const getButtonProps = () => {
    // If currently authenticating with Solana
    if (isAuthenticating || userStatus === 'signing') {
      return {
        content: (
          <div className="flex items-center gap-2 px-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Signing...</span>
          </div>
        ),
        className: '!bg-yellow-500 text-white cursor-not-allowed',
        disabled: true,
        onClick: () => {},
      };
    }

    switch (userStatus) {
      case 'checking':
        return {
          content: <Loader2 size={20} className="animate-spin mx-auto" />,
          className: '!p-1 w-10 bg-blue-500 text-white',
          disabled: true,
          onClick: () => {},
        };

      case 'new':
        return {
          content: (
            <div className="flex items-center gap-2 px-2">
              <Lock size={18} />
              <span className="text-sm">Verify</span>
            </div>
          ),
          className: 'bg-orange-500 hover:bg-orange-600 text-white',
          disabled: false,
          onClick: handleVerify,
        };

      case 'existing':
        return {
          content: (
            <div className="flex items-center gap-2 px-2">
              <Pen size={18} />
              <span className="text-sm">Sign In</span>
            </div>
          ),
          className: 'bg-green-500 hover:bg-green-600 text-white',
          disabled: false,
          onClick: handleExistingUserLogin,
        };

      case 'verified':
        return {
          content: (
            <div className="flex items-center gap-2 px-2">
              <ShieldCheck size={18} className="animate-pulse" />
              <span className="text-sm">Verified!</span>
            </div>
          ),
          className: '!bg-green-500 text-white',
          disabled: true,
          onClick: () => {},
        };

      default:
        return {
          content: <span className="text-sm">Error</span>,
          className: 'bg-red-500 text-white',
          disabled: true,
          onClick: () => {},
        };
    }
  };

  const { content, className, disabled, onClick } = getButtonProps();

  return (
    <>
      <CustomButton
        text={content}
        onClick={onClick}
        className={className}
        disabled={disabled}
      />

      {/* Verification Dialog */}
      <UserVerificationDialog
        isOpen={showVerificationDialog}
        onClose={() => setShowVerificationDialog(false)}
        walletAddress={address}
        onSuccess={handleVerificationSuccess}
      />
    </>
  );
}