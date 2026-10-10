const express = require('express');
const router = express.Router();
const Grain = require('../models/Grain');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET all grains & silos
router.get('/', async (req, res) => {
  try {
    const grains = await Grain.find().sort({ active: -1, code: 1 });
    res.json({ success: true, count: grains.length, data: grains });
  } catch (error) {
    console.error('Error fetching grains:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single grain
router.get('/:id', async (req, res) => {
  try {
    const grain = await Grain.findById(req.params.id);
    if (!grain) {
      return res.status(404).json({ success: false, message: 'Grain not found' });
    }
    res.json({ success: true, data: grain });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add new grain/silo (Admin)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const newGrain = new Grain(req.body);
    const savedGrain = await newGrain.save();
    res.status(201).json({ success: true, message: 'New grain silo added to chakki!', data: savedGrain });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update grain (price per kg, stock level, capacity, low-stock threshold, nutrition, category)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const grain = await Grain.findById(req.params.id);
    if (!grain) {
      return res.status(404).json({ success: false, message: 'Grain not found' });
    }

    if (req.body.pricePerKg !== undefined) {
      if (req.body.pricePerKg === null || req.body.pricePerKg === '') {
        grain.pricePerKg = null;
        grain.priceStatus = 'pending_configuration';
      } else {
        const newPrice = Number(req.body.pricePerKg);
        if (isNaN(newPrice) || newPrice < 0) {
          return res.status(400).json({ success: false, message: 'Please provide a valid price per kg' });
        }
        grain.pricePerKg = newPrice;
        grain.priceStatus = 'configured';
        grain.priceUpdatedAt = new Date();
      }
    }

    if (req.body.priceStatus !== undefined) grain.priceStatus = req.body.priceStatus;
    if (req.body.category !== undefined) grain.category = req.body.category;
    if (req.body.inStockKg !== undefined) grain.inStockKg = Number(req.body.inStockKg);
    if (req.body.capacityKg !== undefined) grain.capacityKg = Number(req.body.capacityKg);
    if (req.body.lowStockThresholdKg !== undefined) grain.lowStockThresholdKg = Number(req.body.lowStockThresholdKg);
    if (req.body.name) grain.name = req.body.name;
    if (req.body.code) grain.code = req.body.code.toUpperCase();

    if (req.body.sourceStatus !== undefined) grain.sourceStatus = req.body.sourceStatus;
    if (req.body.verificationStatus !== undefined) grain.verificationStatus = req.body.verificationStatus;
    if (req.body.reviewFlag !== undefined) grain.reviewFlag = req.body.reviewFlag;
    if (req.body.flaggedForVerification !== undefined) grain.flaggedForVerification = Boolean(req.body.flaggedForVerification);
    if (req.body.subtitle !== undefined) grain.subtitle = req.body.subtitle;
    if (req.body.benefits !== undefined) grain.benefits = req.body.benefits;

    if (req.body.nutrition && typeof req.body.nutrition === 'object') {
      const n = req.body.nutrition;
      const parseNum = (val, prev) => {
        if (val === null || val === '' || val === 'null' || val === undefined) return (val === null || val === '') ? null : prev;
        const num = Number(val);
        return isNaN(num) ? prev : num;
      };

      grain.nutrition = {
        energyKcal: parseNum(n.energyKcal, grain.nutrition?.energyKcal),
        proteinG: parseNum(n.proteinG, grain.nutrition?.proteinG),
        carbsG: parseNum(n.carbsG, grain.nutrition?.carbsG),
        sugarsG: parseNum(n.sugarsG, grain.nutrition?.sugarsG),
        addedSugarsG: parseNum(n.addedSugarsG, grain.nutrition?.addedSugarsG),
        fatG: parseNum(n.fatG, grain.nutrition?.fatG),
        saturatedFatG: parseNum(n.saturatedFatG, grain.nutrition?.saturatedFatG),
        transFatG: parseNum(n.transFatG, grain.nutrition?.transFatG),
        fibreG: parseNum(n.fibreG, grain.nutrition?.fibreG),
        sodiumMg: parseNum(n.sodiumMg, grain.nutrition?.sodiumMg),
        zincMg: parseNum(n.zincMg, grain.nutrition?.zincMg),
        magnesiumMg: parseNum(n.magnesiumMg, grain.nutrition?.magnesiumMg),
        phosphorusMg: parseNum(n.phosphorusMg, grain.nutrition?.phosphorusMg),
        ironMg: parseNum(n.ironMg, grain.nutrition?.ironMg),
        calciumMg: parseNum(n.calciumMg, grain.nutrition?.calciumMg),
        potassiumMg: parseNum(n.potassiumMg, grain.nutrition?.potassiumMg),
        isConfigured: n.isConfigured !== undefined ? Boolean(n.isConfigured) : (grain.nutrition?.isConfigured ?? true)
      };
    }

    const updatedGrain = await grain.save();

    res.json({ 
      success: true, 
      message: `Grain "${updatedGrain.name}" updated successfully!`, 
      data: updatedGrain 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST restock silo by any valid weight amount (e.g. 5kg, 12.5kg, 25kg, 100kg)
router.post('/:id/restock', protect, adminOnly, async (req, res) => {
  try {
    const quantityToAdd = Number(req.body.quantityKg);
    if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid positive restock quantity (e.g. 5, 12.5, 25 kg)' });
    }

    const grain = await Grain.findById(req.params.id);
    if (!grain) {
      return res.status(404).json({ success: false, message: 'Grain not found' });
    }

    const previousStockKg = grain.inStockKg;
    const newStockKg = Number((previousStockKg + quantityToAdd).toFixed(2));
    grain.inStockKg = newStockKg;

    const adminName = req.body.adminName || req.body.adminEmail || 'Chakki Admin';

    // Record restock history log
    grain.restockHistory.push({
      quantityKg: quantityToAdd,
      previousStockKg,
      newStockKg,
      addedBy: adminName,
      addedAt: new Date()
    });

    await grain.save();

    res.json({
      success: true,
      message: `Successfully restocked ${grain.name} by +${quantityToAdd} kg! Stock updated from ${previousStockKg} kg to ${newStockKg} kg.`,
      data: {
        grain,
        previousStockKg,
        newStockKg,
        quantityAdded: quantityToAdd
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE grain
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const deletedGrain = await Grain.findByIdAndDelete(req.params.id);
    if (!deletedGrain) {
      return res.status(404).json({ success: false, message: 'Grain not found' });
    }
    res.json({ success: true, message: 'Silo decommissioned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
