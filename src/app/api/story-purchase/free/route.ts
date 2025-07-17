import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { story_id, wallet_address } = await req.json();

    if (!story_id || !wallet_address) {
      return NextResponse.json({ success: false, error: 'Missing story_id or wallet_address' }, { status: 400 });
    }

    // ✅ Check if already purchased
    const { data: existing, error: existingError } = await supabase
      .from('story_purchases')
      .select('id')
      .eq('story_id', story_id)
      .eq('wallet_address', wallet_address)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Story already unlocked',
        alreadyPurchased: true,
      });
    }

    // ✅ Double-check story is actually free
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('price_tokens')
      .eq('id', story_id)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ success: false, error: 'STORY_NOT_FOUND' }, { status: 404 });
    }

    const price = parseFloat(story.price_tokens);

    if (price > 0) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FREE',
        message: 'This story is not free.',
      }, { status: 403 });
    }

    // ✅ Insert free story access
    const { error: insertError } = await supabase.from('story_purchases').insert([
      {
        story_id,
        wallet_address,
        price_tokens: 0,
        transaction_hash: 'free-access',
        status: 'completed',
        purchased_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error('Failed to insert free access:', insertError);
      return NextResponse.json({ success: false, error: 'DB_INSERT_FAILED' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Free story unlocked',
      price_tokens: 0,
    });
  } catch (error) {
    console.error('Free story unlock failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
