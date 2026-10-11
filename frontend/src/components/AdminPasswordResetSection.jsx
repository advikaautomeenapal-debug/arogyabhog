import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Search, 
  Filter, 
  RotateCw, 
  Plus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MessageCircle, 
  Copy, 
  ExternalLink, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Calendar,
  X,
  Check,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

const ADMIN_WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '919621496772';

export function AdminPasswordResetSection({ adminUser }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [verifyModalReq, setVerifyModalReq] = useState(null);
  const [verifyMethod, setVerifyMethod] = useState('Identity Verified via WhatsApp');
  const [verifyNotes, setVerifyNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [tokenModalData, setTokenModalData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    phone: '',
    customerName: '',
    notes: ''
  });
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  const [detailModalReq, setDetailModalReq] = useState(null);

  // Load requests
  const loadRequests = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getRecoveryRequests({
        search: searchQuery,
        status: statusFilter
      });
      if (res.success && Array.isArray(res.data)) {
        setRequests(res.data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      setErrorMsg('Failed to load password reset requests: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadRequests();
  };

  // 1. Verify Customer Identity
  const handleConfirmVerify = async () => {
    if (!verifyModalReq) return;
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const res = await api.verifyRecoveryRequest(verifyModalReq._id, {
        verificationMethod: verifyMethod,
        notes: verifyNotes
      });
      if (res.success) {
        setSuccessMsg(`Identity verified for request ${verifyModalReq.requestId}!`);
        setVerifyModalReq(null);
        setVerifyNotes('');
        loadRequests();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.message || 'Verification failed');
      }
    } catch (err) {
      setErrorMsg('Error verifying: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. Generate Single-Use Token & Recovery Link
  const handleGenerateToken = async (reqDoc) => {
    setErrorMsg('');
    try {
      const res = await api.generateRecoveryToken(reqDoc._id);
      if (res.success) {
        setTokenModalData(res);
        setSuccessMsg(`Single-use reset credential generated for ${reqDoc.customerName} (${reqDoc.customerPhone})!`);
        loadRequests();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.message || 'Could not generate reset token');
      }
    } catch (err) {
      setErrorMsg('Error generating token: ' + err.message);
    }
  };

  // 3. Reject Request
  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    setIsRejecting(true);
    setErrorMsg('');
    try {
      const res = await api.rejectRecoveryRequest(rejectModalReq._id, {
        reason: rejectReason || 'Identity could not be verified'
      });
      if (res.success) {
        setSuccessMsg(`Request ${rejectModalReq.requestId} marked as Rejected.`);
        setRejectModalReq(null);
        setRejectReason('');
        loadRequests();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.message || 'Could not reject request');
      }
    } catch (err) {
      setErrorMsg('Error rejecting request: ' + err.message);
    } finally {
      setIsRejecting(false);
    }
  };

  // 4. Manually Log Recovery Request
  const handleCreateManualRequest = async (e) => {
    e.preventDefault();
    setIsCreatingManual(true);
    setErrorMsg('');
    try {
      const res = await api.createRecoveryRequest(manualForm);
      if (res.success) {
        setSuccessMsg(`Password reset request ${res.data?.requestId} logged successfully!`);
        setManualModalOpen(false);
        setManualForm({ phone: '', customerName: '', notes: '' });
        loadRequests();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.message || 'Could not log request');
      }
    } catch (err) {
      setErrorMsg('Error creating request: ' + err.message);
    } finally {
      setIsCreatingManual(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending Verification':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending Verification</span>
          </span>
        );
      case 'Verified':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60">
            <UserCheck className="w-3 h-3 text-blue-600" />
            <span>Verified</span>
          </span>
        );
      case 'Reset Link Generated':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 animate-pulse">
            <KeyRound className="w-3 h-3 text-purple-600" />
            <span>Reset Link Generated</span>
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Completed</span>
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-zinc-700">
            <AlertTriangle className="w-3 h-3 text-gray-500" />
            <span>Expired</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60">
            <UserX className="w-3 h-3 text-rose-600" />
            <span>Rejected</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-serif">
      
      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-[#C9A227]" />
            <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-[#fdfbf7] uppercase tracking-wider">
              Password Reset Requests (WhatsApp Recovery)
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-[#99907C]">
            Manage and verify customer password recovery requests initiated through WhatsApp support. Generate single-use, time-limited reset credentials.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setManualModalOpen(true)}
            className="py-2.5 px-3.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Log Direct Inquiry</span>
          </button>

          <button
            onClick={loadRequests}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-[#2e2a20] text-gray-600 dark:text-[#d0c5af] hover:bg-gray-100 dark:hover:bg-[#201d14] transition-all"
            title="Refresh Requests"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#C9A227]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-500/50 rounded-xl text-red-700 dark:text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Mobile, Customer, or Request ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-gray-500 whitespace-nowrap">Status:</span>
          {['all', 'Pending Verification', 'Verified', 'Reset Link Generated', 'Completed', 'Expired', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`py-1.5 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-[#C9A227] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-[#201d14] text-gray-600 dark:text-[#b8af9c] hover:bg-gray-200 dark:hover:bg-[#2a261c]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Password Reset Requests */}
      <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500">Loading password reset requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-gray-500 text-xs">
            <KeyRound className="w-10 h-10 text-[#C9A227]/40 mx-auto" />
            <p className="font-bold text-gray-700 dark:text-[#d0c5af]">No Password Reset Requests Found</p>
            <p className="text-[11px] text-gray-400">
              When a customer clicks "Forgot Password" and contacts admin via WhatsApp, the recovery request will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#121212] border-b border-gray-200 dark:border-[#2e2a20] text-gray-500 uppercase font-bold tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Registered Mobile</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4">Verified By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2e2a20]">
                {requests.map((r) => (
                  <tr 
                    key={r._id || r.requestId}
                    className="hover:bg-gray-50/70 dark:hover:bg-[#201d14]/40 transition-colors cursor-pointer"
                    onClick={() => setDetailModalReq(r)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-[#fdfbf7]">
                      {r.requestId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-800 dark:text-[#d0c5af]">
                      {r.customerName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#C9A227]">
                      +91 {r.customerPhone}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {r.requestedVia}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(r.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {r.verifiedBy || '—'}
                    </td>
                    <td 
                      className="py-3.5 px-4 text-right space-x-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Action: Verify Identity */}
                      {r.status === 'Pending Verification' && (
                        <button
                          onClick={() => setVerifyModalReq(r)}
                          className="py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Verify
                        </button>
                      )}

                      {/* Action: Generate Reset Link */}
                      {(r.status === 'Pending Verification' || r.status === 'Verified') && (
                        <button
                          onClick={() => handleGenerateToken(r)}
                          className="py-1 px-2.5 rounded-lg bg-[#C9A227] hover:bg-[#b8911f] text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Generate Link
                        </button>
                      )}

                      {/* Action: Reject */}
                      {r.status !== 'Completed' && r.status !== 'Rejected' && (
                        <button
                          onClick={() => setRejectModalReq(r)}
                          className="py-1 px-2 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 text-[10px] font-bold uppercase tracking-wider transition-all"
                        >
                          Reject
                        </button>
                      )}

                      {/* Action: Direct WhatsApp Chat with Customer */}
                      <a
                        href={`https://wa.me/91${r.customerPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        title="Chat with Customer on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL 1: VERIFY CUSTOMER IDENTITY
          ======================================================== */}
      {verifyModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2e2a20] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-[#C9A227]" />
                <span>Verify Customer Identity ({verifyModalReq.requestId})</span>
              </h3>
              <button onClick={() => setVerifyModalReq(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#121212] text-xs space-y-1">
              <div>Customer: <strong>{verifyModalReq.customerName}</strong></div>
              <div>Mobile: <strong className="font-mono text-[#C9A227]">+91 {verifyModalReq.customerPhone}</strong></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-gray-600 dark:text-[#b8af9c] block">
                Verification Method
              </label>
              <select
                value={verifyMethod}
                onChange={(e) => setVerifyMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#121212] text-xs font-semibold text-gray-900 dark:text-[#fdfbf7]"
              >
                <option value="Identity Verified via WhatsApp">Identity Verified via WhatsApp Message</option>
                <option value="Phone Call Verified">Voice Phone Call Confirmation</option>
                <option value="Order History Verified">Recent Order History / Address Confirmation</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-gray-600 dark:text-[#b8af9c] block">
                Verification Notes
              </label>
              <textarea
                rows="2"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="e.g. Confirmed past order details and delivery address on WhatsApp"
                className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#121212] text-xs text-gray-900 dark:text-[#fdfbf7]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setVerifyModalReq(null)}
                className="py-2 px-3.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerify}
                disabled={isVerifying}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Approve & Mark Verified'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: RESET LINK GENERATED (Copy Link & WhatsApp Message)
          ======================================================== */}
      {tokenModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2e2a20] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Single-Use Reset Credential Generated</span>
              </h3>
              <button onClick={() => setTokenModalData(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-900 dark:text-emerald-200 text-xs leading-relaxed">
              This link is <strong>single-use only</strong> and expires in 30 minutes. The backend stores only a secure SHA-256 hash. Copy the preformatted response below and send it to the customer on WhatsApp.
            </div>

            {/* Direct Recovery Link */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-500 block">
                Single-Use Recovery URL
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  readOnly
                  value={tokenModalData.recoveryLink}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#121212] font-mono text-[11px] text-gray-800 dark:text-[#fdfbf7] outline-none"
                />
                <button
                  onClick={() => copyToClipboard(tokenModalData.recoveryLink, 'link')}
                  className="p-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white flex-shrink-0"
                  title="Copy Link"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Preformatted WhatsApp Message */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-500 block">
                Pre-formatted WhatsApp Message to Customer
              </label>
              <textarea
                rows="4"
                readOnly
                value={tokenModalData.whatsappReplyMessage}
                className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#121212] font-sans text-xs text-gray-800 dark:text-[#fdfbf7] outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-[#2e2a20]">
              <button
                onClick={() => copyToClipboard(tokenModalData.whatsappReplyMessage, 'msg')}
                className="w-full sm:w-auto py-2 px-4 rounded-xl border border-[#C9A227] text-[#C9A227] hover:bg-[#C9A227] hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all"
              >
                {copiedMessage ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMessage ? 'Copied Message!' : 'Copy WhatsApp Message'}</span>
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                {tokenModalData.data?.customerPhone && (
                  <a
                    href={`https://wa.me/91${tokenModalData.data.customerPhone}?text=${encodeURIComponent(tokenModalData.whatsappReplyMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-2 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Send on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setTokenModalData(null)}
                  className="py-2 px-3.5 rounded-xl bg-gray-200 dark:bg-zinc-800 text-xs font-bold text-gray-700 dark:text-[#d0c5af]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: REJECT REQUEST
          ======================================================== */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2e2a20] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2 text-rose-600">
                <UserX className="w-4 h-4" />
                <span>Reject Recovery Request ({rejectModalReq.requestId})</span>
              </h3>
              <button onClick={() => setRejectModalReq(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Rejecting this request will mark it as Rejected and prevent any password reset credential generation.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-gray-600 dark:text-[#b8af9c] block">
                Reason for Rejection
              </label>
              <textarea
                rows="2"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Mobile number ownership could not be verified"
                className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#121212] text-xs text-gray-900 dark:text-[#fdfbf7]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectModalReq(null)}
                className="py-2 px-3.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: MANUALLY LOG INCOMING INQUIRY
          ======================================================== */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2e2a20] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                <Plus className="w-4 h-4 text-[#C9A227]" />
                <span>Log Direct WhatsApp Recovery Request</span>
              </h3>
              <button onClick={() => setManualModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualRequest} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-gray-600 dark:text-[#b8af9c] block">
                  Registered Mobile Number (10 digits)
                </label>
                <div className="flex rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#121212] overflow-hidden">
                  <span className="flex items-center px-3 bg-gray-100 dark:bg-[#1f1b13] text-gray-700 dark:text-[#C9A227] text-xs font-bold border-r border-gray-300 dark:border-[#2e2a20]">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="9811234567"
                    className="w-full p-2.5 bg-transparent text-xs font-mono font-bold text-[#C9A227] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-gray-600 dark:text-[#b8af9c] block">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                  placeholder="e.g. Suman Sharma"
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#121212] text-xs text-gray-900 dark:text-[#fdfbf7]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-gray-600 dark:text-[#b8af9c] block">
                  Inquiry Notes
                </label>
                <textarea
                  rows="2"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="Notes from direct WhatsApp conversation"
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#121212] text-xs text-gray-900 dark:text-[#fdfbf7]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="py-2 px-3.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingManual}
                  className="py-2 px-4 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isCreatingManual ? 'Logging...' : 'Save Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: REQUEST AUDIT DETAIL VIEW
          ======================================================== */}
      {detailModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2e2a20] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#C9A227]" />
                <span>Recovery Request Audit Details ({detailModalReq.requestId})</span>
              </h3>
              <button onClick={() => setDetailModalReq(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#121212] space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Customer Mobile</span>
                <span className="font-mono font-bold text-[#C9A227] text-sm">+91 {detailModalReq.customerPhone}</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#121212] space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Status</span>
                <div>{getStatusBadge(detailModalReq.status)}</div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#121212] space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Verification Status</span>
                <span className="font-semibold text-gray-800 dark:text-[#d0c5af]">{detailModalReq.verificationStatus || 'Unverified'}</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#121212] space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Handling Admin</span>
                <span className="font-semibold text-gray-800 dark:text-[#d0c5af]">{detailModalReq.verifiedBy || 'Pending'}</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#121212] space-y-1 col-span-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Audit Records</span>
                <div className="text-[11px] text-gray-600 dark:text-[#99907c] space-y-0.5">
                  <div>Created: {new Date(detailModalReq.createdAt).toLocaleString()}</div>
                  {detailModalReq.verifiedAt && <div>Verified At: {new Date(detailModalReq.verifiedAt).toLocaleString()}</div>}
                  {detailModalReq.resetTokenExpiresAt && <div>Token Expiry: {new Date(detailModalReq.resetTokenExpiresAt).toLocaleString()}</div>}
                  {detailModalReq.usedAt && <div>Completed At: {new Date(detailModalReq.usedAt).toLocaleString()}</div>}
                  {detailModalReq.ipAddress && <div>Origin IP: {detailModalReq.ipAddress}</div>}
                  {detailModalReq.adminNotes && <div className="pt-1 text-[#C9A227]">Notes: {detailModalReq.adminNotes}</div>}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailModalReq(null)}
                className="py-2 px-4 rounded-xl bg-[#C9A227] text-white text-xs font-bold uppercase tracking-wider"
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
export default AdminPasswordResetSection;
