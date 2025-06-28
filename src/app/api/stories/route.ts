// src/app/api/stories/route.ts
// Build-safe POST API for creating stories

import { NextRequest, NextResponse } from 'next/server';

interface StoryRequestBody {
  title: string;
  content: string;
  price_tokens: number;
}

export async function POST(request: NextRequest) {
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
            hasKey: !!supabaseAnonKey
          }
        },
        { status: 500 }
      );
    }

    // Create Supabase client inside the function using dynamic import
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Extract data from request body
    const body: StoryRequestBody = await request.json();
    const { title, content, price_tokens } = body;

    // Validate required fields
    if (!title || !content || price_tokens === undefined) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'title, content, and price_tokens are required',
          required_fields: ['title', 'content', 'price_tokens']
        },
        { status: 400 }
      );
    }

    // Validate data types and constraints
    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid title',
          message: 'Title must be a non-empty string'
        },
        { status: 400 }
      );
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid content',
          message: 'Content must be a non-empty string'
        },
        { status: 400 }
      );
    }

    if (typeof price_tokens !== 'number' || price_tokens < 0) {
      return NextResponse.json(
        {
          error: 'Invalid price_tokens',
          message: 'price_tokens must be a non-negative number'
        },
        { status: 400 }
      );
    }

    // For now, we'll use a mock author_id since we don't have authentication
    // In production, you would get this from authentication middleware
    const author_id = 1; // Mock author ID

    // Verify user exists (optional check)
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('id', author_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'User not found',
          message: 'The author user does not exist. Please create a user first.',
          note: 'In production, this would come from authentication'
        },
        { status: 404 }
      );
    }

    // Create the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        author_id,
        title: title.trim(),
        content: content.trim(),
        price_tokens,
        status: 'pending' // Default status for new submissions
      })
      .select()
      .single();

    if (storyError) {
      console.error('Database error creating story:', storyError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to create story',
          details: storyError.message
        },
        { status: 500 }
      );
    }

    // Create corresponding story submission entry
    const { data: submission, error: submissionError } = await supabase
      .from('story_submissions')
      .insert({
        user_id: author_id,
        story_id: story.id,
        status: 'pending'
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Database error creating submission:', submissionError);
      // Note: In a production app, you might want to rollback the story creation
      // or handle this as a background process
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Story created successfully',
        data: {
          story: {
            id: story.id,
            title: story.title,
            content: story.content,
            price_tokens: story.price_tokens,
            status: story.status,
            created_at: story.created_at,
            author_id: story.author_id
          },
          submission: submission ? {
            submission_id: submission.submission_id,
            status: submission.status,
            submitted_at: submission.submitted_at
          } : null
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in createStory:', error);
    
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
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { 
      message: 'Stories API is working!',
      note: 'Use POST to create a new story'
    }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Use POST to create a new story' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Use POST to create a new story' },
    { status: 405 }
  );
}