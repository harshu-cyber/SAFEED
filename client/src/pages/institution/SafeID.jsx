// ============================================================
// SAFEED-UP — Safe ID & QR Code Certificate Page (Supabase)
// Automatic Unlock Trigger based on PostgreSQL DB status
// ============================================================
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { institutionService } from '../../services/institutionService';
import { FiPrinter, FiDownload, FiShield, FiCheck, FiLock, FiAlertCircle } from 'react-icons/fi';

export const SafeIDPage = () => {
  const { user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const instId = user?.institutionId || user?.institution_id || user?._id;
      if (instId) {
        try {
          const instData = await institutionService.getById(instId);
          if (instData) {
            setInstitution(instData);
            const unlocked = !instData.qr_locked && instData.verification_status === 'VERIFIED';
            setIsUnlocked(unlocked);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('[SafeIDPage] Supabase fetch notice:', e?.message);
        }
      }

      setIsUnlocked(false);
      setLoading(false);
    };

    fetchStatus();
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#0F2038]">Loading Certificate Status from Supabase...</p>
        </div>
      </div>
    );
  }

  // 🔒 LOCKED SCREEN (If documents not verified by Inspector)
  if (!isUnlocked) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto my-8">
        <div className="bg-white border-4 border-amber-400 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-20 h-20 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-4xl border-4 border-amber-300 shadow-lg animate-bounce">
            🔒
          </div>

          <div>
            <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-3 py-1 rounded-full uppercase tracking-wider">
              Verification Required • सत्यापन आवश्यक
            </span>
            <h2 className="text-xl font-black text-[#0F2038] font-serif mt-3">
              Safe ID & QR Certificate is Currently Locked
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              प्रमाण पत्र लॉक है — सभी 4 सुरक्षा दस्तावेज़ अपलोड एवं निरीक्षकों द्वारा सत्यापित होने पर ही अनलॉक होगा।
            </p>
          </div>

          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-xs text-left space-y-2 font-semibold text-amber-900">
            <p className="font-black text-amber-950 flex items-center gap-1.5">
              <FiShield size={14} className="text-amber-700" /> Unlock Instructions:
            </p>
            <p>1. Go to <strong>Document Vault</strong>.</p>
            <p>2. Upload all 4 required safety documents: <strong>Fire Safety, Building Structural Safety, Electrical Audit, Emergency Evacuation Plan</strong>.</p>
            <p>3. Once the <strong>District Inspector</strong> approves your documents, this certificate will automatically unlock 🔓.</p>
          </div>

          <div className="pt-2">
            <Link
              to="/dashboard/institution/documents"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0F2038] to-[#1E3A5F] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs px-6 py-3.5 rounded-xl hover:brightness-110 transition-all shadow-lg cursor-pointer"
            >
              Go to Document Vault to Upload Docs →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 🔓 UNLOCKED A4 CERTIFICATE SCREEN
  const safeIdValue = institution?.safe_id || institution?.safeId || 'UP-LKO-000001';
  const verifyUrl = `${window.location.origin}/verify/${safeIdValue}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}&color=0F2038&bgcolor=ffffff`;

  return (
    <div className="min-h-screen bg-[#F4F6F9] p-4 sm:p-6 print-container">
      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between gap-3 flex-wrap no-print">
        <div>
          <h2 className="text-base font-black text-[#0F2038] font-serif flex items-center gap-2">
            SafeED-UP — Digital Safety Certificate <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 font-sans">🔓 UNLOCKED</span>
          </h2>
          <p className="text-xs text-slate-500">Official Government Safety Identity Certificate (Supabase Verified)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-xs font-black px-4 py-2.5 bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] rounded-xl hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-md"
          >
            <FiPrinter size={14} /> Print Certificate
          </button>
        </div>
      </div>

      {/* A4 CERTIFICATE */}
      <div
        id="printable-certificate"
        className="max-w-4xl mx-auto bg-white shadow-2xl printable-cert relative overflow-hidden"
        style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
      >
        <div className="border-[5px] border-[#D4AF37] m-2 relative z-10">
          <div className="border-[2px] border-[#D4AF37] m-1">
            <div className="p-4 sm:p-6 space-y-3">
              <div className="text-center pb-3 border-b-2 border-[#D4AF37]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <img src="/up-govt-seal.png" alt="UP Govt" className="w-14 h-14 object-contain" />
                  <div className="flex-1 text-center">
                    <p className="text-xs font-black text-[#0F2038] uppercase">GOVERNMENT OF UTTAR PRADESH</p>
                    <h1 className="text-sm sm:text-lg font-black text-[#0F2038] uppercase font-serif">SAFEED-UP — DIGITAL SAFETY CERTIFICATE</h1>
                  </div>
                  <img src="/up-police-logo.png" alt="UP Police" className="w-14 h-14 object-contain" />
                </div>
              </div>

              <table className="w-full text-xs border-2 border-slate-800 border-collapse">
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="p-2 font-black uppercase bg-slate-100 border-r border-slate-800 w-2/5">SAFE ID REGISTRATION NUMBER</td>
                    <td className="p-2 font-mono font-black text-blue-900 text-sm">{safeIdValue}</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="p-2 font-black uppercase bg-slate-100 border-r border-slate-800">NAME OF INSTITUTION</td>
                    <td className="p-2 font-black text-[#0F2038] uppercase text-sm font-serif">{institution?.name}</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="p-2 font-black uppercase bg-slate-100 border-r border-slate-800">OFFICIAL CAMPUS ADDRESS</td>
                    <td className="p-2 text-slate-900 font-semibold">{institution?.address || `${institution?.district}, Uttar Pradesh`}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-black uppercase bg-slate-100 border-r border-slate-800">STATUS</td>
                    <td className="p-2 font-bold text-emerald-700">VERIFIED &amp; UNLOCKED (COMPLIANCE SCORE: 100/100)</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-semibold">
                  <p>Verified by UP Police &amp; District Magistrate Authority Portal</p>
                </div>
                <div className="text-center">
                  <img src={qrUrl} alt="QR Code" className="w-24 h-24 object-contain mx-auto" />
                  <p className="text-[8px] font-mono font-bold mt-1">{safeIdValue}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
