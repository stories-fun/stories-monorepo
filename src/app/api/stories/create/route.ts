import { NextRequest, NextResponse } from 'next/server';

interface CreateStoryRequestBody {
  title: string;
  content: any;
  price_tokens: number;
  wallet_address: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const body: CreateStoryRequestBody = await request.json();
    const { title, content, price_tokens, wallet_address } = body;

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

    if (
      typeof content !== 'object' ||
      !Array.isArray(content.blocks) ||
      content.blocks.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Invalid content',
          message: 'Content must be a non-empty Editor.js OutputData object',
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

    if (JSON.stringify(content).length > 50000) {
      return NextResponse.json(
        {
          error: 'Content too long',
          message: 'Content must be 50,000 characters or less'
        },
        { status: 400 }
      );
    }

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

    const cleanTitle = title.trim();
    const cleanContent = JSON.stringify(content);
    const cleanWalletAddress = wallet_address.trim();

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

    const { data: newStory, error: storyError } = await supabase
      .from('stories')
      .insert({
        author_id: user.id,
        title: cleanTitle,
        content: cleanContent,
        price_tokens: priceTokens,
        status: 'submitted'
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
