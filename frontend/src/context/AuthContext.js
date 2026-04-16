import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/api'; // api.js එකේ export default api නිසා මෙතන simple 'api' ලෙස ගන්න

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Backend වෙතින් user profile fetch කිරීම (පොදු function එකක් ලෙස)
  const fetchProfile = useCallback(async (token) => {
    if (!token) {
      setLoading(false);
      return null;
    }

    try {
      // API interceptor එක හරහා token එක headers වලට යනවා
      const res = await api.get('/users/me'); 
      const userData = { ...res.data, token };
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Profile fetch failed:', err.response?.status, err.message);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ App එක මුලින්ම Load වෙනකොට localStorage check කිරීම
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // App එක refresh කරන වෙලාවට axios headers වලට ආයේ token එක දාන්න
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  // ✅ OAuthCallback එකෙන් පස්සේ Login කරවීමට
  const loginWithToken = useCallback(async (token) => {
    setLoading(true);
    
    // 1. Token එක save කරන්න
    localStorage.setItem('token', token);
    
    // 2. Axios instance එකේ headers update කරන්න (ඊළඟ request එකට අවශ්‍යයි)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 3. Profile එක fetch කරලා user state එක update කරන්න
    return await fetchProfile(token);
  }, [fetchProfile]);

  // ✅ Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }, []);

  // ── Role Helpers ──────────────────────────────────────────────
  const isAdmin      = () => user?.roles?.includes('ROLE_ADMIN')      ?? false;
  const isStaff      = () => user?.roles?.includes('ROLE_STAFF')      ?? false;
  const isTechnician = () => user?.roles?.includes('ROLE_TECHNICIAN') ?? false;
  const isUser       = () => user?.roles?.includes('ROLE_USER')       ?? false;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithToken,
      logout,
      isAdmin,
      isStaff,
      isTechnician,
      isUser,
      updateUser: (patch) => setUser(prev => ({ ...prev, ...patch })),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
};

export default AuthContext;
