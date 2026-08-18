// ============================================================
// SafeED-UP — Real-Time Client Institution & Document Store
// Zone-Based DCP Filtering | District Authority Support | 100% Real-Time
// ============================================================

const STORAGE_KEYS = {
  INSTITUTIONS: 'safeed_institutions_store_v2',
  DOCUMENTS: 'safeed_documents_store_v2',
  DISTRICT_LOGS: 'safeed_district_action_logs_v1',
};

// Normalize any zone string → one of: WEST | CENTRAL | NORTH | EAST | SOUTH | null
const normalizeZone = (val = '') => {
  const v = String(val).toLowerCase();
  if (v.includes('west'))    return 'WEST';
  if (v.includes('central')) return 'CENTRAL';
  if (v.includes('north'))   return 'NORTH';
  if (v.includes('east'))    return 'EAST';
  if (v.includes('south'))   return 'SOUTH';
  return null; // null = no zone restriction (super admin / district admin)
};

export { normalizeZone };

const DEFAULT_INSTITUTIONS = [
  {
    _id: 'inst-1',
    safeId: 'SAFE-UP-LKO-100201',
    name: 'City Montessori School (Gomti Nagar Branch)',
    type: 'SCHOOL',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    zone: 'EAST',
    totalStudents: 3200,
    staffCount: 180,
    classroomCount: 75,
    floorCount: 4,
    exitGateCount: 4,
    nearestPoliceStation: 'Gomti Nagar Police Station',
    lastInspectionDate: '2026-08-10',
    complianceScore: 92,
    status: 'VERIFIED',
    riskLevel: 'LOW',
    address: 'Gomti Nagar Phase 1, Lucknow, Uttar Pradesh 226010',
    contact: '0522-2304000',
    principal: 'Dr. Sunita Gandhi',
    email: 'cms.gomtinagar@safeed.ac.in',
    affiliationBoard: 'ICSE',
    assignedInspector: 'DCP EAST',
    assignedInspectorZone: 'EAST',
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    _id: 'inst-2',
    safeId: 'SAFE-UP-LKO-100202',
    name: 'La Martiniere College Lucknow',
    type: 'COLLEGE',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    zone: 'CENTRAL',
    totalStudents: 2800,
    staffCount: 150,
    classroomCount: 60,
    floorCount: 3,
    exitGateCount: 3,
    nearestPoliceStation: 'Hazratganj Police Station',
    lastInspectionDate: '2026-08-12',
    complianceScore: 88,
    status: 'VERIFIED',
    riskLevel: 'LOW',
    address: 'La Martiniere Road, Hazratganj, Lucknow, UP 226001',
    contact: '0522-2235421',
    principal: 'C.A. MacFarland',
    email: 'lamartiniere@safeed.ac.in',
    affiliationBoard: 'ICSE',
    assignedInspector: 'DCP CENTRAL',
    assignedInspectorZone: 'CENTRAL',
    createdAt: '2026-01-16T00:00:00Z',
  },
  {
    _id: 'inst-3',
    safeId: 'SAFE-UP-LKO-100203',
    name: 'Lucknow Public College (Sahara States)',
    type: 'SCHOOL',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    zone: 'NORTH',
    totalStudents: 2100,
    staffCount: 110,
    classroomCount: 50,
    floorCount: 3,
    exitGateCount: 2,
    nearestPoliceStation: 'Jankipuram Police Station',
    lastInspectionDate: null,
    complianceScore: 45,
    status: 'PENDING_DOCUMENT_VERIFICATION',
    riskLevel: 'HIGH',
    address: 'Jankipuram Extension, Lucknow, UP 226021',
    contact: '0522-2731100',
    principal: 'S.P. Singh',
    email: 'lpc.jankipuram@safeed.ac.in',
    affiliationBoard: 'CBSE',
    assignedInspector: 'DCP NORTH',
    assignedInspectorZone: 'NORTH',
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    _id: 'inst-4',
    safeId: 'SAFE-UP-LKO-100204',
    name: 'Allen Career Institute Lucknow',
    type: 'COACHING',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    zone: 'WEST',
    totalStudents: 1500,
    staffCount: 65,
    classroomCount: 30,
    floorCount: 5,
    exitGateCount: 2,
    nearestPoliceStation: 'Alambagh Police Station',
    lastInspectionDate: null,
    complianceScore: 35,
    status: 'PENDING_DOCUMENT_VERIFICATION',
    riskLevel: 'HIGH',
    address: 'Alambagh Main Market, Lucknow, UP 226005',
    contact: '0522-4912000',
    principal: 'R.K. Maheshwari',
    email: 'allen.lucknow@safeed.ac.in',
    affiliationBoard: 'OTHER',
    assignedInspector: 'DCP WEST',
    assignedInspectorZone: 'WEST',
    createdAt: '2026-02-05T00:00:00Z',
  },
  {
    _id: 'inst-5',
    safeId: 'SAFE-UP-LKO-100205',
    name: 'Amity University Lucknow Campus',
    type: 'COLLEGE',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    zone: 'SOUTH',
    totalStudents: 5400,
    staffCount: 320,
    classroomCount: 120,
    floorCount: 6,
    exitGateCount: 5,
    nearestPoliceStation: 'Sultanpur Road Police Station',
    lastInspectionDate: '2026-08-14',
    complianceScore: 85,
    status: 'VERIFIED',
    riskLevel: 'LOW',
    address: 'Malhaur, Gomti Nagar Extension, Lucknow, UP 226028',
    contact: '0522-2817000',
    principal: 'Dr. W. Selvamurthy',
    email: 'amity.lucknow@safeed.ac.in',
    affiliationBoard: 'UGC',
    assignedInspector: 'DCP SOUTH',
    assignedInspectorZone: 'SOUTH',
    createdAt: '2026-02-10T00:00:00Z',
  },
];

