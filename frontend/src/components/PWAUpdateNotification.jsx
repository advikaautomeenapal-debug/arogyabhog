import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

export function PWAUpdateNotification({ updateAvailable, onApplyUpdate }) {
  if (!updateAvailable) return null;

  return (
    <div 
      role="alert"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#111111]/95 text-white border border-[#C9A227] px-4 py-2.5 rounded-full shadow-2xl flex items-center space-x-3 text-xs animate-slideDown backdrop-blur-md"
    >
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
      <span className="font-semibold text-gray-200">
        New Arogya Bhog update is ready!
      </span>
      <button
        onClick={onApplyUpdate}
        className="px-3 py-1 rounded-full bg-[#C9A227] hover:bg-[#B58F1E] text-white font-bold text-[11px] uppercase tracking-wider flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
      >
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Update Now</span>
      </button>
    </div>
  );
}
