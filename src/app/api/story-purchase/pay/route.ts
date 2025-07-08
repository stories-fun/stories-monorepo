import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  Connection,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import nacl from 'tweetnacl';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STORIES_TOKEN_ADDRESS = new PublicKey('EvA88escD87zrzG7xo8WAM8jW6gJ5uQfeLL8Fj6DUZ2Q');
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS!;
const STORIES_DECIMALS = 9;
const USD_PRICE = 9; // Fixed $9 USD payment
const PRIORITY_FEE_LAMPORTS = 100000; // 0.0001 SOL for priority fee
const MAX_RETRIES = 3;
const RPC_TIMEOUT = 15000; // 15 seconds
const MINIMUM_SOL_BALANCE = 0.01;



async function checkTokenAndSolBalance(
  connection: Connection,
  userPublicKey: PublicKey,
  tokenAccount: PublicKey,
  requiredTokens: bigint
): Promise<{ hasSufficientTokens: boolean; hasSufficientSol: boolean }> {
  try {
    const [tokenAccountInfo, solBalance] = await Promise.all([
      getAccount(connection, tokenAccount),
      connection.getBalance(userPublicKey),
    ]);

    return {
      hasSufficientTokens: BigInt(tokenAccountInfo.amount) >= requiredTokens,
      hasSufficientSol: solBalance > MINIMUM_SOL_BALANCE * 1e9, // Convert to lamports
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Account not found')) {
      return {
        hasSufficientTokens: false,
        hasSufficientSol: (await connection.getBalance(userPublicKey)) > MINIMUM_SOL_BALANCE * 1e9,
      };
    }
    throw error;
  }
}

async function getSolanaConnection(): Promise<Connection> {
  const endpoints = [
    `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana',
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT);
      
      const connection = new Connection(url, {
        commitment: 'confirmed',
        disableRetryOnRateLimit: false,
        confirmTransactionInitialTimeout: 60000,
      });

      // Test connection with proper Promise.race syntax
      await Promise.race([
        connection.getVersion(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), RPC_TIMEOUT)
        )
      ]);

      clearTimeout(timeout);
      console.log(`Connected to RPC: ${url}`);
      return connection;
    } catch (e) {
      console.warn(`Failed to connect to ${url}:`, e instanceof Error ? e.message : e);
      continue;
    }
  }

  throw new Error('All Solana RPC endpoints failed');
}

async function getStoriesPriceInUSD(): Promise<number> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/pairs/solana/DwAnxaVPCkLCKigNt5kNZwUmJ3rbiVFmvLxgEgFyogAL`,
        { next: { revalidate: 60 } } // Cache for 60 seconds
      );
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const priceUsd = data.pairs?.[0]?.priceUsd;
      
      if (!priceUsd) throw new Error('Invalid price data from DexScreener');
      
      const price = parseFloat(priceUsd);
      if (price <= 0) throw new Error('Invalid price value');
      
      return price;
    } catch (error) {
      console.error(`Attempt ${attempt} failed to fetch STORIES price:`, error);
      if (attempt === MAX_RETRIES) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
    }
  }
  throw new Error('Failed to fetch STORIES price after multiple attempts');
}

