// ============================================================
// SAFEED-UP — Supabase Complaint Service
// Single Source of Truth for Citizen Safety Complaints & Directives
// ============================================================
import { supabase } from '../lib/supabaseClient';

export const complaintService = {
  /**
   * Submit a new public citizen complaint
   */
  submitComplaint: async (formData) => {
    const ticketId = `UP-CMP-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
      .from('complaints')
      .insert([
        {
          complaint_ticket: ticketId,
          complainant_name: formData.complainantName,
          complainant_phone: formData.complainantPhone,
          district: formData.district || 'Lucknow',
          zone: formData.zone || 'CENTRAL',
          institution_name: formData.institutionName,
          institution_id: formData.institutionId || null,
          category: formData.category,
          description: formData.description,
          status: 'PENDING_DISTRICT_ACTION',
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to submit complaint to Supabase.');
    }

    return {
      ...data,
      complaintTicket: data.complaint_ticket,
      complainantName: data.complainant_name,
      complainantPhone: data.complainant_phone,
      institutionName: data.institution_name,
      submittedAt: new Date(data.created_at).toLocaleDateString('en-IN'),
    };
  },

  /**
   * Fetch all complaints (filtered by district/zone/inspector)
   */
  getComplaints: async (filters = {}) => {
    let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });

    if (filters.district) {
      query = query.eq('district', filters.district);
    }
    if (filters.zone && filters.zone !== 'ALL') {
      query = query.eq('zone', filters.zone);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[complaintService] Fetch warning:', error.message);
      return [];
    }

    return (data || []).map((c) => ({
      _id: c.id,
      id: c.id,
      complaintTicket: c.complaint_ticket,
      complainantName: c.complainant_name,
      complainantPhone: c.complainant_phone,
      district: c.district,
      zone: c.zone,
      institutionName: c.institution_name,
      institutionId: c.institution_id,
      category: c.category,
      description: c.description,
      status: c.status,
      assignedInspector: c.assigned_inspector,
      districtDirectives: c.district_directives,
      submittedAt: new Date(c.created_at).toLocaleDateString('en-IN'),
    }));
  },

  /**
   * Assign inspector to complaint & add directives
   */
  assignInspector: async (complaintId, inspectorName, directives) => {
    const { data, error } = await supabase
      .from('complaints')
      .update({
        assigned_inspector: inspectorName,
        district_directives: directives,
        status: 'INVESTIGATION_ASSIGNED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', complaintId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to update complaint assignment.');
    }

    return data;
  },
};

export default complaintService;
