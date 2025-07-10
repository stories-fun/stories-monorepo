"use client";

import Image from "next/image";

import { Clock5 } from "lucide-react";
import { Eye } from "lucide-react";
import CustomButton from "./Button";
interface CustomCardProps {
    image?: string;
    title: string;
    url?: string;
    timeToRead?: string;
    price?: number;
    change?: number;
    author?: string;
    contentSnippet: string;
    authorImage?: string;
    status?: string;
    isOwner?: boolean;
    onClick?: (e: React.MouseEvent) => void;
  }
  
  

export function CustomCard({
  image,
  title,
  timeToRead,
  price,
  change,
  author,
  contentSnippet,
  authorImage,
  onClick,
  isOwner,
}: CustomCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "text-green-500" : "text-red-500";
  const changeSymbol = isPositive ? "+" : "";

  return (
    <div className="relative overflow-hidden bg-white shadow-lg max-w-[350px]">
      {/* Main Image */}
      <div className="relative w-full h-64">
      <Image 
  src={image ?? "/fallback-cover.jpg"}  // ✅ fallback image
  alt={title}
  fill
  className="object-cover"
/>

      </div>

      {/* Content Section */}
      <div className="bg-[#FFF6C9] text-[#141414] p-4 rounded-lg">
        {/* Author Info */}
        {author && authorImage && (
         <div className="flex items-center gap-2 mb-4 absolute right-0 top-0 bg-[#141414] py-2 px-2 rounded-bl-lg rounded-tl-lg">
<Image
  src={authorImage ?? "/author-fallback.jpg"}  // ✅ fallback image
  alt={author}
  width={24}
  height={24}
  className="rounded-lg"
/>

            <span className="font-medium text-sm text-white">{author}</span>
          </div>
        )}

        {/* Title and Time */}
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-xl leading-tight flex-1 mr-2">
            {title}
          </h3>
          {timeToRead && (
            <div className="flex items-center text-sm text-nowrap mt-4">
              <Clock5 size={16} className="mr-1" />
              {timeToRead}
            </div>
          )}
        </div>

        {/* Price and Change (if applicable) */}
        {(price !== undefined || change !== undefined) && (
          <div className="flex items-center gap-2 mb-3">
            {price !== undefined && (
              <span className={`font-bold text-lg ${changeColor}`}>
                ${price}
              </span>
            )}
            {change !== undefined && (
              <span className={`text-sm font-medium ${changeColor}`}>
                {changeSymbol}{change}%
              </span>
            )}
          </div>
        )}

        {/* Story Preview with Fade Effect */}
        <div className="relative mb-4">
          <p className="text-sm text-gray-700 line-clamp-3">
            {contentSnippet}
          </p>
          {/* Fade overlay for long content */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#FFF6C9] to-transparent pointer-events-none"></div>
        </div>

        <CustomButton
  text={
    status === "submitted" && isOwner
      ? "View Draft"
      : price && price > 0
      ? "Read Snippet"
      : "Read Free"
  }
  onClick={onClick ? (e) => onClick(e) : undefined}
  className={`w-full mt-3 justify-center ${
    status === "submitted" && isOwner
      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
      : "bg-green-600 hover:bg-green-700 text-white group-hover:bg-green-500"
  }`}
/>

      </div>
    </div>
  );
}