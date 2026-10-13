const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const City = require('../models/City');
const DeliveryZone = require('../models/DeliveryZone');
const Chakki = require('../models/Chakki');
const SiteContent = require('../models/SiteContent');

async function seedDeliveryAndSiteContent() {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGODB_URI is not defined in backend/.env');
  }
  console.log('Connecting to MongoDB Atlas for delivery routing & site content seeding...');
  await mongoose.connect(mongoURI);

  console.log('1. Seeding City: Kanpur...');
  let kanpur = await City.findOne({ name: 'Kanpur' });
  if (!kanpur) {
    kanpur = await City.create({
      name: 'Kanpur',
      state: 'Uttar Pradesh',
      isActive: true,
      displayOrder: 1,
      notes: 'Initial operational city for Arogya Bhog artisanal fresh stone milling'
    });
    console.log('Created city: Kanpur');
  } else {
    kanpur.isActive = true;
    await kanpur.save();
    console.log('Updated city: Kanpur (Active)');
  }

  console.log('2. Seeding Operating Chakki: CHK-KNP-01 (Kalyanpur Unit)...');
  let chakki = await Chakki.findOne({ chakkiId: 'CHK-KNP-01' });
  if (!chakki) {
    chakki = await Chakki.create({
      chakkiId: 'CHK-KNP-01',
      name: 'Arogya Bhog Kalyanpur Chakki Unit',
      city: 'Kanpur',
      zone: 'Kanpur West & Kalyanpur Zone',
      address: 'Shop 14, Main Kalyanpur Road, Near IIT Kanpur Gate, Kanpur, UP - 208016',
      phone: '+91 96214 96772',
      operatingStatus: 'Active',
      supportedVariants: ['All'],
      supportsCustomBlending: true,
      serviceablePincodes: ['208016', '209202'], // Stored as strings!
      priority: 1,
      dailyCapacityKg: 600,
      currentDailyLoadKg: 45,
      managerName: 'Ramprasad Sharma',
      stoneMillingRpm: 280,
      notes: 'Natural Emery Stone Milling Unit with cold grinding circulation (<35°C)'
    });
    console.log('Created operating chakki: CHK-KNP-01');
  } else {
    chakki.operatingStatus = 'Active';
    chakki.serviceablePincodes = ['208016', '209202'];
    chakki.supportsCustomBlending = true;
    chakki.supportedVariants = ['All'];
    await chakki.save();
    console.log('Updated operating chakki: CHK-KNP-01');
  }

  console.log('3. Seeding Delivery Zone: Kanpur West & Kalyanpur...');
  let zone = await DeliveryZone.findOne({ zoneId: 'ZONE-KNP-01' });
  if (!zone) {
    zone = await DeliveryZone.create({
      zoneId: 'ZONE-KNP-01',
      city: 'Kanpur',
      name: 'Kanpur West & Kalyanpur Zone',
      pincodes: ['208016', '209202'], // Stored as strings!
      assignedChakkiId: chakki._id,
      assignedChakkiName: chakki.name,
      isActive: true,
      description: 'Primary express milling & delivery corridor covering IIT Kanpur, Kalyanpur, and Bithoor bypass'
    });
    console.log('Created delivery zone: ZONE-KNP-01');
  } else {
    zone.assignedChakkiId = chakki._id;
    zone.assignedChakkiName = chakki.name;
    zone.pincodes = ['208016', '209202'];
    zone.isActive = true;
    await zone.save();
    console.log('Updated delivery zone: ZONE-KNP-01');
  }

  console.log('4. Seeding SiteContent (Website & Customer Panel Settings)...');
  let siteContent = await SiteContent.findOne({ key: 'main_config' });
  if (!siteContent) {
    siteContent = await SiteContent.create({
      key: 'main_config',
      topBannerText: '',
      topBannerBadge: '',
      topBannerActive: false,
      brandTagline: 'रोटी में स्वाद, सेहत के साथ।',
      announcementNotice: 'We currently serve selected PIN codes in Kanpur (208016, 209202).',
      announcementActive: true,
      serviceNotice: 'Freshly stone-milled against every confirmed order and delivered within 24 hours.',
      serviceUnavailableNotice: 'Sorry, we cannot deliver to this PIN code yet.',
      customBlendNotice: 'Custom atta blending is currently available in selected Kanpur zones.',
      chakkiPausedNotice: 'Our chakki is temporarily unavailable for this service. Please check back shortly.',
      finenessOptions: ['Coarse (Missi Roti)', 'Medium (Phulka)', 'Fine (Puri / Paratha)'],
      supportedPackageSizes: [5, 10],
      customBlendTargetWeightKg: 10,
      customBlendServiceCharge: 100,
      customBlendingEnabled: true,
      standardServingSizeG: 50,
      storageInstructions: 'Store in an airtight container in a cool, dry place. 100% preservative-free freshly stone-milled flour is best consumed within 30–45 days.'
    });
    console.log('Created SiteContent: main_config');
  } else {
    console.log('SiteContent already exists: main_config');
  }

  console.log('Delivery routing and site content successfully seeded!');
  await mongoose.disconnect();
}

if (require.main === module) {
  seedDeliveryAndSiteContent()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = seedDeliveryAndSiteContent;
