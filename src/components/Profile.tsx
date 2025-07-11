"use client";

import { useState } from "react";
import { Pen, Copy, CopyCheck } from "lucide-react";

interface ProfileProps {
  username: string;
  walletAddress: string;
  avatarUrl?: string; // Optional, might not be present in all profiles
}

export const Profile = ({ username, walletAddress, avatarUrl }: ProfileProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="w-full bg-[#2E2E2E] rounded-2xl overflow-hidden">
      {/* Avatar Section */}
      <div className="flex items-center px-6 py-4 border-b border-[#141414]">
  {/* Avatar on the left */}
  <img
    src={avatarUrl || "/pfp.jpeg"}
    alt="Avatar"
    className="w-16 h-16 rounded-full border-2 border-[#FFF6C9] object-cover mr-4"
  />

  {/* Username and Edit button on the right */}
  <div className="flex justify-between items-center w-full">
    <h2 className="text-white text-xl font-medium">
      {username || "Anonymous"}
    </h2>
    <button className="p-2 hover:bg-[#3A3A3A] rounded-md transition-colors">
      <Pen className="w-5 h-5 text-[#FFF6C9]" />
    </button>
  </div>
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
