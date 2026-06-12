import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Trash2, LogOut } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-lg font-bold text-white">Account Settings</h2>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2 mb-2">
          <User size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-white">Profile</h3>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-primary-300 text-2xl font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{user?.name}</p>
            <p className="text-xs text-white/50">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user?.plan === 'PRO' ? 'pro' : 'info'}>{user?.plan}</Badge>
              <Badge variant="success">Verified</Badge>
            </div>
          </div>
        </div>

        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<User size={16} />}
        />
        <Input
          label="Email"
          value={user?.email || ''}
          leftIcon={<Mail size={16} />}
          disabled
        />

        <Button size="sm">Save Changes</Button>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-primary-400" />
          <h3 className="text-sm font-semibold text-white">Security</h3>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/3">
          <div>
            <p className="text-sm text-white font-medium">Password</p>
            <p className="text-xs text-white/40 mt-0.5">Change your account password</p>
          </div>
          <Button variant="secondary" size="sm">Change</Button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/3">
          <div>
            <p className="text-sm text-white font-medium">Google OAuth Tokens</p>
            <p className="text-xs text-white/40 mt-0.5">Tokens are AES-256 encrypted in database</p>
          </div>
          <Badge variant="success">Encrypted</Badge>
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6 space-y-4 border border-red-500/10"
      >
        <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>

        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5">
          <div>
            <p className="text-sm text-white font-medium">Sign Out</p>
            <p className="text-xs text-white/40 mt-0.5">Sign out from all devices</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout} leftIcon={<LogOut size={14} />}>
            Sign Out
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5">
          <div>
            <p className="text-sm text-white font-medium">Delete Account</p>
            <p className="text-xs text-white/40 mt-0.5">Permanently delete your account and all data</p>
          </div>
          <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />}>
            Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
