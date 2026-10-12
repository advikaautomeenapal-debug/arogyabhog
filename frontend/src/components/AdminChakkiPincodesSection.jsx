import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldAlert, 
  Layers, 
  Clock, 
  Settings,
  Building2,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export function AdminChakkiPincodesSection({ chakkis = [], onRefresh }) {
  const [selectedChakkiId, setSelectedChakkiId] = useState(chakkis[0]?._id || '');
  const [newPin, setNewPin] = useState('');
  const [newPinNotes, setNewPinNotes] = useState('');
  const [pinSearch, setPinSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fallback if selected chakki changes or was empty
  const activeChakki = chakkis.find(c => c._id === selectedChakkiId) || chakkis[0];

  // Consolidate PIN configs
  // Ensure we read both pincodeConfigs and serviceablePincodes
  const assignedPincodes = React.useMemo(() => {
    if (!activeChakki) return [];

    const configs = activeChakki.pincodeConfigs || [];
    const configsMap = new Map();
    configs.forEach(c => {
      configsMap.set(String(c.pincode).trim(), c);
    });

    // Also include any in serviceablePincodes not yet in pincodeConfigs
    if (Array.isArray(activeChakki.serviceablePincodes)) {
      activeChakki.serviceablePincodes.forEach(p => {
        const clean = String(p).trim();
        if (clean && !configsMap.has(clean)) {
          configsMap.set(clean, {
            pincode: clean,
            isActive: true,
            addedAt: activeChakki.createdAt || new Date(),
            notes: 'Standard service area'
          });
        }
      });
    }

    return Array.from(configsMap.values());
  }, [activeChakki]);

  // Filtered PIN codes
  const filteredPincodes = assignedPincodes.filter(item => {
    const matchesSearch = !pinSearch || item.pincode.includes(pinSearch.trim()) || (item.notes && item.notes.toLowerCase().includes(pinSearch.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && item.isActive) || 
      (statusFilter === 'disabled' && !item.isActive);
    return matchesSearch && matchesStatus;
  });

  const activeCount = assignedPincodes.filter(p => p.isActive).length;
  const disabledCount = assignedPincodes.filter(p => !p.isActive).length;

  // Add PIN Code Handler
  const handleAddPin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!activeChakki) {
      setErrorMsg('Please select a Chakki unit first.');
      return;
    }

    const cleanPin = newPin.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setErrorMsg('Please enter a valid 6-digit numeric PIN code (e.g. 208016).');
      return;
    }

    const exists = assignedPincodes.find(p => p.pincode === cleanPin);
    if (exists && exists.isActive) {
      setErrorMsg(`PIN code ${cleanPin} is already active for this chakki unit.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.addChakkiPincode(activeChakki._id, {
        pincode: cleanPin,
        notes: newPinNotes.trim()
      });

      if (res && res.success) {
        setSuccessMsg(`PIN code ${cleanPin} added to "${activeChakki.name}".`);
        setNewPin('');
        setNewPinNotes('');
        if (onRefresh) onRefresh();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res?.message || 'Failed to add PIN code.');
      }
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle PIN Active/Disabled
  const handleTogglePin = async (pincode) => {
    if (!activeChakki) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.toggleChakkiPincode(activeChakki._id, pincode);
      if (res && res.success) {
        setSuccessMsg(`PIN code ${pincode} status updated.`);
        if (onRefresh) onRefresh();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res?.message || 'Failed to update PIN code.');
      }
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
    }
  };

  // Remove PIN Code Handler
  const handleRemovePin = async (pincode) => {
    if (!activeChakki) return;
    const confirm = window.confirm(
      `Remove PIN code ${pincode} from ${activeChakki.name}?\n\nNote: This affects only future order availability. Historical orders and invoices remain completely preserved.`
    );
    if (!confirm) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.removeChakkiPincode(activeChakki._id, pincode);
      if (res && res.success) {
        setSuccessMsg(`PIN code ${pincode} removed from ${activeChakki.name}. Historical records preserved.`);
        if (onRefresh) onRefresh();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res?.message || 'Failed to remove PIN code.');
      }
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-6 space-y-5 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3.5 gap-2">
        <div>
          <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-[#C9A227]" />
            <span>CHAKKI UNITS & PIN-CODE SERVICEABILITY MANAGEMENT</span>
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-[#8b826f]">
            Assign, enable, or disable 6-digit PIN codes per Chakki milling unit. Customers never choose a chakki—orders route automatically.
          </p>
        </div>

        {/* Chakki Selector */}
        {chakkis.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-[11px] font-bold text-gray-600 dark:text-[#8b826f] uppercase">
              Select Unit:
            </label>
            <select
              value={activeChakki?._id || ''}
              onChange={(e) => setSelectedChakkiId(e.target.value)}
              className="p-1.5 px-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
            >
              {chakkis.map(c => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.city}) - {c.operatingStatus || 'Active'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Chakki Unit Snapshot */}
      {activeChakki && (
        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-[#1a1712] border border-amber-200 dark:border-[#2e2a20] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900 dark:text-[#fdfbf7]">
                {activeChakki.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold uppercase">
                {activeChakki.operatingStatus || 'Active'}
              </span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-[#a89f8d]">
              {activeChakki.address}, {activeChakki.city} • Phone: {activeChakki.phone}
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-sans">Active PINs</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{activeCount}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-sans">Disabled PINs</span>
              <span className="text-gray-400 font-bold text-sm">{disabledCount}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-sans">Daily Capacity</span>
              <span className="text-[#C9A227] font-bold text-sm">{activeChakki.dailyCapacityKg || 500} kg</span>
            </div>
          </div>
        </div>
      )}

      {/* Add New PIN Code Form */}
      <form onSubmit={handleAddPin} className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-[#d0c5af] flex items-center space-x-1.5">
            <Plus className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Assign New PIN Code to this Chakki</span>
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            Format: 6-digit numeric (preserves leading 0)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 208016"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1c1c1c] border border-gray-300 dark:border-[#2e2a20] text-xs font-mono font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
              required
            />
          </div>

          <div className="sm:col-span-1">
            <input
              type="text"
              placeholder="Notes (e.g. Kalyanpur Zone)"
              value={newPinNotes}
              onChange={(e) => setNewPinNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-[#1c1c1c] border border-gray-300 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || newPin.length !== 6}
              className="w-full py-2.5 px-4 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] disabled:opacity-50 text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center space-x-1.5"
            >
              {isSubmitting ? 'Saving...' : 'Assign PIN Code'}
            </button>
          </div>
        </div>
      </form>

      {/* Filter & Search PIN Codes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assigned PIN codes..."
            value={pinSearch}
            onChange={(e) => setPinSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs">
          {['all', 'active', 'disabled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                statusFilter === st
                  ? 'bg-[#C9A227] text-white dark:text-[#121212]'
                  : 'bg-gray-100 dark:bg-[#201d16] text-gray-600 dark:text-[#8b826f] hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Assigned PIN Codes Grid */}
      {filteredPincodes.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-500">
          No assigned PIN codes found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredPincodes.map(item => (
            <div
              key={item.pincode}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                item.isActive
                  ? 'border-gray-200 dark:border-[#2e2a20] bg-white dark:bg-[#181818]'
                  : 'border-dashed border-gray-300 dark:border-[#3a3528] bg-gray-50/60 dark:bg-[#121212] opacity-75'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-bold text-[#C9A227]">
                    {item.pincode}
                  </span>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    item.isActive
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                  }`}>
                    {item.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-[10px] text-gray-500 dark:text-[#8b826f] truncate max-w-[150px]">
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleTogglePin(item.pincode)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    item.isActive
                      ? 'bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-rose-100 hover:text-rose-700'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                  }`}
                  title={item.isActive ? 'Disable this PIN' : 'Enable this PIN'}
                >
                  {item.isActive ? 'Disable' : 'Enable'}
                </button>

                <button
                  type="button"
                  onClick={() => handleRemovePin(item.pincode)}
                  className="p-1 rounded text-gray-400 hover:text-rose-600 transition-colors"
                  title="Remove PIN (Preserves historical orders)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety Notice */}
      <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-[11px] text-gray-500 dark:text-[#8b826f] flex items-center space-x-2">
        <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span>
          <strong>Operational Safety:</strong> Removing or disabling a PIN code strictly prevents future order submissions in that area. All past customer orders, invoices, and delivery histories remain completely preserved.
        </span>
      </div>

    </div>
  );
}

export default AdminChakkiPincodesSection;
