"use client";

import Image from "next/image";
import CustomButton from "./Button";
import { Clock5 } from "lucide-react";
import { useState } from "react";

interface SingleStoryProps {
  title: string;
  url?: string;
  timeToRead?: string;
  price?: number;
  change?: number;
  author?: string;
  authorImage?: string;
  storyContent?: string;
}

interface CommentProps {
  userImage: string;
  userName: string;
  comment: string;
  createdAt: string;
  replies?: CommentProps[];
}

export function SingleStory({
  title,
  timeToRead,
  price,
  change,
  author,
  authorImage,
  storyContent,
}: SingleStoryProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "text-green-700" : "text-red-700";
  const changeSymbol = isPositive ? "+" : "";

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Sample comments data
  const comments: CommentProps[] = [
    {
      userImage: "/api/placeholder/40/40",
      userName: "Toffani.ok",
      comment: "Ultricies ultricies interdum dolor sodales. Vitae feugiat vitae vitae quis id consectetur. Aenean urna, lectus enim suscipit eget. Tristique bibendum nibh enim dui.",
      createdAt: "6h",
      replies: [
        {
          userImage: "/api/placeholder/40/40",
          userName: "Toffani.ok",
          comment: "Ultricies ultricies interdum dolor sodales. Vitae feugiat vitae vitae quis",
          createdAt: "6h"
        }
      ]
    },
    {
      userImage: "/api/placeholder/40/40",
      userName: "Toffani.ok",
      comment: "Ultricies ultricies interdum dolor sodales. Vitae feugiat vitae vitae quis id consectetur. Aenean urna, lectus enim suscipit eget. Tristique bibendum nibh enim dui.",
      createdAt: "6h"
    }
  ];

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText("");
  };

  const handleReplySubmit = (commentId: string) => {
    if (replyText.trim()) {
      // Here you would typically add the reply to your comments data
      console.log(`Reply to ${commentId}: ${replyText}`);
      setReplyingTo(null);
      setReplyText("");
    }
  };

  const CommentComponent = ({ comment, isReply = false, commentId }: { comment: CommentProps; isReply?: boolean; commentId?: string }) => {
    const uniqueId = commentId || `${comment.userName}-${comment.createdAt}`;
    
    return (
      <div className={`${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
        <div className="flex gap-3">
          <Image
            src={comment.userImage}
            alt={comment.userName}
            width={40}
            height={40}
            className="rounded-full flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-[#141414]">{comment.userName}</span>
            </div>
            <p className="text-[#141414] text-sm mb-3 leading-relaxed">
              {comment.comment}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <button className="text-green-600 font-medium hover:text-green-700">
                Like
              </button>
              <span className="text-gray-400">•</span>
              <button 
                onClick={() => handleReply(uniqueId)}
                className="text-green-600 font-medium hover:text-green-700"
              >
                Reply
              </button>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{comment.createdAt}</span>
            </div>
          </div>
        </div>
        
        {/* Reply input box */}
        {replyingTo === uniqueId && (
          <div className="flex gap-3 mt-4 ml-12">
            <Image
              src="/api/placeholder/40/40"
              alt="Your avatar"
              width={32}
              height={32}
              className="rounded-full flex-shrink-0"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={`Reply to ${comment.userName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-[#E8DCA6] text-[#141414] px-4 py-2 rounded-full border-none outline-none placeholder:text-gray-600 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleReplySubmit(uniqueId);
                  }
                }}
                autoFocus
              />
              <button 
                onClick={() => handleReplySubmit(uniqueId)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 text-white p-1.5 rounded-full hover:bg-green-700"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {comment.replies && comment.replies.map((reply, index) => (
          <CommentComponent key={index} comment={reply} isReply={true} commentId={`${uniqueId}-reply-${index}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="text-white max-w-[770px] mt-20 relative">
      {/* Image with author overlay */}
      <div className="relative w-full">
        {author && authorImage && (
          <div className="absolute top-0 left-0 bg-[#141414] flex items-center gap-2 pr-3 rounded-br-xl z-10">
            <Image
              src={authorImage}
              alt={author}
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="text-sm font-semibold text-white">{author}</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="bg-[#FFF6C9] text-[#141414] py-4 px-4 relative">
        <div className="flex justify-between items-center mt-8">
          <h3 className="font-extrabold text-[20px] sm:text-[24px] leading-[146%] tracking-[0%] mr-2">
            {title}
          </h3>
          {timeToRead && (
            <span className="flex items-center text-sm text-nowrap bg-[#FFDE7A] p-3 rounded-lg font-bold">
              <Clock5 size={16} className="mr-1" />
              {timeToRead}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
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
        
        {storyContent && (
          <div
            className="mt-4 mb-5 space-y-4 pb-10
      [&_h1]:text-[28px] [&_h1]:leading-[36px] [&_h1]:font-extrabold [&_h1]:mb-2
      [&_h2]:text-[22px] [&_h2]:leading-[30px] [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2
      [&_p]:text-[16px] [&_p]:leading-[24px] [&_p]:text-[#141414] [&_p]:mb-2
      [&_em]:italic [&_em]:text-gray-700 [&_em]:border-l-4 [&_em]:border-[#141414] [&_em]:pl-4 [&_em]:block [&_em]:py-2
      [&_strong]:font-semibold
      [&_img]:rounded-xl [&_img]:max-w-full [&_img]:h-auto [&_img]:mx-auto [&_img]:my-4
      [&_video]:rounded-lg [&_video]:w-full [&_video]:h-auto [&_video]:my-4
      [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:rounded-lg [&_iframe]:my-4"
            dangerouslySetInnerHTML={{ __html: storyContent }}
          />
        )}
        
        {/* Comments Section */}
        <div className="mt-8 mb-16">
          {/* Add Comment Input */}
          <div className="flex gap-3 mb-8">
            <Image
              src="/api/placeholder/40/40"
              alt="Your avatar"
              width={40}
              height={40}
              className="rounded-full flex-shrink-0"
            />
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Add comment..."
                className="w-full bg-[#E8DCA6] text-[#141414] px-4 py-3 rounded-full border-none outline-none placeholder:text-gray-600"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-green-600 text-white p-2 rounded-full hover:bg-green-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 11L12 6L17 11M12 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <CommentComponent key={index} comment={comment} commentId={`comment-${index}`} />
            ))}
          </div>
        </div>
        
        {/* Wave SVG at the bottom -desktop */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden sm:h-[100px] hidden sm:block">
          <svg 
            width="100%" 
            height={100}
            viewBox="0 0 1000 100" 
            xmlns="http://www.w3.org/2000/svg" 
            preserveAspectRatio="none" 
            className="block"
          >
            <defs>
              <path id="wavepath" d="M 0 100 0 70 Q 42.5 25 85 70 t 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 v70 z" />
            </defs>
            <g>
              <use xlinkHref="#wavepath" fill="#141414" />
            </g>
          </svg>
        </div>
         {/* Wave SVG at the bottom -mobile */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden sm:h-[100px] block sm:hidden">
          <svg 
            width="100%" 
            height={50}
            viewBox="0 0 1000 100" 
            xmlns="http://www.w3.org/2000/svg" 
            preserveAspectRatio="none" 
            className="block"
          >
            <defs>
              <path id="wavepath" d="M 0 100 0 70 Q 42.5 25 85 70 t 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 85 0 v70 z" />
            </defs>
            <g>
              <use xlinkHref="#wavepath" fill="#141414" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}