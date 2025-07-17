// src/components/admin/AdminDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'sonner';
import { 
  Shield, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Calendar,
  DollarSign,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { OutputData } from "@editorjs/editorjs";
import RenderEditorOutput from "@/components/stories/RenderEditorOutput";

interface PendingStory {
  id: number;
  title: string;
  content: OutputData | string; // Updated to handle both types
  price_tokens: number;
  status: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    email: string;
    wallet_address: string;
  };
  submission: {
    submission_id: number;
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
  };
}

interface AdminInfo {
  id: number;
  name: string;
  wallet_address: string;
}

interface AdminResponse {
  success: boolean;
  data: {
    stories: PendingStory[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
    admin: AdminInfo;
  };
  message?: string;
}

// Helper function to safely parse content and extract text
const extractTextFromContent = (content: OutputData | string): string => {
  try {
    let parsedContent: OutputData;
    
    if (typeof content === 'string') {
      parsedContent = JSON.parse(content);
    } else {
      parsedContent = content;
    }

    if (!parsedContent.blocks || !Array.isArray(parsedContent.blocks)) {
      return '';
    }

    return parsedContent.blocks
      .map(block => {
        switch (block.type) {
          case 'paragraph':
            return block.data?.text?.replace(/<[^>]*>/g, '') || '';
          case 'header':
            return block.data?.text?.replace(/<[^>]*>/g, '') || '';
          case 'list':
            return block.data?.items?.join(' ') || '';
          case 'quote':
            return block.data?.text?.replace(/<[^>]*>/g, '') || '';
          case 'code':
            return block.data?.code || '';
          case 'table':
            return block.data?.content?.flat()?.join(' ') || '';
          case 'warning':
            return `${block.data?.title || ''} ${block.data?.message || ''}`;
          default:
            return '';
        }
      })
      .filter(text => text.trim().length > 0)
      .join(' ');
  } catch (error) {
    console.error('Error extracting text from content:', error);
    return 'Content unavailable';
  }
};

const StoryReaderModal: React.FC<{
  story: PendingStory | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (storyId: number) => void;
  onReject: (storyId: number, reason?: string) => void;
  isProcessing: boolean;
}> = ({ story, isOpen, onClose, onApprove, onReject, isProcessing }) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Parse story content safely
  const parseStoryContent = (): OutputData | null => {
    if (!story?.content) return null;
    
    try {
      if (typeof story.content === 'object') {
        return story.content as OutputData;
      }
      if (typeof story.content === 'string') {
        return JSON.parse(story.content) as OutputData;
      }
      return null;
    } catch (error) {
      console.error('Error parsing story content:', error);
      return null;
    }
  };

  // Calculate reading time and word count
  const getStoryStats = (content: OutputData | string) => {
    const textContent = extractTextFromContent(content);
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute
    const charCount = textContent.length;
    return { wordCount, readingTime, charCount };
  };

