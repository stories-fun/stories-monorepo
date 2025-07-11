"use client";

import Image from "next/image";
import { Clock5, Eye } from "lucide-react";
import CustomButton from "./Button";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  status
}: CustomCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "text-green-500" : "text-red-500";
  const changeSymbol = isPositive ? "+" : "";

  // Function to clean markdown for preview
  const cleanMarkdownPreview = (text: string) => {
    // Remove markdown headers
    let cleaned = text.replace(/^#+\s+/gm, '');
    // Remove bold/italic markers
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    // Remove image/video markdown
    cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
    cleaned = cleaned.replace(/<video.*?<\/video>/g, '');
    // Remove blockquotes
    cleaned = cleaned.replace(/^>\s+/gm, '');
    // Remove links
    cleaned = cleaned.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // Trim and get first 150 characters
    return cleaned.trim().substring(0, 150) + (cleaned.length > 150 ? '...' : '');
  };

  return (
    <div className="relative overflow-hidden bg-white max-w-[350px] transition-transform hover:scale-[1.02] hover:shadow-xl">
      {/* Main Image */}
      <div className="relative w-full h-64">
        <Image 
          src={image ?? "/fallback-cover.jpg"}
          alt={title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Content Section */}
      <div className="bg-[#FFF6C9] text-[#141414] p-4 ">
        {/* Author Info */}
        {author && authorImage && (
          <div className="flex items-center gap-2 mb-4 absolute right-0 top-0 bg-[#141414] py-2 px-3 rounded-bl-lg">
            <Image
              src={authorImage ?? "/author-fallback.jpg"}
              alt={author}
              width={24}
              height={24}
              className="rounded-lg"
            />
            <span className="font-medium text-sm text-white">{author}</span>
          </div>
        )}

        {/* Title and Time */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-xl leading-tight flex-1 mr-2 line-clamp-2">
            {title}
          </h3>
          {timeToRead && (
            <div className="flex items-center text-sm text-nowrap mt-1 ml-2">
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
                ${price.toFixed(2)}
              </span>
            )}
            {change !== undefined && (
              <span className={`text-sm font-medium ${changeColor}`}>
                {changeSymbol}{change}%
              </span>
            )}
          </div>
        )}

        {/* Story Preview */}
        <div className="relative mb-4 min-h-[60px]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Strip out all complex markdown for the preview
              h1: ({node, ...props}) => <span className="font-bold" {...props} />,
              h2: ({node, ...props}) => <span className="font-bold" {...props} />,
              h3: ({node, ...props}) => <span className="font-bold" {...props} />,
              p: ({node, ...props}) => <p className="text-sm text-gray-700 line-clamp-3" {...props} />,
              img: () => null,
              video: () => null,
              a: ({node, ...props}) => <span {...props} />,
              strong: ({node, ...props}) => <span {...props} />,
              em: ({node, ...props}) => <span {...props} />,
              blockquote: () => null,
              code: () => null,
            }}
          >
            {cleanMarkdownPreview(contentSnippet)}
          </ReactMarkdown>
        </div>

        <CustomButton
          text={
            status === "submitted" && isOwner
              ? "View Draft"
              : price && price > 0
              ? "Read Snippet"
              : "Read Free"
          }
          onClick={onClick}
          className={`w-full mt-2 justify-center ${
            status === "submitted" && isOwner
              ? "bg-yellow-600 hover:bg-yellow-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        />
      </div>
    </div>
  );
}