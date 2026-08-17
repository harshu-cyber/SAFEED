import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute, RoleGuard } from './Guards';
import { ROLES } from '../constants/roles';

// Layouts
import { AuthLayout, PublicLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Auth Pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { ForgotPassword } from '../pages/auth/ForgotPassword';

// Public Pages
import { Landing } from '../pages/public/Landing';
import { PublicVerification } from '../pages/public/PublicVerification';
import { AboutPage } from '../pages/public/About';
import { HowItWorksPage } from '../pages/public/HowItWorks';
import { FAQsPage } from '../pages/public/FAQs';
import { SubmitConcernPage } from '../pages/public/SubmitConcern';
import { ContactPage } from '../pages/public/Contact';

// Portal Dashboards & Pages
import { SuperAdminDashboard } from '../pages/superAdmin/Dashboard';
import { UserManagementPage } from '../pages/superAdmin/Users';
import { SuperInspectionMonitoring } from '../pages/superAdmin/InspectionMonitoring';
import { SuperComplianceMonitoring } from '../pages/superAdmin/ComplianceMonitoring';
import { SuperEmergencyOverview } from '../pages/superAdmin/EmergencyOverview';
import { SuperInstitutionsList } from '../pages/superAdmin/InstitutionsList';
import { DistrictAdminDashboard } from '../pages/districtAdmin/Dashboard';
import { DistrictInstitutionsPage } from '../pages/districtAdmin/Institutions';
import { InstitutionDashboard } from '../pages/institution/Dashboard';
import { InstitutionProfile } from '../pages/institution/Profile';
import { DocumentsPage } from '../pages/institution/Documents';
import { SafeIDPage } from '../pages/institution/SafeID';
import { EmergencyPlanPage } from '../pages/institution/EmergencyPlan';
import { InspectorDashboard } from '../pages/inspector/Dashboard';
import { InspectorInspections } from '../pages/inspector/InspectorInspections';
import { DocumentApproval } from '../pages/inspector/DocumentApproval';
import { EvidenceUpload } from '../pages/inspector/EvidenceUpload';
import { PoliceDashboard } from '../pages/police/Dashboard';
import { FireDashboard } from '../pages/fire/Dashboard';

import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/verify/:safeId" element={<PublicVerification />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/faqs" element={<FAQsPage />} />
            <Route path="/submit-concern" element={<SubmitConcernPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Super Admin */}
              <Route element={<RoleGuard allowedRoles={[ROLES.SUPER_ADMIN]} />}>
                <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
                <Route path="/dashboard/super-admin/inspections" element={<SuperInspectionMonitoring />} />
                <Route path="/dashboard/super-admin/compliance" element={<SuperComplianceMonitoring />} />
                <Route path="/dashboard/super-admin/emergency" element={<SuperEmergencyOverview />} />
                <Route path="/dashboard/super-admin/institutions" element={<SuperInstitutionsList />} />
                <Route path="/dashboard/super-admin/users" element={<UserManagementPage />} />
              </Route>

              {/* State Admin */}
              <Route element={<RoleGuard allowedRoles={[ROLES.STATE_ADMIN, ROLES.SUPER_ADMIN]} />}>
                <Route path="/dashboard/state-admin" element={<SuperAdminDashboard />} />
              </Route>

              {/* District Admin */}
              <Route element={<RoleGuard allowedRoles={[ROLES.DISTRICT_ADMIN, ROLES.SUPER_ADMIN, ROLES.STATE_ADMIN]} />}>
                <Route path="/dashboard/district-admin" element={<DistrictAdminDashboard />} />
                <Route path="/dashboard/district-admin/institutions" element={<DistrictInstitutionsPage />} />
                <Route path="/dashboard/district-admin/analytics" element={<DistrictAdminDashboard defaultTab="ANALYTICS" />} />
                <Route path="/dashboard/district-admin/complaints" element={<DistrictAdminDashboard defaultTab="COMPLAINTS" />} />
                <Route path="/dashboard/district-admin/inspections" element={<DistrictAdminDashboard />} />
                <Route path="/dashboard/district-admin/compliance" element={<DistrictAdminDashboard defaultTab="COMPLAINTS" />} />
              </Route>

              {/* Inspector */}
              <Route element={<RoleGuard allowedRoles={[ROLES.INSPECTION_OFFICER, ROLES.SUPER_ADMIN]} />}>
                <Route path="/dashboard/inspector" element={<InspectorDashboard />} />
                <Route path="/dashboard/inspector/inspections" element={<InspectorInspections />} />
                <Route path="/dashboard/inspector/document-approval" element={<DocumentApproval />} />
                <Route path="/dashboard/inspector/evidence" element={<EvidenceUpload />} />
              </Route>

              {/* Institution Portal */}
              <Route element={<RoleGuard allowedRoles={[ROLES.SCHOOL_ADMIN, ROLES.COACHING_ADMIN, ROLES.SUPER_ADMIN]} />}>
                <Route path="/dashboard/institution" element={<InstitutionDashboard />} />
                <Route path="/dashboard/institution/profile" element={<InstitutionProfile />} />
                <Route path="/dashboard/institution/documents" element={<DocumentsPage />} />
                <Route path="/dashboard/institution/safe-id" element={<SafeIDPage />} />
                <Route path="/dashboard/institution/emergency-plan" element={<EmergencyPlanPage />} />
              </Route>

              {/* Police */}
              <Route element={<RoleGuard allowedRoles={[ROLES.POLICE_OFFICER, ROLES.SUPER_ADMIN]} />}>
                <Route path="/dashboard/police" element={<PoliceDashboard />} />
              </Route>

              {/* Fire */}
              <Route element={<RoleGuard allowedRoles={[ROLES.FIRE_OFFICER, ROLES.SUPER_ADMIN]} />}>
                <Route path="/dashboard/fire" element={<FireDashboard />} />
              </Route>
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>
);
};
