'use client';

import React, { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { PublicKey, VersionedTransaction, Connection, Transaction } from '@solana/web3.js';
import axios from 'axios';
import { toast } from 'sonner';


// STORIES token constants
const STORIES_TOKEN_ADDRESS = new PublicKey('EvA88escD87zrzG7xo8WAM8jW6gJ5uQfeLL8Fj6DUZ2Q');
const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY_ADDRESS!;

const STORIES_DECIMALS = 6;
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
const formatSolUsdPrice = (pairData: PairData | null) => {
  if (!pairData || !pairData.priceNative || parseFloat(pairData.priceNative) === 0) return '0.00';
  const STORIESPriceUsd = parseFloat(pairData.priceUsd);
  const solToSTORIES = parseFloat(pairData.priceNative);
  return (STORIESPriceUsd / solToSTORIES).toFixed(2);
};
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
  const [amount, setAmount] = useState<string>('1');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [loading, setLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'swap' | 'info'>('swap');
  const [STORIESBalance, setSTORIESBalance] = useState<number | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
const [quoteExpiry, setQuoteExpiry] = useState<number | null>(null);

const fetchPairData = async () => {
  try {
    const [pairResponse, tokenResponse] = await Promise.all([
      axios.get(`https://api.dexscreener.com/latest/dex/pairs/solana/${PAIR_ADDRESS}`),
      axios.get(`https://api.dexscreener.com/latest/dex/tokens/${STORIES_TOKEN_ADDRESS.toString()}`)
    ]);
    
    const pair = pairResponse.data.pairs?.[0] || null;
    setPairData(pair);
    
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
    if (!amount || parseFloat(amount) <= 0) return;
    
    setLoading(true);
    const response = await axios.get(
      `https://quote-api.jup.ag/v6/quote?inputMint=${SOL_TOKEN}&outputMint=${STORIES_TOKEN_ADDRESS.toString()}&amount=${parseFloat(amount) * 10 ** 9}&slippageBps=${slippage * 100}`
    );
    
    const quoteData = response.data;
    if (quoteData.priceImpactPct) {
      quoteData.priceImpactPct = parseFloat(quoteData.priceImpactPct).toFixed(2);
    }
    
    setQuote(quoteData);
    setQuoteExpiry(Date.now() + QUOTE_EXPIRY_TIME);
  } catch (error) {
    console.error('Error getting quote:', error);
    toast.error('Failed to get swap quote');
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
        if (amount && isConnected) {
          getQuote();
        }
      }
    }, PRICE_REFRESH_INTERVAL);
  
    return () => clearInterval(interval);
  }, [activeTab, amount, isConnected]);

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
    if (amount && isConnected) {
      const debounceTimer = setTimeout(() => {
        getQuote();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [amount, slippage, isConnected]);

  if (loading && !pairData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('swap')}
          className={`flex-1 py-4 font-medium ${activeTab === 'swap' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
        >
          Swap
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-4 font-medium ${activeTab === 'info' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'}`}
        >
          Token Info
        </button>
      </div>

      {activeTab === 'swap' ? (
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-300">You pay</label>
              <span className="text-sm text-gray-400">
                Balance: {solBalance !== null ? solBalance.toFixed(4) : '-'} SOL
              </span>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 flex items-center">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-transparent text-white text-xl outline-none"
                placeholder="0.0"
                min="0"
                step="0.1"
              />
              <div className="flex items-center bg-gray-600 rounded-full px-3 py-1">
                <span className="font-medium">SOL</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-300">You receive</label>
              <span className="text-sm text-gray-400">
                Balance: {STORIESBalance !== null ? STORIESBalance.toLocaleString() : '-'} STORIES
              </span>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 flex items-center">
              <input
                type="text"
                value={quote ? (parseFloat(quote.outAmount) / 10 ** STORIES_DECIMALS) : '0.0'}
                readOnly
                className="flex-1 bg-transparent text-white text-xl outline-none"
              />
              <div className="flex items-center bg-gray-600 rounded-full px-3 py-1">
                <span className="font-medium">STORIES</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Slippage Tolerance</label>
            <div className="flex gap-2">
              {[0.5, 1, 2].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`flex-1 py-2 rounded-lg ${slippage === value ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  {value}%
                </button>
              ))}
              <div className="relative flex-1">
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(Math.min(10, Math.max(0.1, parseFloat(e.target.value) || 0.5)))}
                  className="w-full py-2 px-3 bg-gray-700 rounded-lg text-right text-gray-300 outline-none"
                  min="0.1"
                  max="10"
                  step="0.1"
                />
                <span className="absolute right-3 top-2 text-gray-400">%</span>
              </div>
            </div>
          </div>

          {quote && (
            <div className="mb-6 bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Price</span>
                <span className="font-medium">
                  1 SOL = {quote ? formatPrice(quote) : '0.0000'} STORIES
                </span>
              </div>
              <div className="flex justify-between mb-2">
  <span className="text-gray-400">Price</span>
  <span className="font-medium">
    1 SOL = ${formatSolUsdPrice(pairData)} USD
  </span>
</div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Minimum received</span>
                <span className="font-medium">
                  {(parseFloat(quote.outAmount) / 10 ** STORIES_DECIMALS * (1 - slippage / 100)).toFixed(4)} STORIES
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price impact</span>
                <span className={parseFloat(quote.priceImpactPct) > 1 ? 'text-red-400' : 'text-green-400'}>
                  {quote.priceImpactPct}%
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-400 text-right">
    Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
    {!isQuoteValid() && (
      <span className="ml-2 text-yellow-400">(Quote expired)</span>
    )}
  </div>
            </div>
          )}

<div className="flex gap-3">
  <button
    onClick={() => {
      fetchPairData();
      getQuote();
    }}
    disabled={loading}
    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50"
  >
    Refresh Prices
  </button>
  <button
  onClick={executeSwap} // Directly call executeSwap without balance check
  disabled={loading || !quote || !isConnected || !isQuoteValid()}
  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  {!isConnected ? 'Connect Wallet' : loading ? 'Processing...' : 'Swap'}
</button>
</div>
          {txStatus && (
            <div className="mt-4 text-center text-blue-400">
              {txStatus}
            </div>
          )}
        </div>
      ) : (
        <div className="p-6">
          {pairData && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  {pairData.baseToken.logoURI && (
                    <img 
                      src={pairData.baseToken.logoURI} 
                      alt={pairData.baseToken.symbol}
                      className="w-12 h-12 mr-3 rounded-full"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{pairData.baseToken.symbol}/{pairData.quoteToken.symbol}</h2>
                    <p className="text-gray-400">${parseFloat(pairData.priceUsd).toFixed(6)}</p>
                  </div>
                </div>
                <div className={`text-xl font-bold ${
                  (pairData.priceChange.h24 || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(pairData.priceChange.h24 || 0).toFixed(2)}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Market Cap</p>
                  <p className="text-lg font-medium">
                    {pairData.marketCap ? formatLargeNumber(pairData.marketCap) : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">FDV</p>
                  <p className="text-lg font-medium">
                    {pairData.fdv ? formatLargeNumber(pairData.fdv) : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Liquidity</p>
                  <p className="text-lg font-medium">
                    {pairData.liquidity?.usd ? formatLargeNumber(pairData.liquidity.usd) : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Volume (24h)</p>
                  <p className="text-lg font-medium">
                    {pairData.volume?.h24 ? formatLargeNumber(pairData.volume.h24) : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Transactions (24h)</p>
                  <p className="text-lg font-medium">
                    {pairData.txns.h24 ? (pairData.txns.h24.buys + pairData.txns.h24.sells).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Buy/Sell Ratio</p>
                  <p className="text-lg font-medium">
                    {pairData.txns.h24 ? 
                      (pairData.txns.h24.buys / (pairData.txns.h24.sells || 1)).toFixed(2) : 'N/A'}:1
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Created</p>
                  <p className="text-lg font-medium">
                    {formatDate(pairData.pairCreatedAt)}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">DEX</p>
                  <p className="text-lg font-medium capitalize">
                    {pairData.dexId || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Token Details</h3>
                <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chain</span>
                    <span className="font-medium capitalize">{pairData.chainId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Token</span>
                    <span className="font-medium">{pairData.baseToken.symbol} ({pairData.baseToken.name})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quote Token</span>
                    <span className="font-medium">{pairData.quoteToken.symbol} ({pairData.quoteToken.name})</span>
                  </div>
                  {pairData.labels && pairData.labels.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Labels</span>
                      <div className="flex gap-2">
                        {pairData.labels.map((label, index) => (
                          <span key={index} className="bg-blue-600/30 text-blue-300 px-2 py-1 rounded text-xs">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {pairData.info && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Links</h3>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex flex-wrap gap-3">
                      {pairData.info.websites?.map((site, index) => (
                        <a 
                          key={index} 
                          href={site.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-3 py-2 rounded text-sm"
                        >
                          Website
                        </a>
                      ))}
                      {pairData.url && (
                        <a 
                          href={pairData.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-green-600/30 hover:bg-green-600/50 text-green-300 px-3 py-2 rounded text-sm"
                        >
                          DexScreener
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Contract Addresses</h3>
                <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Pair Address</p>
                    <code className="text-sm text-blue-400 break-all">{pairData.pairAddress}</code>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Base Token ({pairData.baseToken.symbol})</p>
                    <code className="text-sm text-blue-400 break-all">{pairData.baseToken.address}</code>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Quote Token ({pairData.quoteToken.symbol})</p>
                    <code className="text-sm text-blue-400 break-all">{pairData.quoteToken.address}</code>
                  </div>
                </div>
              </div>
            </>
          )}

          {tokenData && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3">Other Pairs</h3>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <p className="text-gray-400 mb-2">Total Pairs: <span className="text-white">{tokenData.pairs.length}</span></p>
                {tokenData.pairs.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                          <th className="text-left py-2">DEX</th>
                          <th className="text-left py-2">Pair</th>
                          <th className="text-right py-2">Price</th>
                          <th className="text-right py-2">Liquidity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokenData.pairs.slice(0, 5).map((pair, index) => (
                          <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                            <td className="py-3 capitalize">{pair.dexId}</td>
                            <td className="py-3">
                              {pair.baseToken.symbol}/{pair.quoteToken.symbol}
                            </td>
                            <td className="py-3 text-right">
                              ${parseFloat(pair.priceUsd).toFixed(6)}
                            </td>
                            <td className="py-3 text-right">
                              {pair.liquidity?.usd ? formatLargeNumber(pair.liquidity.usd) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6">
            <a
              href={`https://dexscreener.com/solana/${PAIR_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 text-center rounded-lg font-medium transition-colors"
            >
              View on DexScreener
            </a>
          </div>
        </div>
      )}
    </div>
  );
};