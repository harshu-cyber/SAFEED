// ============================================================
// SAFEED-UP — Evidence Store Facade (Supabase Powered)
// ============================================================
import { documentService } from '../services/documentService';

export const evidenceStore = {
  getEvidenceForInstitution: async (institutionId) => {
    return await documentService.getMyDocuments(institutionId);
  },
  uploadEvidence: async (data) => {
    return await documentService.uploadDocument(data);
  }
};
