import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockData } from '../../api/mockData';
import { FiShield, FiAlertTriangle, FiSearch, FiEye, FiMapPin, FiDownload, FiClock, FiCheckSquare } from 'react-icons/fi';
import { MdLocalFireDepartment } from 'react-icons/md';

const RiskBadge = ({ risk }) => {
  const map = { LOW: 'bg-green-100 text-green-700', MEDIUM: 'bg-amber-100 text-amber-700', HIGH: 'bg-red-100 text-red-700', UNKNOWN: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${map[risk] || map.UNKNOWN}`}><span className={`w-1.5 h-1.5 rounded-full ${risk === 'HIGH' ? 'bg-red-500' : risk === 'MEDIUM' ? 'bg-amber-500' : risk === 'LOW' ? 'bg-green-500' : 'bg-gray-400'}`} />{risk || 'N/A'}</span>;
};

export const FireDashboard = () => {
  const { user } = useAuth();
  const institutions = mockData.institutions;
  const docs = mockData.documents.filter(d => d.type === 'FIRE_NOC');
  const [search, setSearch] = useState('');

  const nocVerified = docs.filter(d => d.status === 'VERIFIED').length;
  const nocPending = docs.filter(d => d.status !== 'VERIFIED').length;
  const highRisk = institutions.filter(i => i.riskLevel === 'HIGH').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-white bg-orange-700 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
              <MdLocalFireDepartment size={12} /> Fire & Safety Department
            </span>
            <span className="text-[10px] text-gray-400">SafeED-UP Integration</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800">Fire Safety Monitoring Portal</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome, <span className="font-semibold text-orange-700">{user?.name || 'Chief Fire Officer'}</span> &middot; Lucknow District
          </p>
        </div>
        <button className="flex items-center gap-2 text-sm font-semibold text-orange-700 border border-orange-200 px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors">
          <FiDownload size={14} /> Fire Safety Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Institutions Monitored', value: institutions.length, color: 'bg-gradient-to-br from-orange-700 to-orange-500', icon: MdLocalFireDepartment },
          { label: 'NOC Certificates Issued', value: nocVerified, color: 'bg-gradient-to-br from-emerald-600 to-emerald-400', icon: FiCheckSquare },
          { label: 'NOC Pending / Expired', value: nocPending, color: 'bg-gradient-to-br from-amber-500 to-amber-400', icon: FiClock },
          { label: 'High Fire Risk', value: highRisk, color: 'bg-gradient-to-br from-red-600 to-red-400', icon: FiAlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`${color} text-white rounded-xl p-5 shadow-md`}>
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-3">
              <Icon size={16} />
            </div>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-xs font-semibold opacity-90 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Alert */}
      <div className="mb-5 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
        <MdLocalFireDepartment size={18} className="text-orange-600" />
        <p className="text-sm text-orange-700 font-medium">
          <span className="font-black">{institutions.length - nocVerified} institutions</span> are operating without a valid Fire NOC. Immediate issuance required before December 2025.
        </p>
      </div>

      {/* Institutions Fire NOC Status */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <MdLocalFireDepartment size={14} className="text-orange-600" /> Institution-wise Fire NOC Status
          </h3>
          <div className="relative">
            <FiSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search institution…" value={search} onChange={e => setSearch(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-1 focus:ring-orange-600" />
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Institution', 'Type', 'Students', 'Fire NOC Status', 'NOC Expiry', 'Risk Level', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {institutions.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map((inst, idx) => {
              const nocStatus = idx < 2 ? 'VERIFIED' : idx < 4 ? 'PENDING' : 'NOT_SUBMITTED';
              const nocExpiry = idx < 2 ? '2026-09-01' : null;
              return (
                <tr key={inst._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-800 max-w-[200px]">
                    <p className="truncate">{inst.name}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5"><FiMapPin size={9} />{inst.district}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{inst.type}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{inst.totalStudents?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${nocStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : nocStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {nocStatus === 'VERIFIED' ? '✓ Valid NOC' : nocStatus === 'PENDING' ? 'Pending Review' : 'Not Submitted'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{nocExpiry ? new Date(nocExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : <span className="text-red-500 font-semibold">—</span>}</td>
                  <td className="px-4 py-3"><RiskBadge risk={inst.riskLevel} /></td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 text-[11px] font-semibold text-orange-700 border border-orange-200 px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors">
                      <FiEye size={10} /> Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Fire Inspections */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><FiShield size={14} className="text-orange-600" /> Recent Fire Safety Inspections</h3>
        <div className="space-y-2.5">
          {mockData.inspections.filter(i => i.inspectionType === 'FIRE_SAFETY' || i.inspectionType === 'ANNUAL_SAFETY').map(insp => (
            <div key={insp._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${insp.status === 'COMPLETED' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                  <MdLocalFireDepartment size={16} className={insp.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{insp.institutionId?.name}</p>
                  <p className="text-[10px] text-gray-400">{insp.inspectionId} &middot; {new Date(insp.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge risk={insp.overallRisk} />
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${insp.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{insp.status?.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
