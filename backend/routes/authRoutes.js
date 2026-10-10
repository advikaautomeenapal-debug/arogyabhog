const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { generateToken, protect, adminOnly } = require('../middleware/authMiddleware');

// Helper to seed/ensure default Admin and Delivery personnel exist securely
const ensureDefaultUsers = async () => {
  try {
    const adminEmail = 'admin.meena@arogyabhog.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        password: 'Admin.meenA@2026!',
        name: 'Chakki Admin (Meena)',
        phone: '+91 98112 00001',
        role: 'admin',
        address: 'Chakki Unit #4, Sector 54',
        sector: 'Sector 54, Gurugram',
        pincode: '122011'
      });
      console.log('[Auth] Default Admin initialized securely');
    }

    // Default Delivery Person
    const deliveryEmail = 'delivery.ramesh@arogyabhog.com';
    const existingDelivery = await User.findOne({ email: deliveryEmail });
    if (!existingDelivery) {
      await User.create({
        email: deliveryEmail,
        password: 'Delivery@2026!',
        name: 'Ramesh Kumar (DP-1)',
        phone: '+91 98112 44332',
        role: 'delivery',
        isActive: true,
        isAvailable: true,
        address: 'Fleet Hub, Sector 54',
        pincode: '122011'
      });
      console.log('[Auth] Default Delivery Person initialized securely');
    }
  } catch (err) {
    console.error('[Auth] Error ensuring default users:', err.message);
  }
};

ensureDefaultUsers();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      if (normalizedEmail === 'admin.meena@arogyabhog.com' && password === 'Admin.meenA@2026!') {
        user = await User.create({
          email: 'admin.meena@arogyabhog.com',
          password: 'Admin.meenA@2026!',
          name: 'Chakki Admin (Meena)',
          phone: '+91 98112 00001',
          role: 'admin'
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
    }

    // Verify password securely using comparePassword
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // If delivery person is inactive, prevent login
    if (user.role === 'delivery' && !user.isActive) {
      return res.status(403).json({ success: false, message: 'Your delivery person account has been deactivated. Please contact the administrator.' });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      message: `${user.role.toUpperCase()} authenticated successfully`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        sector: user.sector,
        pincode: user.pincode,
        isActive: user.isActive,
        isAvailable: user.isAvailable
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, address, sector, pincode } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const role = normalizedEmail === 'admin.meena@arogyabhog.com' ? 'admin' : 'user';

    const newUser = await User.create({
      email: normalizedEmail,
      password,
      name,
      phone: phone || '',
      role,
      address: address || '',
      sector: sector || '',
      pincode: pincode || '122002'
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        address: newUser.address,
        sector: newUser.sector,
        pincode: newUser.pincode
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      address: req.user.address,
      city: req.user.city || 'Gurugram',
      state: req.user.state || 'Haryana',
      sector: req.user.sector,
      pincode: req.user.pincode,
      savedAddresses: req.user.savedAddresses || [],
      isActive: req.user.isActive,
      isAvailable: req.user.isAvailable
    }
  });
});

