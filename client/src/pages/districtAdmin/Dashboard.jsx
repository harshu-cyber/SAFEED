import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import { cloudSync } from '../../api/cloudSync';
import { evidenceStore } from '../../api/evidenceStore';
import { complaintStore } from '../../api/complaintStore';
import { InstitutionTypePieChart } from '../../components/common/Charts/InstitutionTypePieChart';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import {
  FiShield, FiAlertTriangle, FiCheckSquare, FiMapPin, FiSearch, FiFilter,
  FiEye, FiDownload, FiTrendingUp, FiUsers, FiBarChart2, FiActivity, FiCalendar, FiClock,
  FiUserPlus, FiEdit3, FiCheckCircle, FiXCircle, FiFileText, FiCamera, FiLock, FiUnlock, FiRefreshCw,
  FiMaximize2, FiInfo, FiMessageSquare, FiSend, FiUserCheck, FiCopy, FiCheck, FiArrowRight
} from 'react-icons/fi';
import { MdVerified, MdOutlinePendingActions, MdLocalPolice, MdQrCode2 } from 'react-icons/md';

const INSPECTION_OFFICERS = [
  { name: 'DCP WEST', email: 'dcpwest@safeedup.gov.in', zone: 'WEST', title: 'West Zone Inspector' },
  { name: 'DCP CENTRAL', email: 'dcpcentral@safeedup.gov.in', zone: 'CENTRAL', title: 'Central Zone Inspector' },
  { name: 'DCP NORTH', email: 'dcpnorth@safeedup.gov.in', zone: 'NORTH', title: 'North Zone Inspector' },
  { name: 'DCP EAST', email: 'dcpeast@safeedup.gov.in', zone: 'EAST', title: 'East Zone Inspector' },
  { name: 'DCP SOUTH', email: 'dcpsouth@safeedup.gov.in', zone: 'SOUTH', title: 'South Zone Inspector' },
];

const ZONE_COLORS = {
  WEST: 'bg-purple-100 text-purple-800 border-purple-300',
  CENTRAL: 'bg-blue-100 text-blue-800 border-blue-300',
  NORTH: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  EAST: 'bg-amber-100 text-amber-800 border-amber-300',
  SOUTH: 'bg-rose-100 text-rose-800 border-rose-300',
};

const RISK_BADGES = {
  LOW: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
  HIGH: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
  UNDER_REVIEW: 'bg-slate-100 text-slate-700 border-slate-300',
};

