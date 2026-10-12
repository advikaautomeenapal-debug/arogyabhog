/**
 * UPI Helper Utility for Arogyabhog Artisanal Ayurveda
 * Formats UPI URI strings with exact required parameters,
 * strict URL encoding, and standardized transaction notes:
 * "Arogyabhog | Name: {customerName} | Mobile: {customerPhone} | Order: {orderId}"
 */

export const MERCHANT_UPI_ID = 'BHARATPE2Y0C0P7Y9F19302@unitype';
export const MERCHANT_NAME = 'Arogyabhog';

/**
 * Builds a standardized compact transaction note
 * Format: "Order AB123 | Name: Ravi Kumar | Phone: 98XXXXXXXX"
 */
export function buildUpiTransactionNote({ customerName = 'Customer', customerPhone = '', orderNumber = 'PENDING' }) {
  const cleanOrder = (orderNumber || 'PENDING').trim().replace(/^#/, '');
  const cleanName = (customerName || 'Customer').trim();
  const cleanPhone = (customerPhone || '').trim();
  return `Order ${cleanOrder} | Name: ${cleanName} | Phone: ${cleanPhone}`;
}

/**
 * Builds an RFC-compliant UPI deep link
 */
export function buildUpiUri({
  vpa = MERCHANT_UPI_ID,
  payeeName = MERCHANT_NAME,
  amount = 0,
  customerName = 'Customer',
  customerPhone = '',
  orderNumber = 'PENDING',
  customNote = null
}) {
  const note = customNote || buildUpiTransactionNote({ customerName, customerPhone, orderNumber });
  const cleanOrder = (orderNumber || 'PENDING').trim().replace(/^#/, '');
  const numAmount = Number(amount) || 0;
  const formattedAmount = numAmount.toFixed(2);

  const encodedPa = encodeURIComponent(vpa);
  const encodedPn = encodeURIComponent(payeeName);
  const encodedAm = encodeURIComponent(formattedAmount);
  const encodedCu = encodeURIComponent('INR');
  const encodedTn = encodeURIComponent(note);
  const encodedTr = encodeURIComponent(cleanOrder);

  const uri = `upi://pay?pa=${encodedPa}&pn=${encodedPn}&am=${encodedAm}&cu=${encodedCu}&tn=${encodedTn}&tr=${encodedTr}`;

  return {
    uri,
    note,
    vpa,
    payeeName,
    amount: numAmount,
    formattedAmount
  };
}
