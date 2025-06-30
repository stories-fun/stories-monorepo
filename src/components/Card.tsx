"use client";

import Image from "next/image";
import CustomButton from "./Button";
import { Clock5 } from "lucide-react";

interface CustomCardProps {
  image: string;
  title: string;
  url?: string;
  timeToRead?: string;
  price?: number;
  change?: number;
  author?: string;
  authorImage?: string;
  onClick?: () => void;
}

export function CustomCard({
  image,
  title,
  timeToRead,
  price,
  change,
  author,
  authorImage,
  onClick,
}: CustomCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "text-green-500" : "text-red-500";
  const changeSymbol = isPositive ? "+" : "";

  return (
    <div className="relative overflow-hidden border border-neutral-800 text-white max-w-[354px] shadow-lg">
      {/* Image with author overlay */}
      <div className="relative w-full h-64">
        <Image src={image} alt={title} fill className="object-cover" />
        {author && authorImage && (
          <div className="absolute top-0 left-0 bg-[#141414] flex items-center gap-2 px-3 py-2 rounded-br-xl z-10">
            <Image
              src={authorImage}
              alt={author}
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="font-semibold text-sm">{author}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-[#FFF6C9] text-[#141414] py-4">
        <div className="flex justify-between items-center px-4">
          <h3 className="font-extrabold text-[24px] leading-[146%] tracking-[0%] mr-2">
            {title}
          </h3>
          {timeToRead && (
            <span className="flex items-center text-sm text-nowrap">
              <Clock5 size={16} className="mr-1" />
              {timeToRead}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4 px-4">
          {price !== undefined && (
            <span className={`font-bold text-lg ${changeColor}`}>{price}</span>
          )}
          {price !== undefined && change !== undefined && (
            <>
              <span className="text-[#141414] text-2xl font-bold">·</span>
              <span className={`text-sm font-medium ${changeColor}`}>
                {changeSymbol}
                {change}%
              </span>
            </>
          )}
        </div>

        <div className="border-t border-[#141414] pt-4">
          <div className="px-4">
            <CustomButton
              text="Read snippet"
              className="w-full justify-center"
              onClick={onClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
