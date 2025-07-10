// src/components/stories/StoriesGallery.tsx
// Updated with navigation to individual story pages

'use client';

import React, { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useRouter } from 'next/navigation';
import { CustomCard } from "@/components/common/Card";
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Clock, 
  Star,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  DollarSign,
  Lock,
  Eye,
  AlertCircle,
  Shield,
  ExternalLink,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';

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
  };
}

interface StoriesResponse {
  success: boolean;
  data: {
    stories: Story[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
    filters: {
      status: string;
      author_id: string | null;
      sort_by: string;
      sort_order: string;
    };
  };
  message?: string;
}
interface StoriesGalleryProps {
  onViewStory?: (story: Story) => void;
}



// Generate a random cover image based on story title
const generateCoverImage = (title: string, index: number) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  ];
  return colors[index % colors.length];
};

// Calculate reading time based on content length
const calculateReadingTime = (content: string): string => {
  const wordsPerMinute = 200;
  const wordCount = content.split(' ').length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min${minutes > 1 ? 's' : ''}`;
};

// Generate rating (placeholder since not in schema)
const generateRating = (storyId: number): number => {
  // Generate consistent "rating" based on story ID
  const seed = storyId * 7;
  return 3.5 + (seed % 15) / 10; // Range: 3.5 - 5.0
};

const StoryCard: React.FC<{ 
  story: Story; 
  index: number;
  onReadStory: (story: Story) => void;
  isOwner?: boolean;
}> = ({ story, index, onReadStory, isOwner = false }) => {
  const router = useRouter();
  const coverGradient = generateCoverImage(story.title, index);
  const readingTime = calculateReadingTime(story.content);
  const rating = generateRating(story.id);

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadge = () => {
    if (story.status === 'submitted' && isOwner) {
      return (
        <div className="absolute top-4 left-4 bg-yellow-500/90 backdrop-blur-sm text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Under Review
        </div>
      );
    }
    return null;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onReadStory(story);
  };
  
  const handleReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReadStory(story);
  };
  

  return (
    <div 
      onClick={handleCardClick}
    >


      {/* Card Content */}
      <CustomCard
  image={"/fallback.png"} // You can enhance this later
  title={story.title.substring(0, 35)}
  timeToRead={readingTime}
  price={story.price_tokens}
  change={4.5}
  author={story.author.username}
  authorImage={"/pfp.jpeg"}
  contentSnippet={story.content.substring(0, )}
  isOwner={isOwner}
  onClick={handleReadClick}
/>


    </div>
  );
};

const FilterBar: React.FC<{
  currentFilters: {
    status: string;
    search: string;
    sortBy: string;
    sortOrder: string;
  };
  onFiltersChange: (filters: any) => void;
  isConnected: boolean;
}> = ({ currentFilters, onFiltersChange, isConnected }) => {
  const [localSearch, setLocalSearch] = useState(currentFilters.search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...currentFilters, search: localSearch });
  };

  const getAvailableStatuses = () => {
    if (isConnected) {
      return [
        { value: 'published', label: 'Published' },
        { value: 'approved', label: 'Approved ' },
        { value: 'submitted', label: 'Submitted ' }
      ];
    } else {
      return [
        { value: 'published', label: 'Published Stories' },
        { value: 'approved', label: 'Approved Stories' }
      ];
    }
  };

  return (
<div className="bg-[#141414] rounded-xl p-6 border border-[#333333] mb-8">
  <div className="flex flex-col lg:flex-row gap-4 items-center">
    {/* Search - Enhanced with floating label effect */}
    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-[#FFDE7A] transition-all duration-200" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder=" "
          className="w-full pl-10 pr-4 py-3 bg-[#1A1A1A] border border-[#333333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#FFDE7A] focus:border-[#FFDE7A] peer transition-all duration-200"
        />
        <label className="absolute left-10 top-3 text-[#666666] pointer-events-none transition-all duration-200 peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-[#FFDE7A] bg-[#1A1A1A] px-1">
          Search stories...
        </label>
      </div>
    </form>

    {/* Status Filter - Custom dropdown */}
    <div className="relative group">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1A1A] border border-[#333333] rounded-lg cursor-pointer hover:border-[#FFDE7A]/50 transition-all duration-200">
        <span className="text-white">{currentFilters.status.replace('_', ' ')}</span>
        <ChevronDown className="h-4 w-4 text-[#FFDE7A] transition-transform duration-200 group-hover:rotate-180" />
      </div>
      <div className="absolute z-10 mt-1 w-full bg-[#1A1A1A] border border-[#333333] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        {getAvailableStatuses().map(status => (
          <div 
            key={status.value}
            onClick={() => onFiltersChange({ ...currentFilters, status: status.value })}
            className={`px-4 py-2 text-white hover:bg-[#FFDE7A]/10 ${currentFilters.status === status.value ? 'text-[#FFDE7A]' : ''}`}
          >
            {status.label}
          </div>
        ))}
      </div>
    </div>

    {/* Sort By - Custom dropdown */}
    <div className="relative group">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1A1A] border border-[#333333] rounded-lg cursor-pointer hover:border-[#FFDE7A]/50 transition-all duration-200">
        <span className="text-white">
          {currentFilters.sortBy === 'created_at' ? 'Latest' : 
           currentFilters.sortBy === 'title' ? 'Title' : 'Price'}
        </span>
        <ChevronDown className="h-4 w-4 text-[#FFDE7A] transition-transform duration-200 group-hover:rotate-180" />
      </div>
      <div className="absolute z-10 mt-1 w-full bg-[#1A1A1A] border border-[#333333] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div 
          onClick={() => onFiltersChange({ ...currentFilters, sortBy: 'created_at' })}
          className={`px-4 py-2 text-white hover:bg-[#FFDE7A]/10 ${currentFilters.sortBy === 'created_at' ? 'text-[#FFDE7A]' : ''}`}
        >
          Latest First
        </div>
        <div 
          onClick={() => onFiltersChange({ ...currentFilters, sortBy: 'title' })}
          className={`px-4 py-2 text-white hover:bg-[#FFDE7A]/10 ${currentFilters.sortBy === 'title' ? 'text-[#FFDE7A]' : ''}`}
        >
          Title A-Z
        </div>
        <div 
          onClick={() => onFiltersChange({ ...currentFilters, sortBy: 'price_tokens' })}
          className={`px-4 py-2 text-white hover:bg-[#FFDE7A]/10 ${currentFilters.sortBy === 'price_tokens' ? 'text-[#FFDE7A]' : ''}`}
        >
          Price
        </div>
      </div>
    </div>

    {/* Sort Order - Enhanced toggle */}
    <button
      onClick={() => onFiltersChange({ 
        ...currentFilters, 
        sortOrder: currentFilters.sortOrder === 'desc' ? 'asc' : 'desc' 
      })}
      className="flex items-center gap-2 px-4 py-3 bg-[#1A1A1A] border border-[#333333] rounded-lg hover:border-[#FFDE7A]/50 transition-all duration-200 group"
    >
      <ArrowUpDown className="h-4 w-4 text-[#FFDE7A] transition-transform duration-200 group-hover:scale-110" />
      <span className="text-[#FFDE7A]">
        {currentFilters.sortOrder === 'desc' ? 'Desc' : 'Asc'}
      </span>
    </button>
  </div>

  {/* Privacy Notice - Enhanced */}
  {currentFilters.status === 'submitted' && (
    <div className="mt-4 p-3 bg-[#FFDE7A]/10 border border-[#FFDE7A]/20 rounded-lg backdrop-blur-sm animate-pulse">
      <div className="flex items-start gap-2">
        <Shield className="h-4 w-4 text-[#FFDE7A] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[#FFDE7A] text-sm font-medium">Privacy Notice</p>
          <p className="text-[#FFDE7A]/80 text-xs mt-1">
            You can only see your own submitted stories. Other users' submitted stories are private.
          </p>
        </div>
      </div>
    </div>
  )}
</div>
  );
};

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasMore: boolean;
}> = ({ currentPage, totalPages, onPageChange, hasMore }) => {
  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-2 px-4 py-2 bg-[#333333] hover:bg-[#3A3A3A] disabled:bg-[#222222] disabled:text-[#666666] text-white rounded-lg transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>

      <span className="text-[#AAAAAA] px-4">
        Page {currentPage} {totalPages > 0 && `of ${totalPages}`}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasMore}
        className="flex items-center gap-2 px-4 py-2 bg-[#333333] hover:bg-[#3A3A3A] disabled:bg-[#222222] disabled:text-[#666666] text-white rounded-lg transition-colors"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export const StoriesGallery: React.FC<StoriesGalleryProps> = ({ onViewStory }) => {
  const { address, isConnected } = useAppKitAccount();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<{ id: number; username: string } | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 12,
    offset: 0,
    has_more: false
  });

  const [filters, setFilters] = useState({
    status: 'published',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Get user info when wallet connects
  const getUserInfo = async () => {
    if (!address || !isConnected) {
      setUserInfo(null);
      return;
    }

    try {
      const response = await fetch(`/api/users/signin?wallet_address=${address}`);
      const result = await response.json();
      
      if (result.success) {
        setUserInfo({
          id: result.data.user.id,
          username: result.data.user.username
        });
      } else {
        setUserInfo(null);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUserInfo(null);
    }
  };

  // Fetch stories from API with privacy controls
  const fetchStories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: filters.status,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        sort_by: filters.sortBy,
        sort_order: filters.sortOrder
      });

      // For submitted stories, enforce privacy by requiring wallet address
      if (filters.status === 'submitted') {
        if (!address || !isConnected || !userInfo?.id) {
          // If no wallet connected or user info, show empty state
          setStories([]);
          setPagination(prev => ({
            ...prev,
            total: 0,
            has_more: false
          }));
          setLoading(false);
          toast.warning('Please connect your wallet to view submitted stories');
          return;
        }
        
        // Add wallet address for backend verification
        params.append('wallet_address', address);
        // Backend will enforce that only user's own submitted stories are returned
      }

      const response = await fetch(`/api/stories?${params}`);
      const result: StoriesResponse = await response.json();

      if (result.success) {
        setStories(result.data.stories);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total,
          has_more: result.data.pagination.has_more
        }));
      } else {
        // Handle specific privacy errors
        if (response.status === 401 || response.status === 403) {
          toast.error('Access denied: You can only view your own submitted stories');
          setStories([]);
          setPagination(prev => ({
            ...prev,
            total: 0,
            has_more: false
          }));
        } else {
          toast.error(result.message || 'Failed to fetch stories');
          setStories([]);
        }
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories');
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: typeof filters) => {
    // If switching to submitted stories without being connected, switch to published
    if (newFilters.status === 'submitted' && !isConnected) {
      toast.warning('Please connect your wallet to view submitted stories');
      newFilters.status = 'published';
    }

    setFilters(newFilters);
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * pagination.limit;
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  // Handle story click - navigate to individual story page
  const handleReadStory = (story: Story) => {
    if (onViewStory) {
      onViewStory(story); // trigger modal in parent
    } else {
      router.push(`/stories/${story.id}`);
    }
  };
  

  // Get user info when wallet connects
  useEffect(() => {
    getUserInfo();
  }, [address, isConnected]);

  // Fetch stories when filters, pagination, or user info changes
  useEffect(() => {
    fetchStories();
  }, [filters, pagination.offset, userInfo]);

  // Reset to published stories when wallet disconnects
  useEffect(() => {
    if (!isConnected && filters.status === 'submitted') {
      setFilters(prev => ({ ...prev, status: 'published' }));
    }
  }, [isConnected]);

  const getEmptyStateMessage = () => {
    if (filters.status === 'submitted') {
      return {
        title: 'No submitted stories',
        description: 'You haven\'t submitted any stories yet. Create your first story to get started!'
      };
    }
    return {
      title: 'No stories found',
      description: 'Try adjusting your filters or check back later for new stories.'
    };
  };

  const emptyState = getEmptyStateMessage();

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <FilterBar 
        currentFilters={filters}
        onFiltersChange={handleFiltersChange}
        isConnected={isConnected}
      />

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-[#AAAAAA]">
          {pagination.total > 0 
            ? `Showing ${pagination.offset + 1}-${Math.min(pagination.offset + pagination.limit, pagination.total)} of ${pagination.total} stories`
            : 'No stories found'
          }
        </p>
      </div>

      {/* Stories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] animate-pulse">
              <div className="h-48 bg-[#333333] rounded-t-2xl"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-[#333333] rounded w-3/4"></div>
                <div className="h-4 bg-[#333333] rounded w-1/2"></div>
                <div className="h-10 bg-[#333333] rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : stories.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                index={index}
                onReadStory={handleReadStory}
                isOwner={userInfo ? story.author.id === userInfo.id : false}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              hasMore={pagination.has_more}
            />
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-[#444444] mx-auto mb-4" />
          <h3 className="text-xl font-medium text-[#AAAAAA] mb-2">
            {emptyState.title}
          </h3>
          <p className="text-[#666666]">
            {emptyState.description}
          </p>
        </div>
      )}
    </div>
  );
};