// src/app/api/comments/[id]/route.ts
// API for managing individual comments (edit, delete, get)

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateCommentRequest {
  content: string;
  wallet_address: string;
}

// GET /api/comments/[id] - Get a specific comment
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid comment ID',
          message: 'Comment ID must be a valid number'
        },
        { status: 400 }
      );
    }

    // Fetch the comment with user information
    const { data: comment, error: commentError } = await supabase
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
      .eq('comment_id', commentId)
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

    // Fetch replies if this is a top-level comment
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
      .eq('parent_comment_id', commentId)
      .order('created_at', { ascending: true });

    const responseComment = {
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

    return NextResponse.json(
      {
        success: true,
        data: {
          comment: responseComment
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error fetching comment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching the comment'
      },
      { status: 500 }
    );
  }
}

// PUT /api/comments/[id] - Update a comment (only by the author)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid comment ID',
          message: 'Comment ID must be a valid number'
        },
        { status: 400 }
      );
    }

    const body: UpdateCommentRequest = await request.json();
    const { content, wallet_address } = body;

    // Validate required fields
    if (!content || !wallet_address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'content and wallet_address are required'
        },
        { status: 400 }
      );
    }

    // Validate content
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

    // Fetch the comment and verify ownership
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('comment_id, user_id, content, created_at')
      .eq('comment_id', commentId)
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

    // Check if user owns the comment
    if (comment.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          message: 'You can only edit your own comments'
        },
        { status: 403 }
      );
    }

    // Check if comment is too old to edit (optional - 24 hours limit)
    const commentAge = Date.now() - new Date(comment.created_at).getTime();
    const maxEditAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (commentAge > maxEditAge) {
      return NextResponse.json(
        {
          success: false,
          error: 'Edit time expired',
          message: 'Comments can only be edited within 24 hours of posting'
        },
        { status: 400 }
      );
    }

    // Update the comment
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ 
        content: content.trim()
      })
      .eq('comment_id', commentId)
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

    if (updateError) {
      console.error('Error updating comment:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to update comment'
        },
        { status: 500 }
      );
    }

    const responseComment = {
      comment_id: updatedComment.comment_id,
      user_id: updatedComment.user_id,
      story_id: updatedComment.story_id,
      parent_comment_id: updatedComment.parent_comment_id,
      content: updatedComment.content,
      like_count: updatedComment.like_count,
      created_at: updatedComment.created_at,
      user: Array.isArray(updatedComment.user) ? updatedComment.user[0] : updatedComment.user
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Comment updated successfully',
        data: {
          comment: responseComment
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error updating comment:', error);
    
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
        message: 'An unexpected error occurred while updating the comment'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - Delete a comment (only by the author or admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid comment ID',
          message: 'Comment ID must be a valid number'
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    const isAdminRequest = searchParams.get('admin') === 'true';

    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing wallet address',
          message: 'wallet_address parameter is required'
        },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id, username')
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

    // Check if user is admin (if admin request)
    let isAdmin = false;
    if (isAdminRequest) {
      const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('admin_id')
        .eq('wallet_address', walletAddress.trim())
        .single();

      isAdmin = !adminError && !!admin;
    }

    // Fetch the comment and verify ownership
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('comment_id, user_id, content, created_at')
      .eq('comment_id', commentId)
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

    // Check permissions
    const canDelete = comment.user_id === user.id || isAdmin;
    
    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          message: 'You can only delete your own comments'
        },
        { status: 403 }
      );
    }

    // Check if comment has replies
    const { data: replies, error: repliesError } = await supabase
      .from('comments')
      .select('comment_id')
      .eq('parent_comment_id', commentId)
      .limit(1);

    if (repliesError) {
      console.error('Error checking for replies:', repliesError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to check comment dependencies'
        },
        { status: 500 }
      );
    }

    // If comment has replies, just mark as deleted instead of actual deletion
    if (replies && replies.length > 0) {
      const { error: updateError } = await supabase
        .from('comments')
        .update({ 
          content: '[This comment has been deleted]'
        })
        .eq('comment_id', commentId);

      if (updateError) {
        console.error('Error soft-deleting comment:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Database error',
            message: 'Failed to delete comment'
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Comment deleted successfully (content removed due to existing replies)'
        },
        { status: 200 }
      );
    }

    // Delete associated likes first
    const { error: deleteLikesError } = await supabase
      .from('comments_like')
      .delete()
      .eq('comment_id', commentId);

    if (deleteLikesError) {
      console.error('Error deleting comment likes:', deleteLikesError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to delete comment dependencies'
        },
        { status: 500 }
      );
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('comment_id', commentId);

    if (deleteError) {
      console.error('Error deleting comment:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to delete comment'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Comment deleted successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error deleting comment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while deleting the comment'
      },
      { status: 500 }
    );
  }
}