const express = require('express');
const router = express.Router();
const City = require('../models/City');
const DeliveryZone = require('../models/DeliveryZone');
const Chakki = require('../models/Chakki');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * Helper to validate serviceability based strictly on City and DeliveryZone PIN codes
 * Decoupled completely from Chakki routing (Requirement 1 & 3)
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

  if (!cleanPincode) {
    return {
      serviceable: false,
      isServiceable: false,
      message: 'Enter your 6-digit delivery PIN code to check delivery availability.',
      chakkis: []
    };
  }

  // 1. Look for active DeliveryZone containing this PIN code
  const zoneQuery = {
    pincodes: cleanPincode,
    isActive: true,
    isArchived: { $ne: true }
  };
  if (cleanCity) {
    zoneQuery.city = new RegExp(`^${cleanCity}$`, 'i');
  }

  let activeZone = await DeliveryZone.findOne(zoneQuery);

  // If not found with city filter, try finding by PIN code across all active zones
  if (!activeZone && cleanCity) {
    activeZone = await DeliveryZone.findOne({
      pincodes: cleanPincode,
      isActive: true,
      isArchived: { $ne: true }
    });
  }

  if (!activeZone) {
    return {
      serviceable: false,
      isServiceable: false,
      message: `Delivery is not currently available for PIN code ${cleanPincode}.`,
      chakkis: []
    };
  }

  // 2. Check City status for this zone
  const cityDoc = await City.findOne({
    name: new RegExp(`^${activeZone.city}$`, 'i'),
    isArchived: { $ne: true }
  });

  if (cityDoc && !cityDoc.isActive) {
    return {
      serviceable: false,
      isServiceable: false,
      message: `Delivery service in ${activeZone.city} is temporarily unavailable.`,
      chakkis: []
    };
  }

  return {
    serviceable: true,
    isServiceable: true,
    message: `Delivery available in ${activeZone.name}, ${activeZone.city} (${cleanPincode}).`,
    city: activeZone.city,
    zone: {
      _id: activeZone._id,
      zoneId: activeZone.zoneId,
      name: activeZone.name,
      city: activeZone.city,
      pincodes: activeZone.pincodes
    },
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
    const [cities, zones] = await Promise.all([
      City.find({ isArchived: { $ne: true } }).sort({ displayOrder: 1, name: 1 }),
      DeliveryZone.find({ isArchived: { $ne: true } }).sort({ city: 1, name: 1 })
    ]);

    res.json({
      success: true,
      data: {
        cities,
        zones,
        chakkis: [] // Safe empty array for backwards compatibility
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

module.exports = { router, evaluateServiceability };
