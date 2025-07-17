"use client";

import Image from "next/image";
import CustomButton from "./Button";
import { Clock5 } from "lucide-react";
import {
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { OutputData } from "@editorjs/editorjs";
import RenderEditorOutput from "../stories/RenderEditorOutput";



interface CustomCardProps {
  image: string;
  title: string;
  url?: string;
  timeToRead?: string;
  price?: number;
  change?: number;
  author?: string;
  contentSnippet: OutputData;
  authorImage?: string;
  onClick?: () => void;
  isOwner?: boolean;
  status?: string;
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
  status,
}: CustomCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "text-green-500" : "text-red-500";
  const changeSymbol = isPositive ? "+" : "";

  // ----- Markdown cleaner for preview ----- //
  const cleanMarkdownPreview = (text: string) => {
    let cleaned = text
      .replace(/^#+\s+/gm, '')                      // headers
      .replace(/\*\*([^*]+)\*\*/g, '$1')            // bold
      .replace(/\*([^*]+)\*/g, '$1')                // italic
      .replace(/!\[.*?\]\(.*?\)/g, '')              // images
      .replace(/<video.*?<\/video>/g, '')           // videos
      .replace(/^>\s+/gm, '')                       // blockquotes
      .replace(/\[(.*?)\]\(.*?\)/g, '$1');          // links

    return cleaned.trim().substring(0, 150) + (cleaned.length > 150 ? '...' : '');
  };

  // ----- Dynamic line clamp logic ----- //
  const snippetBoxRef = useRef<HTMLDivElement>(null);
  const [lineClamp, setLineClamp] = useState<number>(3);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const updateClamp = () => {
      if (!snippetBoxRef.current) return;

      const para = snippetBoxRef.current.querySelector("p");
      if (!para) return;

      const { lineHeight } = window.getComputedStyle(para);
      const lh = parseFloat(lineHeight || "0");
      const available = snippetBoxRef.current.clientHeight;

      let lines = Math.floor(available / lh);
      if (!Number.isFinite(lines) || lines < 3) lines = 3;

      setLineClamp(lines);
    };

    updateClamp();
    const ro = new ResizeObserver(updateClamp);
    snippetBoxRef.current && ro.observe(snippetBoxRef.current);
    window.addEventListener("resize", updateClamp);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateClamp);
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-white shadow-lg max-w-[350px] h-full w-full flex flex-col transition-transform hover:scale-[1.02] hover:shadow-xl">
      {/* Main Image */}
      <div className="relative w-full h-64">
        <Image src={image ?? "/fallback-cover.jpg"} alt={title} fill className="object-cover" />
        {author && authorImage && (
          <div className="flex items-center gap-2 mb-3 absolute right-0 bottom-[-30px] bg-[#141414] py-2 px-2 rounded-bl-lg rounded-tl-lg">
            <Image
              src={authorImage}
              alt={author}
              width={24}
              height={24}
              className="rounded-lg"
            />
            <span className="font-medium text-sm text-white">{author}</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="bg-[#FFF6C9] text-[#141414] p-4 flex flex-col flex-1">
        {/* Title and Time */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-xl leading-tight flex-1 mr-2">
            {title}
          </h3>
          {timeToRead && (
            <div className="flex items-center text-sm text-nowrap mt-1">
              <Clock5 size={16} className="mr-1" />
              {timeToRead}
            </div>
          )}
        </div>

        {/* Price and Change */}
        {(price !== undefined || change !== undefined) && (
          <div className="flex items-center gap-2 mb-3">
            {price !== undefined && (
              <span className={`font-bold text-lg ${changeColor}`}>${price.toFixed(2)}</span>
            )}
            {change !== undefined && (
              <span className={`text-sm font-medium ${changeColor}`}>
                {changeSymbol}
                {change}%
              </span>
            )}
          </div>
        )}

        {/* Snippet Preview */}
{/* Snippet Preview */}
<div className="relative mb-4 flex-1 min-h-[60px] overflow-hidden">
  <div
    className="line-clamp-4 text-sm text-gray-700 prose prose-sm max-w-none"
    style={{
      maxHeight: "7.5em", // roughly 4 lines with 1.875em line height
      overflow: "hidden",
    }}
  >
    <RenderEditorOutput data={contentSnippet} />
  </div>
  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#FFF6C9] to-transparent" />
</div>


        {/* Button */}
        <div className="mt-auto">
          <CustomButton
            text={
              status === "submitted" && isOwner
                ? "View Draft"
                : price && price > 0
                ? "Read Snippet"
                : "Read Free"
            }
            className={`w-full justify-center ${
              status === "submitted" && isOwner
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            } py-2 px-4 rounded-full font-medium transition-colors`}
            onClick={onClick}
          />
        </div>
      </div>
    </div>
  );
}
