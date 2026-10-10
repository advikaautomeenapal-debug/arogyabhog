const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Grain = require('../models/Grain');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const User = require('../models/User');
const OperationalCost = require('../models/OperationalCost');
const { protect, adminOnly, deliveryOrAdmin, optionalAuth } = require('../middleware/authMiddleware');
const { evaluateServiceability } = require('./deliveryAreaRoutes');
const { resolveGrainDoc } = require('../utils/grainResolver');

// Calculate 16 nutrients for an item's confirmed grain breakdown
const calculateItemNutritionSnapshot = (grainBreakdown, batchSizeKg, quantity, grainMap, allGrains) => {
  const nutrients = [
    'energyKcal', 'proteinG', 'carbsG', 'sugarsG', 'addedSugarsG',
    'fatG', 'saturatedFatG', 'transFatG', 'fibreG', 'sodiumMg',
    'zincMg', 'magnesiumMg', 'phosphorusMg', 'ironMg', 'calciumMg', 'potassiumMg'
  ];

  const per100g = {};
  const perServing = {};
  const perOrderedQuantity = {};
  const servingSizeG = 50; // standard atta serving
  const totalOrderedGrams = (Number(batchSizeKg) || 5) * (Number(quantity) || 1) * 1000;

  for (const n of nutrients) {
    let sum = 0;
    let hasKnown = false;

    if (Array.isArray(grainBreakdown) && grainBreakdown.length > 0) {
      for (const g of grainBreakdown) {
        const gDoc = grainMap[g.name] || (g.grainId && grainMap[g.grainId.toString()]) ||
          resolveGrainDoc(g.name || g.grainId, allGrains);
        
        const pct = Number(g.percentage) || 0;
        if (gDoc && gDoc.nutrition && gDoc.nutrition[n] != null) {
          sum += (pct / 100) * Number(gDoc.nutrition[n]);
          hasKnown = true;
        }
      }
    }

    if (hasKnown) {
      const val100 = Number(sum.toFixed(1));
      per100g[n] = val100;
      perServing[n] = Number(((val100 * servingSizeG) / 100).toFixed(1));
      perOrderedQuantity[n] = Number(((val100 * totalOrderedGrams) / 100).toFixed(1));
    } else {
      per100g[n] = null;
      perServing[n] = null;
      perOrderedQuantity[n] = null;
    }
  }

  return {
    per100g,
    perServing: { ...perServing, servingSizeG },
    perOrderedQuantity: { ...perOrderedQuantity, totalGrams: totalOrderedGrams }
  };
};

const generateOrderNumber = async () => {
  const count = await Order.countDocuments();
  const baseNum = 8492 + count;
  return `#AB-${baseNum}`;
};

// Helper function: Automatic fair allocation of order to available delivery personnel
const autoAllocateDeliveryPerson = async (order) => {
  try {
    const availableDPs = await User.find({
      role: 'delivery',
      isActive: true,
      isAvailable: true
    });

    if (!availableDPs || availableDPs.length === 0) {
      return null;
    }

    // Find the delivery person with fewest active assigned orders
    let bestDP = null;
    let minActiveOrders = Infinity;

    for (const dp of availableDPs) {
      const activeCount = await Order.countDocuments({
        assignedDeliveryPerson: dp._id,
        orderStatus: { $in: ['Accepted', 'Processing', 'Shipped'] }
      });

      if (activeCount < minActiveOrders) {
        minActiveOrders = activeCount;
        bestDP = dp;
      }
    }

    if (bestDP) {
      order.assignedDeliveryPerson = bestDP._id;
      order.assignedDeliveryPersonName = bestDP.name;
      order.assignedDeliveryPersonPhone = bestDP.phone;
      order.assignedDP = bestDP.name;
      order.deliveryAssignedAt = new Date();
      order.deliveryAssignedBy = 'System Auto-Dispatcher';
      if (!order.activityLog) order.activityLog = [];
      order.activityLog.push({
        activity: 'Delivery Partner Assigned',
        actorRole: 'System',
        actorName: 'System Auto-Dispatcher',
        notes: `Auto-allocated to ${bestDP.name} (${bestDP.phone})`,
        timestamp: new Date()
      });
    }

    return bestDP;
  } catch (err) {
    console.error('Error in autoAllocateDeliveryPerson:', err);
    return null;
  }
};

