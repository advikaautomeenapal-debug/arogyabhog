const express = require('express');
const router = express.Router();
const InAppNotification = require('../models/InAppNotification');
const { cleanPhone } = require('../utils/inAppNotifier');

// Helper to build role/phone query
function buildQuery({ phone, role, unreadOnly, since }) {
  const query = {};

  if (unreadOnly === 'true' || unreadOnly === true) {
    query.read = false;
  }

  if (since) {
    const sinceDate = new Date(since);
    if (!isNaN(sinceDate.getTime())) {
      query.createdAt = { $gt: sinceDate };
    }
  }

  const normalizedRole = (role || 'customer').toLowerCase();

  if (normalizedRole === 'admin') {
    query.$or = [{ recipientRole: 'admin' }, { recipientRole: 'all' }];
  } else if (normalizedRole === 'delivery') {
    const cleaned = cleanPhone(phone);
    if (cleaned) {
      query.$or = [
        { recipientRole: 'delivery', recipientPhone: cleaned },
        { recipientRole: 'delivery', recipientPhone: '' }
      ];
    } else {
      query.recipientRole = 'delivery';
    }
  } else {
    // Customer
    const cleaned = cleanPhone(phone);
    if (cleaned) {
      query.$or = [
        { recipientRole: 'customer', recipientPhone: cleaned },
        { recipientPhone: cleaned }
      ];
    } else {
      query.recipientRole = 'customer';
    }
  }

  return query;
}

// GET /api/notifications - Fetch user/role notifications
router.get('/', async (req, res) => {
  try {
    const { phone, role = 'customer', unreadOnly, limit = 40 } = req.query;
    const query = buildQuery({ phone, role, unreadOnly });

    const [notifications, unreadCount] = await Promise.all([
      InAppNotification.find(query)
        .sort({ createdAt: -1 })
        .limit(Math.min(100, parseInt(limit, 10) || 40))
        .lean(),
      InAppNotification.countDocuments({ ...query, read: false })
    ]);

    res.json({
      success: true,
      unreadCount,
      total: notifications.length,
      data: notifications
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notifications/poll - Lightweight poll for running app
router.get('/poll', async (req, res) => {
  try {
    const { phone, role = 'customer', since } = req.query;
    const query = buildQuery({ phone, role, since });

    const [unreadCount, newItems] = await Promise.all([
      InAppNotification.countDocuments({ ...buildQuery({ phone, role, unreadOnly: true }) }),
      InAppNotification.find(query).sort({ createdAt: -1 }).limit(10).lean()
    ]);

    res.json({
      success: true,
      unreadCount,
      hasNew: newItems.length > 0,
      latest: newItems[0] || null,
      items: newItems,
      polledAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notif = await InAppNotification.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true } },
      { new: true }
    );
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/mark-all-read - Mark all as read for user/role
router.patch('/mark-all-read', async (req, res) => {
  try {
    const { phone, role = 'customer' } = req.body;
    const query = buildQuery({ phone, role, unreadOnly: true });

    const result = await InAppNotification.updateMany(query, { $set: { read: true } });
    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
