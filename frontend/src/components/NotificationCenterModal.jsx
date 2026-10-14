import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  MessageSquare, 
  Truck, 
  CheckCircle2, 
  CreditCard, 
  Clock, 
  ArrowRight,
  Package
} from 'lucide-react';

function timeAgo(dateString) {
  if (!dateString) return 'Just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function NotificationCenterModal({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onOpenOrderChat,
  onViewOrder
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  if (!isOpen) return null;

  const filteredList = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#161616] border border-[#2e2a20] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden selection:bg-[#C9A227] selection:text-black">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2e2a20] bg-[#1a1a1a] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C9A227]/20 border border-[#C9A227]/40 flex items-center justify-center text-[#C9A227]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  In-App Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full leading-none">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#99907c]">
                Live milling status, fleet dispatch alerts & support updates
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                title="Mark all as read"
                className="hidden sm:flex items-center space-x-1 py-1 px-2.5 rounded-lg border border-[#2e2a20] hover:border-[#C9A227] text-xs text-[#C9A227] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="px-4 py-2 bg-[#121212] border-b border-[#24211a] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`py-1 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                filter === 'all' 
                  ? 'bg-[#C9A227] text-black shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`py-1 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                filter === 'unread' 
                  ? 'bg-[#C9A227] text-black shadow-sm' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="sm:hidden text-[11px] text-[#C9A227] hover:underline flex items-center space-x-1"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Mark Read</span>
            </button>
          )}
        </div>

        {/* Notification List Stream */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 bg-[#141414]">
          {filteredList.length === 0 ? (
            <div className="text-center py-14 p-4 space-y-2.5 text-gray-400">
              <Bell className="w-10 h-10 text-gray-600 mx-auto" />
              <h4 className="text-xs font-bold text-gray-300">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h4>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                Status changes and live messages for your flour orders will appear right here in real time.
              </p>
            </div>
          ) : (
            filteredList.map((notif) => {
              const isMessage = notif.type === 'NEW_MESSAGE';
              const isDelivered = notif.type === 'DELIVERED';
              const isDispatched = notif.type === 'DISPATCHED' || notif.type === 'ORDER_ACCEPTED';
              const isPayment = notif.type === 'PAYMENT_UPDATE';

              return (
                <div
                  key={notif._id}
                  onClick={() => {
                    if (!notif.read && onMarkRead) onMarkRead(notif._id);
                    if (isMessage && onOpenOrderChat) {
                      onOpenOrderChat(notif.orderNumber || notif.orderId);
                      onClose();
                    } else if (onViewOrder) {
                      onViewOrder(notif.orderNumber || notif.orderId);
                      onClose();
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer relative flex items-start space-x-3 ${
                    notif.read 
                      ? 'bg-[#181818] border-[#25221b] hover:border-gray-700 opacity-80' 
                      : 'bg-[#1f1b13] border-[#C9A227]/40 hover:border-[#C9A227] shadow-sm'
                  }`}
                >
                  {/* Leading Type Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isMessage 
                      ? 'bg-sky-500/20 text-sky-400' 
                      : isDelivered 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : isDispatched
                          ? 'bg-amber-500/20 text-amber-400'
                          : isPayment
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-[#C9A227]/20 text-[#C9A227]'
                  }`}>
                    {isMessage ? (
                      <MessageSquare className="w-4 h-4" />
                    ) : isDelivered ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isDispatched ? (
                      <Truck className="w-4 h-4" />
                    ) : isPayment ? (
                      <CreditCard className="w-4 h-4" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        {notif.orderNumber && (
                          <span className="font-mono text-[10px] font-bold text-[#C9A227] px-1 py-0.2 rounded bg-[#C9A227]/10">
                            {notif.orderNumber}
                          </span>
                        )}
                        <h5 className="text-xs font-bold text-white truncate">
                          {notif.title}
                        </h5>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono flex-shrink-0">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 dark:text-[#d0c5af] mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-800/60">
                      <span className="text-[10px] font-semibold text-[#C9A227] flex items-center space-x-1">
                        <span>{isMessage ? 'Open In-App Chat' : 'Track Order Progress'}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-[#C9A227] animate-pulse"></span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#121212] border-t border-[#24211a] text-center text-[10px] text-gray-500 flex-shrink-0">
          <span>Real-time notifications powered by Arogya Bhog stone-milling telemetry</span>
        </div>

      </div>
    </div>
  );
}
