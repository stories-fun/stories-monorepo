// src/app/api/stories/[id]/route.ts
// Enhanced version with purchase verification and access control

import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface PurchaseRecord {
  purchase_id: number;
  wallet_address: string;
  story_id: number;
  status: string;
  purchased_at: string;
}

interface AccessValidationResult {
  canAccess: boolean;
  reason?: string;
  accessType: 'free' | 'purchased' | 'owner' | 'admin' | 'denied';
}

// Helper function to validate story purchase
async function validateStoryAccess(
  supabase: any,
  storyId: number,
  story: any,
  requestingWalletAddress?: string,
  adminWalletAddress?: string
): Promise<AccessValidationResult> {
  
  // 1. Check if story is free (price_tokens = 0)
  if (story.price_tokens === 0) {
    return {
      canAccess: true,
      accessType: 'free',
      reason: 'Story is free to read'
    };
  }

  // 2. Check if requesting user is admin
  if (adminWalletAddress) {
    try {
      const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('admin_id, admin_name')
        .eq('wallet_address', adminWalletAddress)
        .single();

      if (!adminError && admin) {
        console.log('Admin access granted to:', admin.admin_name);
        return {
          canAccess: true,
          accessType: 'admin',
          reason: 'Admin access granted'
        };
      }
    } catch (error) {
      console.warn('Admin check failed:', error);
    }
  }

  // 3. Check if requesting user is the story owner
  if (requestingWalletAddress) {
    try {
      const { data: author, error: authorError } = await supabase
        .from('user')
        .select('id, wallet_address')
        .eq('id', story.author_id)
        .single();

      if (!authorError && author && author.wallet_address === requestingWalletAddress) {
        return {
          canAccess: true,
          accessType: 'owner',
          reason: 'User is the story author'
        };
      }
    } catch (error) {
      console.warn('Author check failed:', error);
    }
  }

  // 4. Check if user has purchased the story
  if (requestingWalletAddress) {
    try {
      const { data: purchase, error: purchaseError } = await supabase
        .from('story_purchases')
        .select('*')
        .eq('story_id', storyId)
        .eq('wallet_address', requestingWalletAddress)
        .eq('status', 'completed')
        .single();

      if (!purchaseError && purchase) {
        return {
          canAccess: true,
          accessType: 'purchased',
          reason: 'User has purchased this story'
        };
      }
    } catch (error) {
      console.warn('Purchase check failed:', error);
    }
  }

  // 5. If none of the above conditions are met, deny access
  return {
    canAccess: false,
    accessType: 'denied',
    reason: 'Story requires purchase to access'
  };
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

    // Step 2: Validate access permissions
    const accessValidation = await validateStoryAccess(
      supabase,
      storyId,
      story,
      requestingWalletAddress ?? undefined,
      adminWalletAddress ?? undefined
    );

    console.log('Access validation result:', accessValidation);

    if (!accessValidation.canAccess) {
      // Return story metadata but not content for paid stories
      const { data: author } = await supabase
        .from('user')
        .select('id, username, wallet_address')
        .eq('id', story.author_id)
        .single();

      return NextResponse.json(
        {
          success: false,
          error: 'Payment required',
          message: accessValidation.reason || 'This story requires purchase to access',
          story_preview: {
            id: story.id,
            title: story.title,
            price_tokens: story.price_tokens,
            status: story.status,
            created_at: story.created_at,
            author: author ? {
              id: author.id,
              username: author.username,
              wallet_address: author.wallet_address
            } : null,
            content_preview: story.content.substring(0, 200) + '...'
          },
          purchase_required: true,
          access_type: accessValidation.accessType
        },
        { status: 402 } // Payment Required
      );
    }

    // Step 3: Fetch the author information
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

    // Step 4: Get admin approval info if available
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

    // Step 5: Get purchase information if user has purchased
    let purchaseInfo = null;
    if (requestingWalletAddress && accessValidation.accessType === 'purchased') {
      try {
        const { data: purchase } = await supabase
          .from('story_purchases')
          .select('purchase_id, purchased_at, price_tokens, transaction_hash')
          .eq('story_id', storyId)
          .eq('wallet_address', requestingWalletAddress)
          .eq('status', 'completed')
          .single();
        
        if (purchase) {
          purchaseInfo = {
            purchase_id: purchase.purchase_id,
            purchased_at: purchase.purchased_at,
            price_paid: purchase.price_tokens,
            transaction_hash: purchase.transaction_hash
          };
        }
      } catch (purchaseErr) {
        console.warn('Could not fetch purchase info:', purchaseErr);
      }
    }

    // Step 6: Build response with full story content
    const responseStory = {
      id: story.id,
      title: story.title,
      content: story.content, // Full content since access is granted
      price_tokens: story.price_tokens,
      status: story.status,
      created_at: story.created_at,
      author: {
        id: author.id,
        username: author.username,
        wallet_address: author.wallet_address
      },
      approved_by: approvedBy,
      access_info: {
        access_type: accessValidation.accessType,
        access_reason: accessValidation.reason,
        purchase_info: purchaseInfo
      }
    };

    console.log(`Successfully fetched story: ${story.title} (Access: ${accessValidation.accessType})`);

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

// Enhanced PATCH handler with purchase verification
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

    // Verify admin (same as before)
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