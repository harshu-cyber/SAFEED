import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { institutionStore, normalizeZone } from '../../api/institutionStore';
import { userStore } from '../../api/userStore';
import { complaintStore } from '../../api/complaintStore';
import {
  FiShield, FiUsers, FiAlertTriangle, FiCheckSquare, FiActivity,
  FiTrendingUp, FiDownload, FiSettings, FiSearch, FiEye,
  FiBarChart2, FiGlobe, FiClock, FiDatabase, FiZap, FiArrowRight,
  FiCheckCircle, FiXCircle, FiMapPin
} from 'react-icons/fi';
import { MdVerified, MdLocalPolice, MdSchool, MdBusiness } from 'react-icons/md';
import { InstitutionFullDetailModal } from '../../components/common/Modals/InstitutionFullDetailModal';

import { cloudSync } from '../../api/cloudSync';

const StatCard = ({ icon: Icon, label, value, sub, gradient, badge, link }) => {
  const content = (
    <div className={`rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${gradient}`}>
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
          <Icon size={20} />
        </div>
        {badge && <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-black tracking-wider">{badge}</span>}
      </div>
      <p className="text-3xl font-black tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm font-bold mt-1 opacity-90">{label}</p>
      {sub && <p className="text-[11px] opacity-65 mt-0.5">{sub}</p>}
      {link && (
        <div className="flex items-center gap-1 mt-3 text-[11px] font-bold opacity-80 group-hover:opacity-100">
          View Details <FiArrowRight size={11} />
        </div>
      )}
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
};

const MiniBar = ({ value, max, color }) => (
  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
    <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
  </div>
);

const ZoneCard = ({ zone, count, unlocked, color }) => (
  <div className={`rounded-xl p-4 border ${color} bg-white shadow-sm hover:shadow-md transition-all`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{zone}</span>
      <MdLocalPolice className="text-[#D4AF37]" size={16} />
    </div>
    <p className="text-2xl font-black text-[#0F2038]">{count}</p>
    <p className="text-[10px] font-semibold text-gray-500 mt-0.5">Institutions</p>
    <div className="mt-2">
      <div className="flex justify-between text-[9px] mb-1">
        <span className="text-emerald-600 font-bold">{unlocked} Verified</span>
        <span className="text-amber-600 font-bold">{count - unlocked} Pending</span>
      </div>
      <MiniBar value={unlocked} max={count || 1} color="bg-emerald-500" />
    </div>
  </div>
);

const ZONES = ['WEST', 'CENTRAL', 'NORTH', 'EAST', 'SOUTH'];
const ZONE_COLORS = {
  WEST: 'border-blue-200',
  CENTRAL: 'border-purple-200',
  NORTH: 'border-green-200',
  EAST: 'border-orange-200',
  SOUTH: 'border-red-200',
};

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [userStats, setUserStats] = useState({});
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedInst, setSelectedInst] = useState(null);

  useEffect(() => {
    const loadRealTime = async () => {
      try {
        await cloudSync.pull();
      } catch (e) {}
      setInstitutions(institutionStore.getInstitutions() || []);
      setUserStats(userStore.getStats?.() || { total: 0, active: 0, inspectors: 0, districtAdmins: 0, police: 0 });
      setComplaints(complaintStore.getComplaints?.() || []);
    };

    loadRealTime();
    cloudSync.startAutoSync();
    const iv = setInterval(loadRealTime, 3000);
    return () => {
      clearInterval(iv);
    };
  }, []);

  const total = institutions.length;
  const verified = institutions.filter(i => institutionStore.isCertificateUnlocked(i._id)).length;
  const highRisk = institutions.filter(i => i.riskLevel === 'HIGH' || i.complianceScore < 50).length;
  const pending = institutions.filter(i => !institutionStore.isCertificateUnlocked(i._id)).length;

  const byZone = ZONES.map(zone => {
    const zoneInsts = institutions.filter(i => normalizeZone(i.zone) === zone);
    const zoneUnlocked = zoneInsts.filter(i => institutionStore.isCertificateUnlocked(i._id)).length;
    return { zone, count: zoneInsts.length, unlocked: zoneUnlocked };
  });

  const byType = {
    School: institutions.filter(i => {
      const t = (i.type || '').toUpperCase();
      return t === 'SCHOOL' || t === 'SCHOOL_ADMIN' || t === 'SCHOOLS';
    }).length,
    College: institutions.filter(i => {
      const t = (i.type || '').toUpperCase();
      return t === 'COLLEGE' || t === 'COLLEGES';
    }).length,
    Coaching: institutions.filter(i => {
      const t = (i.type || '').toUpperCase();
      return t.includes('COACHING');
    }).length,
  };

  const pendingComplaints = complaints.filter(c => c.status !== 'RESOLVED').length;

  const recent = [...institutions]
    .sort((a, b) => {
      const timeA = Date.parse(a.createdAt || '') || (typeof a._id === 'string' && a._id.startsWith('inst_') ? parseInt(a._id.split('_')[1]) || 0 : 0);
      const timeB = Date.parse(b.createdAt || '') || (typeof b._id === 'string' && b._id.startsWith('inst_') ? parseInt(b._id.split('_')[1]) || 0 : 0);
      return timeB - timeA;
    })
    .slice(0, 5);

  const filtered = institutions.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.safeId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      {selectedInst && (
        <InstitutionFullDetailModal institution={selectedInst} onClose={() => setSelectedInst(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <img src="/up-police-logo.png" alt="UP Police" className="w-6 h-6 object-contain" />
            <span className="text-[10px] font-black text-white bg-gradient-to-r from-purple-700 to-indigo-700 px-3 py-0.5 rounded-full uppercase tracking-widest shadow-sm">Super Admin</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> System Online
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0F2038]">SafeED-UP Command Centre</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome, <span className="font-bold text-purple-700">{user?.name || 'Super Admin'}</span> · Uttar Pradesh State Dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/super-admin/users" className="flex items-center gap-2 text-sm font-bold text-gray-700 border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 transition-all shadow-sm">
            <FiUsers size={14} /> Manage Users
          </Link>
          <button className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-[#0F2038] to-[#1E3A5F] px-4 py-2 rounded-xl hover:opacity-90 transition-all shadow-md">
            <FiDownload size={14} /> Full State Report
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FiGlobe}
          label="Total Institutions"
          value={total}
          sub="Registered on SafeED-UP"
          gradient="bg-gradient-to-br from-[#0F2038] to-[#1E3A5F]"
          badge="LIVE"
          link="/dashboard/super-admin/institutions"
        />
        <StatCard
          icon={MdVerified}
          label="Safety Verified"
          value={verified}
          sub={`${total ? Math.round((verified / total) * 100) : 0}% compliance rate`}
          gradient="bg-gradient-to-br from-emerald-600 to-green-400"
          link="/dashboard/super-admin/compliance"
        />
        <StatCard
          icon={FiAlertTriangle}
          label="High Risk"
          value={highRisk}
          sub="Needs urgent inspection"
          gradient="bg-gradient-to-br from-red-600 to-rose-400"
          badge="URGENT"
          link="/dashboard/super-admin/emergency"
        />
        <StatCard
          icon={FiUsers}
          label="System Users"
          value={userStats.total || 0}
          sub={`${userStats.active || 0} active officers`}
          gradient="bg-gradient-to-br from-purple-700 to-violet-500"
          link="/dashboard/super-admin/users"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <FiCheckSquare className="text-amber-600" size={15} />
            </div>
            <span className="text-xs font-bold text-gray-500">Pending Verification</span>
          </div>
          <p className="text-2xl font-black text-[#0F2038]">{pending}</p>
          <MiniBar value={verified} max={total || 1} color="bg-amber-400" />
        </div>
        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <MdSchool className="text-blue-600" size={15} />
            </div>
            <span className="text-xs font-bold text-gray-500">Schools</span>
          </div>
          <p className="text-2xl font-black text-[#0F2038]">{byType.School}</p>
          <MiniBar value={byType.School} max={total || 1} color="bg-blue-400" />
        </div>
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <MdBusiness className="text-purple-600" size={15} />
            </div>
            <span className="text-xs font-bold text-gray-500">Colleges</span>
          </div>
          <p className="text-2xl font-black text-[#0F2038]">{byType.College}</p>
          <MiniBar value={byType.College} max={total || 1} color="bg-purple-400" />
        </div>
        <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <FiActivity className="text-orange-600" size={15} />
            </div>
            <span className="text-xs font-bold text-gray-500">Coaching Centres</span>
          </div>
          <p className="text-2xl font-black text-[#0F2038]">{byType.Coaching}</p>
          <MiniBar value={byType.Coaching} max={total || 1} color="bg-orange-400" />
        </div>
      </div>

      {/* Zone Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-black text-[#0F2038]">Zone-wise Distribution</h2>
            <p className="text-xs text-gray-400">Institution count by DCP Zone</p>
          </div>
          <Link to="/dashboard/super-admin/inspections" className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1">
            Inspection Monitor <FiArrowRight size={11} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {byZone.map(z => (
            <ZoneCard key={z.zone} zone={`DCP ${z.zone}`} count={z.count} unlocked={z.unlocked} color={ZONE_COLORS[z.zone]} />
          ))}
        </div>
      </div>

      {/* Bottom: Quick Links + Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-black text-[#0F2038] mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { icon: FiUsers, label: 'Create New Officer Account', to: '/dashboard/super-admin/users', color: 'text-purple-700 bg-purple-50 border-purple-200' },
              { icon: FiShield, label: 'View Inspection Reports', to: '/dashboard/super-admin/inspections', color: 'text-blue-700 bg-blue-50 border-blue-200' },
              { icon: FiCheckSquare, label: 'Compliance Overview', to: '/dashboard/super-admin/compliance', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
              { icon: FiAlertTriangle, label: 'Emergency Dashboard', to: '/dashboard/super-admin/emergency', color: 'text-red-700 bg-red-50 border-red-200' },
              { icon: FiDatabase, label: 'All Institutions', to: '/dashboard/super-admin/institutions', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
            ].map(item => (
              <Link key={item.label} to={item.to} className={`flex items-center gap-3 p-3 rounded-xl border font-semibold text-xs transition-all hover:scale-[1.01] ${item.color}`}>
                <item.icon size={14} />
                {item.label}
                <FiArrowRight size={11} className="ml-auto" />
              </Link>
            ))}
          </div>
        </div>

        {/* User Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-[#0F2038]">User Summary</h2>
            <Link to="/dashboard/super-admin/users" className="text-xs font-bold text-purple-700 hover:underline">Manage →</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Total Users', value: userStats.total || 0, color: 'bg-gray-200' },
              { label: 'Active Users', value: userStats.active || 0, color: 'bg-emerald-400' },
              { label: 'DCP Inspectors', value: userStats.inspectors || 0, color: 'bg-blue-400' },
              { label: 'District Admins', value: userStats.districtAdmins || 0, color: 'bg-purple-400' },
              { label: 'Police Officers', value: userStats.police || 0, color: 'bg-sky-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-semibold">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min((item.value / (userStats.total || 1)) * 100, 100)}%` }} />
                  </div>
                  <span className="font-black text-[#0F2038] w-5 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-[#0F2038]">Recent Registrations</h2>
            <Link to="/dashboard/super-admin/institutions" className="text-xs font-bold text-purple-700 hover:underline">All →</Link>
          </div>
          <div className="space-y-2">
            {recent.length === 0 && <p className="text-xs text-gray-400 italic">No institutions yet</p>}
            {recent.map(inst => {
              const unlocked = institutionStore.isCertificateUnlocked(inst._id);
              return (
                <button
                  key={inst._id}
                  onClick={() => setSelectedInst(inst)}
                  className="w-full flex items-start gap-2 p-2.5 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50 transition-all text-left"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${unlocked ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    {unlocked ? <FiCheckCircle size={13} className="text-emerald-600" /> : <FiXCircle size={13} className="text-amber-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-[#0F2038] truncate">{inst.name}</p>
                    <p className="text-[9px] text-gray-400 font-semibold">{inst.type} · {inst.zone || 'CENTRAL'} Zone</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Complaint Alert Banner */}
      {pendingComplaints > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-4 mb-6">
          <FiAlertTriangle className="text-amber-600 flex-shrink-0" size={18} />
          <p className="text-sm text-amber-800 font-semibold">
            <span className="font-black">{pendingComplaints} public complaint{pendingComplaints > 1 ? 's' : ''}</span> are pending resolution across the district.
          </p>
          <Link to="/dashboard/super-admin/emergency" className="ml-auto text-xs font-black text-amber-700 border border-amber-400 px-3 py-1 rounded-lg hover:bg-amber-100 transition-all flex-shrink-0">
            Review →
          </Link>
        </div>
      )}
    </div>
  );
};
