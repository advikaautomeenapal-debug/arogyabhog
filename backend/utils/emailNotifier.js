const nodemailer = require('nodemailer');

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'arogyabhog@gmail.com';

/**
 * Creates and caches the nodemailer transporter
 */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER || process.env.GMAIL_USER || 'arogyabhog@gmail.com';
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: user && pass ? { user, pass } : undefined
    });
  } else {
    // Default to Gmail service
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass
      }
    });
  }

  return transporter;
}

/**
 * Sends an email notification to arogyabhog@gmail.com whenever an order is placed
 * @param {Object} order - The saved Mongoose Order document
 */
async function sendOrderNotificationEmail(order) {
  if (!order) return;

  const orderNum = order.orderNumber || `#AB-${order._id.toString().slice(-6)}`;
  const customerName = order.customerName || 'Customer';
  const phone = order.customerPhone || order.customerContact || 'N/A';
  const address = order.customerAddress || 'N/A';
  const city = order.customerCity || 'Kanpur';
  const pincode = order.customerPincode || 'N/A';
  const total = order.totalAmount || 0;
  const paymentMethod = order.paymentMethod || 'UPI';
  const paymentStatus = order.paymentStatus || 'Pending';
  const slot = order.deliverySlot || 'Standard Delivery';
  const items = Array.isArray(order.items) ? order.items : [];

  const itemsHtml = items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #E5E7EB;">
      <td style="padding: 10px 12px; font-weight: 600; color: #111827;">${idx + 1}. ${item.name || 'Multigrain Atta'}</td>
      <td style="padding: 10px 12px; color: #4B5563; text-align: center;">${item.batchSizeKg || 5} kg</td>
      <td style="padding: 10px 12px; color: #4B5563; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 10px 12px; font-weight: 700; color: #C9A227; text-align: right;">₹${item.totalItemPrice || 0}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order ${orderNum}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; margin: 0; padding: 24px; color: #1F2937;">
      <div style="max-width: 620px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
        
        <!-- Header -->
        <div style="background-color: #111111; padding: 24px; text-align: center; border-bottom: 3px solid #C9A227;">
          <h1 style="color: #FDFBF7; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">AROGYA BHOG</h1>
          <p style="color: #C9A227; margin: 6px 0 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">New Customer Order Notification</p>
        </div>

        <!-- Order Summary Hero -->
        <div style="padding: 24px; background: #FFFBEB; border-bottom: 1px solid #FDE68A;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <span style="font-size: 12px; font-weight: 700; color: #92400E; text-transform: uppercase;">Order Number</span>
                <div style="font-size: 20px; font-weight: 800; color: #111827; margin-top: 2px;">${orderNum}</div>
              </td>
              <td style="text-align: right;">
                <span style="font-size: 12px; font-weight: 700; color: #92400E; text-transform: uppercase;">Order Value</span>
                <div style="font-size: 22px; font-weight: 900; color: #B45309; margin-top: 2px;">₹${total}</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- Body Content -->
        <div style="padding: 24px;">
          
          <!-- Customer Details -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #374151; letter-spacing: 0.5px; border-bottom: 2px solid #F3F4F6; padding-bottom: 6px;">Customer & Delivery Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #6B7280; width: 140px; font-weight: 600;">Customer Name:</td>
                <td style="padding: 6px 0; color: #111827; font-weight: 700;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6B7280; font-weight: 600;">Mobile Number:</td>
                <td style="padding: 6px 0; color: #111827; font-weight: 700;"><a href="tel:${phone}" style="color: #2563EB; text-decoration: none;">${phone}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6B7280; font-weight: 600;">Delivery Address:</td>
                <td style="padding: 6px 0; color: #111827; font-weight: 600;">${address}, ${city} - ${pincode}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6B7280; font-weight: 600;">Delivery Slot:</td>
                <td style="padding: 6px 0; color: #047857; font-weight: 700;">${slot}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6B7280; font-weight: 600;">Payment:</td>
                <td style="padding: 6px 0; font-weight: 700;">${paymentMethod} (${paymentStatus})</td>
              </tr>
            </table>
          </div>

          <!-- Items Ordered -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 800; text-transform: uppercase; color: #374151; letter-spacing: 0.5px; border-bottom: 2px solid #F3F4F6; padding-bottom: 6px;">Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead>
                <tr style="background: #F9FAFB; text-transform: uppercase; font-size: 11px; color: #6B7280; font-weight: 700;">
                  <th style="padding: 8px 12px; text-align: left;">Product</th>
                  <th style="padding: 8px 12px; text-align: center;">Pack Size</th>
                  <th style="padding: 8px 12px; text-align: center;">Qty</th>
                  <th style="padding: 8px 12px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 12px; text-align: right; font-weight: 800; color: #111827; font-size: 14px;">Total Payable:</td>
                  <td style="padding: 12px; text-align: right; font-weight: 900; color: #B45309; font-size: 16px;">₹${total}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Footer Action -->
          <div style="text-align: center; padding-top: 12px; border-top: 1px solid #E5E7EB;">
            <p style="font-size: 12px; color: #6B7280; margin: 0 0 12px;">This is an automated notification from your Arogya Bhog online store.</p>
          </div>

        </div>

      </div>
    </body>
    </html>
  `;

  const textContent = `
NEW ORDER RECEIVED: ${orderNum}
Total Amount: ₹${total}
Customer: ${customerName} (${phone})
Address: ${address}, ${city} - ${pincode}
Delivery Slot: ${slot}
Payment: ${paymentMethod} (${paymentStatus})

ITEMS:
${items.map((i, idx) => `${idx + 1}. ${i.name} - ${i.batchSizeKg}kg x ${i.quantity} = ₹${i.totalItemPrice}`).join('\n')}
  `.trim();

  try {
    const mailTransporter = getTransporter();
    const mailOptions = {
      from: `"Arogya Bhog Store" <${process.env.SMTP_USER || process.env.GMAIL_USER || 'arogyabhog@gmail.com'}>`,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `🛒 New Order: ${orderNum} • ₹${total} • ${customerName}`,
      text: textContent,
      html: htmlContent
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[Email Notifier] Order notification successfully sent to ${ADMIN_NOTIFICATION_EMAIL} for order ${orderNum}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email Notifier] Could not send email notification to ${ADMIN_NOTIFICATION_EMAIL} for order ${orderNum}:`, err.message);
    // Return gracefully so order flow is never disrupted
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOrderNotificationEmail,
  ADMIN_NOTIFICATION_EMAIL
};
