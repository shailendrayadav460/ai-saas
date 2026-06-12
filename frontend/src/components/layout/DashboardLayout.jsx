import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/chat': 'AI Chat',
  '/services': 'Google Services',
  '/subscription': 'Subscription',
  '/settings': 'Settings',
};

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'AI SaaS';

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
