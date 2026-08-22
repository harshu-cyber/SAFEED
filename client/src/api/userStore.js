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
  }
};
