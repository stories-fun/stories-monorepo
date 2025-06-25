'use client';

import { DexScreenerSwap } from "../../components/swap/DexScreenerSwap";

export default function SwapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <DexScreenerSwap />
      </div>
    </div>
  );
}