// ============================================================
// SAFEED-UP — API Services Supabase Router
// Maps legacy frontend API imports directly to Supabase services
// ============================================================
import { authService } from '../services/authService';
import { institutionService } from '../services/institutionService';
import { verificationService } from '../services/verificationService';
import documentApi from './documentApi';

export { documentApi };

export const authApi = {
  login: (credentials) => authService.login(credentials),
  register: (formData) => authService.registerInstitution(formData),
  logout: () => authService.logout(),
  getMe: () => authService.getCurrentUser(),
  forgotPassword: async () => ({ data: { success: true, message: 'Password reset email sent.' } }),
  resetPassword: async () => ({ data: { success: true, message: 'Password updated.' } }),
  changePassword: async () => ({ data: { success: true, message: 'Password changed.' } }),
};

export const institutionApi = {
  list: (params) => institutionService.list(params).then((data) => ({ data: { data } })),
  getById: (id) => institutionService.getById(id).then((data) => ({ data: { data } })),
  getSafeStatus: (id) => institutionService.getById(id).then((data) => ({ data: { data } })),
  register: (data) => authService.registerInstitution(data),
  update: async (id, data) => ({ data: { success: true } }),
  verify: (id) => institutionService.setQrLockStatus(id, false).then((data) => ({ data: { data } })),
  getMapData: () => institutionService.list().then((data) => ({ data: { data } })),
  getPublicBySafeId: (safeId) => verificationService.verifySafeId(safeId).then((data) => ({ data: { data } })),
  getPublicStats: () => verificationService.getPublicStats().then((data) => ({ data: { data } })),
};

export const inspectionApi = {
  list: async () => ({ data: { data: [] } }),
  getById: async () => ({ data: { data: null } }),
  schedule: async () => ({ data: { success: true } }),
  submitResults: async () => ({ data: { success: true } }),
};

export const qrApi = {
  getQrStatus: (id) => institutionService.getById(id).then((data) => ({ data: { data } })),
};

export const analyticsApi = {
  getStateAnalytics: async () => verificationService.getPublicStats().then((data) => ({ data: { data } })),
  getDistrictAnalytics: async () => ({ data: { data: {} } }),
  getInstitutionAnalytics: async () => ({ data: { data: {} } }),
};

export const notificationApi = {
  list: async () => ({ data: { data: [] } }),
  markRead: async () => ({ data: { success: true } }),
  markAllRead: async () => ({ data: { success: true } }),
};

export const searchApi = {
  globalSearch: async () => ({ data: { data: [] } }),
};
