const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const { generateToken, protect, adminOnly } = require('../middleware/authMiddleware');

const { normalizePhone, isValidIndianPhone, isValidIndianPincode } = require('../utils/phoneHelper');

// Helper to migrate and verify user collection indexes
const migrateUserIndexes = async () => {
  try {
    const indexes = await User.collection.indexes();
    // Drop legacy non-sparse email index if it exists
    const emailIndex = indexes.find(idx => idx.name === 'email_1' || (idx.key && idx.key.email === 1));
    if (emailIndex && !emailIndex.sparse) {
      console.log('[Auth] Dropping legacy non-sparse email_1 index...');
      await User.collection.dropIndex(emailIndex.name);
      console.log('[Auth] Dropped legacy non-sparse email index successfully.');
    }
    // Ensure sparse unique index on email
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    // Ensure sparse unique index on phone
    await User.collection.createIndex({ phone: 1 }, { unique: true, sparse: true });
    console.log('[Auth] User indexes synced with sparse unique constraints.');
  } catch (err) {
    console.warn('[Auth] Index migration notice:', err.message);
  }
};

// Helper to seed/ensure default Admin and Delivery personnel exist securely
const ensureDefaultUsers = async () => {
  try {
    await migrateUserIndexes();

    const adminEmail = 'admin.meena@arogyabhog.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        password: 'Admin.meenA@2026!',
        name: 'Chakki Admin (Meena)',
        phone: '9811200001',
        role: 'admin',
        address: 'Chakki Unit #4, Sector 54',
        sector: 'Sector 54, Gurugram',
        pincode: '122011'
      });
      console.log('[Auth] Default Admin initialized securely');
    } else if (existingAdmin.phone && existingAdmin.phone.includes('+')) {
      existingAdmin.phone = normalizePhone(existingAdmin.phone);
      await existingAdmin.save();
    }

    // Default Delivery Person
    const deliveryEmail = 'delivery.ramesh@arogyabhog.com';
    const existingDelivery = await User.findOne({ email: deliveryEmail });
    if (!existingDelivery) {
      await User.create({
        email: deliveryEmail,
        password: 'Delivery@2026!',
        name: 'Ramesh Kumar (DP-1)',
        phone: '9811244332',
        role: 'delivery',
        isActive: true,
        isAvailable: true,
        address: 'Fleet Hub, Sector 54',
        pincode: '122011'
      });
      console.log('[Auth] Default Delivery Person initialized securely');
    } else if (existingDelivery.phone && existingDelivery.phone.includes('+')) {
      existingDelivery.phone = normalizePhone(existingDelivery.phone);
      await existingDelivery.save();
    }
  } catch (err) {
    console.error('[Auth] Error ensuring default users:', err.message);
  }
};

ensureDefaultUsers();

