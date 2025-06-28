// src/app/api/users/signin/route.ts
// Completely build-safe GET API for user signin using wallet address

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

    // Create Supabase client inside the function using dynamic import
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { searchParams } = new URL(request.url);
    
    // Get wallet address parameter
    const wallet_address = searchParams.get('wallet_address');

    // Validate that wallet address is provided
    if (!wallet_address) {
      return NextResponse.json(
        {
          error: 'Missing wallet address',
          message: 'Please provide wallet_address parameter',
          example: '/api/users/signin?wallet_address=0x...'
        },
        { status: 400 }
      );
    }

    // Clean and validate wallet address format
    const cleanWalletAddress = wallet_address.trim().toLowerCase();
    
    // Basic wallet address validation
    const walletRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!walletRegex.test(cleanWalletAddress)) {
      return NextResponse.json(
        {
          error: 'Invalid wallet address format',
          message: 'Wallet address must be in format 0x... (40 hex characters)'
        },
        { status: 400 }
      );
    }

    // Query user by wallet address
    const { data: user, error: queryError } = await supabase
      .from('user')
      .select('*')
      .eq('wallet_address', cleanWalletAddress)
      .single();

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(
          {
            error: 'User not found',
            message: `No user found with wallet address: ${cleanWalletAddress}`
          },
          { status: 404 }
        );
      }

      console.error('Database error during signin:', queryError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to authenticate user'
        },
        { status: 500 }
      );
    }

    // User found - return user data
    return NextResponse.json(
      {
        success: true,
        message: 'User authenticated successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            wallet_address: user.wallet_address,
            created_at: user.created_at
          }
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in user signin:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred during authentication'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Method not allowed', 
      message: 'Use GET with wallet_address parameter to sign in',
      example: 'GET /api/users/signin?wallet_address=0x...'
    },
    { status: 405 }
  );
}