const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerName: {
    type: String,
    default: ''
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  orderNumber: {
    type: String,
    default: ''
  },
  discountApplied: {
    type: Number,
    required: true
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['FIXED', 'PERCENT'],
    default: 'FIXED'
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 1
  },
  minOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  // If admin shared coupon to one specific user
  assignedToPhone: {
    type: String,
    default: null,
    trim: true
  },
  assignedToName: {
    type: String,
    default: '',
    trim: true
  },
  // If true, any single customer can use this coupon at most once
  isSingleUsePerCustomer: {
    type: Boolean,
    default: true
  },
  // Total maximum redemptions across all users (defaults to 1 for 1-time admin coupons)
  maxUsesTotal: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  usedBy: [couponUsageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Indexes for fast lookups
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ assignedToPhone: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
