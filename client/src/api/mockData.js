// Mock data for Standalone Demo Mode (when backend DB is offline)
// This file provides realistic demo data for all portals

export const mockData = {
  inspections: [
    { _id: 'insp_01', inspectionId: 'INS-LKO-2025-001', institutionId: { name: 'St. Mary Convent School, Hazratganj', _id: 'inst_01' }, inspectionType: 'ANNUAL_SAFETY', scheduledDate: '2025-11-10', conductedDate: '2025-11-12', status: 'COMPLETED', overallRisk: 'LOW', score: 87, assignedTo: { name: 'Inspector Singh' } },
    { _id: 'insp_02', inspectionId: 'INS-LKO-2025-002', institutionId: { name: 'Amit Academy Coaching Institute', _id: 'inst_02' }, inspectionType: 'FIRE_SAFETY', scheduledDate: '2025-11-18', conductedDate: null, status: 'SCHEDULED', overallRisk: 'MEDIUM', score: null, assignedTo: { name: 'Inspector Singh' } },
    { _id: 'insp_03', inspectionId: 'INS-LKO-2025-003', institutionId: { name: 'Delhi Public School, Aliganj', _id: 'inst_03' }, inspectionType: 'STRUCTURAL', scheduledDate: '2025-11-20', conductedDate: null, status: 'IN_PROGRESS', overallRisk: 'HIGH', score: null, assignedTo: { name: 'Inspector Singh' } },
    { _id: 'insp_04', inspectionId: 'INS-LKO-2025-004', institutionId: { name: 'City Coaching Center', _id: 'inst_04' }, inspectionType: 'ANNUAL_SAFETY', scheduledDate: '2025-11-25', conductedDate: null, status: 'SCHEDULED', overallRisk: 'MEDIUM', score: null, assignedTo: { name: 'Inspector Singh' } },
    { _id: 'insp_05', inspectionId: 'INS-LKO-2025-005', institutionId: { name: 'La Martiniere College', _id: 'inst_05' }, inspectionType: 'FOLLOW_UP', scheduledDate: '2025-12-01', conductedDate: null, status: 'SCHEDULED', overallRisk: 'LOW', score: null, assignedTo: { name: 'Inspector Singh' } },
  ],

  institutions: [
    { _id: 'inst_01', safeId: 'SAFE-UP-LKO-000001', name: 'St. Mary Convent School, Hazratganj', type: 'SCHOOL', district: 'Lucknow', state: 'Uttar Pradesh', totalStudents: 1250, staffCount: 65, classroomCount: 36, floorCount: 3, exitGateCount: 4, nearestPoliceStation: 'Hazratganj Police Station (थाना हज़रतगंज)', lastInspectionDate: '2025-11-12', complianceScore: 87, status: 'VERIFIED', riskLevel: 'LOW', address: '12 Mall Road, Hazratganj, Lucknow', contact: '0522-2612345', principal: 'Sr. Maria Fernandez' },
    { _id: 'inst_02', safeId: 'SAFE-UP-LKO-000002', name: 'Amit Academy Coaching Institute', type: 'COACHING', district: 'Lucknow', state: 'Uttar Pradesh', totalStudents: 320, staffCount: 18, classroomCount: 10, floorCount: 2, exitGateCount: 2, nearestPoliceStation: 'Hazratganj Police Station (थाना हज़रतगंज)', lastInspectionDate: '2025-09-05', complianceScore: 62, status: 'VERIFIED', riskLevel: 'MEDIUM', address: '45 Ashok Marg, Hazratganj, Lucknow', contact: '0522-2612346', principal: 'Amit Kumar' },
    { _id: 'inst_03', safeId: 'SAFE-UP-LKO-000003', name: 'Delhi Public School, Aliganj', type: 'SCHOOL', district: 'Lucknow', state: 'Uttar Pradesh', totalStudents: 2100, staffCount: 110, classroomCount: 54, floorCount: 4, exitGateCount: 6, nearestPoliceStation: 'Aliganj Police Station (थाना अलीगंज)', lastInspectionDate: '2025-07-20', complianceScore: 45, status: 'UNDER_REVIEW', riskLevel: 'HIGH', address: 'Sector B, Aliganj, Lucknow', contact: '0522-2612347', principal: 'Rajesh Sharma' },
    { _id: 'inst_04', safeId: 'SAFE-UP-LKO-000004', name: 'City Coaching Center', type: 'COACHING', district: 'Lucknow', state: 'Uttar Pradesh', totalStudents: 180, staffCount: 12, classroomCount: 6, floorCount: 1, exitGateCount: 2, nearestPoliceStation: 'Gomtinagar Police Station (थाना गोमतीनगर)', lastInspectionDate: '2025-08-15', complianceScore: 71, status: 'VERIFIED', riskLevel: 'MEDIUM', address: 'Vibhuti Khand, Gomtinagar, Lucknow', contact: '0522-2612348', principal: 'Suresh Mishra' },
    { _id: 'inst_05', safeId: 'SAFE-UP-LKO-000005', name: 'La Martiniere College', type: 'SCHOOL', district: 'Lucknow', state: 'Uttar Pradesh', totalStudents: 1800, staffCount: 95, classroomCount: 48, floorCount: 3, exitGateCount: 5, nearestPoliceStation: 'Gautam Palli Police Station (थाना गौतमपल्ली)', lastInspectionDate: '2025-10-01', complianceScore: 93, status: 'VERIFIED', riskLevel: 'LOW', address: 'La Martiniere Road, Hazratganj, Lucknow', contact: '0522-2612349', principal: 'Dr. James Philip' },
    { _id: 'inst_06', safeId: 'SAFE-UP-LKO-000006', name: 'Vidya Bharati Inter College', type: 'SCHOOL', district: 'Lucknow', state: 'Uttar Pradesh', totalStudents: 950, staffCount: 42, classroomCount: 28, floorCount: 2, exitGateCount: 3, nearestPoliceStation: 'Alambagh Police Station (थाना आलमबाग)', lastInspectionDate: null, complianceScore: null, status: 'PENDING', riskLevel: 'UNKNOWN', address: 'Alambagh Main Road, Lucknow', contact: '0522-2612350', principal: 'Ram Prasad Gupta' },
  ],

  documents: [
    { _id: 'doc_01', name: 'Fire NOC Certificate', type: 'FIRE_NOC', institutionId: 'inst_01', status: 'VERIFIED', uploadedAt: '2025-09-01', expiryDate: '2026-09-01', fileSize: '1.2 MB', verifiedBy: 'District Fire Officer' },
    { _id: 'doc_02', name: 'Building Safety Certificate', type: 'STRUCTURAL_SAFETY', institutionId: 'inst_01', status: 'VERIFIED', uploadedAt: '2025-08-15', expiryDate: '2026-08-15', fileSize: '2.1 MB', verifiedBy: 'District Inspector' },
    { _id: 'doc_03', name: 'Electrical Safety Audit', type: 'ELECTRICAL_SAFETY', institutionId: 'inst_01', status: 'PENDING_REVIEW', uploadedAt: '2025-10-20', expiryDate: '2026-10-20', fileSize: '890 KB', verifiedBy: null },
    { _id: 'doc_04', name: 'Emergency Evacuation Plan', type: 'EMERGENCY_PLAN', institutionId: 'inst_01', status: 'VERIFIED', uploadedAt: '2025-07-10', expiryDate: '2026-07-10', fileSize: '3.4 MB', verifiedBy: 'District Inspector' },
    { _id: 'doc_05', name: 'School Registration Certificate', type: 'REGISTRATION', institutionId: 'inst_01', status: 'VERIFIED', uploadedAt: '2020-01-01', expiryDate: '2030-01-01', fileSize: '500 KB', verifiedBy: 'State Admin' },
  ],

  users: [
    { _id: 'u1', name: 'Super Admin', email: 'superadmin@safeedup.gov.in', role: 'SUPER_ADMIN', isActive: true, createdAt: '2024-01-01', lastLogin: '2025-11-15' },
    { _id: 'u2', name: 'State Admin UP', email: 'stateadmin@safeedup.gov.in', role: 'STATE_ADMIN', isActive: true, createdAt: '2024-01-05', lastLogin: '2025-11-14' },
    { _id: 'u3', name: 'Suresh Kumar', email: 'districtadmin@safeedup.gov.in', role: 'DISTRICT_ADMIN', isActive: true, createdAt: '2024-02-10', lastLogin: '2025-11-13' },
    { _id: 'u4', name: 'Inspector Singh', email: 'inspector@safeedup.gov.in', role: 'INSPECTION_OFFICER', isActive: true, createdAt: '2024-02-15', lastLogin: '2025-11-15' },
    { _id: 'u5', name: 'ACP Vikram Rathore', email: 'police@safeedup.gov.in', role: 'POLICE_OFFICER', isActive: true, createdAt: '2024-03-01', lastLogin: '2025-11-12' },
    { _id: 'u6', name: 'CFO Ramesh Singh', email: 'fire@safeedup.gov.in', role: 'FIRE_OFFICER', isActive: true, createdAt: '2024-03-05', lastLogin: '2025-11-11' },
    { _id: 'u7', name: 'Principal Ramesh Chandra', email: 'schooladmin@safeedup.gov.in', role: 'SCHOOL_ADMIN', isActive: true, createdAt: '2024-04-01', lastLogin: '2025-11-10' },
    { _id: 'u8', name: 'Amit Kumar', email: 'coachingadmin@safeedup.gov.in', role: 'COACHING_ADMIN', isActive: true, createdAt: '2024-04-10', lastLogin: '2025-11-09' },
    { _id: 'u9', name: 'Rahul Gupta', email: 'citizen@safeedup.gov.in', role: 'CITIZEN', isActive: true, createdAt: '2024-05-01', lastLogin: '2025-11-08' },
  ],

  notifications: [
    { _id: 'notif_01', title: 'Inspection Scheduled', message: 'Fire safety inspection scheduled for Amit Academy on Nov 18.', type: 'INFO', isRead: false, createdAt: '2025-11-14T10:00:00Z' },
    { _id: 'notif_02', title: 'Document Pending Review', message: 'Electrical Safety Audit document requires verification.', type: 'WARNING', isRead: false, createdAt: '2025-11-13T09:30:00Z' },
    { _id: 'notif_03', title: 'High Risk Alert', message: 'DPS Aliganj has been flagged as HIGH RISK. Immediate inspection required.', type: 'DANGER', isRead: true, createdAt: '2025-11-12T14:00:00Z' },
    { _id: 'notif_04', title: 'Compliance Score Updated', message: 'St. Mary School compliance score updated to 87%.', type: 'SUCCESS', isRead: true, createdAt: '2025-11-12T08:00:00Z' },
  ],

  stateAnalytics: {
    totalInstitutions: 47832,
    registeredInstitutions: 39261,
    inspectedThisMonth: 1243,
    highRiskInstitutions: 3412,
    averageComplianceScore: 72.4,
    safeIdIssued: 38903,
    districtBreakdown: [
      { district: 'Lucknow', total: 4200, inspected: 3800, highRisk: 230, compliance: 81 },
      { district: 'Kanpur', total: 5100, inspected: 4200, highRisk: 410, compliance: 74 },
      { district: 'Varanasi', total: 3800, inspected: 2900, highRisk: 380, compliance: 68 },
      { district: 'Agra', total: 4500, inspected: 3200, highRisk: 510, compliance: 65 },
      { district: 'Allahabad', total: 3200, inspected: 2700, highRisk: 290, compliance: 78 },
      { district: 'Meerut', total: 3900, inspected: 3100, highRisk: 320, compliance: 76 },
    ],
    monthlyInspections: [
      { month: 'Jun 2025', count: 890 },
      { month: 'Jul 2025', count: 1120 },
      { month: 'Aug 2025', count: 1050 },
      { month: 'Sep 2025', count: 1380 },
      { month: 'Oct 2025', count: 1290 },
      { month: 'Nov 2025', count: 1243 },
    ],
  },

  districtAnalytics: {
    totalInstitutions: 4200,
    inspectedCount: 3800,
    pendingInspection: 400,
    highRisk: 230,
    mediumRisk: 780,
    lowRisk: 2790,
    complianceAvg: 81,
    safeIdIssued: 3750,
  },
};
