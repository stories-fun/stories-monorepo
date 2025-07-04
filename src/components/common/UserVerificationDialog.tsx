// src/components/common/UserVerificationDialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Wallet,
  Loader2,
  Send,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

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
    username: "",
    email: "",
    wallet_address: walletAddress,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // OTP related state - FIXED: Changed to string and proper implementation
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState(""); // Store the generated OTP
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);

  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      wallet_address: walletAddress,
    }));
  }, [walletAddress]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => {
        setOtpCountdown(otpCountdown - 1);
      }, 1000);
    } else if (otpCountdown === 0 && isOtpSent) {
      setCanResendOtp(true);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown, isOtpSent]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!isOtpVerified) {
      newErrors.email_verification = "Please verify your email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // FIXED: Generate random 6-digit OTP
  const getRandomSixDigit = () => {
    return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
  };

  // FIXED: Proper send email function
  const sendEmail = async () => {
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address first');
      return;
    }

    setIsSendingOtp(true);
    
    try {
      // Generate new OTP
      const newOtp = getRandomSixDigit();
      setGeneratedOtp(newOtp.toString());

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: formData.email, 
          otp: newOtp 
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsOtpSent(true);
        setCanResendOtp(false);
        setOtpCountdown(60); // 60 second countdown
        toast.success('OTP sent to your email address');
        console.log('OTP sent:', newOtp); // For debugging - remove in production
      } else {
        toast.error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // FIXED: Proper OTP verification function
  const verifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      toast.error("OTP must be 6 digits");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      // Compare entered OTP with generated OTP
      if (otp === generatedOtp) {
        setIsOtpVerified(true);
        toast.success('Email verified successfully!');
        // Clear any email-related errors
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email_verification;
          return newErrors;
        });
      } else {
        toast.error('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          email_verified: true, // Include verification status
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Account created successfully!");
        onSuccess(result.data.user);
        onClose();
        // Reset form
        resetForm();
      } else {
        toast.error(result.message || "Failed to create account");

        // Handle specific field errors
        if (result.conflict_field) {
          setErrors({
            [result.conflict_field]: `This ${result.conflict_field} is already taken`,
          });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      wallet_address: walletAddress,
    });
    setOtp("");
    setGeneratedOtp("");
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpCountdown(0);
    setCanResendOtp(true);
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }

    // Reset OTP verification if email changes
    if (field === "email" && isOtpSent) {
      setIsOtpSent(false);
      setIsOtpVerified(false);
      setOtp("");
      setGeneratedOtp("");
      setOtpCountdown(0);
      setCanResendOtp(true);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
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
            title="Close dialog"
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
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  className={`w-full pl-10 pr-4 py-3 bg-[#222222] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] ${
                    errors.username ? "border-red-500" : "border-[#333333]"
                  }`}
                  placeholder="Enter your username"
                  disabled={isSubmitting}
                />
              </div>
              {errors.username && (
                <p className="text-red-400 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email Field with Send OTP Button */}
            <div>
              <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                Email Address
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-[#666666]" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-[#222222] border rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF] ${
                      errors.email ? "border-red-500" : "border-[#333333]"
                    } ${isOtpVerified ? "border-green-500" : ""}`}
                    placeholder="Enter your email"
                    disabled={isSubmitting || isOtpVerified}
                  />
                  {isOtpVerified && (
                    <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-green-500" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={
                    isSendingOtp ||
                    !canResendOtp ||
                    isOtpVerified ||
                    !formData.email
                  }
                  className="px-4 py-3 bg-[#00A3FF] hover:bg-[#0088CC] disabled:bg-[#333333] disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 min-w-[120px] justify-center"
                >
                  {isSendingOtp ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {isOtpSent && !canResendOtp
                        ? `${otpCountdown}s`
                        : isOtpSent
                        ? "Resend"
                        : "Send OTP"}
                    </>
                  )}
                </button>
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
              {isOtpVerified && (
                <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Email verified successfully
                </p>
              )}
            </div>

            {/* OTP Input Section */}
            {isOtpSent && !isOtpVerified && (
              <div>
                <label className="block text-sm font-medium text-[#AAAAAA] mb-2">
                  Email Verification Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Shield className="absolute left-3 top-3 h-5 w-5 text-[#666666]" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-10 pr-4 py-3 bg-[#222222] border border-[#333333] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#00A3FF]"
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      disabled={isSubmitting || isVerifyingOtp}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={isVerifyingOtp || otp.length !== 6}
                    className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-[#333333] disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2 min-w-[100px] justify-center"
                  >
                    {isVerifyingOtp ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
                <p className="text-[#666666] text-xs mt-1">
                  Enter the 6-digit code sent to your email
                </p>
              </div>
            )}

            {/* Show verification requirement error */}
            {errors.email_verification && (
              <p className="text-red-400 text-sm">
                {errors.email_verification}
              </p>
            )}

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
                  placeholder="Wallet address"
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
            disabled={isSubmitting || !isOtpVerified}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-[#00A3FF] to-[#00F0FF] hover:opacity-90 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Creating...
              </>
            ) : (
              "Verify Account"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};