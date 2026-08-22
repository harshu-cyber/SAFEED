// ============================================================
// SAFEED-UP — Institution Document Vault (Supabase Powered)
// Direct Supabase Storage Binary Upload & Signed URL Reader
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { documentService } from '../../services/documentService';
import {
  FiUpload, FiFileText, FiCheckCircle, FiClock, FiX,
  FiShield, FiCheck, FiLock, FiAlertCircle, FiEye
} from 'react-icons/fi';

const CANONICAL_DOC_TYPES = [
  { value: 'FIRE_SAFETY', label: 'Fire Safety Certificate (अग्नि शमन प्रमाणपत्र)' },
  { value: 'BUILDING_STRUCTURAL_SAFETY', label: 'Building Structural Safety Certificate (भवन सुरक्षा प्रमाणपत्र)' },
  { value: 'ELECTRICAL_SAFETY', label: 'Electrical Safety Certificate (विद्युत सुरक्षा ऑडिट)' },
  { value: 'EVACUATION_PLAN', label: 'Emergency Evacuation Plan (आपातकालीन निकासी योजना)' },
];

export const DocumentsPage = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentType, setDocumentType] = useState('FIRE_SAFETY');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [viewDoc, setViewDoc] = useState(null);
  const [signedUrl, setSignedUrl] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const instId = user?.institutionId || user?.institution_id || user?._id;
      const docs = await documentService.getMyDocuments(instId);
      setDocuments(docs || []);
    } catch (err) {
      console.error('[DocumentsPage] Fetch error:', err);
      setErrorMsg(err.message || 'Failed to fetch documents from Supabase.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!file) {
      setErrorMsg('Please select a valid document file to upload.');
      return;
    }

    setUploading(true);

    try {
      const instId = user?.institutionId || user?.institution_id || user?._id;
      await documentService.uploadDocument({
        file,
        documentType,
        institutionId: instId,
        userId: user?.id || user?._id,
      });

      setToast('✅ Document uploaded successfully to Supabase Storage! Sent to District Inspector.');
      setFile(null);
      await loadDocuments();
    } catch (error) {
      console.error('[DocumentsPage] Upload error:', error);
      setErrorMsg(error.message || 'Failed to upload document to Supabase.');
    } finally {
      setUploading(false);
      setTimeout(() => setToast(''), 5000);
    }
  };

  const handleViewDoc = async (doc) => {
    setViewDoc(doc);
    setSignedUrl('');
    const path = doc.storage_path || doc.storagePath;
    if (path) {
      const url = await documentService.getSignedFileUrl(path, doc.storage_bucket || 'safeed-documents');
      setSignedUrl(url || '');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="bg-emerald-800 text-emerald-100 font-black text-xs px-4 py-3 rounded-xl shadow-xl border border-emerald-400 animate-fade-in flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="text-white hover:text-emerald-300 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-950 text-rose-200 font-bold text-xs px-4 py-3 rounded-xl shadow-xl border border-rose-600 flex items-center justify-between">
          <span className="flex items-center gap-2"><FiAlertCircle size={16} /> {errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-white hover:text-rose-300 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <img src="/up-police-logo.png" alt="UP Police" className="w-6 h-6 object-contain" />
          <span className="text-[10px] font-black text-[#D4AF37] bg-[#0F2038] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            UP Police Document Vault (Supabase)
          </span>
        </div>
        <h1 className="text-xl font-black text-[#0F2038] font-serif">Official Document Verification — SAFEED-UP</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload required safety certificates directly to Supabase Storage. District Inspector will review and verify binary content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-1 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <FiUpload className="text-[#D4AF37] text-base" />
            <h2 className="text-sm font-black text-[#0F2038]">Upload Canonical Document</h2>
          </div>

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            <div>
              <label className="block font-black text-[#0F2038] mb-1">Canonical Document Type <span className="text-rose-500">*</span></label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                {CANONICAL_DOC_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-black text-[#0F2038] mb-1">Select File (PDF, DOC/DOCX, PNG, JPG) <span className="text-rose-500">*</span></label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                required
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#0F2038] file:text-[#D4AF37] hover:file:bg-[#1E3A5F] cursor-pointer"
              />
              {file && (
                <p className="mt-1.5 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-300 p-2 rounded-lg flex items-center gap-1.5">
                  ✓ Selected File: <span>{file.name}</span> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-[11px] text-amber-800 font-semibold space-y-1">
              <p className="font-black flex items-center gap-1"><FiLock size={12} /> Supabase Secure Storage:</p>
              <p>Uploaded binary document goes to bucket safeed-documents. Assigned Inspector streams the binary PDF to review and approve.</p>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black py-3 rounded-xl hover:bg-[#1E3A5F] transition-all cursor-pointer shadow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading ? 'Uploading to Supabase Storage...' : <><FiUpload size={14} /> Upload Document</>}
            </button>
          </form>
        </div>

        {/* Uploaded Documents Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <FiFileText className="text-[#D4AF37] text-base" />
                <h2 className="text-sm font-black text-[#0F2038]">Uploaded Document Verification Records</h2>
              </div>
              <span className="text-xs font-black text-slate-500">{documents.length} Files</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400 font-bold text-xs">Loading documents from Supabase...</div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FiFileText size={36} className="mx-auto opacity-30" />
                <p className="text-xs font-black text-slate-600">No Documents Found</p>
                <p className="text-[11px]">Upload your safety certificates using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const docTitle = doc.original_file_name || doc.originalFileName || doc.document_type;
                  const docCategory = doc.document_type || doc.documentType;
                  const docStatus = doc.status || 'PENDING_REVIEW';
                  const isVerified = docStatus === 'APPROVED';
                  const isRejected = docStatus === 'REJECTED';
                  const fileSize = doc.file_size || doc.fileSize;
                  const formattedSize = fileSize ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A';
                  const uploadedAt = doc.uploaded_at || doc.uploadedAt || doc.created_at;

                  return (
                    <div key={doc.id || doc._id} className="bg-[#F4F6F9] border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D4AF37] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#0F2038] text-[#D4AF37] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiFileText size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#0F2038]">{docTitle}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{docCategory} • Size: {formattedSize} • Uploaded: {uploadedAt ? new Date(uploadedAt).toLocaleDateString('en-IN') : 'N/A'}</p>
                          {(doc.rejection_reason || doc.rejectionReason) && (
                            <p className="text-[10px] text-rose-700 italic mt-0.5">Rejection reason: "{doc.rejection_reason || doc.rejectionReason}"</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleViewDoc(doc)}
                          className="text-[11px] font-black px-3 py-1.5 bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] rounded-xl hover:bg-[#1E3A5F] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <FiEye size={12} /> Read PDF
                        </button>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {isVerified ? '✓ APPROVED BY INSPECTOR' : isRejected ? '✗ REJECTED' : '⏳ PENDING REVIEW'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF / Document Reader Modal */}
      {viewDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl border-4 border-[#D4AF37] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0F2038] p-4 flex items-center justify-between text-white border-b-2 border-[#D4AF37]">
              <div className="flex items-center gap-3">
                <img src="/up-govt-seal.png" alt="UP Seal" className="w-8 h-8 object-contain" />
                <div>
                  <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Supabase Document Reader — {viewDoc.original_file_name || viewDoc.originalFileName}</p>
                  <p className="text-[10px] text-slate-300">Type: {viewDoc.document_type || viewDoc.documentType} • ID: {viewDoc.id || viewDoc._id}</p>
                </div>
              </div>
              <button onClick={() => setViewDoc(null)} className="text-white hover:text-[#D4AF37] font-black text-lg p-1">✕</button>
            </div>

            {/* Document Binary Stream Viewer */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#F4F6F9]">
              {signedUrl ? (
                <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow p-2 flex items-center justify-center min-h-[400px]">
                  {(viewDoc.mime_type || viewDoc.mimeType || '').startsWith('image/') ? (
                    <img src={signedUrl} alt={viewDoc.original_file_name} className="max-w-full h-auto max-h-[600px] mx-auto object-contain" />
                  ) : (
                    <object data={signedUrl} type={viewDoc.mime_type || 'application/pdf'} className="w-full h-[550px]">
                      <embed src={signedUrl} type={viewDoc.mime_type || 'application/pdf'} className="w-full h-[550px]" />
                      <div className="p-4 text-center">
                        <p className="text-xs font-bold text-slate-700 mb-2">Binary PDF Stream Ready</p>
                        <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="bg-[#0F2038] text-[#D4AF37] text-xs font-black px-4 py-2 rounded-lg inline-block">
                          Open PDF Stream 📥
                        </a>
                      </div>
                    </object>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-bold text-xs">Generating secure Supabase signed URL...</div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewDoc(null)}
                className="bg-[#0F2038] text-[#D4AF37] font-black text-xs px-5 py-2.5 rounded-xl border border-[#D4AF37]"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
