'use client';

import React, { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { PublicKey, VersionedTransaction, Connection, Transaction } from '@solana/web3.js';
import axios from 'axios';
import { toast } from 'sonner';

// STORIES token constants
const STORIES_TOKEN_ADDRESS = new PublicKey('EvA88escD87zrzG7xo8WAM8jW6gJ5uQfeLL8Fj6DUZ2Q');
const STORIES_DECIMALS = 9;
const PAIR_ADDRESS = 'DwAnxaVPCkLCKigNt5kNZwUmJ3rbiVFmvLxgEgFyogAL';
const SOL_TOKEN = 'So11111111111111111111111111111111111111112';
const PRICE_REFRESH_INTERVAL = 10000; // 10 seconds
const QUOTE_EXPIRY_TIME = 10000; // 30 seconds

interface PairData {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: {
    address: string;
    name: string;
    symbol: string;
    logoURI?: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
    logoURI?: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h24?: {
      buys: number;
      sells: number;
    };
    m5?: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24?: number;
    m5?: number;
  };
  priceChange: {
    h24?: number;
    m5?: number;
  };
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: {
      url: string;
    }[];
    socials?: {
      platform: string;
      handle: string;
    }[];
  };
  boosts?: {
    active?: number;
  };
}

interface TokenData {
  pairs: PairData[];
}

interface QuoteResponse {
  outAmount: string;
  priceImpactPct: string;
  [key: string]: any;
}


const formatPrice = (quote: QuoteResponse) => {
  const solAmount = parseFloat(quote.inAmount) / 1e9;
  const STORIESAmount = parseFloat(quote.outAmount) / (10 ** STORIES_DECIMALS);
  return (STORIESAmount / solAmount).toFixed(4);
};

const formatLargeNumber = (num?: number) => {
  if (num === undefined) return 'N/A';
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(2)}B`;
  }
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp).toLocaleDateString();
};

async function getSolanaConnection(): Promise<Connection> {
  const endpoints = [
    {
      url: `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
      type: 'helius'
    },
    {
      url: 'https://api.mainnet-beta.solana.com',
      type: 'mainnet'
    },
    {
      url: 'https://solana-api.projectserum.com',
      type: 'serum'
    },
    {
      url: 'https://rpc.ankr.com/solana',
      type: 'ankr'
    }
  ];

  for (const endpoint of endpoints) {
    try {
      const connection = new Connection(endpoint.url, 'confirmed');
      await connection.getEpochInfo();
      console.log(`Connected to ${endpoint.type} RPC`);
      return connection;
    } catch (error) {
      console.warn(`Failed to connect to ${endpoint.type} RPC:`, error);
      continue;
    }
  }

  throw new Error('Unable to connect to any Solana RPC endpoint');
}

async function checkSTORIESBalance(walletAddress: string): Promise<number> {
  const connection = await getSolanaConnection();
  try {
    const publicKey = new PublicKey(walletAddress);
    const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      mint: STORIES_TOKEN_ADDRESS,
    });

    if (accounts.value.length === 0) return 0;
    return accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
  } catch (error) {
    console.error('Balance check error:', error);
    throw new Error('Failed to check STORIES balance');
  }
}

async function checkSOLBalance(walletAddress: string): Promise<number> {
  const connection = await getSolanaConnection();
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9;
  } catch (error) {
    console.error("Error checking SOL balance:", error);
    throw new Error("Failed to check SOL balance");
  }
}