export const institutionStore = {

  // ── INSTITUTIONS ─────────────────────────────────────────

  syncCloudInstitutions: (cloudInsts) => {
    if (!Array.isArray(cloudInsts)) return;
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(cloudInsts));
  },

  /** Return ALL institutions from localStorage (with auto-assigned zone inspectors) */
  getInstitutions: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) {
          return list.map(inst => {
            const zoneKey = inst.zone || 'CENTRAL';
            return {
              ...inst,
              assignedInspector: inst.assignedInspector || `DCP ${zoneKey}`,
              assignedInspectorZone: inst.assignedInspectorZone || zoneKey,
            };
          });
        }
      }
    } catch {}
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(DEFAULT_INSTITUTIONS));
    // Trigger instant cloud push so server gets default institutions
    import('./cloudSync').then(m => m.cloudSync.push()).catch(() => {});
    return DEFAULT_INSTITUTIONS;
  },

  /**
   * Return institutions whose zone matches the DCP zone string.
   * Pass the user's dcpZone value (e.g. "DCP West" or "WEST").
   * If zone cannot be resolved, returns ALL (super-admin / district admin).
   */
  getInstitutionsForZone: (dcpZone) => {
    const zone = normalizeZone(dcpZone);
    const all = institutionStore.getInstitutions();
    if (!zone) return all;
    return all.filter(i => normalizeZone(i.zone) === zone);
  },

  /** Lookup by _id, email, or safeId — STRICT, no fallback */
  getInstitutionByIdOrEmail: (identifier) => {
    if (!identifier) return null;
    const all = institutionStore.getInstitutions();
    const idLow = String(identifier).toLowerCase();
    return (
      all.find(
        i =>
          i._id === identifier ||
          i.email?.toLowerCase() === idLow ||
          i.safeId === identifier
      ) || null
    );
  },

  /** Register a brand-new institution and return it */
  registerInstitution: (data) => {
    const all = institutionStore.getInstitutions();
    const emailLow = data.email?.toLowerCase();

    const existing = all.find(i => i.email?.toLowerCase() === emailLow);
    if (existing) return existing;

    const districtCode = (data.district || 'LKO').substring(0, 3).toUpperCase();
    const safeId = `SAFE-UP-${districtCode}-${Math.floor(100000 + Math.random() * 900000)}`;
    const zoneKey = normalizeZone(data.zone) || 'CENTRAL';

    const newInst = {
      _id: 'inst_' + Date.now(),
      safeId,
      name: data.institutionName || data.name,
      type: data.institutionType || 'SCHOOL',
      district: data.district || 'Lucknow',
      state: data.state || 'Uttar Pradesh',
      zone: zoneKey,  // stored normalized
      totalStudents: parseInt(data.totalStudents || 0),
      staffCount: parseInt(data.staffCount || data.totalTeachers || 0),
      classroomCount: parseInt(data.classroomCount || data.totalClassrooms || 0),
      floorCount: parseInt(data.floorCount || data.buildingFloors || 1),
      exitGateCount: parseInt(data.exitGateCount || 2),
      nearestPoliceStation: data.nearestPoliceStation || `${data.district || 'Hazratganj'} Police Station`,
      lastInspectionDate: null,
      complianceScore: 0,
      status: 'PENDING_DOCUMENT_VERIFICATION',
      riskLevel: 'UNDER_REVIEW',
      address: data.address || `${data.district || 'Lucknow'}, Uttar Pradesh`,
      contact: data.phone,
      principal: data.name,
      email: emailLow,
      affiliationBoard: data.affiliationBoard || 'CBSE',
      affiliationCode: data.affiliationCode || '',
      assignedInspector: `DCP ${zoneKey}`,
      assignedInspectorEmail: `dcp${zoneKey.toLowerCase()}@safeedup.gov.in`,
      assignedInspectorZone: zoneKey,
      assignedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      districtRemarks: [],
      createdAt: new Date().toISOString(),
    };

    all.unshift(newInst);
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(all));
    return newInst;
  },

  /** Update institution profile fields and mark profile as completed */
  updateInstitutionProfile: (instId, profileData) => {
    const insts = institutionStore.getInstitutions();
    const updated = insts.map(i => {
      if (i._id !== instId) return i;
      return {
        ...i,
        ...profileData,
        staffCount: parseInt(profileData.staffCount || profileData.totalTeachers || i.staffCount || 0),
        classroomCount: parseInt(profileData.classroomCount || profileData.totalClassrooms || i.classroomCount || 0),
        floorCount: parseInt(profileData.floorCount || profileData.buildingFloors || i.floorCount || 1),
        exitGateCount: parseInt(profileData.exitGateCount || i.exitGateCount || 2),
        nearestPoliceStation: profileData.nearestPoliceStation || i.nearestPoliceStation || `${i.district || 'Hazratganj'} Police Station`,
      };
    });
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
  },

  /**
   * Profile is complete when mandatory fields are filled
   */
  isProfileComplete: (instId) => {
    if (!instId) return false;
    const inst = institutionStore.getInstitutions().find(i => i._id === instId);
    if (!inst) return false;
    return !!(
      inst.profileCompleted &&
      inst.totalStudents > 0 &&
      (inst.staffCount > 0 || inst.totalTeachers > 0) &&
      (inst.classroomCount > 0 || inst.totalClassrooms > 0) &&
      inst.emergencyContact
    );
  },

  // ── DISTRICT AUTHORITY ASSIGNMENT & ACTION LOGS ─────────────

  /** Assign an Inspector (e.g. DCP Officer) to an institution */
  assignInspectorToInstitution: (instId, inspectorInfo) => {
    const insts = institutionStore.getInstitutions();
    const updated = insts.map(i => {
      if (i._id !== instId) return i;
      return {
        ...i,
        assignedInspector: inspectorInfo.name || inspectorInfo.dcpZone || 'Assigned Officer',
        assignedInspectorEmail: inspectorInfo.email || '',
        assignedInspectorZone: inspectorInfo.dcpZone || i.zone,
        assignedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        inspectionScheduledStatus: 'INSPECTION_ASSIGNED',
      };
    });
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
    return updated;
  },

  /** District Authority Action / Remarks update on an institution */
  updateDistrictActionRemarks: (instId, actionData) => {
    const insts = institutionStore.getInstitutions();
    let updatedTarget = null;
    const updatedInsts = insts.map(i => {
      if (i._id !== instId) return i;

      const newLog = {
        id: 'act_' + Date.now(),
        actionType: actionData.actionType || 'REMARKS_UPDATE',
        remarks: actionData.remarks || '',
        riskLevel: actionData.riskLevel || i.riskLevel,
        issuedBy: actionData.issuedBy || 'District Authority',
        timestamp: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      };

      const existingLogs = i.districtRemarks || [];
      updatedTarget = {
        ...i,
        riskLevel: actionData.riskLevel || i.riskLevel,
        lastDistrictAction: actionData.actionType || 'NOTICE_ISSUED',
        lastDistrictRemarks: actionData.remarks,
        districtRemarks: [newLog, ...existingLogs],
      };
      return updatedTarget;
    });

    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updatedInsts));
    return updatedTarget;
  },

  // ── DOCUMENTS ────────────────────────────────────────────

  /** Return ALL documents from localStorage */
  getDocuments: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (stored) return JSON.parse(stored);
    } catch {}
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
    return [];
  },

  /** Return documents for a DCP zone */
  getDocumentsForZone: (dcpZone) => {
    const zone = normalizeZone(dcpZone);
    if (!zone) return institutionStore.getDocuments();
    const zoneInstIds = new Set(
      institutionStore.getInstitutionsForZone(dcpZone).map(i => i._id)
    );
    return institutionStore.getDocuments().filter(d => zoneInstIds.has(d.institutionId));
  },

  /** Return only documents for a specific institution ID */
  getDocumentsForInstitution: (instId) => {
    if (!instId) return [];
    return institutionStore.getDocuments().filter(d => d.institutionId === instId);
  },

  /** Upload a document */
  uploadDocument: (docData) => {
    const all = institutionStore.getDocuments();
    const newDoc = {
      _id: 'doc_' + Date.now(),
      name: docData.name,
      type: docData.type,
      institutionId: docData.institutionId,
      institutionName: docData.institutionName,
      status: 'PENDING_REVIEW',
      uploadedAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
      fileSize: docData.fileSize || '1.4 MB',
      uploadedBy: docData.uploadedBy || 'Institution Admin',
      fileDataUrl: docData.fileDataUrl || null,
      fileName: docData.fileName || `${docData.name}.pdf`,
      remarks: 'Awaiting Inspector verification',
    };
    all.unshift(newDoc);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(all));
    return newDoc;
  },

  /** Inspector: approve or reject a document */
  verifyDocument: (docId, status, remarks = '') => {
    const docs = institutionStore.getDocuments();
    const updated = docs.map(d => (d._id === docId ? { ...d, status, remarks } : d));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updated));
    const target = docs.find(d => d._id === docId);
    if (target) institutionStore.recalculateInstitutionStatus(target.institutionId);
    return updated;
  },

  /** Recalculate compliance score and status for an institution */
  recalculateInstitutionStatus: (instId) => {
    const docs = institutionStore.getDocumentsForInstitution(instId);
    const required = ['FIRE_NOC', 'STRUCTURAL_SAFETY', 'ELECTRICAL_SAFETY', 'EMERGENCY_PLAN'];
    const verifiedTypes = docs.filter(d => d.status === 'VERIFIED').map(d => d.type);
    const score = Math.round((verifiedTypes.length / required.length) * 100);
    const allVerified = required.every(t => verifiedTypes.includes(t));

    const insts = institutionStore.getInstitutions();
    const updated = insts.map(i => {
      if (i._id !== instId) return i;
      return {
        ...i,
        complianceScore: score,
        status: allVerified ? 'VERIFIED' : 'PENDING_DOCUMENT_VERIFICATION',
        riskLevel: allVerified ? 'LOW' : score > 50 ? 'MEDIUM' : 'HIGH',
        lastInspectionDate: allVerified
          ? new Date().toLocaleDateString('en-IN')
          : i.lastInspectionDate,
      };
    });
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
  },

  /** Returns true only when Profile complete & 4 docs verified AND not locked by authorities */
  isCertificateUnlocked: (instId) => {
    if (!instId) return false;
    const inst = institutionStore.getInstitutions().find(i => i._id === instId);
    if (!inst) return false;
    // 🚨 If locked by safety authorities with notice, certificate is locked/revoked!
    if (inst.qrLocked) return false;
    if (!institutionStore.isProfileComplete(instId)) return false;

    const docs = institutionStore.getDocumentsForInstitution(instId);
    const required = ['FIRE_NOC', 'STRUCTURAL_SAFETY', 'ELECTRICAL_SAFETY', 'EMERGENCY_PLAN'];
    const verifiedTypes = docs.filter(d => d.status === 'VERIFIED').map(d => d.type);
    return required.every(t => verifiedTypes.includes(t));
  },

  // ── QR LOCK & ENFORCEMENT NOTICE ENGINE ─────────────────────

  /** Lock / Revoke Generated QR Code with formal notice reason */
  lockInstitutionQR: (instId, { reason, issuedBy }) => {
    const insts = institutionStore.getInstitutions();
    let updatedTarget = null;
    const updated = insts.map(i => {
      if (i._id !== instId) return i;
      const timeStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const newNoticeLog = {
        id: 'lock_' + Date.now(),
        actionType: 'QR_LOCKED_WITH_NOTICE',
        remarks: reason,
        issuedBy: issuedBy || 'Safety Inspection Authority',
        timestamp: timeStr,
      };

      updatedTarget = {
        ...i,
        qrLocked: true,
        qrLockNotice: reason,
        qrLockedBy: issuedBy || 'Safety Inspection Authority',
        qrLockedAt: timeStr,
        qrLockStatus: 'LOCKED',
        rectificationSubmitted: false,
        rectificationNotes: '',
        lastDistrictAction: 'QR_LOCKED_WITH_NOTICE',
        lastDistrictRemarks: `QR Locked: ${reason}`,
        districtRemarks: [newNoticeLog, ...(i.districtRemarks || [])],
      };
      return updatedTarget;
    });

    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
    return updatedTarget;
  },

  /** Unlock QR Code after re-inspection verification */
  unlockInstitutionQR: (instId, { notes, issuedBy }) => {
    const insts = institutionStore.getInstitutions();
    let updatedTarget = null;
    const updated = insts.map(i => {
      if (i._id !== instId) return i;
      const timeStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const newUnlockLog = {
        id: 'unlock_' + Date.now(),
        actionType: 'QR_UNLOCKED_REINSPECTED',
        remarks: notes || 'Issues rectified and verified upon physical re-inspection.',
        issuedBy: issuedBy || 'Safety Inspection Authority',
        timestamp: timeStr,
      };

      updatedTarget = {
        ...i,
        qrLocked: false,
        qrLockNotice: null,
        qrLockStatus: 'UNLOCKED',
        rectificationSubmitted: false,
        rectificationNotes: '',
        qrUnlockedAt: timeStr,
        qrUnlockedBy: issuedBy || 'Safety Inspection Authority',
        lastDistrictAction: 'QR_UNLOCKED_REINSPECTED',
        lastDistrictRemarks: `QR Unlocked: ${notes || 'Re-inspection successful'}`,
        districtRemarks: [newUnlockLog, ...(i.districtRemarks || [])],
      };
      return updatedTarget;
    });

    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
    return updatedTarget;
  },

  /** Institution: Submit Rectification / Re-inspection Request */
  submitRectification: (instId, { notes }) => {
    const insts = institutionStore.getInstitutions();
    let updatedTarget = null;
    const updated = insts.map(i => {
      if (i._id !== instId) return i;
      const timeStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const newLog = {
        id: 'rect_' + Date.now(),
        actionType: 'RECTIFICATION_SUBMITTED',
        remarks: notes,
        issuedBy: 'Institution Admin',
        timestamp: timeStr,
      };

      updatedTarget = {
        ...i,
        rectificationSubmitted: true,
        rectificationNotes: notes,
        rectificationSubmittedAt: timeStr,
        qrLockStatus: 'RECTIFICATION_SUBMITTED',
        districtRemarks: [newLog, ...(i.districtRemarks || [])],
      };
      return updatedTarget;
    });

    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
    return updatedTarget;
  },

  /** Clear all local data, institution records, documents & sessions */
  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.INSTITUTIONS);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.DISTRICT_LOGS);
    localStorage.removeItem('registeredSchoolUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('safeed_user');
  },
};
