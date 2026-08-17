// ============================================================
// SafeED-UP — Request Input Sanitizer Middleware
// Protects against NoSQL Injection ($ and . keys) and basic XSS
// ============================================================

/**
 * Recursively strips keys starting with '$' or containing '.'
 * from request objects (NoSQL injection prevention)
 */
function cleanNoSQL(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(cleanNoSQL);
  }

  const cleaned = {};
  for (const key of Object.keys(obj)) {
    // Strip keys starting with $ or containing . (MongoDB operator injection)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleaned[key] = cleanNoSQL(obj[key]);
  }
  return cleaned;
}

/**
 * Middleware function to sanitize req.body, req.query, and req.params
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = cleanNoSQL(req.body);
  }
  if (req.query) {
    req.query = cleanNoSQL(req.query);
  }
  if (req.params) {
    req.params = cleanNoSQL(req.params);
  }
  next();
};

module.exports = sanitizeInput;
