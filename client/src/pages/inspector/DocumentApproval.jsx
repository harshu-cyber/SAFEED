import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { documentApi } from '../../api/apiServices';
import {
  FiFileText, FiCheck, FiX, FiEye, FiClock, FiAlertCircle,
  FiSearch, FiFilter, FiCheckCircle, FiShield, FiUnlock
} from 'react-icons/fi';
import { MdLocalPolice } from 'react-icons/md';

const STATUS_CONFIG = {
  PENDING_REVIEW: { label: '⏳ Pending Review', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  APPROVED: { label: '✓ Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  REJECTED: { label: '✗ Rejected', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

export const DocumentApproval = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [readingDoc, setReadingDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState('');

  const loadDocs = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await documentApi.getAssigned();
      const apiDocs = res.data?.data?.documents || res.data?.documents || [];
      setDocs(apiDocs);
    } catch (e) {
      console.error('[DocumentApproval] API fetch error:', e);
      setErrorMsg(e.response?.data?.message || 'Failed to fetch assigned documents from server.');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
    const interval = setInterval(loadDocs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleAction = async (docId, action) => {
    setActionLoading(docId + action);
    setErrorMsg('');

    try {
      if (action === 'approve') {
        await documentApi.approve(docId);
        showToast('✅ Document Approved! Status saved to MongoDB.');
      } else {
        await documentApi.reject(docId, { reason: rejectionReason || 'Rejected by Inspector' });
        showToast('❌ Document Rejected. Status saved to MongoDB.');
      }
      await loadDocs();
      setSelectedDoc(null);
      setReadingDoc(null);
      setRejectionReason('');
    } catch (err) {
      console.error('[DocumentApproval] Action error:', err);
      setErrorMsg(err.response?.data?.message || 'Action failed on server.');
    } finally {
      setActionLoading('');
    }
  };

  const pendingCount = docs.filter(d => d.status === 'PENDING_REVIEW').length;
  const approvedCount = docs.filter(d => d.status === 'APPROVED').length;
  const rejectedCount = docs.filter(d => d.status === 'REJECTED').length;

  const filtered = docs.filter(d => {
    const matchesFilter = filter === 'ALL' || d.status === filter;
    const matchesSearch = !search ||
      d.institutionName?.toLowerCase().includes(search.toLowerCase()) ||
      d.originalFileName?.toLowerCase().includes(search.toLowerCase()) ||
      d.documentType?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#0F2038] text-[#D4AF37] font-black text-xs px-4 py-3 rounded-xl shadow-2xl border-2 border-[#D4AF37] animate-fade-in max-w-md">
          {toast}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img src="/up-police-logo.png" alt="UP Police" className="w-7 h-7 object-contain" />
            <h2 className="text-base font-black text-[#0F2038] font-serif">
              Inspector Document Verification Desk
            </h2>
          </div>
          <p className="text-xs text-slate-500 ml-9">
            Single Source of Truth: Reading directly from MongoDB Document Collection and GridFS Binary Storage.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#0F2038] text-[#D4AF37] px-3.5 py-2 rounded-xl text-xs font-black border border-[#D4AF37]">
          <MdLocalPolice size={14} /> {user?.name || 'Inspection Officer'} ({user?.role || 'INSPECTION_OFFICER'})
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Review', value: pendingCount, icon: FiClock, color: 'text-amber-700 bg-amber-50 border-amber-300' },
          { label: 'Approved', value: approvedCount, icon: FiCheckCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
          { label: 'Rejected', value: rejectedCount, icon: FiX, color: 'text-rose-700 bg-rose-50 border-rose-300' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-2xl border-2 p-4 text-center ${color}`}>
            <Icon size={20} className="mx-auto mb-1" />
            <p className="text-xl font-black">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search school name, document type or file name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] font-black px-3.5 py-2 rounded-xl border-2 cursor-pointer transition-all ${
                filter === f
                  ? 'bg-[#0F2038] text-[#D4AF37] border-[#D4AF37]'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-[#D4AF37]'
              }`}
            >
              {f === 'ALL' ? 'All Docs' : f === 'PENDING_REVIEW' ? 'Pending ⏳' : f === 'APPROVED' ? 'Approved ✓' : 'Rejected ✗'}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400 font-bold text-xs bg-white border-2 border-slate-200 rounded-2xl">
            Fetching assigned documents from MongoDB...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white border-2 border-slate-200 rounded-2xl space-y-2">
            <FiFileText size={36} className="mx-auto opacity-30" />
            <p className="text-xs font-black text-slate-600">No Assigned Documents Found</p>
            <p className="text-[11px]">When institutions upload safety certificates, they will appear here in real-time for PDF streaming and verification.</p>
          </div>
        ) : (
          filtered.map(doc => {
            const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.PENDING_REVIEW;
            const fileSizeMB = doc.fileSize ? (doc.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB';

            return (
              <div key={doc._id} className="bg-white border-2 border-slate-200 hover:border-[#D4AF37] rounded-2xl p-4 transition-all shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#0F2038] rounded-xl flex items-center justify-center flex-shrink-0">
                      <FiFileText size={18} className="text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#0F2038]">{doc.originalFileName}</p>
                      <p className="text-[11px] text-slate-600 font-bold">🏫 {doc.institutionName} • Type: {doc.documentType}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{fileSizeMB}</span>
                      </div>
                      {doc.rejectionReason && (
                        <p className="text-[10px] text-rose-700 font-semibold mt-1 italic bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Rejection Reason: "{doc.rejectionReason}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {/* Read PDF Button */}
                    <button
                      onClick={() => setReadingDoc(doc)}
                      className="text-xs font-black px-3.5 py-2 bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] rounded-xl hover:bg-[#1E3A5F] transition-all flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <FiEye size={13} /> Read PDF / Inspect Stream
                    </button>

                    {doc.status === 'PENDING_REVIEW' && (
                      <>
                        <button
                          onClick={() => handleAction(doc._id, 'approve')}
                          disabled={actionLoading === doc._id + 'approve'}
                          className="text-xs font-black px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer transition-colors flex items-center gap-1 shadow disabled:opacity-50"
                        >
                          <FiCheck size={14} /> Approve ✓
                        </button>
                        <button
                          onClick={() => { setSelectedDoc(doc); setRejectionReason(''); }}
                          disabled={actionLoading === doc._id + 'reject'}
                          className="text-xs font-black px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer transition-colors flex items-center gap-1 shadow disabled:opacity-50"
                        >
                          <FiX size={14} /> Reject ✗
                        </button>
                      </>
                    )}

                    {doc.status !== 'PENDING_REVIEW' && (
                      <button
                        onClick={() => { setSelectedDoc(doc); setRejectionReason(doc.rejectionReason || ''); }}
                        className="text-[11px] font-bold text-slate-500 hover:text-[#0F2038] underline cursor-pointer"
                      >
                        Change Status
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PDF Stream Viewer Modal */}
      {readingDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl border-4 border-[#D4AF37] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0F2038] p-4 flex items-center justify-between text-white border-b-2 border-[#D4AF37]">
              <div className="flex items-center gap-3">
                <img src="/up-police-logo.png" alt="UP Police" className="w-8 h-8 object-contain" />
                <div>
                  <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                    Inspector Binary PDF Reader — {readingDoc.originalFileName}
                  </p>
                  <p className="text-[10px] text-slate-300">
                    Institution: <strong>{readingDoc.institutionName}</strong> • Type: {readingDoc.documentType} • Mongo ID: {readingDoc._id}
                  </p>
                </div>
              </div>
              <button onClick={() => setReadingDoc(null)} className="text-white hover:text-[#D4AF37] font-black text-lg p-1">✕</button>
            </div>

            {/* Binary Stream Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#F4F6F9]">
              {(() => {
                const storedToken = localStorage.getItem('accessToken');
                const rawProxyUrl = documentApi.getFileUrl(readingDoc._id);
                const tokenProxyUrl = storedToken ? `${rawProxyUrl}?token=${encodeURIComponent(storedToken)}` : rawProxyUrl;
                const targetUrl = readingDoc.cloudinarySecureUrl || readingDoc.fileUrl || tokenProxyUrl;
                const isImage = readingDoc.mimeType?.startsWith('image/');
                return (
                  <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-[#0F2038] shadow">
                    {isImage ? (
                      <img
                        src={targetUrl}
                        alt={readingDoc.originalFileName}
                        className="max-w-full h-auto mx-auto"
                      />
                    ) : (
                      <object data={targetUrl} type={readingDoc.mimeType || 'application/pdf'} className="w-full h-[550px]">
                        <embed src={targetUrl} type={readingDoc.mimeType || 'application/pdf'} className="w-full h-[550px]" />
                        <div className="p-4 text-center text-white">
                          <p className="text-xs font-bold mb-2">Binary PDF Stream Ready</p>
                          <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="bg-[#D4AF37] text-[#0F2038] text-xs font-black px-4 py-2 rounded-lg inline-block">
                            Open PDF Binary Stream in New Tab ↗
                          </a>
                        </div>
                      </object>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Inspector Action Bar */}
            <div className="p-4 bg-slate-100 border-t-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-black text-[#0F2038]">
                Inspector Action for {readingDoc.institutionName}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setReadingDoc(null); setSelectedDoc(readingDoc); }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow flex items-center gap-1"
                >
                  <FiX size={14} /> Reject ✗
                </button>
                <button
                  onClick={() => handleAction(readingDoc._id, 'approve')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow flex items-center gap-1"
                >
                  <FiCheck size={14} /> Approve Document ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border-4 border-[#D4AF37] overflow-hidden">
            <div className="bg-[#0F2038] p-4 flex items-center gap-3 text-white border-b-2 border-[#D4AF37]">
              <img src="/up-police-logo.png" alt="UP Police" className="w-8 h-8 object-contain" />
              <div>
                <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Inspector Rejection Action</p>
                <p className="text-[10px] text-slate-300">{selectedDoc.originalFileName} — {selectedDoc.institutionName}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-[#0F2038] block mb-1.5">Rejection Reason <span className="text-rose-500">*</span></label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Enter clear rejection reason for the institution..."
                  className="w-full text-xs border-2 border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setSelectedDoc(null); setRejectionReason(''); }}
                  className="flex-1 text-xs font-black py-3 border-2 border-slate-300 text-slate-600 rounded-xl hover:border-slate-500 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedDoc._id, 'reject')}
                  disabled={!rejectionReason.trim() || !!actionLoading}
                  className="flex-1 text-xs font-black py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  Confirm Rejection ✗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
