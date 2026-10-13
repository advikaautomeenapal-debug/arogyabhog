const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { normalizePhone } = require('../utils/phoneHelper');

// ========================================================
// 1. PUBLIC: VALIDATE COUPON FOR CUSTOMER CHECKOUT
// ========================================================
// POST /api/coupons/validate
router.post('/validate', async (req, res) => {
  try {
    const { code, phone, orderTotal } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a coupon code.'
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanPhone = phone ? normalizePhone(phone) : '';
    const numericTotal = Math.max(0, Number(orderTotal) || 0);

    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code. Please check and try again, or chat with Admin on WhatsApp.'
      });
    }

    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This coupon code is inactive or has been disabled.'
      });
    }

    // Expiry check
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This coupon code has expired.'
      });
    }

    // Min order value check
    if (coupon.minOrderValue > 0 && numericTotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum items total of ₹${coupon.minOrderValue}.`
      });
    }

    // Total redemption limit check (e.g. 1 redemption total)
    if (coupon.maxUsesTotal && coupon.usedCount >= coupon.maxUsesTotal) {
      return res.status(400).json({
        success: false,
        message: 'This coupon code has already been redeemed and reached its usage limit.'
      });
    }

    // Targeted single-user coupon check
    if (coupon.assignedToPhone) {
      const assignedClean = normalizePhone(coupon.assignedToPhone);
      if (!cleanPhone) {
        return res.status(400).json({
          success: false,
          requiresPhone: true,
          message: 'Please enter your mobile number in delivery details to validate this exclusive coupon.'
        });
      }
      if (cleanPhone !== assignedClean) {
        return res.status(400).json({
          success: false,
          message: `This coupon code is exclusive and valid only for registered mobile number ending in ${assignedClean.slice(-4)}.`
        });
      }
    }

    // One-time per customer check ("If admin create a one coupon and one customer use it, then it will not used by same customer again.")
    if (coupon.isSingleUsePerCustomer && cleanPhone) {
      const alreadyUsed = coupon.usedBy.some(u => normalizePhone(u.customerPhone) === cleanPhone);
      if (alreadyUsed) {
        return res.status(400).json({
          success: false,
          message: 'You have already used this coupon code. Each coupon can only be used once per customer.'
        });
      }
    }

    // Calculate applicable discount
    let discount = 0;
    if (coupon.discountType === 'PERCENT') {
      discount = Math.min(Math.round((numericTotal * coupon.discountAmount) / 100), numericTotal);
    } else {
      // FIXED amount discount (e.g. ₹100)
      discount = Math.min(coupon.discountAmount, numericTotal);
    }

    return res.json({
      success: true,
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountAmount: discount,
        nominalDiscount: coupon.discountAmount,
        minOrderValue: coupon.minOrderValue,
        assignedToPhone: coupon.assignedToPhone ? coupon.assignedToPhone.slice(-4) : null
      },
      message: `Coupon "${coupon.code}" applied! You get ₹${discount} OFF.`
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while validating coupon: ' + error.message
    });
  }
});

// ========================================================
// 2. ADMIN: LIST ALL COUPONS
// ========================================================
// GET /api/coupons
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { search, active } = req.query;
    const query = {};

    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { code: { $regex: term, $options: 'i' } },
        { assignedToPhone: { $regex: term, $options: 'i' } },
        { assignedToName: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } }
      ];
    }

    const coupons = await Coupon.find(query).sort({ createdAt: -1 });

    // Aggregate summary stats
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ isActive: true });
    
    // Total redemptions and total savings given
    const allCoupons = await Coupon.find({}, 'usedBy usedCount');
    let totalRedemptions = 0;
    let totalSavingsGiven = 0;
    for (const c of allCoupons) {
      totalRedemptions += (c.usedCount || 0);
      if (Array.isArray(c.usedBy)) {
        for (const u of c.usedBy) {
          totalSavingsGiven += (Number(u.discountApplied) || 0);
        }
      }
    }

    return res.json({
      success: true,
      data: coupons,
      stats: {
        totalCoupons,
        activeCoupons,
        totalRedemptions,
        totalSavingsGiven
      }
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========================================================
// 3. ADMIN: CREATE NEW COUPON
// ========================================================
// POST /api/coupons
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      code,
      description,
      discountType = 'FIXED',
      discountAmount,
      minOrderValue = 0,
      assignedToPhone,
      assignedToName,
      isSingleUsePerCustomer = true,
      maxUsesTotal = 1,
      expiresAt
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required.'
      });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check duplicate code
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code "${cleanCode}" already exists.`
      });
    }

    const numDiscount = Number(discountAmount);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount amount must be a positive number.'
      });
    }

    const cleanAssignedPhone = assignedToPhone ? normalizePhone(assignedToPhone) : null;

    const coupon = new Coupon({
      code: cleanCode,
      description: description ? description.trim() : '',
      discountType: discountType === 'PERCENT' ? 'PERCENT' : 'FIXED',
      discountAmount: numDiscount,
      minOrderValue: Math.max(0, Number(minOrderValue) || 0),
      assignedToPhone: cleanAssignedPhone,
      assignedToName: assignedToName ? assignedToName.trim() : '',
      isSingleUsePerCustomer: isSingleUsePerCustomer !== false,
      maxUsesTotal: maxUsesTotal ? Math.max(1, Number(maxUsesTotal)) : 1,
      usedCount: 0,
      usedBy: [],
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user?.name || 'Admin'
    });

    await coupon.save();

    return res.status(201).json({
      success: true,
      message: `Coupon "${coupon.code}" created successfully.`,
      data: coupon
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========================================================
// 4. ADMIN: TOGGLE COUPON ACTIVE STATUS
// ========================================================
// PUT /api/coupons/:id/toggle
router.put('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found.'
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.json({
      success: true,
      message: `Coupon "${coupon.code}" is now ${coupon.isActive ? 'Active' : 'Disabled'}.`,
      data: coupon
    });
  } catch (error) {
    console.error('Error toggling coupon:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ========================================================
// 5. ADMIN: DELETE COUPON
// ========================================================
// DELETE /api/coupons/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found.'
      });
    }

    // If already used, warn or allow archive
    await Coupon.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: `Coupon "${coupon.code}" deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
