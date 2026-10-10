const mongoose = require('mongoose');

const grainItemSchema = new mongoose.Schema({
  grainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grain' },
  ingredientId: { type: String, default: '' },
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  weightKg: { type: Number, default: 0 },
  weightKg5kg: { type: Number, default: null },
  weightKg10kg: { type: Number, default: null },
  pricePerKg: { type: Number, default: 0 },
  calculatedPrice: { type: Number, default: 0 }
}, { _id: false });

const itemNutritionSchema = new mongoose.Schema({
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
  potassiumMg: { type: Number, default: null }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  isCustom: { type: Boolean, default: false },
  batchSizeKg: { type: Number, required: true, default: 5 },
  fineness: { type: String, default: 'Medium (Phulka)' },
  grainBreakdown: [grainItemSchema],
  pricePerKg: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  totalItemPrice: { type: Number, required: true },
  nutritionSnapshot: {
    per100g: { type: itemNutritionSchema, default: () => ({}) },
    perServing: { 
      type: itemNutritionSchema, 
      default: () => ({}),
      servingSizeG: { type: Number, default: 50 }
    },
    perOrderedQuantity: { 
      type: itemNutritionSchema, 
      default: () => ({}),
      totalGrams: { type: Number, default: 5000 }
    }
  },
  selectionTimeSeconds: { type: Number, default: null },
  selectionStartedAt: { type: Date },
  selectionCompletedAt: { type: Date },
  prebuiltSource: {
    variantName: { type: String, default: '' },
    recipeVersion: { type: String, default: '1.0' },
    originalRecipe: [mongoose.Schema.Types.Mixed],
    isModified: { type: Boolean, default: false }
  },
  aiRecommendationDetails: {
    title: { type: String, default: '' },
    dosha: { type: String, default: '' },
    clinicalNote: { type: String, default: '' }
  }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: String, default: 'System' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const activityLogSchema = new mongoose.Schema({
  activity: { type: String, required: true },
  actorRole: { type: String, enum: ['Admin', 'Delivery Person', 'Customer', 'System', 'Not recorded'], default: 'System' },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorName: { type: String, default: 'Not recorded' },
  actorPhone: { type: String, default: '' },
  previousStatus: { type: String, default: '' },
  newStatus: { type: String, default: '' },
  paymentMethod: { type: String, default: '' },
  transactionRef: { type: String, default: '' },
  notes: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerEmail: { type: String, default: '' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerContact: { type: String, required: true },
  customerAddress: { type: String, required: true },
  customerCity: { type: String, default: 'Gurugram' },
  customerState: { type: String, default: 'Haryana' },
  customerSector: { type: String, default: '' },
  customerPincode: { type: String, required: true },
  addressLabel: { type: String, default: 'Home' },
  deliverySlot: { type: String, default: 'Tomorrow Morning (8:00 PM)' },
  expectedDeliveryDate: { type: Date },
  placedAt: { type: Date, default: Date.now },
  orderDate: { type: Date, default: Date.now },
  express: { type: Boolean, default: false },
  customerNotes: { type: String, default: '' },
  adminNotes: { type: String, default: '' },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  serviceCharge: { type: Number, default: 0 }, // Operational costs
  costBreakdown: {
    rawIngredientCost: { type: Number, default: 0 },
    packagingCost: { type: Number, default: 0 },
    millingCost: { type: Number, default: 0 },
    labourCost: { type: Number, default: 0 },
    electricityCost: { type: Number, default: 0 },
    deliveryCost: { type: Number, default: 0 },
    marketplaceFee: { type: Number, default: 0 },
    wastageCost: { type: Number, default: 0 },
    otherCost: { type: Number, default: 0 },
    totalOperationalCost: { type: Number, default: 0 },
    totalProductionCost: { type: Number, default: 0 },
    costPerKg: { type: Number, default: 0 },
    totalOrderCost: { type: Number, default: 0 },
    grossProfit: { type: Number, default: 0 },
    netContribution: { type: Number, default: 0 },
    profitMarginPercent: { type: Number, default: 0 },
    totalBaseCost: { type: Number, default: 0 }
  },
  nutritionSnapshot: {
    per100g: {
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
      potassiumMg: { type: Number, default: null }
    },
    perBatch: {
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
      potassiumMg: { type: Number, default: null }
    }
  },
  discountAmount: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'UPI' },
  paymentStatus: { 
    type: String, 
    enum: [
      'Pending', 'PENDING', 'Paid', 'PAID', 'Success', 'Failed', 'FAILED',
      'COD_PENDING', 'COLLECTED_CASH', 'COLLECTED_UPI', 'REFUND_PENDING', 'REFUNDED'
    ], 
    default: 'Pending'
  },
  paymentVerifiedAt: { type: Date },
  paymentVerifiedBy: { type: String, default: '' },
  paymentConfirmedBy: {
    role: { type: String, enum: ['Admin', 'Delivery Person', 'System', 'Not recorded'], default: 'Not recorded' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    confirmedAt: { type: Date },
    paymentMethod: { type: String, default: '' },
    transactionRef: { type: String, default: '' }
  },
  transactionRef: { type: String, default: '' },
  upiTransactionNote: { type: String, default: '' },
  paymentDetails: {
    gateway: { type: String, default: 'Razorpay' },
    transactionId: { type: String, default: '' },
    upiId: { type: String, default: 'BHARATPE2Y0C0P7Y9F19302@unitype' },
    transactionNote: { type: String, default: '' },
    amount: { type: Number },
    status: { type: String, default: 'Pending' },
    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: String, default: 'System' }
  },
  // Refund Tracking (Requirement 3 & 7)
  refundStatus: { 
    type: String, 
    enum: ['NONE', 'PENDING', 'PROCESSING', 'REFUNDED', 'REJECTED'], 
    default: 'NONE' 
  },
  refundAmount: { type: Number, default: 0 },
  refundTransactionRef: { type: String, default: '' },
  refundProcessedAt: { type: Date },
  refundProcessedBy: { type: mongoose.Schema.Types.Mixed, default: '' },
  refundNotes: { type: String, default: '' },
  refundReason: { type: String, default: '' },
  isServiceable: { type: Boolean, default: true },
  unserviceableCustomerMessage: { type: String, default: '' },
  stockReserved: { type: Boolean, default: false },
  orderStatus: {
    type: String,
    enum: [
      'PLACED', 'Pending', 'Accepted', 'Confirmed', 'Processing', 'PREPARING',
      'Shipped', 'DISPATCHED', 'Delivered', 'DELIVERED', 'Completed', 'COMPLETED',
      'Cancelled', 'CANCELLED', 'CANCELLED_UNSERVICEABLE', 'REFUND_PENDING', 'REFUNDED'
    ],
    default: 'Pending'
  },
  completedAt: { type: Date, default: null },
  isArchived: { type: Boolean, default: false },
  statusHistory: [statusHistorySchema],
  activityLog: [activityLogSchema],
  millingStatus: { 
    type: String, 
    enum: ['Grain Mix', 'Stone Milling', 'Packing & Ship', 'Out for Delivery', 'Delivered', 'Cancelled', 'CANCELLED'],
    default: 'Grain Mix'
  },
  chakkiUnit: { type: String, default: '' },
  // Optional historical chakki snapshot preserved for backwards compatibility
  assignedChakki: {
    chakkiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chakki' },
    chakkiCode: { type: String, default: '' },
    name: { type: String, default: '' },
    city: { type: String, default: '' },
    zone: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    operatingStatus: { type: String, default: 'Active' },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: String, default: 'System' }
  },
  serviceAreaSnapshot: {
    city: { type: String, default: '' },
    zone: { type: String, default: '' },
    pincode: { type: String, default: '' }
  },
  // Delivery Person Association
  assignedDeliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedDeliveryPersonName: { type: String, default: '' },
  assignedDeliveryPersonPhone: { type: String, default: '' },
  assignedDP: { type: String, default: '' },
  deliveryAssignedAt: { type: Date },
  deliveryAssignedBy: { type: String, default: '' },
  deliveryAcceptedAt: { type: Date },
  deliveryDeliveredAt: { type: Date },
  deliveredBy: {
    role: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    deliveredAt: { type: Date }
  },
  deliveryPaidAt: { type: Date },
  stoneMillingRpm: { type: Number, default: 280 }
}, { timestamps: true });

orderSchema.pre('validate', function(next) {
  if (!this.customerContact && this.customerPhone) {
    this.customerContact = this.customerPhone;
  }
  if (!this.customerPhone && this.customerContact) {
    this.customerPhone = this.customerContact;
  }
  if (!this.customerPincode && this.get('customerPinCode')) {
    this.customerPincode = this.get('customerPinCode');
  }

  if (!this.placedAt) {
    this.placedAt = this.createdAt || new Date();
  }
  if (!this.orderDate) {
    this.orderDate = this.placedAt || new Date();
  }

  // Ensure weightKg is populated for all items and prebuiltSource
  if (this.items && Array.isArray(this.items)) {
    this.items.forEach(item => {
      const batchKg = Number(item.batchSizeKg) || 5;
      if (item.grainBreakdown && Array.isArray(item.grainBreakdown)) {
        item.grainBreakdown.forEach(g => {
          if (g.weightKg == null || isNaN(g.weightKg)) {
            g.weightKg = Number(((Number(g.percentage || 0) / 100) * batchKg).toFixed(2));
          }
        });
      }
      if (item.prebuiltSource && Array.isArray(item.prebuiltSource.originalRecipe)) {
        item.prebuiltSource.originalRecipe.forEach(g => {
          if (g && typeof g === 'object' && (g.weightKg == null || isNaN(g.weightKg))) {
            g.weightKg = Number(g.weightKg5kg) || Number(g.weightKg10kg) || Number(((Number(g.percentage || 0) / 100) * batchKg).toFixed(2)) || 0;
          }
        });
      }
    });
  }

  next();
});

module.exports = mongoose.model('Order', orderSchema);
