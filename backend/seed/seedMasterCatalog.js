require('dotenv').config();
const mongoose = require('mongoose');
const Grain = require('../models/Grain');
const Product = require('../models/Product');
const OperationalCost = require('../models/OperationalCost');

// 1. MASTER OPERATIONAL COSTS
const MASTER_OPERATIONAL_COSTS = [
  {
    costId: 'OP-001',
    name: 'Slow Stone Chakki Milling',
    amount: 4.00,
    unit: 'Per kg',
    category: 'milling',
    description: 'Slow-stone chakki milling, grain cleaning, and roasting charge'
  },
  {
    costId: 'OP-002',
    name: 'Packaging Pouch (5 kg)',
    amount: 5.00,
    unit: 'Per 5 kg pouch',
    category: 'packaging',
    packageSize: 5,
    description: 'Aroma-lock 3-layer food-grade moisture barrier pouch for 5 kg'
  },
  {
    costId: 'OP-002-1',
    name: 'Packaging Pouch (1 kg)',
    amount: 2.50,
    unit: 'Per 1 kg pouch',
    category: 'packaging',
    packageSize: 1,
    description: 'Aroma-lock 3-layer food-grade moisture barrier pouch for 1 kg'
  },
  {
    costId: 'OP-002-10',
    name: 'Packaging Pouch (10 kg)',
    amount: 10.00,
    unit: 'Per 10 kg pouch',
    category: 'packaging',
    packageSize: 10,
    description: 'Heavy-duty food-grade moisture barrier packaging for 10 kg'
  },
  {
    costId: 'OP-003',
    name: 'Doorstep Delivery',
    amount: 50.00,
    unit: 'Per delivery parcel',
    category: 'delivery',
    description: 'Same-day cold-chain doorstep delivery per parcel'
  },
  {
    costId: 'OP-004',
    name: 'Packaging Label & Printing',
    amount: 1.50,
    unit: 'Per label',
    category: 'packaging',
    description: 'QR-coded batch label, nutrition panel & sealing band'
  },
  {
    costId: 'OP-005',
    name: 'Skilled Labour & Sorting',
    amount: 3.00,
    unit: 'Per kg',
    category: 'labour',
    description: 'Grain destoning, grading, batch measuring & packaging labour'
  },
  {
    costId: 'OP-006',
    name: 'Electricity & Overhead',
    amount: 2.00,
    unit: 'Per kg',
    category: 'electricity',
    description: 'Chakki 3-phase power, stone dressing and hygiene upkeep'
  },
  {
    costId: 'OP-007',
    name: 'Grain Cleaning & Milling Wastage',
    amount: 2.00,
    unit: 'Percentage (%)',
    category: 'wastage',
    description: 'Husk, chaff and sifting dust deduction factor (2%)'
  },
  {
    costId: 'OP-008',
    name: 'Marketplace & Payment Gateway Fee',
    amount: 1.80,
    unit: 'Percentage (%)',
    category: 'marketplace',
    description: 'UPI transaction handling & bank gateway commission'
  }
];

