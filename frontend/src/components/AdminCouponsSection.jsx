import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Copy,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Phone,
  User,
  Check,
  ChevronDown,
  ChevronUp,
  Receipt
} from 'lucide-react';
import { api } from '../services/api';

export function AdminCouponsSection({ adminUser }) {
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalRedemptions: 0,
    totalSavingsGiven: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // 'all', 'true', 'false'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [copiedMsgCode, setCopiedMsgCode] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: '',
    discountType: 'FIXED',
    discountAmount: 100,
    minOrderValue: 0,
    assignedToPhone: '',
    assignedToName: '',
    maxUsesTotal: 1,
    isSingleUsePerCustomer: true,
    description: '',
    expiresAt: ''
  });

  // Redemption History Modal State
  const [selectedCouponForHistory, setSelectedCouponForHistory] = useState(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (filterActive !== 'all') params.active = filterActive;

      const res = await api.getCoupons(params);
      if (res && res.success) {
        setCoupons(res.data || []);
        if (res.stats) setStats(res.stats);
      } else {
        setError(res?.message || 'Failed to load coupons');
      }
    } catch (err) {
      setError(err.message || 'Error loading coupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [filterActive]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCoupons();
  };

  // Helper to generate a clean coupon code
  const generateCouponCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const discount = createForm.discountAmount || 100;
    const generated = `AB${discount}-${suffix}`;
    setCreateForm(prev => ({ ...prev, code: generated }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!createForm.code.trim()) {
      alert('Please enter a coupon code.');
      return;
    }
    if (Number(createForm.discountAmount) <= 0) {
      alert('Discount amount must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: createForm.code.trim().toUpperCase(),
        discountType: createForm.discountType,
        discountAmount: Number(createForm.discountAmount),
        minOrderValue: Number(createForm.minOrderValue) || 0,
        assignedToPhone: createForm.assignedToPhone ? createForm.assignedToPhone.trim() : null,
        assignedToName: createForm.assignedToName ? createForm.assignedToName.trim() : '',
        maxUsesTotal: Number(createForm.maxUsesTotal) || 1,
        isSingleUsePerCustomer: createForm.isSingleUsePerCustomer,
        description: createForm.description ? createForm.description.trim() : '',
        expiresAt: createForm.expiresAt ? new Date(createForm.expiresAt).toISOString() : null
      };

      const res = await api.createCoupon(payload);
      if (res && res.success) {
        setSuccessMsg(`Coupon "${res.data?.code}" created successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setIsCreateModalOpen(false);
        // Reset form
        setCreateForm({
          code: '',
          discountType: 'FIXED',
          discountAmount: 100,
          minOrderValue: 0,
          assignedToPhone: '',
          assignedToName: '',
          maxUsesTotal: 1,
          isSingleUsePerCustomer: true,
          description: '',
          expiresAt: ''
        });
        fetchCoupons();
      } else {
        alert(res?.message || 'Failed to create coupon');
      }
    } catch (err) {
      alert('Error creating coupon: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      const res = await api.toggleCoupon(coupon._id);
      if (res && res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchCoupons();
      } else {
        alert(res?.message || 'Failed to toggle status');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
    try {
      const res = await api.deleteCoupon(coupon._id);
      if (res && res.success) {
        setSuccessMsg(`Coupon "${coupon.code}" deleted.`);
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchCoupons();
      } else {
        alert(res?.message || 'Failed to delete coupon');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const generateWhatsAppShareMessage = (coupon) => {
    const greeting = coupon.assignedToName ? `Namaste ${coupon.assignedToName},` : 'Namaste,';
    const discountStr = coupon.discountType === 'PERCENT' ? `${coupon.discountAmount}% OFF` : `₹${coupon.discountAmount} OFF`;
    const minOrderStr = coupon.minOrderValue > 0 ? ` on orders above ₹${coupon.minOrderValue}` : '';
    
    return `${greeting}\n\nHere is your exclusive Arogya Bhog discount coupon code:\n\n🎟️ Coupon Code: ${coupon.code}\n💰 Discount: ${discountStr}${minOrderStr}\n\nApply this code during checkout on arogyabhog.com. This coupon is strictly valid for one order.\n\nWarm regards,\nArogya Bhog Team`;
  };

  const handleCopyWhatsAppMessage = (coupon) => {
    const message = generateWhatsAppShareMessage(coupon);
    navigator.clipboard.writeText(message);
    setCopiedMsgCode(coupon.code);
    setTimeout(() => setCopiedMsgCode(''), 2500);
  };

  const handleShareOnWhatsApp = (coupon) => {
    const message = generateWhatsAppShareMessage(coupon);
    const targetPhone = coupon.assignedToPhone ? coupon.assignedToPhone.replace(/\D/g, '') : '';
    const phoneParam = targetPhone ? (targetPhone.startsWith('91') ? targetPhone : `91${targetPhone}`) : '';
    const url = phoneParam 
      ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          HEADER & ACTIONS
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
            <Tag className="w-6 h-6 text-[#C9A227]" />
            <span>Coupons & Discount Codes</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-[#8b826f] mt-0.5">
            Create single-use discount coupons, share with customers on WhatsApp, and track 1-time redemptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCoupons}
            className="p-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:bg-gray-100 dark:hover:bg-[#1a1813] text-gray-600 dark:text-[#d0c5af] transition-all"
            title="Refresh coupons"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              generateCouponCode();
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE COUPON</span>
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR TOASTS */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          METRICS CARDS
          ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-[#8b826f] block">
            Total Coupons
          </span>
          <span className="text-2xl font-bold font-mono text-gray-900 dark:text-[#fdfbf7]">
            {stats.totalCoupons}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Active Coupons
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {stats.activeCoupons}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-[#C9A227] block">
            Total Redeemed
          </span>
          <span className="text-2xl font-bold font-mono text-amber-600 dark:text-[#C9A227]">
            {stats.totalRedemptions}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-[#8b826f] block">
            Savings Given (₹)
          </span>
          <span className="text-2xl font-bold font-mono text-gray-900 dark:text-[#fdfbf7]">
            ₹{stats.totalSavingsGiven}
          </span>
        </div>
      </div>

      {/* ========================================================
          SEARCH & FILTER BAR
          ======================================================== */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-[#8b826f]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, customer mobile, or notes..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#181818] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227] transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-[#25221b] text-white dark:text-[#fdfbf7] text-xs font-bold uppercase tracking-wider"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-[#8b826f] flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#181818] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none"
          >
            <option value="all">All Coupons</option>
            <option value="true">Active Only</option>
            <option value="false">Disabled / Redeemed</option>
          </select>
        </div>
      </div>

      {/* ========================================================
          COUPONS TABLE / LIST
          ======================================================== */}
      {coupons.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-[#201c13] border border-[#C9A227]/40 mx-auto flex items-center justify-center text-[#C9A227]">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
            No Coupons Found
          </h3>
          <p className="text-xs text-gray-500 dark:text-[#8b826f] max-w-sm mx-auto">
            Create a custom single-use discount coupon to share with customers contacting Arogya Bhog on WhatsApp.
          </p>
          <button
            onClick={() => {
              generateCouponCode();
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Create Your First Coupon
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const isFullyRedeemed = coupon.maxUsesTotal && coupon.usedCount >= coupon.maxUsesTotal;
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            const discountLabel = coupon.discountType === 'PERCENT' ? `${coupon.discountAmount}% OFF` : `₹${coupon.discountAmount} OFF`;

            return (
              <div
                key={coupon._id}
                className={`p-4 rounded-2xl bg-white dark:bg-[#181818] border transition-all ${
                  coupon.isActive && !isFullyRedeemed && !isExpired
                    ? 'border-gray-200 dark:border-[#2e2a20] shadow-sm'
                    : 'border-gray-200 dark:border-[#25221b] opacity-80 bg-gray-50/50 dark:bg-[#141414]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Code, Discount, Badges */}
                  <div className="space-y-1.5">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-mono text-base font-bold tracking-wider text-gray-900 dark:text-[#fdfbf7] bg-gray-100 dark:bg-[#222] px-2.5 py-1 rounded-lg border border-gray-300 dark:border-[#333] flex items-center space-x-1.5">
                        <span>{coupon.code}</span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="text-gray-400 hover:text-[#C9A227] transition-colors"
                          title="Copy coupon code"
                        >
                          {copiedCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </span>

                      <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-[#E5C158] border border-amber-300/60 dark:border-[#C9A227]/40">
                        {discountLabel}
                      </span>

                      {/* Status badge */}
                      {isFullyRedeemed ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                          Fully Redeemed
                        </span>
                      ) : isExpired ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          Expired
                        </span>
                      ) : coupon.isActive ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                          Disabled
                        </span>
                      )}
                    </div>

                    {/* Metadata line */}
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-[#8b826f]">
                      {coupon.assignedToPhone ? (
                        <span className="flex items-center space-x-1 text-amber-700 dark:text-[#C9A227] font-medium">
                          <Phone className="w-3 h-3" />
                          <span>Assigned to: <strong>+91 {coupon.assignedToPhone}</strong>{coupon.assignedToName ? ` (${coupon.assignedToName})` : ''}</span>
                        </span>
                      ) : (
                        <span>Audience: <strong>All Customers (1 use per customer)</strong></span>
                      )}

                      {coupon.minOrderValue > 0 && (
                        <span>Min Order: <strong>₹{coupon.minOrderValue}</strong></span>
                      )}

                      <span>
                        Usage: <strong className="font-mono">{coupon.usedCount} / {coupon.maxUsesTotal || '∞'}</strong> used
                      </span>

                      {coupon.description && (
                        <span className="italic text-gray-400">"{coupon.description}"</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center flex-wrap gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-[#2e2a20]">
                    {/* Share on WhatsApp */}
                    <button
                      onClick={() => handleShareOnWhatsApp(coupon)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1 transition-all shadow-sm"
                      title="Share coupon via WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{coupon.assignedToPhone ? 'Send WhatsApp' : 'Share WhatsApp'}</span>
                    </button>

                    {/* Copy WhatsApp Message */}
                    <button
                      onClick={() => handleCopyWhatsAppMessage(coupon)}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:bg-gray-100 dark:hover:bg-[#25221b] text-gray-700 dark:text-[#d0c5af] text-xs font-semibold flex items-center space-x-1 transition-all"
                      title="Copy preformatted WhatsApp share text"
                    >
                      {copiedMsgCode === coupon.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMsgCode === coupon.code ? 'Copied Text' : 'Copy Msg'}</span>
                    </button>

                    {/* View Redemptions */}
                    {coupon.usedCount > 0 && (
                      <button
                        onClick={() => setSelectedCouponForHistory(coupon)}
                        className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-[#C9A227]/40 text-[#C9A227] hover:bg-amber-50 dark:hover:bg-[#201c13] text-xs font-semibold flex items-center space-x-1 transition-all"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>History ({coupon.usedCount})</span>
                      </button>
                    )}

                    {/* Toggle Active / Disabled */}
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        coupon.isActive
                          ? 'border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          : 'border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                    >
                      {coupon.isActive ? 'Disable' : 'Enable'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(coupon)}
                      className="p-1.5 rounded-xl border border-gray-200 dark:border-[#2e2a20] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-600 transition-all"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          CREATE COUPON MODAL
          ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-lg font-bold text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-[#C9A227]" />
                  <span>Create Discount Coupon</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-[#8b826f]">
                  Single-use discount code shared to one user or customer.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              {/* Coupon Code input with auto-generate */}
              <div>
                <label className="font-semibold text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Coupon Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. AB100-7X9K"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#121212] font-mono font-bold uppercase tracking-wider text-sm text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  />
                  <button
                    type="button"
                    onClick={generateCouponCode}
                    className="px-3 py-2 rounded-xl border border-amber-300 dark:border-[#C9A227]/40 text-[#C9A227] hover:bg-amber-50 dark:hover:bg-[#201c13] font-bold text-[11px] uppercase tracking-wider flex items-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Discount Value and Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 dark:text-[#d0c5af] block mb-1">
                    Discount Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={createForm.discountAmount}
                    onChange={(e) => setCreateForm({ ...createForm, discountAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#121212] font-mono font-bold text-sm text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-[#d0c5af] block mb-1">
                    Discount Type
                  </label>
                  <select
                    value={createForm.discountType}
                    onChange={(e) => setCreateForm({ ...createForm, discountType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none"
                  >
                    <option value="FIXED">Fixed Amount (₹ OFF)</option>
                    <option value="PERCENT">Percentage (% OFF)</option>
                  </select>
                </div>
              </div>

              {/* Assign to Specific Customer Mobile (Optional: "Admin shared coupon code and shared to one user") */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-[#1a1712] border border-amber-300/40 dark:border-[#C9A227]/30 space-y-3">
                <span className="text-[11px] uppercase font-bold text-[#C9A227] tracking-wider block">
                  Target Specific Customer (Optional)
                </span>
                <p className="text-[11px] text-gray-600 dark:text-[#99907c]">
                  If assigned, only this customer mobile number can redeem this coupon code.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 dark:text-[#d0c5af] block mb-1">
                      Customer Mobile Number
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={createForm.assignedToPhone}
                      onChange={(e) => setCreateForm({ ...createForm, assignedToPhone: e.target.value.replace(/\D/g, '') })}
                      placeholder="e.g. 9621496772"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#121212] font-mono text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 dark:text-[#d0c5af] block mb-1">
                      Customer Name (for WhatsApp greeting)
                    </label>
                    <input
                      type="text"
                      value={createForm.assignedToName}
                      onChange={(e) => setCreateForm({ ...createForm, assignedToName: e.target.value })}
                      placeholder="e.g. Deepak Pal"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#121212] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    />
                  </div>
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 dark:text-[#d0c5af] block mb-1">
                    Total Uses Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.maxUsesTotal}
                    onChange={(e) => setCreateForm({ ...createForm, maxUsesTotal: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#121212] font-mono text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Default 1 (single redemption total)
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-[#d0c5af] block mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.minOrderValue}
                    onChange={(e) => setCreateForm({ ...createForm, minOrderValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#121212] font-mono text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    0 = no minimum required
                  </span>
                </div>
              </div>

              {/* Description / Internal Notes */}
              <div>
                <label className="font-semibold text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Internal Notes / Description
                </label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="e.g. WhatsApp discount requested by customer"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="singleUsePerUser"
                  checked={createForm.isSingleUsePerCustomer}
                  onChange={(e) => setCreateForm({ ...createForm, isSingleUsePerCustomer: e.target.checked })}
                  className="w-4 h-4 text-[#C9A227] rounded"
                />
                <label htmlFor="singleUsePerUser" className="text-xs text-gray-700 dark:text-[#d0c5af]">
                  Strictly 1 use per customer (Cannot be reused by same customer)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#2e2a20]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-600 dark:text-[#d0c5af] hover:bg-gray-100 dark:hover:bg-[#25221b] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center space-x-1"
                >
                  <span>{isSubmitting ? 'Creating...' : 'CREATE & SAVE'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          REDEMPTION HISTORY MODAL
          ======================================================== */}
      {selectedCouponForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
                  Redemption History: <span className="font-mono text-[#C9A227]">{selectedCouponForHistory.code}</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-[#8b826f]">
                  Audit log of customers who applied this coupon code
                </p>
              </div>
              <button
                onClick={() => setSelectedCouponForHistory(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                ✕
              </button>
            </div>

            {selectedCouponForHistory.usedBy && selectedCouponForHistory.usedBy.length > 0 ? (
              <div className="space-y-2">
                {selectedCouponForHistory.usedBy.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs space-y-1"
                  >
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900 dark:text-[#fdfbf7]">
                        {entry.customerName || 'Customer'} (+91 {entry.customerPhone})
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        -₹{entry.discountApplied}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-[#8b826f] text-[11px]">
                      <span>Order: <strong className="font-mono">{entry.orderNumber || 'N/A'}</strong></span>
                      <span>{new Date(entry.usedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-[#8b826f] text-center py-4">
                No redemptions recorded for this coupon yet.
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCouponForHistory(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-[#25221b] text-white text-xs font-bold uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
