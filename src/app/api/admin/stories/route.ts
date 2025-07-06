// src/app/api/admin/stories/route.ts
// Fixed version using correct schema relationships

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if environment variables exist
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

    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const adminWalletAddress = searchParams.get('wallet_address');
    const status = searchParams.get('status') || 'submitted'; // Keep as submitted per user request
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Validate admin authentication
    if (!adminWalletAddress) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Admin wallet address is required'
        },
        { status: 401 }
      );
    }

    // Verify admin credentials
    const { data: admin, error: adminError } = await supabase
      .from('admin')
      .select('wallet_address, admin_name, admin_id')
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

    // Validate parameters
    if (limit > 100) {
      return NextResponse.json(
        {
          error: 'Invalid limit',
          message: 'Limit cannot exceed 100 stories per request'
        },
        { status: 400 }
      );
    }

    const validStatuses = ['submitted', 'pending', 'approved', 'rejected', 'published'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        },
        { status: 400 }
      );
    }

    const validSortFields = ['created_at', 'title', 'price_tokens', 'author_id'];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        {
          error: 'Invalid sort field',
          message: `Sort field must be one of: ${validSortFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Build the query for admin story review with proper relationships
    let query = supabase
      .from('stories')
      .select(`
        id,
        title,
        content,
        price_tokens,
        status,
        created_at,
        approve_by,
        user:author_id (
          id,
          username,
          email,
          wallet_address
        )
      `)
      .eq('status', status);

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: stories, error: fetchError } = await query;

    if (fetchError) {
      console.error('Database error fetching stories for admin:', fetchError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to fetch stories for review'
        },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (countError) {
      console.error('Database error getting count:', countError);
    }

    // Get story submissions data for each story (if needed)
    const storyIds = stories?.map(story => story.id) || [];
    let submissions: any[] = [];
    
    if (storyIds.length > 0) {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('story_submissions')
        .select('submission_id, story_id, status, submitted_at, reviewed_at')
        .in('story_id', storyIds);
      
      if (!submissionsError) {
        submissions = submissionsData || [];
      }
    }

    // Transform the data to match frontend expectations
    const transformedStories = stories?.map(story => {
      const submission = submissions.find(sub => sub.story_id === story.id);
      
      return {
        id: story.id,
        title: story.title,
        content: story.content,
        price_tokens: story.price_tokens,
        status: story.status,
        created_at: story.created_at,
        author: Array.isArray(story.user) ? story.user[0] : story.user,
        submission: submission ? {
          submission_id: submission.submission_id,
          status: submission.status,
          submitted_at: submission.submitted_at,
          reviewed_at: submission.reviewed_at
        } : {
          submission_id: story.id,
          status: story.status,
          submitted_at: story.created_at,
          reviewed_at: null
        }
      };
    }) || [];

    return NextResponse.json(
      {
        success: true,
        data: {
          stories: transformedStories,
          pagination: {
            total: totalCount || 0,
            limit,
            offset,
            has_more: (totalCount || 0) > offset + limit
          },
          filters: {
            status,
            sort_by: sortBy,
            sort_order: sortOrder
          },
          admin: {
            admin_id: admin.admin_id,
            name: admin.admin_name,
            wallet_address: admin.wallet_address
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in admin stories fetch:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching stories for review'
      },
      { status: 500 }
    );
  }
}

// Add the POST method for story approval/rejection
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body = await request.json();
    const { wallet_address, story_id, action, reason } = body;

    // Validate admin
    const { data: admin, error: adminError } = await supabase
      .from('admin')
      .select('wallet_address, admin_name, admin_id')
      .eq('wallet_address', wallet_address)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Access denied', message: 'Invalid admin credentials' },
        { status: 403 }
      );
    }

    // Update story status
    const newStatus = action === 'approve' ? 'published' : 'rejected';
    
    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update({ 
        status: newStatus,
        approve_by: admin.admin_name
      })
      .eq('id', story_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating story:', updateError);
      return NextResponse.json(
        { error: 'Failed to update story status' },
        { status: 500 }
      );
    }

    // Update story submission if it exists
    const { error: submissionError } = await supabase
      .from('story_submissions')
      .update({ 
        status: newStatus,
        reviewed_at: new Date().toISOString()
      })
      .eq('story_id', story_id);

    // Log the submission error but don't fail the request
    if (submissionError) {
      console.warn('Could not update story submission:', submissionError);
    }

    return NextResponse.json({
      success: true,
      message: `Story ${action}d successfully`,
      data: { story: updatedStory }
    });

  } catch (error) {
    console.error('Error in story action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}