import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  MessageSquare, Mail, Calendar, HardDrive,
  Zap, Activity, CheckCircle, XCircle, Clock,
  TrendingUp, Bot
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="stat-card"
  >
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={18} className="text-white" />
      </div>
      {trend !== undefined && (
        <span className="text-xs text-emerald-400 flex items-center gap-1">
          <TrendingUp size={12} /> +{trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value ?? 0}</p>
      <p className="text-xs text-white/50 mt-0.5">{label}</p>
    </div>
  </motion.div>
);

const ActionStatus = ({ status }) => {
  if (status === 'SUCCESS') return <Badge variant="success"><CheckCircle size={10} /> Success</Badge>;
  if (status === 'FAILED') return <Badge variant="error"><XCircle size={10} /> Failed</Badge>;
  return <Badge variant="warning"><Clock size={10} /> Pending</Badge>;
};

const Dashboard = () => {
  const { dashboardStats, statsLoading, loadDashboardStats, googleConnected } = useApp();
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  if (statsLoading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = dashboardStats?.overview;
  const chartData = dashboardStats?.chartData || [];
  const recentActions = dashboardStats?.recentActions || [];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-white/50 mt-0.5">Here's what's happening today</p>
        </div>
        <div className="flex items-center gap-3">
          {!googleConnected && (
            <div className="glass px-4 py-2 rounded-xl text-xs text-amber-400 border border-amber-500/20 flex items-center gap-2">
              <Zap size={12} />
              Connect Google to unlock AI actions
            </div>
          )}
          <Badge variant={user?.plan === 'PRO' ? 'pro' : 'info'}>
            {user?.plan === 'PRO' ? '⚡ Pro Plan' : 'Free Plan'}
          </Badge>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={MessageSquare} label="Chats Today" value={stats?.chatCountToday} color="bg-primary-600/40" trend={12} />
        <StatCard icon={Mail} label="Emails Sent" value={stats?.emailSentToday} color="bg-emerald-600/40" trend={5} />
        <StatCard icon={Calendar} label="Meetings Today" value={stats?.meetingsToday} color="bg-blue-600/40" />
        <StatCard icon={HardDrive} label="Drive Actions" value={stats?.driveActionsToday} color="bg-purple-600/40" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity chart */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-primary-400" />
            <h3 className="text-sm font-semibold text-white">7-Day Activity</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="emailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={(v) => format(new Date(v), 'MMM d')} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              />
              <Area type="monotone" dataKey="chats" stroke="#6366f1" strokeWidth={2} fill="url(#chatGrad)" name="Chats" />
              <Area type="monotone" dataKey="emails" stroke="#10b981" strokeWidth={2} fill="url(#emailGrad)" name="Emails" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Actions bar chart */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={16} className="text-purple-400" />
            <h3 className="text-sm font-semibold text-white">AI Actions (7 Days)</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                tickFormatter={(v) => format(new Date(v), 'MMM d')} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="meetings" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Meetings" />
              <Bar dataKey="whatsapp" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="WhatsApp" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent AI Actions */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Recent AI Actions</h3>
        {recentActions.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">
            No AI actions yet. Start chatting to see actions here!
          </div>
        ) : (
          <div className="space-y-2">
            {recentActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
                    <Bot size={14} className="text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{action.actionType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-white/40">{format(new Date(action.createdAt), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                <ActionStatus status={action.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
