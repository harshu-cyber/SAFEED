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
  getForInstitution: (institutionId, params) => axiosInstance.get(`/documents/institution/${institutionId}`, { params }),
  getPending: (params) => axiosInstance.get('/documents/inspector/pending', { params }),
  getAssigned: (params) => axiosInstance.get('/documents/inspector/assigned', { params }),
  getCompliance: (institutionId) => axiosInstance.get(`/documents/institution/${institutionId}/compliance`),
  upload: (institutionId, formData) => axiosInstance.post(`/documents/institution/${institutionId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  approve: (id) => axiosInstance.patch(`/documents/${id}/approve`),
  reject: (id, data) => axiosInstance.patch(`/documents/${id}/reject`, data),
  verify: (id, data) => axiosInstance.patch(`/documents/${id}/verify`, data),
  delete: (id) => axiosInstance.delete(`/documents/${id}`),
};

export const qrApi = {
  getQrStatus: (institutionId) => axiosInstance.get(`/qr/institution/${institutionId}/status`),
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
