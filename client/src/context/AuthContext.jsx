// ============================================================
// SAFEED-UP — Supabase Auth Context Provider
// Single Source of Truth for Session State & User Profiles
// ============================================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndSetUser = async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, institutions(*)')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[AuthContext] Profile fetch warning:', error.message);
      }

      const mergedUser = {
        ...sessionUser,
        ...profile,
        _id: profile?.id || sessionUser.id,
        id: profile?.id || sessionUser.id,
        name: profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0],
        email: sessionUser.email,
        role: profile?.role || sessionUser.user_metadata?.role || 'INSTITUTION_ADMIN',
        institutionId: profile?.institution_id || profile?.institutions?.id,
        institution: profile?.institutions,
        district: profile?.district || profile?.institutions?.district || 'Lucknow',
        zone: profile?.zone || profile?.institutions?.zone || 'CENTRAL',
      };

      setUser(mergedUser);
      return mergedUser;
    } catch (err) {
      console.error('[AuthContext] Error fetching profile:', err);
      // Even if profile query fails, preserve session user without logging out
      const fallbackUser = {
        ...sessionUser,
        _id: sessionUser.id,
        id: sessionUser.id,
        name: sessionUser.email?.split('@')[0],
        role: sessionUser.user_metadata?.role || 'INSTITUTION_ADMIN',
      };
      setUser(fallbackUser);
      return fallbackUser;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfileAndSetUser(session.user);
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth state changes
    const { data: authSubscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfileAndSetUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authSubscription?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (emailOrCredentials, maybePassword) => {
    let email = emailOrCredentials;
    let password = maybePassword;

    if (typeof emailOrCredentials === 'object' && emailOrCredentials !== null) {
      email = emailOrCredentials.email || emailOrCredentials.username;
      password = emailOrCredentials.password;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: (email || '').trim(),
        password: password || '',
      });

      if (error) {
        throw new Error(error.message || 'Supabase authentication failed.');
      }

      const fullUser = await fetchProfileAndSetUser(data.user);
      return fullUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] Logout warning:', err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const refetchUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchProfileAndSetUser(session.user);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
