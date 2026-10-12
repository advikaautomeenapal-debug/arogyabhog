import React, { useState } from 'react';
import { 
  Clock, 
  Package, 
  CheckCircle2, 
  Truck, 
  ArrowRight, 
  Sparkles,
  Phone,
  Layers,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function OrdersView({ orders, onNavigateToStudio }) {
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const toggleExpand = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 md:px-6 py-5 space-y-6 pb-28">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
        <div>
          <h2 className="font-editorial text-xl md:text-2xl font-bold text-gray-900 dark:text-[#fdfbf7]">
            My Chakki Milling Orders
          </h2>
          <p className="text-xs text-gray-500 dark:text-[#99907c] mt-0.5">
            Real-time stone floor grinding tracking & payment verification status
          </p>
        </div>

        <button
          onClick={onNavigateToStudio}
          className="text-xs font-bold uppercase tracking-wider text-[#C9A227] hover:underline flex items-center space-x-1"
        >
          <span>Order Fresh Batch</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 p-6 rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-[#2e2a20] space-y-3 shadow-sm">
            <Package className="w-12 h-12 text-[#C9A227]/50 mx-auto" />
            <h3 className="font-editorial text-lg font-bold text-gray-900 dark:text-[#fdfbf7]">No Active Stone Milling Orders</h3>
            <p className="text-xs text-gray-500 dark:text-[#99907c] max-w-sm mx-auto leading-relaxed">
              You haven't ordered any fresh cold-ground atta batches yet. Experience personalized multi-grain formulation tailored to your health goals.
            </p>
            <button
              onClick={onNavigateToStudio}
              className="py-2.5 px-5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-caps shadow-md transition-all"
            >
              EXPLORE FLOUR STUDIO
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedOrderId === order._id;
            const currentStep = order.currentStep || 1;
            const firstItem = order.items && order.items[0];
            const isPaymentPending = order.paymentStatus === 'Pending';
            const isPaymentPaid = order.paymentStatus === 'Paid' || order.paymentStatus === 'Success';

            return (
              <div 
                key={order._id}
                className="p-4 md:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] space-y-4 hover:border-[#C9A227]/60 transition-all shadow-sm"
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-[#C9A227]">
                        {order.orderNumber}
                      </span>
                      {order.express && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-[#25221b] border border-[#C9A227]/40 text-[#C9A227]">
                          Express 2h
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-[#8b826f] flex items-center space-x-1 font-mono">
                        <Clock className="w-3 h-3 text-[#C9A227]" />
                        <span>
                          {new Date(order.placedAt || order.createdAt || Date.now()).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </span>
                    </div>

                    <h3 className="font-editorial text-base md:text-lg font-bold text-gray-900 dark:text-[#fdfbf7] mt-1">
                      {firstItem ? firstItem.name : 'Multigrain Atta'}
                    </h3>

                    {/* Prominent Contact Number ("in place of address must be contact number") */}
                    <div className="flex items-center space-x-2 text-xs text-[#C9A227] font-mono font-bold mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Contact: {order.customerContact || order.customerPhone}</span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-[#99907c]">
                      Slot: <span className="text-gray-800 dark:text-[#d0c5af] font-medium">{order.deliverySlot}</span> • Unit: <span className="text-[#C9A227]">{order.chakkiUnit || 'Chakki #2'}</span>
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="font-sans font-bold text-lg text-[#C9A227] block">
                      ₹{order.totalAmount}
                    </span>
                    {order.couponCode && (
                      <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 block">
                        Coupon {order.couponCode} (-₹{order.discountAmount})
                      </span>
                    )}

                    {/* PAYMENT STATUS BADGE */}
                    {isPaymentPending ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-500/50 text-amber-800 dark:text-amber-400">
                        <Clock className="w-3 h-3 animate-pulse" />
                        <span>Pending Verification</span>
                      </span>
                    ) : isPaymentPaid ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Paid & Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>{order.paymentStatus}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 4-Stage Milling Progress Bar */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className={currentStep >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-[#8b826f]'}>
                      1. Grain Mix
                    </span>
                    <span className={currentStep >= 2 ? (currentStep === 2 ? 'text-[#C9A227] animate-pulse' : 'text-emerald-600 dark:text-emerald-400') : 'text-gray-400 dark:text-[#8b826f]'}>
                      2. Stone Milling
                    </span>
                    <span className={currentStep >= 3 ? (currentStep === 3 ? 'text-[#C9A227]' : 'text-emerald-600 dark:text-emerald-400') : 'text-gray-400 dark:text-[#8b826f]'}>
                      3. Packing
                    </span>
                    <span className={currentStep >= 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-[#8b826f]'}>
                      4. Out for Delivery
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-[#202020] h-2 rounded-full flex overflow-hidden">
                    <div 
                      className="bg-[#C9A227] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, currentStep * 25)}%` }} 
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-[#99907c]">
                    <span>Floor Stage: <strong className="text-gray-900 dark:text-[#fdfbf7]">{order.millingStatus}</strong></span>
                    <span>Dispatcher: <strong className="text-[#C9A227]">{order.assignedDP || 'DP-3'}</strong></span>
                  </div>
                </div>

                {/* Breakdown details toggler */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => toggleExpand(order._id)}
                    className="text-xs text-[#C9A227] hover:underline flex items-center space-x-1 uppercase font-semibold"
                  >
                    <span>{isExpanded ? 'Hide Composition' : 'View Grain Ratios & Composition'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded Grain Breakdown Table */}
                {isExpanded && firstItem?.grainBreakdown && (
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2.5 text-xs animate-fadeIn">
                    <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] tracking-caps block">
                      EXACT GRAIN ALLOCATION & COMPOSITION:
                    </span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-[#2e2a20] text-[10px] uppercase text-gray-500 dark:text-[#8b826f]">
                            <th className="py-1 px-2">Grain</th>
                            <th className="py-1 px-2 text-center">Ratio</th>
                            <th className="py-1 px-2 text-right">Weight</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#2e2a20]">
                          {firstItem.grainBreakdown.map((g, idx) => (
                            <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-[#1e1e1e]">
                              <td className="py-1.5 px-2 font-medium text-gray-900 dark:text-[#fdfbf7]">{g.name}</td>
                              <td className="py-1.5 px-2 text-center font-bold text-[#C9A227]">{g.percentage}%</td>
                              <td className="py-1.5 px-2 text-right font-mono text-gray-700 dark:text-[#d0c5af]">
                                {g.weightKg ? `${g.weightKg} kg` : `${Math.round(((g.percentage || 0) / 100) * (firstItem.batchSizeKg || 5))} kg`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