// PUT /api/auth/profile - update customer profile details
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address, city, state, sector, pincode } = req.body;
    const user = req.user;

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (address) user.address = address.trim();
    if (city) user.city = city.trim();
    if (state) user.state = state.trim();
    if (sector) user.sector = sector.trim();
    if (pincode) user.pincode = pincode.trim();

    await user.save();

    res.json({
      success: true,
      message: 'Profile details updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        city: user.city || 'Gurugram',
        state: user.state || 'Haryana',
        sector: user.sector,
        pincode: user.pincode,
        savedAddresses: user.savedAddresses || []
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==========================================
// SAVED ADDRESS BOOK MANAGEMENT (Requirement 6)
// ==========================================

// GET /api/auth/addresses - get customer's saved addresses
router.get('/addresses', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user.savedAddresses || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/addresses - add new saved address
router.post('/addresses', protect, async (req, res) => {
  try {
    const { label, name, phone, address, city, state, sector, pincode, isDefault } = req.body;
    if (!name || !phone || !address || !pincode) {
      return res.status(400).json({ success: false, message: 'Name, phone, address, and PIN code are required' });
    }

    if (!req.user.savedAddresses) req.user.savedAddresses = [];

    if (isDefault) {
      req.user.savedAddresses.forEach(a => { a.isDefault = false; });
    }

    req.user.savedAddresses.push({
      label: label || 'Home',
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city ? city.trim() : 'Gurugram',
      state: state ? state.trim() : 'Haryana',
      sector: sector ? sector.trim() : '',
      pincode: pincode.trim(),
      isDefault: Boolean(isDefault) || req.user.savedAddresses.length === 0
    });

    await req.user.save();
    res.status(201).json({
      success: true,
      message: 'Address saved to address book!',
      data: req.user.savedAddresses
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/auth/addresses/:addressId - edit existing saved address
router.put('/addresses/:addressId', protect, async (req, res) => {
  try {
    const { label, name, phone, address, city, state, sector, pincode, isDefault } = req.body;
    const target = req.user.savedAddresses.id(req.params.addressId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Saved address not found' });
    }

    if (isDefault) {
      req.user.savedAddresses.forEach(a => { a.isDefault = false; });
    }

    if (label) target.label = label;
    if (name) target.name = name.trim();
    if (phone) target.phone = phone.trim();
    if (address) target.address = address.trim();
    if (city) target.city = city.trim();
    if (state) target.state = state.trim();
    if (sector !== undefined) target.sector = sector.trim();
    if (pincode) target.pincode = pincode.trim();
    if (isDefault !== undefined) target.isDefault = Boolean(isDefault);

    await req.user.save();
    res.json({
      success: true,
      message: 'Address updated successfully!',
      data: req.user.savedAddresses
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/auth/addresses/:addressId - delete saved address
router.delete('/addresses/:addressId', protect, async (req, res) => {
  try {
    req.user.savedAddresses.pull({ _id: req.params.addressId });
    await req.user.save();
    res.json({
      success: true,
      message: 'Address removed from address book',
      data: req.user.savedAddresses
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/auth/addresses/:addressId/default - set preferred/default address
router.put('/addresses/:addressId/default', protect, async (req, res) => {
  try {
    const target = req.user.savedAddresses.id(req.params.addressId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Saved address not found' });
    }
    req.user.savedAddresses.forEach(a => {
      a.isDefault = (a._id.toString() === req.params.addressId);
    });
    await req.user.save();
    res.json({
      success: true,
      message: 'Default address updated!',
      data: req.user.savedAddresses
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==========================================
// DELIVERY PERSON MANAGEMENT (Admin Only)
// ==========================================

// GET /api/auth/delivery-persons
router.get('/delivery-persons', protect, adminOnly, async (req, res) => {
  try {
    const deliveryPersons = await User.find({ role: 'delivery' }).sort({ createdAt: -1 });

    // Calculate ongoing and completed delivery counts for each delivery person
    const dpListWithOrders = await Promise.all(
      deliveryPersons.map(async (dp) => {
        const ongoingCount = await Order.countDocuments({
          assignedDeliveryPerson: dp._id,
          orderStatus: { $in: ['Accepted', 'Confirmed', 'Processing', 'Shipped'] }
        });
        const completedCount = await Order.countDocuments({
          assignedDeliveryPerson: dp._id,
          orderStatus: 'Delivered'
        });
        return {
          id: dp._id,
          _id: dp._id,
          name: dp.name,
          email: dp.email,
          phone: dp.phone,
          address: dp.address || '',
          isActive: dp.isActive,
          isAvailable: dp.isAvailable,
          activeOrdersCount: ongoingCount,
          ongoingDeliveriesCount: ongoingCount,
          completedDeliveriesCount: completedCount,
          createdAt: dp.createdAt
        };
      })
    );

    res.json({ success: true, count: dpListWithOrders.length, data: dpListWithOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/delivery-persons
router.post('/delivery-persons', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, address, password, isAvailable } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'Full name, email address, contact phone, and login password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email/username already exists' });
    }

    const newDP = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      address: (address || '').trim(),
      password,
      role: 'delivery',
      isActive: true,
      isAvailable: isAvailable !== false
    });

    res.status(201).json({
      success: true,
      message: `Delivery personnel account created for ${newDP.name}!`,
      data: {
        id: newDP._id,
        _id: newDP._id,
        name: newDP.name,
        email: newDP.email,
        phone: newDP.phone,
        address: newDP.address,
        isActive: newDP.isActive,
        isAvailable: newDP.isAvailable,
        ongoingDeliveriesCount: 0,
        completedDeliveriesCount: 0
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/auth/delivery-persons/:id
router.put('/delivery-persons/:id', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, phone, address, isActive, isAvailable, password } = req.body;
    const dp = await User.findOne({ _id: req.params.id, role: 'delivery' });
    if (!dp) {
      return res.status(404).json({ success: false, message: 'Delivery personnel not found' });
    }

    if (name) dp.name = name.trim();
    if (phone) dp.phone = phone.trim();
    if (address !== undefined) dp.address = address.trim();
    if (email && email.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== dp.email) {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          return res.status(400).json({ success: false, message: 'An account with this email already exists' });
        }
        dp.email = normalizedEmail;
      }
    }
    if (typeof isActive === 'boolean') dp.isActive = isActive;
    if (typeof isAvailable === 'boolean') dp.isAvailable = isAvailable;
    if (password && password.trim()) dp.password = password.trim();

    await dp.save();

    res.json({
      success: true,
      message: `Delivery person "${dp.name}" updated successfully!`,
      data: {
        id: dp._id,
        _id: dp._id,
        name: dp.name,
        email: dp.email,
        phone: dp.phone,
        address: dp.address,
        isActive: dp.isActive,
        isAvailable: dp.isAvailable
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
