const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product' 
  },
  productName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  productCode: { 
    type: String, 
    default: '' 
  },
  grainId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Grain' 
  },
  grainName: { 
    type: String, 
    default: '' 
  },
  movementType: {
    type: String,
    enum: [
      'OPENING_STOCK',
      'PRODUCTION',
      'PURCHASE',
      'MANUAL_ADJUSTMENT',
      'RESERVATION',
      'RESERVATION_RELEASE',
      'DISPATCH_DEDUCTION',
      'RETURN',
      'DAMAGE',
      'EXPIRED'
    ],
    required: true
  },
  quantityKg: { 
    type: Number, 
    required: true 
  },
  packSizeKg: { 
    type: Number, 
    default: null 
  },
  packUnits: { 
    type: Number, 
    default: null 
  },
  previousOnHandKg: { 
    type: Number, 
    default: 0 
  },
  newOnHandKg: { 
    type: Number, 
    default: 0 
  },
  previousReservedKg: { 
    type: Number, 
    default: 0 
  },
  newReservedKg: { 
    type: Number, 
    default: 0 
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  orderNumber: { 
    type: String, 
    default: '' 
  },
  actorRole: { 
    type: String, 
    enum: ['Admin', 'Delivery Person', 'Customer', 'System'], 
    default: 'System' 
  },
  actorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  actorName: { 
    type: String, 
    default: 'System' 
  },
  reason: { 
    type: String, 
    default: '' 
  },
  notes: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

inventoryLogSchema.index({ productId: 1, createdAt: -1 });
inventoryLogSchema.index({ movementType: 1, createdAt: -1 });
inventoryLogSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
