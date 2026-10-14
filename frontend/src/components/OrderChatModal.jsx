import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Truck, 
  ShieldCheck, 
  User, 
  Clock, 
  CheckCircle2, 
  Package, 
  Sparkles,
  Phone,
  RotateCw
} from 'lucide-react';
import { api } from '../services/api';

export function OrderChatModal({ 
  isOpen, 
  onClose, 
  order, 
  currentUser, 
  currentRole = 'customer' 
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [orderDetails, setOrderDetails] = useState(order || null);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Sync order prop
  useEffect(() => {
    if (order) {
      setOrderDetails(order);
    }
  }, [order]);

  // Load chat messages
  const loadMessages = async (silent = false) => {
    if (!order) return;
    const orderIdentifier = order.orderNumber || order._id;
    if (!orderIdentifier) return;

    if (!silent) setIsLoading(true);
    try {
      const res = await api.getOrderMessages(orderIdentifier, currentRole);
      if (res.success) {
        setMessages(res.messages || []);
        if (res.orderStatus) {
          setOrderDetails(prev => ({
            ...prev,
            orderStatus: res.orderStatus,
            millingStatus: res.millingStatus,
            assignedDeliveryPersonName: res.assignedDeliveryPersonName || prev?.assignedDeliveryPersonName,
            assignedDeliveryPersonPhone: res.assignedDeliveryPersonPhone || prev?.assignedDeliveryPersonPhone
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load order messages:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Initial load and live polling
  useEffect(() => {
    if (isOpen && order) {
      loadMessages(false);
      pollIntervalRef.current = setInterval(() => {
        loadMessages(true);
      }, 3500);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, order?.orderNumber, order?._id, currentRole]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || !order || isSending) return;

    const orderIdentifier = order.orderNumber || order._id;
    setIsSending(true);

    const senderName = currentUser?.name || (
      currentRole === 'admin' 
        ? 'Chakki Admin' 
        : currentRole === 'delivery' 
          ? (orderDetails?.assignedDeliveryPersonName || 'Delivery Fleet') 
          : (orderDetails?.customerName || 'Customer')
    );

    const senderPhone = currentUser?.phone || (currentRole === 'customer' ? (orderDetails?.customerPhone || '') : '');

    try {
      const res = await api.sendOrderMessage(orderIdentifier, {
        text,
        senderRole: currentRole,
        senderName,
        senderPhone,
        senderId: currentUser?._id || null
      });

      if (res.success) {
        setMessages(res.data || []);
        setInputText('');
      } else {
        alert(res.message || 'Failed to send message');
      }
    } catch (e) {
      alert('Error sending message: ' + e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen || !order) return null;

  // Role-specific quick suggested chips
  const customerQuickChips = [
    'Where is my order right now?',
    'Please call before delivering',
    'Gate code / landmark details',
    'Payment ready via UPI / Cash'
  ];

  const deliveryQuickChips = [
    'On the way, reaching in 10-15 mins',
    'Reached your location / gate',
    'Please confirm flat or house number',
    'Please keep exact cash / UPI ready'
  ];

  const adminQuickChips = [
    'Order confirmed, milling underway',
    'Fresh cold-stone batch dispatched',
    'Support team is monitoring this order'
  ];

  const activeQuickChips = currentRole === 'delivery' 
    ? deliveryQuickChips 
    : currentRole === 'admin' 
      ? adminQuickChips 
      : customerQuickChips;

  const dpName = orderDetails?.assignedDeliveryPersonName || order?.assignedDeliveryPersonName;
  const dpPhone = orderDetails?.assignedDeliveryPersonPhone || order?.assignedDeliveryPersonPhone;
  const custName = orderDetails?.customerName || order?.customerName;
  const custPhone = orderDetails?.customerPhone || orderDetails?.customerContact || order?.customerPhone;
  const orderNum = orderDetails?.orderNumber || order?.orderNumber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      
      {/* Modal Card */}
      <div className="bg-[#161616] border border-[#2e2a20] rounded-2xl w-full max-w-xl h-[92vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden selection:bg-[#C9A227] selection:text-black">
        
        {/* Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#2e2a20] bg-[#1a1a1a] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#C9A227]/20 border border-[#C9A227]/40 flex items-center justify-center text-[#C9A227] flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-mono font-bold text-sm sm:text-base text-white truncate">
                  {orderNum}
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {orderDetails?.orderStatus || order?.orderStatus || 'Active'}
                </span>
              </div>
              <p className="text-xs text-[#99907c] truncate mt-0.5">
                {currentRole === 'customer' 
                  ? (dpName ? `Fleet Partner: ${dpName}` : 'Live Support & Fleet Dispatch') 
                  : `Customer: ${custName} (${custPhone || ''})`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <button
              onClick={() => loadMessages(false)}
              title="Refresh messages"
              className="p-2 rounded-xl border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Order Quick Summary Strip */}
        <div className="px-3.5 py-2 bg-[#121212] border-b border-[#24211a] flex items-center justify-between text-xs text-[#d0c5af] flex-shrink-0 overflow-x-auto">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Package className="w-3.5 h-3.5 text-[#C9A227]" />
              <span className="truncate font-medium">
                {order.items && order.items[0] ? order.items[0].name : 'Fresh Flour Blend'}
              </span>
            </span>
            <span>•</span>
            <span className="text-[#C9A227] font-mono font-bold">
              ₹{order.totalAmount}
            </span>
          </div>

          {dpPhone && (
            <a
              href={`tel:${dpPhone}`}
              className="flex items-center space-x-1 text-sky-400 hover:underline text-[11px] font-mono font-bold"
            >
              <Phone className="w-3 h-3" />
              <span>Call Fleet (+91 {dpPhone.slice(-10)})</span>
            </a>
          )}
        </div>

        {/* Messages Stream Container */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 bg-[#141414]">
          {messages.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#201d16] border border-[#C9A227]/30 mx-auto flex items-center justify-center text-[#C9A227]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">
                In-App Order Communication
              </h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Connect directly with your assigned delivery fleet and chakki admin for real-time delivery directions, landmark instructions, or questions.
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-[#1b1915] border border-[#C9A227]/30 text-[11px] text-[#C9A227] font-medium">
                Tap a quick prompt below or type your message
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isSenderCustomer = m.senderRole === 'customer';
              const isSenderDelivery = m.senderRole === 'delivery';
              const isSenderAdmin = m.senderRole === 'admin';
              
              // Is this message sent by the currently logged in view?
              const isMine = m.senderRole === currentRole;

              return (
                <div 
                  key={m._id || idx}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} animate-fadeIn`}
                >
                  {/* Sender Header Badge */}
                  <div className="flex items-center space-x-1.5 mb-1 px-1 text-[10px]">
                    {isSenderCustomer && (
                      <span className="flex items-center space-x-1 text-amber-400 font-bold">
                        <User className="w-2.5 h-2.5" />
                        <span>{m.senderName || 'Customer'}</span>
                      </span>
                    )}
                    {isSenderDelivery && (
                      <span className="flex items-center space-x-1 text-sky-400 font-bold">
                        <Truck className="w-2.5 h-2.5" />
                        <span>{m.senderName || 'Delivery Partner'}</span>
                      </span>
                    )}
                    {isSenderAdmin && (
                      <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>{m.senderName || 'Admin'}</span>
                      </span>
                    )}
                    <span className="text-gray-500 font-mono">
                      {new Date(m.createdAt || m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-3 rounded-2xl max-w-[85%] sm:max-w-[78%] text-xs leading-relaxed break-words shadow-md ${
                    isMine
                      ? 'bg-gradient-to-r from-[#C9A227] to-[#B58F1E] text-black font-medium rounded-tr-none'
                      : isSenderDelivery
                        ? 'bg-[#182635] border border-sky-500/40 text-sky-100 rounded-tl-none'
                        : isSenderAdmin
                          ? 'bg-[#172b20] border border-emerald-500/40 text-emerald-100 rounded-tl-none'
                          : 'bg-[#222222] border border-gray-700 text-gray-100 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 bg-[#121212] border-t border-[#24211a] flex items-center space-x-2 overflow-x-auto flex-shrink-0">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex-shrink-0 pl-1">
            Quick:
          </span>
          {activeQuickChips.map((chip, cIdx) => (
            <button
              key={cIdx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="px-2.5 py-1 rounded-full bg-[#1b1915] hover:bg-[#282319] border border-[#C9A227]/30 text-[11px] text-[#C9A227] whitespace-nowrap transition-colors flex-shrink-0 font-medium active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-3 bg-[#181818] border-t border-[#2e2a20] flex-shrink-0">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                currentRole === 'customer' 
                  ? 'Message delivery partner & support...' 
                  : currentRole === 'delivery'
                    ? 'Message customer about delivery...'
                    : 'Send administrative update / note...'
              }
              className="flex-1 py-2.5 px-3.5 rounded-xl bg-[#121212] border border-[#2e2a20] text-xs text-white placeholder-gray-500 outline-none focus:border-[#C9A227] transition-all font-sans"
              disabled={isSending}
            />
            
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isSending}
              className="py-2.5 px-4 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] disabled:opacity-40 text-black font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md flex-shrink-0 cursor-pointer"
            >
              <span>{isSending ? 'Sending' : 'Send'}</span>
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-gray-500">
            <span>Press Enter to send</span>
            <span>Real-time in-app delivery communication</span>
          </div>
        </div>

      </div>
    </div>
  );
}
