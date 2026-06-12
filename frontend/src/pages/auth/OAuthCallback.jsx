import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';

// Handles redirect back from Google OAuth
const OAuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handle = async () => {
      try {
        await refreshUser();
        navigate('/dashboard', { replace: true });
      } catch {
        navigate('/login?error=oauth_failed', { replace: true });
      }
    };
    handle();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner size="xl" />
      <p className="text-white/60 text-sm">Completing sign in...</p>
    </div>
  );
};

export default OAuthCallback;
