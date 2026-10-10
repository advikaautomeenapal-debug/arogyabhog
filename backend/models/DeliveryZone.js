const mongoose = require('mongoose');

const deliveryZoneSchema = new mongoose.Schema({
  zoneId: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true 
  }, // e.g. ZONE-KNP-01
  city: { type: String, required: true, trim: true }, // e.g. Kanpur
  name: { type: String, required: true, trim: true }, // e.g. Kanpur West & Kalyanpur Zone
  pincodes: { 
    type: [String], 
    default: [] // Stored as strings to preserve leading zeros!
  },
  assignedChakkiId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Chakki' 
  },
  assignedChakkiName: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  description: { type: String, default: '' },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);
