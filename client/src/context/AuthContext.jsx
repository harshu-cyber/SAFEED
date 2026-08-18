import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/apiServices';
import { institutionStore } from '../api/institutionStore';
import { userStore } from '../api/userStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      // Attempt backend session retrieval (via HttpOnly cookies or Authorization header)
      const res = await authApi.getMe();
      setUser(res.data.data.user);
    } catch {
      // Restore local session
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
    const emailLower = credentials.email?.toLowerCase();

    // ⚡ FAST-PATH: Super Admin credentials — always resolved locally, NEVER via backend
    // This guarantees Super Admin always gets role:SUPER_ADMIN regardless of backend/cloud state
    if (emailLower === 'superadmin@safeed.ac.in' && credentials.password === 'harshsafeed') {
      const saUser = {
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
      localStorage.setItem('accessToken', 'sa_token_' + Date.now());
      setUser(saUser);
      return saUser;
    }

    try {
      const res = await authApi.login(credentials);
      const { user, accessToken } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(user);
      return user;
    } catch (err) {
      console.warn('Backend API unavailable, using client session authentication fallback');

      const emailLower = credentials.email.toLowerCase();

      // ✅ Priority 1: Check userStore for Super Admin-created users (always re-reads fresh from localStorage)
      const storedUser = userStore.getUserByEmail(emailLower);
      if (storedUser) {
        if (!storedUser.isActive) {
          throw new Error('Your account has been deactivated. Access suspended by Super Admin.');
        }

        // Validate password: password field or phone number
        if (credentials.password === storedUser.password || credentials.password === storedUser.phone) {
          const fallbackUser = {
            _id: storedUser._id,
            name: storedUser.name,
            email: storedUser.email,
            // CRITICAL: Always use fresh role/assignedPortal from userStore (never from stale cloud state)
            role: storedUser.role,
            assignedPortal: storedUser.assignedPortal || storedUser.role,
            rankLevel: storedUser.rankLevel || '',
            designation: storedUser.designation,
            badgeNumber: storedUser.badgeNumber,
            department: storedUser.department,
            dcpZone: storedUser.dcpZone || null,
            district: storedUser.district,
            state: storedUser.state,
          };
          localStorage.setItem('accessToken', 'demo_token_' + Date.now());
          setUser(fallbackUser);
          return fallbackUser;
        } else {
          throw new Error('Invalid email or password.');
        }
      }

      // Check if this matches a registered institution in institutionStore
      const inst = institutionStore.getInstitutionByIdOrEmail(emailLower);

      let fallbackUser;

      if (inst) {
        fallbackUser = {
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
      } else {
        // 🌐 Dynamic Smart Cross-Device Officer Fallback
        // Derive user role from email keywords or rank format
        let detectedRole = 'INSPECTION_OFFICER';
        let assignedPortal = 'INSPECTION_OFFICER';
        let rankLevel = 'SI';
        let dcpZone = 'DCP Central';

        if (emailLower.includes('super')) {
          detectedRole = 'SUPER_ADMIN';
          assignedPortal = 'SUPER_ADMIN';
          rankLevel = 'SUPER_ADMIN';
        } else if (emailLower.includes('dgp') || emailLower.includes('cp') || emailLower.includes('jcp') || emailLower.includes('commissioner')) {
          detectedRole = 'DISTRICT_ADMIN';
          assignedPortal = 'DISTRICT_ADMIN';
          rankLevel = emailLower.includes('dgp') ? 'DGP' : emailLower.includes('jcp') ? 'JCP' : 'CP';
          dcpZone = null;
        } else if (emailLower.includes('dcp') || emailLower.includes('adcp') || emailLower.includes('acp')) {
          detectedRole = 'DISTRICT_ADMIN';
          assignedPortal = 'DISTRICT_ADMIN';
          rankLevel = emailLower.includes('adcp') ? 'ADCP' : emailLower.includes('acp') ? 'ACP' : 'DCP';
          if (emailLower.includes('west')) dcpZone = 'DCP West';
          else if (emailLower.includes('north')) dcpZone = 'DCP North';
          else if (emailLower.includes('east')) dcpZone = 'DCP East';
          else if (emailLower.includes('south')) dcpZone = 'DCP South';
          else dcpZone = 'DCP Central';
        } else if (emailLower.includes('sho') || emailLower.includes('si') || emailLower.includes('ps') || emailLower.includes('inspector') || emailLower.includes('police')) {
          detectedRole = 'INSPECTION_OFFICER';
          assignedPortal = 'INSPECTION_OFFICER';
          rankLevel = emailLower.includes('sho') ? 'SHO' : emailLower.includes('ps') ? 'PS' : 'SI';
        } else if (emailLower.includes('district') || emailLower.includes('admin')) {
          detectedRole = 'DISTRICT_ADMIN';
          assignedPortal = 'DISTRICT_ADMIN';
          rankLevel = 'CP';
          dcpZone = null;
        }

        // Create fallback user dynamically on this device so future logins work
        const nameFromEmail = emailLower.split('@')[0].toUpperCase().replace('.', ' ');
        fallbackUser = {
          _id: 'u-dyn-' + Date.now(),
          name: nameFromEmail || 'Official Officer',
          email: credentials.email,
          role: detectedRole,
          assignedPortal,
          rankLevel,
          dcpZone,
          designation: `${rankLevel} Officer`,
          district: 'Lucknow',
          state: 'Uttar Pradesh',
        };

        try {
          userStore.createUser({
            name: fallbackUser.name,
            email: credentials.email,
            phone: credentials.password || '9412000000',
            role: detectedRole,
            assignedPortal,
            rankLevel,
            dcpZone,
            district: 'Lucknow',
          }, 'System Fallback');
        } catch (_) {
          // ignore duplicate in local store
        }
      }

      const token = 'demo_token_' + Date.now();
      localStorage.setItem('accessToken', token);
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (_) {
      // ignore
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('registeredSchoolUser');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