export async function POST(req: NextRequest) {
  try {
    const {
      step,
      story_id,
      wallet_address,
      signed_tx_base64,
    } = await req.json();

    // Basic validation
    if (!story_id || !wallet_address) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const connection = await getSolanaConnection();

    if (step === 'create') {
      try {
        // 1. Get current STORIES price and calculate required tokens
        const storiesPrice = await getStoriesPriceInUSD();
        const price_tokens = USD_PRICE / storiesPrice;
        const amountInSmallestUnit = Math.floor(price_tokens * 10 ** STORIES_DECIMALS);
    
        // 2. Validate wallet address and get token accounts
        const userPublicKey = new PublicKey(wallet_address);
        const treasuryPublicKey = new PublicKey(TREASURY_ADDRESS);
    
        const [fromTokenAccount, toTokenAccount] = await Promise.all([
          getAssociatedTokenAddress(STORIES_TOKEN_ADDRESS, userPublicKey),
          getAssociatedTokenAddress(STORIES_TOKEN_ADDRESS, treasuryPublicKey)
        ]);
    
        // 3. Check balances (both tokens and SOL)
        const [tokenAccountInfo, solBalance] = await Promise.all([
          getAccount(connection, fromTokenAccount).catch(() => null),
          connection.getBalance(userPublicKey)
        ]);
    
        // 4. Validate balances
        const MIN_SOL_BALANCE = 0.01 * 1e9; // 0.01 SOL in lamports
        
        if (!tokenAccountInfo) {
          return NextResponse.json({
            success: false,
            error: 'NO_TOKEN_ACCOUNT',
            message: 'No STORIES token account found. You need to acquire STORIES tokens first.',
            requiredTokens: price_tokens,
            actionUrl: 'https://jup.ag/swap/SOL-STORY_W14DdQzkP8F3jzq4wWuo7pWQJNyvzQ7RZ7K7X5Y6q4E'
          }, { status: 400 });
        }
    
        if (BigInt(tokenAccountInfo.amount) < BigInt(amountInSmallestUnit)) {
          const currentBalance = Number(tokenAccountInfo.amount) / 10 ** STORIES_DECIMALS;
          return NextResponse.json({
            success: false,
            error: 'INSUFFICIENT_TOKENS',
            message: `Insufficient STORIES balance. Need ${price_tokens.toFixed(4)}, have ${currentBalance.toFixed(4)}`,
            requiredTokens: price_tokens,
            currentBalance,
            actionUrl: 'https://jup.ag/swap/SOL-STORY_W14DdQzkP8F3jzq4wWuo7pWQJNyvzQ7RZ7K7X5Y6q4E'
          }, { status: 400 });
        }
    
        if (solBalance < MIN_SOL_BALANCE) {
          return NextResponse.json({
            success: false,
            error: 'INSUFFICIENT_SOL',
            message: `Insufficient SOL for fees. Need at least 0.01 SOL`,
            requiredSol: 0.01,
            currentSol: solBalance / 1e9
          }, { status: 400 });
        }
    
        // 5. Create and prepare transaction
        const transferIx = createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          userPublicKey,
          amountInSmallestUnit
        );
    
        const priorityFeeIx = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: PRIORITY_FEE_LAMPORTS,
        });
    
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        
        const tx = new Transaction();
        tx.feePayer = userPublicKey;
        tx.recentBlockhash = blockhash;
        tx.add(priorityFeeIx, transferIx);
    
        // 6. Serialize and return
        const serializedTx = tx.serialize({ requireAllSignatures: false });
    
        return NextResponse.json({
          success: true,
          tx_base64: serializedTx.toString('base64'),
          price_tokens,
          price_usd: USD_PRICE,
          message: `Payment required: ${price_tokens.toFixed(4)} STORIES ($${USD_PRICE})`,
          validUntil: new Date(Date.now() + 120000).toISOString() // 2 minute validity
        });
    
      } catch (error) {
        console.error('Create transaction error:', error);
        
        // Special handling for common errors
        if (error instanceof Error) {
          if (error.message.includes('Invalid public key')) {
            return NextResponse.json({
              success: false,
              error: 'INVALID_WALLET',
              message: 'Invalid wallet address provided'
            }, { status: 400 });
          }
          
          if (error.message.includes('could not be resolved')) {
            return NextResponse.json({
              success: false,
              error: 'NETWORK_ERROR',
              message: 'Failed to connect to blockchain network'
            }, { status: 503 });
          }
        }
    
        // Generic error response
        return NextResponse.json({
          success: false,
          error: 'TRANSACTION_FAILED',
          message: 'Failed to create transaction',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    if (step === 'confirm') {
      if (!signed_tx_base64) {
        return NextResponse.json(
          { success: false, error: 'Missing signed transaction' },
          { status: 400 }
        );
      }
    
      try {
        // Deserialize the signed transaction
        const signedTx = Transaction.from(Buffer.from(signed_tx_base64, 'base64'));
    
        // Verify token transfer instruction exists
        const transferIx = signedTx.instructions.find(ix => 
          ix.programId.equals(TOKEN_PROGRAM_ID)
        );
        
        if (!transferIx) {
          throw new Error('No token transfer instruction found');
        }
    
        // Verify treasury account exists
        const treasuryPublicKey = new PublicKey(TREASURY_ADDRESS);
        const treasuryAccount = await connection.getAccountInfo(treasuryPublicKey);
        
        if (!treasuryAccount) {
          return NextResponse.json({
            success: false,
            error: 'TREASURY_ACCOUNT_MISSING',
            message: 'Treasury wallet account not found',
          }, { status: 400 });
        }
    
        // Verify treasury token account exists
        const treasuryTokenAccount = await getAssociatedTokenAddress(
          STORIES_TOKEN_ADDRESS,
          treasuryPublicKey
        );
    
        const treasuryTokenAccountInfo = await connection.getAccountInfo(treasuryTokenAccount);
        
        if (!treasuryTokenAccountInfo) {
          return NextResponse.json({
            success: false,
            error: 'TREASURY_TOKEN_ACCOUNT_MISSING',
            message: 'Treasury token account not found',
          }, { status: 400 });
        }
    
        // Process the payment transaction
        const txSignature = await connection.sendRawTransaction(
          signedTx.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
            maxRetries: 3
          }
        );
    
        const confirmation = await connection.confirmTransaction(
          txSignature,
          'confirmed'
        );
    
        if (confirmation.value.err) {
          throw new Error('Transaction failed to confirm');
        }
    
        // Save to database
        const { error: dbError } = await supabase.from('story_purchases').insert([
          {
            story_id,
            wallet_address,
            price_tokens: USD_PRICE,
            transaction_hash: txSignature,
            status: 'completed',
            purchased_at: new Date().toISOString(),
          },
        ]);
    
        if (dbError) throw dbError;
    
        return NextResponse.json({
          success: true,
          transaction_hash: txSignature,
          amount_usd: USD_PRICE,
          message: 'Payment successfully processed',
        });
    
      } catch (error) {
        console.error('Confirm transaction error:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'TRANSACTION_FAILED',
            message: error instanceof Error ? error.message : 'Transaction failed',
          },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { success: false, error: 'Invalid step parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}