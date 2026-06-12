import { createContext, useContext, useState, useCallback } from 'react';
import { dashboardAPI } from '../api/dashboard.api';
import { googleAPI } from '../api/google.api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await dashboardAPI.getStats();
      setDashboardStats(data);
      setGoogleConnected(data.googleConnected);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const checkGoogleStatus = useCallback(async () => {
    try {
      const data = await googleAPI.getStatus();
      setGoogleConnected(data.connected);
      return data;
    } catch {
      setGoogleConnected(false);
      return { connected: false };
    }
  }, []);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <AppContext.Provider
      value={{
        dashboardStats,
        googleConnected,
        sidebarOpen,
        statsLoading,
        loadDashboardStats,
        checkGoogleStatus,
        setGoogleConnected,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export default AppContext;
