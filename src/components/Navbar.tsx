"use client";

import Link from "next/link";
import CustomButton from "./Button";
import { Wallet } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="bg-[#141414] px-4 py-4">
      <div className="w-full max-w-screen-lg mx-auto flex items-center justify-center flex-nowrap gap-4">
        {/* Navigation pill */}
        <div className="flex items-center bg-[#141414] rounded-full px-8 py-2 border border-[#FFFFFF1F] gap-6 flex-shrink text-lg">
            {/*
          <Link
            href="/"
            className="text-[#FFEEBA] hover:text-gray-300 transition-colors text-sm sm:text-lg font-bold whitespace-nowrap"
          >
            Home
          </Link>
            */}

          <Link
            href="/"
            className="text-yellow-400 text-2xl sm:text-3xl font-bold hover:text-yellow-300 transition-colors whitespace-nowrap"
          >
            S.
          </Link>

          <Link
            href="/our-story"
            className="text-[#FFEEBA] font-bold hover:underline transition-colors text-sm sm:text-lg whitespace-nowrap"
          >
            Our Story
          </Link>
        </div>

        {/* Connect Wallet Button (text shortens on small screens) */}
        <CustomButton
          text={
            <>
              <span className="inline sm:hidden">Connect</span>
              <span className="hidden sm:inline">Connect Wallet</span>
            </>
          }
          icon={Wallet}
          onClick={() => console.log("Wallet clicked")}
          className="whitespace-nowrap flex-shrink-0"
        />
      </div>
    </nav>
  );
};

export default Navbar;
