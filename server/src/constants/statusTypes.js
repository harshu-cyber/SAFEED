// ============================================================
// SafeED-UP — Application-wide Status & Type Constants
// ============================================================

const INSTITUTION_TYPES = {
  SCHOOL: 'SCHOOL',
  COACHING_INSTITUTE: 'COACHING_INSTITUTE',
};

const INSTITUTION_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BLACKLISTED: 'BLACKLISTED',
};

const VERIFICATION_STATUS = {
  UNVERIFIED: 'UNVERIFIED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
};

const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

const INSPECTION_TYPES = {
  ROUTINE: 'ROUTINE',
  SURPRISE: 'SURPRISE',
  FIRE_SAFETY: 'FIRE_SAFETY',
  COMPLAINT_BASED: 'COMPLAINT_BASED',
  FOLLOW_UP: 'FOLLOW_UP',
};

const INSPECTION_STATUS = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const DOCUMENT_TYPES = {
  FIRE_NOC: 'FIRE_NOC',
  BUILDING_PLAN: 'BUILDING_PLAN',
  AFFILIATION_CERT: 'AFFILIATION_CERT',
  POLICE_NOC: 'POLICE_NOC',
  LAND_DOCUMENT: 'LAND_DOCUMENT',
  STAFF_LIST: 'STAFF_LIST',
  EMERGENCY_PLAN: 'EMERGENCY_PLAN',
  INSURANCE: 'INSURANCE',
  OTHER: 'OTHER',
};

const DOCUMENT_VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
};

const COMPLIANCE_STATUS = {
  COMPLIANT: 'COMPLIANT',
  PARTIALLY_COMPLIANT: 'PARTIALLY_COMPLIANT',
  NON_COMPLIANT: 'NON_COMPLIANT',
};

const DEFICIENCY_TYPES = {
  FIRE_SAFETY: 'FIRE_SAFETY',
  STRUCTURAL: 'STRUCTURAL',
  DOCUMENTATION: 'DOCUMENTATION',
  EMERGENCY_PLAN: 'EMERGENCY_PLAN',
  HYGIENE: 'HYGIENE',
  OTHER: 'OTHER',
};

const DEFICIENCY_SEVERITY = {
  MINOR: 'MINOR',
  MODERATE: 'MODERATE',
  MAJOR: 'MAJOR',
  CRITICAL: 'CRITICAL',
};

const DEFICIENCY_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  WAIVED: 'WAIVED',
};

const NOTIFICATION_TYPES = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  DANGER: 'DANGER',
  SYSTEM: 'SYSTEM',
};

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.png', '.jpeg', '.jpg'];

const AFFILIATION_BOARDS = [
  'CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'NIOS', 'Other',
];

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Lakshadweep', 'Puducherry', 'Ladakh', 'Jammu and Kashmir'
];

module.exports = {
  INSTITUTION_TYPES,
  INSTITUTION_STATUS,
  VERIFICATION_STATUS,
  RISK_LEVELS,
  INSPECTION_TYPES,
  INSPECTION_STATUS,
  DOCUMENT_TYPES,
  DOCUMENT_VERIFICATION_STATUS,
  COMPLIANCE_STATUS,
  DEFICIENCY_TYPES,
  DEFICIENCY_SEVERITY,
  DEFICIENCY_STATUS,
  NOTIFICATION_TYPES,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  AFFILIATION_BOARDS,
  INDIA_STATES,
};
