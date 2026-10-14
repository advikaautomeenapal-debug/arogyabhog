const InAppNotification = require('../models/InAppNotification');

const cleanPhone = (phone) => {
  if (!phone) return '';
  return phone.toString().replace(/\D/g, '').slice(-10);
};

/**
 * Creates an in-app notification in MongoDB
 */
async function createNotification({
  recipientPhone = '',
  recipientId = null,
  recipientRole = 'customer',
  orderId = null,
  orderNumber = '',
  type = 'STATUS_CHANGE',
  title,
  message,
  metadata = {}
}) {
  try {
    const doc = await InAppNotification.create({
      recipientPhone: cleanPhone(recipientPhone),
      recipientId,
      recipientRole,
      orderId,
      orderNumber,
      type,
      title,
      message,
      read: false,
      metadata
    });
    return doc;
  } catch (err) {
    console.error('[InAppNotifier] Failed to create notification:', err.message);
    return null;
  }
}

/**
 * Dispatches notifications when an order status changes
 */
async function notifyOrderStatusChange(order, previousStatus, newStatus, actor = 'System') {
  if (!order) return;
  const num = order.orderNumber || 'Order';
  const phone = order.customerPhone || order.customerContact;

  let customerTitle = `Order ${num} Status Update`;
  let customerMsg = `Your order status changed from ${previousStatus || 'Pending'} to ${newStatus}.`;
  let notifType = 'STATUS_CHANGE';

  const normalized = (newStatus || '').toLowerCase();

  if (normalized.includes('confirm')) {
    customerTitle = `🌾 Order Confirmed (#${num})`;
    customerMsg = `Your order #${num} is confirmed! Fresh stone-chakki milling is being scheduled.`;
  } else if (normalized.includes('process') || normalized.includes('prepar') || normalized.includes('mill')) {
    customerTitle = `⚙️ Milling in Progress (#${num})`;
    customerMsg = `Slow stone-grinding underway below 35°C to preserve active bran & germ nutrients.`;
  } else if (normalized.includes('ship') || normalized.includes('dispatch') || normalized.includes('out for delivery')) {
    customerTitle = `🚚 Out for Delivery (#${num})`;
    customerMsg = `Freshly milled batch is out for delivery! ${order.assignedDeliveryPersonName ? `Delivery Partner: ${order.assignedDeliveryPersonName} (${order.assignedDeliveryPersonPhone || ''})` : 'Arriving soon at your doorstep.'}`;
    notifType = 'DISPATCHED';
  } else if (normalized.includes('deliver') || normalized.includes('complet')) {
    customerTitle = `🎉 Delivered (#${num})`;
    customerMsg = `Your 100% fresh, preservative-free flour has been delivered. Enjoy wholesome and healthy rotis!`;
    notifType = 'DELIVERED';
  } else if (normalized.includes('cancel')) {
    customerTitle = `❌ Order Cancelled (#${num})`;
    customerMsg = `Order #${num} has been cancelled. Any reserved stock has been released.`;
    notifType = 'CANCELLED';
  } else if (normalized.includes('refund')) {
    customerTitle = `💳 Refund Initiated (#${num})`;
    customerMsg = `Refund of ₹${order.refundAmount || order.totalAmount} for order #${num} has been processed.`;
    notifType = 'REFUNDED';
  }

  // 1. Notify Customer
  await createNotification({
    recipientPhone: phone,
    recipientId: order.customerId,
    recipientRole: 'customer',
    orderId: order._id,
    orderNumber: num,
    type: notifType,
    title: customerTitle,
    message: customerMsg,
    metadata: { previousStatus, newStatus, actor }
  });

  // 2. Notify Delivery Partner if assigned
  if (order.assignedDeliveryPerson) {
    await createNotification({
      recipientPhone: order.assignedDeliveryPersonPhone,
      recipientId: order.assignedDeliveryPerson,
      recipientRole: 'delivery',
      orderId: order._id,
      orderNumber: num,
      type: notifType,
      title: `Order #${num} Updated (${newStatus})`,
      message: `Status updated to ${newStatus} by ${actor}. Customer: ${order.customerName} (${order.customerPhone || ''}).`,
      metadata: { previousStatus, newStatus }
    });
  }

  // 3. Notify Admin Console
  await createNotification({
    recipientRole: 'admin',
    orderId: order._id,
    orderNumber: num,
    type: notifType,
    title: `Order #${num} → ${newStatus}`,
    message: `Order #${num} status changed to ${newStatus} by ${actor}. Customer: ${order.customerName}.`,
    metadata: { previousStatus, newStatus, actor }
  });
}

