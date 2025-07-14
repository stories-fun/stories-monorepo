// src/hooks/useComments.ts
// React hook for managing comments functionality

import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'sonner';

export interface Comment {
  comment_id: number;
  user_id: number;
  story_id: number;
  parent_comment_id: number | null;
  content: string;
  like_count: number;
  created_at: string;
  user: {
    id: number;
    username: string;
    avatar_url?: string;
    wallet_address: string;
  };
  replies?: Comment[];
  user_liked?: boolean; // Added for tracking user's like status
}

export interface CommentsState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface UseCommentsProps {
  storyId: number;
  initialLimit?: number;
}

export interface CreateCommentData {
  content: string;
  parent_comment_id?: number;
}

export const useComments = ({ storyId, initialLimit = 20 }: UseCommentsProps) => {
  const { address, isConnected } = useAppKitAccount();
  const [state, setState] = useState<CommentsState>({
    comments: [],
    loading: true,
    error: null,
    pagination: {
      total: 0,
      limit: initialLimit,
      offset: 0,
      has_more: false,
    },
  });

  const [userLikes, setUserLikes] = useState<Record<number, boolean>>({});

  // Fetch comments for the story
  const fetchComments = useCallback(async (offset = 0) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const params = new URLSearchParams({
        story_id: storyId.toString(),
        limit: state.pagination.limit.toString(),
        offset: offset.toString(),
        sort_order: 'desc' // newest first
      });

      const response = await fetch(`/api/comments?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch comments');
      }

      if (result.success) {
        const comments = result.data.comments;
        
        // Collect all comment IDs (including replies) for like status check
        const allCommentIds: number[] = [];
        comments.forEach((comment: Comment) => {
          allCommentIds.push(comment.comment_id);
          if (comment.replies) {
            comment.replies.forEach(reply => allCommentIds.push(reply.comment_id));
          }
        });

        // Fetch like status if user is connected
        if (isConnected && address && allCommentIds.length > 0) {
          await fetchLikeStatus(allCommentIds);
        }

        setState(prev => ({
          ...prev,
          comments: offset === 0 ? comments : [...prev.comments, ...comments],
          pagination: result.data.pagination,
          loading: false,
        }));
      } else {
        throw new Error(result.message || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch comments',
        loading: false,
      }));
      toast.error('Failed to load comments');
    }
  }, [storyId, state.pagination.limit, isConnected, address]);

  // Fetch user's like status for comments
  const fetchLikeStatus = useCallback(async (commentIds: number[]) => {
    if (!isConnected || !address) return;

    try {
      const params = new URLSearchParams({
        comment_ids: commentIds.join(','),
        wallet_address: address,
      });

      const response = await fetch(`/api/comments/like?${params}`);
      const result = await response.json();

      if (result.success) {
        setUserLikes(prev => ({ ...prev, ...result.data.like_status }));
      }
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  }, [isConnected, address]);

  // Create a new comment
  const createComment = useCallback(async (data: CreateCommentData) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to comment');
      return false;
    }

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story_id: storyId,
          content: data.content,
          parent_comment_id: data.parent_comment_id,
          wallet_address: address,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create comment');
      }

      if (result.success) {
        const newComment = result.data.comment;
        
        setState(prev => {
          if (data.parent_comment_id) {
            // It's a reply - add to the parent comment's replies
            const updatedComments = prev.comments.map(comment => {
              if (comment.comment_id === data.parent_comment_id) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment]
                };
              }
              return comment;
            });
            return {
              ...prev,
              comments: updatedComments,
            };
          } else {
            // It's a top-level comment - add to the beginning
            return {
              ...prev,
              comments: [newComment, ...prev.comments],
              pagination: {
                ...prev.pagination,
                total: prev.pagination.total + 1
              }
            };
          }
        });

        toast.success(data.parent_comment_id ? 'Reply posted successfully' : 'Comment posted successfully');
        return true;
      } else {
        throw new Error(result.message || 'Failed to create comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post comment');
      return false;
    }
  }, [storyId, isConnected, address]);

  // Like or unlike a comment
  const toggleLike = useCallback(async (commentId: number) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to like comments');
      return false;
    }

    try {
      const response = await fetch('/api/comments/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
          wallet_address: address,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update like');
      }

      if (result.success) {
        const { like_count, user_liked } = result.data;

        // Update like status
        setUserLikes(prev => ({ ...prev, [commentId]: user_liked }));

        // Update like count in comments state
        setState(prev => ({
          ...prev,
          comments: prev.comments.map(comment => {
            if (comment.comment_id === commentId) {
              return { ...comment, like_count };
            }
            
            // Check replies as well
            if (comment.replies) {
              const updatedReplies = comment.replies.map(reply =>
                reply.comment_id === commentId 
                  ? { ...reply, like_count }
                  : reply
              );
              return { ...comment, replies: updatedReplies };
            }
            
            return comment;
          })
        }));

        return true;
      } else {
        throw new Error(result.message || 'Failed to update like');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update like');
      return false;
    }
  }, [isConnected, address]);

  // Edit a comment
  const editComment = useCallback(async (commentId: number, content: string) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to edit comments');
      return false;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          wallet_address: address,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to edit comment');
      }

      if (result.success) {
        const updatedComment = result.data.comment;

        setState(prev => ({
          ...prev,
          comments: prev.comments.map(comment => {
            if (comment.comment_id === commentId) {
              return { ...comment, content: updatedComment.content };
            }
            
            // Check replies as well
            if (comment.replies) {
              const updatedReplies = comment.replies.map(reply =>
                reply.comment_id === commentId 
                  ? { ...reply, content: updatedComment.content }
                  : reply
              );
              return { ...comment, replies: updatedReplies };
            }
            
            return comment;
          })
        }));

        toast.success('Comment updated successfully');
        return true;
      } else {
        throw new Error(result.message || 'Failed to edit comment');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to edit comment');
      return false;
    }
  }, [isConnected, address]);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: number, isAdmin = false) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet to delete comments');
      return false;
    }

    try {
      const params = new URLSearchParams({
        wallet_address: address,
      });

      if (isAdmin) {
        params.append('admin', 'true');
      }

      const response = await fetch(`/api/comments/${commentId}?${params}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete comment');
      }

      if (result.success) {
        setState(prev => ({
          ...prev,
          comments: prev.comments.map(comment => {
            if (comment.comment_id === commentId) {
              // Check if it was soft-deleted (content replaced)
              if (result.message.includes('content removed')) {
                return { ...comment, content: '[This comment has been deleted]' };
              }
              return null; // Will be filtered out
            }
            
            // Handle replies
            if (comment.replies) {
              const updatedReplies = comment.replies.filter(reply => reply.comment_id !== commentId);
              return { ...comment, replies: updatedReplies };
            }
            
            return comment;
          }).filter(Boolean) as Comment[],
          pagination: {
            ...prev.pagination,
            total: Math.max(0, prev.pagination.total - 1)
          }
        }));

        toast.success('Comment deleted successfully');
        return true;
      } else {
        throw new Error(result.message || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete comment');
      return false;
    }
  }, [isConnected, address]);

  // Load more comments (pagination)
  const loadMore = useCallback(() => {
    if (!state.loading && state.pagination.has_more) {
      fetchComments(state.pagination.offset + state.pagination.limit);
    }
  }, [fetchComments, state.loading, state.pagination]);

  // Refresh comments
  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, pagination: { ...prev.pagination, offset: 0 } }));
    fetchComments(0);
  }, [fetchComments]);

  // Initial load
  useEffect(() => {
    fetchComments(0);
  }, [fetchComments]);

  // Combine comments with like status
  const commentsWithLikes = state.comments.map(comment => ({
    ...comment,
    user_liked: userLikes[comment.comment_id] || false,
    replies: comment.replies?.map(reply => ({
      ...reply,
      user_liked: userLikes[reply.comment_id] || false,
    }))
  }));

  return {
    // State
    comments: commentsWithLikes,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    
    // Actions
    createComment,
    toggleLike,
    editComment,
    deleteComment,
    loadMore,
    refresh,
    
    // Computed
    canComment: isConnected && !!address,
    hasComments: state.comments.length > 0,
  };
};