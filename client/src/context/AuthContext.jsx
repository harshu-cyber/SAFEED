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
      console.error('[AuthContext] Login API Error:', err.response?.data || err.message);
      const serverMsg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      throw new Error(serverMsg);
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
