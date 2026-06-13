import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/chat': 'AI Chat',
  '/services': 'Google Services',
  '/subscription': 'Subscription',
  '/settings': 'Settings',
};

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] || 'AI SaaS';

  // If the user has not confirmed their subscription plan,
  // do not render the Sidebar and Navbar layout. Render only the raw content (Subscription card).
  if (user && !user.hasConfirmedPlan) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
