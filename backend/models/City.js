const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }, // e.g. Kanpur
  state: { type: String, default: 'Uttar Pradesh', trim: true },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 1 },
  notes: { type: String, default: '' },
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('City', citySchema);
