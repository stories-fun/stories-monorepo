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
    <div className="relative overflow-hidden text-white max-w-[350px] shadow-lg">
      {/* Folded corner */}
      <div className="absolute top-[-1px] right-0 w-16 h-16 z-1">
         <div
          className="absolute top-0 right-0 w-full h-full shadow-md"
          style={{ clipPath: "polygon(100% 100%, 1000% 0%, 0% 0%)" }}
        />
        <div
          className="absolute top-0 right-0 w-full h-full border-l border-b bg-[#141414] shadow-md"
          style={{ clipPath: "polygon(100% 100%, 1000% 0%, 0% 0%)" }}
        />
        <div
          className="absolute top-0 right-0 w-full h-full bg-[#FFF6C9] shadow-md"
          style={{ clipPath: "polygon(0% 0%, 0% 100%, 100% 100%)" }}
        />
        <div
          className="absolute top-0 right-0 w-full h-full border-l border-b border-[#141414] bg-[#FFF6C9] shadow-md"
          style={{ clipPath: "polygon(0% 0%, 0% 100%, 100% 100%)" }}
        />
      </div>

      {/* Image with author overlay */}
      <div className="relative w-full h-64">
        <Image src={image} alt={title} fill className="object-cover" />
        {author && authorImage && (
          <div className="absolute top-0 left-0 bg-[#141414] flex items-center gap-2 pr-4 rounded-br-xl z-10">
            <Image
              src={authorImage}
              alt={author}
              width={48}
              height={48}
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
