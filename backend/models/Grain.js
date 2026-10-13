const mongoose = require('mongoose');

const restockLogSchema = new mongoose.Schema({
  quantityKg: { type: Number, required: true },
  previousStockKg: { type: Number, required: true },
  newStockKg: { type: Number, required: true },
  addedBy: { type: String, default: 'Admin' },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const nutritionSchema = new mongoose.Schema({
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
  isConfigured: { type: Boolean, default: true }
}, { _id: false });

const grainSchema = new mongoose.Schema({
  ingredientId: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true 
  }, // e.g. RM-001, RM-002, ... RM-018
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true }, // e.g. RM-001 or short code
  category: { type: String, required: true, default: 'Base Grain' },
  subtitle: { type: String, default: '' },
  pricePerKg: { type: Number, default: null }, // Nullable for unconfigured ingredients
  priceStatus: { 
    type: String, 
    enum: ['configured', 'pending_configuration'], 
    default: 'configured' 
  },
  priceUpdatedAt: { type: Date, default: Date.now },
  inStockKg: { type: Number, required: true, default: 50 },
  stockUnit: { type: String, default: 'kg' },
  capacityKg: { type: Number, default: 500 },
  lowStockThresholdKg: { type: Number, default: 40 },
  color: { type: String, default: '#C9A227' },
  benefits: { type: String, default: '' },
  nutrition: { type: nutritionSchema, default: () => ({}) },
  sourceStatus: { 
    type: String, 
    default: 'User-provided base values; minerals are reference estimates' 
  },
  verificationStatus: {
    type: String,
    enum: ['User Verified', 'Reference Estimate', 'Pending Lab Test'],
    default: 'Reference Estimate'
  },
  reviewFlag: { type: String, default: '' },
  flaggedForVerification: { type: Boolean, default: false },
  minPercent: { type: Number, default: 0 },
  maxPercent: { type: Number, default: 80 },
  defaultPercent: { type: Number, default: 0 },
  permittedInCustomBlend: { type: Boolean, default: true },
  active: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 1 },
  restockHistory: [restockLogSchema]
}, { timestamps: true });

// Virtual to determine stock status
grainSchema.virtual('stockStatus').get(function() {
  if (this.priceStatus === 'pending_configuration') return 'Price Pending';
  if (this.inStockKg <= 0) return 'Out of Stock';
  if (this.inStockKg <= this.lowStockThresholdKg) return 'Low Stock Warning';
  return 'In Stock';
});

grainSchema.set('toJSON', { virtuals: true });
grainSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Grain', grainSchema);
