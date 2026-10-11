import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  Lock, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Smartphone, 
  QrCode, 
  Copy, 
  Settings, 
  Sparkles, 
  Edit2,
  Trash2,
  Plus,
  Clock,
  Layers,
  User,
  AlertCircle,
  Save,
  Home,
  Briefcase,
  Star,
  CheckCircle,
  CreditCard,
  Info,
  Tag,
  MessageCircle,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { buildUpiUri, MERCHANT_UPI_ID, MERCHANT_NAME } from '../utils/upiHelper';

export function CheckoutView({ 
  cart, 
  user,
  operationalCosts,
  onBackToStudio, 
  onOrderSuccess,
  onNavigateToOrders,
  onOpenAuth,
  onLoginSuccess
}) {
  // Payment method: Cash on Delivery (COD by default)
  const [selectedMethod, setSelectedMethod] = useState('COD');
  const [vpaInput, setVpaInput] = useState('');
  const [vpaVerified, setVpaVerified] = useState(false);

  // Address Book state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  // Active delivery & contact details for this order
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: user?.name || '',
    contactNumber: user?.phone || '',
    address: user?.address || '',
    sector: user?.sector || '',
    city: user?.city || 'Kanpur',
    state: user?.state || 'Uttar Pradesh',
    pincode: user?.pincode || '208016',
    label: 'Home',
    deliveryTime: 'Tomorrow, 8:00 PM'
  });

  // Serviceability status state (Kanpur 208016 & 209202 deterministic routing)
  const [serviceability, setServiceability] = useState({
    loading: false,
    checked: false,
    isServiceable: null,
    message: '',
    city: 'Kanpur',
    zone: '',
    chakki: null
  });

  // Address form modal/drawer fields
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    name: '',
    phone: '',
    address: '',
    sector: '',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    pincode: '208016',
    isDefault: false
  });

  const [saveToProfile, setSaveToProfile] = useState(true);
  const [deliveryValidationError, setDeliveryValidationError] = useState('');
  const [addressActionMsg, setAddressActionMsg] = useState('');

  // ========================================================
  // SMART MOBILE DETECTION & INLINE CHECKOUT AUTHENTICATION
  // ========================================================
  const [authPhone, setAuthPhone] = useState(user?.phone || '');
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [mobileCheckResult, setMobileCheckResult] = useState(null); // { checked: true, exists: boolean, phone: string }
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Sync authPhone when user changes
  useEffect(() => {
    if (user?.phone) {
      setAuthPhone(user.phone);
    }
  }, [user]);

  // Debounced Mobile Number Check (Case A & Case B)
  useEffect(() => {
    if (user) {
      setIsCheckingMobile(false);
      setMobileCheckResult(null);
      return;
    }

    const cleanInput = (authPhone || '').replace(/\D/g, '').slice(-10);
    if (cleanInput.length === 10 && /^[6-9]\d{9}$/.test(cleanInput)) {
      setIsCheckingMobile(true);
      setAuthError('');

      const timer = setTimeout(async () => {
        try {
          const res = await api.checkMobile(cleanInput);
          if (res && res.success) {
            setMobileCheckResult({
              checked: true,
              exists: Boolean(res.exists),
              phone: cleanInput
            });
            // Auto-update delivery contact number
            setDeliveryInfo(prev => ({
              ...prev,
              contactNumber: cleanInput
            }));
          } else {
            setAuthError(res?.message || 'Could not verify mobile number.');
            setMobileCheckResult(null);
          }
        } catch (err) {
          console.error('Error verifying mobile:', err);
          setAuthError('Network error checking mobile number.');
          setMobileCheckResult(null);
        } finally {
          setIsCheckingMobile(false);
        }
      }, 350);

      return () => clearTimeout(timer);
    } else {
      setIsCheckingMobile(false);
      setMobileCheckResult(null);
    }
  }, [authPhone, user]);

  // Case B: Existing Customer Inline Login
  const handleCheckoutLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    const clean = (authPhone || '').replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!authPassword) {
      setAuthError('Please enter your account password.');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await api.login(clean, authPassword);
      if (res && res.success && res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
        setDeliveryInfo(prev => ({
          ...prev,
          name: res.user.name || prev.name,
          contactNumber: res.user.phone || clean,
          address: res.user.address || prev.address,
          sector: res.user.sector || prev.sector,
          city: res.user.city || prev.city || 'Kanpur',
          state: res.user.state || prev.state || 'Uttar Pradesh',
          pincode: res.user.pincode || prev.pincode || '208016'
        }));
        setAuthPassword('');
        setMobileCheckResult(null);
        setDeliveryValidationError('');
      } else {
        setAuthError(res?.message || 'Invalid mobile number or password.');
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Case A: New Customer Inline Registration & Seamless Order Flow
  const handleCheckoutRegister = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    const clean = (authPhone || '').replace(/\D/g, '').slice(-10);
    const fullName = (deliveryInfo.name || '').trim();
    const addr = (deliveryInfo.address || '').trim();
    const cleanPin = (deliveryInfo.pincode || '').toString().trim().replace(/\D/g, '');

    if (!fullName) {
      setAuthError('Please enter your Full Name.');
      return;
    }
    if (clean.length !== 10) {
      setAuthError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }
    if (!addr || addr.length < 5) {
      setAuthError('Please enter your complete delivery address (House / Flat / Street).');
      return;
    }
    if (cleanPin.length !== 6) {
      setAuthError('Please enter a valid 6-digit Indian PIN code (e.g. 208016).');
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const regPayload = {
        name: fullName,
        phone: clean,
        password: authPassword,
        address: addr,
        sector: (deliveryInfo.sector || '').trim(),
        city: (deliveryInfo.city || 'Kanpur').trim(),
        state: (deliveryInfo.state || 'Uttar Pradesh').trim(),
        pincode: cleanPin
      };

      const res = await api.register(regPayload);
      if (res && res.success && res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
        setDeliveryInfo(prev => ({
          ...prev,
          name: res.user.name,
          contactNumber: res.user.phone || clean,
          address: res.user.address,
          sector: res.user.sector,
          city: res.user.city || 'Kanpur',
          state: res.user.state || 'Uttar Pradesh',
          pincode: res.user.pincode || cleanPin
        }));
        setAuthPassword('');
        setMobileCheckResult(null);
        setDeliveryValidationError('');
      } else {
        setAuthError(res?.message || 'Registration failed. Please check your details.');
      }
    } catch (err) {
      setAuthError(err.message || 'Registration error');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // WhatsApp Password Recovery Handler
  const handleWhatsAppForgotPassword = (e) => {
    if (e) e.preventDefault();
    const clean = (authPhone || '').replace(/\D/g, '').slice(-10);
    const prefilledText = `Hi Arogya Bhog Admin,\n\nI have forgotten my Arogya Bhog account password and need help resetting it.\n\nRegistered mobile number: ${clean}\n\nPlease help me reset my password.\n\nThank you.`;
    const adminWhatsApp = '919621496772';
    const whatsappUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(prefilledText)}`;

    try {
      api.initiatePasswordRecovery(clean);
    } catch (err) {}

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Real-time Serviceability Verification
  useEffect(() => {
    const cleanPin = (deliveryInfo.pincode || '').toString().trim();
    if (cleanPin.length === 6) {
      let isMounted = true;
      setServiceability(prev => ({ ...prev, loading: true }));
      api.checkServiceability({
        city: deliveryInfo.city || 'Kanpur',
        pincode: cleanPin,
        items: cart
      }).then(res => {
        if (!isMounted) return;
        if (res && res.success && res.data?.serviceable) {
          const zoneName = res.data.zone?.name || (typeof res.data.zone === 'string' ? res.data.zone : 'Kanpur West & Kalyanpur Zone');
          setServiceability({
            loading: false,
            checked: true,
            isServiceable: true,
            message: `Delivery available in ${zoneName} (${cleanPin})`,
            city: res.data.city || 'Kanpur',
            zone: zoneName,
            chakki: null
          });
          setDeliveryValidationError('');
        } else {
          const msg = res?.message || 'Sorry, we cannot deliver to this PIN code yet.';
          setServiceability({
            loading: false,
            checked: true,
            isServiceable: false,
            message: msg,
            city: deliveryInfo.city || 'Kanpur',
            zone: '',
            chakki: null
          });
        }
      }).catch(() => {
        if (!isMounted) return;
        setServiceability({
          loading: false,
          checked: true,
          isServiceable: false,
          message: 'Unable to check delivery serviceability.',
          city: deliveryInfo.city || 'Kanpur',
          zone: '',
          chakki: null
        });
      });
      return () => { isMounted = false; };
    } else {
      setServiceability({
        loading: false,
        checked: false,
        isServiceable: null,
        message: '',
        city: deliveryInfo.city || 'Kanpur',
        zone: '',
        chakki: null
      });
    }
  }, [deliveryInfo.pincode, deliveryInfo.city, cart]);

  // Fetch Saved Addresses
  const fetchAddresses = async () => {
    if (!user) return;
    setIsLoadingAddresses(true);
    try {
      const res = await api.getAddresses();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setSavedAddresses(res.data);
        const def = res.data.find(a => a.isDefault) || res.data[0];
        if (def && !selectedAddressId) {
          applySelectedAddress(def);
        }
      } else if (user.savedAddresses && user.savedAddresses.length > 0) {
        setSavedAddresses(user.savedAddresses);
        const def = user.savedAddresses.find(a => a.isDefault) || user.savedAddresses[0];
        if (def && !selectedAddressId) {
          applySelectedAddress(def);
        }
      } else {
        // Fallback to profile address
        if (user.address || user.phone) {
          setDeliveryInfo(prev => ({
            ...prev,
            name: prev.name || user.name || '',
            contactNumber: prev.contactNumber || user.phone || '',
            address: prev.address || user.address || '',
            sector: prev.sector || user.sector || '',
            city: prev.city || user.city || 'Kanpur',
            state: prev.state || user.state || 'Uttar Pradesh',
            pincode: prev.pincode || user.pincode || '208016'
          }));
        }
      }
    } catch (err) {
      console.warn('Failed to load address book:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const applySelectedAddress = (addr) => {
    setSelectedAddressId(addr._id || addr.id);
    setDeliveryInfo(prev => ({
      ...prev,
      name: addr.name || '',
      contactNumber: addr.phone || '',
      address: addr.address || '',
      sector: addr.sector || '',
      city: addr.city || 'Kanpur',
      state: addr.state || 'Uttar Pradesh',
      pincode: addr.pincode || '208016',
      label: addr.label || 'Home'
    }));
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      label: 'Home',
      name: deliveryInfo.name || user?.name || '',
      phone: deliveryInfo.contactNumber || user?.phone || '',
      address: '',
      sector: '',
      city: deliveryInfo.city || 'Kanpur',
      state: deliveryInfo.state || 'Uttar Pradesh',
      pincode: deliveryInfo.pincode || '208016',
      isDefault: savedAddresses.length === 0
    });
    setDeliveryValidationError('');
    setIsAddressFormOpen(true);
  };

  const handleOpenEditAddress = (addr, e) => {
    e.stopPropagation();
    setEditingAddressId(addr._id || addr.id);
    setAddressForm({
      label: addr.label || 'Home',
      name: addr.name || '',
      phone: addr.phone || '',
      address: addr.address || '',
      sector: addr.sector || '',
      city: addr.city || 'Kanpur',
      state: addr.state || 'Uttar Pradesh',
      pincode: addr.pincode || '208016',
      isDefault: Boolean(addr.isDefault)
    });
    setDeliveryValidationError('');
    setIsAddressFormOpen(true);
  };

  const handleDeleteAddress = async (addrId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this delivery address?')) return;
    try {
      const res = await api.deleteAddress(addrId);
      if (res.success) {
        const remaining = savedAddresses.filter(a => (a._id || a.id) !== addrId);
        setSavedAddresses(remaining);
        if (selectedAddressId === addrId) {
          if (remaining.length > 0) {
            applySelectedAddress(remaining[0]);
          } else {
            setSelectedAddressId(null);
          }
        }
        setAddressActionMsg('Address removed from your address book.');
        setTimeout(() => setAddressActionMsg(''), 3000);
      } else {
        alert(res.message || 'Failed to delete address');
      }
    } catch (err) {
      alert('Error deleting address: ' + err.message);
    }
  };

  const handleSetDefaultAddress = async (addrId, e) => {
    e.stopPropagation();
    try {
      const res = await api.setDefaultAddress(addrId);
      if (res.success) {
        setSavedAddresses(prev => prev.map(a => ({
          ...a,
          isDefault: (a._id || a.id) === addrId
        })));
        setAddressActionMsg('Default address updated.');
        setTimeout(() => setAddressActionMsg(''), 3000);
      }
    } catch (err) {
      console.warn('Set default error:', err);
    }
  };

  const handleSaveAddressForm = async (e) => {
    e.preventDefault();
    setDeliveryValidationError('');

    if (!addressForm.name.trim()) {
      setDeliveryValidationError('Please enter recipient full name.');
      return;
    }
    const cleanPhone = addressForm.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setDeliveryValidationError('Please enter a valid 10-digit mobile contact number.');
      return;
    }
    if (!addressForm.address.trim() || addressForm.address.trim().length < 5) {
      setDeliveryValidationError('Please enter complete delivery address (house/flat/street).');
      return;
    }
    if (!/^\d{6}$/.test(addressForm.pincode.trim())) {
      setDeliveryValidationError('Please enter a valid 6-digit Indian PIN code (e.g. 122011).');
      return;
    }

    try {
      if (editingAddressId) {
        const res = await api.updateAddress(editingAddressId, addressForm);
        if (res.success) {
          await fetchAddresses();
          setIsAddressFormOpen(false);
          setAddressActionMsg('Delivery address updated successfully.');
          setTimeout(() => setAddressActionMsg(''), 3000);
        } else {
          setDeliveryValidationError(res.message || 'Failed to update address.');
        }
      } else {
        const res = await api.addAddress(addressForm);
        if (res.success) {
          if (Array.isArray(res.data)) {
            setSavedAddresses(res.data);
            const newest = res.data[res.data.length - 1];
            if (newest) applySelectedAddress(newest);
          } else {
            await fetchAddresses();
          }
          setIsAddressFormOpen(false);
          setAddressActionMsg('New delivery address saved to your address book.');
          setTimeout(() => setAddressActionMsg(''), 3000);
        } else {
          setDeliveryValidationError(res.message || 'Failed to save address.');
        }
      }
    } catch (err) {
      setDeliveryValidationError(err.message || 'Failed to save address.');
    }
  };

  // Check if current delivery info is complete
  const isDeliveryComplete = Boolean(
    String(deliveryInfo.name || '').trim() &&
    String(deliveryInfo.contactNumber || '').replace(/\D/g, '').length >= 10 &&
    String(deliveryInfo.address || '').trim().length >= 5 &&
    /^\d{6}$/.test(String(deliveryInfo.pincode || '').trim())
  );

  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [unserviceableOrder, setUnserviceableOrder] = useState(null);

  // Coupon states (Discounts applicable ONLY by coupon code)
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Cart item / batch details
  const firstItem = cart && cart[0];
  const isCustomBlend = Boolean(firstItem?.isCustom);
  const batchName = String(firstItem?.name || 'Fresh Flour Blend').toUpperCase();
  const batchSizeKg = firstItem ? (Number(firstItem.batchSizeKg) || 10) : 10;
  const itemsTotal = cart && cart.length > 0
    ? cart.reduce((acc, i) => acc + (Number(i.totalItemPrice) || ((Number(i.pricePerKg) || 0) * (Number(i.batchSizeKg) || 1) * (Number(i.quantity) || 1))), 0)
    : 0;
  const discountAmount = appliedCoupon ? (Number(appliedCoupon.discountAmount) || 0) : 0;
  const totalPayable = Math.max(0, itemsTotal - discountAmount);

  // Admin WhatsApp for discount requests
  const ADMIN_WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '919621496772';
  const customerPhoneForWa = String(deliveryInfo.contactNumber || user?.phone || '').trim();
  const whatsappDiscountText = `Hi Arogya Bhog Admin,\n\nI would like to request a discount coupon code for my Arogya Bhog order.\n\n${customerPhoneForWa ? `Registered mobile number: ${customerPhoneForWa}\n` : ''}Items total: ₹${itemsTotal}\n\nPlease share an applicable coupon code if available.\n\nThank you!`;
  const whatsappDiscountUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappDiscountText)}`;

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = couponCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponError('');
    setIsValidatingCoupon(true);

    try {
      const contactPhone = String(deliveryInfo.contactNumber || user?.phone || '').trim();
      const res = await api.validateCoupon({
        code: cleanCode,
        phone: contactPhone,
        orderTotal: itemsTotal
      });

      if (res && res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponError('');
      } else {
        setCouponError(res?.message || 'Invalid or inapplicable coupon code.');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Error checking coupon: ' + err.message);
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  // Operational cost rates (OP-001, OP-002, OP-003)
  const millingRate = operationalCosts?.find(c => c.costId === 'OP-001')?.amount ?? 4.0;
  const packagingRate = operationalCosts?.find(c => c.costId === 'OP-002')?.amount ?? 5.0;
  const deliveryRate = operationalCosts?.find(c => c.costId === 'OP-003')?.amount ?? 50.0;

  const totalOrderWeightKg = cart && cart.length > 0
    ? cart.reduce((sum, item) => sum + ((Number(item.batchSizeKg) || 10) * (Number(item.quantity) || 1)), 0)
    : 0;
  const millingCost = Math.round(totalOrderWeightKg * millingRate);
  const packagingCost = Math.ceil(totalOrderWeightKg / 5) * packagingRate;
  const deliveryCost = deliveryRate;
  const totalOperationalCost = millingCost + packagingCost + deliveryCost;

  // Standardized Dynamic UPI Link with strict URL parameter encoding & transaction note
  const orderRef = Date.now().toString().slice(-4);
  const upiData = buildUpiUri({
    vpa: MERCHANT_UPI_ID,
    payeeName: MERCHANT_NAME,
    amount: totalPayable,
    customerName: String(deliveryInfo.name || user?.name || 'Customer').trim(),
    customerPhone: String(deliveryInfo.contactNumber || user?.phone || '').trim(),
    orderNumber: `#AB-${orderRef}`
  });
  const merchantUpiId = upiData.vpa;
  const upiDeepLink = upiData.uri;
  const upiTransactionNote = upiData.note;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleCopyNote = () => {
    navigator.clipboard.writeText(upiTransactionNote);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const handleVerifyVpa = () => {
    if (vpaInput.includes('@')) {
      setVpaVerified(true);
    } else {
      alert('Please enter a valid UPI ID (e.g. name@okhdfcbank)');
    }
  };

  // Submit order with single-click lock to prevent duplicate orders
  const handleConfirmOrder = async () => {
    if (!user) {
      if (mobileCheckResult?.exists) {
        setAuthError('Please enter your password and click "Login & Continue" above to proceed.');
      } else if (mobileCheckResult && !mobileCheckResult.exists) {
        setAuthError('Please complete your details and click "Create Account & Continue" above to proceed.');
      } else {
        setAuthError('Please enter your 10-digit mobile number above to verify your account.');
      }
      return;
    }

    if (!isDeliveryComplete) {
      setIsAddressFormOpen(true);
      setDeliveryValidationError('Please complete all required delivery details (Name, 10-digit Contact Number, Address, and 6-digit PIN code) before placing your order.');
      return;
    }

    // Single-click lock: prevent duplicate orders from double-clicking or re-triggering
    setIsSubmitting(true);
    setDeliveryValidationError('');
    try {
      const orderPayload = {
        customerId: user?.id || user?._id,
        customerEmail: user?.email || '',
        customerName: String(deliveryInfo.name || '').trim(),
        customerPhone: String(deliveryInfo.contactNumber || '').trim(),
        customerContact: String(deliveryInfo.contactNumber || '').trim(),
        customerAddress: String(deliveryInfo.address || '').trim(),
        customerCity: String(deliveryInfo.city || 'Kanpur').trim(),
        customerState: String(deliveryInfo.state || 'Uttar Pradesh').trim(),
        customerSector: String(deliveryInfo.sector || '').trim(),
        customerPincode: String(deliveryInfo.pincode || '').trim(),
        addressLabel: deliveryInfo.label || 'Home',
        saveAddressToProfile: saveToProfile,
        deliverySlot: deliveryInfo.deliveryTime,
        express: false,
        items: cart,
        totalAmount: totalPayable,
        discountAmount: discountAmount,
        couponCode: appliedCoupon?.code || '',
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        transactionRef: `COD-${Date.now().toString().slice(-7)}`,
        upiTransactionNote: `COD Order ${Date.now().toString().slice(-6)}`
      };

      const res = await api.createOrder(orderPayload);
      if (res && res.unserviceable) {
        // Location is not serviceable: show empathetic customer message
        setUnserviceableOrder(res);
      } else if (res && res.success) {
        try {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#C9A227', '#E5C158', '#111111']
          });
        } catch (e) {}

        setOrderConfirmed(res.data);
        if (onOrderSuccess) {
          onOrderSuccess(res.data);
        }
      } else {
        alert(res?.message || 'Error creating order');
      }
    } catch (err) {
      alert('Order Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-[#1f1d16] border border-[#C9A227] flex items-center justify-center text-[#C9A227]">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-[#fdfbf7]">
          Your Chakki Bag is Empty
        </h2>
        <p className="text-xs text-gray-600 dark:text-[#8b826f] max-w-sm mx-auto">
          Add our signature doctor recipes or create your bespoke 10 kg grain formula before proceeding to checkout.
        </p>
        <button
          onClick={onBackToStudio}
          className="mt-4 px-6 py-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-caps inline-flex items-center space-x-2 transition-all shadow-md"
        >
          <span>START SHOPPING</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (unserviceableOrder) {
    const isPaid = unserviceableOrder.isPaid || unserviceableOrder.data?.orderStatus === 'REFUND_PENDING';
    const orderNum = unserviceableOrder.data?.orderNumber || '';
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-[#1f1d16] border-2 border-[#C9A227] mx-auto flex items-center justify-center text-[#C9A227] shadow-lg">
          <AlertCircle className="w-9 h-9" />
        </div>
        
        <div className="space-y-2">
          {orderNum && (
            <div className="flex flex-col items-center space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-mono border border-amber-300/40">
                ORDER REFERENCE: {orderNum}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-[#8b826f] font-mono flex items-center space-x-1">
                <Clock className="w-3 h-3 text-[#C9A227]" />
                <span>Recorded: {new Date(unserviceableOrder.data?.placedAt || unserviceableOrder.data?.createdAt || Date.now()).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}</span>
              </span>
            </div>
          )}
          <h2 className="font-editorial text-2xl font-bold text-gray-900 dark:text-[#fdfbf7] pt-1">
            {isPaid ? 'Refund Notice' : 'Delivery Location Notice'}
          </h2>
        </div>

        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] text-sm text-gray-800 dark:text-[#d0c5af] leading-relaxed shadow-sm">
          <p className="font-serif text-base italic">
            "{unserviceableOrder.message}"
          </p>
        </div>

        {isPaid && (
          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-[#1a1712] border border-amber-300/60 text-xs text-left text-amber-900 dark:text-amber-200 space-y-1.5 shadow-sm">
            <p className="font-bold flex items-center space-x-1.5 text-xs">
              <CreditCard className="w-4 h-4 text-[#C9A227]" />
              <span>Payment Details Preserved</span>
            </p>
            <p className="text-[11px] text-gray-700 dark:text-[#b3a895]">
              Order Amount: <strong>₹{unserviceableOrder.data?.totalAmount || totalPayable}</strong> • Status: <strong className="text-amber-700 dark:text-amber-400">REFUND PENDING</strong>
            </p>
            <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
              Our administrator will record your refund transaction once confirmed with the payment provider.
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onBackToStudio}
            className="px-6 py-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md inline-flex items-center space-x-2"
          >
            <span>BACK TO AROGYA BHOG STORE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (orderConfirmed) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-caps px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            ORDER PLACED • CASH ON DELIVERY
          </span>
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-[#fdfbf7] pt-1">
            Your order is placed!
          </h2>
          <p className="text-sm font-semibold text-[#C9A227] font-mono">
            Order Reference: {orderConfirmed.orderNumber}
          </p>
          <p className="text-xs text-gray-600 dark:text-[#99907c] max-w-sm mx-auto leading-relaxed">
            You will get your order status on your <strong>"My Order"</strong> page.
          </p>
        </div>

        {/* Delivery Details Snapshot */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] text-left text-xs space-y-2.5 shadow-sm">
          <div className="flex justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-2">
            <span className="text-gray-500 dark:text-[#8b826f] flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>Order Placed:</span>
            </span>
            <span className="text-gray-900 dark:text-[#fdfbf7] font-semibold font-mono">
              {new Date(orderConfirmed.placedAt || orderConfirmed.createdAt || Date.now()).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[#8b826f]">Recipient:</span>
            <span className="text-gray-900 dark:text-[#fdfbf7] font-semibold">{orderConfirmed.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[#8b826f]">Contact Phone:</span>
            <span className="text-[#C9A227] font-mono font-bold">{orderConfirmed.customerContact || orderConfirmed.customerPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[#8b826f]">Delivery Address:</span>
            <span className="text-gray-800 dark:text-[#d0c5af] text-right max-w-[65%]">
              {orderConfirmed.customerAddress}
              {orderConfirmed.customerSector ? `, ${orderConfirmed.customerSector}` : ''}
              {orderConfirmed.customerCity ? `, ${orderConfirmed.customerCity}` : ''}
              {orderConfirmed.customerState ? `, ${orderConfirmed.customerState}` : ''}
              {` - ${orderConfirmed.customerPincode}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-[#8b826f]">Payment Mode:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Cash on Delivery (COD)</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-[#2e2a20] pt-2 font-bold text-sm">
            <span className="text-gray-900 dark:text-[#fdfbf7]">Total Payable (COD):</span>
            <span className="text-[#C9A227]">₹{orderConfirmed.totalAmount}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => onNavigateToOrders ? onNavigateToOrders() : onBackToStudio()}
            className="w-full py-3.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white font-sans font-bold text-xs uppercase tracking-caps shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>GO TO MY ORDERS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onBackToStudio}
            className="w-full py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] hover:border-[#C9A227] font-sans font-semibold text-xs transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-3.5 md:px-5 py-4 space-y-4 pb-36 font-serif selection:bg-[#C9A227] selection:text-[#111111]">
      
      {/* ========================================================
          HEADER: SECURE CHECKOUT
          ======================================================== */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-2.5">
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={onBackToStudio}
            className="p-1.5 rounded-xl border border-gray-200 dark:border-[#2e2a20] hover:border-[#C9A227] text-gray-500 hover:text-gray-900 dark:hover:text-[#fdfbf7] transition-all"
            title="Back to Studio"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-xl border border-[#C9A227]/60 bg-amber-50 dark:bg-[#1b1b1c] flex items-center justify-center shadow-sm">
            <img src="/arogyaBhog_logo.png" alt="Arogyabhog Emblem" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="font-serif text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7]">
              SECURE CHECKOUT
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-[#8b826f] font-mono">
              Order Ref: <span className="text-[#C9A227] font-bold">#AB-{orderRef}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#161616] text-[#C9A227] text-[10px] font-bold uppercase tracking-wider shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>256-BIT SSL</span>
        </div>
      </div>

      {/* SMART CHECKOUT AUTHENTICATION NOTICE (IF NOT LOGGED IN) */}
      {!user && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-[#1a1711] border border-[#C9A227]/60 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C9A227]/15 flex items-center justify-center text-[#C9A227] flex-shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-xs font-bold text-gray-900 dark:text-[#fdfbf7] uppercase tracking-wider">
                Smart Mobile Checkout
              </h3>
              <p className="text-[11px] text-gray-600 dark:text-[#a89f8d]">
                Enter your mobile number below. We automatically verify whether you have an existing account or help you create one seamlessly!
              </p>
            </div>
          </div>
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-[10px] uppercase font-bold text-[#C9A227] hover:underline whitespace-nowrap flex-shrink-0"
            >
              Sign In Modal
            </button>
          )}
        </div>
      )}

      {/* FEEDBACK NOTICE */}
      {addressActionMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{addressActionMsg}</span>
        </div>
      )}

      {/* ========================================================
          CARD 1: DELIVERY ADDRESS & ADDRESS BOOK SELECTOR
          ======================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#C9A227]" />
            <span className="text-[11px] uppercase font-bold tracking-caps text-[#C9A227]">
              DELIVERY ADDRESS & CONTACT
            </span>
          </div>

          {user && (
            <button
              onClick={handleOpenAddAddress}
              className="text-xs text-[#C9A227] hover:underline font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Address</span>
            </button>
          )}
        </div>

        {deliveryValidationError && !isAddressFormOpen && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{deliveryValidationError}</span>
          </div>
        )}

        {!user ? (
          /* ========================================================
             SMART MOBILE DETECTION & INLINE AUTHENTICATION FOR GUEST CUSTOMERS
             ======================================================== */
          <div className="space-y-4 pt-1">
            {/* Contact Mobile Number Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-gray-700 dark:text-[#d0c5af] flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Mobile Number for Order & Account</span>
                  <span className="text-rose-500">*</span>
                </span>
                {isCheckingMobile && (
                  <span className="text-[10px] text-[#C9A227] font-sans font-normal flex items-center space-x-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin inline" />
                    <span>Checking account...</span>
                  </span>
                )}
              </label>

              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center space-x-1 text-xs font-mono font-bold text-gray-500 dark:text-[#8b826f] pointer-events-none select-none">
                  <span>+91</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={authPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setAuthPhone(val);
                    setDeliveryInfo(prev => ({ ...prev, contactNumber: val }));
                  }}
                  placeholder="Enter 10-digit mobile (e.g. 9811234567)"
                  className="w-full pl-14 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-300 dark:border-[#2e2a20] text-sm font-mono font-bold text-gray-900 dark:text-[#fdfbf7] placeholder:font-sans placeholder:font-normal placeholder:text-gray-400 dark:placeholder:text-[#6a6352] outline-none focus:border-[#C9A227] transition-all"
                />
                {authPhone.length === 10 && !isCheckingMobile && mobileCheckResult && (
                  <div className="absolute right-3 text-emerald-500 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              {authPhone.length < 10 && (
                <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                  Enter your 10-digit Indian mobile number. We automatically detect whether you have an existing account.
                </p>
              )}
            </div>

            {/* Auth Error Banner */}
            {authError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-1.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* CASE B: Existing Customer Detected */}
            {mobileCheckResult && mobileCheckResult.exists && (
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-[#1e1b13] border-2 border-[#C9A227] space-y-3 animate-fadeIn">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#C9A227]/20 flex items-center justify-center text-[#C9A227] flex-shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-[#fdfbf7]">
                      Welcome back! Registered Account Found (+91 {mobileCheckResult.phone})
                    </h4>
                    <p className="text-[10px] text-gray-600 dark:text-[#a89f8d]">
                      Please enter your password to sign in and load your saved delivery details.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCheckoutLogin} className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                      Account Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showAuthPassword ? 'text' : 'password'}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="Enter your account password"
                        className="w-full px-3 py-2.5 pr-10 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPassword(!showAuthPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#fdfbf7]"
                      >
                        {showAuthPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <button
                      type="button"
                      onClick={handleWhatsAppForgotPassword}
                      className="text-[#C9A227] hover:underline font-semibold flex items-center space-x-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#C9A227]" />
                      <span>Forgot Password? WhatsApp Support</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth || !authPassword}
                    className="w-full py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] disabled:opacity-50 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md transition-all"
                  >
                    {isSubmittingAuth ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Login & Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* CASE A: New Customer Detected */}
            {mobileCheckResult && !mobileCheckResult.exists && (
              <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-[#1a1813] border-2 border-[#C9A227]/70 space-y-3 animate-fadeIn">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#C9A227]/20 flex items-center justify-center text-[#C9A227] flex-shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-[#fdfbf7]">
                      New Customer Detected (+91 {mobileCheckResult.phone})
                    </h4>
                    <p className="text-[10px] text-gray-600 dark:text-[#a89f8d]">
                      Create a password and provide your delivery details to set up your account & place order.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCheckoutRegister} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryInfo.name}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
                        placeholder="e.g. Rohit Verma"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                        Create Password (min 6 chars) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showAuthPassword ? 'text' : 'password'}
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Set account password"
                          className="w-full p-2.5 pr-10 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowAuthPassword(!showAuthPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showAuthPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                      Complete Delivery Address (House / Flat / Tower / Street) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows="2"
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                      placeholder="e.g. Tower 4, Flat 1102, The Palm Springs, Kalyanpur"
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                        Sector / Area
                      </label>
                      <input
                        type="text"
                        value={deliveryInfo.sector}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, sector: e.target.value })}
                        placeholder="Kalyanpur"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                        City <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryInfo.city}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                        placeholder="Kanpur"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-gray-600 dark:text-[#8b826f] block mb-1">
                        PIN Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={deliveryInfo.pincode}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, pincode: e.target.value.replace(/\D/g, '') })}
                        placeholder="208016"
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-300 dark:border-[#2e2a20] text-xs font-mono font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingAuth}
                    className="w-full py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] disabled:opacity-50 text-white font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md transition-all"
                  >
                    {isSubmittingAuth ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Account & Securing Session...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account & Continue</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : savedAddresses.length > 0 ? (
          /* SAVED ADDRESS CARDS LIST */
          <div className="space-y-2.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] tracking-caps block">
              SELECT DELIVERY LOCATION:
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              {savedAddresses.map((addr) => {
                const addrId = addr._id || addr.id;
                const isSelected = selectedAddressId === addrId;

                return (
                  <div
                    key={addrId}
                    onClick={() => applySelectedAddress(addr)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-2 border-[#C9A227] bg-[#fbf9f4] dark:bg-[#201d16] shadow-sm'
                        : 'border-gray-200 dark:border-[#2e2a20] bg-gray-50/60 dark:bg-[#141414] hover:border-gray-300 dark:hover:border-[#3d3729]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5">
                        {/* Radio selection indicator */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                          isSelected ? 'border-[#C9A227]' : 'border-gray-400 dark:border-gray-600'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#C9A227]" />}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-sans font-bold text-xs text-gray-900 dark:text-[#fdfbf7]">
                              {addr.name}
                            </span>
                            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-[#2a2720] text-gray-700 dark:text-[#c4bcac]">
                              {addr.label || 'Home'}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-[#C9A227] border border-amber-300 dark:border-[#C9A227]/40 flex items-center space-x-0.5">
                                <Star className="w-2.5 h-2.5 inline fill-current" />
                                <span>Default</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5 text-xs text-[#C9A227] font-mono font-bold">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{addr.phone}</span>
                          </div>

                          <p className="text-xs text-gray-600 dark:text-[#a89f8d] leading-relaxed">
                            {addr.address}
                            {addr.sector ? `, ${addr.sector}` : ''}
                            {addr.city ? `, ${addr.city}` : ''}
                            {addr.state ? `, ${addr.state}` : ''}
                            {` - ${addr.pincode}`}
                          </p>
                        </div>
                      </div>

                      {/* Card actions: Edit / Delete / Make Default */}
                      <div className="flex items-center space-x-1.5 text-[11px] flex-shrink-0">
                        {!addr.isDefault && (
                          <button
                            onClick={(e) => handleSetDefaultAddress(addrId, e)}
                            className="text-gray-400 hover:text-[#C9A227] p-1"
                            title="Set as Default"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleOpenEditAddress(addr, e)}
                          className="text-gray-400 hover:text-[#C9A227] p-1"
                          title="Edit Address"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteAddress(addrId, e)}
                          className="text-gray-400 hover:text-rose-500 p-1"
                          title="Delete Address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* MANUAL / FIRST TIME ADDRESS INSET */
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-[#a89f8d]">
                No saved addresses yet. Enter your delivery location below:
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.name}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    placeholder="e.g. Rohit Verma"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                    Contact Phone (10 digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={deliveryInfo.contactNumber}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, contactNumber: e.target.value })}
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-[#C9A227] font-bold outline-none focus:border-[#C9A227]"
                    placeholder="e.g. 9811234567"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                  Complete Address (House / Flat / Tower / Street) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="2"
                  value={deliveryInfo.address}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                  className="w-full p-2 rounded-lg bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-700 dark:text-[#d0c5af] outline-none focus:border-[#C9A227]"
                  placeholder="e.g. Tower 4, Flat 1102, The Palm Springs, Golf Course Road"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                    Sector / Area
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.sector}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, sector: e.target.value })}
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    placeholder="Sector 54"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.city}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    placeholder="Kanpur"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={deliveryInfo.pincode}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-mono font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    placeholder="208016"
                    required
                  />
                </div>
              </div>

              {user && (
                <label className="flex items-center space-x-2 text-[11px] text-gray-600 dark:text-[#8b826f] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="rounded accent-[#C9A227]"
                  />
                  <span>Save this address to my permanent Address Book for future orders</span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* REAL-TIME SERVICEABILITY AUDIT STATUS */}
        <div className="pt-1">
          {serviceability.loading ? (
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-[#1a1813] border border-[#C9A227]/40 text-xs flex items-center space-x-2 text-amber-800 dark:text-[#C9A227]">
              <Settings className="w-4 h-4 animate-spin text-[#C9A227] flex-shrink-0" />
              <span>Verifying delivery availability for PIN {deliveryInfo.pincode}...</span>
            </div>
          ) : serviceability.checked && serviceability.isServiceable ? (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/50 text-xs flex items-center justify-between text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Delivery Available:</strong> {serviceability.message}
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-mono">
                PIN {deliveryInfo.pincode}
              </span>
            </div>
          ) : serviceability.checked && !serviceability.isServiceable ? (
            <div className="p-3 rounded-xl bg-amber-50/90 dark:bg-[#1f1a14] border border-amber-300 dark:border-[#C9A227]/40 text-xs space-y-1 text-amber-900 dark:text-[#fdfbf7]">
              <div className="flex items-center space-x-2 font-bold">
                <Info className="w-4 h-4 text-[#C9A227] flex-shrink-0" />
                <span>Delivery Coverage Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-700 dark:text-[#d0c5af]">
                We currently guarantee fast delivery in active Kanpur zones (208016, 209202). You can still proceed to place your order with complete address details.
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-[#1a1712] border border-amber-200 dark:border-[#2e2a20] text-xs flex items-center space-x-2 text-gray-700 dark:text-[#d0c5af]">
              <MapPin className="w-3.5 h-3.5 text-[#C9A227] flex-shrink-0" />
              <span>Active delivery zones: Kanpur (PINs 208016, 209202).</span>
            </div>
          )}
        </div>

        {/* Milling Window Box */}
        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-[#1d1b15] border-l-4 border-[#C9A227] space-y-0.5">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-[#C9A227]">
            <Settings className="w-3.5 h-3.5 animate-spin" />
            <span>Fresh Chakki Stone Milling & Express Dispatch</span>
          </div>
          <p className="text-[11px] text-gray-700 dark:text-[#d0c5af]">
            Cold stone-ground tomorrow morning • Delivered by <strong className="text-gray-900 dark:text-[#fdfbf7]">{deliveryInfo.deliveryTime}</strong>
          </p>
        </div>
      </div>

      {/* ========================================================
          CARD 2: YOUR FRESH BATCH DETAILS
          ======================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] uppercase font-bold tracking-caps text-[#C9A227]">
              YOUR FRESH BATCH
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#C9A227] font-bold">
            Batch #{orderRef}
          </span>
        </div>

        {/* Product title & price */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-base md:text-lg font-bold text-gray-900 dark:text-[#fdfbf7] tracking-wide">
              {batchName}
            </h2>
            <span className="text-xs font-bold text-[#C9A227] block mt-0.5">
              {batchSizeKg} kg Fresh Chakki Seal Bag {firstItem?.fineness ? `• ${firstItem.fineness}` : ''}
            </span>
          </div>

          <div className="text-right">
            <span className="font-sans font-bold text-lg text-gray-900 dark:text-[#fdfbf7]">
              ₹{totalPayable}
            </span>
            <span className="text-xs text-gray-400 dark:text-[#8b826f] line-through block">
              ₹{itemsTotal}
            </span>
          </div>
        </div>

        {/* Custom Blend or Predefined Composition Chips */}
        {firstItem?.grainBreakdown && firstItem.grainBreakdown.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] tracking-caps block">
              {isCustomBlend ? 'CUSTOM 10 KG INGREDIENT BREAKDOWN:' : 'SIGNATURE GRAIN BLEND:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {firstItem.grainBreakdown.map((g, idx) => (
                <span 
                  key={idx} 
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-gray-800 dark:text-[#e5e2e1]"
                >
                  <strong className="text-[#C9A227]">{g.percentage}%</strong> {g.name || g.grainName || 'Grain'} 
                  {g.weightKg && <span className="text-gray-400 ml-1">({g.weightKg} kg)</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Eco Packaging badge */}
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-[#141c16] border border-emerald-300 dark:border-emerald-900/60 flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-400">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>Packaging: 100% Recyclable Eco Kraft Fresh-Zip Seal Bag</span>
        </div>
      </div>

      {/* ========================================================
          CARD 3: DISCOUNT COUPON & WHATSAPP ASSISTANCE
          ======================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-[#201c13] border border-[#C9A227]/40 flex items-center justify-center text-[#C9A227]">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold tracking-caps text-[#C9A227] block">
                DISCOUNT COUPON
              </span>
              <span className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                Apply a single-use coupon code for an instant discount
              </span>
            </div>
          </div>
        </div>

        {!appliedCoupon ? (
          <form onSubmit={handleApplyCoupon} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCodeInput}
                onChange={(e) => {
                  setCouponCodeInput(e.target.value.toUpperCase());
                  setCouponError('');
                }}
                placeholder="ENTER COUPON CODE"
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#121212] text-xs font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7] placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-[#C9A227] transition-all"
              />
              <button
                type="submit"
                disabled={isValidatingCoupon || !couponCodeInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center min-w-[80px]"
              >
                {isValidatingCoupon ? 'Checking...' : 'APPLY'}
              </button>
            </div>

            {couponError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-center space-x-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{couponError}</span>
              </div>
            )}
          </form>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 font-mono tracking-wider">
                  {appliedCoupon.code}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">
                  ₹{appliedCoupon.discountAmount} OFF applied on this order
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline uppercase tracking-wider px-2 py-1"
            >
              Remove
            </button>
          </div>
        )}

        {/* WhatsApp Discount Request Link */}
        <div className="pt-2 border-t border-gray-100 dark:border-[#2e2a20]/60">
          <a
            href={whatsappDiscountUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-2.5 rounded-xl bg-emerald-50/60 dark:bg-[#142318] hover:bg-emerald-100/60 dark:hover:bg-[#1a2e20] border border-emerald-300/60 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium transition-all group"
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4 text-[#25D366] flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] md:text-xs">
                Need a discount coupon? <strong>Chat with Admin on WhatsApp</strong>
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 opacity-70 group-hover:opacity-100" />
          </a>
        </div>
      </div>

      {/* ========================================================
          CARD 4: BILL DETAILS
          ======================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] space-y-2.5 shadow-sm">
        <span className="text-[11px] uppercase font-bold tracking-caps text-[#C9A227] block">
          BILL DETAILS
        </span>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-gray-600 dark:text-[#d0c5af]">
            <span>Items Total ({batchSizeKg} kg Fresh Stone Atta)</span>
            <span>₹{itemsTotal}</span>
          </div>

          {appliedCoupon && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium animate-fadeIn">
              <span className="flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Coupon Discount ({appliedCoupon.code})</span>
              </span>
              <span>- ₹{discountAmount}</span>
            </div>
          )}

          {/* Itemized Operational Cost Breakdown */}
          <div className="pt-2 border-t border-gray-100 dark:border-[#2e2a20]/60 space-y-1 text-[11px] text-gray-500 dark:text-[#8b826f]">
            <div className="flex justify-between">
              <span>• Milling & Roasting ({totalOrderWeightKg} kg × ₹{millingRate}):</span>
              <span className="font-mono text-gray-700 dark:text-[#d0c5af]">₹{millingCost}</span>
            </div>
            <div className="flex justify-between">
              <span>• 3-Layer Aroma Pouch (OP-002):</span>
              <span className="font-mono text-gray-700 dark:text-[#d0c5af]">₹{packagingCost}</span>
            </div>
            <div className="flex justify-between">
              <span>• Fresh Doorstep Delivery (OP-003):</span>
              <span className="font-mono text-gray-700 dark:text-[#d0c5af]">₹{deliveryCost}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-700 dark:text-[#d0c5af] font-medium pt-0.5">
              <span>Operational Cost Total:</span>
              <span className="font-mono font-bold text-[#C9A227]">₹{totalOperationalCost}</span>
            </div>
          </div>

          <div className="flex justify-between text-base font-bold text-gray-900 dark:text-[#fdfbf7] pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
            <span>Total Payable</span>
            <span className="text-[#C9A227] font-sans">₹{totalPayable}</span>
          </div>
        </div>

        {/* Savings Inset Tag (only if coupon applied) */}
        {appliedCoupon && (
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-[#201c13] border border-amber-300 dark:border-[#C9A227]/40 text-center text-xs text-[#C9A227] font-medium flex items-center justify-center space-x-1.5 animate-fadeIn">
            <span>🎉 You saved ₹{discountAmount} on your order with coupon {appliedCoupon.code}!</span>
          </div>
        )}
      </div>

      {/* ========================================================
          CARD 4: PAYMENT METHOD (DEFAULT CASH ON DELIVERY)
          ======================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase font-bold tracking-caps text-[#C9A227]">
            PAYMENT METHOD
          </span>
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase">
            Default Mode
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-xs text-gray-900 dark:text-[#fdfbf7] flex items-center gap-1.5">
                Cash on Delivery (COD)
              </h4>
              <p className="text-[10px] text-gray-500 dark:text-[#8b826f] mt-0.5">
                Pay with cash or scan delivery person's UPI QR upon fresh doorstep delivery.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{totalPayable}</span>
        </div>
      </div>

      {/* ========================================================
          BOTTOM STICKY BAR: TOTAL AMOUNT & PAY CTA
          ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#2e2a20] px-4 py-3 shadow-lg">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          
          <div>
            <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
              TOTAL AMOUNT
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-sans font-bold text-xl md:text-2xl text-gray-900 dark:text-[#fdfbf7]">
                ₹{totalPayable}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                Saved ₹100
              </span>
            </div>
          </div>

          <button
            onClick={handleConfirmOrder}
            disabled={isSubmitting}
            className={`flex-1 py-3.5 px-4 rounded-xl font-sans font-bold text-xs uppercase tracking-caps flex items-center justify-center space-x-1.5 transition-all shadow-md ${
              isSubmitting
                ? 'bg-[#b8911f]/70 text-white cursor-wait opacity-80'
                : !user || !isDeliveryComplete
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212]'
            }`}
          >
            <span>
              {isSubmitting 
                ? 'PLACING ORDER...' 
                : !user 
                ? (isSubmittingAuth 
                    ? 'AUTHENTICATING...' 
                    : mobileCheckResult?.exists 
                    ? 'ENTER PASSWORD & LOGIN TO ORDER' 
                    : mobileCheckResult 
                    ? 'CREATE ACCOUNT & PLACE ORDER' 
                    : 'ENTER MOBILE NUMBER TO CONTINUE')
                : !isDeliveryComplete 
                ? 'COMPLETE DELIVERY DETAILS' 
                : `PLACE ORDER (CASH ON DELIVERY • ₹${totalPayable})`}
            </span>
            {!isSubmitting && <ArrowRight className="w-4 h-4 stroke-[3]" />}
          </button>

        </div>
      </div>

      {/* ========================================================
          ADD / EDIT ADDRESS MODAL
          ======================================================== */}
      {isAddressFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-lg w-full bg-white dark:bg-[#181818] border-2 border-[#C9A227] rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-[#C9A227]" />
                <h3 className="font-serif text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
                  {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddressFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {deliveryValidationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deliveryValidationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddressForm} className="space-y-3">
              {/* Address Label Selector */}
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-1">
                  Address Tag
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Home', 'Work', 'Other'].map((lbl) => (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                        addressForm.label === lbl
                          ? 'border-[#C9A227] bg-[#C9A227] text-white dark:text-[#121212]'
                          : 'border-gray-200 dark:border-[#2e2a20] text-gray-700 dark:text-[#c4bcac] hover:border-gray-300'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                    Recipient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    placeholder="e.g. Rohit Verma"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                    Contact Phone (10 digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-[#C9A227] font-bold outline-none focus:border-[#C9A227]"
                    placeholder="e.g. 9811234567"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                  Complete Address (House / Flat / Tower / Street) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="2"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  placeholder="e.g. Tower 4, Flat 1102, The Palm Springs, Golf Course Road"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                    Sector / Area
                  </label>
                  <input
                    type="text"
                    value={addressForm.sector}
                    onChange={(e) => setAddressForm({ ...addressForm, sector: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    placeholder="Kalyanpur"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    placeholder="Kanpur"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-mono font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    placeholder="208016"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block mb-0.5">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  placeholder="Uttar Pradesh"
                  required
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center space-x-2 text-xs text-gray-700 dark:text-[#c4bcac] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="rounded accent-[#C9A227]"
                  />
                  <span>Make this my default delivery address</span>
                </label>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddressFormOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#383327] text-gray-700 dark:text-[#c4bcac] font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase shadow-md transition-all"
                >
                  {editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default CheckoutView;
