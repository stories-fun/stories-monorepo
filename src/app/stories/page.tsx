'use client';

import React, { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Plus, 
  Clock, 
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Grid3X3,
  List,
  Search,
  Book,
  ShoppingCart,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { StoryCreator } from '@/components/stories/StoryCreator';
import { StoriesGallery } from '@/components/stories/StoriesGallery';
import CustomButton from '@/components/common/Button';
import { StorySnippetModal } from './StorySnippetModal';
import { MiniCard } from '@/components/MiniCard';
import { TransactionTable } from '@/components/TransactionTable';
import { Profile } from '@/components/Profile';
import { Read } from '@/components/Reading';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Story {
  id: number;
  title: string;
  content: string;
  price_tokens: number;
  status: string;
  created_at: string;
 author: {
    id: number;
    username: string;
    wallet_address: string;
    avatar_url?: string; // Optional, might not be present in all stories
  };
}

interface StoriesGalleryProps {
  onViewStory?: (story: Story) => void;
}

interface Purchase {
  id: number;
  story_id: number;
  wallet_address: string;
  price_tokens: number;
  transaction_hash: string;
  status: string;
  purchased_at: string;
}

interface FetchStatus {
  submitted: 'loading' | 'success' | 'error' | 'idle';
  approved: 'loading' | 'success' | 'error' | 'idle';
  published: 'loading' | 'success' | 'error' | 'idle';
}

// Hook to determine how many columns based on screen size
function useBreakpoint() {
  const [columns, setColumns] = useState(2); // default mobile

  useEffect(() => {
    function updateColumns() {
      const width = window.innerWidth;
      if (width >= 1024) setColumns(5); // desktop
      else if (width >= 640) setColumns(3); // tablet
      else setColumns(2); // mobile
    }

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  return columns;
}

const StatsCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
  trend?: string;
}> = ({ icon, title, value, description, trend }) => (
  <div className="bg-[#222222] rounded-xl p-6 border border-[#333333] hover:border-[#444444] transition-colors">
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h3 className="text-white font-medium">{title}</h3>
    </div>
    <div className="flex items-end gap-2 mb-1">
      <div className="text-2xl font-bold text-white">{value}</div>
      {trend && (
        <div className="text-green-400 text-sm font-medium">+{trend}</div>
      )}
    </div>
    <p className="text-[#666666] text-sm">{description}</p>
  </div>
);

const QuickStoryCard: React.FC<{ 
  story: Story; 
  isOwner?: boolean;
  onViewStory?: (story: Story) => void;
}> = ({ story, isOwner = false, onViewStory }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-blue-400" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'approved':
        return 'Approved';
      case 'submitted':
        return 'Under Review';
      default:
        return 'Unknown';
    }
  };

  const truncateContent = (content: string, maxLength: number = 80) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="bg-[#222222] rounded-xl p-4 border border-[#333333] hover:border-[#444444] transition-all duration-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-semibold text-sm line-clamp-1 flex-1 mr-3">
          {story.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {getStatusIcon(story.status)}
          <span className="text-xs text-[#AAAAAA]">{getStatusText(story.status)}</span>
        </div>
      </div>
      <p className="text-[#AAAAAA] text-xs mb-3 leading-relaxed">
        {truncateContent(story.content)}
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-[#666666]">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{new Date(story.created_at).toLocaleDateString()}</span>
        </div>
        {story.price_tokens > 0 && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>{story.price_tokens} STORIES</span>
          </div>
        )}
      </div>
      <button
        onClick={() => onViewStory?.(story)}
        className="w-full py-2 px-3 bg-[#333333] hover:bg-[#3A3A3A] text-white rounded-lg transition-colors text-xs"
      >
        {isOwner ? 'View Details' : 'Read Story'}
      </button>
    </div>
  );
};

