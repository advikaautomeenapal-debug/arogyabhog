require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Grain = require('../models/Grain');
const Order = require('../models/Order');

const products = [
  {
    name: 'Everyday Soft Multigrain Atta',
    tagline: 'Family Favorite for Daily Digestion & Soft Rotis',
    target: 'General households looking for daily health benefits without compromising on soft, puffy rotis.',
    benefitKeynote: 'Rich in soluble fiber, natural wheat germ oil & slow digestive carbs for all ages.',
    badge: 'SOFT & PUFFY ROTIS',
    badgeType: 'gold',
    badgeColor: '#f2ca50',
    mrpPrice: 78,
    sellingPrice: 68,
    discountPercent: 13,
    isSignature: true,
    category: 'signature',
    grains: [
      { name: 'Whole Wheat (Gehu)', percentage: 75, weightKg5kg: 3.75, weightKg10kg: 7.5, color: '#f2ca50', tag: 'Base Grain' },
      { name: 'Roasted Chana', percentage: 10, weightKg5kg: 0.5, weightKg10kg: 1.0, color: '#d4a373', tag: 'Protein & Crispness' },
      { name: 'Jau (Barley)', percentage: 5, weightKg5kg: 0.25, weightKg10kg: 0.5, color: '#e9c46a', tag: 'Cooling & Soluble Fiber' },
      { name: 'Soybean', percentage: 4, weightKg5kg: 0.2, weightKg10kg: 0.4, color: '#ccd5ae', tag: 'Amino Acids' },
      { name: 'Jowar', percentage: 3, weightKg5kg: 0.15, weightKg10kg: 0.3, color: '#faedcd', tag: 'Gut Ease' },
      { name: 'Psyllium Husk (Isabgol)', percentage: 2, weightKg5kg: 0.1, weightKg10kg: 0.2, color: '#2a9d8f', tag: 'Moisture Lock' },
      { name: 'Flaxseed', percentage: 1, weightKg5kg: 0.05, weightKg10kg: 0.1, color: '#e76f51', tag: 'Omega-3 ALA' }
    ],
    description: '100% Traditional Slow Stone Cold-Ground multigrain flour. Milled fresh per batch on low-RPM stone chakkis to retain native grain germ, aroma and heat-sensitive B-vitamins.',
    dietaryNotes: 'Creates exceptionally soft, golden, puffed rotis that stay tender even after 6 hours. Zero bleaching, zero artificial maida blending.',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    nutritionMetrics: { softnessPuff: 94, proteinPerRoti: 3.4, prebioticFiber: 'High (11g)', glycemicIndex: 'Medium-Low (~58)' }
  },
  {
    name: 'High-Protein & Fitness Flour',
    tagline: 'Gym, Active Athletes & Lean Muscle Recovery',
    target: 'Fitness enthusiasts, athletes, and young adults wanting a protein-rich diet.',
    benefitKeynote: '22g bio-available plant protein per 100g flour with BCAAs from roasted chana and soybean.',
    badge: '22G PROTEIN / 100G',
    badgeType: 'blue',
    badgeColor: '#64b5f6',
    mrpPrice: 92,
    sellingPrice: 82,
    discountPercent: 11,
    isSignature: true,
    category: 'signature',
    grains: [
      { name: 'Whole Wheat (Gehu)', percentage: 60, weightKg5kg: 3.0, weightKg10kg: 6.0, color: '#f2ca50', tag: 'Carb Engine' },
      { name: 'Soybean (Defatted)', percentage: 15, weightKg5kg: 0.75, weightKg10kg: 1.5, color: '#ccd5ae', tag: 'High Protein 52%' },
      { name: 'Roasted Chana', percentage: 12, weightKg5kg: 0.6, weightKg10kg: 1.2, color: '#d4a373', tag: 'Slow Energy' },
      { name: 'Jau (Barley)', percentage: 8, weightKg5kg: 0.4, weightKg10kg: 0.8, color: '#e9c46a', tag: 'Cell Hydration' },
      { name: 'Flaxseed', percentage: 3, weightKg5kg: 0.15, weightKg10kg: 0.3, color: '#e76f51', tag: 'Anti-Inflammatory' },
      { name: 'Psyllium Husk (Isabgol)', percentage: 2, weightKg5kg: 0.1, weightKg10kg: 0.2, color: '#2a9d8f', tag: 'Moisture' }
    ],
    description: 'High-density protein flour stone-milled from premium Sharbati wheat, debittered defatted soybean, and golden roasted desi chana.',
    dietaryNotes: 'Ideal for pre-workout meals and post-training rotis. Delivers sustained stamina without blood sugar crashes.',
    imageUrl: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80',
    nutritionMetrics: { softnessPuff: 86, proteinPerRoti: 5.8, prebioticFiber: 'High (13g)', glycemicIndex: 'Low (~49)' }
  },
  {
    name: 'Low-GI Diabetic Care Flour',
    tagline: 'Blood Sugar Management & Sustained Satiety',
    target: 'Diabetic patients and pre-diabetics needing low glycemic index grains to prevent sugar spikes.',
    benefitKeynote: 'Clinically formulated low-glycemic flour rich in Beta-Glucans and complex prebiotic fiber.',
    badge: 'LOW GLYCEMIC INDEX',
    badgeType: 'green',
    badgeColor: '#81c784',
    mrpPrice: 88,
    sellingPrice: 78,
    discountPercent: 11,
    isSignature: true,
    category: 'signature',
    grains: [
      { name: 'Whole Wheat (Gehu)', percentage: 50, weightKg5kg: 2.5, weightKg10kg: 5.0, color: '#f2ca50', tag: 'Base' },
      { name: 'Jau (Barley)', percentage: 20, weightKg5kg: 1.0, weightKg10kg: 2.0, color: '#e9c46a', tag: 'Beta-Glucan' },
      { name: 'Roasted Chana', percentage: 10, weightKg5kg: 0.5, weightKg10kg: 1.0, color: '#d4a373', tag: 'Low-GI Legume' },
      { name: 'Jowar', percentage: 8, weightKg5kg: 0.4, weightKg10kg: 0.8, color: '#faedcd', tag: 'Alkaline Grain' },
      { name: 'Bajra', percentage: 5, weightKg5kg: 0.25, weightKg10kg: 0.5, color: '#b7b7a4', tag: 'Insulin Sensitivity' },
      { name: 'Psyllium Husk (Isabgol)', percentage: 4, weightKg5kg: 0.2, weightKg10kg: 0.4, color: '#2a9d8f', tag: 'Viscous Gel' },
      { name: 'Flaxseed', percentage: 3, weightKg5kg: 0.15, weightKg10kg: 0.3, color: '#e76f51', tag: 'Lignan Rich' }
    ],
    description: 'Developed in consultation with Ayurvedic vaidyas and clinical diabetologists. Combines cold-pressed barley and ancient millets to flatten postprandial glucose curves.',
    dietaryNotes: 'Produces light, wholesome rotis that curb mid-day cravings and stabilize insulin demand.',
    imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80',
    nutritionMetrics: { softnessPuff: 83, proteinPerRoti: 4.2, prebioticFiber: 'Very High (16g)', glycemicIndex: 'Ultra Low (~44)' }
  },
  {
    name: 'Calcium & Bone-Health Millet Blend',
    tagline: 'Designed for Senior Citizens, Women & Growing Kids',
    target: 'Elderly customers, women, and growing children needing high calcium, iron, and fiber.',
    benefitKeynote: 'Enriched with organic Ragi (10x calcium of rice), iron-dense Bajra, and micro-minerals.',
    badge: 'HIGH CALCIUM & IRON',
    badgeType: 'purple',
    badgeColor: '#ba68c8',
    mrpPrice: 86,
    sellingPrice: 75,
    discountPercent: 13,
    isSignature: true,
    category: 'signature',
    grains: [
      { name: 'Whole Wheat (Gehu)', percentage: 65, weightKg5kg: 3.25, weightKg10kg: 6.5, color: '#f2ca50', tag: 'Structure' },
      { name: 'Ragi (Finger Millet)', percentage: 12, weightKg5kg: 0.6, weightKg10kg: 1.2, color: '#e63946', tag: '10x Calcium' },
      { name: 'Jowar', percentage: 8, weightKg5kg: 0.4, weightKg10kg: 0.8, color: '#faedcd', tag: 'Bone Density' },
      { name: 'Roasted Chana', percentage: 6, weightKg5kg: 0.3, weightKg10kg: 0.6, color: '#d4a373', tag: 'Iron Booster' },
      { name: 'Bajra', percentage: 5, weightKg5kg: 0.25, weightKg10kg: 0.5, color: '#b7b7a4', tag: 'Magnesium & Zinc' },
      { name: 'Flaxseed', percentage: 2, weightKg5kg: 0.1, weightKg10kg: 0.2, color: '#e76f51', tag: 'Joint Lubricant' },
      { name: 'Psyllium Husk (Isabgol)', percentage: 2, weightKg5kg: 0.1, weightKg10kg: 0.2, color: '#2a9d8f', tag: 'Puffiness' }
    ],
    description: 'Traditional slow-milled formulation created to combat osteopenia and nourish cartilage in senior citizens and women undergoing hormonal transitions.',
    dietaryNotes: 'Yields a warm, aromatic reddish-brown roti with earthy rustic flavor. High bioavailability of calcium when enjoyed with desi ghee.',
    imageUrl: 'https://images.unsplash.com/photo-1607672632458-9eb56696346b?auto=format&fit=crop&w=600&q=80',
    nutritionMetrics: { softnessPuff: 88, proteinPerRoti: 3.9, prebioticFiber: 'High (12g)', glycemicIndex: 'Low (~52)' }
  },
  {
    name: 'Digestive & Gut-Health Flour',
    tagline: 'Smooth Digestion, Acid Reduction & Light Stomachs',
    target: 'People dealing with digestion issues, constipation, or weight loss goals.',
    benefitKeynote: 'High-fiber formulation with pure Isabgol husk and cooling roasted barley to cleanse the colon.',
    badge: 'HIGH FIBER & EASY DIGEST',
    badgeType: 'rose',
    badgeColor: '#e57373',
    mrpPrice: 82,
    sellingPrice: 72,
    discountPercent: 12,
    isSignature: true,
    category: 'signature',
    grains: [
      { name: 'Whole Wheat (Gehu)', percentage: 60, weightKg5kg: 3.0, weightKg10kg: 6.0, color: '#f2ca50', tag: 'Base' },
      { name: 'Jau (Barley)', percentage: 15, weightKg5kg: 0.75, weightKg10kg: 1.5, color: '#e9c46a', tag: 'Pitta Shamak' },
      { name: 'Jowar', percentage: 10, weightKg5kg: 0.5, weightKg10kg: 1.0, color: '#faedcd', tag: 'Easy Assimilation' },
      { name: 'Roasted Chana', percentage: 8, weightKg5kg: 0.4, weightKg10kg: 0.8, color: '#d4a373', tag: 'Prebiotic Bulk' },
      { name: 'Psyllium Husk (Isabgol)', percentage: 4, weightKg5kg: 0.2, weightKg10kg: 0.4, color: '#2a9d8f', tag: 'Pure Husk 4%' },
      { name: 'Flaxseed', percentage: 3, weightKg5kg: 0.15, weightKg10kg: 0.3, color: '#e76f51', tag: 'Mucilage' }
    ],
    description: 'Formulated with Ayurvedic gastro-protective principles to soothe acidity, prevent constipation, and restore the gut microbiome naturally.',
    dietaryNotes: 'Very easy to knead, digests effortlessly, leaving you feeling light and energized without afternoon bloating.',
    imageUrl: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80',
    nutritionMetrics: { softnessPuff: 91, proteinPerRoti: 3.6, prebioticFiber: 'Ultra High (15g)', glycemicIndex: 'Low (~50)' }
  },
  {
    name: 'Hyper-Thyroid & Metabolism Support Atta',
    tagline: 'Endocrine Health, Thyroid Balance & Clean Energy',
    target: 'Individuals managing thyroid health, slow metabolism, and hormone irregularities.',
    benefitKeynote: 'Supports Thyroid health, Selenium & Zinc rich, Zero gluten spikes',
    badge: 'THYROID METABOLIC CARE',
    badgeType: 'gold',
    badgeColor: '#f2ca50',
    mrpPrice: 170, // MRP 850 for 5kg
    sellingPrice: 128, // Selling 640 for 5kg
    discountPercent: 25,
    isSignature: false,
    category: 'specialized',
    grains: [
      { name: 'Kodo Millet', percentage: 25, weightKg5kg: 1.25, weightKg10kg: 2.5, color: '#e9c46a', tag: 'Thyroid Metabolism' },
      { name: 'Jau/Barley', percentage: 25, weightKg5kg: 1.25, weightKg10kg: 2.5, color: '#f4a261', tag: 'Cooling Beta-Glucan' },
      { name: 'Roasted Chana', percentage: 20, weightKg5kg: 1.0, weightKg10kg: 2.0, color: '#d4a373', tag: 'Zinc & Selenium' },
      { name: 'Whole Wheat', percentage: 15, weightKg5kg: 0.75, weightKg10kg: 1.5, color: '#f2ca50', tag: 'Milling Binder' },
      { name: 'Flaxseed', percentage: 10, weightKg5kg: 0.5, weightKg10kg: 1.0, color: '#e76f51', tag: 'Omega-3 Balance' },
      { name: 'Pumpkin Seeds', percentage: 5, weightKg5kg: 0.25, weightKg10kg: 0.5, color: '#2a9d8f', tag: 'Raw Micronutrients' }
    ],
    description: 'Cold-ground on slow stone chakki to preserve active micronutrients. High fiber blend formulated specifically for thyroid balance and hormonal equilibrium.',
    dietaryNotes: 'Packed with trace minerals like zinc, copper, and selenium necessary for T3/T4 conversion. Soft and deeply nourishing.',
    imageUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=600&q=80',
    nutritionMetrics: { softnessPuff: 85, proteinPerRoti: 4.8, prebioticFiber: 'High (14g)', glycemicIndex: 'Ultra Low (~42)' }
  }
];

