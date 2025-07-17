// src/components/stories/SingleStory.tsx
"use client";

import Image from "next/image";
import { Clock5, ArrowUpCircle, Heart, MoreHorizontal, Edit2, Trash2, Reply } from "lucide-react";
import { useState, createContext, useContext } from "react";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { useComments, Comment } from '@/hooks/useComments';
import { useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'sonner';

import RenderEditorOutput from "@/components/stories/RenderEditorOutput";
import { OutputData } from "@editorjs/editorjs";

interface SingleStoryProps {
  storyId: number;
  title: string;
  timeToRead?: string;
  price?: number;
  change?: number;
  author?: string;
  authorImage?: string;
  storyContent?: string;
}

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

// Individual Comment Component
const CommentComponent = ({
  comment,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  onLike,
  currentUserAddress,
}: {
  comment: Comment;
  isReply?: boolean;
  onReply: (commentId: number) => void;
  onEdit: (commentId: number, content: string) => void;
  onDelete: (commentId: number) => void;
  onLike: (commentId: number) => void;
  currentUserAddress?: string;
}) => {
  const { theme } = useContext(ThemeContext);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const textColor = theme === "dark" ? "text-white" : "text-[#141414]";
  const metaTextColor = theme === "dark" ? "text-gray-300" : "text-gray-600";

  const isOwner = currentUserAddress === comment.user.wallet_address;
  const canEdit = isOwner && isWithin24Hours(comment.created_at);

  function isWithin24Hours(dateString: string): boolean {
    const commentDate = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - commentDate.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  }

  function formatTimeAgo(dateString: string): string {
    const commentDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  }

  const handleSaveEdit = () => {
    if (editContent.trim() !== comment.content) {
      onEdit(comment.comment_id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className={`${isReply ? "ml-12 mt-4" : "mb-6"}`}>
      <div className="flex gap-3">
        {/* Fixed Avatar Container */}
        <div className="relative w-10 h-10 flex-shrink-0">
          <Image
            src={comment.user.avatar_url ? `https://ipfs.erebrus.io/ipfs/${comment.user.avatar_url}` : "/pfp.jpeg"}
            alt={comment.user.username}
            fill
            className="rounded-full object-cover"
            sizes="40px"
          />
        </div>
        
        <div className="flex-1 min-w-0"> {/* Added min-w-0 for text overflow handling */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold ${textColor} truncate`}>
              {comment.user.username}
            </span>
            <span className={`text-xs ${metaTextColor} flex-shrink-0`}>
              {formatTimeAgo(comment.created_at)}
            </span>
            {/* Options menu for comment owner */}
            {isOwner && (
              <div className="relative ml-auto flex-shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-1 hover:bg-gray-200 rounded ${metaTextColor}`}
                >
                  <MoreHorizontal size={16} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 w-full text-left"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDelete(comment.comment_id);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 w-full text-left text-red-600"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment content */}
          {isEditing ? (
            <div className="mb-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                maxLength={2000}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  disabled={editContent.trim().length === 0}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className={`text-sm mb-3 leading-relaxed ${textColor} break-words`}>
              {comment.content}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => onLike(comment.comment_id)}
              className={`flex items-center gap-1 hover:text-red-500 transition-colors ${
                comment.user_liked ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              <Heart 
                size={16} 
                fill={comment.user_liked ? 'currentColor' : 'none'}
              />
              <span>{comment.like_count}</span>
            </button>
            <span className="text-gray-400">•</span>
            <button
              onClick={() => onReply(comment.comment_id)}
              className="text-green-600 font-medium hover:text-green-700 flex items-center gap-1"
            >
              <Reply size={14} />
              Reply
            </button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.map((reply) => (
        <CommentComponent
          key={reply.comment_id}
          comment={reply}
          isReply={true}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onLike={onLike}
          currentUserAddress={currentUserAddress}
        />
      ))}
    </div>
  );
};

// Reply Form Component
const ReplyForm = ({
  parentCommentId,
  onSubmit,
  onCancel,
  parentAuthor,
}: {
  parentCommentId: number;
  onSubmit: (content: string) => void;
  onCancel: () => void;
  parentAuthor: string;
}) => {
  const { theme } = useContext(ThemeContext);
  const { address } = useAppKitAccount();
  const [replyText, setReplyText] = useState("");
  const bubbleColor = theme === "dark" ? "bg-[#E8DCA6]" : "bg-[#E8DCA6]";
  const textColor = theme === "dark" ? "text-white" : "text-[#141414]";

  const handleSubmit = () => {
    if (replyText.trim()) {
      onSubmit(replyText.trim());
      setReplyText("");
    }
  };

  // Get current user's avatar (you might want to fetch this from your user data)
  const currentUserAvatar = "/pfp.jpeg"; // Default fallback

  return (
    <div className="flex gap-3 mt-4 ml-12">
      {/* Fixed Avatar for Reply Form */}
      <div className="relative w-8 h-8 flex-shrink-0">
        <Image
          src={currentUserAvatar}
          alt="Your avatar"
          fill
          className="rounded-full object-cover"
          sizes="32px"
        />
      </div>
      
      <div className="flex-1">
        <div className={`flex items-center ${bubbleColor} rounded-lg px-4 py-2 w-full`}>
          <input
            type="text"
            placeholder={`Reply to ${parentAuthor}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className={`flex-1 bg-transparent text-sm focus:outline-none ${textColor}`}
            maxLength={2000}
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex gap-2 ml-2">
            <button
              onClick={handleSubmit}
              disabled={!replyText.trim()}
              className="text-green-700 hover:text-green-800 disabled:text-gray-400"
            >
              <ArrowUpCircle size={20} />
            </button>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function SingleStory({
  storyId,
  title,
  timeToRead,
  price,
  change,
  author,
  authorImage,
  storyContent,
}: SingleStoryProps) {
  const { theme } = useContext(ThemeContext);
  const { address } = useAppKitAccount();
  
  // Use the comments hook
  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    pagination,
    createComment,
    toggleLike,
    editComment,
    deleteComment,
    loadMore,
    refresh,
    canComment,
    hasComments,
  } = useComments({ storyId });

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? "text-green-700" : "text-red-700";
  const changeSymbol = isPositive ? "+" : "";

  const bgColor = theme === "dark" ? "bg-[#141414]" : "bg-[#FFEEBA]";
  const textColor = theme === "dark" ? "text-white" : "text-[#141414]";
  const bubbleColor = theme === "dark" ? "bg-[#E8DCA6]" : "bg-[#E8DCA6]";
  const metaTextColor = theme === "dark" ? "text-gray-300" : "text-gray-600";

  const handleNewComment = async () => {
    if (!newComment.trim()) return;
    
    const success = await createComment({ content: newComment.trim() });
    if (success) {
      setNewComment("");
    }
  };

  const handleReply = async (parentCommentId: number, content: string) => {
    const success = await createComment({ 
      content, 
      parent_comment_id: parentCommentId 
    });
    if (success) {
      setReplyingTo(null);
    }
  };

  const handleReplyClick = (commentId: number) => {
    if (!canComment) {
      toast.error('Please connect your wallet to reply');
      return;
    }
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const handleEdit = async (commentId: number, content: string) => {
    await editComment(commentId, content);
  };

  const handleDelete = async (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId);
    }
  };

  const handleLike = async (commentId: number) => {
    if (!canComment) {
      toast.error('Please connect your wallet to like comments');
      return;
    }
    await toggleLike(commentId);
  };

  // Get current user's avatar (you might want to fetch this from your user context)
  const currentUserAvatar = "/pfp.jpeg"; // Default fallback

  return (
    <div className={`max-w-[770px] mt-20 relative ${bgColor} ${textColor}`}>
      {/* Author Info */}
      <div className="relative w-full">
        {author && authorImage && (
          <div className="absolute top-0 left-0 bg-[#141414] flex items-center gap-2 pr-3 rounded-br-xl z-10">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={authorImage}
                alt={author}
                fill
                className="rounded-full object-cover"
                sizes="48px"
              />
            </div>
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

        {/* Story Content */}
        {storyContent && (
  <div className="mt-4 mb-5 space-y-4 pb-10">
    <RenderEditorOutput data={JSON.parse(storyContent) as OutputData} />
  </div>
)}


        {/* Comments Section */}
        <div className="mt-8 mb-6 pb-6">
          {/* Add Comment */}
          <div className="flex gap-3 mb-6">
            {/* Fixed Avatar for Comment Input */}
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src={currentUserAvatar}
                alt="Your avatar"
                fill
                className="rounded-full object-cover"
                sizes="40px"
              />
            </div>
            
            <div className="flex-1">
              <div className={`flex items-center ${bubbleColor} rounded-full px-4 py-2 w-full`}>
                <input
                  type="text"
                  placeholder={canComment ? "Add comment..." : "Connect wallet to comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className={`flex-1 bg-transparent text-sm focus:outline-none ${textColor}`}
                  disabled={!canComment}
                  maxLength={2000}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleNewComment();
                    }
                  }}
                />
                <button
                  onClick={handleNewComment}
                  disabled={!canComment || !newComment.trim()}
                  className="text-green-700 hover:text-green-800 ml-2 disabled:text-gray-400"
                >
                  <ArrowUpCircle size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Comments Loading */}
          {commentsLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          )}

          {/* Comments Error */}
          {commentsError && (
            <div className="text-center py-4">
              <p className="text-red-500 mb-2">Failed to load comments</p>
              <button
                onClick={refresh}
                className="text-blue-500 hover:underline text-sm"
              >
                Try again
              </button>
            </div>
          )}

          {/* Comments List */}
          {hasComments && (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.comment_id}>
                  <CommentComponent
                    comment={comment}
                    onReply={handleReplyClick}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onLike={handleLike}
                    currentUserAddress={address}
                  />
                  
                  {/* Reply Form */}
                  {replyingTo === comment.comment_id && (
                    <ReplyForm
                      parentCommentId={comment.comment_id}
                      parentAuthor={comment.user.username}
                      onSubmit={(content) => handleReply(comment.comment_id, content)}
                      onCancel={() => setReplyingTo(null)}
                    />
                  )}
                </div>
              ))}

              {/* Load More Button */}
              {pagination.has_more && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={commentsLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {commentsLoading ? 'Loading...' : 'Load More Comments'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No Comments */}
          {!hasComments && !commentsLoading && !commentsError && (
            <div className="text-center py-8">
              <p className={`${metaTextColor} mb-2`}>No comments yet</p>
              <p className={`${metaTextColor} text-sm`}>
                {canComment ? 'Be the first to comment!' : 'Connect your wallet to join the conversation'}
              </p>
            </div>
          )}
        </div>

        {/* Wave SVG at the bottom */}
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
        
        {/* Wave SVG at the bottom - mobile */}
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