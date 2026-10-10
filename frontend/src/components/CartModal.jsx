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
                className="p-4 bg-gray-50 dark:bg-[#1F1F1F] border border-gray-200 dark:border-[#2E2A20] rounded-2xl space-y-2.5 relative shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-caps text-[#C9A227] font-bold block">
                      {item.isCustom ? 'CUSTOM CHAKKI FORMULA' : 'SIGNATURE DOCTOR RECIPE'}
                    </span>
                    <h3 className="font-editorial text-sm font-semibold text-gray-900 dark:text-[#FDFBF7] mt-0.5">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-[#99907C]">
                      Pack Size: <span className="text-gray-900 dark:text-[#FDFBF7] font-medium">{item.batchSizeKg} kg</span> • Fineness: <span className="text-[#C9A227]">{item.fineness || 'Medium (Phulka)'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(idx)}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Grain breakdown summary */}
                {item.grainBreakdown && item.grainBreakdown.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-gray-200 dark:border-[#2E2A20]/60">
                    {item.grainBreakdown.slice(0, 5).map((g, gi) => (
                      <span key={gi} className="text-[9px] px-2 py-0.5 bg-white dark:bg-[#161616] text-gray-700 dark:text-[#D0C5AF] border border-gray-200 dark:border-[#2E2A20] rounded-md">
                        {g.percentage}% {g.name.split(' ')[0]}
                      </span>
                    ))}
                    {item.grainBreakdown.length > 5 && (
                      <span className="text-[9px] px-2 py-0.5 bg-white dark:bg-[#161616] text-[#C9A227] border border-gray-200 dark:border-[#2E2A20] rounded-md">
                        +{item.grainBreakdown.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* Quantity & Item Total */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-[#2E2A20]">
                  <div className="flex items-center border border-gray-200 dark:border-[#2E2A20] bg-white dark:bg-[#161616] rounded-xl overflow-hidden">
                    <button
                      onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                      className="px-2.5 py-1 text-sm text-gray-700 dark:text-[#FDFBF7] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-[#C9A227]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                      className="px-2.5 py-1 text-sm text-gray-700 dark:text-[#FDFBF7] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 dark:text-[#99907C] block">
                      {item.pricePerKg ? `₹${item.pricePerKg}/kg` : ''}
                    </span>
                    <span className="font-sans font-bold text-base text-[#C9A227]">
                      ₹{item.totalItemPrice}
                    </span>
                  </div>
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
