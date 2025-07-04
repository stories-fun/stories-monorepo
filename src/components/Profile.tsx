"use client";

import { useState } from "react";
import { Pen, Copy, CopyCheck } from "lucide-react";

interface ProfileProps {
  username: string;
  walletAddress: string;
}

export const Profile = ({ username, walletAddress }: ProfileProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // revert back after 2s
    });
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="w-full bg-[#2E2E2E] rounded-2xl overflow-hidden">
      {/* Username Section */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#141414]">
        <h2 className="text-white text-xl font-medium">
          {username}
        </h2>
        <button className="p-2 hover:bg-[#3A3A3A] rounded-md transition-colors">
          <Pen className="w-5 h-5 text-[#FFF6C9]" />
        </button>
      </div>
      
      {/* Wallet Address Section */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-white text-lg font-mono">
          {truncateAddress(walletAddress)}
        </span>
        <button 
          onClick={handleCopyAddress}
          className="p-2 hover:bg-[#3A3A3A] rounded-md transition-colors"
        >
          {copied ? (
            <CopyCheck className="w-5 h-5 text-[#FFF6C9]" />
          ) : (
            <Copy className="w-5 h-5 text-[#FFF6C9]" />
          )}
        </button>
      </div>
    </div>
  );
};