const grains = [
  {
    name: 'Whole Sharbati Wheat',
    code: 'WW',
    category: 'Base Grain',
    subtitle: 'Naturally sweet MP Sehore wheat, ensures soft rotis',
    pricePerKg: 48,
    inStockKg: 450,
    capacityKg: 500,
    lowStockThresholdKg: 60,
    color: '#f2ca50',
    benefits: 'High native gluten structure, naturally sweet flavor, stone-milled with bran intact',
    minPercent: 15,
    maxPercent: 85,
    defaultPercent: 60
  },
  {
    name: 'Roasted Desi Chana',
    code: 'RC',
    category: 'Protein & Low-GI',
    subtitle: 'Slow energy release & nutty crisp texture',
    pricePerKg: 110,
    inStockKg: 120,
    capacityKg: 200,
    lowStockThresholdKg: 30,
    color: '#d4a373',
    benefits: 'Rich in insoluble fiber, low glycemic index, promotes fullness and steady insulin',
    minPercent: 0,
    maxPercent: 30,
    defaultPercent: 15
  },
  {
    name: 'Jau (Barley Grains)',
    code: 'JB',
    category: 'Fiber & Cooling',
    subtitle: 'Natural stomach coolant & soluble beta-glucan fiber',
    pricePerKg: 75,
    inStockKg: 35, // Low stock warning as in screenshot!
    capacityKg: 150,
    lowStockThresholdKg: 40,
    color: '#e9c46a',
    benefits: 'Clinically proven beta-glucan reduces bad LDL cholesterol and controls blood sugar',
    minPercent: 0,
    maxPercent: 30,
    defaultPercent: 10
  },
  {
    name: 'Ragi (Finger Millet)',
    code: 'RF',
    category: 'Calcium & Iron',
    subtitle: '10x calcium of rice for strong bones & cartilage',
    pricePerKg: 85,
    inStockKg: 85,
    capacityKg: 150,
    lowStockThresholdKg: 25,
    color: '#e63946',
    benefits: 'Highest natural calcium among all cereals, rich in polyphenol antioxidants',
    minPercent: 0,
    maxPercent: 30,
    defaultPercent: 7
  },
  {
    name: 'Defatted Soybean',
    code: 'SB',
    category: 'Plant Protein',
    subtitle: '52% bio-protein for lean muscle recovery',
    pricePerKg: 90,
    inStockKg: 95,
    capacityKg: 150,
    lowStockThresholdKg: 25,
    color: '#ccd5ae',
    benefits: 'Debittered organic soybean flour with complete amino acid profile',
    minPercent: 0,
    maxPercent: 25,
    defaultPercent: 5
  },
  {
    name: 'Psyllium Husk (Isabgol)',
    code: 'PH',
    category: 'Soluble Fiber',
    subtitle: 'Extreme moisture retention & soft puffiness',
    pricePerKg: 320,
    inStockKg: 22,
    capacityKg: 50,
    lowStockThresholdKg: 10,
    color: '#2a9d8f',
    benefits: 'Forms a natural gel in dough that traps steam for cloud-like rotis without gluten',
    minPercent: 0,
    maxPercent: 6,
    defaultPercent: 2
  },
  {
    name: 'Flaxseeds (Alsi / Omega-3)',
    code: 'FS',
    category: 'Heart Health',
    subtitle: 'Alpha-Linolenic fatty acids & lignans',
    pricePerKg: 240,
    inStockKg: 18,
    capacityKg: 50,
    lowStockThresholdKg: 12,
    color: '#e76f51',
    benefits: 'Essential plant-based Omega-3 fats, supports heart health and joint lubrication',
    minPercent: 0,
    maxPercent: 6,
    defaultPercent: 1
  },
  {
    name: 'Jowar (Sorghum)',
    code: 'JW',
    category: 'Digestive Ease',
    subtitle: 'Gluten-free gut coolant & light digestion',
    pricePerKg: 65,
    inStockKg: 110,
    capacityKg: 200,
    lowStockThresholdKg: 30,
    color: '#faedcd',
    benefits: 'Naturally gluten-free, alkaline cereal that prevents gastric irritation',
    minPercent: 0,
    maxPercent: 30,
    defaultPercent: 0
  },
  {
    name: 'Bajra (Pearl Millet)',
    code: 'BJ',
    category: 'Iron & Magnesium',
    subtitle: 'Warming winter grain rich in iron and energy',
    pricePerKg: 55,
    inStockKg: 70,
    capacityKg: 150,
    lowStockThresholdKg: 20,
    color: '#b7b7a4',
    benefits: 'High iron bioavailability, prevents anemia and supports vitality',
    minPercent: 0,
    maxPercent: 25,
    defaultPercent: 0
  },
  {
    name: 'Kodo Millet',
    code: 'KM',
    category: 'Metabolic Detox',
    subtitle: 'Ayurvedic Siridhanya for thyroid and lymphatic support',
    pricePerKg: 140,
    inStockKg: 40,
    capacityKg: 100,
    lowStockThresholdKg: 15,
    color: '#f4a261',
    benefits: 'Antioxidant-dense millet ideal for metabolic syndrome and endocrine wellness',
    minPercent: 0,
    maxPercent: 30,
    defaultPercent: 0
  }
];

