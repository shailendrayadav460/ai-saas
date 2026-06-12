import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, Plug, CreditCard,
  Settings, LogOut, Zap, ChevronLeft, ChevronRight,
  Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Badge from '../common/Badge';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat', icon: MessageSquare, label: 'AI Chat' },
  { path: '/services', icon: Plug, label: 'Services' },
  { path: '/subscription', icon: CreditCard, label: 'Subscription' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 68 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-full bg-dark-900/80 border-r border-white/5 overflow-hidden shrink-0"
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-dark-700 transition-all"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0">
          <Bot size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <p className="font-bold text-white text-sm">AI SaaS</p>
              <p className="text-xs text-white/40">Workspace</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} className="shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm truncate"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-primary-400 text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {user?.plan === 'PRO' ? (
                    <Badge variant="pro">
                      <Zap size={10} />
                      Pro
                    </Badge>
                  ) : (
                    <Badge variant="info">Free</Badge>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
