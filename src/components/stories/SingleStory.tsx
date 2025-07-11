"use client";

import Image from "next/image";
import { Clock5, ArrowUpCircle } from "lucide-react";
import { useState, createContext, useContext } from "react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

type CommentProps = {
  userImage: string;
  userName: string;
  comment: string;
  createdAt: string;
  replies?: CommentProps[];
};

interface SingleStoryProps {
  title: string;
  timeToRead?: string;
  price?: number;
  change?: number;
  author?: string;
  authorImage?: string;
  storyContent?: string;
  comments: CommentProps[];
  onNewComment: (text: string) => void;
  onReplySubmit: (commentId: string, text: string) => void;
}

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export function SingleStory({
  title,
  timeToRead,
  price,
  change,
  author,
  authorImage,
  storyContent,
  comments,
  onNewComment,
  onReplySubmit,
}: SingleStoryProps) {
  const { theme } = useContext(ThemeContext);

  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "text-green-700" : "text-red-700";
  const changeSymbol = isPositive ? "+" : "";

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [newComment, setNewComment] = useState("");

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText("");
  };

  const bgColor = theme === "dark" ? "bg-[#141414]" : "bg-[#FFEEBA]";
  const textColor = theme === "dark" ? "text-white" : "text-[#141414]";
  const bubbleColor = theme === "dark" ? "bg-[#E8DCA6]" : "bg-[#E8DCA6]";
  const metaTextColor = theme === "dark" ? "text-gray-300" : "text-gray-600";
  const borderColor =
    theme === "dark" ? "border-[#141414]" : "border-[#E8DCA6]";

  const CommentComponent = ({
    comment,
    isReply = false,
    commentId,
  }: {
    comment: CommentProps;
    isReply?: boolean;
    commentId: string;
  }) => (
    <div className={`${isReply ? "ml-12 mt-4" : "mb-6"}`}>
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
            <span className={`font-semibold ${textColor}`}>
              {comment.userName}
            </span>
          </div>
          <p className={`text-sm mb-3 leading-relaxed ${textColor}`}>
            {comment.comment}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <button className="text-green-600 font-medium hover:text-green-700">
              Like
            </button>
            <span className="text-gray-400">•</span>
            <button
              onClick={() => handleReply(commentId)}
              className="text-green-600 font-medium hover:text-green-700"
            >
              Reply
            </button>
            <span className="text-gray-400">•</span>
            <span className={metaTextColor}>{comment.createdAt}</span>
          </div>
        </div>
      </div>

      {replyingTo === commentId && (
        <div className="flex gap-3 mt-4 ml-12">
          <Image
            src="/lady_image.svg"
            alt="Your avatar"
            width={32}
            height={32}
            className="rounded-full flex-shrink-0"
          />
          <div className="flex-1">
            <div
              className={`flex items-center ${bubbleColor} rounded-full px-4 py-2 w-full`}
            >
              <input
                type="text"
                placeholder={`Reply to ${comment.userName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={`flex-1 bg-transparent text-sm focus:outline-none ${textColor}`}
                autoFocus
              />
              <button
                onClick={() => {
                  if (replyText.trim()) {
                    onReplySubmit(commentId, replyText.trim());
                    setReplyingTo(null);
                    setReplyText("");
                  }
                }}
                className="text-green-700 hover:text-green-800 ml-2"
              >
                <ArrowUpCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {comment.replies?.map((reply, i) => (
        <CommentComponent
          key={i}
          comment={reply}
          isReply={true}
          commentId={`${commentId}-reply-${i}`}
        />
      ))}
    </div>
  );

  return (
    <div className={`max-w-[770px] mt-20 relative ${bgColor} ${textColor}`}>
      {/* Author Info */}
      <div className="relative w-full">
        {author && authorImage && (
          <div
            className={`absolute top-0 left-0 bg-[#141414] flex items-center gap-2 pr-3 rounded-br-xl z-10`}
          >
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
      <div className="py-4 px-4 relative">
        <div className="flex justify-between items-center mt-8">
          <div className="bg-[#FFEEBA] rounded-2xl px-1 mr-2">
            <h3 className="text-[#141414] font-extrabold text-[20px] sm:text-[24px] leading-[146%] tracking-[0%] mr-2">
              {title}
            </h3>
            <div className="flex items-center gap-2">
              {price !== undefined && (
                <span className={`font-bold text-lg ${changeColor}`}>
                  {price}
                </span>
              )}
              {price !== undefined && change !== undefined && (
                <>
                  <span className="text-2xl font-bold text-[#141414]">·</span>
                  <span className={`text-sm font-medium ${changeColor}`}>
                    {changeSymbol}
                    {change}%
                  </span>
                </>
              )}
            </div>
          </div>
          {timeToRead && (
            <span className="text-[#141414] flex items-center text-sm text-nowrap bg-[#FFDE7A] p-3 rounded-lg font-bold">
              <Clock5 size={16} className="mr-1" />
              {timeToRead}
            </span>
          )}
        </div>

        {/* HTML Story Content */}
        {storyContent && (
          <div className="mt-4 mb-5 space-y-4 pb-10">
            <ReactMarkdown 
              rehypePlugins={[rehypeRaw, remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold my-6" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold my-5" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-bold my-4" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-lg font-bold my-3" {...props} />,
                p: ({node, ...props}) => <p className="text-base leading-relaxed my-3" {...props} />,
                img: ({node, ...props}) => (
                  <div className="my-6">
                    <img 
                      {...props} 
                      className="rounded-lg max-w-full h-auto mx-auto" 
                      alt={props.alt || 'Story image'}
                    />
                    {props.title && (
                      <p className="text-center text-sm text-gray-400 mt-2">{props.title}</p>
                    )}
                  </div>
                ),
                video: ({node, ...props}) => (
                  <div className="my-6">
                    <video 
                      {...props} 
                      className="rounded-lg w-full" 
                      controls 
                    />
                    {props.title && (
                      <p className="text-center text-sm text-gray-400 mt-2">{props.title}</p>
                    )}
                  </div>
                ),
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-[#00A3FF] pl-4 py-2 my-4 italic bg-[#1A1A1A]/50" {...props} />
                ),
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="pl-2" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                a: ({node, ...props}) => (
                  <a 
                    {...props} 
                    className="text-[#00A3FF] hover:underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  />
                ),
                code: ({node, ...props}) => (
                  <code className="bg-[#1A1A1A] px-2 py-1 rounded text-sm font-mono" {...props} />
                ),
                pre: ({node, ...props}) => (
                  <pre className="bg-[#1A1A1A] p-4 rounded-lg overflow-x-auto my-4" {...props} />
                ),
              }}
            >
              {storyContent}
            </ReactMarkdown>
          </div>
        )}

        {/* Add Comment */}
        <div className="mt-8 mb-6 pb-6">
          <div className="flex gap-3 mb-6">
            <Image
              src="/lady_image.svg"
              alt="Your avatar"
              width={40}
              height={40}
              className="rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <div
                className={`flex items-center ${bubbleColor} rounded-full px-4 py-2 w-full`}
              >
                <input
                  type="text"
                  placeholder="Add comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className={`flex-1 bg-transparent text-sm focus:outline-none ${textColor}`}
                />
                <button
                  onClick={() => {
                    if (newComment.trim()) {
                      onNewComment(newComment.trim());
                      setNewComment("");
                    }
                  }}
                  className="text-green-700 hover:text-green-800 ml-2"
                >
                  <ArrowUpCircle size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          {comments.map((comment, index) => (
            <CommentComponent
              key={index}
              comment={comment}
              commentId={`comment-${index}`}
            />
          ))}
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