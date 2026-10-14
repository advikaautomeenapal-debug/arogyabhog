/**
 * WhatsApp Order Notifications Utility
 * Arogya Bhog — Stone-Milled Artisanal Flours
 */

const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER || '919621496772';

function cleanPhoneNumber(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length > 10 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

function formatOrderItemsSummary(order) {
  if (!order || !order.items || !Array.isArray(order.items) || order.items.length === 0) {
    return 'Artisanal Multigrain Flour Blend (10 kg)';
  }
  return order.items
    .map(it => `${it.name} (${it.batchSizeKg || 5} kg${it.quantity > 1 ? ` x ${it.quantity}` : ''})`)
    .join(', ');
}

function formatOrderWhatsAppConfirmation(order) {
  if (!order) return '';

  const customerName = (order.customerName || 'Valued Customer').trim();
  const orderNum = order.orderNumber || `#AB-${order._id ? order._id.toString().slice(-6) : 'ORDER'}`;
  const totalAmount = order.totalAmount || 0;
  const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'Paid';
  const paymentMode = isPaid ? 'Paid Online (UPI / Card)' : 'Cash on Delivery (COD)';
  const address = order.customerAddress ? `${order.customerAddress}, ${order.customerCity || 'Kanpur'}` : 'Kanpur, UP';
  const slot = order.deliverySlot || 'Tomorrow Morning (8:00 AM - 11:00 AM)';
  const itemsText = formatOrderItemsSummary(order);

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
}

function buildWhatsAppClickUrl(phone, text) {
  const clean = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(text || '');
  return clean ? `https://wa.me/${clean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/**
 * Handles automated WhatsApp dispatch if an API provider is configured,
 * or logs the pre-formatted URL for 1-click admin processing.
 */
async function sendOrderWhatsAppNotification(order) {
  if (!order) return null;

  const phone = order.customerContact || order.customerPhone;
  const cleanPhone = cleanPhoneNumber(phone);
  const messageText = formatOrderWhatsAppConfirmation(order);
  const whatsappUrl = buildWhatsAppClickUrl(cleanPhone, messageText);

  // If automated WhatsApp Cloud API / Webhook is configured
  if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN) {
    try {
      const response = await fetch(process.env.WHATSAPP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`
        },
        body: JSON.stringify({
          to: cleanPhone,
          type: 'text',
          text: { body: messageText }
        })
      });
      const data = await response.json();
      console.log(`[WhatsApp API Dispatched] Order ${order.orderNumber} to ${cleanPhone}:`, data);
      return { success: true, apiDispatched: true, data };
    } catch (apiErr) {
      console.error(`[WhatsApp API Error] Order ${order.orderNumber}:`, apiErr.message);
    }
  }

  // Pre-formatted Click-to-Chat ready for admin 1-click dispatch
  console.log(`[WhatsApp Order Confirmation Ready] Order ${order.orderNumber} for ${order.customerName} (${cleanPhone})`);
  return {
    success: true,
    cleanPhone,
    messageText,
    whatsappUrl
  };
}

module.exports = {
  ADMIN_WHATSAPP_NUMBER,
  cleanPhoneNumber,
  formatOrderItemsSummary,
  formatOrderWhatsAppConfirmation,
  buildWhatsAppClickUrl,
  sendOrderWhatsAppNotification
};
