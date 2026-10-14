import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Send, 
  Phone, 
  Package, 
  Calendar, 
  Sparkles 
} from 'lucide-react';
import { 
  cleanPhoneNumber, 
  formatOrderWhatsAppMessage, 
  openWhatsApp, 
  formatOrderItemsSummary 
} from '../utils/whatsappHelper';

export const AdminWhatsAppModal = ({ 
  order, 
  onClose, 
  onUpdateStatus 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('confirmed');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoAdvanceStatus, setAutoAdvanceStatus] = useState(true);

  useEffect(() => {
    if (order) {
      setCustomMessage(formatOrderWhatsAppMessage(order, selectedTemplate));
    }
  }, [order, selectedTemplate]);

  if (!order) return null;

  const phone = order.customerContact || order.customerPhone || '';
  const cleanedPhone = cleanPhoneNumber(phone);
  const itemsSummary = formatOrderItemsSummary(order);

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.warn('Clipboard write failed:', err);
    });
  };

  const handleSendWhatsApp = () => {
    if (autoAdvanceStatus && onUpdateStatus && order.orderStatus === 'PLACED') {
      onUpdateStatus(order._id, 'Confirmed');
    }
    openWhatsApp(phone, customMessage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-[#2e2a20] flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-950/20">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                <span>WhatsApp Order Dispatch</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                  {order.orderNumber}
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-[#8b826f]">
                Send instant confirmation from admin WhatsApp to customer
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-[#2e2a20] hover:border-gray-400 text-gray-400 hover:text-gray-900 dark:hover:text-[#fdfbf7] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Customer Summary Card */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Customer</span>
              <span className="font-bold text-gray-900 dark:text-[#fdfbf7]">{order.customerName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Mobile Number</span>
              <a 
                href={`tel:${phone}`}
                className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <Phone className="w-3 h-3" />
                <span>{phone}</span>
              </a>
            </div>
            <div className="col-span-2 pt-1 border-t border-gray-200 dark:border-[#222]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Ordered Product</span>
              <span className="font-medium text-gray-800 dark:text-[#d0c5af]">{itemsSummary} • ₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Template Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#8b826f] flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Select Message Template:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'confirmed', label: '1. Confirmed', desc: 'Order confirmation' },
                { id: 'milled', label: '2. Milled', desc: 'Fresh stone chakki ready' },
                { id: 'dispatched', label: '3. Out for Delivery', desc: 'Partner en route' },
                { id: 'delivered', label: '4. Delivered', desc: 'Order complete' }
              ].map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`p-2 rounded-xl text-left border transition-all text-xs ${
                    selectedTemplate === tpl.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold shadow-xs'
                      : 'border-gray-200 dark:border-[#2e2a20] hover:border-gray-300 text-gray-600 dark:text-[#8b826f]'
                  }`}
                >
                  <span className="block truncate">{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editable WhatsApp Text Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#8b826f]">
                WhatsApp Message (Editable):
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              rows="9"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-sans text-gray-900 dark:text-[#fdfbf7] leading-relaxed outline-none focus:border-emerald-500"
            />
          </div>

          {/* Auto advance order status option */}
          {order.orderStatus === 'PLACED' && (
            <label className="flex items-center space-x-2 text-xs text-gray-700 dark:text-[#d0c5af] cursor-pointer pt-1">
              <input 
                type="checkbox" 
                checked={autoAdvanceStatus} 
                onChange={(e) => setAutoAdvanceStatus(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Also advance order status to <strong>"Confirmed"</strong> when opening WhatsApp</span>
            </label>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#151515] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-gray-400 text-xs font-semibold text-gray-700 dark:text-[#d0c5af] flex items-center justify-center space-x-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Message'}</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto py-2.5 px-4 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-gray-400 text-xs font-semibold text-gray-600 dark:text-[#8b826f] transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-1/2 sm:w-auto py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all group"
            >
              <Send className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              <span>Send WhatsApp</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
