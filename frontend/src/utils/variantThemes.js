/**
 * Variant Themes and Ingredient Visual Profiles for Arogya Bhog
 * 
 * Sourced strictly from verified formulations.
 * Complies with Medical Disclaimer & Clean Nutrition branding rules.
 */

export const VARIANT_THEMES = {
  'high-protein-atta': {
    slug: 'high-protein-atta',
    name: 'High Protein Atta',
    bgImage: '/variants/high-protein-atta.jpg',
    positioning: 'A grain-and-seed blend for protein-conscious diets.',
    badge: '100% PLANT PROTEIN',
    badgeClass: 'border-emerald-600/40 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40',
    cardBorder: 'border-emerald-700/20 dark:border-emerald-600/25 hover:border-emerald-600/60 hover:shadow-emerald-950/10',
    accentText: 'text-emerald-700 dark:text-emerald-300',
    accentBg: 'bg-emerald-600/10 dark:bg-emerald-500/15',
    tableBg: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-900/10 dark:border-emerald-800/30',
    tableHeaderBg: 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200',
    rowTint: 'hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20',
    pctBadge: 'bg-emerald-700/10 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300 border-emerald-600/20',
    benefits: ['Protein Source', 'Whole Grains', 'Dietary Fibre', 'Seed Blend'],
    benefitBadgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
  },

  'sugar-care-atta': {
    slug: 'sugar-care-atta',
    name: 'Sugar Care Atta',
    bgImage: '/variants/sugar-care-atta.jpg',
    positioning: 'A multigrain blend for everyday mindful nutrition.',
    badge: 'LOW GLYCEMIC INDEX',
    badgeClass: 'border-teal-600/40 text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40',
    cardBorder: 'border-teal-700/20 dark:border-teal-600/25 hover:border-teal-600/60 hover:shadow-teal-950/10',
    accentText: 'text-teal-700 dark:text-teal-300',
    accentBg: 'bg-teal-600/10 dark:bg-teal-500/15',
    tableBg: 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-900/10 dark:border-teal-800/30',
    tableHeaderBg: 'bg-teal-100/50 dark:bg-teal-900/30 text-teal-900 dark:text-teal-200',
    rowTint: 'hover:bg-teal-50/80 dark:hover:bg-teal-900/20',
    pctBadge: 'bg-teal-700/10 text-teal-800 dark:bg-teal-400/15 dark:text-teal-300 border-teal-600/20',
    benefits: ['Everyday Nutrition', 'Soluble Fibre', 'Ancient Millets', 'Whole Grains'],
    benefitBadgeClass: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50'
  },

  'thyro-care-atta': {
    slug: 'thyro-care-atta',
    name: 'Thyro Care Atta',
    bgImage: '/variants/thyro-care-atta.jpg',
    positioning: 'A distinctive blend of grains, pulses, and seeds.',
    badge: 'MINERAL-RICH AMARANTH & SEEDS',
    badgeClass: 'border-purple-600/40 text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40',
    cardBorder: 'border-purple-700/20 dark:border-purple-600/25 hover:border-purple-600/60 hover:shadow-purple-950/10',
    accentText: 'text-purple-700 dark:text-purple-300',
    accentBg: 'bg-purple-600/10 dark:bg-purple-500/15',
    tableBg: 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-900/10 dark:border-purple-800/30',
    tableHeaderBg: 'bg-purple-100/50 dark:bg-purple-900/30 text-purple-900 dark:text-purple-200',
    rowTint: 'hover:bg-purple-50/80 dark:hover:bg-purple-900/20',
    pctBadge: 'bg-purple-700/10 text-purple-800 dark:bg-purple-400/15 dark:text-purple-300 border-purple-600/20',
    benefits: ['Mineral Blend', 'Dietary Selenium & Zinc', 'Ancient Supergrains', 'Seed Enriched'],
    benefitBadgeClass: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50'
  },

  'everyday-soft-multigrain-atta': {
    slug: 'everyday-soft-multigrain-atta',
    name: 'Everyday Soft Multigrain Atta',
    bgImage: '/variants/everyday-soft-multigrain-atta.jpg',
    positioning: 'Wholesome grains for everyday family meals.',
    badge: 'SOFT & PUFFY ROTIS',
    badgeClass: 'border-amber-600/40 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40',
    cardBorder: 'border-amber-700/20 dark:border-amber-600/25 hover:border-amber-600/60 hover:shadow-amber-950/10',
    accentText: 'text-amber-700 dark:text-amber-300',
    accentBg: 'bg-amber-600/10 dark:bg-amber-500/15',
    tableBg: 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-900/10 dark:border-amber-800/30',
    tableHeaderBg: 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200',
    rowTint: 'hover:bg-amber-50/80 dark:hover:bg-amber-900/20',
    pctBadge: 'bg-amber-700/10 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300 border-amber-600/20',
    benefits: ['Whole Grains', 'Daily Family Nutrition', 'Soft Rotis', 'Dietary Fibre'],
    benefitBadgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
  },

  'vitality-atta': {
    slug: 'vitality-atta',
    name: 'Vitality Atta',
    bgImage: '/variants/vitality-atta.jpg',
    positioning: 'A nourishing blend for an active lifestyle.',
    badge: '10-GRAIN BOTANICAL WELLNESS',
    badgeClass: 'border-rose-600/40 text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40',
    cardBorder: 'border-rose-700/20 dark:border-rose-600/25 hover:border-rose-600/60 hover:shadow-rose-950/10',
    accentText: 'text-rose-700 dark:text-rose-300',
    accentBg: 'bg-rose-600/10 dark:bg-rose-500/15',
    tableBg: 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-900/10 dark:border-rose-800/30',
    tableHeaderBg: 'bg-rose-100/50 dark:bg-rose-900/30 text-rose-900 dark:text-rose-200',
    rowTint: 'hover:bg-rose-50/80 dark:hover:bg-rose-900/20',
    pctBadge: 'bg-rose-700/10 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300 border-rose-600/20',
    benefits: ['10-Grain Blend', 'Botanical Seeds', 'Active Energy', 'Dietary Fibre'],
    benefitBadgeClass: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50'
  },

  'my-choice-atta': {
    slug: 'my-choice-atta',
    name: 'My Choice Atta',
    bgImage: '/variants/my-choice-atta.jpg',
    positioning: 'Customize your blend to suit your preferences.',
    badge: 'CUSTOMER BESPOKE BLEND • 10 KG',
    badgeClass: 'border-[#C9A227] text-[#C9A227] bg-[#C9A227]/10',
    cardBorder: 'border-[#C9A227]/50 dark:border-[#C9A227]/40 hover:border-[#C9A227] hover:shadow-amber-950/15',
    accentText: 'text-[#C9A227]',
    accentBg: 'bg-[#C9A227]/10 dark:bg-[#C9A227]/15',
    tableBg: 'bg-amber-50/50 dark:bg-[#1a1710] border-[#C9A227]/20',
    tableHeaderBg: 'bg-amber-100/60 dark:bg-[#C9A227]/20 text-[#C9A227]',
    rowTint: 'hover:bg-[#C9A227]/10',
    pctBadge: 'bg-[#C9A227]/15 text-[#C9A227] border-[#C9A227]/30',
    benefits: ['18 Master Grains', '100% Custom Ratios', 'Fresh Stone Milled', 'Exact 10 kg Batch'],
    benefitBadgeClass: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-[#C9A227] dark:border-[#C9A227]/40'
  }
};

/**
 * Helper to fetch theme for a product or slug
 */
export function getVariantTheme(slugOrProduct) {
  if (!slugOrProduct) return VARIANT_THEMES['everyday-soft-multigrain-atta'];
  
  const slug = typeof slugOrProduct === 'string' 
    ? slugOrProduct 
    : (slugOrProduct.slug || (slugOrProduct.name ? slugOrProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : ''));

  return VARIANT_THEMES[slug] || VARIANT_THEMES['everyday-soft-multigrain-atta'];
}
