import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockData } from '../../api/mockData';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import { FiShield, FiAlertTriangle, FiSearch, FiEye, FiPhone, FiMapPin, FiActivity, FiClock, FiDownload, FiFilter } from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';

const RiskBadge = ({ risk }) => {
  const map = { LOW: 'bg-green-100 text-green-700', MEDIUM: 'bg-amber-100 text-amber-700', HIGH: 'bg-red-100 text-red-700', UNKNOWN: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${map[risk] || map.UNKNOWN}`}><span className={`w-1.5 h-1.5 rounded-full ${risk === 'HIGH' ? 'bg-red-500' : risk === 'MEDIUM' ? 'bg-amber-500' : risk === 'LOW' ? 'bg-green-500' : 'bg-gray-400'}`} />{risk || 'N/A'}</span>;
};

export const PoliceDashboard = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedInstModal, setSelectedInstModal] = useState(null);

  const institutions = institutionStore.getInstitutions();
  const filtered = institutions.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.safeId?.toLowerCase().includes(search.toLowerCase()) ||
    i.district?.toLowerCase().includes(search.toLowerCase())
  );
  const highRisk = filtered.filter(i => i.riskLevel === 'HIGH' || i.complianceScore < 50);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {selectedInstModal && (
        <InstitutionFullDetailModal 
          institution={selectedInstModal} 
          onClose={() => setSelectedInstModal(null)} 
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-white bg-sky-800 px-2 py-0.5 rounded uppercase tracking-widest">Uttar Pradesh Police</span>
            <span className="text-[10px] text-gray-400">SafeED-UP Integration</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800">Police Safety Monitoring Portal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome, <span className="font-semibold text-sky-800">{user?.name || 'ACP Vikram Rathore'}</span> &middot; Lucknow District</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm font-semibold text-sky-800 border border-sky-200 px-4 py-2 rounded-lg hover:bg-sky-50 transition-colors">
            <FiDownload size={14} /> Police Report
          </button>
        </div>
      </div>

      {/* Alert */}
      {highRisk.length > 0 && (
        <div className="mb-5 bg-red-50 border border-red-300 rounded-xl p-4 flex items-center gap-3">
          <FiAlertTriangle size={18} className="text-red-600" />
          <p className="text-sm text-red-700 font-medium">
            <span className="font-black">{highRisk.length} HIGH RISK</span> institutions require immediate police coordination for emergency preparedness.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Institutions', value: institutions.length, color: 'bg-gradient-to-br from-sky-800 to-sky-600' },
          { label: 'High Risk', value: highRisk.length, color: 'bg-gradient-to-br from-red-600 to-red-400' },
          { label: 'Emergency Plans Filed', value: 4, color: 'bg-gradient-to-br from-emerald-600 to-emerald-400' },
          { label: 'Active Alerts', value: 2, color: 'bg-gradient-to-br from-amber-500 to-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${color} text-white rounded-xl p-5 shadow-md`}>
            <FiShield size={22} className="opacity-60 mb-2" />
            <p className="text-3xl font-black">{value}</p>
            <p className="text-xs font-semibold opacity-90 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* High Risk Institutions */}
      <div className="bg-white rounded-xl border border-red-100 shadow-sm mb-6 overflow-hidden">
        <div className="p-5 bg-red-50 border-b border-red-100 flex items-center gap-2">
          <FiAlertTriangle size={14} className="text-red-600" />
          <h3 className="text-sm font-bold text-red-700">High Risk Institutions — Priority List</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Institution', 'Address', 'Students', 'Last Inspection', 'Risk', 'Status', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {highRisk.map(inst => (
              <tr key={inst._id} className="hover:bg-red-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-gray-800 max-w-[200px]">{inst.name}</td>
                <td className="px-4 py-3 text-gray-500 flex items-center gap-1"><FiMapPin size={10} />{inst.address}</td>
                <td className="px-4 py-3 font-semibold text-gray-700">{inst.totalStudents?.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{inst.lastInspectionDate ? new Date(inst.lastInspectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : <span className="text-amber-500 font-semibold">Never</span>}</td>
                <td className="px-4 py-3"><RiskBadge risk={inst.riskLevel} /></td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase">{inst.status?.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedInstModal(inst)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-sky-700 border border-sky-200 px-2.5 py-1 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
                  >
                    <FiEye size={10} /> View Full Info
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* All Institutions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">All Institutions — Lucknow</h3>
          <div className="relative">
            <FiSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg w-40 focus:outline-none focus:ring-1 focus:ring-sky-700" />
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Safe ID', 'Institution', 'Type', 'Contact', 'Compliance', 'Risk'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(inst => (
              <tr key={inst._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-sky-800">{inst.safeId}</td>
                <td className="px-4 py-3 font-semibold text-gray-800">
                  <button
                    onClick={() => setSelectedInstModal(inst)}
                    className="font-bold text-gray-800 hover:text-sky-700 text-left flex items-center gap-1 cursor-pointer"
                  >
                    {inst.name} <FiEye size={10} className="text-sky-700" />
                  </button>
                  <p className="text-[10px] text-gray-400 font-normal">{inst.address}</p>
                </td>
                <td className="px-4 py-3 text-gray-500">{inst.type}</td>
                <td className="px-4 py-3 text-gray-500 flex items-center gap-1"><FiPhone size={10} />{inst.contact}</td>
                <td className="px-4 py-3">
                  {inst.complianceScore != null ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${inst.complianceScore >= 80 ? 'bg-green-500' : inst.complianceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${inst.complianceScore}%` }} />
                      </div>
                      <span className="font-bold text-gray-700">{inst.complianceScore}%</span>
                    </div>
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3"><RiskBadge risk={inst.riskLevel} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
