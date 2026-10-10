const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const savedAddressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, default: 'Gurugram' },
  state: { type: String, default: 'Haryana' },
  sector: { type: String, default: '' },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
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
  phone: {
    type: String,
    default: ''
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
    default: 'Gurugram'
  },
  state: {
    type: String,
    default: 'Haryana'
  },
  sector: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    default: '122002'
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
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
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

// Remove password from json serialization
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