// POST /api/auth/login
// Supports customer mobile-only login & admin/delivery email-based login
router.post('/login', async (req, res) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const rawIdentifier = (identifier || phone || email || '').toString().trim();

    if (!rawIdentifier || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide your 10-digit mobile number and password' 
      });
    }

    let user = null;

    if (rawIdentifier.includes('@')) {
      // Email authentication (for Admin, Delivery Fleet, or legacy accounts)
      const normalizedEmail = rawIdentifier.toLowerCase();
      user = await User.findOne({ email: normalizedEmail });

      if (!user) {
        if (normalizedEmail === 'admin.meena@arogyabhog.com' && password === 'Admin.meenA@2026!') {
          user = await User.create({
            email: 'admin.meena@arogyabhog.com',
            password: 'Admin.meenA@2026!',
            name: 'Chakki Admin (Meena)',
            phone: '9811200001',
            role: 'admin'
          });
        } else {
          return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
      }
    } else {
      // Mobile Number authentication (Primary Customer Flow)
      const normalizedPhone = normalizePhone(rawIdentifier);
      if (!isValidIndianPhone(normalizedPhone)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please enter a valid 10-digit Indian mobile number' 
        });
      }

      user = await User.findOne({
        $or: [
          { phone: normalizedPhone },
          { phone: `+91 ${normalizedPhone.slice(0, 5)} ${normalizedPhone.slice(5)}` },
          { phone: `+91${normalizedPhone}` }
        ]
      });

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'No account registered with this mobile number. Please register first.' 
        });
      }

      // If phone wasn't normalized in db, normalize it now
      if (user.phone !== normalizedPhone) {
        user.phone = normalizedPhone;
        await user.save();
      }
    }

    // Verify password securely using comparePassword
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid mobile number or password' 
      });
    }

    // If delivery person is inactive, prevent login
    if (user.role === 'delivery' && !user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your delivery person account has been deactivated. Please contact the administrator.' 
      });
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
        city: user.city || 'Kanpur',
        state: user.state || 'Uttar Pradesh',
        pincode: user.pincode,
        savedAddresses: user.savedAddresses || [],
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
// Customer registration with mobile number, password, full name, and PIN code only (NO email required)
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, pincode, address, sector, city, state } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: '10-digit mobile number is required' });
    }

    const cleanPhone = normalizePhone(phone);
    if (!isValidIndianPhone(cleanPhone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9811234567)' 
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const cleanPincode = (pincode ? pincode.toString().trim() : '208016');
    if (cleanPincode && !isValidIndianPincode(cleanPincode)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 6-digit Indian PIN code' 
      });
    }

    // Check for duplicate customer mobile number
    const existing = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` },
        { phone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` }
      ]
    });

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this mobile number already exists. Please sign in instead.' 
      });
    }

    const newUser = await User.create({
      name: name.trim(),
      phone: cleanPhone,
      password,
      pincode: cleanPincode,
      address: address ? address.trim() : '',
      sector: sector ? sector.trim() : '',
      city: city ? city.trim() : 'Kanpur',
      state: state ? state.trim() : 'Uttar Pradesh',
      role: 'user'
      // Note: email is NOT required or stored for customers
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Arogya Bhog account created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
        address: newUser.address,
        sector: newUser.sector,
        city: newUser.city,
        state: newUser.state,
        pincode: newUser.pincode,
        savedAddresses: []
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ==========================================
// FORGOT PASSWORD / MOBILE OTP FLOW
// ==========================================

// POST /api/auth/forgot-password/send-otp
// Generates a 6-digit OTP and logs/sends it to customer's mobile
router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Please provide your registered mobile number' });
    }

    const cleanPhone = normalizePhone(phone);
    if (!isValidIndianPhone(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number' });
    }

    const user = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` }
      ]
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No registered customer account found with this mobile number.' 
      });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = expiresAt;
    await user.save();

    console.log(`\n======================================================`);
    console.log(`[Arogya Bhog SMS Gateway Simulator]`);
    console.log(`Mobile: +91 ${cleanPhone}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Expires: 10 minutes (${expiresAt.toISOString()})`);
    console.log(`======================================================\n`);

    res.json({
      success: true,
      message: `A 6-digit password reset OTP has been sent to +91 ${cleanPhone}.`,
      // Provide devOtp for smooth developer/test verification
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/forgot-password/verify-otp
router.post('/forgot-password/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
    }

    const cleanPhone = normalizePhone(phone);
    const user = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check the 6-digit code entered.' });
    }

    if (!user.resetPasswordOtpExpires || new Date() > new Date(user.resetPasswordOtpExpires)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully. You may now set your new password.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mobile number, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const cleanPhone = normalizePhone(phone);
    const user = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please request a new OTP.' });
    }

    if (!user.resetPasswordOtpExpires || new Date() > new Date(user.resetPasswordOtpExpires)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
    }

    // Set new password (will be hashed automatically in pre-save hook)
    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your mobile number and new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const userData = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone,
    address: req.user.address,
    city: req.user.city || 'Kanpur',
    state: req.user.state || 'Uttar Pradesh',
    sector: req.user.sector,
    pincode: req.user.pincode,
    savedAddresses: req.user.savedAddresses || [],
    isActive: req.user.isActive,
    isAvailable: req.user.isAvailable
  };
  res.json({
    success: true,
    user: userData,
    data: userData
  });
});

// PUT /api/auth/profile - update customer profile details
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address, city, state, sector, pincode } = req.body;
    const user = req.user;

    if (name) user.name = name.trim();

    if (phone) {
      const cleanPhone = normalizePhone(phone);
      if (!isValidIndianPhone(cleanPhone)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide a valid 10-digit Indian mobile number' 
        });
      }

      if (cleanPhone !== user.phone) {
        const existingWithPhone = await User.findOne({
          phone: cleanPhone,
          _id: { $ne: user._id }
        });
        if (existingWithPhone) {
          return res.status(400).json({ 
            success: false, 
            message: 'This mobile number is already in use by another customer account' 
          });
        }
        user.phone = cleanPhone;
      }
    }

    if (pincode) {
      const cleanPin = pincode.toString().trim();
      if (!isValidIndianPincode(cleanPin)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please enter a valid 6-digit Indian PIN code' 
        });
      }
      user.pincode = cleanPin;
    }

    if (address !== undefined) user.address = address.trim();
    if (city !== undefined) user.city = city.trim();
    if (state !== undefined) user.state = state.trim();
    if (sector !== undefined) user.sector = sector.trim();

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
        city: user.city || 'Kanpur',
        state: user.state || 'Uttar Pradesh',
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
