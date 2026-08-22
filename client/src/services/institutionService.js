// ============================================================
// SAFEED-UP — Supabase Institution Service
// Single Source of Truth for Institution Data & QR Status
// ============================================================
import { supabase } from '../lib/supabaseClient';

export const institutionService = {
  /**
   * Get list of all institutions with status
   */
  list: async (filters = {}) => {
    let query = supabase.from('institutions').select('*').order('created_at', { ascending: false });

    if (filters.district) {
      query = query.eq('district', filters.district);
    }
    if (filters.zone) {
      query = query.eq('zone', filters.zone);
    }
    if (filters.status) {
      query = query.eq('verification_status', filters.status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[institutionService] List error:', error.message);
      throw error;
    }
    return data || [];
  },

  /**
   * Get institution by ID or Safe ID
   */
  getById: async (id) => {
    if (!id) return null;
    const { data, error } = await supabase
      .from('institutions')
      .select('*, documents(*)')
      .or(`id.eq.${id},safe_id.eq.${id}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[institutionService] Fetch error:', error.message);
    }
    return data;
  },

  /**
   * Get public verification status by Safe ID
   */
  getBySafeId: async (safeId) => {
    const { data, error } = await supabase
      .from('institutions')
      .select('*, documents(*)')
      .eq('safe_id', safeId)
      .single();

    if (error) {
      throw new Error(`Institution with Safe ID ${safeId} not found.`);
    }
    return data;
  },

  /**
   * Lock or unlock institution QR code with notice reason
   */
  setQrLockStatus: async (institutionId, locked, notice = '') => {
    const { data, error } = await supabase
      .from('institutions')
      .update({
        qr_locked: locked,
        verification_status: locked ? 'REVOKED' : 'VERIFIED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', institutionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update QR lock status: ${error.message}`);
    }
    return data;
  },
};

export default institutionService;
