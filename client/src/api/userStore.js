// ============================================================
// SAFEED-UP — User Store Facade (Supabase Powered)
// ============================================================
import { authService } from '../services/authService';

export const userStore = {
  getCurrentUser: async () => {
    return await authService.getCurrentProfile();
  },
  getUsersByRole: async () => {
    return [];
  },
  getStats: () => {
    return {
      total: 12,
      active: 10,
      inspectors: 5,
      districtAdmins: 3,
      police: 2,
    };
  }
};
