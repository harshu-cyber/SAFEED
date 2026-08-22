// ============================================================
// SAFEED-UP — Institution Store Facade (Supabase Powered)
// Delegates all institution queries directly to Supabase services
// ============================================================
import { institutionService } from '../services/institutionService';

export const normalizeZone = (zone) => {
  if (!zone) return 'CENTRAL';
  const u = zone.toUpperCase();
  if (u.includes('WEST')) return 'WEST';
  if (u.includes('NORTH')) return 'NORTH';
  if (u.includes('EAST')) return 'EAST';
  if (u.includes('SOUTH')) return 'SOUTH';
  return 'CENTRAL';
};

export const institutionStore = {
  getAll: async () => {
    return await institutionService.getAll();
  },
  getInstitutions: async () => {
    return await institutionService.getAll();
  },
  getById: async (id) => {
    return await institutionService.getById(id);
  },
  getByZone: async (zone) => {
    return await institutionService.getByZone(zone);
  },
  lockInstitutionQR: async (id, data) => {
    return await institutionService.lockQR(id, data.reason, data.issuedBy);
  },
  unlockInstitutionQR: async (id, data) => {
    return await institutionService.unlockQR(id, data.notes, data.issuedBy);
  },
  assignInspector: async (instId, inspectorId) => {
    return await institutionService.assignInspector(instId, inspectorId);
  },
  isCertificateUnlocked: (inst) => {
    if (!inst) return false;
    return !inst.qr_locked && inst.verification_status === 'VERIFIED';
  },
  getDocumentsForInstitution: () => {
    return [];
  },
  getDocumentsForZone: () => {
    return [];
  },
  getInstitutionByIdOrEmail: () => {
    return null;
  }
};
