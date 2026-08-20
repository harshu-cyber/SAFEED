import React, { useState, useEffect } from 'react';
import { institutionStore } from '../../api/institutionStore';
import { cloudSync } from '../../api/cloudSync';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import {
  FiCheckSquare, FiSearch, FiEye, FiCheckCircle, FiXCircle,
  FiAlertTriangle, FiDownload, FiFilter, FiTrendingUp
} from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';

const NOC_TYPES = {
  FIRE_NOC: '🔥 Fire NOC',
  STRUCTURAL_SAFETY: '🏗️ Building Safety',
  ELECTRICAL_SAFETY: '⚡ Electrical Audit',
  EMERGENCY_PLAN: '🚨 Emergency Plan',
};

const NOC_STATUS_BADGE = {
  VERIFIED: <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">✓ Verified</span>,
  PENDING: <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">⏳ Pending</span>,
  REJECTED: <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">✗ Rejected</span>,
};

const getNocStatus = (inst, nocType) => {
  const doc = inst.documents?.find(d => d.type === nocType);
  return doc?.status || 'PENDING';
};

const ComplianceBar = ({ score }) => {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-black ${score >= 80 ? 'text-emerald-700' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{score}%</span>
    </div>
  );
};

export const SuperComplianceMonitoring = () => {
  const [institutions, setInstitutions] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedInst, setSelectedInst] = useState(null);

  useEffect(() => {
    const load = async () => {
      try { await cloudSync.pull(); } catch {}
      setInstitutions(institutionStore.getInstitutions());
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const filtered = institutions.filter(i => {
    const unlocked = institutionStore.isCertificateUnlocked(i._id);
    const matchFilter =
      filter === 'ALL' ||
      (filter === 'VERIFIED' && unlocked) ||
      (filter === 'PENDING' && !unlocked) ||
      (filter === 'HIGH_RISK' && (i.riskLevel === 'HIGH' || i.complianceScore < 50));
    const matchSearch =
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.safeId?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const verified = institutions.filter(i => institutionStore.isCertificateUnlocked(i._id)).length;
  const pending = institutions.filter(i => !institutionStore.isCertificateUnlocked(i._id)).length;
  const highRisk = institutions.filter(i => i.riskLevel === 'HIGH' || i.complianceScore < 50).length;
  const avg = institutions.length
    ? Math.round(institutions.reduce((s, i) => s + (i.complianceScore || 0), 0) / institutions.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      {selectedInst && <InstitutionFullDetailModal institution={selectedInst} onClose={() => setSelectedInst(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <span className="text-[10px] font-black text-white bg-emerald-700 px-3 py-0.5 rounded-full uppercase tracking-widest">Super Admin</span>
          <h1 className="text-2xl font-black text-[#0F2038] mt-1">Compliance Monitoring</h1>
          <p className="text-sm text-gray-500 mt-0.5">NOC Status & Safety Certificate Overview — State of Uttar Pradesh</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-[#0F2038] border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 shadow-sm">
          <FiDownload size={13} /> Export Compliance Report
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: FiCheckCircle, label: 'Fully Verified', value: verified, gradient: 'from-emerald-600 to-green-400' },
          { icon: FiXCircle, label: 'Pending Verification', value: pending, gradient: 'from-amber-500 to-yellow-400' },
          { icon: FiAlertTriangle, label: 'High Risk', value: highRisk, gradient: 'from-red-600 to-rose-400' },
          { icon: FiTrendingUp, label: 'Avg Compliance', value: `${avg}%`, gradient: 'from-blue-700 to-blue-500' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-4 bg-gradient-to-br ${k.gradient} text-white shadow-lg`}>
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-2">
              <k.icon size={16} />
            </div>
            <p className="text-2xl font-black">{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</p>
            <p className="text-xs font-semibold opacity-90 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* NOC Summary Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-black text-[#0F2038] mb-4">NOC Clearance Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(NOC_TYPES).map(([key, label]) => {
            const verified = institutions.filter(i => {
              const doc = i.documents?.find(d => d.type === key);
              return doc?.status === 'VERIFIED';
            }).length;
            const pending = institutions.length - verified;
            return (
              <div key={key} className="rounded-xl p-4 bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100">
                <p className="text-xs font-black text-[#0F2038] mb-2">{label}</p>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 text-center">
                    <p className="text-xl font-black text-emerald-600">{verified}</p>
                    <p className="text-[9px] text-gray-500 font-semibold">Verified</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xl font-black text-amber-500">{pending}</p>
                    <p className="text-[9px] text-gray-500 font-semibold">Pending</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${institutions.length ? (verified / institutions.length) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search institution…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            { value: 'ALL', label: 'All' },
            { value: 'VERIFIED', label: '✓ Verified' },
            { value: 'PENDING', label: '⏳ Pending' },
            { value: 'HIGH_RISK', label: '⚠ High Risk' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all ${filter === f.value ? 'bg-[#0F2038] text-[#D4AF37]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-black text-[#0F2038]">Compliance Records ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Institution', 'Type', 'Zone', 'Compliance', 'Fire NOC', 'Building', 'Electrical', 'Emergency Plan', 'Certificate', 'Action'].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(inst => {
                const unlocked = institutionStore.isCertificateUnlocked(inst._id);
                return (
                  <tr key={inst._id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-3 py-3">
                      <button onClick={() => setSelectedInst(inst)} className="font-bold text-[#0F2038] hover:text-emerald-700 text-left flex items-center gap-1">
                        <span className="max-w-[150px] truncate block">{inst.name}</span>
                        <FiEye size={9} className="text-emerald-500 flex-shrink-0" />
                      </button>
                      <p className="text-[9px] text-gray-400 font-mono">{inst.safeId}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{inst.type}</td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">DCP {inst.zone || 'CENTRAL'}</span>
                    </td>
                    <td className="px-3 py-3"><ComplianceBar score={inst.complianceScore || 0} /></td>
                    <td className="px-3 py-3">{NOC_STATUS_BADGE[getNocStatus(inst, 'FIRE_NOC')]}</td>
                    <td className="px-3 py-3">{NOC_STATUS_BADGE[getNocStatus(inst, 'STRUCTURAL_SAFETY')]}</td>
                    <td className="px-3 py-3">{NOC_STATUS_BADGE[getNocStatus(inst, 'ELECTRICAL_SAFETY')]}</td>
                    <td className="px-3 py-3">{NOC_STATUS_BADGE[getNocStatus(inst, 'EMERGENCY_PLAN')]}</td>
                    <td className="px-3 py-3">
                      {unlocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <MdVerified size={11} /> ISSUED
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">⏳ PENDING</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="text-[10px] font-black px-2 py-1 bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] rounded-lg hover:bg-[#1E3A5F] transition-all flex items-center gap-1"
                      >
                        <FiEye size={9} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FiCheckSquare size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No records match your filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
