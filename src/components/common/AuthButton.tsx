'use client';

import { useSolanaAuth } from '@/context/appkit';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';
import CustomButton from './Button';
import React, { useEffect, useState } from 'react';

export function AuthButton() {
  const {
    isConnected,
    isAuthenticated,
    isAuthenticating,
    authenticate
  } = useSolanaAuth();

  const [showVerified, setShowVerified] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setShowVerified(true);
      const timer = setTimeout(() => setShowVerified(false), 1500); // 1.5s animation
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  if (!isConnected) return null;
  if (isAuthenticated && !showVerified) return null;

  const getStatus = () => {
    if (isAuthenticating) {
      return {
        content: <Loader2 size={20} className="animate-spin mx-auto" />,
        className: '!p-1 w-10 bg-yellow-500 hover:bg-yellow-600 text-black',
        disabled: true,
      };
    }

    if (isAuthenticated) {
      return {
        content: (
          <ShieldCheck
            size={20}
            className="animate-ping-slow text-white mx-auto"
          />
        ),
        className: '!p-1 w-10 bg-green-500 hover:bg-green-600 text-white',
        disabled: true,
      };
    }

    return {
      content: (
        <div className="flex items-center gap-2 px-2">
          <Lock size={18} />
          <span className="text-sm">Verify</span>
        </div>
      ),
      className: 'bg-orange-500 hover:bg-orange-600 text-white',
      disabled: false,
    };
  };

  const { content, className, disabled } = getStatus();

  return (
    <CustomButton
      text={content}
      onClick={authenticate}
      className={className}
      disabled={disabled}
    />
  );
}
