import React, { useState, useEffect } from 'react';
import { User, Clock, Gift } from 'lucide-react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { PublicKey, Transaction } from '@solana/web3.js';
import axios from 'axios';
import { toast } from 'sonner';
import { useAppKit } from '@reown/appkit/react';
import type { Provider } from "@reown/appkit-adapter-solana/react";

interface Author {
  id: number;
  username: string;
  wallet_address: string;
}

interface Story {
  id: number;
  title: string;
  content: string;
  price_tokens: number; // This will now represent USD value
  status: string;
  created_at: string;
  author: Author;
}

interface StorySnippetModalProps {
  story: Story;
  isOpen: boolean;
  onClose: () => void;
  onReadFullStory: () => void;
}

export const StorySnippetModal: React.FC<StorySnippetModalProps> = ({
  story,
  isOpen,
  onClose,
  onReadFullStory,
}) => {
  const { address, isConnected } = useAppKitAccount();
  const [isCheckingPurchase, setIsCheckingPurchase] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [storiesPrice, setStoriesPrice] = useState<number | null>(null);
  const [requiredTokens, setRequiredTokens] = useState<number | null>(null);
  const { walletProvider: solanaWalletProvider } = useAppKitProvider<Provider>('solana');

  // Fetch STORIES token price when component mounts
  useEffect(() => {
    const fetchStoriesPrice = async () => {
      try {
        const response = await axios.get('https://api.dexscreener.com/latest/dex/pairs/solana/DwAnxaVPCkLCKigNt5kNZwUmJ3rbiVFmvLxgEgFyogAL');
        const priceUsd = response.data.pairs?.[0]?.priceUsd;
        if (priceUsd) {
          const price = parseFloat(priceUsd);
          setStoriesPrice(price);
          setRequiredTokens(9/ price); // $9 worth of STORIES tokens
        }
      } catch (error) {
        console.error('Error fetching STORIES price:', error);
        toast.error('Failed to fetch current STORIES price');
      }
    };

    fetchStoriesPrice();
  }, []);

  if (!isOpen) return null;

  const handleReadFullStory = async () => {
    if (!isConnected || !address) {
      setShowConnectModal(true);
      return;
    }

    setIsCheckingPurchase(true);
    try {
      const response = await axios.post('/api/story-purchase/check', {
        story_id: story.id,
        wallet_address: address,
      });

      if (response.data.purchase) {
        onReadFullStory();
      } else {
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error('Error checking purchase:', error);
      toast.error('Failed to check story purchase status');
    } finally {
      setIsCheckingPurchase(false);
    }
  };

  const handlePayment = async () => {
    if (!address || !isConnected || !requiredTokens) return;
    setIsProcessingPayment(true);
  
    try {
      // Step 1: Request unsigned tx from backend
      const createTxRes = await axios.post('/api/story-purchase/pay', {
        step: 'create',
        story_id: story.id,
        wallet_address: address,
      });
  
      // Handle specific error cases
      if (createTxRes.data.error === 'INSUFFICIENT_TOKENS') {
        toast.error(
          <div>
            <p>Not enough STORIES tokens!</p>
            <p>You need {createTxRes.data.requiredTokens?.toFixed(4) || 'some'} STORIES</p>
            <button 
              onClick={() => window.open('https://jup.ag/swap/SOL-STORY_W14DdQzkP8F3jzq4wWuo7pWQJNyvzQ7RZ7K7X5Y6q4E', '_blank')}
              className="mt-2 text-blue-500 underline"
            >
              Get STORIES Tokens
            </button>
          </div>,
          { duration: 10000 }
        );
        return;
      }
  
      if (createTxRes.data.error === 'INSUFFICIENT_SOL') {
        toast.error(
          `You need at least ${createTxRes.data.requiredSol || 0.01} SOL for transaction fees`,
          { duration: 8000 }
        );
        return;
      }
  
      const tx_base64 = createTxRes.data.tx_base64;
      if (!tx_base64) throw new Error('Failed to get transaction');
  
      // Step 2: Deserialize and sign tx
      const tx = Transaction.from(Buffer.from(tx_base64, 'base64'));
  
      if (!solanaWalletProvider?.signTransaction) {
        throw new Error('Wallet provider not available');
      }
      
      // Add additional confirmation for user
      toast.info('Please check your wallet to sign the transaction', {
        duration: 5000,
      });
  
      const signedTx = await solanaWalletProvider.signTransaction(tx);
  
      // Step 3: Send signed tx back to confirm
      const signedTxBase64 = signedTx.serialize().toString('base64');
  
      const confirmRes = await axios.post('/api/story-purchase/pay', {
        step: 'confirm',
        story_id: story.id,
        wallet_address: address,
        signed_tx_base64: signedTxBase64,
      });
  
      // Handle case where receiver account needs to be created
      if (confirmRes.data.error === 'MISSING_RECEIVER_ACCOUNT') {
        // Get the new transaction that needs signing
        const newTx = Transaction.from(
          Buffer.from(confirmRes.data.new_tx_base64, 'base64')
        );
        
        // Have user sign the new transaction
        toast.info('Additional signature required for account creation', {
          duration: 5000,
        });
        
        const newSignedTx = await solanaWalletProvider.signTransaction(newTx);
        const newSignedTxBase64 = newSignedTx.serialize().toString('base64');
        
        // Resubmit with the new signed transaction
        const finalConfirmRes = await axios.post('/api/story-purchase/pay', {
          step: 'confirm',
          story_id: story.id,
          wallet_address: address,
          signed_tx_base64: newSignedTxBase64,
        });
  
        if (finalConfirmRes.data.success) {
          toast.success('Payment successful! You can now read the full story');
          setShowPaymentModal(false);
          onReadFullStory();
        } else {
          throw new Error(finalConfirmRes.data.error || 'Final payment failed');
        }
        return;
      }
  
      if (confirmRes.data.success) {
        toast.success('Payment successful! You can now read the full story');
        setShowPaymentModal(false);
        onReadFullStory();
      } else {
        throw new Error(confirmRes.data.error || 'Payment failed');
      }
  
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error === 'INSUFFICIENT_TOKENS') {
          toast.error(
            `You need ${error.response.data.requiredTokens?.toFixed(4) || 'more'} STORIES tokens`,
            { duration: 8000 }
          );
        } else if (error.response?.data?.error === 'INSUFFICIENT_SOL') {
          toast.error(
            `You need at least ${error.response.data.requiredSol || 0.01} SOL for fees`,
            { duration: 8000 }
          );
        } else if (error.response?.data?.error === 'MISSING_RECEIVER_ACCOUNT') {
          toast.error(
            'Receiver account needs to be created. Please try again.',
            { duration: 8000 }
          );
        } else {
          toast.error(error.response?.data?.message || 'Payment failed');
        }
      } else {
        toast.error('An unexpected error occurred');
        console.error('Payment error:', error);
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="relative max-w-xl w-full bg-[#fef5e7] text-[#1a1a1a] p-6 rounded-xl shadow-2xl border border-[#e2d9c5]">
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-[#444] hover:text-black text-xl font-bold"
          >
            ×
          </button>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">
            {story.title}
          </h2>

          {/* Author Info and Tags */}
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="flex items-center gap-2 text-[#555]">
              <User className="w-4 h-4" />
              <span className="font-medium">{story.author.username}</span>
            </div>
            <div className="flex items-center gap-3 text-[#555]">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>15 mins</span>
              </div>
              <div className="bg-yellow-300 text-yellow-900 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                <Gift className="w-3 h-3" />
                {requiredTokens ? `${requiredTokens.toFixed(2)} STORIES` : 'Loading...'}
                <span className="text-xs">($9.00)</span>
              </div>
            </div>
          </div>

          {/* Snippet Content */}
          <p className="text-sm leading-relaxed text-[#333] mb-6 line-clamp-6">
            {story.content}
          </p>

          {/* Read Button */}
          <div className="text-center">
            <button
              onClick={handleReadFullStory}
              disabled={isCheckingPurchase || !requiredTokens}
              className="bg-[#00d184] hover:bg-[#00ba75] text-white font-semibold px-5 py-2 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingPurchase ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Checking...
                </span>
              ) : (
                'Read full story'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Connect Wallet Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="relative max-w-md w-full bg-white p-6 rounded-xl shadow-xl">
            <button
              onClick={() => setShowConnectModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              ×
            </button>

            <h3 className="text-xl font-semibold mb-4">Connect Wallet</h3>
            <p className="mb-6">
              You need to connect your wallet to read this story.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  toast.info('Please connect your wallet using the connect button in the header');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && requiredTokens && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="relative max-w-md w-full bg-white p-6 rounded-xl shadow-xl">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              ×
            </button>

            <h3 className="text-xl font-semibold mb-4">Purchase Story</h3>
            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-600">Current STORIES price: ${storiesPrice?.toFixed(4)}</p>
              <p className="text-lg font-medium">
                This story costs <span className="font-bold">{requiredTokens.toFixed(4)} STORIES</span> (${9.00})
              </p>
              <p className="text-xs text-gray-500">
                Price updates automatically based on market value
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : (
                  'Confirm Purchase'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};