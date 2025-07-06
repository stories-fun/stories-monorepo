// src/app/api/admin/stories/[id]/route.ts
// API for admin to approve or reject stories

import { NextRequest, NextResponse } from 'next/server';

// Fixed interface for Next.js 15 compatibility
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface AdminActionRequestBody {
  action: 'approve' | 'reject';
  admin_wallet_address: string;
  rejection_reason?: string;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
          message: 'Supabase environment variables are not configured'
        },
        { status: 500 }
      );
    }

    // Create Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Await the params to get the id
    const { id } = await params;
    const body: AdminActionRequestBody = await request.json();
    const { action, admin_wallet_address, rejection_reason } = body;

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

    // Validate required fields
    if (!action || !admin_wallet_address) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'action and admin_wallet_address are required',
          required_fields: ['action', 'admin_wallet_address']
        },
        { status: 400 }
      );
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        {
          error: 'Invalid action',
          message: 'Action must be either "approve" or "reject"'
        },
        { status: 400 }
      );
    }

    // Verify admin credentials
    const { data: admin, error: adminError } = await supabase
      .from('admin')
      .select('admin_id, username')
      .eq('wallet_address', admin_wallet_address.trim())
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'Invalid admin credentials'
        },
        { status: 403 }
      );
    }

    // Fetch the story to verify it exists and get current status
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        id,
        title,
        status,
        author_id,
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

    // Check if story is in a state that can be acted upon
    if (story.status !== 'submitted') {
      return NextResponse.json(
        {
          error: 'Invalid story status',
          message: `Cannot ${action} story with status: ${story.status}. Only submitted stories can be reviewed.`
        },
        { status: 400 }
      );
    }

    // Prepare update data based on action
    let updateData: any = {};
    let newStatus: string;

    if (action === 'approve') {
      newStatus = 'approved';
      updateData = {
        status: newStatus,
        approved_by: admin.admin_id
      };
    } else { // reject
      newStatus = 'rejected';
      updateData = {
        status: newStatus,
        approved_by: admin.admin_id
      };
    }

    // Update the story
    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update(updateData)
      .eq('id', storyId)
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
        ),
        admin:approved_by (
          admin_id,
          username
        )
      `)
      .single();

    if (updateError) {
      console.error('Database error updating story:', updateError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: `Failed to ${action} story`
        },
        { status: 500 }
      );
    }

    // Create an admin action log entry
    const { error: logError } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: admin.admin_id,
        action_type: action,
        target_type: 'story',
        target_id: storyId,
        details: JSON.stringify({
          story_title: story.title,
          author_id: story.author_id,
          rejection_reason: rejection_reason || null
        })
      });

    if (logError) {
      console.error('Failed to log admin action:', logError);
      // Continue execution even if logging fails
    }

    // If rejecting, optionally update story submission record
    if (action === 'reject') {
      const { error: submissionUpdateError } = await supabase
        .from('story_submissions')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason || null
        })
        .eq('story_id', storyId);

      if (submissionUpdateError) {
        console.error('Failed to update submission record:', submissionUpdateError);
        // Continue execution even if this fails
      }
    }

    // Transform response data
    const responseStory = {
      id: updatedStory.id,
      title: updatedStory.title,
      content: updatedStory.content,
      price_tokens: updatedStory.price_tokens,
      status: updatedStory.status,
      created_at: updatedStory.created_at,
      author: Array.isArray(updatedStory.user) ? updatedStory.user[0] : updatedStory.user,
      approved_by: Array.isArray(updatedStory.admin) ? updatedStory.admin[0] : updatedStory.admin
    };

    return NextResponse.json(
      {
        success: true,
        message: `Story ${action}d successfully`,
        data: {
          story: responseStory,
          action_details: {
            action,
            performed_by: {
              admin_id: admin.admin_id,
              username: admin.username
            },
            timestamp: new Date().toISOString(),
            rejection_reason: action === 'reject' ? rejection_reason : null
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in admin story action:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing admin action'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // This endpoint can be used to get detailed story info for admin review
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: 'Server configuration error',
          message: 'Supabase environment variables are not configured'
        },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Await the params to get the id
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const adminWalletAddress = searchParams.get('admin_wallet_address');

    // Validate admin
    if (!adminWalletAddress) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Admin wallet address is required'
        },
        { status: 401 }
      );
    }

    const { data: admin, error: adminError } = await supabase
      .from('admin')
      .select('admin_id, username')
      .eq('wallet_address', adminWalletAddress)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'Invalid admin credentials'
        },
        { status: 403 }
      );
    }

    // Validate and fetch story
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
        ),
        admin:approved_by (
          admin_id,
          username
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

    const responseStory = {
      id: story.id,
      title: story.title,
      content: story.content,
      price_tokens: story.price_tokens,
      status: story.status,
      created_at: story.created_at,
      author: Array.isArray(story.user) ? story.user[0] : story.user,
      approved_by: Array.isArray(story.admin) ? story.admin[0] : story.admin
    };

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
    console.error('Unexpected error fetching story for admin:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching story'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Method not allowed', 
      message: 'Use PATCH to approve/reject stories, GET to fetch story details',
      available_actions: {
        'PATCH': 'Approve or reject a story',
        'GET': 'Get detailed story information for admin review'
      },
      patch_body_example: {
        action: 'approve | reject',
        admin_wallet_address: 'admin_wallet_address_here',
        rejection_reason: 'Optional reason for rejection'
      }
    },
    { status: 405 }
  );
}