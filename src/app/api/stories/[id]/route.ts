// src/app/api/stories/[id]/route.ts
// Simplified version with better error handling and step-by-step data fetching

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Get environment variables
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

    // Create Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the story ID
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const adminWalletAddress = searchParams.get('admin_wallet_address');
    const requestingWalletAddress = searchParams.get('wallet_address');

    // Validate story ID
    const storyId = parseInt(id);
    if (isNaN(storyId) || storyId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid story ID',
          message: 'Story ID must be a valid positive number'
        },
        { status: 400 }
      );
    }

    // Step 1: Fetch the basic story data
    console.log('Fetching story with ID:', storyId);
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (storyError) {
      console.error('Story fetch error:', storyError);
      if (storyError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'Story not found',
            message: `No story found with ID: ${storyId}`
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to fetch story',
          debug: process.env.NODE_ENV === 'development' ? storyError.message : undefined
        },
        { status: 500 }
      );
    }

    // Step 2: Fetch the author information
    console.log('Fetching author with ID:', story.author_id);
    const { data: author, error: authorError } = await supabase
      .from('user')
      .select('id, username, wallet_address')
      .eq('id', story.author_id)
      .single();

    if (authorError) {
      console.error('Author fetch error:', authorError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to fetch story author information'
        },
        { status: 500 }
      );
    }

    // Step 3: Check if requesting user is admin
    let isAdmin = false;
    if (adminWalletAddress) {
      try {
        const { data: admin, error: adminError } = await supabase
          .from('admin')
          .select('admin_id, admin_name')
          .eq('wallet_address', adminWalletAddress)
          .single();

        if (!adminError && admin) {
          isAdmin = true;
          console.log('Admin access granted to:', admin.admin_name);
        }
      } catch (error) {
        console.warn('Admin check failed:', error);
      }
    }

    // Step 4: Check if requesting user is the author
    let isOwner = false;
    let requestingUser = null;
    if (requestingWalletAddress) {
      try {
        const { data: user, error: userError } = await supabase
          .from('user')
          .select('id, username, wallet_address')
          .eq('wallet_address', requestingWalletAddress)
          .single();

        if (!userError && user) {
          requestingUser = user;
          isOwner = user.id === story.author_id;
          console.log('User access check:', { userId: user.id, authorId: story.author_id, isOwner });
        }
      } catch (error) {
        console.warn('User check failed:', error);
      }
    }

    // Step 5: Check access permissions
    const isPublishedOrApproved = story.status === 'published' || story.status === 'approved';
    const isSubmittedAndOwner = story.status === 'submitted' && isOwner;
    const canAccess = isAdmin || isPublishedOrApproved || isSubmittedAndOwner;

    console.log('Access check:', {
      storyStatus: story.status,
      isAdmin,
      isOwner,
      isPublishedOrApproved,
      isSubmittedAndOwner,
      canAccess
    });

    if (!canAccess) {
      if (story.status === 'submitted') {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied',
            message: 'You can only view your own submitted stories'
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          message: 'This story is not available for public viewing'
        },
        { status: 403 }
      );
    }

    // Step 6: Get admin approval info if available
    let approvedBy = null;
    if (story.approve_by) {
      try {
        const { data: adminData, error: adminFetchError } = await supabase
          .from('admin')
          .select('admin_id, admin_name')
          .eq('admin_name', story.approve_by)
          .single();
        
        if (!adminFetchError && adminData) {
          approvedBy = {
            admin_id: adminData.admin_id,
            username: adminData.admin_name
          };
        }
      } catch (adminErr) {
        console.warn('Could not fetch admin approval info:', adminErr);
      }
    }

    // Step 7: Build response
    const responseStory = {
      id: story.id,
      title: story.title,
      content: story.content,
      price_tokens: story.price_tokens,
      status: story.status,
      created_at: story.created_at,
      author: {
        id: author.id,
        username: author.username,
        wallet_address: author.wallet_address
      },
      approved_by: approvedBy
    };

    console.log('Successfully fetched story:', story.title);

    return NextResponse.json(
      {
        success: true,
        data: {
          story: responseStory
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in story fetch:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching the story',
        debug: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// Handle PATCH requests for admin actions
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json();
    const { action, admin_wallet_address, rejection_reason } = body;

    const storyId = parseInt(id);
    if (isNaN(storyId) || storyId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid story ID'
        },
        { status: 400 }
      );
    }

    if (!action || !admin_wallet_address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'action and admin_wallet_address are required'
        },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action'
        },
        { status: 400 }
      );
    }

    // Verify admin
    const { data: admin, error: adminError } = await supabase
      .from('admin')
      .select('admin_id, admin_name')
      .eq('wallet_address', admin_wallet_address.trim())
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          message: 'Invalid admin credentials'
        },
        { status: 403 }
      );
    }

    // Get story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not found'
        },
        { status: 404 }
      );
    }

    if (story.status !== 'submitted') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid story status',
          message: `Cannot ${action} story with status: ${story.status}`
        },
        { status: 400 }
      );
    }

    // Update story
    const newStatus = action === 'approve' ? 'published' : 'rejected';
    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update({ 
        status: newStatus,
        approve_by: admin.admin_name
      })
      .eq('id', storyId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating story:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update story'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Story ${action}d successfully`,
      data: { story: updatedStory }
    });

  } catch (error) {
    console.error('Error in story action:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed', 
      message: 'Use GET to fetch story details, PATCH to approve/reject stories'
    },
    { status: 405 }
  );
}