// 2. MASTER INGREDIENT CATALOG (18 Master Ingredients with 16 Nutrients)
const MASTER_INGREDIENTS = [
  {
    ingredientId: 'RM-001',
    code: 'RM-001',
    name: 'Sharbati Wheat',
    category: 'Base Grain',
    subtitle: 'Golden Sehore Whole Grain',
    pricePerKg: 35.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 340,
      proteinG: 12.0,
      carbsG: 71.0,
      sugarsG: 2.5,
      addedSugarsG: null,
      fatG: 2.0,
      saturatedFatG: 0.4,
      transFatG: null,
      fibreG: 11.0,
      sodiumMg: 3.0,
      zincMg: 2.8,
      magnesiumMg: 125,
      phosphorusMg: 340,
      ironMg: 3.6,
      calciumMg: 34,
      potassiumMg: 380,
      isConfigured: true
    },
    color: '#f2ca50',
    benefits: 'Soft puffy rotis, easy digestion, premium golden hue'
  },
  {
    ingredientId: 'RM-002',
    code: 'RM-002',
    name: 'Kathi Wheat',
    category: 'Base Grain',
    subtitle: 'High Gluten Native Durum',
    pricePerKg: 40.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 345,
      proteinG: 13.0,
      carbsG: 70.0,
      sugarsG: 2.0,
      addedSugarsG: null,
      fatG: 2.2,
      saturatedFatG: 0.5,
      transFatG: null,
      fibreG: 11.5,
      sodiumMg: 4.0,
      zincMg: 3.0,
      magnesiumMg: 130,
      phosphorusMg: 350,
      ironMg: 3.8,
      calciumMg: 36,
      potassiumMg: 390,
      isConfigured: true
    },
    color: '#e9c46a',
    benefits: 'Dense rotis, rich native wheat protein and natural chew'
  },
  {
    ingredientId: 'RM-003',
    code: 'RM-003',
    name: 'Khapli Wheat (Emmer)',
    category: 'Ancient Grain',
    subtitle: 'Ancient Low-GI Heirloom Wheat',
    pricePerKg: 75.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 335,
      proteinG: 14.5,
      carbsG: 65.0,
      sugarsG: 1.8,
      addedSugarsG: null,
      fatG: 2.5,
      saturatedFatG: 0.4,
      transFatG: null,
      fibreG: 12.5,
      sodiumMg: 5.0,
      zincMg: 3.2,
      magnesiumMg: 140,
      phosphorusMg: 380,
      ironMg: 4.2,
      calciumMg: 40,
      potassiumMg: 410,
      isConfigured: true
    },
    color: '#d4af37',
    benefits: 'Ancient grain, low glycemic load, rich in dietary fiber'
  },
  {
    ingredientId: 'RM-004',
    code: 'RM-004',
    name: 'Black Wheat',
    category: 'Specialty Grain',
    subtitle: 'Anthocyanin-Rich Super Wheat',
    pricePerKg: 85.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 330,
      proteinG: 13.5,
      carbsG: 66.0,
      sugarsG: 2.0,
      addedSugarsG: null,
      fatG: 2.2,
      saturatedFatG: 0.4,
      transFatG: null,
      fibreG: 13.0,
      sodiumMg: 4.0,
      zincMg: 3.5,
      magnesiumMg: 145,
      phosphorusMg: 370,
      ironMg: 4.5,
      calciumMg: 42,
      potassiumMg: 420,
      isConfigured: true
    },
    color: '#3d314a',
    benefits: 'Potent anthocyanins, antioxidant defense and metabolic support'
  },
  {
    ingredientId: 'RM-005',
    code: 'RM-005',
    name: 'Barley (Jau)',
    category: 'Ancient Grain',
    subtitle: 'Soluble Beta-Glucan Grain',
    pricePerKg: 50.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 336,
      proteinG: 10.5,
      carbsG: 69.5,
      sugarsG: 1.5,
      addedSugarsG: null,
      fatG: 1.5,
      saturatedFatG: 0.3,
      transFatG: null,
      fibreG: 15.5,
      sodiumMg: 8.0,
      zincMg: 2.5,
      magnesiumMg: 115,
      phosphorusMg: 260,
      ironMg: 3.2,
      calciumMg: 30,
      potassiumMg: 320,
      isConfigured: true
    },
    color: '#e0a96d',
    benefits: 'Cools the body, flattens blood sugar curves, high beta-glucan'
  },
  {
    ingredientId: 'RM-006',
    code: 'RM-006',
    name: 'Pearl Millet (Bajra)',
    category: 'Millet',
    subtitle: 'Iron & Heat Nourishing Millet',
    pricePerKg: 40.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 361,
      proteinG: 11.6,
      carbsG: 67.5,
      sugarsG: 1.2,
      addedSugarsG: null,
      fatG: 5.0,
      saturatedFatG: 1.0,
      transFatG: null,
      fibreG: 11.0,
      sodiumMg: 6.0,
      zincMg: 3.1,
      magnesiumMg: 137,
      phosphorusMg: 290,
      ironMg: 8.0,
      calciumMg: 42,
      potassiumMg: 390,
      isConfigured: true
    },
    color: '#936639',
    benefits: 'High dietary iron, energetic warmth and sustained stamina'
  },
  {
    ingredientId: 'RM-007',
    code: 'RM-007',
    name: 'Sorghum (Jowar)',
    category: 'Millet',
    subtitle: 'Light Gluten-Free Digestible Millet',
    pricePerKg: 60.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 349,
      proteinG: 10.4,
      carbsG: 72.6,
      sugarsG: 1.5,
      addedSugarsG: null,
      fatG: 1.9,
      saturatedFatG: 0.4,
      transFatG: null,
      fibreG: 9.7,
      sodiumMg: 4.0,
      zincMg: 1.9,
      magnesiumMg: 140,
      phosphorusMg: 287,
      ironMg: 4.1,
      calciumMg: 25,
      potassiumMg: 363,
      isConfigured: true
    },
    color: '#faedcd',
    benefits: 'Light on stomach, gentle for gut health and gluten-free'
  },
  {
    ingredientId: 'RM-008',
    code: 'RM-008',
    name: 'Finger Millet (Ragi)',
    category: 'Millet',
    subtitle: 'Calcium Powerhouse Millet',
    pricePerKg: 70.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: 'Extremely high calcium (344mg)',
    flaggedForVerification: true,
    nutrition: {
      energyKcal: 328,
      proteinG: 7.3,
      carbsG: 72.0,
      sugarsG: 1.0,
      addedSugarsG: null,
      fatG: 1.3,
      saturatedFatG: 0.3,
      transFatG: null,
      fibreG: 11.5,
      sodiumMg: 5.0,
      zincMg: 2.3,
      magnesiumMg: 137,
      phosphorusMg: 283,
      ironMg: 3.9,
      calciumMg: 344,
      potassiumMg: 408,
      isConfigured: true
    },
    color: '#7f4f24',
    benefits: 'Bone density, 344mg natural calcium per 100g, cooling vitality'
  },
  {
    ingredientId: 'RM-009',
    code: 'RM-009',
    name: 'Corn (Makka)',
    category: 'Grain',
    subtitle: 'Golden Zeaxanthin Grain',
    pricePerKg: 45.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 365,
      proteinG: 9.4,
      carbsG: 74.3,
      sugarsG: 2.2,
      addedSugarsG: null,
      fatG: 4.7,
      saturatedFatG: 0.7,
      transFatG: null,
      fibreG: 7.3,
      sodiumMg: 15.0,
      zincMg: 2.2,
      magnesiumMg: 127,
      phosphorusMg: 210,
      ironMg: 2.7,
      calciumMg: 7,
      potassiumMg: 287,
      isConfigured: true
    },
    color: '#ffb703',
    benefits: 'Sweet aromatic flour, carotenes for eye health and energy'
  },
  {
    ingredientId: 'RM-010',
    code: 'RM-010',
    name: 'Bengal Gram (Chana)',
    category: 'Pulse',
    subtitle: 'Roasted Desi Kala Chana',
    pricePerKg: 90.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 364,
      proteinG: 20.5,
      carbsG: 58.0,
      sugarsG: 3.0,
      addedSugarsG: null,
      fatG: 5.6,
      saturatedFatG: 0.6,
      transFatG: null,
      fibreG: 12.0,
      sodiumMg: 24.0,
      zincMg: 3.4,
      magnesiumMg: 115,
      phosphorusMg: 340,
      ironMg: 5.5,
      calciumMg: 57,
      potassiumMg: 718,
      isConfigured: true
    },
    color: '#8c531b',
    benefits: 'Lean plant protein, muscle recovery, nutty aroma in rotis'
  },
  {
    ingredientId: 'RM-011',
    code: 'RM-011',
    name: 'Soybean',
    category: 'High-Protein Legume',
    subtitle: 'Debittered High-BCAA Bean',
    pricePerKg: 120.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 446,
      proteinG: 36.5,
      carbsG: 30.0,
      sugarsG: 4.0,
      addedSugarsG: null,
      fatG: 19.9,
      saturatedFatG: 2.9,
      transFatG: null,
      fibreG: 9.3,
      sodiumMg: 2.0,
      zincMg: 4.8,
      magnesiumMg: 280,
      phosphorusMg: 704,
      ironMg: 15.7,
      calciumMg: 277,
      potassiumMg: 1797,
      isConfigured: true
    },
    color: '#ccd5ae',
    benefits: 'Complete amino acid profile, highest vegetarian plant protein'
  },
  {
    ingredientId: 'RM-012',
    code: 'RM-012',
    name: 'Oats',
    category: 'Whole Grain',
    subtitle: 'Whole Grain Rolled Avena',
    pricePerKg: 130.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 389,
      proteinG: 16.9,
      carbsG: 66.3,
      sugarsG: 1.0,
      addedSugarsG: null,
      fatG: 6.9,
      saturatedFatG: 1.2,
      transFatG: null,
      fibreG: 10.6,
      sodiumMg: 2.0,
      zincMg: 4.0,
      magnesiumMg: 177,
      phosphorusMg: 523,
      ironMg: 4.7,
      calciumMg: 54,
      potassiumMg: 429,
      isConfigured: true
    },
    color: '#e9ecef',
    benefits: 'Heart health, cholesterol regulation, velvety soft rotis'
  },
  {
    ingredientId: 'RM-013',
    code: 'RM-013',
    name: 'Quinoa',
    category: 'Super Grain',
    subtitle: 'Andean Complete Amino Seed',
    pricePerKg: 280.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 368,
      proteinG: 14.1,
      carbsG: 64.2,
      sugarsG: 2.0,
      addedSugarsG: null,
      fatG: 6.1,
      saturatedFatG: 0.7,
      transFatG: null,
      fibreG: 7.0,
      sodiumMg: 5.0,
      zincMg: 3.1,
      magnesiumMg: 197,
      phosphorusMg: 457,
      ironMg: 4.6,
      calciumMg: 47,
      potassiumMg: 563,
      isConfigured: true
    },
    color: '#d6ccc2',
    benefits: 'All 9 essential amino acids, mineral balance and easy digestion'
  },
  {
    ingredientId: 'RM-014',
    code: 'RM-014',
    name: 'Amaranth (Rajgira)',
    category: 'Ancient Pseudo-cereal',
    subtitle: 'Royal Fasting High-Lysine Grain',
    pricePerKg: 180.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 371,
      proteinG: 13.6,
      carbsG: 65.2,
      sugarsG: 1.7,
      addedSugarsG: null,
      fatG: 7.0,
      saturatedFatG: 1.5,
      transFatG: null,
      fibreG: 6.7,
      sodiumMg: 4.0,
      zincMg: 2.9,
      magnesiumMg: 248,
      phosphorusMg: 557,
      ironMg: 7.6,
      calciumMg: 159,
      potassiumMg: 508,
      isConfigured: true
    },
    color: '#edede9',
    benefits: 'High lysine, gluten-free lightness, Ayurvedic sattvic nourishment'
  },
  {
    ingredientId: 'RM-015',
    code: 'RM-015',
    name: 'Flax Seeds (Alsi)',
    category: 'Omega-3 Oilseed',
    subtitle: 'Cold-Roasted Golden Flax',
    pricePerKg: 150.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 534,
      proteinG: 18.3,
      carbsG: 28.9,
      sugarsG: 1.5,
      addedSugarsG: null,
      fatG: 42.2,
      saturatedFatG: 3.7,
      transFatG: null,
      fibreG: 27.3,
      sodiumMg: 30.0,
      zincMg: 4.3,
      magnesiumMg: 392,
      phosphorusMg: 642,
      ironMg: 5.7,
      calciumMg: 255,
      potassiumMg: 813,
      isConfigured: true
    },
    color: '#b07d62',
    benefits: 'Highest plant Alpha-Linolenic Acid (ALA Omega-3), colon health'
  },
  {
    ingredientId: 'RM-016',
    code: 'RM-016',
    name: 'Chia Seeds',
    category: 'Super Seed',
    subtitle: 'Mucilage-Rich Hydrophilic Seed',
    pricePerKg: 250.00,
    priceStatus: 'configured',
    sourceStatus: 'User-provided base values; minerals are reference estimates',
    verificationStatus: 'User Verified',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 486,
      proteinG: 16.5,
      carbsG: 42.1,
      sugarsG: 0.8,
      addedSugarsG: null,
      fatG: 30.7,
      saturatedFatG: 3.3,
      transFatG: null,
      fibreG: 34.4,
      sodiumMg: 16.0,
      zincMg: 4.6,
      magnesiumMg: 335,
      phosphorusMg: 860,
      ironMg: 7.7,
      calciumMg: 631,
      potassiumMg: 407,
      isConfigured: true
    },
    color: '#212529',
    benefits: 'Unrivaled hydration retention, calcium 631mg, soluble prebiotic fiber'
  },
  {
    ingredientId: 'RM-017',
    code: 'RM-017',
    name: 'White Sesame Seeds (Safed Til)',
    category: 'Seed',
    subtitle: 'Calcium & Healthy Oil Seed',
    pricePerKg: 260.00,
    priceStatus: 'configured',
    sourceStatus: 'Reference estimate',
    verificationStatus: 'Reference Estimate',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 573,
      proteinG: 17.7,
      carbsG: 23.4,
      sugarsG: 0.3,
      addedSugarsG: null,
      fatG: 49.7,
      saturatedFatG: 7.0,
      transFatG: null,
      fibreG: 11.8,
      sodiumMg: 11.0,
      zincMg: 7.8,
      magnesiumMg: 351,
      phosphorusMg: 629,
      ironMg: 14.6,
      calciumMg: 975,
      potassiumMg: 468,
      isConfigured: true
    },
    color: '#f8f9fa',
    benefits: 'Extreme calcium (975mg), rich sesamin, lubrication for joints'
  },
  {
    ingredientId: 'RM-018',
    code: 'RM-018',
    name: 'Fenugreek Seeds (Methi Dana)',
    category: 'Seed / Herb',
    subtitle: 'Galactomannan Bitter Digestive Herb',
    pricePerKg: null, // Pending configuration
    priceStatus: 'pending_configuration',
    sourceStatus: 'Reference estimate',
    verificationStatus: 'Reference Estimate',
    reviewFlag: '',
    flaggedForVerification: false,
    nutrition: {
      energyKcal: 323,
      proteinG: 23.0,
      carbsG: 58.3,
      sugarsG: 1.0,
      addedSugarsG: null,
      fatG: 6.4,
      saturatedFatG: 0.8,
      transFatG: null,
      fibreG: 24.6,
      sodiumMg: 67.0,
      zincMg: 2.5,
      magnesiumMg: 191,
      phosphorusMg: 296,
      ironMg: 33.5,
      calciumMg: 176,
      potassiumMg: 770,
      isConfigured: true
    },
    color: '#b5838d',
    benefits: 'Glucose metabolic enzyme support, iron 33.5mg, digestive tonic'
  }
];

