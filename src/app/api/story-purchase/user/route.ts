    import { createClient } from '@supabase/supabase-js';
    import { NextRequest, NextResponse } from 'next/server';

    const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet_address = searchParams.get('wallet_address');

        if (!wallet_address) {
        return NextResponse.json(
            { success: false, error: 'wallet_address is required' },
            { status: 400 }
        );
        }

        const { data, error } = await supabase
        .from('story_purchases')
        .select('*')
        .eq('wallet_address', wallet_address)
        .eq('status', 'completed')
        .order('purchased_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
        success: true,
        data: {
            purchases: data || []
        }
        });
    } catch (error) {
        console.error('Error fetching user purchases:', error);
        return NextResponse.json(
        { success: false, error: 'Failed to fetch purchases' },
        { status: 500 }
        );
    }
    }