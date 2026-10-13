import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  KeyRound, 
  MessageCircle, 
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';

const ADMIN_WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '919621496772';

export function ResetPasswordView({ onOpenLogin, onBackToStore }) {
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Extract token from hash query parameters e.g. #reset-password?token=...&req=...
  useEffect(() => {
    const parseTokenFromUrl = () => {
      let rawQuery = '';
      if (window.location.hash.includes('?')) {
        rawQuery = window.location.hash.split('?')[1];
      } else if (window.location.search) {
        rawQuery = window.location.search.replace(/^\?/, '');
      }

      const params = new URLSearchParams(rawQuery);
      const urlToken = params.get('token');
      if (urlToken) {
        setToken(urlToken);
        validateToken(urlToken);
      } else {
        setIsValidating(false);
        setErrorMessage('No recovery token found in link. Please click the full recovery link sent to you on WhatsApp.');
      }
    };

    parseTokenFromUrl();
  }, []);

  const validateToken = async (tok) => {
    setIsValidating(true);
    setErrorMessage('');
    try {
      const res = await api.validateRecoveryToken(tok);
      if (res.success) {
        setTokenValid(true);
        setTokenData(res);
      } else {
        setTokenValid(false);
        setErrorMessage(res.message || 'This recovery link is invalid, expired, or has already been used.');
      }
    } catch (err) {
      setTokenValid(false);
      setErrorMessage('Could not verify recovery link. Please check your network connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.resetPasswordWithRecoveryToken({
        token,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        setResetSuccess(true);
      } else {
        setErrorMessage(res.message || 'Password reset failed. The link may have expired.');
      }
    } catch (err) {
      setErrorMessage('Network error while resetting password: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactWhatsAppAgain = () => {
    const prefilledText = `Hi Arogya Bhog Admin,\n\nI need a new password recovery link for my Arogya Bhog account as my previous link expired.\n\nPlease help me reset my password.\n\nThank you.`;
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(prefilledText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#111111] text-gray-900 dark:text-[#F5F5F3] flex flex-col justify-between p-4 md:p-8 font-serif selection:bg-[#C9A227] selection:text-[#111111]">
      
      {/* Top Header */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between py-3 border-b border-gray-200 dark:border-[#2e2a20]">
        <button
          onClick={onBackToStore}
          className="text-xs font-bold text-gray-500 hover:text-[#C9A227] flex items-center space-x-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Store</span>
        </button>

        <div className="flex items-center space-x-2">
          <img 
            src="/arogyaBhog_logo.png" 
            alt="Arogya Bhog Emblem" 
            className="w-7 h-7 object-contain"
          />
          <span className="font-bold text-sm tracking-wide text-gray-900 dark:text-[#fdfbf7]">
            Arogya Bhog
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full my-8 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2A20] shadow-xl rounded-2xl p-6 md:p-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 bg-amber-50/70 dark:bg-[#201D14] border border-[#C9A227]/40 rounded-2xl mx-auto flex items-center justify-center shadow-sm">
            <KeyRound className="w-7 h-7 text-[#C9A227]" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-[#F5F5F3]">
            {resetSuccess ? 'Password Reset Complete' : 'Set New Account Password'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-[#99907C]">
            {resetSuccess 
              ? 'Your Arogya Bhog account is secured with your new password.'
              : 'Create a new, secure password for your registered mobile account.'}
          </p>
        </div>

        {/* Loading Token Validation State */}
        {isValidating ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500">Verifying your single-use recovery link...</p>
          </div>
        ) : resetSuccess ? (
          /* ==========================================================
              SUCCESS VIEW (Strict Requirement: Exact Specified Message)
              ========================================================== */
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>Password Changed Successfully</span>
              </div>
              <p className="leading-relaxed font-medium">
                Your password has been reset successfully. You can now log in using your registered mobile number and new password.
              </p>
            </div>

            <button
              onClick={() => {
                if (onOpenLogin) onOpenLogin();
              }}
              className="w-full py-3.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all"
            >
              <span>LOG IN WITH NEW PASSWORD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : !tokenValid ? (
          /* ==========================================================
              INVALID OR EXPIRED TOKEN VIEW
              ========================================================== */
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>Recovery Link Invalid or Expired</span>
              </div>
              <p className="leading-relaxed">
                {errorMessage || 'This single-use recovery link has expired or has already been used to set a password.'}
              </p>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                For security reasons, Arogya Bhog password reset links are single-use only and expire after 30 minutes.
              </p>
            </div>

            <button
              onClick={handleContactWhatsAppAgain}
              className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>REQUEST NEW LINK ON WHATSAPP</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onBackToStore}
              className="w-full py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-xs font-bold text-gray-700 dark:text-[#d0c5af] hover:bg-gray-100 dark:hover:bg-[#201d14] transition-all"
            >
              Return to Storefront
            </button>
          </div>
        ) : (
          /* ==========================================================
              VALID TOKEN - NEW PASSWORD FORM
              ========================================================== */
          <form onSubmit={handleResetPassword} className="space-y-4 animate-fadeIn">
            
            {/* Customer Details Box */}
            {tokenData && (
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-[#201d14] border border-[#C9A227]/30 text-xs space-y-1">
                <div className="flex justify-between items-center text-gray-600 dark:text-[#b8af9c]">
                  <span>Customer Account:</span>
                  <strong className="text-gray-900 dark:text-[#fdfbf7]">{tokenData.customerName || 'Customer'}</strong>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-[#b8af9c]">
                  <span>Registered Mobile:</span>
                  <span className="font-mono font-bold text-[#C9A227]">{tokenData.customerPhoneMasked}</span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-gray-400 pt-1 border-t border-gray-200/50 dark:border-[#2e2a20]">
                  <Clock className="w-3 h-3 text-[#C9A227]" />
                  <span>Single-use link verified. Please set your new password below.</span>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-500/50 rounded-xl text-red-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#F5F5F3]"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#F5F5F3]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-caps flex items-center justify-center space-x-1 shadow-md transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Saving New Password...' : 'SET NEW PASSWORD'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-gray-400 py-2">
        Arogya Bhog • Stone-Ground Artisanal Vedic Flours • Official Support WhatsApp: +91 96214 96772
      </div>
    </div>
  );
}
