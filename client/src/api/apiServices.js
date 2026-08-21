import axiosInstance from './axiosInstance';

export const authApi = {
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  register: (userData) => axiosInstance.post('/auth/register', userData),
  logout: () => axiosInstance.post('/auth/logout'),
  getMe: () => axiosInstance.get('/auth/me'),
  forgotPassword: (data) => axiosInstance.post('/auth/forgot-password', data),
  resetPassword: (token, data) => axiosInstance.post(`/auth/reset-password/${token}`, data),
  changePassword: (data) => axiosInstance.patch('/auth/change-password', data),
};

export const institutionApi = {
  list: (params) => axiosInstance.get('/institutions', { params }),
  getById: (id) => axiosInstance.get(`/institutions/${id}`),
  getSafeStatus: (id) => axiosInstance.get(`/institutions/${id}/safe-status`),
  register: (data) => axiosInstance.post('/institutions', data),
  update: (id, data) => axiosInstance.patch(`/institutions/${id}`, data),
  verify: (id, data) => axiosInstance.patch(`/institutions/${id}/verify`, data),
  getMapData: (params) => axiosInstance.get('/institutions/map-data', { params }),
  getPublicBySafeId: (safeId) => axiosInstance.get(`/public/verify/${safeId}`),
  getPublicStats: () => axiosInstance.get('/public/stats'),
};

export const inspectionApi = {
  list: (params) => axiosInstance.get('/inspections', { params }),
  getById: (id) => axiosInstance.get(`/inspections/${id}`),
  schedule: (data) => axiosInstance.post('/inspections', data),
  submitResults: (id, data) => axiosInstance.patch(`/inspections/${id}/submit`, data),
};

export const documentApi = {
  getMyDocuments: () => axiosInstance.get('/documents/my'),
  getAssigned: () => axiosInstance.get('/documents/inspector/assigned'),
  getPending: () => axiosInstance.get('/documents/inspector/assigned'),
  getForInstitution: (instId) => axiosInstance.get('/documents/my'),
  upload: (formData) => axiosInstance.post('/documents', formData),
  approve: (id) => axiosInstance.patch(`/documents/${id}/approve`),
  reject: (id, data) => axiosInstance.patch(`/documents/${id}/reject`, data),
  getQrStatus: (institutionId) => axiosInstance.get('/documents/qr-status', { params: { institutionId } }),
  getFileUrl: (id) => {
    const rawBase = import.meta.env.VITE_API_URL || '';
    const cleanBase = rawBase ? rawBase.replace(/\/+$/, '') : '';
    const baseURL = cleanBase ? (cleanBase.endsWith('/api/v1') ? cleanBase : `${cleanBase}/api/v1`) : '/api/v1';
    return `${baseURL}/documents/${id}/file`;
  },
};

export const qrApi = {
  getQrStatus: (institutionId) => axiosInstance.get('/documents/qr-status', { params: { institutionId } }),
};

export const analyticsApi = {
  getStateAnalytics: (params) => axiosInstance.get('/analytics/state', { params }),
  getDistrictAnalytics: (district) => axiosInstance.get(`/analytics/district/${district}`),
  getInstitutionAnalytics: (id) => axiosInstance.get(`/analytics/institution/${id}`),
};

export const notificationApi = {
  list: (params) => axiosInstance.get('/notifications', { params }),
  markRead: (id) => axiosInstance.patch(`/notifications/${id}/read`),
  markAllRead: () => axiosInstance.patch('/notifications/read-all'),
};

export const searchApi = {
  globalSearch: (query) => axiosInstance.get('/search', { params: { q: query } }),
};
