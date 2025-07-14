// src/app/api/comments/like/route.ts
// API for liking and unliking comments

import { NextRequest, NextResponse } from 'next/server';

interface LikeCommentRequest {
  comment_id: number;
  wallet_address: string;
}

interface LikeResponse {
  success: boolean;
  message: string;
  data: {
    comment_id: number;
    like_count: number;
    user_liked: boolean;
  };
}

// POST /api/comments/like - Like or unlike a comment
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

    const body: LikeCommentRequest = await request.json();
    const { comment_id, wallet_address } = body;

    // Validate required fields
    if (!comment_id || !wallet_address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'comment_id and wallet_address are required'
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

    // Verify comment exists
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('comment_id, like_count')
      .eq('comment_id', comment_id)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Comment not found',
          message: 'Comment does not exist'
        },
        { status: 404 }
      );
    }

    // Check if user has already liked this comment
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('comments_like')
      .select('like_id')
      .eq('comment_id', comment_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (likeCheckError) {
      console.error('Error checking existing like:', likeCheckError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to check like status'
        },
        { status: 500 }
      );
    }

    let newLikeCount: number;
    let userLiked: boolean;
    let message: string;

    if (existingLike) {
      // User has already liked, so unlike (remove like)
      const { error: deleteLikeError } = await supabase
        .from('comments_like')
        .delete()
        .eq('like_id', existingLike.like_id);

      if (deleteLikeError) {
        console.error('Error removing like:', deleteLikeError);
        return NextResponse.json(
          {
            success: false,
            error: 'Database error',
            message: 'Failed to remove like'
          },
          { status: 500 }
        );
      }

      // Decrease like count
      newLikeCount = Math.max(0, comment.like_count - 1);
      userLiked = false;
      message = 'Comment unliked successfully';
    } else {
      // User hasn't liked, so add like
      const { error: addLikeError } = await supabase
        .from('comments_like')
        .insert({
          comment_id: comment_id,
          user_id: user.id
        });

      if (addLikeError) {
        console.error('Error adding like:', addLikeError);
        return NextResponse.json(
          {
            success: false,
            error: 'Database error',
            message: 'Failed to add like'
          },
          { status: 500 }
        );
      }

      // Increase like count
      newLikeCount = comment.like_count + 1;
      userLiked = true;
      message = 'Comment liked successfully';
    }

    // Update the comment's like count
    const { error: updateError } = await supabase
      .from('comments')
      .update({ like_count: newLikeCount })
      .eq('comment_id', comment_id);

    if (updateError) {
      console.error('Error updating comment like count:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to update like count'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message,
        data: {
          comment_id,
          like_count: newLikeCount,
          user_liked: userLiked
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in comment like:', error);
    
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
        message: 'An unexpected error occurred while processing like'
      },
      { status: 500 }
    );
  }
}

// GET /api/comments/like - Check if user has liked specific comments
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const commentIds = searchParams.get('comment_ids')?.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    const walletAddress = searchParams.get('wallet_address');

    if (!commentIds || commentIds.length === 0 || !walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing parameters',
          message: 'comment_ids and wallet_address are required'
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('wallet_address', walletAddress.trim())
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

    // Get user's likes for the specified comments
    const { data: userLikes, error: likesError } = await supabase
      .from('comments_like')
      .select('comment_id')
      .eq('user_id', user.id)
      .in('comment_id', commentIds);

    if (likesError) {
      console.error('Error fetching user likes:', likesError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to fetch like status'
        },
        { status: 500 }
      );
    }

    // Create a map of comment_id -> user_liked
    const likedComments = new Set(userLikes?.map(like => like.comment_id) || []);
    const likeStatus = commentIds.reduce((acc, commentId) => {
      acc[commentId] = likedComments.has(commentId);
      return acc;
    }, {} as Record<number, boolean>);

    return NextResponse.json(
      {
        success: true,
        data: {
          like_status: likeStatus
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error checking likes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while checking likes'
      },
      { status: 500 }
    );
  }
}