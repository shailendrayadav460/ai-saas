import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import OAuthCallback from '../pages/auth/OAuthCallback';
import Dashboard from '../pages/Dashboard';
import Chat from '../pages/Chat';
import Services from '../pages/Services';
import Subscription from '../pages/Subscription';
import Settings from '../pages/Settings';
import WhatsApp from '../pages/WhatsApp';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="chat" element={<Chat />} />
        <Route path="services" element={<Services />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
