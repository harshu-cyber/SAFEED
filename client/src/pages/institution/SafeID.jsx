import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import { qrApi } from '../../api/apiServices';
import { FiPrinter, FiDownload, FiShield, FiCheck, FiLock, FiAlertCircle } from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';

export const SafeIDPage = () => {
  const { user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      let instId = user?.institutionId || user?._id || user?.id;
      if (instId) {
        try {
          const res = await qrApi.getQrStatus(instId);
          if (res.data?.data) {
            setIsUnlocked(res.data.data.unlocked);
            if (res.data.data.safeId) {
              setInstitution(prev => ({ ...(prev || {}), safeId: res.data.data.safeId }));
            }
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('[SafeIDPage] API fetch notice:', e?.message);
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
          <p className="text-xs font-bold text-[#0F2038]">Loading Certificate Status...</p>
        </div>
      </div>
    );
  }

  // 🚨 REVOKED / LOCKED BY AUTHORITY NOTICE SCREEN
  if (institution?.qrLocked) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto my-8">
        <div className="bg-white border-4 border-rose-500 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-20 h-20 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto text-4xl border-4 border-rose-400 shadow-lg animate-bounce">
            🚨
          </div>

          <div>
            <span className="text-[10px] font-black text-rose-900 bg-rose-200 px-3 py-1 rounded-full uppercase tracking-wider border border-rose-300">
              OFFICIAL ENFORCEMENT NOTICE • अधिकारिक नोटिस
            </span>
            <h2 className="text-xl font-black text-rose-950 font-serif mt-3">
              QR Certificate Revoked &amp; Locked by Safety Authorities
            </h2>
            <p className="text-xs text-rose-800 font-semibold mt-1">
              सुरक्षा निरीक्षकों द्वारा संस्था के QR प्रमाण पत्र को निरस्त एवं लॉक कर दिया गया है।
            </p>
          </div>

          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-xs text-left space-y-2 font-semibold text-rose-950">
            <p className="font-black text-rose-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <FiAlertCircle size={14} className="text-rose-600" /> Formal Notice Reason Issued:
            </p>
            <p className="text-slate-900 font-bold bg-white p-3 rounded-xl border border-rose-200 italic break-words">{institution.qrLockNotice}</p>
            <p className="text-[10px] text-slate-500 pt-1">
              Issued by: <strong>{institution.qrLockedBy}</strong> · Date: {institution.qrLockedAt}
            </p>
          </div>

          {institution.rectificationSubmitted && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3 text-xs text-emerald-900 font-bold text-left space-y-1">
              <p>✅ Rectification Report Submitted to Inspectors:</p>
              <p className="text-slate-700 font-normal italic">"{institution.rectificationNotes}"</p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/dashboard/institution"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0F2038] to-[#1E3A5F] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs px-6 py-3.5 rounded-xl hover:brightness-110 transition-all shadow-lg cursor-pointer"
            >
              ← Back to Dashboard to Submit Rectification
            </Link>
          </div>
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
            <p>2. Upload all 4 required safety documents: <strong>Fire NOC, Building Structural Safety, Electrical Audit, Emergency Evacuation Plan</strong>.</p>
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
  const safeIdValue = institution?.safeId || 'SAFE-UP-LKO-000001';
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
          <p className="text-xs text-slate-500">Official Government Safety Identity Certificate</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-xs font-black px-4 py-2.5 bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] rounded-xl hover:bg-[#1E3A5F] transition-colors cursor-pointer shadow-md"
          >
            <FiPrinter size={14} /> Print Certificate
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 text-xs font-black px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#0F2038] rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-md"
          >
            <FiDownload size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* ============================================================
          GOVERNMENT A4 CERTIFICATE (Exact 1-Page Printable Layout)
      ============================================================ */}
      <div
        id="printable-certificate"
        className="max-w-4xl mx-auto bg-white shadow-2xl printable-cert relative overflow-hidden"
        style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
      >
        {/* ASHOK STAMBH WATERMARK BACKGROUND */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0" style={{ opacity: 0.08 }}>
          <img src="/ashok-stambh.png" alt="Ashok Stambh Watermark" className="w-[55%] max-w-lg object-contain filter grayscale" />
        </div>

        {/* GOLD OUTER BORDER */}
        <div className="border-[5px] border-[#D4AF37] m-2 relative z-10">
          <div className="border-[2px] border-[#D4AF37] m-1">
            <div className="p-4 sm:p-6 space-y-3">

              {/* ── HEADER: DUAL EMBLEMS + CERTIFICATE TITLE ── */}
              <div className="text-center pb-3 border-b-2 border-[#D4AF37]">
                <div className="flex items-center justify-between gap-2 mb-2">

                  {/* LEFT: UP Government Seal */}
                  <div className="flex flex-col items-center">
                    <img
                      src="/up-govt-seal.png"
                      alt="Government of Uttar Pradesh Official Seal"
                      className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                    />
                  </div>

                  {/* Center Title Block */}
                  <div className="flex-1 text-center px-2">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 tracking-widest uppercase">
                      भारत सरकार | Government of India
                    </p>
                    <p className="text-xs sm:text-sm font-black text-[#0F2038] tracking-widest uppercase">
                      उत्तर प्रदेश सरकार | GOVERNMENT OF UTTAR PRADESH
                    </p>
                    <div className="my-1 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
                    <h1 className="text-sm sm:text-lg font-black text-[#0F2038] uppercase tracking-wider font-serif">
                      SAFEED-UP — DIGITAL SAFETY CERTIFICATE
                    </h1>
                    <p className="text-[9px] sm:text-[10px] font-bold text-[#D4AF37] bg-[#0F2038] px-3 py-0.5 rounded inline-block mt-0.5 uppercase tracking-widest">
                      सुरक्षा आपकी, संकल्प हमारा
                    </p>
                  </div>

                  {/* RIGHT: UP Police Badge */}
                  <div className="flex flex-col items-center">
                    <img
                      src="/up-police-logo.png"
                      alt="Uttar Pradesh Police Emblem"
                      className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
                    />
                  </div>
                </div>

                {/* Certificate Title Bar */}
                <div className="bg-[#0F2038] text-[#D4AF37] py-1.5 px-4 rounded-md inline-block">
                  <p className="text-xs sm:text-sm font-black uppercase tracking-widest font-serif">
                    OFFICIAL DIGITAL SAFETY IDENTITY CERTIFICATE
                  </p>
                  <p className="text-[8px] font-bold opacity-80 tracking-wider">
                    आधिकारिक डिजिटल सुरक्षा पहचान प्रमाण पत्र
                  </p>
                </div>
              </div>

              {/* ── UDYAM STYLE STRUCTURED INSTITUTION DETAILS TABLE ── */}
              <div className="space-y-3">
                <table className="w-full text-xs border-2 border-slate-800 border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="p-2 font-black uppercase text-[#0F2038] bg-slate-100 border-r border-slate-800 w-2/5">SAFE ID REGISTRATION NUMBER</td>
                      <td className="p-2 font-mono font-black text-blue-900 text-sm tracking-wider">{institution?.safeId || 'SAFE-UP-LKO-000001'}</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="p-2 font-black uppercase text-[#0F2038] bg-slate-100 border-r border-slate-800">NAME OF INSTITUTION / ENTERPRISE</td>
                      <td className="p-2 font-black text-[#0F2038] uppercase text-sm font-serif">{institution?.name}</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="p-2 font-black uppercase text-[#0F2038] bg-slate-100 border-r border-slate-800">INSTITUTION TYPE &amp; BOARD</td>
                      <td className="p-2 font-bold text-slate-800">
                        {institution?.type} ({institution?.affiliationBoard || 'CBSE'} {institution?.affiliationCode ? `- ${institution.affiliationCode}` : ''})
                      </td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="p-2 font-black uppercase text-[#0F2038] bg-slate-100 border-r border-slate-800">OFFICIAL CAMPUS ADDRESS</td>
                      <td className="p-2 text-slate-900 font-semibold">
                        {institution?.address || `${institution?.district || 'Lucknow'}, Uttar Pradesh`} (District: {institution?.district || 'Lucknow'}, State: Uttar Pradesh)
                      </td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="p-2 font-black uppercase text-[#0F2038] bg-slate-100 border-r border-slate-800">PRINCIPAL &amp; CONTACT DETAILS</td>
                      <td className="p-2 font-bold text-slate-800">
                        {institution?.principal || 'Principal Admin'} | Email: {institution?.email || 'N/A'} | Phone: {institution?.contact || 'N/A'}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="p-2 font-black uppercase text-[#0F2038] bg-slate-100 border-r border-slate-800">DESIGNATED JURISDICTION STATION</td>
                      <td className="p-2 font-bold text-blue-900">
                        👮 {institution?.nearestPoliceStation || `${institution?.district || 'Hazratganj'} Police Station`} (DCP {institution?.zone || 'CENTRAL'} ZONE)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-black uppercase text-[#0F2038] bg-slate-100 border-r border-slate-800">DATE OF CERTIFICATION &amp; VALIDITY</td>
                      <td className="p-2 font-bold text-slate-800">
                        Issued: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} | Valid Until: <span className="text-emerald-700 font-black">{new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* NOC CLEARANCES TABLE + QR CODE & BABLOO KUMAR SIGNATURE */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <div className="col-span-2 border-2 border-slate-800 rounded-lg p-2.5 bg-slate-50">
                    <p className="text-[10px] font-black text-[#0F2038] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <FiShield size={12} className="text-[#D4AF37]" /> VERIFIED NOC SAFETY CLEARANCES (5 MANDATORY AUDITS)
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold">
                      <div className="flex items-center gap-1 bg-white p-1 border border-slate-300 rounded"><FiCheck className="text-emerald-600" /> Fire Safety NOC Certificate</div>
                      <div className="flex items-center gap-1 bg-white p-1 border border-slate-300 rounded"><FiCheck className="text-emerald-600" /> Building Structural Safety</div>
                      <div className="flex items-center gap-1 bg-white p-1 border border-slate-300 rounded"><FiCheck className="text-emerald-600" /> Electrical Safety Audit Report</div>
                      <div className="flex items-center gap-1 bg-white p-1 border border-slate-300 rounded"><FiCheck className="text-emerald-600" /> Emergency Evacuation Plan</div>
                      <div className="flex items-center gap-1 bg-white p-1 border border-slate-300 rounded col-span-2"><FiCheck className="text-emerald-600" /> School / Institution Front Building Photo</div>
                    </div>
                  </div>

                  {/* QR CODE BLOCK */}
                  <div className="col-span-1 border-2 border-slate-800 rounded-lg p-2 bg-white text-center flex flex-col items-center justify-center">
                    <img src={qrUrl} alt="SafeED-UP QR" className="w-24 h-24 object-contain" />
                    <p className="text-[8px] font-mono font-bold text-[#0F2038] mt-0.5">{institution?.safeId}</p>
                    <p className="text-[7px] font-bold text-slate-500 uppercase">Scan to Verify Live Status</p>
                  </div>
                </div>

                {/* SIGNATORIES FOOTER — WITH NAMES & CURSIVE SIGNATURES */}
                <div className="border-t-2 border-slate-800 pt-3">
                  <p className="text-[8px] font-black text-center text-[#0F2038] uppercase tracking-widest mb-3">
                    AUTHORISED &amp; DIGITALLY SIGNED BY | आधिकारिक हस्ताक्षरकर्ता
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center">

                    {/* 1. Chief Minister — Yogi Adityanath */}
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D4AF37] mb-0.5 bg-slate-50 flex items-center justify-center">
                        <img src="/up-govt-seal.png" alt="UP Govt Seal" className="w-5 h-5 object-contain" />
                      </div>
                      <div
                        className="italic text-blue-900 font-bold text-[13px] tracking-wide select-none transform -rotate-1 leading-tight"
                        style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
                      >
                        Yogi Adityanath
                      </div>
                      <div className="w-full border-b border-dashed border-slate-400 mb-0.5" />
                      <p className="text-[8px] font-bold text-[#0F2038]">Hon'ble Chief Minister</p>
                      <p className="text-[7px] text-slate-600">Govt. of Uttar Pradesh</p>
                    </div>

                    {/* 2. DGP — Rajeev Krishna */}
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D4AF37] mb-0.5 bg-slate-50 flex items-center justify-center">
                        <img src="/up-police-logo.png" alt="UP Police Logo" className="w-5 h-5 object-contain" />
                      </div>
                      <div
                        className="italic text-blue-900 font-bold text-[13px] tracking-wide select-none transform -rotate-1 leading-tight"
                        style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
                      >
                        Rajeev Krishna
                      </div>
                      <div className="w-full border-b border-dashed border-slate-400 mb-0.5" />
                      <p className="text-[8px] font-bold text-[#0F2038]">Director General of Police</p>
                      <p className="text-[7px] text-slate-600">Uttar Pradesh Police</p>
                    </div>

                    {/* 3. Commissioner of Police, Lucknow — Tarun Gauba */}
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D4AF37] mb-0.5 bg-slate-50 flex items-center justify-center">
                        <img src="/up-police-logo.png" alt="UP Police Logo" className="w-5 h-5 object-contain" />
                      </div>
                      <div
                        className="italic text-blue-900 font-bold text-[13px] tracking-wide select-none transform -rotate-1 leading-tight"
                        style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
                      >
                        Tarun Gauba
                      </div>
                      <div className="w-full border-b border-dashed border-slate-400 mb-0.5" />
                      <p className="text-[8px] font-bold text-[#0F2038]">Commissioner of Police</p>
                      <p className="text-[7px] text-slate-600">Lucknow</p>
                    </div>

                    {/* 4. Joint Commissioner of Police, Lucknow — Babloo Kumar */}
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-[#D4AF37] mb-0.5 bg-slate-50 flex items-center justify-center">
                        <img src="/up-police-logo.png" alt="UP Police Logo" className="w-5 h-5 object-contain" />
                      </div>
                      <div
                        className="italic text-blue-900 font-bold text-[13px] tracking-wide select-none transform -rotate-1 leading-tight"
                        style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
                      >
                        Babloo Kumar
                      </div>
                      <div className="w-full border-b border-dashed border-slate-400 mb-0.5" />
                      <p className="text-[8px] font-bold text-[#0F2038]">Joint Commissioner of Police</p>
                      <p className="text-[7px] text-slate-600">Lucknow</p>
                    </div>

                  </div>

                  <p className="text-[7px] text-center text-slate-400 mt-2 italic">
                    This is a computer-generated digital safety certificate issued under the SafeED-UP Digital Safety Portal. Scan QR code for real-time verification.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Clean 1-Page A4 Print CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 100vh !important;
            overflow: hidden !important;
          }
          nav, header, aside, .no-print, button {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
          }
          .printable-cert {
            max-width: 100% !important;
            box-shadow: none !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};
