"use client";

import Image from "next/image";
import CustomButton from "./Button";
import { Wallet } from "lucide-react";

export default function Footer() {
  const textStyle =
    "font-bold text-[20px] leading-[150%] tracking-normal text-center";

  return (
    <footer className="w-full bg-[#141414] text-[#FFEEBA] pt-16 pb-10 relative overflow-hidden z-100">
      {/* Cloud Left */}
      <div className="absolute top-0 left-0 w-[120px] sm:w-[160px] mb-10">
        <Image
          src="/cloud_left.svg"
          alt="Cloud Left"
          width={160}
          height={100}
          className="w-full h-auto"
        />
      </div>

      {/* Cloud Right */}
      <div className="absolute top-[140px] right-0 w-[120px] sm:w-[160px] overflow-hidden mt-10">
        <Image
          src="/cloud_right.svg"
          alt="Cloud Right"
          width={160}
          height={100}
          className="w-full h-auto"
        />
      </div>

      {/* Heading Text */}
      <h1 className="text-[40px] sm:text-[60px] md:text-[140px] font-extrabold text-center leading-[100%] tracking-tight px-4 whitespace-nowrap overflow-hidden text-[#FFEEBA] z-10">
        Storytelling made fun
      </h1>

      {/* Unlock Button */}
      <div className="mt-10 z-10 flex justify-center">
        <CustomButton
          text="Unlock Stories"
          icon={Wallet}
          onClick={() => console.log("Unlock Stories clicked")}
        />
      </div>

      {/* Footer Content */}
      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-8 mt-40 relative z-10">
        {/* Center logo */}
        <div className="hidden sm:block text-yellow-400 text-2xl sm:text-3xl font-bold hover:text-yellow-300 transition-colors whitespace-nowrap">
          S.
        </div>

        {/* Mobile: All links in one row */}
        <div
          className={`flex sm:hidden flex-nowrap justify-center items-center w-full gap-4 text-sm ${textStyle}`}
        >
          <a href="#about" className="hover:underline">
            About
          </a>
          <a href="#faqs" className="hover:underline">
            FAQs
          </a>
          {/* logo */}
          <div className="text-yellow-400 text-2xl sm:text-3xl font-bold hover:text-yellow-300 transition-colors whitespace-nowrap">
            S.
          </div>
          <a href="#stories" className="hover:underline">
            Stories
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Twitter
          </a>
        </div>

        {/* Desktop: First row – narrower */}
        <div
          className={`hidden sm:flex justify-between w-full max-w-sm gap-20 text-sm ${textStyle}`}
        >
          <a href="#about" className="hover:underline">
            About
          </a>
          <a href="#faqs" className="hover:underline">
            FAQs
          </a>
        </div>

        {/* Desktop: Second row – wider */}
        <div
          className={`hidden sm:flex justify-between w-full max-w-[1400px] gap-40 text-sm ${textStyle}`}
        >
          <a href="#stories" className="hover:underline">
            Stories
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
