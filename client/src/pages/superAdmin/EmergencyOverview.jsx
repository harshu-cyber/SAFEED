import React, { useState, useEffect } from 'react';
import { institutionStore } from '../../api/institutionStore';
import { complaintStore } from '../../api/complaintStore';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import {
  FiAlertTriangle, FiSearch, FiEye, FiCheckCircle, FiXCircle,
  FiDownload, FiShield, FiMessageSquare, FiClock, FiMapPin, FiZap
} from 'react-icons/fi';
import { MdLocalPolice } from 'react-icons/md';

const STATUS_MAP = {
  PENDING_DISTRICT_ACTION: { label: 'Pending Action', color: 'bg-red-100 text-red-700' },
  INVESTIGATION_ASSIGNED: { label: 'Under Investigation', color: 'bg-amber-100 text-amber-700' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700' },
};

const RISK_COLOR = {
  HIGH: 'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-green-100 text-green-700 border-green-200',
};

export const SuperEmergencyOverview = () => {
  const [institutions, setInstitutions] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tab, setTab] = useState('COMPLAINTS');
  const [search, setSearch] = useState('');
  const [selectedInst, setSelectedInst] = useState(null);

  useEffect(() => {
    const load = () => {
      setInstitutions(institutionStore.getInstitutions());
      setComplaints(complaintStore.getComplaints());
    };
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, []);

  const highRisk = institutions.filter(i => i.riskLevel === 'HIGH' || i.complianceScore < 50);
  const pending = complaints.filter(c => c.status === 'PENDING_DISTRICT_ACTION').length;
  const investigating = complaints.filter(c => c.status === 'INVESTIGATION_ASSIGNED').length;
  const resolved = complaints.filter(c => c.status === 'RESOLVED').length;

  const filteredComplaints = complaints.filter(c =>
    c.institutionName?.toLowerCase().includes(search.toLowerCase()) ||
    c.complainantName?.toLowerCase().includes(search.toLowerCase()) ||
    c.complaintTicket?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHighRisk = highRisk.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.safeId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      {selectedInst && <InstitutionFullDetailModal institution={selectedInst} onClose={() => setSelectedInst(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <span className="text-[10px] font-black text-white bg-red-700 px-3 py-0.5 rounded-full uppercase tracking-widest">Super Admin</span>
          <h1 className="text-2xl font-black text-[#0F2038] mt-1">Emergency Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Active Complaints & High-Risk Institutions — Uttar Pradesh</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-[#0F2038] border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 shadow-sm">
          <FiDownload size={13} /> Export Emergency Report
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: FiAlertTriangle, label: 'High Risk Institutions', value: highRisk.length, gradient: 'from-red-600 to-rose-400', badge: 'URGENT' },
          { icon: FiMessageSquare, label: 'Pending Complaints', value: pending, gradient: 'from-orange-500 to-amber-400', badge: pending > 0 ? 'ACTION NEEDED' : null },
          { icon: FiShield, label: 'Under Investigation', value: investigating, gradient: 'from-blue-700 to-blue-500' },
          { icon: FiCheckCircle, label: 'Resolved', value: resolved, gradient: 'from-emerald-600 to-green-400' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-4 bg-gradient-to-br ${k.gradient} text-white shadow-lg`}>
            <div className="flex items-start justify-between mb-2">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                <k.icon size={16} />
              </div>
              {k.badge && <span className="text-[9px] font-black bg-white/25 px-2 py-0.5 rounded-full">{k.badge}</span>}
            </div>
            <p className="text-2xl font-black">{k.value}</p>
            <p className="text-xs font-semibold opacity-90 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Alert Banner */}
      {pending > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-300 rounded-2xl p-4 mb-6 animate-pulse">
          <FiZap className="text-red-600 flex-shrink-0" size={18} />
          <p className="text-sm text-red-800 font-bold">
            <span className="font-black">{pending} complaint{pending > 1 ? 's' : ''}</span> require immediate District Authority action.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1 mb-4 w-fit">
        {[
          { key: 'COMPLAINTS', label: `🚨 Public Complaints (${complaints.length})` },
          { key: 'HIGH_RISK', label: `⚠️ High Risk Institutions (${highRisk.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${tab === t.key ? 'bg-[#0F2038] text-[#D4AF37]' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="relative max-w-sm">
          <FiSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
      </div>

      {/* Complaints Tab */}
      {tab === 'COMPLAINTS' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-black text-[#0F2038]">Public Complaint Records ({filteredComplaints.length})</h3>
          </div>
          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FiMessageSquare size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No complaints filed</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredComplaints.map(c => {
                const statusInfo = STATUS_MAP[c.status] || STATUS_MAP.PENDING_DISTRICT_ACTION;
                return (
                  <div key={c._id} className="p-4 hover:bg-red-50/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded">{c.complaintTicket}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{c.category?.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-sm font-black text-[#0F2038]">{c.institutionName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{c.description?.slice(0, 120)}{c.description?.length > 120 ? '...' : ''}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1"><FiMapPin size={9} /> {c.district} · DCP {c.zone}</span>
                          <span className="flex items-center gap-1"><FiClock size={9} /> {c.submittedAt}</span>
                          {c.complainantName !== 'Anonymous Citizen' && (
                            <span>By: <span className="font-bold text-gray-600">{c.complainantName}</span></span>
                          )}
                        </div>
                        {c.assignedInspector && (
                          <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 w-fit">
                            <MdLocalPolice className="text-[#D4AF37]" /> Assigned: {c.assignedInspector}
                          </div>
                        )}
                      </div>
                      <div className={`px-3 py-2 rounded-xl border text-center min-w-[100px] flex-shrink-0 ${statusInfo.color}`}>
                        <p className="text-[10px] font-black">{statusInfo.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* High Risk Tab */}
      {tab === 'HIGH_RISK' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-black text-[#0F2038]">High Risk Institutions ({filteredHighRisk.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Institution', 'Type', 'Zone', 'Students', 'Compliance', 'Risk', 'Last Inspection', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredHighRisk.map(inst => (
                  <tr key={inst._id} className="hover:bg-red-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedInst(inst)} className="font-bold text-[#0F2038] hover:text-red-700 flex items-center gap-1 text-left">
                        <span className="max-w-[160px] truncate block">{inst.name}</span>
                        <FiEye size={9} className="text-red-500 flex-shrink-0" />
                      </button>
                      <p className="text-[9px] font-mono text-gray-400">{inst.safeId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{inst.type}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">DCP {inst.zone || 'CENTRAL'}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#0F2038]">{(inst.totalStudents || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="font-black text-red-700">{inst.complianceScore || 0}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${RISK_COLOR[inst.riskLevel] || RISK_COLOR.LOW}`}>
                        {inst.riskLevel || 'LOW'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inst.lastInspectionDate ? (
                        <span className="text-gray-600 flex items-center gap-1">
                          <FiClock size={9} /> {new Date(inst.lastInspectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="font-bold text-red-500">⚠ Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="text-[10px] font-black px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-1"
                      >
                        <FiEye size={9} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredHighRisk.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <FiAlertTriangle size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No high risk institutions found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
