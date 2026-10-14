/**
 * WhatsApp Order Notifications & Click-to-Chat Utilities
 * Arogya Bhog — Artisanal Stone-Milled Flours
 */

export const ADMIN_WHATSAPP_NUMBER = '919621496772';

/**
 * Normalizes phone numbers to Indian 12-digit format without leading + or 0
 * e.g., '9559537766' -> '919559537766'
 *       '+91 9559537766' -> '919559537766'
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.length > 10 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
};

/**
 * Formats a clean items summary from an order
 */
export const formatOrderItemsSummary = (order) => {
  if (!order || !order.items || !Array.isArray(order.items) || order.items.length === 0) {
    return 'Artisanal Multigrain Flour Blend (10 kg)';
  }
  return order.items
    .map(it => `${it.name} (${it.batchSizeKg || 5} kg${it.quantity > 1 ? ` x ${it.quantity}` : ''})`)
    .join(', ');
};

/**
 * Generates tailored WhatsApp notification messages for different order lifecycle stages
 */
export const formatOrderWhatsAppMessage = (order, template = 'confirmed') => {
  if (!order) return '';

  const customerName = (order.customerName || 'Valued Customer').trim();
  const orderNum = order.orderNumber || '#AB-ORDER';
  const totalAmount = order.totalAmount || 0;
  const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'Paid';
  const paymentMode = isPaid ? 'Paid Online (UPI / Card)' : 'Cash on Delivery (COD)';
  const address = order.customerAddress ? `${order.customerAddress}, ${order.customerCity || 'Kanpur'}` : 'Kanpur, UP';
  const slot = order.deliverySlot || 'Tomorrow Morning (8:00 AM - 11:00 AM)';
  const itemsText = formatOrderItemsSummary(order);
  const dpName = order.assignedDeliveryPersonName || order.deliveredBy?.name || 'Arogya Bhog Delivery Partner';
  const dpPhone = order.assignedDeliveryPersonPhone || order.deliveredBy?.phone || '+91 96214 96772';

  switch (template) {
    case 'confirmed':
      return (
`Namaste ${customerName} ji! 🙏

Your Arogya Bhog order *${orderNum}* has been *CONFIRMED*! 🌾

📋 *Order Details:*
• *Items:* ${itemsText}
• *Total Amount:* ₹${totalAmount} (${paymentMode})
• *Delivery Slot:* ${slot}
• *Delivery Address:* ${address}

🌿 *Stone Chakki Milling Guarantee:*
Your flour is ground on our traditional slow-moving stone chakki (280 RPM) only after you place your order to preserve live micronutrients, natural bran fibre, and active enzymes. Zero preservatives, zero Maida.

🚚 *Live Tracking:*
Track your fresh batch anytime at: https://arogyabhog.com/orders

Thank you for choosing wholesome Vedic health for your family!
Warm regards,
*Arogya Bhog Team*
📞 Support WhatsApp / Call: +91 96214 96772`
      );

    case 'milled':
      return (
`Namaste ${customerName} ji! 🙏

Great news! Your order *${orderNum}* has been *FRESHLY STONE-MILLED & PACKED*! 🌾✨

• *Items:* ${itemsText}
• *Amount Due:* ₹${totalAmount} (${paymentMode})
• *Chakki Status:* Milled on natural emery stone chakki at cold temperature and sealed in food-grade eco bag.

🚚 Next Step: Dispatched for doorstep morning delivery (${slot}).

Track live status: https://arogyabhog.com/orders
*Arogya Bhog Team* • +91 96214 96772`
      );

    case 'dispatched':
      return (
`Namaste ${customerName} ji! 🙏

Your fresh flour order *${orderNum}* is now *OUT FOR DELIVERY*! 🚚🌾

• *Items:* ${itemsText}
• *Amount to Pay:* ₹${totalAmount} (${paymentMode})
• *Delivery Partner:* ${dpName} (📞 ${dpPhone})
• *Destination:* ${address}

${!isPaid ? '💵 Please keep ₹' + totalAmount + ' ready in cash or pay via UPI QR to our delivery partner upon arrival.' : '✅ Payment is already verified. No payment needed on delivery.'}

Warm regards,
*Arogya Bhog Team* • Kanpur, UP`
      );

    case 'delivered':
      return (
`Namaste ${customerName} ji! 🙏

Your Arogya Bhog order *${orderNum}* has been *DELIVERED*! 🏡🌾

We hope you enjoy the pure aroma, softness, and traditional stone-ground nutrition of your fresh flour.

⭐ *Tips for Storage:*
Keep in an airtight container in a cool, dry place. Best enjoyed within 30 days of cold-milling.

For your next fresh batch or questions:
🌐 https://arogyabhog.com
📞 WhatsApp: +91 96214 96772

Thank you for being part of the Arogya Bhog family! 🙏`
      );

    default:
      return (
`Namaste ${customerName} ji!
Regarding your Arogya Bhog order *${orderNum}*:
Items: ${itemsText}
Amount: ₹${totalAmount} (${paymentMode})

We are processing your order with fresh stone chakki milling.
Support: +91 96214 96772`
      );
  }
};

/**
 * Builds a direct wa.me URL
 */
export const buildWhatsAppUrl = (phone, text) => {
  const cleanPhone = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(text || '');
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
};

/**
 * Opens a pre-filled WhatsApp conversation in a new browser tab/window
 */
export const openWhatsApp = (phone, text) => {
  const url = buildWhatsAppUrl(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
};
