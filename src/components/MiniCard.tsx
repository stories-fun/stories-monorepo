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
    <div className="relative overflow-hidden text-white max-w-[270px] w-full h-[220px] flex flex-col bg-black">
      {/* Image section */}
      <div className="relative w-full h-[140px]">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>

      {/* Content section */}
      <div className="bg-[#FFF6C9] text-[#141414] px-2 py-2 flex justify-between items-center h-[80px]">
        {/* Title */}
        <h3 className="font-extrabold text-[16px] leading-tight line-clamp-2 max-w-[150px]">
          {title}
        </h3>

        {/* Price and change on the same line */}
        <div className="flex items-center gap-2">
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
