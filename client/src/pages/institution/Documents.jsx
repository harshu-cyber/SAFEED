import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import { documentApi } from '../../api/apiServices';
import {
  FiUpload, FiFileText, FiCheckCircle, FiClock, FiX,
  FiShield, FiCheck, FiLock, FiAlertCircle, FiEye
} from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';

const DOC_TYPES = [
  { value: 'FIRE_SAFETY', label: 'Fire Safety Certificate (अग्नि शमन प्रमाणपत्र)' },
  { value: 'BUILDING_SAFETY', label: 'Building Structural Safety Certificate (भवन सुरक्षा प्रमाणपत्र)' },
  { value: 'ELECTRICAL_SAFETY', label: 'Electrical Safety Audit Report (विद्युत सुरक्षा ऑडिट)' },
  { value: 'EVACUATION_SAFETY', label: 'Emergency Evacuation Plan (आपातकालीन निकासी योजना)' },
];

export const DocumentsPage = () => {
  const { user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('FIRE_SAFETY');
  const [file, setFile] = useState(null);
  const [fileDataUrl, setFileDataUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [viewDoc, setViewDoc] = useState(null);

  const getTargetInstId = () => {
    return user?.institutionId || user?._id || user?.id || user?.email || user?.name || 'inst_user';
  };

  const loadData = async () => {
    const instId = getTargetInstId();
    if (instId) {
      try {
        const res = await documentApi.getForInstitution(instId);
        const docs = res.data?.data?.documents || res.data?.documents || [];
        setDocuments(Array.isArray(docs) ? docs : []);
        return;
      } catch (e) {
        console.warn('[DocumentsPage] MongoDB fetch notice:', e?.message);
        setDocuments([]);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileDataUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const instId = getTargetInstId();
    if (!instId) {
      setErrorMsg('Unable to determine institution ID. Please re-login.');
      return;
    }

    if (!file) {
      setErrorMsg('Please select a PDF or image file to upload.');
      return;
    }

    setUploading(true);

    try {
      const docName = name || DOC_TYPES.find(t => t.value === type)?.label.split(' (')[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', type);
      formData.append('title', docName);

      const response = await documentApi.upload(instId, formData);
      if (response.data?.success || response.data?.document) {
        setToast('✅ Document uploaded successfully to MongoDB GridFS! Sent to Inspector for verification.');
        setName('');
        setFile(null);
        setFileDataUrl(null);
        await loadData();
        setTimeout(() => setToast(''), 5000);
      }
    } catch (error) {
      console.error('[DocumentsPage] Upload error:', error);
      setErrorMsg(error?.response?.data?.message || 'Failed to upload document to backend API.');
    } finally {
      setUploading(false);
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

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <img src="/up-police-logo.png" alt="UP Police" className="w-6 h-6 object-contain" />
          <span className="text-[10px] font-black text-[#D4AF37] bg-[#0F2038] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            UP Police Document Vault
          </span>
        </div>
        <h1 className="text-xl font-black text-[#0F2038] font-serif">Official Document Vault — {institution?.name}</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload required safety certificates. District Inspector will open and inspect your uploaded PDF/document to verify.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-1 bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <FiUpload className="text-[#D4AF37] text-base" />
            <h2 className="text-sm font-black text-[#0F2038]">Upload New Document</h2>
          </div>

          <form onSubmit={handleUpload} className="space-y-4 text-xs">
            <div>
              <label className="block font-black text-[#0F2038] mb-1">Document Category <span className="text-rose-500">*</span></label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
              >
                {DOC_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-black text-[#0F2038] mb-1">Custom Document Title (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fire NOC Certificate 2025-26"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block font-black text-[#0F2038] mb-1">Select File (PDF, PNG, JPG) <span className="text-rose-500">*</span></label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                required
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#0F2038] file:text-[#D4AF37] hover:file:bg-[#1E3A5F] cursor-pointer"
              />
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-[11px] text-amber-800 font-semibold space-y-1">
              <p className="font-black flex items-center gap-1"><FiLock size={12} /> Inspection Approval Rule:</p>
              <p>Uploaded PDF/Image goes directly to the District Inspector. They will read and verify it to unlock your Safe ID certificate.</p>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black py-3 rounded-xl hover:bg-[#1E3A5F] transition-all cursor-pointer shadow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading ? 'Uploading Document...' : <><FiUpload size={14} /> Upload & Submit for Inspector PDF Verification</>}
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

            {documents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <FiFileText size={36} className="mx-auto opacity-30" />
                <p className="text-xs font-black text-slate-600">No Documents Uploaded Yet</p>
                <p className="text-[11px]">Use the form on the left to upload your Fire NOC and Safety certificates.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const docTitle = doc.title || doc.name || doc.documentType || 'Official Document';
                  const docCategory = (doc.documentType || doc.type || '').replace(/_/g, ' ');
                  const docStatus = doc.verificationStatus || doc.status || 'PENDING';
                  const isVerified = docStatus === 'APPROVED' || docStatus === 'VERIFIED';
                  const isRejected = docStatus === 'REJECTED';

                  return (
                    <div key={doc._id || doc.id || Math.random()} className="bg-[#F4F6F9] border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D4AF37] transition-all">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#0F2038] text-[#D4AF37] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiFileText size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#0F2038]">{docTitle}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{docCategory} • Uploaded: {doc.uploadedAt || 'Recently'} • Size: {doc.fileSize || '1.4 MB'}</p>
                          {doc.remarks && (
                            <p className="text-[10px] text-slate-600 italic mt-0.5">"{doc.remarks}"</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setViewDoc(doc)}
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
                          {isVerified ? '✓ VERIFIED BY INSPECTOR' : isRejected ? '✗ REJECTED' : '⏳ PENDING INSPECTOR APPROVAL'}
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
                  <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Official Document Reader — {viewDoc.title || viewDoc.name}</p>
                  <p className="text-[10px] text-slate-300">Institution: {viewDoc.institutionName || 'SafeED Portal'} • Type: {viewDoc.documentType || viewDoc.type}</p>
                </div>
              </div>
              <button onClick={() => setViewDoc(null)} className="text-white hover:text-[#D4AF37] font-black text-lg p-1">✕</button>
            </div>

            {/* Document Viewer Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#F4F6F9]">
              {(() => {
                const targetUrl = viewDoc.fileUrl || viewDoc.fileDataUrl || `/api/v1/documents/${viewDoc._id}/file`;
                const isImage = typeof targetUrl === 'string' && (targetUrl.startsWith('data:image') || targetUrl.match(/\.(jpg|jpeg|png|webp)$/i));
                return (
                  <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow p-2">
                    {isImage ? (
                      <img src={targetUrl} alt={viewDoc.title || viewDoc.name} className="max-w-full h-auto mx-auto" />
                    ) : (
                      <iframe src={targetUrl} title={viewDoc.title || viewDoc.name} className="w-full h-[500px]" />
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewDoc(null)}
                className="bg-[#0F2038] text-[#D4AF37] font-black text-xs px-5 py-2.5 rounded-xl border border-[#D4AF37]"
              >
                Close Document Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
