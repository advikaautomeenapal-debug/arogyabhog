const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  customerName: {
    type: String,
    default: 'Customer'
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  requestedVia: {
    type: String,
    enum: ['WhatsApp Click-to-Chat', 'WhatsApp Direct Message', 'Admin Manual Entry'],
    default: 'WhatsApp Click-to-Chat'
  },
  status: {
    type: String,
    enum: [
      'Pending Verification',
      'Verified',
      'Reset Link Generated',
      'Completed',
      'Expired',
      'Rejected'
    ],
    default: 'Pending Verification',
    index: true
  },
  verificationStatus: {
    type: String,
    enum: [
      'Unverified',
      'Identity Verified via WhatsApp',
      'Phone Call Verified',
      'Order History Verified',
      'Rejected'
    ],
    default: 'Unverified'
  },
  verificationNotes: {
    type: String,
    default: ''
  },
  verifiedBy: {
    type: String,
    default: ''
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  // Secure SHA-256 hash of single-use reset token
  resetTokenHash: {
    type: String,
    default: null,
    index: true
  },
  resetTokenExpiresAt: {
    type: Date,
    default: null
  },
  isTokenUsed: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Check and mark expired status dynamically
passwordResetRequestSchema.methods.checkExpiry = function() {
  if (
    this.status === 'Reset Link Generated' &&
    this.resetTokenExpiresAt &&
    new Date() > new Date(this.resetTokenExpiresAt) &&
    !this.isTokenUsed
  ) {
    this.status = 'Expired';
  }
  return this.status;
};

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);
