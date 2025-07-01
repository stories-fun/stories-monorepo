'use client';

import { useSolanaAuth } from '@/context/appkit';
import { Loader2, ShieldCheck, Lock, X, User, Mail, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import CustomButton from './Button';  
import React, { useEffect, useState } from 'react';

interface SignupResponse {
  success?: boolean;
  message: string;
  error?: string;
  conflict_field?: string;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      wallet_address: string;
      created_at: string;
    };
  };
}

export function AuthButton(props: any) {
  const {
    isConnected,
    isAuthenticated,
    isAuthenticating,
    authenticate
  } = useSolanaAuth();

  const [showVerified, setShowVerified] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shouldOpenDialog, setShouldOpenDialog] = useState(false);

  useEffect(() => {
    if (isAuthenticated && shouldOpenDialog) {
      // Open dialog after successful authentication
      setIsDialogOpen(true);
      setShouldOpenDialog(false);
      setError(null);
      setSuccess(null);
    } else if (isAuthenticated && !shouldOpenDialog && !isDialogOpen) {
      // Already authenticated, show success animation
      setShowVerified(true);
      const timer = setTimeout(() => setShowVerified(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, shouldOpenDialog, isDialogOpen]);

  const handleVerifyClick = async () => {
    try {
      await authenticate();
      
      // Always open dialog after authentication attempt
      // regardless of whether auth state changed
      setIsDialogOpen(true);
      setError(null);
      setSuccess(null);
    } catch (authError) {
      console.error('Authentication error:', authError);
      // Handle authentication error if needed
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!props.walletAddress) {
      setError('Wallet address is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          wallet_address: props.walletAddress,
        }),
      });

      const data: SignupResponse = await response.json();

      if (response.ok && data.success) {
        setSuccess(data.message || 'Account created successfully!');
        
        // Wait a moment to show success message, then close dialog
        setTimeout(() => {
          setIsDialogOpen(false);
          setShowVerified(true);
          // Hide the success animation after 1.5s
          setTimeout(() => setShowVerified(false), 1500);
        }, 1500);
        
      } else {
        // Handle different error cases
        let errorMessage = data.message || 'Failed to create account';
        
        if (response.status === 409) {
          // User already exists
          if (data.conflict_field) {
            errorMessage = `A user with this ${data.conflict_field.replace('_', ' ')} already exists`;
          }
        } else if (response.status === 400) {
          // Validation error
          errorMessage = data.message || 'Please check your input and try again';
        } else if (response.status >= 500) {
          // Server error
          errorMessage = 'Server error. Please try again later.';
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Network error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setUsername('');
    setEmail('');
    setError(null);
    setSuccess(null);
  };

  if (!isConnected) return null;
  if (isAuthenticated && !showVerified && !isDialogOpen) return null;

  const getStatus = () => {
    if (isAuthenticating || isSubmitting) {
      return {
        content: <Loader2 size={20} className="animate-spin mx-auto" />,
        className: '!p-1 w-10 bg-yellow-500 hover:bg-yellow-600 text-black',
        disabled: true,
      };
    }

    if (isAuthenticated && !isDialogOpen) {
      return {
        content: (
          <ShieldCheck
            size={20}
            className="animate-ping-slow text-white mx-auto"
          />
        ),
        className: '!p-1 w-10 bg-green-500 hover:bg-green-600 text-white',
        disabled: true,
      };
    }

    return {
      content: (
        <div className="flex items-center gap-2 px-2">
          <Lock size={18} />
          <span className="text-sm">Verify</span>
        </div>
      ),
      className: 'bg-orange-500 hover:bg-orange-600 text-white',
      disabled: false,
    };
  };

  const { content, className, disabled } = getStatus();

  return (
    <>
      <CustomButton
        text={content}
        onClick={disabled ? undefined : handleVerifyClick}
        className={className}
        disabled={disabled}
      />

      {/* Dialog/Modal - Opens after authentication */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 relative">
            {/* Close Button */}
            <button
              onClick={closeDialog}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>

            {/* Dialog Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
              <p className="text-gray-600">Wallet authenticated! Now complete your profile to finish registration</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Wallet Address Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Wallet size={16} className="inline mr-2" />
                  Authenticated Wallet
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-gray-700 text-sm font-mono break-all border-green-200">
                  {props.walletAddress || 'No wallet address provided'}
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your username"
                  required
                  disabled={isSubmitting}
                  minLength={1}
                  maxLength={50}
                />
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your email address"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!username.trim() || !email.trim() || isSubmitting || !props.walletAddress}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Saving Profile...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </form>

            {/* Required fields note */}
            <p className="text-xs text-gray-500 mt-3">* Required fields</p>
          </div>
        </div>
      )}
    </>
  );
}