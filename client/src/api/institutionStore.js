// ============================================================
// SafeED-UP — Real-Time Client Institution & Document Store
// Zone-Based DCP Filtering | District Authority Support | 100% Real-Time
// ============================================================

import { cloudSync } from './cloudSync';

const STORAGE_KEYS = {
  INSTITUTIONS: 'safeed_institutions_store_v6',
  DOCUMENTS: 'safeed_documents_store_v2',
  DISTRICT_LOGS: 'safeed_district_action_logs_v1',
};

// Auto-purge all legacy demo institution stores
(function purgeLegacyInstitutions() {
  try {
    if (!localStorage.getItem('safeed_institutions_purged_v6')) {
      ['safeed_institutions_store_v1', 'safeed_institutions_store_v2', 'safeed_institutions_store_v3', 'safeed_institutions_store_v4', 'safeed_institutions_store_v5', 'safeed_institutions_store_v6'].forEach(k => localStorage.removeItem(k));
      localStorage.setItem('safeed_institutions_purged_v6', 'true');
    }
  } catch {}
})();

// Normalize any zone string → one of: WEST | CENTRAL | NORTH | EAST | SOUTH | null
const normalizeZone = (val = '') => {
  const v = String(val || '').toLowerCase();
  if (v.includes('west'))    return 'WEST';
  if (v.includes('north'))   return 'NORTH';
  if (v.includes('east'))    return 'EAST';
  if (v.includes('south'))   return 'SOUTH';
  if (v.includes('central')) return 'CENTRAL';
  return 'CENTRAL';
};

export { normalizeZone };

