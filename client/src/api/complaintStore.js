// ============================================================
// SAFEED-UP — Complaint Store Facade (Supabase Powered)
// ============================================================
import { complaintService } from '../services/complaintService';

let cachedComplaints = [];

export const complaintStore = {
  getComplaints: () => {
    return cachedComplaints;
  },
  fetchComplaints: async (filters) => {
    cachedComplaints = await complaintService.getComplaints(filters);
    return cachedComplaints;
  },
  submitComplaint: async (data) => {
    const res = await complaintService.submitComplaint(data);
    cachedComplaints = [res, ...cachedComplaints];
    return res;
  },
  assignInspectorToComplaint: async (complaintId, inspector, directives) => {
    const inspectorName = inspector?.name || inspector;
    const res = await complaintService.assignInspector(complaintId, inspectorName, directives);
    cachedComplaints = cachedComplaints.map(c => c._id === complaintId ? { ...c, assignedInspector: inspectorName, districtDirectives: directives, status: 'INVESTIGATION_ASSIGNED' } : c);
    return res;
  }
};
