import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import { evidenceStore } from '../../api/evidenceStore';
import { complaintStore } from '../../api/complaintStore';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import {
  FiCheckSquare, FiClock, FiShield,
  FiEye, FiTrendingUp, FiSearch, FiFileText, FiCamera, FiUsers,
  FiAlertTriangle, FiCheck, FiX, FiInfo, FiLock, FiUnlock, FiZap
} from 'react-icons/fi';
import { MdVerified, MdLocalPolice, MdOutlineSchool, MdQrCode2 } from 'react-icons/md';

export const InspectorInspections = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [qrFilter, setQrFilter] = useState('ALL'); // ALL | UNLOCKED | LOCKED
  const [selectedInstProfile, setSelectedInstProfile] = useState(null);

  const dcpZone = user?.dcpZone || 'DCP Central';

  const loadData = () => {
    const insts = institutionStore.getInstitutionsForZone(dcpZone);
    setInstitutions(insts);
    const docs = institutionStore.getDocumentsForZone(dcpZone);
    setDocuments(docs);
    const cmps = complaintStore.getComplaintsForInspector(dcpZone);
    setComplaints(cmps);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [user, dcpZone]);

  const qrUnlockedCount = institutions.filter(i => institutionStore.isCertificateUnlocked(i._id)).length;
  const qrLockedCount = institutions.length - qrUnlockedCount;

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-[#D4AF37] bg-[#0F2038] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#D4AF37]">
              MY INSPECTIONS PORTAL
            </span>
            <span className="text-xs text-slate-500 font-semibold">UP Police Commissionerate • {dcpZone}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F2038] font-serif flex items-center gap-2">
            <FiCheckSquare className="text-[#D4AF37]" /> My Inspections &amp; Institution Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <MdLocalPolice size={14} className="text-[#D4AF37]" />
            <span>Officer: <strong>{user?.name || 'Inspection Officer'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Designation: <strong>{user?.designation || user?.rankLevel || 'Sub-Inspector'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>DCP Zone: <strong>{dcpZone}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Total Assigned Institutions: <strong>{institutions.length}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/inspector"
            className="flex items-center gap-2 text-xs font-black text-[#D4AF37] bg-[#0F2038] border-2 border-[#D4AF37] px-4 py-2.5 rounded-xl hover:bg-[#1E3A5F] transition-all shadow-md cursor-pointer"
          >
            ← Back to Overview Dashboard
          </Link>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#0F2038] text-white border-2 border-[#D4AF37] p-4 rounded-2xl shadow-md">
          <FiShield className="text-[#D4AF37] mb-1" size={20} />
          <p className="text-xl font-black">{institutions.length}</p>
          <p className="text-[10px] font-black uppercase text-[#D4AF37]">Zone Institutions</p>
        </div>
        <div className="bg-emerald-800 text-white border-2 border-emerald-400 p-4 rounded-2xl shadow-md">
          <FiUnlock className="mb-1" size={20} />
          <p className="text-xl font-black">{qrUnlockedCount}</p>
          <p className="text-[10px] font-black uppercase">🔓 QR Code Unlocked</p>
        </div>
        <div className="bg-amber-600 text-white border-2 border-amber-300 p-4 rounded-2xl shadow-md">
          <FiLock className="mb-1" size={20} />
          <p className="text-xl font-black">{qrLockedCount}</p>
          <p className="text-[10px] font-black uppercase">🔒 QR Code Locked</p>
        </div>
        <div className="bg-blue-900 text-white border-2 border-blue-400 p-4 rounded-2xl shadow-md">
          <FiFileText className="mb-1 text-blue-300" size={20} />
          <p className="text-xl font-black">{documents.length}</p>
          <p className="text-[10px] font-black uppercase text-blue-200">Total Uploaded Docs</p>
        </div>
      </div>



      {/* Real-time Institution Registry & Capacity Audit Table */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-lg overflow-hidden space-y-2">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black text-[#0F2038] uppercase tracking-wider flex items-center gap-2 font-serif">
              <FiShield size={15} className="text-[#D4AF37]" />
              {dcpZone} — Assigned Institutions Inspection List ({filteredInsts.length})
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              Click on any institution to view full profile details, NOC safety clearance certificates, and uploaded School Photos.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
              {[
                { id: 'ALL', label: `All (${institutions.length})` },
                { id: 'UNLOCKED', label: `🔓 QR Unlocked (${qrUnlockedCount})` },
                { id: 'LOCKED', label: `🔒 QR Locked (${qrLockedCount})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setQrFilter(f.id)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    qrFilter === f.id ? 'bg-[#0F2038] text-[#D4AF37] shadow-sm' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search institution..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredInsts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                🏫
              </div>
              <p className="text-sm font-black text-[#0F2038]">
                No Institutions Match Selected Filter
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                {search
                  ? `No institution matches "${search}" in ${dcpZone} zone.`
                  : `No institutions currently match the "${qrFilter}" filter.`}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  <th className="text-left p-3.5">Safe ID</th>
                  <th className="text-left p-3.5">Institution Name &amp; Address</th>
                  <th className="text-left p-3.5">Type</th>
                  <th className="text-left p-3.5">Students &amp; Capacity</th>
                  <th className="text-left p-3.5">Staff &amp; Exits</th>
                  <th className="text-left p-3.5">Profile</th>
                  <th className="text-left p-3.5">QR Status</th>
                  <th className="text-center p-3.5">Inspection Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInsts.map(inst => {
                  const instDocs = documents.filter(d => d.institutionId === inst._id);
                  const pendingCountForInst = instDocs.filter(d => d.status === 'PENDING_REVIEW').length;
                  const isProfileComplete = institutionStore.isProfileComplete(inst._id);
                  const isUnlocked = institutionStore.isCertificateUnlocked(inst._id);

                  const students = parseInt(inst.totalStudents) || 0;
                  const classrooms = parseInt(inst.totalClassrooms) || 0;
                  const avgPerClass = classrooms > 0 ? Math.round(students / classrooms) : 0;

                  return (
                    <tr key={inst._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-black text-[#0F2038] text-[10px]">{inst.safeId}</td>
                      <td className="p-3.5">
                        <p
                          onClick={() => setSelectedInstProfile(inst)}
                          className="font-black text-[#0F2038] text-xs hover:text-[#D4AF37] cursor-pointer flex items-center gap-1"
                        >
                          {inst.name}
                        </p>
                        <p className="text-[10px] text-slate-500">{inst.affiliationBoard || 'CBSE'} ({inst.affiliationCode || 'Code Pending'})</p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate max-w-xs">{inst.address}</p>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                          {inst.type}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-black text-sm text-[#0F2038] flex items-center gap-1">
                          <FiUsers size={12} className="text-[#D4AF37]" /> {students > 0 ? students.toLocaleString('en-IN') : '0 (Not Set)'}
                        </div>
                        {avgPerClass > 50 && (
                          <span className="text-[9px] font-black text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.2 rounded inline-block mt-0.5">
                            ⚠️ Over-capacity ({avgPerClass}/class)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-600 font-semibold space-y-0.5">
                        <p>Staff: <strong className="text-[#0F2038]">{inst.staffCount || inst.totalTeachers || '—'}</strong> | Classrooms: <strong className="text-[#0F2038]">{inst.classroomCount || inst.totalClassrooms || '—'}</strong></p>
                        <p>Floors: <strong className="text-[#0F2038]">{inst.floorCount || inst.buildingFloors || '1'}</strong> | Exits: <strong className="text-[#0F2038]">{inst.exitGateCount || '2'} Gates</strong></p>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${
                          isProfileComplete
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          {isProfileComplete ? '✓ COMPLETE' : '✗ INCOMPLETE'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${
                          inst.qrLocked ? 'bg-rose-600 text-white animate-pulse' :
                          isUnlocked ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {inst.qrLocked ? '🚨 QR REVOKED' : isUnlocked ? '🔓 QR GENERATED' : '🔒 QR LOCKED'}
                        </span>
                      </td>
                      <td className="p-3.5 space-y-1.5">
                        <button
                          onClick={() => setSelectedInstProfile(inst)}
                          className="text-[11px] font-black bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] px-3 py-1.5 rounded-xl hover:bg-[#1E3A5F] transition-all flex items-center gap-1 cursor-pointer w-full justify-center shadow-sm"
                        >
                          <FiEye size={12} /> View Details &amp; Docs
                        </button>
                        <Link
                          to="/dashboard/inspector/document-approval"
                          className="text-[10px] font-black text-[#0F2038] bg-[#D4AF37]/20 border border-[#D4AF37] px-2.5 py-1 rounded-xl hover:bg-[#0F2038] hover:text-[#D4AF37] transition-all flex items-center gap-1 justify-center w-full"
                        >
                          Verify Docs {pendingCountForInst > 0 && `(${pendingCountForInst})`}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 🏛️ FULL INSTITUTION INFORMATION MODAL */}
      {selectedInstProfile && (
        <InstitutionFullDetailModal
          institution={selectedInstProfile}
          onClose={() => setSelectedInstProfile(null)}
        />
      )}
    </div>
  );
};
