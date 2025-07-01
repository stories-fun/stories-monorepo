"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, UploadCloud } from "lucide-react";
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

  const handleSave = () => {
    if (!username || !email) return;
    onSave({ username, email, profilePhoto: photoFile || undefined });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="relative">
        <div className="bg-[#FFEEBA] text-[#141414] p-6 sm:p-8 w-full max-w-xl relative shadow-xl border border-[#141414]">
          <div className="relative z-10 space-y-4">
            <h2 className="font-bold text-xl sm:text-2xl text-center">
              Update Profile
            </h2>

            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center">
              <div
                className="w-24 h-24 rounded-full border-2 border-[#141414] overflow-hidden bg-white"
              >
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt="Profile preview"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-gray-400">
                    No photo
                  </div>
                )}
              </div>
              <CustomButton
                text="Upload Photo"
                icon={UploadCloud}
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-sm bg-[#FFDE7A] hover:bg-[#ffd07a] active:bg-yellow-600"
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Username Input */}
            <div>
              <label className="block font-medium text-sm mb-1">Username</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-[#141414] rounded-lg bg-white text-[#141414]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            {/* Email Input */}
            <div>
              <label className="block font-medium text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-[#141414] rounded-lg bg-white text-[#141414]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            {/* Save Button */}
            <CustomButton
              text="Save"
              onClick={handleSave}
              className="w-full justify-center bg-[#FFDE7A] hover:bg-[#ffd07a] active:bg-yellow-600"
            />
          </div>
        </div>

        {/* Close button at bottom center */}
        <button
          onClick={onClose}
          className="absolute left-1/2 text-black translate-x-[-50%] top-full mt-4 w-10 h-10 rounded-full bg-[#FFEEBA] border border-[#141414] flex items-center justify-center shadow-md hover:text-red-600 transition-all z-10"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
