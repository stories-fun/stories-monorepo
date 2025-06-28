'use client';

import { DexScreenerSwap } from "../../components/swap/DexScreenerSwap";
import Image from "next/image";

export default function SwapPage() {
  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center pt-24 pb-12">
      {/* Logo Section - Same as your page.tsx */}
      <div className="w-full max-w-[1400px] mb-16 flex justify-center">
        <div className="relative w-[300px] h-[100px] sm:w-[600px] sm:h-[200px]">
          <Image
            src="/stories_logo_large.svg"
            alt="Stories Logo"
            fill
            priority
            className="object-contain"
          />
        </div>
      </div>

      {/* Swap Container */}
      <div className="w-full max-w-[1400px] px-4">
        <DexScreenerSwap />
      </div>
    </div>
  );
}