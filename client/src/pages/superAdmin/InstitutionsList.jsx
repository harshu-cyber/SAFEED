import React, { useState, useEffect } from 'react';
import { institutionStore } from '../../api/institutionStore';
import { cloudSync } from '../../api/cloudSync';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';
import {
  FiDatabase, FiSearch, FiEye, FiCheckCircle, FiXCircle,
  FiDownload, FiFilter, FiMapPin
} from 'react-icons/fi';
import { MdVerified, MdLocalPolice, MdSchool, MdBusiness } from 'react-icons/md';

const ZONES = ['ALL', 'WEST', 'CENTRAL', 'NORTH', 'EAST', 'SOUTH'];
const TYPES = ['ALL', 'SCHOOL', 'COLLEGE', 'COACHING'];

export const SuperInstitutionsList = () => {
  const [institutions, setInstitutions] = useState([]);
  const [zone, setZone] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedInst, setSelectedInst] = useState(null);

  useEffect(() => {
    const load = () => setInstitutions(institutionStore.getInstitutions());
    // Pull directly from MongoDB Atlas first
    cloudSync.pull().then(load).catch(load);
    cloudSync.startAutoSync();
    const iv = setInterval(load, 5000);
    return () => {
      clearInterval(iv);
      cloudSync.stopAutoSync();
    };
  }, []);

  const filtered = institutions.filter(i => {
    const matchZone = zone === 'ALL' || (i.zone || 'CENTRAL') === zone;
    const matchType = type === 'ALL' || i.type === type;
    const matchSearch =
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.safeId?.toLowerCase().includes(search.toLowerCase()) ||
      i.principal?.toLowerCase().includes(search.toLowerCase()) ||
      i.address?.toLowerCase().includes(search.toLowerCase()) ||
      i.nearestPoliceStation?.toLowerCase().includes(search.toLowerCase());
    return matchZone && matchType && matchSearch;
  });

  const verified = filtered.filter(i => institutionStore.isCertificateUnlocked(i._id)).length;
  const pending = filtered.length - verified;

  const typeIcon = (t) => {
    if (t === 'SCHOOL') return <MdSchool className="text-blue-500" size={13} />;
    if (t === 'COLLEGE') return <MdBusiness className="text-purple-500" size={13} />;
    return <FiDatabase className="text-orange-500" size={11} />;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      {selectedInst && <InstitutionFullDetailModal institution={selectedInst} onClose={() => setSelectedInst(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <span className="text-[10px] font-black text-white bg-indigo-700 px-3 py-0.5 rounded-full uppercase tracking-widest">Super Admin</span>
          <h1 className="text-2xl font-black text-[#0F2038] mt-1">All Institutions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete Registry — {institutions.length} Institutions on SafeED-UP</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-[#0F2038] border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 shadow-sm">
          <FiDownload size={13} /> Export Full Registry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: FiDatabase, label: 'Total', value: institutions.length, bg: 'from-[#0F2038] to-[#1E3A5F]' },
          { icon: FiCheckCircle, label: 'Verified', value: institutions.filter(i => institutionStore.isCertificateUnlocked(i._id)).length, bg: 'from-emerald-600 to-green-400' },
          { icon: MdSchool, label: 'Schools', value: institutions.filter(i => i.type === 'SCHOOL').length, bg: 'from-blue-700 to-blue-500' },
          { icon: MdBusiness, label: 'Colleges', value: institutions.filter(i => i.type === 'COLLEGE').length, bg: 'from-purple-700 to-violet-500' },
        ].map(k => (
          <div key={k.label} className={`rounded-2xl p-4 bg-gradient-to-br ${k.bg} text-white shadow-lg`}>
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center mb-2">
              <k.icon size={16} />
            </div>
            <p className="text-2xl font-black">{k.value}</p>
            <p className="text-xs font-semibold opacity-90 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <FiSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID, principal, address, police station…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Zone Filter */}
        <div className="flex flex-wrap gap-1">
          {ZONES.map(z => (
            <button
              key={z}
              onClick={() => setZone(z)}
              className={`text-[10px] font-black px-2.5 py-1.5 rounded-full transition-all ${zone === z ? 'bg-[#0F2038] text-[#D4AF37]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {z === 'ALL' ? 'All Zones' : `DCP ${z}`}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap gap-1">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`text-[10px] font-black px-2.5 py-1.5 rounded-full transition-all ${type === t ? 'bg-indigo-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t === 'ALL' ? 'All Types' : t}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-400 font-semibold ml-auto">
          Showing {filtered.length} of {institutions.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-[#0F2038]">Institution Registry</h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 font-bold text-emerald-700"><FiCheckCircle size={11} /> {verified} Verified</span>
            <span className="flex items-center gap-1 font-bold text-amber-600"><FiXCircle size={11} /> {pending} Pending</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Safe ID', 'Institution', 'Type', 'Zone', 'Principal & Contact', 'Address & Police Station', 'Students', 'Compliance', 'Certificate', 'Action'].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(inst => {
                const unlocked = institutionStore.isCertificateUnlocked(inst._id);
                return (
                  <tr key={inst._id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-3 py-3 font-mono font-black text-indigo-700 text-[10px] whitespace-nowrap">{inst.safeId}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="font-bold text-[#0F2038] hover:text-indigo-700 text-left flex items-center gap-1 group"
                      >
                        <span className="max-w-[160px] truncate block group-hover:max-w-none transition-all">{inst.name}</span>
                        <FiEye size={10} className="text-indigo-400 flex-shrink-0" />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        {typeIcon(inst.type)}
                        <span className="text-gray-600 font-semibold">{inst.type}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">DCP {inst.zone || 'CENTRAL'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-[#0F2038]">{inst.principal}</p>
                      <p className="text-[10px] text-gray-400">{inst.contact}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[10px] text-gray-600 max-w-[180px]">{inst.address}</p>
                      <p className="text-[9px] font-black text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1 mt-0.5">
                        <MdLocalPolice size={9} /> {inst.nearestPoliceStation || 'N/A'}
                      </p>
                    </td>
                    <td className="px-3 py-3 font-black text-[#0F2038]">
                      {(inst.totalStudents || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${inst.complianceScore >= 80 ? 'bg-emerald-500' : inst.complianceScore >= 60 ? 'bg-amber-400' : 'bg-red-500'}`}
                            style={{ width: `${inst.complianceScore || 0}%` }}
                          />
                        </div>
                        <span className="font-black text-[#0F2038]">{inst.complianceScore || 0}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {unlocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          <MdVerified size={11} /> ISSUED
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          🔒 PENDING
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="text-[10px] font-black px-2.5 py-1 bg-[#0F2038] text-[#D4AF37] border border-[#D4AF37] rounded-lg hover:bg-[#1E3A5F] transition-all flex items-center gap-1 whitespace-nowrap"
                      >
                        <FiEye size={9} /> View All Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FiDatabase size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">
                {institutions.length === 0 ? 'No institutions found.' : 'No institutions match your search.'}
              </p>
              <p className="text-xs text-gray-300 mt-1">All data is sourced from MongoDB Atlas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
