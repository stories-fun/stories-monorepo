"use client";

import Image from "next/image";
import CustomButton from "./Button";

export default function Footer() {
  const textStyle =
    "font-bold text-[20px] leading-[150%] tracking-normal text-center";

  return (
    <footer className="w-full bg-[#141414] text-[#FFEEBA] pt-16 pb-10 relative overflow-hidden">
      {/* Cloud Left */}
      <div className="absolute top-0 left-0 w-[120px] sm:w-[160px]">
        <Image
          src="/cloud_left.svg"
          alt="Cloud Left"
          width={160}
          height={100}
          className="w-full h-auto"
        />
      </div>

      {/* Cloud Right */}
      <div className="absolute top-[140px] right-0 w-[120px] sm:w-[160px] overflow-hidden">
        <Image
          src="/cloud_right.svg"
          alt="Cloud Right"
          width={160}
          height={100}
          className="w-full h-auto"
        />
      </div>

      {/* Heading Text */}
      <h1 className="text-[40px] sm:text-[60px] md:text-[80px] font-extrabold text-center leading-[100%] tracking-tight px-4 whitespace-nowrap overflow-hidden text-[#FFEEBA] z-10">
        Storytelling made fun
      </h1>

      {/* Unlock Button */}
      <div className="mt-10 z-10 flex justify-center">
        <CustomButton
          text="Unlock Stories"
          onClick={() => console.log("Unlock Stories clicked")}
        />
      </div>

      {/* Footer Content */}
      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-8 mt-40 relative z-10">
        {/* Center logo */}
        <div className="text-yellow-400 text-2xl sm:text-3xl font-bold hover:text-yellow-300 transition-colors whitespace-nowrap">
          S.
        </div>

        {/* First row */}
        <div className={`flex justify-center gap-16 text-sm ${textStyle}`}>
          <a href="#about" className="hover:underline">
            About
          </a>
          <a href="#faqs" className="hover:underline">
            FAQs
          </a>
        </div>

        {/* Second row */}
        <div
          className={`flex justify-between w-full max-w-md text-sm px-6 ${textStyle}`}
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