export const normalizeInstitution = (inst) => {
  if (!inst || typeof inst !== 'object') return inst;
  const districtStr = inst.district || 'Lucknow';
  const rawAddr = inst.address;
  let formattedAddr = '';
  if (typeof rawAddr === 'string') {
    formattedAddr = rawAddr;
  } else if (rawAddr && typeof rawAddr === 'object') {
    formattedAddr = rawAddr.street || rawAddr.district || `${districtStr}, Uttar Pradesh`;
  } else {
    formattedAddr = `${districtStr}, Uttar Pradesh`;
  }

  const cp = inst.contactPerson;
  const principalStr = inst.principal || (typeof cp === 'object' ? cp?.name : '') || 'Principal';
  const contactStr = inst.contact || (typeof cp === 'object' ? cp?.phone : '') || inst.phone || '';
  const emailStr = inst.email || (typeof cp === 'object' ? cp?.email : '') || '';
  const zoneKey = normalizeZone(inst.zone || inst.assignedInspectorZone) || 'CENTRAL';

  const cpObj = (cp && typeof cp === 'object') ? cp : {
    name: principalStr,
    email: emailStr,
    phone: contactStr
  };

  const addrObj = (rawAddr && typeof rawAddr === 'object') ? rawAddr : {
    street: typeof rawAddr === 'string' && rawAddr ? rawAddr : `${districtStr} Main Road`,
    district: districtStr,
    state: inst.state || 'Uttar Pradesh'
  };

  return {
    ...inst,
    _id: inst._id || inst.id || ('inst_' + Date.now()),
    safeId: inst.safeId || `SAFE-UP-${districtStr.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
    name: inst.name || inst.institutionName || 'Institution',
    type: inst.type || inst.institutionType || 'SCHOOL',
    district: districtStr,
    state: inst.state || 'Uttar Pradesh',
    zone: zoneKey,
    address: formattedAddr,
    addressObj: addrObj,
    contactPerson: cpObj,
    principal: principalStr,
    contact: contactStr,
    email: emailStr,
    assignedInspector: inst.assignedInspector || `DCP ${zoneKey}`,
    assignedInspectorZone: inst.assignedInspectorZone || zoneKey,
    assignedInspectorEmail: inst.assignedInspectorEmail || `dcp${zoneKey.toLowerCase()}@safeedup.gov.in`,
    status: inst.status || 'PENDING',
    verificationStatus: inst.verificationStatus || 'UNVERIFIED',
    riskLevel: inst.riskLevel || 'UNDER_REVIEW',
    complianceScore: typeof inst.complianceScore === 'number' ? inst.complianceScore : 0,
    totalStudents: parseInt(inst.totalStudents || 0) || 100,
    staffCount: parseInt(inst.staffCount || inst.totalTeachers || 0) || 10,
    classroomCount: parseInt(inst.classroomCount || inst.totalClassrooms || 0) || 5,
    floorCount: parseInt(inst.floorCount || inst.buildingFloors || 1) || 1,
    exitGateCount: parseInt(inst.exitGateCount || 2) || 2,
    nearestPoliceStation: inst.nearestPoliceStation || `${districtStr} Police Station`,
    documents: Array.isArray(inst.documents) ? inst.documents : [],
    isActive: true,
    isPubliclyVisible: true,
  };
};

const DEFAULT_INSTITUTIONS = [];

export const institutionStore = {

  // ── INSTITUTIONS ─────────────────────────────────────────

  syncCloudInstitutions: (cloudInsts) => {
    if (!Array.isArray(cloudInsts)) return;
    const normalized = cloudInsts.map(normalizeInstitution);
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(normalized));
  },

  /** Return ALL institutions from localStorage (with auto-assigned zone inspectors) */
  getInstitutions: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INSTITUTIONS);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          return list.map(normalizeInstitution);
        }
      }
    } catch {}
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(DEFAULT_INSTITUTIONS));
    return DEFAULT_INSTITUTIONS;
  },

  /**
   * Return institutions whose zone matches the DCP zone string and/or police station.
   * Pass the user's dcpZone value (e.g. "DCP West" or "WEST") and optional postingStation.
   * If zone cannot be resolved and no station is provided, returns ALL (super-admin / district admin).
   */
  getInstitutionsForZone: (dcpZone, postingStation) => {
    const zone = normalizeZone(dcpZone);
    const stationLow = postingStation ? String(postingStation).toLowerCase().trim() : '';
    const all = institutionStore.getInstitutions();

    if (!zone && !stationLow) return all;

    return all.filter(i => {
      const instZone = normalizeZone(i.zone);
      const instStation = (i.nearestPoliceStation || i.postingStation || '').toLowerCase();

      const matchZone = zone ? instZone === zone : false;
      const matchStation = stationLow ? instStation.includes(stationLow) : false;

      if (zone && stationLow) {
        return matchZone || matchStation;
      }
      return zone ? matchZone : matchStation;
    });
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
    const emailLow = (data.email || '').toLowerCase().trim();
    const instName = (data.institutionName || data.name || 'Institution').trim();

    const districtStr = data.district || 'Lucknow';
    const districtCode = districtStr.slice(0, 3).toUpperCase();
    const safeId = data.safeId || `SAFE-UP-${districtCode}-${Math.floor(100000 + Math.random() * 900000)}`;
    const zoneKey = normalizeZone(data.zone) || 'CENTRAL';

    const newInst = {
      _id: 'inst_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      safeId,
      name: instName,
      type: (data.institutionType || data.type || 'SCHOOL').toUpperCase(),
      district: districtStr,
      state: data.state || 'Uttar Pradesh',
      zone: zoneKey,
      totalStudents: parseInt(data.totalStudents || 0) || 0,
      staffCount: parseInt(data.staffCount || data.totalTeachers || 0) || 0,
      classroomCount: parseInt(data.classroomCount || data.totalClassrooms || 0) || 0,
      floorCount: parseInt(data.floorCount || data.buildingFloors || 1) || 1,
      exitGateCount: parseInt(data.exitGateCount || 2) || 2,
      nearestPoliceStation: data.nearestPoliceStation || `${districtStr} Police Station`,
      lastInspectionDate: null,
      complianceScore: 0,
      status: 'PENDING_DOCUMENT_VERIFICATION',
      riskLevel: 'UNDER_REVIEW',
      address: data.address || `${districtStr}, Uttar Pradesh`,
      contact: data.phone || data.contact || '',
      principal: data.principalName || data.principal || 'Principal',
      email: emailLow,
      affiliationBoard: data.board || data.affiliationBoard || 'CBSE',
      affiliationCode: data.affiliationCode || '',
      assignedInspector: `DCP ${zoneKey}`,
      assignedInspectorEmail: `dcp${zoneKey.toLowerCase()}@safeedup.gov.in`,
      assignedInspectorZone: zoneKey,
      assignedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      districtRemarks: [],
      createdAt: new Date().toISOString(),
    };

    const existingIndex = emailLow ? all.findIndex(i => i.email?.toLowerCase() === emailLow) : -1;
    if (existingIndex >= 0) {
      all[existingIndex] = { ...all[existingIndex], ...newInst, _id: all[existingIndex]._id };
    } else {
      all.unshift(newInst);
    }
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(all));
    return newInst;
  },

  /** Update institution profile fields and mark profile as completed */
  updateInstitutionProfile: (instId, profileData) => {
    const insts = institutionStore.getInstitutions();
    let updatedTarget = null;
    const updated = insts.map(i => {
      if (i._id !== instId && i.id !== instId) return i;
      updatedTarget = {
        ...i,
        ...profileData,
        staffCount: parseInt(profileData.staffCount || profileData.totalTeachers || i.staffCount || 0),
        classroomCount: parseInt(profileData.classroomCount || profileData.totalClassrooms || i.classroomCount || 0),
        floorCount: parseInt(profileData.floorCount || profileData.buildingFloors || i.floorCount || 1),
        exitGateCount: parseInt(profileData.exitGateCount || i.exitGateCount || 2),
        nearestPoliceStation: profileData.nearestPoliceStation || i.nearestPoliceStation || `${i.district || 'Hazratganj'} Police Station`,
      };
      return updatedTarget;
    });
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
    if (updatedTarget) {
      cloudSync.syncAction('UPDATE_INSTITUTION', updatedTarget).catch(err => console.warn('[updateInstProfile] sync failed:', err));
    }
    return updatedTarget;
  },

  /** Permanently delete an institution from local cache & MongoDB Atlas */
  deleteInstitution: (instId) => {
    const insts = institutionStore.getInstitutions();
    const target = insts.find(i => i._id === instId || i.id === instId);
    const updated = insts.filter(i => i._id !== instId && i.id !== instId);
    localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(updated));
    if (target) {
      cloudSync.syncAction('DELETE_INSTITUTION', { _id: target._id || target.id, name: target.name }).catch(err => console.warn('[deleteInst] sync failed:', err));
    }
    return updated;
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

  /** Return documents for a DCP zone or Police Station */
  getDocumentsForZone: (dcpZone, postingStation) => {
    const zoneInsts = institutionStore.getInstitutionsForZone(dcpZone, postingStation);
    const zoneInstIds = new Set(zoneInsts.map(i => i._id));
    return institutionStore.getDocuments().filter(d => zoneInstIds.has(d.institutionId));
  },

  /** Return only documents for a specific institution (checking both inst.documents and global store) */
  getDocumentsForInstitution: (instId) => {
    if (!instId) return [];
    const allInsts = institutionStore.getInstitutions();
    const idLow = String(instId).toLowerCase();
    const inst = allInsts.find(
      i => i._id === instId || i.id === instId || i.email?.toLowerCase() === idLow || i.safeId === instId
    );

    const instDocs = (inst && Array.isArray(inst.documents)) ? inst.documents : [];
    const globalDocs = institutionStore.getDocuments().filter(
      d => d.institutionId === instId || (inst && (d.institutionId === inst._id || d.institutionId === inst.id || d.institutionId?.toLowerCase() === idLow || d.institutionId === inst.safeId))
    );

    const mergedMap = new Map();
    [...instDocs, ...globalDocs].forEach(d => {
      if (d && (d.type || d.name)) {
        const key = d.type || d.name;
        mergedMap.set(key, d);
      }
    });
    return Array.from(mergedMap.values());
  },

  /** Upload a document & sync to institution object + MongoDB Atlas */
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

    // Update matching institution object's documents array & trigger CloudSync
    const insts = institutionStore.getInstitutions();
    const idLow = String(docData.institutionId).toLowerCase();
    const targetInst = insts.find(
      i => i._id === docData.institutionId || i.id === docData.institutionId || i.email?.toLowerCase() === idLow || i.safeId === docData.institutionId
    );

    if (targetInst) {
      const currentDocs = Array.isArray(targetInst.documents) ? [...targetInst.documents] : [];
      const existingIdx = currentDocs.findIndex(d => d.type === newDoc.type);
      if (existingIdx >= 0) {
        currentDocs[existingIdx] = { ...currentDocs[existingIdx], ...newDoc };
      } else {
        currentDocs.unshift(newDoc);
      }
      targetInst.documents = currentDocs;
      localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(insts));

      cloudSync.syncAction('UPLOAD_DOCUMENT', {
        institutionId: targetInst._id,
        email: targetInst.email,
        safeId: targetInst.safeId,
        document: newDoc,
      }).catch(err => console.warn('[uploadDocument] cloud sync failed:', err));
    }

    return newDoc;
  },

  /** Inspector: approve or reject a document & sync to MongoDB Atlas */
  verifyDocument: (docId, status, remarks = '') => {
    const docs = institutionStore.getDocuments();
    const updated = docs.map(d => (d._id === docId ? { ...d, status, remarks } : d));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updated));
    const target = docs.find(d => d._id === docId);

    if (target) {
      const insts = institutionStore.getInstitutions();
      const idLow = String(target.institutionId).toLowerCase();
      const targetInst = insts.find(
        i => i._id === target.institutionId || i.id === target.institutionId || i.email?.toLowerCase() === idLow || i.safeId === target.institutionId
      );

      if (targetInst && Array.isArray(targetInst.documents)) {
        targetInst.documents = targetInst.documents.map(
          d => (d._id === docId || d.type === target.type) ? { ...d, status, remarks } : d
        );
        localStorage.setItem(STORAGE_KEYS.INSTITUTIONS, JSON.stringify(insts));

        cloudSync.syncAction('VERIFY_DOCUMENT', {
          institutionId: targetInst._id,
          email: targetInst.email,
          safeId: targetInst.safeId,
          docId,
          docType: target.type,
          status,
          remarks,
        }).catch(err => console.warn('[verifyDocument] cloud sync failed:', err));
      }
      institutionStore.recalculateInstitutionStatus(target.institutionId);
    }
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
    if (updatedTarget) {
      cloudSync.syncAction('TOGGLE_QR_LOCK', updatedTarget).catch(err => console.warn('[lockQR] sync failed:', err));
    }
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
    if (updatedTarget) {
      cloudSync.syncAction('TOGGLE_QR_LOCK', updatedTarget).catch(err => console.warn('[unlockQR] sync failed:', err));
    }
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
