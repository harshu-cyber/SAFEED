import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../constants/roles';
import { institutionStore } from '../../../api/institutionStore';
import { complaintStore } from '../../../api/complaintStore';
import {
  FiGrid,
  FiShield,
  FiFileText,
  FiCheckSquare,
  FiAlertTriangle,
  FiUsers,
  FiMapPin,
  FiActivity,
  FiLock,
  FiUnlock,
  FiBarChart2,
  FiMessageSquare,
  FiList,
  FiZap,
  FiDatabase,
} from 'react-icons/fi';
import { MdVerified, MdLocalPolice } from 'react-icons/md';

export const Sidebar = ({ collapsed }) => {
  const { user } = useAuth();
  const role = user?.role;

  // Real-time check if certificate is unlocked for current institution
  const inst = user ? institutionStore.getInstitutionByIdOrEmail(user?.institutionId || user?.email) : null;
  const isUnlocked = inst ? institutionStore.isCertificateUnlocked(inst._id) : false;

  // Build role-specific navigation menus
  const getNavItems = () => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return [
          { label: 'System Overview', path: '/dashboard/super-admin', icon: FiGrid },
          { label: 'Inspection Monitoring', path: '/dashboard/super-admin/inspections', icon: FiShield },
          { label: 'Compliance Monitoring', path: '/dashboard/super-admin/compliance', icon: FiCheckSquare },
          { label: 'Emergency Overview', path: '/dashboard/super-admin/emergency', icon: FiAlertTriangle },
          { label: 'All Institutions', path: '/dashboard/super-admin/institutions', icon: FiDatabase },
          { label: 'User Management', path: '/dashboard/super-admin/users', icon: FiUsers },
        ];

      case ROLES.STATE_ADMIN:
        return [
          { label: 'State Overview', path: '/dashboard/state-admin', icon: FiGrid },
          { label: 'District Directory', path: '/dashboard/state-admin/districts', icon: FiMapPin },
          { label: 'Institutions', path: '/dashboard/state-admin/institutions', icon: FiShield },
          { label: 'Analytics', path: '/dashboard/state-admin/analytics', icon: FiActivity },
        ];

      case ROLES.DISTRICT_ADMIN:
        const pendingComplaintsCount = complaintStore
          .getComplaints()
          .filter(c => c.status === 'PENDING_DISTRICT_ACTION').length;
        return [
          { label: 'District Dashboard', path: '/dashboard/district-admin', icon: FiGrid },
          { label: 'Institutions Registry', path: '/dashboard/district-admin/institutions', icon: FiShield },
          { label: 'Zone Safety Analytics', path: '/dashboard/district-admin/analytics', icon: FiBarChart2 },
          { label: 'Public Complaints', path: '/dashboard/district-admin/complaints', icon: FiMessageSquare, badge: pendingComplaintsCount > 0 ? String(pendingComplaintsCount) : null },
        ];

      case ROLES.INSPECTION_OFFICER:
        const pendingDocCount = institutionStore
          .getDocumentsForZone(user?.dcpZone || 'DCP Central')
          .filter(d => d.status === 'PENDING_REVIEW').length;
        return [
          { label: 'Inspector Dashboard', path: '/dashboard/inspector', icon: FiGrid },
          { label: 'My Inspections', path: '/dashboard/inspector/inspections', icon: FiCheckSquare },
          { label: 'Document Approval', path: '/dashboard/inspector/document-approval', icon: FiFileText, badge: pendingDocCount > 0 ? String(pendingDocCount) : null },
          { label: 'Site Evidence (3+ Photos)', path: '/dashboard/inspector/evidence', icon: FiShield },
        ];

      case ROLES.SCHOOL_ADMIN:
      case ROLES.COACHING_ADMIN:
        return [
          { label: 'Dashboard', path: '/dashboard/institution', icon: FiGrid },
          { label: 'Institution Profile', path: '/dashboard/institution/profile', icon: FiShield },
          { label: 'Document Vault', path: '/dashboard/institution/documents', icon: FiFileText },
          { label: 'Emergency Readiness', path: '/dashboard/institution/emergency-plan', icon: FiAlertTriangle },
          {
            label: isUnlocked ? 'Safe ID & QR Code 🔓' : 'Safe ID & QR Code 🔒',
            path: '/dashboard/institution/safe-id',
            icon: isUnlocked ? MdVerified : FiLock,
            badge: isUnlocked ? 'Unlocked' : 'Locked',
            badgeColor: isUnlocked ? 'bg-emerald-600' : 'bg-amber-600',
          },
        ];

      case ROLES.POLICE_OFFICER:
        return [
          { label: 'Police Overview', path: '/dashboard/police', icon: FiGrid },
          { label: 'Institutions', path: '/dashboard/police/institutions', icon: FiShield },
        ];

      case ROLES.FIRE_OFFICER:
        return [
          { label: 'Fire Dept Overview', path: '/dashboard/fire', icon: FiGrid },
          { label: 'NOC Management', path: '/dashboard/fire/noc', icon: FiFileText },
        ];

      default:
        return [{ label: 'Dashboard', path: '/dashboard/district-admin', icon: FiGrid }];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`bg-[#07111E] text-white border-r border-[#D4AF37]/30 min-h-[calc(100vh-4rem)] transition-all duration-300 z-20 flex flex-col justify-between shadow-2xl ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="py-4">
        {/* Sidebar Header Badge */}
        {!collapsed && (
          <div className="px-4 mb-4 pb-3 border-b border-slate-800 flex items-center gap-3">
            <img src="/up-police-logo.png" alt="UP Police" className="w-8 h-8 object-contain bg-white rounded-full p-0.5 border border-[#D4AF37]" />
            <div>
              <p className="text-xs font-black text-[#D4AF37] tracking-wider uppercase">UP POLICE PORTAL</p>
              <p className="text-[9px] text-slate-400 font-bold">सुरक्षा आपकी, संकल्प हमारा</p>
            </div>
          </div>
        )}

        <div className="px-4 mb-2">
          {!collapsed && (
            <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]/70">
              Main Control Panel
            </p>
          )}
        </div>
        <nav className="space-y-1.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#D4AF37] to-amber-500 text-[#071A2F] shadow-lg'
                      : 'text-slate-300 hover:bg-[#1E3A5F] hover:text-white'
                  }`
                }
              >
                <Icon className="text-base flex-shrink-0" />
                {!collapsed && (
                  <span className="flex-1 flex items-center justify-between gap-2">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`${item.badgeColor || 'bg-rose-600'} text-white text-[9px] font-black px-2 py-0.5 rounded-full leading-none`}>
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {!collapsed && (
        <div className="p-3 border-t border-slate-800 bg-[#040910] text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img src="/up-govt-seal.png" alt="UP Seal" className="w-5 h-5 object-contain bg-white rounded-full p-0.5" />
            <span className="text-[10px] font-mono text-[#D4AF37] font-bold">Government of UP</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>NIC Live Host Connected</span>
          </div>
        </div>
      )}
    </aside>
  );
};
