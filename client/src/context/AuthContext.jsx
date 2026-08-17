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
    try {
      const res = await authApi.login(credentials);
      const { user, accessToken } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(user);
      return user;
    } catch (err) {
      console.warn('Backend API unavailable, using client session authentication fallback');

      const emailLower = credentials.email.toLowerCase();

      // ✅ Priority 1: Check userStore for Super Admin-created users
      const storedUser = userStore.getUserByEmail(emailLower);
      if (storedUser && storedUser.isActive) {
        // Validate password: phone number
        if (credentials.password === storedUser.password || credentials.password === storedUser.phone) {
          const fallbackUser = {
            _id: storedUser._id,
            name: storedUser.name,
            email: storedUser.email,
            role: storedUser.role,
            assignedPortal: storedUser.assignedPortal || storedUser.role,
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
        }
      }

      // 5 Fixed DCP Inspection Officer Accounts
      if (emailLower.includes('dcpwest')) {
        const fallbackUser = { _id: 'dcp_west', name: 'DCP WEST', email: credentials.email, role: 'INSPECTION_OFFICER', dcpZone: 'DCP West', state: 'Uttar Pradesh', district: 'Lucknow' };
        localStorage.setItem('accessToken', 'demo_token_' + Date.now());
        setUser(fallbackUser);
        return fallbackUser;
      }
      if (emailLower.includes('dcpcentral')) {
        const fallbackUser = { _id: 'dcp_central', name: 'DCP CENTRAL', email: credentials.email, role: 'INSPECTION_OFFICER', dcpZone: 'DCP Central', state: 'Uttar Pradesh', district: 'Lucknow' };
        localStorage.setItem('accessToken', 'demo_token_' + Date.now());
        setUser(fallbackUser);
        return fallbackUser;
      }
      if (emailLower.includes('dcpnorth')) {
        const fallbackUser = { _id: 'dcp_north', name: 'DCP NORTH', email: credentials.email, role: 'INSPECTION_OFFICER', dcpZone: 'DCP North', state: 'Uttar Pradesh', district: 'Lucknow' };
        localStorage.setItem('accessToken', 'demo_token_' + Date.now());
        setUser(fallbackUser);
        return fallbackUser;
      }
      if (emailLower.includes('dcpeast')) {
        const fallbackUser = { _id: 'dcp_east', name: 'DCP EAST', email: credentials.email, role: 'INSPECTION_OFFICER', dcpZone: 'DCP East', state: 'Uttar Pradesh', district: 'Lucknow' };
        localStorage.setItem('accessToken', 'demo_token_' + Date.now());
        setUser(fallbackUser);
        return fallbackUser;
      }
      if (emailLower.includes('dcpsouth')) {
        const fallbackUser = { _id: 'dcp_south', name: 'DCP SOUTH', email: credentials.email, role: 'INSPECTION_OFFICER', dcpZone: 'DCP South', state: 'Uttar Pradesh', district: 'Lucknow' };
        localStorage.setItem('accessToken', 'demo_token_' + Date.now());
        setUser(fallbackUser);
        return fallbackUser;
      }

      // 🏛️ Commissioner of Police & Joint Commissioner of Police
      if (emailLower.includes('cp@') || emailLower.includes('commissioner')) {
        const fallbackUser = { _id: 'cp_police', name: 'Commissioner of Police (CP)', email: credentials.email, role: 'DISTRICT_ADMIN', state: 'Uttar Pradesh', district: 'Lucknow' };
        localStorage.setItem('accessToken', 'demo_token_' + Date.now());
        setUser(fallbackUser);
        return fallbackUser;
      }
      if (emailLower.includes('jcp@') || emailLower.includes('jointcp')) {
        const fallbackUser = { _id: 'jcp_police', name: 'Joint Commissioner of Police (JCP)', email: credentials.email, role: 'DISTRICT_ADMIN', state: 'Uttar Pradesh', district: 'Lucknow' };
        localStorage.setItem('accessToken', 'demo_token_' + Date.now());
        setUser(fallbackUser);
        return fallbackUser;
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
      } else if (emailLower.includes('super')) {
        fallbackUser = { _id: 'u1', name: 'Super Admin', email: credentials.email, role: 'SUPER_ADMIN', state: 'Uttar Pradesh', district: 'Lucknow' };
      } else if (emailLower.includes('inspector')) {
        fallbackUser = { _id: 'u4', name: 'DCP Inspection Officer', email: credentials.email, role: 'INSPECTION_OFFICER', dcpZone: 'DCP Central', state: 'Uttar Pradesh', district: 'Lucknow' };
      } else {
        // No matching institution found — user must register first
        throw new Error('No matching institution found. Please register your school first or check your login credentials.');
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
