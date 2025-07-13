"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import CustomButton from "@/components/common/Button";
import axios from "axios";
import { toast } from "sonner";

// Token constants
const STORIES_TOKEN_ADDRESS = new PublicKey('EvA88escD87zrzG7xo8WAM8jW6gJ5uQfeLL8Fj6DUZ2Q');
const STORIES_DECIMALS = 9;
const SOL_TOKEN = 'So11111111111111111111111111111111111111112';
const QUOTE_EXPIRY_TIME = 30000; // 30 seconds

interface TradeModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

export default function TradeModal({ isOpen, onCloseAction }: TradeModalProps) {
  const [inputMode, setInputMode] = useState<'SOL' | 'USD'>('SOL');
  const [solAmount, setSolAmount] = useState('0');
  const [usdAmount, setUsdAmount] = useState('0');
  const [toAmount, setToAmount] = useState('0');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [quoteExpiry, setQuoteExpiry] = useState<number | null>(null);
  const [slippage, setSlippage] = useState(0.5);
  const [solPrice, setSolPrice] = useState(0);

  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  // Fetch SOL price when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSolPrice();
    }
  }, [isOpen]);

  const fetchSolPrice = async () => {
    try {
      // First try to get SOL price from Jupiter
      try {
        const jupResponse = await axios.get('https://price.jup.ag/v4/price?ids=SOL');
        setSolPrice(jupResponse.data.data.SOL.price);
        return;
      } catch (jupError) {
        console.log('Falling back to DexScreener for price data');
      }
  
      // Fallback to DexScreener
      try {
        const pairResponse = await axios.get(
          `https://api.dexscreener.com/latest/dex/pairs/solana/DwAnxaVPCkLCKigNt5kNZwUmJ3rbiVFmvLxgEgFyogAL`
        );
        
        const pair = pairResponse.data.pairs?.[0] || null;
        if (pair?.priceUsd && pair?.priceNative) {
          const calculatedSolPrice = parseFloat(pair.priceUsd) / parseFloat(pair.priceNative);
          setSolPrice(calculatedSolPrice);
          return;
        }
      } catch (dexscreenerError) {
        console.log('Falling back to CoinGecko for price data');
      }
  
      // Final fallback to CoinGecko
      const coingeckoResponse = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
      );
      setSolPrice(coingeckoResponse.data.solana.usd);
    } catch (error) {
      console.error('All price fetch methods failed:', error);
      toast.error('Failed to fetch SOL price');
      setSolPrice(0); // Default value
    }
  };

  const calculateSolToUsd = (solAmount: string) => {
    if (!solAmount) return '0.00';
    const amount = parseFloat(solAmount) || 0;
    return (amount * solPrice).toFixed(2);
  };

  const calculateUsdToSol = (usdAmount: string) => {
    if (!usdAmount || solPrice === 0) return '0';
    const amount = parseFloat(usdAmount) || 0;
    if (amount <= 0) return '0';
    return (amount / solPrice).toFixed(9);
  };

  const isQuoteValid = () => {
    if (!quote || !quoteExpiry) return false;
    return Date.now() < quoteExpiry;
  };

  const getQuote = async () => {
    try {
      let amountToUse = '';
      if (inputMode === 'SOL') {
        amountToUse = solAmount;
      } else {
        const solValue = calculateUsdToSol(usdAmount);
        amountToUse = solValue === '0.00' ? '0' : solValue;
      }

      const amountInLamports = parseFloat(amountToUse) * 10 ** 9;
      if (isNaN(amountInLamports) || amountInLamports <= 0) {
        setToAmount('0');
        setQuote(null);
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
      setToAmount((quoteData.outAmount / 10 ** STORIES_DECIMALS).toFixed(4));
    } catch (error) {
      console.error('Error getting quote:', error);
      toast.error('Failed to get swap quote');
      setToAmount('0');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!isQuoteValid()) {
      toast.error('Price quote expired. Please refresh the quote.');
      await getQuote();
      return;
    }

    if (!publicKey || !signTransaction || !quote) return;
    
    try {
      setLoading(true);
      
      const swapResponse = await axios.post('https://quote-api.jup.ag/v6/swap', {
        quoteResponse: quote,
        userPublicKey: publicKey.toString(),
        wrapAndUnwrapSol: true,
      });
      
      const swapTransactionBuf = Buffer.from(swapResponse.data.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      const signedTx = await signTransaction(transaction);
      const rawTransaction = signedTx.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      
      await connection.confirmTransaction(txid, 'confirmed');
      
      toast.success(`Swap successful! TX: ${txid}`);
      onCloseAction(); // Close modal on success
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed. See console for details.');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      getQuote();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [solAmount, usdAmount, inputMode, slippage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#141414]/40 backdrop-blur-sm flex items-center justify-center z-150 px-4">
      <div className="bg-[#141414] rounded-3xl p-6 w-full shadow-2xl relative max-w-[450px]">
        <button 
          onClick={onCloseAction} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>

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

        {/* From Token Section */}
        <div className="bg-[#FFDE7A] rounded-2xl p-4 mb-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-black font-medium">{inputMode === 'SOL' ? 'SOL' : 'USD'}</span>
          </div>
          <input
            type="number"
            value={inputMode === 'SOL' ? solAmount : usdAmount}
            onChange={inputMode === 'SOL' ? handleSolAmountChange : handleUsdAmountChange}
            className="text-black bg-transparent text-3xl font-bold text-right outline-none w-full"
            placeholder="0.00"
            min="0"
            step={inputMode === 'SOL' ? "0.01" : "0.01"}
          />
          {inputMode === 'SOL' && (
            <div className="text-right text-sm text-black/70">
              ≈ ${calculateSolToUsd(solAmount)} USD
            </div>
          )}
          {inputMode === 'USD' && (
            <div className="text-right text-sm text-black/70">
              ≈ {solAmount} SOL
            </div>
          )}
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-1 z-10 relative">
          <button
            className="bg-[#141414] border-4 border-[#FFDE7A] rounded-full p-3"
          >
            <ArrowUpDown className="text-[#FFDE7A]" size={20} />
          </button>
        </div>

        {/* To Token Section (STORIES) */}
        <div className="bg-[#FFDE7A] rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-black font-medium">STORIES</span>
          </div>
          <div className="text-black text-3xl font-bold text-right">
            {toAmount}
          </div>
          {quote && (
            <div className="text-right text-sm text-black/70">
              ≈ ${(parseFloat(toAmount) * (quote.priceUsd || 0)).toFixed(2)} USD
            </div>
          )}
        </div>

        {/* Price Info */}
        {quote && (
          <div className="bg-[#333333] rounded-xl p-4 mb-4 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Exchange Rate</span>
              <span className="text-white">
                1 SOL = {(parseFloat(toAmount) / parseFloat(inputMode === 'SOL' ? solAmount || '1' : calculateUsdToSol(usdAmount) || '1')).toFixed(4)} STORIES
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Price Impact</span>
              <span className={parseFloat(quote.priceImpactPct) > 1 ? 'text-red-400' : 'text-green-400'}>
                {quote.priceImpactPct}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Minimum Received</span>
              <span className="text-white">
                {(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(4)} STORIES
              </span>
            </div>
          </div>
        )}

        {/* Slippage Settings */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">Slippage Tolerance</span>
            <span className="text-[#FFDE7A] text-sm">{slippage}%</span>
          </div>
          <div className="flex gap-2">
            {[0.5, 1, 2].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`flex-1 py-2 rounded-lg text-sm ${
                  slippage === value
                    ? 'bg-[#FFDE7A] text-black'
                    : 'bg-[#333333] text-gray-400 hover:bg-[#3A3A3A]'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {/* Swap Button */}
        <CustomButton
          text={loading ? "Processing..." : "Swap Now"}
          className="w-full py-4 text-lg bg-gradient-to-r from-[#FFDE7A] to-[#FFC850] hover:opacity-90 text-black font-bold"
          onClick={executeSwap}
          disabled={loading || !quote || !isQuoteValid() || parseFloat(inputMode === 'SOL' ? solAmount : usdAmount) <= 0}
        />
      </div>
    </div>
  );
}