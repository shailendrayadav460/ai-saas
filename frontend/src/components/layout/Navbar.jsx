import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = ({ title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-dark-900/50 backdrop-blur-sm shrink-0">
      <h1 className="text-base font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
          <Search size={16} />
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-500 rounded-full" />
        </button>
        {user?.avatar && (
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-8 h-8 rounded-full" 
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        )}
        <div 
          className="w-8 h-8 rounded-full bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-primary-400 text-xs font-bold"
          style={{ display: user?.avatar ? 'none' : 'flex' }}
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