// Helper to compute blend raw cost and all 16 nutrients proportionally per 100g
function computeBlendMetrics(grainsArray, ingredientsMap) {
  let rawIngredientCostPerKg = 0;
  let hasIncompleteCost = false;
  let incompleteCostReason = '';

  const nutrients = {
    energyKcal: 0,
    proteinG: 0,
    carbsG: 0,
    sugarsG: 0,
    addedSugarsG: null,
    fatG: 0,
    saturatedFatG: 0,
    transFatG: null,
    fibreG: 0,
    sodiumMg: 0,
    zincMg: 0,
    magnesiumMg: 0,
    phosphorusMg: 0,
    ironMg: 0,
    calciumMg: 0,
    potassiumMg: 0
  };

  let hasAddedSugars = false;
  let hasTransFat = false;

  for (const item of grainsArray) {
    const ing = ingredientsMap[item.ingredientId];
    const fraction = item.percentage / 100;

    if (!ing || ing.pricePerKg === null || ing.pricePerKg === undefined) {
      hasIncompleteCost = true;
      incompleteCostReason = `Raw ingredient cost incomplete: ${item.name} (${item.ingredientId}) rate pending admin configuration.`;
    } else {
      rawIngredientCostPerKg += fraction * ing.pricePerKg;
    }

    if (ing && ing.nutrition) {
      const n = ing.nutrition;
      if (n.energyKcal != null) nutrients.energyKcal += fraction * n.energyKcal;
      if (n.proteinG != null) nutrients.proteinG += fraction * n.proteinG;
      if (n.carbsG != null) nutrients.carbsG += fraction * n.carbsG;
      if (n.sugarsG != null) nutrients.sugarsG += fraction * n.sugarsG;
      if (n.addedSugarsG != null) {
        hasAddedSugars = true;
        nutrients.addedSugarsG = (nutrients.addedSugarsG || 0) + fraction * n.addedSugarsG;
      }
      if (n.fatG != null) nutrients.fatG += fraction * n.fatG;
      if (n.saturatedFatG != null) nutrients.saturatedFatG += fraction * n.saturatedFatG;
      if (n.transFatG != null) {
        hasTransFat = true;
        nutrients.transFatG = (nutrients.transFatG || 0) + fraction * n.transFatG;
      }
      if (n.fibreG != null) nutrients.fibreG += fraction * n.fibreG;
      if (n.sodiumMg != null) nutrients.sodiumMg += fraction * n.sodiumMg;
      if (n.zincMg != null) nutrients.zincMg += fraction * n.zincMg;
      if (n.magnesiumMg != null) nutrients.magnesiumMg += fraction * n.magnesiumMg;
      if (n.phosphorusMg != null) nutrients.phosphorusMg += fraction * n.phosphorusMg;
      if (n.ironMg != null) nutrients.ironMg += fraction * n.ironMg;
      if (n.calciumMg != null) nutrients.calciumMg += fraction * n.calciumMg;
      if (n.potassiumMg != null) nutrients.potassiumMg += fraction * n.potassiumMg;
    }
  }

  // Format rounded numbers
  const calculatedNutrition = {
    energyKcal: Number(nutrients.energyKcal.toFixed(1)),
    proteinG: Number(nutrients.proteinG.toFixed(1)),
    carbsG: Number(nutrients.carbsG.toFixed(1)),
    sugarsG: Number(nutrients.sugarsG.toFixed(1)),
    addedSugarsG: hasAddedSugars ? Number(nutrients.addedSugarsG.toFixed(1)) : null,
    fatG: Number(nutrients.fatG.toFixed(1)),
    saturatedFatG: Number(nutrients.saturatedFatG.toFixed(1)),
    transFatG: hasTransFat ? Number(nutrients.transFatG.toFixed(1)) : null,
    fibreG: Number(nutrients.fibreG.toFixed(1)),
    sodiumMg: Number(nutrients.sodiumMg.toFixed(1)),
    zincMg: Number(nutrients.zincMg.toFixed(1)),
    magnesiumMg: Number(nutrients.magnesiumMg.toFixed(1)),
    phosphorusMg: Number(nutrients.phosphorusMg.toFixed(1)),
    ironMg: Number(nutrients.ironMg.toFixed(1)),
    calciumMg: Number(nutrients.calciumMg.toFixed(1)),
    potassiumMg: Number(nutrients.potassiumMg.toFixed(1)),
    isComplete: true
  };

  return {
    rawIngredientCostPerKg: hasIncompleteCost ? null : Number(rawIngredientCostPerKg.toFixed(2)),
    hasIncompleteCost,
    incompleteCostReason,
    calculatedNutrition
  };
}

