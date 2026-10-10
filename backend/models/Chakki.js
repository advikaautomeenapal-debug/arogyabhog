const mongoose = require('mongoose');

const chakkiSchema = new mongoose.Schema({
  chakkiId: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true 
  }, // e.g. CHK-KNP-01
  name: { type: String, required: true, trim: true }, // e.g. Arogya Bhog Kalyanpur Chakki Unit
  city: { type: String, required: true, trim: true }, // e.g. Kanpur
  zone: { type: String, required: true, trim: true }, // e.g. Kanpur West & Kalyanpur Zone
  address: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  operatingStatus: { 
    type: String, 
    enum: ['Active', 'Paused', 'Disabled'], 
    default: 'Active' 
  },
  supportedVariants: { 
    type: [String], 
    default: ['All'] // ['All'] or specific product variant names
  },
  supportsCustomBlending: { 
    type: Boolean, 
    default: true 
  },
  serviceablePincodes: { 
    type: [String], 
    default: [] // Stored as strings e.g. ['208016', '209202']
  },
  priority: { 
    type: Number, 
    default: 1 // Lower integer = higher assignment priority
  },
  dailyCapacityKg: { 
    type: Number, 
    default: 500 
  },
  currentDailyLoadKg: { 
    type: Number, 
    default: 0 
  },
  managerName: { type: String, default: 'Chakki Operator' },
  stoneMillingRpm: { type: Number, default: 280 },
  notes: { type: String, default: '' },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Chakki', chakkiSchema);
