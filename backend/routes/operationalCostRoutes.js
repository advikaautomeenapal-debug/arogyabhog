const express = require('express');
const router = express.Router();
const OperationalCost = require('../models/OperationalCost');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET all operational costs
router.get('/', async (req, res) => {
  try {
    const costs = await OperationalCost.find({ active: { $ne: false } }).sort({ costId: 1 });
    res.json({ success: true, count: costs.length, data: costs });
  } catch (error) {
    console.error('Error fetching operational costs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single operational cost
router.get('/:costId', async (req, res) => {
  try {
    const cost = await OperationalCost.findOne({ costId: req.params.costId.toUpperCase() });
    if (!cost) {
      return res.status(404).json({ success: false, message: 'Operational cost not found' });
    }
    res.json({ success: true, data: cost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update operational cost (Admin only)
router.put('/:costId', protect, adminOnly, async (req, res) => {
  try {
    const costId = req.params.costId.toUpperCase();
    const { amount, description, unit, name } = req.body;

    const cost = await OperationalCost.findOne({ costId });
    if (!cost) {
      return res.status(404).json({ success: false, message: `Operational cost ${costId} not found` });
    }

    if (amount !== undefined) {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 0) {
        return res.status(400).json({ success: false, message: 'Please provide a valid non-negative amount' });
      }
      cost.amount = numAmount;
    }

    if (description) cost.description = description;
    if (unit) cost.unit = unit;
    if (name) cost.name = name;
    if (req.body.category) cost.category = req.body.category;
    if (req.body.packageSize !== undefined) cost.packageSize = req.body.packageSize ? Number(req.body.packageSize) : null;

    const updatedCost = await cost.save();

    res.json({
      success: true,
      message: `Operational cost ${cost.costId} (${cost.name}) updated to ₹${cost.amount}!`,
      data: updatedCost
    });
  } catch (error) {
    console.error('Error updating operational cost:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST create new operational cost (Admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { costId, name, amount, unit, description, category, packageSize } = req.body;
    if (!costId || !name || amount === undefined || !unit) {
      return res.status(400).json({ success: false, message: 'costId, name, amount, and unit are required' });
    }

    const existing = await OperationalCost.findOne({ costId: costId.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Cost ID ${costId} already exists` });
    }

    const newCost = new OperationalCost({
      costId: costId.toUpperCase().trim(),
      name: name.trim(),
      amount: Number(amount),
      unit: unit.trim(),
      description: description || '',
      category: category || 'operational',
      packageSize: packageSize ? Number(packageSize) : null
    });

    const saved = await newCost.save();
    res.status(201).json({ success: true, message: 'Operational cost created', data: saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