// 3. MASTER PRODUCTS DEFINITIONS
function getMasterProducts(ingredientsMap) {
  // Product 1: Everyday Soft Multigrain Atta (100% total)
  const prod1Grains = [
    { ingredientId: 'RM-001', name: 'Sharbati Wheat', percentage: 75, weightKg5kg: 3.75, weightKg10kg: 7.50, color: '#f2ca50' },
    { ingredientId: 'RM-010', name: 'Bengal Gram (Chana)', percentage: 8, weightKg5kg: 0.40, weightKg10kg: 0.80, color: '#8c531b' },
    { ingredientId: 'RM-005', name: 'Barley (Jau)', percentage: 5, weightKg5kg: 0.25, weightKg10kg: 0.50, color: '#e0a96d' },
    { ingredientId: 'RM-011', name: 'Soybean', percentage: 4, weightKg5kg: 0.20, weightKg10kg: 0.40, color: '#ccd5ae' },
    { ingredientId: 'RM-007', name: 'Sorghum (Jowar)', percentage: 3, weightKg5kg: 0.15, weightKg10kg: 0.30, color: '#faedcd' },
    { ingredientId: 'RM-008', name: 'Finger Millet (Ragi)', percentage: 2, weightKg5kg: 0.10, weightKg10kg: 0.20, color: '#7f4f24' },
    { ingredientId: 'RM-006', name: 'Pearl Millet (Bajra)', percentage: 2, weightKg5kg: 0.10, weightKg10kg: 0.20, color: '#936639' },
    { ingredientId: 'RM-015', name: 'Flax Seeds (Alsi)', percentage: 1, weightKg5kg: 0.05, weightKg10kg: 0.10, color: '#b07d62' }
  ];
  const prod1Metrics = computeBlendMetrics(prod1Grains, ingredientsMap);

  // Product 2: Sugar Care Atta (100% total)
  const prod2Grains = [
    { ingredientId: 'RM-001', name: 'Sharbati Wheat', percentage: 50, weightKg5kg: 2.50, weightKg10kg: 5.00, color: '#f2ca50' },
    { ingredientId: 'RM-005', name: 'Barley (Jau)', percentage: 15, weightKg5kg: 0.75, weightKg10kg: 1.50, color: '#e0a96d' },
    { ingredientId: 'RM-010', name: 'Bengal Gram (Chana)', percentage: 10, weightKg5kg: 0.50, weightKg10kg: 1.00, color: '#8c531b' },
    { ingredientId: 'RM-007', name: 'Sorghum (Jowar)', percentage: 8, weightKg5kg: 0.40, weightKg10kg: 0.80, color: '#faedcd' },
    { ingredientId: 'RM-011', name: 'Soybean', percentage: 5, weightKg5kg: 0.25, weightKg10kg: 0.50, color: '#ccd5ae' },
    { ingredientId: 'RM-008', name: 'Finger Millet (Ragi)', percentage: 5, weightKg5kg: 0.25, weightKg10kg: 0.50, color: '#7f4f24' },
    { ingredientId: 'RM-006', name: 'Pearl Millet (Bajra)', percentage: 4, weightKg5kg: 0.20, weightKg10kg: 0.40, color: '#936639' },
    { ingredientId: 'RM-015', name: 'Flax Seeds (Alsi)', percentage: 3, weightKg5kg: 0.15, weightKg10kg: 0.30, color: '#b07d62' }
  ];
  const prod2Metrics = computeBlendMetrics(prod2Grains, ingredientsMap);

  // Product 3: Thyro Care Atta (100% total)
  const prod3Grains = [
    { ingredientId: 'RM-014', name: 'Amaranth (Rajgira)', percentage: 40, weightKg5kg: 2.00, weightKg10kg: 4.00, color: '#edede9' },
    { ingredientId: 'RM-007', name: 'Sorghum (Jowar)', percentage: 25, weightKg5kg: 1.25, weightKg10kg: 2.50, color: '#faedcd' },
    { ingredientId: 'RM-010', name: 'Bengal Gram (Chana)', percentage: 15, weightKg5kg: 0.75, weightKg10kg: 1.50, color: '#8c531b' },
    { ingredientId: 'RM-008', name: 'Finger Millet (Ragi)', percentage: 10, weightKg5kg: 0.50, weightKg10kg: 1.00, color: '#7f4f24' },
    { ingredientId: 'RM-016', name: 'Chia Seeds', percentage: 5, weightKg5kg: 0.25, weightKg10kg: 0.50, color: '#212529' },
    { ingredientId: 'RM-015', name: 'Flax Seeds (Alsi)', percentage: 5, weightKg5kg: 0.25, weightKg10kg: 0.50, color: '#b07d62' }
  ];
  const prod3Metrics = computeBlendMetrics(prod3Grains, ingredientsMap);

  // Product 4: High Protein Atta (100% total)
  const prod4Grains = [
    { ingredientId: 'RM-001', name: 'Sharbati Wheat', percentage: 60, weightKg5kg: 3.00, weightKg10kg: 6.00, color: '#f2ca50' },
    { ingredientId: 'RM-011', name: 'Soybean', percentage: 15, weightKg5kg: 0.75, weightKg10kg: 1.50, color: '#ccd5ae' },
    { ingredientId: 'RM-010', name: 'Bengal Gram (Chana)', percentage: 12, weightKg5kg: 0.60, weightKg10kg: 1.20, color: '#8c531b' },
    { ingredientId: 'RM-005', name: 'Barley (Jau)', percentage: 8, weightKg5kg: 0.40, weightKg10kg: 0.80, color: '#e0a96d' },
    { ingredientId: 'RM-015', name: 'Flax Seeds (Alsi)', percentage: 3, weightKg5kg: 0.15, weightKg10kg: 0.30, color: '#b07d62' },
    { ingredientId: 'RM-012', name: 'Oats', percentage: 2, weightKg5kg: 0.10, weightKg10kg: 0.20, color: '#e9ecef' }
  ];
  const prod4Metrics = computeBlendMetrics(prod4Grains, ingredientsMap);

  // Product 5: Vitality Atta (100% total)
  const prod5Grains = [
    { ingredientId: 'RM-001', name: 'Sharbati Wheat', percentage: 50, weightKg5kg: 2.50, weightKg10kg: 5.00, color: '#f2ca50' },
    { ingredientId: 'RM-010', name: 'Bengal Gram (Chana)', percentage: 15, weightKg5kg: 0.75, weightKg10kg: 1.50, color: '#8c531b' },
    { ingredientId: 'RM-005', name: 'Barley (Jau)', percentage: 10, weightKg5kg: 0.50, weightKg10kg: 1.00, color: '#e0a96d' },
    { ingredientId: 'RM-008', name: 'Finger Millet (Ragi)', percentage: 10, weightKg5kg: 0.50, weightKg10kg: 1.00, color: '#7f4f24' },
    { ingredientId: 'RM-012', name: 'Oats', percentage: 5, weightKg5kg: 0.25, weightKg10kg: 0.50, color: '#e9ecef' },
    { ingredientId: 'RM-017', name: 'White Sesame Seeds (Safed Til)', percentage: 3, weightKg5kg: 0.15, weightKg10kg: 0.30, color: '#f8f9fa' },
    { ingredientId: 'RM-015', name: 'Flax Seeds (Alsi)', percentage: 3, weightKg5kg: 0.15, weightKg10kg: 0.30, color: '#b07d62' },
    { ingredientId: 'RM-016', name: 'Chia Seeds', percentage: 2, weightKg5kg: 0.10, weightKg10kg: 0.20, color: '#212529' },
    { ingredientId: 'RM-018', name: 'Fenugreek Seeds (Methi Dana)', percentage: 1, weightKg5kg: 0.05, weightKg10kg: 0.10, color: '#b5838d' },
    { ingredientId: 'RM-013', name: 'Quinoa', percentage: 1, weightKg5kg: 0.05, weightKg10kg: 0.10, color: '#d6ccc2' }
  ];
  const prod5Metrics = computeBlendMetrics(prod5Grains, ingredientsMap);

  return [
    {
      productId: 'PROD-001',
      name: 'Everyday Soft Multigrain Atta',
      productType: 'predefined',
      tagline: 'Family Favorite for Daily Digestion & Puffy Soft Rotis',
      target: 'General households looking for daily health benefits without compromising on soft, puffy rotis.',
      benefitKeynote: 'Rich in soluble fiber, natural wheat germ oil & slow digestive complex carbs.',
      badge: 'SOFT & PUFFY ROTIS',
      badgeType: 'gold',
      badgeColor: '#f2ca50',
      mrpPrice: 78,
      sellingPrice: 68,
      discountPercent: 13,
      grains: prod1Grains,
      costBreakdown: {
        rawIngredientCostPerKg: prod1Metrics.rawIngredientCostPerKg,
        millingCostPerKg: 4,
        packagingCostPerKg: 1,
        deliveryCostPerOrder: 50,
        hasIncompleteCost: prod1Metrics.hasIncompleteCost,
        incompleteCostReason: prod1Metrics.incompleteCostReason
      },
      calculatedNutrition: prod1Metrics.calculatedNutrition,
      description: '100% Traditional Slow Stone Cold-Ground multigrain flour. Milled fresh per batch on low-RPM stone chakkis to retain native grain germ, natural aroma, and heat-sensitive B-vitamins.',
      dietaryNotes: 'Creates exceptionally soft, golden, puffed rotis that stay tender even after 6 hours. Zero bleaching, zero artificial preservatives.',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      availablePackSizes: [5, 10],
      isSignature: true,
      category: 'signature'
    },
    {
      productId: 'PROD-002',
      name: 'Sugar Care Atta',
      productType: 'predefined',
      tagline: 'Low Glycemic Index Grain Formulation for Blood Sugar Support',
      target: 'Diabetic patients and pre-diabetics needing low glycemic index grains to prevent sugar spikes.',
      benefitKeynote: 'Formulated with Barley Beta-Glucans and complex legumes to flatten glucose curves.',
      badge: 'LOW GLYCEMIC INDEX',
      badgeType: 'green',
      badgeColor: '#81c784',
      mrpPrice: 88,
      sellingPrice: 78,
      discountPercent: 11,
      grains: prod2Grains,
      costBreakdown: {
        rawIngredientCostPerKg: prod2Metrics.rawIngredientCostPerKg,
        millingCostPerKg: 4,
        packagingCostPerKg: 1,
        deliveryCostPerOrder: 50,
        hasIncompleteCost: prod2Metrics.hasIncompleteCost,
        incompleteCostReason: prod2Metrics.incompleteCostReason
      },
      calculatedNutrition: prod2Metrics.calculatedNutrition,
      description: 'Slow-milled flour combining cold-ground barley, whole wheat, and ancient millets to slow carbohydrate absorption and enhance insulin response.',
      dietaryNotes: 'Produces light, wholesome rotis that curb mid-day hunger spikes and stabilize sustained energy.',
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
      availablePackSizes: [5, 10],
      isSignature: true,
      category: 'signature'
    },
    {
      productId: 'PROD-003',
      name: 'Thyro Care Atta',
      productType: 'predefined',
      tagline: 'Endocrine & Metabolic Health Stone-Ground Formulation',
      target: 'Individuals with slow metabolism, hypothyroidism, or hormonal equilibrium needs.',
      benefitKeynote: 'Rich in dietary Selenium, Zinc, and active Magnesium with Gluten-Free grain dominance.',
      badge: 'THYROID METABOLIC CARE',
      badgeType: 'gold',
      badgeColor: '#c9a227',
      mrpPrice: 155,
      sellingPrice: 135,
      discountPercent: 13,
      grains: prod3Grains,
      costBreakdown: {
        rawIngredientCostPerKg: prod3Metrics.rawIngredientCostPerKg,
        millingCostPerKg: 4,
        packagingCostPerKg: 1,
        deliveryCostPerOrder: 50,
        hasIncompleteCost: prod3Metrics.hasIncompleteCost,
        incompleteCostReason: prod3Metrics.incompleteCostReason
      },
      calculatedNutrition: prod3Metrics.calculatedNutrition,
      description: 'Formulated with cold-ground Amaranth, Jowar, roasted chana pulse, and omega-rich chia & flax seeds to deliver trace minerals essential for metabolic vitality.',
      dietaryNotes: 'Low glycemic load, gentle on sluggish digestive systems, and promotes balanced energy release.',
      imageUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=600&q=80',
      availablePackSizes: [5, 10],
      isSignature: true,
      category: 'signature'
    },
    {
      productId: 'PROD-004',
      name: 'High Protein Atta',
      productType: 'predefined',
      tagline: '22g Plant Protein / 100g for Active Lifestyles & Athletic Recovery',
      target: 'Fitness enthusiasts, athletes, and young adults wanting a protein-rich plant diet.',
      benefitKeynote: 'Clean plant protein with natural BCAAs from defatted soybean and roasted desi chana.',
      badge: '22G PROTEIN / 100G',
      badgeType: 'blue',
      badgeColor: '#64b5f6',
      mrpPrice: 94,
      sellingPrice: 82,
      discountPercent: 13,
      grains: prod4Grains,
      costBreakdown: {
        rawIngredientCostPerKg: prod4Metrics.rawIngredientCostPerKg,
        millingCostPerKg: 4,
        packagingCostPerKg: 1,
        deliveryCostPerOrder: 50,
        hasIncompleteCost: prod4Metrics.hasIncompleteCost,
        incompleteCostReason: prod4Metrics.incompleteCostReason
      },
      calculatedNutrition: prod4Metrics.calculatedNutrition,
      description: 'Dense protein blend combining nutrient-rich Sharbati wheat, debittered soybean, golden roasted chana, and barley for athletic stamina.',
      dietaryNotes: 'Ideal for pre-workout meals and post-training rotis without bloating or heavy glycemic crashes.',
      imageUrl: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80',
      availablePackSizes: [5, 10],
      isSignature: true,
      category: 'signature'
    },
    {
      productId: 'PROD-005',
      name: 'Vitality Atta',
      productType: 'predefined',
      tagline: 'Longevity, Bone Density & Super-Seed Micro-Nutrient Matrix',
      target: 'Elderly customers, women, and adults seeking bone density, vitality, and cellular defense.',
      benefitKeynote: 'Enriched with Ragi, white sesame, flaxseed, chia, and fenugreek for bone and vitality nourishment.',
      badge: 'VITALITY & LONGEVITY',
      badgeType: 'purple',
      badgeColor: '#ba68c8',
      mrpPrice: 105,
      sellingPrice: 92,
      discountPercent: 12,
      grains: prod5Grains,
      costBreakdown: {
        rawIngredientCostPerKg: prod5Metrics.rawIngredientCostPerKg,
        millingCostPerKg: 4,
        packagingCostPerKg: 1,
        deliveryCostPerOrder: 50,
        hasIncompleteCost: prod5Metrics.hasIncompleteCost,
        incompleteCostReason: prod5Metrics.incompleteCostReason
      },
      calculatedNutrition: prod5Metrics.calculatedNutrition,
      description: 'Comprehensive restorative blend uniting ancient millets with zinc-rich white sesame seeds, flaxseed, chia, and fenugreek for sustained cellular rejuvenation.',
      dietaryNotes: 'High natural calcium, iron, and phyto-nutrients that help combat bone fragility and fatigue.',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      availablePackSizes: [5, 10],
      isSignature: true,
      category: 'signature'
    },
    {
      productId: 'PROD-006',
      name: 'My Choice Atta',
      productType: 'custom',
      tagline: 'Customer-Customizable Bespoke Grain Flour Laboratory',
      target: 'Health-conscious buyers creating their own personalized 10 kg grain formula.',
      benefitKeynote: 'Formulated by you, ground by us. 100% pure single-origin ingredients milled cold at 280 RPM.',
      badge: 'CUSTOMER BESPOKE BLEND',
      badgeType: 'gold',
      badgeColor: '#c9a227',
      mrpPrice: 95,
      sellingPrice: 85,
      discountPercent: 11,
      grains: [],
      costBreakdown: {
        rawIngredientCostPerKg: null,
        millingCostPerKg: 4,
        packagingCostPerKg: 1,
        deliveryCostPerOrder: 50,
        hasIncompleteCost: false,
        incompleteCostReason: ''
      },
      calculatedNutrition: { isComplete: false },
      description: 'Your personal flour laboratory. Hand-select your preferred whole grains, ancient millets, pulses, and seeds from our 18 master ingredients to total exactly 10 kg.',
      dietaryNotes: 'Ground strictly on stone chakkis upon order placement. Full control over fineness, grain ratios, and dietary goals.',
      imageUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=600&q=80',
      availablePackSizes: [10], // strictly 10 kg
      isSignature: false,
      category: 'custom'
    }
  ];
}