export const DistrictAdminDashboard = ({ defaultTab }) => {
  const { user } = useAuth();
  const location = useLocation();
  const districtName = user?.district || 'Lucknow';

  const [institutions, setInstitutions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | PENDING | HIGH_RISK | VERIFIED | COMPLAINTS | ANALYTICS
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [toast, setToast] = useState('');

  // Modals state
  const [assignModalInst, setAssignModalInst] = useState(null);
  const [selectedInspector, setSelectedInspector] = useState(INSPECTION_OFFICERS[0].name);
  const [assignNotes, setAssignNotes] = useState('');

  const [assignComplaintModal, setAssignComplaintModal] = useState(null);
  const [complaintInspector, setComplaintInspector] = useState(INSPECTION_OFFICERS[0].name);
  const [complaintDirectives, setComplaintDirectives] = useState('');

  const [actionModalInst, setActionModalInst] = useState(null);
  const [actionType, setActionType] = useState('NOTICE_ISSUED');
  const [newRiskLevel, setNewRiskLevel] = useState('HIGH');
  const [actionRemarks, setActionRemarks] = useState('');

  const [reportModalInst, setReportModalInst] = useState(null);
  const [zoomPhoto, setZoomPhoto] = useState(null);
  const [selectedZoneModal, setSelectedZoneModal] = useState(null); // Zone Audit Modal

  // Sync tab with props or URL path
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (location.pathname.includes('/complaints') || location.pathname.includes('/compliance')) {
      setActiveTab('COMPLAINTS');
    } else if (location.pathname.includes('/analytics')) {
      setActiveTab('ANALYTICS');
    }
  }, [defaultTab, location.pathname]);

  const loadRealTimeData = async () => {
    try { await cloudSync.pull(); } catch {}
    const insts = institutionStore.getInstitutions();
    setInstitutions(insts);
    const docs = institutionStore.getDocuments();
    setDocuments(docs);
    const evs = evidenceStore.getEvidenceList();
    setEvidenceList(evs);
    const cmps = complaintStore.getComplaints();
    setComplaints(cmps);
  };

  useEffect(() => {
    loadRealTimeData();
    // Real-time interval polling every 5 seconds
    const interval = setInterval(loadRealTimeData, 5000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // 🛡️ Zone & Role-based Authority Jurisdiction Filtering
  // Higher Posts (DGP, CP, JCP) -> Full Lucknow District Oversight (All Zones & All Complaints)
  // Zonal Posts (DCP, ADCP, ACP) -> Restricted strictly to their assigned DCP Zone
  const isHigherCommand = ['DGP', 'CP', 'JCP'].includes(user?.rankLevel);
  const userZoneNorm = user?.dcpZone ? user.dcpZone.toUpperCase().replace('DCP', '').trim() : '';
  const isZonalOfficer = !isHigherCommand && Boolean(userZoneNorm);
  const userZone = isZonalOfficer ? userZoneNorm : null;

  // Base Visible Datasets based on Officer's Jurisdiction
  const visibleInstitutions = isZonalOfficer
    ? institutions.filter(i => (i.zone || '').toUpperCase().replace('DCP', '').trim() === userZone)
    : institutions;

  const visibleComplaints = isZonalOfficer
    ? complaints.filter(c => (c.zone || '').toUpperCase().replace('DCP', '').trim() === userZone)
    : complaints;

  // Metrics calculation
  const totalInsts = visibleInstitutions.length;
  const totalStudents = visibleInstitutions.reduce((acc, i) => acc + (parseInt(i.totalStudents) || 0), 0);
  const verifiedCount = visibleInstitutions.filter(i => i.status === 'VERIFIED').length;
  const pendingCount = visibleInstitutions.filter(i => i.status !== 'VERIFIED').length;
  const highRiskCount = visibleInstitutions.filter(i => i.riskLevel === 'HIGH' || i.complianceScore < 50).length;
  const pendingComplaintsCount = visibleComplaints.filter(c => c.status === 'PENDING_DISTRICT_ACTION').length;

  const zoneBreakdown = {
    WEST: visibleInstitutions.filter(i => (i.zone || '').toUpperCase().includes('WEST')),
    CENTRAL: visibleInstitutions.filter(i => (i.zone || '').toUpperCase().includes('CENTRAL')),
    NORTH: visibleInstitutions.filter(i => (i.zone || '').toUpperCase().includes('NORTH')),
    EAST: visibleInstitutions.filter(i => (i.zone || '').toUpperCase().includes('EAST')),
    SOUTH: visibleInstitutions.filter(i => (i.zone || '').toUpperCase().includes('SOUTH')),
  };

  // Filtered institutions (with search by Institution Name OR Police Station Name)
  const filteredInstitutions = visibleInstitutions.filter(inst => {
    const s = search.trim().toLowerCase();
    const matchSearch =
      !s ||
      inst.name?.toLowerCase().includes(s) ||
      inst.safeId?.toLowerCase().includes(s) ||
      inst.principal?.toLowerCase().includes(s) ||
      inst.nearestPoliceStation?.toLowerCase().includes(s) ||
      inst.postingStation?.toLowerCase().includes(s) ||
      inst.address?.toLowerCase().includes(s);

    const matchZone = zoneFilter === 'ALL' || (inst.zone || '').toUpperCase().includes(zoneFilter);

    let matchTab = true;
    if (activeTab === 'PENDING') matchTab = inst.status !== 'VERIFIED';
    if (activeTab === 'VERIFIED') matchTab = inst.status === 'VERIFIED';
    if (activeTab === 'HIGH_RISK') matchTab = inst.riskLevel === 'HIGH' || inst.complianceScore < 50;

    return matchSearch && matchZone && matchTab;
  });

  // Assign inspector to institution submission
  const handleAssignInspector = (e) => {
    e.preventDefault();
    if (!assignModalInst) return;

    const inspector = INSPECTION_OFFICERS.find(o => o.name === selectedInspector) || INSPECTION_OFFICERS[0];
    institutionStore.assignInspectorToInstitution(assignModalInst._id, inspector);

    loadRealTimeData();
    setAssignModalInst(null);
    setAssignNotes('');
    showToast(`✅ Inspection assigned to ${inspector.name} for ${assignModalInst.name}`);
  };

  // Assign DCP Inspector to Public Complaint submission
  const handleAssignComplaint = (e) => {
    e.preventDefault();
    if (!assignComplaintModal) return;

    const officer = INSPECTION_OFFICERS.find(o => o.name === complaintInspector) || INSPECTION_OFFICERS[0];
    complaintStore.assignInspectorToComplaint(assignComplaintModal._id, officer, complaintDirectives);

    loadRealTimeData();
    setAssignComplaintModal(null);
    setComplaintDirectives('');
    showToast(`🚨 Public Complaint #${assignComplaintModal.complaintTicket} assigned to ${officer.name} for site investigation!`);
  };

  // Action & Remarks update submission
  const handleActionSubmit = (e) => {
    e.preventDefault();
    if (!actionModalInst) return;

    institutionStore.updateDistrictActionRemarks(actionModalInst._id, {
      actionType,
      riskLevel: newRiskLevel,
      remarks: actionRemarks,
      issuedBy: `${user?.name || 'District Authority'} (${districtName})`,
    });

    loadRealTimeData();
    setActionModalInst(null);
    setActionRemarks('');
    showToast(`⚡ Action/Remarks updated for ${actionModalInst.name}`);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img src="/up-govt-seal.png" alt="UP Seal" className="w-7 h-7 object-contain" />
            <span className="text-[10px] font-black text-[#D4AF37] bg-[#0F2038] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#D4AF37]">
              Government of UP • District Authority Portal
            </span>
          </div>
          <h1 className="text-xl font-black text-[#0F2038] font-serif">
            District Safety Control &amp; Monitoring Centre — <span className="text-[#D4AF37]">{districtName}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap font-semibold">
            <MdLocalPolice size={15} className="text-[#D4AF37]" />
            <span>Officer: <strong>{user?.name || 'District Authority Officer'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Rank: <strong>{user?.rankLevel || user?.designation || 'District Admin'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>
              Jurisdiction:{' '}
              {isHigherCommand ? (
                <strong className="text-purple-800 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                  🏛️ District Command ({districtName} — All Zones)
                </strong>
              ) : (
                <strong className="text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
                  🛡️ {user?.dcpZone || 'DCP Central Zone'} Jurisdiction
                </strong>
              )}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadRealTimeData}
            className="flex items-center gap-1.5 text-xs font-black px-3.5 py-2 bg-white text-[#0F2038] border-2 border-slate-300 rounded-xl hover:border-[#D4AF37] transition-all cursor-pointer shadow-sm"
          >
            <FiRefreshCw size={13} className="text-[#D4AF37]" /> Refresh Live Data
          </button>

          <a
            href="/api/v1/reports/district/excel"
            download
            className="flex items-center gap-1.5 text-xs font-black px-4 py-2 bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] rounded-xl hover:bg-[#1E3A5F] transition-all cursor-pointer shadow-md"
          >
            <FiDownload size={13} /> Export District Report (Excel)
          </a>
        </div>
      </div>

      {/* Real-time Pending Complaints Alert Banner */}
      {pendingComplaintsCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center text-xl font-black shadow">
              💬
            </div>
            <div>
              <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                Public Safety Complaints Alert ({pendingComplaintsCount} Pending Action)
              </h3>
              <p className="text-xs text-amber-900 font-semibold mt-0.5">
                There are <strong className="text-rose-700 underline font-black">{pendingComplaintsCount} citizen complaint(s)</strong> awaiting inspector assignment. Assign a DCP Inspector to investigate immediately.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('COMPLAINTS')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all flex-shrink-0 cursor-pointer shadow"
          >
            Review Public Complaints →
          </button>
        </div>
      )}

      {/* Real-time High Risk Alert Banner */}
      {highRiskCount > 0 && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center text-xl font-black shadow">
              🚨
            </div>
            <div>
              <h3 className="text-xs font-black text-rose-950 uppercase tracking-wider">
                Critical Safety Alert — High Risk Institutions Flagged
              </h3>
              <p className="text-xs text-rose-900 font-semibold mt-0.5">
                There are <strong className="text-rose-700 underline">{highRiskCount} institution(s)</strong> in {districtName} with compliance score &lt; 50% or pending critical safety NOCs.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('HIGH_RISK')}
            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all flex-shrink-0 cursor-pointer shadow"
          >
            Review High Risk Cases →
          </button>
        </div>
      )}

      {/* Interactive Dynamic Metrics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            tab: 'ALL',
            label: 'Total Registered Institutions',
            value: totalInsts,
            icon: FiShield,
            color: 'bg-[#0F2038] text-[#D4AF37] border-[#D4AF37]',
            sub: `Total Enrolled Students: ${totalStudents.toLocaleString('en-IN')}`
          },
          {
            tab: 'COMPLAINTS',
            label: 'Public Safety Complaints',
            value: complaints.length,
            icon: FiMessageSquare,
            color: 'bg-[#1E3A5F] text-amber-300 border-amber-400',
            sub: `${pendingComplaintsCount} awaiting DCP assignment`
          },
          {
            tab: 'VERIFIED',
            label: 'Verified & Certified (QR Issued)',
            value: verifiedCount,
            icon: MdVerified,
            color: 'bg-emerald-700 text-white border-emerald-500',
            sub: 'Safe ID & QR Code Generated'
          },
          {
            tab: 'HIGH_RISK',
            label: 'High Risk / Action Cases',
            value: highRiskCount,
            icon: FiAlertTriangle,
            color: 'bg-rose-800 text-white border-rose-500',
            sub: 'Requires district intervention'
          },
        ].map(({ tab, label, value, icon: Icon, color, sub }) => (
          <div
            key={label}
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl border-2 p-4 ${color} shadow-md hover:scale-[1.02] transition-transform cursor-pointer group relative overflow-hidden`}
          >
            <div className="flex justify-between items-start">
              <Icon size={20} className="mb-2" />
              <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Filter View →
              </span>
            </div>
            <p className="text-2xl font-black">{value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider opacity-90">{label}</p>
            <p className="text-[9px] opacity-80 mt-0.5 font-semibold">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Navigation Tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: `All Institutions (${totalInsts})` },
              { id: 'COMPLAINTS', label: `Public Complaints (${complaints.length}) 💬` },
              { id: 'PENDING', label: `Pending Compliance (${pendingCount})` },
              { id: 'HIGH_RISK', label: `High Risk Cases (${highRiskCount})` },
              { id: 'VERIFIED', label: `Verified (${verifiedCount})` },
              { id: 'ANALYTICS', label: 'Zone Safety Analytics & Map 📊' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-[#0F2038] text-[#D4AF37] border-[#D4AF37] shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Zone Filter */}
          {activeTab !== 'ANALYTICS' && activeTab !== 'COMPLAINTS' && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 sm:w-56">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search school, safe ID, principal..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <select
                value={zoneFilter}
                onChange={e => setZoneFilter(e.target.value)}
                className="text-xs font-bold p-2 border border-slate-300 rounded-xl outline-none bg-white"
              >
                <option value="ALL">All Zones</option>
                <option value="WEST">West Zone</option>
                <option value="CENTRAL">Central Zone</option>
                <option value="NORTH">North Zone</option>
                <option value="EAST">East Zone</option>
                <option value="SOUTH">South Zone</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 💬 TAB: PUBLIC SAFETY COMPLAINTS CARDS GRID */}
      {activeTab === 'COMPLAINTS' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-[#0F2038] border-2 border-[#D4AF37] rounded-2xl p-4 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <img src="/up-police-logo.png" alt="UP Police" className="w-8 h-8 object-contain bg-white rounded-full p-0.5 border border-[#D4AF37]" />
              <div>
                <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest">
                  Public Safety Complaints Control Panel ({visibleComplaints.length} Total Complaints)
                </h3>
                <p className="text-xs text-slate-300">
                  Citizen complaints submitted from the Landing Page. Click <strong>"View Full Complaint &amp; Assign DCP"</strong> on any card to view full details and route to a DCP Inspector.
                </p>
              </div>
            </div>

            <span className="text-[11px] font-black text-[#D4AF37] bg-white/10 px-3 py-1 rounded-xl border border-[#D4AF37]">
              {pendingComplaintsCount} Pending Action
            </span>
          </div>

          {visibleComplaints.length === 0 ? (
            <div className="bg-white p-12 text-center space-y-3 rounded-2xl border-2 border-slate-200">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                💬
              </div>
              <p className="text-sm font-black text-[#0F2038]">No Public Complaints Submitted Yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {isZonalOfficer ? `No public safety complaints flagged in your assigned zone (${userZoneNorm}).` : 'When citizens or parents report a safety concern from the Landing Page, interactive complaint cards will appear here in real-time.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleComplaints.map(cmp => {
                const isPending = cmp.status === 'PENDING_DISTRICT_ACTION';
                const isAssigned = cmp.status === 'INVESTIGATION_ASSIGNED';

                return (
                  <div
                    key={cmp._id}
                    className="bg-white border-2 border-slate-200 hover:border-[#D4AF37] rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Ticket & Status Pill */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="font-mono font-black text-xs text-[#0F2038] bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                          #{cmp.complaintTicket}
                        </span>

                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase ${
                          cmp.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isAssigned
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                        }`}>
                          {cmp.status === 'RESOLVED' ? '✓ RESOLVED' : isAssigned ? '👮 ASSIGNED' : '⏳ PENDING'}
                        </span>
                      </div>

                      {/* Institution & Hazard Category */}
                      <div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase mb-1.5 inline-block ${ZONE_COLORS[cmp.zone || 'CENTRAL']}`}>
                          DCP {cmp.zone || 'CENTRAL'} ZONE
                        </span>
                        <h4 className="text-sm font-black text-[#0F2038] group-hover:text-amber-600 transition-colors font-serif">
                          {cmp.institutionName}
                        </h4>
                        <p className="text-xs font-black text-rose-700 mt-0.5">
                          Category: {cmp.category?.replace(/_/g, ' ')}
                        </p>
                      </div>

                      {/* Complaint Description Snippet */}
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs text-slate-700 italic space-y-1">
                        <p className="line-clamp-3">"{cmp.description}"</p>
                        <p className="text-[9px] text-slate-400 not-italic font-mono pt-1">
                          Submitted: {cmp.submittedAt}
                        </p>
                      </div>

                      {/* Complainant & Assigned Officer */}
                      <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                        <p><span className="text-slate-400 font-semibold">Complainant:</span> <strong>{cmp.complainantName}</strong> ({cmp.complainantPhone})</p>
                        <p><span className="text-slate-400 font-semibold">Assigned DCP:</span> <strong className="text-[#0F2038]">{cmp.assignedInspector || 'Awaiting Allocation'}</strong></p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        setAssignComplaintModal(cmp);
                        const defaultOfficer = INSPECTION_OFFICERS.find(o => o.zone === cmp.zone) || INSPECTION_OFFICERS[0];
                        setComplaintInspector(cmp.assignedInspector || defaultOfficer.name);
                        setComplaintDirectives(cmp.districtDirectives || `Investigate citizen complaint #${cmp.complaintTicket} regarding ${cmp.category} at ${cmp.institutionName}`);
                      }}
                      className="w-full bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs py-3 rounded-2xl hover:bg-[#1E3A5F] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
                    >
                      <FiEye size={13} /> View Full Details &amp; Assign DCP →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 📊 TAB 5: DISTRICT ANALYTICS & ZONES MAP (DYNAMIC INTERACTIVE CARDS) */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="bg-[#0F2038] border-2 border-[#D4AF37] rounded-2xl p-4 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#D4AF37]/20 border border-[#D4AF37] rounded-xl flex items-center justify-center text-xl text-[#D4AF37]">
                📊
              </div>
              <div>
                <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-widest">
                  Zone-Wise Safety &amp; QR Certificate Real-Time Breakdown
                </h3>
                <p className="text-xs text-slate-300">
                  Touch / click any DCP Zone card below to view all registered schools, total student strength, and QR Code generation status for that zone.
                </p>
              </div>
            </div>
          </div>

          {/* DYNAMIC INTERACTIVE ZONE BREAKDOWN CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {['WEST', 'CENTRAL', 'NORTH', 'EAST', 'SOUTH'].map(zone => {
              const zoneInsts = zoneBreakdown[zone] || [];
              const zoneStudents = zoneInsts.reduce((a, i) => a + (parseInt(i.totalStudents) || 0), 0);
              const zoneQrUnlocked = zoneInsts.filter(i => institutionStore.isCertificateUnlocked(i._id)).length;
              const zoneQrLocked = zoneInsts.length - zoneQrUnlocked;
              const dcpOfficer = INSPECTION_OFFICERS.find(o => o.zone === zone);

              return (
                <div
                  key={zone}
                  onClick={() => setSelectedZoneModal({ zone, zoneInsts, zoneStudents, zoneQrUnlocked, zoneQrLocked, dcpOfficer })}
                  className="bg-white border-2 border-slate-200 hover:border-[#D4AF37] rounded-3xl p-5 space-y-3 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${ZONE_COLORS[zone]}`}>
                        DCP {zone}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {zoneInsts.length} Registered
                      </span>
                    </div>

                    <p className="text-base font-black text-[#0F2038] group-hover:text-amber-600 transition-colors font-serif">
                      DCP {zone}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">{dcpOfficer?.email}</p>

                    <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-semibold text-[10px]">Enrolled Students:</span>
                        <strong className="text-[#0F2038] font-black">{zoneStudents.toLocaleString('en-IN')}</strong>
                      </div>

                      {/* QR Status Breakdown */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-emerald-800 font-bold flex items-center gap-1">
                            <MdQrCode2 size={12} className="text-emerald-600" /> QR Generated:
                          </span>
                          <strong className="text-emerald-700 font-black">{zoneQrUnlocked}</strong>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-amber-800 font-bold flex items-center gap-1">
                            <FiLock size={10} className="text-amber-600" /> QR Pending:
                          </span>
                          <strong className="text-amber-700 font-black">{zoneQrLocked}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="w-full bg-[#0F2038] group-hover:bg-amber-600 text-[#D4AF37] group-hover:text-white font-black text-[10px] py-2 rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm">
                      Touch to View Zone Directory →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* District Analytics: Pie Charts + Compliance Bars + Directives */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Institution Type Pie Chart */}
            <InstitutionTypePieChart
              institutions={institutions}
              title={`${districtName} District — All Zones Type Breakdown`}
            />

            {/* QR Certificate Status Pie Chart */}
            <InstitutionTypePieChart
              institutions={institutions}
              title={`QR Safe ID Status — ${districtName}`}
              overrideSections={[
                { name: 'QR Code Generated (🔓 Unlocked)', count: verifiedCount, color: '#065F46', strokeColor: '#34D399' },
                { name: 'QR Code Locked (🔒 Pending)', count: pendingCount, color: '#92400E', strokeColor: '#FBBF24' },
                { name: 'High Risk Institutions', count: highRiskCount, color: '#991B1B', strokeColor: '#F87171' },
              ]}
            />

            {/* Safety Directives & Compliance Bars */}
            <div className="space-y-4">
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-[#0F2038] uppercase tracking-wider flex items-center gap-2">
                  <FiBarChart2 className="text-[#D4AF37]" /> Compliance Status ({districtName})
                </h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'QR Generated & Certified', count: verifiedCount, color: 'bg-emerald-500' },
                    { label: 'Pending Document Review', count: pendingCount, color: 'bg-amber-500' },
                    { label: 'High Risk / Deficient', count: highRiskCount, color: 'bg-rose-600' },
                  ].map(({ label, count, color }) => {
                    const pct = totalInsts > 0 ? Math.round((count / totalInsts) * 100) : 0;
                    return (
                      <div key={label} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold text-slate-700">
                          <span>{label}</span>
                          <span>{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#0F2038] text-white border-2 border-[#D4AF37] rounded-2xl p-4 shadow-lg space-y-2">
                <h3 className="text-xs font-black text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                  <FiShield /> District Safety Directives
                </h3>
                <div className="text-xs space-y-1.5 text-slate-300 leading-relaxed font-semibold">
                  <p>1. <strong>4 Mandatory NOC Clearances</strong> required before QR unlock.</p>
                  <p>2. <strong>Minimum 3 inspector site photos</strong> mandatory per school.</p>
                  <p>3. <strong>Over-strength alerts</strong> auto-flagged when student-per-class &gt; 50.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏫 MAIN INSTITUTIONS REGISTRY & AUDIT TABLE */}
      {activeTab !== 'ANALYTICS' && activeTab !== 'COMPLAINTS' && (
        <>
          {/* Pie Charts above the institutions table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InstitutionTypePieChart
              institutions={filteredInstitutions}
              title={`Registered Institution Types — ${activeTab === 'ALL' ? 'All Zones' : activeTab}`}
            />

            {/* QR Status Quick Stats */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-black text-[#D4AF37] bg-[#0F2038] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Real-Time QR Analytics
                  </span>
                  <h3 className="text-xs font-black text-[#0F2038] uppercase tracking-wider font-serif mt-1">
                    Safe ID &amp; QR Certificate Status — {filteredInstitutions.length} Institutions
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: '🔓 QR Code Generated',
                    sub: 'Safe ID Certificate Issued',
                    count: filteredInstitutions.filter(i => institutionStore.isCertificateUnlocked(i._id)).length,
                    color: 'bg-emerald-700 text-white border-emerald-500',
                  },
                  {
                    label: '🔒 QR Code Locked',
                    sub: 'Pending Profile / Docs / Inspection',
                    count: filteredInstitutions.filter(i => !institutionStore.isCertificateUnlocked(i._id)).length,
                    color: 'bg-amber-600 text-white border-amber-400',
                  },
                ].map(({ label, sub, count, color }) => (
                  <div key={label} className={`rounded-2xl border-2 p-4 ${color} shadow-md`}>
                    <p className="text-2xl font-black">{count}</p>
                    <p className="text-[10px] font-black uppercase tracking-wide opacity-95 mt-0.5">{label}</p>
                    <p className="text-[9px] opacity-80 mt-1 font-semibold">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Mini progress bar */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-slate-600">
                  <span>QR Unlock Rate</span>
                  <span>
                    {filteredInstitutions.length > 0
                      ? Math.round((filteredInstitutions.filter(i => institutionStore.isCertificateUnlocked(i._id)).length / filteredInstitutions.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700"
                    style={{
                      width: `${filteredInstitutions.length > 0
                        ? Math.round((filteredInstitutions.filter(i => institutionStore.isCertificateUnlocked(i._id)).length / filteredInstitutions.length) * 100)
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-[#0F2038] uppercase tracking-wider">
                  Real-Time Institution Audit &amp; Action Portal ({filteredInstitutions.length} Institutions)
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  Click on any school name to view assigned inspector &amp; site evidence photos.
                </p>
              </div>
            </div>

          <div className="overflow-x-auto">
            {filteredInstitutions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                  🏫
                </div>
                <p className="text-sm font-black text-[#0F2038]">No Institutions Found</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  {search ? `No matches for "${search}"` : 'When schools register in your district, they will appear here in real-time.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    <th className="text-left p-3">Safe ID / Institution Name</th>
                    <th className="text-left p-3">Type &amp; Board</th>
                    <th className="text-left p-3">Zone</th>
                    <th className="text-left p-3">Students</th>
                    <th className="text-left p-3">Compliance</th>
                    <th className="text-left p-3">Assigned Inspector</th>
                    <th className="text-left p-3">Risk Level</th>
                    <th className="text-left p-3">Safe ID / QR Status</th>
                    <th className="text-left p-3">District Authority Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInstitutions.map(inst => {
                    const instDocs = documents.filter(d => d.institutionId === inst._id);
                    const verifiedDocs = instDocs.filter(d => d.status === 'VERIFIED').length;
                    const zoneKey = inst.zone || 'CENTRAL';
                    const isUnlocked = institutionStore.isCertificateUnlocked(inst._id);
                    const instEvidence = evidenceStore.getEvidenceForInstitution(inst._id);

                    return (
                      <tr key={inst._id} className="hover:bg-slate-50 transition-colors">
                        {/* Safe ID / Name (Clickable to open full audit & photo report modal) */}
                        <td className="p-3">
                          <p className="font-mono font-black text-[#0F2038] text-[10px]">{inst.safeId}</p>
                          <button
                            onClick={() => setReportModalInst(inst)}
                            className="font-black text-[#0F2038] text-xs hover:text-[#D4AF37] transition-colors text-left flex items-center gap-1 cursor-pointer"
                          >
                            <span>{inst.name}</span>
                            <FiEye size={12} className="text-[#D4AF37]" />
                          </button>
                          <p className="text-[10px] text-slate-500 font-semibold">{inst.address}</p>
                          <p className="text-[9px] font-black text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1 mt-0.5">
                            <MdLocalPolice size={10} className="text-blue-800" />
                            {inst.nearestPoliceStation || `${inst.district || 'Hazratganj'} Police Station`}
                          </p>
                        </td>

                        {/* Type & Board */}
                        <td className="p-3 font-semibold text-slate-700">
                          <p>{inst.type}</p>
                          <p className="text-[10px] text-slate-500">{inst.affiliationBoard || 'CBSE'} ({inst.affiliationCode || 'Code Pending'})</p>
                        </td>

                        {/* Zone */}
                        <td className="p-3">
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${ZONE_COLORS[zoneKey]}`}>
                            DCP {zoneKey}
                          </span>
                        </td>

                        {/* Students */}
                        <td className="p-3 font-black text-[#0F2038]">
                          {parseInt(inst.totalStudents)?.toLocaleString('en-IN') || 0}
                        </td>

                        {/* Compliance Score */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-[#0F2038]">{inst.complianceScore}%</span>
                            <span className="text-[10px] text-slate-500">({verifiedDocs}/4 NOCs)</span>
                          </div>
                          <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full ${inst.complianceScore >= 100 ? 'bg-emerald-500' : inst.complianceScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${inst.complianceScore}%` }}
                            />
                          </div>
                        </td>

                        {/* Assigned Inspector (Auto-assigned to DCP <ZONE> by default) */}
                        <td className="p-3">
                          <div>
                            <p className="font-black text-xs text-[#0F2038] flex items-center gap-1">
                              <MdLocalPolice className="text-[#D4AF37]" /> {inst.assignedInspector || `DCP ${zoneKey}`}
                            </p>
                            <p className="text-[9px] text-slate-400">{inst.assignedAt || 'Auto-Assigned'}</p>
                            {instEvidence.length > 0 ? (
                              <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 inline-flex items-center gap-0.5 mt-0.5">
                                <FiCamera size={9} /> {instEvidence.reduce((a, e) => a + (e.photos?.length || 0), 0)} Photos Posted
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded border border-amber-200 inline-block mt-0.5">
                                📷 Photos Pending
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Risk Level */}
                        <td className="p-3">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${RISK_BADGES[inst.riskLevel] || RISK_BADGES.UNDER_REVIEW}`}>
                            {inst.riskLevel || 'UNDER_REVIEW'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${isUnlocked ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                            {isUnlocked ? '🔓 QR GENERATED' : '🔒 QR LOCKED'}
                          </span>
                        </td>

                        {/* District Authority Actions */}
                        <td className="p-3 space-y-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* View Full School Report & Photos */}
                            <button
                              onClick={() => setReportModalInst(inst)}
                              className="text-[10px] font-black px-2 py-1 bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] hover:bg-[#1E3A5F] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <FiEye size={11} /> View Photos &amp; Report
                            </button>
                          </div>

                          {inst.lastDistrictRemarks && (
                            <p className="text-[9px] text-rose-800 font-semibold bg-rose-50 p-1 rounded border border-rose-200 truncate max-w-xs">
                              Notice: "{inst.lastDistrictRemarks}"
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
           </div>
         </div>
        </>
      )}

      {/* 🏛️ MODAL: DCP ZONE REAL-TIME DIRECTORY & QR AUDIT MODAL */}
      {selectedZoneModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl border-4 border-[#D4AF37] overflow-hidden flex flex-col max-h-[94vh] animate-fade-in">
            {/* Header */}
            <div className="bg-[#0F2038] p-5 text-white flex items-center justify-between border-b-4 border-[#D4AF37]">
              <div className="flex items-center gap-3">
                <img src="/up-police-logo.png" alt="UP Police" className="w-9 h-9 object-contain bg-white rounded-full p-0.5 border border-[#D4AF37]" />
                <div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${ZONE_COLORS[selectedZoneModal.zone]}`}>
                    DCP {selectedZoneModal.zone} ZONE DIRECTORY
                  </span>
                  <h2 className="text-base font-black font-serif text-white mt-0.5">
                    DCP {selectedZoneModal.zone} Zone — Real-Time Institutions &amp; QR Audit
                  </h2>
                </div>
              </div>
              <button onClick={() => setSelectedZoneModal(null)} className="text-white hover:text-[#D4AF37] font-black text-xl p-1 cursor-pointer">✕</button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs bg-[#F4F6F9] flex-1">
              
              {/* Officer & Zone Stats Banner */}
              <div className="bg-gradient-to-r from-[#0F2038] to-[#1E3A5F] text-white p-5 rounded-2xl border-2 border-[#D4AF37] grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-md">
                <div>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase">Designated Inspector</p>
                  <p className="text-sm font-black text-white">{selectedZoneModal.dcpOfficer?.name}</p>
                  <p className="text-[10px] font-mono text-slate-300">{selectedZoneModal.dcpOfficer?.email}</p>
                </div>

                <div>
                  <p className="text-[10px] font-black text-[#D4AF37] uppercase">Total Enrolled Students</p>
                  <p className="text-lg font-black text-white">{selectedZoneModal.zoneStudents.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-300">Across {selectedZoneModal.zoneInsts.length} Schools</p>
                </div>

                <div className="bg-emerald-950/60 border border-emerald-500/50 p-2.5 rounded-xl">
                  <p className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
                    <MdQrCode2 /> QR Generated &amp; Unlocked
                  </p>
                  <p className="text-xl font-black text-emerald-300">{selectedZoneModal.zoneQrUnlocked}</p>
                  <p className="text-[9px] text-emerald-200">Safe ID Issued</p>
                </div>

                <div className="bg-amber-950/60 border border-amber-500/50 p-2.5 rounded-xl">
                  <p className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-1">
                    <FiLock /> QR Locked (Pending Docs)
                  </p>
                  <p className="text-xl font-black text-amber-300">{selectedZoneModal.zoneQrLocked}</p>
                  <p className="text-[9px] text-amber-200">Compliance Deficient</p>
                </div>
              </div>

              {/* Institutions List Table for this Zone */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden space-y-2">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-black text-[#0F2038] uppercase tracking-wider text-xs">
                    Registered Institutions Directory in DCP {selectedZoneModal.zone} Zone ({selectedZoneModal.zoneInsts.length})
                  </h4>
                </div>

                {selectedZoneModal.zoneInsts.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-xs font-black text-[#0F2038]">No Institutions Registered in {selectedZoneModal.zone} Zone Yet</p>
                    <p className="text-[11px] text-slate-500">When schools register under {selectedZoneModal.zone} Zone, they will sync here in real-time.</p>
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <th className="text-left p-3">Safe ID</th>
                        <th className="text-left p-3">Institution Full Name</th>
                        <th className="text-left p-3">Principal / Contact</th>
                        <th className="text-left p-3">Enrolled Students</th>
                        <th className="text-left p-3">Compliance</th>
                        <th className="text-left p-3">Safe ID &amp; QR Certificate Status</th>
                        <th className="text-left p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedZoneModal.zoneInsts.map(inst => {
                        const isUnlocked = institutionStore.isCertificateUnlocked(inst._id);

                        return (
                          <tr key={inst._id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-mono font-black text-[#0F2038] text-[10px]">{inst.safeId}</td>
                            <td className="p-3">
                              <p className="font-black text-[#0F2038]">{inst.name}</p>
                              <p className="text-[10px] text-slate-500">{inst.type} • {inst.address}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-700">{inst.principal}</p>
                              <p className="text-[10px] font-mono text-slate-500">{inst.contact}</p>
                            </td>
                            <td className="p-3 font-black text-[#0F2038]">{inst.totalStudents || 0}</td>
                            <td className="p-3 font-black text-emerald-700">{inst.complianceScore}%</td>
                            <td className="p-3">
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${isUnlocked ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                                {isUnlocked ? '🔓 QR CODE GENERATED & CERTIFIED' : '🔒 QR CODE LOCKED (PENDING)'}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => {
                                  setSelectedZoneModal(null);
                                  setReportModalInst(inst);
                                }}
                                className="text-[10px] font-black text-[#0F2038] bg-[#D4AF37]/20 border border-[#D4AF37] px-2.5 py-1 rounded-xl hover:bg-[#0F2038] hover:text-[#D4AF37] transition-all cursor-pointer"
                              >
                                View Report &amp; Photos →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedZoneModal(null)}
                className="bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] font-black text-xs px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Close Zone Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👮 MODAL 1: ASSIGN INSPECTION OFFICER TO PUBLIC COMPLAINT */}
      {assignComplaintModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border-4 border-[#D4AF37] overflow-hidden animate-fade-in">
            <div className="bg-[#0F2038] p-4 text-white flex items-center gap-3 border-b-2 border-[#D4AF37]">
              <img src="/up-police-logo.png" alt="UP Police" className="w-8 h-8 object-contain" />
              <div>
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider">District Authority Public Safety Directive</p>
                <h3 className="text-sm font-black font-serif text-white">Public Safety Complaint &amp; DCP Officer Assignment</h3>
              </div>
            </div>

            <form onSubmit={handleAssignComplaint} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border-2 border-slate-200 p-3.5 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                  <span className="font-mono font-black text-xs text-[#0F2038]">#{assignComplaintModal.complaintTicket}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{assignComplaintModal.submittedAt}</span>
                </div>
                <p><span className="text-slate-500 font-bold">Target Institution:</span> <strong className="text-[#0F2038]">{assignComplaintModal.institutionName}</strong></p>
                <p><span className="text-slate-500 font-bold">Hazard Category:</span> <span className="font-black text-rose-700">{assignComplaintModal.category?.replace(/_/g, ' ')}</span></p>
                <p><span className="text-slate-500 font-bold">Complainant:</span> {assignComplaintModal.complainantName} ({assignComplaintModal.complainantPhone})</p>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[#0F2038] font-semibold italic mt-1">
                  "{assignComplaintModal.description}"
                </div>
              </div>

              <div>
                <label className="block font-black text-[#0F2038] mb-1.5">Select DCP Inspection Officer to Investigate <span className="text-rose-500">*</span></label>
                <select
                  value={complaintInspector}
                  onChange={e => setComplaintInspector(e.target.value)}
                  className="w-full text-xs font-bold p-3 border-2 border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  {INSPECTION_OFFICERS.map(o => (
                    <option key={o.name} value={o.name}>
                      {o.name} ({o.title}) — {o.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-[#0F2038] mb-1">Investigation Directives / Instructions</label>
                <textarea
                  rows={3}
                  value={complaintDirectives}
                  onChange={e => setComplaintDirectives(e.target.value)}
                  placeholder="e.g. Conduct urgent site investigation, inspect fire exits, and submit photo evidence within 24 hours..."
                  className="w-full text-xs border-2 border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignComplaintModal(null)}
                  className="flex-1 text-xs font-black py-3 border-2 border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-black py-3 bg-[#0F2038] text-[#D4AF37] border-2 border-[#D4AF37] rounded-xl hover:bg-[#1E3A5F] cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                >
                  <FiUserCheck size={14} /> Assign DCP &amp; Route to Inspector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⚡ MODAL 2: DISTRICT ACTION / REMARKS / RISK OVERRIDE */}
      {actionModalInst && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border-4 border-amber-400 overflow-hidden animate-fade-in">
            <div className="bg-[#0F2038] p-4 text-white flex items-center gap-3 border-b-2 border-amber-400">
              <img src="/up-govt-seal.png" alt="UP Seal" className="w-8 h-8 object-contain" />
              <div>
                <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider">District Authority Action Desk</p>
                <h3 className="text-sm font-black font-serif text-white">Issue Directives &amp; Update Remarks</h3>
              </div>
            </div>

            <form onSubmit={handleActionSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <p><span className="text-slate-500">Target Institution:</span> <strong className="text-[#0F2038]">{actionModalInst.name}</strong></p>
                <p><span className="text-slate-500">Current Risk Rating:</span> <span className="font-black text-rose-700">{actionModalInst.riskLevel || 'UNDER_REVIEW'}</span></p>
              </div>

              <div>
                <label className="block font-black text-[#0F2038] mb-1">Action / Notice Category <span className="text-rose-500">*</span></label>
                <select
                  value={actionType}
                  onChange={e => setActionType(e.target.value)}
                  className="w-full text-xs font-bold p-3 border-2 border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="NOTICE_ISSUED">⚠️ Issue Official Safety Deficiency Notice</option>
                  <option value="HIGH_RISK_FLAGGED">🚨 Flag Institution as HIGH RISK (Emergency Audit)</option>
                  <option value="RE-INSPECTION_ORDERED">🔍 Order Mandatory Re-Inspection</option>
                  <option value="COMPLIANCE_APPROVED">✓ Approve District Compliance Over-ride</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-[#0F2038] mb-1">Update Risk Level Rating</label>
                <select
                  value={newRiskLevel}
                  onChange={e => setNewRiskLevel(e.target.value)}
                  className="w-full text-xs font-bold p-3 border-2 border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="LOW">LOW RISK (Compliant)</option>
                  <option value="MEDIUM">MEDIUM RISK (Minor Deficiencies)</option>
                  <option value="HIGH">HIGH RISK (Critical Deficiencies / Over-Strength)</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-[#0F2038] mb-1">Official District Authority Remarks <span className="text-rose-500">*</span></label>
                <textarea
                  rows={4}
                  required
                  value={actionRemarks}
                  onChange={e => setActionRemarks(e.target.value)}
                  placeholder="Enter binding district authority orders, compliance deadlines, or safety warnings..."
                  className="w-full text-xs border-2 border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModalInst(null)}
                  className="flex-1 text-xs font-black py-3 border-2 border-slate-300 text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-black py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                >
                  <FiEdit3 size={14} /> Submit District Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 MODAL 3: FULL INSTITUTION, ASSIGNED INSPECTOR & SITE EVIDENCE PHOTOS AUDIT REPORT */}
      {reportModalInst && (
        <InstitutionFullDetailModal
          institution={reportModalInst}
          onClose={() => setReportModalInst(null)}
        />
      )}

      {/* 🖼️ MODAL 4: FULLSCREEN PHOTO LIGHTBOX VIEWER */}
      {zoomPhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl overflow-hidden border-4 border-[#D4AF37] shadow-2xl flex flex-col">
            <div className="bg-[#0F2038] p-3 text-white flex items-center justify-between border-b border-[#D4AF37]">
              <div>
                <p className="text-[9px] font-black text-[#D4AF37] uppercase">{zoomPhoto.category}</p>
                <p className="text-xs font-black">{zoomPhoto.title}</p>
              </div>
              <button onClick={() => setZoomPhoto(null)} className="text-white hover:text-[#D4AF37] font-black text-lg p-1">✕</button>
            </div>
            <div className="p-4 bg-slate-900 flex items-center justify-center">
              <img src={zoomPhoto.url} alt={zoomPhoto.title} className="max-w-full max-h-[60vh] object-contain rounded-xl" />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-mono">Timestamp: {zoomPhoto.timestamp}</span>
              <button onClick={() => setZoomPhoto(null)} className="bg-[#0F2038] text-[#D4AF37] font-black px-4 py-1.5 rounded-xl border border-[#D4AF37]">
                Close Lightbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