// GET all orders with Search and Filter capabilities (Admin / Customer / Delivery)
// Supports:
// - queueType: 'active' (default for active queue, enforces 3-day auto-archival for completed orders),
//              'archived' (completed > 3 days ago or explicitly archived),
//              'recently-completed' (completed within last 3 days),
//              'all' (unfiltered historical)
// - Filters: search, paymentStatus, orderStatus, fromDate, toDate, variant, deliveryPerson, customerId
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      search, 
      paymentStatus, 
      orderStatus, 
      fromDate, 
      toDate, 
      customerId, 
      queueType,
      variant,
      deliveryPerson
    } = req.query;
    
    const filter = {};
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS);

    // Strict Role-Based Data Isolation
    if (req.user) {
      if (req.user.role === 'delivery') {
        filter.assignedDeliveryPerson = req.user._id;
      } else if (req.user.role === 'user') {
        filter.$or = [
          { customerId: req.user._id },
          { customerEmail: req.user.email },
          { customerPhone: req.user.phone }
        ];
      }
      // If admin, unrestricted view across all customer and delivery orders
    } else {
      // Unauthenticated access must provide customerId
      if (customerId) {
        filter.customerId = customerId;
      } else {
        return res.json({ success: true, count: 0, data: [] });
      }
    }

    if (customerId && (!req.user || req.user.role === 'admin')) {
      filter.customerId = customerId;
    }

    // 3-Day Completed Order Auto-Archival Rule
    // Only apply queueType logic if an admin or no user restriction
    if (!req.user || req.user.role === 'admin') {
      if (queueType === 'active') {
        // Active queue: Non-completed/delivered orders OR completed/delivered within the last 3 days
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { orderStatus: { $nin: ['Delivered', 'Completed', 'Cancelled'] } },
            { 
              orderStatus: { $in: ['Delivered', 'Completed'] },
              $or: [
                { completedAt: { $gte: threeDaysAgo } },
                { completedAt: null, updatedAt: { $gte: threeDaysAgo } }
              ],
              isArchived: { $ne: true }
            }
          ]
        });
      } else if (queueType === 'archived') {
        // Archived queue: Completed > 3 days ago OR explicitly marked isArchived
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            {
              orderStatus: { $in: ['Delivered', 'Completed'] },
              $or: [
                { completedAt: { $lt: threeDaysAgo } },
                { completedAt: null, createdAt: { $lt: threeDaysAgo } }
              ]
            },
            { isArchived: true }
          ]
        });
      } else if (queueType === 'recently-completed') {
        filter.orderStatus = { $in: ['Delivered', 'Completed'] };
        filter.$or = [
          { completedAt: { $gte: threeDaysAgo } },
          { completedAt: null, updatedAt: { $gte: threeDaysAgo } }
        ];
      }
    }

    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus;
    }

    if (orderStatus && orderStatus !== 'all') {
      if (orderStatus === 'Accepted') {
        filter.orderStatus = { $in: ['Accepted', 'Confirmed'] };
      } else if (orderStatus === 'Delivered' || orderStatus === 'Completed') {
        filter.orderStatus = { $in: ['Delivered', 'Completed'] };
      } else {
        filter.orderStatus = orderStatus;
      }
    }

    if (deliveryPerson && deliveryPerson !== 'all') {
      filter.assignedDeliveryPerson = deliveryPerson;
    }

    if (variant && variant.trim() !== '') {
      filter['items.name'] = new RegExp(variant.trim(), 'i');
    }

    const { chakkiId, city, zone } = req.query;
    if (chakkiId && chakkiId !== 'all') {
      const chakkiConditions = [
        { 'assignedChakki.chakkiId': chakkiId },
        { 'assignedChakki.chakkiCode': chakkiId },
        { 'assignedChakki.name': new RegExp(chakkiId.trim(), 'i') },
        { chakkiUnit: new RegExp(chakkiId.trim(), 'i') }
      ];
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: chakkiConditions });
    }

    if (city && city !== 'all') {
      const cityRegex = new RegExp(city.trim(), 'i');
      const cityConditions = [
        { 'assignedChakki.city': cityRegex },
        { 'serviceAreaSnapshot.city': cityRegex },
        { customerCity: cityRegex }
      ];
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: cityConditions });
    }

    if (zone && zone !== 'all') {
      const zoneRegex = new RegExp(zone.trim(), 'i');
      const zoneConditions = [
        { 'assignedChakki.zone': zoneRegex },
        { 'serviceAreaSnapshot.zone': zoneRegex },
        { customerSector: zoneRegex }
      ];
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: zoneConditions });
    }

    if (fromDate || toDate) {
      const dateQuery = {};
      if (fromDate) dateQuery.$gte = new Date(fromDate);
      if (toDate) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        dateQuery.$lte = endOfDay;
      }
      filter.createdAt = dateQuery;
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      const regex = new RegExp(term, 'i');
      const searchConditions = [
        { orderNumber: regex },
        { customerName: regex },
        { customerPhone: regex },
        { customerContact: regex },
        { customerPincode: regex },
        { 'items.name': regex }
      ];
      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: filter.$or });
        filter.$and.push({ $or: searchConditions });
        delete filter.$or;
      } else if (filter.$and) {
        filter.$and.push({ $or: searchConditions });
      } else {
        filter.$or = searchConditions;
      }
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET milling queue (active floor grinding orders)
router.get('/queue', async (req, res) => {
  try {
    const queueOrders = await Order.find({
      orderStatus: { $nin: ['Delivered', 'DELIVERED', 'Cancelled', 'CANCELLED', 'CANCELLED_UNSERVICEABLE', 'REFUNDED'] }
    }).sort({ createdAt: -1 });
    res.json({ success: true, count: queueOrders.length, data: queueOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET delivery person assigned orders only (Delivery Dashboard)
router.get('/delivery/my-orders', protect, deliveryOrAdmin, async (req, res) => {
  try {
    const deliveryPersonId = req.user._id;
    const orders = await Order.find({
      assignedDeliveryPerson: deliveryPersonId,
      orderStatus: { $ne: 'Cancelled' }
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET admin aggregate metrics (Must be registered BEFORE /:id to prevent parameter shadowing)
router.get('/admin/metrics', async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    const pendingPayments = await Order.countDocuments({ paymentStatus: 'Pending' });
    const activeProcessing = await Order.countDocuments({
      orderStatus: { $in: ['Accepted', 'Confirmed', 'Processing', 'Shipped'] }
    });
    const lowSilosCount = await Grain.countDocuments({
      $expr: { $lte: ['$inStockKg', '$lowStockThresholdKg'] }
    });
    const activeDPsCount = await User.countDocuments({
      role: 'delivery',
      isActive: true,
      isAvailable: true
    });

    res.json({
      success: true,
      data: {
        ordersToday: 28 + totalOrders,
        activeMillingBags: 14 + activeProcessing,
        lowSilosCount: lowSilosCount || 4,
        pendingPayments,
        pendingOrders,
        activeDeliveryPersonnel: activeDPsCount,
        chakkiUnit: 'Unit #4 - Gurugram'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single order by ID or orderNumber
router.get('/:id', async (req, res) => {
  try {
    let order;
    if (req.params.id.startsWith('#AB-')) {
      order = await Order.findOne({ orderNumber: req.params.id });
    } else {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create checkout order
// Validates:
// 1. Customer authentication & delivery details (name, contact, address, 6-digit PIN)
// 2. Custom Blend: must total exactly 10 kg! Pricing = totalIngredientCost + ₹100 service charge.
// 3. Pre-Blend: must be strictly 5 kg or 10 kg!
// 4. Automatic delivery person allocation.
router.post('/', async (req, res) => {
  try {
    // Validate delivery information
    const customerName = (req.body.customerName || '').trim();
    const contactNumber = (req.body.customerContact || req.body.customerPhone || '').trim();
    const customerAddress = (req.body.customerAddress || '').trim();
    const customerPincode = (req.body.customerPincode || '').trim();
    const customerCity = (req.body.customerCity || 'Kanpur').trim();

    if (!customerName) {
      return res.status(400).json({ success: false, message: 'Customer full name is required for delivery' });
    }
    if (!contactNumber || contactNumber.length < 10) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit mobile contact number is required' });
    }
    if (!customerAddress || customerAddress.length < 5) {
      return res.status(400).json({ success: false, message: 'Complete delivery address is required' });
    }
    if (!customerPincode || !/^\d{6}$/.test(customerPincode)) {
      return res.status(400).json({ success: false, message: 'A valid 6-digit Indian PIN code is required (e.g. 208016)' });
    }

    if (!req.body.items || !Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items before checking out.' });
    }

    const orderNumber = await generateOrderNumber();

    // Fetch live grains from database to calculate latest prices and validate
    const allGrains = await Grain.find();
    const grainMap = {};
    allGrains.forEach(g => {
      grainMap[g.name] = g;
      grainMap[g._id.toString()] = g;
    });

    let calculatedTotal = 0;
    let totalServiceCharge = 0;
    const validatedItems = [];

    for (const item of req.body.items) {
      const qty = Number(item.quantity) || 1;
      let itemPrice = 0;
      let validatedBreakdown = [];

      if (item.isCustom) {
        // REQUIREMENT 3: CUSTOM BLEND MUST TOTAL EXACTLY 10 KG
        const batchSize = Number(item.batchSizeKg);
        if (batchSize !== 10) {
          return res.status(400).json({ 
            success: false, 
            message: 'Please select ingredients totaling exactly 10 kg before adding your custom blend to the cart.' 
          });
        }

        if (!item.grainBreakdown || !Array.isArray(item.grainBreakdown) || item.grainBreakdown.length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Please select ingredients totaling exactly 10 kg before adding your custom blend to the cart.' 
          });
        }

        let customGrainsCost = 0;
        let cumulativeWeight = 0;

        for (const g of item.grainBreakdown) {
          const grainDoc = grainMap[g.name] || (g.grainId && grainMap[g.grainId.toString()]) || 
            resolveGrainDoc(g.name || g.grainId, allGrains);
          
          const weightKg = Number(g.weightKg !== undefined ? g.weightKg : ((Number(g.percentage) / 100) * 10));
          if (weightKg < 0) {
            return res.status(400).json({ success: false, message: 'Ingredient weights cannot be negative.' });
          }

          cumulativeWeight += weightKg;
          const pricePerKg = grainDoc ? grainDoc.pricePerKg : (Number(g.pricePerKg) || 70);
          const calculatedPrice = Math.round(weightKg * pricePerKg);
          customGrainsCost += calculatedPrice;

          const pct = Number(g.percentage) || Math.round((weightKg / 10) * 100);

          validatedBreakdown.push({
            grainId: grainDoc ? grainDoc._id : undefined,
            name: grainDoc ? grainDoc.name : g.name,
            percentage: pct,
            weightKg: Number(weightKg.toFixed(2)),
            pricePerKg,
            calculatedPrice
          });
        }

        // Validate that total weight equals exactly 10 kg (with 0.05 tolerance for rounding)
        if (Math.abs(cumulativeWeight - 10) > 0.05) {
          return res.status(400).json({ 
            success: false, 
            message: `Please select ingredients totaling exactly 10 kg before adding your custom blend to the cart. Current total is ${cumulativeWeight.toFixed(2)} kg.` 
          });
        }

        // REQUIREMENT 3B: Final Blend Price = Total Ingredient Cost + ₹100
        const fixedServiceCharge = 100;
        totalServiceCharge += fixedServiceCharge;
        itemPrice = (customGrainsCost + fixedServiceCharge) * qty;

        calculatedTotal += itemPrice;
        const itemNutrition = calculateItemNutritionSnapshot(validatedBreakdown, 10, qty, grainMap, allGrains);
        validatedItems.push({
          productId: item.productId,
          name: item.name || `Custom Chakki Blend (10 kg)`,
          isCustom: true,
          batchSizeKg: 10,
          fineness: item.fineness || 'Medium (Phulka)',
          grainBreakdown: validatedBreakdown,
          pricePerKg: Number(((customGrainsCost + fixedServiceCharge) / 10).toFixed(1)),
          quantity: qty,
          totalItemPrice: itemPrice,
          nutritionSnapshot: itemNutrition,
          selectionTimeSeconds: Number(item.selectionTimeSeconds) || null,
          selectionStartedAt: item.selectionStartedAt ? new Date(item.selectionStartedAt) : null,
          selectionCompletedAt: item.selectionCompletedAt ? new Date(item.selectionCompletedAt) : null,
          prebuiltSource: item.prebuiltSource || null,
          aiRecommendationDetails: item.aiRecommendationDetails || null
        });

      } else {
        // REQUIREMENT 4: PRE-BLENDED PRODUCTS MUST BE STRICTLY 5 KG OR 10 KG
        const batchSize = Number(item.batchSizeKg);
        if (![5, 10].includes(batchSize)) {
          return res.status(400).json({ 
            success: false, 
            message: `Pre-blended flours can only be ordered in 5 kg or 10 kg packages. Selected package size was ${batchSize} kg.` 
          });
        }

        if (item.grainBreakdown && Array.isArray(item.grainBreakdown)) {
          validatedBreakdown = item.grainBreakdown.map(g => ({
            grainId: g.grainId,
            name: g.name,
            percentage: Number(g.percentage) || 0,
            weightKg: Number(g.weightKg) || Number(((Number(g.percentage || 0) / 100) * batchSize).toFixed(2)),
            pricePerKg: Number(g.pricePerKg) || 0,
            calculatedPrice: Number(g.calculatedPrice) || 0
          }));
        }

        const unitRate = Number(item.pricePerKg) || 68;
        itemPrice = Math.round(unitRate * batchSize) * qty;
        calculatedTotal += itemPrice;

        const itemNutrition = calculateItemNutritionSnapshot(validatedBreakdown, batchSize, qty, grainMap, allGrains);
        validatedItems.push({
          productId: item.productId,
          name: item.name,
          isCustom: false,
          batchSizeKg: batchSize,
          fineness: item.fineness || 'Medium (Phulka)',
          grainBreakdown: validatedBreakdown,
          pricePerKg: unitRate,
          quantity: qty,
          totalItemPrice: itemPrice,
          nutritionSnapshot: itemNutrition,
          selectionTimeSeconds: Number(item.selectionTimeSeconds) || null,
          selectionStartedAt: item.selectionStartedAt ? new Date(item.selectionStartedAt) : null,
          selectionCompletedAt: item.selectionCompletedAt ? new Date(item.selectionCompletedAt) : null,
          prebuiltSource: item.prebuiltSource ? {
            ...item.prebuiltSource,
            originalRecipe: Array.isArray(item.prebuiltSource.originalRecipe)
              ? item.prebuiltSource.originalRecipe.map(g => ({
                  ...g,
                  weightKg: Number(g.weightKg) || (batchSize === 5 ? (Number(g.weightKg5kg) || Number(((Number(g.percentage || 0) / 100) * 5).toFixed(2))) : (Number(g.weightKg10kg) || Number(((Number(g.percentage || 0) / 100) * 10).toFixed(2)))) || 0
                }))
              : []
          } : null,
          aiRecommendationDetails: item.aiRecommendationDetails || null
        });
      }
    }

    const discountAmount = Number(req.body.discountAmount) || 0;
    const finalAmount = Math.max(0, calculatedTotal - discountAmount);

    // Calculate itemized operational costs
    const opCosts = await OperationalCost.find({ active: { $ne: false } });
    const millingRate = opCosts.find(c => c.costId === 'OP-001')?.amount ?? 4.0;
    const pkgRate5 = opCosts.find(c => c.costId === 'OP-002')?.amount ?? 5.0;
    const pkgRate1 = opCosts.find(c => c.costId === 'OP-002-1')?.amount ?? 2.5;
    const pkgRate10 = opCosts.find(c => c.costId === 'OP-002-10')?.amount ?? 10.0;
    const deliveryRate = opCosts.find(c => c.costId === 'OP-003')?.amount ?? 50.0;
    const labelRate = opCosts.find(c => c.costId === 'OP-004')?.amount ?? 1.5;
    const labourRate = opCosts.find(c => c.costId === 'OP-005')?.amount ?? 3.0;
    const electricityRate = opCosts.find(c => c.costId === 'OP-006')?.amount ?? 2.0;
    const wastagePct = opCosts.find(c => c.costId === 'OP-007')?.amount ?? 2.0;
    const gatewayPct = opCosts.find(c => c.costId === 'OP-008')?.amount ?? 1.8;

    let totalWeightKg = 0;
    let totalRawCost = 0;
    let totalPackagingCost = 0;
    let totalLabelsCost = 0;

    // Accumulators for 16 nutrients across entire order
    const nutrientTotals = {
      energyKcal: 0,
      proteinG: 0,
      carbsG: 0,
      sugarsG: 0,
      addedSugarsG: null,
      fatG: 0,
      saturatedFatG: 0,
      transFatG: null,
      fibreG: 0,
      sodiumMg: 0,
      zincMg: 0,
      magnesiumMg: 0,
      phosphorusMg: 0,
      ironMg: 0,
      calciumMg: 0,
      potassiumMg: 0
    };

    for (const item of validatedItems) {
      const batchKg = Number(item.batchSizeKg) || 10;
      const q = Number(item.quantity) || 1;
      const itemWeight = batchKg * q;
      totalWeightKg += itemWeight;

      let perPackPkgCost = pkgRate5;
      if (batchKg <= 1) perPackPkgCost = pkgRate1;
      else if (batchKg >= 10) perPackPkgCost = pkgRate10;
      totalPackagingCost += perPackPkgCost * q;
      totalLabelsCost += labelRate * q;

      if (item.isCustom) {
        const rawForOne = item.grainBreakdown?.reduce((sum, g) => sum + (Number(g.calculatedPrice) || 0), 0) || 0;
        totalRawCost += rawForOne * q;
      } else {
        const opPerItem = (batchKg * millingRate) + perPackPkgCost;
        const rawForOne = Math.max(0, (Number(item.totalItemPrice) / q) - opPerItem);
        totalRawCost += rawForOne * q;
      }

      if (item.grainBreakdown && Array.isArray(item.grainBreakdown)) {
        for (const g of item.grainBreakdown) {
          const gDoc = grainMap[g.name] || (g.grainId && grainMap[g.grainId.toString()]) || 
            resolveGrainDoc(g.name || g.grainId, allGrains);
          const gWeight = (Number(g.weightKg) || ((Number(g.percentage) / 100) * batchKg)) * q;

          if (gDoc && gDoc.nutrition) {
            const n = gDoc.nutrition;
            const fraction = gWeight / 100;
            if (n.energyKcal != null) nutrientTotals.energyKcal += fraction * n.energyKcal;
            if (n.proteinG != null) nutrientTotals.proteinG += fraction * n.proteinG;
            if (n.carbsG != null) nutrientTotals.carbsG += fraction * n.carbsG;
            if (n.sugarsG != null) nutrientTotals.sugarsG += fraction * n.sugarsG;
            if (n.fatG != null) nutrientTotals.fatG += fraction * n.fatG;
            if (n.saturatedFatG != null) nutrientTotals.saturatedFatG += fraction * n.saturatedFatG;
            if (n.fibreG != null) nutrientTotals.fibreG += fraction * n.fibreG;
            if (n.sodiumMg != null) nutrientTotals.sodiumMg += fraction * n.sodiumMg;
            if (n.zincMg != null) nutrientTotals.zincMg += fraction * n.zincMg;
            if (n.magnesiumMg != null) nutrientTotals.magnesiumMg += fraction * n.magnesiumMg;
            if (n.phosphorusMg != null) nutrientTotals.phosphorusMg += fraction * n.phosphorusMg;
            if (n.ironMg != null) nutrientTotals.ironMg += fraction * n.ironMg;
            if (n.calciumMg != null) nutrientTotals.calciumMg += fraction * n.calciumMg;
            if (n.potassiumMg != null) nutrientTotals.potassiumMg += fraction * n.potassiumMg;
          }
        }
      }
    }

    const hundredGramMultiplier = totalWeightKg > 0 ? (1 / (totalWeightKg * 10)) : 1;
    const per100gSnapshot = {};
    const perBatchSnapshot = {};
    for (const [k, v] of Object.entries(nutrientTotals)) {
      if (v === null) {
        per100gSnapshot[k] = null;
        perBatchSnapshot[k] = null;
      } else {
        per100gSnapshot[k] = Number((v * hundredGramMultiplier).toFixed(1));
        perBatchSnapshot[k] = Number(v.toFixed(1));
      }
    }

    const calculatedMillingCost = Math.round(totalWeightKg * millingRate);
    const calculatedPackagingCost = Math.round(totalPackagingCost);
    const calculatedLabourCost = Math.round(totalWeightKg * labourRate);
    const calculatedElectricityCost = Math.round(totalWeightKg * electricityRate);
    const calculatedDeliveryCost = deliveryRate;
    const calculatedMarketplaceFee = Math.round(finalAmount * (gatewayPct / 100));
    const calculatedWastageCost = Math.round(totalRawCost * (wastagePct / 100));
    const calculatedOtherCost = Math.round(totalLabelsCost);

    const calculatedTotalOperationalCost = calculatedPackagingCost + calculatedMillingCost + calculatedLabourCost +
      calculatedElectricityCost + calculatedDeliveryCost + calculatedMarketplaceFee + calculatedWastageCost + calculatedOtherCost;

    const calculatedTotalProductionCost = Math.round(totalRawCost) + calculatedPackagingCost + calculatedMillingCost +
      calculatedLabourCost + calculatedElectricityCost + calculatedWastageCost + calculatedOtherCost;

    const calculatedCostPerKg = totalWeightKg > 0 ? Number((calculatedTotalProductionCost / totalWeightKg).toFixed(1)) : 0;
    const calculatedTotalOrderCost = calculatedTotalProductionCost + calculatedDeliveryCost + calculatedMarketplaceFee;
    const calculatedGrossProfit = Math.round(finalAmount - calculatedTotalProductionCost);
    const calculatedNetContribution = Math.round(finalAmount - calculatedTotalOrderCost);
    const calculatedProfitMarginPercent = finalAmount > 0 ? Number(((calculatedNetContribution / finalAmount) * 100).toFixed(1)) : 0;

    const cleanOrderNumber = orderNumber.replace(/^#/, '');
    const upiTransactionNote = `Order ${cleanOrderNumber} | Name: ${customerName} | Phone: ${contactNumber}`;

    // Expected delivery: tomorrow morning or given date
    const expectedDeliveryDate = req.body.expectedDeliveryDate ? new Date(req.body.expectedDeliveryDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Evaluate serviceability on submission based on PIN code (and City) (Requirement 3)
    const serviceability = await evaluateServiceability({
      city: customerCity,
      pincode: customerPincode,
      items: validatedItems
    });

    const isPaidOnline = req.body.paymentStatus === 'PAID' || req.body.paymentStatus === 'Paid' || Boolean(req.body.isPaid);

    let assignedOrderStatus = 'PLACED';
    let assignedPaymentStatus = req.body.paymentMethod === 'COD' ? 'COD_PENDING' : 'PENDING';
    let assignedRefundStatus = 'NONE';
    let assignedRefundAmount = 0;
    let assignedRefundReason = '';
    let customerServiceMessage = '';

    if (!serviceability.serviceable) {
      // REQUIREMENT 3: LOCATION IS OUTSIDE SERVICE AREA
      if (isPaidOnline) {
        // Unserviceable and Paid -> REFUND_PENDING
        assignedOrderStatus = 'REFUND_PENDING';
        assignedPaymentStatus = 'REFUND_PENDING';
        assignedRefundStatus = 'PENDING';
        assignedRefundAmount = finalAmount;
        assignedRefundReason = 'Order placed in unserviceable delivery location';
        customerServiceMessage = "We’re sorry! Arogya Bhog is not yet available in your location. Your order cannot be delivered, so we will process your refund. You’ll receive an update once the refund is completed.";
      } else {
        // Unserviceable and Unpaid -> CANCELLED_UNSERVICEABLE
        assignedOrderStatus = 'CANCELLED_UNSERVICEABLE';
        assignedPaymentStatus = 'FAILED';
        assignedRefundStatus = 'NONE';
        customerServiceMessage = "We’re sorry! Arogya Bhog is not delivering in your location yet. We’re working to make our products available near you soon. Please visit us again.";
      }
    } else {
      // Serviceable -> Check finished goods product stock
      for (const item of validatedItems) {
        if (!item.isCustom && item.productId) {
          const product = await Product.findById(item.productId);
          if (product) {
            const reqKg = (Number(item.batchSizeKg) || 5) * (Number(item.quantity) || 1);
            const availKg = Math.max(0, (product.stockOnHand || 0) - (product.stockReserved || 0));
            if (availKg < reqKg) {
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for "${product.name}". Required: ${reqKg} kg, Available: ${availKg} kg.`
              });
            }
          }
        }
      }

      if (isPaidOnline) {
        assignedOrderStatus = 'CONFIRMED';
        assignedPaymentStatus = 'PAID';
      }
    }

    const orderData = {
      orderNumber,
      customerId: req.body.customerId || undefined,
      customerEmail: req.body.customerEmail || '',
      customerName,
      customerPhone: contactNumber,
      customerContact: contactNumber,
      customerAddress,
      customerCity: serviceability.city || customerCity,
      customerState: req.body.customerState || 'Uttar Pradesh',
      customerSector: serviceability.zone?.name || req.body.customerSector || '',
      customerPincode,
      addressLabel: req.body.addressLabel || 'Home',
      deliverySlot: req.body.deliverySlot || 'Tomorrow Morning (8:00 PM)',
      expectedDeliveryDate,
      placedAt: new Date(),
      orderDate: new Date(),
      express: !!req.body.express,
      customerNotes: req.body.customerNotes || req.body.notes || '',
      adminNotes: req.body.adminNotes || '',
      items: validatedItems,
      totalAmount: finalAmount,
      serviceCharge: totalServiceCharge || calculatedTotalOperationalCost,
      chakkiUnit: '',
      assignedChakki: {
        name: '',
        city: serviceability.city || customerCity,
        zone: serviceability.zone?.name || '',
        operatingStatus: 'Active',
        assignedAt: new Date(),
        assignedBy: 'System'
      },
      serviceAreaSnapshot: {
        city: serviceability.city || customerCity,
        zone: serviceability.zone?.name || 'General Zone',
        pincode: customerPincode
      },
      isServiceable: serviceability.serviceable,
      unserviceableCustomerMessage: customerServiceMessage,
      stockReserved: false,
      refundStatus: assignedRefundStatus,
      refundAmount: assignedRefundAmount,
      refundReason: assignedRefundReason,
      costBreakdown: {
        rawIngredientCost: Math.round(totalRawCost),
        packagingCost: calculatedPackagingCost,
        millingCost: calculatedMillingCost,
        labourCost: calculatedLabourCost,
        electricityCost: calculatedElectricityCost,
        deliveryCost: calculatedDeliveryCost,
        marketplaceFee: calculatedMarketplaceFee,
        wastageCost: calculatedWastageCost,
        otherCost: calculatedOtherCost,
        totalOperationalCost: calculatedTotalOperationalCost,
        totalProductionCost: calculatedTotalProductionCost,
        costPerKg: calculatedCostPerKg,
        totalOrderCost: calculatedTotalOrderCost,
        grossProfit: calculatedGrossProfit,
        netContribution: calculatedNetContribution,
        profitMarginPercent: calculatedProfitMarginPercent,
        totalBaseCost: calculatedTotalOrderCost
      },
      nutritionSnapshot: {
        per100g: per100gSnapshot,
        perBatch: perBatchSnapshot
      },
      discountAmount,
      deliveryFee: 0,
      paymentMethod: req.body.paymentMethod || 'UPI',
      paymentStatus: assignedPaymentStatus,
      orderStatus: assignedOrderStatus,
      statusHistory: [{
        status: assignedOrderStatus,
        changedBy: customerName,
        timestamp: new Date()
      }],
      activityLog: [{
        activity: serviceability.serviceable ? 'Order Placed' : 'Order Attempted (Unserviceable Location)',
        actorRole: 'Customer',
        actorName: customerName,
        actorPhone: contactNumber,
        previousStatus: '',
        newStatus: assignedOrderStatus,
        paymentMethod: req.body.paymentMethod || 'UPI',
        transactionRef: req.body.transactionRef || '',
        notes: customerServiceMessage || req.body.customerNotes || 'Order placed by customer',
        timestamp: new Date()
      }],
      millingStatus: 'Grain Mix',
      currentStep: 1,
      transactionRef: req.body.transactionRef || req.body.paymentDetails?.transactionId || `UPI-TXN-${Date.now().toString().slice(-7)}`,
      upiTransactionNote,
      paymentDetails: {
        gateway: req.body.paymentDetails?.gateway || (req.body.paymentMethod === 'ONLINE' ? 'Razorpay' : 'UPI'),
        transactionId: req.body.paymentDetails?.transactionId || req.body.transactionRef || '',
        upiId: req.body.paymentDetails?.upiId || 'BHARATPE2Y0C0P7Y9F19302@unitype',
        transactionNote: upiTransactionNote,
        amount: finalAmount,
        status: req.body.paymentDetails?.status || (isPaidOnline ? 'Captured' : 'Pending'),
        generatedAt: new Date(),
        generatedBy: customerName
      }
    };

    // Auto-save address to customer profile if requested
    if (req.body.saveAddressToProfile && (req.body.customerId || (req.user && req.user._id))) {
      try {
        const uId = req.body.customerId || req.user._id;
        const userDoc = await User.findById(uId);
        if (userDoc) {
          if (!userDoc.savedAddresses) userDoc.savedAddresses = [];
          const exists = userDoc.savedAddresses.some(a => 
            a.address.toLowerCase().trim() === customerAddress.toLowerCase().trim() && 
            a.pincode === customerPincode
          );
          if (!exists) {
            userDoc.savedAddresses.push({
              label: req.body.addressLabel || 'Home',
              name: customerName,
              phone: contactNumber,
              address: customerAddress,
              city: customerCity,
              state: req.body.customerState || 'Uttar Pradesh',
              sector: req.body.customerSector || '',
              pincode: customerPincode,
              isDefault: userDoc.savedAddresses.length === 0
            });
            await userDoc.save();
          }
        }
      } catch (err) {
        console.warn('Could not auto-save address to user:', err.message);
      }
    }

    let savedOrder = null;
    try {
      const newOrder = new Order(orderData);
      
      if (serviceability.serviceable) {
        await autoAllocateDeliveryPerson(newOrder);
      }

      savedOrder = await newOrder.save();

      // If location is serviceable, reserve stock atomically and record in InventoryLog
      if (serviceability.serviceable) {
        for (const item of validatedItems) {
          if (!item.isCustom && item.productId) {
            const product = await Product.findById(item.productId);
            if (product) {
              const reqKg = (Number(item.batchSizeKg) || 5) * (Number(item.quantity) || 1);
              const prevRes = typeof product.stockReserved === 'number' ? product.stockReserved : 0;
              product.stockReserved = prevRes + reqKg;
              await product.save();

              await InventoryLog.create({
                productId: product._id,
                productName: product.name,
                productCode: product.productId,
                movementType: 'RESERVATION',
                quantityKg: reqKg,
                packSizeKg: Number(item.batchSizeKg) || 5,
                packUnits: Number(item.quantity) || 1,
                previousOnHandKg: product.stockOnHand || 0,
                newOnHandKg: product.stockOnHand || 0,
                previousReservedKg: prevRes,
                newReservedKg: product.stockReserved,
                orderId: savedOrder._id,
                orderNumber: savedOrder.orderNumber,
                actorRole: 'Customer',
                actorName: customerName,
                reason: `Stock reserved for order ${savedOrder.orderNumber}`
              });
            }
          }
        }

        savedOrder.stockReserved = true;
        await savedOrder.save();

        return res.status(201).json({
          success: true,
          unserviceable: false,
          message: isPaidOnline 
            ? 'Order confirmed successfully! Payment verified.' 
            : 'Order placed successfully. Payment verification is pending.',
          data: savedOrder
        });
      } else {
        // Unserviceable order saved with appropriate status and customer message
        return res.status(200).json({
          success: true,
          unserviceable: true,
          isPaid: isPaidOnline,
          orderStatus: assignedOrderStatus,
          message: customerServiceMessage,
          data: savedOrder
        });
      }
    } catch (saveErr) {
      if (savedOrder && savedOrder._id) {
        await Order.findByIdAndDelete(savedOrder._id).catch(() => {});
      }
      throw saveErr;
    }
  } catch (error) {
    console.error('Error placing order:', error.message);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Order could not be placed. Please check your information and try again.' 
    });
  }
});

// PATCH /api/orders/:id/payment-status
// Updates paymentStatus ('Paid' | 'Success' | 'Failed' | 'Pending')
router.patch('/:id/payment-status', protect, adminOnly, async (req, res) => {
  try {
    const { paymentStatus, adminEmail, adminName, adminPhone, transactionRef } = req.body;
    if (!['Pending', 'Paid', 'Success', 'Failed'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const prevPayStatus = order.paymentStatus;
    const actorName = adminName || (adminEmail ? (adminEmail.includes('@') ? adminEmail.split('@')[0] : adminEmail) : 'Chakki Admin (Meena)');
    const actorPhone = adminPhone || '+91 98112 00001';

    order.paymentStatus = paymentStatus;
    if (transactionRef) order.transactionRef = transactionRef;

    if (paymentStatus === 'Paid' || paymentStatus === 'Success') {
      order.paymentVerifiedAt = new Date();
      order.paymentVerifiedBy = `Admin: ${actorName}`;
      order.paymentConfirmedBy = {
        role: 'Admin',
        name: actorName,
        phone: actorPhone,
        confirmedAt: new Date(),
        paymentMethod: order.paymentMethod,
        transactionRef: transactionRef || order.transactionRef
      };

      // If verified paid/success and order is still Pending, move to Accepted
      if (order.orderStatus === 'Pending') {
        order.orderStatus = 'Accepted';
        order.currentStep = 2;
        order.millingStatus = 'Stone Milling';
        order.statusHistory.push({
          status: 'Accepted',
          changedBy: actorName,
          timestamp: new Date()
        });
        if (!order.activityLog) order.activityLog = [];
        order.activityLog.push({
          activity: 'Order Accepted & Milling Started',
          actorRole: 'Admin',
          actorName,
          actorPhone,
          previousStatus: 'Pending',
          newStatus: 'Accepted',
          notes: 'Auto-accepted on payment verification',
          timestamp: new Date()
        });
      }
    }

    if (!order.activityLog) order.activityLog = [];
    order.activityLog.push({
      activity: `Payment Marked ${paymentStatus}`,
      actorRole: 'Admin',
      actorName,
      actorPhone,
      previousStatus: prevPayStatus,
      newStatus: paymentStatus,
      paymentMethod: order.paymentMethod,
      transactionRef: transactionRef || order.transactionRef,
      notes: `Payment status updated from "${prevPayStatus}" to "${paymentStatus}" by Admin`,
      timestamp: new Date()
    });

    await order.save();

    res.json({
      success: true,
      message: `Payment status for ${order.orderNumber} updated to "${paymentStatus}"`,
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/status
// Controlled workflow: Pending -> Accepted -> Processing -> Shipped -> Delivered -> Cancelled
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { orderStatus, millingStatus, changedBy, actorName, actorPhone, notes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validStatuses = [
      'PLACED', 'Pending', 'Accepted', 'Confirmed', 'CONFIRMED',
      'Processing', 'PREPARING', 'Shipped', 'DISPATCHED',
      'Delivered', 'DELIVERED', 'Completed', 'COMPLETED',
      'Cancelled', 'CANCELLED', 'CANCELLED_UNSERVICEABLE',
      'REFUND_PENDING', 'REFUNDED'
    ];

    if (orderStatus && validStatuses.includes(orderStatus)) {
      const prevStatus = order.orderStatus;
      const normalizedStatus = orderStatus === 'Confirmed' ? 'Accepted' : orderStatus;
      order.orderStatus = normalizedStatus;

      const actor = actorName || changedBy || 'Administrator';
      const phone = actorPhone || '+91 98112 00001';

      // Sync milling step according to order status
      if (['Accepted', 'CONFIRMED', 'PLACED'].includes(normalizedStatus)) {
        order.currentStep = 2;
        order.millingStatus = 'Stone Milling';
      } else if (['Processing', 'PREPARING'].includes(normalizedStatus)) {
        order.currentStep = 3;
        order.millingStatus = 'Packing & Ship';
      } else if (['Shipped', 'DISPATCHED'].includes(normalizedStatus)) {
        order.currentStep = 4;
        order.millingStatus = 'Out for Delivery';
        // DISPATCH DEDUCTION: Convert reserved stock to physical dispatch deduction
        if (order.stockReserved) {
          for (const item of order.items) {
            if (item.productId) {
              const prod = await Product.findById(item.productId);
              if (prod) {
                const kg = (Number(item.batchSizeKg) || 5) * (Number(item.quantity) || 1);
                const prevOnHand = typeof prod.stockOnHand === 'number' ? prod.stockOnHand : 100;
                const prevRes = typeof prod.stockReserved === 'number' ? prod.stockReserved : 0;
                prod.stockOnHand = Math.max(0, prevOnHand - kg);
                prod.stockReserved = Math.max(0, prevRes - kg);
                await prod.save();

                await InventoryLog.create({
                  productId: prod._id,
                  productName: prod.name,
                  productCode: prod.productId,
                  movementType: 'DISPATCH_DEDUCTION',
                  quantityKg: -kg,
                  packSizeKg: Number(item.batchSizeKg) || 5,
                  packUnits: Number(item.quantity) || 1,
                  previousOnHandKg: prevOnHand,
                  newOnHandKg: prod.stockOnHand,
                  previousReservedKg: prevRes,
                  newReservedKg: prod.stockReserved,
                  orderId: order._id,
                  orderNumber: order.orderNumber,
                  actorRole: 'Admin',
                  actorId: req.user?._id,
                  actorName: actor,
                  reason: `Finished goods dispatched for order ${order.orderNumber}`
                });
              }
            }
          }
          order.stockReserved = false;
        }
      } else if (['Delivered', 'DELIVERED', 'Completed', 'COMPLETED'].includes(normalizedStatus)) {
        order.currentStep = 5;
        order.millingStatus = 'Delivered';
        if (!order.deliveryDeliveredAt) order.deliveryDeliveredAt = new Date();
        if (!order.completedAt) order.completedAt = new Date();
        order.isArchived = false;
        order.deliveredBy = {
          role: 'Admin',
          name: actor,
          phone: phone,
          deliveredAt: new Date()
        };
        // Ensure reserved stock is deducted if not done at Shipped
        if (order.stockReserved) {
          for (const item of order.items) {
            if (item.productId) {
              const prod = await Product.findById(item.productId);
              if (prod) {
                const kg = (Number(item.batchSizeKg) || 5) * (Number(item.quantity) || 1);
                const prevOnHand = typeof prod.stockOnHand === 'number' ? prod.stockOnHand : 100;
                const prevRes = typeof prod.stockReserved === 'number' ? prod.stockReserved : 0;
                prod.stockOnHand = Math.max(0, prevOnHand - kg);
                prod.stockReserved = Math.max(0, prevRes - kg);
                await prod.save();

                await InventoryLog.create({
                  productId: prod._id,
                  productName: prod.name,
                  productCode: prod.productId,
                  movementType: 'DISPATCH_DEDUCTION',
                  quantityKg: -kg,
                  packSizeKg: Number(item.batchSizeKg) || 5,
                  packUnits: Number(item.quantity) || 1,
                  previousOnHandKg: prevOnHand,
                  newOnHandKg: prod.stockOnHand,
                  previousReservedKg: prevRes,
                  newReservedKg: prod.stockReserved,
                  orderId: order._id,
                  orderNumber: order.orderNumber,
                  actorRole: 'Admin',
                  actorId: req.user?._id,
                  actorName: actor,
                  reason: `Finished goods marked delivered for order ${order.orderNumber}`
                });
              }
            }
          }
          order.stockReserved = false;
        }
      } else if (['Cancelled', 'CANCELLED', 'CANCELLED_UNSERVICEABLE', 'REFUND_PENDING', 'REFUNDED'].includes(normalizedStatus)) {
        order.millingStatus = 'Cancelled';
        // RESERVATION RELEASE: Release reserved inventory back to available stock
        if (order.stockReserved) {
          for (const item of order.items) {
            if (item.productId) {
              const prod = await Product.findById(item.productId);
              if (prod) {
                const kg = (Number(item.batchSizeKg) || 5) * (Number(item.quantity) || 1);
                const prevRes = typeof prod.stockReserved === 'number' ? prod.stockReserved : 0;
                prod.stockReserved = Math.max(0, prevRes - kg);
                await prod.save();

                await InventoryLog.create({
                  productId: prod._id,
                  productName: prod.name,
                  productCode: prod.productId,
                  movementType: 'RESERVATION_RELEASE',
                  quantityKg: kg,
                  packSizeKg: Number(item.batchSizeKg) || 5,
                  packUnits: Number(item.quantity) || 1,
                  previousOnHandKg: prod.stockOnHand || 0,
                  newOnHandKg: prod.stockOnHand || 0,
                  previousReservedKg: prevRes,
                  newReservedKg: prod.stockReserved,
                  orderId: order._id,
                  orderNumber: order.orderNumber,
                  actorRole: 'Admin',
                  actorId: req.user?._id,
                  actorName: actor,
                  reason: `Stock reservation released on order ${normalizedStatus}: ${order.orderNumber}`
                });
              }
            }
          }
          order.stockReserved = false;
        }
      } else {
        order.completedAt = null;
        order.isArchived = false;
      }

      order.statusHistory.push({
        status: normalizedStatus,
        changedBy: actor,
        timestamp: new Date()
      });

      let activityLabel = `Status Changed to ${normalizedStatus}`;
      if (normalizedStatus === 'Accepted') activityLabel = 'Order Accepted';
      else if (normalizedStatus === 'Processing') activityLabel = 'Order Processing Started';
      else if (normalizedStatus === 'Shipped') activityLabel = 'Order Marked Shipped';
      else if (normalizedStatus === 'Delivered') activityLabel = 'Order Marked Delivered';
      else if (normalizedStatus === 'Cancelled') activityLabel = 'Order Cancelled';

      if (!order.activityLog) order.activityLog = [];
      order.activityLog.push({
        activity: activityLabel,
        actorRole: 'Admin',
        actorName: actor,
        actorPhone: phone,
        previousStatus: prevStatus,
        newStatus: normalizedStatus,
        notes: notes || `Order advanced to ${normalizedStatus} by Administrator`,
        timestamp: new Date()
      });
    }

    if (millingStatus) {
      order.millingStatus = millingStatus;
    }

    await order.save();

    res.json({
      success: true,
      message: `Order ${order.orderNumber} updated to status "${order.orderStatus}"`,
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/refund (Admin confirm refund with transaction ID) (Requirement 3 & 7)
router.patch('/:id/refund', protect, adminOnly, async (req, res) => {
  try {
    const { refundTransactionRef, refundAmount, refundNotes, adminName } = req.body;
    if (!refundTransactionRef || !refundTransactionRef.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refund transaction reference / ID is required to record a refund.' 
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const actor = adminName || req.user?.name || 'Administrator';
    const cleanRef = refundTransactionRef.trim();
    const cleanAmount = Number(refundAmount) || order.totalAmount;

    order.orderStatus = 'REFUNDED';
    order.paymentStatus = 'REFUNDED';
    order.refundStatus = 'REFUNDED';
    order.refundTransactionRef = cleanRef;
    order.refundAmount = cleanAmount;
    order.refundProcessedAt = new Date();
    order.refundProcessedBy = actor;
    order.refundNotes = refundNotes || 'Refund processed by Administrator';

    // Release stock reservation if held
    if (order.stockReserved) {
      for (const item of order.items) {
        if (item.productId) {
          const prod = await Product.findById(item.productId);
          if (prod) {
            const kg = (Number(item.batchSizeKg) || 5) * (Number(item.quantity) || 1);
            const prevRes = typeof prod.stockReserved === 'number' ? prod.stockReserved : 0;
            prod.stockReserved = Math.max(0, prevRes - kg);
            await prod.save();

            await InventoryLog.create({
              productId: prod._id,
              productName: prod.name,
              productCode: prod.productId,
              movementType: 'RESERVATION_RELEASE',
              quantityKg: kg,
              packSizeKg: Number(item.batchSizeKg) || 5,
              packUnits: Number(item.quantity) || 1,
              previousOnHandKg: prod.stockOnHand || 0,
              newOnHandKg: prod.stockOnHand || 0,
              previousReservedKg: prevRes,
              newReservedKg: prod.stockReserved,
              orderId: order._id,
              orderNumber: order.orderNumber,
              actorRole: 'Admin',
              actorId: req.user?._id,
              actorName: actor,
              reason: `Stock reservation released on order refund: ${cleanRef}`
            });
          }
        }
      }
      order.stockReserved = false;
    }

    order.statusHistory.push({
      status: 'REFUNDED',
      changedBy: actor,
      timestamp: new Date()
    });

    if (!order.activityLog) order.activityLog = [];
    order.activityLog.push({
      activity: 'Refund Confirmed & Processed',
      actorRole: 'Admin',
      actorId: req.user?._id,
      actorName: actor,
      previousStatus: order.orderStatus,
      newStatus: 'REFUNDED',
      transactionRef: cleanRef,
      notes: `Refund of ₹${cleanAmount} processed (Ref: ${cleanRef}). Notes: ${refundNotes || 'None'}`,
      timestamp: new Date()
    });

    await order.save();

    res.json({
      success: true,
      message: `Refund of ₹${cleanAmount} for order ${order.orderNumber} successfully processed!`,
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/collect-cash (Delivery person records cash collection) (Requirement 6)
router.post('/:id/collect-cash', protect, deliveryOrAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const prevPay = order.paymentStatus;
    const collectorName = req.user?.name || 'Delivery Partner';
    const collectorPhone = req.user?.phone || '';

    order.paymentStatus = 'COLLECTED_CASH';
    order.paymentVerifiedAt = new Date();
    order.paymentVerifiedBy = `Delivery: ${collectorName}`;
    order.deliveryPaidAt = new Date();
    order.paymentConfirmedBy = {
      role: 'Delivery Person',
      userId: req.user?._id,
      name: collectorName,
      phone: collectorPhone,
      confirmedAt: new Date(),
      paymentMethod: 'Cash on Delivery',
      transactionRef: `CASH-${Date.now().toString().slice(-6)}`
    };

    if (!order.activityLog) order.activityLog = [];
    order.activityLog.push({
      activity: 'Cash Collected at Doorstep',
      actorRole: 'Delivery Person',
      actorId: req.user?._id,
      actorName: collectorName,
      previousStatus: prevPay,
      newStatus: 'COLLECTED_CASH',
      notes: `₹${order.totalAmount} cash collected by delivery agent ${collectorName}`,
      timestamp: new Date()
    });

    await order.save();
    res.json({
      success: true,
      message: `Cash collection of ₹${order.totalAmount} recorded successfully!`,
      data: order
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/orders/:id/collect-upi (Delivery person records doorstep UPI scan) (Requirement 6)
router.post('/:id/collect-upi', protect, deliveryOrAdmin, async (req, res) => {
  try {
    const { transactionRef } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const prevPay = order.paymentStatus;
    const ref = transactionRef || `UPI-SCAN-${Date.now().toString().slice(-6)}`;
    const collectorName = req.user?.name || 'Delivery Partner';
    const collectorPhone = req.user?.phone || '';

    order.paymentStatus = 'COLLECTED_UPI';
    order.transactionRef = ref;
    order.paymentVerifiedAt = new Date();
    order.paymentVerifiedBy = `Delivery: ${collectorName}`;
    order.deliveryPaidAt = new Date();
    order.paymentConfirmedBy = {
      role: 'Delivery Person',
      userId: req.user?._id,
      name: collectorName,
      phone: collectorPhone,
      confirmedAt: new Date(),
      paymentMethod: 'UPI Scan at Doorstep',
      transactionRef: ref
    };

    if (!order.activityLog) order.activityLog = [];
    order.activityLog.push({
      activity: 'UPI QR Payment Collected at Doorstep',
      actorRole: 'Delivery Person',
      actorId: req.user?._id,
      actorName: collectorName,
      previousStatus: prevPay,
      newStatus: 'COLLECTED_UPI',
      transactionRef: ref,
      notes: `₹${order.totalAmount} collected via UPI scan (Ref: ${ref}) by delivery agent ${collectorName}`,
      timestamp: new Date()
    });

    await order.save();
    res.json({
      success: true,
      message: `UPI payment collection of ₹${order.totalAmount} recorded successfully!`,
      data: order
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ==========================================
// DELIVERY PERSON WORKFLOW (Requirement 8)
// ==========================================

// POST /api/orders/:id/delivery-accept
// When delivery person accepts an order:
// - Save acceptance date & time
// - Change order status to 'Shipped'
router.post('/:id/delivery-accept', protect, deliveryOrAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify delivery person owns this order (or is admin)
    if (req.user.role === 'delivery' && order.assignedDeliveryPerson && order.assignedDeliveryPerson.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this delivery order.' });
    }

    if (order.deliveryAcceptedAt) {
      return res.status(400).json({ success: false, message: 'This order has already been accepted.' });
    }

    const prevStatus = order.orderStatus;
    order.deliveryAcceptedAt = new Date();
    order.orderStatus = 'Shipped';
    order.millingStatus = 'Out for Delivery';
    order.currentStep = 4;
    order.statusHistory.push({
      status: 'Shipped',
      changedBy: req.user.name,
      timestamp: new Date()
    });

    if (!order.activityLog) order.activityLog = [];
    order.activityLog.push({
      activity: 'Delivery Assignment Accepted',
      actorRole: 'Delivery Person',
      actorId: req.user._id,
      actorName: req.user.name,
      actorPhone: req.user.phone,
      previousStatus: prevStatus,
      newStatus: 'Shipped',
      notes: 'Delivery partner accepted assignment and departed for delivery',
      timestamp: new Date()
    });

    await order.save();

    res.json({
      success: true,
      message: `Order ${order.orderNumber} accepted for delivery and marked as Shipped!`,
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/delivery-payment
// When delivery person verifies/receives payment:
// - Mark paymentStatus = 'Paid'
// - Record confirmation time and responsible delivery person
router.post('/:id/delivery-payment', protect, deliveryOrAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role === 'delivery' && order.assignedDeliveryPerson && order.assignedDeliveryPerson.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this delivery order.' });
    }

    const { paymentMethod, transactionRef } = req.body;
    const prevPayStatus = order.paymentStatus;

    order.paymentStatus = 'Paid';
    order.paymentVerifiedAt = new Date();
    order.paymentVerifiedBy = `Delivery: ${req.user.name}`;
    order.deliveryPaidAt = new Date();
    if (paymentMethod) order.paymentMethod = paymentMethod;
    if (transactionRef) order.transactionRef = transactionRef;

    order.paymentConfirmedBy = {
      role: 'Delivery Person',
      userId: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      confirmedAt: new Date(),
      paymentMethod: paymentMethod || order.paymentMethod,
      transactionRef: transactionRef || order.transactionRef
    };

    if (!order.activityLog) order.activityLog = [];
    order.activityLog.push({
      activity: 'Payment Confirmed by Delivery Person',
      actorRole: 'Delivery Person',
      actorId: req.user._id,
      actorName: req.user.name,
      actorPhone: req.user.phone,
      previousStatus: prevPayStatus,
      newStatus: 'Paid',
      paymentMethod: paymentMethod || order.paymentMethod,
      transactionRef: transactionRef || order.transactionRef,
      notes: `Payment collected and verified by delivery partner ${req.user.name}`,
      timestamp: new Date()
    });

    await order.save();

    res.json({
      success: true,
      message: `Payment of ₹${order.totalAmount} for ${order.orderNumber} confirmed as Paid!`,
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /api/orders/:id/delivery-complete
// When delivery is completed:
// - Mark orderStatus = 'Delivered'
router.post('/:id/delivery-complete', protect, deliveryOrAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (req.user.role === 'delivery' && order.assignedDeliveryPerson && order.assignedDeliveryPerson.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this delivery order.' });
    }

    const prevStatus = order.orderStatus;
    order.orderStatus = 'Delivered';
    order.millingStatus = 'Delivered';
    order.currentStep = 5;
    order.deliveryDeliveredAt = new Date();
    order.completedAt = new Date();
    order.isArchived = false;
    order.deliveredBy = {
      role: 'Delivery Person',
      userId: req.user._id,
      name: req.user.name,
      phone: req.user.phone,
      deliveredAt: new Date()
    };

    order.statusHistory.push({
      status: 'Delivered',
      changedBy: req.user.name,
      timestamp: new Date()
    });

    if (!order.activityLog) order.activityLog = [];
    order.activityLog.push({
      activity: 'Order Marked Delivered',
      actorRole: 'Delivery Person',
      actorId: req.user._id,
      actorName: req.user.name,
      actorPhone: req.user.phone,
      previousStatus: prevStatus,
      newStatus: 'Delivered',
      notes: 'Order delivered to customer doorstep by delivery partner',
      timestamp: new Date()
    });

    await order.save();

    res.json({
      success: true,
      message: `Order ${order.orderNumber} successfully marked as Delivered!`,
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PATCH /api/orders/:id/assign-delivery (Admin manual reassignment)
router.patch('/:id/assign-delivery', protect, adminOnly, async (req, res) => {
  try {
    const { deliveryPersonId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const dp = await User.findOne({ _id: deliveryPersonId, role: 'delivery' });
    if (!dp) {
      return res.status(404).json({ success: false, message: 'Delivery personnel not found' });
    }

    order.assignedDeliveryPerson = dp._id;
    order.assignedDeliveryPersonName = dp.name;
    order.assignedDeliveryPersonPhone = dp.phone;
    order.assignedDP = dp.name;
    order.deliveryAssignedAt = new Date();
    order.deliveryAssignedBy = req.user ? req.user.name : 'Admin';

    if (!order.activityLog) order.activityLog = [];
    order.activityLog.push({
      activity: 'Delivery Partner Assigned',
      actorRole: 'Admin',
      actorId: req.user?._id,
      actorName: req.user?.name || 'Chakki Admin (Meena)',
      actorPhone: req.user?.phone || '+91 98112 00001',
      notes: `Order manually assigned to delivery personnel ${dp.name} (${dp.phone})`,
      timestamp: new Date()
    });

    await order.save();

    res.json({
      success: true,
      message: `Order ${order.orderNumber} assigned to ${dp.name}`,
      data: order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/orders/:id (Admin delete order & restore reserved stock if any)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderNumber = order.orderNumber || req.params.id;

    // If order has unreleased reserved stock, release back to available inventory
    if (order.stockReserved && Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.productId) {
          const prod = await Product.findById(item.productId);
          if (prod) {
            const kg = (Number(item.batchSizeKg) || 5) * (Number(item.quantity) || 1);
            const prevOnHand = typeof prod.stockOnHand === 'number' ? prod.stockOnHand : 100;
            const prevRes = typeof prod.stockReserved === 'number' ? prod.stockReserved : 0;
            prod.stockReserved = Math.max(0, prevRes - kg);
            await prod.save();

            await InventoryLog.create({
              productId: prod._id,
              productName: prod.name,
              productCode: prod.productId,
              movementType: 'RESERVATION_RELEASE',
              quantityKg: kg,
              packSizeKg: Number(item.batchSizeKg) || 5,
              packUnits: Number(item.quantity) || 1,
              previousOnHandKg: prevOnHand,
              newOnHandKg: prod.stockOnHand || 0,
              previousReservedKg: prevRes,
              newReservedKg: prod.stockReserved,
              orderId: order._id,
              orderNumber: orderNumber,
              actorRole: 'Admin',
              actorId: req.user?._id,
              actorName: req.user?.name || 'Administrator',
              reason: `Stock reservation released on order deletion: ${orderNumber}`
            });
          }
        }
      }
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Order ${orderNumber} deleted successfully`,
      data: { orderId: req.params.id, orderNumber }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

