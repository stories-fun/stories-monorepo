"use client";

import Image from "next/image";
import Link from "next/link";
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
}

export function CustomCard({
  image,
  title,
  url,
  timeToRead,
  price,
  change,
  author,
  authorImage,
}: CustomCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "text-green-500" : "text-red-500";
  const changeSymbol = isPositive ? "+" : "";

  return (
    <div className="bg-[#141414] overflow-hidden border border-neutral-800 text-white max-w-[354px] shadow-lg">
      {/* Author */}
      {author && authorImage && (
        <div className="flex items-center gap-3 px-4 pt-4">
          <Image
            src={authorImage}
            alt={author}
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="font-semibold">{author}</span>
        </div>
      )}

      {/* Image */}
      <div className="mt-4">
        <Image
          src={image}
          alt={title}
          width={500}
          height={300}
          className="object-cover w-full h-48"
        />
      </div>

      {/* Content */}
      <div className="bg-[#FFF6C9] text-[#141414] py-4">
        <div className="flex justify-between items-center px-4">
          <h3 className="font-extrabold text-[24px] leading-[146%] tracking-[0%] mr-2">
            {title}
          </h3>
          {timeToRead && (
            <span className="flex items-center text-sm text-[#141414] text-nowrap">
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
        {url && (
          <div className="border-t border-[#141414] pt-4">
            <div className="px-4">
              <Link href={url}>
                <CustomButton
                  text="Read snippet"
                  className="w-full justify-center"
                />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
