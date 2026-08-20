import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cloudSync } from '../../api/cloudSync';
import { institutionStore } from '../../api/institutionStore';
import { evidenceStore } from '../../api/evidenceStore';
import { complaintStore } from '../../api/complaintStore';
import { InstitutionTypePieChart } from '../../components/common/Charts/InstitutionTypePieChart';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import {
  FiCheckSquare, FiClock, FiShield,
  FiEye, FiTrendingUp, FiSearch, FiFileText, FiCamera, FiUsers,
  FiAlertTriangle, FiCheck, FiX, FiInfo, FiMessageSquare, FiCheckCircle, FiLock, FiUnlock
} from 'react-icons/fi';
import { MdVerified, MdLocalPolice, MdOutlineSchool, MdQrCode2 } from 'react-icons/md';

// Zone badge colour map
const ZONE_COLORS = {
  WEST:    'bg-purple-100 text-purple-800 border-purple-300',
  CENTRAL: 'bg-blue-100 text-blue-800 border-blue-300',
  NORTH:   'bg-cyan-100 text-cyan-800 border-cyan-300',
  EAST:    'bg-amber-100 text-amber-800 border-amber-300',
  SOUTH:   'bg-rose-100 text-rose-800 border-rose-300',
};

const ZONE_ARROWS = {
  WEST: '⬅', CENTRAL: '⊕', NORTH: '⬆', EAST: '➡', SOUTH: '⬇',
};

