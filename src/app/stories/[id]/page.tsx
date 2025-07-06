// src/app/stories/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  DollarSign, 
  Share2, 
  Heart, 
  BookOpen, 
  Calendar,
  Shield,
  Loader2,
  Lock,
  Unlock,
  Eye,
  Star,
  MessageCircle,
  Flag,
  Copy,
  Twitter,
  Facebook,
  Link as LinkIcon,
  ChevronLeft,
  AlertTriangle,
  Home
} from 'lucide-react';
import Image from 'next/image';
import { Breadcrumb } from '@/components/common/Breadcrumb';

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
  approved_by?: {
    admin_id: number;
    username: string;
  };
}

interface StoryResponse {
  success: boolean;
  data: {
    story: Story;
  };
  message?: string;
}

const generateCoverImage = (title: string, id: number) => {
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
  return colors[id % colors.length];
};

const calculateReadingTime = (content: string): string => {
  const wordsPerMinute = 200;
  const wordCount = content.split(' ').length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min${minutes > 1 ? 's' : ''}`;
};

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const StoryHeader: React.FC<{ 
  story: Story; 
  onShare: () => void;
  onBack: () => void;
  isOwner: boolean;
}> = ({ story, onShare, onBack, isOwner }) => {
  const coverGradient = generateCoverImage(story.title, story.id);
  const readingTime = calculateReadingTime(story.content);
  
  const getStatusBadge = () => {
    if (story.status === 'submitted' && isOwner) {
      return (
        <div className="bg-yellow-500/90 backdrop-blur-sm text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Under Review
        </div>
      );
    }
    if (story.status === 'published') {
      return (
        <div className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Published
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Cover Section */}
      <div 
        className="h-80 md:h-96 relative overflow-hidden rounded-2xl"
        style={{ background: coverGradient }}
      >
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-10 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white p-3 rounded-full transition-all duration-200"
          title="Go back"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Share Button */}
        <button
          onClick={onShare}
          className="absolute top-6 right-6 z-10 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white p-3 rounded-full transition-all duration-200"
          title="Share story"
        >
          <Share2 className="h-6 w-6" />
        </button>

        {/* Status Badge */}
        <div className="absolute top-20 left-6 z-10">
          {getStatusBadge()}
        </div>

        {/* Price Badge */}
        {story.price_tokens > 0 && (
          <div className="absolute top-6 right-20 z-10 bg-yellow-500/90 backdrop-blur-sm text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {story.price_tokens} STORIES
          </div>
        )}

        {/* Abstract Design Elements */}
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-tr-full"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-12 left-12 w-4 h-4 bg-white/20 rounded-full"></div>
        <div className="absolute bottom-12 right-12 w-3 h-3 bg-white/15 rounded-full"></div>
        <div className="absolute bottom-24 left-24 w-2 h-2 bg-white/25 rounded-full"></div>

        {/* Story Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
            {story.title}
          </h1>
          <div className="flex items-center gap-4 text-white/80">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{readingTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{story.content.split(' ').length} words</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthorCard: React.FC<{ story: Story }> = ({ story }) => {
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
      <h3 className="text-white font-semibold mb-4">About the Author</h3>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
          {getInitials(story.author.username)}
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold text-lg">{story.author.username}</h4>
          <p className="text-[#AAAAAA] text-sm font-mono">{story.author.wallet_address}</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-[#666666] text-sm">
              <Calendar className="h-4 w-4" />
              <span>Joined {new Date(story.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ShareModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  story: Story;
}> = ({ isOpen, onClose, story }) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this story: "${story.title}"`)}%0A&url=${encodeURIComponent(currentUrl)}`,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      color: 'bg-blue-600 hover:bg-blue-700'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Share Story</h3>
          <button
            onClick={onClose}
            className="text-[#8A8A8A] hover:text-white transition-colors"
            title="Close share modal"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Copy Link */}
          <div className="bg-[#222222] rounded-lg p-4 border border-[#333333]">
            <div className="flex items-center gap-3">
              <LinkIcon className="h-5 w-5 text-[#666666]" />
              <div className="flex-1">
                <p className="text-white font-medium">Copy Link</p>
                <p className="text-[#666666] text-sm truncate">{currentUrl}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-[#333333] hover:bg-[#3A3A3A] text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Share */}
          <div className="space-y-3">
            {shareLinks.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-4 rounded-lg ${platform.color} text-white transition-colors`}
              >
                <platform.icon className="h-5 w-5" />
                <span className="font-medium">Share on {platform.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StoryViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAppKitAccount();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ id: number; username: string } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const storyId = params?.id as string;

  // Get user info
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

  // Fetch story data
  const fetchStory = async () => {
    if (!storyId) return;

    setLoading(true);
    setError(null);

    try {
      let url = `/api/stories/${storyId}`;
      
      // Add admin wallet address if connected (for admin access to any story)
      if (address && isConnected) {
        url += `?admin_wallet_address=${address}`;
      }

      const response = await fetch(url);
      const result: StoryResponse = await response.json();

      if (result.success && result.data.story) {
        setStory(result.data.story);
      } else {
        if (response.status === 404) {
          setError('Story not found');
        } else if (response.status === 403) {
          setError('You don\'t have permission to view this story');
        } else {
          setError(result.message || 'Failed to load story');
        }
      }
    } catch (error) {
      console.error('Error fetching story:', error);
      setError('Failed to load story');
      toast.error('Failed to load story');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserInfo();
  }, [address, isConnected]);

  useEffect(() => {
    fetchStory();
  }, [storyId, address]);

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const isOwner = userInfo && story && story.author.id === userInfo.id;
  const canViewContent = story && (
    story.status === 'published' || 
    (story.status === 'submitted' && isOwner)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <Loader2 className="h-12 w-12 text-[#00A3FF] mx-auto mb-4 animate-spin" />
            <p className="text-[#AAAAAA] text-lg">Loading story...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#141414] pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-16">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              {error || 'Story Not Found'}
            </h2>
            <p className="text-[#AAAAAA] mb-8">
              {error === 'Story not found' 
                ? 'The story you\'re looking for doesn\'t exist or has been removed.'
                : 'There was an issue loading this story. Please try again later.'
              }
            </p>
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-[#00A3FF] hover:bg-[#0088CC] text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb 
            items={[
              { label: 'Stories', href: '/stories' },
              { label: story?.title || 'Loading...', current: true }
            ]}
          />
        </div>

        {/* Story Header */}
        <StoryHeader 
          story={story}
          onShare={handleShare}
          onBack={handleBack}
          isOwner={isOwner || false}
        />

        {/* Main Content Area */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Story Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Story Meta */}
            <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#666666]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Published {new Date(story.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>By {story.author.username}</span>
                </div>
                {story.price_tokens > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>{story.price_tokens} STORIES</span>
                  </div>
                )}
                {story.approved_by && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Approved by {story.approved_by.username}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Story Content */}
            {canViewContent ? (
              <div className="bg-[#1A1A1A] rounded-xl p-8 border border-[#2A2A2A]">
                <div className="prose prose-invert max-w-none">
                  <div className="text-[#E0E0E0] leading-relaxed text-lg whitespace-pre-wrap font-serif">
                    {story.content}
                  </div>
                </div>
                
                {/* Story End */}
                <div className="mt-12 pt-8 border-t border-[#333333] text-center">
                  <div className="inline-flex items-center gap-2 text-[#666666] text-sm">
                    <BookOpen className="h-4 w-4" />
                    <span>End of Story</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#1A1A1A] rounded-xl p-8 border border-[#2A2A2A] text-center">
                <Lock className="h-16 w-16 text-[#444444] mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">
                  {story.status === 'submitted' ? 'Story Under Review' : 'Premium Content'}
                </h3>
                <p className="text-[#AAAAAA] mb-6">
                  {story.status === 'submitted' 
                    ? 'This story is currently being reviewed by our team.'
                    : `This story requires ${story.price_tokens} STORIES tokens to read.`
                  }
                </p>
                {story.status !== 'submitted' && (
                  <button className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors">
                    Purchase for {story.price_tokens} STORIES
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <AuthorCard story={story} />

            {/* Story Stats */}
            <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
              <h3 className="text-white font-semibold mb-4">Story Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#666666]">Word Count</span>
                  <span className="text-white">{story.content.split(' ').length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Reading Time</span>
                  <span className="text-white">{calculateReadingTime(story.content)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Status</span>
                  <span className={`capitalize ${
                    story.status === 'published' ? 'text-green-400' : 
                    story.status === 'submitted' ? 'text-yellow-400' : 'text-[#AAAAAA]'
                  }`}>
                    {story.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666666]">Price</span>
                  <span className="text-white">
                    {story.price_tokens > 0 ? `${story.price_tokens} STORIES` : 'Free'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleShare}
                className="w-full py-3 px-4 bg-[#333333] hover:bg-[#3A3A3A] text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Story
              </button>
              
              {canViewContent && (
                <button className="w-full py-3 px-4 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Flag className="h-4 w-4" />
                  Report Story
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          story={story}
        />
      </div>
    </div>
  );
}