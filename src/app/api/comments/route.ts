// src/app/api/comments/route.ts
// Main comments API for fetching and creating comments

import { NextRequest, NextResponse } from 'next/server';

interface Comment {
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
}

interface CreateCommentRequest {
  story_id: number;
  content: string;
  parent_comment_id?: number;
  wallet_address: string;
}

interface CommentsResponse {
  success: boolean;
  data: {
    comments: Comment[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
  };
  message?: string;
}

// GET /api/comments - Fetch comments for a story
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
          message: 'Supabase environment variables are not configured'
        },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('story_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortOrder = searchParams.get('sort_order') || 'desc'; // desc = newest first

    // Validate required parameters
    if (!storyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing story_id',
          message: 'story_id parameter is required'
        },
        { status: 400 }
      );
    }

    const storyIdNum = parseInt(storyId);
    if (isNaN(storyIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid story_id',
          message: 'story_id must be a valid number'
        },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid limit',
          message: 'Limit cannot exceed 100 comments per request'
        },
        { status: 400 }
      );
    }

    // First, verify the story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, title, status')
      .eq('id', storyIdNum)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not found',
          message: `No story found with ID: ${storyIdNum}`
        },
        { status: 404 }
      );
    }

    // Fetch top-level comments (no parent) with user information
    const { data: topLevelComments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        comment_id,
        user_id,
        story_id,
        parent_comment_id,
        content,
        like_count,
        created_at,
        user:user_id (
          id,
          username,
          avatar_url,
          wallet_address
        )
      `)
      .eq('story_id', storyIdNum)
      .is('parent_comment_id', null) // Only top-level comments
      .order('created_at', { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (commentsError) {
      console.error('Database error fetching comments:', commentsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to fetch comments'
        },
        { status: 500 }
      );
    }

    // Get total count of top-level comments for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', storyIdNum)
      .is('parent_comment_id', null);

    if (countError) {
      console.error('Database error getting comment count:', countError);
    }

    // Fetch replies for each top-level comment
    const commentsWithReplies: Comment[] = [];

    for (const comment of topLevelComments || []) {
      // Fetch replies for this comment
      const { data: replies, error: repliesError } = await supabase
        .from('comments')
        .select(`
          comment_id,
          user_id,
          story_id,
          parent_comment_id,
          content,
          like_count,
          created_at,
          user:user_id (
            id,
            username,
            avatar_url,
            wallet_address
          )
        `)
        .eq('parent_comment_id', comment.comment_id)
        .order('created_at', { ascending: true }); // Replies in chronological order

      const commentWithReplies: Comment = {
        comment_id: comment.comment_id,
        user_id: comment.user_id,
        story_id: comment.story_id,
        parent_comment_id: comment.parent_comment_id,
        content: comment.content,
        like_count: comment.like_count,
        created_at: comment.created_at,
        user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
        replies: replies?.map(reply => ({
          comment_id: reply.comment_id,
          user_id: reply.user_id,
          story_id: reply.story_id,
          parent_comment_id: reply.parent_comment_id,
          content: reply.content,
          like_count: reply.like_count,
          created_at: reply.created_at,
          user: Array.isArray(reply.user) ? reply.user[0] : reply.user
        })) || []
      };

      commentsWithReplies.push(commentWithReplies);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          comments: commentsWithReplies,
          pagination: {
            total: totalCount || 0,
            limit,
            offset,
            has_more: (totalCount || 0) > offset + limit
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in comments fetch:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching comments'
      },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error'
        },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body: CreateCommentRequest = await request.json();
    const { story_id, content, parent_comment_id, wallet_address } = body;

    // Validate required fields
    if (!story_id || !content || !wallet_address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'story_id, content, and wallet_address are required'
        },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid content',
          message: 'Comment content cannot be empty'
        },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content too long',
          message: 'Comment must be 2000 characters or less'
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id, username')
      .eq('wallet_address', wallet_address.trim())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          message: 'No user found with the provided wallet address'
        },
        { status: 404 }
      );
    }

    // Verify story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, status')
      .eq('id', story_id)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not found',
          message: 'Story does not exist'
        },
        { status: 404 }
      );
    }

    // Verify story is published (users can only comment on published stories)
    if (story.status !== 'published') {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not available',
          message: 'Comments are only allowed on published stories'
        },
        { status: 400 }
      );
    }

    // If parent_comment_id is provided, verify the parent comment exists and belongs to the same story
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('comments')
        .select('comment_id, story_id')
        .eq('comment_id', parent_comment_id)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json(
          {
            success: false,
            error: 'Parent comment not found',
            message: 'The comment you are replying to does not exist'
          },
          { status: 404 }
        );
      }

      if (parentComment.story_id !== story_id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid parent comment',
            message: 'Parent comment does not belong to this story'
          },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const { data: newComment, error: commentError } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        story_id: story_id,
        parent_comment_id: parent_comment_id || null,
        content: content.trim(),
        like_count: 0
      })
      .select(`
        comment_id,
        user_id,
        story_id,
        parent_comment_id,
        content,
        like_count,
        created_at,
        user:user_id (
          id,
          username,
          avatar_url,
          wallet_address
        )
      `)
      .single();

    if (commentError) {
      console.error('Database error creating comment:', commentError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to create comment'
        },
        { status: 500 }
      );
    }

    // Transform the response to match our interface
    const responseComment: Comment = {
      comment_id: newComment.comment_id,
      user_id: newComment.user_id,
      story_id: newComment.story_id,
      parent_comment_id: newComment.parent_comment_id,
      content: newComment.content,
      like_count: newComment.like_count,
      created_at: newComment.created_at,
      user: Array.isArray(newComment.user) ? newComment.user[0] : newComment.user,
      replies: []
    };

    return NextResponse.json(
      {
        success: true,
        message: parent_comment_id ? 'Reply posted successfully' : 'Comment posted successfully',
        data: {
          comment: responseComment
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error creating comment:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while creating the comment'
      },
      { status: 500 }
    );
  }
}