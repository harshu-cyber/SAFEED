// ============================================================
// SafeED-UP — Real-Time Public Safety Complaints Store
// 100% Real-Time (Landing Page -> District Authority -> Inspector)
// ============================================================

const STORAGE_KEY = 'safeed_complaints_store_v1';

export const complaintStore = {
  syncCloudComplaints: (cloudComplaints) => {
    if (!Array.isArray(cloudComplaints)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudComplaints));
  },

  getComplaints: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  },

  submitComplaint: (data) => {
    const list = complaintStore.getComplaints();
    const newComplaint = {
      _id: 'cmp_' + Date.now(),
      complaintTicket: `CMP-UP-${Math.floor(100000 + Math.random() * 900000)}`,
      institutionName: data.institutionName,
      institutionId: data.institutionId || null,
      district: data.district || 'Lucknow',
      zone: (data.zone || 'CENTRAL').toUpperCase(),
      category: data.category || 'FIRE_SAFETY_HAZARD',
      complainantName: data.complainantName || 'Anonymous Citizen',
      complainantPhone: data.complainantPhone || 'Hidden',
      complainantEmail: data.complainantEmail || '',
      description: data.description,
      status: 'PENDING_DISTRICT_ACTION', // PENDING_DISTRICT_ACTION | INVESTIGATION_ASSIGNED | RESOLVED
      assignedInspector: null,
      assignedInspectorZone: null,
      assignedAt: null,
      districtDirectives: '',
      submittedAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
    };

    list.unshift(newComplaint);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return newComplaint;
  },

  assignInspectorToComplaint: (complaintId, inspectorInfo, directives = '') => {
    const list = complaintStore.getComplaints();
    const updated = list.map(c => {
      if (c._id !== complaintId) return c;
      return {
        ...c,
        status: 'INVESTIGATION_ASSIGNED',
        assignedInspector: inspectorInfo.name || inspectorInfo.dcpZone || 'DCP Officer',
        assignedInspectorZone: inspectorInfo.zone || c.zone,
        assignedAt: new Date().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        districtDirectives: directives || 'Investigate site safety concern immediately and report evidence.',
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  getComplaintsForInspector: (dcpZone) => {
    const list = complaintStore.getComplaints();
    const zoneStr = (dcpZone || '').toUpperCase();
    return list.filter(c => 
      c.status === 'INVESTIGATION_ASSIGNED' && 
      (c.assignedInspectorZone?.toUpperCase().includes(zoneStr) || c.assignedInspector?.toUpperCase().includes(zoneStr) || zoneStr.includes(c.zone))
    );
  },

  resolveComplaint: (complaintId, resolutionRemarks = '') => {
    const list = complaintStore.getComplaints();
    const updated = list.map(c => {
      if (c._id !== complaintId) return c;
      return {
        ...c,
        status: 'RESOLVED',
        resolutionRemarks: resolutionRemarks || 'Site inspection completed. Issue resolved.',
        resolvedAt: new Date().toLocaleDateString('en-IN'),
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  // Returns all complaints — alias used by Super Admin dashboard
  getAllComplaints: () => {
    return complaintStore.getComplaints();
  },

  // Returns complaints related to a specific institution (by name or ID)
  getComplaintsForInstitution: (institutionId) => {
    const list = complaintStore.getComplaints();
    return list.filter(c =>
      c.institutionId === institutionId ||
      c.institutionName?.toLowerCase().includes(institutionId?.toLowerCase())
    );
  },
};
