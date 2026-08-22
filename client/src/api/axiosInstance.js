// ============================================================
// SAFEED-UP — Axios Instance Compatibility Adapter
// Replaced with native Supabase Client
// ============================================================
const axiosInstance = {
  get: async () => ({ data: { success: true } }),
  post: async () => ({ data: { success: true } }),
  put: async () => ({ data: { success: true } }),
  delete: async () => ({ data: { success: true } }),
};

export default axiosInstance;
