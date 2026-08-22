// ============================================================
// SAFEED-UP — Supabase Document Service
// Single Source of Truth for File Upload (Storage) & Document Metadata
// ============================================================
import { supabase } from '../lib/supabaseClient';

export const documentService = {
  /**
   * Upload binary document file to Supabase Storage and insert metadata into `documents` table.
   * Path format: institutions/{institution_id}/documents/{document_id}/{original_filename}
   */
  uploadDocument: async ({ file, documentType, institutionId, userId }) => {
    if (!file) throw new Error('No binary file selected for document upload.');
    if (!documentType) throw new Error('Canonical document type is required.');
    if (!institutionId) throw new Error('Authenticated institution ID missing.');

    const documentId = crypto.randomUUID();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `institutions/${institutionId}/documents/${documentId}/${sanitizedFileName}`;
    const bucketName = 'safeed-documents';

    // 1. Upload binary file to Supabase Storage bucket `safeed-documents`
    const { data: storageData, error: storageErr } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      });

    if (storageErr) {
      console.error('[documentService] Supabase Storage upload failed:', storageErr);
      throw new Error(`Storage upload failed: ${storageErr.message}`);
    }

    // 2. Determine Inspector Assignment by District / Zone
    let assignedInspectorId = null;
    try {
      const { data: inspector } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'INSPECTION_OFFICER')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (inspector) {
        assignedInspectorId = inspector.id;
      }
    } catch (_) {}

    // 3. Insert canonical row into `documents` table
    const { data: docData, error: dbErr } = await supabase
      .from('documents')
      .upsert(
        [
          {
            id: documentId,
            institution_id: institutionId,
            document_type: documentType,
            original_file_name: file.name,
            storage_bucket: bucketName,
            storage_path: storagePath,
            mime_type: file.type || 'application/octet-stream',
            file_size: file.size,
            assigned_inspector_id: assignedInspectorId,
            status: 'PENDING_REVIEW',
            uploaded_by: userId || null,
            uploaded_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'institution_id,document_type' }
      )
      .select()
      .single();

    if (dbErr) {
      // Rollback: Delete uploaded storage file if database insertion failed
      console.error('[documentService] Database insert error, rolling back storage file:', dbErr);
      await supabase.storage.from(bucketName).remove([storagePath]);
      throw new Error(`Database record creation failed: ${dbErr.message}`);
    }

    return docData;
  },

  /**
   * Get all documents belonging to the authenticated institution
   */
  getMyDocuments: async (institutionId) => {
    if (!institutionId) return [];

    const { data, error } = await supabase
      .from('documents')
      .select('*, profiles!assigned_inspector_id(full_name, email)')
      .eq('institution_id', institutionId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('[documentService] Fetch my documents error:', error.message);
      throw error;
    }
    return data || [];
  },

  /**
   * Generate secure signed URL for viewing binary file in browser (expires in 1 hour)
   */
  getSignedFileUrl: async (storagePath, storageBucket = 'safeed-documents') => {
    if (!storagePath) return null;

    const { data, error } = await supabase.storage
      .from(storageBucket)
      .createSignedUrl(storagePath, 3600);

    if (error) {
      console.error('[documentService] Signed URL creation error:', error.message);
      return null;
    }

    return data?.signedUrl || null;
  },

  /**
   * Delete document by ID
   */
  deleteDocument: async (documentId, storagePath) => {
    if (storagePath) {
      await supabase.storage.from('safeed-documents').remove([storagePath]);
    }
    const { error } = await supabase.from('documents').delete().eq('id', documentId);
    if (error) throw error;
  },
};

export default documentService;
