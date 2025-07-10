"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SingleStory, ThemeContext } from "@/components/stories/SingleStory";
import CustomButton from "@/components/common/Button";
import { MoonIcon, Sun, Share2, Gift, Volume2, AlertCircle, Loader2 } from "lucide-react";
import StoryModal from "@/components/stories/StoryModal";
import TradeModal from "@/components/stories/TradeModal";

// Types for API response
interface Author {
  id: number;
  username: string;
  wallet_address: string;
}

interface ApprovedBy {
  admin_id: string;
  username: string;
}

interface Story {
  id: number;
  title: string;
  content: string;
  price_tokens: number;
  status: string;
  created_at: string;
  author: Author;
  approved_by?: ApprovedBy;
}

interface ApiResponse {
  success: boolean;
  data?: {
    story: Story;
  };
  error?: string;
  message?: string;
}

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#141414] flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#FFDE7A] mx-auto mb-4" />
      <p className="text-gray-400">Loading story...</p>
    </div>
  </div>
);

// Error component
const ErrorDisplay = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Error Loading Story</h2>
      <p className="text-gray-400 mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-[#FFDE7A] text-[#141414] rounded-lg hover:bg-[#ffd07a] transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default function SingleStoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  
  // API state
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const [comments, setComments] = useState([
    {
      userImage: "/lady_image.svg",
      userName: "Toffani.ok",
      comment: "Ultricies ultricies interdum dolor sodales...",
      createdAt: "6h",
      replies: [
        {
          userImage: "/lady_image.svg",
          userName: "Toffani.ok",
          comment: "Ultricies ultricies interdum...",
          createdAt: "6h",
        },
      ],
    },
  ]);

  const handleNewComment = (text: string) => {
    if (!text.trim()) return;
    setComments([
      ...comments,
      {
        userImage: "/lady_image.svg",
        userName: "You",
        comment: text,
        createdAt: "Just now",
        replies: [],
      },
    ]);
  };

  const handleShare = () => {
    if (navigator.share && story) {
      navigator
        .share({
          title: "Check out this story!",
          text: story.title,
          url: window.location.href,
        })
        .catch((error) => {
          console.error("Error sharing:", error);
        });
    }
  };

  // Fetch story data from API
  const fetchStory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const storyId = params.id as string;
      if (!storyId) {
        throw new Error("Story ID is required");
      }

      // Get query parameters for wallet addresses
      const adminWalletAddress = searchParams.get('admin_wallet_address');
      const walletAddress = searchParams.get('wallet_address');
      
      // Build URL with query parameters
      const url = new URL(`/api/stories/${storyId}`, window.location.origin);
      if (adminWalletAddress) {
        url.searchParams.set('admin_wallet_address', adminWalletAddress);
      }
      if (walletAddress) {
        url.searchParams.set('wallet_address', walletAddress);
      }

      const response = await fetch(url.toString());
      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch story');
      }

      if (!data.success || !data.data?.story) {
        throw new Error(data.message || 'Invalid response from server');
      }

      setStory(data.data.story);
    } catch (err) {
      console.error('Error fetching story:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and retry function
  useEffect(() => {
    fetchStory();
  }, [params.id, searchParams]);

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 1500);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleReplySubmit = (commentId: string, text: string) => {
    if (!text.trim()) return;
    setComments((prev) =>
      prev.map((c, i) => {
        const id = `comment-${i}`;
        if (id === commentId) {
          return {
            ...c,
            replies: [
              ...(c.replies || []),
              {
                userImage: "/lady_image.svg",
                userName: "You",
                comment: text,
                createdAt: "now",
              },
            ],
          };
        }
        return c;
      })
    );
  };

  const handlePerksClick = () => {
    setIsModalOpen(true);
  };

  const handleTradeClick = () => {
    setIsTradeModalOpen(true);
  };

  // Calculate reading time (rough estimate)
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min${minutes > 1 ? 's' : ''}`;
  };

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show error state
  if (error || !story) {
    return <ErrorDisplay message={error || "Story not found"} onRetry={fetchStory} />;
  }

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[1400px] relative flex justify-center px-4">
        {/* Centered Story Component */}
        <div className="max-w-[750px] w-full z-10">
          <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <SingleStory
              title={story.title}
              timeToRead={calculateReadingTime(story.content)}
              price={story.price_tokens}
              change={4.5} // You might want to calculate this based on historical data
              author={story.author.username}
              authorImage="/lady_image.svg" // You might want to add author image to your API
              storyContent={story.content}
              comments={comments}
              onNewComment={handleNewComment}
              onReplySubmit={handleReplySubmit}
            />
          </ThemeContext.Provider>
        </div>

        {/* Conditional buttons */}
        {isWideScreen ? (
          <div className="fixed top-1/2 -translate-y-1/2 right-[200px] z-1 flex flex-col gap-4 items-center">
            <CustomButton
              onClick={toggleTheme}
              icon={theme === "light" ? MoonIcon : Sun}
              className="rounded-full"
            />
            <CustomButton
              onClick={handleShare}
              icon={Share2}
              className="rounded-full"
            />
            <CustomButton
              onClick={handlePerksClick}
              icon={Gift}
              text="Perks"
              className="bg-[#FFDE7A] hover:bg-[#ffd07a] active:bg-yellow-600 focus:ring-[#ffe79d] text-[#141414] rounded-lg"
            />
            <CustomButton
              onClick={() => console.log("Volume clicked")}
              text="Listen"
              icon={Volume2}
              className="bg-[#FFDE7A] hover:bg-[#ffd07a] active:bg-yellow-600 focus:ring-[#ffe79d] text-[#141414] rounded-lg"
            />
            <CustomButton
              onClick={handleTradeClick}
              text="Trade"
              className="w-full rounded-lg"
            />
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 w-full bg-[#141414] py-4 z-50">
            <div className="flex gap-4 px-4 items-center justify-center">
              <CustomButton
                onClick={toggleTheme}
                icon={theme === "light" ? MoonIcon : Sun}
                className="rounded-full"
              />
              <CustomButton
                onClick={handleShare}
                icon={Share2}
                className="rounded-full"
              />
              <CustomButton
                onClick={handlePerksClick}
                icon={Gift}
                className="bg-[#FFDE7A] hover:bg-[#ffd07a] active:bg-yellow-600 focus:ring-[#ffe79d] text-[#141414] rounded-full"
              />
              <CustomButton
                onClick={() => console.log("Volume clicked")}
                icon={Volume2}
                className="bg-[#FFDE7A] hover:bg-[#ffd07a] active:bg-yellow-600 focus:ring-[#ffe79d] text-[#141414] rounded-full"
              />
              <CustomButton
                onClick={handleTradeClick}
                text="Trade"
                className="rounded-lg"
              />
            </div>
          </div>
        )}
        
        {/* Story Modal */}
        <StoryModal
          isOpen={isModalOpen}
          onCloseAction={() => setIsModalOpen(false)}
          type="perks"
        />
        
        {/* Trade Modal */}
        <TradeModal
          isOpen={isTradeModalOpen}
          onCloseAction={() => setIsTradeModalOpen(false)}
        />
      </div>
    </div>
  );
}