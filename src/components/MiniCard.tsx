"use client";

import Image from "next/image";

interface MiniCardProps {
  image: string;
  title: string;
  price: number;
  change: number;
}

export function MiniCard({ image, title, price, change }: MiniCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "text-green-500" : "text-red-500";
  const changeSymbol = isPositive ? "+" : "";

  return (
    <div className="relative flex flex-col overflow-hidden w-full sm:max-w-[270px] h-full bg-black text-white">
      
      <div className="bg-[#FFF6C9] text-[#141414] px-3 py-2 items-start flex-1 flex-col">
        <h3 className="font-bold text-[16px] leading-tight">
          {title}
        </h3>
      </div>
      
      {/* Image section */}
      <div className="relative w-full h-[140px] shrink-0">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>

      {/* Content section */}
      <div className="bg-[#FFF6C9] text-[#141414] px-2 py-2 flex justify-between items-center flex-row flex-1">
        {/* Title */}
        {/* <h3 className="font-bold text-[16px] leading-tight flex-1 pr-2">
          {title}
        </h3> */}

        {/* Price and change on the same line */}
        <div className="mt-auto flex items-center gap-2 bg-[#FFF6C9] text-[#141414] px-3 py-3">
        <span className={`text-lg font-bold ${changeColor}`}>
          {price.toFixed(2)}
        </span>
        <span className="text-[#141414] text-2xl font-bold leading-none">·</span>
        <span className={`text-sm font-semibold ${changeColor} whitespace-nowrap`}>
          {changeSymbol}
          {change.toFixed(2)}%
        </span>
      </div>
      </div>
    </div>
  );
}