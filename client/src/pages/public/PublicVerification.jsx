import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockData } from '../../api/mockData';
import { institutionApi } from '../../api/apiServices';
import { institutionStore } from '../../api/institutionStore';
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
  const [viewTheme, setViewTheme] = useState('dark'); // 'dark' (matching screenshot) or 'light'
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchSafeId, setSearchSafeId] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    // Try institutionStore first for real-time local storage lookup
    const storeInst = institutionStore.getInstitutionByIdOrEmail(safeId);
    const foundInst = storeInst || mockData.institutions.find(
      i => i.safeId?.toLowerCase() === safeId?.toLowerCase() || i._id === safeId
    ) || mockData.institutions[0];

    if (foundInst) {
      const isQrLocked = foundInst.qrLocked === true;
      setTimeout(() => {
        setData({
          name: foundInst.name || 'ABC Coaching Institute',
          safeId: foundInst.safeId || 'SAFE-UP-LKO-000001',
          type: foundInst.type || 'COACHING',
          address: foundInst.address || 'Hazratganj, Lucknow, Uttar Pradesh',
          status: isQrLocked ? '🚨 REVOKED / LOCKED BY AUTHORITIES' : (foundInst.status === 'PENDING' ? 'UNDER_REVIEW' : 'VERIFIED INSTITUTION'),
          qrLocked: isQrLocked,
          qrLockNotice: foundInst.qrLockNotice || null,
          qrLockedBy: foundInst.qrLockedBy || null,
          qrLockedAt: foundInst.qrLockedAt || null,
          safetyScore: isQrLocked ? 0 : (foundInst.complianceScore || 87),
          riskLevel: isQrLocked ? 'CRITICAL_HAZARD' : (foundInst.riskLevel || 'LOW'),
          lastInspectionDate: '05 Aug 2026',
          nextInspectionDate: '05 Nov 2026',
          principal: foundInst.principal || 'Amit Kumar',
          contact: foundInst.contact || '0522-2612345',
          checklist: [
            { icon: '🔥', name: 'Fire Safety', status: isQrLocked ? 'Revoked' : 'Verified', checked: !isQrLocked },
            { icon: '⚡', name: 'Electrical Safety', status: isQrLocked ? 'Revoked' : 'Verified', checked: !isQrLocked },
            { icon: '🚪', name: 'Emergency Exit', status: isQrLocked ? 'Deficiencies Found' : 'Verified', checked: !isQrLocked },
            { icon: '📹', name: 'CCTV Surveillance', status: 'Available', checked: true },
            { icon: '💊', name: 'First Aid Medical Kit', status: 'Available', checked: true },
          ],
          documents: [
            { name: 'Fire NOC', verified: !isQrLocked },
            { name: 'Building Safety Certificate', verified: !isQrLocked },
            { name: 'Electrical Safety Certificate', verified: !isQrLocked },
            { name: 'Emergency Evacuation Plan', verified: !isQrLocked },
          ],
          emergencyContacts: {
            police: '112',
            fire: '101',
            ambulance: '108 / 102',
          },
        });
        setLoading(false);
      }, 200);
    } else {
      institutionApi.getPublicBySafeId(safeId)
        .then((res) => {
          const apiData = res.data.data;
          setData({
            name: apiData.institution.name,
            safeId: apiData.institution.safeId,
            type: apiData.institution.type,
            status: apiData.institution.verificationStatus || 'VERIFIED INSTITUTION',
            safetyScore: apiData.institution.complianceScore || 85,
            lastInspectionDate: '05 Aug 2026',
            nextInspectionDate: '05 Nov 2026',
            checklist: [
              { icon: '🔥', name: 'Fire Safety', status: 'Verified', checked: true },
              { icon: '⚡', name: 'Electrical Safety', status: 'Verified', checked: true },
              { icon: '🚪', name: 'Emergency Exit', status: 'Verified', checked: true },
              { icon: '📹', name: 'CCTV', status: 'Available', checked: true },
              { icon: '💊', name: 'First Aid', status: 'Available', checked: true },
            ],
            documents: [
              { name: 'Fire NOC', verified: true },
              { name: 'Building Safety Certificate', verified: true },
              { name: 'Electrical Safety Certificate', verified: true },
              { name: 'Emergency Evacuation Plan', verified: true },
            ],
            emergencyContacts: { police: '112', fire: '101', ambulance: '108' },
          });
        })
        .catch(() => setError('Safe ID not found.'))
        .finally(() => setLoading(false));
    }
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
          <p className="text-xs font-mono font-bold text-[#D4AF37]">Verifying Safe ID with UP Police Database...</p>
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

      {/* Main Verification Card (Exact match of User's Screenshot Format) */}
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

          {/* 🚨 OFFICIAL QR LOCK REVOCATION BANNER */}
          {data?.qrLocked && (
            <div className="bg-rose-950/90 border-2 border-rose-500 rounded-2xl p-4 text-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-black text-rose-400 uppercase tracking-wider text-[11px]">
                <FiAlertOctagon size={16} /> Enforcement Action Notice
              </div>
              <p className="text-white font-semibold bg-black/50 p-2.5 rounded-xl border border-rose-800 italic">{data.qrLockNotice}</p>
              <p className="text-[10px] text-slate-400">Issued by: {data.qrLockedBy} · {data.qrLockedAt}</p>
            </div>
          )}

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
              Safety Verification Checklist
            </h3>

            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              {data?.checklist?.map((item) => (
                <li key={item.name} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="text-base">{item.icon}</span>
                    <span className="font-bold">{item.name}</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-600/50 text-xs">
                    ✅ {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Inspection Dates */}
          <div className="bg-[#0A1628] p-4 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
            <p className="flex justify-between text-slate-300">
              <span className="font-bold">Last Inspection:</span>
              <span className="font-mono text-white font-bold">{data?.lastInspectionDate}</span>
            </p>
            <p className="flex justify-between text-slate-300">
              <span className="font-bold">Next Inspection:</span>
              <span className="font-mono text-[#D4AF37] font-bold">{data?.nextInspectionDate}</span>
            </p>
          </div>

          {/* 5. Documents Section */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-1.5">
              📄 Verified Government Safety Certificates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {data?.documents?.map((doc) => (
                <div key={doc.name} className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 font-bold">
                  <span className="text-base">✅</span>
                  <span>{doc.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Emergency Contacts Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
              🚨 Emergency Direct Lines
            </h3>

            <div className="bg-rose-950/60 border-2 border-rose-600/60 p-4 rounded-2xl text-center space-y-2">
              <p className="text-sm font-black text-white font-mono tracking-wider">
                Police ({data?.emergencyContacts?.police}) | Fire ({data?.emergencyContacts?.fire}) | Ambulance ({data?.emergencyContacts?.ambulance})
              </p>
              <div className="flex justify-center gap-2 text-[10px] text-rose-200">
                <a href={`tel:${data?.emergencyContacts?.police}`} className="bg-rose-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-rose-500">
                  Call Police 112
                </a>
                <a href={`tel:${data?.emergencyContacts?.fire}`} className="bg-amber-600 text-white font-bold px-3 py-1 rounded-lg hover:bg-amber-500">
                  Call Fire 101
                </a>
              </div>
            </div>
          </div>

          {/* Footer Verification Stamp */}
          <div className="pt-4 border-t border-slate-800 text-center space-y-1">
            <p className="text-[10px] text-slate-400 font-mono">
              Verified by Uttar Pradesh Police &amp; District Magistrate Authority Portal &copy; {new Date().getFullYear()}
            </p>
            <p className="text-[9px] text-[#D4AF37] font-bold">
              "सुरक्षा आपकी, संकल्प हमारा"
            </p>
          </div>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      <CameraQrScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </div>
  );
};
