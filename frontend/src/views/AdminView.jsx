import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  Upload, 
  Check, 
  AlertTriangle, 
  Printer, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  PackageCheck,
  CreditCard,
  LogOut,
  Phone,
  Clock,
  X,
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Package,
  Calendar,
  Truck,
  ArrowUpDown,
  Key,
  Shield,
  Activity,
  FileText,
  ChevronDown,
  XCircle,
  Copy,
  FileSpreadsheet,
  Download,
  CheckSquare,
  Square,
  Calculator,
  BarChart3,
  Database,
  BookOpen,
  MapPin,
  Settings,
  Tag,
  Camera,
  MessageCircle,
  Image as ImageIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { buildUpiUri, MERCHANT_UPI_ID } from '../utils/upiHelper';
import { NUTRIENT_DEFINITIONS, calculateProductNutrition, formatNutrientValue } from '../utils/nutritionCalculator';
import { exportOrdersToExcel, EXCEL_ORDER_COLUMNS } from '../utils/excelExport';
import { AdminPasswordResetSection } from '../components/AdminPasswordResetSection';
import { AdminCouponsSection } from '../components/AdminCouponsSection';
import { AdminChakkiPincodesSection } from '../components/AdminChakkiPincodesSection';
import { AdminArticlesSection } from '../components/AdminArticlesSection';
import { AdminWhatsAppModal } from '../components/AdminWhatsAppModal';

