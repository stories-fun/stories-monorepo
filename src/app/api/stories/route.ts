// src/app/api/stories/route.ts
// API for fetching stories with filtering and pagination

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

    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const status = searchParams.get('status') || 'published'; // Default to published stories
    const authorId = searchParams.get('author_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

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

    if (offset < 0) {
      return NextResponse.json(
        {
          error: 'Invalid offset',
          message: 'Offset must be a non-negative number'
        },
        { status: 400 }
      );
    }

    const validSortFields = ['created_at', 'title', 'price_tokens'];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        {
          error: 'Invalid sort field',
          message: `Sort field must be one of: ${validSortFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        {
          error: 'Invalid sort order',
          message: 'Sort order must be either "asc" or "desc"'
        },
        { status: 400 }
      );
    }

    // Build the query
    let query = supabase
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
      `);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (authorId) {
      const authorIdNum = parseInt(authorId);
      if (isNaN(authorIdNum)) {
        return NextResponse.json(
          {
            error: 'Invalid author_id',
            message: 'Author ID must be a valid number'
          },
          { status: 400 }
        );
      }
      query = query.eq('author_id', authorIdNum);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: stories, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Database error fetching stories:', fetchError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to fetch stories'
        },
        { status: 500 }
      );
    }

    // Get total count for pagination info
    const { count: totalCount, error: countError } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('status', status);

    if (countError) {
      console.error('Database error getting count:', countError);
    }

    // Transform the data to include author information properly
    const transformedStories = stories?.map(story => ({
      id: story.id,
      title: story.title,
      content: story.content,
      price_tokens: story.price_tokens,
      status: story.status,
      created_at: story.created_at,
      author: Array.isArray(story.user) ? story.user[0] : story.user
    })) || [];

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
            author_id: authorId,
            sort_by: sortBy,
            sort_order: sortOrder
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in stories fetch:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching stories'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Method not allowed', 
      message: 'Use GET to fetch stories. To create stories, use POST /api/stories/create',
      available_endpoints: {
        'GET /api/stories': 'Fetch stories with optional filters',
        'POST /api/stories/create': 'Create a new story'
      },
      query_parameters: {
        'status': 'Filter by story status (submitted, approved, published)',
        'author_id': 'Filter by author ID',
        'limit': 'Number of stories to return (max 100, default 10)',
        'offset': 'Number of stories to skip (default 0)',
        'sort_by': 'Field to sort by (created_at, title, price_tokens)',
        'sort_order': 'Sort order (asc, desc)'
      }
    },
    { status: 405 }
  );
}