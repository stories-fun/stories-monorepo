// src/app/api/stories/[id]/route.ts
// API for fetching a single story by ID

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if environment variables exist
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
          message: 'Supabase environment variables are not configured',
          debug: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseAnonKey,
            url: supabaseUrl || 'undefined',
            key: supabaseAnonKey ? 'exists' : 'undefined'
          }
        },
        { status: 500 }
      );
    }

    // Create Supabase client inside the function
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { id } = params;

    // Validate story ID
    const storyId = parseInt(id);
    if (isNaN(storyId) || storyId <= 0) {
      return NextResponse.json(
        {
          error: 'Invalid story ID',
          message: 'Story ID must be a valid positive number'
        },
        { status: 400 }
      );
    }

    // Get query parameters for additional options
    const { searchParams } = new URL(request.url);
    const includeComments = searchParams.get('include_comments') === 'true';
    const wallet_address = searchParams.get('wallet_address'); // For access control

    // Fetch the story with author information
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        id,
        title,
        content,
        price_tokens,
        status,
        created_at,
        user:author_id (
          id,
          username,
          wallet_address
        )
      `)
      .eq('id', storyId)
      .single();

    if (storyError) {
      if (storyError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'Story not found',
            message: `No story found with ID: ${storyId}`
          },
          { status: 404 }
        );
      }

      console.error('Database error fetching story:', storyError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to fetch story'
        },
        { status: 500 }
      );
    }

    // Check if user has access to this story
    const isAuthor = wallet_address && story.user?.wallet_address === wallet_address;
    const isPublished = story.status === 'published';
    const isApproved = story.status === 'approved';

    // Access control logic
    if (!isPublished && !isAuthor && !isApproved) {
      // Only show submitted stories to their authors
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'This story is not available for viewing'
        },
        { status: 403 }
      );
    }

    // Check if user has purchased this story (if it has a price)
    let hasPurchased = false;
    if (story.price_tokens > 0 && wallet_address && !isAuthor) {
      // First get the user_id from wallet_address
      const { data: user } = await supabase
        .from('user')
        .select('id')
        .eq('wallet_address', wallet_address)
        .single();

      if (user) {
        const { data: purchase } = await supabase
          .from('story_purchases')
          .select('purchase_id')
          .eq('story_id', storyId)
          .eq('buyer_id', user.id)
          .single();

        hasPurchased = !!purchase;
      }
    }

    // Determine if content should be truncated
    const shouldTruncateContent = story.price_tokens > 0 && !isAuthor && !hasPurchased;
    const truncatedContent = shouldTruncateContent 
      ? story.content.substring(0, 200) + '...' 
      : story.content;

    // Prepare the response
    let responseData: any = {
      story: {
        id: story.id,
        title: story.title,
        content: shouldTruncateContent ? truncatedContent : story.content,
        full_content_available: !shouldTruncateContent,
        price_tokens: story.price_tokens,
        status: story.status,
        created_at: story.created_at,
        author: {
          id: story.user?.id,
          username: story.user?.username,
          wallet_address: story.user?.wallet_address
        },
        access_info: {
          is_author: isAuthor,
          has_purchased: hasPurchased,
          requires_purchase: story.price_tokens > 0 && !isAuthor && !hasPurchased
        }
      }
    };

    // Include comments if requested
    if (includeComments) {
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          comment_id,
          content,
          like_count,
          created_at,
          parent_comment_id,
          user:user_id (
            id,
            username
          )
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
      } else {
        responseData.story.comments = comments?.map(comment => ({
          id: comment.comment_id,
          content: comment.content,
          like_count: comment.like_count,
          created_at: comment.created_at,
          parent_comment_id: comment.parent_comment_id,
          author: {
            id: comment.user?.id,
            username: comment.user?.username
          }
        })) || [];
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: responseData
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in single story fetch:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching the story'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Method not allowed', 
      message: 'Use GET to fetch a single story',
      available_endpoints: {
        'GET /api/stories/[id]': 'Fetch a single story by ID',
        'POST /api/stories/create': 'Create a new story'
      },
      query_parameters: {
        'include_comments': 'Set to "true" to include comments in the response',
        'wallet_address': 'Wallet address for access control and purchase verification'
      }
    },
    { status: 405 }
  );
}