/**
 * Dispatches notification when a delivery partner accepts an order
 */
async function notifyDeliveryAccepted(order, dp) {
  if (!order || !dp) return;
  const num = order.orderNumber || 'Order';

  // Customer notification
  await createNotification({
    recipientPhone: order.customerPhone || order.customerContact,
    recipientId: order.customerId,
    recipientRole: 'customer',
    orderId: order._id,
    orderNumber: num,
    type: 'ORDER_ACCEPTED',
    title: `🛵 Delivery Partner Accepted (#${num})`,
    message: `${dp.name} (+91 ${dp.phone}) has accepted your delivery and is en route. You can message them in-app for directions.`,
    metadata: { dpName: dp.name, dpPhone: dp.phone }
  });

  // Admin notification
  await createNotification({
    recipientRole: 'admin',
    orderId: order._id,
    orderNumber: num,
    type: 'ORDER_ACCEPTED',
    title: `Fleet Accepted: #${num}`,
    message: `${dp.name} (${dp.phone}) accepted order #${num} for doorstep delivery.`,
    metadata: { dpId: dp._id, dpName: dp.name }
  });
}

/**
 * Dispatches notification when a new in-app chat message is sent on an order
 */
async function notifyNewOrderMessage(order, messageDoc) {
  if (!order || !messageDoc) return;
  const num = order.orderNumber || 'Order';
  const senderRole = messageDoc.senderRole;
  const senderName = messageDoc.senderName || 'User';
  const textPreview = messageDoc.text.length > 60 ? `${messageDoc.text.slice(0, 57)}...` : messageDoc.text;

  // If customer sent -> notify assigned delivery person and admin
  if (senderRole === 'customer') {
    if (order.assignedDeliveryPerson) {
      await createNotification({
        recipientPhone: order.assignedDeliveryPersonPhone,
        recipientId: order.assignedDeliveryPerson,
        recipientRole: 'delivery',
        orderId: order._id,
        orderNumber: num,
        type: 'NEW_MESSAGE',
        title: `💬 Customer Message on #${num}`,
        message: `${senderName}: "${textPreview}"`,
        metadata: { senderRole, senderName, text: messageDoc.text }
      });
    }

    await createNotification({
      recipientRole: 'admin',
      orderId: order._id,
      orderNumber: num,
      type: 'NEW_MESSAGE',
      title: `💬 New Message on #${num}`,
      message: `${senderName} (Customer): "${textPreview}"`,
      metadata: { senderRole, senderName, text: messageDoc.text }
    });
  } 
  // If delivery person sent -> notify customer and admin
  else if (senderRole === 'delivery') {
    await createNotification({
      recipientPhone: order.customerPhone || order.customerContact,
      recipientId: order.customerId,
      recipientRole: 'customer',
      orderId: order._id,
      orderNumber: num,
      type: 'NEW_MESSAGE',
      title: `💬 Message from Delivery Partner (${senderName})`,
      message: `Order #${num}: "${textPreview}"`,
      metadata: { senderRole, senderName, text: messageDoc.text }
    });

    await createNotification({
      recipientRole: 'admin',
      orderId: order._id,
      orderNumber: num,
      type: 'NEW_MESSAGE',
      title: `💬 Delivery Note on #${num}`,
      message: `${senderName} (Delivery): "${textPreview}"`,
      metadata: { senderRole, senderName, text: messageDoc.text }
    });
  }
  // If admin sent -> notify customer and delivery person
  else if (senderRole === 'admin') {
    await createNotification({
      recipientPhone: order.customerPhone || order.customerContact,
      recipientId: order.customerId,
      recipientRole: 'customer',
      orderId: order._id,
      orderNumber: num,
      type: 'NEW_MESSAGE',
      title: `💬 Arogya Bhog Support (#${num})`,
      message: `${senderName}: "${textPreview}"`,
      metadata: { senderRole, senderName, text: messageDoc.text }
    });

    if (order.assignedDeliveryPerson) {
      await createNotification({
        recipientPhone: order.assignedDeliveryPersonPhone,
        recipientId: order.assignedDeliveryPerson,
        recipientRole: 'delivery',
        orderId: order._id,
        orderNumber: num,
        type: 'NEW_MESSAGE',
        title: `💬 Admin Message on #${num}`,
        message: `${senderName} (Admin): "${textPreview}"`,
        metadata: { senderRole, senderName, text: messageDoc.text }
      });
    }
  }
}

module.exports = {
  cleanPhone,
  createNotification,
  notifyOrderStatusChange,
  notifyDeliveryAccepted,
  notifyNewOrderMessage
};
