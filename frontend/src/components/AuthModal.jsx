import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, ShieldAlert, Eye, EyeOff, User, Phone, ArrowRight, MapPin, CheckCircle2, Plus, Edit2, Trash2, Home, Briefcase } from 'lucide-react';
import { api } from '../services/api';

export function AuthModal({ isOpen, onClose, onLoginSuccess, user, onUpdateUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Profile editing state for logged-in user
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    sector: user?.sector || '',
    pincode: user?.pincode || '122002'
  });

  // Saved Addresses state
  const [savedAddresses, setSavedAddresses] = useState(user?.savedAddresses || []);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    label: 'Home',
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    sector: '',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122011',
    isDefault: false
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        sector: user.sector || '',
        pincode: user.pincode || '122002'
      });
      if (user.savedAddresses) {
        setSavedAddresses(user.savedAddresses);
      }
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({ email, password, name, phone });
        if (res.success) {
          onLoginSuccess(res.user);
          onClose();
        } else {
          setErrorMsg(res.message || 'Registration failed');
        }
      } else {
        const res = await api.login(email, password);
        if (res.success) {
          onLoginSuccess(res.user);
          onClose();
        } else {
          setErrorMsg(res.message || 'Invalid credentials');
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await api.updateProfile(profileForm);
      if (res.success) {
        setSuccessMsg('Profile updated successfully!');
        if (onUpdateUser) onUpdateUser(res.user);
        setIsEditingProfile(false);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.message || 'Could not update profile');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await api.addAddress(newAddressForm);
      if (res.success) {
        setSavedAddresses(res.data);
        if (onUpdateUser && user) {
          onUpdateUser({ ...user, savedAddresses: res.data });
        }
        setIsAddingAddress(false);
        setSuccessMsg('New address added to your address book!');
        setNewAddressForm({
          label: 'Home',
          name: user?.name || '',
          phone: user?.phone || '',
          address: '',
          sector: '',
          city: 'Gurugram',
          state: 'Haryana',
          pincode: '122011',
          isDefault: false
        });
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(res.message || 'Error adding address');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const res = await api.deleteAddress(addressId);
      if (res.success) {
        setSavedAddresses(res.data);
        if (onUpdateUser && user) {
          onUpdateUser({ ...user, savedAddresses: res.data });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const res = await api.setDefaultAddress(addressId);
      if (res.success) {
        setSavedAddresses(res.data);
        if (onUpdateUser && user) {
          onUpdateUser({ ...user, savedAddresses: res.data });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2A20] shadow-2xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto font-serif">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 dark:hover:text-[#F5F5F3] p-1 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Official AB Emblem & Wordmark */}
        <div className="text-center space-y-2 mb-5">
          <div className="w-14 h-14 bg-amber-50/70 dark:bg-[#201D14] border border-[#C9A227]/40 rounded-2xl mx-auto flex items-center justify-center shadow-sm">
            <img 
              src="/arogyaBhog_logo.png" 
              alt="Arogyabhog Emblem" 
              className="w-11 h-11 object-contain" 
            />
          </div>
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
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-[#F5F5F3]">
            {user ? 'My Customer Profile & Addresses' : isRegister ? 'Create Your Reserve Account' : 'Customer Account Login'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-[#99907C]">
            {user 
              ? 'Manage your personal details, mobile contact, and delivery address book' 
              : isRegister 
              ? 'Join our reserve for personalized Vedic multi-grain formulation' 
              : 'Sign in to access your flour studio, orders, and personalized blends'}
          </p>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error banner */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-500/50 rounded-xl text-red-700 dark:text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ==========================================================
            VIEW A: LOGGED-IN CUSTOMER PROFILE & ADDRESS BOOK
            ========================================================== */}
        {user ? (
          <div className="space-y-5">
            
            {/* Customer Details Box */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-2">
                <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227]">
                  ACCOUNT DETAILS
                </span>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs text-[#C9A227] hover:underline flex items-center space-x-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Mobile Contact</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-mono font-bold text-[#C9A227] outline-none focus:border-[#C9A227]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Primary Address</label>
                    <textarea
                      rows="2"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Sector</label>
                      <input
                        type="text"
                        value={profileForm.sector}
                        onChange={(e) => setProfileForm({ ...profileForm, sector: e.target.value })}
                        className="w-full p-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">PIN Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={profileForm.pincode}
                        onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value.replace(/\D/g, '') })}
                        className="w-full p-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-mono font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    {isLoading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              ) : (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <strong className="text-gray-900 dark:text-[#fdfbf7]">{user.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="text-gray-700 dark:text-[#d0c5af]">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contact:</span>
                    <strong className="text-[#C9A227] font-mono">{user.phone || 'Not configured'}</strong>
                  </div>
                  {user.address && (
                    <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-gray-500">Address:</span>
                      <span className="text-gray-700 dark:text-[#d0c5af] text-right max-w-xs">{user.address} (PIN: {user.pincode})</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Saved Address Book Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold tracking-caps text-[#C9A227]">
                  SAVED ADDRESS BOOK ({savedAddresses.length})
                </span>
                <button
                  onClick={() => setIsAddingAddress(!isAddingAddress)}
                  className="py-1 px-2.5 rounded-lg border border-[#C9A227] text-[#C9A227] hover:bg-[#C9A227] hover:text-white text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingAddress ? 'Cancel' : 'Add Address'}</span>
                </button>
              </div>

              {/* Add New Address Form */}
              {isAddingAddress && (
                <form onSubmit={handleAddNewAddress} className="p-4 rounded-xl bg-amber-50/50 dark:bg-[#201c13] border border-[#C9A227]/40 space-y-3 animate-fadeIn">
                  <span className="text-xs font-bold text-[#C9A227] uppercase tracking-wider block">
                    Add New Delivery Address
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Label (e.g. Home, Office)</label>
                      <select
                        value={newAddressForm.label}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                        className="w-full p-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs font-bold text-gray-900 dark:text-[#fdfbf7]"
                      >
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Recipient Name</label>
                      <input
                        type="text"
                        value={newAddressForm.name}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, name: e.target.value })}
                        placeholder="Recipient full name"
                        className="w-full p-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Mobile Contact (10 digits)</label>
                    <input
                      type="tel"
                      value={newAddressForm.phone}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                      placeholder="e.g. 9811234567"
                      className="w-full p-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs font-mono font-bold text-[#C9A227]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Complete Address</label>
                    <textarea
                      rows="2"
                      value={newAddressForm.address}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                      placeholder="Apartment, building, street, area"
                      className="w-full p-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">City</label>
                      <input
                        type="text"
                        value={newAddressForm.city}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                        className="w-full p-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">6-Digit PIN Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={newAddressForm.pincode}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value.replace(/\D/g, '') })}
                        placeholder="122011"
                        className="w-full p-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs font-mono font-bold text-gray-900 dark:text-[#fdfbf7]"
                        required
                      />
                    </div>
                  </div>

                  <label className="flex items-center space-x-2 text-xs text-gray-700 dark:text-[#d0c5af] cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={newAddressForm.isDefault}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })}
                      className="rounded accent-[#C9A227]"
                    />
                    <span>Set as my preferred delivery address</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    {isLoading ? 'Saving Address...' : 'Save to Address Book'}
                  </button>
                </form>
              )}

              {/* List of saved addresses */}
              {savedAddresses.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-[#2e2a20] text-center text-xs text-gray-500 space-y-1">
                  <MapPin className="w-6 h-6 mx-auto text-[#C9A227]/40" />
                  <p>No extra saved addresses yet.</p>
                  <p className="text-[11px] text-gray-400">Save your home and office addresses for 1-click checkout.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr._id}
                      className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-xs space-y-1.5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-1">
                            {addr.label === 'Home' ? <Home className="w-3.5 h-3.5 text-[#C9A227]" /> : <Briefcase className="w-3.5 h-3.5 text-[#C9A227]" />}
                            <span>{addr.label}</span>
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#C9A227]/20 text-[#C9A227] border border-[#C9A227]/40">
                              DEFAULT
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr._id)}
                              className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="text-gray-400 hover:text-rose-500 p-1"
                            title="Remove address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="font-semibold text-gray-800 dark:text-[#d0c5af]">
                        {addr.name} • 📞 {addr.phone}
                      </p>
                      <p className="text-gray-600 dark:text-[#8b826f] leading-relaxed">
                        {addr.address} {addr.sector ? `, ${addr.sector}` : ''}, {addr.city} (PIN: {addr.pincode})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* ==========================================================
              VIEW B: CUSTOMER LOGIN & REGISTRATION
              ========================================================== */
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Suman Sharma"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                    Contact Phone Number (10 digits)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98112 34567"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#F5F5F3]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-caps flex items-center justify-center space-x-1 shadow-md transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : isRegister ? 'CREATE ACCOUNT' : 'SECURE SIGN IN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Toggle Sign In / Register */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg('');
                }}
                className="text-xs text-gray-500 hover:text-[#C9A227] transition-colors"
              >
                {isRegister 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Register with Arogyabhog"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
