// ============================================================
// SAFEED-UP — Supabase Inspector Desk Service
// Single Source of Truth for Inspection Verification & Approval
// ============================================================
import { supabase } from '../lib/supabaseClient';

export const inspectorService = {
  /**
   * Fetch documents assigned to the logged-in inspector
   */
  getAssignedDocuments: async (inspectorProfileId) => {
    let query = supabase
      .from('documents')
      .select('*, institutions(*), profiles!uploaded_by(full_name, email)')
      .order('uploaded_at', { ascending: false });

    if (inspectorProfileId) {
      query = query.eq('assigned_inspector_id', inspectorProfileId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[inspectorService] Fetch assigned docs error:', error.message);
      throw error;
    }

    return (data || []).map((doc) => ({
      ...doc,
      _id: doc.id,
      institutionName: doc.institutions?.name || 'School / Institution',
      documentType: doc.document_type,
      originalFileName: doc.original_file_name,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
      status: doc.status,
      rejectionReason: doc.rejection_reason,
    }));
  },

  /**
   * Approve document by ID
   */
  approveDocument: async (documentId, inspectorProfileId) => {
    const { data, error } = await supabase
      .from('documents')
      .update({
        status: 'APPROVED',
        reviewed_by: inspectorProfileId || null,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve document: ${error.message}`);
    }
    return data;
  },

  /**
   * Reject document by ID with reason
   */
  rejectDocument: async (documentId, inspectorProfileId, rejectionReason) => {
    const { data, error } = await supabase
      .from('documents')
      .update({
        status: 'REJECTED',
        reviewed_by: inspectorProfileId || null,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason || 'Rejected during inspector review.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reject document: ${error.message}`);
    }
    return data;
  },
};

export default inspectorService;
