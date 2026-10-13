const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { normalizePhone, isValidIndianPhone } = require('../utils/phoneHelper');

const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || '919621496772';

// Helper to hash single-use tokens using SHA-256
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Helper to mask phone for public security displays: 98112 ••••7
const maskPhone = (phone) => {
  if (!phone || phone.length < 10) return '••••••••••';
  const clean = phone.slice(-10);
  return `${clean.slice(0, 5)} •••• ${clean.slice(-2)}`;
};

// ========================================================
// 1. PUBLIC: INITIATE WHATSAPP FORGOT PASSWORD
// ========================================================
// POST /api/auth/recovery/initiate
router.post('/initiate', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered 10-digit mobile number'
      });
    }

    const cleanPhone = normalizePhone(phone);
    if (!isValidIndianPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number (e.g. 9811234567)'
      });
    }

    // Lookup customer if registered
    const existingUser = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` }
      ]
    });

    const requestId = `PRR-${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`;

    const newRequest = await PasswordResetRequest.create({
      requestId,
      customerId: existingUser ? existingUser._id : null,
      customerName: existingUser ? existingUser.name : 'Customer',
      customerPhone: cleanPhone,
      requestedVia: 'WhatsApp Click-to-Chat',
      status: 'Pending Verification',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || ''
    });

    // Generate prefilled recovery message strictly per specification:
    // Hi Arogya Bhog Admin,\n\nI have forgotten my Arogya Bhog account password and need help resetting it.\n\nRegistered mobile number: [Customer Mobile Number]\n\nPlease help me reset my password.\n\nThank you.
    const prefilledText = `Hi Arogya Bhog Admin,\n\nI have forgotten my Arogya Bhog account password and need help resetting it.\n\nRegistered mobile number: ${cleanPhone}\n\nPlease help me reset my password.\n\nThank you.`;

    const encodedMessage = encodeURIComponent(prefilledText);
    const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedMessage}`;

    res.json({
      success: true,
      requestId: newRequest.requestId,
      adminPhone: ADMIN_WHATSAPP_NUMBER,
      customerPhone: cleanPhone,
      prefilledMessage: prefilledText,
      whatsappUrl,
      message: 'Recovery request initiated. Please open WhatsApp and send the message to the Arogya Bhog admin.'
    });
  } catch (error) {
    console.error('Initiate recovery error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================================================
// 2. ADMIN ONLY: LIST PASSWORD RESET REQUESTS
// ========================================================
// GET /api/auth/recovery/requests
router.get('/requests', protect, adminOnly, async (req, res) => {
  try {
    const { search, status, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const cleanQ = normalizePhone(q);
      filter.$or = [
        { requestId: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { customerPhone: { $regex: cleanQ || q, $options: 'i' } }
      ];
    }

    const requests = await PasswordResetRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Update expired statuses on the fly
    const now = new Date();
    for (const reqDoc of requests) {
      if (
        reqDoc.status === 'Reset Link Generated' &&
        reqDoc.resetTokenExpiresAt &&
        now > reqDoc.resetTokenExpiresAt &&
        !reqDoc.isTokenUsed
      ) {
        reqDoc.status = 'Expired';
        await reqDoc.save();
      }
    }

    const totalCount = await PasswordResetRequest.countDocuments(filter);
    const pendingCount = await PasswordResetRequest.countDocuments({ status: 'Pending Verification' });

    res.json({
      success: true,
      count: requests.length,
      totalCount,
      pendingCount,
      data: requests
    });
  } catch (error) {
    console.error('Get recovery requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================================================
// 3. ADMIN ONLY: MANUALLY LOG RECOVERY REQUEST
// ========================================================
// POST /api/auth/recovery/requests
router.post('/requests', protect, adminOnly, async (req, res) => {
  try {
    const { phone, customerName, notes } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Customer registered mobile number is required' });
    }

    const cleanPhone = normalizePhone(phone);
    if (!isValidIndianPhone(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number' });
    }

    const existingUser = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` }
      ]
    });

    const requestId = `PRR-${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`;

    const newRequest = await PasswordResetRequest.create({
      requestId,
      customerId: existingUser ? existingUser._id : null,
      customerName: (customerName && customerName.trim()) || (existingUser ? existingUser.name : 'Customer'),
      customerPhone: cleanPhone,
      requestedVia: 'WhatsApp Direct Message',
      status: 'Pending Verification',
      adminNotes: notes || 'Logged manually by admin from incoming WhatsApp inquiry'
    });

    res.status(201).json({
      success: true,
      message: `Password reset request ${newRequest.requestId} logged successfully`,
      data: newRequest
    });
  } catch (error) {
    console.error('Create recovery request error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ========================================================
// 4. ADMIN ONLY: VERIFY CUSTOMER IDENTITY
// ========================================================
// PUT /api/auth/recovery/requests/:id/verify
router.put('/requests/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const { verificationMethod = 'Identity Verified via WhatsApp', notes = '' } = req.body;
    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Recovery request not found' });
    }

    request.status = 'Verified';
    request.verificationStatus = verificationMethod;
    request.verificationNotes = notes.trim();
    request.verifiedBy = req.user.name || 'Admin';
    request.verifiedAt = new Date();

    await request.save();

    res.json({
      success: true,
      message: `Customer identity for ${request.customerPhone} verified successfully!`,
      data: request
    });
  } catch (error) {
    console.error('Verify recovery request error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ========================================================
// 5. ADMIN ONLY: GENERATE SINGLE-USE RESET LINK / CREDENTIAL
// ========================================================
// POST /api/auth/recovery/requests/:id/generate-token
router.post('/requests/:id/generate-token', protect, adminOnly, async (req, res) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Recovery request not found' });
    }

    // Auto-verify if admin is generating token directly
    if (request.status === 'Pending Verification') {
      request.status = 'Verified';
      request.verificationStatus = 'Identity Verified via WhatsApp';
      request.verifiedBy = req.user.name || 'Admin';
      request.verifiedAt = new Date();
    }

    // Generate cryptographically secure random token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    // Single-use token expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    request.resetTokenHash = tokenHash;
    request.resetTokenExpiresAt = expiresAt;
    request.isTokenUsed = false;
    request.status = 'Reset Link Generated';
    request.adminNotes = `Reset credential generated by ${req.user.name || 'Admin'} at ${new Date().toLocaleString()}`;

    await request.save();

    // Construct customer recovery link
    const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
    const baseUrl = origin.replace(/\/+$/, '');
    const recoveryLink = `${baseUrl}/#reset-password?token=${rawToken}&req=${request.requestId}`;

    // Pre-formatted WhatsApp reply for the admin to copy and send to the customer
    const whatsappReplyMessage = `Namaste ${request.customerName},\n\nYour Arogya Bhog account identity has been verified.\n\nPlease click this secure, single-use link to create your new password (valid for 30 minutes):\n${recoveryLink}\n\nIf you did not request this, please reply to inform us.\n\nWarm regards,\nArogya Bhog Team`;

    console.log(`\n======================================================`);
    console.log(`[Arogya Bhog Admin Recovery Token Generated]`);
    console.log(`Request ID: ${request.requestId}`);
    console.log(`Customer: ${request.customerName} (+91 ${request.customerPhone})`);
    console.log(`Recovery Link: ${recoveryLink}`);
    console.log(`Expires At: ${expiresAt.toISOString()}`);
    console.log(`======================================================\n`);

    res.json({
      success: true,
      message: 'Single-use password reset link generated successfully!',
      requestId: request.requestId,
      token: rawToken,
      recoveryLink,
      whatsappReplyMessage,
      expiresAt,
      data: request
    });
  } catch (error) {
    console.error('Generate reset token error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ========================================================
// 6. ADMIN ONLY: REJECT RECOVERY REQUEST
// ========================================================
// PUT /api/auth/recovery/requests/:id/reject
router.put('/requests/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const { reason = 'Identity could not be verified' } = req.body;
    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Recovery request not found' });
    }

    request.status = 'Rejected';
    request.verificationStatus = 'Rejected';
    request.adminNotes = reason.trim();
    request.verifiedBy = req.user.name || 'Admin';
    request.verifiedAt = new Date();

    await request.save();

    res.json({
      success: true,
      message: `Request ${request.requestId} has been rejected.`,
      data: request
    });
  } catch (error) {
    console.error('Reject recovery request error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ========================================================
// 7. PUBLIC: VALIDATE RESET TOKEN
// ========================================================
// GET /api/auth/recovery/validate-token
router.get('/validate-token', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required' });
    }

    const tokenHash = hashToken(token.trim());
    const request = await PasswordResetRequest.findOne({
      resetTokenHash: tokenHash,
      isTokenUsed: false,
      status: 'Reset Link Generated',
      resetTokenExpiresAt: { $gt: new Date() }
    });

    if (!request) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid, expired, or has already been used. Please request a new recovery link through WhatsApp.'
      });
    }

    res.json({
      success: true,
      requestId: request.requestId,
      customerName: request.customerName,
      customerPhoneMasked: maskPhone(request.customerPhone),
      expiresAt: request.resetTokenExpiresAt
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================================================
// 8. PUBLIC: ESTABLISH NEW PASSWORD WITH RECOVERY TOKEN
// ========================================================
// POST /api/auth/recovery/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    const tokenHash = hashToken(token.trim());
    const request = await PasswordResetRequest.findOne({
      resetTokenHash: tokenHash,
      isTokenUsed: false,
      resetTokenExpiresAt: { $gt: new Date() }
    });

    if (!request) {
      return res.status(400).json({
        success: false,
        message: 'This recovery link is invalid, expired, or has already been used. Please contact Arogya Bhog support on WhatsApp to request a new link.'
      });
    }

    // Lookup customer account
    const user = await User.findOne({
      $or: [
        { phone: request.customerPhone },
        { phone: `+91${request.customerPhone}` }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Customer account not found'
      });
    }

    // Set new password (bcrypt hashing performed by User pre('save') hook)
    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    // Mark single-use token as permanently used and request as Completed
    request.isTokenUsed = true;
    request.usedAt = new Date();
    request.status = 'Completed';
    await request.save();

    res.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in using your registered mobile number and new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
