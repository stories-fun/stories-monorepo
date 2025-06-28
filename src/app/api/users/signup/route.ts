// src/app/api/users/signup/route.ts
// POST API for user registration

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SignupRequestBody {
  username: string;
  email: string;
  wallet_address: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequestBody = await request.json();
    const { username, email, wallet_address } = body;

    // Validate required fields
    if (!username || !email || !wallet_address) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'username, email, and wallet_address are required',
          required_fields: ['username', 'email', 'wallet_address']
        },
        { status: 400 }
      );
    }

    // Validate field formats
    if (typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Invalid username',
          message: 'Username must be a non-empty string'
        },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: 'Invalid email',
          message: 'Please provide a valid email address'
        },
        { status: 400 }
      );
    }

    // Clean the input data
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanWalletAddress = wallet_address.trim().toLowerCase();

    // Check if user already exists (by any unique field)
    const { data: existingUser, error: checkError } = await supabase
      .from('user')
      .select('id, username, email, wallet_address')
      .or(`username.eq.${cleanUsername},email.eq.${cleanEmail},wallet_address.eq.${cleanWalletAddress}`)
      .limit(1);

    if (checkError) {
      console.error('Database error checking existing user:', checkError);
      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to check existing user'
        },
        { status: 500 }
      );
    }

    if (existingUser && existingUser.length > 0) {
      const existing = existingUser[0];
      let conflictField = '';
      
      if (existing.username === cleanUsername) conflictField = 'username';
      else if (existing.email === cleanEmail) conflictField = 'email';
      else if (existing.wallet_address === cleanWalletAddress) conflictField = 'wallet_address';

      return NextResponse.json(
        {
          error: 'User already exists',
          message: `A user with this ${conflictField} already exists`,
          conflict_field: conflictField
        },
        { status: 409 }
      );
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('user')
      .insert({
        username: cleanUsername,
        email: cleanEmail,
        wallet_address: cleanWalletAddress
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database error creating user:', insertError);
      
      // Handle specific database constraint errors
      if (insertError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          {
            error: 'Unique constraint violation',
            message: 'Username, email, or wallet address already exists'
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: 'Database error',
          message: 'Failed to create user account'
        },
        { status: 500 }
      );
    }

    // Return success response (exclude sensitive data if any)
    return NextResponse.json(
      {
        success: true,
        message: 'User account created successfully',
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            wallet_address: newUser.wallet_address,
            created_at: newUser.created_at
          }
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in user signup:', error);
    
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
    { error: 'Method not allowed', message: 'Use POST to create a new user' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Use POST to create a new user' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'Use POST to create a new user' },
    { status: 405 }
  );
}