  // Handle scroll to track reading progress
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setReadingProgress(Math.min(100, Math.max(0, progress)));
  };

  const handleApprove = () => {
    onApprove(story!.id);
    onClose();
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    onReject(story!.id, rejectReason.trim() || undefined);
    setShowRejectModal(false);
    setRejectReason('');
    onClose();
  };

  if (!isOpen || !story) return null;

  const stats = getStoryStats(story.content);
  const parsedContent = parseStoryContent();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header with Progress Bar */}
        <div className="p-6 border-b border-[#2A2A2A] flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Story Review</h2>
            <button
              onClick={onClose}
              className="text-[#8A8A8A] hover:text-white transition-colors"
              disabled={isProcessing}
              title="Close"
            >
              <XCircle size={24} />
            </button>
          </div>
          
          {/* Reading Progress Bar */}
          <div className="w-full bg-[#333333] rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
          
          {/* Story Meta Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-[#222222] rounded-lg p-3 text-center">
              <div className="text-[#AAAAAA]">Words</div>
              <div className="text-white font-bold">{stats.wordCount.toLocaleString()}</div>
            </div>
            <div className="bg-[#222222] rounded-lg p-3 text-center">
              <div className="text-[#AAAAAA]">Reading Time</div>
              <div className="text-white font-bold">{stats.readingTime} min</div>
            </div>
            <div className="bg-[#222222] rounded-lg p-3 text-center">
              <div className="text-[#AAAAAA]">Price</div>
              <div className="text-white font-bold">{story.price_tokens} STORIES</div>
            </div>
            <div className="bg-[#222222] rounded-lg p-3 text-center">
              <div className="text-[#AAAAAA]">Submitted</div>
              <div className="text-white font-bold">{new Date(story.submission.submitted_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Story Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
            <div className="p-6">
              {/* Story Title */}
              <h1 className="text-3xl font-bold text-white mb-6 leading-tight">
                {story.title}
              </h1>
              
              {/* Author Info */}
              <div className="flex items-center gap-4 mb-8 p-4 bg-[#222222] rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {story.author.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{story.author.username}</h3>
                  <p className="text-[#AAAAAA] text-sm">{story.author.email}</p>
                  <p className="text-[#666666] text-xs font-mono">{story.author.wallet_address}</p>
                </div>
              </div>

              {/* Story Content */}
              <div className="prose prose-invert max-w-none">
                {parsedContent ? (
                  <RenderEditorOutput data={parsedContent} />
                ) : (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>Unable to display story content. The content format may be corrupted.</p>
                  </div>
                )}
              </div>

              {/* Story End Marker */}
              <div className="mt-12 pt-8 border-t border-[#333333] text-center">
                <div className="inline-flex items-center gap-2 text-[#666666] text-sm">
                  <BookOpen className="h-4 w-4" />
                  <span>End of Story</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="w-80 border-l border-[#2A2A2A] bg-[#1A1A1A] flex flex-col">
            {/* Quick Actions */}
            <div className="p-6 border-b border-[#2A2A2A]">
              <h3 className="text-white font-semibold mb-4">Review Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-5 w-5" />
                  )}
                  Approve Story
                </button>
                
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  {isProcessing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ThumbsDown className="h-5 w-5" />
                  )}
                  Reject Story
                </button>
              </div>
            </div>

            {/* Story Analysis */}
            <div className="p-6 border-b border-[#2A2A2A]">
              <h3 className="text-white font-semibold mb-4">Content Analysis</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#AAAAAA]">Characters:</span>
                  <span className="text-white">{stats.charCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAAAAA]">Words:</span>
                  <span className="text-white">{stats.wordCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAAAAA]">Blocks:</span>
                  <span className="text-white">{parsedContent?.blocks?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAAAAA]">Reading Progress:</span>
                  <span className="text-white">{Math.round(readingProgress)}%</span>
                </div>
              </div>
            </div>

            {/* Reading Guidelines */}
            <div className="p-6 flex-1">
              <h3 className="text-white font-semibold mb-4">Review Guidelines</h3>
              
              <div className="space-y-3 text-sm text-[#AAAAAA]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Content is original and appropriate</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Story follows community guidelines</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>No spam or inappropriate content</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Title accurately represents content</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Reject Story</h3>
            <p className="text-[#AAAAAA] mb-4">
              Please provide a reason for rejecting this story. This will help the author improve their content.
            </p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this story doesn't meet our guidelines..."
              className="w-full px-3 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={4}
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 px-4 bg-[#333333] hover:bg-[#3A3A3A] text-white rounded-lg transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={isProcessing}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Confirm Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StoryReviewCard: React.FC<{
  story: PendingStory;
  onReadStory: (story: PendingStory) => void;
  onQuickApprove: (storyId: number) => void;
  onQuickReject: (storyId: number) => void;
  isProcessing: boolean;
}> = ({ story, onReadStory, onQuickApprove, onQuickReject, isProcessing }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const submitted = new Date(dateString);
    const diffMs = now.getTime() - submitted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Updated truncateContent function to handle both string and object content
  const truncateContent = (content: OutputData | string, maxLength: number = 150) => {
    const textContent = extractTextFromContent(content);
    if (textContent.length <= maxLength) return textContent;
    return textContent.substring(0, maxLength).trim() + '...';
  };

  const getWordCount = (content: OutputData | string) => {
    const textContent = extractTextFromContent(content);
    return textContent.split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] hover:border-[#3A3A3A] transition-all duration-200">
      {/* Header */}
      <div className="p-6 border-b border-[#2A2A2A]">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-white font-bold text-lg line-clamp-2 flex-1 mr-4">
            {story.title}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Pending
            </div>
          </div>
        </div>

        {/* Author Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {story.author.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{story.author.username}</p>
            <p className="text-[#666666] text-xs">{story.author.email}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#666666]">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{getTimeAgo(story.submission.submitted_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{getWordCount(story.content)} words</span>
          </div>
          {story.price_tokens > 0 && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{story.price_tokens} STORIES</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Preview */}
      <div className="p-6 border-b border-[#2A2A2A]">
        <p className="text-[#AAAAAA] leading-relaxed">
          {truncateContent(story.content)}
        </p>
      </div>

      {/* Actions */}
      <div className="p-6 flex gap-3">
        <button
          onClick={() => onReadStory(story)}
          className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <BookOpen className="h-4 w-4" />
          Read Full Story
        </button>
        
        <button
          onClick={() => onQuickReject(story.id)}
          disabled={isProcessing}
          className="py-2 px-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
          title="Quick Reject"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
        </button>
        
        <button
          onClick={() => onQuickApprove(story.id)}
          disabled={isProcessing}
          className="py-2 px-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
          title="Quick Approve"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </button>
      </div>
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
    <div className="flex items-center justify-center gap-4">
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

export const AdminDashboard: React.FC = () => {
  const { address, isConnected } = useAppKitAccount();
  const [stories, setStories] = useState<PendingStory[]>([]);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedStory, setSelectedStory] = useState<PendingStory | null>(null);
  const [showReaderModal, setShowReaderModal] = useState(false);
  
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    has_more: false
  });

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Fetch pending stories for admin review
  const fetchPendingStories = async () => {
    if (!address || !isConnected) {
      setIsAdmin(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        wallet_address: address,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        sort_by: 'created_at',
        sort_order: 'asc'
      });

      const response = await fetch(`/api/admin/stories?${params}`);
      const result: AdminResponse = await response.json();

      if (result.success) {
        setStories(result.data.stories);
        setAdminInfo(result.data.admin);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total,
          has_more: result.data.pagination.has_more
        }));
        setIsAdmin(true);
      } else {
        if (response.status === 403) {
          setIsAdmin(false);
          toast.error('Admin access required');
        } else {
          toast.error(result.message || 'Failed to fetch pending stories');
        }
        setStories([]);
      }
    } catch (error) {
      console.error('Error fetching pending stories:', error);
      toast.error('Failed to load admin dashboard');
      setIsAdmin(false);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle story approval
  const handleApprove = async (storyId: number) => {
    if (!address) return;

    setProcessing(storyId);
    try {
      const response = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
          story_id: storyId,
          action: 'approve'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Story approved successfully!`);
        // Remove the approved story from the list
        setStories(prev => prev.filter(story => story.id !== storyId));
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1
        }));
      } else {
        toast.error(result.message || 'Failed to approve story');
      }
    } catch (error) {
      console.error('Error approving story:', error);
      toast.error('Failed to approve story');
    } finally {
      setProcessing(null);
    }
  };

  // Handle story rejection
  const handleReject = async (storyId: number, reason?: string) => {
    if (!address) return;

    setProcessing(storyId);
    try {
      const response = await fetch('/api/admin/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
          story_id: storyId,
          action: 'reject',
          reason: reason
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Story rejected successfully!`);
        // Remove the rejected story from the list
        setStories(prev => prev.filter(story => story.id !== storyId));
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1
        }));
      } else {
        toast.error(result.message || 'Failed to reject story');
      }
    } catch (error) {
      console.error('Error rejecting story:', error);
      toast.error('Failed to reject story');
    } finally {
      setProcessing(null);
    }
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * pagination.limit;
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  // Handle read story
  const handleReadStory = (story: PendingStory) => {
    setSelectedStory(story);
    setShowReaderModal(true);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchPendingStories();
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchPendingStories();
    } else {
      setIsAdmin(false);
      setStories([]);
      setAdminInfo(null);
    }
  }, [address, isConnected, pagination.offset]);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#141414] pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="h-16 w-16 text-[#444444] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h2>
          <p className="text-[#AAAAAA] mb-8">
            Please connect your wallet to access the admin dashboard
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 text-[#00A3FF] mx-auto mb-4 animate-spin" />
            <p className="text-[#AAAAAA]">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not admin state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#141414] pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-[#AAAAAA] mb-8">
            You don't have admin privileges to access this dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-[#AAAAAA]">
                Welcome, {adminInfo?.name}! Review and approve submitted stories.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-[#333333] hover:bg-[#3A3A3A] text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                <h3 className="text-white font-medium">Pending Stories</h3>
              </div>
              <div className="text-2xl font-bold text-white">{pagination.total}</div>
              <p className="text-[#666666] text-sm">Awaiting your review</p>
            </div>

            <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <h3 className="text-white font-medium">Actions Today</h3>
              </div>
              <div className="text-2xl font-bold text-white">-</div>
              <p className="text-[#666666] text-sm">Stories processed</p>
            </div>

            <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#2A2A2A]">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <h3 className="text-white font-medium">Admin Status</h3>
              </div>
              <div className="text-lg font-bold text-green-400">Active</div>
              <p className="text-[#666666] text-sm">Logged in as admin</p>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {pagination.total > 0 && (
          <div className="flex justify-between items-center mb-6">
            <p className="text-[#AAAAAA]">
              Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} pending stories
            </p>
            <div className="text-[#666666] text-sm">
              Sorted by submission date (oldest first)
            </div>
          </div>
        )}

        {/* Stories Grid */}
        {stories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 mb-8">
              {stories.map((story) => (
                <StoryReviewCard
                  key={story.id}
                  story={story}
                  onReadStory={handleReadStory}
                  onQuickApprove={handleApprove}
                  onQuickReject={(storyId) => handleReject(storyId, 'Quick rejection by admin')}
                  isProcessing={processing === story.id}
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
            <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">
              All Caught Up!
            </h3>
            <p className="text-[#AAAAAA]">
              No pending stories to review at the moment.
            </p>
          </div>
        )}

        {/* Story Reader Modal */}
        <StoryReaderModal
          story={selectedStory}
          isOpen={showReaderModal}
          onClose={() => {
            setShowReaderModal(false);
            setSelectedStory(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          isProcessing={processing === selectedStory?.id}
        />
      </div>
    </div>
  );
};