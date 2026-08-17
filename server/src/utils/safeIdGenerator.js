// ============================================================
// SafeED-UP — Safe ID Generator
// Format: SFED-{STATE_CODE}-{TYPE_CODE}-{5-digit-seq}
// Example: SFED-MH-SCH-00142
// ============================================================
const Institution = require('../models/Institution.model');
const { INSTITUTION_TYPES } = require('../constants/statusTypes');

// Map state names to 2-3 letter codes
const STATE_CODES = {
  'Andhra Pradesh': 'AP',
  'Arunachal Pradesh': 'AR',
  Assam: 'AS',
  Bihar: 'BR',
  Chhattisgarh: 'CG',
  Goa: 'GA',
  Gujarat: 'GJ',
  Haryana: 'HR',
  'Himachal Pradesh': 'HP',
  Jharkhand: 'JH',
  Karnataka: 'KA',
  Kerala: 'KL',
  'Madhya Pradesh': 'MP',
  Maharashtra: 'MH',
  Manipur: 'MN',
  Meghalaya: 'ML',
  Mizoram: 'MZ',
  Nagaland: 'NL',
  Odisha: 'OD',
  Punjab: 'PB',
  Rajasthan: 'RJ',
  Sikkim: 'SK',
  'Tamil Nadu': 'TN',
  Telangana: 'TG',
  Tripura: 'TR',
  'Uttar Pradesh': 'UP',
  Uttarakhand: 'UK',
  'West Bengal': 'WB',
  'Andaman and Nicobar Islands': 'AN',
  Chandigarh: 'CH',
  'Dadra and Nagar Haveli': 'DN',
  'Daman and Diu': 'DD',
  Delhi: 'DL',
  Lakshadweep: 'LD',
  Puducherry: 'PY',
  Ladakh: 'LA',
  'Jammu and Kashmir': 'JK',
};

const TYPE_CODES = {
  [INSTITUTION_TYPES.SCHOOL]: 'SCH',
  [INSTITUTION_TYPES.COACHING_INSTITUTE]: 'COA',
};

/**
 * Generate a unique Safe ID for an institution
 * @param {string} state - Indian state name
 * @param {string} institutionType - SCHOOL | COACHING_INSTITUTE
 * @returns {Promise<string>} - e.g. SFED-MH-SCH-00142
 */
const generateSafeId = async (state, institutionType) => {
  const stateCode = STATE_CODES[state] || 'XX';
  const typeCode = TYPE_CODES[institutionType] || 'INS';

  // Count existing institutions of this type in this state to get sequence
  const count = await Institution.countDocuments({
    'address.state': state,
    type: institutionType,
  });

  const sequence = String(count + 1).padStart(5, '0');
  const safeId = `SFED-${stateCode}-${typeCode}-${sequence}`;

  // Ensure uniqueness
  const existing = await Institution.findOne({ safeId });
  if (existing) {
    // Fallback: use timestamp suffix
    const ts = Date.now().toString().slice(-5);
    return `SFED-${stateCode}-${typeCode}-${ts}`;
  }

  return safeId;
};

module.exports = { generateSafeId, STATE_CODES, TYPE_CODES };
