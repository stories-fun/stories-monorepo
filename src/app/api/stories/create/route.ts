// src/app/api/stories/create/route.ts
// API for creating/posting new stories

import { NextRequest, NextResponse } from 'next/server';

interface CreateStoryRequestBody {
  title: string;
  content: string;
  price_tokens: number;
  wallet_address: string;
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

    const body: CreateStoryRequestBody = await request.json();
    const { title, content, price_tokens, wallet_address } = body;

    // Validate required fields
    if (!title || !content || !wallet_address) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'title, content, and wallet_address are required',
          required_fields: ['title', 'content', 'wallet_address']
        },
        { status: 400 }
      );
    }

    // Validate field formats and constraints
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

    if (title.trim().length > 255) {
      return NextResponse.json(
        {
          error: 'Title too long',
          message: 'Title must be 255 characters or less'
        },
        { status: 400 }
      );
    }

    if (content.trim().length > 50000) {
      return NextResponse.json(
        {
          error: 'Content too long',
          message: 'Content must be 50,000 characters or less'
        },
        { status: 400 }
      );
    }

    // Validate price_tokens
    const priceTokens = typeof price_tokens === 'number' ? price_tokens : parseFloat(price_tokens as any);
    if (isNaN(priceTokens) || priceTokens < 0) {
      return NextResponse.json(
        {
          error: 'Invalid price',
          message: 'Price must be a non-negative number'
        },
        { status: 400 }
      );
    }

    // Clean the input data
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const cleanWalletAddress = wallet_address.trim();

    // First, get the user_id from wallet_address
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id, username')
      .eq('wallet_address', cleanWalletAddress)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          {
            error: 'User not found',
            message: `No user found with wallet address: ${cleanWalletAddress}. Please sign up first.`
          },
          { status: 404 }
        );
      }

      console.error('Database error fetching user:', userError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to authenticate user'
        },
        { status: 500 }
      );
    }

    // Create the story
    const { data: newStory, error: storyError } = await supabase
      .from('stories')
      .insert({
        author_id: user.id,
        title: cleanTitle,
        content: cleanContent,
        price_tokens: priceTokens,
        status: 'submitted' // Initial status
      })
      .select('id, title, content, price_tokens, status, created_at')
      .single();

    if (storyError) {
      console.error('Database error creating story:', storyError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to create story'
        },
        { status: 500 }
      );
    }

    // Create a story submission record
    const { data: submission, error: submissionError } = await supabase
      .from('story_submissions')
      .insert({
        user_id: user.id,
        story_id: newStory.id,
        status: 'pending'
      })
      .select('submission_id, status, submitted_at')
      .single();

    if (submissionError) {
      console.error('Database error creating submission:', submissionError);
      // If submission creation fails, we might want to delete the story or log this issue
      // For now, we'll proceed but log the error
      console.error('Warning: Story created but submission record failed');
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Story submitted successfully',
        data: {
          story: {
            id: newStory.id,
            title: newStory.title,
            content: newStory.content,
            price_tokens: newStory.price_tokens,
            status: newStory.status,
            created_at: newStory.created_at,
            author: {
              id: user.id,
              username: user.username
            }
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
    console.error('Unexpected error in story creation:', error);
    
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
        message: 'An unexpected error occurred while creating the story'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Method not allowed', 
      message: 'Use POST to create a new story',
      endpoints: {
        'POST /api/stories/create': 'Create a new story',
        'required_fields': ['title', 'content', 'wallet_address'],
        'optional_fields': ['price_tokens (defaults to 0)']
      }
    },
    { status: 405 }
  );
}