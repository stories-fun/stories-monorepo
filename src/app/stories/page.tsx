// src/app/stories/page.tsx
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
  TrendingUp
} from 'lucide-react';
import { StoryCreator } from '@/components/stories/StoryCreator';
import CustomButton from '@/components/common/Button';

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
  };
}

interface StoryCardProps {
  story: Story;
  isOwner?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, isOwner = false }) => {
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

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="bg-[#222222] rounded-xl p-6 border border-[#333333] hover:border-[#444444] transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-white line-clamp-2 flex-1 mr-4">
          {story.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {getStatusIcon(story.status)}
          <span className="text-sm text-[#AAAAAA]">{getStatusText(story.status)}</span>
        </div>
      </div>

      {/* Content Preview */}
      <p className="text-[#AAAAAA] mb-4 leading-relaxed">
        {truncateContent(story.content)}
      </p>

      {/* Story Metadata */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-[#666666]">
        <div className="flex items-center gap-1">
          <User className="h-4 w-4" />
          <span>{story.author.username}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{new Date(story.created_at).toLocaleDateString()}</span>
        </div>
        {story.price_tokens > 0 && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>{story.price_tokens} STORIES</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex gap-2">
        <button className="flex-1 py-2 px-4 bg-[#333333] hover:bg-[#3A3A3A] text-white rounded-lg transition-colors text-sm">
          {isOwner ? 'View Details' : 'Read Story'}
        </button>
        {isOwner && story.status === 'submitted' && (
          <button className="px-3 py-2 bg-[#2A2A1A] border border-[#4A4A2A] text-yellow-400 rounded-lg text-sm hover:bg-[#3A3A2A] transition-colors">
            Pending
          </button>
        )}
      </div>
    </div>
  );
};

const StatsCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
}> = ({ icon, title, value, description }) => (
  <div className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h3 className="text-white font-medium">{title}</h3>
    </div>
    <div className="text-2xl font-bold text-white mb-1">{value}</div>
    <p className="text-[#666666] text-sm">{description}</p>
  </div>
);

export default function StoriesPage() {
  const { address, isConnected } = useAppKitAccount();
  const [showCreator, setShowCreator] = useState(false);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'my-stories'>('create');

  // Fetch user's stories (this is a placeholder - you'll need to implement the fetch API)
  const fetchMyStories = async () => {
    if (!address) return;

    setLoading(true);
    try {
      // This is a placeholder - you'll need to implement the GET stories API
      // const response = await fetch(`/api/stories?author_wallet=${address}`);
      // const result = await response.json();
      // if (result.success) {
      //   setMyStories(result.data.stories);
      // }
      
      // Mock data for demonstration
      setTimeout(() => {
        setMyStories([]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to fetch your stories');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my-stories' && address) {
      fetchMyStories();
    }
  }, [activeTab, address]);

  const handleStoryCreated = (storyData: any) => {
    toast.success('Story created successfully!');
    setShowCreator(false);
    setActiveTab('my-stories');
    fetchMyStories(); // Refresh the stories list
  };

  // Stats data (placeholder)
  const stats = {
    totalStories: myStories.length,
    publishedStories: myStories.filter(s => s.status === 'published').length,
    pendingStories: myStories.filter(s => s.status === 'submitted').length,
    totalEarnings: myStories.reduce((sum, s) => sum + (s.price_tokens || 0), 0)
  };

  return (
    <div className="min-h-screen bg-[#141414] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Share Your Stories
          </h1>
          <p className="text-xl text-[#AAAAAA] max-w-2xl mx-auto">
            Create, publish, and monetize your stories on the blockchain. 
            Connect with readers worldwide and build your audience.
          </p>
        </div>

        {/* Navigation Tabs */}
        {isConnected && (
          <div className="flex justify-center mb-8">
            <div className="flex bg-[#222222] rounded-lg p-1 border border-[#333333]">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 rounded-md transition-colors ${
                  activeTab === 'create' 
                    ? 'bg-[#00A3FF] text-white' 
                    : 'text-[#AAAAAA] hover:bg-[#2A2A2A]'
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Create Story
              </button>
              <button
                onClick={() => setActiveTab('my-stories')}
                className={`px-6 py-3 rounded-md transition-colors ${
                  activeTab === 'my-stories' 
                    ? 'bg-[#00A3FF] text-white' 
                    : 'text-[#AAAAAA] hover:bg-[#2A2A2A]'
                }`}
              >
                <BookOpen className="h-4 w-4 inline mr-2" />
                My Stories
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="space-y-8">
          {!isConnected ? (
            /* Not Connected State */
            <div className="text-center py-16">
              <BookOpen className="h-24 w-24 text-[#444444] mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">
                Connect Your Wallet to Get Started
              </h2>
              <p className="text-[#AAAAAA] max-w-md mx-auto mb-8">
                Connect your wallet to create stories, interact with the community, 
                and start earning from your content.
              </p>
            </div>
          ) : activeTab === 'create' ? (
            /* Create Story Tab */
            <StoryCreator 
              onSuccess={handleStoryCreated}
            />
          ) : (
            /* My Stories Tab */
            <div className="space-y-8">
              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  icon={<FileText className="h-5 w-5 text-blue-400" />}
                  title="Total Stories"
                  value={stats.totalStories}
                  description="Stories you've created"
                />
                <StatsCard
                  icon={<CheckCircle2 className="h-5 w-5 text-green-400" />}
                  title="Published"
                  value={stats.publishedStories}
                  description="Live on the platform"
                />
                <StatsCard
                  icon={<Clock className="h-5 w-5 text-yellow-400" />}
                  title="Under Review"
                  value={stats.pendingStories}
                  description="Awaiting approval"
                />
                <StatsCard
                  icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
                  title="Potential Earnings"
                  value={`${stats.totalEarnings} STORIES`}
                  description="From story prices"
                />
              </div>

              {/* Stories List */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Your Stories</h2>
                  <CustomButton
                    text="Create New Story"
                    icon={Plus}
                    onClick={() => setActiveTab('create')}
                    className="!text-sm !py-2 !px-4"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-pulse">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
                            <div className="h-4 bg-[#333333] rounded mb-4"></div>
                            <div className="h-16 bg-[#333333] rounded mb-4"></div>
                            <div className="h-8 bg-[#333333] rounded"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : myStories.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myStories.map((story) => (
                      <StoryCard 
                        key={story.id} 
                        story={story} 
                        isOwner={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FileText className="h-16 w-16 text-[#444444] mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-[#AAAAAA] mb-2">
                      No stories created yet
                    </h3>
                    <p className="text-[#666666] mb-6">
                      Create your first story to start sharing with the world!
                    </p>
                    <CustomButton
                      text="Create Your First Story"
                      icon={Plus}
                      onClick={() => setActiveTab('create')}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}