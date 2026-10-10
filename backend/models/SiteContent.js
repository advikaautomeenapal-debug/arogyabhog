const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'main_config' },
  topBannerText: { 
    type: String, 
    default: '100% Traditional Slow Stone Cold-Ground • Below 35°C' 
  },
  topBannerBadge: { 
    type: String, 
    default: 'Zero Preservatives' 
  },
  topBannerActive: { 
    type: Boolean, 
    default: true 
  },
  brandTagline: { 
    type: String, 
    default: 'रोटी में स्वाद, सेहत के साथ।' 
  },
  announcementNotice: { 
    type: String, 
    default: 'We currently serve selected PIN codes in Kanpur (208016, 209202).' 
  },
  announcementActive: { 
    type: Boolean, 
    default: true 
  },
  serviceNotice: { 
    type: String, 
    default: 'Freshly stone-milled against every confirmed order and delivered within 24 hours.' 
  },
  serviceUnavailableNotice: { 
    type: String, 
    default: 'Sorry, we cannot deliver to this PIN code yet.' 
  },
  customBlendNotice: { 
    type: String, 
    default: 'Custom atta blending is currently available in selected Kanpur zones.' 
  },
  chakkiPausedNotice: {
    type: String,
    default: 'Our chakki is temporarily unavailable for this service. Please check back shortly.'
  },
  finenessOptions: { 
    type: [String], 
    default: ['Coarse (Missi Roti)', 'Medium (Phulka)', 'Fine (Puri / Paratha)'] 
  },
  supportedPackageSizes: { 
    type: [Number], 
    default: [5, 10] 
  },
  customBlendTargetWeightKg: { 
    type: Number, 
    default: 10 
  },
  customBlendServiceCharge: { 
    type: Number, 
    default: 100 
  },
  customBlendingEnabled: { 
    type: Boolean, 
    default: true 
  },
  standardServingSizeG: {
    type: Number,
    default: 50 // Standard atta serving = 50g (2 phulkas)
  },
  storageInstructions: { 
    type: String, 
    default: 'Store in an airtight container in a cool, dry place. 100% preservative-free freshly stone-milled flour is best consumed within 30–45 days.' 
  }
}, { timestamps: true });

module.exports = mongoose.model('SiteContent', siteContentSchema);