export function AdminView({ 
  products = [], 
  grains = [], 
  operationalCosts = [], 
  siteContent = null,
  onReloadData, 
  onLogout, 
  user = { name: 'Chakki Admin', role: 'admin' } 
}) {
  // Active Admin Tab (12 Sections Architecture):
  // 'orders' (Sec 1-6) | 'export' (Sec 7) | 'nutrition' (Sec 8) | 'recipes' (Sec 9) | 'costs' (Sec 10) | 'delivery' (Sec 11) | 'reports' (Sec 12) | 'inventory'
  const safeProducts = Array.isArray(products) ? products : [];
  const safeGrains = Array.isArray(grains) ? grains : [];
  const safeOpCosts = Array.isArray(operationalCosts) ? operationalCosts : [];
  const safeUser = user || { name: 'Chakki Admin', role: 'admin' };
  const [activeAdminTab, setActiveAdminTab] = useState('orders');

  // Orders Queue Sub-Tab:
  // 'active' (Sec 1: enforces 3-day retention rule for completed orders)
  // 'pending_payment' (Sec 2)
  // 'processing' (Sec 3)
  // 'shipped' (Sec 4)
  // 'recently_completed' (Sec 5)
  // 'archived' (Sec 6: permanent historical retrieval)
  // 'cancelled'
  const [ordersSubTab, setOrdersSubTab] = useState('active');

  // Delivery Fleet State
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [newDpForm, setNewDpForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    isAvailable: true
  });
  const [isCreatingDp, setIsCreatingDp] = useState(false);
  const [dpSuccessMsg, setDpSuccessMsg] = useState('');

  // Delivery Person Edit & Password Reset State
  const [editingDp, setEditingDp] = useState(null);
  const [isSavingDp, setIsSavingDp] = useState(false);
  const [resetPasswordDp, setResetPasswordDp] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Requirement 3: Predefined Recipe Formula Editing State
  const [editingRecipeProduct, setEditingRecipeProduct] = useState(null);
  const [recipeGrains, setRecipeGrains] = useState([]);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const [recipeSuccessMsg, setRecipeSuccessMsg] = useState('');

  // Requirement 3: Full Ingredient Profile & Nutrition Editing State
  const [editingGrain, setEditingGrain] = useState(null);
  const [isSavingGrain, setIsSavingGrain] = useState(false);
  const [grainSuccessMsg, setGrainSuccessMsg] = useState('');

  // Flexible Restock Modal State
  const [restockModalGrain, setRestockModalGrain] = useState(null);
  const [restockAmount, setRestockAmount] = useState('25');
  const [isRestocking, setIsRestocking] = useState(false);

  // Order Reassignment State
  const [isReassigning, setIsReassigning] = useState(false);

  // Stats
  const [metrics, setMetrics] = useState({
    ordersToday: 28,
    activeMillingBags: 14,
    lowSilosCount: 4,
    pendingPayments: 1,
    chakkiUnit: 'Unit #4 - Gurugram'
  });

  // All Orders & Queue Orders
  const [allOrders, setAllOrders] = useState([]);
  const [queueOrders, setQueueOrders] = useState([]);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delivery Areas & Site Content State
  const [deliveryAreas, setDeliveryAreas] = useState({ cities: [], zones: [], chakkis: [] });
  const [siteContentData, setSiteContentData] = useState(null);
  const [isSavingSiteContent, setIsSavingSiteContent] = useState(false);
  const [serviceabilityFilter, setServiceabilityFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');

  // Finished Goods Inventory State
  const [inventorySummary, setInventorySummary] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState(null);
  const [adjustStockForm, setAdjustStockForm] = useState({
    movementType: 'PRODUCTION',
    quantityKg: '',
    reason: '',
    notes: ''
  });
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  // Refund Management State
  const [refundModalOrder, setRefundModalOrder] = useState(null);
  const [refundForm, setRefundForm] = useState({
    refundAmount: '',
    refundTransactionRef: '',
    refundNotes: '',
    refundReason: 'Delivery location outside serviceable area'
  });
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // Product Catalog Management & Modal State
  const [allProductsList, setAllProductsList] = useState(products || []);
  const [editingProductModal, setEditingProductModal] = useState(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    category: 'specialized',
    badge: '',
    mrpPrice: '',
    sellingPrice: '',
    description: '',
    dietaryNotes: '',
    target: '',
    benefitKeynote: '',
    isActive: true,
    availablePackSizes: [5, 10],
    imageUrl: '',
    removePhoto: false,
    grains: []
  });
  const [editProductImageFile, setEditProductImageFile] = useState(null);
  const [editProductImagePreview, setEditProductImagePreview] = useState(null);
  const [isSavingProductEdit, setIsSavingProductEdit] = useState(false);

  // Pre-built Product Deletion Confirmation Modal State
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Product Photo Change Dedicated Modal State
  const [photoChangeProductModal, setPhotoChangeProductModal] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadSuccess, setPhotoUploadSuccess] = useState('');
  const [photoUploadError, setPhotoUploadError] = useState('');

  // Operating City & Delivery Zone Form State
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('Uttar Pradesh');
  const [isNewZoneModalOpen, setIsNewZoneModalOpen] = useState(false);
  const [zoneForm, setZoneForm] = useState({
    code: '',
    name: '',
    city: 'Kanpur',
    pinCodes: '208016, 209202'
  });

  // Multi-select orders state for Excel export
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());

  // Search & Filter state for Orders
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'Pending' | 'Paid' | 'Failed'
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all' | 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [variantFilter, setVariantFilter] = useState('all');
  const [deliveryPersonFilter, setDeliveryPersonFilter] = useState('all');

  // Operational Cost editing state
  const [editingOpCost, setEditingOpCost] = useState(null);
  const [newOpCostModal, setNewOpCostModal] = useState(false);
  const [newOpCostForm, setNewOpCostForm] = useState({
    costId: '',
    name: '',
    amount: '',
    unit: 'Per kg',
    category: 'operational',
    packageSize: '',
    description: ''
  });

  // Simulator for Operational Costs
  const [costSimPackSize, setCostSimPackSize] = useState(5); // 1, 5, 10
  const [costSimRawRate, setCostSimRawRate] = useState(42); // per kg
  const [costSimSellingPrice, setCostSimSellingPrice] = useState(68); // per kg

  // New Specialized Flour Form State (Defaults match Screenshot 1)
  const [formData, setFormData] = useState({
    name: 'Hyper-Thyroid & Metabolism Support Atta',
    target: 'Individuals with slow metabolism, hypothyroidism, hormonal imbalance',
    benefitKeynote: 'Supports Thyroid health, Selenium & Zinc rich, Zero gluten spikes',
    badge: 'THYROID METABOLIC CARE',
    badgeType: 'gold',
    mrpPrice: 850,
    sellingPrice: 640,
    description: 'Cold-ground on slow stone chakki to preserve active micronutrients. High fiber blend formulated specifically for thyroid balance and hormonal equilibrium.',
    dietaryNotes: 'High trace selenium, zinc and magnesium for hormonal equilibrium. Puffy soft rotis with low carbohydrate glycemic load.',
    imageUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=600&q=80',
    grains: [
      { name: 'Kodo Millet', percentage: 25 },
      { name: 'Jau/Barley', percentage: 25 },
      { name: 'Roasted Chana', percentage: 20 },
      { name: 'Whole Wheat', percentage: 15 },
      { name: 'Flax Seeds (Alsi)', percentage: 10 },
      { name: 'Pumpkin Seeds', percentage: 5 }
    ],
    safeGrains: [
      { name: 'Kodo Millet', percentage: 25 },
      { name: 'Jau/Barley', percentage: 25 },
      { name: 'Roasted Chana', percentage: 20 },
      { name: 'Whole Wheat', percentage: 15 },
      { name: 'Flax Seeds (Alsi)', percentage: 10 },
      { name: 'Pumpkin Seeds', percentage: 5 }
    ]
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState('');

  const [isFloorDataLoading, setIsFloorDataLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Load metrics, queue, orders, delivery persons, delivery areas, and site content
  const loadFloorData = async () => {
    setIsFloorDataLoading(true);
    setLoadError(null);
    try {
      const [metricsRes, queueRes, ordersRes, dpRes, areasRes, contentRes, invSumRes, invLogsRes] = await Promise.allSettled([
        api.getAdminMetrics(),
        api.getMillingQueue(),
        api.getOrders({
          search: searchQuery,
          paymentStatus: paymentFilter,
          orderStatus: orderStatusFilter,
          fromDate: fromDateFilter,
          toDate: toDateFilter,
          variant: variantFilter,
          deliveryPerson: deliveryPersonFilter,
          city: cityFilter,
          zone: zoneFilter,
          queueType: 'all' // retrieve all to allow instant fast client-side sub-tab switches
        }),
        api.getDeliveryPersons(),
        api.getDeliveryAreas(),
        api.getSiteContent(),
        api.getInventorySummary(),
        api.getInventoryLogs({ limit: 100 })
      ]);

      if (metricsRes.status === 'fulfilled' && metricsRes.value?.success && metricsRes.value?.data) {
        setMetrics(metricsRes.value.data);
      }
      if (queueRes.status === 'fulfilled' && queueRes.value?.success && Array.isArray(queueRes.value?.data)) {
        setQueueOrders(queueRes.value.data);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.success && Array.isArray(ordersRes.value?.data)) {
        setAllOrders(ordersRes.value.data);
      }
      if (dpRes.status === 'fulfilled' && dpRes.value?.success && Array.isArray(dpRes.value?.data)) {
        setDeliveryPersons(dpRes.value.data);
      }
      if (areasRes.status === 'fulfilled' && areasRes.value?.success && areasRes.value?.data) {
        setDeliveryAreas(areasRes.value.data);
      }
      if (contentRes.status === 'fulfilled' && contentRes.value?.success && contentRes.value?.data) {
        setSiteContentData(contentRes.value.data);
      }
      if (invSumRes.status === 'fulfilled' && invSumRes.value?.success && Array.isArray(invSumRes.value?.data)) {
        setInventorySummary(invSumRes.value.data);
      }
      if (invLogsRes.status === 'fulfilled' && invLogsRes.value?.success && Array.isArray(invLogsRes.value?.data)) {
        setInventoryLogs(invLogsRes.value.data);
      }
    } catch (e) {
      console.warn('Error loading floor data:', e);
      setLoadError(e.message || 'Network error occurred while fetching floor operations data.');
    } finally {
      setIsFloorDataLoading(false);
    }
  };

  useEffect(() => {
    loadFloorData();
  }, [searchQuery, paymentFilter, orderStatusFilter, fromDateFilter, toDateFilter, variantFilter, deliveryPersonFilter, cityFilter, zoneFilter]);

  const discountPercent = formData.mrpPrice > formData.sellingPrice 
    ? Math.round(((formData.mrpPrice - formData.sellingPrice) / formData.mrpPrice) * 100) 
    : 0;

  const skuGrains = formData.safeGrains || formData.grains || [];
  const formulationTotal = skuGrains.reduce((acc, g) => acc + (Number(g.percentage) || 0), 0);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGrainRatioChange = (index, newPct) => {
    const currentGrains = [...(formData.safeGrains || formData.grains || [])];
    if (currentGrains[index]) {
      currentGrains[index] = { ...currentGrains[index], percentage: Number(newPct) };
    }
    setFormData({ ...formData, grains: currentGrains, safeGrains: currentGrains });
  };

  const handleRemoveGrainFromSku = (index) => {
    const currentGrains = formData.safeGrains || formData.grains || [];
    const updated = currentGrains.filter((_, i) => i !== index);
    setFormData({ ...formData, grains: updated, safeGrains: updated });
  };

  const handleAddGrainToSku = () => {
    const currentGrains = formData.safeGrains || formData.grains || [];
    const updated = [...currentGrains, { name: 'Jowar', percentage: 10 }];
    setFormData({
      ...formData,
      grains: updated,
      safeGrains: updated
    });
  };

  // Publish Specialized SKU
  const handlePublishSKU = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    setPublishSuccessMsg('');

    try {
      const dataToSend = new FormData();
      dataToSend.append('name', formData.name);
      dataToSend.append('target', formData.target);
      dataToSend.append('benefitKeynote', formData.benefitKeynote);
      dataToSend.append('badge', formData.badge);
      dataToSend.append('badgeType', formData.badgeType);
      dataToSend.append('category', 'specialized');
      dataToSend.append('mrpPrice', formData.mrpPrice);
      dataToSend.append('sellingPrice', formData.sellingPrice);
      dataToSend.append('description', formData.description);
      dataToSend.append('dietaryNotes', formData.dietaryNotes);
      dataToSend.append('grains', JSON.stringify(formData.grains));
      dataToSend.append('isSignature', 'false');

      if (imageFile) {
        dataToSend.append('image', imageFile);
      } else if (formData.imageUrl) {
        dataToSend.append('imageUrl', formData.imageUrl);
      }

      const res = await api.createProduct(dataToSend);
      if (res.success) {
        setPublishSuccessMsg(`Published SKU "${formData.name}" to App Store!`);
        onReloadData();
        setTimeout(() => setPublishSuccessMsg(''), 5000);
      } else {
        alert(res.message || 'Error publishing SKU');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Website & Customer Panel Management Handlers (Requirement 1)
  const handleUpdateSiteContentField = (field, val) => {
    setSiteContentData(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveSiteContent = async () => {
    if (!siteContentData) return;
    setIsSavingSiteContent(true);
    try {
      const res = await api.updateSiteContent(siteContentData);
      if (res.success) {
        setSiteContentData(res.data);
        alert('Website content and customer notices updated successfully!');
      } else {
        alert(res.message || 'Failed to update website content');
      }
    } catch (e) {
      alert('Error updating site content: ' + e.message);
    } finally {
      setIsSavingSiteContent(false);
    }
  };

  const handleToggleProductActive = async (productId) => {
    try {
      const res = await api.toggleProductActive(productId);
      if (res.success) {
        onReloadData();
        loadFloorData();
      } else {
        alert(res.message || 'Could not update product status');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  // Pre-built Product Deletion Confirmation Flow
  const handleDeleteProduct = (productOrId, optionalName) => {
    if (typeof productOrId === 'object' && productOrId) {
      setProductToDelete({
        _id: productOrId._id,
        name: productOrId.name,
        badge: productOrId.badge || '',
        sellingPrice: productOrId.sellingPrice || 0
      });
    } else {
      setProductToDelete({
        _id: productOrId,
        name: optionalName || 'this product',
        badge: '',
        sellingPrice: 0
      });
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      const res = await api.deleteProduct(productToDelete._id);
      if (res.success) {
        alert(res.message || `Product "${productToDelete.name}" removed safely.`);
        setProductToDelete(null);
        if (typeof onReloadData === 'function') onReloadData();
        if (typeof loadFloorData === 'function') loadFloorData();
      } else {
        alert(res.message || 'Could not delete product');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleToggleGrainCustomPermission = async (grain) => {
    try {
      const nextVal = grain.permittedInCustomBlend === false ? true : false;
      const res = await api.updateGrain(grain._id, { permittedInCustomBlend: nextVal });
      if (res.success) {
        onReloadData();
        loadFloorData();
      } else {
        alert(res.message || 'Could not update grain permissions');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  // Chakki & Routing Handlers (Requirement 2)
  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    try {
      const res = await api.createCity({ name: newCityName.trim(), state: newCityState.trim(), isActive: true });
      if (res.success) {
        setNewCityName('');
        const areas = await api.getDeliveryAreas();
        if (areas.success) setDeliveryAreas(areas.data);
        alert('Operating city added successfully!');
      } else {
        alert(res.message || 'Could not add city');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleToggleCity = async (city) => {
    try {
      const res = await api.updateCity(city._id, { isActive: !city.isActive });
      if (res.success) {
        const areas = await api.getDeliveryAreas();
        if (areas.success) setDeliveryAreas(areas.data);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!zoneForm.code || !zoneForm.name) {
      alert('Please fill in Zone Code and Name');
      return;
    }
    try {
      const pinList = zoneForm.pinCodes.split(',').map(p => p.trim()).filter(Boolean);
      const res = await api.createZone({
        code: zoneForm.code,
        name: zoneForm.name,
        city: zoneForm.city,
        pinCodes: pinList,
        assignedChakki: zoneForm.assignedChakki || undefined
      });
      if (res.success) {
        setIsNewZoneModalOpen(false);
        setZoneForm({ code: '', name: '', city: 'Kanpur', pinCodes: '208016, 209202', assignedChakki: '' });
        const areas = await api.getDeliveryAreas();
        if (areas.success) setDeliveryAreas(areas.data);
        alert('Delivery zone created successfully!');
      } else {
        alert(res.message || 'Could not create zone');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleAddChakki = async (e) => {
    e.preventDefault();
    if (!chakkiForm.code || !chakkiForm.name) {
      alert('Please fill in Chakki Code and Name');
      return;
    }
    try {
      const pins = chakkiForm.supportedPinCodes.split(',').map(p => p.trim()).filter(Boolean);
      const res = await api.createChakki({
        code: chakkiForm.code,
        name: chakkiForm.name,
        operationalStatus: chakkiForm.operationalStatus,
        priority: Number(chakkiForm.priority) || 1,
        supportsCustomBlending: Boolean(chakkiForm.supportsCustomBlending),
        supportedPinCodes: pins,
        address: chakkiForm.address,
        contactPhone: chakkiForm.contactPhone
      });
      if (res.success) {
        setIsNewChakkiModalOpen(false);
        setChakkiForm({
          code: '',
          name: '',
          operationalStatus: 'Active',
          priority: 1,
          supportsCustomBlending: true,
          supportedPinCodes: '208016, 209202',
          address: 'Kanpur',
          contactPhone: ''
        });
        const areas = await api.getDeliveryAreas();
        if (areas.success) setDeliveryAreas(areas.data);
        alert('Stone milling chakki registered successfully!');
      } else {
        alert(res.message || 'Could not register chakki');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleUpdateChakkiStatus = async (chakkiId, newStatus) => {
    try {
      const res = await api.updateChakki(chakkiId, { operationalStatus: newStatus });
      if (res.success) {
        const areas = await api.getDeliveryAreas();
        if (areas.success) setDeliveryAreas(areas.data);
      } else {
        alert(res.message || 'Could not update chakki status');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleToggleChakkiCustomBlending = async (chakki) => {
    try {
      const res = await api.updateChakki(chakki._id, { supportsCustomBlending: !chakki.supportsCustomBlending });
      if (res.success) {
        const areas = await api.getDeliveryAreas();
        if (areas.success) setDeliveryAreas(areas.data);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  // ADMIN UPDATE PAYMENT STATUS: Pending -> Paid / Success
  const handleUpdatePayment = async (orderId, newStatus) => {
    try {
      const res = await api.updatePaymentStatus(orderId, newStatus, safeUser?.email || 'admin.meena@arogyabhog.com');
      if (res.success) {
        loadFloorData();
        onReloadData();
        if (selectedOrderDetail && selectedOrderDetail._id === orderId) {
          setSelectedOrderDetail(prev => ({ ...prev, paymentStatus: newStatus }));
        }
      } else {
        alert(res.message || 'Error updating payment status');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // ADMIN UPDATE ORDER STATUS: Pending -> Confirmed -> Processing -> Shipped -> Delivered -> Cancelled
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await api.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        loadFloorData();
        onReloadData();
        if (selectedOrderDetail && selectedOrderDetail._id === orderId) {
          setSelectedOrderDetail(prev => ({ 
            ...prev, 
            orderStatus: newStatus,
            millingStatus: res.data?.millingStatus || prev.millingStatus,
            currentStep: res.data?.currentStep || prev.currentStep
          }));
        }
      } else {
        alert(res.message || 'Error updating order status');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Advance floor milling order
  const handleAdvanceOrderStatus = async (orderId) => {
    try {
      const res = await api.updateOrderStatus(orderId, 'Processing');
      if (res.success) {
        loadFloorData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ADMIN CANCEL ORDER HANDLER
  const handleCancelOrder = async (orderId, orderNumber) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel order ${orderNumber || orderId}?\n\nAny reserved inventory will be automatically restored to stock.`
    );
    if (!confirmCancel) return;

    await handleUpdateOrderStatus(orderId, 'Cancelled');
  };

  // ADMIN DELETE ORDER HANDLER (Permanent removal)
  const handleDeleteOrder = async (orderId, orderNumber) => {
    const confirmDelete = window.confirm(
      `⚠️ PERMANENT DELETION\n\nAre you sure you want to permanently delete order ${orderNumber || orderId}?\n\nThis will completely remove the order from the database and release any reserved stock. This action CANNOT be undone.`
    );
    if (!confirmDelete) return;

    try {
      const res = await api.deleteOrder(orderId);
      if (res.success) {
        if (selectedOrderDetail && selectedOrderDetail._id === orderId) {
          setSelectedOrderDetail(null);
        }
        setSelectedOrderIds(prev => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
        loadFloorData();
        onReloadData();
        alert(res.message || `Order ${orderNumber || orderId} has been deleted.`);
      } else {
        alert(res.message || 'Error deleting order');
      }
    } catch (e) {
      alert(e.message || 'Error deleting order');
    }
  };

  // ADMIN BATCH DELETE SELECTED ORDERS
  const handleDeleteSelectedOrders = async () => {
    if (selectedOrderIds.size === 0) return;
    const count = selectedOrderIds.size;
    const confirmDelete = window.confirm(
      `⚠️ PERMANENT BATCH DELETION\n\nAre you sure you want to permanently delete all ${count} selected order(s)?\n\nThis action CANNOT be undone.`
    );
    if (!confirmDelete) return;

    try {
      let deletedCount = 0;
      for (const id of selectedOrderIds) {
        const res = await api.deleteOrder(id);
        if (res.success) deletedCount++;
      }
      setSelectedOrderIds(new Set());
      if (selectedOrderDetail && selectedOrderIds.has(selectedOrderDetail._id)) {
        setSelectedOrderDetail(null);
      }
      loadFloorData();
      onReloadData();
      alert(`Successfully deleted ${deletedCount} of ${count} order(s).`);
    } catch (e) {
      alert(e.message || 'Error deleting orders');
    }
  };

  // REFUND HANDLERS
  const handleOpenRefundModal = (order) => {
    setRefundModalOrder(order);
    setRefundForm({
      refundAmount: order.refundAmount || order.totalAmount || '',
      refundTransactionRef: order.paymentDetails?.transactionId || '',
      refundNotes: order.unserviceableCustomerMessage 
        ? 'Location outside delivery service area' 
        : 'Customer cancellation refund',
      refundReason: 'Delivery location outside serviceable area'
    });
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!refundModalOrder) return;
    setIsProcessingRefund(true);
    try {
      const res = await api.refundOrder(refundModalOrder._id, refundForm);
      if (res.success) {
        alert(`Refund of ₹${refundForm.refundAmount} successfully recorded!`);
        setRefundModalOrder(null);
        loadFloorData();
        onReloadData();
        if (selectedOrderDetail && selectedOrderDetail._id === refundModalOrder._id) {
          setSelectedOrderDetail(res.data);
        }
      } else {
        alert(res.message || 'Error processing refund');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // FINISHED GOODS STOCK ADJUSTMENT HANDLERS
  const handleOpenStockAdjustModal = (product) => {
    setSelectedStockProduct(product);
    setAdjustStockForm({
      movementType: 'PRODUCTION',
      quantityKg: '',
      reason: 'Batch production addition',
      notes: ''
    });
    setIsAdjustStockModalOpen(true);
  };

  const handleSubmitStockAdjust = async (e) => {
    e.preventDefault();
    if (!selectedStockProduct) return;
    setIsAdjustingStock(true);
    try {
      const res = await api.adjustProductStock(selectedStockProduct._id, adjustStockForm);
      if (res.success) {
        alert(`Stock adjusted successfully for "${selectedStockProduct.name}"!`);
        setIsAdjustStockModalOpen(false);
        loadFloorData();
        onReloadData();
      } else {
        alert(res.message || 'Error adjusting stock');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsAdjustingStock(false);
    }
  };



  const handleOpenProductEditModal = (product) => {
    setEditingProductModal(product);
    const grainsArray = (product.grains && Array.isArray(product.grains) && product.grains.length > 0)
      ? product.grains
      : (product.safeGrains && Array.isArray(product.safeGrains) && product.safeGrains.length > 0)
      ? product.safeGrains
      : [];
    const existingGrains = grainsArray.length > 0
      ? grainsArray.map(g => ({
          ingredientId: g.ingredientId || '',
          name: g.name,
          percentage: Number(g.percentage) || 0
        }))
      : [];

    setEditProductForm({
      name: product.name || '',
      category: product.category || 'specialized',
      badge: product.badge || '',
      mrpPrice: product.mrpPrice || '',
      sellingPrice: product.sellingPrice || '',
      description: product.description || '',
      dietaryNotes: product.dietaryNotes || '',
      target: product.target || '',
      benefitKeynote: product.benefitKeynote || '',
      isActive: product.isActive !== false,
      availablePackSizes: product.availablePackSizes || [5, 10],
      imageUrl: product.imageUrl || '',
      removePhoto: false,
      grains: existingGrains
    });
    setEditProductImageFile(null);
    setEditProductImagePreview(product.imageUrl || null);
  };

  const handleEditModalGrainRatioChange = (index, value) => {
    const parsed = Math.max(0, Math.min(100, Number(value) || 0));
    const updated = [...(editProductForm.grains || [])];
    updated[index] = { ...updated[index], percentage: parsed };
    setEditProductForm(prev => ({ ...prev, grains: updated }));
  };

  const handleEditModalGrainIngredientChange = (index, ingredientId) => {
    const selectedGrain = safeGrains.find(g => (g.ingredientId || g.code) === ingredientId || g.name === ingredientId);
    const updated = [...(editProductForm.grains || [])];
    updated[index] = {
      ...updated[index],
      ingredientId: selectedGrain?.ingredientId || ingredientId,
      name: selectedGrain?.name || ingredientId
    };
    setEditProductForm(prev => ({ ...prev, grains: updated }));
  };

  const handleEditModalAddGrain = () => {
    const curGrains = editProductForm.grains || [];
    const available = safeGrains.find(g => !curGrains.some(rg => rg.name === g.name)) || safeGrains[0];
    setEditProductForm(prev => ({
      ...prev,
      grains: [
        ...(prev.grains || []),
        {
          ingredientId: available?.ingredientId || 'RM-001',
          name: available?.name || 'Whole Wheat',
          percentage: 0
        }
      ]
    }));
  };

  const handleEditModalRemoveGrain = (index) => {
    const updated = (editProductForm.grains || []).filter((_, i) => i !== index);
    setEditProductForm(prev => ({ ...prev, grains: updated }));
  };

  const handleSubmitProductEdit = async (e) => {
    e.preventDefault();
    if (!editingProductModal) return;

    // Validate grains if configured
    if (editProductForm.grains && editProductForm.grains.length > 0) {
      const totalPct = editProductForm.grains.reduce((sum, g) => sum + (Number(g.percentage) || 0), 0);
      if (Math.abs(totalPct - 100) > 0.05) {
        alert(`Blend recipe ingredients must total exactly 100%. Current total is ${totalPct.toFixed(1)}%. Please adjust before saving.`);
        return;
      }
    }

    setIsSavingProductEdit(true);
    try {
      let res;
      if (editProductImageFile) {
        const formDataToSend = new FormData();
        Object.keys(editProductForm).forEach(k => {
          if (k === 'availablePackSizes' || k === 'grains') {
            formDataToSend.append(k, JSON.stringify(editProductForm[k]));
          } else {
            formDataToSend.append(k, editProductForm[k]);
          }
        });
        formDataToSend.append('image', editProductImageFile);
        res = await api.updateProduct(editingProductModal._id, formDataToSend);
      } else {
        res = await api.updateProduct(editingProductModal._id, editProductForm);
      }

      if (res.success) {
        alert('Product details and formulation updated successfully!');
        setEditingProductModal(null);
        loadFloorData();
        onReloadData();
      } else {
        alert(res.message || 'Error updating product');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSavingProductEdit(false);
    }
  };

  // Dedicated Product Photo Change Handlers
  const handleOpenPhotoChangeModal = (product) => {
    setPhotoChangeProductModal(product);
    setPhotoFile(null);
    setPhotoUrlInput(product.imageUrl || '');
    setPhotoPreview(product.imageUrl || '');
    setPhotoUploadSuccess('');
    setPhotoUploadError('');
  };

  const handleSavePhotoChange = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!photoChangeProductModal) return;

    setIsUploadingPhoto(true);
    setPhotoUploadError('');
    setPhotoUploadSuccess('');

    try {
      let res;
      if (photoFile) {
        res = await api.updateProductPhoto(photoChangeProductModal._id, photoFile);
      } else if (photoUrlInput && photoUrlInput.trim()) {
        res = await api.updateProductPhoto(photoChangeProductModal._id, photoUrlInput.trim());
      } else {
        setPhotoUploadError('Please select a photo file or enter an image URL.');
        setIsUploadingPhoto(false);
        return;
      }

      if (res && res.success) {
        setPhotoUploadSuccess(res.message || `Photo updated successfully!`);
        if (typeof onReloadData === 'function') onReloadData();
        if (typeof loadFloorData === 'function') loadFloorData();

        setTimeout(() => {
          setPhotoChangeProductModal(null);
          setPhotoUploadSuccess('');
        }, 1200);
      } else {
        setPhotoUploadError(res?.message || 'Error updating product photo.');
      }
    } catch (err) {
      setPhotoUploadError(err.message || 'Error updating product photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhotoFromModal = async () => {
    if (!photoChangeProductModal) return;
    if (!window.confirm(`Are you sure you want to remove the photo for "${photoChangeProductModal.name}"?`)) return;

    setIsUploadingPhoto(true);
    setPhotoUploadError('');
    setPhotoUploadSuccess('');
    try {
      const res = await api.removeProductPhoto(photoChangeProductModal._id);
      if (res && res.success) {
        setPhotoPreview('');
        setPhotoUrlInput('');
        setPhotoFile(null);
        setPhotoUploadSuccess('Product photo removed successfully!');
        if (typeof onReloadData === 'function') onReloadData();
        if (typeof loadFloorData === 'function') loadFloorData();

        setTimeout(() => {
          setPhotoChangeProductModal(null);
          setPhotoUploadSuccess('');
        }, 1200);
      } else {
        setPhotoUploadError(res?.message || 'Could not remove product photo.');
      }
    } catch (err) {
      setPhotoUploadError(err.message || 'Error removing product photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // CREATE DELIVERY PERSON
  const handleCreateDeliveryPerson = async (e) => {
    e.preventDefault();
    setIsCreatingDp(true);
    setDpSuccessMsg('');
    try {
      const res = await api.createDeliveryPerson(newDpForm);
      if (res.success) {
        setDpSuccessMsg(`Delivery partner "${newDpForm.name}" created successfully!`);
        setNewDpForm({
          name: '',
          phone: '',
          email: '',
          address: '',
          password: '',
          isAvailable: true
        });
        loadFloorData();
        setTimeout(() => setDpSuccessMsg(''), 5000);
      } else {
        alert(res.message || 'Error creating delivery person');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsCreatingDp(false);
    }
  };

  // EDIT DELIVERY PERSON DETAILS (Requirement 6)
  const handleSaveDpEdit = async (e) => {
    e.preventDefault();
    if (!editingDp) return;
    setIsSavingDp(true);
    try {
      const res = await api.updateDeliveryPerson(editingDp._id, {
        name: editingDp.name,
        phone: editingDp.phone,
        email: editingDp.email,
        address: editingDp.address,
        isActive: editingDp.isActive,
        isAvailable: editingDp.isAvailable
      });
      if (res.success) {
        alert(`Delivery person "${editingDp.name}" updated successfully!`);
        setEditingDp(null);
        loadFloorData();
      } else {
        alert(res.message || 'Error updating delivery person');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSavingDp(false);
    }
  };

  // RESET DELIVERY PERSON PASSWORD (Requirement 6)
  const handleResetDpPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordDp || !newPasswordInput.trim()) {
      alert('Please enter a new password.');
      return;
    }
    setIsResettingPassword(true);
    try {
      const res = await api.updateDeliveryPerson(resetPasswordDp._id, {
        password: newPasswordInput.trim()
      });
      if (res.success) {
        alert(`Password for ${resetPasswordDp.name} has been securely updated and hashed!`);
        setResetPasswordDp(null);
        setNewPasswordInput('');
      } else {
        alert(res.message || 'Error resetting password');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // TOGGLE DELIVERY PERSON ACTIVE STATUS
  const handleToggleDpActive = async (dp) => {
    try {
      const res = await api.updateDeliveryPerson(dp._id, { isActive: !dp.isActive });
      if (res.success) {
        loadFloorData();
      } else {
        alert(res.message || 'Error updating status');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // TOGGLE DELIVERY PERSON DUTY AVAILABILITY
  const handleToggleDpAvailability = async (dp) => {
    try {
      const res = await api.updateDeliveryPerson(dp._id, { isAvailable: !dp.isAvailable });
      if (res.success) {
        loadFloorData();
      } else {
        alert(res.message || 'Error updating availability');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // REASSIGN ORDER DELIVERY PERSON
  const handleReassignDelivery = async (orderId, targetDpId) => {
    if (!targetDpId) return;
    setIsReassigning(true);
    try {
      const res = await api.reassignOrderDelivery(orderId, targetDpId);
      if (res.success) {
        alert(res.message || 'Order assigned to delivery partner successfully!');
        loadFloorData();
        if (selectedOrderDetail && selectedOrderDetail._id === orderId) {
          setSelectedOrderDetail(res.data);
        }
      } else {
        alert(res.message || 'Failed to reassign delivery');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsReassigning(false);
    }
  };

  // ==========================================
  // RECIPE FORMULA MANAGEMENT (Requirement 3)
  // ==========================================
  const handleOpenRecipeEditor = (product) => {
    setEditingRecipeProduct(product);
    setRecipeSuccessMsg('');
    const grainsArray = (product.grains && Array.isArray(product.grains) && product.grains.length > 0)
      ? product.grains
      : (product.safeGrains && Array.isArray(product.safeGrains) && product.safeGrains.length > 0)
      ? product.safeGrains
      : [];
    const existingGrains = grainsArray.length > 0 
      ? grainsArray.map(g => ({
          ingredientId: g.ingredientId || '',
          name: g.name,
          percentage: Number(g.percentage) || 0
        }))
      : [
          { ingredientId: 'RM-001', name: 'Whole Wheat (MP Sharbati)', percentage: 75 },
          { ingredientId: 'RM-004', name: 'Roasted Chana', percentage: 25 }
        ];
    setRecipeGrains(existingGrains);
  };

  const handleRecipeGrainRatioChange = (index, value) => {
    const parsed = Math.max(0, Math.min(100, Number(value) || 0));
    const updated = [...recipeGrains];
    updated[index] = { ...updated[index], percentage: parsed };
    setRecipeGrains(updated);
  };

  const handleRecipeGrainIngredientChange = (index, ingredientId) => {
    const selectedGrain = safeGrains.find(g => (g.ingredientId || g.code) === ingredientId || g.name === ingredientId);
    const updated = [...recipeGrains];
    updated[index] = {
      ...updated[index],
      ingredientId: selectedGrain?.ingredientId || ingredientId,
      name: selectedGrain?.name || ingredientId
    };
    setRecipeGrains(updated);
  };

  const handleAddGrainToRecipe = () => {
    // Pick first unused or available grain
    const available = safeGrains.find(g => !recipeGrains.some(rg => rg.name === g.name)) || safeGrains[0];
    setRecipeGrains([
      ...recipeGrains,
      {
        ingredientId: available?.ingredientId || 'RM-006',
        name: available?.name || 'Jowar',
        percentage: 0
      }
    ]);
  };

  const handleRemoveGrainFromRecipe = (index) => {
    if (recipeGrains.length <= 1) {
      alert('A recipe formula must contain at least one ingredient.');
      return;
    }
    const updated = recipeGrains.filter((_, i) => i !== index);
    setRecipeGrains(updated);
  };

  const recipeRunningTotal = recipeGrains.reduce((sum, g) => sum + (Number(g.percentage) || 0), 0);
  const isRecipeBalanced = Math.abs(recipeRunningTotal - 100) < 0.01;

  const handleSaveRecipe = async () => {
    if (!isRecipeBalanced) {
      alert(`Formula must total exactly 100%. Current total is ${recipeRunningTotal}%. Please adjust ingredient percentages.`);
      return;
    }
    setIsSavingRecipe(true);
    try {
      const res = await api.updateProduct(editingRecipeProduct._id, {
        grains: recipeGrains
      });
      if (res.success) {
        setRecipeSuccessMsg('Formula recipe saved successfully! Future pricing and production calculations updated.');
        onReloadData();
        setTimeout(() => {
          setEditingRecipeProduct(null);
          setRecipeSuccessMsg('');
        }, 1200);
      } else {
        alert(res.message || 'Error saving recipe formula');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setIsSavingRecipe(false);
    }
  };

  // ==========================================
  // INGREDIENT PROFILE & NUTRITION (Requirement 3)
  // ==========================================
  // INGREDIENT NUTRITION MASTER (Section 8: 18 Ingredients with 16 Nutrients)
  // ==========================================
  const handleOpenGrainProfileEditor = (grain) => {
    setEditingGrain({
      _id: grain._id,
      ingredientId: grain.ingredientId || grain.code || '',
      name: grain.name,
      category: grain.category || 'Base Grain',
      subtitle: grain.subtitle || '',
      benefits: grain.benefits || '',
      pricePerKg: grain.pricePerKg ?? '',
      inStockKg: grain.inStockKg ?? 50,
      capacityKg: grain.capacityKg ?? 500,
      lowStockThresholdKg: grain.lowStockThresholdKg ?? 40,
      sourceStatus: grain.sourceStatus || 'User-provided base values; minerals are reference estimates',
      verificationStatus: grain.verificationStatus || 'Reference Estimate',
      reviewFlag: grain.reviewFlag || '',
      flaggedForVerification: Boolean(grain.flaggedForVerification),
      nutrition: grain.nutrition || {
        energyKcal: null,
        proteinG: null,
        carbsG: null,
        sugarsG: null,
        addedSugarsG: null,
        fatG: null,
        saturatedFatG: null,
        transFatG: null,
        fibreG: null,
        sodiumMg: null,
        zincMg: null,
        magnesiumMg: null,
        phosphorusMg: null,
        ironMg: null,
        calciumMg: null,
        potassiumMg: null,
        isConfigured: true
      }
    });
    setGrainSuccessMsg('');
  };

  const handleSaveGrainProfile = async (e) => {
    e.preventDefault();
    if (!editingGrain) return;
    setIsSavingGrain(true);
    try {
      const priceVal = editingGrain.pricePerKg === '' || editingGrain.pricePerKg === null ? null : Number(editingGrain.pricePerKg);
      const res = await api.updateGrain(editingGrain._id, {
        ingredientId: editingGrain.ingredientId,
        name: editingGrain.name,
        category: editingGrain.category,
        subtitle: editingGrain.subtitle,
        benefits: editingGrain.benefits,
        pricePerKg: priceVal,
        sourceStatus: editingGrain.sourceStatus,
        verificationStatus: editingGrain.verificationStatus,
        reviewFlag: editingGrain.reviewFlag,
        flaggedForVerification: Boolean(editingGrain.flaggedForVerification),
        inStockKg: Number(editingGrain.inStockKg),
        capacityKg: Number(editingGrain.capacityKg),
        lowStockThresholdKg: Number(editingGrain.lowStockThresholdKg),
        nutrition: editingGrain.nutrition
      });
      if (res.success) {
        setGrainSuccessMsg(`Master ingredient "${editingGrain.name}" updated successfully!`);
        onReloadData();
        setTimeout(() => {
          setEditingGrain(null);
          setGrainSuccessMsg('');
        }, 1200);
      } else {
        alert(res.message || 'Error updating ingredient profile');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSavingGrain(false);
    }
  };

  const handleToggleLabFlag = async (grain) => {
    try {
      const isCurrentlyFlagged = grain.flaggedForVerification || grain.verificationStatus === 'Pending Lab Test';
      const newStatus = isCurrentlyFlagged ? 'User Verified' : 'Pending Lab Test';
      const newFlagged = !isCurrentlyFlagged;
      const res = await api.updateGrain(grain._id, {
        verificationStatus: newStatus,
        flaggedForVerification: newFlagged
      });
      if (res.success) {
        onReloadData();
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // FLEXIBLE GRAIN RESTOCK (Requirement 5)
  const handleFlexibleRestock = async (e) => {
    e.preventDefault();
    if (!restockModalGrain) return;
    const qty = parseFloat(restockAmount);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid positive quantity in kg.');
      return;
    }
    setIsRestocking(true);
    try {
      const res = await api.restockGrain(restockModalGrain._id, qty, safeUser?.name || 'Admin Meena');
      if (res.success) {
        alert(`Successfully added +${qty} kg to ${restockModalGrain.name} silo!`);
        setRestockModalGrain(null);
        setRestockAmount('25');
        onReloadData();
        loadFloorData();
      } else {
        alert(res.message || 'Restock failed');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRestocking(false);
    }
  };

  // Quick Restock Silo
  const handleRestockSilo = async (grainId, grainName) => {
    try {
      const res = await api.restockGrain(grainId, 100);
      if (res.success) {
        alert(`Successfully restocked ${grainName} by +100 kg!`);
        onReloadData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // ==========================================
  // 3-DAY RETENTION & ORDER CLASSIFICATION (Section 1 & 6)
  // ==========================================
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const isCompletedOrder = (order) => ['Delivered', 'Completed'].includes(order.orderStatus);
  const getCompletedTimestamp = (order) => {
    if (order.completedAt) return new Date(order.completedAt).getTime();
    if (order.deliveredBy?.deliveredAt) return new Date(order.deliveredBy.deliveredAt).getTime();
    return new Date(order.updatedAt || order.createdAt).getTime();
  };
  const isWithin3DaysOfCompletion = (order) => {
    if (!isCompletedOrder(order)) return false;
    return (now - getCompletedTimestamp(order)) <= THREE_DAYS_MS;
  };
  const getRemainingDaysInActiveQueue = (order) => {
    if (!isWithin3DaysOfCompletion(order)) return 0;
    const diff = THREE_DAYS_MS - (now - getCompletedTimestamp(order));
    return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  };

  // Multi-select order handlers (Section 2)
  const toggleSelectOrder = (orderId) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleSelectAllVisible = (ordersList) => {
    const allIds = ordersList.map(o => o._id);
    const allSelected = allIds.length > 0 && allIds.every(id => selectedOrderIds.has(id));
    if (allSelected) {
      setSelectedOrderIds(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedOrderIds(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const handleExportSelected = () => {
    const selected = allOrders.filter(o => selectedOrderIds.has(o._id));
    if (selected.length === 0) {
      alert('Please select at least one order to export.');
      return;
    }
    exportOrdersToExcel(selected);
  };

  const handleExportAllFiltered = (listToExport) => {
    if (!listToExport || listToExport.length === 0) {
      alert('No orders in the current filtered list to export.');
      return;
    }
    exportOrdersToExcel(listToExport);
  };

  // Operational cost edit/add handlers (Section 10)
  const handleSaveOpCost = async (e) => {
    e.preventDefault();
    if (!editingOpCost) return;
    try {
      const res = await api.updateOperationalCost(editingOpCost.costId, {
        name: editingOpCost.name,
        amount: Number(editingOpCost.amount),
        unit: editingOpCost.unit,
        description: editingOpCost.description,
        category: editingOpCost.category,
        packageSize: editingOpCost.packageSize ? Number(editingOpCost.packageSize) : null
      });
      if (res.success) {
        alert(res.message || 'Operational cost updated');
        setEditingOpCost(null);
        onReloadData();
      } else {
        alert(res.message || 'Error updating cost');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCreateOpCost = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createOperationalCost({
        costId: newOpCostForm.costId.toUpperCase().trim(),
        name: newOpCostForm.name.trim(),
        amount: Number(newOpCostForm.amount),
        unit: newOpCostForm.unit.trim(),
        description: newOpCostForm.description || '',
        category: newOpCostForm.category || 'operational',
        packageSize: newOpCostForm.packageSize ? Number(newOpCostForm.packageSize) : null
      });
      if (res.success) {
        alert('Operational cost parameter added!');
        setNewOpCostModal(false);
        setNewOpCostForm({ costId: '', name: '', amount: '', unit: 'Per kg', category: 'operational', packageSize: '', description: '' });
        onReloadData();
      } else {
        alert(res.message || 'Error creating cost');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="pb-28 max-w-6xl mx-auto px-3.5 md:px-6 pt-4 space-y-6">
      
      {/* ========================================================
          ADMIN TOP HEADER (Brand & Unit Info + Logout)
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl border border-[#C9A227]/40 bg-amber-50/50 dark:bg-[#1b1b1c] flex items-center justify-center flex-shrink-0 shadow-sm">
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
              <span className="text-xs uppercase font-bold text-gray-500 dark:text-[#99907c] font-serif">Admin</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-[9px] uppercase font-bold tracking-caps px-2 py-0.5 rounded-md bg-amber-100 dark:bg-[#262115] border border-[#C9A227]/40 text-[#C9A227]">
                CHAKKI OPERATIONS FLOOR
              </span>
              <span className="text-xs text-gray-500 dark:text-[#99907c] font-serif">
                {metrics.chakkiUnit} • {safeUser?.email || 'admin.meena@arogyabhog.com'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={() => {
              loadFloorData();
              onReloadData();
            }}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#2e2a20] hover:border-[#C9A227] bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-[#d0c5af] hover:text-[#C9A227] transition-all shadow-sm"
            title="Refresh Floor Sensors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="py-1.5 px-3 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all"
            title="Logout Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Network / Data Loading Alert Banner */}
      {loadError && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#C9A227] flex-shrink-0" />
            <span>Operational data sync notice: {loadError}</span>
          </div>
          <button
            onClick={() => loadFloorData()}
            className="px-2.5 py-1 rounded-lg bg-[#C9A227] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#b8911f] transition-all"
          >
            Retry Sync
          </button>
        </div>
      )}

      {isFloorDataLoading && (
        <div className="w-full bg-amber-100 dark:bg-[#201c13] h-1 rounded-full overflow-hidden">
          <div className="bg-[#C9A227] h-1 rounded-full animate-pulse w-3/4"></div>
        </div>
      )}

      {/* ========================================================
          METRICS BAR: Orders Today / Active Milling / Low Silos / Pending Payments
          ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] text-center shadow-sm">
        
        <div className="border-r border-gray-100 dark:border-[#2e2a20] pr-1 py-1">
          <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
            ORDERS TODAY
          </span>
          <div className="flex items-baseline justify-center space-x-1 mt-0.5">
            <span className="font-sans font-bold text-lg md:text-xl text-gray-900 dark:text-[#fdfbf7]">
              {metrics.ordersToday}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">+12%</span>
          </div>
        </div>

        <div className="sm:border-r border-gray-100 dark:border-[#2e2a20] px-1 py-1">
          <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
            ACTIVE MILLING
          </span>
          <div className="flex items-center justify-center space-x-1 mt-0.5">
            <span className="font-sans font-bold text-lg md:text-xl text-[#C9A227]">
              {metrics.activeMillingBags}
            </span>
            <span className="text-[9px] text-gray-500 dark:text-[#8b826f]">bags</span>
          </div>
        </div>

        <div className="border-r border-gray-100 dark:border-[#2e2a20] px-1 py-1">
          <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
            LOW SILOS
          </span>
          <div className="flex items-center justify-center space-x-1 mt-0.5">
            <span className="font-sans font-bold text-lg md:text-xl text-rose-500 dark:text-rose-400">
              {metrics.lowSilosCount}
            </span>
            <span className="text-[9px] text-gray-500 dark:text-[#8b826f]">grains</span>
          </div>
        </div>

        <div className="pl-1 py-1">
          <span className="text-[9px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
            PAYMENT PENDING
          </span>
          <div className="flex items-center justify-center space-x-1 mt-0.5">
            <span className="font-sans font-bold text-lg md:text-xl text-amber-500 dark:text-amber-400 animate-pulse">
              {allOrders.filter(o => o.paymentStatus === 'Pending').length}
            </span>
            <span className="text-[9px] text-gray-500 dark:text-[#8b826f]">orders</span>
          </div>
        </div>

      </div>

      {/* ========================================================
          12 SECTIONS MASTER NAVIGATION BAR
          ======================================================== */}
      <div className="flex items-center overflow-x-auto p-1.5 rounded-2xl bg-gray-100 dark:bg-[#161616] border border-gray-200 dark:border-[#2e2a20] shadow-sm gap-1 scrollbar-none">
        <button
          onClick={() => setActiveAdminTab('orders')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'orders'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>ORDERS</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-mono">
            {allOrders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('export')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'export'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>EXPORT (.XLSX)</span>
          {selectedOrderIds.size > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono">
              {selectedOrderIds.size}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('nutrition')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'nutrition'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-amber-500" />
          <span>NUTRITION MASTER</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-mono">
            {safeGrains.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('recipes')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'recipes'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-500" />
          <span>PRODUCTS & RECIPES</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 font-mono">
            {safeProducts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('costs')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'costs'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>OPERATIONAL COSTS</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('delivery')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'delivery'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>DELIVERY FLEET</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono">
            {deliveryPersons.length}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('reports')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'reports'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
          <span>REPORTS</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('inventory')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'inventory'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>INVENTORY MANAGEMENT</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('website')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'website'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>WEBSITE & CUSTOMER PANEL</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('routing')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'routing'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-amber-500" />
          <span>DELIVERY AREAS (CITIES & PIN CODES)</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-mono">
            {deliveryAreas.zones?.length || 1}
          </span>
        </button>

        <button
          onClick={() => setActiveAdminTab('recovery')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'recovery'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <Key className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>PASSWORD RESET REQUESTS</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('coupons')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'coupons'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>COUPONS & DISCOUNTS</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('articles')}
          className={`flex-shrink-0 py-2.5 px-3 md:px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
            activeAdminTab === 'articles'
              ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#C9A227]/50 shadow-md'
              : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#C9A227]" />
          <span>FOOD KNOWLEDGE (ARTICLES)</span>
        </button>
      </div>

      {/* ========================================================
          MODULE A: ORDER MANAGEMENT (Sections 1 to 6)
          ======================================================== */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* SEARCH & FILTERS BAR (Order ID, Customer Name, Mobile, Date Range, Variant, Payment, Status, Delivery Person) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] space-y-3 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-[#8b826f]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Order ID, Customer, Mobile, PIN..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs md:text-sm text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227] transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Product Variant Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-[#8b826f] font-medium whitespace-nowrap">Variant:</span>
                <select
                  value={variantFilter}
                  onChange={(e) => setVariantFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-semibold text-gray-800 dark:text-[#d0c5af] outline-none focus:border-[#C9A227]"
                >
                  <option value="all">All Variants</option>
                  <option value="Multigrain">Multigrain Atta</option>
                  <option value="Sugar Care">Sugar Care Atta</option>
                  <option value="Digestion">Digestion Atta</option>
                  <option value="Weight Care">Weight Care Atta</option>
                  <option value="High Protein">High Protein Atta</option>
                  <option value="My Choice">My Choice (Custom)</option>
                </select>
              </div>

              {/* Assigned Delivery Person Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-[#8b826f] font-medium whitespace-nowrap">Partner:</span>
                <select
                  value={deliveryPersonFilter}
                  onChange={(e) => setDeliveryPersonFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-semibold text-gray-800 dark:text-[#d0c5af] outline-none focus:border-[#C9A227]"
                >
                  <option value="all">All Delivery Partners</option>
                  {deliveryPersons.map(dp => (
                    <option key={dp._id} value={dp._id}>{dp.name} ({dp.phone})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Date Range & Status Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-gray-100 dark:border-[#2e2a20]">
              {/* From Date */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-[#8b826f] font-medium whitespace-nowrap">From:</span>
                <input
                  type="date"
                  value={fromDateFilter}
                  onChange={(e) => setFromDateFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-800 dark:text-[#d0c5af] outline-none focus:border-[#C9A227]"
                />
              </div>

              {/* To Date */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-[#8b826f] font-medium whitespace-nowrap">To:</span>
                <input
                  type="date"
                  value={toDateFilter}
                  onChange={(e) => setToDateFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-800 dark:text-[#d0c5af] outline-none focus:border-[#C9A227]"
                />
              </div>

              {/* Payment Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-[#8b826f] font-medium whitespace-nowrap">Pay:</span>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-semibold text-gray-800 dark:text-[#d0c5af] outline-none focus:border-[#C9A227]"
                >
                  <option value="all">All Payments</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Paid">Paid / Success</option>
                  <option value="Failed">Failed</option>
                  <option value="REFUND_PENDING">Refund Pending</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              {/* Order Status Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-[#8b826f] font-medium whitespace-nowrap">Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-semibold text-gray-800 dark:text-[#d0c5af] outline-none focus:border-[#C9A227]"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="REFUND_PENDING">Refund Pending</option>
                  <option value="CANCELLED_UNSERVICEABLE">Unserviceable (Cancelled)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Row 3: City, Zone & Delivery Serviceability Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100 dark:border-[#2e2a20]">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-[#8b826f] font-medium whitespace-nowrap">City:</span>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-semibold text-gray-800 dark:text-[#d0c5af] outline-none focus:border-[#C9A227]"
                >
                  <option value="all">All Cities</option>
                  {deliveryAreas.cities?.map(c => (
                    <option key={c._id || c.name} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Kanpur">Kanpur</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-[#8b826f] font-medium whitespace-nowrap">Zone:</span>
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-semibold text-gray-800 dark:text-[#d0c5af] outline-none focus:border-[#C9A227]"
                >
                  <option value="all">All Delivery Zones</option>
                  {deliveryAreas.zones?.map(z => (
                    <option key={z._id || z.code} value={z.name}>{z.name} ({z.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-[#8b826f] font-medium whitespace-nowrap">Area:</span>
                <select
                  value={serviceabilityFilter}
                  onChange={(e) => setServiceabilityFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-semibold text-gray-800 dark:text-[#d0c5af] outline-none focus:border-[#C9A227]"
                >
                  <option value="all">All Service Areas</option>
                  <option value="serviceable">Serviceable Area (Kanpur PINs)</option>
                  <option value="unserviceable">Unserviceable / Refund Orders</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#8b826f] pt-1 border-t border-gray-100 dark:border-[#2e2a20]">
              <span>Showing <strong>{allOrders.length}</strong> matching orders</span>
              {(searchQuery || paymentFilter !== 'all' || orderStatusFilter !== 'all' || fromDateFilter || toDateFilter || variantFilter !== 'all' || deliveryPersonFilter !== 'all' || serviceabilityFilter !== 'all' || cityFilter !== 'all' || zoneFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPaymentFilter('all');
                    setOrderStatusFilter('all');
                    setFromDateFilter('');
                    setToDateFilter('');
                    setVariantFilter('all');
                    setDeliveryPersonFilter('all');
                    setCityFilter('all');
                    setZoneFilter('all');
                    setServiceabilityFilter('all');
                  }}
                  className="text-xs text-[#C9A227] hover:underline font-semibold"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>

          {/* QUEUE REGISTRY WITH SUB-TABS (Sections 1 to 6) */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3 gap-2">
              <div>
                <h3 className="font-editorial text-base md:text-lg font-bold text-gray-900 dark:text-[#fdfbf7]">
                  Order Dispatch & Queue Management
                </h3>
                <p className="text-xs text-gray-500 dark:text-[#8b826f]">
                  Active orders queue (with 3-day retention rule for completed dispatches), historical archives & slip printing
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40">
                  {allOrders.filter(o => o.paymentStatus === 'Pending').length} Pending Payment
                </span>
              </div>
            </div>

            {/* SEVEN SUB-TABS (Sections 1-6 Architecture) */}
            {(() => {
              const ongoingOrders = allOrders.filter(o => 
                ['Pending', 'Accepted', 'Confirmed', 'Processing', 'Shipped'].includes(o.orderStatus || 'Pending')
              );
              const recentlyCompletedOrders = allOrders.filter(o => isCompletedOrder(o) && isWithin3DaysOfCompletion(o));
              const archivedOrders = allOrders.filter(o => isCompletedOrder(o) && !isWithin3DaysOfCompletion(o));
              const activeQueueOrders = [...ongoingOrders, ...recentlyCompletedOrders];
              const pendingPaymentOrders = allOrders.filter(o => o.paymentStatus === 'Pending');
              const processingOrders = allOrders.filter(o => o.orderStatus === 'Processing');
              const shippedOrders = allOrders.filter(o => o.orderStatus === 'Shipped');
              const cancelledOrders = allOrders.filter(o => o.orderStatus === 'Cancelled');
              const refundOrders = allOrders.filter(o => 
                o.orderStatus === 'REFUND_PENDING' || 
                o.refundStatus === 'PENDING' || 
                o.paymentStatus === 'REFUND_PENDING' ||
                o.orderStatus === 'CANCELLED_UNSERVICEABLE'
              );

              let currentList = activeQueueOrders;
              if (ordersSubTab === 'active') currentList = activeQueueOrders;
              else if (ordersSubTab === 'pending_payment') currentList = pendingPaymentOrders;
              else if (ordersSubTab === 'processing') currentList = processingOrders;
              else if (ordersSubTab === 'shipped') currentList = shippedOrders;
              else if (ordersSubTab === 'recently_completed') currentList = recentlyCompletedOrders;
              else if (ordersSubTab === 'archived') currentList = archivedOrders.length > 0 ? archivedOrders : allOrders.filter(isCompletedOrder);
              else if (ordersSubTab === 'refunds') currentList = refundOrders;
              else if (ordersSubTab === 'cancelled') currentList = cancelledOrders;

              const isAllVisibleSelected = currentList.length > 0 && currentList.every(o => selectedOrderIds.has(o._id));

              return (
                <div className="space-y-3.5">
                  {/* SUB-TABS SELECTOR */}
                  <div className="flex items-center overflow-x-auto p-1 rounded-xl bg-gray-100 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-xs font-bold gap-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('active')}
                      className={`flex-shrink-0 py-2 px-3 rounded-lg uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                        ordersSubTab === 'active'
                          ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] shadow-sm border border-gray-200 dark:border-[#C9A227]/40 text-[#C9A227]'
                          : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>ACTIVE QUEUE (3-DAY)</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-mono">
                        {activeQueueOrders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('pending_payment')}
                      className={`flex-shrink-0 py-2 px-3 rounded-lg uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                        ordersSubTab === 'pending_payment'
                          ? 'bg-white dark:bg-[#25221b] text-amber-700 dark:text-amber-400 shadow-sm border border-gray-200 dark:border-amber-500/40'
                          : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
                      }`}
                    >
                      <span>PENDING PAYMENT</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-mono">
                        {pendingPaymentOrders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('processing')}
                      className={`flex-shrink-0 py-2 px-3 rounded-lg uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                        ordersSubTab === 'processing'
                          ? 'bg-white dark:bg-[#25221b] text-gray-900 dark:text-[#fdfbf7] shadow-sm border border-gray-200 dark:border-[#C9A227]/40 text-[#C9A227]'
                          : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>PROCESSING / MILLING</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-mono">
                        {processingOrders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('shipped')}
                      className={`flex-shrink-0 py-2 px-3 rounded-lg uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                        ordersSubTab === 'shipped'
                          ? 'bg-white dark:bg-[#25221b] text-sky-600 dark:text-sky-400 shadow-sm border border-gray-200 dark:border-sky-500/40'
                          : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>OUT FOR DELIVERY</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-mono">
                        {shippedOrders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('recently_completed')}
                      className={`flex-shrink-0 py-2 px-3 rounded-lg uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                        ordersSubTab === 'recently_completed'
                          ? 'bg-white dark:bg-[#25221b] text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200 dark:border-emerald-500/40'
                          : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>RECENTLY COMPLETED (≤3D)</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono">
                        {recentlyCompletedOrders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('archived')}
                      className={`flex-shrink-0 py-2 px-3 rounded-lg uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                        ordersSubTab === 'archived'
                          ? 'bg-white dark:bg-[#25221b] text-purple-600 dark:text-purple-400 shadow-sm border border-gray-200 dark:border-purple-500/40'
                          : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>ARCHIVED / HISTORY</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 font-mono">
                        {archivedOrders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('refunds')}
                      className={`flex-shrink-0 py-2 px-3 rounded-lg uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                        ordersSubTab === 'refunds'
                          ? 'bg-white dark:bg-[#25221b] text-amber-700 dark:text-amber-400 shadow-sm border border-gray-200 dark:border-amber-500/40'
                          : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>REFUNDS PENDING</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-mono font-bold">
                        {refundOrders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrdersSubTab('cancelled')}
                      className={`flex-shrink-0 py-2 px-3 rounded-lg uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                        ordersSubTab === 'cancelled'
                          ? 'bg-white dark:bg-[#25221b] text-rose-600 dark:text-rose-400 shadow-sm border border-gray-200 dark:border-rose-500/40'
                          : 'text-gray-500 dark:text-[#8b826f] hover:text-gray-900 dark:hover:text-[#fdfbf7]'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>CANCELLED</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-mono">
                        {cancelledOrders.length}
                      </span>
                    </button>
                  </div>

                  {/* BATCH ACTION & MULTI-SELECT BAR (Section 2 & 7) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-[#2e2a20] gap-3">
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => handleSelectAllVisible(currentList)}
                        className="flex items-center space-x-1.5 text-xs font-semibold text-gray-700 dark:text-[#d0c5af] hover:text-[#C9A227]"
                      >
                        {isAllVisibleSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#C9A227]" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                        <span>{isAllVisibleSelected ? 'Deselect Visible' : 'Select All Visible'}</span>
                      </button>

                      <span className="text-xs text-gray-400 dark:text-[#8b826f]">|</span>

                      <span className="text-xs font-mono font-bold text-gray-900 dark:text-[#fdfbf7]">
                        {selectedOrderIds.size} <span className="font-normal text-gray-500 dark:text-[#8b826f]">selected</span>
                      </span>

                      {selectedOrderIds.size > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedOrderIds(new Set())}
                          className="text-[11px] text-gray-500 hover:text-rose-500 underline"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {selectedOrderIds.size > 0 && (
                        <button
                          type="button"
                          onClick={handleDeleteSelectedOrders}
                          className="py-1.5 px-3 rounded-xl border border-rose-300 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm"
                          title="Permanently delete all selected orders"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Selected ({selectedOrderIds.size})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleExportSelected}
                        disabled={selectedOrderIds.size === 0}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm"
                        title="Export selected orders to formatted Excel (.xlsx)"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Export Selected (.xlsx)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportAllFiltered(currentList)}
                        disabled={currentList.length === 0}
                        className="py-1.5 px-3 rounded-xl border border-emerald-600 dark:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all"
                        title="Export all orders currently displayed in this queue"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export All Visible ({currentList.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* 3-DAY RETENTION & ARCHIVE BANNER */}
                  {ordersSubTab === 'active' && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-[#C9A227] flex-shrink-0" />
                        <span>
                          <strong>3-Day Active Queue Rule:</strong> Completed orders remain visible in active operations for 72 hours before automatic archival.
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono font-semibold">
                        {recentlyCompletedOrders.length} completed orders in 3-day retention
                      </span>
                    </div>
                  )}

                  {ordersSubTab === 'archived' && (
                    <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-300 dark:border-purple-500/30 text-xs text-purple-900 dark:text-purple-300 flex items-center space-x-2">
                      <Database className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span>
                        <strong>Permanent Historical Archive:</strong> All historical orders are permanently preserved with immutable original recipes, cost breakdowns, and 16-nutrient snapshots.
                      </span>
                    </div>
                  )}

                  {/* Orders Cards Listing */}
                  <div className="space-y-3">
                    {currentList.length === 0 ? (
                      <div className="text-center py-10 text-xs text-gray-500 dark:text-[#8b826f] space-y-2">
                        <Package className="w-8 h-8 mx-auto text-gray-400 dark:text-[#8b826f]/40" />
                        <p>No orders found matching your search or filters.</p>
                      </div>
                    ) : (
                      currentList.map((order) => {
                        const isPendingPay = order.paymentStatus === 'Pending';
                        const isPaid = order.paymentStatus === 'Paid' || order.paymentStatus === 'Success';
                        const firstItem = order.items && order.items[0];
                        const isCustom = firstItem?.isCustom;
                        const itemsSummary = order.items?.map(it => `${it.name} (${it.batchSizeKg} kg)`).join(', ') || 'Atta Batch';
                        const isCompleted = isCompletedOrder(order);
                        const isSelected = selectedOrderIds.has(order._id);
                        const remainingDays = getRemainingDaysInActiveQueue(order);

                        return (
                          <div
                            key={order._id}
                            className={`p-3.5 md:p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                              isSelected
                                ? 'border-[#C9A227] bg-amber-50/30 dark:bg-[#201a11]'
                                : isPendingPay && ordersSubTab === 'ongoing'
                                ? 'border-amber-300 dark:border-amber-500/70 bg-amber-50/40 dark:bg-[#211a12]' 
                                : isCompleted
                                ? 'border-emerald-200 dark:border-emerald-950/70 bg-emerald-50/20 dark:bg-[#121c15]'
                                : 'border-gray-200 dark:border-[#2e2a20] bg-gray-50/50 dark:bg-[#141414] hover:border-[#C9A227]/60'
                            }`}
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Checkbox for multi-select */}
                                <button
                                  type="button"
                                  onClick={() => toggleSelectOrder(order._id)}
                                  className="text-gray-400 hover:text-[#C9A227] mr-1"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-[#C9A227]" />
                                  ) : (
                                    <Square className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>

                                <span className="font-mono font-bold text-xs md:text-sm text-gray-900 dark:text-[#fdfbf7]">
                                  {order.orderNumber}
                                </span>

                                {/* PAYMENT BADGE */}
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                                  isPendingPay 
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-500/50' 
                                    : isPaid 
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-500/50' 
                                    : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-500/50'
                                }`}>
                                  Pay: {order.paymentStatus}
                                </span>

                                {/* ORDER STATUS BADGE */}
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                                  order.orderStatus === 'Delivered'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-500/50'
                                    : order.orderStatus === 'Cancelled'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-500/50'
                                    : 'bg-gray-200 dark:bg-[#25221b] text-gray-800 dark:text-[#f2ca50] border-gray-300 dark:border-[#C9A227]/40'
                                }`}>
                                  {order.orderStatus || 'Pending'}
                                </span>

                                {isCustom && (
                                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-[#2b2416] text-[#C9A227] border border-[#C9A227]/30">
                                    ★ Custom Blend
                                  </span>
                                )}

                                {/* 3-Day Retention Countdown Badge */}
                                {isCompleted && isWithin3DaysOfCompletion(order) && (
                                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center space-x-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>Day {remainingDays} of 3 in active queue</span>
                                  </span>
                                )}

                                {isCompleted && !isWithin3DaysOfCompletion(order) && (
                                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 flex items-center space-x-1">
                                    <Database className="w-2.5 h-2.5" />
                                    <span>Archived (Preserved in DB)</span>
                                  </span>
                                )}

                                <span className="text-xs text-gray-500 dark:text-[#8b826f] ml-auto font-mono flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-[#C9A227]" />
                                  <span>
                                    {new Date(order.placedAt || order.createdAt || Date.now()).toLocaleString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </span>
                                </span>
                              </div>

                              {/* Customer Info & Contact */}
                              <div className="text-xs text-gray-700 dark:text-[#d0c5af] flex flex-wrap items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-[#fdfbf7]">{order.customerName}</span>
                                <span>•</span>
                                <a 
                                  href={`tel:${order.customerContact || order.customerPhone}`}
                                  className="text-[#C9A227] font-mono font-bold flex items-center space-x-1 hover:underline"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{order.customerContact || order.customerPhone}</span>
                                </a>
                                <span>•</span>
                                <span className="text-gray-500 dark:text-[#8b826f]">
                                  {itemsSummary}
                                </span>
                              </div>

                              {/* Delivery Address with PIN Code */}
                              <div className="text-[11px] text-gray-600 dark:text-[#99907c] flex flex-wrap items-center gap-1.5">
                                <span>📍 {order.customerAddress || 'Address not specified'}</span>
                                {order.pinCode && <span className="font-mono font-semibold text-gray-800 dark:text-[#d0c5af]">(PIN: {order.pinCode})</span>}
                              </div>

                              {/* Specific Attribution Details */}
                              {isCompleted ? (
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600 dark:text-[#99907c] pt-0.5">
                                  <span>Total: <strong className="text-gray-900 dark:text-[#fdfbf7] font-mono">₹{order.totalAmount}</strong></span>
                                  <span>•</span>
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Completed: <strong className="text-gray-800 dark:text-[#d0c5af]">{new Date(order.completedAt || order.deliveredBy?.deliveredAt || order.updatedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center space-x-1">
                                    <Truck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Partner: <strong className="text-emerald-700 dark:text-emerald-300">{order.deliveredBy?.name ? `${order.deliveredBy.name} (${order.deliveredBy.phone || 'N/A'})` : (order.assignedDeliveryPersonName ? `${order.assignedDeliveryPersonName} (${order.assignedDeliveryPersonPhone || 'N/A'})` : 'Auto-Allocated')}</strong></span>
                                  </span>
                                  <span>•</span>
                                  <span className="text-[10px] bg-gray-100 dark:bg-[#1e1e1e] px-2 py-0.5 rounded border border-gray-200 dark:border-[#2e2a20]">
                                    {order.paymentConfirmedBy?.role ? (
                                      <span>Payment verified by <strong className="text-[#C9A227]">{order.paymentConfirmedBy.role === 'Admin' ? 'Admin' : 'Delivery Partner'} ({order.paymentConfirmedBy.name})</strong></span>
                                    ) : isPaid ? (
                                      <span>Payment: <strong className="text-emerald-600">Paid</strong></span>
                                    ) : (
                                      <span>Payment: <strong>{order.paymentStatus}</strong></span>
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-[#8b826f] pt-0.5">
                                  <span>Total: <strong className="text-gray-900 dark:text-[#fdfbf7] font-mono">₹{order.totalAmount}</strong></span>
                                  <span>•</span>
                                  <span>Slot: <strong className="text-gray-700 dark:text-[#d0c5af]">{order.deliverySlot}</strong></span>
                                  {order.expectedDeliveryDate && (
                                    <>
                                      <span>•</span>
                                      <span>Expected: <strong className="text-[#C9A227]">{new Date(order.expectedDeliveryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</strong></span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span className="flex items-center space-x-1">
                                    <Truck className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                                    <span>Partner: <strong className="text-sky-700 dark:text-sky-300">{order.assignedDeliveryPersonName ? `${order.assignedDeliveryPersonName} (${order.assignedDeliveryPersonPhone})` : 'Auto-Allocated'}</strong></span>
                                  </span>

                                  {/* Quick inline reassignment select */}
                                  <select
                                    value={order.assignedDeliveryPerson || ''}
                                    onChange={(e) => handleReassignDelivery(order._id, e.target.value)}
                                    className="py-0.5 px-2 rounded-lg bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2e2a20] text-[10px] font-semibold text-gray-800 dark:text-[#d0c5af] outline-none"
                                  >
                                    <option value="">Reassign Partner...</option>
                                    {deliveryPersons.map(dp => (
                                      <option key={dp._id} value={dp._id}>{dp.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>

                            {/* Action buttons (3 Slips + Excel + Full Details) */}
                            <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200 dark:border-[#2e2a20]">
                              {isPendingPay && !isCompleted && (
                                <button
                                  onClick={() => handleUpdatePayment(order._id, 'Paid')}
                                  className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1 transition-all shadow-sm"
                                  title="Verify and approve UPI payment"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>Approve Paid</span>
                                </button>
                              )}

                              {/* Refund Action Button if Refund Pending */}
                              {(order.orderStatus === 'REFUND_PENDING' || order.refundStatus === 'PENDING' || order.paymentStatus === 'REFUND_PENDING') && (
                                <button
                                  onClick={() => handleOpenRefundModal(order)}
                                  className="py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1 transition-all shadow-sm"
                                  title="Record and complete customer refund"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Record Refund</span>
                                </button>
                              )}

                              {/* Single Order Excel Export Button */}
                              <button
                                onClick={() => exportOrdersToExcel([order])}
                                className="p-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-emerald-500 bg-white dark:bg-[#1c1c1c] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all shadow-sm"
                                title="Export this single order to Excel (.xlsx)"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </button>

                              {/* WhatsApp Order Confirmation & Chat */}
                              <button
                                type="button"
                                onClick={() => setWhatsAppModalOrder(order)}
                                className="py-1.5 px-2.5 rounded-xl border border-emerald-500/60 hover:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center space-x-1 transition-all shadow-sm group"
                                title="Send WhatsApp order confirmation & chat"
                              >
                                <MessageCircle className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400" />
                                <span>WhatsApp</span>
                              </button>

                              {/* Full Details Modal Button */}
                              <button
                                onClick={() => setSelectedOrderDetail(order)}
                                className="py-1.5 px-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-[#C9A227] bg-white dark:bg-[#1c1c1c] text-xs font-semibold text-gray-800 dark:text-[#d0c5af] hover:text-[#C9A227] flex items-center space-x-1 transition-all shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>

                              {/* Cancel Order Action */}
                              {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'CANCELLED_UNSERVICEABLE' && order.orderStatus !== 'REFUNDED' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(order._id, order.orderNumber)}
                                  className="py-1.5 px-2.5 rounded-xl border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center space-x-1 transition-all shadow-sm"
                                  title="Cancel order and release reserved stock"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Cancel</span>
                                </button>
                              )}

                              {/* Permanent Delete Action */}
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order._id, order.orderNumber)}
                                className="p-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-rose-500 hover:text-rose-500 text-gray-400 dark:text-[#8b826f] bg-white dark:bg-[#1c1c1c] transition-all shadow-sm"
                                title="Permanently delete order"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* REAL-TIME MILLING FLOOR QUEUE SECTION */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-2.5">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-[#C9A227]" />
                <div>
                  <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7]">
                    MILLING & DISPATCH FLOOR QUEUE
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                    Real-time Stone Grinding Floor Batches
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-caps px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-[#2e2a20] bg-gray-100 dark:bg-[#141414] text-[#C9A227]">
                Queue: {queueOrders.length}
              </span>
            </div>

            <div className="space-y-3">
              {queueOrders.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 dark:text-[#8b826f]">
                  Floor is clear. No active milling queue batches.
                </div>
              ) : (
                queueOrders.map((order) => {
                  const firstItem = order.items && order.items[0];

                  return (
                    <div 
                      key={order._id}
                      className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm text-gray-900 dark:text-[#fdfbf7]">
                              {order.orderNumber}
                            </span>
                            {order.express && (
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-[#25221b] border border-[#C9A227]/40 text-[#C9A227]">
                                Express 2h
                              </span>
                            )}
                          </div>
                          <h4 className="font-editorial text-sm font-semibold text-gray-900 dark:text-[#fdfbf7] mt-1">
                            {firstItem ? firstItem.name : 'Multigrain Atta Blend'}
                          </h4>
                          <p className="text-[11px] text-gray-500 dark:text-[#8b826f]">
                            Customer: <span className="text-gray-700 dark:text-[#d0c5af] font-medium">{order.customerName}</span> • 
                            <span className="text-[#C9A227] font-mono ml-1 font-bold">📞 {order.customerContact || order.customerPhone}</span>
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-[#8b826f] flex items-center space-x-1 mt-0.5 font-mono">
                            <Clock className="w-3 h-3 text-[#C9A227]" />
                            <span>Placed: </span>
                            <span className="text-gray-800 dark:text-[#d0c5af] font-semibold">
                              {new Date(order.placedAt || order.createdAt || Date.now()).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-[#251b14] px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          <span>{order.millingStatus}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-white dark:bg-[#1b1b1b] border border-gray-200 dark:border-[#2e2a20] text-center text-[10px]">
                        <div className={order.currentStep >= 1 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-[#8b826f]'}>
                          <span>1. GRAIN MIX</span>
                          <div className="flex items-center justify-center space-x-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${order.currentStep >= 1 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-[#4d4635]'}`}></span>
                            <span className="text-[9px] text-gray-500 dark:text-[#99907c]">Completed</span>
                          </div>
                        </div>

                        <div className={order.currentStep === 2 ? 'text-[#C9A227] font-semibold' : order.currentStep > 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-[#8b826f]'}>
                          <span>2. STONE MILLING</span>
                          <div className="flex items-center justify-center space-x-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${order.currentStep >= 2 ? 'bg-[#C9A227]' : 'bg-gray-300 dark:bg-[#4d4635]'}`}></span>
                            <span className="text-[9px] text-gray-500 dark:text-[#99907c]">{order.chakkiUnit || 'Chakki #2'}</span>
                          </div>
                        </div>

                        <div className={order.currentStep >= 3 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-[#8b826f]'}>
                          <span>3. PACKING & SHIP</span>
                          <div className="flex items-center justify-center space-x-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${order.currentStep >= 3 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-[#4d4635]'}`}></span>
                            <span className="text-[9px] text-gray-500 dark:text-[#99907c]">{order.assignedDP || 'DP-3'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleAdvanceOrderStatus(order._id)}
                          className="flex-1 py-2 rounded-xl bg-amber-50 dark:bg-[#25221b] border border-[#C9A227]/60 hover:bg-[#C9A227] hover:text-white dark:hover:text-[#121212] text-[#C9A227] text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Advance Milling Status</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrderDetail(order)}
                          className="py-2 px-3 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-[#C9A227] bg-white dark:bg-[#1c1c1c] text-xs font-bold text-gray-800 dark:text-[#d0c5af] hover:text-[#C9A227] flex items-center space-x-1.5 transition-all shadow-sm"
                          title="View complete order details, customer specs & ingredients"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWhatsAppModalOrder(order)}
                          className="py-2 px-2.5 rounded-xl border border-emerald-500/60 hover:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center space-x-1 transition-all shadow-sm"
                          title="Send WhatsApp confirmation to customer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => exportOrdersToExcel([order])}
                            className="p-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-emerald-500 text-gray-600 dark:text-[#99907c] hover:text-emerald-500 transition-all"
                            title="Export this order to Excel (.xlsx)"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>

                          {order.orderStatus !== 'Cancelled' && order.orderStatus !== 'CANCELLED_UNSERVICEABLE' && order.orderStatus !== 'REFUNDED' && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order._id, order.orderNumber)}
                              className="p-2 rounded-xl border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 transition-all shadow-sm"
                              title="Cancel order and release reserved stock"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order._id, order.orderNumber)}
                            className="p-2 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-rose-500 hover:text-rose-500 text-gray-400 dark:text-[#8b826f] transition-all shadow-sm"
                            title="Permanently delete order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          SECTION 7: EXPORT ORDERS CENTER (.XLSX)
          ======================================================== */}
      {activeAdminTab === 'export' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-editorial text-base md:text-lg font-bold text-gray-900 dark:text-[#fdfbf7]">
                    Excel Data Export Center (.xlsx)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#8b826f]">
                    Generate compliant spreadsheets with all 28 required columns including customer details, variants, financials & delivery data
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  {selectedOrderIds.size} of {allOrders.length} Selected
                </span>
              </div>
            </div>

            {/* Quick Export Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] gap-3">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleSelectAllVisible(allOrders)}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-gray-700 dark:text-[#d0c5af] hover:text-[#C9A227]"
                >
                  {allOrders.length > 0 && allOrders.every(o => selectedOrderIds.has(o._id)) ? (
                    <CheckSquare className="w-4 h-4 text-[#C9A227]" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                  <span>Select All ({allOrders.length})</span>
                </button>

                {selectedOrderIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedOrderIds(new Set())}
                    className="text-xs text-gray-500 hover:text-rose-500 underline"
                  >
                    Deselect All
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {selectedOrderIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedOrders}
                    className="py-2 px-3 rounded-xl border border-rose-300 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm"
                    title="Permanently delete all selected orders"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Selected ({selectedOrderIds.size})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportSelected}
                  disabled={selectedOrderIds.size === 0}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Selected ({selectedOrderIds.size}) .xlsx</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportAllFiltered(allOrders)}
                  disabled={allOrders.length === 0}
                  className="py-2 px-4 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download All Orders ({allOrders.length}) .xlsx</span>
                </button>
              </div>
            </div>

            {/* Orders Selection Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2e2a20]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-[#1a1a1a] text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] border-b border-gray-200 dark:border-[#2e2a20]">
                    <th className="py-2.5 px-3 text-center w-10">Select</th>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Variant</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Delivery Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#2e2a20]">
                  {allOrders.map((o) => {
                    const isSelected = selectedOrderIds.has(o._id);
                    return (
                      <tr 
                        key={o._id}
                        className={`hover:bg-gray-50 dark:hover:bg-[#141414] transition-colors ${
                          isSelected ? 'bg-amber-50/20 dark:bg-[#1a160f]' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOrder(o._id)}
                            className="text-gray-400 hover:text-[#C9A227]"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#C9A227]" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-900 dark:text-[#fdfbf7]">
                          {o.orderNumber}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 dark:text-[#8b826f] font-mono text-[11px]">
                          {new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-gray-900 dark:text-[#fdfbf7] block">{o.customerName}</span>
                          <span className="text-[11px] text-gray-500 dark:text-[#8b826f] font-mono">{o.customerContact || o.customerPhone}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-700 dark:text-[#d0c5af]">
                          {o.items?.[0]?.name || 'Atta Blend'} ({o.items?.[0]?.batchSizeKg || 5}kg)
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#C9A227]">
                          ₹{o.totalAmount}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            o.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                          }`}>
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] font-semibold text-gray-800 dark:text-[#d0c5af]">
                            {o.orderStatus}
                          </span>
                          {o.assignedDeliveryPersonName && (
                            <span className="text-[10px] text-gray-500 dark:text-[#8b826f] block">
                              ({o.assignedDeliveryPersonName})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setWhatsAppModalOrder(o)}
                              className="p-1 rounded-lg border border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
                              title="Send WhatsApp confirmation & chat"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedOrderDetail(o)}
                              className="p-1 rounded-lg border border-gray-300 dark:border-[#2e2a20] hover:border-[#C9A227] text-gray-700 dark:text-[#d0c5af] hover:text-[#C9A227]"
                              title="View order details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => exportOrdersToExcel([o])}
                              className="py-1 px-2.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] hover:border-emerald-500 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase flex items-center space-x-1"
                              title="Export single order to Excel"
                            >
                              <Download className="w-3 h-3" />
                              <span>Export</span>
                            </button>
                            {o.orderStatus !== 'Cancelled' && o.orderStatus !== 'CANCELLED_UNSERVICEABLE' && o.orderStatus !== 'REFUNDED' && (
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(o._id, o.orderNumber)}
                                className="p-1 rounded-lg border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                                title="Cancel order and release reserved stock"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(o._id, o.orderNumber)}
                              className="p-1 rounded-lg border border-gray-300 dark:border-[#2e2a20] hover:border-rose-500 hover:text-rose-500 text-gray-400 dark:text-[#8b826f]"
                              title="Permanently delete order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 28-COLUMN EXCEL SPECIFICATION GUIDE */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227] block">
                28 COMPLIANT EXCEL COLUMNS INCLUDED IN ArogyaBhog_Orders_YYYY-MM-DD.xlsx
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-[10px] font-mono text-gray-700 dark:text-[#d0c5af]">
                {EXCEL_ORDER_COLUMNS.map((col, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20] truncate">
                    <span className="text-gray-400 font-bold mr-1">{idx + 1}.</span>
                    <span>{col.header}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 8: NUTRITION DATABASE (18 INGREDIENTS • 16 NUTRIENTS)
          ======================================================== */}
      {activeAdminTab === 'nutrition' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-editorial text-base md:text-lg font-bold text-gray-900 dark:text-[#fdfbf7]">
                    Master Ingredient Nutrition Database (16 Nutrients)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#8b826f]">
                    Values per 100g serving. Unmeasured nutrients render as &ldquo;—&rdquo; (never fabricated 0). Verification badges ensure scientific accuracy.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                  {safeGrains.filter(g => g.verificationStatus === 'User Verified').length} User Verified
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300">
                  {safeGrains.filter(g => g.verificationStatus === 'Reference Estimate').length} Reference
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300">
                  {safeGrains.filter(g => g.verificationStatus === 'Pending Lab Test' || g.flaggedForVerification).length} Lab Flagged
                </span>
              </div>
            </div>

            {/* Master Table of 18 Ingredients */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2e2a20]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-[#1a1a1a] text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] border-b border-gray-200 dark:border-[#2e2a20]">
                    <th className="py-2.5 px-3 sticky left-0 bg-gray-100 dark:bg-[#1a1a1a] z-10">Ingredient</th>
                    <th className="py-2.5 px-2 text-center">Category</th>
                    <th className="py-2.5 px-2 text-center">Energy (kcal)</th>
                    <th className="py-2.5 px-2 text-center">Protein (g)</th>
                    <th className="py-2.5 px-2 text-center">Carbs (g)</th>
                    <th className="py-2.5 px-2 text-center">Sugars (g)</th>
                    <th className="py-2.5 px-2 text-center">Added Sugars</th>
                    <th className="py-2.5 px-2 text-center">Fat (g)</th>
                    <th className="py-2.5 px-2 text-center">Sat Fat (g)</th>
                    <th className="py-2.5 px-2 text-center">Trans Fat</th>
                    <th className="py-2.5 px-2 text-center">Fibre (g)</th>
                    <th className="py-2.5 px-2 text-center">Sodium (mg)</th>
                    <th className="py-2.5 px-2 text-center">Zinc (mg)</th>
                    <th className="py-2.5 px-2 text-center">Mg (mg)</th>
                    <th className="py-2.5 px-2 text-center">P (mg)</th>
                    <th className="py-2.5 px-2 text-center">Iron (mg)</th>
                    <th className="py-2.5 px-2 text-center">Calcium (mg)</th>
                    <th className="py-2.5 px-2 text-center">K (mg)</th>
                    <th className="py-2.5 px-2 text-center">Verification</th>
                    <th className="py-2.5 px-3 text-right sticky right-0 bg-gray-100 dark:bg-[#1a1a1a] z-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#2e2a20]">
                  {safeGrains.map((g) => {
                    const nut = g.nutrition || {};
                    const formatVal = (v) => (v === null || v === undefined || v === '' ? '—' : v);

                    return (
                      <tr key={g._id} className="hover:bg-gray-50 dark:hover:bg-[#141414] transition-colors">
                        <td className="py-2.5 px-3 sticky left-0 bg-white dark:bg-[#181818] z-10">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-[10px] text-[#C9A227] px-1 py-0.5 rounded bg-amber-50 dark:bg-[#201a12] border border-[#C9A227]/30">
                              {g.ingredientId || g.code}
                            </span>
                            <div>
                              <span className="font-bold text-gray-900 dark:text-[#fdfbf7] block">{g.name}</span>
                              {g.reviewFlag && (
                                <span className="text-[9px] text-[#C9A227] font-semibold block">
                                  ★ {g.reviewFlag}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-gray-500 dark:text-[#8b826f] text-[11px] whitespace-nowrap">
                          {g.category || 'Base Grain'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono font-semibold text-gray-800 dark:text-[#d0c5af]">{formatVal(nut.energyKcal)}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatVal(nut.proteinG)}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-800 dark:text-[#d0c5af]">{formatVal(nut.carbsG)}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-500">{formatVal(nut.sugarsG)}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-400">{formatVal(nut.addedSugarsG)}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-800 dark:text-[#d0c5af]">{formatVal(nut.fatG)}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-500">{formatVal(nut.saturatedFatG)}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-400">{formatVal(nut.transFatG)}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-[#C9A227]">{formatVal(nut.fibreG)}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-600 dark:text-[#99907c]">{formatVal(nut.sodiumMg)}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-600 dark:text-[#99907c]">{formatVal(nut.zincMg)}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-600 dark:text-[#99907c]">{formatVal(nut.magnesiumMg)}</td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-600 dark:text-[#99907c]">{formatVal(nut.phosphorusMg)}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-600 dark:text-rose-400">{formatVal(nut.ironMg)}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-[#C9A227]">
                          {g.name.toLowerCase().includes('ragi') ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300">
                              {formatVal(nut.calciumMg)}
                            </span>
                          ) : (
                            formatVal(nut.calciumMg)
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-gray-600 dark:text-[#99907c]">{formatVal(nut.potassiumMg)}</td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                            g.verificationStatus === 'User Verified'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400'
                              : g.verificationStatus === 'Pending Lab Test' || g.flaggedForVerification
                              ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-400'
                          }`}>
                            {g.verificationStatus || 'Reference'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right sticky right-0 bg-white dark:bg-[#181818] z-10 whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={() => handleToggleLabFlag(g)}
                              className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                                g.flaggedForVerification || g.verificationStatus === 'Pending Lab Test'
                                  ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                  : 'border-gray-200 dark:border-[#2e2a20] text-gray-500 hover:text-blue-600'
                              }`}
                              title="Toggle Pending Lab Test Flag"
                            >
                              Flag Lab
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenGrainProfileEditor(g)}
                              className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] hover:border-[#C9A227] text-gray-600 dark:text-[#d0c5af] hover:text-[#C9A227]"
                              title="Edit Full 16-Nutrient Profile"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 9: PRODUCTS & RECIPES (FORMULAS & SKU CREATOR)
          ======================================================== */}
      {activeAdminTab === 'recipes' && (
        <div className="space-y-6 animate-fadeIn">
          {/* PRODUCT CATALOGUE & ATTA PRICING */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="border-b border-gray-100 dark:border-[#2e2a20] pb-2">
              <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7]">
                PREDEFINED BLENDS & ATTA FORMULATIONS
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                Live 100% recipe formulations, pricing, and stone chakki grinding configurations
              </p>
            </div>

            <div className="space-y-2">
              {safeProducts.map((p) => (
                <div 
                  key={p._id}
                  className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Product Photo Thumbnail with 1-click change trigger */}
                    <div 
                      onClick={() => handleOpenPhotoChangeModal(p)}
                      className="w-13 h-13 md:w-14 md:h-14 rounded-xl bg-amber-50/50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] flex-shrink-0 relative overflow-hidden cursor-pointer group/photo flex items-center justify-center p-1 shadow-xs"
                      title="Click to change product photo"
                    >
                      <img 
                        src={p.imageUrl || '/arogyaBhog_logo.png'} 
                        alt={p.name}
                        className="w-full h-full object-cover rounded-lg group-hover/photo:scale-105 transition-transform"
                        onError={(e) => { e.currentTarget.src = "/arogyaBhog_logo.png"; }}
                      />
                      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="font-editorial text-sm font-semibold text-gray-900 dark:text-[#fdfbf7] truncate">
                          {p.name}
                        </h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-[#C9A227] border border-[#C9A227]/30">
                          {p.badge}
                        </span>
                      </div>
                      {p.grains && (p.grains.length > 0 || (p.safeGrains && p.safeGrains.length > 0)) && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {(p.grains || p.safeGrains || []).map((g, gIdx) => (
                            <span key={gIdx} className="text-[9px] px-2 py-0.5 rounded bg-white dark:bg-[#1f1a14] border border-gray-200 dark:border-[#C9A227]/30 text-gray-700 dark:text-[#d0c5af]">
                              {g.name}: <strong className="text-[#C9A227]">{g.percentage}%</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 md:space-x-2.5 flex-shrink-0 flex-wrap gap-y-2">
                    <div className="text-right mr-1">
                      <span className="text-[10px] text-gray-500 dark:text-[#8b826f] block">
                        MRP: ₹{p.mrpPrice}/kg
                      </span>
                      <span className="font-sans font-bold text-xs text-[#C9A227]">
                        Selling: ₹{p.sellingPrice}/kg
                      </span>
                    </div>

                    {/* Change Photo Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPhotoChangeModal(p)}
                      className="py-1.5 px-2.5 rounded-lg border border-purple-300 dark:border-purple-900/60 hover:border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 text-xs text-purple-700 dark:text-purple-300 font-semibold flex items-center space-x-1 transition-all"
                      title="Change Product Photo / Image"
                    >
                      <Camera className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Photo</span>
                    </button>

                    {/* Active / Disabled Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleProductActive(p._id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        p.isActive !== false
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                      title={p.isActive !== false ? 'Click to disable product' : 'Click to activate product'}
                    >
                      {p.isActive !== false ? 'Active' : 'Disabled'}
                    </button>

                    <button
                      onClick={() => handleOpenRecipeEditor(p)}
                      className="py-1.5 px-2.5 rounded-lg border border-[#C9A227]/60 hover:border-[#C9A227] bg-[#C9A227]/10 text-xs text-[#C9A227] font-semibold flex items-center space-x-1 transition-all"
                      title="Edit Recipe 100% Formulation & Weight Distribution"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Recipe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenProductEditModal(p)}
                      className="py-1.5 px-2.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] hover:border-[#C9A227] text-xs text-gray-700 dark:text-[#d0c5af] hover:text-[#C9A227] font-semibold flex items-center space-x-1"
                      title="Edit Product Details, MRP, Pack Sizes & Image"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p)}
                      className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-400 hover:text-rose-500 hover:border-rose-300 transition-all"
                      title="Safely delete or archive product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD B2: ADD SPECIALIZED FLOUR SKU */}
          <form onSubmit={handlePublishSKU} className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-md border border-[#C9A227] flex items-center justify-center text-[#C9A227]">
                  <Plus className="w-3 h-3" />
                </div>
                <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7]">
                  ADD SPECIALIZED FLOUR SKU
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-caps px-2 py-0.5 rounded-md bg-amber-50 dark:bg-[#25221b] border border-[#C9A227]/40 text-[#C9A227]">
                SKU Creator
              </span>
            </div>

            {publishSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{publishSuccessMsg}</span>
              </div>
            )}

            {/* Product Imagery & Packaging Upload */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                Product Imagery & Packaging Mockup
              </label>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#131313] border border-dashed border-gray-300 dark:border-[#4d4635] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] flex items-center justify-center relative flex-shrink-0 overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Packaging" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Layers className="w-6 h-6 text-[#C9A227] mx-auto" />
                        <span className="text-[8px] text-[#C9A227] block mt-0.5 font-bold">5 KG</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-mono text-gray-800 dark:text-[#d0c5af]">
                        {imageFile ? imageFile.name : 'specialized_blend_bag.jpg'}
                      </span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300">
                        Ready
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-[#8b826f] mt-0.5">
                      Recommended: High-res packaging bag photo (JPG/PNG).
                    </p>
                  </div>
                </div>

                <label className="cursor-pointer py-1.5 px-3 rounded-xl border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#1c1c1c] hover:border-[#C9A227] text-xs text-[#C9A227] font-semibold flex items-center space-x-1 transition-all shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Flour / Product Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                Flour / Product Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-sm text-gray-900 dark:text-[#fdfbf7] font-editorial outline-none"
                placeholder="e.g. Hyper-Thyroid & Metabolism Support Atta"
                required
              />
            </div>

            {/* Target Health Benefit Keynote */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                Target Health Benefit Keynote
              </label>
              <input
                type="text"
                value={formData.benefitKeynote}
                onChange={(e) => setFormData({ ...formData, benefitKeynote: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none"
                placeholder="e.g. Supports Thyroid health, Selenium & Zinc rich, Zero gluten spikes"
              />
            </div>

            {/* Custom Chakki Formulation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                  Custom Chakki Formulation (100% Ratio)
                </label>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                  formulationTotal === 100
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-400 dark:bg-emerald-950/20'
                    : 'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-500/40 dark:text-amber-400 dark:bg-amber-950/20'
                }`}>
                  <Check className="w-3 h-3 inline" />
                  <span>{formulationTotal === 100 ? 'Balanced 100%' : `${formulationTotal}% Ratio`}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20]">
                {(formData.safeGrains || formData.grains || []).map((g, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20] shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#C9A227]"></span>
                    <span className="text-xs text-gray-800 dark:text-[#e5e2e1] font-medium">{g.name}:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={g.percentage}
                      onChange={(e) => handleGrainRatioChange(idx, e.target.value)}
                      className="w-10 bg-transparent text-xs text-[#C9A227] font-bold text-center border-b border-gray-300 dark:border-[#4d4635] outline-none"
                    />
                    <span className="text-xs text-[#C9A227] font-bold">%</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGrainFromSku(idx)}
                      className="text-gray-400 hover:text-rose-500 pl-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddGrainToSku}
                  className="px-2.5 py-1 rounded-lg border border-dashed border-gray-300 dark:border-[#4d4635] text-[10px] text-[#C9A227] hover:border-[#C9A227] transition-all flex items-center space-x-1 font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Grain</span>
                </button>
              </div>
            </div>

            {/* MRP & Selling Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                  MRP Price (5kg)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-500">₹</span>
                  <input
                    type="number"
                    value={formData.mrpPrice}
                    onChange={(e) => setFormData({ ...formData, mrpPrice: Number(e.target.value) })}
                    className="w-full p-2.5 pl-7 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-sm text-gray-900 dark:text-[#fdfbf7] font-bold outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                    Selling Price (5kg)
                  </label>
                  {discountPercent > 0 && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      -{discountPercent}% OFF
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-[#C9A227]">₹</span>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 pl-7 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-sm text-[#C9A227] font-bold outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* App Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                App Description & Dietary Roti Notes
              </label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-xs text-gray-800 dark:text-[#d0c5af] leading-relaxed outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isPublishing}
              className="w-full py-3.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-sans font-bold text-xs uppercase tracking-caps flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{isPublishing ? 'PUBLISHING TO CATALOGUE...' : 'PUBLISH PRODUCT TO APP STORE'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          SECTION 10: OPERATIONAL COSTS & LIVE PROFITABILITY SIMULATOR
          ======================================================== */}
      {activeAdminTab === 'costs' && (
        <div className="space-y-6 animate-fadeIn">
          {/* OPERATIONAL RATES & SERVICES (OP MASTER) */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-2.5 gap-2">
              <div>
                <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7]">
                  OPERATIONAL COSTS & SERVICE CHARGES (OP-001 TO OP-008)
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                  Itemized operational parameters applied dynamically to cold-milling, laminated packaging, labour & logistics
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setNewOpCostModal(true)}
                  className="py-1.5 px-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider flex items-center space-x-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Parameter</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(safeOpCosts && safeOpCosts.length > 0 ? safeOpCosts : [
                { costId: 'OP-001', name: 'Milling & Roasting Cost', amount: 4, unit: 'Per kg', description: 'Slow-stone chakki milling, grain cleaning, and roasting charge' },
                { costId: 'OP-002', name: '3-Layer Laminated Pouch', amount: 5, unit: 'Per 5 kg of packaging', description: 'Aroma-lock 3-layer food-grade moisture barrier pouch' },
                { costId: 'OP-003', name: 'Delivery Cost', amount: 50, unit: 'Per delivery packet', description: 'Same-day cold-chain doorstep delivery per parcel' }
              ]).map((op) => (
                <div key={op.costId} className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#C9A227] px-1.5 py-0.5 rounded bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2e2a20]">
                        {op.costId}
                      </span>
                      <span className="font-bold text-base text-gray-900 dark:text-[#fdfbf7]">
                        ₹{op.amount}
                      </span>
                    </div>
                    <h4 className="font-sans font-bold text-xs text-gray-900 dark:text-[#fdfbf7] mt-2">
                      {op.name}
                    </h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                      {op.unit}
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-[#8b826f] mt-1 leading-relaxed">
                      {op.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingOpCost(op)}
                    className="w-full py-1.5 px-3 rounded-lg border border-gray-300 dark:border-[#2e2a20] hover:border-[#C9A227] text-xs text-[#C9A227] font-semibold flex items-center justify-center space-x-1 transition-all bg-white dark:bg-[#181818]"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Modify Rate</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* LIVE PROFITABILITY SIMULATOR */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-4 md:p-5 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-2.5 gap-2">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-[#C9A227]" />
                <div>
                  <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7]">
                    LIVE PRODUCTION & MARGIN PROFITABILITY SIMULATOR
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                    Simulate production cost, gross profit, and net contribution across 1kg, 5kg & 10kg batches in real-time
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-caps px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-[#C9A227] border border-[#C9A227]/40">
                Formula Audited
              </span>
            </div>

            {/* Simulator Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Package Size</label>
                <div className="flex space-x-1">
                  {[1, 5, 10].map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setCostSimPackSize(sz)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                        costSimPackSize === sz
                          ? 'bg-[#C9A227] text-white dark:text-[#121212] shadow-sm'
                          : 'bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af]'
                      }`}
                    >
                      {sz} kg
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Raw Grain Cost (₹ / kg)</label>
                <input
                  type="number"
                  value={costSimRawRate}
                  onChange={(e) => setCostSimRawRate(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2e2a20] text-xs font-mono font-bold text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Selling Price (₹ / kg)</label>
                <input
                  type="number"
                  value={costSimSellingPrice}
                  onChange={(e) => setCostSimSellingPrice(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#2e2a20] text-xs font-mono font-bold text-[#C9A227] outline-none"
                />
              </div>
            </div>

            {/* Simulator Output Calculations */}
            {(() => {
              const packSize = costSimPackSize;
              const rawCost = Math.round(costSimRawRate * packSize);
              const packagingCost = packSize === 1 ? 3 : packSize === 10 ? 8 : 5;
              const millingCost = Math.round(4 * packSize);
              const labourCost = Math.round(2.5 * packSize);
              const electricityCost = Math.round(1.75 * packSize);
              const wastageCost = Math.round(rawCost * 0.02);
              const deliveryCost = 50;
              const totalSelling = Math.round(costSimSellingPrice * packSize);
              const gatewayCost = Math.round(totalSelling * 0.018);
              const totalProductionCost = rawCost + packagingCost + millingCost + labourCost + electricityCost + wastageCost;
              const costPerKg = (totalProductionCost / packSize).toFixed(1);
              const totalOrderCost = totalProductionCost + deliveryCost + gatewayCost;
              const grossProfit = totalSelling - rawCost;
              const netContribution = totalSelling - totalOrderCost;
              const marginPercent = totalSelling > 0 ? ((netContribution / totalSelling) * 100).toFixed(1) : 0;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Raw Cost</span>
                      <strong className="text-gray-900 dark:text-[#fdfbf7] font-mono text-sm">₹{rawCost}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Pouch (OP-002)</span>
                      <strong className="text-[#C9A227] font-mono text-sm">₹{packagingCost}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Milling (₹4/kg)</span>
                      <strong className="text-[#C9A227] font-mono text-sm">₹{millingCost}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Labour & Wear</span>
                      <strong className="text-[#C9A227] font-mono text-sm">₹{labourCost + electricityCost}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Wastage (2%)</span>
                      <strong className="text-amber-600 font-mono text-sm">₹{wastageCost}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 uppercase block font-bold">Delivery (OP-003)</span>
                      <strong className="text-sky-600 font-mono text-sm">₹{deliveryCost}</strong>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/40">
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block">Production Cost</span>
                      <span className="text-lg font-bold font-mono text-gray-900 dark:text-[#fdfbf7]">₹{totalProductionCost}</span>
                      <span className="text-[10px] text-gray-500 block">₹{costPerKg}/kg</span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/40">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">Gross Profit</span>
                      <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">₹{grossProfit}</span>
                      <span className="text-[10px] text-gray-500 block">Revenue ₹{totalSelling}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-300 dark:border-purple-500/40">
                      <span className="text-[10px] text-purple-700 dark:text-purple-400 uppercase font-bold block">Net Contribution</span>
                      <span className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">₹{netContribution}</span>
                      <span className="text-[10px] text-gray-500 block">After delivery & gateway</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#C9A227]/10 border border-[#C9A227]">
                      <span className="text-[10px] text-[#C9A227] uppercase font-bold block">Profit Margin %</span>
                      <span className="text-xl font-bold font-mono text-[#C9A227]">{marginPercent}%</span>
                      <span className="text-[10px] text-gray-500 block">Live Net Return</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 12: REPORTS & ANALYTICS
          ======================================================== */}
      {activeAdminTab === 'reports' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-editorial text-base md:text-lg font-bold text-gray-900 dark:text-[#fdfbf7]">
                    Operational & Financial Reports
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#8b826f]">
                    Live sales revenue, production volumes, gross margins, and delivery partner dispatch performance
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExportAllFiltered(allOrders)}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Master Report (.xlsx)</span>
              </button>
            </div>

            {/* KPI Metrics Grid */}
            {(() => {
              const paidOrders = allOrders.filter(o => o.paymentStatus === 'Paid' || o.paymentStatus === 'Success');
              const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
              const completedOrders = allOrders.filter(isCompletedOrder);
              const totalMilledKg = allOrders.reduce((acc, o) => {
                const orderKg = o.items?.reduce((iAcc, item) => iAcc + ((item.batchSizeKg || 5) * (item.quantity || 1)), 0) || 0;
                return acc + orderKg;
              }, 0);
              const aov = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/40">
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block">Paid Revenue</span>
                      <span className="text-xl md:text-2xl font-bold font-mono text-gray-900 dark:text-[#fdfbf7]">₹{totalRevenue.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-gray-500 block">{paidOrders.length} Paid Dispatches</span>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/40">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold block">Delivered Orders</span>
                      <span className="text-xl md:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{completedOrders.length}</span>
                      <span className="text-[10px] text-gray-500 block">{allOrders.length} Total Orders</span>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-500/40">
                      <span className="text-[10px] text-blue-700 dark:text-blue-400 uppercase font-bold block">Total Volume Milled</span>
                      <span className="text-xl md:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{totalMilledKg} kg</span>
                      <span className="text-[10px] text-gray-500 block">Stone Chakki Cold-Ground</span>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-300 dark:border-purple-500/40">
                      <span className="text-[10px] text-purple-700 dark:text-purple-400 uppercase font-bold block">Average Order Value</span>
                      <span className="text-xl md:text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">₹{aov}</span>
                      <span className="text-[10px] text-gray-500 block">Per Order Invoiced</span>
                    </div>
                  </div>

                  {/* Delivery Fleet Performance Leaderboard */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-3">
                    <span className="text-xs uppercase font-bold tracking-caps text-gray-900 dark:text-[#fdfbf7] block">
                      DELIVERY PARTNER DISPATCH LEADERBOARD
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {deliveryPersons.map(dp => {
                        const dpDelivered = allOrders.filter(o => o.assignedDeliveryPerson?.toString() === dp._id.toString() && isCompletedOrder(o)).length;
                        const dpActive = allOrders.filter(o => o.assignedDeliveryPerson?.toString() === dp._id.toString() && !isCompletedOrder(o) && o.orderStatus !== 'Cancelled').length;

                        return (
                          <div key={dp._id} className="p-3 rounded-lg bg-white dark:bg-[#1b1b1b] border border-gray-200 dark:border-[#2e2a20] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-gray-900 dark:text-[#fdfbf7]">{dp.name}</span>
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                                {dp.isAvailable ? 'On Duty' : 'On Break'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#8b826f] font-mono">
                              <span>Delivered: <strong className="text-emerald-600">{dpDelivered}</strong></span>
                              <span>Active: <strong className="text-sky-600">{dpActive}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================
          MODULE B: INVENTORY MANAGEMENT (CHAKKI SILOS & RAW GRAINS)
          ======================================================== */}
      {activeAdminTab === 'inventory' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* ========================================================
              CARD B0: FINISHED GOODS ATTA INVENTORY (REQUIREMENTS 4 & 5)
              ======================================================== */}
          {(() => {
            const displayInventory = inventorySummary.length > 0 
              ? inventorySummary 
              : safeProducts.map(p => ({
                  _id: p._id,
                  name: p.name,
                  badge: p.badge,
                  sellingPrice: p.sellingPrice,
                  stockOnHand: p.stockOnHand != null ? p.stockOnHand : 100,
                  stockReserved: p.stockReserved != null ? p.stockReserved : 0,
                  stockAvailable: Math.max(0, (p.stockOnHand != null ? p.stockOnHand : 100) - (p.stockReserved != null ? p.stockReserved : 0)),
                  lowStockThreshold: p.lowStockThreshold || 25,
                  isLowStock: ((p.stockOnHand != null ? p.stockOnHand : 100) - (p.stockReserved != null ? p.stockReserved : 0)) <= (p.lowStockThreshold || 25),
                  isOutOfStock: ((p.stockOnHand != null ? p.stockOnHand : 100) - (p.stockReserved != null ? p.stockReserved : 0)) <= 0,
                  packStock5kg: { onHand: p.packStock5kgOnHand || 0, reserved: 0 },
                  packStock10kg: { onHand: p.packStock10kgOnHand || 0, reserved: 0 },
                  isActive: p.isActive !== false
                }));

            const totalOnHand = displayInventory.reduce((acc, i) => acc + (Number(i.stockOnHand) || 0), 0);
            const totalReserved = displayInventory.reduce((acc, i) => acc + (Number(i.stockReserved) || 0), 0);
            const totalAvailable = Math.max(0, totalOnHand - totalReserved);
            const lowStockCount = displayInventory.filter(i => i.isLowStock || i.isOutOfStock).length;

            return (
              <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3 gap-2">
                  <div>
                    <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                      <Package className="w-4 h-4 text-[#C9A227]" />
                      <span>FINISHED GOODS ATTA INVENTORY</span>
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                      Packaged Atta stock on-hand, customer reservations & live sellable capacity
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenStockAdjustModal(safeProducts[0] || null)}
                    className="py-1.5 px-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider flex items-center space-x-1 shadow-sm self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Production / Stock Adjustment</span>
                  </button>
                </div>

                {/* 4 Summary Metric Badges */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-gray-200 dark:border-[#2e2a20] bg-gray-50/70 dark:bg-[#141414]">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Total On-Hand Stock</span>
                    <strong className="text-lg font-mono font-bold text-gray-900 dark:text-[#fdfbf7]">{totalOnHand.toFixed(1)} kg</strong>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Physical warehouse bags</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-950/60 bg-amber-50/40 dark:bg-[#1f1911]">
                    <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">Reserved for Orders</span>
                    <strong className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">{totalReserved.toFixed(1)} kg</strong>
                    <span className="text-[10px] text-amber-600/70 dark:text-amber-400/60 block mt-0.5">Active confirmed orders</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/40 dark:bg-[#111a14]">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Available to Sell</span>
                    <strong className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">{totalAvailable.toFixed(1)} kg</strong>
                    <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 block mt-0.5">On-Hand minus Reserved</span>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${lowStockCount > 0 ? 'border-rose-200 dark:border-rose-950/60 bg-rose-50/40 dark:bg-[#201214]' : 'border-gray-200 dark:border-[#2e2a20] bg-gray-50/70 dark:bg-[#141414]'}`}>
                    <span className={`text-[10px] uppercase font-bold block ${lowStockCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-gray-500'}`}>Low / Zero Stock SKUs</span>
                    <strong className={`text-lg font-mono font-bold ${lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-[#fdfbf7]'}`}>{lowStockCount} SKUs</strong>
                    <span className="text-[10px] text-gray-400 block mt-0.5">Below reorder threshold</span>
                  </div>
                </div>

                {/* Finished Goods Products Table */}
                <div className="overflow-x-auto border border-gray-200 dark:border-[#2e2a20] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-[#2e2a20] bg-gray-100/60 dark:bg-[#171717] text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f]">
                        <th className="py-2.5 px-3">Product SKU</th>
                        <th className="py-2.5 px-3 text-right">Physical On-Hand</th>
                        <th className="py-2.5 px-3 text-right">Reserved</th>
                        <th className="py-2.5 px-3 text-right">Available to Sell</th>
                        <th className="py-2.5 px-3 text-center">Pack Units</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#242424]">
                      {displayInventory.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a] transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2.5">
                              <div 
                                onClick={() => {
                                  const matchedProd = safeProducts.find(p => p._id === item._id || p.name === item.name) || item;
                                  handleOpenPhotoChangeModal(matchedProd);
                                }}
                                className="w-10 h-10 rounded-lg bg-amber-50/50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] flex-shrink-0 relative overflow-hidden cursor-pointer group/invphoto flex items-center justify-center p-0.5"
                                title="Click to change product photo"
                              >
                                <img 
                                  src={item.imageUrl || (safeProducts.find(p => p._id === item._id)?.imageUrl) || '/arogyaBhog_logo.png'} 
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-md group-hover/invphoto:scale-105 transition-transform"
                                  onError={(e) => { e.currentTarget.src = "/arogyaBhog_logo.png"; }}
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/invphoto:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                  <Camera className="w-3 h-3 text-white" />
                                </div>
                              </div>
                              <div>
                                <strong className="font-editorial text-xs md:text-sm text-gray-900 dark:text-[#fdfbf7] block">
                                  {item.name}
                                </strong>
                                <span className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                                  {item.badge || 'Atta SKU'} • ₹{item.sellingPrice}/kg
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-gray-900 dark:text-[#fdfbf7]">
                            {item.stockOnHand} kg
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                            {item.stockReserved} kg
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            <span className={item.stockAvailable <= 0 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : item.stockAvailable <= (item.lowStockThreshold || 25) ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              {item.stockAvailable} kg
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-[11px] font-mono text-gray-600 dark:text-[#99907c]">
                            5kg: {item.packStock5kg?.onHand || 0} | 10kg: {item.packStock10kg?.onHand || 0}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.stockAvailable <= 0
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : item.isLowStock
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {item.stockAvailable <= 0 ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                const matchedProd = safeProducts.find(p => p._id === item._id || p.name === item.name) || item;
                                handleOpenStockAdjustModal(matchedProd);
                              }}
                              className="py-1 px-2.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] hover:border-[#C9A227] text-[11px] font-bold text-[#C9A227] hover:bg-amber-50 dark:hover:bg-[#201b13] transition-all"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ========================================================
              CARD B0.1: FINISHED GOODS STOCK MOVEMENT LEDGER (AUDIT LOGS)
              ======================================================== */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-2.5">
              <div>
                <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                  <Database className="w-4 h-4 text-sky-500" />
                  <span>FINISHED GOODS STOCK MOVEMENT LEDGER (AUDIT TRAIL)</span>
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                  Immutable ledger tracking batch production, customer reservations, releases & dispatch deductions
                </p>
              </div>

              <span className="text-[10px] font-mono text-gray-500">
                {inventoryLogs.length} recent transactions
              </span>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-[#2e2a20] rounded-xl max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-gray-100 dark:bg-[#1b1b1b] z-10">
                  <tr className="border-b border-gray-200 dark:border-[#2e2a20] text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f]">
                    <th className="py-2 px-3">Date & Time</th>
                    <th className="py-2 px-3">Product</th>
                    <th className="py-2 px-3">Movement Type</th>
                    <th className="py-2 px-3 text-right">Change (kg)</th>
                    <th className="py-2 px-3 text-right">Balance Available</th>
                    <th className="py-2 px-3">Reference / Order</th>
                    <th className="py-2 px-3">Reason & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#242424]">
                  {inventoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-6 text-center text-gray-400 text-xs">
                        No finished goods inventory movements recorded yet. Movements will automatically log here on orders and adjustments.
                      </td>
                    </tr>
                  ) : (
                    inventoryLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a] transition-colors">
                        <td className="py-2 px-3 font-mono text-[10px] text-gray-500 dark:text-[#8b826f]">
                          {new Date(log.createdAt || Date.now()).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-2 px-3 font-semibold text-gray-900 dark:text-[#fdfbf7]">
                          {log.productName || 'Atta Product'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            log.movementType === 'PRODUCTION' || log.movementType === 'PURCHASE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : log.movementType === 'RESERVATION'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : log.movementType === 'RESERVATION_RELEASE' || log.movementType === 'RETURN'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : log.movementType === 'DISPATCH_DEDUCTION'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {log.movementType}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${log.quantityKg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {log.quantityKg > 0 ? `+${log.quantityKg}` : log.quantityKg} kg
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 dark:text-[#fdfbf7]">
                          {log.resultingStockAvailable != null ? `${log.resultingStockAvailable} kg` : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono text-[10px] text-gray-600 dark:text-[#99907c]">
                          {log.referenceNumber || log.orderId ? `#${log.referenceNumber || log.orderId.slice(-6)}` : 'Manual'}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-gray-500 dark:text-[#8b826f]">
                          {log.reason || log.notes || 'Routine inventory update'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD B1: RAW GRAINS & MILLING SILOS */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-2.5">
              <div className="flex items-center space-x-2">
                <PackageCheck className="w-4 h-4 text-[#C9A227]" />
                <div>
                  <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7]">
                    RAW GRAINS & MILLING SILOS
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                    Grain level sensors & raw material inventory for recipe stone-milling
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const name = prompt('Enter new grain name:');
                  const code = prompt('Enter 2-letter grain code:');
                  const price = prompt('Enter price per kg:');
                  if (name && code && price) {
                    api.createGrain({
                      name,
                      code: code.toUpperCase(),
                      pricePerKg: Number(price),
                      inStockKg: 100,
                      capacityKg: 200,
                      lowStockThresholdKg: 25
                    }).then(() => onReloadData());
                  }
                }}
                className="text-xs uppercase font-bold text-[#C9A227] hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Silo</span>
              </button>
            </div>

            {/* Silos Grid */}
            <div className="space-y-2.5">
              {safeGrains.map((grain) => {
                const fillPct = Math.min(100, Math.round((grain.inStockKg / (grain.capacityKg || 200)) * 100));
                const isLowStock = grain.inStockKg <= (grain.lowStockThresholdKg || 40);
                const isPendingPrice = grain.priceStatus === 'pending_configuration' || grain.pricePerKg == null;

                return (
                  <div
                    key={grain._id}
                    className={`p-3 rounded-xl border transition-all ${
                      isPendingPrice
                        ? 'border-amber-300 bg-amber-50/40 dark:border-amber-700/50 dark:bg-[#1e1713]'
                        : isLowStock 
                        ? 'border-amber-400 bg-amber-50/50 dark:border-amber-600/60 dark:bg-[#1e1713]' 
                        : 'border-gray-200 dark:border-[#2e2a20] bg-gray-50/60 dark:bg-[#141414]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg border border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#1a1a1a] flex items-center justify-center font-bold text-xs text-[#C9A227] font-mono shadow-sm flex-shrink-0">
                          {grain.ingredientId || grain.code || grain.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-sans font-bold text-xs md:text-sm text-gray-900 dark:text-[#fdfbf7]">
                              {grain.name}
                            </h4>
                            <span className="text-[10px] text-gray-500 dark:text-[#8b826f] font-medium">
                              • {grain.category}
                            </span>
                            {isLowStock && (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] mt-0.5">
                            <span className="font-bold text-gray-900 dark:text-[#fdfbf7]">{grain.inStockKg} kg</span>
                            <span>•</span>
                            {isPendingPrice ? (
                              <span className="text-amber-700 dark:text-amber-400 font-bold text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-600/40">
                                ⚠️ Price Pending Configuration
                              </span>
                            ) : isLowStock ? (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold text-[10px]">
                                Low Stock Warning
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>In Stock</span>
                              </span>
                            )}
                            <span>•</span>
                            <span className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                              {grain.nutrition?.isConfigured ? 'Nutrition: Configured' : 'Nutrition: Lab Ref Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <div className="text-right">
                          {isPendingPrice ? (
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block font-mono">
                              Rate Pending
                            </span>
                          ) : (
                            <span className="font-sans font-bold text-xs text-[#C9A227] block">
                              ₹{grain.pricePerKg}/kg
                            </span>
                          )}
                          {grain.priceUpdatedAt ? (
                            <span className="text-[9px] text-gray-400 dark:text-[#8b826f] font-mono block">
                              Updated {new Date(grain.priceUpdatedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-400 dark:text-[#8b826f] font-mono block">
                              Master Rate
                            </span>
                          )}
                        </div>

                        {/* Edit Price button */}
                        <button
                          onClick={() => {
                            const newPrice = prompt(`Update price for "${grain.name}" [${grain.ingredientId || grain.code}] (₹ per kg):`, grain.pricePerKg || '');
                            if (newPrice && !isNaN(newPrice) && Number(newPrice) > 0) {
                              api.updateGrain(grain._id, { pricePerKg: Number(newPrice), priceStatus: 'configured' }).then(() => {
                                onReloadData();
                                loadFloorData();
                              });
                            }
                          }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isPendingPrice
                              ? 'border-amber-400 text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300'
                              : 'border-gray-300 dark:border-[#2e2a20] text-gray-500 dark:text-[#99907c] hover:text-[#C9A227] hover:border-[#C9A227]'
                          }`}
                          title={isPendingPrice ? "Set Price to activate ingredient" : "Edit Price per kg"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Full Master Profile & Nutrition Editor button */}
                        <button
                          onClick={() => handleOpenGrainProfileEditor(grain)}
                          className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 dark:text-[#99907c] hover:text-[#C9A227] hover:border-[#C9A227] transition-all"
                          title="Edit Master Profile, Silo Capacity & Nutrition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Flexible Restock button */}
                        <button
                          onClick={() => {
                            setRestockModalGrain(grain);
                            setRestockAmount('25');
                          }}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center space-x-1 ${
                            isLowStock
                              ? 'bg-amber-500 hover:bg-amber-400 text-white dark:text-[#121212]'
                              : 'bg-white dark:bg-[#1a1a1a] border border-[#C9A227]/60 text-[#C9A227] hover:bg-[#C9A227] hover:text-white dark:hover:text-[#121212]'
                          }`}
                          title="Restock any decimal kg amount"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-[#202020] h-1.5 rounded-full mt-2.5 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODULE C: DELIVERY FLEET MANAGEMENT (Requirement 7)
          ======================================================== */}
      {activeAdminTab === 'delivery' && (
        <div className="space-y-6 animate-fadeIn">

          {/* CARD C1: ONBOARD NEW DELIVERY FLEET AGENT */}
          <form onSubmit={handleCreateDeliveryPerson} className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-md border border-sky-500 flex items-center justify-center text-sky-600">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7]">
                  ONBOARD NEW DELIVERY PARTNER
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-caps px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/40 border border-sky-400/40 text-sky-700 dark:text-sky-300">
                Fleet Management
              </span>
            </div>

            {dpSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{dpSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newDpForm.name}
                  onChange={(e) => setNewDpForm({ ...newDpForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                  10-Digit Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="e.g. 9876543210"
                  value={newDpForm.phone}
                  onChange={(e) => setNewDpForm({ ...newDpForm, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-xs font-mono text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                  Login Email / Username
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. delivery.ramesh@arogyabhog.com"
                  value={newDpForm.email}
                  onChange={(e) => setNewDpForm({ ...newDpForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters (e.g. Delivery@2026!)"
                  value={newDpForm.password}
                  onChange={(e) => setNewDpForm({ ...newDpForm, password: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              {/* Address Field (Requirement 6) */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                  Delivery Operating Zone / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector 54, Golf Course Road, Gurugram"
                  value={newDpForm.address}
                  onChange={(e) => setNewDpForm({ ...newDpForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-gray-700 dark:text-[#d0c5af]">
                <input
                  type="checkbox"
                  checked={newDpForm.isAvailable}
                  onChange={(e) => setNewDpForm({ ...newDpForm, isAvailable: e.target.checked })}
                  className="rounded text-[#C9A227] focus:ring-0"
                />
                <span>Set as Available on Duty immediately</span>
              </label>

              <button
                type="submit"
                disabled={isCreatingDp}
                className="py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{isCreatingDp ? 'Adding Partner...' : 'Add Delivery Partner'}</span>
              </button>
            </div>
          </form>

          {/* CARD C2: ACTIVE DELIVERY FLEET ROSTER */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-2.5">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-sky-600" />
                <div>
                  <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7]">
                    ACTIVE FLEET ROSTER & DISPATCH STATUS
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                    Fair dispatch allocation balances orders among active, available delivery partners
                  </p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-caps px-2.5 py-0.5 rounded-full border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                {deliveryPersons.length} Partners
              </span>
            </div>

            <div className="space-y-3">
              {deliveryPersons.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-500 dark:text-[#8b826f]">
                  No delivery personnel registered yet. Use the onboarding form above to add partners.
                </div>
              ) : (
                deliveryPersons.map((dp) => {
                  const activeAssignedCount = allOrders.filter(
                    o => o.assignedDeliveryPerson?.toString() === dp._id.toString() && 
                    o.orderStatus !== 'Delivered' && 
                    o.orderStatus !== 'Cancelled'
                  ).length;

                  return (
                    <div
                      key={dp._id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        dp.isActive 
                          ? 'border-gray-200 dark:border-[#2e2a20] bg-gray-50/60 dark:bg-[#141414]' 
                          : 'border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-[#1f1414] opacity-75'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-sans font-bold text-sm text-gray-900 dark:text-[#fdfbf7]">
                            {dp.name}
                          </h4>
                          
                          {/* Active / Inactive Badge */}
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                            dp.isActive 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400' 
                              : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-400'
                          }`}>
                            {dp.isActive ? 'Active' : 'Deactivated'}
                          </span>

                          {/* Duty Status Badge */}
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                            dp.isAvailable 
                              ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300' 
                              : 'bg-gray-200 text-gray-700 border-gray-300 dark:bg-[#25221b] dark:text-[#8b826f]'
                          }`}>
                            {dp.isAvailable ? '● On Duty' : '○ On Break'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-[#99907c]">
                          <span className="font-mono text-[#C9A227] font-semibold flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{dp.phone}</span>
                          </span>
                          <span>•</span>
                          <span>{dp.email}</span>
                          {dp.address && (
                            <>
                              <span>•</span>
                              <span className="text-gray-500 dark:text-[#8b826f]">📍 {dp.address}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-semibold text-gray-800 dark:text-[#d0c5af]">
                            Ongoing: <strong className="text-sky-600 dark:text-sky-400 font-mono">{dp.ongoingDeliveriesCount ?? activeAssignedCount}</strong>
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-gray-800 dark:text-[#d0c5af]">
                            Completed: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{dp.completedDeliveriesCount ?? 0}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Controls (Requirement 6) */}
                      <div className="flex items-center space-x-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200 dark:border-[#2e2a20]">
                        {/* Edit Partner Profile */}
                        <button
                          onClick={() => setEditingDp({ ...dp })}
                          className="py-1.5 px-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-sky-400 bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-[#d0c5af] hover:text-sky-600 text-xs font-semibold flex items-center space-x-1 transition-all shadow-sm"
                          title="Edit Partner Profile"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setResetPasswordDp(dp);
                            setNewPasswordInput('');
                          }}
                          className="py-1.5 px-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-amber-400 bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-[#d0c5af] hover:text-amber-600 text-xs font-semibold flex items-center space-x-1 transition-all shadow-sm"
                          title="Reset Password"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Password</span>
                        </button>

                        {/* Toggle Availability */}
                        <button
                          onClick={() => handleToggleDpAvailability(dp)}
                          className={`py-1.5 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${
                            dp.isAvailable
                              ? 'border-gray-300 dark:border-[#2e2a20] bg-white dark:bg-[#1c1c1c] text-gray-700 dark:text-[#d0c5af] hover:border-amber-400'
                              : 'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                          }`}
                        >
                          {dp.isAvailable ? 'Set On Break' : 'Set On Duty'}
                        </button>

                        {/* Toggle Active / Deactivate */}
                        <button
                          onClick={() => handleToggleDpActive(dp)}
                          className={`py-1.5 px-3 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all ${
                            dp.isActive
                              ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                              : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {dp.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================
          WEBSITE & CUSTOMER PANEL MANAGEMENT (Requirement 1)
          Full admin control over public banners, announcements, fineness,
          package sizes, product catalog active toggles, and custom blend grains.
          ======================================================== */}
      {activeAdminTab === 'website' && (
        <div className="space-y-6 animate-fadeIn">
          {/* CARD 1: BANNERS, ANNOUNCEMENTS & NOTICES */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3 gap-2">
              <div>
                <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C9A227]" />
                  <span>CUSTOMER BANNERS & ANNOUNCEMENTS</span>
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                  Control public header announcement pills, promotional hero notices, and storage instructions
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveSiteContent}
                disabled={isSavingSiteContent}
                className="py-2 px-4 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md self-start sm:self-auto"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingSiteContent ? 'Saving...' : 'Save Website Content'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Announcement Banner */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-[#d0c5af]">
                    Top Announcement Pill Text
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-[#C9A227] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteContentData?.announcementEnabled !== false}
                      onChange={(e) => handleUpdateSiteContentField('announcementEnabled', e.target.checked)}
                      className="rounded accent-[#C9A227]"
                    />
                    <span className="font-semibold text-[11px]">Enabled</span>
                  </label>
                </div>
                <textarea
                  rows="2"
                  value={siteContentData?.announcementText || ''}
                  onChange={(e) => handleUpdateSiteContentField('announcementText', e.target.value)}
                  placeholder="e.g. 🌾 Cold Stone-Milled Fresh Every Morning • Zero Preservatives • 100% Pure Grains"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              {/* Promotional Hero Banner */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-[#d0c5af]">
                    Promotional Hero Banner Text
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-[#C9A227] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteContentData?.bannerEnabled !== false}
                      onChange={(e) => handleUpdateSiteContentField('bannerEnabled', e.target.checked)}
                      className="rounded accent-[#C9A227]"
                    />
                    <span className="font-semibold text-[11px]">Enabled</span>
                  </label>
                </div>
                <textarea
                  rows="2"
                  value={siteContentData?.bannerText || ''}
                  onChange={(e) => handleUpdateSiteContentField('bannerText', e.target.value)}
                  placeholder="e.g. Special Introductory Offer: ₹100 OFF on all fresh 10 kg stone-milled batches!"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              {/* Storage Instructions & Shelf Life */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-[#d0c5af] block">
                  Flour Storage Notice & Shelf-Life Guidance
                </label>
                <textarea
                  rows="2"
                  value={siteContentData?.storageNotice || ''}
                  onChange={(e) => handleUpdateSiteContentField('storageNotice', e.target.value)}
                  placeholder="Store in an airtight container in a cool, dry place. Best consumed within 30-45 days of stone-milling."
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              {/* Serving Size Standard */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-[#d0c5af] block">
                  Standard Roti Serving Size (Grams)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={siteContentData?.servingSizeGrams || 50}
                    onChange={(e) => handleUpdateSiteContentField('servingSizeGrams', Number(e.target.value))}
                    className="w-32 p-2.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs font-mono font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  />
                  <span className="text-xs text-gray-500">grams (~2 Phulkas / Rotis)</span>
                </div>
                <p className="text-[10px] text-gray-400">
                  Used across all 16-nutrient per-serving calculations.
                </p>
              </div>
            </div>
          </div>

          {/* CARD 2: PRODUCT CATALOG & CUSTOMER VISIBILITY */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3 gap-2">
              <div>
                <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-[#C9A227]" />
                  <span>PRODUCT CATALOG & SKU VISIBILITY</span>
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                  Toggle active status, view pricing and package sizes, or safely delete items without breaking order history
                </p>
              </div>

              <span className="text-xs text-[#C9A227] font-bold font-mono">
                {safeProducts.length} Products Cataloged
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {safeProducts.map((p) => {
                const isActive = p.isActive !== false;

                return (
                  <div
                    key={p._id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isActive
                        ? 'border-gray-200 dark:border-[#2e2a20] bg-gray-50/60 dark:bg-[#141414]'
                        : 'border-rose-200 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10 opacity-75'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div 
                            onClick={() => handleOpenPhotoChangeModal(p)}
                            className="w-12 h-12 rounded-xl bg-amber-50/50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] flex-shrink-0 relative overflow-hidden cursor-pointer group/cardphoto flex items-center justify-center p-1"
                            title="Click to change product photo"
                          >
                            <img 
                              src={p.imageUrl || '/arogyaBhog_logo.png'} 
                              alt={p.name}
                              className="w-full h-full object-cover rounded-lg group-hover/cardphoto:scale-105 transition-transform"
                              onError={(e) => { e.currentTarget.src = "/arogyaBhog_logo.png"; }}
                            />
                            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover/cardphoto:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                              <Camera className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-[#C9A227] border border-[#C9A227]/30">
                              {p.category || 'Doctor Blend'}
                            </span>
                            <h4 className="font-editorial font-bold text-sm text-gray-900 dark:text-[#fdfbf7] mt-0.5">
                              {p.name}
                            </h4>
                          </div>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isActive
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                        }`}>
                          {isActive ? 'Live' : 'Disabled'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-[#8b826f] line-clamp-2">
                        {p.description || p.benefitKeynote || 'Fresh stone-milled Ayurvedic blend.'}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-1 font-mono">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-bold text-gray-900 dark:text-[#fdfbf7]">
                          ₹{p.sellingPrice || p.pricePerKg}/kg
                          {(p.mrpPrice || p.mrpPricePerKg) && (
                            <span className="line-through text-gray-400 ml-1.5 text-[11px]">
                              ₹{p.mrpPrice || p.mrpPricePerKg}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <span>Sizes:</span>
                        <span className="font-semibold text-gray-700 dark:text-[#d0c5af]">
                          {Array.isArray(p.packageSizes) && p.packageSizes.length > 0 ? p.packageSizes.map(s => `${s} kg`).join(', ') : '10 kg'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 pt-2 border-t border-gray-200 dark:border-[#2e2a20] flex-wrap gap-y-1">
                      <button
                        type="button"
                        onClick={() => handleToggleProductActive(p._id)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-all ${
                          isActive
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900 hover:bg-rose-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPhotoChangeModal(p)}
                        className="py-1.5 px-2 rounded-lg border border-purple-300 dark:border-purple-900/60 hover:border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 text-xs text-purple-700 dark:text-purple-300 font-semibold flex items-center space-x-1 transition-all"
                        title="Change Product Photo"
                      >
                        <Camera className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenRecipeEditor(p)}
                        className="py-1.5 px-2 rounded-lg border border-[#C9A227]/60 hover:border-[#C9A227] bg-[#C9A227]/10 text-xs text-[#C9A227] font-semibold flex items-center space-x-1 transition-all"
                        title="Edit Recipe Ingredients"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Recipe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenProductEditModal(p)}
                        className="py-1.5 px-2 rounded-lg border border-gray-300 dark:border-[#2e2a20] hover:border-[#C9A227] text-xs text-gray-700 dark:text-[#d0c5af] font-semibold flex items-center space-x-1"
                        title="Edit Product Details & Formulation"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p)}
                        className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] hover:border-rose-500 text-gray-400 hover:text-rose-500 transition-all"
                        title="Safely delete product (requires confirmation)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 3: CUSTOM ATTA GRAIN PERMISSIONS */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3 gap-2">
              <div>
                <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-[#C9A227]" />
                  <span>CUSTOM ATTA GRAIN SELECTION PERMISSIONS</span>
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                  Toggle which grains customers are allowed to pick when designing bespoke 10 kg blends
                </p>
              </div>

              <span className="text-xs text-[#C9A227] font-bold font-mono">
                {safeGrains.length} Grains In Catalog
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {safeGrains.map((g) => {
                const isPermitted = g.permittedInCustomBlend !== false;

                return (
                  <div
                    key={g._id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isPermitted
                        ? 'border-gray-200 dark:border-[#2e2a20] bg-gray-50/60 dark:bg-[#141414]'
                        : 'border-amber-200 dark:border-amber-950/40 bg-amber-50/20 dark:bg-amber-950/10 opacity-70'
                    }`}
                  >
                    <div>
                      <strong className="text-xs text-gray-900 dark:text-[#fdfbf7] block">
                        {g.name}
                      </strong>
                      <span className="text-[10px] text-gray-500 font-mono">
                        ₹{g.pricePerKg}/kg • {g.stockKg || 100} kg in silo
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleGrainCustomPermission(g)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        isPermitted
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                          : 'bg-gray-200 dark:bg-[#25221b] text-gray-600 dark:text-[#8b826f]'
                      }`}
                      title={isPermitted ? 'Permitted in Custom Blender' : 'Restricted from Custom Blender'}
                    >
                      {isPermitted ? 'Permitted' : 'Locked'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CITY, ZONE & CHAKKI ROUTING MANAGEMENT (Requirement 2)
          Kanpur initial active city, deterministic priority order routing,
          and operational chakki capacity controls.
          ======================================================== */}
      {activeAdminTab === 'routing' && (
        <div className="space-y-6 animate-fadeIn">
          {/* CARD 1: OPERATING CITIES */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3 gap-2">
              <div>
                <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[#C9A227]" />
                  <span>OPERATING CITIES</span>
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                  Active and expanding municipal service territories (Initial: Kanpur, UP)
                </p>
              </div>

              {/* Add City Inline Form */}
              <form onSubmit={handleAddCity} className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="New City Name (e.g. Lucknow)"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="p-1.5 px-3 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
                <button
                  type="submit"
                  className="py-1.5 px-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider flex items-center space-x-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add City</span>
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(deliveryAreas.cities?.length > 0 ? deliveryAreas.cities : [
                { _id: 'kanpur-default', name: 'Kanpur', state: 'Uttar Pradesh', isActive: true }
              ]).map((c) => (
                <div
                  key={c._id || c.name}
                  className="p-3.5 rounded-xl border border-gray-200 dark:border-[#2e2a20] bg-gray-50/70 dark:bg-[#141414] flex items-center justify-between"
                >
                  <div>
                    <strong className="text-sm text-gray-900 dark:text-[#fdfbf7] block font-editorial">
                      {c.name}
                    </strong>
                    <span className="text-[10px] text-gray-500">{c.state || 'Uttar Pradesh'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleCity(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                      c.isActive !== false
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {c.isActive !== false ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 2: DELIVERY ZONES & PIN CODE COVERAGE */}
          <div className="rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] p-4 md:p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-[#2e2a20] pb-3 gap-2">
              <div>
                <h3 className="font-editorial text-sm md:text-base font-bold uppercase tracking-wider text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-sky-500" />
                  <span>DELIVERY ZONES & PIN CODE COVERAGE</span>
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                  Sub-regions mapping customer PIN codes to local stone chakkis (PINs: 208016, 209202)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewZoneModalOpen(true)}
                className="py-1.5 px-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider flex items-center space-x-1 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Zone</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(deliveryAreas.zones?.length > 0 ? deliveryAreas.zones : [
                {
                  _id: 'zone-knp-01',
                  code: 'ZONE-KNP-01',
                  name: 'Kanpur West & Kalyanpur Zone',
                  city: 'Kanpur',
                  pinCodes: ['208016', '209202'],
                  isActive: true
                }
              ]).map((z) => (
                <div key={z._id} className="p-4 rounded-xl border border-gray-200 dark:border-[#2e2a20] bg-gray-50/70 dark:bg-[#141414] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#C9A227]">
                        {z.code}
                      </span>
                      <h4 className="font-editorial font-bold text-sm text-gray-900 dark:text-[#fdfbf7]">
                        {z.name}
                      </h4>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {z.city || 'Kanpur'}
                    </span>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">
                      Covered PIN Codes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(z.pinCodes) && z.pinCodes.map((pin) => (
                        <span key={pin} className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20] text-xs font-mono font-bold text-[#C9A227]">
                          {pin}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 3: CHAKKI UNITS & PIN-CODE SERVICEABILITY MANAGEMENT */}
          <AdminChakkiPincodesSection 
            chakkis={deliveryAreas.chakkis || []} 
            onRefresh={async () => {
              const areas = await api.getDeliveryAreas();
              if (areas && areas.success) setDeliveryAreas(areas.data);
            }} 
          />
        </div>
      )}

      {/* ========================================================
          MODULE: PASSWORD RESET REQUESTS (WHATSAPP RECOVERY)
          ======================================================== */}
      {activeAdminTab === 'recovery' && (
        <AdminPasswordResetSection adminUser={safeUser} />
      )}

      {/* ========================================================
          MODULE: COUPONS & DISCOUNTS
          ======================================================== */}
      {activeAdminTab === 'coupons' && (
        <AdminCouponsSection adminUser={safeUser} />
      )}

      {/* ========================================================
          MODULE: FOOD KNOWLEDGE (ARTICLES)
          ======================================================== */}
      {activeAdminTab === 'articles' && (
        <AdminArticlesSection products={allProductsList || products} />
      )}

      {/* CREATE ZONE MODAL */}
      {isNewZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form onSubmit={handleAddZone} className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-2.5">
              <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">Create Delivery Zone</h3>
              <button type="button" onClick={() => setIsNewZoneModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Zone Code *</label>
                <input
                  type="text"
                  placeholder="e.g. ZONE-KNP-02"
                  value={zoneForm.code}
                  onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value })}
                  className="w-full p-2 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">Zone Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Kanpur South & Govind Nagar Zone"
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  className="w-full p-2 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">City</label>
                <input
                  type="text"
                  value={zoneForm.city}
                  onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })}
                  className="w-full p-2 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">PIN Codes (Comma separated) *</label>
                <input
                  type="text"
                  placeholder="e.g. 208006, 208022"
                  value={zoneForm.pinCodes}
                  onChange={(e) => setZoneForm({ ...zoneForm, pinCodes: e.target.value })}
                  className="w-full p-2 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] outline-none font-mono"
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button type="button" onClick={() => setIsNewZoneModalOpen(false)} className="flex-1 py-2 rounded-xl border text-xs font-bold uppercase">Cancel</button>
              <button type="submit" className="flex-1 py-2 rounded-xl bg-[#C9A227] text-white font-bold text-xs uppercase shadow-md">Create Zone</button>
            </div>
          </form>
        </div>
      )}


      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 md:p-7 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl animate-scaleUp">
            
            {/* MODAL HEADER & SECTION 1: ORDER SUMMARY */}
            <div className="border-b border-gray-200 dark:border-[#2e2a20] pb-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-lg md:text-xl text-[#C9A227]">
                      {selectedOrderDetail.orderNumber}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      selectedOrderDetail.paymentStatus === 'Paid' || selectedOrderDetail.paymentStatus === 'Success'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-400 border-amber-300 dark:border-amber-700/50'
                    }`}>
                      Payment: {selectedOrderDetail.paymentStatus}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-[#25221b] text-gray-800 dark:text-[#fdfbf7] border border-gray-300 dark:border-[#2e2a20]">
                      Status: {selectedOrderDetail.orderStatus || 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-[#8b826f]">
                    Placed on: <strong>{new Date(selectedOrderDetail.placedAt || selectedOrderDetail.createdAt || Date.now()).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrderDetail(null)}
                  className="p-2 rounded-xl border border-gray-200 dark:border-[#2e2a20] hover:border-gray-400 text-gray-400 hover:text-gray-900 dark:hover:text-[#fdfbf7] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* SECTION 1 SUMMARY STATS BAR */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-center font-mono">
                <div className="p-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                  <span className="text-[9px] uppercase text-gray-500 block">Ordered Atta Items</span>
                  <strong className="text-gray-900 dark:text-[#fdfbf7] text-sm">{selectedOrderDetail.items?.length || 1} Products</strong>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                  <span className="text-[9px] uppercase text-gray-500 block">Total Flour Weight</span>
                  <strong className="text-[#C9A227] text-sm">
                    {selectedOrderDetail.items?.reduce((acc, i) => acc + ((Number(i.batchSizeKg) || 10) * (Number(i.quantity) || 1)), 0) || 10} kg
                  </strong>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                  <span className="text-[9px] uppercase text-gray-500 block">Total Payable</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">₹{selectedOrderDetail.totalAmount}</strong>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                  <span className="text-[9px] uppercase text-gray-500 block">Payment Method</span>
                  <strong className="text-gray-900 dark:text-[#fdfbf7] text-xs">{selectedOrderDetail.paymentMethod || 'UPI_1TAP'}</strong>
                </div>
              </div>
            </div>

            {/* SECTION 2 & 3: CUSTOMER INFO & DELIVERY ADDRESS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* SECTION 2: CUSTOMER INFO */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 border-b border-gray-200 dark:border-[#2e2a20] pb-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227]">
                    SECTION 2: CUSTOMER INFORMATION
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <p className="font-bold text-sm text-gray-900 dark:text-[#fdfbf7]">
                    {selectedOrderDetail.customerName}
                  </p>
                  <div className="flex items-center space-x-2 pt-0.5">
                    <p className="text-[#C9A227] font-mono font-bold flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedOrderDetail.customerContact || selectedOrderDetail.customerPhone}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setWhatsAppModalOrder(selectedOrderDetail)}
                      className="py-0.5 px-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] flex items-center space-x-1 transition-all"
                      title="Open WhatsApp chat with customer"
                    >
                      <MessageCircle className="w-3 h-3 fill-current text-emerald-600 dark:text-emerald-400" />
                      <span>Chat on WhatsApp</span>
                    </button>
                  </div>
                  <p className="text-gray-500 dark:text-[#8b826f]">
                    Email: <span className="text-gray-800 dark:text-[#d0c5af]">{selectedOrderDetail.customerEmail || '—'}</span>
                  </p>
                  <p className="text-gray-500 dark:text-[#8b826f]">
                    Customer ID: <code className="text-gray-700 dark:text-[#c4bcac] font-mono">{selectedOrderDetail.customerId || 'Registered'}</code>
                  </p>
                </div>
              </div>

              {/* SECTION 3: DELIVERY ADDRESS & PIN CODE */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 border-b border-gray-200 dark:border-[#2e2a20] pb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227]">
                    SECTION 3: DELIVERY ADDRESS & PIN CODE
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <p className="text-gray-800 dark:text-[#d0c5af] font-medium leading-relaxed">
                    {selectedOrderDetail.customerAddress || 'Address on file'}
                  </p>
                  {selectedOrderDetail.customerSector && (
                    <p className="text-gray-600 dark:text-[#8b826f]">
                      Sector / Area: <strong className="text-gray-800 dark:text-[#d0c5af]">{selectedOrderDetail.customerSector}</strong>
                    </p>
                  )}
                  <p className="text-gray-600 dark:text-[#8b826f]">
                    Location: <strong className="text-gray-900 dark:text-[#fdfbf7]">{selectedOrderDetail.customerCity || 'Kanpur'}, {selectedOrderDetail.customerState || 'Uttar Pradesh'}</strong>
                  </p>
                  <p className="text-gray-600 dark:text-[#8b826f]">
                    PIN Code: <strong className="text-[#C9A227] font-mono font-bold text-sm">{selectedOrderDetail.customerPincode || '208016'}</strong>
                  </p>
                  <p className="text-gray-500 dark:text-[#8b826f] text-[11px] pt-1">
                    Slot: <strong className="text-emerald-600 dark:text-emerald-400">{selectedOrderDetail.deliverySlot || 'Tomorrow Morning'}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: DELIVERY AREA & PIN CODE SERVICEABILITY */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2.5 text-xs">
              <div className="flex items-center space-x-1.5 border-b border-gray-200 dark:border-[#2e2a20] pb-1.5">
                <Truck className="w-3.5 h-3.5 text-[#C9A227]" />
                <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227]">
                  SECTION 4: DELIVERY AREA & PIN CODE SERVICEABILITY
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                  <span className="text-[9px] uppercase text-gray-500 block">Operating City</span>
                  <strong className="text-gray-900 dark:text-[#fdfbf7]">
                    {selectedOrderDetail.serviceAreaSnapshot?.city || selectedOrderDetail.customerCity || 'Kanpur'}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                  <span className="text-[9px] uppercase text-gray-500 block">Delivery Zone</span>
                  <strong className="text-gray-900 dark:text-[#fdfbf7] truncate block">
                    {selectedOrderDetail.serviceAreaSnapshot?.zone || 'Kanpur West Zone'}
                  </strong>
                  <span className="text-[9px] text-gray-400 block font-normal">
                    {selectedOrderDetail.serviceAreaSnapshot?.zoneCode || 'ZONE-KNP-01'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                  <span className="text-[9px] uppercase text-gray-500 block">Delivery PIN Code</span>
                  <strong className="text-[#C9A227] font-mono text-sm block">
                    {selectedOrderDetail.customerPinCode || selectedOrderDetail.customerPincode || selectedOrderDetail.serviceAreaSnapshot?.pincode || '208016'}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                  <span className="text-[9px] uppercase text-gray-500 block">Area Serviceability</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    selectedOrderDetail.isServiceable !== false && selectedOrderDetail.orderStatus !== 'CANCELLED_UNSERVICEABLE' && selectedOrderDetail.orderStatus !== 'REFUND_PENDING'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400'
                  }`}>
                    {selectedOrderDetail.isServiceable !== false && selectedOrderDetail.orderStatus !== 'CANCELLED_UNSERVICEABLE' && selectedOrderDetail.orderStatus !== 'REFUND_PENDING'
                      ? 'Serviceable Area'
                      : 'Outside Delivery Area'}
                  </span>
                </div>
              </div>
              {selectedOrderDetail.unserviceableCustomerMessage && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-[11px] text-amber-900 dark:text-amber-200">
                  <strong>Customer Notification:</strong> {selectedOrderDetail.unserviceableCustomerMessage}
                </div>
              )}
            </div>

            {/* SECTION 5 & 6: PRODUCT, PACKAGE DETAILS & INGREDIENT BREAKDOWNS */}
            <div className="space-y-4">
              <div className="flex items-center space-x-1.5 border-b border-gray-200 dark:border-[#2e2a20] pb-1.5">
                <Package className="w-3.5 h-3.5 text-[#C9A227]" />
                <span className="text-[11px] uppercase font-bold tracking-caps text-[#C9A227]">
                  SECTION 5 & 6: PRODUCT, PACKAGE DETAILS & INGREDIENT BREAKDOWN
                </span>
              </div>

              {selectedOrderDetail.items?.map((item, idx) => (
                <div key={idx} className="space-y-3 border border-gray-200 dark:border-[#2e2a20] rounded-xl p-4 bg-gray-50 dark:bg-[#141414]">
                  {/* SECTION 5: PRODUCT & PACKAGE HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-2.5 gap-2 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-[#C9A227]">
                          #{idx + 1}
                        </span>
                        <h4 className="font-editorial font-bold text-base text-gray-900 dark:text-[#fdfbf7]">
                          {item.name}
                        </h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-[#25221b] text-gray-700 dark:text-[#c4bcac]">
                          {item.isCustom ? 'Custom Blend' : 'Doctor Prebuilt'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 dark:text-[#8b826f] mt-1">
                        <span>Package: <strong className="text-[#C9A227]">{item.batchSizeKg} kg</strong></span>
                        <span>•</span>
                        <span>Quantity: <strong>{item.quantity}</strong></span>
                        <span>•</span>
                        <span>Total Weight: <strong>{(Number(item.batchSizeKg) || 10) * (Number(item.quantity) || 1)} kg</strong></span>
                        <span>•</span>
                        <span>Fineness: <strong className="text-gray-900 dark:text-[#fdfbf7]">{item.fineness || 'Medium (Phulka)'}</strong></span>
                        <span>•</span>
                        <span>Grains: <strong>{item.grainBreakdown?.length || 0} Ingredients</strong></span>
                      </div>
                    </div>
                    <span className="font-bold text-base text-[#C9A227] font-mono">
                      ₹{item.totalItemPrice}
                    </span>
                  </div>

                  {/* SECTION 6: INGREDIENT COMPOSITION TABLE */}
                  {item.grainBreakdown && item.grainBreakdown.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-[#2e2a20] text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f]">
                            <th className="py-1.5 px-2">Ingredient</th>
                            <th className="py-1.5 px-2 text-center">Percentage</th>
                            <th className="py-1.5 px-2 text-center">Weight (g / kg)</th>
                            <th className="py-1.5 px-2 text-right">Raw Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#2e2a20]">
                          {item.grainBreakdown.map((g, gIdx) => {
                            const weightInKg = g.weightKg || Number(((g.percentage / 100) * (item.batchSizeKg || 10)).toFixed(3));
                            const weightInGrams = Math.round(weightInKg * 1000);
                            const price = g.calculatedPrice || Math.round(weightInKg * (g.pricePerKg || 70));

                            return (
                              <tr key={gIdx} className="hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
                                <td className="py-2 px-2 font-medium text-gray-900 dark:text-[#fdfbf7]">
                                  {g.name}
                                </td>
                                <td className="py-2 px-2 text-center font-bold text-[#C9A227]">
                                  {g.percentage}%
                                </td>
                                <td className="py-2 px-2 text-center font-mono text-gray-700 dark:text-[#d0c5af]">
                                  {weightInGrams} g <span className="text-gray-400">({weightInKg} kg)</span>
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-semibold text-gray-900 dark:text-[#fdfbf7]">
                                  ₹{price}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-300 dark:border-[#4d4635] font-bold text-xs">
                            <td className="py-2 px-2 text-gray-900 dark:text-[#fdfbf7]">Formula Composition Subtotal</td>
                            <td className="py-2 px-2 text-center text-[#C9A227]">100%</td>
                            <td className="py-2 px-2 text-center font-mono">{item.batchSizeKg} kg</td>
                            <td className="py-2 px-2 text-right text-gray-800 dark:text-[#d0c5af] font-mono">
                              ₹{item.isCustom ? Math.max(0, item.totalItemPrice - 100) : item.totalItemPrice}
                            </td>
                          </tr>
                          {item.isCustom && (
                            <tr className="border-t border-dashed border-[#C9A227]/40 text-xs text-[#C9A227] font-bold bg-amber-50/40 dark:bg-amber-950/20">
                              <td colSpan="3" className="py-2 px-2">
                                ★ Cold-Stone Custom Formulation & Milling Service Charge
                              </td>
                              <td className="py-2 px-2 text-right font-mono">
                                +₹100
                              </td>
                            </tr>
                          )}
                          <tr className="border-t border-gray-300 dark:border-[#4d4635] font-bold text-xs">
                            <td colSpan="3" className="py-2 px-2 text-gray-900 dark:text-[#fdfbf7]">Total Line Item Price</td>
                            <td className="py-2 px-2 text-right text-[#C9A227] font-mono text-sm">₹{item.totalItemPrice}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 py-1 italic">Standard pre-formulated signature flour.</p>
                  )}
                </div>
              ))}
            </div>

            {/* ========================================================
                SECTION 7: SEPARATE NUTRITION TABLE FOR EVERY ORDERED ATTA
                (Requirement 5: Dedicated table for each line item - NEVER combined!
                 Columns: Nutrient | Per 100 g | Per serving (50 g) | Total in ordered quantity)
                ======================================================== */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-2">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-[#C9A227]" />
                  <span className="text-[11px] uppercase font-bold tracking-caps text-[#C9A227]">
                    SECTION 7: SEPARATE NUTRITION TABLES FOR EVERY ORDERED ATTA
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-[#8b826f] font-mono">
                  1 Dedicated Table Per Product • Serving Size: 50 g (~2 Phulkas)
                </span>
              </div>

              {selectedOrderDetail.items?.map((item, idx) => {
                // Retrieve snapshot or calculate honest 16-nutrient breakdown
                let nutrition = item.nutritionSnapshot;
                if (!nutrition || !nutrition.per100g || Object.keys(nutrition.per100g).length === 0) {
                  nutrition = calculateProductNutrition(
                    item.grainBreakdown, 
                    item.batchSizeKg || 10, 
                    item.quantity || 1, 
                    grains, 
                    50
                  );
                }

                const totalBatchGrams = (Number(item.batchSizeKg) || 10) * (Number(item.quantity) || 1) * 1000;

                return (
                  <div key={`item-nutrition-${idx}`} className="rounded-xl border border-gray-200 dark:border-[#2e2a20] p-4 bg-gray-50/70 dark:bg-[#141414] space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-[#C9A227]"></span>
                          <h4 className="font-editorial font-bold text-sm md:text-base text-gray-900 dark:text-[#fdfbf7]">
                            Nutrition Table — Product #{idx + 1}: {item.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-[#8b826f] mt-0.5">
                          Calculated for {item.batchSizeKg} kg package × {item.quantity} = <strong className="text-[#C9A227]">{totalBatchGrams.toLocaleString()} g total batch</strong>
                        </p>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-[#C9A227] border border-amber-300 dark:border-[#C9A227]/40">
                        Dedicated Table
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-[#2e2a20] text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] bg-gray-100/60 dark:bg-[#1c1c1c]">
                            <th className="py-2 px-3">Nutrient</th>
                            <th className="py-2 px-3 text-center">Per 100 g</th>
                            <th className="py-2 px-3 text-center">Per Serving (50 g)</th>
                            <th className="py-2 px-3 text-right">Total in Ordered Quantity ({totalBatchGrams.toLocaleString()} g)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-[#2e2a20]">
                          {NUTRIENT_DEFINITIONS.map((def) => {
                            const val100 = nutrition?.per100g?.[def.key];
                            const valServing = nutrition?.perServing?.[def.key];
                            const valTotal = nutrition?.perOrderedQuantity?.[def.key];

                            return (
                              <tr key={def.key} className="hover:bg-gray-100/60 dark:hover:bg-[#1a1a1a] transition-colors">
                                <td className="py-2 px-3 font-medium text-gray-800 dark:text-[#d0c5af]">
                                  {def.label}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-semibold text-gray-900 dark:text-[#fdfbf7]">
                                  {formatNutrientValue(val100, def.unit)}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-[#C9A227]">
                                  {formatNutrientValue(valServing, def.unit)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-[#a89f8d]">
                                  {formatNutrientValue(valTotal, def.unit)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SECTION 8: PRICE & PAYMENT BREAKDOWN */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227] flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>SECTION 8: PRICE & PAYMENT BREAKDOWN</span>
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  selectedOrderDetail.paymentStatus === 'Paid' || selectedOrderDetail.paymentStatus === 'Success'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300'
                    : selectedOrderDetail.refundStatus === 'REFUNDED'
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-[#C9A227] border border-amber-300'
                }`}>
                  Payment: {selectedOrderDetail.paymentStatus}
                </span>
              </div>

              {/* REFUND COMPLETED AUDIT BLOCK */}
              {selectedOrderDetail.refundStatus === 'REFUNDED' && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>REFUND COMPLETED</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                      ₹{selectedOrderDetail.refundAmount || selectedOrderDetail.totalAmount}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-[#a09886]">
                    Reference / UTR: <strong className="font-mono text-gray-900 dark:text-white">{selectedOrderDetail.refundTransactionRef || 'Online Gateway'}</strong> • Processed: {selectedOrderDetail.refundProcessedAt ? new Date(selectedOrderDetail.refundProcessedAt).toLocaleString('en-IN') : 'Completed'}
                  </p>
                  {selectedOrderDetail.refundNotes && (
                    <p className="text-[10px] text-gray-500 italic">
                      Note: {selectedOrderDetail.refundNotes}
                    </p>
                  )}
                </div>
              )}

              {/* REFUND PENDING ACTION BLOCK */}
              {(selectedOrderDetail.refundStatus === 'PENDING' || selectedOrderDetail.orderStatus === 'REFUND_PENDING' || selectedOrderDetail.paymentStatus === 'REFUND_PENDING') && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>REFUND REQUIRED — UNABLE TO DELIVER</span>
                    </span>
                    <span className="font-mono font-bold text-rose-600 text-sm">
                      ₹{selectedOrderDetail.totalAmount} Due
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    {selectedOrderDetail.unserviceableCustomerMessage || 'Customer was charged for an order outside current serviceable territory. Please record refund reference once processed.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenRefundModal(selectedOrderDetail)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Customer Refund (UTR & Gateway Ref)</span>
                  </button>
                </div>
              )}

              {/* Itemized Operational Cost Breakdown */}
              {selectedOrderDetail.costBreakdown && (selectedOrderDetail.costBreakdown.totalOperationalCost > 0 || selectedOrderDetail.costBreakdown.rawIngredientCost > 0) && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f] block">
                    Operational Parameters (OP-001, OP-002, OP-003):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 block">Raw Ingredients</span>
                      <strong className="text-gray-900 dark:text-[#fdfbf7]">₹{selectedOrderDetail.costBreakdown.rawIngredientCost}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 block">Milling (₹4/kg)</span>
                      <strong className="text-[#C9A227]">₹{selectedOrderDetail.costBreakdown.millingCost}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 block">Packaging (₹5/5kg)</span>
                      <strong className="text-[#C9A227]">₹{selectedOrderDetail.costBreakdown.packagingCost}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 block">Delivery (₹50)</span>
                      <strong className="text-[#C9A227]">₹{selectedOrderDetail.costBreakdown.deliveryCost}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic UPI Payment Verification & QR with Exact Note */}
              {(() => {
                const upiInfo = buildUpiUri({
                  vpa: MERCHANT_UPI_ID,
                  amount: selectedOrderDetail.totalAmount,
                  customerName: selectedOrderDetail.customerName,
                  customerPhone: selectedOrderDetail.customerContact || selectedOrderDetail.customerPhone,
                  orderNumber: selectedOrderDetail.orderNumber,
                  customNote: selectedOrderDetail.upiTransactionNote || null
                });

                return (
                  <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-[#1a1712] border border-amber-300 dark:border-[#C9A227]/40 space-y-2.5">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="p-2 bg-white rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
                        <QRCodeSVG value={upiInfo.uri} size={90} level="M" />
                      </div>
                      <div className="space-y-1 flex-1 w-full text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-[#8b826f]">Merchant UPI ID:</span>
                          <code className="text-gray-900 dark:text-[#fdfbf7] font-mono font-bold">{MERCHANT_UPI_ID}</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-[#8b826f]">Amount:</span>
                          <span className="text-[#C9A227] font-bold text-sm">₹{selectedOrderDetail.totalAmount}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-gray-500 dark:text-[#8b826f] block">Exact Transaction Note:</span>
                          <div className="p-1.5 rounded-lg bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] flex items-center justify-between">
                            <code className="text-[#C9A227] font-mono text-[10px] break-all">{upiInfo.note}</code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(upiInfo.note);
                                alert('UPI note copied!');
                              }}
                              className="ml-2 text-gray-400 hover:text-[#C9A227]"
                              title="Copy Note"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Payment Confirmation Audit */}
              {selectedOrderDetail.paymentConfirmedBy?.role && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20] space-y-0.5">
                  <p className="font-semibold text-gray-900 dark:text-[#fdfbf7]">
                    Payment Confirmed by {selectedOrderDetail.paymentConfirmedBy.role === 'Admin' ? 'Admin' : 'Delivery Person'}:{' '}
                    <span className="text-[#C9A227] font-bold">{selectedOrderDetail.paymentConfirmedBy.name || 'Admin'}</span>
                  </p>
                  <p className="text-gray-500 dark:text-[#8b826f] text-[11px]">
                    Method: {selectedOrderDetail.paymentConfirmedBy.paymentMethod || 'UPI / Cash'} • Ref: {selectedOrderDetail.paymentConfirmedBy.transactionRef || 'N/A'} • At: {new Date(selectedOrderDetail.paymentConfirmedBy.confirmedAt || selectedOrderDetail.updatedAt).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 9: ORDER & DELIVERY STATUS CONTROLS */}
            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-[#201c13] border border-amber-300 dark:border-[#C9A227]/40 space-y-3 text-xs">
              <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227] block">
                SECTION 9: ORDER STATUS & DELIVERY CONTROLS
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Order Status Select */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 dark:text-[#d0c5af] block mb-1">
                    Order Lifecycle Status:
                  </label>
                  <select
                    value={selectedOrderDetail.orderStatus || 'Pending'}
                    disabled={isUpdatingStatus}
                    onChange={(e) => handleUpdateOrderStatus(selectedOrderDetail._id, e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#141414] border border-gray-300 dark:border-[#2e2a20] text-xs font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  >
                    <option value="Pending">Pending (Floor Queue)</option>
                    <option value="Confirmed">Confirmed (Stone Milling)</option>
                    <option value="Processing">Processing (Packing & Ship)</option>
                    <option value="Shipped">Shipped (Out for Delivery)</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled (Restock)</option>
                  </select>
                </div>

                {/* Payment Status Action */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 dark:text-[#d0c5af] block mb-1">
                    Payment Verification:
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedOrderDetail.paymentStatus}
                      onChange={(e) => handleUpdatePayment(selectedOrderDetail._id, e.target.value)}
                      className="flex-1 p-2.5 rounded-xl bg-white dark:bg-[#141414] border border-gray-300 dark:border-[#2e2a20] text-xs font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    >
                      <option value="Pending">Pending Verification</option>
                      <option value="Paid">Paid / Success</option>
                      <option value="Failed">Failed / Rejected</option>
                    </select>

                    {selectedOrderDetail.paymentStatus === 'Pending' && (
                      <button
                        onClick={() => handleUpdatePayment(selectedOrderDetail._id, 'Paid')}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase transition-all shadow-sm flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Approve</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Delivery Person Reassignment */}
                <div className="sm:col-span-2 pt-2 border-t border-amber-200 dark:border-[#2e2a20]">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-[#d0c5af] block mb-1">
                    Assigned Delivery Partner:
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={selectedOrderDetail.assignedDeliveryPerson || ''}
                      disabled={isReassigning}
                      onChange={(e) => handleReassignDelivery(selectedOrderDetail._id, e.target.value)}
                      className="flex-1 p-2.5 rounded-xl bg-white dark:bg-[#141414] border border-gray-300 dark:border-[#2e2a20] text-xs font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    >
                      <option value="">Select Delivery Partner...</option>
                      {deliveryPersons.map((dp) => (
                        <option key={dp._id} value={dp._id}>
                          {dp.name} ({dp.phone}) — {dp.isAvailable ? 'On Duty' : 'On Break'} {dp.isActive ? '' : '(Inactive)'}
                        </option>
                      ))}
                    </select>

                    <div className="text-[11px] text-gray-500 dark:text-[#8b826f] flex items-center space-x-1 self-center">
                      <Truck className="w-3.5 h-3.5 text-sky-600" />
                      <span>{selectedOrderDetail.assignedDeliveryPersonName ? `Assigned: ${selectedOrderDetail.assignedDeliveryPersonName}` : 'Auto-Allocated'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Completion Audit */}
              {selectedOrderDetail.orderStatus === 'Delivered' && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#121c15] border border-emerald-300 dark:border-emerald-950 space-y-0.5">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Delivered by: <strong>{selectedOrderDetail.deliveredBy?.name || selectedOrderDetail.assignedDeliveryPersonName || 'Fleet'}</strong>
                    {(selectedOrderDetail.deliveredBy?.phone || selectedOrderDetail.assignedDeliveryPersonPhone) && ` (${selectedOrderDetail.deliveredBy?.phone || selectedOrderDetail.assignedDeliveryPersonPhone})`}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Delivered At: {new Date(selectedOrderDetail.deliveredBy?.deliveredAt || selectedOrderDetail.completedAt || selectedOrderDetail.updatedAt).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 10 & 11: SELECTION TIME & AI / PREBUILT RECIPE SOURCE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* SECTION 10: SELECTION / CUSTOMIZATION TIME */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 border-b border-gray-200 dark:border-[#2e2a20] pb-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227]">
                    SECTION 10: SELECTION & CUSTOMIZATION TIME
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {selectedOrderDetail.items?.map((item, idx) => {
                    const secs = item.selectionTimeSeconds || 0;
                    const durationStr = secs > 60 
                      ? `${Math.floor(secs / 60)} min ${secs % 60} sec` 
                      : secs > 0 ? `${secs} seconds` : 'Standard Selection';

                    return (
                      <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20] flex items-center justify-between">
                        <div>
                          <strong className="text-gray-900 dark:text-[#fdfbf7] block">{item.name}</strong>
                          <span className="text-[10px] text-gray-400">
                            {item.selectionStartedAt ? `Started: ${new Date(item.selectionStartedAt).toLocaleTimeString('en-IN')}` : 'Ready Selection'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[#C9A227] font-bold text-xs block">{durationStr}</span>
                          {item.selectionCompletedAt && (
                            <span className="text-[10px] text-emerald-600 block">Finalized</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 11: AI RECOMMENDATION / PREBUILT RECIPE SOURCE */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-2 text-xs">
                <div className="flex items-center space-x-1.5 border-b border-gray-200 dark:border-[#2e2a20] pb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227]">
                    SECTION 11: AI RECOMMENDATION & RECIPE SOURCE
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {selectedOrderDetail.items?.map((item, idx) => {
                    const isModPrebuilt = Boolean(item.prebuiltSource?.isModified);
                    const isPrebuilt = Boolean(item.prebuiltSource?.name);
                    const hasAi = Boolean(item.aiRecommendationDetails?.healthGoal);

                    return (
                      <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#2e2a20] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900 dark:text-[#fdfbf7]">{item.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 text-[#C9A227] border border-[#C9A227]/30">
                            {isModPrebuilt ? 'Customized Prebuilt' : isPrebuilt ? 'Doctor Signature' : hasAi ? 'AI Goal' : 'Bespoke Custom'}
                          </span>
                        </div>
                        {isPrebuilt && (
                          <p className="text-[11px] text-gray-600 dark:text-[#a89f8d]">
                            Recipe Source: <strong className="text-gray-900 dark:text-[#fdfbf7]">{item.prebuiltSource.name}</strong>
                            {isModPrebuilt && <span className="text-amber-600 dark:text-amber-400 ml-1">(Adjusted by Customer)</span>}
                          </p>
                        )}
                        {hasAi && (
                          <p className="text-[11px] text-gray-600 dark:text-[#a89f8d]">
                            AI Goal: <strong className="text-gray-900 dark:text-[#fdfbf7]">{item.aiRecommendationDetails.healthGoal}</strong>
                          </p>
                        )}
                        {!isPrebuilt && !hasAi && (
                          <p className="text-[10px] text-gray-400 italic">Custom created from scratch in Chakki Flour Studio.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 12: ORDER ACTIVITY HISTORY & AUDIT TRAIL */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 border-b border-gray-200 dark:border-[#2e2a20] pb-1.5">
                <Activity className="w-3.5 h-3.5 text-[#C9A227]" />
                <span className="text-[11px] uppercase font-bold tracking-caps text-[#C9A227]">
                  SECTION 12: ORDER ACTIVITY HISTORY & AUDIT TRAIL
                </span>
              </div>

              {selectedOrderDetail.activityLog && selectedOrderDetail.activityLog.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2e2a20]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-[#1c1c1c] text-[10px] uppercase font-bold text-gray-500 dark:text-[#8b826f]">
                        <th className="py-2 px-3">Activity</th>
                        <th className="py-2 px-3">Actor / Role</th>
                        <th className="py-2 px-3">Contact</th>
                        <th className="py-2 px-3">Date & Time</th>
                        <th className="py-2 px-3">Details / Transition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#2e2a20] bg-white dark:bg-[#141414]">
                      {selectedOrderDetail.activityLog.map((act, aIdx) => (
                        <tr key={aIdx} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                          <td className="py-2 px-3 font-semibold text-gray-900 dark:text-[#fdfbf7]">
                            {act.activity}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-[#25221b] text-[#C9A227] border border-[#C9A227]/30">
                              {act.actorRole || 'System'}
                            </span>
                            <span className="ml-1 text-gray-700 dark:text-[#d0c5af]">{act.actorName || 'N/A'}</span>
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-gray-500 dark:text-[#8b826f]">
                            {act.actorPhone || '—'}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-gray-500 dark:text-[#8b826f]">
                            {new Date(act.timestamp).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-gray-600 dark:text-[#99907c]">
                            {act.previousStatus && act.newStatus 
                              ? `${act.previousStatus} ➔ ${act.newStatus}` 
                              : act.notes || act.transactionRef || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : selectedOrderDetail.statusHistory && selectedOrderDetail.statusHistory.length > 0 ? (
                <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-xs">
                  {selectedOrderDetail.statusHistory.map((sh, sIdx) => (
                    <div key={sIdx} className="flex items-center justify-between text-[11px] text-gray-600 dark:text-[#99907c]">
                      <span className="font-semibold text-gray-800 dark:text-[#d0c5af]">Status: {sh.status}</span>
                      <span>{sh.timestamp ? new Date(sh.timestamp).toLocaleString('en-IN') : '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic p-2 bg-gray-50 dark:bg-[#141414] rounded-lg">
                  No activity logs recorded for this order.
                </p>
              )}
            </div>

            {/* MODAL ACTIONS: EXCEL EXPORT, CANCEL, DELETE & CLOSE */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-[#2e2a20]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportOrdersToExcel([selectedOrderDetail])}
                  className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-[#2e2a20] hover:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-sm"
                  title="Export this order to Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export to Excel (.xlsx)</span>
                </button>

                {selectedOrderDetail.orderStatus !== 'Cancelled' && selectedOrderDetail.orderStatus !== 'CANCELLED_UNSERVICEABLE' && selectedOrderDetail.orderStatus !== 'REFUNDED' && (
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(selectedOrderDetail._id, selectedOrderDetail.orderNumber)}
                    className="py-2.5 px-4 rounded-xl border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm"
                    title="Cancel order and release reserved stock"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Order</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setWhatsAppModalOrder(selectedOrderDetail)}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md group"
                  title="Send WhatsApp confirmation directly to customer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Send WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrderDetail._id, selectedOrderDetail.orderNumber)}
                  className="py-2.5 px-4 rounded-xl border border-rose-300 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-sm"
                  title="Permanently delete order from database"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Order</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                className="py-2.5 px-6 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-[#111111] hover:bg-[#C9A227] dark:hover:bg-[#C9A227] hover:text-white dark:hover:text-[#111111] text-xs font-bold uppercase tracking-wider transition-all shadow-md ml-auto"
              >
                Close Order Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          FLEXIBLE RESTOCK MODAL (Requirement 5: any decimal kg amount e.g. 5, 12.5, 25 kg)
          ======================================================== */}
      {restockModalGrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleFlexibleRestock} className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
                  RESTOCK GRAIN SILO
                </h3>
                <p className="text-xs text-[#C9A227] font-semibold mt-0.5">
                  {restockModalGrain.name} ({restockModalGrain.code || restockModalGrain.name.slice(0, 2).toUpperCase()})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRestockModalGrain(null)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900 dark:hover:text-[#fdfbf7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Current stock indicator */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-[#8b826f]">Current Stock Level:</span>
                <span className="font-bold font-mono text-gray-900 dark:text-[#fdfbf7]">
                  {restockModalGrain.inStockKg} kg / {restockModalGrain.capacityKg || 200} kg
                </span>
              </div>

              {/* Quantity to add input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block">
                  Add Stock Quantity (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  placeholder="e.g. 5, 12.5, 25, 50"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] focus:border-[#C9A227] text-base font-bold font-mono text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center space-x-2">
                {[5, 12.5, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRestockAmount(preset.toString())}
                    className={`flex-1 py-1 px-1.5 rounded-lg border text-[11px] font-mono font-bold transition-all ${
                      parseFloat(restockAmount) === preset
                        ? 'border-[#C9A227] bg-[#C9A227] text-white dark:text-[#121212]'
                        : 'border-gray-200 dark:border-[#2e2a20] bg-gray-50 dark:bg-[#141414] text-gray-700 dark:text-[#d0c5af] hover:border-[#C9A227]'
                    }`}
                  >
                    +{preset}k
                  </button>
                ))}
              </div>

              {/* Live Preview of New Stock Level */}
              {(() => {
                const addQty = parseFloat(restockAmount) || 0;
                const newStock = Number((restockModalGrain.inStockKg + addQty).toFixed(2));
                return (
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-[#231d13] border border-[#C9A227]/40 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700 dark:text-[#d0c5af]">Projected Stock after restock:</span>
                    <span className="font-bold font-mono text-[#C9A227] text-sm">
                      {newStock} kg
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockModalGrain(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-xs font-bold text-gray-700 dark:text-[#d0c5af] uppercase"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isRestocking}
                className="flex-1 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>{isRestocking ? 'Restocking...' : 'Confirm Restock'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          RECIPE FORMULA EDITOR MODAL (Requirement 3: Strict 100% Validation)
          ======================================================== */}
      {editingRecipeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-editorial font-bold text-lg text-gray-900 dark:text-[#fdfbf7]">
                    Recipe Formula Editor
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-[#25221b] text-[#C9A227] border border-[#C9A227]/40">
                    100% Strict Balance
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-[#8b826f] mt-0.5">
                  Predefined Product: <strong className="text-gray-900 dark:text-[#fdfbf7]">{editingRecipeProduct.name}</strong> • Selling: ₹{editingRecipeProduct.sellingPrice}/kg
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecipeProduct(null)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900 dark:hover:text-[#fdfbf7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {recipeSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{recipeSuccessMsg}</span>
              </div>
            )}

            {/* Running Total & Balance Indicator */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isRecipeBalanced
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                : recipeRunningTotal < 100
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 text-amber-800 dark:text-amber-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 text-rose-800 dark:text-rose-300'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-caps block">
                  FORMULA BALANCE STATUS
                </span>
                <p className="text-xs font-semibold mt-0.5">
                  {isRecipeBalanced
                    ? '✓ Perfectly Balanced (Exactly 100.0%)'
                    : recipeRunningTotal < 100
                    ? `Under-allocated: ${(100 - recipeRunningTotal).toFixed(1)}% remaining needed`
                    : `Over-allocated: ${(recipeRunningTotal - 100).toFixed(1)}% excess must be reduced`}
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-xl block">
                  {recipeRunningTotal.toFixed(1)}%
                </span>
                <span className="text-[10px] uppercase font-bold">Target: 100.0%</span>
              </div>
            </div>

            {/* Ingredients List Table */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f]">
                  Recipe Ingredients & Weight Distribution
                </label>
                <button
                  type="button"
                  onClick={handleAddGrainToRecipe}
                  className="py-1 px-2.5 rounded-lg border border-[#C9A227] text-[#C9A227] hover:bg-[#C9A227] hover:text-white dark:hover:text-[#121212] text-xs font-bold flex items-center space-x-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ingredient</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {recipeGrains.map((rg, idx) => {
                  const masterGrain = safeGrains.find(g => (g.ingredientId || g.code) === rg.ingredientId || g.name === rg.name);
                  const pricePerKg = masterGrain?.pricePerKg || 0;
                  const weight5kg = Number(((rg.percentage / 100) * 5).toFixed(2));
                  const weight10kg = Number(((rg.percentage / 100) * 10).toFixed(2));

                  return (
                    <div 
                      key={idx} 
                      className="p-3 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      {/* Select Ingredient Dropdown */}
                      <div className="flex-1 space-y-1">
                        <select
                          value={rg.ingredientId || rg.name}
                          onChange={(e) => handleRecipeGrainIngredientChange(idx, e.target.value)}
                          className="w-full p-2 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2e2a20] text-xs font-semibold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                        >
                          {safeGrains.map(g => (
                            <option key={g._id} value={g.ingredientId || g.code || g.name}>
                              {g.name} [{g.ingredientId || g.code}] — ₹{g.pricePerKg || 0}/kg
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center space-x-2 text-[10px] text-gray-500 dark:text-[#8b826f]">
                          <span>Rate: ₹{pricePerKg}/kg</span>
                          <span>•</span>
                          <span>5kg: <strong className="text-gray-800 dark:text-[#d0c5af] font-mono">{weight5kg} kg</strong></span>
                          <span>•</span>
                          <span>10kg: <strong className="text-gray-800 dark:text-[#d0c5af] font-mono">{weight10kg} kg</strong></span>
                        </div>
                      </div>

                      {/* Percentage Input & Remove */}
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <div className="flex items-center space-x-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2e2a20] rounded-lg px-2 py-1.5">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={rg.percentage}
                            onChange={(e) => handleRecipeGrainRatioChange(idx, e.target.value)}
                            className="w-14 bg-transparent text-center font-bold text-sm text-[#C9A227] outline-none font-mono"
                          />
                          <span className="text-xs font-bold text-[#C9A227]">%</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveGrainFromRecipe(idx)}
                          className="p-2 rounded-lg border border-gray-200 dark:border-[#2e2a20] text-gray-400 hover:text-rose-600 hover:border-rose-300 transition-all"
                          title="Remove ingredient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Cost & Operational Impact Preview */}
            {(() => {
              let liveRawCostPerKg = 0;
              recipeGrains.forEach(rg => {
                const master = safeGrains.find(g => (g.ingredientId || g.code) === rg.ingredientId || g.name === rg.name);
                const price = master?.pricePerKg || 0;
                liveRawCostPerKg += (Number(rg.percentage) / 100) * price;
              });
              const millingPerKg = 4;
              const packaging5kg = 5;
              const raw5kg = Math.round(liveRawCostPerKg * 5);
              const estCost5kg = raw5kg + (millingPerKg * 5) + packaging5kg;

              return (
                <div className="p-3 rounded-xl bg-amber-50/40 dark:bg-[#201c13] border border-amber-300 dark:border-[#C9A227]/40 space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227] block">
                    LIVE RAW INGREDIENT COST & PRODUCTION ESTIMATE
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1 font-mono">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 block">Raw Cost / kg</span>
                      <strong className="text-gray-900 dark:text-[#fdfbf7]">₹{liveRawCostPerKg.toFixed(2)}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 block">Raw Cost (5kg)</span>
                      <strong className="text-[#C9A227]">₹{raw5kg}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 block">Total Est Cost (5kg)</span>
                      <strong className="text-[#C9A227]">₹{estCost5kg}</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20]">
                      <span className="text-[9px] text-gray-500 block">Selling (5kg)</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">₹{editingRecipeProduct.sellingPrice}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => setEditingRecipeProduct(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveRecipe}
                disabled={!isRecipeBalanced || isSavingRecipe}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-1.5 ${
                  isRecipeBalanced && !isSavingRecipe
                    ? 'bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212]'
                    : 'bg-gray-300 dark:bg-[#25221b] text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingRecipe ? 'Saving Formula...' : 'Save 100% Recipe'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MASTER INGREDIENT & NUTRITION PROFILE MODAL (Requirement 3)
          ======================================================== */}
      {editingGrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveGrainProfile} className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
                  Master Ingredient & Nutrition Profile
                </h3>
                <p className="text-xs text-[#C9A227] font-semibold mt-0.5">
                  {editingGrain.name} [{editingGrain.ingredientId}]
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingGrain(null)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900 dark:hover:text-[#fdfbf7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {grainSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{grainSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block mb-1">
                  Ingredient Code / ID
                </label>
                <input
                  type="text"
                  required
                  value={editingGrain.ingredientId}
                  onChange={(e) => setEditingGrain({ ...editingGrain, ingredientId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono font-bold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block mb-1">
                  Ingredient Name
                </label>
                <input
                  type="text"
                  required
                  value={editingGrain.name}
                  onChange={(e) => setEditingGrain({ ...editingGrain, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-semibold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block mb-1">
                  Category
                </label>
                <select
                  value={editingGrain.category}
                  onChange={(e) => setEditingGrain({ ...editingGrain, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-xs font-semibold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                >
                  <option value="Base Grain">Base Grain</option>
                  <option value="Millet">Millet</option>
                  <option value="Pulse / Legume">Pulse / Legume</option>
                  <option value="Superfood Seed">Superfood Seed</option>
                  <option value="Soluble Fiber">Soluble Fiber</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block mb-1">
                  Price (₹ per kg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={editingGrain.pricePerKg}
                  onChange={(e) => setEditingGrain({ ...editingGrain, pricePerKg: e.target.value })}
                  placeholder="Unconfigured"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-bold text-[#C9A227] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block mb-1">
                  Current Stock (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editingGrain.inStockKg}
                  onChange={(e) => setEditingGrain({ ...editingGrain, inStockKg: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block mb-1">
                  Silo Capacity (kg)
                </label>
                <input
                  type="number"
                  value={editingGrain.capacityKg}
                  onChange={(e) => setEditingGrain({ ...editingGrain, capacityKg: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block mb-1">
                  Low Stock Threshold (kg)
                </label>
                <input
                  type="number"
                  value={editingGrain.lowStockThresholdKg}
                  onChange={(e) => setEditingGrain({ ...editingGrain, lowStockThresholdKg: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block mb-1">
                  Verification Status
                </label>
                <select
                  value={editingGrain.verificationStatus || 'Reference Estimate'}
                  onChange={(e) => setEditingGrain({ ...editingGrain, verificationStatus: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-xs font-semibold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                >
                  <option value="User Verified">User Verified</option>
                  <option value="Reference Estimate">Reference Estimate</option>
                  <option value="Pending Lab Test">Pending Lab Test</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block mb-1">
                  Review Flag / Mineral Highlight
                </label>
                <input
                  type="text"
                  value={editingGrain.reviewFlag || ''}
                  onChange={(e) => setEditingGrain({ ...editingGrain, reviewFlag: e.target.value })}
                  placeholder="e.g. Calcium 344mg (Natural Mineral Rich)"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-xs font-semibold text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 dark:text-[#8b826f] block mb-1">
                  Source Status / Lab Reference Notes
                </label>
                <input
                  type="text"
                  value={editingGrain.sourceStatus || ''}
                  onChange={(e) => setEditingGrain({ ...editingGrain, sourceStatus: e.target.value })}
                  placeholder="e.g. User-provided base values; minerals are reference estimates"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>
            </div>

            {/* FULL 16-NUTRIENT PROFILE (per 100g serving) */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227] block">
                  16-NUTRIENT PROFILE (PER 100g SERVING)
                </span>
                <span className="text-[10px] text-gray-400">Leave blank for unmeasured &ldquo;—&rdquo;</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* 1. Energy */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Energy (kcal)</label>
                  <input
                    type="number"
                    value={editingGrain.nutrition?.energyKcal ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, energyKcal: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 2. Protein */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.proteinG ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, proteinG: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 3. Carbohydrates */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.carbsG ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, carbsG: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 4. Total Sugars */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Total Sugars (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.sugarsG ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, sugarsG: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 5. Added Sugars */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Added Sugars (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.addedSugarsG ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, addedSugarsG: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 6. Total Fat */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Total Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.fatG ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, fatG: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 7. Saturated Fat */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Saturated Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.saturatedFatG ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, saturatedFatG: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 8. Trans Fat */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Trans Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.transFatG ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, transFatG: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 9. Dietary Fibre */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Dietary Fibre (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.fibreG ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, fibreG: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 10. Sodium */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Sodium (mg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.sodiumMg ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, sodiumMg: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 11. Zinc */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Zinc (mg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingGrain.nutrition?.zincMg ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, zincMg: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 12. Magnesium */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Magnesium (mg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.magnesiumMg ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, magnesiumMg: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 13. Phosphorus */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Phosphorus (mg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.phosphorusMg ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, phosphorusMg: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 14. Iron */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Iron (mg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingGrain.nutrition?.ironMg ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, ironMg: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 15. Calcium */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Calcium (mg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.calciumMg ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, calciumMg: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>

                {/* 16. Potassium */}
                <div>
                  <label className="text-[10px] text-gray-500 block font-medium">Potassium (mg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingGrain.nutrition?.potassiumMg ?? ''}
                    onChange={(e) => setEditingGrain({
                      ...editingGrain,
                      nutrition: { ...editingGrain.nutrition, potassiumMg: e.target.value === '' ? null : Number(e.target.value) }
                    })}
                    placeholder="—"
                    className="w-full p-2 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#2e2a20] text-center font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => setEditingGrain(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingGrain}
                className="flex-1 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingGrain ? 'Saving Master...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          EDIT OPERATIONAL COST MODAL (OP-001..OP-008)
          ======================================================== */}
      {editingOpCost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveOpCost} className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
                  Edit Operational Cost
                </h3>
                <p className="text-xs text-[#C9A227] font-semibold mt-0.5">
                  {editingOpCost.costId}: {editingOpCost.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOpCost(null)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Cost ID</label>
                <input
                  type="text"
                  disabled
                  value={editingOpCost.costId}
                  className="w-full p-2.5 rounded-xl bg-gray-100 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono font-bold text-gray-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Cost Name</label>
                <input
                  type="text"
                  required
                  value={editingOpCost.name}
                  onChange={(e) => setEditingOpCost({ ...editingOpCost, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-semibold text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingOpCost.amount}
                    onChange={(e) => setEditingOpCost({ ...editingOpCost, amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono font-bold text-[#C9A227] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Package Size (kg)</label>
                  <input
                    type="number"
                    value={editingOpCost.packageSize ?? ''}
                    onChange={(e) => setEditingOpCost({ ...editingOpCost, packageSize: e.target.value })}
                    placeholder="All sizes"
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono text-gray-900 dark:text-[#fdfbf7] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Billing Unit</label>
                <input
                  type="text"
                  required
                  value={editingOpCost.unit}
                  onChange={(e) => setEditingOpCost({ ...editingOpCost, unit: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Category</label>
                <select
                  value={editingOpCost.category || 'operational'}
                  onChange={(e) => setEditingOpCost({ ...editingOpCost, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none"
                >
                  <option value="operational">Operational (Milling / Labour)</option>
                  <option value="packaging">Packaging (Pouches / Boxes)</option>
                  <option value="delivery">Logistics & Delivery</option>
                  <option value="surcharge">Surcharge / Wastage</option>
                  <option value="overhead">Overhead / Administrative</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Description</label>
                <textarea
                  rows="2"
                  value={editingOpCost.description || ''}
                  onChange={(e) => setEditingOpCost({ ...editingOpCost, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => setEditingOpCost(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Save Cost
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          CREATE NEW OPERATIONAL COST PARAMETER MODAL
          ======================================================== */}
      {newOpCostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleCreateOpCost} className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
                  Add Operational Cost Parameter
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Define a new operational rate or surcharge</p>
              </div>
              <button
                type="button"
                onClick={() => setNewOpCostModal(false)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Cost ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OP-009"
                    value={newOpCostForm.costId}
                    onChange={(e) => setNewOpCostForm({ ...newOpCostForm, costId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono font-bold text-gray-900 dark:text-[#fdfbf7] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 5.00"
                    value={newOpCostForm.amount}
                    onChange={(e) => setNewOpCostForm({ ...newOpCostForm, amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono font-bold text-[#C9A227] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Cost Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nitrogen Flushing & Vacuum Seal"
                  value={newOpCostForm.name}
                  onChange={(e) => setNewOpCostForm({ ...newOpCostForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-semibold text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Billing Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Per 5kg pouch"
                    value={newOpCostForm.unit}
                    onChange={(e) => setNewOpCostForm({ ...newOpCostForm, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Package Size (kg)</label>
                  <input
                    type="number"
                    placeholder="Optional (1, 5, 10)"
                    value={newOpCostForm.packageSize}
                    onChange={(e) => setNewOpCostForm({ ...newOpCostForm, packageSize: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono text-gray-900 dark:text-[#fdfbf7] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Category</label>
                <select
                  value={newOpCostForm.category}
                  onChange={(e) => setNewOpCostForm({ ...newOpCostForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none"
                >
                  <option value="operational">Operational</option>
                  <option value="packaging">Packaging</option>
                  <option value="delivery">Logistics & Delivery</option>
                  <option value="surcharge">Surcharge</option>
                  <option value="overhead">Overhead</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Operational details and usage rationale..."
                  value={newOpCostForm.description}
                  onChange={(e) => setNewOpCostForm({ ...newOpCostForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => setNewOpCostModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Create Parameter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          EDIT DELIVERY PARTNER MODAL (Requirement 6)
          ======================================================== */}
      {editingDp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveDpEdit} className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border-2 border-sky-500 p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
                  Edit Delivery Partner
                </h3>
                <p className="text-xs text-sky-600 dark:text-sky-400 font-semibold mt-0.5">
                  {editingDp.name} ({editingDp.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDp(null)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editingDp.name}
                  onChange={(e) => setEditingDp({ ...editingDp, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-semibold text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={editingDp.phone}
                  onChange={(e) => setEditingDp({ ...editingDp, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] font-mono text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingDp.email}
                  onChange={(e) => setEditingDp({ ...editingDp, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block mb-1">Delivery Address / Zone</label>
                <input
                  type="text"
                  value={editingDp.address || ''}
                  onChange={(e) => setEditingDp({ ...editingDp, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => setEditingDp(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingDp}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingDp ? 'Saving...' : 'Save Partner'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          RESET DELIVERY PARTNER PASSWORD MODAL (Requirement 6)
          ======================================================== */}
      {resetPasswordDp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleResetDpPassword} className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#181818] border-2 border-amber-500 p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
                  Reset Password
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  {resetPasswordDp.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordDp(null)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[11px] font-bold uppercase tracking-caps text-gray-500 block">
                New Secure Password
              </label>
              <input
                type="password"
                required
                minLength="6"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-gray-500">
                Password will be securely hashed with bcrypt (salt rounds: 10) on save.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => setResetPasswordDp(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isResettingPassword}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-1"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{isResettingPassword ? 'Resetting...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          PROCESS REFUND MODAL
          ======================================================== */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSubmitRefund} className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border-2 border-amber-500 p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-1.5">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>Record Customer Refund</span>
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                  Order #{refundModalOrder.orderNumber} • {refundModalOrder.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#a09886]">Customer Contact:</span>
                <strong className="font-mono">{refundModalOrder.customerContact || refundModalOrder.customerPhone}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#a09886]">Delivery PIN Code:</span>
                <strong className="font-mono">{refundModalOrder.customerPinCode || '—'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-[#a09886]">Original Amount Paid:</span>
                <strong className="font-mono text-[#C9A227]">₹{refundModalOrder.totalAmount}</strong>
              </div>
              {refundModalOrder.paymentDetails?.transactionId && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">Gateway Txn ID:</span>
                  <code className="text-gray-800 dark:text-gray-300 font-mono">{refundModalOrder.paymentDetails.transactionId}</code>
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Refund Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={refundForm.refundAmount}
                  onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                  placeholder="e.g. 640"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Refund Gateway / Bank UTR Reference *
                </label>
                <input
                  type="text"
                  required
                  value={refundForm.refundTransactionRef}
                  onChange={(e) => setRefundForm({ ...refundForm, refundTransactionRef: e.target.value })}
                  placeholder="e.g. REF-UPI-98471928"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] font-mono outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Enter banking UTR reference or gateway refund ID.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Admin Refund Notes
                </label>
                <textarea
                  rows="2"
                  value={refundForm.refundNotes}
                  onChange={(e) => setRefundForm({ ...refundForm, refundNotes: e.target.value })}
                  placeholder="Notes on the refund..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => setRefundModalOrder(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isProcessingRefund}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-1"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{isProcessingRefund ? 'Processing...' : 'Confirm Refund'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          FINISHED GOODS STOCK ADJUSTMENT MODAL
          ======================================================== */}
      {isAdjustStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSubmitStockAdjust} className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-[#C9A227]" />
                  <span>Adjust Finished Atta Stock</span>
                </h3>
                <p className="text-xs text-[#C9A227] font-semibold mt-0.5">
                  {selectedStockProduct?.name || 'Atta Product'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustStockModalOpen(false)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedStockProduct && (
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase">On-Hand</span>
                  <strong className="font-mono text-gray-900 dark:text-white">{selectedStockProduct.stockOnHand != null ? selectedStockProduct.stockOnHand : 100} kg</strong>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 block uppercase">Reserved</span>
                  <strong className="font-mono text-amber-600">{selectedStockProduct.stockReserved || 0} kg</strong>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 block uppercase">Available</span>
                  <strong className="font-mono text-emerald-600">{Math.max(0, (selectedStockProduct.stockOnHand != null ? selectedStockProduct.stockOnHand : 100) - (selectedStockProduct.stockReserved || 0))} kg</strong>
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Movement Type *
                </label>
                <select
                  value={adjustStockForm.movementType}
                  onChange={(e) => setAdjustStockForm({ ...adjustStockForm, movementType: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] font-semibold outline-none focus:border-[#C9A227]"
                >
                  <option value="PRODUCTION">PRODUCTION (+ Milling batch addition)</option>
                  <option value="PURCHASE">PURCHASE (+ Finished goods receipt)</option>
                  <option value="RETURN">RETURN (+ Customer return restock)</option>
                  <option value="MANUAL_ADJUSTMENT">MANUAL ADJUSTMENT (Audit count sync)</option>
                  <option value="DAMAGE">DAMAGE (- Spillage / torn pouch)</option>
                  <option value="EXPIRED">EXPIRED (- Expired stock removal)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Quantity (kg) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustStockForm.quantityKg}
                  onChange={(e) => setAdjustStockForm({ ...adjustStockForm, quantityKg: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] font-bold outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Reason / Production Batch Note *
                </label>
                <input
                  type="text"
                  required
                  value={adjustStockForm.reason}
                  onChange={(e) => setAdjustStockForm({ ...adjustStockForm, reason: e.target.value })}
                  placeholder="e.g. Batch #45 Stone Milling completion"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows="2"
                  value={adjustStockForm.notes}
                  onChange={(e) => setAdjustStockForm({ ...adjustStockForm, notes: e.target.value })}
                  placeholder="Optional internal notes..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => setIsAdjustStockModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isAdjustingStock}
                className="flex-1 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isAdjustingStock ? 'Recording...' : 'Save Stock Update'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          EDIT PRODUCT DETAILS MODAL (REQUIREMENT 4)
          ======================================================== */}
      {editingProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSubmitProductEdit} className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-1.5">
                  <Edit3 className="w-4 h-4 text-[#C9A227]" />
                  <span>Edit Product Details</span>
                </h3>
                <p className="text-xs text-[#C9A227] font-semibold mt-0.5">
                  {editingProductModal.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProductModal(null)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] font-editorial text-sm outline-none focus:border-[#C9A227]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={editProductForm.badge}
                    onChange={(e) => setEditProductForm({ ...editProductForm, badge: e.target.value })}
                    placeholder="e.g. SUGAR CARE"
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] font-bold outline-none focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                    Category
                  </label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                  >
                    <option value="specialized">Specialized Atta</option>
                    <option value="traditional">Traditional Atta</option>
                    <option value="custom">Custom Flour</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                    MRP Price (per kg / 5kg) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editProductForm.mrpPrice}
                    onChange={(e) => setEditProductForm({ ...editProductForm, mrpPrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] font-bold outline-none focus:border-[#C9A227]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                    Selling Price (per kg / 5kg) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editProductForm.sellingPrice}
                    onChange={(e) => setEditProductForm({ ...editProductForm, sellingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] font-bold text-[#C9A227] outline-none focus:border-[#C9A227]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Product Description
                </label>
                <textarea
                  rows="2"
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Dietary / Roti Making Notes
                </label>
                <textarea
                  rows="2"
                  value={editProductForm.dietaryNotes}
                  onChange={(e) => setEditProductForm({ ...editProductForm, dietaryNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                />
              </div>

              {/* Product Image Update & Remove Photo */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block mb-1">
                  Product Image / Photo
                </label>
                <div className="space-y-2 p-3 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-3">
                      {editProductImagePreview ? (
                        <img
                          src={editProductImagePreview}
                          alt="Preview"
                          className="w-12 h-12 rounded-lg object-cover border border-[#C9A227] flex-shrink-0"
                          onError={(e) => { e.currentTarget.src = "/arogyaBhog_logo.png"; }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-[#1f1a14] border border-dashed border-gray-300 dark:border-[#3e382b] flex items-center justify-center text-gray-400">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (f) {
                            setEditProductImageFile(f);
                            setEditProductImagePreview(URL.createObjectURL(f));
                            setEditProductForm(prev => ({ ...prev, removePhoto: false }));
                          }
                        }}
                        className="text-xs text-gray-600 dark:text-[#d0c5af] file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#C9A227] file:text-white"
                      />
                    </div>

                    {editProductImagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditProductImageFile(null);
                          setEditProductImagePreview(null);
                          setEditProductForm(prev => ({ ...prev, imageUrl: '', removePhoto: true }));
                        }}
                        className="py-1 px-2.5 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center space-x-1 hover:bg-rose-100 transition-colors"
                        title="Remove current photo from this product"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="url"
                      placeholder="Or enter image URL: https://..."
                      value={editProductForm.imageUrl || ''}
                      onChange={(e) => {
                        setEditProductForm({ ...editProductForm, imageUrl: e.target.value, removePhoto: false });
                        if (!editProductImageFile && e.target.value.trim()) {
                          setEditProductImagePreview(e.target.value.trim());
                        }
                      }}
                      className="w-full p-2 rounded-lg bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
                    />
                  </div>
                </div>
              </div>

              {/* Recipe Ingredients & Percentages (100% Strict Formulation) */}
              <div className="space-y-2 p-3 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20]">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-caps text-gray-700 dark:text-[#d0c5af] block">
                      Recipe Ingredients & Formulation
                    </label>
                    <span className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                      Modify grains & percentages (must balance to 100%)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const totalPct = (editProductForm.grains || []).reduce((sum, g) => sum + (Number(g.percentage) || 0), 0);
                      const isBalanced = Math.abs(totalPct - 100) < 0.05;
                      return (
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          isBalanced
                            ? 'border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {isBalanced ? '✓ 100%' : `${totalPct.toFixed(1)}% / 100%`}
                        </span>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={handleEditModalAddGrain}
                      className="py-1 px-2 rounded-lg border border-[#C9A227] text-[#C9A227] hover:bg-[#C9A227] hover:text-white dark:hover:text-[#121212] text-[10px] font-bold flex items-center space-x-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(editProductForm.grains && editProductForm.grains.length > 0) ? (
                    editProductForm.grains.map((rg, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20]">
                        <select
                          value={rg.ingredientId || rg.name}
                          onChange={(e) => handleEditModalGrainIngredientChange(idx, e.target.value)}
                          className="flex-1 p-1.5 rounded-lg bg-gray-50 dark:bg-[#131313] border border-gray-300 dark:border-[#2e2a20] text-xs font-semibold text-gray-900 dark:text-[#fdfbf7] outline-none"
                        >
                          {safeGrains.map(g => (
                            <option key={g._id} value={g.ingredientId || g.code || g.name}>
                              {g.name} [{g.ingredientId || g.code}]
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={rg.percentage}
                            onChange={(e) => handleEditModalGrainRatioChange(idx, e.target.value)}
                            className="w-14 p-1 text-center font-bold text-xs text-[#C9A227] bg-gray-50 dark:bg-[#131313] border border-gray-300 dark:border-[#2e2a20] rounded-lg outline-none font-mono"
                          />
                          <span className="text-xs font-bold text-[#C9A227]">%</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditModalRemoveGrain(idx)}
                          className="p-1 text-gray-400 hover:text-rose-500"
                          title="Remove ingredient"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-gray-500 italic p-2 text-center">
                      No custom ingredient formula specified. Click "Add" above to customize ingredients and percentages.
                    </p>
                  )}
                </div>
              </div>

              {/* Active / Deactivated Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20]">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-[#fdfbf7] block">
                    Product Storefront Status
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                    {editProductForm.isActive ? 'Active — Live in store & catalogue' : 'Deactivated — Hidden from customers'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditProductForm({ ...editProductForm, isActive: !editProductForm.isActive })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                    editProductForm.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-400'
                  }`}
                >
                  {editProductForm.isActive ? 'Active (Live)' : 'Deactivated'}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => setEditingProductModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingProductEdit}
                className="flex-1 py-2.5 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingProductEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          CHANGE PRODUCT PHOTO MODAL (DEDICATED FAST UPDATER)
          ======================================================== */}
      {photoChangeProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border-2 border-[#C9A227] p-5 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div>
                <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7] flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-[#C9A227]" />
                  <span>Change Product Photo</span>
                </h3>
                <p className="text-xs text-[#C9A227] font-semibold mt-0.5">
                  {photoChangeProductModal.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhotoChangeProductModal(null);
                  setPhotoUploadSuccess('');
                  setPhotoUploadError('');
                }}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {photoUploadSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{photoUploadSuccess}</span>
              </div>
            )}

            {photoUploadError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{photoUploadError}</span>
              </div>
            )}

            {/* Live Preview Display */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#8b826f]">
                Photo Preview
              </span>
              <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-[#C9A227] shadow-md bg-white dark:bg-[#1a1a1a] flex items-center justify-center relative">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = "/arogyaBhog_logo.png"; }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-[10px]">No Photo</span>
                  </div>
                )}
              </div>
            </div>

            {/* Option A: Upload File */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-[#d0c5af] flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Upload New Photo (JPG, PNG, WEBP)</span>
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (file) {
                    setPhotoFile(file);
                    setPhotoPreview(URL.createObjectURL(file));
                    setPhotoUrlInput('');
                    setPhotoUploadError('');
                  }
                }}
                className="w-full p-2 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-700 dark:text-[#d0c5af] file:mr-2.5 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#C9A227] file:text-white hover:file:bg-[#b8911f] file:cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 dark:text-[#8b826f]">
                Supports direct camera photos or product images from your computer or phone (up to 10MB).
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
              <div className="flex-1 h-px bg-gray-200 dark:bg-[#2e2a20]"></div>
              <span className="text-[10px] uppercase font-bold tracking-wider">OR</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-[#2e2a20]"></div>
            </div>

            {/* Option B: Enter Direct URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-[#d0c5af] flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Paste Image URL</span>
              </label>
              <input 
                type="url" 
                placeholder="https://images.unsplash.com/photo-..."
                value={photoUrlInput}
                onChange={(e) => {
                  setPhotoUrlInput(e.target.value);
                  setPhotoFile(null);
                  if (e.target.value.trim()) {
                    setPhotoPreview(e.target.value.trim());
                  }
                  setPhotoUploadError('');
                }}
                className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#131313] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => {
                  setPhotoChangeProductModal(null);
                  setPhotoUploadSuccess('');
                  setPhotoUploadError('');
                }}
                className="py-2 px-3 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-[#202020] transition-colors"
              >
                Cancel
              </button>

              {(photoPreview || photoChangeProductModal.imageUrl) && (
                <button
                  type="button"
                  onClick={handleRemovePhotoFromModal}
                  disabled={isUploadingPhoto}
                  className="py-2 px-3 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold uppercase flex items-center justify-center space-x-1 transition-all disabled:opacity-50"
                  title="Remove photo from this product"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Photo</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSavePhotoChange}
                disabled={isUploadingPhoto}
                className="flex-1 py-2 px-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-sm disabled:opacity-50"
              >
                {isUploadingPhoto ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CONFIRM DELETE PRODUCT MODAL (PRE-BUILT DELETION GUARD)
          ======================================================== */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#181818] border-2 border-rose-500 p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
              <div className="flex items-center space-x-2.5 text-rose-600 dark:text-rose-400">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="font-editorial text-base font-bold text-gray-900 dark:text-[#fdfbf7]">
                    Confirm Product Deletion
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                    Deletion Safety Confirmation
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-[#2e2a20] text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-800 dark:text-[#e5e2e1]">
                Are you sure you want to delete <strong className="text-rose-600 dark:text-rose-400 font-editorial text-base font-bold">"{productToDelete.name}"</strong>?
              </p>
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-[#1c1913] border border-amber-300 dark:border-amber-900/50 text-xs text-amber-900 dark:text-[#d0c5af] space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-amber-800 dark:text-[#C9A227]">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span>Pre-Built Product & Order History Safety</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This product will be removed from customer display. All historical customer orders, recipe specifications, and ledgers remain permanently preserved in database records.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 pt-2 border-t border-gray-200 dark:border-[#2e2a20]">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-300 dark:border-[#2e2a20] text-gray-700 dark:text-[#d0c5af] text-xs font-bold uppercase hover:bg-gray-100 dark:hover:bg-[#202020] transition-colors"
              >
                Cancel (Keep)
              </button>
              <button
                type="button"
                disabled={isDeletingProduct}
                onClick={handleConfirmDeleteProduct}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-md disabled:opacity-50"
              >
                {isDeletingProduct ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Order Dispatch & Confirmation Modal */}
      {whatsAppModalOrder && (
        <AdminWhatsAppModal
          order={whatsAppModalOrder}
          onClose={() => setWhatsAppModalOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

    </div>
  );
}
