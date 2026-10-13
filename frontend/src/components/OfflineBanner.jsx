import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

export function OfflineBanner({ isOffline }) {
  if (!isOffline) return null;

  return (
    <div 
      role="status" 
      aria-live="polite"
      className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center space-x-2 shadow-md transition-all sticky top-0 z-50 animate-fadeIn"
    >
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>
        You are currently offline. You can browse cached flours, but checkout and live order placement require an internet connection.
      </span>
    </div>
  );
}
