import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import {
  FiShield, FiFileText, FiAlertTriangle, FiCheckSquare, FiCalendar,
  FiDownload, FiEye, FiUpload, FiClock, FiAward, FiLock, FiUnlock,
  FiCheck, FiX, FiSend
} from 'react-icons/fi';
import { MdVerified, MdQrCode2 } from 'react-icons/md';

const DocStatusBadge = ({ status }) => {
  const map = {
    VERIFIED: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    PENDING_REVIEW: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    REJECTED: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${map[status] || 'bg-slate-100 text-slate-600 border-slate-300'}`}>
      {status === 'VERIFIED' ? '✓ VERIFIED BY INSPECTOR' : status === 'PENDING_REVIEW' ? '⏳ SUBMITTED (PENDING REVIEW)' : status === 'REJECTED' ? '✗ REJECTED' : status}
    </span>
  );
};

const CircleProgress = ({ value, color, size = 80 }) => {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth="7" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill="#ffffff">{value}%</text>
    </svg>
  );
};

export const InstitutionDashboard = () => {
  const { user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isProfileDone, setIsProfileDone] = useState(false);
  const [toast, setToast] = useState('');
  const [showRectificationModal, setShowRectificationModal] = useState(false);
  const [rectificationNotes, setRectificationNotes] = useState('');

  const loadData = () => {
    const inst = institutionStore.getInstitutionByIdOrEmail(user?.institutionId || user?.email);
    if (inst) {
      setInstitution(inst);
      const docs = institutionStore.getDocumentsForInstitution(inst._id);
      setDocuments(docs);
      setIsUnlocked(institutionStore.isCertificateUnlocked(inst._id));
      setIsProfileDone(institutionStore.isProfileComplete(inst._id));
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 5s for real-time document verification updates
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRectificationSubmit = (e) => {
    e.preventDefault();
    if (!rectificationNotes.trim()) return;
    const updated = institutionStore.submitRectification(institution._id, { notes: rectificationNotes.trim() });
    if (updated) setInstitution(updated);
    setShowRectificationModal(false);
    setRectificationNotes('');
    setToast('✅ Rectification report submitted to Safety Inspectors for physical re-inspection!');
  };

  if (!institution) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-black text-[#0F2038]">Loading Institution Profile...</p>
      </div>
    );
  }

  const verifiedDocsCount = documents.filter(d => d.status === 'VERIFIED').length;
  const pendingDocsCount  = documents.filter(d => d.status === 'PENDING_REVIEW').length;

  const requiredDocTypes = [
    { type: 'FIRE_NOC',         label: 'Fire Safety NOC' },
    { type: 'STRUCTURAL_SAFETY', label: 'Building Structural Safety' },
    { type: 'ELECTRICAL_SAFETY', label: 'Electrical Safety Audit' },
    { type: 'EMERGENCY_PLAN',   label: 'Emergency Evacuation Plan' },
  ];

  // Total steps needed to unlock certificate
  const profileStep = {
    label: 'Institution Profile (Students & Staff Data)',
    done: isProfileDone,
    pending: false,
    path: '/dashboard/institution/profile',
    isProfile: true,
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs px-4 py-3 rounded-2xl shadow-2xl animate-fade-in flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="text-white hover:text-[#D4AF37] font-bold ml-4">✕</button>
        </div>
      )}

      {/* 🚨 OFFICIAL QR CODE LOCKED ENFORCEMENT BANNER */}
      {institution.qrLocked && (
        <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 text-white rounded-3xl p-5 border-4 border-rose-500 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg border-2 border-white/30 animate-pulse">
                🚨
              </div>
              <div>
                <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest bg-rose-950 px-2.5 py-0.5 rounded-full border border-rose-700">
                  OFFICIAL ENFORCEMENT NOTICE
                </span>
                <h2 className="text-base sm:text-lg font-black text-white font-serif mt-0.5">
                  YOUR GENERATED QR CERTIFICATE IS REVOKED &amp; LOCKED BY AUTHORITIES
                </h2>
                <p className="text-xs text-rose-200">
                  Issued by: <strong className="text-white">{institution.qrLockedBy}</strong> · Date: {institution.qrLockedAt}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRectificationModal(true)}
              className="bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 cursor-pointer transition-all border-2 border-amber-300"
            >
              <FiSend size={15} /> 🛠️ Submit Rectification &amp; Request Re-Inspection
            </button>
          </div>

          <div className="bg-black/40 border-2 border-rose-500/40 rounded-2xl p-4 text-xs space-y-1">
            <p className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Formal Notice Reason / Identified Compliance Issues:</p>
            <p className="text-slate-100 font-medium text-xs sm:text-sm bg-rose-950/60 p-3 rounded-xl border border-rose-800 break-words">{institution.qrLockNotice}</p>
          </div>

          {institution.rectificationSubmitted && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-3 text-xs text-emerald-200 flex items-center justify-between flex-wrap gap-2">
              <span>✅ <strong>Rectification Report Submitted:</strong> "{institution.rectificationNotes}" (Awaiting Inspector Physical Re-Inspection)</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono">Submitted on {institution.rectificationSubmittedAt}</span>
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-[#D4AF37] bg-[#0F2038] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#D4AF37]">
              {institution.type} PORTAL
            </span>
            <span className="text-xs text-slate-500 font-semibold">Government of Uttar Pradesh</span>
          </div>
          <h1 className="text-xl font-black text-[#0F2038] font-serif">{institution.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <MdVerified size={14} className={institution.status === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-500'} />
            <span className="font-mono text-xs text-[#0F2038] font-black">{institution.safeId}</span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold">{institution.district}, Uttar Pradesh</span>
            <span className="text-slate-300">•</span>
            <span>Principal: <strong>{institution.principal}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Locked / Unlocked Safe ID Button */}
          {isUnlocked ? (
            <Link
              to="/dashboard/institution/safe-id"
              className="flex items-center gap-2 text-xs font-black text-[#0F2038] bg-gradient-to-r from-[#D4AF37] to-amber-500 border-2 border-[#D4AF37] px-4 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-md cursor-pointer"
            >
              <FiUnlock size={14} /> View Safe ID & Certificate 🔓
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-xs font-black text-amber-900 bg-amber-100 border-2 border-amber-400 px-4 py-2.5 rounded-xl cursor-not-allowed opacity-90">
              <FiLock size={14} className="text-amber-800" /> Safe ID Certificate Locked 🔒
            </div>
          )}

          <Link
            to="/dashboard/institution/documents"
            className="flex items-center gap-2 text-xs font-black text-[#D4AF37] bg-[#0F2038] border-2 border-[#D4AF37] px-4 py-2.5 rounded-xl hover:bg-[#1E3A5F] transition-all shadow-md cursor-pointer"
          >
            <FiUpload size={14} /> Upload Safety Document
          </Link>
        </div>
      </div>

      {/* DYNAMIC LOCK WARNING BANNER (Shows Live Ticks/Clocks/Crosses) */}
      {!isUnlocked && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-black shadow">
                🔒
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950">Certificate & Safe ID Currently Locked</h3>
                <p className="text-xs text-amber-900 font-semibold mt-0.5">
                  Complete your institution profile (with total students) AND upload all 4 required safety documents. Once the DCP Inspector verifies them, your Safe ID & QR Certificate will automatically unlock.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {!isProfileDone && (
                <Link
                  to="/dashboard/institution/profile"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow"
                >
                  Fill Profile →
                </Link>
              )}
              <Link
                to="/dashboard/institution/documents"
                className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow"
              >
                Upload Docs →
              </Link>
            </div>
          </div>

          {/* DYNAMIC LIVE TRACKER — Profile + 4 Documents */}
          <div className="pt-2 border-t border-amber-200">
            <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-2">
              Verification Tracker — Complete All Steps to Unlock (लाइव ट्रैक):
            </p>
            <div className="flex gap-2 flex-wrap">

              {/* Step 0: Profile */}
              <Link to="/dashboard/institution/profile">
                <span className={`text-[11px] font-black px-3 py-1.5 rounded-xl border-2 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                  isProfileDone
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {isProfileDone
                    ? <span className="w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">✓</span>
                    : <span className="w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">✗</span>
                  }
                  <span>Institution Profile</span>
                  <span className="text-[9px] font-extrabold opacity-80 border-l border-current pl-1 ml-0.5">
                    {isProfileDone ? 'SUBMITTED ✓' : 'INCOMPLETE ✗'}
                  </span>
                </span>
              </Link>

              {/* Steps 1–4: Safety Documents */}
              {requiredDocTypes.map(({ type, label }) => {
                const doc = documents.find(d => d.type === type);
                const isVerified = doc?.status === 'VERIFIED';
                const isPending  = doc?.status === 'PENDING_REVIEW';
                const isRejected = doc?.status === 'REJECTED';

                return (
                  <span
                    key={type}
                    className={`text-[11px] font-black px-3 py-1.5 rounded-xl border-2 flex items-center gap-1.5 shadow-sm transition-all ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                        : isPending
                        ? 'bg-amber-100 text-amber-900 border-amber-400 animate-pulse'
                        : isRejected
                        ? 'bg-rose-100 text-rose-900 border-rose-400'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    {isVerified ? (
                      <span className="w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">✓</span>
                    ) : isPending ? (
                      <span className="w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">⏳</span>
                    ) : (
                      <span className="w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">✗</span>
                    )}
                    <span>{label}</span>
                    <span className="text-[9px] font-extrabold opacity-80 border-l border-current pl-1 ml-0.5">
                      {isVerified ? 'VERIFIED ✓' : isPending ? 'PENDING ⏳' : isRejected ? 'REJECTED ✗' : 'NOT UPLOADED ✗'}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Institution Info Banner */}
      <div className="bg-gradient-to-r from-[#07111E] via-[#0F2038] to-[#1E3A5F] border-2 border-[#D4AF37] rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="flex-1 space-y-2">
          <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest">
            REAL-TIME INSTITUTION PROFILE • जनपद: {institution.district}
          </p>
          <h2 className="text-xl font-black font-serif">{institution.name}</h2>
          <p className="text-xs text-slate-300">{typeof institution.address === 'string' ? institution.address : (institution.address?.street || `${institution.district || 'Lucknow'}, Uttar Pradesh`)} • Contact: <span className="font-mono font-bold text-[#D4AF37]">{institution.contact}</span></p>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="text-[10px] font-black bg-white/10 px-2.5 py-1 rounded-lg border border-white/20">
              {institution.type}
            </span>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${institution.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' : 'bg-amber-500/20 text-amber-300 border-amber-400'}`}>
              {institution.status === 'VERIFIED' ? '✓ VERIFIED INSTITUTION' : '⏳ PENDING DOCUMENT VERIFICATION'}
            </span>
            <span className="text-[10px] font-black bg-[#D4AF37]/20 text-[#D4AF37] px-2.5 py-1 rounded-lg border border-[#D4AF37]/40">
              Affiliation: {institution.affiliationBoard || 'CBSE'} ({institution.affiliationCode || 'CBSE-124251'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-700 pt-4 sm:pt-0 sm:pl-6">
          <div className="text-center">
            <CircleProgress value={institution.complianceScore || 0} color={institution.complianceScore >= 80 ? '#10B981' : institution.complianceScore >= 50 ? '#F59E0B' : '#EF4444'} />
            <p className="text-[10px] font-black text-[#D4AF37] mt-1 uppercase tracking-wider">Compliance Score</p>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div>Principal: <span className="font-black text-white">{institution.principal}</span></div>
            <div>Registered Mobile: <span className="font-mono font-bold text-[#D4AF37]">{institution.contact}</span></div>
            <div>Safe ID: <span className="font-mono font-bold text-white">{institution.safeId}</span></div>
            <div className="pt-1">
              <span className="text-[9px] font-black bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/40 uppercase tracking-wider">
                📍 Assigned Inspector: DCP {institution.zone || 'Central'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Uploaded Docs', value: documents.length, icon: FiFileText, color: 'bg-[#0F2038] text-[#D4AF37] border-[#D4AF37]' },
          { label: 'Verified by Inspector', value: verifiedDocsCount, icon: MdVerified, color: 'bg-emerald-700 text-white border-emerald-500' },
          { label: 'Pending Review', value: pendingDocsCount, icon: FiClock, color: 'bg-amber-600 text-white border-amber-400' },
          { label: 'Certificate Access', value: isUnlocked ? 'UNLOCKED 🔓' : 'LOCKED 🔒', icon: isUnlocked ? FiUnlock : FiLock, color: isUnlocked ? 'bg-emerald-800 text-emerald-200 border-emerald-400' : 'bg-rose-900 text-rose-200 border-rose-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-2xl border-2 p-4 ${color} shadow-md`}>
            <Icon size={20} className="mb-2" />
            <p className="text-lg font-black">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-90">{label}</p>
          </div>
        ))}
      </div>

      {/* Document Vault List */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[#0F2038] uppercase tracking-wider flex items-center gap-2">
              <FiFileText size={14} className="text-[#D4AF37]" /> Document Vault — {institution.name}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Documents uploaded by this institution</p>
          </div>
          <Link
            to="/dashboard/institution/documents"
            className="text-xs font-black text-[#0F2038] hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
          >
            Upload More Docs →
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              📁
            </div>
            <p className="text-xs font-black text-[#0F2038]">No Documents Uploaded Yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Please upload Fire NOC, Building Safety, Electrical Audit, and Emergency Evacuation Plan to complete your verification.
            </p>
            <Link
              to="/dashboard/institution/documents"
              className="inline-block bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs px-4 py-2.5 rounded-xl hover:bg-[#1E3A5F] transition-all cursor-pointer shadow"
            >
              Upload Documents Now →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  <th className="text-left p-3">Document Name</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Uploaded Date</th>
                  <th className="text-left p-3">Inspector Status</th>
                  <th className="text-left p-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map(doc => (
                  <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-black text-[#0F2038]">{doc.name}</td>
                    <td className="p-3 font-semibold text-slate-600">{doc.type?.replace('_', ' ')}</td>
                    <td className="p-3 font-mono text-slate-500">{doc.uploadedAt}</td>
                    <td className="p-3"><DocStatusBadge status={doc.status} /></td>
                    <td className="p-3 text-[11px] text-slate-600 italic">{doc.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🛠️ SUBMIT RECTIFICATION MODAL FOR INSTITUTION */}
      {showRectificationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl border-4 border-amber-500 overflow-hidden flex flex-col animate-fade-in">
            <div className="bg-gradient-to-r from-slate-900 via-[#0F2038] to-slate-900 p-4 text-white flex justify-between items-center border-b-2 border-amber-400">
              <div className="flex items-center gap-2">
                <FiSend className="text-[#D4AF37]" size={18} />
                <h3 className="text-sm font-black uppercase tracking-wider text-[#D4AF37]">Submit Rectification Report</h3>
              </div>
              <button onClick={() => setShowRectificationModal(false)} className="text-white/60 hover:text-white p-1 cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleRectificationSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-950 space-y-1 font-semibold">
                <p className="font-black text-amber-900">🛠️ Rectification &amp; Re-Inspection Request</p>
                <p>Explain how the identified safety issues/notices have been resolved (e.g., replaced extinguishers, cleared evacuation doors, uploaded fresh certificates). This report will be sent to Safety Inspectors for physical re-inspection.</p>
              </div>

              <div className="space-y-1">
                <label className="font-black text-slate-800 uppercase tracking-wider text-[10px] block">
                  Detailed Rectification Action &amp; Explanation *
                </label>
                <textarea
                  rows="4"
                  required
                  value={rectificationNotes}
                  onChange={(e) => setRectificationNotes(e.target.value)}
                  placeholder="e.g. All fire extinguishers have been refilled and re-inspected on site. Evacuation pathways cleared and new directional signs installed."
                  className="w-full p-3 border-2 border-slate-300 rounded-xl text-xs focus:border-[#0F2038] focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRectificationModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#0F2038] to-[#1E3A5F] text-[#D4AF37] border border-[#D4AF37] font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 hover:brightness-110"
                >
                  <FiSend size={13} /> Submit Report to Inspectors
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
