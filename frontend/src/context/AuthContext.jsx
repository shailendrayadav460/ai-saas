import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth.api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch current user on mount
  const fetchMe = useCallback(async () => {
    try {
      const data = await authAPI.getMe();
      setUser(data);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const register = async (name, email, password) => {
    const data = await authAPI.register({ name, email, password });
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {}
    setUser(null);
    setIsAuthenticated(false);
  };

  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  const refreshUser = () => fetchMe();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        register,
        login,
        logout,
        loginWithGoogle,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
