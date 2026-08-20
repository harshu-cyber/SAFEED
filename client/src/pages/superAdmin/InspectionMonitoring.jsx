import React, { useState, useEffect } from 'react';
import { institutionStore } from '../../api/institutionStore';
import { cloudSync } from '../../api/cloudSync';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import {
  FiShield, FiSearch, FiFilter, FiEye, FiMapPin, FiCheckCircle, FiXCircle,
  FiClock, FiAlertTriangle, FiDownload
} from 'react-icons/fi';
import { MdLocalPolice, MdVerified } from 'react-icons/md';

const ZONES = ['ALL', 'WEST', 'CENTRAL', 'NORTH', 'EAST', 'SOUTH'];

const StatusBadge = ({ score }) => {
  if (score >= 80) return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">HIGH COMPLIANCE</span>;
  if (score >= 60) return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">MODERATE</span>;
  return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">LOW COMPLIANCE</span>;
};

export const SuperInspectionMonitoring = () => {
  const [institutions, setInstitutions] = useState([]);
  const [zone, setZone] = useState('ALL');
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
    const matchZone = zone === 'ALL' || (i.zone || 'CENTRAL') === zone;
    const matchSearch = i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.safeId?.toLowerCase().includes(search.toLowerCase()) ||
      i.assignedInspector?.toLowerCase().includes(search.toLowerCase());
    return matchZone && matchSearch;
  });

  const totalInspected = institutions.filter(i => i.lastInspectionDate).length;
  const neverInspected = institutions.filter(i => !i.lastInspectionDate).length;
  const avgCompliance = institutions.length
    ? Math.round(institutions.reduce((s, i) => s + (i.complianceScore || 0), 0) / institutions.length)
    : 0;
  const assigned = institutions.filter(i => i.assignedInspector).length;

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      {selectedInst && <InstitutionFullDetailModal institution={selectedInst} onClose={() => setSelectedInst(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-white bg-blue-700 px-3 py-0.5 rounded-full uppercase tracking-widest">Super Admin</span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2038]">Inspection Monitoring</h1>
          <p className="text-sm text-gray-500 mt-0.5">State-wide DCP Inspection Progress — Uttar Pradesh</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-[#0F2038] border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 shadow-sm">
          <FiDownload size={13} /> Export Report
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: FiShield, label: 'Total Institutions', value: institutions.length, bg: 'bg-gradient-to-br from-[#0F2038] to-[#1E3A5F]', text: 'text-white' },
          { icon: FiCheckCircle, label: 'Inspected', value: totalInspected, bg: 'bg-gradient-to-br from-emerald-600 to-green-400', text: 'text-white' },
          { icon: FiXCircle, label: 'Never Inspected', value: neverInspected, bg: 'bg-gradient-to-br from-red-500 to-rose-400', text: 'text-white' },
          { icon: FiAlertTriangle, label: 'Avg Compliance', value: `${avgCompliance}%`, bg: 'bg-gradient-to-br from-amber-500 to-yellow-400', text: 'text-white' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-4 ${k.bg} ${k.text} shadow-lg`}>
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-2">
              <k.icon size={16} />
            </div>
            <p className="text-2xl font-black">{typeof k.value === 'number' ? k.value.toLocaleString() : k.value}</p>
            <p className="text-xs font-semibold opacity-90 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Zone Assignment Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-black text-[#0F2038] mb-4">Zone-wise Inspector Assignment</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {['WEST', 'CENTRAL', 'NORTH', 'EAST', 'SOUTH'].map(z => {
            const zoneInsts = institutions.filter(i => (i.zone || 'CENTRAL') === z);
            const assignedCount = zoneInsts.filter(i => i.assignedInspector).length;
            const pct = zoneInsts.length ? Math.round((assignedCount / zoneInsts.length) * 100) : 0;
            return (
              <div key={z} className="rounded-xl p-4 bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 text-center">
                <MdLocalPolice className="text-[#D4AF37] mx-auto mb-1" size={20} />
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">DCP {z}</p>
                <p className="text-xl font-black text-[#0F2038]">{assignedCount}<span className="text-xs text-gray-400">/{zoneInsts.length}</span></p>
                <p className="text-[9px] text-gray-500 font-semibold">Assigned</p>
                <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[9px] font-bold text-blue-600 mt-0.5">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search institution or inspector…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {ZONES.map(z => (
            <button
              key={z}
              onClick={() => setZone(z)}
              className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-all ${zone === z ? 'bg-[#0F2038] text-[#D4AF37]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {z === 'ALL' ? 'All Zones' : `DCP ${z}`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-[#0F2038]">Inspection Records ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Safe ID', 'Institution', 'Zone', 'Assigned Inspector', 'Last Inspection', 'Compliance', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(inst => {
                const unlocked = institutionStore.isCertificateUnlocked(inst._id);
                return (
                  <tr key={inst._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-black text-blue-800 text-[10px]">{inst.safeId}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedInst(inst)} className="font-bold text-[#0F2038] hover:text-blue-700 text-left flex items-center gap-1">
                        {inst.name} <FiEye size={10} className="text-blue-500" />
                      </button>
                      <p className="text-[9px] text-gray-400">{inst.type} · {inst.district}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">DCP {inst.zone || 'CENTRAL'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {inst.assignedInspector ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#0F2038]">
                          <MdLocalPolice className="text-[#D4AF37]" /> {inst.assignedInspector}
                        </span>
                      ) : (
                        <span className="text-[10px] italic text-gray-400">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {inst.lastInspectionDate ? (
                        <span className="flex items-center gap-1 text-[11px] text-gray-600">
                          <FiClock size={9} /> {new Date(inst.lastInspectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="text-amber-500 font-bold text-[10px]">⚠ Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${inst.complianceScore >= 80 ? 'bg-emerald-500' : inst.complianceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${inst.complianceScore || 0}%` }} />
                        </div>
                        <span className="font-black text-[#0F2038]">{inst.complianceScore || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge score={inst.complianceScore || 0} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="text-[10px] font-black px-2.5 py-1 bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] rounded-lg hover:bg-[#1E3A5F] transition-all flex items-center gap-1"
                      >
                        <FiEye size={10} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FiShield size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No inspection records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
