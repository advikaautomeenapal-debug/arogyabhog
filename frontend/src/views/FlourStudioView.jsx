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
  MapPin,
  Bot,
  Search,
  Filter,
  CheckCircle2,
  Download
} from 'lucide-react';
import { calculateProductNutrition, NUTRIENT_DEFINITIONS, formatNutrientValue } from '../utils/nutritionCalculator';
import { resolveGrainDoc, canonicalGrainName, normalizeIngredientsMap } from '../utils/grainResolver';
import { getProductSlug, PRODUCT_SEO_CATALOG, SEO_ARTICLES, SEO_FAQS } from '../utils/productSeoData';
import { getVariantTheme } from '../utils/variantThemes';
import { getIngredientMeta, getIngredientImage, MASTER_GRAINS_FALLBACK } from '../utils/ingredientImages';


export function FlourStudioView({ 
  products, 
  grains, 
  onAddToCart, 
  onOpenCart, 
  onOpenProductDetail,
  cart,
  initialRatios,
  siteContent,
  activeViewTab,
  onTabChange,
  onNavigateToAyurvedicAI,
  onPromptInstall,
  isStandalone
}) {
  const [activeTab, setActiveTab] = useState(() => {
    if (initialRatios && Object.keys(initialRatios).length > 0) return 'customBlender';
    if (activeViewTab) return activeViewTab;
    return 'doctorBlends';
  });

  useEffect(() => {
    if (activeViewTab) {
      setActiveTab(activeViewTab);
    }
  }, [activeViewTab]);

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const [showCustomDetails, setShowCustomDetails] = useState(false);
  
  // REQUIRED ORDER FOR HOMEPAGE:
  // 1. Everyday Soft Multigrain Atta
  // 2. Sugar Care Atta
  // 3. ThyroCare Atta
  // 4. High Protein Atta
  // 5. Vitality Atta
  // Filters out duplicate/test products such as "Everyday Soft Multigrain Atta Test"
  const customerProducts = useMemo(() => {
    const requiredOrder = [
      'everyday-soft-multigrain-atta',
      'sugar-care-atta',
      'thyro-care-atta',
      'high-protein-atta',
      'vitality-atta'
    ];

    return (products || [])
      .filter(p => p.productType !== 'custom')
      .filter(p => {
        const name = (p.name || '').toLowerCase();
        const slug = (p.slug || '').toLowerCase();
        if (name.includes('test') || slug.includes('test')) return false;
        return true;
      })
      .sort((a, b) => {
        const slugA = getProductSlug(a);
        const slugB = getProductSlug(b);
        const idxA = requiredOrder.indexOf(slugA) !== -1 ? requiredOrder.indexOf(slugA) : 999;
        const idxB = requiredOrder.indexOf(slugB) !== -1 ? requiredOrder.indexOf(slugB) : 999;
        return idxA - idxB;
      });
  }, [products]);

  // REQUIREMENT 10: DO NOT PRESELECT PRE-BLEND PACKAGE SIZE AUTOMATICALLY
  // Pack size per product ID initialized as null (customer must explicitly pick 5kg or 10kg)
  const [packSizes, setPackSizes] = useState({});
  const [addingProductId, setAddingProductId] = useState(null);
  const [productValidationErrors, setProductValidationErrors] = useState({});

  // Educational Knowledge Hub & FAQ Accordion State
  const [isKnowledgeHubOpen, setIsKnowledgeHubOpen] = useState(false);
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
    handleSwitchTab('customBlender');
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

  // Fallback to 18 master grains if grains prop is not loaded yet
  const effectiveGrains = useMemo(() => {
    if (Array.isArray(grains) && grains.length > 0) return grains;
    return MASTER_GRAINS_FALLBACK;
  }, [grains]);

  // Ingredient catalogue filtering & search state
  const [ingredientCategory, setIngredientCategory] = useState('all');
  const [ingredientSearch, setIngredientSearch] = useState('');

  // Calculate cumulative weight
  const currentTotalWeight = useMemo(() => {
    const total = Object.values(customIngredients).reduce((sum, w) => sum + (Number(w) || 0), 0);
    return Number(total.toFixed(2));
  }, [customIngredients]);

  const remainingWeight = useMemo(() => {
    const rem = TARGET_CUSTOM_WEIGHT - currentTotalWeight;
    return Number(rem.toFixed(2));
  }, [currentTotalWeight]);

  // Count of ingredients allocated in the current batch
  const selectedGrainsCount = useMemo(() => {
    return Object.values(customIngredients).filter(w => Number(w) > 0).length;
  }, [customIngredients]);

  // Dynamic ingredient cost calculation using latest live prices from backend
  const customPricingBreakdown = useMemo(() => {
    const grainsMap = {};
    effectiveGrains.forEach(g => { 
      grainsMap[g.name] = g; 
    });

    let totalIngredientCost = 0;
    let hasPendingPrice = false;
    let pendingPriceItem = '';
    const items = [];

    Object.entries(customIngredients).forEach(([name, weight]) => {
      const w = Number(weight) || 0;
      if (w > 0) {
        const grainDoc = grainsMap[name] || resolveGrainDoc(name, effectiveGrains);
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
  }, [customIngredients, effectiveGrains]);

  // Filtered grains based on active category tab and search input
  const filteredGrains = useMemo(() => {
    return effectiveGrains.filter((grain) => {
      const currentKg = customIngredients[grain.name] || 0;
      const meta = getIngredientMeta(grain);

      // Category matching
      if (ingredientCategory === 'selected' && currentKg <= 0) return false;
      if (ingredientCategory === 'base') {
        const cat = (grain.category || meta.category || '').toLowerCase();
        if (!cat.includes('base') && !cat.includes('grain')) return false;
      } else if (ingredientCategory === 'millets') {
        const cat = (grain.category || meta.category || '').toLowerCase();
        if (!cat.includes('millet')) return false;
      } else if (ingredientCategory === 'ancient') {
        const cat = (grain.category || meta.category || '').toLowerCase();
        if (!cat.includes('ancient') && !cat.includes('specialty')) return false;
      } else if (ingredientCategory === 'pulses') {
        const cat = (grain.category || meta.category || '').toLowerCase();
        if (!cat.includes('pulse') && !cat.includes('legume') && !cat.includes('protein')) return false;
      } else if (ingredientCategory === 'seeds') {
        const cat = (grain.category || meta.category || '').toLowerCase();
        if (!cat.includes('seed') && !cat.includes('herb') && !cat.includes('oilseed')) return false;
      }

      // Search query matching (matches English name, Hindi name, benefits, or category)
      if (ingredientSearch.trim()) {
        const q = ingredientSearch.toLowerCase().trim();
        const nameMatch = (grain.name || '').toLowerCase().includes(q);
        const hindiMatch = (meta.hindiName || '').toLowerCase().includes(q);
        const catMatch = (grain.category || meta.category || '').toLowerCase().includes(q);
        const benefitMatch = (grain.benefits || meta.tagline || grain.subtitle || '').toLowerCase().includes(q);
        if (!nameMatch && !hindiMatch && !catMatch && !benefitMatch) return false;
      }

      return true;
    });
  }, [effectiveGrains, customIngredients, ingredientCategory, ingredientSearch]);

  // Live Nutrition Calculation for the Custom Blend (Requirement 3C & 5)
  const customNutritionLive = useMemo(() => {
    const breakdown = customPricingBreakdown.items.map(item => ({
      name: item.name,
      percentage: Math.round((item.weightKg / TARGET_CUSTOM_WEIGHT) * 100),
      weightKg: item.weightKg
    }));
    return calculateProductNutrition(breakdown, TARGET_CUSTOM_WEIGHT, 1, effectiveGrains, 50);
  }, [customPricingBreakdown, effectiveGrains]);

  // Handle changing ingredient weight (in increments or exact kg)
  const handleIngredientWeightChange = (grainName, newWeight) => {
    setCustomValidationError('');
    setCustomSuccessMessage('');

    // Check if ingredient price is pending configuration
    const grainDoc = effectiveGrains.find(g => g.name === grainName) || resolveGrainDoc(grainName, effectiveGrains);
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
    const grainDoc = resolveGrainDoc(grainName, effectiveGrains);
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

      <div className={`mx-auto pt-3 md:pt-5 pb-24 md:pb-10 transition-all ${
        activeTab === 'customBlender' 
          ? 'max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8' 
          : 'max-w-6xl px-3 sm:px-4 md:px-6'
      }`}>
        
        {/* VIEW SWITCHER PILLS (Desktop Only; Mobile starts directly with product cards) */}
        <div className="hidden md:grid grid-cols-2 p-1.5 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2A20] rounded-2xl mb-6 shadow-sm max-w-xl mx-auto w-full">
          <button
            onClick={() => handleSwitchTab('doctorBlends')}
            className={`py-3 px-4 font-sans text-xs md:text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all ${
              activeTab === 'doctorBlends'
                ? 'bg-[#C9A227] text-white shadow-md'
                : 'text-gray-600 dark:text-[#D0C5AF] hover:text-gray-900 dark:hover:text-[#FDFBF7]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Doctor Blends ({customerProducts.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab('customBlender')}
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
          <div className="space-y-4 md:space-y-5 animate-fadeIn">
            
            {/* Desktop Header - Hidden on mobile so cards start directly at the top */}
            <div className="hidden md:flex items-end justify-between border-b border-gray-200 dark:border-[#2E2A20] pb-3">
              <div>
                <h2 className="font-editorial text-xl md:text-2xl font-bold text-gray-900 dark:text-[#FDFBF7]">
                  Signature Multigrain Formulas
                </h2>
                <p className="font-sans text-xs text-gray-600 dark:text-[#99907C] mt-0.5">
                  Select package size (5 kg or 10 kg) and add freshly stone-milled flours to your cart
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227] border border-[#C9A227]/40 rounded-lg px-2.5 py-1 bg-amber-50/50 dark:bg-[#1A1A1A]">
                {customerProducts.length} DOCTOR FORMULAS
              </span>
            </div>

            <div className="space-y-3.5 md:space-y-4">
              {customerProducts.map((product) => {
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

                    {/* ========================================================
                        MOBILE HORIZONTAL CARD (< md: Left ~25% Image, Right ~75% Info, Full-Width Bottom Row)
                        Exact required layout:
                        - Row 1: Left ~25% image box, Right ~75% information
                        - Divider: Full width
                        - Row 2: Add to Cart (flex-[3]), Details (flex-[2]), Custom Blend icon (38px)
                        ======================================================== */}
                    <div className="md:hidden flex flex-col p-3 relative z-10 gap-2.5">
                      
                      {/* Top Row: Left ~25% Image + Right ~75% Info */}
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        {/* Left ~25% Image Box */}
                        <a 
                          href={`/product/${slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (onOpenProductDetail) onOpenProductDetail(slug);
                          }}
                          className="w-[26%] min-w-[80px] max-w-[105px] aspect-[4/5] rounded-xl overflow-hidden shrink-0 border border-amber-200/60 dark:border-zinc-700/60 bg-amber-50/30 dark:bg-zinc-800/50 relative cursor-pointer shadow-xs group/mobileimg block"
                          title={`View ${product.name} details`}
                        >
                          <img
                            src={product.imageUrl || `/variants/${slug}.jpg`}
                            alt={product.name}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => { 
                              if (theme.bgImage) {
                                e.currentTarget.src = theme.bgImage;
                              } else {
                                e.currentTarget.src = '/arogyaBhog_logo.png';
                              }
                            }}
                            loading="lazy"
                          />
                          {discountPercent > 0 && (
                            <span className="absolute top-1 left-1 text-[8px] font-black bg-emerald-600 text-white px-1 py-0.2 rounded shadow-2xs leading-tight">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </a>

                        {/* Right ~75% Information Area */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Badge */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center text-[8.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${theme.badgeClass}`}>
                              {product.badge || theme.badge}
                            </span>
                          </div>

                          {/* Product Title */}
                          <a 
                            href={`/product/${slug}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (onOpenProductDetail) onOpenProductDetail(slug);
                            }}
                            className="font-bold text-sm text-gray-950 dark:text-[#FDFBF7] active:text-[#C9A227] leading-snug cursor-pointer line-clamp-2 block"
                            title={product.name}
                          >
                            {product.name}
                          </a>

                          {/* Short Description / Positioning */}
                          <p className="text-[11px] text-gray-600 dark:text-[#C5BAA5] line-clamp-1 leading-tight">
                            {theme.positioning}
                          </p>

                          {/* Price & applicable offer */}
                          <div className="flex items-baseline gap-1.5 flex-wrap pt-0.5">
                            <span className="font-sans font-black text-base text-gray-950 dark:text-white">
                              ₹{packPrice}
                            </span>
                            {mrpPackPrice > packPrice && (
                              <span className="text-[11px] text-gray-400 dark:text-[#888] line-through font-medium">
                                ₹{mrpPackPrice}
                              </span>
                            )}
                            <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-300/60 dark:border-emerald-800/40">
                              Free Delivery
                            </span>
                          </div>

                          {/* Pack Size Selector Chips (5kg / 10kg) */}
                          <div className="flex items-center gap-1 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleSelectPackSize(product._id, 5)}
                              className={`flex-1 py-1 px-1 text-[10px] font-bold rounded-lg border text-center transition-all ${
                                currentPack === 5
                                  ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#C9A227] shadow-2xs font-black'
                                  : 'border-gray-200 dark:border-[#2E2A20] text-gray-700 dark:text-[#BBB] bg-gray-50/70 dark:bg-[#141414]'
                              }`}
                            >
                              5 kg (₹{Math.round(product.sellingPrice * 5)})
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectPackSize(product._id, 10)}
                              className={`flex-1 py-1 px-1 text-[10px] font-bold rounded-lg border text-center transition-all ${
                                currentPack === 10
                                  ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#C9A227] shadow-2xs font-black'
                                  : 'border-gray-200 dark:border-[#2E2A20] text-gray-700 dark:text-[#BBB] bg-gray-50/70 dark:bg-[#141414]'
                              }`}
                            >
                              10 kg (₹{Math.round(product.sellingPrice * 10)})
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Full-width Divider */}
                      <div className="w-full border-t border-gray-100 dark:border-[#2E2A20]/80" />

                      {/* Bottom Action Row: Spans 100% full width of card beneath both image and info */}
                      <div className="w-full flex items-center gap-1.5">
                        {/* Primary Action: Add to Cart */}
                        <button
                          type="button"
                          onClick={() => handleAddProductToCart(product)}
                          disabled={isAdding}
                          className={`flex-[3] py-2 px-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-xs active:scale-95 cursor-pointer min-h-[38px] ${
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
                          <span className="truncate">
                            {isAdding
                              ? 'Adding...'
                              : inCartQty > 0
                                ? `Added (${currentPack}kg)`
                                : `Add to Cart`}
                          </span>
                        </button>

                        {/* Secondary Action: Details */}
                        <a
                          href={`/product/${slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (onOpenProductDetail) onOpenProductDetail(slug);
                          }}
                          className="flex-[2] py-2 px-2 rounded-xl border border-gray-300 dark:border-[#2E2A20] text-gray-700 dark:text-[#BBB] hover:text-[#C9A227] hover:border-[#C9A227] font-semibold text-xs flex items-center justify-center space-x-1 transition-all bg-white dark:bg-[#141414] min-h-[38px] active:scale-95 cursor-pointer"
                          title="View Details"
                        >
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Details</span>
                        </a>

                        {/* Custom Blend Action Icon */}
                        <button
                          type="button"
                          onClick={() => handleCustomizePrebuilt(product)}
                          className="w-[38px] h-[38px] rounded-xl border border-[#C9A227]/50 text-[#C9A227] hover:bg-[#C9A227] hover:text-white transition-all bg-amber-50/50 dark:bg-[#201D14] flex items-center justify-center active:scale-95 shrink-0 cursor-pointer"
                          title="Customize blend in Custom Blender"
                          aria-label="Customize blend in Custom Blender"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                    {/* ========================================================
                        DESKTOP SHOWCASE CONTAINER (md:flex - Untouched Desktop Experience)
                        ======================================================== */}
                    <div className="hidden md:flex relative z-10 p-4 sm:p-5 flex-col justify-between space-y-4">
                      
                      {/* Main Showcase Row: Photo + Product Info */}
                      <div className="flex flex-col sm:flex-row items-start gap-3.5 sm:gap-5">
                        
                        {/* Standalone Product Photo Box (Visible on Big Screen / Laptop & Mobile) */}
                        <a 
                          href={`/product/${slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (onOpenProductDetail) onOpenProductDetail(slug);
                          }}
                          className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 shrink-0 rounded-2xl overflow-hidden border border-amber-200/80 dark:border-zinc-700/80 shadow-md bg-white/90 dark:bg-zinc-800/90 relative group/img cursor-pointer transition-transform duration-300 hover:scale-[1.02] block"
                          title={`Click to view ${product.name} details`}
                        >
                          <img
                            src={product.imageUrl || `/variants/${slug}.jpg`}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                            onError={(e) => { e.currentTarget.src = '/arogyaBhog_logo.png'; }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors flex items-end justify-center pb-1.5">
                            <span className="opacity-0 group-hover/img:opacity-100 transition-opacity text-[9px] font-bold text-white bg-black/70 px-2 py-0.5 rounded backdrop-blur-xs">
                              View Details
                            </span>
                          </div>
                        </a>

                        {/* Product Information Column */}
                        <div className="flex-1 min-w-0 space-y-1.5 w-full">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${theme.badgeClass}`}>
                              {product.badge || theme.badge}
                            </span>
                            <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                              Arogya Assured ✓
                            </span>
                          </div>

                          <a 
                            href={`/product/${slug}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (onOpenProductDetail) onOpenProductDetail(slug);
                            }}
                            className="font-bold text-base sm:text-lg md:text-xl text-gray-950 dark:text-[#FDFBF7] group-hover:text-[#C9A227] transition-colors leading-snug cursor-pointer line-clamp-1 block"
                            title={product.name}
                          >
                            {product.name}
                          </a>

                          {/* Short Purpose / Positioning Line */}
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-[#C5BAA5] font-medium line-clamp-2 sm:line-clamp-1">
                            {theme.positioning}
                          </p>

                          {/* Flipkart Pricing Row */}
                          <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
                            <span className="font-sans font-black text-xl sm:text-2xl text-gray-950 dark:text-white">
                              ₹{packPrice}
                            </span>
                            {mrpPackPrice > packPrice && (
                              <span className="text-xs sm:text-sm text-gray-400 dark:text-[#888] line-through font-medium">
                                ₹{mrpPackPrice}
                              </span>
                            )}
                            {discountPercent > 0 && (
                              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {discountPercent}% off
                              </span>
                            )}
                            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-800/40">
                              Free Delivery
                            </span>
                          </div>

                          {/* Pack Size Selector Chips */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-[#A09885] uppercase tracking-wider">
                              Select Pack:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleSelectPackSize(product._id, 5)}
                                className={`px-3.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                                  currentPack === 5
                                    ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#C9A227] shadow-xs'
                                    : 'border-gray-200 dark:border-[#2E2A20] text-gray-700 dark:text-[#BBB] hover:border-gray-400 bg-white/70 dark:bg-[#141414]/70'
                                }`}
                              >
                                5 kg (₹{Math.round(product.sellingPrice * 5)})
                              </button>
                              <button
                                onClick={() => handleSelectPackSize(product._id, 10)}
                                className={`px-3.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                                  currentPack === 10
                                    ? 'border-[#C9A227] bg-[#C9A227]/20 text-[#C9A227] shadow-xs'
                                    : 'border-gray-200 dark:border-[#2E2A20] text-gray-700 dark:text-[#BBB] hover:border-gray-400 bg-white/70 dark:bg-[#141414]/70'
                                }`}
                              >
                                10 kg (₹{Math.round(product.sellingPrice * 10)})
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop-Only: WHAT'S INSIDE Ingredient Table & Benefits (Very Light Color) */}
                      <div className={`hidden md:block pt-3 border-t border-stone-200/60 dark:border-[#2E2A20]/80 rounded-2xl ${theme.tableBg} p-3.5 border`}>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/60 dark:border-[#2E2A20]">
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

                        {/* Grid of Ingredients with Prominent Percentages - Very Light Color */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {recipeGrains.map((grain, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#22201C] border border-stone-200/80 dark:border-[#333028] shadow-2xs transition-colors hover:border-[#C9A227]/50 ${theme.rowTint}`}
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

                      {/* Prominent Bottom Action Bar (Add to Cart in Bottom of Card) */}
                      <div className="pt-2 border-t border-gray-200/60 dark:border-[#2E2A20] flex items-center justify-between gap-2.5 flex-wrap">
                        <button
                          onClick={() => handleAddProductToCart(product)}
                          disabled={isAdding}
                          className={`flex-1 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer min-w-[160px] ${
                            inCartQty > 0
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600'
                              : 'bg-[#C9A227] hover:bg-[#B58F1E] text-white'
                          }`}
                        >
                          {inCartQty > 0 ? (
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          ) : (
                            <ShoppingCart className="w-4 h-4" />
                          )}
                          <span>
                            {isAdding
                              ? 'Adding...'
                              : inCartQty > 0
                                ? inCartQty === 1
                                  ? `Added to Cart ✓ (${currentPack} kg)`
                                  : `Added ✓ (${inCartQty} packs • ${currentPack} kg)`
                                : `Add to Cart (${currentPack} kg • ₹${packPrice})`}
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <a
                            href={`/product/${slug}`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (onOpenProductDetail) onOpenProductDetail(slug);
                            }}
                            className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-[#2E2A20] hover:border-[#C9A227] text-gray-700 dark:text-[#BBB] hover:text-[#C9A227] font-semibold text-xs flex items-center space-x-1.5 transition-all bg-white/70 dark:bg-[#141414]/70"
                            title="View Recipe & Nutrition"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCustomizePrebuilt(product)}
                            className="py-2.5 px-4 rounded-xl border border-[#C9A227]/50 text-[#C9A227] hover:bg-[#C9A227] hover:text-white font-semibold text-xs flex items-center space-x-1.5 transition-all hidden sm:inline-flex bg-amber-50/40 dark:bg-[#141414]/60"
                            title="Customize recipe in 10 kg blender"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Customize (10 kg)</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}

              {/* PRODUCT 6: MY CHOICE ATTA (Bespoke Customer Blend strictly 10 kg - Desktop Only) */}
              <div className="hidden md:block relative overflow-hidden rounded-2xl border-2 border-[#C9A227] bg-white dark:bg-[#181818] shadow-sm hover:shadow-xl transition-all duration-300 group">
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

                {/* ========================================================
                    MOBILE COMPACT CARD FOR MY CHOICE ATTA
                    ======================================================== */}
                <div className="md:hidden flex flex-col relative z-10">
                  
                  {/* Top 20-25% Image Strip */}
                  <div 
                    onClick={() => onOpenProductDetail && onOpenProductDetail('my-choice-atta')}
                    className="relative h-24 sm:h-28 w-full overflow-hidden cursor-pointer"
                    title="View My Choice Atta details"
                  >
                    <img
                      src="/variants/my-choice-atta.jpg"
                      alt="My Choice Atta"
                      className="w-full h-full object-cover object-center"
                      onError={(e) => { e.currentTarget.src = '/arogyaBhog_logo.png'; }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                      <span className="inline-flex items-center text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded shadow-xs border border-[#C9A227] text-white bg-[#C9A227]/90">
                        10 KG BESPOKE BLEND
                      </span>
                      <span className="inline-flex items-center text-[9px] font-bold text-white bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded">
                        Assured ✓
                      </span>
                    </div>

                    <div className="absolute bottom-1.5 right-2 pointer-events-none">
                      <span className="text-[9px] font-semibold text-white/90 bg-black/50 backdrop-blur-xs px-1.5 py-0.5 rounded">
                        Tap for details
                      </span>
                    </div>
                  </div>

                  {/* Remaining 75-80% Product Info & Actions */}
                  <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <h3 
                        onClick={() => onOpenProductDetail && onOpenProductDetail('my-choice-atta')}
                        className="font-bold text-base text-gray-950 dark:text-[#FDFBF7] active:text-[#C9A227] leading-snug cursor-pointer line-clamp-1"
                        title="View My Choice Atta Details"
                      >
                        My Choice Atta
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-[#C5BAA5] line-clamp-1">
                        Customize your blend with 18 verified whole grains and seeds.
                      </p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] shrink-0" />
                        <span className="text-[11px] font-medium text-amber-900 dark:text-[#E5C158] truncate">
                          100% Bespoke Recipe • Exact 10 kg Batch
                        </span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="font-sans font-black text-xl text-[#C9A227]">
                        ₹85/kg
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        (Avg • 10 kg Batch)
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-800/40 ml-auto">
                        Free Delivery
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-gray-100 dark:border-[#2E2A20] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSwitchTab('customBlender')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#C9A227] hover:bg-[#B58F1E] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer min-h-[40px]"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Create Blend (10 kg)</span>
                      </button>

                      <a
                        href="/product/my-choice-atta"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onOpenProductDetail) onOpenProductDetail('my-choice-atta');
                        }}
                        className="py-2.5 px-3 rounded-xl border border-gray-300 dark:border-[#2E2A20] text-gray-700 dark:text-[#BBB] hover:text-[#C9A227] hover:border-[#C9A227] font-semibold text-xs flex items-center justify-center space-x-1 transition-all bg-white dark:bg-[#141414] min-h-[40px] active:scale-95"
                        title="View Details"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Desktop Showcase Container */}
                <div className="hidden md:flex relative z-10 p-4 sm:p-5 flex-col justify-between space-y-4">
                  {/* Main Showcase Row: Photo + Product Info */}
                  <div className="flex flex-col sm:flex-row items-start gap-3.5 sm:gap-5">
                    
                    {/* Standalone Product Photo Box */}
                    <a 
                      href="/product/my-choice-atta"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onOpenProductDetail) onOpenProductDetail('my-choice-atta');
                      }}
                      className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 shrink-0 rounded-2xl overflow-hidden border border-[#C9A227]/80 dark:border-zinc-700/80 shadow-md bg-white/90 dark:bg-zinc-800/90 relative group/img cursor-pointer transition-transform duration-300 hover:scale-[1.02] block"
                      title="Click to view My Choice Atta details"
                    >
                      <img
                        src="/variants/my-choice-atta.jpg"
                        alt="My Choice Atta"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                        onError={(e) => { e.currentTarget.src = '/arogyaBhog_logo.png'; }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/15 transition-colors flex items-end justify-center pb-1.5">
                        <span className="opacity-0 group-hover/img:opacity-100 transition-opacity text-[9px] font-bold text-white bg-black/70 px-2 py-0.5 rounded backdrop-blur-xs">
                          View Details
                        </span>
                      </div>
                    </a>

                    {/* Product Info Column */}
                    <div className="flex-1 min-w-0 space-y-1.5 w-full">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border border-[#C9A227] text-[#C9A227] bg-[#C9A227]/10">
                          CUSTOMER BESPOKE BLEND • 10 KG
                        </span>
                        <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                          Assured ✓
                        </span>
                      </div>

                      <a 
                        href="/product/my-choice-atta"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onOpenProductDetail) onOpenProductDetail('my-choice-atta');
                        }}
                        className="font-bold text-base sm:text-lg md:text-xl text-gray-950 dark:text-[#FDFBF7] hover:text-[#C9A227] transition-colors leading-snug cursor-pointer line-clamp-1 block"
                        title="View My Choice Atta Details"
                      >
                        My Choice Atta
                      </a>

                      {/* Short Positioning 1-Liner */}
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-[#C5BAA5] font-medium line-clamp-2 sm:line-clamp-1">
                        Customize your blend with 18 verified whole grains and seeds.
                      </p>

                      {/* Flipkart Pricing Row */}
                      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
                        <span className="font-sans font-black text-xl sm:text-2xl text-[#C9A227]">
                          ₹85/kg
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-gray-600 dark:text-[#AAA]">
                          (Avg • Strictly 10 kg Batch)
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-800/40">
                          Free Delivery
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop-Only: 18 Master Grains Studio Info & Highlights (Very Light Color) */}
                  <div className="hidden md:block pt-3 border-t border-stone-200/60 dark:border-[#2E2A20]/80 rounded-2xl bg-stone-50/90 dark:bg-[#1C1A17] p-3.5 border border-stone-200/70 dark:border-[#2E2A20]">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/60 dark:border-[#2E2A20]">
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

                  {/* Bottom Action Bar */}
                  <div className="pt-2 border-t border-gray-200/60 dark:border-[#2E2A20] flex items-center justify-between gap-2.5 flex-wrap">
                    <button
                      onClick={() => handleSwitchTab('customBlender')}
                      className="flex-1 py-3 px-5 rounded-xl bg-[#C9A227] hover:bg-[#B58F1E] text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-[0.98] min-w-[160px] cursor-pointer"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>Open Custom Blender (10 kg)</span>
                    </button>

                    <a
                      href="/product/my-choice-atta"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onOpenProductDetail) onOpenProductDetail('my-choice-atta');
                      }}
                      className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-[#2E2A20] hover:border-[#C9A227] text-gray-700 dark:text-[#BBB] hover:text-[#C9A227] font-semibold text-xs flex items-center space-x-1.5 transition-all bg-white/70 dark:bg-[#141414]/70"
                      title="View Details"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </a>
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
          <div className="space-y-5 animate-fadeIn relative">
            
            {/* ========================================================
                REQUIREMENT 4: FLOATING AYURVEDIC AI BUTTON
                Visible at top-right without blocking ingredient controls
                ======================================================== */}
            <button
              type="button"
              onClick={() => onNavigateToAyurvedicAI && onNavigateToAyurvedicAI()}
              className="fixed top-20 right-3 z-40 bg-gradient-to-r from-amber-500 via-amber-600 to-[#C9A227] text-white pl-2.5 pr-3 py-1.5 rounded-full shadow-lg border border-amber-300/60 flex items-center space-x-1.5 hover:scale-105 active:scale-95 transition-all text-xs font-bold cursor-pointer group animate-bounce-subtle"
              title="Consult Ayurvedic AI for Personalized Flour Formulation"
              aria-label="Open Ayurvedic AI Consultation"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[11px] font-bold tracking-tight">Ayurvedic AI</span>
              <Sparkles className="w-3 h-3 text-amber-200" />
            </button>

            {/* Desktop-Only Ayurvedic AI Shortcut Banner (Hidden on mobile where floating button is used) */}
            <div 
              onClick={() => onNavigateToAyurvedicAI && onNavigateToAyurvedicAI()}
              className="hidden md:flex p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/40 to-emerald-50 dark:from-[#1F1B12] dark:via-[#1A1813] dark:to-[#121B15] border border-[#C9A227]/40 shadow-xs items-center justify-between gap-3 cursor-pointer group hover:border-[#C9A227] transition-all"
              role="button"
              tabIndex={0}
              title="Open Ayurvedic AI Consultation"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#C9A227]/15 border border-[#C9A227]/30 flex items-center justify-center shrink-0 text-[#C9A227] group-hover:scale-105 transition-transform shadow-2xs">
                  <Bot className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-[#FDFBF7] group-hover:text-[#C9A227] transition-colors truncate">
                      Ayurvedic AI
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-[#B8AF9C] truncate">
                    Explore personalized wellness guidance & auto-generate bespoke blend ratios
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-1 text-xs font-bold text-[#C9A227] group-hover:translate-x-0.5 transition-transform">
                <span className="hidden sm:inline">Consult AI</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

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

            {/* Header info (Desktop Only; on mobile user starts directly with ingredient selection) */}
            <div className="hidden md:flex items-start justify-between border-b border-gray-200 dark:border-[#2E2A20] pb-3 pt-2">
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

            {/* Quick Ayurvedic Formulations presets (scaled to 10 kg) - Desktop Only */}
            <div className="hidden md:block space-y-2">
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
            <div className="space-y-4 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-[#2E2A20] pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-editorial text-lg sm:text-xl font-bold text-gray-900 dark:text-[#FDFBF7]">
                      Hand-Select Whole Grains & Seeds
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A227]/15 text-[#C9A227] border border-[#C9A227]/30">
                      {selectedGrainsCount} / {effectiveGrains.length} selected
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-[#99907C] mt-0.5">
                    Authentic whole grains cold-ground to order. Total weight must equal exactly 10 kg.
                  </p>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  {selectedGrainsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomIngredients({})}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#2E2A20] text-[11px] text-[#C9A227] hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-900 font-semibold transition-all shadow-xs cursor-pointer"
                      title="Reset all ingredient weights to 0 kg"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* FILTER TABS & SEARCH BAR */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {[
                    { id: 'all', label: `All Grains (${effectiveGrains.length})` },
                    { id: 'selected', label: `In Blend (${selectedGrainsCount})`, highlight: selectedGrainsCount > 0 },
                    { id: 'base', label: 'Base Grains' },
                    { id: 'millets', label: 'Millets' },
                    { id: 'ancient', label: 'Ancient Grains' },
                    { id: 'pulses', label: 'Pulses & Protein' },
                    { id: 'seeds', label: 'Super Seeds & Herbs' },
                  ].map((cat) => {
                    const isActive = ingredientCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setIngredientCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1 cursor-pointer ${
                          isActive
                            ? 'bg-[#C9A227] text-white shadow-sm ring-2 ring-[#C9A227]/30'
                            : cat.highlight
                            ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50'
                            : 'bg-gray-100 dark:bg-[#1E1E1E] text-gray-700 dark:text-[#C5BCAB] hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
                        }`}
                      >
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Compact Search Input */}
                <div className="relative w-full md:w-64 shrink-0">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={ingredientSearch}
                    onChange={(e) => setIngredientSearch(e.target.value)}
                    placeholder="Search grains, Hindi names..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2A20] text-gray-900 dark:text-[#FDFBF7] placeholder-gray-400 focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all"
                  />
                  {ingredientSearch && (
                    <button
                      type="button"
                      onClick={() => setIngredientSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* GRID OF INGREDIENT PHOTO CARDS */}
              {filteredGrains.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-gray-300 dark:border-[#333333] bg-gray-50/50 dark:bg-[#141414]/50 space-y-2">
                  <Scale className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    No ingredients match "{ingredientSearch || ingredientCategory}"
                  </p>
                  <p className="text-xs text-gray-400">
                    Try searching another grain name or select "All Grains"
                  </p>
                  <button
                    type="button"
                    onClick={() => { setIngredientCategory('all'); setIngredientSearch(''); }}
                    className="mt-2 px-3 py-1 text-xs font-bold text-[#C9A227] border border-[#C9A227]/40 rounded-full hover:bg-[#C9A227]/10 cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4 lg:gap-5">
                  {filteredGrains.map((grain) => {
                    const isPendingPrice = grain.priceStatus === 'pending_configuration' || grain.pricePerKg == null;
                    const currentKg = customIngredients[grain.name] || 0;
                    const itemCost = isPendingPrice ? 0 : Math.round(currentKg * (grain.pricePerKg || 0));
                    const meta = getIngredientMeta(grain);
                    const pctOfBlend = Math.round((currentKg / TARGET_CUSTOM_WEIGHT) * 100);

                    return (
                      <React.Fragment key={grain._id || grain.ingredientId || grain.name}>
                        {/* ========================================================
                            1. MOBILE-ONLY PRO-LEVEL ARTISANAL LIGHT CARD (< 768px)
                            Luminous light canvas with dedicated macro grain window
                            ======================================================== */}
                        <div
                          className={`md:hidden relative flex flex-col justify-between rounded-2xl overflow-hidden transition-all duration-200 select-none shadow-xs ${
                            currentKg > 0 
                              ? 'bg-amber-50/40 dark:bg-[#1E1B14] border-2 border-[#C9A227] ring-2 ring-[#C9A227]/25 shadow-md' 
                              : isPendingPrice
                              ? 'bg-stone-50/50 dark:bg-[#181612] border border-amber-300/60 opacity-80'
                              : 'bg-white dark:bg-[#1A1815] border border-stone-200/90 dark:border-[#2E2A20] hover:border-amber-300/80 hover:shadow-md'
                          }`}
                        >
                          {/* Top: Natural High-Resolution Macro Grain Photo Window */}
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
                            <img
                              src={meta.image}
                              alt={grain.name}
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/ingredients/sharbati-wheat.jpg';
                              }}
                              className="w-full h-full object-cover object-center"
                            />

                            {/* Gentle top vignette so badges stay crisp */}
                            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />

                            {/* Top Row: Category tag left, Price pill right */}
                            <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-10">
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/95 dark:bg-black/75 text-stone-700 dark:text-stone-300 border border-stone-200/70 dark:border-white/10 shadow-2xs truncate max-w-[85px]">
                                {meta.category || grain.category}
                              </span>

                              {isPendingPrice ? (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold backdrop-blur-md bg-amber-600 text-white shadow-xs shrink-0 flex items-center space-x-0.5 border border-amber-400/40">
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  <span>Pending</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md bg-[#C9A227] text-white shadow-sm border border-amber-200/40 font-mono shrink-0">
                                  ₹{grain.pricePerKg}/k
                                </span>
                              )}
                            </div>

                            {/* Active Allocation Floating Strip on photo when selected */}
                            {currentKg > 0 && (
                              <div className="absolute bottom-1.5 inset-x-1.5 z-10 flex items-center justify-between backdrop-blur-md bg-emerald-950/90 border border-emerald-400/60 rounded-lg px-2 py-0.5 text-white shadow-sm">
                                <div className="flex items-center space-x-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span className="text-[10px] font-extrabold text-emerald-200 font-mono">
                                    {currentKg} kg
                                  </span>
                                  <span className="text-[8.5px] text-emerald-300/90 font-normal">
                                    ({pctOfBlend}%)
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-100 font-mono">
                                  ₹{itemCost}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Bottom: Crisp Light Porcelain Body with Details & Controls */}
                          <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 gap-2 bg-white dark:bg-[#1A1815]">
                            {/* Grain Title & Hindi Subtitle */}
                            <div className="space-y-0.5">
                              <h4 className="font-sans font-bold text-xs sm:text-sm text-stone-900 dark:text-[#FDFBF7] tracking-tight truncate leading-tight">
                                {grain.name}
                              </h4>

                              {meta.hindiName && (
                                <p className="text-[10px] font-medium text-amber-800 dark:text-[#D4AF37] leading-tight truncate">
                                  {meta.hindiName}
                                </p>
                              )}
                            </div>

                            {/* Middle: Active Allocation Badge or Soft Cream Quick Add Pills */}
                            {currentKg > 0 ? (
                              <div className="flex items-center justify-between px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-[9.5px] font-bold font-mono text-emerald-800 dark:text-emerald-300">
                                <span className="text-[8.5px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-sans font-semibold">Allocated</span>
                                <span>{currentKg} kg · ₹{itemCost}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-[8.5px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">Quick:</span>
                                {[1, 2].map((amt) => {
                                  const wouldExceed = (currentTotalWeight + amt) > TARGET_CUSTOM_WEIGHT;
                                  return (
                                    <button
                                      key={amt}
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleIngredientWeightChange(grain.name, amt); }}
                                      disabled={wouldExceed}
                                      className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 dark:bg-[#232018] dark:hover:bg-[#2E291C] border border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-300 disabled:opacity-20 text-[9px] font-bold transition-all cursor-pointer active:scale-95"
                                    >
                                      +{amt}k
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Stepper Controls in tactile light styling */}
                            <div className="w-full">
                              {isPendingPrice ? (
                                <div className="py-1 px-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[9px] text-amber-800 dark:text-amber-300 text-center font-medium">
                                  Rate pending setup
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-1 w-full bg-stone-50 dark:bg-[#201D17] p-1 rounded-xl border border-stone-200/90 dark:border-[#2E2A20] shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleIngredientWeightChange(grain.name, Math.max(0, Number((currentKg - 0.5).toFixed(2)))); }}
                                    disabled={currentKg <= 0}
                                    className="w-7 h-7 rounded-lg bg-white dark:bg-[#161411] hover:bg-stone-100 dark:hover:bg-[#28241E] active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700/60 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs"
                                    title="Decrease 0.5 kg"
                                    aria-label={`Decrease ${grain.name}`}
                                  >
                                    <Minus className="w-3 h-3 stroke-[2.5]" />
                                  </button>

                                  <div className="flex items-center justify-center flex-1 min-w-0 px-0.5">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max={TARGET_CUSTOM_WEIGHT}
                                      value={currentKg || ''}
                                      placeholder="0 kg"
                                      onChange={(e) => handleIngredientWeightChange(grain.name, e.target.value)}
                                      className="w-full text-center font-bold text-xs text-stone-900 dark:text-stone-100 bg-transparent outline-none font-mono placeholder-stone-400"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleIngredientWeightChange(grain.name, Number((currentKg + 0.5).toFixed(2))); }}
                                    disabled={currentTotalWeight >= TARGET_CUSTOM_WEIGHT && currentKg === 0}
                                    className="w-7 h-7 rounded-lg bg-gradient-to-r from-amber-400 via-[#C9A227] to-amber-500 hover:brightness-105 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed text-stone-950 flex items-center justify-center transition-all shadow-xs cursor-pointer font-bold shrink-0"
                                    title="Increase 0.5 kg"
                                    aria-label={`Increase ${grain.name}`}
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>

                                  {currentKg > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleRemoveIngredient(grain.name); }}
                                      className="w-6 h-7 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                      title={`Remove ${grain.name}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ========================================================
                            2. DESKTOP & TABLET CARD (>= 768px)
                            Preserved 100% untouched for laptop/desktop/tablet
                            ======================================================== */}
                        <div
                          className={`hidden md:flex relative flex-col rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden shadow-xs hover:shadow-lg ${
                            currentKg > 0 
                              ? 'bg-amber-50/40 dark:bg-[#1E1B14] border-[#C9A227] dark:border-[#C9A227] ring-2 ring-[#C9A227]/25 shadow-md' 
                              : isPendingPrice
                              ? 'bg-stone-50/30 dark:bg-[#181612] border-amber-200/60 dark:border-amber-900/30 opacity-80'
                              : 'bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2E2A20] hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                        >
                          {/* Top: Realistic Macro Photography Container */}
                          <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-stone-100 dark:bg-[#1A1A1A]">
                            <img
                              src={meta.image}
                              alt={grain.name}
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/ingredients/sharbati-wheat.jpg';
                              }}
                              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                            />

                            {/* Gradient shadow for text contrast */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                            {/* Top-Left Category Badge */}
                            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/60 text-white/95 border border-white/20 shadow-xs">
                                {meta.category || grain.category}
                              </span>
                              {grain.ingredientId && (
                                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[9px] font-mono backdrop-blur-md bg-black/50 text-amber-200 border border-white/10">
                                  {grain.ingredientId}
                                </span>
                              )}
                            </div>

                            {/* Top-Right Price Tag */}
                            <div className="absolute top-2.5 right-2.5 z-10">
                              {isPendingPrice ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md bg-amber-600/90 text-white shadow-xs flex items-center space-x-1 border border-amber-300/40">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Price Pending</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md bg-[#C9A227]/95 text-white shadow-md border border-amber-200/40 font-mono">
                                  ₹{grain.pricePerKg}/kg
                                </span>
                              )}
                            </div>

                            {/* Active Allocation Banner overlay on photo */}
                            {currentKg > 0 && (
                              <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between backdrop-blur-md bg-emerald-950/85 border border-emerald-400/60 rounded-xl px-2.5 py-1.5 text-white shadow-md">
                                <div className="flex items-center space-x-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  <span className="text-xs font-extrabold text-emerald-200 font-mono">
                                    {currentKg} kg
                                  </span>
                                  <span className="text-[10px] text-emerald-300/80">
                                    ({pctOfBlend}%)
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-emerald-100 font-mono">
                                  ₹{itemCost}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Card Content Body */}
                          <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between space-y-3 bg-white dark:bg-[#181818]">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <h4 className="font-sans font-bold text-sm sm:text-base text-gray-900 dark:text-[#FDFBF7] tracking-tight group-hover:text-[#C9A227] transition-colors">
                                    {grain.name}
                                  </h4>
                                  {meta.hindiName && (
                                    <p className="text-[11px] font-medium text-amber-700 dark:text-[#D4AF37] leading-snug">
                                      {meta.hindiName}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <p className="text-[11px] text-gray-500 dark:text-[#99907C] line-clamp-2 mt-1 leading-relaxed">
                                {grain.benefits || meta.tagline || grain.subtitle}
                              </p>

                              {meta.keyNutrient && (
                                <div className="mt-2 inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-[#201D14] border border-[#C9A227]/30 text-[10px] font-medium text-amber-900 dark:text-[#D4AF37]">
                                  <Sparkles className="w-2.5 h-2.5 text-[#C9A227] shrink-0" />
                                  <span className="truncate">{meta.keyNutrient}</span>
                                </div>
                              )}
                            </div>

                            {/* Stepper & Allocation Controls */}
                            <div className="pt-2 border-t border-gray-100 dark:border-[#262626] space-y-2">
                              {isPendingPrice ? (
                                <div className="py-2 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Awaiting admin rate configuration.</span>
                                </div>
                              ) : (
                                <>
                                  {/* Stepper Row */}
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="flex items-center space-x-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleIngredientWeightChange(grain.name, Math.max(0, Number((currentKg - 0.5).toFixed(2))))}
                                        disabled={currentKg <= 0}
                                        className="w-8 h-8 rounded-xl border border-gray-200 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#141414] hover:bg-gray-100 dark:hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed text-gray-800 dark:text-[#FDFBF7] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                                        title="Decrease 0.5 kg"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>

                                      <div className="relative flex items-center">
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max={TARGET_CUSTOM_WEIGHT}
                                          value={currentKg || ''}
                                          placeholder="0.0"
                                          onChange={(e) => handleIngredientWeightChange(grain.name, e.target.value)}
                                          className="w-16 h-8 px-1 pr-4 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2A20] text-center font-bold text-xs text-gray-900 dark:text-[#FDFBF7] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                        />
                                        <span className="absolute right-1 text-[9px] font-medium text-gray-400 pointer-events-none">kg</span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleIngredientWeightChange(grain.name, Number((currentKg + 0.5).toFixed(2)))}
                                        disabled={currentTotalWeight >= TARGET_CUSTOM_WEIGHT && currentKg === 0}
                                        className="w-8 h-8 rounded-xl border border-gray-200 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#141414] hover:bg-gray-100 dark:hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed text-gray-800 dark:text-[#FDFBF7] flex items-center justify-center transition-all shadow-xs active:scale-95 cursor-pointer"
                                        title="Increase 0.5 kg"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Clear button if currently in blend */}
                                    {currentKg > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveIngredient(grain.name)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ml-auto cursor-pointer"
                                        title={`Remove ${grain.name} from blend`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Quick addition chips */}
                                  <div className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar">
                                    <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-[#8B826F] shrink-0 mr-0.5">
                                      Quick:
                                    </span>
                                    {[0.5, 1, 2, 5].map((amt) => {
                                      const wouldExceed = (currentTotalWeight + amt) > TARGET_CUSTOM_WEIGHT;
                                      return (
                                        <button
                                          key={amt}
                                          type="button"
                                          onClick={() => handleIngredientWeightChange(grain.name, Number((currentKg + amt).toFixed(2)))}
                                          disabled={wouldExceed}
                                          className="px-2 py-0.5 rounded-lg border border-gray-200 dark:border-[#2E2A20] hover:border-[#C9A227] hover:bg-amber-50 dark:hover:bg-[#252219] disabled:opacity-25 disabled:cursor-not-allowed text-[10px] font-semibold text-gray-700 dark:text-[#D0C5AF] transition-all shrink-0 cursor-pointer"
                                        >
                                          +{amt}k
                                        </button>
                                      );
                                    })}

                                    {/* Smart Fill chip if remaining weight fits */}
                                    {remainingWeight > 0 && remainingWeight <= 5 && currentKg === 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleIngredientWeightChange(grain.name, remainingWeight)}
                                        className="px-2 py-0.5 rounded-lg border border-emerald-400/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] transition-all shrink-0 hover:bg-emerald-100 cursor-pointer"
                                        title={`Allocate entire remaining ${remainingWeight} kg to ${grain.name}`}
                                      >
                                        Fill {remainingWeight}k
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
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

            {/* In-Flow Custom Blend Add to Cart CTA */}
            <div className="pt-2">
              <button
                onClick={handleAddCustomToCart}
                disabled={!isCustomBlendReady}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.99] cursor-pointer ${
                  isCustomBlendReady
                    ? 'bg-[#C9A227] hover:bg-[#B58F1E] text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-[#202020] border border-gray-200 dark:border-[#2E2A20] text-gray-400 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isCustomBlendReady 
                    ? `Add 10 kg Custom Blend to Cart (₹${customPricingBreakdown.finalPrice})` 
                    : remainingWeight > 0 
                    ? `Add ${remainingWeight} kg more to complete 10 kg batch` 
                    : `Reduce ${Math.abs(remainingWeight)} kg to complete 10 kg batch`}
                </span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================
            EDUCATIONAL KNOWLEDGE HUB & FAQS (REQUIREMENTS 3, 5, 6, 7)
            9 Factual Articles, 8 FAQs, Hindi/Hinglish Search Keywords,
            and Mandatory Health-Claim Safeguards
            ======================================================== */}
        <section aria-label="Arogya Bhog Nutrition and Atta Knowledge Hub" className="mt-12 pt-8 border-t border-gray-200 dark:border-[#2E2A20] space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-caps text-[#C9A227] px-3 py-1 rounded-full bg-amber-50 dark:bg-[#1A1A1A] border border-[#C9A227]/40 inline-block">
              Knowledge Hub & Dietary Transparency
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#FDFBF7]">
              Arogya Bhog Flour & Nutrition Guides
            </h2>
            <p className="font-sans text-xs sm:text-sm text-gray-600 dark:text-[#99907C] leading-relaxed">
              At <strong>Arogya Bhog</strong>, we believe in honest nourishment and total ingredient transparency. Explore verified grain profiles, nutritional science, and practical dietary guidance for everyday family well-being.
            </p>

            {/* Click-to-open dropdown button */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setIsKnowledgeHubOpen((prev) => !prev)}
                aria-expanded={isKnowledgeHubOpen}
                aria-controls="arogya-knowledge-hub-content"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider bg-white dark:bg-[#1E1B15] text-[#C9A227] hover:text-[#B58F1E] border-2 border-[#C9A227]/70 hover:border-[#C9A227] shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98"
              >
                <BookOpen className="w-4 h-4 text-[#C9A227]" />
                <span>{isKnowledgeHubOpen ? 'Hide Nutrition Guides & FAQs' : 'Explore Nutrition Guides & FAQs (17)'}</span>
                {isKnowledgeHubOpen ? (
                  <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Content Wrapper: Keeping fully accessible in DOM for SEO */}
          <div
            id="arogya-knowledge-hub-content"
            className={`transition-all duration-300 ${
              isKnowledgeHubOpen ? 'block space-y-6 animate-fadeIn' : 'hidden'
            }`}
          >

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
                            <a
                              href={`/product/${article.relatedProductSlug}`}
                              onClick={(e) => {
                                e.preventDefault();
                                onOpenProductDetail(article.relatedProductSlug);
                              }}
                              className="text-xs font-bold text-[#C9A227] hover:underline flex items-center space-x-1"
                            >
                              <span>View Recipe & Nutrition</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
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
          </div>
        </section>

        {/* Comprehensive SEO & Local Business Footer */}
        <footer className="mt-12 pt-10 pb-20 border-t border-gray-200 dark:border-[#2E2A20] text-gray-700 dark:text-[#C5BAA5] space-y-8 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
            {/* Column 1: Brand & Chakki Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <img 
                  src="/arogyaBhog_logo.png" 
                  alt="Arogya Bhog - Traditional Stone-Milled Atta" 
                  className="w-8 h-8 rounded-full border border-amber-300 dark:border-[#C9A227]/40" 
                />
                <span className="font-serif font-extrabold text-base text-gray-950 dark:text-white tracking-wide">
                  Arogya Bhog
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-600 dark:text-[#99907C]">
                Arogya Bhog crafts traditional cold stone-milled whole grain atta and doctor-calibrated health blends. Freshly stone-ground upon order placement in Kanpur, Uttar Pradesh.
              </p>
              <div className="text-[11px] space-y-1 text-gray-600 dark:text-[#99907C]">
                <p>📍 Service Area: Kanpur, UP (Municipal & Cantt.)</p>
                <p>📞 Order Support: +91 9621496772</p>
                <p>💵 Payment: Cash on Delivery (COD) & UPI</p>
              </div>
            </div>

            {/* Column 2: Health Atta Variants */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                Stone-Milled Health Atta
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <a href="/product/everyday-soft-multigrain-atta" onClick={(e) => { e.preventDefault(); if (onOpenProductDetail) onOpenProductDetail('everyday-soft-multigrain-atta'); }} className="hover:text-[#C9A227] transition-colors">
                    Everyday Soft Multigrain Atta
                  </a>
                </li>
                <li>
                  <a href="/product/sugar-care-atta" onClick={(e) => { e.preventDefault(); if (onOpenProductDetail) onOpenProductDetail('sugar-care-atta'); }} className="hover:text-[#C9A227] transition-colors">
                    Sugar Care Atta (Low-GI Blend)
                  </a>
                </li>
                <li>
                  <a href="/product/thyro-care-atta" onClick={(e) => { e.preventDefault(); if (onOpenProductDetail) onOpenProductDetail('thyro-care-atta'); }} className="hover:text-[#C9A227] transition-colors">
                    Thyro Care Atta (Ancient Millets)
                  </a>
                </li>
                <li>
                  <a href="/product/high-protein-atta" onClick={(e) => { e.preventDefault(); if (onOpenProductDetail) onOpenProductDetail('high-protein-atta'); }} className="hover:text-[#C9A227] transition-colors">
                    High Protein Atta (100% Plant Protein)
                  </a>
                </li>
                <li>
                  <a href="/product/vitality-atta" onClick={(e) => { e.preventDefault(); if (onOpenProductDetail) onOpenProductDetail('vitality-atta'); }} className="hover:text-[#C9A227] transition-colors">
                    Vitality Atta (10-Grain Multi-Seed)
                  </a>
                </li>
                <li>
                  <a href="/product/my-choice-atta" onClick={(e) => { e.preventDefault(); if (onOpenProductDetail) onOpenProductDetail('my-choice-atta'); }} className="hover:text-[#C9A227] transition-colors">
                    My Choice Atta (Bespoke 10 kg)
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Food Knowledge Centre */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                Food Knowledge & Grain Science
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <a href="/blog" onClick={(e) => { e.preventDefault(); if (handleSwitchTab) handleSwitchTab('blog'); }} className="hover:text-[#C9A227] transition-colors font-medium">
                    All Knowledge Centre Articles →
                  </a>
                </li>
                <li>
                  <a href="/blog/what-is-multigrain-atta" className="hover:text-[#C9A227] transition-colors">
                    What is Multigrain Atta?
                  </a>
                </li>
                <li>
                  <a href="/blog/whole-wheat-vs-multigrain" className="hover:text-[#C9A227] transition-colors">
                    Whole Wheat vs Multigrain
                  </a>
                </li>
                <li>
                  <a href="/blog/understanding-protein-and-fibre" className="hover:text-[#C9A227] transition-colors">
                    Protein & Fibre in Flour
                  </a>
                </li>
                <li>
                  <a href="/blog/how-to-read-ingredient-label" className="hover:text-[#C9A227] transition-colors">
                    How to Read Atta Labels
                  </a>
                </li>
                <li>
                  <a href="/blog/how-to-create-custom-blend" className="hover:text-[#C9A227] transition-colors">
                    Custom Blend Formulation Guide
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Interactive Blending Tools */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white">
                Customer Blending Studio
              </h5>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => handleSwitchTab('customBlender')} className="hover:text-[#C9A227] transition-colors text-left">
                    Live Chakki Blender (10 kg Batch)
                  </button>
                </li>
                <li>
                  <button onClick={onNavigateToAyurvedicAI} className="hover:text-[#C9A227] transition-colors text-left">
                    Ayurvedic AI Formulation Advisor
                  </button>
                </li>
                <li>
                  <span className="text-gray-500 dark:text-[#888]">
                    Milling fineness: Coarse, Medium Phulka, Fine
                  </span>
                </li>
                <li>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    100% Whole Grains • Zero Preservatives
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom Bar */}
          <div className="pt-6 border-t border-gray-200/80 dark:border-[#2E2A20] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-[#8B826F]">
            <p>
              © {new Date().getFullYear()} <strong className="text-gray-700 dark:text-[#D0C5AF]">Arogya Bhog</strong>. All rights reserved. Milled fresh in Kanpur, UP.
            </p>
            <p className="text-[10px] text-center sm:text-right max-w-md">
              Arogya Bhog flours are authentic nutritional foods, not medical cures or treatments.
            </p>
          </div>
        </footer>

      </div>

    </div>
  );
}
