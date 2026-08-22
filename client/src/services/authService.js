// ============================================================
// SAFEED-UP — Supabase Authentication Service
// Single Source of Truth for User Auth and Profiles
// ============================================================
import { supabase } from '../lib/supabaseClient';

export const authService = {
  /**
   * Log in user with email & password via Supabase Auth
   */
  login: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Supabase authentication failed.');
    }

    // Retrieve profile linked to user ID
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*, institutions(*)')
      .eq('id', data.user.id)
      .single();

    if (profileErr && profileErr.code !== 'PGRST116') {
      console.warn('[authService] Profile fetch warning:', profileErr.message);
    }

    const mergedUser = {
      ...data.user,
      ...profile,
      role: profile?.role || data.user.user_metadata?.role || 'INSTITUTION_ADMIN',
      institutionId: profile?.institution_id || profile?.institutions?.id,
      institution: profile?.institutions,
    };

    return { user: mergedUser, session: data.session };
  },

  /**
   * Register institution & create auth user + linked profile + institution record
   */
  registerInstitution: async (formData) => {
    const email = formData.email || formData.adminEmail;
    const password = formData.password;
    const institutionName = formData.name || formData.institutionName;
    const district = formData.district || 'Lucknow';
    const zone = formData.zone || 'CENTRAL';

    // 1. Sign up user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: formData.principalName || formData.contactPerson || institutionName,
          role: 'INSTITUTION_ADMIN',
        },
      },
    });

    if (authError) {
      throw new Error(authError.message || 'Failed to create user account in Supabase Auth.');
    }

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error('User creation returned no valid auth user ID.');
    }

    // 2. Generate Safe ID
    const safeId = `UP-${district.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Insert Institution Row
    const { data: instData, error: instErr } = await supabase
      .from('institutions')
      .insert([
        {
          name: institutionName,
          registration_number: formData.registrationNumber || formData.affiliationCode || `REG-${Date.now()}`,
          institution_type: formData.institutionType || 'SCHOOL',
          principal_name: formData.principalName || 'Principal Officer',
          phone: formData.phone || formData.contactPhone || 'N/A',
          email,
          address: formData.address || `${district}, Uttar Pradesh`,
          district,
          city: formData.city || district,
          state: 'Uttar Pradesh',
          zone,
          safe_id: safeId,
          verification_status: 'PENDING',
          compliance_score: 0,
          qr_locked: true,
        },
      ])
      .select()
      .single();

    if (instErr) {
      throw new Error(instErr.message || 'Failed to insert institution record in Supabase PostgreSQL.');
    }

    // 4. Insert or Update Profile Row linked to auth user and institution
    const { error: profileErr } = await supabase.from('profiles').upsert([
      {
        id: userId,
        full_name: formData.principalName || institutionName,
        email,
        role: 'INSTITUTION_ADMIN',
        institution_id: instData.id,
        district,
        zone,
        is_active: true,
      },
    ]);

    if (profileErr) {
      console.warn('[authService] Profile linking warning:', profileErr.message);
    }

    return { user: authData.user, institution: instData };
  },

  /**
   * Log out authenticated user
   */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[authService] Logout error:', error.message);
    }
  },

  /**
   * Fetch current active session & profile
   */
  getCurrentUser: async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return null;
    }

    const authUser = sessionData.session.user;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, institutions(*)')
      .eq('id', authUser.id)
      .single();

    return {
      ...authUser,
      ...profile,
      role: profile?.role || authUser.user_metadata?.role || 'INSTITUTION_ADMIN',
      institutionId: profile?.institution_id || profile?.institutions?.id,
      institution: profile?.institutions,
    };
  },
};

export default authService;
