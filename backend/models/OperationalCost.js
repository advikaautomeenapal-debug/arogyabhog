const mongoose = require('mongoose');

const operationalCostSchema = new mongoose.Schema({
  costId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  }, // e.g. OP-001, OP-002, OP-003
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['milling', 'packaging', 'delivery', 'labour', 'electricity', 'wastage', 'marketplace', 'misc', 'operational'],
    default: 'operational'
  },
  packageSize: {
    type: Number,
    default: null // e.g. 1, 5, 10 kg
  },
  description: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('OperationalCost', operationalCostSchema);
