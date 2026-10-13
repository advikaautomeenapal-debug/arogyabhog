/**
 * Mobile Number and PIN Code Validation & Normalization Helpers for Arogya Bhog
 */

const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  // Strip country code +91 if present
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  // Strip leading zero if 11 digits
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
};

const isValidIndianPhone = (phone) => {
  const normalized = normalizePhone(phone);
  return /^[6-9]\d{9}$/.test(normalized);
};

const isValidIndianPincode = (pincode) => {
  if (!pincode) return false;
  const cleaned = pincode.toString().trim().replace(/\D/g, '');
  return /^\d{6}$/.test(cleaned);
};

module.exports = {
  normalizePhone,
  isValidIndianPhone,
  isValidIndianPincode
};
