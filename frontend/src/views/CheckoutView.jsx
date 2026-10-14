import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  Smartphone, 
  Edit2,
  Trash2,
  Plus,
  Clock,
  Layers,
  AlertCircle,
  Star,
  Tag,
  MessageCircle,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Truck,
  Check,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { getProductSlug, PRODUCT_SEO_CATALOG } from '../utils/productSeoData';

export function CheckoutView({ 
  cart = [], 
  user,
  operationalCosts,
  onBackToStudio, 
  onOrderSuccess,
  onNavigateToOrders,
  onOpenAuth,
  onLoginSuccess,
  onUpdateQuantity,
  onRemoveItem,
  onOpenOrderChat
}) {
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
    pincode: user?.pincode || '',
    label: 'Home',
    deliveryTime: 'Tomorrow, 8:00 PM'
  });

  // Serviceability status state
  const [serviceability, setServiceability] = useState({
    loading: false,
    checked: false,
    isServiceable: null,
    message: '',
    city: 'Kanpur',
    zone: ''
  });

  // Address form modal fields
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    name: '',
    phone: '',
    address: '',
    sector: '',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    pincode: '',
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
  const [isWrongPassword, setIsWrongPassword] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [unserviceableOrder, setUnserviceableOrder] = useState(null);

  // Sync authPhone when user changes
  useEffect(() => {
    if (user?.phone) {
      setAuthPhone(user.phone);
    }
  }, [user]);

  // Debounced Mobile Number Check
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

  // Inline Login
  const handleCheckoutLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setIsWrongPassword(false);
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
          pincode: res.user.pincode || prev.pincode || ''
        }));
        setAuthPassword('');
        setMobileCheckResult(null);
        setDeliveryValidationError('');
        setIsWrongPassword(false);
      } else {
        setIsWrongPassword(true);
        setAuthError(res?.message || 'Incorrect password. If you forgot your password, please contact the admin via WhatsApp to reset it.');
      }
    } catch (err) {
      setIsWrongPassword(true);
      setAuthError(err.message || 'Incorrect password. If you forgot your password, please contact the admin via WhatsApp to reset it.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Inline Registration
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

  // WhatsApp Password Recovery
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
    if (/^\d{6}$/.test(cleanPin)) {
      let isMounted = true;
      setServiceability(prev => ({ ...prev, loading: true }));
      api.checkServiceability({
        city: deliveryInfo.city || 'Kanpur',
        pincode: cleanPin,
        items: cart
      }).then(res => {
        if (!isMounted) return;
        if (res && res.success && (res.data?.serviceable || res.data?.isServiceable)) {
          const zoneName = res.data.zone?.name || (typeof res.data.zone === 'string' ? res.data.zone : 'Local Service Area');
          setServiceability({
            loading: false,
            checked: true,
            isServiceable: true,
            message: res.data.message || 'Great news! We deliver to your location. You can continue with your order.',
            city: res.data.city || deliveryInfo.city || 'Kanpur',
            zone: zoneName
          });
          setDeliveryValidationError('');
        } else {
          const msg = res?.data?.message || res?.message || 'Sorry! We’re not accepting orders in your PIN code yet. We’re working to expand our delivery network and hope to serve your location soon.';
          setServiceability({
            loading: false,
            checked: true,
            isServiceable: false,
            message: msg,
            city: deliveryInfo.city || 'Kanpur',
            zone: ''
          });
        }
      }).catch(() => {
        if (!isMounted) return;
        setServiceability({
          loading: false,
          checked: true,
          isServiceable: false,
          message: 'Sorry! We’re not accepting orders in your PIN code yet. We’re working to expand our delivery network and hope to serve your location soon.',
          city: deliveryInfo.city || 'Kanpur',
          zone: ''
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
        zone: ''
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
      } else if (user.address || user.phone) {
        setDeliveryInfo(prev => ({
          ...prev,
          name: prev.name || user.name || '',
          contactNumber: prev.contactNumber || user.phone || '',
          address: prev.address || user.address || '',
          sector: prev.sector || user.sector || '',
          city: prev.city || user.city || 'Kanpur',
          state: prev.state || user.state || 'Uttar Pradesh',
          pincode: prev.pincode || user.pincode || ''
        }));
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
      pincode: addr.pincode || '',
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
      pincode: deliveryInfo.pincode || '',
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
      pincode: addr.pincode || '',
      isDefault: Boolean(addr.isDefault)
    });
    setDeliveryValidationError('');
    setIsAddressFormOpen(true);
  };

  const handleDeleteAddress = async (addrId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved delivery address?')) return;
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
        setAddressActionMsg('Address removed.');
        setTimeout(() => setAddressActionMsg(''), 3000);
      }
    } catch (err) {
      console.warn('Delete address error:', err);
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
      setDeliveryValidationError('Please enter recipient name.');
      return;
    }
    const cleanPhone = addressForm.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setDeliveryValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!addressForm.address.trim() || addressForm.address.trim().length < 5) {
      setDeliveryValidationError('Please enter complete delivery address.');
      return;
    }
    if (!/^\d{6}$/.test(addressForm.pincode.trim())) {
      setDeliveryValidationError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    try {
      if (editingAddressId) {
        const res = await api.updateAddress(editingAddressId, addressForm);
        if (res.success) {
          await fetchAddresses();
          setIsAddressFormOpen(false);
          setAddressActionMsg('Delivery address updated.');
          setTimeout(() => setAddressActionMsg(''), 3000);
        } else {
          setDeliveryValidationError(res.message || 'Failed to update address.');
        }
      } else {
        const res = await api.addAddress(addressForm);
        if (res.success) {
          await fetchAddresses();
          setIsAddressFormOpen(false);
          setAddressActionMsg('Address saved.');
          setTimeout(() => setAddressActionMsg(''), 3000);
        } else {
          setDeliveryValidationError(res.message || 'Failed to save address.');
        }
      }
    } catch (err) {
      setDeliveryValidationError(err.message || 'Failed to save address.');
    }
  };

  // Cart math
  const itemsTotal = cart && cart.length > 0
    ? cart.reduce((acc, i) => acc + (Number(i.totalItemPrice) || ((Number(i.pricePerKg) || 0) * (Number(i.batchSizeKg) || 1) * (Number(i.quantity) || 1))), 0)
    : 0;
  const discountAmount = appliedCoupon ? (Number(appliedCoupon.discountAmount) || 0) : 0;
  const deliveryCharge = 0; // Free delivery
  const totalPayable = Math.max(0, itemsTotal - discountAmount + deliveryCharge);

  // Delivery info completion check
  const isDeliveryComplete = Boolean(
    String(deliveryInfo.name || '').trim() &&
    String(deliveryInfo.contactNumber || '').replace(/\D/g, '').length >= 10 &&
    String(deliveryInfo.address || '').trim().length >= 5 &&
    /^\d{6}$/.test(String(deliveryInfo.pincode || '').trim())
  );

  // Coupon handling
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

  // WhatsApp coupon request
  const ADMIN_WHATSAPP_NUMBER = import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER || '919621496772';
  const customerPhoneForWa = String(deliveryInfo.contactNumber || user?.phone || '').trim();
  const whatsappDiscountText = `Hi Arogya Bhog Admin,\n\nI would like to request a discount coupon for my order.\n${customerPhoneForWa ? `Mobile: ${customerPhoneForWa}\n` : ''}Order Subtotal: ₹${itemsTotal}\n\nThank you!`;
  const whatsappDiscountUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappDiscountText)}`;

  // Confirm order
  const handleConfirmOrder = async () => {
    if (!user) {
      if (mobileCheckResult?.exists) {
        setAuthError('Please enter your password and click "Sign In & Continue" above.');
      } else if (mobileCheckResult && !mobileCheckResult.exists) {
        setAuthError('Please enter your details and click "Create Account & Continue" above.');
      } else {
        setAuthError('Please enter your 10-digit mobile number above.');
      }
      return;
    }

    if (!isDeliveryComplete) {
      setIsAddressFormOpen(true);
      setDeliveryValidationError('Please fill in your recipient name, contact number, address, and 6-digit PIN code.');
      return;
    }

    if (serviceability.isServiceable === false) {
      setDeliveryValidationError('Sorry! We’re not accepting orders in your PIN code yet. We’re working to expand our delivery network and hope to serve your location soon.');
      return;
    }

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
        items: cart,
        totalAmount: totalPayable,
        discountAmount: discountAmount,
        couponCode: appliedCoupon?.code || '',
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        transactionRef: `COD-${Date.now().toString().slice(-7)}`
      };

      const res = await api.createOrder(orderPayload);
      if (res && res.unserviceable) {
        setUnserviceableOrder(res);
      } else if (res && res.success) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#C9A227', '#E5C158', '#111111']
          });
        } catch (e) {}

        setOrderConfirmed(res.data);
        if (onOrderSuccess) {
          onOrderSuccess(res.data);
        }
      } else {
        alert(res?.message || 'Error placing order');
      }
    } catch (err) {
      alert('Order Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render: Empty Cart
  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-700 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          Your Cart is Empty
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
          Explore our doctor-formulated flours or custom-blend your own 10 kg grain formula.
        </p>
        <button
          onClick={onBackToStudio}
          className="mt-3 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm inline-flex items-center space-x-2 transition-all shadow-sm"
        >
          <span>Browse Products</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Render: Unserviceable Notification
  if (unserviceableOrder) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-5 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Delivery Area Notice
        </h2>
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {unserviceableOrder.message || 'Sorry! We’re not accepting orders in your PIN code yet. We’re working to expand our delivery network and hope to serve your location soon.'}
        </div>
        <button
          onClick={onBackToStudio}
          className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-all shadow-sm"
        >
          Return to Store
        </button>
      </div>
    );
  }

  // Render: Order Confirmed
  if (orderConfirmed) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center space-y-5 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            Order Placed • Cash on Delivery
          </span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white pt-2">
            Thank you for your order!
          </h2>
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 font-mono">
            Order Reference: {orderConfirmed.orderNumber}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Track your fresh batch anytime on your <strong>My Orders</strong> page.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-left text-xs space-y-2">
          <div className="flex justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-gray-500 dark:text-gray-400">Recipient:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{orderConfirmed.customerName}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-gray-500 dark:text-gray-400">Mobile:</span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white">{orderConfirmed.customerContact || orderConfirmed.customerPhone}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="text-gray-500 dark:text-gray-400">Delivery Address:</span>
            <span className="text-right text-gray-800 dark:text-gray-200 max-w-[65%]">
              {orderConfirmed.customerAddress}, {orderConfirmed.customerCity} - {orderConfirmed.customerPincode}
            </span>
          </div>
          <div className="flex justify-between pt-1 font-bold text-sm">
            <span className="text-gray-900 dark:text-white">Total Amount (COD):</span>
            <span className="text-amber-700 dark:text-amber-400">₹{orderConfirmed.totalAmount}</span>
          </div>
        </div>

        {/* Instant WhatsApp Order Notification / Confirmation Button */}
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-left space-y-2">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
            <MessageCircle className="w-4 h-4 fill-current text-emerald-600 dark:text-emerald-400" />
            <span>Instant WhatsApp Order Updates</span>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
            Click below to connect with our chakki admin on WhatsApp for live stone-milling updates and fast priority delivery.
          </p>
          <a
            href={`https://wa.me/919621496772?text=${encodeURIComponent(
              `Namaste Arogya Bhog! 🙏\n\nI have just placed an order on arogyabhog.com:\n\n• Order No: ${orderConfirmed.orderNumber}\n• Name: ${orderConfirmed.customerName}\n• Mobile: ${orderConfirmed.customerContact || orderConfirmed.customerPhone}\n• Total Amount: ₹${orderConfirmed.totalAmount} (COD)\n• Delivery: ${orderConfirmed.customerAddress}, ${orderConfirmed.customerCity}\n\nPlease confirm my order and start fresh stone-milling. Thank you!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Confirm Order on Admin WhatsApp</span>
          </a>

          {/* In-App Direct Order Chat Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenOrderChat) onOpenOrderChat(orderConfirmed);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-[#C9A227] text-[#C9A227] font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
          >
            <MessageSquare className="w-4 h-4 stroke-[2.5]" />
            <span>Chat with Delivery & Support In-App</span>
          </button>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={() => onNavigateToOrders ? onNavigateToOrders() : onBackToStudio()}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center space-x-2"
          >
            <span>View My Orders</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onBackToStudio}
            className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 font-medium text-xs transition-all"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ========================================================
  // MAIN MINIMAL 5-SECTION CHECKOUT LAYOUT
  // ========================================================
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-28 text-gray-900 dark:text-gray-100">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBackToStudio}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400 transition-colors"
            title="Back to products"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Checkout
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Fresh stone-ground flour delivered to your doorstep
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secure</span>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {addressActionMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{addressActionMsg}</span>
        </div>
      )}

      {/* ========================================================
          1. YOUR CART
          Product name, variant, package size, quantity controls, price, remove
          ======================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">1</span>
            <span>Your Cart</span>
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {cart.reduce((sum, item) => sum + (item.quantity || 1), 0)} items
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-zinc-800 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          {cart.map((item, idx) => {
            const batchKg = Number(item.batchSizeKg) || 10;
            const qty = Number(item.quantity) || 1;
            const itemPrice = Number(item.totalItemPrice) || Math.round((Number(item.pricePerKg) || 0) * batchKg * qty);
            const itemSlug = getProductSlug(item);
            const seoItem = PRODUCT_SEO_CATALOG[itemSlug];
            const itemImage = item.image || (seoItem ? seoItem.imageUrl : (itemSlug ? `/variants/${itemSlug}.jpg` : '/arogyaBhog_logo.png'));

            return (
              <div key={idx} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4">
                {/* Product Thumbnail Photo */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-amber-50/20 shrink-0 shadow-2xs">
                  <img
                    src={itemImage}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = '/arogyaBhog_logo.png'; }}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                      {item.name}
                    </h3>
                    {item.isCustom && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 uppercase">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Pack: <strong>{batchKg} kg</strong></span>
                    {item.fineness && <span>• {item.fineness}</span>}
                  </div>
                </div>

                {/* Quantity Controls & Price */}
                <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
                  <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-zinc-800">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity && onUpdateQuantity(idx, qty - 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold text-sm transition-colors"
                      title="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-gray-900 dark:text-white font-mono">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity && onUpdateQuantity(idx, qty + 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 font-bold text-sm transition-colors"
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[60px]">
                    <span className="font-bold text-sm text-gray-900 dark:text-white block font-sans">
                      ₹{itemPrice}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem && onRemoveItem(idx)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          2. DELIVERY ADDRESS
          Name, mobile, address, city, state, PIN code with instant serviceability
          ======================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">2</span>
            <span>Delivery Address</span>
          </h2>
          {user && (
            <button
              onClick={handleOpenAddAddress}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-semibold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New</span>
            </button>
          )}
        </div>

        {deliveryValidationError && !isAddressFormOpen && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{deliveryValidationError}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-4 shadow-sm">
          {!user ? (
            /* Guest Checkout: Smart Mobile Detection & Auth */
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-xs font-bold text-gray-500 font-mono pointer-events-none select-none">
                    +91
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
                    placeholder="10-digit mobile number"
                    className="w-full pl-12 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-amber-600 transition-colors"
                  />
                  {isCheckingMobile && (
                    <div className="absolute right-3 text-amber-600 animate-spin">
                      <Loader2 className="w-4 h-4" />
                    </div>
                  )}
                  {authPhone.length === 10 && !isCheckingMobile && mobileCheckResult && (
                    <div className="absolute right-3 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Returning Customer Inline Password (PASSWORD ONLY) */}
              {mobileCheckResult?.exists && (
                <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-zinc-800/80 border border-amber-300 dark:border-zinc-700 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Registered Account (+91 {authPhone})
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      Sign In Required
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Welcome back! Please enter your account password to proceed:
                  </p>

                  <form onSubmit={handleCheckoutLogin} className="space-y-3">
                    <div className="relative">
                      <input
                        type={showAuthPassword ? 'text' : 'password'}
                        value={authPassword}
                        onChange={(e) => {
                          setAuthPassword(e.target.value);
                          setAuthError('');
                          setIsWrongPassword(false);
                        }}
                        placeholder="Enter your account password"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-amber-600 transition-colors"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPassword(!showAuthPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Wrong Password WhatsApp Notification */}
                    {isWrongPassword && (
                      <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-2.5 animate-fadeIn">
                        <div className="flex items-start space-x-2 text-xs text-rose-800 dark:text-rose-300">
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <strong className="block font-bold">Incorrect Password</strong>
                            <span>If you forgot your password, please contact and chat with the admin directly on WhatsApp to reset it.</span>
                          </div>
                        </div>

                        <a
                          href={`https://wa.me/919621496772?text=${encodeURIComponent(`Hi Arogya Bhog Admin,\n\nI entered the wrong password at checkout for my registered mobile number: ${authPhone}.\nPlease help me reset my account password so I can complete my order.\n\nThank you!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Chat with Admin on WhatsApp (Reset Password)</span>
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={handleWhatsAppForgotPassword}
                        className="text-amber-700 dark:text-amber-400 hover:underline flex items-center space-x-1 text-[11px]"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Forgot Password? Chat Admin</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmittingAuth || !authPassword}
                        className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm"
                      >
                        {isSubmittingAuth ? 'Signing in...' : 'Sign In & Continue'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* New Customer Account Creation Form */}
              {mobileCheckResult && !mobileCheckResult.exists && (
                <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 space-y-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Create your account to complete checkout:
                  </p>
                  <form onSubmit={handleCheckoutRegister} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryInfo.name}
                          onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                          Create Password (min 6 chars) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                        Complete Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryInfo.address}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                        placeholder="Flat, Floor, Building, Street"
                        className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                          City <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryInfo.city}
                          onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                          placeholder="Kanpur"
                          className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                          State <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryInfo.state}
                          onChange={(e) => setDeliveryInfo({ ...deliveryInfo, state: e.target.value })}
                          placeholder="Uttar Pradesh"
                          className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                          PIN Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={deliveryInfo.pincode}
                          onChange={(e) => setDeliveryInfo({ ...deliveryInfo, pincode: e.target.value.replace(/\D/g, '') })}
                          placeholder="6 digits"
                          className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-gray-900 dark:text-white outline-none focus:border-amber-600"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm"
                    >
                      {isSubmittingAuth ? 'Creating Account...' : 'Create Account & Continue'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : deliveryInfo.address ? (
            /* Logged-in Customer: Prominently Highlighted Active Delivery Address Card */
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/40 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-zinc-800/80 p-4 sm:p-5 shadow-sm space-y-3.5">
                {/* Highlight Card Header */}
                <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-zinc-700/60 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-400 block">
                        You are ordering to this address:
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        Confirmed Delivery Destination
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      Active ✓
                    </span>
                    {savedAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setShowAllAddresses(!showAllAddresses)}
                        className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-bold px-2 py-0.5 rounded hover:bg-amber-100/50 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {showAllAddresses ? 'Hide Others' : 'Change Address'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Highlighted Address Details */}
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="font-bold text-gray-950 dark:text-white text-sm sm:text-base">
                      {deliveryInfo.name || user.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 font-semibold text-gray-700 dark:text-gray-300">
                      {deliveryInfo.label || 'Home'}
                    </span>
                    <span className="font-mono text-xs text-gray-600 dark:text-gray-400 font-semibold">
                      • Phone: +91 {deliveryInfo.contactNumber || user.phone}
                    </span>
                  </div>

                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                    {deliveryInfo.address}
                    {deliveryInfo.sector ? `, ${deliveryInfo.sector}` : ''}
                  </p>

                  <div className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300 pt-0.5">
                    <span>{deliveryInfo.city || 'Kanpur'}, {deliveryInfo.state || 'Uttar Pradesh'}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-gray-950 dark:text-white bg-white dark:bg-zinc-900 px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700">
                      PIN: {deliveryInfo.pincode}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Row inside highlighted card */}
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/50 dark:border-zinc-700/50 flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const matched = savedAddresses.find(a => (a._id || a.id) === selectedAddressId) || savedAddresses[0];
                        if (matched) {
                          handleOpenEditAddress(matched);
                        } else {
                          setAddressForm({
                            label: deliveryInfo.label || 'Home',
                            name: deliveryInfo.name || user.name || '',
                            phone: deliveryInfo.contactNumber || user.phone || '',
                            address: deliveryInfo.address || '',
                            sector: deliveryInfo.sector || '',
                            city: deliveryInfo.city || 'Kanpur',
                            state: deliveryInfo.state || 'Uttar Pradesh',
                            pincode: deliveryInfo.pincode || '',
                            isDefault: true
                          });
                          setEditingAddressId(null);
                          setIsAddressFormOpen(true);
                        }
                      }}
                      className="text-xs text-gray-700 dark:text-gray-300 hover:text-[#C9A227] font-semibold flex items-center space-x-1 py-1 px-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800 hover:border-[#C9A227] transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Address</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      className="text-xs text-amber-700 dark:text-amber-400 hover:underline font-semibold flex items-center space-x-1 py-1 px-2"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Another Address</span>
                    </button>
                  </div>

                  {serviceability.isServiceable && (
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Free Delivery to this PIN</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Collapsible Address Book Selector */}
              {showAllAddresses && savedAddresses.length > 1 && (
                <div className="space-y-2 pt-1 animate-fadeIn">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                    Choose from your saved addresses:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {savedAddresses.map((addr) => {
                      const addrId = addr._id || addr.id;
                      const isSelected = selectedAddressId === addrId;

                      return (
                        <div
                          key={addrId}
                          onClick={() => {
                            applySelectedAddress(addr);
                            setShowAllAddresses(false);
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-zinc-800 font-semibold'
                              : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {addr.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 font-medium">
                                  {addr.label || 'Home'}
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                    Selected ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 dark:text-gray-400">
                                {addr.address}, {addr.city} - {addr.pincode}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                applySelectedAddress(addr);
                                setShowAllAddresses(false);
                              }}
                              className="text-xs font-bold text-amber-600 hover:underline px-2 py-1"
                            >
                              Deliver Here
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged-in Customer: Enter Address Form (First-time address entry) */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                    Recipient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.name}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                    Contact Phone (10 digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={deliveryInfo.contactNumber}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, contactNumber: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                  Complete Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={deliveryInfo.address}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                  placeholder="House/flat, street, area"
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.city}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                    placeholder="Kanpur"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryInfo.state}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, state: e.target.value })}
                    placeholder="Uttar Pradesh"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-0.5">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={deliveryInfo.pincode}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="6 digits"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-gray-900 dark:text-white outline-none focus:border-amber-600"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              INLINE PIN-CODE SERVICEABILITY FEEDBACK
              ======================================================== */}
          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
            {serviceability.loading ? (
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Checking delivery serviceability for PIN {deliveryInfo.pincode}...</span>
              </div>
            ) : serviceability.checked && serviceability.isServiceable ? (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <strong>Great news! We deliver to your location.</strong> You can continue with your order.
                </div>
              </div>
            ) : serviceability.checked && !serviceability.isServiceable ? (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-zinc-800 border border-amber-200 dark:border-zinc-700 text-xs text-amber-900 dark:text-amber-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="leading-snug">
                  Sorry! We’re not accepting orders in your PIN code yet. We’re working to expand our delivery network and hope to serve your location soon.
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Enter your 6-digit PIN code to verify delivery availability.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          3. ORDER SUMMARY
          Subtotal, delivery charges, discounts, and final payable amount
          ======================================================== */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">3</span>
          <span>Order Summary</span>
        </h2>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-3 shadow-sm text-xs">
          
          {/* Coupon Code Input */}
          <div className="pb-3 border-b border-gray-100 dark:border-zinc-800">
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
                    placeholder="Enter Coupon Code"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-xs font-mono font-bold uppercase text-gray-900 dark:text-white outline-none focus:border-amber-600"
                  />
                  <button
                    type="submit"
                    disabled={isValidatingCoupon || !couponCodeInput.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors"
                  >
                    {isValidatingCoupon ? 'Checking...' : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">{couponError}</p>
                )}
              </form>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">{appliedCoupon.code}</span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">(-₹{discountAmount})</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-rose-600 hover:underline font-semibold text-[11px]"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Need coupon WhatsApp prompt */}
            <div className="pt-2">
              <a
                href={whatsappDiscountUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline flex items-center space-x-1"
              >
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                <span>Need a discount coupon? Chat with us on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-2 pt-1 text-gray-700 dark:text-gray-300">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-semibold text-gray-900 dark:text-white">₹{itemsTotal}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Coupon Discount ({appliedCoupon.code}):</span>
                <span>- ₹{discountAmount}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery Charges:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Free Delivery</span>
            </div>

            <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-zinc-800">
              <span>Total Payable:</span>
              <span className="text-amber-700 dark:text-amber-400 text-base">₹{totalPayable}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. PAYMENT METHOD
          Cash on Delivery (COD) as default mode
          ======================================================== */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">4</span>
          <span>Payment</span>
        </h2>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-xs text-gray-900 dark:text-white">
                  Cash on Delivery (COD)
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Pay via Cash or UPI QR upon fresh doorstep delivery.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              ₹{totalPayable}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. PLACE ORDER (MOBILE STICKY BAR & DESKTOP CTA)
          One prominent, easy-to-understand action
          ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gray-200 dark:border-zinc-800 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-wider block">
              Total Amount
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ₹{totalPayable}
            </span>
          </div>

          <button
            onClick={handleConfirmOrder}
            disabled={isSubmitting || serviceability.isServiceable === false}
            className={`flex-1 py-3 px-5 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-sm ${
              isSubmitting
                ? 'bg-amber-600/70 text-white cursor-wait'
                : serviceability.isServiceable === false
                ? 'bg-gray-300 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <span>
              {isSubmitting
                ? 'Placing Order...'
                : serviceability.isServiceable === false
                ? 'Delivery Not Available'
                : !user
                ? 'Sign In / Register to Place Order'
                : `Place Order (COD • ₹${totalPayable})`}
            </span>
            {!isSubmitting && serviceability.isServiceable !== false && (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
          ADD / EDIT ADDRESS MODAL
          ======================================================== */}
      {isAddressFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {editingAddressId ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={() => setIsAddressFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {deliveryValidationError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deliveryValidationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddressForm} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                    placeholder="Recipient name"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600 font-mono"
                    placeholder="10-digit mobile"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Complete Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows="2"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                  placeholder="House/flat, street, area"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                    placeholder="Kanpur"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white outline-none focus:border-amber-600"
                    placeholder="Uttar Pradesh"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono font-bold text-gray-900 dark:text-white outline-none focus:border-amber-600"
                    placeholder="Enter 6-digit PIN code"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddressFormOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition-colors"
                >
                  {editingAddressId ? 'Update' : 'Save'}
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
