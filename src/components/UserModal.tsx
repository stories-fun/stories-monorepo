"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, UploadCloud, User } from "lucide-react";
import CustomButton from "./Button";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: { username: string; email: string; profilePhoto?: File }) => void;
}

export default function UserModal({ isOpen, onClose, onSave }: UserModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ username?: string; email?: string }>({});

  useEffect(() => {
    if (!isOpen) {
      setUsername("");
      setEmail("");
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validateFields = () => {
    const newErrors: { username?: string; email?: string } = {};
    if (!username.trim()) {
      newErrors.username = "Username is required.";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateFields()) {
      onSave({ username, email, profilePhoto: photoFile || undefined });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2E2E2E] rounded-2xl w-full max-w-md relative overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-300 px-6 py-4 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-[#2E2E2E]/20 hover:bg-[#2E2E2E]/30 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
          <h2 className="text-xl font-bold text-white pr-12">Update Profile</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-gray-100 overflow-hidden bg-gray-50">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Profile preview"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <User size={32} />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-500 flex items-center justify-center transition-colors"
              >
                <UploadCloud size={16} className="text-white" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Click to upload photo (optional)</p>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-[#2E2E2E] focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-[#2E2E2E] focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!username || !email}
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}