export const DexScreenerSwap = () => {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<any>("solana");
  const [pairData, setPairData] = useState<PairData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [solAmount, setSolAmount] = useState<string>('1');
  const [usdAmount, setUsdAmount] = useState<string>('');
  const [inputMode, setInputMode] = useState<'SOL' | 'USD'>('SOL');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'swap' | 'info'>('swap');
  const [STORIESBalance, setSTORIESBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [quoteExpiry, setQuoteExpiry] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number>(0);

  const calculateSolToUsd = (solAmount: string) => {
    if (!solAmount) return '0.00';
    const amount = parseFloat(solAmount) || 0;
    return (amount * solPrice).toFixed(2);
  };

  const calculateUsdToSol = (usdAmount: string) => {
    if (!usdAmount || solPrice === 0) return '0';
    const amount = parseFloat(usdAmount) || 0;
    if (amount <= 0) return '0';
    return (amount / solPrice).toFixed(9); // More precision for small amounts
  };

  const fetchPairData = async () => {
    try {
      const [pairResponse, tokenResponse] = await Promise.all([
        axios.get(`https://api.dexscreener.com/latest/dex/pairs/solana/${PAIR_ADDRESS}`),
        axios.get(`https://api.dexscreener.com/latest/dex/tokens/${STORIES_TOKEN_ADDRESS.toString()}`)
      ]);
      
      const pair = pairResponse.data.pairs?.[0] || null;
      setPairData(pair);
      
      if (pair?.priceUsd && pair?.priceNative) {
        const calculatedSolPrice = parseFloat(pair.priceUsd) / parseFloat(pair.priceNative);
        setSolPrice(calculatedSolPrice);
      }
      
      setTokenData({
        pairs: tokenResponse.data.pairs || []
      });
      
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const getQuote = async () => {
    try {
      let amountToUse = '';
      if (inputMode === 'SOL') {
        amountToUse = solAmount;
      } else {
        const solValue = calculateUsdToSol(usdAmount);
        amountToUse = solValue === '0.00' ? '0' : solValue; // Handle conversion
      }
  
      // Validate the amount
      const amountInLamports = parseFloat(amountToUse) * 10 ** 9;
      if (isNaN(amountInLamports) || amountInLamports <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
  
      setLoading(true);
      const response = await axios.get(
        `https://quote-api.jup.ag/v6/quote?inputMint=${SOL_TOKEN}&outputMint=${STORIES_TOKEN_ADDRESS.toString()}&amount=${Math.floor(amountInLamports)}&slippageBps=${Math.floor(slippage * 100)}`
      );
      
      const quoteData = response.data;
      if (quoteData.priceImpactPct) {
        quoteData.priceImpactPct = parseFloat(quoteData.priceImpactPct).toFixed(2);
      }
      
      setQuote(quoteData);
      setQuoteExpiry(Date.now() + QUOTE_EXPIRY_TIME);
    } catch (error) {
      console.error('Error getting quote:', error);
      if (axios.isAxiosError(error)) {
        toast.error(`Failed to get swap quote: ${error.response?.data?.message || error.message}`);
      } else {
        toast.error(`Failed to get swap quote: ${String(error)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const isQuoteValid = () => {
    if (!quote || !quoteExpiry) return false;
    return Date.now() < quoteExpiry;
  };

  const executeSwap = async () => {
    if (!isQuoteValid()) {
      toast.error('Price quote expired. Please refresh the quote.');
      await getQuote();
      return;
    }
    try {
      setTxStatus('Preparing transaction...');
      setLoading(true);
      
      const swapResponse = await axios.post('https://quote-api.jup.ag/v6/swap', {
        quoteResponse: quote,
        userPublicKey: address?.toString() || '',
        wrapAndUnwrapSol: true,
      });
      
      const swapTransactionBuf = Buffer.from(swapResponse.data.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      setTxStatus('Awaiting wallet approval...');
      
      const signedTx = await walletProvider.signTransaction(transaction);
      const rawTransaction = signedTx.serialize();
      const connection = await getSolanaConnection();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      
      setTxStatus('Confirming transaction...');
      await connection.confirmTransaction(txid, 'confirmed');
      
      toast.success(`Swap successful! TX: ${txid}`);
      setTxStatus('');
      setLoading(false);
      
      fetchPairData();
      checkBalances();
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed. See console for details.');
      setTxStatus('');
      setLoading(false);
    }
  };

  const checkBalances = async () => {
    if (!address) return;
    
    try {
      const [STORIESBal, solBal] = await Promise.all([
        checkSTORIESBalance(address).catch(() => 0),
        checkSOLBalance(address).catch(() => 0)
      ]);
      setSTORIESBalance(STORIESBal);
      setSolBalance(solBal);
    } catch (error) {
      console.error('Error checking balances:', error);
      toast.error('Failed to check balances');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'swap') {
        fetchPairData();
        if ((inputMode === 'SOL' && solAmount) || (inputMode === 'USD' && usdAmount)) {
          getQuote();
        }
      }
    }, PRICE_REFRESH_INTERVAL);
  
    return () => clearInterval(interval);
  }, [activeTab, solAmount, usdAmount, inputMode, isConnected]);

  useEffect(() => {
    fetchPairData();
    const interval = setInterval(fetchPairData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (address) {
      checkBalances();
    }
  }, [address]);

  useEffect(() => {
    if ((inputMode === 'SOL' && solAmount) || (inputMode === 'USD' && usdAmount)) {
      const debounceTimer = setTimeout(() => {
        getQuote();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [solAmount, usdAmount, inputMode, slippage, isConnected]);

  const handleSolAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSolAmount(value);
    if (solPrice > 0) {
      setUsdAmount(calculateSolToUsd(value));
    }
  };

  const handleUsdAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsdAmount(value);
    if (solPrice > 0) {
      setSolAmount(calculateUsdToSol(value));
    }
  };

  if (loading && !pairData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 bg-[#FFDE7A]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] rounded-2xl overflow-hidden shadow-lg border border-[#2A2A2A] max-w-2xl mx-auto">
      {/* Header with logo */}
      <div className="p-6 border-b border-[#2A2A2A]">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {pairData?.baseToken.logoURI && (
              <img 
                src={pairData.baseToken.logoURI} 
                alt={pairData.baseToken.symbol}
                className="w-10 h-10 rounded-full"
              />
            )}
            <h2 className="text-2xl font-bold text-white">STORIES Swap</h2>
          </div>
          <div className={`text-xl font-bold ${
            (pairData?.priceChange.h24 || 0) >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {(pairData?.priceChange.h24 || 0).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-[#333333] rounded-lg p-1 mb-4">
        <button
          onClick={() => setActiveTab('swap')}
          className={`flex-1 py-4 font-medium text-lg rounded-md ${
            activeTab === 'swap' 
              ? 'bg-[#FFDE7A] text-black' 
                : 'text-gray-400 hover:bg-[#2A2A2A]'
          }`}
        >
          Swap
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-4 font-medium text-lg rounded-md ${
            activeTab === 'info' 
              ? 'bg-[#FFDE7A] text-black' 
                : 'text-gray-400 hover:bg-[#2A2A2A]'
          }`}
        >
          Token Info
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'swap' ? (
          <>
            {/* Swap Form */}
            <div className="space-y-6">
              {/* Input Mode Toggle */}
              <div className="flex bg-[#333333] rounded-lg p-1 mb-4">
          <button
            onClick={() => setInputMode('SOL')}
            className={`flex-1 py-2 rounded-md ${
              inputMode === 'SOL' 
                ? 'bg-[#FFDE7A] text-black' 
                : 'text-gray-400 hover:bg-[#2A2A2A]'
            }`}
          >
            SOL
          </button>
          <button
            onClick={() => setInputMode('USD')}
            className={`flex-1 py-2 rounded-md ${
              inputMode === 'USD' 
                ? 'bg-[#FFDE7A] text-black' 
                : 'text-gray-400 hover:bg-[#2A2A2A]'
            }`}
          >
            USD
          </button>
        </div>

              {/* Input Section */}
              <div className="bg-[#FFDE7A] rounded-xl p-4 border border-[#333333]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-black font-medium">You pay</span>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-black">
                      Balance: {solBalance !== null ? solBalance.toFixed(4) : '-'} SOL
                    </span>
                    {inputMode === 'SOL' && (
                      <span className="text-sm font-medium text-black">
                        ≈ ${calculateSolToUsd(solAmount)} USD
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={inputMode === 'SOL' ? solAmount : usdAmount}
                    onChange={inputMode === 'SOL' ? handleSolAmountChange : handleUsdAmountChange}
                    className="flex-1 bg-transparent text-black text-2xl font-medium outline-none placeholder-[#555555]"
                    placeholder="0.0"
                    min="0"
                    step={inputMode === 'SOL' ? "0.1" : "0.01"}
                  />
                  <div className="bg-[#333333] rounded-lg px-4 py-2">
                    <span className="font-medium text-white">
                      {inputMode === 'SOL' ? 'SOL' : 'USD'}
                    </span>
                  </div>
                </div>
                {inputMode === 'USD' && (
                  <div className="mt-2 text-xs text-[#777777]">
                    ≈ {solAmount} SOL
                  </div>
                )}
              </div>

              {/* Output Section */}
              <div className="bg-[#FFDE7A] rounded-xl p-4 border border-[#333333]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-black font-medium">You receive</span>
                  <span className=" text-black font-medium">
                    Balance: {STORIESBalance !== null ? STORIESBalance.toLocaleString() : '-'} STORIES
                  </span>
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={quote ? (parseFloat(quote.outAmount) / 10 ** STORIES_DECIMALS).toFixed(4) : '0.0'}
                    readOnly
                    className="flex-1 bg-transparent text-black text-2xl font-medium outline-none"
                  />
                  <div className="bg-[#333333] rounded-lg px-4 py-2">
                    <span className="font-medium text-white">STORIES</span>
                  </div>
                </div>
                {quote && (
                  <div className="mt-2 text-xs text-black font-medium">
                    ≈ ${(parseFloat(quote.outAmount) / 10 ** STORIES_DECIMALS * parseFloat(pairData?.priceUsd || '0')).toFixed(2)} USD
                  </div>
                )}
              </div>

              {/* Price Info */}
              {quote && (
                <div className="bg-[#222222] rounded-xl p-4 border border-[#333333] space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA]">Exchange Rate</span>
                    <span className="font-medium text-white">
                      1 SOL = {formatPrice(quote)} STORIES
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA]">SOL Price</span>
                    <span className="font-medium text-white">
                      ${solPrice.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA]">Minimum Received</span>
                    <span className="font-medium text-white">
                      {(parseFloat(quote.outAmount) / 10 ** STORIES_DECIMALS * (1 - slippage / 100)).toFixed(4)} STORIES
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#AAAAAA]">Price Impact</span>
                    <span className={parseFloat(quote.priceImpactPct) > 1 ? 'text-red-400' : 'text-green-400'}>
                      {quote.priceImpactPct}%
                    </span>
                  </div>
                </div>
              )}

              {/* Slippage Settings */}
              <div className="bg-[#222222] rounded-xl p-4 border border-[#333333]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#AAAAAA]">Slippage Tolerance</span>
                  <span className="text-sm text-[#FFDE7A]">
                    {slippage}%
                  </span>
                </div>
                <div className="flex gap-2">
                  {[0.5, 1, 2].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`flex-1 py-3 rounded-lg text-sm font-medium ${
                        slippage === value 
                          ? 'bg-[#FFDE7A] text-black'
                    : 'bg-[#333333] text-gray-400 hover:bg-[#3A3A3A]'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={slippage}
                      onChange={(e) => setSlippage(Math.min(10, Math.max(0.1, parseFloat(e.target.value) || 0.5)))}
                      className="w-full h-full py-3 px-4 bg-[#333333] rounded-lg text-right text-white outline-none"
                      min="0.1"
                      max="10"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-3 text-[#AAAAAA]">%</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    fetchPairData();
                    getQuote();
                  }}
                  disabled={loading}
                  className="flex-1 py-4 bg-[#333333] hover:bg-[#3A3A3A] text-white rounded-xl disabled:opacity-50 transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={executeSwap}
                  disabled={loading || !quote || !isConnected || !isQuoteValid()}
                  className="flex-1 py-4 bg-gradient-to-r from-[#FFDE7A] to-[#FFC850] hover:opacity-90 text-white text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {!isConnected ? 'Connect Wallet' : loading ? 'Processing...' : 'Swap Now'}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Token Info Tab */
          <div className="space-y-6">
            {/* Market Data Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Market Cap', value: pairData?.marketCap },
                { label: 'FDV', value: pairData?.fdv },
                { label: 'Liquidity', value: pairData?.liquidity?.usd },
                { label: 'Volume (24h)', value: pairData?.volume?.h24 },
                { label: 'Transactions (24h)', value: pairData?.txns.h24 ? (pairData.txns.h24.buys + pairData.txns.h24.sells) : undefined },
                { label: 'Created', value: pairData?.pairCreatedAt ? formatDate(pairData.pairCreatedAt) : undefined },
              ].map((item, index) => (
                <div key={index} className="bg-[#222222] rounded-xl p-4 border border-[#333333]">
                  <p className="text-[#AAAAAA] text-sm mb-1">{item.label}</p>
                  <p className="text-white font-medium">
                    {item.value ? 
                      (typeof item.value === 'number' ? formatLargeNumber(item.value) : item.value) 
                      : 'N/A'}
                  </p>
                </div>
              ))}
            </div>

            {/* Token Details */}
            <div className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
              <h3 className="text-xl font-bold text-white mb-4">Token Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[#AAAAAA]">Pair Address</span>
                  <span className="text-[#00A3FF] font-mono text-sm break-all text-right">
                    {pairData?.pairAddress || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAAAAA]">Base Token</span>
                  <span className="text-white">
                    {pairData?.baseToken.symbol} ({pairData?.baseToken.name})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAAAAA]">Quote Token</span>
                  <span className="text-white">
                    {pairData?.quoteToken.symbol} ({pairData?.quoteToken.name})
                  </span>
                </div>
              </div>
            </div>

            {/* View on DexScreener Button */}
            <a
              href={`https://dexscreener.com/solana/${PAIR_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-[#333333] hover:bg-[#3A3A3A] text-center rounded-xl font-medium transition-colors"
            >
              View on DexScreener
            </a>
          </div>
        )}
      </div>
    </div>
  );
};