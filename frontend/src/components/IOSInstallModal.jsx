import React from 'react';
import { Share, PlusSquare, X, Smartphone, Check, Download, MoreVertical } from 'lucide-react';

export function IOSInstallModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const ua = typeof window !== 'undefined' ? (window.navigator.userAgent || '').toLowerCase() : '';
  const isIOS = /iphone|ipad|ipod/.test(ua);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#181818] rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-200/60 dark:border-[#2E2A20] space-y-5 animate-slideUp text-gray-900 dark:text-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/30 flex items-center justify-center p-1.5 shadow-xs">
              <img 
                src="/apple-touch-icon.png" 
                alt="Arogya Bhog" 
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => { e.currentTarget.src = '/arogyaBhog_logo.png'; }}
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-950 dark:text-white leading-tight">
                {isIOS ? 'Install Arogya Bhog on iOS' : 'Install Arogya Bhog App'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Add to your Device Home Screen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close installation guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-Step Installation Guide */}
        {isIOS ? (
          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/60 dark:border-zinc-700/60">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                1
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Tap the Share button in Safari
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 flex-wrap">
                  Look for the share icon 
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 font-medium text-[11px] text-sky-600">
                    <Share className="w-3 h-3 mr-1" /> Share
                  </span>
                  in Safari's bottom toolbar.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/60 dark:border-zinc-700/60">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                2
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Select "Add to Home Screen"
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 flex-wrap">
                  Scroll down the share options and tap 
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 font-medium text-[11px] text-gray-900 dark:text-white">
                    <PlusSquare className="w-3 h-3 mr-1" /> Add to Home Screen
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/60 dark:border-zinc-700/60">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                3
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Tap "Add" in the top right corner
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Arogya Bhog will appear on your Home Screen as a standalone, full-screen app.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/60 dark:border-zinc-700/60">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                1
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Open Browser Menu or Address Bar
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 flex-wrap">
                  Tap the menu icon (⋮) or the install icon 
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 font-medium text-[11px] text-amber-600">
                    <Download className="w-3 h-3 mr-1" /> Install
                  </span>
                  in your browser's address bar.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/60 dark:border-zinc-700/60">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                2
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Tap "Install App" or "Add to Home Screen"
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Select the option to install Arogya Bhog as an official app on your device.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-zinc-800/60 border border-amber-200/60 dark:border-zinc-700/60">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                3
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Confirm Installation
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Arogya Bhog will be instantly added to your home screen with offline support and quick ordering.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#C9A227] hover:bg-[#B58F1E] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer active:scale-95"
        >
          Got It, Thanks!
        </button>
      </div>
    </div>
  );
}