// MAIN SEED / MIGRATION SCRIPT
async function seedMasterCatalog() {
  const mongoUri = process.env.MONGODB_URI;
  console.log('[Seed] Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri);
  console.log('[Seed] Connected successfully.');

  // 1. SEED OPERATIONAL COSTS (Idempotent upsert)
  console.log('\n--- 1. Seeding Operational Costs ---');
  for (const op of MASTER_OPERATIONAL_COSTS) {
    await OperationalCost.findOneAndUpdate(
      { costId: op.costId },
      { $set: op },
      { upsert: true, new: true }
    );
    console.log(`✓ Operational Cost: [${op.costId}] ${op.name} = ₹${op.amount} ${op.unit}`);
  }

  // 2. SEED INGREDIENTS (Preserving existing stock where names or codes match)
  console.log('\n--- 2. Seeding Master Ingredients Catalog (18 Ingredients) ---');
  const existingGrains = await Grain.find({});
  const existingStockMap = {};
  existingGrains.forEach(g => {
    existingStockMap[g.name.toLowerCase().trim()] = g.inStockKg;
    if (g.code) existingStockMap[g.code.toUpperCase()] = g.inStockKg;
    if (g.ingredientId) existingStockMap[g.ingredientId.toUpperCase()] = g.inStockKg;
  });

  const ingredientsMap = {};

  for (const ing of MASTER_INGREDIENTS) {
    let preservedStock = 50;
    const normalizedName = ing.name.toLowerCase().trim();
    if (existingStockMap[ing.ingredientId] !== undefined) {
      preservedStock = existingStockMap[ing.ingredientId];
    } else if (existingStockMap[normalizedName] !== undefined) {
      preservedStock = existingStockMap[normalizedName];
    } else if (existingStockMap[ing.code] !== undefined) {
      preservedStock = existingStockMap[ing.code];
    }

    const grainDoc = await Grain.findOneAndUpdate(
      { ingredientId: ing.ingredientId },
      {
        $set: {
          ingredientId: ing.ingredientId,
          code: ing.code,
          name: ing.name,
          category: ing.category,
          subtitle: ing.subtitle,
          pricePerKg: ing.pricePerKg,
          priceStatus: ing.priceStatus,
          priceUpdatedAt: new Date(),
          sourceStatus: ing.sourceStatus,
          verificationStatus: ing.verificationStatus,
          reviewFlag: ing.reviewFlag,
          flaggedForVerification: ing.flaggedForVerification,
          nutrition: ing.nutrition,
          color: ing.color,
          benefits: ing.benefits,
          active: true
        },
        $setOnInsert: {
          inStockKg: preservedStock,
          capacityKg: 500,
          lowStockThresholdKg: 40,
          restockHistory: []
        }
      },
      { upsert: true, new: true }
    );

    ingredientsMap[ing.ingredientId] = grainDoc;
    const priceDisplay = ing.pricePerKg !== null ? `₹${ing.pricePerKg}/kg` : '⚠️ PRICE PENDING';
    console.log(`✓ [${ing.ingredientId}] ${ing.name} | ${ing.category} | ${priceDisplay} | Stock: ${grainDoc.inStockKg}kg`);
  }

  // 3. ARCHIVE / REMOVE OBSOLETE GRAINS NOT IN MASTER CATALOG
  const masterIds = MASTER_INGREDIENTS.map(i => i.ingredientId);
  const obsoleteGrains = await Grain.deleteMany({
    ingredientId: { $nin: masterIds }
  });
  if (obsoleteGrains.deletedCount > 0) {
    console.log(`ℹ Cleaned up ${obsoleteGrains.deletedCount} obsolete demo grain records.`);
  }

  // 4. SEED MASTER PRODUCTS (5 Predefined + 1 Custom My Choice Atta)
  console.log('\n--- 3. Seeding Predefined Products & My Choice Atta ---');
  const masterProducts = getMasterProducts(ingredientsMap);

  for (const p of masterProducts) {
    await Product.findOneAndUpdate(
      { productId: p.productId },
      { $set: p },
      { upsert: true, new: true }
    );
    const formulaSummary = p.grains.length > 0 ? `${p.grains.length} ingredients (100%)` : 'Bespoke Customer Blend';
    console.log(`✓ [${p.productId}] ${p.name} (${p.productType}) | Formula: ${formulaSummary} | ₹${p.sellingPrice}/kg`);
  }

  // 5. ARCHIVE / REMOVE OBSOLETE PRODUCTS NOT IN MASTER CATALOG
  const masterProductIds = masterProducts.map(p => p.productId);
  const obsoleteProducts = await Product.deleteMany({
    productId: { $nin: masterProductIds }
  });
  if (obsoleteProducts.deletedCount > 0) {
    console.log(`ℹ Cleaned up ${obsoleteProducts.deletedCount} obsolete demo product records.`);
  }

  console.log('\n======================================================');
  console.log('✓ MASTER CATALOG SEEDING COMPLETED SUCCESSFULLY!');
  console.log('  - Operational Cost Rates configured (OP-001 to OP-008)');
  console.log('  - 18 Ingredients seeded (RM-001 to RM-018) with 16 Nutrients');
  console.log('  - RM-018 Methi Seeds flagged with missing price warning');
  console.log('  - 5 Predefined Atta Blends seeded with exact 100% formulas');
  console.log('  - 1 My Choice Atta custom product ready (strictly 10 kg)');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  seedMasterCatalog().catch(err => {
    console.error('Seed Error:', err);
    process.exit(1);
  });
}

module.exports = { seedMasterCatalog, MASTER_INGREDIENTS, MASTER_OPERATIONAL_COSTS };
