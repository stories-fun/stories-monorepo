"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { toast } from "sonner";
import {
  PenTool,
  FileText,
  DollarSign,
  Send,
  Loader2,
  AlertCircle,
  Check,
  Eye,
  Quote,
  Video,
  DollarSignIcon,
  CircleDollarSign,
  Image,
} from "lucide-react";
import CustomButton from "@/components/common/Button";
import Editor from "@/components/stories/Editor";
import RenderEditorOutput from "@/components/stories/RenderEditorOutput";

import EditorJS, { OutputData } from "@editorjs/editorjs";

interface StoryFormData {
  title: string;
  banner_video_url: OutputData;
  content: OutputData;
  price_tokens: number;
  token_name: string;
  token_symbol: string;
  token_img: OutputData;
  token_description: string;
}

interface StoryFormErrors {
  title?: string;
  banner_video_url?: string;
  content?: string;
  price_tokens?: string;
  token_name?: string;
  token_symbol?: string;
  token_img?: string;
  token_description?: string;
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
      token_name: string;
      token_symbol: string;
      token_img: any;
      token_description: string;
      banner_video_url: any;
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
    title: "",
    banner_video_url: {
      time: Date.now(),
      blocks: [
        {
          type: "paragraph",
          data: {
            text: "",
          },
        },
      ],
    },
    content: {
      time: Date.now(),
      blocks: [
        {
          type: "paragraph",
          data: {
            text: "",
          },
        },
      ],
    },
    price_tokens: 0,
    token_name: "",
    token_symbol: "",
    token_img: {
      time: Date.now(),
      blocks: [
        {
          type: "paragraph",
          data: {
            text: "",
          },
        },
      ],
    },
    token_description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<StoryFormErrors>({});
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<EditorJS | null>(null);
  const bannerEditorRef = useRef<EditorJS | null>(null);
  const tokenImageEditorRef = useRef<EditorJS | null>(null);

  // Validation functions
  const validateForm = (): boolean => {
    const newErrors: StoryFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length > 255) {
      newErrors.title = "Title must be 255 characters or less";
    }

    if (
      !formData.content.blocks ||
      formData.content.blocks.length === 0 ||
      (formData.content.blocks.length === 1 &&
        formData.content.blocks[0].data.text === "")
    ) {
      newErrors.content = "Content is required";
    }

    if (formData.price_tokens < 0) {
      newErrors.price_tokens = "Price cannot be negative";
    }

    if (!formData.token_name.trim()) {
      newErrors.token_name = "Token name is required";
    } else if (formData.token_name.trim().length > 255) {
      newErrors.token_name = "Token name must be 255 characters or less";
    }

    if (!formData.token_symbol.trim()) {
      newErrors.token_symbol = "Token symbol is required";
    } else if (formData.token_symbol.trim().length > 10) {
      newErrors.token_symbol = "Token symbol must be 10 characters or less";
    }

    if (!formData.token_description.trim()) {
      newErrors.token_description = "Token description is required";
    } else if (formData.token_description.trim().length > 500) {
      newErrors.token_description = "Token description must be 500 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error("Please connect your wallet to create a story");
      return;
    }

    // Save all editor contents before submission
    if (editorRef.current) {
      try {
        const savedData = await editorRef.current.save();
        setFormData((prev) => ({ ...prev, content: savedData }));
      } catch (error) {
        console.error("Error saving editor content:", error);
        toast.error("Error saving story content");
        return;
      }
    }

    if (bannerEditorRef.current) {
      try {
        const savedBannerData = await bannerEditorRef.current.save();
        setFormData((prev) => ({ ...prev, banner_video_url: savedBannerData }));
      } catch (error) {
        console.error("Error saving banner content:", error);
        toast.error("Error saving banner content");
        return;
      }
    }

