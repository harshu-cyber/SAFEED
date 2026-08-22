// ============================================================
// SAFEED-UP — Public Verification Portal (Supabase Powered)
// Official QR Code & Safe ID Public Safety Verification
// ============================================================
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verificationService } from '../../services/verificationService';
import {
  FiCheckCircle, FiShield, FiAlertTriangle, FiFileText, FiMapPin,
  FiPhone, FiCalendar, FiCheck, FiX, FiPrinter, FiShare2, FiSearch, FiCamera, FiAlertOctagon
} from 'react-icons/fi';
import { MdVerified, MdOutlineSchool, MdLocalPolice, MdLocalFireDepartment } from 'react-icons/md';
import { CameraQrScanner } from '../../components/scanner/CameraQrScanner';

export const PublicVerification = () => {
  const { safeId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchSafeId, setSearchSafeId] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    if (!safeId) {
      setLoading(false);
      return;
    }

    verificationService.verifySafeId(safeId)
      .then((res) => {
        const inst = res.institution;
        const docs = res.documents || [];
        const isUnlocked = res.verificationStatus === 'VERIFIED' && !inst.qr_locked;

        setData({
          name: inst.name,
          safeId: inst.safe_id,
          type: inst.institution_type || 'SCHOOL',
          address: inst.address || `${inst.district}, Uttar Pradesh`,
          status: isUnlocked ? 'VERIFIED INSTITUTION' : '🚨 PENDING / UNVERIFIED / REVOKED',
          qrLocked: inst.qr_locked,
          safetyScore: res.complianceScore,
          district: inst.district,
          zone: inst.zone,
          principal: inst.principal_name,
          contact: inst.phone,
          documents: docs,
        });
      })
      .catch((err) => {
        console.error('[PublicVerification] Error:', err);
        setError(err.message || 'Safe ID not found in Supabase database.');
      })
      .finally(() => setLoading(false));
  }, [safeId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchSafeId.trim()) {
      window.location.href = `/verify/${searchSafeId.trim()}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono font-bold text-[#D4AF37]">Verifying Safe ID with Supabase Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111E] text-white p-4 sm:p-8 font-sans">
      {/* Top Search & Camera Action Bar */}
      <div className="max-w-xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="w-full flex items-center gap-2 bg-[#0F2038] border-2 border-[#D4AF37] p-1.5 rounded-2xl shadow-xl">
          <FiSearch className="text-[#D4AF37] ml-2 text-lg" />
          <input
            type="text"
            value={searchSafeId}
            onChange={(e) => setSearchSafeId(e.target.value)}
            placeholder="Search another Safe ID..."
            className="w-full text-xs text-white bg-transparent outline-none font-semibold px-1"
          />
          <button type="submit" className="bg-[#D4AF37] text-[#0F2038] font-black text-xs px-4 py-2 rounded-xl hover:bg-amber-400 cursor-pointer">
            Search
          </button>
        </form>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black text-xs px-5 py-3 rounded-2xl border border-rose-400 shadow-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <FiCamera size={16} /> Scan QR with Camera
        </button>
      </div>

      {error ? (
        <div className="max-w-xl mx-auto bg-rose-950 border-2 border-rose-600 text-rose-200 p-6 rounded-3xl text-center space-y-3">
          <FiAlertOctagon size={40} className="mx-auto text-rose-500" />
          <h2 className="text-lg font-black font-serif">Verification Failed</h2>
          <p className="text-xs font-semibold">{error}</p>
        </div>
      ) : (
        /* Main Verification Card */
        <div className="max-w-xl mx-auto">
          <div className="bg-black text-white p-6 sm:p-8 rounded-3xl border-4 border-[#D4AF37] shadow-2xl space-y-6 relative overflow-hidden">
            {/* Subtle UP Police Emblem Watermark */}
            <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
              <img src="/up-police-logo.png" alt="UP Police Badge" className="w-40 h-40 object-contain" />
            </div>

            {/* 1. Institution Name & Status Header */}
            <div className="space-y-2 border-b border-slate-800 pb-5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white flex items-center gap-2 font-serif">
                  🏫 {data?.name}
                </h1>
                <span className="text-[10px] font-mono font-bold bg-[#0F2038] text-[#D4AF37] px-2.5 py-1 rounded-lg border border-[#D4AF37]/50">
                  {data?.safeId}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${data?.qrLocked ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                <span className={`text-sm font-black tracking-wider uppercase ${data?.qrLocked ? 'text-rose-500' : 'text-emerald-400'}`}>
                  {data?.status}
                </span>
              </div>
            </div>

            {/* 2. Safety Score Widget */}
            <div className="flex items-center justify-between bg-[#0F2038]/80 p-4 rounded-2xl border border-[#D4AF37]/40">
              <div>
                <span className="text-xs text-slate-300 font-bold uppercase tracking-wider block">Official Safety Audit Score</span>
                <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  Safety Score: <span className="text-[#D4AF37] font-mono">{data?.safetyScore}/100</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xl font-black shadow-lg">
                ✓
              </div>
            </div>

            {/* 3. Safety Verification Checklist */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest border-b border-slate-800 pb-2">
                Safety Verification Checklist (Supabase Verified)
              </h3>

              <div className="space-y-2 text-xs">
                {(data?.documents || []).map((doc) => (
                  <div key={doc.id || doc.document_type} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-bold text-slate-200">{doc.document_type}</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-xs ${doc.status === 'APPROVED' ? 'text-emerald-400 bg-emerald-950' : 'text-amber-400 bg-amber-950'}`}>
                      {doc.status === 'APPROVED' ? '✓ APPROVED' : '⏳ PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Verification Stamp */}
            <div className="pt-4 border-t border-slate-800 text-center space-y-1">
              <p className="text-[10px] text-slate-400 font-mono">
                Verified by Supabase Database &amp; Uttar Pradesh Police &copy; {new Date().getFullYear()}
              </p>
              <p className="text-[9px] text-[#D4AF37] font-bold">
                "सुरक्षा आपकी, संकल्प हमारा"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      <CameraQrScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
};
