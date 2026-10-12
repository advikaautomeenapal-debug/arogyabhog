import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  ArrowRight, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  Edit2, 
  Trash2, 
  Home, 
  Briefcase, 
  KeyRound, 
  ArrowLeft,
  RotateCcw,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Download,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

const ADMIN_WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '919621496772';

export function AuthModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess, 
  user, 
  onUpdateUser, 
  initialToken = null,
  isInstallable = false,
  isStandalone = false,
  isInstalled = false,
  onPromptInstall = null
}) {
  // Modes: 'login', 'register', 'forgot_whatsapp', 'enter_token'
  const [mode, setMode] = useState(initialToken ? 'enter_token' : 'login');

  // Form Fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [pincode, setPincode] = useState('208016');
  
  // Recovery Fields
  const [resetTokenInput, setResetTokenInput] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [whatsappSent, setWhatsappSent] = useState(false);

  // Password Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Status & Feedback States
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
    city: user?.city || 'Kanpur',
    state: user?.state || 'Uttar Pradesh',
    pincode: user?.pincode || '208016'
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
    city: user?.city || 'Kanpur',
    state: user?.state || 'Uttar Pradesh',
    pincode: user?.pincode || '208016',
    isDefault: false
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        sector: user.sector || '',
        city: user.city || 'Kanpur',
        state: user.state || 'Uttar Pradesh',
        pincode: user.pincode || '208016'
      });
      if (user.savedAddresses) {
        setSavedAddresses(user.savedAddresses);
      }
    }
  }, [user]);

  useEffect(() => {
    if (initialToken) {
      setResetTokenInput(initialToken);
      setMode('enter_token');
    }
  }, [initialToken]);

  if (!isOpen) return null;

  // Clean 10-digit mobile number helper
  const cleanPhone = (val) => val.replace(/\D/g, '').slice(-10);

  // Reset form inputs when switching modes
  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setWhatsappSent(false);
  };

  // Handle Login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetPhone = cleanPhone(phone);
    if (targetPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login(targetPhone, password);
      if (res.success && res.user) {
        if (onLoginSuccess) onLoginSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message || 'Invalid mobile number or password');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration submission (NO email collected or stored)
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    const targetPhone = cleanPhone(phone);
    if (targetPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (e.g. 9811234567)');
      return;
    }

    const targetPin = pincode.toString().trim().replace(/\D/g, '');
    if (targetPin.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code (e.g. 208016)');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        name: name.trim(),
        phone: targetPhone,
        pincode: targetPin,
        password
      });

      if (res.success && res.user) {
        if (onLoginSuccess) onLoginSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.message || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error during registration');
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp-Based Recovery Initiation
  const handleOpenWhatsAppRecovery = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetPhone = cleanPhone(phone);
    if (targetPhone.length !== 10) {
      setErrorMsg('Please enter your 10-digit registered mobile number before opening WhatsApp support.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Log request on backend for admin tracking
      const res = await api.initiatePasswordRecovery(targetPhone);
      const adminContact = res?.adminPhone || ADMIN_WHATSAPP_NUMBER;

      // 2. Build prefilled recovery message strictly per specification:
      // Hi Arogya Bhog Admin,\n\nI have forgotten my Arogya Bhog account password and need help resetting it.\n\nRegistered mobile number: [Customer Mobile Number]\n\nPlease help me reset my password.\n\nThank you.
      const prefilledText = `Hi Arogya Bhog Admin,\n\nI have forgotten my Arogya Bhog account password and need help resetting it.\n\nRegistered mobile number: ${targetPhone}\n\nPlease help me reset my password.\n\nThank you.`;
      const encodedMsg = encodeURIComponent(prefilledText);
      const whatsappUrl = `https://wa.me/${adminContact}?text=${encodedMsg}`;

      // 3. Open WhatsApp click-to-chat
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      setWhatsappSent(true);
      setSuccessMsg(`WhatsApp chat opened with prefilled recovery message for +91 ${targetPhone}. Please press "Send" in WhatsApp to notify the admin.`);
    } catch (err) {
      setErrorMsg('Failed to initiate recovery: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Password Reset using Single-Use Token
  const handleResetPasswordWithToken = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const token = resetTokenInput.trim();
    if (!token) {
      setErrorMsg('Please enter your secure recovery token or click the recovery link sent on WhatsApp');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPasswordWithRecoveryToken({
        token,
        newPassword,
        confirmPassword: confirmNewPassword
      });

      if (res.success) {
        setSuccessMsg('Your password has been reset successfully. You can now log in using your registered mobile number and new password.');
        setMode('login');
        setPassword('');
        setResetTokenInput('');
        setWhatsappSent(false);
      } else {
        setErrorMsg(res.message || 'Password reset failed. The link or recovery token may be invalid, expired, or already used.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error processing password reset');
    } finally {
      setIsLoading(false);
    }
  };

  // Save profile updates for logged-in user
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const cleanContact = cleanPhone(profileForm.phone);
    if (cleanContact.length !== 10) {
      setErrorMsg('Please provide a valid 10-digit Indian mobile number');
      setIsLoading(false);
      return;
    }

    const cleanPin = (profileForm.pincode || '').toString().trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setErrorMsg('Please provide a valid 6-digit Indian PIN code');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.updateProfile({
        ...profileForm,
        phone: cleanContact,
        pincode: cleanPin
      });
      if (res.success) {
        setSuccessMsg('Profile details updated successfully!');
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

  // Add new saved address
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
        setSuccessMsg('New delivery address saved!');
        setNewAddressForm({
          label: 'Home',
          name: user?.name || '',
          phone: user?.phone || '',
          address: '',
          sector: '',
          city: user?.city || 'Kanpur',
          state: user?.state || 'Uttar Pradesh',
          pincode: user?.pincode || '208016',
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

  // Delete saved address
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

  // Set default address
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

        {/* Official Brand Header */}
        <div className="text-center space-y-2 mb-5">
          <div className="w-14 h-14 bg-amber-50/70 dark:bg-[#201D14] border border-[#C9A227]/40 rounded-2xl mx-auto flex items-center justify-center shadow-sm">
            <img 
              src="/arogyaBhog_logo.png" 
              alt="Arogya Bhog Emblem" 
              className="w-11 h-11 object-contain" 
            />
          </div>
          <h3 style={{
            fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
            fontSize: '54px',
            fontWeight: 'normal',
            fontStyle: 'italic',
            color: '#D4AF70',
            textAlign: 'center',
            textShadow: '1px 2px 3px #5C4525',
            margin: 0,
            lineHeight: 1
          }}>
            Arogya Bhog
          </h3>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-[#F5F5F3]">
            {user 
              ? 'My Customer Profile & Addresses' 
              : mode === 'register' 
              ? 'Create Your Arogya Bhog Account' 
              : mode === 'forgot_whatsapp'
              ? 'WhatsApp Password Recovery'
              : mode === 'enter_token'
              ? 'Set New Account Password'
              : 'Customer Account Login'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-[#99907C]">
            {user 
              ? 'Manage your personal details, mobile contact, and delivery address book' 
              : mode === 'register' 
              ? 'Join our reserve using your mobile number for freshly milled Vedic flours' 
              : mode === 'forgot_whatsapp'
              ? 'Contact Arogya Bhog admin on WhatsApp to verify identity and get a single-use reset link'
              : mode === 'enter_token'
              ? 'Enter your single-use recovery token from WhatsApp support and establish your new password'
              : 'Sign in with your mobile number to access your cart, orders, and custom blends'}
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
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Mobile Contact (10 digits)</label>
                    <div className="flex rounded-xl border border-gray-200 dark:border-[#2e2a20] bg-white dark:bg-[#121212] overflow-hidden focus-within:border-[#C9A227]">
                      <span className="flex items-center px-3 bg-gray-100 dark:bg-[#1f1b13] text-gray-700 dark:text-[#C9A227] text-xs font-bold border-r border-gray-200 dark:border-[#2e2a20]">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: cleanPhone(e.target.value) })}
                        className="w-full p-2.5 bg-transparent text-xs font-mono font-bold text-[#C9A227] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Primary Delivery Address</label>
                    <textarea
                      rows="2"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Sector / Area</label>
                      <input
                        type="text"
                        value={profileForm.sector}
                        onChange={(e) => setProfileForm({ ...profileForm, sector: e.target.value })}
                        className="w-full p-2 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">6-Digit PIN Code</label>
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
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Customer Name:</span>
                    <strong className="text-gray-900 dark:text-[#fdfbf7]">{user.name}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Mobile Identifier:</span>
                    <strong className="text-[#C9A227] font-mono font-bold">
                      +91 {user.phone ? cleanPhone(user.phone) : 'Not configured'}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Saved PIN Code:</span>
                    <span className="text-gray-700 dark:text-[#d0c5af] font-mono font-semibold">
                      {user.pincode || '208016'}
                    </span>
                  </div>
                  {user.address && (
                    <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-gray-500">Primary Address:</span>
                      <span className="text-gray-700 dark:text-[#d0c5af] text-right max-w-xs">
                        {user.address} {user.sector ? `, ${user.sector}` : ''}
                      </span>
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
                    <div className="flex rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#121212] overflow-hidden">
                      <span className="flex items-center px-3 bg-gray-100 dark:bg-[#1f1b13] text-gray-700 dark:text-[#C9A227] text-xs font-bold border-r border-gray-300 dark:border-[#2e2a20]">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={newAddressForm.phone}
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: cleanPhone(e.target.value) })}
                        placeholder="9811234567"
                        className="w-full p-2 bg-transparent text-xs font-mono font-bold text-[#C9A227] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Complete Address</label>
                    <textarea
                      rows="2"
                      value={newAddressForm.address}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                      placeholder="Apartment, building, street, landmark"
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
                        placeholder="208016"
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
                  <p className="text-[11px] text-gray-400">Save your home and office addresses for fast checkout.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr._id || addr.id}
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
                              onClick={() => handleSetDefaultAddress(addr._id || addr.id)}
                              className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr._id || addr.id)}
                            className="text-gray-400 hover:text-rose-500 p-1"
                            title="Remove address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="font-semibold text-gray-800 dark:text-[#d0c5af]">
                        {addr.name} • 📞 +91 {cleanPhone(addr.phone)}
                      </p>
                      <p className="text-gray-600 dark:text-[#8b826f] leading-relaxed">
                        {addr.address} {addr.sector ? `, ${addr.sector}` : ''}, {addr.city} (PIN: {addr.pincode})
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* App Installation Status / Action */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227] flex items-center space-x-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>AROGYA BHOG APP</span>
                </span>
                {(isStandalone || isInstalled) && (
                  <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Installed</span>
                  </span>
                )}
              </div>

              {isStandalone || isInstalled ? (
                <p className="text-xs text-gray-600 dark:text-[#a89f8c]">
                  You are using the official Arogya Bhog Progressive Web App. Enjoy fast loading, instant offline catalogue access, and seamless one-touch ordering.
                </p>
              ) : isInstallable ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
                  <p className="text-xs text-gray-600 dark:text-[#a89f8c]">
                    Install the official app on your device for instant access to fresh Vedic flours right from your home screen.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onPromptInstall) onPromptInstall();
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-[#C9A227] hover:bg-[#B58F1E] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install App</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-[#888]">
                  Arogya Bhog Web App is active in this browser. To install on your home screen, use your browser's menu option.
                </p>
              )}
            </div>
          </div>
        ) : mode === 'login' ? (
          /* ==========================================================
              VIEW B: CUSTOMER LOGIN (Mobile Number + Password Only)
              ========================================================== */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                Mobile Number
              </label>
              <div className="flex rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] overflow-hidden focus-within:border-[#C9A227] transition-all">
                <span className="flex items-center px-3 bg-gray-100 dark:bg-[#1f1b13] text-gray-700 dark:text-[#C9A227] text-xs font-bold border-r border-gray-300 dark:border-[#2E2A20]">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(cleanPhone(e.target.value))}
                  placeholder="98112 34567"
                  className="w-full px-3 py-2.5 bg-transparent text-xs text-gray-900 dark:text-[#F5F5F3] outline-none font-mono font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot_whatsapp')}
                  className="text-[11px] text-[#C9A227] hover:underline font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
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
                  aria-label="Toggle password visibility"
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
              <span>{isLoading ? 'Authenticating...' : 'SECURE SIGN IN'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Switch to Register */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-xs text-gray-500 hover:text-[#C9A227] transition-colors"
              >
                Don't have an account? <span className="text-[#C9A227] font-bold">Register with Arogya Bhog</span>
              </button>
            </div>
          </form>
        ) : mode === 'register' ? (
          /* ==========================================================
              VIEW C: CUSTOMER REGISTRATION (NO Email Field)
              ========================================================== */
          <form onSubmit={handleRegister} className="space-y-3.5">
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
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                Mobile Number (Unique Customer Identifier)
              </label>
              <div className="flex rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] overflow-hidden focus-within:border-[#C9A227] transition-all">
                <span className="flex items-center px-3 bg-gray-100 dark:bg-[#1f1b13] text-gray-700 dark:text-[#C9A227] text-xs font-bold border-r border-gray-300 dark:border-[#2E2A20]">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(cleanPhone(e.target.value))}
                  placeholder="98112 34567"
                  className="w-full px-3 py-2 bg-transparent text-xs text-gray-900 dark:text-[#F5F5F3] outline-none font-mono font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps">
                  Postal PIN Code
                </label>
                <span className="text-[10px] text-gray-400">Saved in your delivery profile</span>
              </div>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="208016"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#F5F5F3]"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#F5F5F3]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-caps flex items-center justify-center space-x-1 shadow-md transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating Account...' : 'CREATE ACCOUNT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Switch to Sign In */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-gray-500 hover:text-[#C9A227] transition-colors"
              >
                Already have an account? <span className="text-[#C9A227] font-bold">Sign in</span>
              </button>
            </div>
          </form>
        ) : mode === 'forgot_whatsapp' ? (
          /* ==========================================================
              VIEW D: WHATSAPP-BASED FORGOT PASSWORD
              ========================================================== */
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-[#201d14] border border-[#C9A227]/40 text-xs text-gray-700 dark:text-[#d0c5af] space-y-2">
              <div className="flex items-center space-x-2 text-[#C9A227] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span className="uppercase tracking-wider text-[11px]">Secure WhatsApp Identity Verification</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                To protect your account security, Arogya Bhog verifies customers directly via WhatsApp. Click below to open WhatsApp with your prefilled recovery request, and press <strong>Send</strong>.
              </p>
            </div>

            <form onSubmit={handleOpenWhatsAppRecovery} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                  Registered Mobile Number
                </label>
                <div className="flex rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] overflow-hidden focus-within:border-[#C9A227] transition-all">
                  <span className="flex items-center px-3 bg-gray-100 dark:bg-[#1f1b13] text-gray-700 dark:text-[#C9A227] text-xs font-bold border-r border-gray-300 dark:border-[#2E2A20]">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(cleanPhone(e.target.value))}
                    placeholder="98112 34567"
                    className="w-full px-3 py-2.5 bg-transparent text-xs text-gray-900 dark:text-[#F5F5F3] outline-none font-mono font-medium"
                  />
                </div>
              </div>

              {/* Action Button: Opens WhatsApp with prefilled message */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>{isLoading ? 'Opening WhatsApp...' : 'CONTACT ADMIN ON WHATSAPP'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Post-WhatsApp state & Next steps */}
            {whatsappSent ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-xs text-emerald-900 dark:text-emerald-200 space-y-2 animate-fadeIn">
                <p className="font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>WhatsApp conversation opened!</span>
                </p>
                <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                  Please make sure you have pressed <strong>Send</strong> in WhatsApp. After reviewing your request, the admin will reply with your single-use recovery link.
                </p>
                <button
                  type="button"
                  onClick={() => switchMode('enter_token')}
                  className="w-full mt-2 py-2 rounded-lg bg-[#C9A227] hover:bg-[#b8911f] text-white text-[11px] font-bold uppercase tracking-wider transition-all"
                >
                  I Received My Recovery Token / Link →
                </button>
              </div>
            ) : (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('enter_token')}
                  className="text-xs text-[#C9A227] hover:underline inline-flex items-center space-x-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Already received recovery token? Enter it here</span>
                </button>
              </div>
            )}

            <div className="text-center pt-2 border-t border-gray-100 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-xs text-gray-500 hover:text-[#C9A227] inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        ) : (
          /* ==========================================================
              VIEW E: ENTER RECOVERY TOKEN & ESTABLISH NEW PASSWORD
              ========================================================== */
          <form onSubmit={handleResetPasswordWithToken} className="space-y-3.5 animate-fadeIn">
            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-[#201d14] border border-[#C9A227]/30 text-xs text-gray-600 dark:text-[#b8af9c]">
              Please paste the single-use recovery token or click the recovery link provided by the Arogya Bhog WhatsApp support admin.
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                Single-Use Recovery Token
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={resetTokenInput}
                  onChange={(e) => setResetTokenInput(e.target.value.trim())}
                  placeholder="Paste token or link received on WhatsApp"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#F5F5F3]"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#99907C] tracking-caps block">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-300 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#121212] text-xs text-gray-900 dark:text-[#F5F5F3] outline-none focus:border-[#C9A227] transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#F5F5F3]"
                >
                  {showConfirmNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-caps flex items-center justify-center space-x-1 shadow-md transition-all disabled:opacity-50"
            >
              <span>{isLoading ? 'Resetting Password...' : 'ESTABLISH NEW PASSWORD'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#2e2a20] text-xs">
              <button
                type="button"
                onClick={() => switchMode('forgot_whatsapp')}
                className="text-[#C9A227] hover:underline flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Contact Admin on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-gray-500 hover:text-[#C9A227] flex items-center space-x-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