    if (tokenImageEditorRef.current) {
      try {
        const savedTokenImageData = await tokenImageEditorRef.current.save();
        setFormData((prev) => ({ ...prev, token_img: savedTokenImageData }));
      } catch (error) {
        console.error("Error saving token image content:", error);
        toast.error("Error saving token image content");
        return;
      }
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stories/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content,
          price_tokens: formData.price_tokens,
          wallet_address: address,
          token_name: formData.token_name.trim(),
          token_symbol: formData.token_symbol.trim(),
          token_img: formData.token_img,
          token_description: formData.token_description.trim(),
          banner_video_url: formData.banner_video_url,
        }),
      });

      const result: StoryCreationResponse = await response.json();

      if (response.ok && result.success) {
        toast.success("Story submitted successfully! 🎉", {
          description:
            "Your story has been submitted for review and will be published once approved.",
        });

        // Reset form
        setFormData({
          title: "",
          banner_video_url: {
            time: Date.now(),
            blocks: [
              {
                type: "paragraph",
                data: {
                  text: "",
                },
              },
            ],
          },
          content: {
            time: Date.now(),
            blocks: [
              {
                type: "paragraph",
                data: {
                  text: "",
                },
              },
            ],
          },
          price_tokens: 0,
          token_name: "",
          token_symbol: "",
          token_img: {
            time: Date.now(),
            blocks: [
              {
                type: "paragraph",
                data: {
                  text: "",
                },
              },
            ],
          },
          token_description: "",
        });
        setErrors({});
        setShowPreview(false);

        // Call success callback if provided
        if (onSuccess && result.data) {
          onSuccess(result.data);
        }
      } else {
        toast.error(result.message || "Failed to create story", {
          description: result.error || "Please try again later",
        });
      }
    } catch (error) {
      console.error("Error creating story:", error);
      toast.error("Network error occurred", {
        description: "Please check your connection and try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (
    field: keyof StoryFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle editor content changes
  const handleEditorChange = async (data: OutputData) => {
    setFormData((prev) => ({
      ...prev,
      content: data,
    }));

    // Clear content error if any
    if (errors.content) {
      setErrors((prev) => ({
        ...prev,
        content: undefined,
      }));
    }
  };

  // Handle banner editor content changes
  const handleBannerEditorChange = async (data: OutputData) => {
    setFormData((prev) => ({
      ...prev,
      banner_video_url: data,
    }));

    // Clear banner error if any
    if (errors.banner_video_url) {
      setErrors((prev) => ({
        ...prev,
        banner_video_url: undefined,
      }));
    }
  };

  // Handle token image editor content changes
  const handleTokenImageEditorChange = async (data: OutputData) => {
    setFormData((prev) => ({
      ...prev,
      token_img: data,
    }));

    // Clear token image error if any
    if (errors.token_img) {
      setErrors((prev) => ({
        ...prev,
        token_img: undefined,
      }));
    }
  };

  // Preview component
  const StoryPreview = () => {
    // Convert Editor.js data to HTML for preview
    const renderBlocks = (blocks: any[]) => {
      if (!blocks) return null;

      return blocks.map((block, index) => {
        switch (block.type) {
          case "header": {
            const level = block.data?.level ?? 2;
            const HeaderTag = `h${Math.min(
              Math.max(level, 1),
              6
            )}` as keyof JSX.IntrinsicElements;

            return React.createElement(
              HeaderTag,
              {
                key: index,
                className: `my-4 text-white font-bold ${
                  level === 1
                    ? "text-3xl"
                    : level === 2
                    ? "text-2xl"
                    : "text-xl"
                }`,
              },
              block.data?.text || ""
            );
          }
          case "paragraph":
            return (
              <p
                key={index}
                className="my-3"
                dangerouslySetInnerHTML={{ __html: block.data.text }}
              />
            );

          case "list":
            const ListTag = block.data.style === "ordered" ? "ol" : "ul";
            return (
              <ListTag key={index} className="my-3 pl-5">
                {block.data.items.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ListTag>
            );
          case "quote":
            return (
              <blockquote
                key={index}
                className="border-l-4 border-[#2A2A2A] pl-4 py-2 my-4 italic"
              >
                {block.data.text}
                {block.data.caption && (
                  <footer className="text-sm mt-2">
                    — {block.data.caption}
                  </footer>
                )}
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={index}
                className="bg-[#1A1A1A] p-4 rounded-lg overflow-x-auto my-4"
              >
                <code>{block.data.code}</code>
              </pre>
            );
          case "image": {
            const imageUrl = block.data?.file?.url || block.data?.url;
            if (!imageUrl) return null;

            const {
              withBorder,
              withBackground,
              stretched,
              rounded,
              floatLeft,
              floatRight,
            } = block.data;

            const widthClass = block.data.width
              ? `w-[${block.data.width}px]`
              : "w-full";
            const heightClass = block.data.height
              ? `h-[${block.data.height}px]`
              : "h-auto";

            return (
              <div
                key={index}
                className={`
                    my-6
                    ${withBackground ? "bg-[#1A1A1A]/50 p-4 rounded-lg" : ""}
                    ${stretched ? "w-full" : "max-w-3xl mx-auto"}
                    ${withBorder ? "border border-gray-600" : ""}
                    ${floatLeft ? "float-left mr-4 mb-4" : ""}
                    ${floatRight ? "float-right ml-4 mb-4" : ""}
                    ${!floatLeft && !floatRight ? "clear-both" : ""}
                  `}
              >
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={block.data.caption || "Story image"}
                    className={`
                        ${rounded ? "rounded-full" : "rounded-lg"}
                        ${stretched ? "w-full" : widthClass}
                        ${heightClass}
                        object-cover
                        ${block.data.fit || "object-contain"}
                      `}
                    style={{
                      aspectRatio: block.data.aspectRatio || "auto",
                      maxHeight: block.data.maxHeight || "none",
                      minHeight: block.data.minHeight || "auto",
                    }}
                  />
                  {block.data.caption && (
                    <p
                      className={`text-center text-sm text-gray-400 mt-2 ${
                        floatLeft
                          ? "text-left"
                          : floatRight
                          ? "text-right"
                          : "text-center"
                      }`}
                    >
                      {block.data.caption}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          case "embed":
            return (
              <div key={index} className="my-4">
                <div className="relative pt-[56.25%] h-0 overflow-hidden rounded-lg">
                  <iframe
                    src={block.data.embed}
                    title={block.data.caption || block.data.service}
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                {block.data.caption && (
                  <p className="text-center text-sm text-gray-400 mt-2">
                    {block.data.caption}
                  </p>
                )}
              </div>
            );

          case "table":
            return (
              <div key={index} className="my-4 overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {block.data.content.map((row: string[], i: number) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className="border px-4 py-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "warning":
            return (
              <div
                key={index}
                className="bg-yellow-100 border-l-4 border-yellow-500 p-4 my-4"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-700">
                      {block.data.title}
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>{block.data.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            );

          case "delimiter":
            return (
              <hr key={index} className="my-8 border-t-2 border-gray-300" />
            );
          default:
            return null;
        }
      });
    };

    return (
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

        <div className="space-y-6">
          {/* Banner Video Preview */}
          {formData.banner_video_url.blocks &&
            formData.banner_video_url.blocks.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">
                  Banner Video
                </h4>
                <div className="prose prose-invert max-w-none text-white bg-[#222222] rounded-lg p-4">
                  {renderBlocks(formData.banner_video_url.blocks)}
                </div>
              </div>
            )}

          {/* Story Content Preview */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">
              Story Content
            </h4>
            <div className="prose prose-invert max-w-none text-white">
              {formData.content.blocks && formData.content.blocks.length > 0 ? (
                renderBlocks(formData.content.blocks)
              ) : (
                <p className="text-gray-500">
                  Your story content will appear here...
                </p>
              )}
            </div>
          </div>

          {/* Token Details Preview */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">
              Token Details
            </h4>
            <div className="bg-[#222222] rounded-lg p-4 space-y-3">
              <p className="text-white">
                <span className="text-[#AAAAAA]">Name:</span> {formData.token_name || "Not specified"}
              </p>
              <p className="text-white">
                <span className="text-[#AAAAAA]">Symbol:</span> {formData.token_symbol || "Not specified"}
              </p>
              <p className="text-white">
                <span className="text-[#AAAAAA]">Description:</span> {formData.token_description || "Not specified"}
              </p>
              {formData.token_img.blocks && formData.token_img.blocks.length > 0 && (
                <div>
                  <p className="text-[#AAAAAA] mb-2">Token Image:</p>
                  <div className="prose prose-invert max-w-none text-white">
                    {renderBlocks(formData.token_img.blocks)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">
          Create Your Story
        </h2>
        <p className="text-[#AAAAAA]">Share your story with the world</p>
      </div>

      {/* Connection Check */}
      {!isConnected && (
        <div className="bg-[#2A1A1A] border border-[#4A2A2A] rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Wallet Connection Required
          </h3>
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
                ? "bg-[#00A3FF] text-white"
                : "text-[#AAAAAA] hover:bg-[#2A2A2A]"
            }`}
          >
            <PenTool className="h-4 w-4 inline mr-2" />
            Write
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`px-4 py-2 rounded-md transition-colors ${
              showPreview
                ? "bg-[#00A3FF] text-white"
                : "text-[#AAAAAA] hover:bg-[#2A2A2A]"
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
              {/* Banner Video Field */}
              <div className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
                <label className="block text-sm font-medium text-[#AAAAAA] mb-3">
                  <Video className="h-4 w-4 inline mr-2" />
                  Banner Video Link
                </label>

                <div className="bg-[#1A1A1A] rounded-lg overflow-hidden max-h-100">
                  <Editor
                    ref={bannerEditorRef}
                    holder="banner-editorjs"
                    data={formData.banner_video_url}
                    onChange={handleBannerEditorChange}
                  />
                </div>

                <div className="flex justify-between items-center mt-2">
                  {errors.banner_video_url && (
                    <p className="text-red-400 text-sm">
                      {errors.banner_video_url}
                    </p>
                  )}
                  <p className="text-xs text-[#666666]">
                    Add video links or embeds for your story banner
                  </p>
                </div>
              </div>

              {/* Title Field */}
              <div className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
                <label className="block text-sm font-medium text-[#AAAAAA] mb-3">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Story Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1A1A1A] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] transition-colors ${
                    errors.title ? "border-red-500" : "border-[#333333]"
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

              {/* Content Field with Editor.js */}
              <div className="text-white bg-[#222222] rounded-xl p-6 border border-[#333333]">
                <label className="block text-sm font-medium text-[#AAAAAA] mb-3">
                  <PenTool className="h-4 w-4 inline mr-2" />
                  Story Content
                </label>

                <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
                  <Editor
                    ref={editorRef}
                    holder="editorjs"
                    data={formData.content}
                    onChange={handleEditorChange}
                  />
                </div>

                <div className="flex justify-between items-center mt-2">
                  {errors.content && (
                    <p className="text-red-400 text-sm">{errors.content}</p>
                  )}
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
                    onChange={(e) =>
                      handleInputChange(
                        "price_tokens",
                        Math.max(0, parseFloat(e.target.value) || 0)
                      )
                    }
                    className={`w-full px-4 py-3 bg-[#1A1A1A] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] transition-colors ${
                      errors.price_tokens
                        ? "border-red-500"
                        : "border-[#333333]"
                    }`}
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  {errors.price_tokens && (
                    <p className="text-red-400 text-sm">
                      {errors.price_tokens}
                    </p>
                  )}
                  <p className="text-xs text-[#666666]">
                    {formData.price_tokens === 0
                      ? "✨ Free story - accessible to everyone"
                      : "🔒 Paid story - readers need to pay to access full content"}
                  </p>
                </div>
              </div>

              {/* Token Name */}
              <div className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
                <label className="block text-sm font-medium text-[#AAAAAA] mb-3">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Launch Token Name
                </label>
                <input
                  type="text"
                  value={formData.token_name}
                  onChange={(e) => handleInputChange("token_name", e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1A1A1A] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] transition-colors ${
                    errors.token_name ? "border-red-500" : "border-[#333333]"
                  }`}
                  placeholder="Enter launching token name"
                  maxLength={255}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.token_name && (
                    <p className="text-red-400 text-sm">{errors.token_name}</p>
                  )}
                  <p className="text-xs text-[#666666] ml-auto">
                    {formData.token_name.length}/255 characters
                  </p>
                </div>
              </div>

              {/* Token Symbol */}
              <div className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
                <label className="block text-sm font-medium text-[#AAAAAA] mb-3">
                  <CircleDollarSign className="h-4 w-4 inline mr-2" />
                  Launch Token Symbol
                </label>
                <input
                  type="text"
                  value={formData.token_symbol}
                  onChange={(e) => handleInputChange("token_symbol", e.target.value.toUpperCase())}
                  className={`w-full px-4 py-3 bg-[#1A1A1A] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] transition-colors ${
                    errors.token_symbol ? "border-red-500" : "border-[#333333]"
                  }`}
                  placeholder="Enter launching token symbol (e.g., BTC, ETH)"
                  maxLength={10}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.token_symbol && (
                    <p className="text-red-400 text-sm">{errors.token_symbol}</p>
                  )}
                  <p className="text-xs text-[#666666] ml-auto">
                    {formData.token_symbol.length}/10 characters
                  </p>
                </div>
              </div>

              {/* Token Image */}
              <div className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
                <label className="block text-sm font-medium text-[#AAAAAA] mb-3">
                  <Image className="h-4 w-4 inline mr-2" />
                  Launch Token Image
                </label>

                <div className="bg-[#1A1A1A] rounded-lg overflow-hidden max-h-110">
                  <Editor
                    ref={tokenImageEditorRef}
                    holder="token-image-editorjs"
                    data={formData.token_img}
                    onChange={handleTokenImageEditorChange}
                  />
                </div>

                <div className="flex justify-between items-center mt-2">
                  {errors.token_img && (
                    <p className="text-red-400 text-sm">
                      {errors.token_img}
                    </p>
                  )}
                  <p className="text-xs text-[#666666]">
                    Add images or media for your token branding
                  </p>
                </div>
              </div>

              {/* Token Description */}
              <div className="bg-[#222222] rounded-xl p-6 border border-[#333333]">
                <label className="block text-sm font-medium text-[#AAAAAA] mb-3">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Launch Token Description
                </label>
                <textarea
                  value={formData.token_description}
                  onChange={(e) => handleInputChange("token_description", e.target.value)}
                  className={`w-full px-4 py-3 bg-[#1A1A1A] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] transition-colors resize-vertical min-h-[120px] ${
                    errors.token_description ? "border-red-500" : "border-[#333333]"
                  }`}
                  placeholder="Enter launching token description..."
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.token_description && (
                    <p className="text-red-400 text-sm">{errors.token_description}</p>
                  )}
                  <p className="text-xs text-[#666666] ml-auto">
                    {formData.token_description.length}/500 characters
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
                  text={isSubmitting ? "Submitting..." : "Submit Story"}
                  icon={isSubmitting ? Loader2 : Send}
                  onClick={() => {}}
                  className={`${
                    onCancel ? "flex-1" : "w-full"
                  } !bg-gradient-to-r !from-[#00A3FF] !to-[#00F0FF] hover:!opacity-90`}
                  disabled={
                    isSubmitting ||
                    !formData.title.trim() ||
                    !formData.token_name.trim() ||
                    !formData.token_symbol.trim() ||
                    !formData.token_description.trim() ||
                    !formData.content.blocks ||
                    formData.content.blocks.length === 0 ||
                    (formData.content.blocks.length === 1 &&
                      formData.content.blocks[0].data.text === "")
                  }
                />
              </div>

              {/* Submission Info */}
              <div className="bg-[#1A2A1A] border border-[#2A4A2A] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium mb-1">
                      What happens after submission?
                    </h4>
                    <p className="text-[#AAAAAA] text-sm leading-relaxed">
                      Your story will be submitted for review by our team. Once
                      approved, it will be published and made available to
                      readers. You'll be notified of the status update.
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