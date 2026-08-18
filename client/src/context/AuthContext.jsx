import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/apiServices';
import { institutionStore } from '../api/institutionStore';
import { userStore } from '../api/userStore';

const AuthContext = createContext(null);

// Hardcoded Super Admin credentials — never overridden by backend or cloud
const SUPER_ADMIN = {
  _id: 'u-super-1',
  name: 'Super Admin (SafeED)',
  email: 'superadmin@safeed.ac.in',
  role: 'SUPER_ADMIN',
  assignedPortal: 'SUPER_ADMIN',
  designation: 'System Administrator',
  badgeNumber: 'SA-001',
  rankLevel: 'SUPER_ADMIN',
  department: 'SafeED-UP HQ',
  district: 'Lucknow',
  state: 'Uttar Pradesh',
  isActive: true,
};

/** Fetch cloud users from /api/sync and merge into local store */
async function pullCloudUsersIntoStore() {
  try {
    const res = await fetch('/api/sync', { method: 'GET' });
    if (!res.ok) return;
    const json = await res.json();
    if (json.success && Array.isArray(json.data?.users)) {
      userStore.syncCloudUsers(json.data.users);
    }
  } catch (_) {
    // Offline — use local store as fallback
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // Attempt backend session retrieval
      const res = await authApi.getMe();
      setUser(res.data.data.user);
    } catch {
      // Restore institution user from local session
      const savedSchoolStr = localStorage.getItem('registeredSchoolUser');
      if (savedSchoolStr) {
        try {
          const parsed = JSON.parse(savedSchoolStr);
          const inst = institutionStore.getInstitutionByIdOrEmail(parsed.institutionId || parsed.username);
          if (inst) {
            setUser({
              _id: inst._id,
              id: inst._id,
              name: inst.name,
              email: inst.email,
              role: 'SCHOOL_ADMIN',
              institutionId: inst._id,
              district: inst.district,
              state: inst.state,
            });
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials) => {
    const emailLower = credentials.email?.toLowerCase()?.trim();

    // ──────────────────────────────────────────────────────────────
    // ⚡ FAST-PATH 1: Super Admin — always local, never touches backend or cloud
    // ──────────────────────────────────────────────────────────────
    if (emailLower === 'superadmin@safeed.ac.in') {
      if (credentials.password !== 'harshsafeed') {
        throw new Error('Invalid email or password.');
      }
      localStorage.setItem('accessToken', 'sa_' + Date.now());
      setUser(SUPER_ADMIN);
      return SUPER_ADMIN;
    }

    // ──────────────────────────────────────────────────────────────
    // ⚡ FAST-PATH 2: Check local store first (fast, works offline)
    // ──────────────────────────────────────────────────────────────
    let storedUser = userStore.getUserByEmail(emailLower);

    // If not found locally, pull from cloud and try again
    if (!storedUser) {
      await pullCloudUsersIntoStore();
      storedUser = userStore.getUserByEmail(emailLower);
    }

    if (storedUser) {
      if (!storedUser.isActive) {
        throw new Error('Your account has been deactivated. Contact Super Admin.');
      }
      if (credentials.password !== storedUser.password && credentials.password !== storedUser.phone) {
        throw new Error('Invalid email or password.');
      }
      const sessionUser = {
        _id: storedUser._id,
        name: storedUser.name,
        email: storedUser.email,
        role: storedUser.role,
        assignedPortal: storedUser.assignedPortal || storedUser.role,
        rankLevel: storedUser.rankLevel || '',
        designation: storedUser.designation || '',
        badgeNumber: storedUser.badgeNumber || '',
        department: storedUser.department || 'UP Police',
        dcpZone: storedUser.dcpZone || null,
        district: storedUser.district || 'Lucknow',
        state: storedUser.state || 'Uttar Pradesh',
        isActive: storedUser.isActive,
      };
      localStorage.setItem('accessToken', 'officer_' + Date.now());
      setUser(sessionUser);
      return sessionUser;
    }

    // ──────────────────────────────────────────────────────────────
    // FALLBACK: Try backend API (institution accounts etc.)
    // ──────────────────────────────────────────────────────────────
    try {
      const res = await authApi.login(credentials);
      const { user: apiUser, accessToken } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(apiUser);
      return apiUser;
    } catch {
      // Institution account check
      const inst = institutionStore.getInstitutionByIdOrEmail(emailLower);
      if (inst) {
        const instUser = {
          _id: inst._id,
          id: inst._id,
          name: inst.name,
          email: inst.email,
          role: inst.type === 'COACHING' ? 'COACHING_ADMIN' : 'SCHOOL_ADMIN',
          institutionId: inst._id,
          district: inst.district,
          state: inst.state,
        };
        localStorage.setItem('registeredSchoolUser', JSON.stringify({
          username: inst.email,
          institutionId: inst._id,
          institutionName: inst.name,
        }));
        localStorage.setItem('accessToken', 'inst_' + Date.now());
        setUser(instUser);
        return instUser;
      }
      throw new Error('No account found with this email. Please contact Super Admin to create your account.');
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('registeredSchoolUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
