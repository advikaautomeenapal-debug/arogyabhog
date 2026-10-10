const mongoose = require('mongoose');

const grainRatioSchema = new mongoose.Schema({
  ingredientId: { type: String, uppercase: true, trim: true }, // e.g. RM-001
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  weightKg5kg: { type: Number },
  weightKg10kg: { type: Number },
  color: { type: String, default: '#d4af37' },
  tag: { type: String }
}, { _id: false });

const calculatedNutritionSchema = new mongoose.Schema({
  energyKcal: { type: Number, default: null },
  proteinG: { type: Number, default: null },
  carbsG: { type: Number, default: null },
  sugarsG: { type: Number, default: null },
  addedSugarsG: { type: Number, default: null },
  fatG: { type: Number, default: null },
  saturatedFatG: { type: Number, default: null },
  transFatG: { type: Number, default: null },
  fibreG: { type: Number, default: null },
  sodiumMg: { type: Number, default: null },
  zincMg: { type: Number, default: null },
  magnesiumMg: { type: Number, default: null },
  phosphorusMg: { type: Number, default: null },
  ironMg: { type: Number, default: null },
  calciumMg: { type: Number, default: null },
  potassiumMg: { type: Number, default: null },
  isComplete: { type: Boolean, default: true }
}, { _id: false });

const costBreakdownSchema = new mongoose.Schema({
  rawIngredientCostPerKg: { type: Number, default: null },
  millingCostPerKg: { type: Number, default: 4 },
  packagingCostPerKg: { type: Number, default: 1 }, // ₹5 per 5kg = ₹1/kg
  deliveryCostPerOrder: { type: Number, default: 50 },
  hasIncompleteCost: { type: Boolean, default: false },
  incompleteCostReason: { type: String, default: '' }
}, { _id: false });

const productSchema = new mongoose.Schema({
  productId: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true 
  }, // e.g. PROD-001 ... PROD-006
  name: { type: String, required: true, trim: true },
  productType: { 
    type: String, 
    enum: ['predefined', 'custom'], 
    default: 'predefined' 
  },
  tagline: { type: String, default: '' },
  target: { type: String, default: '' },
  benefitKeynote: { type: String, default: '' },
  badge: { type: String, default: 'AYURVEDIC BLEND' },
  badgeColor: { type: String, default: '#d4af37' },
  badgeType: { type: String, default: 'gold' }, // 'gold' | 'blue' | 'green' | 'purple' | 'rose'
  mrpPrice: { type: Number, required: true }, // per kg
  sellingPrice: { type: Number, required: true }, // per kg
  discountPercent: { type: Number, default: 0 },
  grains: [grainRatioSchema],
  costBreakdown: { type: costBreakdownSchema, default: () => ({}) },
  calculatedNutrition: { type: calculatedNutritionSchema, default: () => ({}) },
  description: { type: String, default: '' },
  dietaryNotes: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  isSignature: { type: Boolean, default: true },
  category: { type: String, default: 'signature' }, // 'signature', 'specialized', 'custom'
  inStock: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 1 },
  supportsCustomization: { type: Boolean, default: true },
  availablePackSizes: { type: [Number], default: [5, 10] },
  stoneMillingRpm: { type: Number, default: 280 },
  shelfLifeMonths: { type: Number, default: 2 },
  // Finished Goods Inventory (Requirement 5)
  stockOnHand: { type: Number, default: 100 }, // in kg
  stockReserved: { type: Number, default: 0 }, // in kg
  lowStockThreshold: { type: Number, default: 25 }, // in kg
  packStock5kgOnHand: { type: Number, default: 10 }, // 5kg pack units
  packStock5kgReserved: { type: Number, default: 0 },
  packStock10kgOnHand: { type: Number, default: 5 }, // 10kg pack units
  packStock10kgReserved: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Available stock = On-Hand - Reserved (never negative)
productSchema.virtual('stockAvailable').get(function() {
  const onHand = typeof this.stockOnHand === 'number' ? this.stockOnHand : 0;
  const reserved = typeof this.stockReserved === 'number' ? this.stockReserved : 0;
  return Math.max(0, onHand - reserved);
});

// Auto-calculate discount percentage and sync inStock status
productSchema.pre('save', function(next) {
  if (this.mrpPrice && this.sellingPrice && this.mrpPrice > this.sellingPrice) {
    this.discountPercent = Math.round(((this.mrpPrice - this.sellingPrice) / this.mrpPrice) * 100);
  }
  const avail = Math.max(0, (this.stockOnHand || 0) - (this.stockReserved || 0));
  this.inStock = avail > 0;
  next();
});

module.exports = mongoose.model('Product', productSchema);
