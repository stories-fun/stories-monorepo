// app/api/story-purchase/check/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { story_id, wallet_address } = await req.json();

    const { data, error } = await supabase
      .from('story_purchases')
      .select('*')
      .eq('story_id', story_id)
      .eq('wallet_address', wallet_address)
      .eq('status', 'completed')
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      purchase: data || null,
    });
  } catch (error) {
    console.error('Error checking story purchase:', error);
    return NextResponse.json(
      { error: 'Failed to check story purchase' },
      { status: 500 }
    );
  }
}
