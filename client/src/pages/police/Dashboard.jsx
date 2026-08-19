import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { institutionStore } from '../../api/institutionStore';
import { cloudSync } from '../../api/cloudSync';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import { FiShield, FiAlertTriangle, FiSearch, FiEye, FiPhone, FiMapPin, FiActivity, FiClock, FiDownload, FiFilter } from 'react-icons/fi';
import { MdVerified, MdLocalPolice } from 'react-icons/md';

const RiskBadge = ({ risk }) => {
  const map = { LOW: 'bg-emerald-100 text-emerald-800 border border-emerald-300', MEDIUM: 'bg-amber-100 text-amber-800 border border-amber-300', HIGH: 'bg-rose-100 text-rose-800 border border-rose-300', UNKNOWN: 'bg-gray-100 text-gray-500' };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${map[risk] || map.UNKNOWN}`}><span className={`w-1.5 h-1.5 rounded-full ${risk === 'HIGH' ? 'bg-rose-500' : risk === 'MEDIUM' ? 'bg-amber-500' : risk === 'LOW' ? 'bg-emerald-500' : 'bg-gray-400'}`} />{risk || 'N/A'}</span>;
};

export const PoliceDashboard = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedInstModal, setSelectedInstModal] = useState(null);
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    const load = () => setInstitutions(institutionStore.getInstitutions());
    cloudSync.pull().then(load).catch(load);
    cloudSync.startAutoSync();
    const iv = setInterval(load, 5000);
    return () => {
      clearInterval(iv);
      cloudSync.stopAutoSync();
    };
  }, []);

  const userPostingPS = user?.postingStation || user?.policeStation;
  const isTopCommand = ['SUPER_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN'].includes(user?.role) || ['DGP', 'CP', 'JCP'].includes(user?.policeRank);

  // Hierarchical PS & Zone Routing:
  const psFilteredInstitutions = institutions.filter(i => {
    if (isTopCommand) return true; // DGP, CP, JCP, Super Admin see ALL zones & PS
    if (user?.dcpZone && !userPostingPS) {
      // DCP Zonal Inspector sees all institutions in their DCP zone
      return (i.zone || 'CENTRAL').toUpperCase() === String(user.dcpZone).toUpperCase();
    }
    if (userPostingPS) {
      // PS Officer sees ONLY institutions registered to their specific Police Station
      const psName = String(userPostingPS).toLowerCase();
      const instPs = String(i.nearestPoliceStation || '').toLowerCase();
      return instPs.includes(psName) || psName.includes(instPs);
    }
    return true;
  });

  const filtered = psFilteredInstitutions.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.safeId?.toLowerCase().includes(search.toLowerCase()) ||
    i.district?.toLowerCase().includes(search.toLowerCase()) ||
    i.nearestPoliceStation?.toLowerCase().includes(search.toLowerCase()) ||
    i.address?.toLowerCase().includes(search.toLowerCase())
  );

  const highRisk = filtered.filter(i => i.riskLevel === 'HIGH' || (i.complianceScore || 0) < 50);

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 sm:p-6">
      {selectedInstModal && (
        <InstitutionFullDetailModal 
          institution={selectedInstModal} 
          onClose={() => setSelectedInstModal(null)} 
        />
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-black text-white bg-indigo-900 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
              <MdLocalPolice size={12} /> UP Police Command
            </span>
            <span className="text-[10px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 uppercase">
              {isTopCommand ? '⚡ TOP COMMAND (DGP/CP/JCP FULL ACCESS)' : userPostingPS ? `🚨 ${userPostingPS}` : `👮 DCP ${user?.dcpZone || 'CENTRAL'} ZONE`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F2038]">Police Safety Jurisdiction Portal</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Welcome, <strong className="text-indigo-900">{user?.name || 'ACP Officer'}</strong> ({user?.designation || 'DCP/ACP'})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold text-[#0F2038] border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 shadow-sm">
            <FiDownload size={13} /> Export Station Records
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {highRisk.length > 0 && (
        <div className="mb-5 bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-center gap-3 text-rose-900 shadow-sm">
          <FiAlertTriangle size={20} className="text-rose-600 flex-shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">
            <span className="font-black text-rose-950 uppercase">{highRisk.length} HIGH RISK / DEFICIENT</span> institutions under your station jurisdiction require immediate police inspection coordination.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Jurisdiction Total', value: psFilteredInstitutions.length, bg: 'from-[#0F2038] to-[#1E3A5F]' },
          { label: 'High Risk Alert', value: highRisk.length, bg: 'from-rose-700 to-red-500' },
          { label: 'NOC Issued', value: psFilteredInstitutions.filter(i => institutionStore.isCertificateUnlocked(i._id)).length, bg: 'from-emerald-700 to-green-500' },
          { label: 'Search Results', value: filtered.length, bg: 'from-indigo-700 to-blue-500' },
        ].map(({ label, value, bg }) => (
          <div key={label} className={`bg-gradient-to-br ${bg} text-white rounded-2xl p-4 shadow-md`}>
            <FiShield size={18} className="opacity-70 mb-1" />
            <p className="text-2xl font-black">{value}</p>
            <p className="text-[11px] font-semibold opacity-90 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search Bar & Station Filter Notice */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, Safe ID, station, address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <span className="text-[11px] font-bold text-gray-500">
          Showing {filtered.length} of {psFilteredInstitutions.length} institutions in station scope
        </span>
      </div>

      {/* Institutions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-black text-[#0F2038] uppercase tracking-wider">
            Station Jurisdiction Registry ({userPostingPS || 'All Police Stations'})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="text-left px-4 py-3">Safe ID</th>
                <th className="text-left px-4 py-3">Institution Name</th>
                <th className="text-left px-4 py-3">Police Station</th>
                <th className="text-left px-4 py-3">Type &amp; Students</th>
                <th className="text-left px-4 py-3">Compliance</th>
                <th className="text-left px-4 py-3">Risk Level</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(inst => (
                <tr key={inst._id || inst.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-black text-indigo-700 text-[11px]">{inst.safeId}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedInstModal(inst)}
                      className="font-bold text-[#0F2038] hover:text-indigo-700 text-left flex items-center gap-1 group"
                    >
                      <span>{inst.name}</span>
                      <FiEye size={10} className="text-indigo-400" />
                    </button>
                    <p className="text-[10px] text-gray-400 max-w-[200px] truncate">{inst.address}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
                      <MdLocalPolice size={10} /> {inst.nearestPoliceStation || 'Station Assigned'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-700">{inst.type}</p>
                    <p className="text-[10px] text-gray-400">{(inst.totalStudents || 0).toLocaleString()} Students</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${inst.complianceScore >= 80 ? 'bg-emerald-500' : inst.complianceScore >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                          style={{ width: `${inst.complianceScore || 0}%` }}
                        />
                      </div>
                      <span className="font-black text-[#0F2038]">{inst.complianceScore || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge risk={inst.riskLevel} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedInstModal(inst)}
                      className="text-[10px] font-black px-2.5 py-1 bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] rounded-lg hover:bg-[#1E3A5F] transition-all flex items-center gap-1"
                    >
                      <FiEye size={9} /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <FiShield size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No institutions found matching your station jurisdiction search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

