// src/components/common/UserVerificationDialog.tsx
'use client';

import React, { useState } from 'react';
import { X, User, Mail, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSuccess: (userData: any) => void;
}

export const UserVerificationDialog: React.FC<UserVerificationDialogProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    wallet_address: walletAddress,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      wallet_address: walletAddress
    }));
  }, [walletAddress]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Account created successfully!');
        onSuccess(result.data.user);
        onClose();
        // Reset form
        setFormData({
          username: '',
          email: '',
          wallet_address: walletAddress,
        });
        setErrors({});
      } else {
        toast.error(result.message || 'Failed to create account');
        
        // Handle specific field errors
        if (result.conflict_field) {
          setErrors({
            [result.conflict_field]: `This ${result.conflict_field} is already taken`
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form on close
      setFormData({
        username: '',
        email: '',
        wallet_address: walletAddress,
      });
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-bold text-white">Verify Your Account</h2>
          <button
            onClick={handleClose}
            className="text-[#8A8A8A] hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[#AAAAAA] mb-6">
            Welcome! Please provide your details to complete account setup.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-[#666666]" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-[#222222] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] ${
                    errors.username ? 'border-red-500' : 'border-[#333333]'
                  }`}
                  placeholder="Enter your username"
                  disabled={isSubmitting}
                />
              </div>
              {errors.username && (
                <p className="text-red-400 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#666666]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 bg-[#222222] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] ${
                    errors.email ? 'border-red-500' : 'border-[#333333]'
                  }`}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Wallet Address Field (Read Only) */}
            <div>
              <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                Wallet Address
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-3 h-5 w-5 text-[#666666]" />
                <input
                  type="text"
                  value={formData.wallet_address}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 bg-[#2A2A2A] border border-[#333333] rounded-lg text-[#AAAAAA] cursor-not-allowed"
                />
              </div>
              <p className="text-[#666666] text-xs mt-1">
                This is automatically filled from your connected wallet
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#2A2A2A] flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 bg-[#333333] hover:bg-[#3A3A3A] text-white rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-[#00A3FF] to-[#00F0FF] hover:opacity-90 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Creating...
              </>
            ) : (
              'Verify Account'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};