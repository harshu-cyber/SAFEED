// ============================================================
// SafeED-UP — Canonical Frontend Document API Service
// Single Source of Truth for Document Upload, Retrieval & Verification
// ============================================================
import axiosInstance from './axiosInstance';

export const documentApi = {
  /**
   * Upload document file (multipart/form-data)
   * POST /api/v1/documents
   */
  /**
   * Upload document file (multipart/form-data)
   * POST /api/v1/documents
   */
  uploadDocument: async (file, documentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return axiosInstance.post('/documents', formData);
  },

  /**
   * Fetch authenticated institution's documents
   * GET /api/v1/documents/my
   */
  getMyDocuments: async () => {
    return axiosInstance.get('/documents/my');
  },

  /**
   * Fetch documents assigned to logged in inspector
   * GET /api/v1/documents/inspector/assigned
   */
  getAssignedDocuments: async () => {
    return axiosInstance.get('/documents/inspector/assigned');
  },

  /**
   * Approve a document
   * PATCH /api/v1/documents/:documentId/approve
   */
  approveDocument: async (documentId) => {
    return axiosInstance.patch(`/documents/${documentId}/approve`);
  },

  /**
   * Reject a document with reason
   * PATCH /api/v1/documents/:documentId/reject
   */
  rejectDocument: async (documentId, data) => {
    return axiosInstance.patch(`/documents/${documentId}/reject`, data);
  },

  /**
   * Get direct URL or file proxy stream URL
   */
  getDocumentFileUrl: (documentId) => {
    const storedToken = localStorage.getItem('accessToken');
    const rawBase = import.meta.env.VITE_API_URL || '';
    const cleanBase = rawBase ? rawBase.replace(/\/+$/, '') : '';
    const baseURL = cleanBase ? (cleanBase.endsWith('/api/v1') ? cleanBase : `${cleanBase}/api/v1`) : '/api/v1';
    const proxyUrl = `${baseURL}/documents/${documentId}/file`;
    return storedToken ? `${proxyUrl}?token=${encodeURIComponent(storedToken)}` : proxyUrl;
  },

  // Aliases for component convenience
  upload: function(formData) {
    return axiosInstance.post('/documents', formData);
  },
  getAssigned: function() { return axiosInstance.get('/documents/inspector/assigned'); },
  getPending: function() { return axiosInstance.get('/documents/inspector/assigned'); },
  getForInstitution: function(instId) { return axiosInstance.get('/documents/my'); },
  getFileUrl: function(documentId) { return this.getDocumentFileUrl(documentId); },
  approve: function(id) { return this.approveDocument(id); },
  reject: function(id, data) { return this.rejectDocument(id, data); },
  getQrStatus: function(institutionId) { return axiosInstance.get('/documents/qr-status', { params: { institutionId } }); },
};

export default documentApi;
