import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Info, 
  ChevronRight, 
  Sliders, 
  AlertCircle,
  Share2
} from 'lucide-react';
import { PRODUCT_SEO_CATALOG, getProductSlug } from '../utils/productSeoData';

export function ProductDetailView({
  slug,
  products = [],
  onAddToCart,
  onBackToStudio,
  onSelectProduct,
  onOpenCustomBlender,
  onOpenCart
}) {
  const seoData = PRODUCT_SEO_CATALOG[slug] || PRODUCT_SEO_CATALOG['everyday-soft-multigrain-atta'];
  
  // Find matching backend product if available
  const backendProduct = products.find(p => {
    const pSlug = getProductSlug(p);
    return pSlug === slug;
  });

  const product = backendProduct || {
    _id: seoData.productId,
    productId: seoData.productId,
    name: seoData.name,
    sellingPrice: seoData.sellingPrice,
    mrpPrice: seoData.mrpPrice,
    tagline: seoData.tagline,
    badge: seoData.badge,
    badgeType: seoData.badgeType,
    grains: seoData.ingredients.map(i => ({ name: i.name, percentage: i.percentage }))
  };

  const isCustom = slug === 'my-choice-atta';
  const availableSizes = isCustom ? [10] : (seoData.availablePackSizes || [5, 10]);
  const [selectedPackSize, setSelectedPackSize] = useState(isCustom ? 10 : 5);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dynamic Document Title and SEO Metadata injection
  useEffect(() => {
    const originalTitle = document.title;
    document.title = seoData.seoTitle;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute('content', seoData.metaDescription);
    }

    // Update Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonical ? canonical.getAttribute('href') : '';
    if (canonical) {
      canonical.setAttribute('href', seoData.canonicalUrl);
    }

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      // Revert to exact official homepage title per Requirement 2
      document.title = 'Arogya Bhog';
      if (metaDesc && originalDesc) metaDesc.setAttribute('content', originalDesc);
      if (canonical && originalCanonical) canonical.setAttribute('href', originalCanonical);
    };
  }, [seoData]);

  const packPrice = Math.round(product.sellingPrice * selectedPackSize);

  const handleAddThisToCart = () => {
    if (isCustom) {
      if (onOpenCustomBlender) onOpenCustomBlender();
      return;
    }

    setIsAdding(true);
    const grainBreakdown = (product.grains || []).map(g => ({
      name: g.name,
      percentage: g.percentage,
      weightKg: Number(((g.percentage / 100) * selectedPackSize).toFixed(2)),
      pricePerKg: product.sellingPrice,
      calculatedPrice: Math.round(((g.percentage / 100) * selectedPackSize) * product.sellingPrice)
    }));

    const cartItem = {
      productId: product._id || product.productId,
      name: product.name,
      isCustom: false,
      batchSizeKg: selectedPackSize,
      fineness: 'Medium (Phulka)',
      grainBreakdown,
      pricePerKg: product.sellingPrice,
      quantity: 1,
      totalItemPrice: packPrice,
      prebuiltSource: {
        variantName: product.name,
        recipeVersion: '1.0'
      }
    };

    onAddToCart(cartItem);
    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fadeIn pb-24">
      
      {/* Breadcrumb Navigation (Valid Schema breadcrumb trail) */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-gray-500 dark:text-[#99907C]">
        <button 
          onClick={onBackToStudio}
          className="hover:text-[#C9A227] transition-colors flex items-center space-x-1"
        >
          <span>Home</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button 
          onClick={onBackToStudio}
          className="hover:text-[#C9A227] transition-colors"
        >
          <span>Flour Studio</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#C9A227] font-semibold truncate max-w-[180px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Top Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToStudio}
          className="inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-xl border border-gray-200 dark:border-[#2E2A20] bg-white dark:bg-[#181818] hover:border-[#C9A227] text-xs font-semibold text-gray-700 dark:text-[#D0C5AF] transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Health Flours</span>
        </button>

        <button
          onClick={handleShare}
          className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-xl border border-gray-200 dark:border-[#2E2A20] bg-white dark:bg-[#181818] text-xs text-gray-600 dark:text-[#D0C5AF] hover:border-[#C9A227] transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? 'Link Copied!' : 'Share Product'}</span>
        </button>
      </div>

      {/* Main Product Hero & Purchase Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-6 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2E2A20] rounded-2xl shadow-sm">
        
        {/* Product Visual Container */}
        <div className="space-y-3">
          <div className="w-full aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-[#2E2A20] relative bg-amber-50/20 shadow-inner">
            <img 
              src={seoData.imageUrl} 
              alt={seoData.imageAlt}
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
            <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-caps px-2.5 py-1 rounded-lg bg-[#111]/85 text-[#C9A227] backdrop-blur-sm border border-[#C9A227]/40 shadow-md">
              {seoData.badge}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-[#141414] border border-amber-200 dark:border-[#2E2A20] text-[11px] text-gray-700 dark:text-[#B8AF9C] flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#C9A227] flex-shrink-0" />
            <span>Freshly Stone-Milled Whole Grains • Zero Preservatives or Additives</span>
          </div>
        </div>

        {/* Product Details & Ordering Form */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#C9A227] block">
              Arogya Bhog Artisanal Health Flour
            </span>
            
            {/* Primary Page Heading */}
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-gray-900 dark:text-[#FDFBF7] leading-tight">
              {product.name}
            </h1>

            {seoData.tagline && (
              <p className="font-sans text-xs text-[#C9A227] italic">
                {seoData.tagline}
              </p>
            )}

            {/* Pricing Section */}
            <div className="pt-2 flex items-baseline space-x-2">
              <span className="font-sans font-bold text-2xl sm:text-3xl text-gray-900 dark:text-[#FDFBF7]">
                ₹{packPrice}
              </span>
              <span className="text-xs text-gray-500 dark:text-[#99907C]">
                for {selectedPackSize} kg (₹{product.sellingPrice}/kg)
              </span>
              {product.mrpPrice > product.sellingPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{Math.round(product.mrpPrice * selectedPackSize)}
                </span>
              )}
            </div>
          </div>

          {/* Package Size Switcher */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#2E2A20]">
            <span className="text-xs text-gray-600 dark:text-[#99907C] uppercase font-bold tracking-wider block">
              Available Package Size:
            </span>
            <div className="flex gap-2">
              {availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedPackSize(size)}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-sans text-xs font-bold uppercase transition-all border ${
                    selectedPackSize === size
                      ? 'border-[#C9A227] bg-[#C9A227] text-white shadow-md'
                      : 'border-gray-200 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#141414] text-gray-700 dark:text-[#D0C5AF]'
                  }`}
                >
                  {size} kg Pack • ₹{Math.round(product.sellingPrice * size)}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Cart Primary Button */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleAddThisToCart}
              disabled={isAdding}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-caps flex items-center justify-center space-x-2 transition-all shadow-md bg-[#C9A227] hover:bg-[#B58F1E] active:scale-[0.98] text-white cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2.2]" />
              <span>
                {isAdding 
                  ? 'Adding to Cart...' 
                  : isCustom
                  ? 'Open Custom Blender (10 kg)'
                  : `Add ${selectedPackSize} kg to Cart • ₹${packPrice}`}
              </span>
            </button>

            <p className="text-[11px] text-gray-500 dark:text-[#8B826F] text-center">
              ✓ Cash on Delivery (COD) Available • Milled Fresh Upon Order
            </p>
          </div>
        </div>

      </div>

      {/* Verified Exact Grain Composition (Database Driven) */}
      <section className="p-5 sm:p-6 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2E2A20] rounded-2xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2E2A20] pb-3">
          <div>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-gray-900 dark:text-[#FDFBF7]">
              Exact Grain & Seed Composition
            </h2>
            <p className="text-xs text-gray-500 dark:text-[#99907C]">
              100% transparent recipe breakdown. Verified whole grains and unadulterated seeds.
            </p>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700">
            Natural Whole Grains
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {seoData.ingredients.map((ing, idx) => (
            <div 
              key={idx}
              className="p-3 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2E2A20] space-y-1"
            >
              <div className="flex justify-between items-center text-xs font-bold text-gray-900 dark:text-[#FDFBF7]">
                <span>{ing.name}</span>
                <span className="text-[#C9A227] font-mono">{ing.percentage}%</span>
              </div>
              {ing.role && (
                <p className="text-[10px] text-gray-500 dark:text-[#8B826F]">
                  {ing.role}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Nutrition Facts Table */}
      {seoData.nutritionPer100g && (
        <section className="p-5 sm:p-6 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2E2A20] rounded-2xl space-y-3 shadow-sm">
          <h2 className="font-editorial text-lg sm:text-xl font-bold text-gray-900 dark:text-[#FDFBF7]">
            Calculated Nutritional Profile (Per 100g)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            {Object.entries(seoData.nutritionPer100g).map(([key, val]) => (
              <div key={key} className="p-2.5 rounded-xl bg-amber-50/40 dark:bg-[#141414] border border-amber-200 dark:border-[#2E2A20]">
                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-[#8B826F] block capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="font-sans font-bold text-sm text-[#C9A227] mt-0.5 block">
                  {val}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 italic">
            *Nutritional values are calculated based on verified ICMR & USDA whole-grain reference datasets.
          </p>
        </section>
      )}

      {/* Product Long Description & Health Context with Medical Disclaimer */}
      <section className="p-5 sm:p-6 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2E2A20] rounded-2xl space-y-4 shadow-sm">
        <h2 className="font-editorial text-lg sm:text-xl font-bold text-gray-900 dark:text-[#FDFBF7]">
          About {product.name}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-gray-700 dark:text-[#D0C5AF] leading-relaxed">
          {seoData.longDescription}
        </p>

        {/* Responsible Health Context & Mandatory Medical Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-[#1C1A14] border border-amber-300 dark:border-[#C9A227]/40 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-900 dark:text-[#E5C158]">
            <Info className="w-4 h-4 text-[#C9A227] flex-shrink-0" />
            <span>Dietary Insights & Transparency</span>
          </div>
          <p className="text-xs text-gray-700 dark:text-[#C5BAA3] leading-relaxed">
            {seoData.healthContext}
          </p>
        </div>
      </section>

      {/* Bilingual Hindi Educational Information Section */}
      {seoData.hindiContext && (
        <section className="p-5 sm:p-6 bg-gradient-to-br from-amber-50/50 via-white to-transparent dark:bg-[#181818] border border-gray-200 dark:border-[#2E2A20] rounded-2xl space-y-2 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-[#C9A227] tracking-wider block">
            आटे की सामग्री और पोषण (Hindi / Hinglish Guide)
          </span>
          <h3 className="font-editorial text-base sm:text-lg font-bold text-gray-900 dark:text-[#FDFBF7]">
            {seoData.hindiContext.title}
          </h3>
          <p className="font-sans text-xs text-gray-700 dark:text-[#D0C5AF] leading-relaxed">
            {seoData.hindiContext.content}
          </p>
        </section>
      )}

      {/* Internal Links: Related Health Flours */}
      <section className="space-y-4 pt-4 border-t border-gray-200 dark:border-[#2E2A20]">
        <div className="flex justify-between items-center">
          <h2 className="font-editorial text-lg sm:text-xl font-bold text-gray-900 dark:text-[#FDFBF7]">
            Other Arogya Bhog Speciality Flours
          </h2>
          <button 
            onClick={onBackToStudio}
            className="text-xs font-bold text-[#C9A227] hover:underline"
          >
            View All Flours →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {seoData.relatedSlugs.map(relSlug => {
            const relProduct = PRODUCT_SEO_CATALOG[relSlug];
            if (!relProduct) return null;
            return (
              <div
                key={relSlug}
                onClick={() => onSelectProduct ? onSelectProduct(relSlug) : onBackToStudio()}
                className="p-3.5 rounded-xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2E2A20] hover:border-[#C9A227] transition-all cursor-pointer group space-y-2 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#C9A227] px-2 py-0.5 rounded bg-amber-50 dark:bg-[#121212] border border-[#C9A227]/30">
                    {relProduct.badge}
                  </span>
                  <span className="text-xs font-bold text-gray-900 dark:text-[#FDFBF7]">
                    ₹{relProduct.sellingPrice}/kg
                  </span>
                </div>
                <h3 className="font-editorial text-sm font-bold text-gray-900 dark:text-[#FDFBF7] group-hover:text-[#C9A227] transition-colors line-clamp-1">
                  {relProduct.name}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-[#99907C] line-clamp-2 leading-snug">
                  {relProduct.tagline}
                </p>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
export default ProductDetailView;
