const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const Grain = require('../models/Grain');
const Order = require('../models/Order');
const InventoryLog = require('../models/InventoryLog');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Configure Multer for product image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'flour-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// GET /api/products/inventory/summary (Finished goods inventory status)
router.get('/inventory/summary', protect, adminOnly, async (req, res) => {
  try {
    const products = await Product.find({ isArchived: { $ne: true } }).sort({ displayOrder: 1, name: 1 });
    const summary = products.map(p => {
      const onHand = typeof p.stockOnHand === 'number' ? p.stockOnHand : 100;
      const reserved = typeof p.stockReserved === 'number' ? p.stockReserved : 0;
      const available = Math.max(0, onHand - reserved);
      const threshold = p.lowStockThreshold || 25;
      return {
        _id: p._id,
        productId: p.productId,
        name: p.name,
        badge: p.badge,
        sellingPrice: p.sellingPrice,
        mrpPrice: p.mrpPrice,
        stockOnHand: onHand,
        stockReserved: reserved,
        stockAvailable: available,
        lowStockThreshold: threshold,
        isLowStock: available <= threshold,
        isOutOfStock: available === 0,
        packStock5kg: {
          onHand: p.packStock5kgOnHand || 0,
          reserved: p.packStock5kgReserved || 0
        },
        packStock10kg: {
          onHand: p.packStock10kgOnHand || 0,
          reserved: p.packStock10kgReserved || 0
        },
        isActive: p.isActive !== false,
        imageUrl: p.imageUrl
      };
    });

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/inventory/logs (Stock ledger history)
router.get('/inventory/logs', protect, adminOnly, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 300);
    const filter = {};
    if (req.query.productId) filter.productId = req.query.productId;
    if (req.query.movementType) filter.movementType = req.query.movementType;

    const logs = await InventoryLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all products
router.get('/', async (req, res) => {
  try {
    const filter = { isArchived: { $ne: true } };
    if (req.query.category) {
      filter.category = req.query.category;
    }
    // If not admin request or explicitly customer-only, only return active products
    if (!req.query.includeInactive) {
      filter.isActive = { $ne: false };
    }
    const products = await Product.find(filter).sort({ displayOrder: 1, isSignature: -1, createdAt: 1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add specialized flour SKU (Supports multipart upload or JSON)
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    let productData = { ...req.body };

    // If grains sent as JSON string in form-data
    if (typeof productData.grains === 'string') {
      try {
        productData.grains = JSON.parse(productData.grains);
      } catch (e) {
        productData.grains = [];
      }
    }

    if (typeof productData.nutritionMetrics === 'string') {
      try {
        productData.nutritionMetrics = JSON.parse(productData.nutritionMetrics);
      } catch (e) {
        productData.nutritionMetrics = {};
      }
    }

    if (typeof productData.availablePackSizes === 'string') {
      try {
        productData.availablePackSizes = JSON.parse(productData.availablePackSizes);
      } catch (e) {
        productData.availablePackSizes = [5, 10];
      }
    }

    // Assign image URL if file uploaded
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      productData.imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    // Default image if not provided
    if (!productData.imageUrl) {
      productData.imageUrl = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';
    }

    const mrp = Number(productData.mrpPrice) || 0;
    const selling = Number(productData.sellingPrice) || 0;
    const discount = mrp > selling ? Math.round(((mrp - selling) / mrp) * 100) : 0;
    productData.discountPercent = discount;

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Specialized flour SKU published successfully to store!',
      data: savedProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update flour (modify price, mrp, grain ratios, name, description, etc.)
router.put('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    let updateData = { ...req.body };

    if (typeof updateData.grains === 'string') {
      try {
        updateData.grains = JSON.parse(updateData.grains);
      } catch (e) {}
    }

    if (typeof updateData.nutritionMetrics === 'string') {
      try {
        updateData.nutritionMetrics = JSON.parse(updateData.nutritionMetrics);
      } catch (e) {}
    }

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      updateData.imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    if (updateData.mrpPrice && updateData.sellingPrice) {
      const mrp = Number(updateData.mrpPrice);
      const selling = Number(updateData.sellingPrice);
      updateData.discountPercent = mrp > selling ? Math.round(((mrp - selling) / mrp) * 100) : 0;
    }

    if (updateData.grains && Array.isArray(updateData.grains)) {
      if (updateData.grains.length === 0) {
        return res.status(400).json({ success: false, message: 'Recipe formula must have at least one ingredient.' });
      }

      const totalPct = updateData.grains.reduce((sum, g) => sum + (Number(g.percentage) || 0), 0);
      if (Math.abs(totalPct - 100) > 0.05) {
        return res.status(400).json({
          success: false,
          message: `Blend recipe percentages must total exactly 100%. Current total is ${totalPct.toFixed(1)}%.`
        });
      }

      const allGrains = await Grain.find();
      let totalRawCostPerKg = 0;
      let hasIncompleteCost = false;
      let incompleteCostReason = '';

      const enrichedGrains = updateData.grains.map(g => {
        const pct = Number(g.percentage) || 0;
        const grainDoc = allGrains.find(dbG => 
          (g.ingredientId && dbG.ingredientId === g.ingredientId) ||
          dbG.name.toLowerCase() === g.name.toLowerCase() ||
          dbG.name.toLowerCase().includes(g.name.split(' ')[0].toLowerCase())
        );

        const weightKg5kg = Number(((pct / 100) * 5).toFixed(2));
        const weightKg10kg = Number(((pct / 100) * 10).toFixed(2));

        if (grainDoc) {
          if (grainDoc.pricePerKg == null || grainDoc.priceStatus === 'pending_configuration') {
            hasIncompleteCost = true;
            incompleteCostReason = `Ingredient "${grainDoc.name}" rate is pending configuration.`;
          } else {
            totalRawCostPerKg += (pct / 100) * grainDoc.pricePerKg;
          }
        } else {
          hasIncompleteCost = true;
          incompleteCostReason = `Ingredient "${g.name}" master record not found.`;
        }

        return {
          ingredientId: grainDoc?.ingredientId || g.ingredientId || '',
          name: grainDoc?.name || g.name,
          percentage: pct,
          weightKg5kg,
          weightKg10kg,
          color: g.color || '#d4af37',
          tag: g.tag || ''
        };
      });

      updateData.grains = enrichedGrains;
      updateData.costBreakdown = {
        rawIngredientCostPerKg: hasIncompleteCost ? null : Number(totalRawCostPerKg.toFixed(2)),
        millingCostPerKg: 4,
        packagingCostPerKg: 1,
        deliveryCostPerOrder: 50,
        hasIncompleteCost,
        incompleteCostReason
      };
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product updated successfully!',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH /api/products/:id/toggle (Toggle active status)
router.patch('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.isActive = !product.isActive;
    await product.save();
    res.json({
      success: true,
      message: `Product "${product.name}" is now ${product.isActive ? 'Active (Visible)' : 'Disabled (Hidden)'}`,
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id (Safe soft-delete / archiving)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check if referenced in historical orders
    const isReferenced = await Order.exists({ 'items.productId': product._id });
    const permanent = req.query.permanent === 'true';

    if (isReferenced || !permanent) {
      // Soft-delete / Archive to preserve order history integrity
      product.isActive = false;
      product.isArchived = true;
      await product.save();
      return res.json({
        success: true,
        message: `Product "${product.name}" disabled and safely archived (historical orders preserved).`
      });
    }

    // Only allow permanent hard-delete if no historical orders reference this product
    await Product.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: `Product "${product.name}" permanently deleted.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/products/:id/stock (Adjust stock on hand with ledger audit)
router.patch('/:id/stock', protect, adminOnly, async (req, res) => {
  try {
    const { movementType, quantityKg, packSizeKg, packUnits, reason, notes } = req.body;
    const qty = Number(quantityKg);
    if (!qty || isNaN(qty)) {
      return res.status(400).json({ success: false, message: 'Valid quantity in kg is required' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const prevOnHand = typeof product.stockOnHand === 'number' ? product.stockOnHand : 100;
    const prevReserved = typeof product.stockReserved === 'number' ? product.stockReserved : 0;
    let newOnHand = prevOnHand;

    const positiveTypes = ['OPENING_STOCK', 'PRODUCTION', 'PURCHASE', 'RETURN'];
    const negativeTypes = ['DAMAGE', 'EXPIRED'];

    if (positiveTypes.includes(movementType)) {
      newOnHand = prevOnHand + Math.abs(qty);
    } else if (negativeTypes.includes(movementType)) {
      newOnHand = Math.max(0, prevOnHand - Math.abs(qty));
    } else {
      // MANUAL_ADJUSTMENT: can increase or decrease
      newOnHand = Math.max(0, prevOnHand + qty);
    }

    product.stockOnHand = newOnHand;
    if (packSizeKg === 5 && packUnits != null) {
      product.packStock5kgOnHand = Math.max(0, (product.packStock5kgOnHand || 0) + Number(packUnits));
    } else if (packSizeKg === 10 && packUnits != null) {
      product.packStock10kgOnHand = Math.max(0, (product.packStock10kgOnHand || 0) + Number(packUnits));
    }

    await product.save();

    // Create entry in InventoryLog
    const log = await InventoryLog.create({
      productId: product._id,
      productName: product.name,
      productCode: product.productId,
      movementType: movementType || 'MANUAL_ADJUSTMENT',
      quantityKg: qty,
      packSizeKg: packSizeKg || null,
      packUnits: packUnits || null,
      previousOnHandKg: prevOnHand,
      newOnHandKg: newOnHand,
      previousReservedKg: prevReserved,
      newReservedKg: prevReserved,
      actorRole: 'Admin',
      actorId: req.user?._id,
      actorName: req.user?.name || 'Administrator',
      reason: reason || 'Stock adjustment',
      notes: notes || ''
    });

    res.json({
      success: true,
      message: `Stock for "${product.name}" updated successfully. New on-hand: ${newOnHand} kg.`,
      data: {
        product,
        log
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id/inventory-ledger
router.get('/:id/inventory-ledger', protect, adminOnly, async (req, res) => {
  try {
    const logs = await InventoryLog.find({ productId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
