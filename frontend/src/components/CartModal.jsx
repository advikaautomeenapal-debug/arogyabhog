import React from 'react';
import { X, Trash2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export function CartModal({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onProceedToCheckout, onStartShopping }) {
  if (!isOpen) return null;

  const totalAmount = cart.reduce((acc, item) => acc + item.totalItemPrice, 0);
  const totalWeight = cart.reduce((acc, item) => acc + (item.batchSizeKg * item.quantity), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#161616] h-full flex flex-col border-l border-gray-200 dark:border-[#2E2A20] shadow-2xl transition-colors">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-[#2E2A20] flex items-center justify-between bg-gray-50/70 dark:bg-[#1A1A1A]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#C9A227] tracking-caps block">
              CHAKKI RESERVE CART
            </span>
            <h2 className="font-editorial text-lg text-gray-900 dark:text-[#FDFBF7]">
              Stone-Ground Orders ({cart.length})
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl border border-gray-200 dark:border-[#2E2A20] hover:border-[#C9A227] text-gray-500 dark:text-[#D0C5AF] hover:text-[#C9A227] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-gray-400 dark:text-[#99907C]">
              <Sparkles className="w-10 h-10 mx-auto text-[#C9A227]/40 mb-3" />
              <p className="font-editorial text-lg text-gray-900 dark:text-[#FDFBF7]">Your Chakki Bag is Empty</p>
              <p className="text-xs text-gray-500 dark:text-[#99907C] mt-1 max-w-xs mx-auto">
                Select from our doctor-crafted signature recipes or customize your bespoke Ayurvedic grain blend.
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onStartShopping) onStartShopping();
                }}
                className="mt-6 px-6 py-2.5 bg-[#C9A227] hover:bg-[#B58F1E] text-white font-bold text-xs uppercase tracking-caps rounded-xl inline-flex items-center space-x-2 transition-all shadow-md"
              >
                <span>START SHOPPING</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div 
                key={idx}
                className="p-3.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-[#2E2A20] rounded-2xl flex items-center gap-3 relative shadow-xs hover:border-[#C9A227]/50 transition-colors"
              >
                {/* Product Thumbnail */}
                <div className="w-14 h-14 rounded-xl bg-white dark:bg-[#141414] border border-gray-200 dark:border-[#2E2A20] flex-shrink-0 flex items-center justify-center overflow-hidden p-1">
                  <img 
                    src={item.image || "/arogyaBhog_logo.png"} 
                    alt={item.name} 
                    className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.src = "/arogyaBhog_logo.png"; }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-[#FDFBF7] truncate" title={item.name}>
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-[#99907C] mt-0.5">
                    <span className="font-medium text-gray-700 dark:text-[#D0C5AF]">{item.batchSizeKg} kg Pack</span>
                    <span>•</span>
                    <span className="truncate">{item.fineness || 'Medium (Phulka)'}</span>
                  </div>
                  <div className="font-sans font-bold text-sm text-[#C9A227] mt-1">
                    ₹{item.totalItemPrice}
                  </div>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="flex items-center border border-gray-200 dark:border-[#2E2A20] bg-white dark:bg-[#141414] rounded-lg overflow-hidden shadow-xs">
                    <button
                      onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-[#D0C5AF] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-gray-900 dark:text-[#FDFBF7]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-[#D0C5AF] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with summary and CTA */}
        {cart.length > 0 && (
          <div className="p-4 bg-gray-50/80 dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-[#2E2A20] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-[#D0C5AF]">
                <span>Total Milled Weight:</span>
                <span className="font-semibold text-gray-900 dark:text-[#FDFBF7]">{totalWeight} kg</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-[#D0C5AF]">
                <span>Slow Stone Cold-Grinding:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase text-[10px]">FREE</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-[#D0C5AF]">
                <span>Fresh Doorstep Delivery:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase text-[10px]">FREE</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-[#FDFBF7] pt-2 border-t border-gray-200 dark:border-[#2E2A20]">
                <span className="font-editorial">Grand Total:</span>
                <span className="text-[#C9A227] font-sans">₹{totalAmount}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3.5 bg-[#C9A227] hover:bg-[#B58F1E] text-white font-bold text-xs uppercase tracking-caps rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-[10px] text-gray-500 dark:text-[#99907C] text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>Milled fresh upon order confirmation • Zero stale warehousing</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