export const InspectorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [qrFilter, setQrFilter] = useState('ALL'); // ALL | UNLOCKED | LOCKED
  const [selectedInstProfile, setSelectedInstProfile] = useState(null);
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [toast, setToast] = useState('');

  const dcpZone = user?.dcpZone;
  const postingStation = user?.postingStation;

  const loadData = () => {
    // ✅ ZONE & STATION FILTERED: Load institutions & docs for this officer's jurisdiction
    const insts = institutionStore.getInstitutionsForZone(dcpZone, postingStation);
    setInstitutions(insts);
    const docs = institutionStore.getDocumentsForZone(dcpZone, postingStation);
    setDocuments(docs);
    const evs = evidenceStore.getEvidenceList();
    setEvidenceList(evs);

    // ✅ Load Public Safety Complaints assigned to this DCP Officer by District Admin
    const cmps = complaintStore.getComplaintsForInspector(dcpZone);
    setAssignedComplaints(cmps);
  };

  useEffect(() => {
    cloudSync.pull().then(loadData).catch(loadData);
    // Poll every 4 seconds for real-time updates
    const interval = setInterval(() => {
      cloudSync.pull().then(loadData).catch(loadData);
    }, 4000);
    return () => clearInterval(interval);
  }, [user, dcpZone]);

  const handleResolveComplaintSubmit = (e) => {
    e.preventDefault();
    if (!resolvingComplaint) return;

    complaintStore.resolveComplaint(resolvingComplaint._id, resolutionRemarks);
    loadData();
    setResolvingComplaint(null);
    setResolutionRemarks('');
    setToast(`✓ Complaint #${resolvingComplaint.complaintTicket} marked as RESOLVED!`);
    setTimeout(() => setToast(''), 4000);
  };

  const pendingDocsCount   = documents.filter(d => d.status === 'PENDING_REVIEW').length;
  const verifiedDocsCount  = documents.filter(d => d.status === 'VERIFIED').length;
  const verifiedInstsCount = institutions.filter(i => i.status === 'VERIFIED').length;

  // Unlocked & Locked QR counts for this inspector's zone
  const qrUnlockedCount = institutions.filter(i => institutionStore.isCertificateUnlocked(i._id)).length;
  const qrLockedCount = institutions.length - qrUnlockedCount;

  // Aggregate Total Registered Students across all zone institutions
  const totalZoneStudents = institutions.reduce((sum, inst) => sum + (parseInt(inst.totalStudents) || 0), 0);

  const filteredInsts = institutions.filter(i => {
    const matchSearch =
      !search ||
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.safeId?.toLowerCase().includes(search.toLowerCase()) ||
      i.principal?.toLowerCase().includes(search.toLowerCase());

    const isUnlocked = institutionStore.isCertificateUnlocked(i._id);
    let matchQr = true;
    if (qrFilter === 'UNLOCKED') matchQr = isUnlocked;
    if (qrFilter === 'LOCKED') matchQr = !isUnlocked;

    return matchSearch && matchQr;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F9] p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs px-5 py-3 rounded-2xl shadow-2xl animate-fade-in flex items-center justify-between gap-4">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="text-white hover:text-[#D4AF37]">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-[#D4AF37] bg-[#0F2038] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#D4AF37]">
              INSPECTION OFFICER PORTAL
            </span>
            <span className="text-xs text-slate-500 font-semibold">UP Police Commissionerate • Lucknow</span>
          </div>
          <h1 className="text-xl font-black text-[#0F2038] font-serif flex items-center gap-2">
            Inspector Dashboard — <span className="text-[#D4AF37]">{dcpZone}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <MdLocalPolice size={14} className="text-[#D4AF37]" />
            <span>Officer: <strong>{user?.name || 'Inspection Officer'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Designation: <strong>{user?.designation || user?.rankLevel || 'Sub-Inspector'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Zone: <strong>{dcpZone}</strong></span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${ZONE_COLORS[dcpZone?.split(' ').pop()] || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
              {ZONE_ARROWS[dcpZone?.split(' ').pop()] || '⊕'} {dcpZone?.split(' ').pop()} ZONE
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/dashboard/inspector/document-approval"
            className="flex items-center gap-2 text-xs font-black text-[#0F2038] bg-gradient-to-r from-[#D4AF37] to-amber-500 border-2 border-[#D4AF37] px-4 py-2.5 rounded-xl hover:brightness-110 transition-all shadow-md cursor-pointer"
          >
            <FiFileText size={14} /> Document Approval ({pendingDocsCount} Pending)
          </Link>
          <Link
            to="/dashboard/inspector/evidence"
            className="flex items-center gap-2 text-xs font-black text-[#D4AF37] bg-[#0F2038] border-2 border-[#D4AF37] px-4 py-2.5 rounded-xl hover:bg-[#1E3A5F] transition-all shadow-md cursor-pointer"
          >
            <FiCamera size={14} /> Upload Evidence (Min 3 Photos)
          </Link>
        </div>
      </div>

      {/* 🚨 REAL-TIME ASSIGNED PUBLIC SAFETY COMPLAINTS ALERT & PANEL */}
      {assignedComplaints.length > 0 && (
        <div className="bg-[#0F2038] text-white border-4 border-amber-400 rounded-3xl p-5 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 text-[#0F2038] rounded-xl flex items-center justify-center text-xl font-black shadow">
                🚨
              </div>
              <div>
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded border border-[#D4AF37]/40">
                  District Authority Investigation Directives
                </span>
                <h3 className="text-sm font-black text-white font-serif mt-0.5">
                  Assigned Public Safety Complaints ({assignedComplaints.length} Active Investigations)
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-black text-rose-300 bg-rose-950 px-2.5 py-1 rounded-full border border-rose-600 uppercase animate-pulse">
              Requires Site Audit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedComplaints.map(cmp => (
              <div key={cmp._id} className="bg-white/10 border border-white/20 rounded-2xl p-4 space-y-2.5 text-xs text-slate-200">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-mono font-black text-[#D4AF37] text-xs">#{cmp.complaintTicket}</span>
                  <span className="text-[10px] text-slate-400">{cmp.submittedAt}</span>
                </div>

                <div>
                  <p className="text-xs font-black text-white">{cmp.institutionName}</p>
                  <p className="text-[11px] font-bold text-rose-400">Category: {cmp.category?.replace(/_/g, ' ')}</p>
                </div>

                <div className="bg-black/30 p-2.5 rounded-xl text-[11px] space-y-1">
                  <p className="text-amber-300 font-bold">District Mandate: "{cmp.districtDirectives}"</p>
                  <p className="text-slate-300 italic">Citizen Description: "{cmp.description}"</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-300">
                    Complainant: <strong>{cmp.complainantName}</strong> ({cmp.complainantPhone})
                  </span>
                  <button
                    onClick={() => setResolvingComplaint(cmp)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow"
                  >
                    <FiCheckCircle size={13} /> Complete Investigation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: `Total Registered Institutions (${dcpZone})`,
            value: institutions.length,
            icon: FiShield,
            color: 'bg-[#0F2038] text-[#D4AF37] border-[#D4AF37]',
            sub: `Total Students Enrolled: ${totalZoneStudents.toLocaleString('en-IN')}`
          },
          {
            label: '🔓 QR Code Unlocked & Issued',
            value: qrUnlockedCount,
            icon: MdQrCode2,
            color: 'bg-emerald-800 text-white border-emerald-400',
            sub: 'Safe ID Certificate Generated'
          },
          {
            label: '🔒 QR Code Locked (Pending Docs)',
            value: qrLockedCount,
            icon: FiLock,
            color: 'bg-amber-600 text-white border-amber-300',
            sub: 'Requires profile or doc clearance'
          },
          {
            label: 'Pending Doc Approvals',
            value: pendingDocsCount,
            icon: FiClock,
            color: 'bg-[#1E3A5F] text-amber-300 border-amber-400',
            sub: 'Awaiting inspector verification'
          },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className={`rounded-2xl border-2 p-4 ${color} shadow-md`}>
            <Icon size={20} className="mb-2" />
            <p className="text-xl font-black">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-90">{label}</p>
            <p className="text-[9px] opacity-80 mt-0.5 font-semibold">{sub}</p>
          </div>
        ))}
      </div>

      {/* 📊 PIE CHART: INSTITUTION TYPES (SCHOOLS, COLLEGES, COACHING CENTRES) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <InstitutionTypePieChart
            institutions={institutions}
            title={`${dcpZone} — Institutions Type Breakdown (Schools, Colleges, Coaching)`}
          />
        </div>

        {/* QR Audit Directive Card */}
        <div className="bg-[#0F2038] text-white border-2 border-[#D4AF37] rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MdQrCode2 size={22} className="text-[#D4AF37]" />
              <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                QR Code &amp; Safe ID Directive
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              Institutions must have their <strong>Complete Profile (with Total Enrolled Student Strength)</strong> and <strong>All 4 Safety Clearance NOCs (Fire, Building, Electrical, Evacuation)</strong> verified by you to generate their Safe ID &amp; QR Code.
            </p>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-300">Unlocked QR Certificates:</span>
              <span className="font-black text-emerald-400">{qrUnlockedCount} / {institutions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300">Locked QR Certificates:</span>
              <span className="font-black text-amber-400">{qrLockedCount} / {institutions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 QUICK NAVIGATION LINK TO MY INSPECTIONS PAGE */}
      <div className="bg-gradient-to-r from-[#0F2038] via-[#1E3A5F] to-[#0F2038] text-white rounded-3xl p-6 border-2 border-[#D4AF37] shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FiCheckSquare className="text-[#D4AF37]" size={20} />
            <h3 className="text-base font-black text-white font-serif">
              My Inspections &amp; Assigned Institutions ({institutions.length})
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            View full institution details, NOC safety clearance documents, uploaded School Photos, and perform QR lock/unlock enforcement.
          </p>
        </div>

        <Link
          to="/dashboard/inspector/inspections"
          className="bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl shadow-xl flex items-center gap-2 transition-all cursor-pointer border-2 border-amber-300"
        >
          <FiCheckSquare size={16} /> Open My Inspections Page →
        </Link>
      </div>

      {/* 🏛️ FULL INSTITUTION INFORMATION MODAL */}
      {selectedInstProfile && (
        <InstitutionFullDetailModal
          institution={selectedInstProfile}
          onClose={() => setSelectedInstProfile(null)}
        />
      )}

      {/* 👮 COMPLAINT INVESTIGATION RESOLUTION MODAL */}
      {resolvingComplaint && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border-4 border-emerald-500 overflow-hidden animate-fade-in">
            <div className="bg-[#0F2038] p-4 text-white flex items-center justify-between border-b-2 border-emerald-500">
              <div className="flex items-center gap-2">
                <img src="/up-police-logo.png" alt="UP Police" className="w-7 h-7 object-contain" />
                <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider">Complete Complaint Investigation</h3>
              </div>
              <button onClick={() => setResolvingComplaint(null)} className="text-white hover:text-[#D4AF37] font-black text-xl">✕</button>
            </div>

            <form onSubmit={handleResolveComplaintSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <p><span className="text-slate-500">Ticket ID:</span> <strong className="font-mono text-[#0F2038]">#{resolvingComplaint.complaintTicket}</strong></p>
                <p><span className="text-slate-500">Institution:</span> <strong className="text-[#0F2038]">{resolvingComplaint.institutionName}</strong></p>
                <p><span className="text-slate-500">Hazard Category:</span> <span className="font-bold text-rose-700">{resolvingComplaint.category}</span></p>
              </div>

              <div>
                <label className="block font-black text-[#0F2038] mb-1">Inspector Site Audit Resolution Remarks <span className="text-rose-500">*</span></label>
                <textarea
                  rows={4}
                  required
                  value={resolutionRemarks}
                  onChange={e => setResolutionRemarks(e.target.value)}
                  placeholder="Enter details of physical site audit conducted, action taken on hazard, and final clearance status..."
                  className="w-full text-xs border-2 border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#D4AF37] font-semibold resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="flex-1 text-xs font-black py-3 border border-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-black py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                >
                  <FiCheckCircle size={14} /> Mark as Resolved &amp; Notify District
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