const sampleOrders = [
  {
    orderNumber: '#AB-8492',
    customerName: 'Vikramaditya S.',
    customerPhone: '+91 98112 34567',
    customerAddress: 'Villa 14, The Magnolias, Golf Course Road',
    customerCity: 'Gurugram',
    customerSector: 'Sector 54, GGN',
    customerPincode: '122002',
    deliverySlot: 'Express 2h Stone Fresh',
    express: true,
    totalAmount: 780,
    paymentMethod: 'UPI_DESKTOP_QR',
    paymentStatus: 'Verified',
    transactionRef: 'UPI-TXN-8492711',
    millingStatus: 'Stone Milling',
    currentStep: 2,
    chakkiUnit: 'Chakki #2',
    assignedDP: 'Assigned DP-3',
    items: [
      {
        name: 'Custom Diabetic Care Flour (10 kg Blend)',
        isCustom: true,
        batchSizeKg: 10,
        fineness: 'Medium (Phulka)',
        grainBreakdown: [
          { name: 'Whole Wheat', percentage: 50, weightKg: 5.0 },
          { name: 'Jau (Barley)', percentage: 20, weightKg: 2.0 },
          { name: 'Roasted Chana', percentage: 10, weightKg: 1.0 },
          { name: 'Jowar', percentage: 8, weightKg: 0.8 },
          { name: 'Bajra', percentage: 5, weightKg: 0.5 },
          { name: 'Psyllium Husk', percentage: 4, weightKg: 0.4 },
          { name: 'Flaxseeds', percentage: 3, weightKg: 0.3 }
        ],
        pricePerKg: 78,
        quantity: 1,
        totalItemPrice: 780
      }
    ]
  },
  {
    orderNumber: '#AB-8491',
    customerName: 'Ananya Deshmukh',
    customerPhone: '+91 98710 98765',
    customerAddress: 'Flat 402, Nirvana Country, South City 2',
    customerCity: 'Gurugram',
    customerSector: 'Sector 50, GGN',
    customerPincode: '122018',
    deliverySlot: 'Tomorrow Morning (7:00 AM)',
    express: false,
    totalAmount: 340,
    paymentMethod: 'UPI_MOBILE_APP',
    paymentStatus: 'Verified',
    transactionRef: 'UPI-TXN-8491320',
    millingStatus: 'Packing & Ship',
    currentStep: 3,
    chakkiUnit: 'Chakki #4',
    assignedDP: 'Assigned DP-1',
    items: [
      {
        name: 'Everyday Soft Multigrain Atta',
        isCustom: false,
        batchSizeKg: 5,
        fineness: 'Medium (Phulka)',
        grainBreakdown: [
          { name: 'Whole Wheat', percentage: 75, weightKg: 3.75 },
          { name: 'Roasted Chana', percentage: 10, weightKg: 0.5 },
          { name: 'Jau (Barley)', percentage: 5, weightKg: 0.25 }
        ],
        pricePerKg: 68,
        quantity: 1,
        totalItemPrice: 340
      }
    ]
  },
  {
    orderNumber: '#AB-8490',
    customerName: 'Rohit K. Verma',
    customerPhone: '+91 99100 11223',
    customerAddress: 'Tower B, DLF Crest, Sector 54',
    customerCity: 'Gurugram',
    customerSector: 'Sector 54, GGN',
    customerPincode: '122002',
    deliverySlot: 'Express 2h Stone Fresh',
    express: true,
    totalAmount: 820,
    paymentMethod: 'UPI_DESKTOP_QR',
    paymentStatus: 'Verified',
    transactionRef: 'UPI-TXN-8490987',
    millingStatus: 'Grain Mix',
    currentStep: 1,
    chakkiUnit: 'Chakki #1',
    assignedDP: 'Pending DP',
    items: [
      {
        name: 'High-Protein & Fitness Flour',
        isCustom: false,
        batchSizeKg: 10,
        fineness: 'Extra Fine (Puri & Paratha)',
        grainBreakdown: [
          { name: 'Whole Wheat', percentage: 60, weightKg: 6.0 },
          { name: 'Soybean', percentage: 15, weightKg: 1.5 },
          { name: 'Roasted Chana', percentage: 12, weightKg: 1.2 }
        ],
        pricePerKg: 82,
        quantity: 1,
        totalItemPrice: 820
      }
    ]
  }
];

async function seedDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://pdeepak936_db_user:yuAZbUAbQXoEixDJ@cluster0.t5anyry.mongodb.net/arogyabhog?appName=Cluster0&retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB Atlas...');

    // Clean existing collections
    await Product.deleteMany({});
    await Grain.deleteMany({});
    await Order.deleteMany({});
    console.log('[Seed] Cleared existing products, grains, orders.');

    // Insert Products
    const createdProducts = await Product.insertMany(products);
    console.log(`[Seed] Seeded ${createdProducts.length} Ayurvedic flour products.`);

    // Insert Grains / Silos
    const createdGrains = await Grain.insertMany(grains);
    console.log(`[Seed] Seeded ${createdGrains.length} Chakki silos and grain inventory.`);

    // Insert Initial Milling Queue Orders
    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`[Seed] Seeded ${createdOrders.length} live milling & dispatch queue orders.`);

    console.log('[Seed] Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, products, grains, sampleOrders };
