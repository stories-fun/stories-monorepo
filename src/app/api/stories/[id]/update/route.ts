// src/app/api/stories/[id]/update/route.ts
// API for updating existing stories by their authors

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdateStoryRequestBody {
  title?: string;
  content?: string;
  price_tokens?: number;
  wallet_address: string;
}

interface UpdateStoryResponse {
  success: boolean;
  message: string;
  data?: {
    story: {
      id: number;
      title: string;
      content: string;
      price_tokens: number;
      status: string;
      updated_at: string;
      author: {
        id: number;
        username: string;
      };
    };
  };
  error?: string;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if environment variables exist
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

    // Get story ID from params
    const { id } = await params;
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

    // Parse request body
    const body: UpdateStoryRequestBody = await request.json();
    const { title, content, price_tokens, wallet_address } = body;

    // Validate required wallet address
    if (!wallet_address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing wallet address',
          message: 'wallet_address is required for authentication'
        },
        { status: 400 }
      );
    }

    // Validate that at least one field is being updated
    if (!title && !content && price_tokens === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'No updates provided',
          message: 'At least one field (title, content, or price_tokens) must be provided'
        },
        { status: 400 }
      );
    }

    // Validate field formats if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid title',
            message: 'Title must be a non-empty string'
          },
          { status: 400 }
        );
      }

      if (title.trim().length > 255) {
        return NextResponse.json(
          {
            success: false,
            error: 'Title too long',
            message: 'Title must be 255 characters or less'
          },
          { status: 400 }
        );
      }
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid content',
            message: 'Content must be a non-empty string'
          },
          { status: 400 }
        );
      }

      if (content.trim().length > 50000) {
        return NextResponse.json(
          {
            success: false,
            error: 'Content too long',
            message: 'Content must be 50,000 characters or less'
          },
          { status: 400 }
        );
      }
    }

    if (price_tokens !== undefined) {
      const priceValue = typeof price_tokens === 'number' ? price_tokens : parseFloat(price_tokens as any);
      if (isNaN(priceValue) || priceValue < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid price',
            message: 'Price must be a non-negative number'
          },
          { status: 400 }
        );
      }
    }

    // Get user information from wallet address
    const { data: user, error: userError } = await supabase
      .from('user')
      .select('id, username')
      .eq('wallet_address', wallet_address.trim())
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: 'User not found',
            message: `No user found with wallet address: ${wallet_address.trim()}`
          },
          { status: 404 }
        );
      }

      console.error('Database error fetching user:', userError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to authenticate user'
        },
        { status: 500 }
      );
    }

    // Get the existing story and verify ownership
    const { data: existingStory, error: storyError } = await supabase
      .from('stories')
      .select('id, author_id, title, content, price_tokens, status, created_at')
      .eq('id', storyId)
      .single();

    if (storyError) {
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

      console.error('Database error fetching story:', storyError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to fetch story'
        },
        { status: 500 }
      );
    }

    // Verify that the user is the author of the story
    if (existingStory.author_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          message: 'You can only update your own stories'
        },
        { status: 403 }
      );
    }

    // Check if the story is in a state that allows updates
    // Only allow updates for published stories (you can modify this logic as needed)
    if (existingStory.status !== 'published') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid story status',
          message: `Cannot update story with status: ${existingStory.status}. Only published stories can be updated.`
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      // Reset status to submitted for re-approval
      status: 'submitted',
      // Clear the approval info since it needs re-approval
      approve_by: null
    };

    // Only update fields that were provided
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    
    if (content !== undefined) {
      updateData.content = content.trim();
    }
    
    if (price_tokens !== undefined) {
      updateData.price_tokens = typeof price_tokens === 'number' ? price_tokens : parseFloat(price_tokens as any);
    }

    // Update the story
    const { data: updatedStory, error: updateError } = await supabase
      .from('stories')
      .update(updateData)
      .eq('id', storyId)
      .select('id, title, content, price_tokens, status, created_at')
      .single();

    if (updateError) {
      console.error('Database error updating story:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to update story'
        },
        { status: 500 }
      );
    }

    // Create a new story submission record for the updated story
    const { data: submission, error: submissionError } = await supabase
      .from('story_submissions')
      .insert({
        user_id: user.id,
        story_id: updatedStory.id,
        status: 'pending'
      })
      .select('submission_id, status, submitted_at')
      .single();

    if (submissionError) {
      console.error('Database error creating submission:', submissionError);
      // If submission creation fails, we'll proceed but log the error
      console.error('Warning: Story updated but submission record failed');
    }

    // Prepare response
    const response: UpdateStoryResponse = {
      success: true,
      message: 'Story updated successfully and submitted for re-approval',
      data: {
        story: {
          id: updatedStory.id,
          title: updatedStory.title,
          content: updatedStory.content,
          price_tokens: updatedStory.price_tokens,
          status: updatedStory.status,
          updated_at: new Date().toISOString(),
          author: {
            id: user.id,
            username: user.username
          }
        }
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Unexpected error in story update:', error);
    
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
        message: 'An unexpected error occurred while updating the story'
      },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed', 
      message: 'Use PUT to update a story',
      endpoint_info: {
        method: 'PUT',
        path: '/api/stories/[id]/update',
        description: 'Update an existing story by its author',
        required_fields: ['wallet_address'],
        optional_fields: ['title', 'content', 'price_tokens'],
        note: 'At least one optional field must be provided. Story status will be reset to "submitted" for re-approval.'
      }
    },
    { status: 405 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed', 
      message: 'Use PUT to update a story'
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false,
      error: 'Method not allowed', 
      message: 'Story deletion is not supported through this endpoint'
    },
    { status: 405 }
  );
}
