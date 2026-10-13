import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  RotateCw, 
  LogOut, 
  Check, 
  PackageCheck, 
  Eye, 
  X, 
  ChevronDown, 
  ChevronUp,
  Navigation,
  ShieldCheck,
  Calendar,
  Sparkles,
  QrCode,
  Copy
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { buildUpiUri, MERCHANT_UPI_ID } from '../utils/upiHelper';

export function DeliveryView({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [qrModalOrder, setQrModalOrder] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Load orders assigned to this delivery person
  const loadDeliveryOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDeliveryMyOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (e) {
      console.warn('Failed to fetch delivery orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveryOrders();
  }, []);

  const showActionFeedback = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  // Toggle delivery availability
  const handleToggleAvailability = async () => {
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    try {
      if (user?._id) {
        await api.updateDeliveryPerson(user._id, { isAvailable: nextVal });
      }
      showActionFeedback(nextVal ? 'You are now marked Available for new dispatches.' : 'You are now on Break / Unavailable.');
    } catch (e) {
      console.error(e);
    }
  };

  // ACTION 1: Accept for Delivery (Requirement 8: change status to 'Shipped', record timestamp)
  const handleAcceptOrder = async (orderId) => {
    setProcessingOrderId(orderId);
    try {
      const res = await api.deliveryAcceptOrder(orderId);
      if (res.success) {
        showActionFeedback(`Order accepted! Status updated to "Shipped" (Out for Delivery).`);
        await loadDeliveryOrders();
      } else {
        alert(res.message || 'Failed to accept order.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessingOrderId(null);
    }
  };

  // ACTION 2: Doorstep Payment Collection (Requirement 6)
  const handleCollectCash = async (orderId, amount) => {
    const confirm = window.confirm(`Confirm collection of ₹${amount} in CASH from customer?`);
    if (!confirm) return;

    setProcessingOrderId(orderId);
    try {
      const res = await api.collectCash(orderId);
      if (res.success) {
        showActionFeedback(`₹${amount} Cash collection successfully recorded!`);
        await loadDeliveryOrders();
      } else {
        alert(res.message || 'Failed to record cash collection.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCollectUpi = async (orderId, amount) => {
    const ref = prompt(`Enter customer UPI UTR / Transaction Reference for ₹${amount}:`, `UPI-${Date.now().toString().slice(-6)}`);
    if (!ref) return;

    setProcessingOrderId(orderId);
    try {
      const res = await api.collectUpi(orderId, { transactionRef: ref });
      if (res.success) {
        showActionFeedback(`₹${amount} UPI collection confirmed (Ref: ${ref})!`);
        await loadDeliveryOrders();
      } else {
        alert(res.message || 'Failed to record UPI collection.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleConfirmPayment = async (orderId, amount) => {
    handleCollectCash(orderId, amount);
  };

  // ACTION 3: Mark Order Delivered (Requirement 8: mark orderStatus as 'Delivered')
  const handleCompleteOrder = async (orderId) => {
    const confirm = window.confirm('Has this artisanal atta batch been handed over to the customer?');
    if (!confirm) return;

    setProcessingOrderId(orderId);
    try {
      const res = await api.deliveryCompleteOrder(orderId);
      if (res.success) {
        showActionFeedback('Order marked as Successfully Delivered!');
        await loadDeliveryOrders();
      } else {
        alert(res.message || 'Failed to complete order.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setProcessingOrderId(null);
    }
  };

  const activeOrders = orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled');
  const completedOrders = orders.filter(o => o.orderStatus === 'Delivered');

  const displayedOrders = activeTab === 'active' ? activeOrders : completedOrders;

  return (
    <div className="pb-28 max-w-4xl mx-auto px-3.5 md:px-6 pt-4 space-y-6">
      
      {/* ========================================================
          DELIVERY TOP HEADER (Agent Profile, Duty Status & Logout)
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl border-2 border-[#C9A227]/60 bg-amber-50 dark:bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 shadow-md">
            <img src="/arogyaBhog_logo.png" alt="Arogyabhog Emblem" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 style={{
                fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                fontSize: '64px',
                fontWeight: 'normal',
                fontStyle: 'italic',
                color: '#D4AF70',
                textAlign: 'center',
                textShadow: '1px 2px 3px #5C4525',
                margin: 0,
                lineHeight: 1
              }}>
                Arogyabhog
              </h3>
              <span className="text-xs uppercase font-bold text-sky-700 dark:text-sky-300 font-serif">Fleet</span>
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[9px] uppercase font-bold tracking-caps px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 border border-sky-400/40 text-sky-700 dark:text-sky-300">
                DISPATCH FLEET
              </span>
              <span className="text-xs text-gray-500 dark:text-[#99907c] font-serif">
                {user?.name || 'Partner'} • 📞 {user?.phone || '9876543210'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-end sm:self-auto">
          {/* Availability Toggle */}
          <button
            onClick={handleToggleAvailability}
            className={`py-1.5 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm ${
              isAvailable 
                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' 
                : 'border-gray-300 dark:border-[#2e2a20] bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-[#8b826f]'
            }`}
            title="Toggle Duty Status"
          >
            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            <span>{isAvailable ? 'On Duty' : 'On Break'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadDeliveryOrders}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#2e2a20] hover:border-[#C9A227] bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-[#d0c5af] hover:text-[#C9A227] transition-all shadow-sm"
            title="Refresh Orders"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="py-1.5 px-3 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center space-x-1 transition-all"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center space-x-2 animate-fadeIn shadow-md">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================
          STATS CARDS: Active Orders / Completed Deliveries / Cash to Collect
          ======================================================== */}
      <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] text-center shadow-sm">
        <div className="border-r border-gray-100 dark:border-[#2e2a20] pr-1 py-1">
          <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
            PENDING DELIVERIES
          </span>
          <span className="font-sans font-bold text-xl text-[#C9A227]">
            {activeOrders.length}
          </span>
        </div>

        <div className="border-r border-gray-100 dark:border-[#2e2a20] px-1 py-1">
          <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
            PAYMENT PENDING
          </span>
          <span className="font-sans font-bold text-xl text-amber-600 dark:text-amber-400">
            {activeOrders.filter(o => o.paymentStatus === 'Pending').length}
          </span>
        </div>

        <div className="pl-1 py-1">
          <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
            COMPLETED DELIVERIES
          </span>
          <span className="font-sans font-bold text-xl text-emerald-600 dark:text-emerald-400">
            {completedOrders.length}
          </span>
        </div>
      </div>

      {/* ========================================================
          TAB SWITCHER: ACTIVE vs COMPLETED DELIVERIES
          ======================================================== */}
      <div className="flex items-center p-1.5 rounded-2xl bg-gray-100 dark:bg-[#161616] border border-gray-200 dark:border-[#2e2a20] shadow-sm">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'active'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <Truck className="w-4 h-4 text-[#C9A227]" />
          <span>Active Assigned ({activeOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'completed'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Completed ({completedOrders.length})</span>
        </button>
      </div>

      {/* ========================================================
          ASSIGNED ORDERS LIST
          ======================================================== */}
      {displayedOrders.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-[#2e2a20] bg-white dark:bg-[#181818] p-8 text-center space-y-3 shadow-sm">
          <Truck className="w-10 h-10 text-gray-300 dark:text-[#4d4635] mx-auto" />
          <h3 className="font-editorial text-base font-bold text-gray-800 dark:text-[#fdfbf7]">
            {activeTab === 'active' ? 'No Active Delivery Orders' : 'No Completed Orders Yet'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-[#8b826f] max-w-sm mx-auto">
            {activeTab === 'active' 
              ? 'When new orders are allocated to you by the Chakki floor, they will appear here immediately.' 
              : 'Deliveries marked as delivered will be archived here for record keeping.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const isPendingPay = ['Pending', 'PENDING', 'COD_PENDING'].includes(order.paymentStatus);
            const isPaidOnline = ['Paid', 'PAID', 'Success', 'COLLECTED_CASH', 'COLLECTED_UPI'].includes(order.paymentStatus);
            const isShipped = ['Shipped', 'DISPATCHED'].includes(order.orderStatus);
            const isDelivered = ['Delivered', 'DELIVERED', 'Completed', 'COMPLETED'].includes(order.orderStatus);
            const firstItem = order.items && order.items[0];
            const isCustom = firstItem?.isCustom;
            const isProcessingThis = processingOrderId === order._id;

            return (
              <div
                key={order._id}
                className="rounded-2xl border border-gray-200 dark:border-[#2e2a20] bg-white dark:bg-[#181818] p-4 md:p-5 shadow-sm space-y-4 hover:border-[#C9A227]/60 transition-all"
              >
                {/* Header: Order Number, Date, Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-[#2e2a20] pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm md:text-base text-gray-900 dark:text-[#fdfbf7]">
                      {order.orderNumber}
                    </span>
                    {isCustom && (
                      <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-[#2b2416] text-[#C9A227] border border-[#C9A227]/40">
                        Custom Blend
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-[#8b826f] flex items-center space-x-1 font-mono">
                      <Clock className="w-3 h-3 text-[#C9A227]" />
                      <span>
                        {new Date(order.placedAt || order.createdAt || Date.now()).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Payment Badge */}
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-lg border ${
                      isPaidOnline 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-500/50' 
                        : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-500/50'
                    }`}>
                      {isPaidOnline ? (order.paymentStatus === 'COLLECTED_CASH' ? 'Cash Collected' : order.paymentStatus === 'COLLECTED_UPI' ? 'UPI Collected' : 'Paid Online') : 'Payment: Pending'}
                    </span>

                    {/* Order Status Badge */}
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-lg border ${
                      isDelivered 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400' 
                        : isShipped 
                        ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-400'
                        : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Customer Information & Quick Call */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-xs">
                  {/* Left: Customer Name & Phone */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
                      CUSTOMER RECIPIENT
                    </span>
                    <p className="font-bold text-sm text-gray-900 dark:text-[#fdfbf7]">
                      {order.customerName}
                    </p>
                    <div className="flex items-center space-x-2 pt-0.5">
                      <a
                        href={`tel:${order.customerContact || order.customerPhone}`}
                        className="py-1 px-3 rounded-lg bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-mono font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.customerContact || order.customerPhone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Right: Address & Pin */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
                      DELIVERY ADDRESS & PIN
                    </span>
                    <div className="flex items-start space-x-1.5 text-gray-700 dark:text-[#d0c5af]">
                      <MapPin className="w-3.5 h-3.5 text-[#C9A227] flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        {order.customerAddress}
                      </p>
                    </div>
                    {order.customerPincode && (
                      <p className="text-[11px] font-mono font-semibold text-gray-600 dark:text-[#99907c] pl-5">
                        PIN: <strong className="text-gray-900 dark:text-[#fdfbf7]">{order.customerPincode}</strong>
                      </p>
                    )}
                    <p className="text-[11px] text-gray-500 dark:text-[#8b826f] pl-5">
                      Slot: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{order.deliverySlot}</span>
                    </p>
                  </div>
                </div>

                {/* Items Summary & Total Amount */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs border-b border-gray-100 dark:border-[#2e2a20] pb-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
                      ORDER ITEMS
                    </span>
                    <p className="font-semibold text-gray-900 dark:text-[#fdfbf7] mt-0.5">
                      {firstItem ? `${firstItem.name} (${firstItem.batchSizeKg} kg)` : 'Atta Batch'}
                      {order.items?.length > 1 && ` + ${order.items.length - 1} more`}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-[#8b826f]">
                      Fineness: {firstItem?.fineness || 'Medium (Phulka)'}
                    </p>
                  </div>

                  <div className="sm:text-right space-y-1">
                    {isPaidOnline ? (
                      <div>
                        <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
                          PAYMENT STATUS
                        </span>
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-bold text-xs tracking-wide shadow-sm">
                          PAID ONLINE — DO NOT COLLECT MONEY
                        </span>
                        <span className="block text-[11px] font-mono text-gray-500 dark:text-[#8b826f] pt-0.5">
                          Remaining Due: ₹0 (Paid: ₹{order.totalAmount})
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
                          REMAINING DUE TO COLLECT
                        </span>
                        <span className="font-sans font-bold text-lg text-[#C9A227]">
                          ₹{order.totalAmount}
                        </span>
                        <span className="block text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                          Collect via Cash or UPI Scan
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Person Workflow Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  
                  {/* Step 1: Accept for Delivery (Sets status to Shipped immediately) */}
                  {!isShipped && !isDelivered && (
                    <button
                      onClick={() => handleAcceptOrder(order._id)}
                      disabled={isProcessingThis}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
                    >
                      <Truck className="w-4 h-4" />
                      <span>{isProcessingThis ? 'Accepting...' : 'Accept for Delivery (Mark Shipped)'}</span>
                    </button>
                  )}

                  {/* Step 2: Doorstep Payment Collection (When payment is Pending) */}
                  {isPendingPay && (
                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                      <button
                        onClick={() => setQrModalOrder(order)}
                        className="py-2 px-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#111111] font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition-all shadow-md"
                        title="Display collection QR code for customer to scan"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>UPI QR</span>
                      </button>

                      <button
                        onClick={() => handleCollectCash(order._id, order.totalAmount)}
                        disabled={isProcessingThis}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition-all shadow-md disabled:opacity-50"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Collect Cash (₹{order.totalAmount})</span>
                      </button>

                      <button
                        onClick={() => handleCollectUpi(order._id, order.totalAmount)}
                        disabled={isProcessingThis}
                        className="py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition-all shadow-md disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>UPI Collected</span>
                      </button>
                    </div>
                  )}

                  {isPaidOnline && (
                    <div className="flex items-center space-x-2 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Order Paid Online — Do Not Collect Money</span>
                    </div>
                  )}

                  {/* Step 3: Complete / Mark Delivered (When order is Shipped) */}
                  {isShipped && (
                    <button
                      onClick={() => handleCompleteOrder(order._id)}
                      disabled={isProcessingThis}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Mark Delivered to Customer</span>
                    </button>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedOrderDetails(order)}
                    className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-[#C9A227] bg-white dark:bg-[#1c1c1c] text-xs font-semibold text-gray-800 dark:text-[#d0c5af] flex items-center space-x-1.5 transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Breakdown</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          ORDER DETAIL MODAL (With Custom Blend Breakdown & Charge)
          ======================================================== */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <span className="font-mono font-bold text-base text-[#C9A227]">
                  {selectedOrderDetails.orderNumber}
                </span>
                <p className="text-xs text-gray-500 dark:text-[#8b826f]">
                  Customer: {selectedOrderDetails.customerName} • Placed: {new Date(selectedOrderDetails.placedAt || selectedOrderDetails.createdAt || Date.now()).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900 dark:hover:text-[#fdfbf7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-xs space-y-1.5">
              <p className="font-bold text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>{selectedOrderDetails.customerContact || selectedOrderDetails.customerPhone}</span>
              </p>
              <p className="text-gray-700 dark:text-[#d0c5af] flex items-start space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#C9A227] flex-shrink-0 mt-0.5" />
                <span>{selectedOrderDetails.customerAddress} (PIN: {selectedOrderDetails.customerPincode || '122002'})</span>
              </p>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-3">
              {selectedOrderDetails.items?.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-gray-200 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#141414] space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-gray-900 dark:text-[#fdfbf7]">
                    <span>{item.name} ({item.batchSizeKg} kg)</span>
                    <span className="text-[#C9A227] font-mono">₹{item.totalItemPrice}</span>
                  </div>
                  
                  {item.grainBreakdown && item.grainBreakdown.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[10px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f]">
                        Ingredient Formulation
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        {item.grainBreakdown.map((g, gIdx) => (
                          <div key={gIdx} className="flex justify-between text-gray-600 dark:text-[#d0c5af]">
                            <span>{g.name}:</span>
                            <span className="font-mono font-semibold">{g.weightKg || ((g.percentage / 100) * item.batchSizeKg).toFixed(2)} kg ({g.percentage}%)</span>
                          </div>
                        ))}
                      </div>

                      {item.isCustom && (
                        <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-gray-300 dark:border-[#2e2a20] text-[#C9A227] font-bold">
                          <span>Chakki Milling & Service Charge:</span>
                          <span className="font-mono">₹100</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bill Total */}
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-[#2e2a20] pt-3 text-sm font-bold">
              <span className="text-gray-900 dark:text-[#fdfbf7]">Total Payable:</span>
              <span className="text-[#C9A227] text-lg font-mono">₹{selectedOrderDetails.totalAmount}</span>
            </div>

            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="w-full py-2.5 rounded-xl bg-gray-200 dark:bg-[#25221b] text-gray-800 dark:text-[#fdfbf7] font-bold text-xs uppercase"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          UPI COLLECTION QR MODAL (For On-Spot Driver Collection)
          ======================================================== */}
      {qrModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 space-y-4 shadow-2xl text-center">
            
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-2.5">
              <div className="flex items-center space-x-2 text-left">
                <img src="/arogyaBhog_logo.png" alt="Arogyabhog" className="w-8 h-8 object-contain" />
                <div>
                  <h3 className="font-serif font-bold text-sm text-gray-900 dark:text-[#fdfbf7]">
                    Collect Payment via UPI
                  </h3>
                  <span className="text-[10px] text-[#C9A227] font-mono font-bold">
                    Order {qrModalOrder.orderNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setQrModalOrder(null)}
                className="p-1 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900 dark:hover:text-[#fdfbf7]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code */}
            {(() => {
              const upiInfo = buildUpiUri({
                vpa: MERCHANT_UPI_ID,
                amount: qrModalOrder.totalAmount,
                customerName: qrModalOrder.customerName,
                customerPhone: qrModalOrder.customerContact || qrModalOrder.customerPhone,
                orderNumber: qrModalOrder.orderNumber,
                customNote: qrModalOrder.upiTransactionNote || null
              });

              return (
                <div className="space-y-3">
                  <div className="p-3 bg-white w-48 h-48 mx-auto rounded-xl border-2 border-[#C9A227] shadow-md flex items-center justify-center">
                    <QRCodeSVG
                      value={upiInfo.uri}
                      size={160}
                      level="H"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block">
                      TOTAL AMOUNT TO COLLECT
                    </span>
                    <span className="font-serif font-bold text-2xl text-[#C9A227]">
                      ₹{qrModalOrder.totalAmount}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-left text-xs space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-[#8b826f]">Customer:</span>
                      <span className="font-bold text-gray-900 dark:text-[#fdfbf7]">{qrModalOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-[#8b826f]">Merchant UPI:</span>
                      <code className="text-[#C9A227] font-mono text-[10px]">{MERCHANT_UPI_ID}</code>
                    </div>
                    <div className="pt-1 border-t border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block">
                        Standard Note:
                      </span>
                      <code className="text-[#C9A227] font-mono text-[10px] block break-all">
                        {upiInfo.note}
                      </code>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={async () => {
                        const ord = qrModalOrder;
                        setQrModalOrder(null);
                        await handleConfirmPayment(ord._id, ord.totalAmount);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Confirm Payment Received (₹{qrModalOrder.totalAmount})</span>
                    </button>

                    <button
                      onClick={() => setQrModalOrder(null)}
                      className="w-full py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#c4bcac] font-bold text-xs uppercase"
                    >
                      Close QR
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
}

export default DeliveryView;
