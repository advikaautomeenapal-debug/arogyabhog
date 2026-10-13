const express = require('express');
const router = express.Router();
const City = require('../models/City');
const DeliveryZone = require('../models/DeliveryZone');
const Chakki = require('../models/Chakki');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * Helper to validate serviceability based on Chakki PIN configurations and DeliveryZones
 */
async function evaluateServiceability(input) {
  let cleanCity = '';
  let cleanPincode = '';
  let items = [];

  if (typeof input === 'string') {
    cleanPincode = input.trim();
  } else if (input && typeof input === 'object') {
    cleanCity = String(input.city || '').trim();
    cleanPincode = String(input.pincode || input.customerPincode || '').trim();
    items = input.items || [];
  }

  if (!cleanPincode || !/^\d{6}$/.test(cleanPincode)) {
    return {
      serviceable: false,
      isServiceable: false,
      message: 'Enter your 6-digit delivery PIN code to check delivery availability.',
      chakkis: []
    };
  }

  // 1. Check active Chakkis for assigned and active PIN codes
  const activeChakkis = await Chakki.find({
    operatingStatus: 'Active',
    isArchived: { $ne: true }
  }).sort({ priority: 1, name: 1 });

  let matchedChakki = null;
  for (const chakki of activeChakkis) {
    if (chakki.pincodeConfigs && chakki.pincodeConfigs.length > 0) {
      const cfg = chakki.pincodeConfigs.find(c => c.pincode === cleanPincode);
      if (cfg && cfg.isActive) {
        matchedChakki = chakki;
        break;
      }
    }
    // Fallback: check serviceablePincodes array
    if (!matchedChakki && Array.isArray(chakki.serviceablePincodes) && chakki.serviceablePincodes.includes(cleanPincode)) {
      const cfg = chakki.pincodeConfigs?.find(c => c.pincode === cleanPincode);
      if (!cfg || cfg.isActive !== false) {
        matchedChakki = chakki;
        break;
      }
    }
  }

  // 2. Also check DeliveryZone and City if no active chakki matched
  let activeZone = null;
  if (!matchedChakki) {
    const zoneQuery = {
      pincodes: cleanPincode,
      isActive: true,
      isArchived: { $ne: true }
    };
    if (cleanCity) {
      zoneQuery.city = new RegExp(`^${cleanCity}$`, 'i');
    }
    activeZone = await DeliveryZone.findOne(zoneQuery);

    if (!activeZone && cleanCity) {
      activeZone = await DeliveryZone.findOne({
        pincodes: cleanPincode,
        isActive: true,
        isArchived: { $ne: true }
      });
    }

    if (activeZone) {
      const cityDoc = await City.findOne({
        name: new RegExp(`^${activeZone.city}$`, 'i'),
        isArchived: { $ne: true }
      });
      if (cityDoc && !cityDoc.isActive) {
        activeZone = null;
      }
    }
  }

  const isServiceable = Boolean(matchedChakki || activeZone);

  if (isServiceable) {
    return {
      serviceable: true,
      isServiceable: true,
      message: 'Great news! We deliver to your location. You can continue with your order.',
      city: matchedChakki ? matchedChakki.city : (activeZone?.city || cleanCity || 'Kanpur'),
      zone: matchedChakki ? { name: matchedChakki.zone || 'Local Zone', city: matchedChakki.city } : (activeZone || null),
      matchedChakki: matchedChakki ? { id: matchedChakki._id, name: matchedChakki.name, city: matchedChakki.city } : null,
      chakkis: matchedChakki ? [matchedChakki] : []
    };
  }

  return {
    serviceable: false,
    isServiceable: false,
    message: 'Sorry! We’re not accepting orders in your PIN code yet. We’re working to expand our delivery network and hope to serve your location soon.',
    chakkis: []
  };
}

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// POST /api/delivery-areas/check-serviceability
router.post('/check-serviceability', async (req, res) => {
  try {
    const { city, pincode, items } = req.body;
    const result = await evaluateServiceability({ city, pincode, items });
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/delivery-areas (Public / Admin read)
router.get('/', async (req, res) => {
  try {
    const [cities, zones, chakkis] = await Promise.all([
      City.find({ isArchived: { $ne: true } }).sort({ displayOrder: 1, name: 1 }),
      DeliveryZone.find({ isArchived: { $ne: true } }).sort({ city: 1, name: 1 }),
      Chakki.find({ isArchived: { $ne: true } }).sort({ priority: 1, name: 1 })
    ]);

    res.json({
      success: true,
      data: {
        cities,
        zones,
        chakkis
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// ADMIN CONFIGURATION: CITIES
// ==========================================

// POST /api/delivery-areas/cities
router.post('/cities', protect, adminOnly, async (req, res) => {
  try {
    const { name, state, isActive, displayOrder, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'City name is required' });
    }
    const cleanName = name.trim();
    const existing = await City.findOne({ name: new RegExp(`^${cleanName}$`, 'i'), isArchived: { $ne: true } });
    if (existing) {
      return res.status(400).json({ success: false, message: `City "${cleanName}" already exists` });
    }

    const city = await City.create({
      name: cleanName,
      state: state || 'Uttar Pradesh',
      isActive: isActive !== false,
      displayOrder: Number(displayOrder) || 1,
      notes: notes || ''
    });

    res.status(201).json({ success: true, data: city, message: `City "${city.name}" created` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/delivery-areas/cities/:id
router.put('/cities/:id', protect, adminOnly, async (req, res) => {
  try {
    const city = await City.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });
    res.json({ success: true, data: city, message: `City "${city.name}" updated` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/delivery-areas/cities/:id (Soft-delete/archive)
router.delete('/cities/:id', protect, adminOnly, async (req, res) => {
  try {
    const city = await City.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, isActive: false },
      { new: true }
    );
    res.json({ success: true, message: `City "${city?.name}" archived successfully` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// ADMIN CONFIGURATION: DELIVERY ZONES
// ==========================================

// POST /api/delivery-areas/zones
router.post('/zones', protect, adminOnly, async (req, res) => {
  try {
    const { zoneId, city, name, pincodes, assignedChakkiId, isActive, description } = req.body;
    if (!city || !name) {
      return res.status(400).json({ success: false, message: 'City and Zone Name are required' });
    }

    // Ensure PIN codes are stored as strings!
    const cleanPincodes = Array.isArray(pincodes)
      ? pincodes.map(p => String(p).trim()).filter(p => /^\d{6}$/.test(p))
      : (typeof pincodes === 'string' 
          ? pincodes.split(',').map(p => p.trim()).filter(p => /^\d{6}$/.test(p))
          : []);

    const autoZoneId = zoneId || `ZONE-${city.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    let assignedChakkiName = '';
    if (assignedChakkiId) {
      const chakki = await Chakki.findById(assignedChakkiId);
      if (chakki) assignedChakkiName = chakki.name;
    }

    const zone = await DeliveryZone.create({
      zoneId: autoZoneId,
      city: city.trim(),
      name: name.trim(),
      pincodes: cleanPincodes,
      assignedChakkiId: assignedChakkiId || null,
      assignedChakkiName,
      isActive: isActive !== false,
      description: description || ''
    });

    res.status(201).json({ success: true, data: zone, message: `Zone "${zone.name}" created` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/delivery-areas/zones/:id
router.put('/zones/:id', protect, adminOnly, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.pincodes) {
      updateData.pincodes = Array.isArray(updateData.pincodes)
        ? updateData.pincodes.map(p => String(p).trim()).filter(p => /^\d{6}$/.test(p))
        : (typeof updateData.pincodes === 'string'
            ? updateData.pincodes.split(',').map(p => p.trim()).filter(p => /^\d{6}$/.test(p))
            : []);
    }

    if (updateData.assignedChakkiId) {
      const chakki = await Chakki.findById(updateData.assignedChakkiId);
      if (chakki) updateData.assignedChakkiName = chakki.name;
    }

    const zone = await DeliveryZone.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    res.json({ success: true, data: zone, message: `Zone "${zone.name}" updated` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/delivery-areas/zones/:id (Soft-delete/archive)
router.delete('/zones/:id', protect, adminOnly, async (req, res) => {
  try {
    const zone = await DeliveryZone.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, isActive: false },
      { new: true }
    );
    res.json({ success: true, message: `Zone "${zone?.name}" archived successfully` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// ADMIN CONFIGURATION: CHAKKIS
// ==========================================

// POST /api/delivery-areas/chakkis
router.post('/chakkis', protect, adminOnly, async (req, res) => {
  try {
    const { 
      chakkiId, 
      name, 
      city, 
      zone, 
      address, 
      phone, 
      operatingStatus, 
      supportedVariants, 
      supportsCustomBlending, 
      serviceablePincodes, 
      priority, 
      dailyCapacityKg, 
      managerName, 
      notes 
    } = req.body;

    if (!name || !city || !address || !phone) {
      return res.status(400).json({ success: false, message: 'Name, City, Address, and Phone are required' });
    }

    const cleanPincodes = Array.isArray(serviceablePincodes)
      ? serviceablePincodes.map(p => String(p).trim()).filter(p => /^\d{6}$/.test(p))
      : (typeof serviceablePincodes === 'string'
          ? serviceablePincodes.split(',').map(p => p.trim()).filter(p => /^\d{6}$/.test(p))
          : []);

    const autoChakkiId = chakkiId || `CHK-${city.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`;

    const chakki = await Chakki.create({
      chakkiId: autoChakkiId,
      name: name.trim(),
      city: city.trim(),
      zone: zone ? zone.trim() : 'General Zone',
      address: address.trim(),
      phone: phone.trim(),
      operatingStatus: operatingStatus || 'Active',
      supportedVariants: Array.isArray(supportedVariants) && supportedVariants.length > 0 ? supportedVariants : ['All'],
      supportsCustomBlending: supportsCustomBlending !== false,
      serviceablePincodes: cleanPincodes,
      priority: Number(priority) || 1,
      dailyCapacityKg: Number(dailyCapacityKg) || 500,
      managerName: managerName || 'Chakki Operator',
      notes: notes || ''
    });

    res.status(201).json({ success: true, data: chakki, message: `Chakki unit "${chakki.name}" created` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/delivery-areas/chakkis/:id
router.put('/chakkis/:id', protect, adminOnly, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.serviceablePincodes) {
      updateData.serviceablePincodes = Array.isArray(updateData.serviceablePincodes)
        ? updateData.serviceablePincodes.map(p => String(p).trim()).filter(p => /^\d{6}$/.test(p))
        : (typeof updateData.serviceablePincodes === 'string'
            ? updateData.serviceablePincodes.split(',').map(p => p.trim()).filter(p => /^\d{6}$/.test(p))
            : []);
    }

    const chakki = await Chakki.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!chakki) return res.status(404).json({ success: false, message: 'Chakki unit not found' });
    res.json({ success: true, data: chakki, message: `Chakki "${chakki.name}" updated` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/delivery-areas/chakkis/:id (Soft-delete/archive)
router.delete('/chakkis/:id', protect, adminOnly, async (req, res) => {
  try {
    const chakki = await Chakki.findByIdAndUpdate(
      req.params.id,
      { isArchived: true, operatingStatus: 'Disabled' },
      { new: true }
    );
    res.json({ success: true, message: `Chakki "${chakki?.name}" archived successfully` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// ADMIN CONFIGURATION: CHAKKI PIN-CODE MANAGEMENT
// ==========================================

// POST /api/delivery-areas/chakkis/:id/pincodes (Add PIN code to Chakki)
router.post('/chakkis/:id/pincodes', protect, adminOnly, async (req, res) => {
  try {
    const { pincode, notes } = req.body;
    const cleanPin = String(pincode || '').trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 6-digit Indian PIN code (e.g. 208016).' });
    }

    const chakki = await Chakki.findById(req.params.id);
    if (!chakki) {
      return res.status(404).json({ success: false, message: 'Chakki unit not found.' });
    }

    if (!chakki.pincodeConfigs) {
      chakki.pincodeConfigs = [];
    }

    const existingConfigIndex = chakki.pincodeConfigs.findIndex(c => c.pincode === cleanPin);
    if (existingConfigIndex >= 0) {
      if (chakki.pincodeConfigs[existingConfigIndex].isActive) {
        return res.status(400).json({ success: false, message: `PIN code ${cleanPin} is already active for this chakki unit.` });
      }
      // Re-enable inactive config
      chakki.pincodeConfigs[existingConfigIndex].isActive = true;
      if (notes) chakki.pincodeConfigs[existingConfigIndex].notes = notes;
    } else {
      chakki.pincodeConfigs.push({
        pincode: cleanPin,
        isActive: true,
        addedAt: new Date(),
        notes: notes || ''
      });
    }

    // Keep serviceablePincodes in sync
    if (!chakki.serviceablePincodes.includes(cleanPin)) {
      chakki.serviceablePincodes.push(cleanPin);
    }

    await chakki.save();
    res.json({ 
      success: true, 
      message: `PIN code ${cleanPin} added to "${chakki.name}".`, 
      data: chakki 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/delivery-areas/chakkis/:id/pincodes/:pincode/toggle (Toggle PIN code active/disabled)
router.patch('/chakkis/:id/pincodes/:pincode/toggle', protect, adminOnly, async (req, res) => {
  try {
    const cleanPin = String(req.params.pincode || '').trim();
    const chakki = await Chakki.findById(req.params.id);
    if (!chakki) {
      return res.status(404).json({ success: false, message: 'Chakki unit not found.' });
    }

    if (!chakki.pincodeConfigs) {
      chakki.pincodeConfigs = [];
    }

    let config = chakki.pincodeConfigs.find(c => c.pincode === cleanPin);
    if (!config) {
      // If found in legacy serviceablePincodes, initialize it
      const wasInLegacy = Array.isArray(chakki.serviceablePincodes) && chakki.serviceablePincodes.includes(cleanPin);
      config = {
        pincode: cleanPin,
        isActive: !wasInLegacy,
        addedAt: new Date(),
        notes: ''
      };
      chakki.pincodeConfigs.push(config);
    } else {
      config.isActive = !config.isActive;
    }

    // If disabled, remove from serviceablePincodes; if enabled, ensure present
    if (!config.isActive) {
      chakki.serviceablePincodes = (chakki.serviceablePincodes || []).filter(p => p !== cleanPin);
    } else if (!chakki.serviceablePincodes.includes(cleanPin)) {
      chakki.serviceablePincodes.push(cleanPin);
    }

    await chakki.save();
    res.json({ 
      success: true, 
      message: `PIN code ${cleanPin} is now ${config.isActive ? 'Active' : 'Disabled'}.`,
      data: chakki 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/delivery-areas/chakkis/:id/pincodes/:pincode (Remove PIN code from Chakki)
// Removes from future assignment; historical orders, invoices, and customer addresses remain fully preserved
router.delete('/chakkis/:id/pincodes/:pincode', protect, adminOnly, async (req, res) => {
  try {
    const cleanPin = String(req.params.pincode || '').trim();
    const chakki = await Chakki.findById(req.params.id);
    if (!chakki) {
      return res.status(404).json({ success: false, message: 'Chakki unit not found.' });
    }

    chakki.pincodeConfigs = (chakki.pincodeConfigs || []).filter(c => c.pincode !== cleanPin);
    chakki.serviceablePincodes = (chakki.serviceablePincodes || []).filter(p => p !== cleanPin);

    await chakki.save();
    res.json({ 
      success: true, 
      message: `PIN code ${cleanPin} removed from "${chakki.name}". Historical orders remain preserved.`, 
      data: chakki 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = { router, evaluateServiceability };
