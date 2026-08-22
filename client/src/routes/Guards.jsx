import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common/Card/Card';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F9]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};

export const RoleGuard = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F9]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;

  const userRole = user.role;
  const assignedPortal = user.assignedPortal || userRole;

  // Grant access if either user.role OR assignedPortal is in allowedRoles
  const isAllowed =
    allowedRoles.includes(userRole) ||
    allowedRoles.includes(assignedPortal) ||
    (assignedPortal === 'INSPECTION_OFFICER' && allowedRoles.includes('INSPECTION_OFFICER')) ||
    (assignedPortal === 'DISTRICT_ADMIN' && allowedRoles.includes('DISTRICT_ADMIN')) ||
    userRole === 'SUPER_ADMIN';

  if (!isAllowed) {
    const targetPath =
      assignedPortal === 'SUPER_ADMIN' || userRole === 'SUPER_ADMIN' ? '/dashboard/super-admin' :
      assignedPortal === 'DISTRICT_ADMIN' || userRole === 'DISTRICT_ADMIN' ? '/dashboard/district-admin' :
      assignedPortal === 'INSPECTION_OFFICER' || userRole === 'INSPECTION_OFFICER' || userRole === 'POLICE_OFFICER' ? '/dashboard/inspector' :
      '/dashboard/inspector';

    return (
      <div className="p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold shadow-inner">
          🔒
        </div>
        <h2 className="text-xl font-black text-[#0F2038]">Government Access Guard</h2>
        <p className="text-xs text-[#5A6A7E] mt-1.5 max-w-md">
          You are currently logged in as <strong className="text-blue-700">{user.name || user.email}</strong> ({user.rankLevel || user.role}). You do not have permission to view this specific section.
        </p>
        <a
          href={targetPath}
          className="mt-5 px-5 py-2.5 bg-[#D4AF37] hover:bg-yellow-400 text-[#0F2038] font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          🛡️ Go to My Official Portal
        </a>
      </div>
    );
  }

  return <Outlet />;
};
