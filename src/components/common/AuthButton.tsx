// components/common/AuthButton.tsx
'use client';

import { useSolanaAuth } from '@/context/appkit';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';

export function AuthButton() {
  const {
    isConnected,
    isAuthenticated,
    isAuthenticating,
    authenticate
  } = useSolanaAuth();

  if (!isConnected) {
    return null;
  }

  const baseClasses = "ml-2 px-3 py-1.5 text-sm rounded transition-all duration-200 font-medium flex items-center gap-1.5";
  const authenticatedClasses = "bg-green-600 hover:bg-green-700 text-white shadow-md";
  const unauthenticatedClasses = "border border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-black";
  const disabledClasses = "cursor-not-allowed opacity-70";

  const className = [
    baseClasses,
    isAuthenticated ? authenticatedClasses : unauthenticatedClasses,
    isAuthenticating ? disabledClasses : ""
  ].join(" ");

  return (
    <button
      onClick={authenticate}
      disabled={isAuthenticating || isAuthenticated}
      className={className}
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-xs">Verifying</span>
        </>
      ) : isAuthenticated ? (
        <>
          <ShieldCheck className="h-3.5 w-3.5" />
        </>
      ) : (
        <>
          <Lock className="h-3.5 w-3.5" />
          <span className="text-xs">Verify</span>
        </>
      )}
    </button>
  );
}
