// src/app/api/users/signin/route.ts
// GET API for user authentication/signin using wallet address only

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
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
    
    // Basic wallet address validation (assuming Ethereum-like address)
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

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    { 
      error: 'Method not allowed', 
      message: 'Use GET with wallet_address parameter to sign in. For signup, use POST /api/users/signup',
      example: 'GET /api/users/signin?wallet_address=0x...'
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Use GET to sign in' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Use GET with wallet_address parameter to sign in' },
    { status: 405 }
  );
}