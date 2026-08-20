import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import { cloudSync } from '../../api/cloudSync';
import { mockData } from '../../api/mockData';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import { FiShield, FiAlertTriangle, FiSearch, FiEye, FiMapPin, FiDownload, FiClock, FiCheckSquare } from 'react-icons/fi';
import { MdLocalFireDepartment } from 'react-icons/md';

const RiskBadge = ({ risk }) => {
  const map = { LOW: 'bg-green-100 text-green-700', MEDIUM: 'bg-amber-100 text-amber-700', HIGH: 'bg-red-100 text-red-700', UNKNOWN: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${map[risk] || map.UNKNOWN}`}><span className={`w-1.5 h-1.5 rounded-full ${risk === 'HIGH' ? 'bg-red-500' : risk === 'MEDIUM' ? 'bg-amber-500' : risk === 'LOW' ? 'bg-green-500' : 'bg-gray-400'}`} />{risk || 'N/A'}</span>;
};

export const FireDashboard = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedInstModal, setSelectedInstModal] = useState(null);

  const loadRealTimeData = async () => {
    try {
      await cloudSync.pull();
    } catch {}
    setInstitutions(institutionStore.getInstitutions());
  };

  useEffect(() => {
    loadRealTimeData();
    cloudSync.startAutoSync();
    const interval = setInterval(loadRealTimeData, 4000);
    return () => {
      clearInterval(interval);
      cloudSync.stopAutoSync();
    };
  }, []);

  const docs = mockData.documents.filter(d => d.type === 'FIRE_NOC');

  const filtered = institutions.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.safeId?.toLowerCase().includes(search.toLowerCase()) ||
    i.district?.toLowerCase().includes(search.toLowerCase()) ||
    i.address?.toLowerCase().includes(search.toLowerCase())
  );

  const nocVerified = institutions.filter(i => institutionStore.isCertificateUnlocked(i._id)).length;
  const nocPending = institutions.length - nocVerified;
  const highRisk = institutions.filter(i => i.riskLevel === 'HIGH' || (i.complianceScore || 0) < 50).length;

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
            <span className="text-[10px] font-bold text-white bg-orange-700 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
              <MdLocalFireDepartment size={12} /> Fire &amp; Safety Department
            </span>
            <span className="text-[10px] text-gray-400">SafeED-UP Live Sync</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800">Fire Safety Monitoring Portal</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome, <span className="font-semibold text-orange-700">{user?.name || 'Chief Fire Officer'}</span> &middot; {user?.district || 'Lucknow'} District
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
          { label: 'NOC Pending / Under Inspection', value: nocPending, color: 'bg-gradient-to-br from-amber-500 to-amber-400', icon: FiClock },
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
          <span className="font-black">{nocPending} institutions</span> are operating pending full Fire NOC clearance. Priority safety inspections active.
        </p>
      </div>

      {/* Institutions Fire NOC Status */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <MdLocalFireDepartment size={14} className="text-orange-600" /> Institution-wise Fire NOC Status ({filtered.length})
          </h3>
          <div className="relative">
            <FiSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search institution…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-1 focus:ring-orange-600"
            />
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Safe ID', 'Institution', 'Type', 'Students', 'Fire NOC Status', 'Zone', 'Risk Level', 'Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(inst => {
              const isUnlocked = institutionStore.isCertificateUnlocked(inst._id);
              return (
                <tr key={inst._id || inst.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-orange-700">{inst.safeId}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800 max-w-[200px]">
                    <button
                      onClick={() => setSelectedInstModal(inst)}
                      className="font-bold text-[#0F2038] hover:text-orange-700 text-left flex items-center gap-1 group"
                    >
                      <span className="truncate">{inst.name}</span>
                      <FiEye size={10} className="text-orange-400 opacity-0 group-hover:opacity-100" />
                    </button>
                    <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5"><FiMapPin size={9} />{inst.address || inst.district}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-semibold">{inst.type}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{(inst.totalStudents || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isUnlocked ? '✓ Verified Fire NOC' : 'Pending Verification'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-bold text-[10px]">{inst.zone || 'CENTRAL'} Zone</td>
                  <td className="px-4 py-3"><RiskBadge risk={inst.riskLevel} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedInstModal(inst)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-orange-700 border border-orange-200 px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      <FiEye size={10} /> View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <MdLocalFireDepartment size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs font-semibold">No institutions found matching search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
