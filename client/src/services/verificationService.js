// ============================================================
// SAFEED-UP — Supabase Public Verification Service
// Single Source of Truth for Public Safe ID Verification & Stats
// ============================================================
import { supabase } from '../lib/supabaseClient';

export const verificationService = {
  /**
   * Fetch public verification report for Safe ID
   */
  verifySafeId: async (safeId) => {
    if (!safeId) throw new Error('Safe ID parameter is required for verification.');

    const { data, error } = await supabase
      .from('institutions')
      .select('*, documents(*)')
      .eq('safe_id', safeId)
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Verification failed. Safe ID ${safeId} not found in official state records.`);
    }

    const approvedDocs = (data.documents || []).filter((d) => d.status === 'APPROVED');
    const isUnlocked = approvedDocs.length >= 4 && !data.qr_locked;

    return {
      institution: data,
      verificationStatus: isUnlocked ? 'VERIFIED' : 'PENDING_OR_REVOKED',
      complianceScore: isUnlocked ? 100 : approvedDocs.length * 25,
      approvedDocumentsCount: approvedDocs.length,
      documents: data.documents || [],
    };
  },

  /**
   * Fetch aggregate state safety statistics
   */
  getPublicStats: async () => {
    const { data: insts, error } = await supabase
      .from('institutions')
      .select('id, verification_status, qr_locked');

    if (error) {
      console.warn('[verificationService] Stats fetch warning:', error.message);
      return { totalInstitutions: 0, verifiedCount: 0, complianceRate: 0 };
    }

    const total = insts?.length || 0;
    const verified = insts?.filter((i) => !i.qr_locked && i.verification_status === 'VERIFIED').length || 0;
    const rate = total > 0 ? Math.round((verified / total) * 100) : 0;

    return {
      totalInstitutions: total,
      verifiedCount: verified,
      complianceRate: rate,
    };
  },
};

export default verificationService;
