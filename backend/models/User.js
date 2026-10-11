const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { normalizePhone } = require('../utils/phoneHelper');

const savedAddressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, default: 'Kanpur' },
  state: { type: String, default: 'Uttar Pradesh' },
  sector: { type: String, default: '' },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  // Mobile Phone: Primary unique identifier for customer registration & login
  phone: {
    type: String,
    trim: true
  },
  // Email: Optional for customers; preserved for Admin and Delivery personnel
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: undefined
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'delivery'],
    default: 'user'
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: 'Kanpur'
  },
  state: {
    type: String,
    default: 'Uttar Pradesh'
  },
  sector: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: '208016'
  },
  savedAddresses: [savedAddressSchema],
  // Delivery Person specific fields
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  assignedOrdersCount: {
    type: Number,
    default: 0
  },
  // Forgot Password / OTP Verification fields
  resetPasswordOtp: {
    type: String,
    default: null
  },
  resetPasswordOtpExpires: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Sparse unique indexes so duplicate phone/email are prevented without blocking undefined
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// Normalize phone and hash password before saving
userSchema.pre('save', async function(next) {
  // Normalize phone to clean digits if provided
  if (this.phone) {
    this.phone = normalizePhone(this.phone);
  }

  // Ensure empty email string is unset to avoid sparse index collisions
  if (this.email === '' || this.email === null) {
    this.email = undefined;
  }

  if (!this.isModified('password')) return next();
  try {
    // Avoid double hashing if already bcrypt hash
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
  return candidatePassword === this.password;
};

// Remove password and OTP from json serialization
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordOtp;
  delete obj.resetPasswordOtpExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
