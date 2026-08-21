import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/apiServices';
import { institutionStore } from '../api/institutionStore';
import { userStore } from '../api/userStore';
import { cloudSync } from '../api/cloudSync';

const AuthContext = createContext(null);



export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data.data.user);
    } catch {
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
    cloudSync.pull().then(() => fetchUser()).catch(() => fetchUser());
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authApi.login(credentials);
      const loggedUser = res.data.data.user;
      if (res.data.data.accessToken) {
        localStorage.setItem('accessToken', res.data.data.accessToken);
      }
      if (res.data.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.data.refreshToken);
      }
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      // Fallback: check local userStore if offline sync present
      const emailLower = credentials.email?.toLowerCase()?.trim();
      const storedUser = userStore.getUserByEmail(emailLower);
      if (storedUser) {
        if (!storedUser.isActive) throw new Error('Account deactivated.');
        localStorage.setItem('accessToken', 'officer_' + Date.now());
        setUser(storedUser);
        return storedUser;
      }

      // Check if this email is a registered institution
      const inst = institutionStore.getInstitutionByIdOrEmail(emailLower);
      if (inst) {
        const instUser = {
          _id: inst._id,
          id: inst._id,
          name: inst.name,
          email: inst.email,
          role: 'SCHOOL_ADMIN',
          institutionId: inst._id,
          district: inst.district,
          state: inst.state,
        };
        localStorage.setItem('accessToken', 'inst_' + Date.now());
        localStorage.setItem('registeredSchoolUser', JSON.stringify({
          username: inst.email,
          password: credentials.password,
          institutionName: inst.name,
          institutionId: inst._id,
          safeId: inst.safeId,
          zone: inst.zone,
        }));
        setUser(instUser);
        return instUser;
      }

      throw err;
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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
