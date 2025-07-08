import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from '@solana/spl-token';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STORIES_TOKEN_ADDRESS = new PublicKey('EvA88escD87zrzG7xo8WAM8jW6gJ5uQfeLL8Fj6DUZ2Q');
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS!;
const STORIES_DECIMALS = 9;

async function getSolanaConnection(): Promise<Connection> {
  const endpoints = [
    `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
  ];

  for (const url of endpoints) {
    try {
      const connection = new Connection(url, 'confirmed');
      await connection.getSlot();
      console.log(`Connected to RPC: ${url}`);
      return connection;
    } catch (e) {
      console.warn(`Failed to connect to ${url}`);
    }
  }

  throw new Error('All Solana RPCs failed');
}

export async function POST(req: NextRequest) {
  try {
    const {
      step,
      story_id,
      wallet_address,
      price_tokens,
      signed_tx_base64, // Optional
    } = await req.json();

    const connection = await getSolanaConnection();

    // ------------------------------
    // STEP 1: Prepare TX to sign
    // ------------------------------
    if (step === 'create') {
      if (!story_id || !wallet_address || !price_tokens) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
      }

      const userPublicKey = new PublicKey(wallet_address);
      const treasuryPublicKey = new PublicKey(TREASURY_ADDRESS);

      const fromTokenAccount = await getAssociatedTokenAddress(STORIES_TOKEN_ADDRESS, userPublicKey);
      const toTokenAccount = await getAssociatedTokenAddress(STORIES_TOKEN_ADDRESS, treasuryPublicKey);
      const amountInSmallestUnit = price_tokens * 10 ** STORIES_DECIMALS;

      const transferIx = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        userPublicKey,
        amountInSmallestUnit
      );

      const tx = new Transaction().add(transferIx);
      tx.feePayer = userPublicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      const serializedTx = tx.serialize({ requireAllSignatures: false }).toString('base64');

      return NextResponse.json({
        tx_base64: serializedTx,
        message: 'Unsigned transaction created. Sign and send it on frontend.',
      });
    }

    // ------------------------------
    // STEP 2: Receive signed tx and confirm
    // ------------------------------
    if (step === 'confirm') {
      if (!story_id || !wallet_address || !price_tokens || !signed_tx_base64) {
        return NextResponse.json({ error: 'Missing signed transaction data' }, { status: 400 });
      }

      const signedTxBuffer = Buffer.from(signed_tx_base64, 'base64');

      // Send and confirm
      const txSignature = await connection.sendRawTransaction(signedTxBuffer, {
        skipPreflight: false,
      });

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(txSignature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }

      // Save in Supabase
      const { error: dbError } = await supabase.from('story_purchases').insert([
        {
          story_id,
          wallet_address,
          price_tokens,
          transaction_hash: txSignature,
          status: 'completed',
          purchased_at: new Date().toISOString(),
        },
      ]);

      if (dbError) throw dbError;

      return NextResponse.json({
        success: true,
        message: 'Transaction confirmed and saved',
        transaction_hash: txSignature,
      });
    }

    return NextResponse.json({ error: 'Invalid step parameter' }, { status: 400 });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Payment failed' },
      { status: 500 }
    );
  }
}