// Loading component for individual story sections
const StorySectionLoading: React.FC<{ type: string }> = ({ type }) => (
  <div className="bg-[#222222] rounded-xl p-4 border border-[#333333]">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-4 h-4 bg-[#333333] rounded animate-pulse"></div>
      <div className="w-20 h-4 bg-[#333333] rounded animate-pulse"></div>
    </div>
    <div className="space-y-2">
      <div className="w-full h-3 bg-[#333333] rounded animate-pulse"></div>
      <div className="w-3/4 h-3 bg-[#333333] rounded animate-pulse"></div>
    </div>
    <div className="mt-3 w-full h-8 bg-[#333333] rounded animate-pulse"></div>
  </div>
);

export default function StoriesPage() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [activeTab, setActiveTab] = useState<'discover' | 'create' | 'my-stories'>('discover');
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>({
    submitted: 'idle',
    approved: 'idle',
    published: 'idle'
  });
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showSnippetModal, setShowSnippetModal] = useState(false);
  const [showAllLibrary, setShowAllLibrary] = useState(false);
  const columns = useBreakpoint();

  // Sample data for the library section (keeping it as sample data)
  const libraryStories = [
    { image: "/lion.webp", title: "The Fairy Tale", price: 10.0, change: 4.5 },
    { image: "/lion.webp", title: "Cars", price: 15.0, change: 2.0 },
    { image: "/lion.webp", title: "The Butterfly Effect", price: 12.0, change: -1.5 },
    { image: "/lion.webp", title: "Adventure Story", price: 8.0, change: 3.2 },
    { image: "/lion.webp", title: "Mystery Novel", price: 20.0, change: -0.5 },
    { image: "/lion.webp", title: "Sci-Fi Chronicles", price: 18.0, change: 5.8 },
    { image: "/lion.webp", title: "Romance Tale", price: 12.0, change: 2.1 },
    { image: "/lion.webp", title: "Horror Stories", price: 14.0, change: -2.3 },
  ];

  // Enhanced fetchPurchases with better error handling
  const fetchPurchases = async () => {
    if (!address) return;
    setPurchasesLoading(true);
    try {
      const response = await fetch(`/api/story-purchase/user?wallet_address=${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    
      const data = await response.json();
      if (data.success && data.data?.purchases) {
        // Sort by purchase date (newest first)
        const sortedPurchases = data.data.purchases.sort((a: Purchase, b: Purchase) => 
          new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime()
        );
        
        setPurchases(sortedPurchases);
        if (sortedPurchases.length > 0) {
          toast.success(`Loaded ${sortedPurchases.length} purchases`);
        }
      } else {
        setPurchases([]);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load purchases');
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  };

  // Optimized fetchMyStories with parallel requests and better error handling
  const fetchMyStories = async (retryCount = 0, showToast = true) => {
    if (!address) return;
    
    setLoading(true);
    setFetchStatus({
      submitted: 'loading',
      approved: 'loading', 
      published: 'loading'
    });

    try {
      // Check cache for user ID (avoid repeated authentication)
      const cacheKey = `user_${address}`;
      let userId = '';
      
      // Try to get cached user ID first
      if (typeof window !== 'undefined') {
        userId = sessionStorage.getItem(cacheKey) || '';
      }

      // If no cached user ID, authenticate
      if (!userId) {
        const userResponse = await fetch(`/api/users/signin?wallet_address=${address}`);
        const userResult = await userResponse.json();
        
        if (!userResult.success) {
          toast.error('Failed to authenticate user');
          setMyStories([]);
          setFetchStatus({
            submitted: 'error',
            approved: 'error',
            published: 'error'
          });
          return;
        }
        
        userId = userResult.data.user.id.toString();
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(cacheKey, userId);
        }
      }

      // Define requests for parallel execution
      const requests = [
        {
          url: `/api/stories?status=submitted&wallet_address=${address}&limit=100`,
          type: 'submitted' as keyof FetchStatus
        },
        {
          url: `/api/stories?status=approved&author_id=${userId}&limit=100`,
          type: 'approved' as keyof FetchStatus
        },
        {
          url: `/api/stories?status=published&author_id=${userId}&limit=100`,
          type: 'published' as keyof FetchStatus
        }
      ];

      // Execute all requests in parallel with individual error handling
      const fetchResults = await Promise.allSettled(
        requests.map(async ({ url, type }) => {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${type} stories: HTTP ${response.status}`);
            }
            const json = await response.json();
            return { type, data: json, success: true };
          } catch (error) {
            console.error(`Error fetching ${type} stories:`, error);
            return { type, error: error instanceof Error ? error.message : String(error), success: false };
          }
        })
      );

      // Process results and update fetch status
      const allStories: Story[] = [];
      const newFetchStatus: FetchStatus = {
        submitted: 'idle',
        approved: 'idle',
        published: 'idle'
      };

      fetchResults.forEach((result, index) => {
        const requestType = requests[index].type;
        
        if (result.status === 'fulfilled') {
          const { success, data, error } = result.value;
          
          if (success && data.success && data.data?.stories) {
            allStories.push(...data.data.stories);
            newFetchStatus[requestType] = 'success';
          } else {
            newFetchStatus[requestType] = 'error';
            console.warn(`Failed to load ${requestType} stories:`, error || 'Unknown error');
          }
        } else {
          newFetchStatus[requestType] = 'error';
          console.error(`Promise rejected for ${requestType}:`, result.reason);
        }
      });

      setFetchStatus(newFetchStatus);

      // Remove duplicates (in case a story appears in multiple statuses)
      const uniqueStories = allStories.filter(
        (story, index, self) => index === self.findIndex(s => s.id === story.id)
      );

      // Sort by creation date (newest first)
      uniqueStories.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMyStories(uniqueStories);
      setLastFetchTime(Date.now());

      // Show success message with breakdown
      if (showToast && uniqueStories.length > 0) {
        const breakdown = {
          submitted: uniqueStories.filter(s => s.status === 'submitted').length,
          approved: uniqueStories.filter(s => s.status === 'approved').length,
          published: uniqueStories.filter(s => s.status === 'published').length,
        };
        
        const parts = [];
        if (breakdown.published > 0) parts.push(`${breakdown.published} published`);
        if (breakdown.approved > 0) parts.push(`${breakdown.approved} approved`);
        if (breakdown.submitted > 0) parts.push(`${breakdown.submitted} pending`);
        
        toast.success(`Loaded ${uniqueStories.length} stories (${parts.join(', ')})`);
      }
      
    } catch (error) {
      console.error('Error fetching stories:', error);
      
      // Retry logic for network errors
      if (retryCount < 2 && error instanceof TypeError) {
        console.log(`Retrying fetchMyStories... Attempt ${retryCount + 1}`);
        setTimeout(() => fetchMyStories(retryCount + 1, false), 1000 * (retryCount + 1));
        return;
      }
      
      if (showToast) {
        toast.error('Failed to fetch your stories. Please try again.');
      }
      setMyStories([]);
      setFetchStatus({
        submitted: 'error',
        approved: 'error',
        published: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const refreshStories = async () => {
    await fetchMyStories(0, true);
    await fetchPurchases();
  };

  const userStory = myStories.find(s => s.author.wallet_address === address);

  const UserProfile = {
    username: userStory?.author.username || "",
    walletAddress: address || "No user connected",
    
    avatarUrl: userStory?.author.avatar_url 
      ? `https://ipfs.erebrus.io/ipfs/${userStory.author.avatar_url}` 
      : "/pfp.jpeg"
  };

  const StoriesRead = {
    storiesRead: 28,
    readingStreak: 15,
  };

  const visibleLibraryStories = showAllLibrary ? libraryStories : libraryStories.slice(0, columns);

  // Convert purchases to transaction format for the TransactionTable component
  const formattedTransactions = purchases.map((purchase) => ({
    storyTitle: `Story #${purchase.story_id}`,
    price: `${purchase.price_tokens} STORIES`,
    date: new Date(purchase.purchased_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    txns: `https://solscan.io/tx/${purchase.transaction_hash}`,
  }));

  useEffect(() => {
    if (activeTab === 'my-stories' && address) {
      fetchMyStories();
      fetchPurchases();
    }
  }, [activeTab, address]);

  useEffect(() => {
    document.body.style.overflow = showSnippetModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSnippetModal]);

  const handleStoryCreated = () => {
    toast.success('Story created successfully!');
    setActiveTab('my-stories');
    // Clear cache to force fresh data
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`user_${address}`);
    }
    fetchMyStories();
  };

  const handleViewStory = (story: Story) => {
    setSelectedStory(story);
    setShowSnippetModal(true);
  };

  const stats = {
    totalStories: myStories.length,
    publishedStories: myStories.filter(s => s.status === 'published').length,
    pendingStories: myStories.filter(s => s.status === 'submitted').length,
    approvedStories: myStories.filter(s => s.status === 'approved').length,
    totalEarnings: myStories.reduce((sum, s) => sum + (s.price_tokens || 0), 0)
  };

  return (
    <div className="min-h-screen bg-[#141414] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8 justify-items-center">
         <Image
         src="/stories_logo_large.svg"
         width={500}
         height={100}
         alt="Stories logo" />
          <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto">
          Read, write, and inspire — where every story finds its reader.
          </p>
        </div>

        <div className="fixed top-1/2 -translate-y-1/2 right-8 z-10 flex flex-col gap-4 items-center">
          <CustomButton
            onClick={() => setActiveTab('discover')}
            icon={Search}
            text="Discover"
            className={`w-40 justify-center ${activeTab === 'discover' ? 'bg-[#FFDE7A] text-[#141414]' : 'bg-[#222222] text-white'}`}
          />
          {isConnected && (
            <>
              <CustomButton
                onClick={() => setActiveTab('create')}
                icon={Plus}
                text="Create"
                className={`w-40 justify-center ${activeTab === 'create' ? 'bg-[#FFDE7A] text-[#141414]' : 'bg-[#222222] text-white'}`}
              />
              <CustomButton
                onClick={() => setActiveTab('my-stories')}
                icon={BookOpen}
                text="Profile"
                className={`w-40 justify-center ${activeTab === 'my-stories' ? 'bg-[#FFDE7A] text-[#141414]' : 'bg-[#222222] text-white'}`}
              />
            </>
          )}
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-[#141414] py-4 z-50">
          <div className="flex gap-4 px-4 items-center justify-center">
            <CustomButton
              onClick={() => setActiveTab('discover')}
              icon={Search}
              text="Discover"
              className={`w-24 h-12 justify-center ${activeTab === 'discover' ? 'bg-[#FFDE7A] text-[#141414]' : 'bg-[#222222] text-white'}`}
            />
            {isConnected && (
              <>
                <CustomButton
                  onClick={() => setActiveTab('create')}
                  icon={Plus}
                  text="Create"
                  className={`w-24 h-12 justify-center ${activeTab === 'create' ? 'bg-[#FFDE7A] text-[#141414]' : 'bg-[#222222] text-white'}`}
                />
                <CustomButton
                  onClick={() => setActiveTab('my-stories')}
                  icon={BookOpen}
                  text="Profile"
                  className={`w-24 h-12 justify-center ${activeTab === 'my-stories' ? 'bg-[#FFDE7A] text-[#141414]' : 'bg-[#222222] text-white'}`}
                />
              </>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {activeTab === 'discover' && (
            <StoriesGallery onViewStory={handleViewStory} />
          )}

          {activeTab === 'create' && isConnected && (
            <StoryCreator onSuccess={handleStoryCreated} />
          )}

          {activeTab === 'my-stories' && isConnected && (
            <div className="w-full">
              {/* Stats Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard
                  icon={<FileText className="h-5 w-5 text-blue-400" />}
                  title="Total Stories"
                  value={stats.totalStories}
                  description="All your stories"
                />
                <StatsCard
                  icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
                  title="Published"
                  value={stats.publishedStories}
                  description="Live stories"
                />
                <StatsCard
                  icon={<Clock className="h-5 w-5 text-yellow-400" />}
                  title="Pending"
                  value={stats.pendingStories}
                  description="Under review"
                />
                <StatsCard
                  icon={<DollarSign className="h-5 w-5 text-purple-400" />}
                  title="Total Value"
                  value={`${stats.totalEarnings} STORIES`}
                  description="Combined value"
                />
              </div>

              {/* Refresh Button */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-x-5 sm:gap-x-7">
                    <Book size={28} className="text-white" />
                    <h1 className="text-white text-[20px] sm:text-[28px] font-bold">
                      My Library
                    </h1>
                  </div>
                </div>
                <CustomButton
                  onClick={refreshStories}
                  icon={RefreshCw}
                  text="Refresh"
                  className={`bg-[#333333] text-white hover:bg-[#444444] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading}
                />
              </div>

              {/* Stories Grid with MiniCard Design */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-8">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="bg-[#222222] rounded-xl p-4 border border-[#333333] animate-pulse">
                        <div className="w-full h-32 bg-[#333333] rounded mb-3"></div>
                        <div className="w-3/4 h-4 bg-[#333333] rounded mb-2"></div>
                        <div className="w-1/2 h-3 bg-[#333333] rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : myStories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-8">
                  {myStories.map((story) => (
                    <div key={story.id} className="flex flex-col">
                      <MiniCard 
                        image="/lion.webp"
                        title={story.title}
                        price={story.price_tokens}
                        change={Math.random() * 10 - 2} // Random change for demo
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 mb-8">
                  <FileText className="h-16 w-16 text-[#444444] mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No Stories Yet</h3>
                  <p className="text-[#AAAAAA] mb-6">Create your first story to get started</p>
                  <CustomButton
                    onClick={() => setActiveTab('create')}
                    icon={Plus}
                    text="Create Story"
                    className="bg-[#FFDE7A] text-[#141414] hover:bg-[#FFF6C9]"
                  />
                </div>
              )}

              

              {/* Transaction Table and Profile Section */}
              <div className="flex flex-col lg:flex-row gap-6 mb-6">
                {/* Transaction Table Section */}
                <div className="w-full lg:w-2/3 order-1 lg:order-none">
                  {/* Purchases Title */}
                  <div className="flex items-center gap-x-5 sm:gap-x-7 mb-4">
                    <ShoppingCart size={28} className="text-white" />
                    <h1 className="text-white text-[20px] sm:text-[28px] font-bold">
                      Purchases
                    </h1>
                  </div>
                  <TransactionTable 
                    transactions={formattedTransactions} 
                  />
                  {!purchasesLoading && formattedTransactions.length === 0 && (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-[#444444] mx-auto mb-3" />
                      <p className="text-[#AAAAAA] text-sm">No purchases yet</p>
                      <p className="text-[#666666] text-xs">Your story purchases will appear here</p>
                    </div>
                  )}
                </div>

                {/* Profile Section */}
                <div className="w-full lg:w-1/3 order-2 lg:order-none">
                  {/* Profile Title */}
                  <div className="flex items-center gap-x-5 sm:gap-x-7 mb-4 mt-6 lg:mt-0">
                    <User size={28} className="text-white" />
                    <h1 className="text-white text-[20px] sm:text-[28px] font-bold">
                      Profile
                    </h1>
                  </div>
                  <Profile
  username={UserProfile.username}
  walletAddress={UserProfile.walletAddress}
  avatarUrl={UserProfile.avatarUrl}
/>


                  {/* Reading Stats Section */}
                  <div className="sm:mt-0 sm:mb-0 mt-4 mb-6">
                    <div className="flex items-center gap-x-5 sm:gap-x-7 mb-4 mt-6 lg:mt-0">
                      <BarChart3 size={28} className="text-white" />
                      <h1 className="text-white text-[20px] sm:text-[28px] font-bold">
                        Reading Stats
                      </h1>
                    </div>
                    <Read {...StoriesRead} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isConnected && activeTab !== 'discover' && (
            <div className="text-center py-16">
              <User className="h-16 w-16 text-[#444444] mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Connect Your Wallet</h3>
              <p className="text-[#AAAAAA] mb-6">Connect your wallet to create stories and manage your content</p>
              <button onClick={() => setActiveTab('discover')} className="text-[#00A3FF] hover:underline">
                Browse stories without connecting →
              </button>
            </div>
          )}
        </div>

        {showSnippetModal && selectedStory && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-[#1A1A1A] p-6 rounded-lg relative">
              <button
                onClick={() => setShowSnippetModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-white"
              >
                ×
              </button>

              <StorySnippetModal
                isOpen={showSnippetModal}
                onClose={() => setShowSnippetModal(false)}
                story={selectedStory}
                onReadFullStory={() => {
                  setShowSnippetModal(false);
                  router.push(`/stories/${selectedStory.id}`);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}