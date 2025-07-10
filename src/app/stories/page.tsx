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
  Search
} from 'lucide-react';
import { StoryCreator } from '@/components/stories/StoryCreator';
import { StoriesGallery } from '@/components/stories/StoriesGallery';
import CustomButton from '@/components/common/Button';
import { StorySnippetModal } from './StorySnippetModal';
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
  };
}
interface StoriesGalleryProps {
  onViewStory?: (story: Story) => void;
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

export default function StoriesPage() {
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [activeTab, setActiveTab] = useState<'discover' | 'create' | 'my-stories'>('discover');
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showSnippetModal, setShowSnippetModal] = useState(false);

  const fetchMyStories = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const userResponse = await fetch(`/api/users/signin?wallet_address=${address}`);
      const userResult = await userResponse.json();
      if (userResult.success) {
        const userId = userResult.data.user.id;
        const allStories: Story[] = [];
        const statuses = ['submitted', 'approved', 'published'];

        for (const status of statuses) {
          const url = status === 'submitted'
            ? `/api/stories?status=${status}&wallet_address=${address}&limit=50`
            : `/api/stories?status=${status}&author_id=${userId}&limit=50`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.success && json.data?.stories) {
            allStories.push(...json.data.stories);
          }
        }

        const uniqueStories = allStories.filter(
          (story, index, self) => index === self.findIndex(s => s.id === story.id)
        );
        uniqueStories.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setMyStories(uniqueStories);
      } else {
        toast.error('Failed to authenticate user');
        setMyStories([]);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to fetch your stories');
      setMyStories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-stories' && address) {
      fetchMyStories();
    }
  }, [activeTab, address]);

  useEffect(() => {
    document.body.style.overflow = showSnippetModal ? 'hidden' : '';
  }, [showSnippetModal]);

  const handleStoryCreated = () => {
    toast.success('Story created successfully!');
    setActiveTab('my-stories');
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
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard icon={<FileText className="h-5 w-5 text-blue-400" />} title="Total Stories" value={stats.totalStories} description="Stories created" trend="2" />
                <StatsCard icon={<CheckCircle2 className="h-5 w-5 text-green-400" />} title="Published" value={stats.publishedStories} description="Live stories" trend="1" />
                <StatsCard icon={<Clock className="h-5 w-5 text-yellow-400" />} title="Under Review" value={stats.pendingStories} description="Awaiting approval" />
                <StatsCard icon={<TrendingUp className="h-5 w-5 text-purple-400" />} title="Potential Earnings" value={`${stats.totalEarnings} STORIES`} description="From story pricing" trend="12%" />
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Your Stories</h2>
                <div className="flex items-center gap-3">
                  <div className="flex bg-[#333333] rounded-lg p-1">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-[#00A3FF] text-white' : 'text-[#AAAAAA]'}`}>
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-[#00A3FF] text-white' : 'text-[#AAAAAA]'}`}>
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                  <CustomButton text="New Story" icon={Plus} onClick={() => setActiveTab('create')} className="!text-sm !py-2 !px-4" />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 animate-pulse">
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-[#222222] rounded-xl p-4 border border-[#333333]">
                        <div className="h-4 bg-[#333333] rounded mb-3"></div>
                        <div className="h-12 bg-[#333333] rounded mb-3"></div>
                        <div className="h-8 bg-[#333333] rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : myStories.length > 0 ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {myStories.map((story) => (
                    <QuickStoryCard key={story.id} story={story} isOwner={true} onViewStory={handleViewStory} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FileText className="h-16 w-16 text-[#444444] mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-[#AAAAAA] mb-2">No stories created yet</h3>
                  <p className="text-[#666666] mb-6">Create your first story to start sharing with the world!</p>
                  <CustomButton text="Create Your First Story" icon={Plus} onClick={() => setActiveTab('create')} />
                </div>
              )}
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
