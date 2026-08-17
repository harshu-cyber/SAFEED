// ============================================================
// SafeED-UP — Async Handler (eliminates try/catch boilerplate)
// ============================================================

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
