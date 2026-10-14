const mongoose = require('mongoose');

const inAppNotificationSchema = new mongoose.Schema({
  recipientPhone: { 
    type: String, 
    index: true,
    default: '' 
  },
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true 
  },
  recipientRole: { 
    type: String, 
    enum: ['customer', 'delivery', 'admin', 'all'], 
    default: 'customer',
    index: true 
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    index: true 
  },
  orderNumber: { 
    type: String, 
    default: '' 
  },
  type: { 
    type: String, 
    enum: [
      'STATUS_CHANGE', 
      'NEW_MESSAGE', 
      'ORDER_PLACED', 
      'ORDER_ACCEPTED', 
      'DISPATCHED', 
      'DELIVERED', 
      'CANCELLED', 
      'REFUNDED', 
      'PAYMENT_UPDATE',
      'GENERAL'
    ], 
    default: 'STATUS_CHANGE' 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
}, { timestamps: true });

// Index for high-performance notification polling
inAppNotificationSchema.index({ recipientRole: 1, recipientPhone: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('InAppNotification', inAppNotificationSchema);
