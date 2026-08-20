import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import { documentApi } from '../../api/apiServices';
import {
  FiFileText, FiCheck, FiX, FiEye, FiClock, FiAlertCircle,
  FiSearch, FiFilter, FiCheckCircle, FiShield, FiUnlock, FiExternalLink
} from 'react-icons/fi';
import { MdVerified, MdLocalPolice } from 'react-icons/md';

const STATUS_CONFIG = {
  PENDING_REVIEW: { label: '⏳ Pending Review', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  VERIFIED: { label: '✓ Verified & Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  REJECTED: { label: '✗ Rejected', color: 'bg-rose-100 text-rose-800 border-rose-300' },
};

export const DocumentApproval = () => {
  const { user } = useAuth();
  const dcpZone = user?.dcpZone;
  const postingStation = user?.postingStation;
  const [docs, setDocs] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [readingDoc, setReadingDoc] = useState(null); // PDF Reader modal state!
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState('');

  const loadDocs = async () => {
    const localDocs = institutionStore.getDocumentsForZone(dcpZone, postingStation);
    try {
      const res = await documentApi.getAssigned({ zone: dcpZone });
      const apiDocs = res.data?.data?.documents || res.data?.documents || [];

      const mergedMap = new Map();
      [...localDocs, ...apiDocs].forEach(d => {
        if (d) {
          const instKey = String(d.institutionId || d.email || d.institutionName || 'inst').toLowerCase().trim();
          let type = (d.documentType || d.type || d.name || '').toUpperCase();
          if (type === 'FIRE_NOC') type = 'FIRE_SAFETY';
          if (type === 'BUILDING_PLAN') type = 'BUILDING_SAFETY';
          if (type === 'AFFILIATION_CERT') type = 'ELECTRICAL_SAFETY';
          if (type === 'EMERGENCY_PLAN') type = 'EVACUATION_SAFETY';

          const key = `${instKey}_${type}`;
          const statusVal = (d.status === 'VERIFIED' || d.verificationStatus === 'APPROVED' || d.verificationStatus === 'VERIFIED') ? 'VERIFIED' : (d.status === 'REJECTED' || d.verificationStatus === 'REJECTED') ? 'REJECTED' : 'PENDING_REVIEW';

          mergedMap.set(key, {
            ...d,
            _id: d._id || d.id || ('doc_' + Date.now()),
            type,
            documentType: type,
            status: statusVal,
            verificationStatus: statusVal === 'VERIFIED' ? 'APPROVED' : statusVal,
          });
        }
      });
      setDocs(Array.from(mergedMap.values()));
    } catch (e) {
      console.warn('[DocumentApproval] API fetch notice:', e?.message);
      setDocs(localDocs);
    }
  };

  useEffect(() => {
    loadDocs();
    // Real-time polling every 5 seconds
    const interval = setInterval(loadDocs, 5000);
    return () => clearInterval(interval);
  }, [user, dcpZone]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleAction = async (docId, action) => {
    setActionLoading(docId + action);

    const status = action === 'approve' ? 'VERIFIED' : 'REJECTED';
    const finalRemarks = remarks || (action === 'approve' ? 'Verified & approved by District Inspector after reviewing PDF content.' : 'Rejected due to incomplete or invalid document details.');

    try {
      if (action === 'approve') {
        await documentApi.approve(docId);
      } else {
        await documentApi.reject(docId, { reason: finalRemarks });
      }
    } catch (e) {
      try {
        await documentApi.verify(docId, {
          action: action === 'approve' ? 'APPROVE' : 'REJECT',
          reason: finalRemarks
        });
      } catch (err) {
        console.warn('[DocumentApproval] Verify API notice:', err?.message);
      }
    }

    // Save in institutionStore (REAL TIME)
    institutionStore.verifyDocument(docId, status, finalRemarks);

    await loadDocs();
    setSelectedDoc(null);
    setReadingDoc(null);
    setRemarks('');
    setActionLoading('');

    showToast(
      action === 'approve'
        ? '✅ Document Approved! Institution compliance score & Safe ID status updated.'
        : '❌ Document Rejected. Institution notified.'
    );
  };

  const pendingCount = docs.filter(d => d.status === 'PENDING_REVIEW').length;
  const verifiedCount = docs.filter(d => d.status === 'VERIFIED').length;
  const rejectedCount = docs.filter(d => d.status === 'REJECTED').length;

  const filtered = docs.filter(d => {
    const matchesFilter = filter === 'ALL' || d.status === filter;
    const matchesSearch = !search || d.institutionName?.toLowerCase().includes(search.toLowerCase()) || d.name?.toLowerCase().includes(search.toLowerCase());
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img src="/up-police-logo.png" alt="UP Police" className="w-7 h-7 object-contain" />
            <h2 className="text-base font-black text-[#0F2038] font-serif">
              Document Verification — {dcpZone} Only (Real-Time)
            </h2>
          </div>
          <p className="text-xs text-slate-500 ml-9">
            Showing only documents from <strong>{dcpZone} zone</strong> institutions. Read PDF then approve or reject. Auto-refreshes every 5s.
          </p>
        </div>
        {/* Inspector Badge */}
        <div className="flex items-center gap-2 bg-[#0F2038] text-[#D4AF37] px-3.5 py-2 rounded-xl text-xs font-black border border-[#D4AF37]">
          <MdLocalPolice size={14} /> {user?.name || 'Inspection Officer'} ({user?.designation || user?.rankLevel || 'Sub-Inspector'}) • {dcpZone}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending Review', value: pendingCount, icon: FiClock, color: 'text-amber-700 bg-amber-50 border-amber-300' },
          { label: 'Approved & Verified', value: verifiedCount, icon: FiCheckCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
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
            placeholder="Search school name or document..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] font-black px-3.5 py-2 rounded-xl border-2 cursor-pointer transition-all ${
                filter === f
                  ? 'bg-[#0F2038] text-[#D4AF37] border-[#D4AF37]'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-[#D4AF37]'
              }`}
            >
              {f === 'ALL' ? 'All Docs' : f === 'PENDING_REVIEW' ? 'Pending ⏳' : f === 'VERIFIED' ? 'Verified ✓' : 'Rejected ✗'}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white border-2 border-slate-200 rounded-2xl space-y-2">
            <FiFileText size={36} className="mx-auto opacity-30" />
            <p className="text-xs font-black text-slate-600">No Documents Found</p>
            <p className="text-[11px]">When an institution uploads a document, it will immediately appear here in real-time for PDF reading and verification.</p>
          </div>
        )}

        {filtered.map(doc => (
          <div key={doc._id} className="bg-white border-2 border-slate-200 hover:border-[#D4AF37] rounded-2xl p-4 transition-all shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#0F2038] rounded-xl flex items-center justify-center flex-shrink-0">
                  <FiFileText size={18} className="text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#0F2038]">{doc.name}</p>
                  <p className="text-[11px] text-slate-600 font-bold">🏫 {doc.institutionName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${STATUS_CONFIG[doc.status]?.color}`}>
                      {STATUS_CONFIG[doc.status]?.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Uploaded: {doc.uploadedAt}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{doc.fileSize}</span>
                  </div>
                  {doc.remarks && (
                    <p className="text-[10px] text-slate-600 font-semibold mt-1 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      Inspector Note: "{doc.remarks}"
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                {/* 📄 Read PDF / View Document Button */}
                <button
                  onClick={() => setReadingDoc(doc)}
                  className="text-xs font-black px-3.5 py-2 bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] rounded-xl hover:bg-[#1E3A5F] transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <FiEye size={13} /> Read PDF / Inspect
                </button>

                {doc.status === 'PENDING_REVIEW' && (
                  <>
                    <button
                      onClick={() => { setSelectedDoc(doc); setRemarks('Approved by District Inspector after reviewing PDF content.'); }}
                      disabled={actionLoading === doc._id + 'approve'}
                      className="text-xs font-black px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer transition-colors flex items-center gap-1 shadow disabled:opacity-50"
                    >
                      <FiCheck size={14} /> Approve ✓
                    </button>
                    <button
                      onClick={() => { setSelectedDoc(doc); setRemarks(''); }}
                      disabled={actionLoading === doc._id + 'reject'}
                      className="text-xs font-black px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer transition-colors flex items-center gap-1 shadow disabled:opacity-50"
                    >
                      <FiX size={14} /> Reject ✗
                    </button>
                  </>
                )}

                {doc.status !== 'PENDING_REVIEW' && (
                  <button
                    onClick={() => { setSelectedDoc(doc); setRemarks(doc.remarks || ''); }}
                    className="text-[11px] font-bold text-slate-500 hover:text-[#0F2038] underline cursor-pointer"
                  >
                    Edit Status
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 📄 PDF / DOCUMENT READER MODAL FOR INSPECTOR */}
      {readingDoc && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl border-4 border-[#D4AF37] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#0F2038] p-4 flex items-center justify-between text-white border-b-2 border-[#D4AF37]">
              <div className="flex items-center gap-3">
                <img src="/up-police-logo.png" alt="UP Police" className="w-8 h-8 object-contain" />
                <div>
                  <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                    Inspector PDF Reader & Audit Desk — {readingDoc.name}
                  </p>
                  <p className="text-[10px] text-slate-300">
                    Institution: <strong>{readingDoc.institutionName}</strong> • Type: {readingDoc.type} • Uploaded: {readingDoc.uploadedAt}
                  </p>
                </div>
              </div>
              <button onClick={() => setReadingDoc(null)} className="text-white hover:text-[#D4AF37] font-black text-lg p-1">✕</button>
            </div>

            {/* Document Content View */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#F4F6F9]">
              {(() => {
                const targetUrl = readingDoc.fileDataUrl || (readingDoc.fileUrl?.startsWith('http') ? readingDoc.fileUrl : `/api/v1/documents/${readingDoc._id}/file`);
                const isImage = (typeof targetUrl === 'string' && targetUrl.startsWith('data:image')) || readingDoc.fileMimeType?.startsWith('image/') || readingDoc.fileUrl?.match(/\.(jpg|jpeg|png|webp)$/i);
                return (
                  <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-[#0F2038] shadow">
                    {isImage ? (
                      <img
                        src={targetUrl}
                        alt={readingDoc.name || readingDoc.title}
                        className="max-w-full h-auto mx-auto"
                      />
                    ) : (
                      <iframe
                        src={targetUrl}
                        title={readingDoc.name || readingDoc.title}
                        className="w-full h-[550px]"
                      />
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Inspector Action Bar */}
            <div className="p-4 bg-slate-100 border-t-2 border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs font-black text-[#0F2038]">
                Read Document & Verify Status for {readingDoc.institutionName}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(readingDoc._id, 'reject')}
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

      {/* Quick Approve / Reject Remarks Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border-4 border-[#D4AF37] overflow-hidden">
            <div className="bg-[#0F2038] p-4 flex items-center gap-3 text-white border-b-2 border-[#D4AF37]">
              <img src="/up-police-logo.png" alt="UP Police" className="w-8 h-8 object-contain" />
              <div>
                <p className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Inspector Document Verification</p>
                <p className="text-[10px] text-slate-300">{selectedDoc.name} — {selectedDoc.institutionName}</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-1 border border-slate-200 font-semibold">
                <p><span className="text-slate-500">Institution:</span> <strong className="text-[#0F2038]">{selectedDoc.institutionName}</strong></p>
                <p><span className="text-slate-500">Document Name:</span> <strong className="text-[#0F2038]">{selectedDoc.name}</strong></p>
                <p><span className="text-slate-500">Type:</span> {selectedDoc.type?.replace('_', ' ')}</p>
                <p><span className="text-slate-500">Uploaded By:</span> {selectedDoc.uploadedBy}</p>
              </div>

              <div>
                <label className="text-xs font-black text-[#0F2038] block mb-1.5">Inspector Verification Remarks</label>
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Enter inspection remarks for the school (e.g. Fire NOC verified, valid till 2026)..."
                  className="w-full text-xs border-2 border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setSelectedDoc(null); setRemarks(''); }}
                  className="flex-1 text-xs font-black py-3 border-2 border-slate-300 text-slate-600 rounded-xl hover:border-slate-500 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction(selectedDoc._id, 'reject')}
                  disabled={!!actionLoading}
                  className="flex-1 text-xs font-black py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <FiX size={14} /> Reject ✗
                </button>
                <button
                  onClick={() => handleAction(selectedDoc._id, 'approve')}
                  disabled={!!actionLoading}
                  className="flex-1 text-xs font-black py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1 shadow-lg"
                >
                  {actionLoading ? 'Saving...' : <><FiCheck size={14} /> Approve ✓</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
