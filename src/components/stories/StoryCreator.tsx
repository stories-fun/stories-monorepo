// src/components/stories/StoryCreator.tsx
'use client';

import React, { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { toast } from 'sonner';
import { 
  PenTool, 
  FileText, 
  DollarSign, 
  Send, 
  Loader2,
  AlertCircle,
  Check,
  Eye,
  Lock,
  Type,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Video,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote
} from 'lucide-react';
import CustomButton from '@/components/common/Button';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

interface StoryFormData {
  title: string;
  content: string;
  price_tokens: number;
}

// Fixed error type to handle string error messages
interface StoryFormErrors {
  title?: string;
  content?: string;
  price_tokens?: string;
}

interface StoryCreationResponse {
  success: boolean;
  message: string;
  data?: {
    story: {
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
    };
    submission?: {
      submission_id: number;
      status: string;
      submitted_at: string;
    };
  };
  error?: string;
}

export const StoryCreator: React.FC<{
  onSuccess?: (storyData: any) => void;
  onCancel?: () => void;
}> = ({ onSuccess, onCancel }) => {
  const { address, isConnected } = useAppKitAccount();
  const [formData, setFormData] = useState<StoryFormData>({
    title: '',
    content: '',
    price_tokens: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<StoryFormErrors>({});
  const [showPreview, setShowPreview] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Formatting functions
  const insertFormatting = (prefix: string, suffix: string = '', placeholder: string = '') => {
    const textarea = document.getElementById('story-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const selectedText = formData.content.substring(startPos, endPos);
    const beforeText = formData.content.substring(0, startPos);
    const afterText = formData.content.substring(endPos);

    let newText;
    if (selectedText) {
      newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
      setCursorPosition(startPos + prefix.length + selectedText.length + suffix.length);
    } else {
      newText = `${beforeText}${prefix}${placeholder}${suffix}${afterText}`;
      setCursorPosition(startPos + prefix.length + placeholder.length + suffix.length);
    }

    setFormData(prev => ({ ...prev, content: newText }));
    
    // Focus back on textarea after a small delay
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 10);
  };
  // Validation functions
  const validateForm = (): boolean => {
    const newErrors: StoryFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length > 255) {
      newErrors.title = 'Title must be 255 characters or less';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.trim().length > 50000) {
      newErrors.content = 'Content must be 50,000 characters or less';
    }

    if (formData.price_tokens < 0) {
      newErrors.price_tokens = 'Price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('Please connect your wallet to create a story');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/stories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          price_tokens: formData.price_tokens,
          wallet_address: address,
        }),
      });

      const result: StoryCreationResponse = await response.json();

      if (response.ok && result.success) {
        toast.success('Story submitted successfully! 🎉', {
          description: 'Your story has been submitted for review and will be published once approved.',
        });
        
        // Reset form
        setFormData({
          title: '',
          content: '',
          price_tokens: 0
        });
        setErrors({});
        setShowPreview(false);

        // Call success callback if provided
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }
      } else {
        toast.error(result.message || 'Failed to create story', {
          description: result.error || 'Please try again later',
        });
      }
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Network error occurred', {
        description: 'Please check your connection and try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof StoryFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Preview component
  const StoryPreview = () => (
    <div className="bg-[#1A1A1A] rounded-xl p-6 border border-[#333333]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Story Preview</h3>
        <button
          onClick={() => setShowPreview(false)}
          className="text-[#8A8A8A] hover:text-white transition-colors"
          title="Close preview"
          aria-label="Close preview"
        >
          <Eye className="h-5 w-5" />
        </button>
      </div>
      
      <div className="prose prose-invert max-w-none text-white">
        <ReactMarkdown 
          rehypePlugins={[rehypeRaw, remarkGfm]}
          components={{
            img: ({node, ...props}) => (
              <div className="my-4">
                <img {...props} className="rounded-lg max-w-full h-auto mx-auto" />
                {props.title && (
                  <p className="text-center text-sm text-gray-400 mt-2">{props.title}</p>
                )}
              </div>
            ),
            video: ({node, ...props}) => (
              <div className="my-4">
                <video {...props} className="rounded-lg w-full" controls />
                {props.title && (
                  <p className="text-center text-sm text-gray-400 mt-2">{props.title}</p>
                )}
              </div>
            ),
            h1: ({node, ...props}) => <h1 className="text-3xl font-bold my-4" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-2xl font-bold my-3" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-xl font-bold my-2" {...props} />,
            p: ({node, ...props}) => <p className="my-3 leading-relaxed" {...props} />,
            blockquote: ({node, ...props}) => (
              <blockquote className="border-l-4 border-[#00A3FF] pl-4 py-2 my-4 italic" {...props} />
            ),
            ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-3" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
            em: ({node, ...props}) => <em className="italic" {...props} />,
          }}
        >
          {formData.content || 'Your story content will appear here...'}
        </ReactMarkdown>
      </div>
    </div>
  );


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Create Your Story</h2>
        <p className="text-[#AAAAAA]">Share your story with the world</p>
      </div>

      {/* Connection Check */}
      {!isConnected && (
        <div className="bg-[#2A1A1A] border border-[#4A2A2A] rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Wallet Connection Required</h3>
          <p className="text-[#AAAAAA] mb-4">
            Please connect your wallet to create and publish stories
          </p>
        </div>
      )}

      {/* Toggle between form and preview */}
      {isConnected && (
        <div className="flex bg-[#222222] rounded-lg p-1 border border-[#333333] w-fit mx-auto">
          <button
            onClick={() => setShowPreview(false)}
            className={`px-4 py-2 rounded-md transition-colors ${
              !showPreview 
                ? 'bg-[#00A3FF] text-white' 
                : 'text-[#AAAAAA] hover:bg-[#2A2A2A]'
            }`}
          >
            <PenTool className="h-4 w-4 inline mr-2" />
            Write
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`px-4 py-2 rounded-md transition-colors ${
              showPreview 
                ? 'bg-[#00A3FF] text-white' 
                : 'text-[#AAAAAA] hover:bg-[#2A2A2A]'
            }`}
          >
            <Eye className="h-4 w-4 inline mr-2" />
            Preview
          </button>
        </div>
      )}

      {/* Content Area */}
      {isConnected && (
        <>
              {showPreview ? (
            <StoryPreview />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field remains the same */}

              <div className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
                <label className="block text-sm font-medium text-[#AAAAAA] mb-3">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Story Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1A1A1A] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] transition-colors ${
                    errors.title ? 'border-red-500' : 'border-[#333333]'
                  }`}
                  placeholder="Enter an engaging title for your story..."
                  maxLength={255}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.title && (
                    <p className="text-red-400 text-sm">{errors.title}</p>
                  )}
                  <p className="text-xs text-[#666666] ml-auto">
                    {formData.title.length}/255 characters
                  </p>
                </div>
              </div>

              {/* Content Field with formatting toolbar */}
              <div className="text-white bg-[#222222] rounded-xl p-6 border border-[#333333]">
                <label className="block text-sm font-medium text-[#AAAAAA] mb-3">
                  <PenTool className="h-4 w-4 inline mr-2" />
                  Story Content (Markdown supported)
                </label>
                
                {/* Formatting Toolbar */}
                <div className="flex flex-wrap gap-2 mb-3 bg-[#1A1A1A] p-2 rounded-lg">
                  <button
                    type="button"
                    onClick={() => insertFormatting('# ', '', 'Main Heading')}
                    className="p-2 hover:bg-[#333333] rounded"
                    title="Heading 1"
                  >
                    <Heading1 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('## ', '', 'Subheading')}
                    className="p-2 hover:bg-[#333333] rounded"
                    title="Heading 2"
                  >
                    <Heading2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**', 'bold text')}
                    className="p-2 hover:bg-[#333333] rounded"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*', 'italic text')}
                    className="p-2 hover:bg-[#333333] rounded"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('> ', '', 'Blockquote')}
                    className="p-2 hover:bg-[#333333] rounded"
                    title="Quote"
                  >
                    <Quote className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('- ', '', 'List item')}
                    className="p-2 hover:bg-[#333333] rounded"
                    title="Unordered List"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('1. ', '', 'List item')}
                    className="p-2 hover:bg-[#333333] rounded"
                    title="Ordered List"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('![', `](image-url "optional caption")`, 'Image description')}
                    className="p-2 hover:bg-[#333333] rounded"
                    title="Image"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<video src="', `" controls title="optional title"></video>`, 'video-url')}
                    className="p-2 hover:bg-[#333333] rounded"
                    title="Video"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  id="story-content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1A1A1A] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] resize-vertical transition-colors ${
                    errors.content ? 'border-red-500' : 'border-[#333333]'
                  }`}
                  placeholder={`# Welcome to your story!\n\nStart writing here... Use markdown for formatting:\n\n## Subheadings\n**Bold text** *Italic text*\n\n![Image description](image-url "optional caption")\n\n<video src="video-url" controls></video>\n\n- List items\n1. Numbered items\n\n> Blockquotes`}
                  rows={12}
                  maxLength={50000}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.content && (
                    <p className="text-red-400 text-sm">{errors.content}</p>
                  )}
                  <p className="text-xs text-[#666666] ml-auto">
                    {formData.content.length}/50,000 characters
                  </p>
                </div>
              </div>

              {/* Price Field */}
              <div className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
                <label className="block text-sm font-medium text-[#AAAAAA] mb-3">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Story Price (STORIES Tokens)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.price_tokens}
                    onChange={(e) => handleInputChange('price_tokens', Math.max(0, parseFloat(e.target.value) || 0))}
                    className={`w-full px-4 py-3 bg-[#1A1A1A] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] transition-colors ${
                      errors.price_tokens ? 'border-red-500' : 'border-[#333333]'
                    }`}
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  {errors.price_tokens && (
                    <p className="text-red-400 text-sm">{errors.price_tokens}</p>
                  )}
                  <p className="text-xs text-[#666666]">
                    {formData.price_tokens === 0 ? '✨ Free story - accessible to everyone' : '🔒 Paid story - readers need to pay to access full content'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                {onCancel && (
                  <CustomButton
                    text="Cancel"
                    onClick={onCancel}
                    className="flex-1 !bg-[#333333] hover:!bg-[#3A3A3A] !text-white"
                    disabled={isSubmitting}
                  />
                )}
                <CustomButton
                  text={
                    isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        <span>Submit Story</span>
                      </div>
                    )
                  }
                  onClick={() => {}} // Form submission is handled by onSubmit
                  className={`${onCancel ? 'flex-1' : 'w-full'} !bg-gradient-to-r !from-[#00A3FF] !to-[#00F0FF] hover:!opacity-90`}
                  disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                />
              </div>

              {/* Submission Info */}
              <div className="bg-[#1A2A1A] border border-[#2A4A2A] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium mb-1">What happens after submission?</h4>
                    <p className="text-[#AAAAAA] text-sm leading-relaxed">
                      Your story will be submitted for review by our team. Once approved, it will be published and made available to readers. 
                      You'll be notified of the status update.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};