// ============================================================
// SAFEED-UP — Supabase Document API Bridge
// Single Source of Truth for Document Operations
// ============================================================
import { documentService } from '../services/documentService';
import { inspectorService } from '../services/inspectorService';
import { supabase } from '../lib/supabaseClient';

export const documentApi = {
  /**
   * Upload document file (Supabase Storage + PostgreSQL row)
   */
  uploadDocument: async (file, documentType, instId) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    let targetInstId = instId;

    if (!targetInstId && userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('institution_id')
        .eq('id', userId)
        .single();
      targetInstId = profile?.institution_id;
    }

    return documentService.uploadDocument({
      file,
      documentType,
      institutionId: targetInstId,
      userId,
    });
  },

  /**
   * Alias for formData upload from UI form
   */
  upload: async (formData) => {
    const file = formData.get('file');
    const documentType = formData.get('documentType');

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('institution_id')
      .eq('id', userId)
      .single();

    const instId = profile?.institution_id;

    const doc = await documentService.uploadDocument({
      file,
      documentType,
      institutionId: instId,
      userId,
    });

    return { data: { success: true, data: { document: doc } } };
  },

  /**
   * Fetch authenticated institution's documents
   */
  getMyDocuments: async (institutionId) => {
    let targetInstId = institutionId;
    if (!targetInstId) {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('institution_id')
          .eq('id', userId)
          .single();
        targetInstId = profile?.institution_id;
      }
    }

    const docs = await documentService.getMyDocuments(targetInstId);
    return { data: { success: true, documents: docs, data: { documents: docs } } };
  },

  /**
   * Fetch documents assigned to logged-in inspector
   */
  getAssigned: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const inspectorId = sessionData?.session?.user?.id;

    const docs = await inspectorService.getAssignedDocuments(inspectorId);
    return { data: { success: true, documents: docs, data: { documents: docs } } };
  },

  getAssignedDocuments: async () => {
    return documentApi.getAssigned();
  },

  getPending: async () => {
    return documentApi.getAssigned();
  },

  getForInstitution: async (instId) => {
    const docs = await documentService.getMyDocuments(instId);
    return { data: { success: true, data: { documents: docs } } };
  },

  /**
   * Approve a document
   */
  approve: async (documentId) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const inspectorId = sessionData?.session?.user?.id;
    const doc = await inspectorService.approveDocument(documentId, inspectorId);
    return { data: { success: true, document: doc } };
  },

  approveDocument: async (documentId) => {
    return documentApi.approve(documentId);
  },

  /**
   * Reject a document with reason
   */
  reject: async (documentId, data = {}) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const inspectorId = sessionData?.session?.user?.id;
    const reason = typeof data === 'string' ? data : data.reason;
    const doc = await inspectorService.rejectDocument(documentId, inspectorId, reason);
    return { data: { success: true, document: doc } };
  },

  rejectDocument: async (documentId, data) => {
    return documentApi.reject(documentId, data);
  },

  /**
   * Get direct URL or file proxy stream URL
   */
  getFileUrl: (storagePathOrId) => {
    // If input is a storagePath or document ID, return signed URL endpoint or path
    if (storagePathOrId && storagePathOrId.includes('institutions/')) {
      return documentService.getSignedFileUrl(storagePathOrId);
    }
    return storagePathOrId || '';
  },

  getDocumentFileUrl: (id) => documentApi.getFileUrl(id),
};

export default documentApi;
