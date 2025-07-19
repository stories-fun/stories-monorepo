"use client";

import Image from "next/image";

interface MiniCardProps {
  image?: string;
  title: string;
  price: number;
  change: number;
  videoLink?: string;
}

export function MiniCard({ image, title, price, change, videoLink }: MiniCardProps) {
  const isPositive = change >= 0;
  const changeColor = isPositive ? "text-green-500" : "text-red-500";
  const changeSymbol = isPositive ? "+" : "";

  // Helper to extract thumbnail from YouTube link
  const getYouTubeThumbnail = (url: string): string | null => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
  };

  const mainImage =
    (videoLink && getYouTubeThumbnail(videoLink)) || image || "/placeholder.jpg";

  return (
    <div className="relative flex flex-col overflow-hidden w-full sm:max-w-[270px] h-full bg-black text-white">
      {/* Title bar */}
      <div className="bg-[#FFF6C9] text-[#141414] px-3 py-2 items-start flex-1 flex-col">
        <h3 className="font-bold text-[16px] leading-tight">
          {title}
        </h3>
      </div>

      {/* Image */}
      <div className="relative w-full h-[140px] shrink-0">
        <Image src={mainImage} alt={title} fill className="object-cover" />
      </div>

      {/* Price & change */}
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
  );
}
