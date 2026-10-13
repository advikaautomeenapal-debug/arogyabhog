const express = require('express');
const router = express.Router();
const SiteContent = require('../models/SiteContent');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET /api/site-content (Public - storefront content)
router.get('/', async (req, res) => {
  try {
    let config = await SiteContent.findOne({ key: 'main_config' });
    if (!config) {
      config = await SiteContent.create({ key: 'main_config' });
    }
    res.json({
      success: true,
      data: config
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/site-content (Admin - update storefront content)
router.put('/', protect, adminOnly, async (req, res) => {
  try {
    const updateData = req.body;
    let config = await SiteContent.findOneAndUpdate(
      { key: 'main_config' },
      { $set: updateData },
      { new: true, upsert: true }
    );
    res.json({
      success: true,
      message: 'Website & customer panel settings updated successfully',
      data: config
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
