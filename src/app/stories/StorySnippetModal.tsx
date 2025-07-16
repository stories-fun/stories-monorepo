import React, { useState, useEffect } from 'react';
import { Clock5, Gift, Info, LockOpen, X } from 'lucide-react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { PublicKey, Transaction } from '@solana/web3.js';
import axios from 'axios';
import { toast } from 'sonner';
import { useAppKit } from '@reown/appkit/react';
import type { Provider } from "@reown/appkit-adapter-solana/react";
import Image from 'next/image';
import { balloons } from 'balloons-js';
import CustomButton from '@/components/common/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Author {
  id: number;
  username: string;
  avatar_url?: string;
  wallet_address: string;
  image_url?: string;
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
  const balloonContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Function to clean markdown for preview
  const cleanMarkdownPreview = (text: string) => {
    // Remove markdown headers
    let cleaned = text.replace(/^#+\s+/gm, '');
    // Remove bold/italic markers
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    // Remove image/video markdown
    cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
    cleaned = cleaned.replace(/<video.*?<\/video>/g, '');
    // Remove blockquotes
    cleaned = cleaned.replace(/^>\s+/gm, '');
    // Remove links
    cleaned = cleaned.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // Trim and get first 300 characters
    return cleaned.trim().substring(0, 300) + (cleaned.length > 300 ? '...' : '');
  };


  useEffect(() => {
    if (story?.author?.avatar_url) {
      console.log('Avatar Debug:', {
        rawAvatarUrl: story.author.avatar_url,
        constructedUrl: `https://ipfs.erebrus.io/ipfs/${story.author.avatar_url}`,
        authorData: story.author,
        isImageError: avatarError
      });
      
      // // Test the image load
      // const testImage = new Image();
      // testImage.src = `https://ipfs.io/ipfs/${story.author.avatar_url}`;
      // testImage.onload = () => console.log('IPFS image loads successfully');
      // testImage.onerror = (e) => console.error('IPFS image failed to load', e);
    }
  }, [story, avatarError]);
  
  // Enhanced IPFS URL handling
  const getIpfsUrl = (hash?: string) => {
    if (!hash) return null;
    
    // Remove common prefixes
    const cleanHash = hash
      .replace(/^ipfs:\/\//, '')
      .replace(/^https?:\/\/[^/]+\//, '')
      .replace(/^\/ipfs\//, '');
    
    // Try multiple gateways with fallback
    const gateways = [
      `https://ipfs.erebrus.io/ipfs/${cleanHash}`,
      `https://ipfs.io/ipfs/${cleanHash}`,
      `https://cloudflare-ipfs.com/ipfs/${cleanHash}`
    ];
    
    return gateways[0]; // Start with preferred gateway
  };  
  // Fetch STORIES token price when component mounts
  useEffect(() => {
    const fetchStoriesPrice = async () => {
      try {
        const response = await axios.get('https://api.dexscreener.com/latest/dex/pairs/solana/DwAnxaVPCkLCKigNt5kNZwUmJ3rbiVFmvLxgEgFyogAL');
        const priceUsd = response.data.pairs?.[0]?.priceUsd;
        if (priceUsd) {
          const price = parseFloat(priceUsd);
          setStoriesPrice(price);
          setRequiredTokens(9 / price); // $9 worth of STORIES tokens
        }
      } catch (error) {
        console.error('Error fetching STORIES price:', error);
        toast.error('Failed to fetch current STORIES price');
      }
    };

    fetchStoriesPrice();
  }, []);

  useEffect(() => {
    if (isOpen && balloonContainerRef.current) {
      balloonContainerRef.current.innerHTML = "";
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-150 px-4">

      <div className="relative">
        {/* Main Modal Card */}
        <div className="bg-[#FFEEBA] text-[#141414] p-6 sm:p-8 w-full max-w-lg relative shadow-xl border border-[#141414]">
          <div className="relative z-10">
            {/* Story Content */}
            <h2 className="font-bold text-xl sm:text-2xl mb-4">
              {story.title}
            </h2>
           
            
            <div className="flex items-center gap-2 mb-4">
            <div className="bg-[#141414] p-1 rounded-lg flex items-center gap-2">
  {story.author.avatar_url ? (
    <div className="relative">
      <Image
  src={getIpfsUrl(story.author.avatar_url) || "/pfp.jpeg"}
  alt={story.author.username}
  width={32}
  height={32}
  className="rounded-full"
  onError={(e) => {
    console.error('Image load error:', e);
    setAvatarError(true);
  }}
  unoptimized={true}
  priority={true} // Add this for important images
/>
      {avatarError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-full">
          <span className="text-xs text-white">!</span>
        </div>
      )}
    </div>
  ) : (
    <Image
      src="/pfp.jpeg"
      alt={story.author.username}
      width={32}
      height={32}
      className="rounded-full"
    />
  )}
  <span className="text-sm font-semibold text-white">
    {story.author.username}
  </span>
</div>
              
              <span className="flex items-center text-sm ml-auto gap-1">
                <Clock5 size={16} />
                15 mins
                
              </span>
              
              <button
                onClick={() => setShowPaymentModal(true)}
                className="rounded-lg border-none bg-[#FFDE7A] hover:bg-[#ffd07a] active:bg-yellow-600 focus:ring-[#ffe79d] text-sm text-[#141414] flex items-center gap-1 px-2 py-1"
              >
                <Gift size={16} />
                {requiredTokens ? `${requiredTokens.toFixed(2)} STORIES` : '...'}
              </button>
            </div>

            {/* Enhanced Markdown Preview */}
            <div className="mb-6 max-h-[200px] overflow-y-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Strip out all complex markdown for the preview
                  h1: ({node, ...props}) => <span className="font-bold text-lg" {...props} />,
                  h2: ({node, ...props}) => <span className="font-bold" {...props} />,
                  h3: ({node, ...props}) => <span className="font-bold" {...props} />,
                  p: ({node, ...props}) => <p className="text-sm text-gray-700 mb-2 leading-relaxed" {...props} />,
                  img: () => null,
                  video: () => null,
                  a: ({node, ...props}) => <span className="text-blue-600" {...props} />,
                  strong: ({node, ...props}) => <span className="font-semibold" {...props} />,
                  em: ({node, ...props}) => <span className="italic" {...props} />,
                  blockquote: () => null,
                  code: () => null,
                }}
              >
                {cleanMarkdownPreview(story.content)}
              </ReactMarkdown>
            </div>

            <div className="flex justify-center">
              <CustomButton
                text={
                  isCheckingPurchase ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Checking...
                    </span>
                  ) : (
                    'Read full story'
                  )
                }
                onClick={handleReadFullStory}
                disabled={isCheckingPurchase || !requiredTokens}
                className={`w-full max-w-xs text-sm py-2 px-5 ${
                  isCheckingPurchase ? 'opacity-75' : ''
                }`}
              />
            </div>
          </div>
        </div>

        {/* Close button at bottom center */}
        <button
          onClick={onClose}
          className="absolute left-1/2 text-black translate-x-[-50%] top-full mt-4 w-10 h-10 rounded-full bg-[#FFEEBA] border border-[#141414] flex items-center justify-center shadow-md hover:text-red-600 transition-all z-10"
        >
          <X size={20} />
        </button>
      </div>

      {/* Connect Wallet Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="relative bg-[#FFEEBA] text-[#141414] p-6 sm:p-8 w-full max-w-lg shadow-xl border border-[#141414]">
            <h3 className="text-xl font-semibold mb-4">Connect Wallet</h3>
            <p className="mb-6">
              You need to connect your wallet to read this story.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 border border-[#141414] rounded-lg hover:bg-[#FFDE7A]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  toast.info('Please connect your wallet using the connect button in the header');
                }}
                className="px-4 py-2 bg-[#141414] text-white rounded-lg hover:bg-[#2a2a2a]"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && requiredTokens && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="relative bg-[#FFEEBA] text-[#141414] p-6 sm:p-8 w-full max-w-lg rounded-xl shadow-2xl border-2 border-[#141414]">
            {/* Close button (top-right) */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-[#FFDE7A]/50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header with icon */}
            <div className="flex items-center gap-3 mb-4">
              <Gift className="h-6 w-6 text-[#141414]" />
              <h3 className="text-2xl font-bold">Unlock This Story</h3>
            </div>

            {/* Price details */}
            <div className="mb-6 p-4 bg-[#FFDE7A]/30 rounded-lg border border-[#FFDE7A]/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Current Rate:</span>
                <span className="font-mono font-bold">${storiesPrice?.toFixed(4)} per STORY</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">You Pay:</span>
                <div className="text-right">
                  <p className="font-mono font-bold text-lg">{requiredTokens.toFixed(4)} STORIES</p>
                  <p className="text-xs">≈ $9.00 USD</p>
                </div>
              </div>
            </div>

            {/* Market notice */}
            <div className="flex items-start gap-2 mb-6 text-xs text-[#141414]/80">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>Price adjusts automatically based on current market value of STORIES token</p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-3 border-2 border-[#141414] rounded-lg hover:bg-[#FFDE7A]/50 active:bg-[#FFDE7A]/70 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment}
                className={`px-6 py-3 bg-[#141414] text-[#FFEEBA] rounded-lg border-2 border-[#141414] hover:bg-[#2a2a2a] active:bg-[#1a1a1a] transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                  isProcessingPayment ? 'opacity-80' : ''
                }`}
              >
                {isProcessingPayment ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-[#FFEEBA] border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LockOpen className="h-5 w-5" />
                    Confirm Purchase
                  </span>
                )}
              </button>
            </div>

            {/* Loading state decoration (only visible during processing) */}
            {isProcessingPayment && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#141414]/10 overflow-hidden">
                <div className="h-full w-full bg-[#141414] animate-[pulse_1.5s_infinite]" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};