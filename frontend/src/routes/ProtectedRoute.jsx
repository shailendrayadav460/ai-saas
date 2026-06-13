import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force onboarding subscription plan selection if they haven't completed it
  if (user && !user.hasConfirmedPlan && location.pathname !== '/subscription') {
    return <Navigate to="/subscription" replace />;
  }

  return children;
};

export default ProtectedRoute;
