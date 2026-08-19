import { cloudSync } from './cloudSync';

// ============================================================
// SafeED-UP — Inspection Evidence Store
// 100% FRESH REAL-TIME DATA (Starts Empty)
// ============================================================

const STORAGE_KEY = 'safeed_evidence_store_v2';

export const evidenceStore = {
  getEvidenceList: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    return [];
  },

  getEvidenceForInstitution: (instId) => {
    const list = evidenceStore.getEvidenceList();
    return list.filter(e => e.institutionId === instId);
  },

  submitInspectionEvidence: (data) => {
    const list = evidenceStore.getEvidenceList();
    const newRecord = {
      _id: 'ev_' + Date.now(),
      inspectionId: data.inspectionId || `INS-UP-${Math.floor(1000 + Math.random() * 9000)}`,
      institutionId: data.institutionId,
      institutionName: data.institutionName,
      inspectorName: data.inspectorName || 'DCP Inspection Officer',
      dcpZone: data.dcpZone || 'DCP Central',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      score: data.score || 90,
      status: 'SUBMITTED_FOR_HIGHER_AUDIT',
      photos: data.photos || [],
      remarks: data.remarks || 'Site inspection completed. Evidence photos submitted.',
    };

    list.unshift(newRecord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    cloudSync.syncAction('SUBMIT_EVIDENCE', newRecord).catch(err => console.warn('[submitEvidence] cloud sync error:', err));
    return newRecord;
  }
};
