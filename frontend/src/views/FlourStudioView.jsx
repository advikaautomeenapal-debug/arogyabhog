import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  RotateCcw, 
  Plus, 
  Minus, 
  Check, 
  Flame, 
  Heart, 
  Zap, 
  Award, 
  ArrowRight,
  Info,
  Layers,
  Scale,
  AlertCircle,
  ShoppingCart,
  Trash2,
  Package,
  ChevronDown,
  ChevronUp,
  BookOpen,
  HelpCircle,
  MapPin
} from 'lucide-react';
import { calculateProductNutrition, NUTRIENT_DEFINITIONS, formatNutrientValue } from '../utils/nutritionCalculator';
import { resolveGrainDoc, canonicalGrainName, normalizeIngredientsMap } from '../utils/grainResolver';
import { getProductSlug, PRODUCT_SEO_CATALOG, SEO_ARTICLES, SEO_FAQS } from '../utils/productSeoData';
import { getVariantTheme } from '../utils/variantThemes';

export function FlourStudioView({ 
  products, 
  grains, 
  onAddToCart, 
  onOpenCart, 
  onOpenProductDetail,
  cart,
  initialRatios,
  siteContent
}) {
  const [activeTab, setActiveTab] = useState(initialRatios ? 'customBlender' : 'doctorBlends');
  const [showCustomDetails, setShowCustomDetails] = useState(false);
  
  // REQUIREMENT 10: DO NOT PRESELECT PRE-BLEND PACKAGE SIZE AUTOMATICALLY
  // Pack size per product ID initialized as null (customer must explicitly pick 5kg or 10kg)
  const [packSizes, setPackSizes] = useState({});
  const [addingProductId, setAddingProductId] = useState(null);
  const [productValidationErrors, setProductValidationErrors] = useState({});

  // Educational Knowledge Hub & FAQ Accordion State
  const [expandedArticleId, setExpandedArticleId] = useState(null);
  const [expandedFaqId, setExpandedFaqId] = useState(null);
  const [selectedKnowledgeTab, setSelectedKnowledgeTab] = useState('articles');

  // REQUIREMENT 3: CUSTOM BLEND FIXED AT EXACTLY 10 KG
  const TARGET_CUSTOM_WEIGHT = 10; // Exactly 10 kg
  const FIXED_SERVICE_CHARGE = 100; // ₹100 grinding, mixing, packaging and delivery

  // REQUIREMENT 10: DO NOT SELECT INGREDIENTS OR PREFILL QUANTITIES AUTOMATICALLY
  // Initial custom blend ingredients: completely empty / 0 kg by default
  const [customIngredients, setCustomIngredients] = useState(() => {
    if (initialRatios && Object.keys(initialRatios).length > 0) {
      // If customer came from Ayurvedic AI consultant, load those ratios scaled to 10kg
      const initialMap = {};
      Object.entries(initialRatios).forEach(([name, pct]) => {
        if (pct > 0) {
          const canonical = canonicalGrainName(name, grains);
          initialMap[canonical] = Number(((pct / 100) * 10).toFixed(2));
        }
      });
      return initialMap;
    }
    return {}; // Empty by default
  });

  const [fineness, setFineness] = useState('Medium (Phulka)');
  const [customValidationError, setCustomValidationError] = useState('');
  const [customSuccessMessage, setCustomSuccessMessage] = useState('');

  // Prebuilt Customization & Session Timing Tracking (Requirement 3)
  const [customizingSource, setCustomizingSource] = useState(null);
  const [productInteractionTimes, setProductInteractionTimes] = useState({});
  const [blenderSessionStartTime, setBlenderSessionStartTime] = useState(() => Date.now());

  // Handle incoming ratios from Ayurvedic AI
  useEffect(() => {
    if (initialRatios && Object.keys(initialRatios).length > 0) {
      const initialMap = {};
      Object.entries(initialRatios).forEach(([name, pct]) => {
        if (pct > 0) {
          const canonical = canonicalGrainName(name, grains);
          initialMap[canonical] = Number(((pct / 100) * 10).toFixed(2));
        }
      });
      setCustomIngredients(initialMap);
      setBlenderSessionStartTime(Date.now());
      setActiveTab('customBlender');
    }
  }, [initialRatios, grains]);

  // Pre-Blend size picker
  const handleSelectPackSize = (prodId, size) => {
    setPackSizes(prev => ({ ...prev, [prodId]: size }));
    if (!productInteractionTimes[prodId]) {
      setProductInteractionTimes(prev => ({ ...prev, [prodId]: Date.now() }));
    }
    setProductValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[prodId];
      return updated;
    });
  };

  // Load Prebuilt Formula into Custom Chakki Blender (Requirement 3B)
  const handleCustomizePrebuilt = (product) => {
    const startTime = Date.now();
    setCustomizingSource({
      productId: product._id,
      variantName: product.name,
      recipeVersion: '1.0',
      originalGrains: product.grains || [],
      startedAt: startTime
    });

    const scaledIngredients = {};
    if (product.grains && Array.isArray(product.grains)) {
      product.grains.forEach(g => {
        const wt = Number(((g.percentage / 100) * TARGET_CUSTOM_WEIGHT).toFixed(2));
        if (wt > 0) {
          const canonical = canonicalGrainName(g.name, grains);
          scaledIngredients[canonical] = wt;
        }
      });
    }

    setCustomIngredients(scaledIngredients);
    setBlenderSessionStartTime(startTime);
    setActiveTab('customBlender');
    setCustomSuccessMessage(`Loaded ${product.name} formula into custom blender. You can adjust percentages, swap grains, or restore the doctor's original recipe.`);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Restore Original Prebuilt Formula (Requirement 3B)
  const handleRestoreOriginalRecipe = () => {
    if (!customizingSource?.originalGrains) return;
    const restored = {};
    customizingSource.originalGrains.forEach(g => {
      const wt = Number(((g.percentage / 100) * TARGET_CUSTOM_WEIGHT).toFixed(2));
      if (wt > 0) {
        const canonical = canonicalGrainName(g.name, grains);
        restored[canonical] = wt;
      }
    });
    setCustomIngredients(restored);
    setCustomSuccessMessage(`Restored doctor's original recipe formula for ${customizingSource.variantName}.`);
  };

  // Add Pre-Blend Product to Cart
  const handleAddProductToCart = (product) => {
    // Default to 5 kg if not explicitly selected for seamless 1-tap mobile checkout
    const selectedSize = packSizes[product._id] || 5;

    if (addingProductId === product._id) return; // Prevent duplicate clicks
    setAddingProductId(product._id);

    const packPrice = Math.round(product.sellingPrice * selectedSize);

    const grainBreakdown = product.grains ? product.grains.map(g => {
      const weightKg = Number(((g.percentage / 100) * selectedSize).toFixed(2));
      const calculatedPrice = Math.round(weightKg * (product.sellingPrice || 68));
      return {
        name: g.name,
        percentage: g.percentage,
        weightKg,
        pricePerKg: product.sellingPrice,
        calculatedPrice
      };
    }) : [];

    const now = Date.now();
    const startTime = productInteractionTimes[product._id] || now;
    const durationSeconds = Math.max(1, Math.round((now - startTime) / 1000));

    const seoItem = PRODUCT_SEO_CATALOG[getProductSlug(product)];
    const cartItem = {
      productId: product._id,
      name: product.name,
      image: product.imageUrl || product.image || seoItem?.imageUrl || '/arogyaBhog_logo.png',
      isCustom: false,
      batchSizeKg: selectedSize,
      fineness: 'Medium (Phulka)',
      grainBreakdown,
      pricePerKg: product.sellingPrice,
      quantity: 1,
      totalItemPrice: packPrice,
      selectionTimeSeconds: durationSeconds,
      selectionStartedAt: new Date(startTime).toISOString(),
      selectionCompletedAt: new Date(now).toISOString(),
      prebuiltSource: {
        variantName: product.name,
        recipeVersion: '1.0',
        originalRecipe: (product.grains || []).map(g => ({
          ...g,
          weightKg: Number(g.weightKg) || (selectedSize === 5 ? (Number(g.weightKg5kg) || Number(((Number(g.percentage || 0) / 100) * 5).toFixed(2))) : (Number(g.weightKg10kg) || Number(((Number(g.percentage || 0) / 100) * 10).toFixed(2)))) || 0
        })),
        isModified: false
      }
    };

    onAddToCart(cartItem);

    setTimeout(() => {
      setAddingProductId(null);
    }, 600);
  };

  // -------------------------------------------------------------
  // CUSTOM BLEND CALCULATIONS (REQUIREMENT 3)
  // -------------------------------------------------------------

  // Calculate cumulative weight
  const currentTotalWeight = useMemo(() => {
    const total = Object.values(customIngredients).reduce((sum, w) => sum + (Number(w) || 0), 0);
    return Number(total.toFixed(2));
  }, [customIngredients]);

  const remainingWeight = useMemo(() => {
    const rem = TARGET_CUSTOM_WEIGHT - currentTotalWeight;
    return Number(rem.toFixed(2));
  }, [currentTotalWeight]);

  // Dynamic ingredient cost calculation using latest live prices from backend
  const customPricingBreakdown = useMemo(() => {
    const grainsMap = {};
    grains.forEach(g => { 
      grainsMap[g.name] = g; 
    });

    let totalIngredientCost = 0;
    let hasPendingPrice = false;
    let pendingPriceItem = '';
    const items = [];

    Object.entries(customIngredients).forEach(([name, weight]) => {
      const w = Number(weight) || 0;
      if (w > 0) {
        const grainDoc = grainsMap[name] || resolveGrainDoc(name, grains);
        const canonicalName = grainDoc ? grainDoc.name : name;
        const isPending = grainDoc ? (grainDoc.priceStatus === 'pending_configuration' || grainDoc.pricePerKg == null) : false;
        if (isPending) {
          hasPendingPrice = true;
          pendingPriceItem = canonicalName;
        }

        const pricePerKg = grainDoc?.pricePerKg != null ? grainDoc.pricePerKg : (isPending ? null : 70);
        const cost = pricePerKg != null ? Math.round(w * pricePerKg) : 0;
        if (pricePerKg != null) {
          totalIngredientCost += cost;
        }

        items.push({
          name: canonicalName,
          weightKg: w,
          pricePerKg,
          isPending,
          cost
        });
      }
    });

    // Final Blend Price = Total Ingredient Cost + ₹100
    const finalPrice = totalIngredientCost > 0 ? (totalIngredientCost + FIXED_SERVICE_CHARGE) : 0;

    return {
      items,
      totalIngredientCost,
      serviceCharge: FIXED_SERVICE_CHARGE,
      hasPendingPrice,
      pendingPriceItem,
      finalPrice
    };
  }, [customIngredients, grains]);

  // Live Nutrition Calculation for the Custom Blend (Requirement 3C & 5)
  const customNutritionLive = useMemo(() => {
    const breakdown = customPricingBreakdown.items.map(item => ({
      name: item.name,
      percentage: Math.round((item.weightKg / TARGET_CUSTOM_WEIGHT) * 100),
      weightKg: item.weightKg
    }));
    return calculateProductNutrition(breakdown, TARGET_CUSTOM_WEIGHT, 1, grains, 50);
  }, [customPricingBreakdown, grains]);

  // Handle changing ingredient weight (in increments or exact kg)
  const handleIngredientWeightChange = (grainName, newWeight) => {
    setCustomValidationError('');
    setCustomSuccessMessage('');

    // Check if ingredient price is pending configuration
    const grainDoc = grains.find(g => g.name === grainName) || resolveGrainDoc(grainName, grains);
    if (grainDoc && (grainDoc.priceStatus === 'pending_configuration' || grainDoc.pricePerKg == null)) {
      setCustomValidationError(`"${grainDoc.name || grainName}" price is currently pending configuration by admin and cannot be added to your blend.`);
      return;
    }

    const canonical = grainDoc ? grainDoc.name : grainName;
    const parsed = Math.max(0, Math.min(TARGET_CUSTOM_WEIGHT, Number(Number(newWeight).toFixed(2))));

    // Check available stock
    if (grainDoc && parsed > (grainDoc.inStockKg || 100)) {
      setCustomValidationError(`Quantity exceeds available stock of ${grainDoc.inStockKg} kg for ${canonical}.`);
      return;
    }

    setCustomIngredients(prev => {
      const updated = { ...prev };
      delete updated[grainName];
      if (grainDoc && grainDoc.name !== grainName) {
        delete updated[grainDoc.name];
      }
      if (parsed === 0) {
        delete updated[canonical];
      } else {
        updated[canonical] = parsed;
      }
      return updated;
    });
  };

  const handleRemoveIngredient = (grainName) => {
    setCustomValidationError('');
    const grainDoc = resolveGrainDoc(grainName, grains);
    const canonical = grainDoc ? grainDoc.name : grainName;
    setCustomIngredients(prev => {
      const updated = { ...prev };
      delete updated[grainName];
      delete updated[canonical];
      return updated;
    });
  };

  // Apply preset scaled to 10 kg
  const applyPresetRatios = (preset) => {
    setCustomValidationError('');
    const newIngredients = {};
    Object.entries(preset).forEach(([name, pct]) => {
      if (pct > 0) {
        const canonical = canonicalGrainName(name, grains);
        newIngredients[canonical] = Number(((pct / 100) * 10).toFixed(2));
      }
    });
    setCustomIngredients(newIngredients);
  };

  // Add Custom Blend to Cart with Validation
  const handleAddCustomToCart = () => {
    setCustomValidationError('');
    setCustomSuccessMessage('');

    if (currentTotalWeight < TARGET_CUSTOM_WEIGHT) {
      setCustomValidationError('Please select ingredients totaling exactly 10 kg before adding your custom blend to the cart.');
      return;
    }

    if (currentTotalWeight > TARGET_CUSTOM_WEIGHT) {
      setCustomValidationError(`Selected weight (${currentTotalWeight} kg) exceeds 10 kg. Please adjust ingredient quantities to total exactly 10 kg.`);
      return;
    }

    if (customPricingBreakdown.items.length === 0) {
      setCustomValidationError('Please select ingredients totaling exactly 10 kg before adding your custom blend to the cart.');
      return;
    }

    if (customPricingBreakdown.hasPendingPrice) {
      setCustomValidationError(`"${customPricingBreakdown.pendingPriceItem}" rate is currently pending configuration by admin. Please remove it to proceed.`);
      return;
    }

    const grainBreakdown = customPricingBreakdown.items.map(item => {
      const grainDoc = resolveGrainDoc(item.name, grains);
      return {
        grainId: grainDoc ? grainDoc._id : undefined,
        name: grainDoc ? grainDoc.name : item.name,
        percentage: Math.round((item.weightKg / TARGET_CUSTOM_WEIGHT) * 100),
        weightKg: item.weightKg,
        pricePerKg: item.pricePerKg,
        calculatedPrice: item.cost
      };
    });

    const now = Date.now();
    const startTime = customizingSource?.startedAt || blenderSessionStartTime || now;
    const durationSeconds = Math.max(1, Math.round((now - startTime) / 1000));

    const customCartItem = {
      productId: customizingSource?.productId || undefined,
      name: customizingSource ? `${customizingSource.variantName} (Bespoke Formula - 10 kg)` : 'Custom Chakki Blend (10 kg)',
      isCustom: true,
      batchSizeKg: 10,
      fineness,
      grainBreakdown,
      pricePerKg: Number((customPricingBreakdown.finalPrice / 10).toFixed(1)),
      quantity: 1,
      totalItemPrice: customPricingBreakdown.finalPrice,
      selectionTimeSeconds: durationSeconds,
      selectionStartedAt: new Date(startTime).toISOString(),
      selectionCompletedAt: new Date(now).toISOString(),
      prebuiltSource: customizingSource ? {
        variantName: customizingSource.variantName,
        recipeVersion: customizingSource.recipeVersion || '1.0',
        originalRecipe: customizingSource.originalGrains || [],
        isModified: true
      } : null
    };

    onAddToCart(customCartItem);
    setCustomSuccessMessage(customizingSource ? `Added 10 kg Bespoke ${customizingSource.variantName} to your Cart!` : 'Added 10 kg Custom Chakki Blend to your Cart!');
    setTimeout(() => setCustomSuccessMessage(''), 4000);
  };

  const isCustomBlendReady = currentTotalWeight === TARGET_CUSTOM_WEIGHT;

  return (
    <div className="pb-24">
      
      {/* Top Banner Notice (Only rendered if admin sets an active custom announcement, NOT the removed tagline) */}
      {siteContent?.topBannerActive && siteContent?.topBannerText && siteContent.topBannerText !== '100% Traditional Slow Stone Cold-Ground • Below 35°C' && (
        <div className="bg-amber-50/70 dark:bg-[#1B1B1C] border-b border-gray-200 dark:border-[#2E2A20] px-4 py-2 flex items-center justify-between text-xs transition-colors">
          <div className="flex items-center space-x-2 text-[#C9A227]">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
            <span className="font-sans font-medium text-[11px] md:text-xs text-gray-800 dark:text-[#E5E2E1]">
              {siteContent.topBannerText}
            </span>
          </div>
          {siteContent?.topBannerBadge && (
            <div className="border border-[#C9A227]/30 rounded-lg px-2 py-0.5 text-[10px] uppercase font-bold text-[#C9A227] tracking-caps bg-white dark:bg-[#121212]">
              {siteContent.topBannerBadge}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Announcement Notice if active */}
      {siteContent?.announcementActive && siteContent?.announcementNotice && (
        <div className="bg-[#C9A227]/10 border-b border-[#C9A227]/20 px-4 py-1.5 text-center text-xs text-amber-900 dark:text-[#E5C158] font-medium flex items-center justify-center space-x-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#C9A227]" />
          <span>{siteContent.announcementNotice}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-3.5 md:px-6 pt-5">
        
        {/* VIEW SWITCHER PILLS */}
        <div className="grid grid-cols-2 p-1.5 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2A20] rounded-2xl mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('doctorBlends')}
            className={`py-3 px-4 font-sans text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'doctorBlends'
                ? 'bg-[#C9A227] text-white shadow-md'
                : 'text-gray-600 dark:text-[#D0C5AF] hover:text-gray-900 dark:hover:text-[#FDFBF7]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Doctor Blends ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customBlender')}
            className={`py-3 px-4 font-sans text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all relative ${
              activeTab === 'customBlender'
                ? 'bg-[#C9A227] text-white shadow-md'
                : 'text-gray-600 dark:text-[#D0C5AF] hover:text-gray-900 dark:hover:text-[#FDFBF7]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Custom Blend (10 kg)</span>
            <span className={`text-[9px] px-1.5 py-0.2 uppercase font-extrabold rounded-md border ${
              activeTab === 'customBlender'
                ? 'border-white/40 bg-white/20 text-white'
                : 'border-emerald-500/50 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
            }`}>
              10 KG
            </span>
          </button>
        </div>

        {/* ========================================================
            TAB 1: DOCTOR BLENDS (PRE-BLENDED PRODUCTS)
            Requirements 2, 4, 9, 10
            ======================================================== */}
        {activeTab === 'doctorBlends' && (
          <div className="space-y-5 animate-fadeIn">
            
            <div className="flex items-end justify-between border-b border-gray-200 dark:border-[#2E2A20] pb-3">
              <div>
                <h2 className="font-editorial text-xl md:text-2xl font-bold text-gray-900 dark:text-[#FDFBF7]">
                  Signature Multigrain Formulas
                </h2>
                <p className="font-sans text-xs text-gray-600 dark:text-[#99907C] mt-0.5">
                  Select package size (5 kg or 10 kg) and add freshly stone-milled flours to your cart
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227] border border-[#C9A227]/40 rounded-lg px-2.5 py-1 bg-amber-50/50 dark:bg-[#1A1A1A]">
                {products.filter(p => p.productType !== 'custom').length} DOCTOR FORMULAS
              </span>
            </div>

            <div className="space-y-4">
              {products.filter(p => p.productType !== 'custom').map((product) => {
                const selectedSize = packSizes[product._id]; // null if not selected yet
                const currentPack = selectedSize || 5;
                const packPrice = Math.round(product.sellingPrice * currentPack);
                const hasValidationError = !!productValidationErrors[product._id];
                const isAdding = addingProductId === product._id;

                // Reactive cart state detection
                const cartItem = (cart || []).find(item => 
                  (item.productId === product._id || item.name === product.name) && 
                  Number(item.batchSizeKg) === Number(currentPack)
                );
                const inCartQty = cartItem ? (cartItem.quantity || 1) : 0;

                const slug = getProductSlug(product);
                const seoProduct = PRODUCT_SEO_CATALOG[slug];
                const theme = getVariantTheme(slug);

                // Dynamically source authentic recipe ingredients
                const recipeGrains = (product.grains && product.grains.length > 0)
                  ? product.grains
                  : (seoProduct?.ingredients || []);

                const mrpPerKg = product.mrpPrice && product.mrpPrice > product.sellingPrice 
                  ? product.mrpPrice 
                  : Math.round(product.sellingPrice * 1.15);
                const mrpPackPrice = Math.round(mrpPerKg * currentPack);
                const discountPercent = mrpPackPrice > packPrice 
                  ? Math.round(((mrpPackPrice - packPrice) / mrpPackPrice) * 100) 
                  : 0;

                return (
                  <div
                    key={product._id}
                    className={`relative overflow-hidden rounded-2xl border ${theme.cardBorder} bg-white dark:bg-[#181818] shadow-sm hover:shadow-xl transition-all duration-300 group`}
                  >
                    {/* Realistic Ingredient-Inspired Background with Atmospheric Dusting & Scrim */}
                    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                      <img
                        src={theme.bgImage}
                        alt={product.name}
                        className="w-full h-full object-cover object-right md:object-center opacity-30 dark:opacity-20 transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        loading="lazy"
                      />
                      {/* High-contrast multi-stop scrim ensuring 100% text readability */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/75 dark:from-[#181818]/95 dark:via-[#181818]/90 dark:to-[#181818]/75" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/40 dark:from-[#181818]/90 dark:via-transparent dark:to-[#181818]/40" />
                    </div>

                    {/* Interactive Content Container */}
                    <div className="relative z-10 p-3.5 sm:p-5 flex flex-col justify-between space-y-3.5">
                      
                      {/* Top Section: Info, Pricing & Quick Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        
                        {/* Left: Product Information */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${theme.badgeClass}`}>
                              {product.badge || theme.badge}
                            </span>
                            <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                              Arogya Assured ✓
                            </span>
                          </div>

                          <h3 
                            onClick={() => onOpenProductDetail && onOpenProductDetail(slug)}
                            className="font-bold text-base sm:text-lg text-gray-950 dark:text-[#FDFBF7] group-hover:text-[#C9A227] transition-colors leading-snug cursor-pointer line-clamp-1"
                            title={product.name}
                          >
                            {product.name}
                          </h3>

                          {/* Short Purpose / Positioning Line (Mobile & Desktop priority) */}
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-[#C5BAA5] font-medium line-clamp-1">
                            {theme.positioning}
                          </p>

                          {/* Flipkart Pricing Row */}
                          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
                            <span className="font-sans font-black text-lg sm:text-xl text-gray-950 dark:text-white">
                              ₹{packPrice}
                            </span>
                            {mrpPackPrice > packPrice && (
                              <span className="text-xs text-gray-400 dark:text-[#888] line-through font-medium">
                                ₹{mrpPackPrice}
                              </span>
                            )}
                            {discountPercent > 0 && (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {discountPercent}% off
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-800/40">
                              Free Delivery
                            </span>
                          </div>

                          {/* Pack Size Selector Chips */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-[#A09885] uppercase tracking-wider">
                              Pack:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSelectPackSize(product._id, 5)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                                  currentPack === 5
                                    ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#C9A227] shadow-xs'
                                    : 'border-gray-200 dark:border-[#2E2A20] text-gray-700 dark:text-[#BBB] hover:border-gray-400 bg-white/70 dark:bg-[#141414]/70'
                                }`}
                              >
                                5 kg
                              </button>
                              <button
                                onClick={() => handleSelectPackSize(product._id, 10)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                                  currentPack === 10
                                    ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#C9A227] shadow-xs'
                                    : 'border-gray-200 dark:border-[#2E2A20] text-gray-700 dark:text-[#BBB] hover:border-gray-400 bg-white/70 dark:bg-[#141414]/70'
                                }`}
                              >
                                10 kg
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right: Flipkart Quick Actions */}
                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60 dark:border-[#2E2A20]">
                          <button
                            onClick={() => handleAddProductToCart(product)}
                            disabled={isAdding}
                            className={`flex-1 sm:flex-initial py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer min-w-[130px] ${
                              inCartQty > 0
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600'
                                : 'bg-[#C9A227] hover:bg-[#B58F1E] text-white'
                            }`}
                          >
                            {inCartQty > 0 ? (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : (
                              <ShoppingCart className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {isAdding
                                ? 'Adding...'
                                : inCartQty > 0
                                  ? inCartQty === 1
                                    ? 'Added ✓'
                                    : `Added ✓ (${inCartQty})`
                                  : `Add to Cart`}
                            </span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenProductDetail && onOpenProductDetail(slug)}
                              className="py-1 px-3 rounded-lg border border-gray-300 dark:border-[#2E2A20] hover:border-[#C9A227] text-gray-700 dark:text-[#BBB] hover:text-[#C9A227] font-semibold text-xs flex items-center space-x-1 transition-all bg-white/60 dark:bg-[#141414]/60"
                              title="View Recipe & Nutrition"
                            >
                              <Info className="w-3 h-3" />
                              <span>Details</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCustomizePrebuilt(product)}
                              className="py-1 px-3 rounded-lg border border-[#C9A227]/50 text-[#C9A227] hover:bg-[#C9A227] hover:text-white font-semibold text-xs flex items-center space-x-1 transition-all hidden sm:inline-flex bg-amber-50/40 dark:bg-[#141414]/60"
                              title="Customize in blender"
                            >
                              <Sliders className="w-3 h-3" />
                              <span>Customize</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop-Only: WHAT'S INSIDE Ingredient Table & Benefits (Hidden on Mobile) */}
                      <div className={`hidden md:block pt-3 border-t border-gray-200/60 dark:border-[#2E2A20]/80 rounded-xl ${theme.tableBg} p-3.5 border`}>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/50 dark:border-[#2E2A20]">
                          <div className="flex items-center space-x-2">
                            <Layers className="w-3.5 h-3.5 text-[#C9A227]" />
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-[#FDFBF7]">
                              What's Inside ({recipeGrains.length} Whole Ingredients)
                            </h4>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-[#A09885] tracking-wide">
                            Stone Cold-Ground Recipe
                          </span>
                        </div>

                        {/* Grid of Ingredients with Prominent Percentages */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {recipeGrains.map((grain, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/90 dark:bg-[#151515]/90 border border-gray-200/70 dark:border-[#2E2A20] shadow-2xs transition-colors ${theme.rowTint}`}
                            >
                              <span className="text-xs font-semibold text-gray-900 dark:text-[#E8DFC8] truncate pr-1" title={grain.name}>
                                {grain.name}
                              </span>
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded border font-mono tracking-tight shrink-0 ${theme.pctBadge}`}>
                                {grain.percentage}%
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Ingredient Benefit Highlights */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-2.5 mt-2.5 border-t border-gray-200/50 dark:border-[#2E2A20]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-[#A09885]">
                            Nutritional Highlights:
                          </span>
                          {theme.benefits.map((benefit, bIdx) => (
                            <span
                              key={bIdx}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${theme.benefitBadgeClass}`}
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {/* PRODUCT 6: MY CHOICE ATTA (Bespoke Customer Blend strictly 10 kg) */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#C9A227] bg-white dark:bg-[#181818] shadow-sm hover:shadow-xl transition-all duration-300 group">
                {/* Variant-Specific Realistic Studio Background */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  <img
                    src="/variants/my-choice-atta.jpg"
                    alt="My Choice Atta"
                    className="w-full h-full object-cover object-right md:object-center opacity-30 dark:opacity-20 transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-white/90 to-white/75 dark:from-[#1c1a14]/95 dark:via-[#1c1a14]/90 dark:to-[#181818]/75" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-white/40 dark:from-[#181818]/90 dark:via-transparent dark:to-[#181818]/40" />
                </div>

                <div className="relative z-10 p-3.5 sm:p-5 flex flex-col justify-between space-y-3.5">
                  {/* Top Row: Info & Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border border-[#C9A227] text-[#C9A227] bg-[#C9A227]/10">
                          CUSTOMER BESPOKE BLEND • 10 KG
                        </span>
                        <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                          Assured ✓
                        </span>
                      </div>

                      <h3 
                        onClick={() => onOpenProductDetail && onOpenProductDetail('my-choice-atta')}
                        className="font-bold text-base sm:text-lg text-gray-950 dark:text-[#FDFBF7] hover:text-[#C9A227] transition-colors leading-snug cursor-pointer line-clamp-1"
                        title="View My Choice Atta Details"
                      >
                        My Choice Atta
                      </h3>

                      {/* Short Positioning 1-Liner */}
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-[#C5BAA5] font-medium line-clamp-1">
                        Customize your blend to suit your preferences.
                      </p>

                      {/* Flipkart Pricing Row */}
                      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
                        <span className="font-sans font-black text-lg sm:text-xl text-[#C9A227]">
                          ₹85/kg
                        </span>
                        <span className="text-xs font-bold text-gray-600 dark:text-[#AAA]">
                          (Avg • 10 kg Batch)
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-800/40">
                          Free Delivery
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60 dark:border-[#2E2A20]">
                      <button
                        onClick={() => setActiveTab('customBlender')}
                        className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-[#C9A227] hover:bg-[#B58F1E] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-sm min-w-[150px] cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Open Blender (10 kg)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenProductDetail && onOpenProductDetail('my-choice-atta')}
                        className="py-1 px-3 rounded-lg border border-gray-300 dark:border-[#2E2A20] hover:border-[#C9A227] text-gray-700 dark:text-[#BBB] hover:text-[#C9A227] font-semibold text-xs flex items-center space-x-1 transition-all bg-white/60 dark:bg-[#141414]/60"
                        title="View Details"
                      >
                        <Info className="w-3 h-3" />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop-Only: 18 Master Grains Studio Info & Highlights */}
                  <div className="hidden md:block pt-3 border-t border-[#C9A227]/30 rounded-xl bg-amber-50/50 dark:bg-[#1a1710] p-3.5 border border-[#C9A227]/20">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#C9A227]/20">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-3.5 h-3.5 text-[#C9A227]" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-[#FDFBF7]">
                          What's Inside (18 Master Whole Grains & Seeds Studio)
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold text-[#C9A227] tracking-wide">
                        Bespoke Ratios
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-[#B8AF9C] leading-relaxed">
                      Select your exact ratios in our live chakki blender: MP Sharbati Wheat, Roasted Chana, Barley (Jau), Amaranth (Rajgira), Ragi, Jowar, Bajra, Oats, Quinoa, Soybean, Chia, Flax, White Sesame, Methi Dana, Makka, and Water Chestnut (Singhada).
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-2.5 mt-2.5 border-t border-[#C9A227]/20">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-[#A09885]">
                        Nutritional Highlights:
                      </span>
                      {['18 Master Grains', '100% Custom Ratios', 'Fresh Stone Milled', 'Exact 10 kg Batch'].map((b, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-[#C9A227] dark:border-[#C9A227]/40"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: CUSTOM CHAKKI BLENDER (EXACTLY 10 KG PER ORDER)
            Requirements 3, 9, 10
            ======================================================== */}
        {activeTab === 'customBlender' && (
          <div className="space-y-6 animate-fadeIn relative">
            
            {/* ========================================================
                REQUIREMENT 3B: LIVE WEIGHT AND PRICE STICKY POPUP / SUMMARY
                Visible near the top of the viewport updating immediately
                ======================================================== */}
            {/* ========================================================
                REQUIREMENT 1: COMPACT HORIZONTAL PROGRESS-STATUS BAR
                Replaces oversized popup card with a slim, responsive 2-color bar
                ======================================================== */}
            <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md px-3.5 py-2.5 md:px-4 md:py-3 border border-gray-200 dark:border-[#2E2A20] rounded-2xl shadow-lg space-y-2 transition-all">
              
              {/* Compact Header Row: Weight metrics, price, and CTA */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isCustomBlendReady
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600/40'
                      : currentTotalWeight > TARGET_CUSTOM_WEIGHT
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-600/40'
                      : 'bg-amber-50 dark:bg-[#201D14] text-[#C9A227] border border-[#C9A227]/40'
                  }`}>
                    {isCustomBlendReady ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Scale className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="font-sans font-bold text-xs md:text-sm text-gray-900 dark:text-[#FDFBF7]">
                        {currentTotalWeight} kg / {TARGET_CUSTOM_WEIGHT} kg
                      </span>
                      <span className="text-[11px] font-mono text-gray-500 dark:text-[#8B826F]">
                        ({Math.min(100, Math.round((currentTotalWeight / TARGET_CUSTOM_WEIGHT) * 100))}%)
                      </span>
                      <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
                      <span className={`text-[11px] font-semibold hidden sm:inline ${
                        isCustomBlendReady
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : remainingWeight < 0
                          ? 'text-rose-500 font-bold'
                          : 'text-[#C9A227]'
                      }`}>
                        {isCustomBlendReady 
                          ? 'Ready to Add' 
                          : remainingWeight < 0 
                          ? `Exceeds by ${Math.abs(remainingWeight)} kg` 
                          : `${remainingWeight} kg remaining`}
                      </span>
                    </div>
                    {/* Mobile sub-indicator */}
                    <span className={`text-[10px] font-semibold block sm:hidden ${
                      isCustomBlendReady
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : remainingWeight < 0
                        ? 'text-rose-500'
                        : 'text-[#C9A227]'
                    }`}>
                      {isCustomBlendReady 
                        ? '10 kg Complete — Ready to Add' 
                        : remainingWeight < 0 
                        ? `Over by ${Math.abs(remainingWeight)} kg` 
                        : `${remainingWeight} kg remaining`}
                    </span>
                  </div>
                </div>

                {/* Right side: Final Price, Details toggle & Add to Cart button */}
                <div className="flex items-center space-x-2 ml-auto">
                  <div className="text-right pr-1">
                    <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-[#8B826F] block leading-none">
                      Payable
                    </span>
                    <span className="font-sans font-bold text-sm md:text-base text-[#C9A227] leading-tight">
                      ₹{customPricingBreakdown.finalPrice}
                    </span>
                  </div>

                  {/* Expandable Breakdown Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowCustomDetails(!showCustomDetails)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-[#2E2A20] hover:border-[#C9A227] text-gray-500 hover:text-gray-900 dark:hover:text-[#FDFBF7] transition-all text-[11px] flex items-center space-x-1"
                    title={showCustomDetails ? 'Hide Details' : 'View Breakdown & Pricing'}
                  >
                    <span className="text-[10px] uppercase font-bold hidden md:inline">
                      {showCustomDetails ? 'Hide' : 'Details'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showCustomDetails ? 'rotate-180 text-[#C9A227]' : ''}`} />
                  </button>

                  {/* Compact Add to Cart Button */}
                  <button
                    onClick={handleAddCustomToCart}
                    disabled={!isCustomBlendReady}
                    className={`py-2 px-3.5 md:px-4 rounded-xl font-bold text-xs uppercase tracking-caps flex items-center space-x-1.5 transition-all shadow-sm ${
                      isCustomBlendReady
                        ? 'bg-[#C9A227] hover:bg-[#B58F1E] text-white cursor-pointer shadow-md'
                        : 'bg-gray-100 dark:bg-[#202020] border border-gray-200 dark:border-[#2E2A20] text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{isCustomBlendReady ? 'Add to Cart' : 'Add to Cart'}</span>
                  </button>
                </div>
              </div>

              {/* Two-color progress bar (lighter background + darker brand filled portion) */}
              <div className="w-full bg-gray-200 dark:bg-[#28251e] h-2 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isCustomBlendReady 
                      ? 'bg-emerald-500' 
                      : currentTotalWeight > TARGET_CUSTOM_WEIGHT 
                      ? 'bg-rose-500' 
                      : 'bg-[#C9A227]'
                  }`}
                  style={{ width: `${Math.min(100, (currentTotalWeight / TARGET_CUSTOM_WEIGHT) * 100)}%` }}
                />
              </div>

              {/* Validation alert / Error Message */}
              {customValidationError && (
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/50 text-amber-900 dark:text-amber-300 text-xs flex items-center space-x-2 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-medium">{customValidationError}</span>
                </div>
              )}

              {customSuccessMessage && (
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
                  <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                  <span className="text-[11px] font-medium">{customSuccessMessage}</span>
                </div>
              )}

              {/* Expandable Details Accordion without internal scrollbar */}
              {showCustomDetails && (
                <div className="pt-2 border-t border-gray-100 dark:border-[#2E2A20] space-y-2 animate-fadeIn">
                  {customPricingBreakdown.items.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {customPricingBreakdown.items.map((item, idx) => (
                          <span 
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2E2A20] text-gray-800 dark:text-[#E5E2E1] flex items-center space-x-1"
                          >
                            <span className="font-bold text-[#C9A227]">{item.weightKg} kg</span>
                            <span>{item.name}</span>
                            <span className="text-gray-400">({item.cost}₹)</span>
                            <button
                              onClick={() => handleRemoveIngredient(item.name)}
                              className="text-gray-400 hover:text-rose-500 pl-0.5"
                              title="Remove"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-gray-700 dark:text-[#D0C5AF] pt-1">
                        <span>
                          Ingredient Cost: <strong className="text-gray-900 dark:text-[#FDFBF7]">₹{customPricingBreakdown.totalIngredientCost}</strong> + Service Fee: <strong className="text-gray-900 dark:text-[#FDFBF7]">₹{FIXED_SERVICE_CHARGE}</strong>
                        </span>
                        <span className="font-bold text-[#C9A227]">
                          = Total ₹{customPricingBreakdown.finalPrice}
                        </span>
                      </div>

                      {/* Live Calculated 16-Nutrient Panel (Requirement 3C & 5) */}
                      <div className="pt-2 border-t border-gray-200 dark:border-[#2e2a20] space-y-1.5">
                        <span className="text-[10px] font-bold text-[#C9A227] uppercase tracking-caps block">
                          LIVE ESTIMATED NUTRITION (PER 100 G / 50 G SERVING):
                        </span>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px] text-center">
                          <div className="p-1 rounded bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2e2a20]">
                            <span className="text-gray-400 block text-[9px]">Energy</span>
                            <strong className="text-gray-900 dark:text-white">{formatNutrientValue(customNutritionLive?.per100g?.energyKcal, 'kcal')}</strong>
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2e2a20]">
                            <span className="text-gray-400 block text-[9px]">Protein</span>
                            <strong className="text-gray-900 dark:text-white">{formatNutrientValue(customNutritionLive?.per100g?.proteinG, 'g')}</strong>
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2e2a20]">
                            <span className="text-gray-400 block text-[9px]">Carbs</span>
                            <strong className="text-gray-900 dark:text-white">{formatNutrientValue(customNutritionLive?.per100g?.carbsG, 'g')}</strong>
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2e2a20]">
                            <span className="text-gray-400 block text-[9px]">Dietary Fibre</span>
                            <strong className="text-emerald-600 dark:text-emerald-400">{formatNutrientValue(customNutritionLive?.per100g?.fibreG, 'g')}</strong>
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2e2a20]">
                            <span className="text-gray-400 block text-[9px]">Iron</span>
                            <strong className="text-gray-900 dark:text-white">{formatNutrientValue(customNutritionLive?.per100g?.ironMg, 'mg')}</strong>
                          </div>
                          <div className="p-1 rounded bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2e2a20]">
                            <span className="text-gray-400 block text-[9px]">Calcium</span>
                            <strong className="text-[#C9A227]">{formatNutrientValue(customNutritionLive?.per100g?.calciumMg, 'mg')}</strong>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-1 text-[11px] text-gray-500 dark:text-[#8B826F] italic">
                      No ingredients selected yet. Allocate exactly 10 kg from the ingredient catalog below.
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* REQUIREMENT 3B: EDITABLE PREBUILT FORMULA BANNER */}
            {customizingSource && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-[#C9A227] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-[#C9A227] uppercase tracking-caps">
                    <Sliders className="w-4 h-4" />
                    <span>CUSTOMIZING DOCTOR FORMULA: {customizingSource.variantName}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-[#99907C]">
                    Fine-tune ingredient percentages or swap grains. Total blend must equal exactly 10 kg (100%).
                  </p>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleRestoreOriginalRecipe}
                    className="px-3.5 py-1.5 rounded-xl border border-[#C9A227] text-[#C9A227] hover:bg-[#C9A227] hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                    title="Restore doctor's original blend formula"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Original</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomizingSource(null);
                      setCustomIngredients({});
                    }}
                    className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-[#333333] text-gray-500 dark:text-gray-400 hover:text-red-500 text-xs font-medium transition-all"
                    title="Clear and start blank blend"
                  >
                    Clear Formula
                  </button>
                </div>
              </div>
            )}

            {/* Header info */}
            <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2E2A20] pb-3 pt-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-editorial text-xl md:text-2xl font-bold text-gray-900 dark:text-[#FDFBF7]">
                    Custom Chakki Blender
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <p className="font-sans text-xs text-gray-600 dark:text-[#99907C] mt-0.5">
                  Select ingredients and weights manually to create your personalized 10 kg atta batch
                </p>
              </div>

              <div className="border border-[#C9A227]/40 bg-amber-50/50 dark:bg-[#1A1A1A] px-2.5 py-1 rounded-xl text-[11px] font-bold text-[#C9A227] flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]"></span>
                <span>Chakki: #4</span>
              </div>
            </div>

            {/* Quick Ayurvedic Formulations presets (scaled to 10 kg) */}
            <div className="space-y-2">
              <span className="font-bold text-[#C9A227] uppercase tracking-caps text-[11px] block">
                PRE-CALIBRATED AYURVEDIC BENCHMARKS (10 KG):
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { 
                    id: 'softRoti', 
                    icon: Award, 
                    label: 'Soft Roti Daily', 
                    sub: 'Family favorite (7.5kg Gehu)', 
                    ratios: { 
                      'Sharbati Wheat': 75, 
                      'Bengal Gram (Chana)': 8, 
                      'Barley (Jau)': 5, 
                      'Soybean': 4, 
                      'Sorghum (Jowar)': 3, 
                      'Finger Millet (Ragi)': 2, 
                      'Pearl Millet (Bajra)': 2, 
                      'Flax Seeds (Alsi)': 1 
                    } 
                  },
                  { 
                    id: 'diabetic', 
                    icon: Heart, 
                    label: 'Diabetic Care', 
                    sub: 'Low-GI barley blend', 
                    ratios: { 
                      'Sharbati Wheat': 50, 
                      'Barley (Jau)': 15, 
                      'Bengal Gram (Chana)': 10, 
                      'Sorghum (Jowar)': 8, 
                      'Soybean': 5, 
                      'Finger Millet (Ragi)': 5, 
                      'Pearl Millet (Bajra)': 4, 
                      'Flax Seeds (Alsi)': 3 
                    } 
                  },
                  { 
                    id: 'protein', 
                    icon: Zap, 
                    label: 'Gym High-Protein', 
                    sub: 'Defatted soy & chana', 
                    ratios: { 
                      'Sharbati Wheat': 60, 
                      'Soybean': 15, 
                      'Bengal Gram (Chana)': 12, 
                      'Barley (Jau)': 8, 
                      'Flax Seeds (Alsi)': 3, 
                      'Oats': 2 
                    } 
                  },
                  { 
                    id: 'thyroid', 
                    icon: Flame, 
                    label: 'Thyroid Balance', 
                    sub: 'Amaranth & Chia blend', 
                    ratios: { 
                      'Amaranth (Rajgira)': 40, 
                      'Sorghum (Jowar)': 25, 
                      'Bengal Gram (Chana)': 15, 
                      'Finger Millet (Ragi)': 10, 
                      'Chia Seeds': 5, 
                      'Flax Seeds (Alsi)': 5 
                    } 
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => applyPresetRatios(item.ratios)}
                      className="p-3 border border-gray-200 dark:border-[#2E2A20] hover:border-[#C9A227] rounded-xl bg-white dark:bg-[#181818] text-left text-xs transition-all shadow-sm group"
                    >
                      <div className="flex items-center space-x-1.5 text-[#C9A227]">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="font-bold uppercase text-[10px]">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-[#99907C] block mt-0.5">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRAIN CATALOGUE & QUANTITY ALLOCATION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2E2A20] pb-2">
                <div>
                  <h3 className="font-editorial text-lg font-bold text-gray-900 dark:text-[#FDFBF7]">
                    INGREDIENT SELECTION & WEIGHTS
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-[#99907C]">
                    Add ingredients by weight. Cumulative weight must reach exactly 10 kg.
                  </p>
                </div>

                <button
                  onClick={() => setCustomIngredients({})}
                  className="flex items-center space-x-1 text-[11px] text-[#C9A227] hover:text-[#B58F1E] font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>

              {/* List of Available Ingredients from Backend */}
              <div className="space-y-3">
                {grains.map((grain) => {
                  const isPendingPrice = grain.priceStatus === 'pending_configuration' || grain.pricePerKg == null;
                  const currentKg = customIngredients[grain.name] || 0;
                  const itemCost = isPendingPrice ? 0 : Math.round(currentKg * (grain.pricePerKg || 0));

                  return (
                    <div
                      key={grain._id || grain.name}
                      className={`p-4 rounded-2xl border transition-all shadow-sm ${
                        currentKg > 0 
                          ? 'bg-amber-50/40 dark:bg-[#1E1B14] border-[#C9A227]' 
                          : isPendingPrice
                          ? 'bg-amber-50/20 dark:bg-[#181612] border-amber-200 dark:border-amber-900/30'
                          : 'bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2E2A20] hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span 
                              className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" 
                              style={{ backgroundColor: grain.color || '#C9A227' }} 
                            />
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="font-sans font-bold text-sm text-gray-900 dark:text-[#FDFBF7]">
                                {grain.name}
                              </h4>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-gray-100 dark:bg-[#141414] text-gray-600 dark:text-[#99907C] border border-gray-200 dark:border-[#2E2A20]">
                                {grain.ingredientId || grain.code}
                              </span>
                              <span className="text-[10px] text-gray-500 dark:text-[#8B826F]">
                                • {grain.category}
                              </span>
                            </div>
                            {isPendingPrice ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40 font-semibold">
                                ⚠️ Price Pending
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-[#141414] text-[#C9A227] font-semibold">
                                ₹{grain.pricePerKg}/kg
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-[#8B826F]">
                            {grain.subtitle || grain.benefits}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-sans font-bold text-base text-[#C9A227]">
                            {currentKg} kg
                          </span>
                          {currentKg > 0 && (
                            <span className="text-[11px] text-gray-600 dark:text-[#D0C5AF] block font-mono">
                              ₹{itemCost}
                            </span>
                          )}
                        </div>
                      </div>

                      {isPendingPrice ? (
                        <div className="pt-2 text-[11px] text-amber-700 dark:text-amber-400 flex items-center space-x-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Rate is awaiting administrator configuration. Cannot be added to custom blends yet.</span>
                        </div>
                      ) : (
                        /* Weight Steppers & Direct Input */
                        <div className="flex items-center space-x-2 pt-2">
                          <button
                            onClick={() => handleIngredientWeightChange(grain.name, Math.max(0, currentKg - 0.5))}
                            className="w-8 h-8 rounded-xl border border-gray-200 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#141414] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-800 dark:text-[#FDFBF7] flex items-center justify-center transition-all shadow-sm"
                            title="Decrease 0.5 kg"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max={TARGET_CUSTOM_WEIGHT}
                              value={currentKg || ''}
                              placeholder="0.0"
                              onChange={(e) => handleIngredientWeightChange(grain.name, e.target.value)}
                              className="w-16 p-1.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2A20] text-center font-bold text-xs text-gray-900 dark:text-[#FDFBF7] outline-none focus:border-[#C9A227]"
                            />
                            <span className="text-xs text-gray-500">kg</span>
                          </div>

                          <button
                            onClick={() => handleIngredientWeightChange(grain.name, currentKg + 0.5)}
                            className="w-8 h-8 rounded-xl border border-gray-200 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#141414] hover:bg-gray-100 dark:hover:bg-[#252525] text-gray-800 dark:text-[#FDFBF7] flex items-center justify-center transition-all shadow-sm"
                            title="Increase 0.5 kg"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                        {/* Quick shortcut pills */}
                        <div className="flex items-center space-x-1 pl-2">
                          {[1, 2, 5].map((amt) => (
                            <button
                              key={amt}
                              onClick={() => handleIngredientWeightChange(grain.name, currentKg + amt)}
                              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-[#2E2A20] hover:border-[#C9A227] text-[10px] text-gray-600 dark:text-[#D0C5AF] font-semibold"
                            >
                              +{amt}kg
                            </button>
                          ))}
                        </div>

                        {currentKg > 0 && (
                          <button
                            onClick={() => handleRemoveIngredient(grain.name)}
                            className="ml-auto text-gray-400 hover:text-rose-500 p-1"
                            title="Remove from blend"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
                })}
              </div>
            </div>

            {/* Fineness Selection */}
            <div className="space-y-2">
              <span className="font-bold text-[#C9A227] uppercase tracking-caps text-[11px] block">
                STONE COLD-MILLING FINENESS:
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'Coarse / Dalia', label: 'Coarse / Dalia', desc: 'High Bran Khurchan' },
                  { id: 'Medium (Phulka)', label: 'Medium (Phulka)', desc: 'Standard Soft Roti' },
                  { id: 'Extra Fine (Puri & Paratha)', label: 'Extra Fine', desc: 'Puri & Paratha' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFineness(item.id)}
                    className={`p-3 text-center border rounded-xl transition-all shadow-sm ${
                      fineness === item.id
                        ? 'border-[#C9A227] bg-amber-50/70 dark:bg-[#222019]'
                        : 'border-gray-200 dark:border-[#2E2A20] bg-white dark:bg-[#181818] hover:border-gray-300'
                    }`}
                  >
                    <span className="font-sans font-bold text-xs text-gray-900 dark:text-[#FDFBF7] block">
                      {item.label}
                    </span>
                    <span className="text-[9px] text-gray-500 dark:text-[#8B826F] block mt-0.5">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            EDUCATIONAL KNOWLEDGE HUB & FAQS (REQUIREMENTS 3, 5, 6, 7)
            9 Factual Articles, 8 FAQs, Hindi/Hinglish Search Keywords,
            and Mandatory Health-Claim Safeguards
            ======================================================== */}
        <section aria-label="Arogya Bhog Nutrition and Atta Knowledge Hub" className="mt-12 pt-8 border-t border-gray-200 dark:border-[#2E2A20] space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-caps text-[#C9A227] px-3 py-1 rounded-full bg-amber-50 dark:bg-[#1A1A1A] border border-[#C9A227]/40 inline-block">
              Knowledge Hub & Dietary Transparency
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#FDFBF7]">
              Arogya Bhog Flour & Nutrition Guides
            </h2>
            <p className="font-sans text-xs sm:text-sm text-gray-600 dark:text-[#99907C] leading-relaxed">
              At <strong>Arogya Bhog</strong>, we believe in honest nourishment and total ingredient transparency. Explore verified grain profiles, nutritional science, and practical dietary guidance for everyday family well-being.
            </p>
          </div>

          {/* Knowledge Switcher Tabs: Guides vs FAQs */}
          <div className="flex justify-center">
            <div className="inline-flex p-1 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2A20] rounded-xl text-xs font-bold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setSelectedKnowledgeTab('articles')}
                className={`py-2 px-4 rounded-lg flex items-center space-x-1.5 transition-all ${
                  selectedKnowledgeTab === 'articles'
                    ? 'bg-[#C9A227] text-white shadow-sm'
                    : 'text-gray-600 dark:text-[#99907C] hover:text-gray-900 dark:hover:text-[#FDFBF7]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Educational Guides (9)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedKnowledgeTab('faqs')}
                className={`py-2 px-4 rounded-lg flex items-center space-x-1.5 transition-all ${
                  selectedKnowledgeTab === 'faqs'
                    ? 'bg-[#C9A227] text-white shadow-sm'
                    : 'text-gray-600 dark:text-[#99907C] hover:text-gray-900 dark:hover:text-[#FDFBF7]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Frequently Asked Questions (8)</span>
              </button>
            </div>
          </div>

          {/* TAB 1: 9 FACTUAL EDUCATIONAL GUIDES */}
          {selectedKnowledgeTab === 'articles' && (
            <div className="space-y-3 animate-fadeIn">
              {SEO_ARTICLES.map((article) => {
                const isExpanded = expandedArticleId === article.id;
                return (
                  <article
                    key={article.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2E2A20] hover:border-[#C9A227]/60 transition-all shadow-sm space-y-3"
                  >
                    <div 
                      onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                      className="cursor-pointer flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227] bg-amber-50 dark:bg-[#1F1D14] border border-[#C9A227]/30 px-2 py-0.5 rounded-md">
                            {article.category}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-[#8B826F]">
                            {article.readTime}
                          </span>
                        </div>
                        <h3 className="font-editorial text-base sm:text-lg font-bold text-gray-900 dark:text-[#FDFBF7] hover:text-[#C9A227] transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-xs text-[#C9A227] italic">
                          {article.hindiTitle}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-[#99907C] leading-relaxed line-clamp-2">
                          {article.summary}
                        </p>
                      </div>

                      <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse article' : 'Expand article'}
                        className="p-1 rounded-lg text-gray-400 hover:text-[#C9A227] flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Expanded Article Body */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-gray-100 dark:border-[#2E2A20] space-y-3 animate-fadeIn text-xs sm:text-sm text-gray-700 dark:text-[#CFC6B3] leading-relaxed">
                        {article.content.split('\n\n').map((para, pIdx) => (
                          <p key={pIdx}>{para}</p>
                        ))}

                        {/* Mandatory Health Disclaimer if present */}
                        {article.disclaimer && (
                          <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-[#1E1B12] border border-amber-300 dark:border-[#C9A227]/40 text-amber-900 dark:text-[#E5C158] text-xs flex items-start space-x-2.5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-[#C9A227] mt-0.5" />
                            <p className="leading-relaxed font-sans">{article.disclaimer}</p>
                          </div>
                        )}

                        {article.relatedProductSlug && onOpenProductDetail && (
                          <div className="pt-2 flex items-center justify-between">
                            <span className="text-[11px] text-gray-500 dark:text-[#8B826F]">
                              Relevant Product Formulation
                            </span>
                            <button
                              type="button"
                              onClick={() => onOpenProductDetail(article.relatedProductSlug)}
                              className="text-xs font-bold text-[#C9A227] hover:underline flex items-center space-x-1"
                            >
                              <span>View Recipe & Nutrition</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* TAB 2: 8 FREQUENTLY ASKED QUESTIONS */}
          {selectedKnowledgeTab === 'faqs' && (
            <div className="space-y-3 animate-fadeIn">
              {SEO_FAQS.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2E2A20] hover:border-[#C9A227]/60 transition-all shadow-sm space-y-2"
                  >
                    <div
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="cursor-pointer flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <h3 className="font-editorial text-sm sm:text-base font-bold text-gray-900 dark:text-[#FDFBF7]">
                          {faq.question}
                        </h3>
                        <p className="text-xs text-[#C9A227] italic">
                          {faq.hindiQuestion}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse answer' : 'Expand answer'}
                        className="p-1 rounded-lg text-gray-400 hover:text-[#C9A227] flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="pt-2.5 border-t border-gray-100 dark:border-[#2E2A20] animate-fadeIn text-xs sm:text-sm text-gray-700 dark:text-[#CFC6B3] leading-relaxed">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Mandatory General Medical Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-[#2E2A20] text-center space-y-1.5 text-xs text-gray-600 dark:text-[#99907C]">
            <p className="font-bold text-gray-800 dark:text-[#D0C5AF]">
              Responsible Health Information Safeguard
            </p>
            <p className="max-w-3xl mx-auto leading-relaxed">
              All Arogya Bhog products are wholesome, natural whole-food dietary ingredients. They are not pharmaceutical medicines, cures, or treatments for diabetes, thyroid conditions, arthritis, or gout. Always consult a qualified physician or registered dietitian for specialized health and medical advice.
            </p>
          </div>

          {/* Popular Search Keywords Cloud */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-[#1A1A1A] border border-amber-200 dark:border-[#2E2A20] text-center space-y-2.5">
            <h4 className="text-xs uppercase font-bold tracking-wider text-gray-700 dark:text-[#D0C5AF]">
              Popular Searches & Arogya Bhog Health Flours
            </h4>
            <div className="flex flex-wrap justify-center gap-1.5 text-[11px] text-gray-600 dark:text-[#99907C]">
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">Arogya Bhog</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">Arogya Bhog Atta</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">Multigrain Atta</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">High Protein Atta</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">Sugar Care Atta</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">Thyro Care Atta</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">Vitality Atta</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">My Choice Atta</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">Desi Atta</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">मल्टीग्रेन आटा</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">हाई प्रोटीन आटा</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">शुगर केयर आटा</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">थायरो केयर आटा</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">अपने पसंद का आटा</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">Buy Atta Online</span>
              <span className="px-2.5 py-1 bg-white dark:bg-[#121212] border border-gray-200 dark:border-[#2E2A20] rounded-lg">Fresh Stone Chakki Atta</span>
            </div>
          </div>
        </section>

      </div>

      {/* REQUIREMENT 12: REMOVED FOOTER CARD IN DESKTOP VIEW
          Sticky bottom order bar is restricted strictly to mobile/compact viewports (md:hidden) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#2E2A20] px-4 py-3 md:hidden transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            {activeTab === 'customBlender' ? (
              <div>
                <div className="flex items-baseline space-x-1">
                  <span className="font-sans font-bold text-lg text-[#C9A227]">
                    ₹{customPricingBreakdown.finalPrice}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({currentTotalWeight}/10 kg)
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">
                  {isCustomBlendReady ? '10 kg Ready' : `${remainingWeight} kg remaining`}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-xs text-gray-500 block uppercase font-bold">Doctor Blends</span>
                <span className="text-xs text-gray-700 dark:text-[#D0C5AF]">Choose 5kg or 10kg above</span>
              </div>
            )}
          </div>

          {activeTab === 'customBlender' ? (
            <button
              onClick={handleAddCustomToCart}
              className={`py-2.5 px-4 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md ${
                isCustomBlendReady
                  ? 'bg-[#C9A227] text-white'
                  : 'bg-gray-200 dark:bg-[#252525] text-gray-500 border border-gray-300 dark:border-[#333]'
              }`}
            >
              Add 10kg Blend
            </button>
          ) : (
            <button
              onClick={onOpenCart}
              className="py-2.5 px-4 bg-[#C9A227] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
            >
              View Cart
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
