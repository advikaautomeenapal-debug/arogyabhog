import React, { useEffect } from 'react';
import { Bell, MessageSquare, Truck, CheckCircle2, Sparkles, X, ArrowRight } from 'lucide-react';

export function FloatingNotificationBanner({ notification, onDismiss, onAction }) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const isMessage = notification.type === 'NEW_MESSAGE';
  const isDelivered = notification.type === 'DELIVERED';
  const isDispatched = notification.type === 'DISPATCHED' || notification.type === 'ORDER_ACCEPTED';

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md animate-slideDown shadow-2xl"
      role="alert"
    >
      <div className="rounded-2xl bg-[#181818]/95 dark:bg-[#161616]/95 backdrop-blur-md border-2 border-[#C9A227] p-3.5 sm:p-4 text-white shadow-2xl flex items-start space-x-3 selection:bg-[#C9A227] selection:text-black">
        
        {/* Leading Icon Badge */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isMessage 
            ? 'bg-sky-500/20 text-sky-400 border border-sky-400/40' 
            : isDelivered 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40' 
              : isDispatched
                ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
                : 'bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]/40'
        }`}>
          {isMessage ? (
            <MessageSquare className="w-5 h-5 animate-bounce" />
          ) : isDelivered ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : isDispatched ? (
            <Truck className="w-5 h-5 animate-pulse" />
          ) : (
            <Bell className="w-5 h-5 animate-pulse" />
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]/30">
              {notification.orderNumber || 'Arogya Bhog'}
            </span>
            <span className="text-[10px] text-gray-400 font-sans">Just now</span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug truncate">
            {notification.title}
          </h4>

          <p className="text-xs text-gray-300 dark:text-[#d0c5af] mt-0.5 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2 mt-2.5">
            <button
              onClick={() => {
                onAction(notification);
                onDismiss();
              }}
              className="py-1 px-3 rounded-lg bg-[#C9A227] hover:bg-[#b8911f] text-black font-bold text-[11px] uppercase tracking-wider flex items-center space-x-1 transition-all shadow-sm cursor-pointer"
            >
              <span>{isMessage ? 'Reply to Chat' : 'View Order Details'}</span>
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </button>
            <button
              onClick={onDismiss}
              className="py-1 px-2.5 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white text-[11px] font-medium transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
