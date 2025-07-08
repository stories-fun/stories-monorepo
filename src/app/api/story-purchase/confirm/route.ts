import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { story_id, wallet_address, price_tokens, transaction_hash } = await req.json();

    if (!story_id || !wallet_address || !price_tokens || !transaction_hash) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data, error } = await supabase.from('story_purchases').insert([
      {
        story_id,
        wallet_address,
        price_tokens,
        transaction_hash,
        status: 'completed',
        purchased_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to record purchase' },
      { status: 500 }
    );
  }
}
