// Mock data for Standalone Demo Mode (when backend DB is offline)

export const mockData = {
  inspections: [],
  institutions: [],
  documents: [],
  users: [
    { _id: 'u-super-1', name: 'Super Admin (SafeED)', email: 'superadmin@safeed.ac.in', role: 'SUPER_ADMIN', isActive: true, createdAt: '2024-01-01' },
  ],
  notifications: [],

  stateAnalytics: {
    totalInstitutions: 0,
    registeredInstitutions: 0,
    inspectedThisMonth: 0,
    highRiskInstitutions: 0,
    averageComplianceScore: 0,
    safeIdIssued: 0,
    districtBreakdown: [],
    monthlyInspections: [],
  },

  districtAnalytics: {
    totalInstitutions: 0,
    inspectedCount: 0,
    pendingInspection: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    complianceAvg: 0,
    safeIdIssued: 0,
  },
};
