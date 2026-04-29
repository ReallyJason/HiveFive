import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { apiGet, apiPatch, apiPost, apiDelete } from '../lib/api';
import { useNavigate, Link } from 'react-router';
import { NavBar } from '../components/NavBar';
import { toast } from 'sonner';
import NotFound from './NotFound';
import { parseUTC } from '../lib/constants';
import {
  BarChart3, Shield, Users as UsersIcon, DollarSign,
  AlertTriangle, CheckCircle, XCircle, Eye, Ban, Clock,
  Search, ChevronDown, ChevronRight, ChevronLeft, Flag, Activity,
  ShoppingBag, UserPlus, Package, Settings2, EyeOff, Loader2, Trash2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { useFeatures } from '../lib/features';
import { CharacterLimitHint } from '../components/CharacterLimitHint';

// ── Types ──

interface StatsData {
  total_revenue: number;
  service_fees: number;
  shop_revenue: number;
  active_users: number;
  open_reports: number;
  orders_this_month: number;
  fee_by_day: { day: string; fees: number }[];
  shop_by_day: { day: string; shop: number }[];
  orders_by_status: { status: string; count: number }[];
}

interface Report {
  id: number;
  reporter_id: number;
  reported_id: number;
  reason: string;
  description: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter_username: string;
  reporter_first_name: string;
  reporter_last_name: string;
  reporter_image: string;
  reported_username: string;
  reported_first_name: string;
  reported_last_name: string;
  reported_image: string;
  suspended_until: string | null;
  banned_at: string | null;
  ban_reason: string | null;
}

interface AdminUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  university: string;
  profile_image: string;
  role: string;
  suspended_until: string | null;
  banned_at: string | null;
  ban_reason: string | null;
  created_at: string;
  last_seen_at: string | null;
  report_count: number;
}

interface RevenueData {
  service_fees: number;
  shop_revenue: number;
  total_revenue: number;
  avg_order_value: number;
  fee_chart: { day: string; fees: number }[];
  shop_chart: { day: string; shop: number }[];
  top_items: { name: string; type: string; purchases: number; revenue: number }[];
  top_categories: { category: string; order_count: number; fees: number }[];
}

interface ActivityEvent {
  type: string;
  user_id: number;
  username: string;
  first_name: string;
  profile_image: string;
  description: string;
  event_at: string;
}

interface AdminOrder {
  id: number;
  service_id: number | null;
  request_id: number | null;
  client_id: number;
  provider_id: number;
  status: string;
  price: number;
  service_fee: number;
  total: number;
  created_at: string;
  completed_at: string | null;
  service_title: string;
  service_category: string;
  buyer_first_name: string;
  buyer_last_name: string;
  buyer_username: string;
  buyer_image: string;
  seller_first_name: string;
  seller_last_name: string;
  seller_username: string;
  seller_image: string;
}

// ── Helpers ──

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const d = parseUTC(dateStr);
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Show actual date+time for admin activity feed (more useful than relative) */
function activityTime(dateStr: string): string {
  const d = parseUTC(dateStr);
  if (isNaN(d.getTime())) return '--';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return time;
  if (isYesterday) return `Yesterday ${time}`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + time;
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function getInitials(first: string, last: string): string {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
}

// ── Animated counter hook ──

function useAnimatedNumber(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const from = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

// ── Stat card component ──

function StatCard({ icon: Icon, label, value, prefix = '', suffix = '', color, onClick }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  color: string;
  onClick?: () => void;
}) {
  const animated = useAnimatedNumber(value);
  return (
    <div
      className={`bg-white border border-charcoal-100 rounded-xl p-6 transition-all ${onClick ? 'cursor-pointer hover:border-honey-300 hover:shadow-sm' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="size-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}
        >
          <Icon className="size-5" style={{ color }} />
        </div>
        <span className="font-sans text-sm text-charcoal-500">{label}</span>
      </div>
      <div className="font-mono font-bold text-3xl text-charcoal-900" style={{ lineHeight: 1.1 }}>
        {prefix}{animated.toLocaleString()}{suffix}
      </div>
    </div>
  );
}

// ── Initials avatar ──

function InitialsAvatar({ first, last, size = 32, bg = '#E5E2DE' }: {
  first: string;
  last: string;
  size?: number;
  bg?: string;
}) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.4}px`,
      fontWeight: 700,
      color: '#1C1917',
      flexShrink: 0,
    }}>
      {getInitials(first, last)}
    </div>
  );
}

// ── Custom chart tooltip ──

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-charcoal-100 rounded-lg shadow-lg" style={{ padding: '10px 14px', fontSize: '12px' }}>
      <div className="text-charcoal-500 mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: ${Number(p.value ?? 0).toFixed(2)}
        </div>
      ))}
    </div>
  );
}

// ── Status badge helpers ──

function getUserStatus(user: { suspended_until: string | null; banned_at: string | null }): {
  label: string;
  color: string;
  bg: string;
} {
  if (user.banned_at) return { label: 'Banned', color: '#EF4444', bg: '#EF444420' };
  if (user.suspended_until && parseUTC(user.suspended_until) > new Date()) {
    return { label: 'Suspended', color: '#F59E0B', bg: '#F59E0B20' };
  }
  return { label: 'Active', color: '#22C55E', bg: '#22C55E20' };
}

function getReportStatusStyle(status: string): { color: string; bg: string } {
  switch (status) {
    case 'pending': return { color: '#F59E0B', bg: '#F59E0B20' };
    case 'acknowledged': return { color: '#C47F14', bg: '#C47F1420' };
    case 'dismissed': return { color: '#78716C', bg: '#78716C20' };
    case 'actioned': return { color: '#22C55E', bg: '#22C55E20' };
    default: return { color: '#78716C', bg: '#78716C20' };
  }
}

function getReasonStyle(reason: string): { color: string; bg: string } {
  const lower = reason.toLowerCase();
  if (lower.includes('spam')) return { color: '#F59E0B', bg: '#F59E0B20' };
  if (lower.includes('harass') || lower.includes('abuse')) return { color: '#EF4444', bg: '#EF444420' };
  if (lower.includes('scam') || lower.includes('fraud')) return { color: '#EF4444', bg: '#EF444420' };
  if (lower.includes('inappropriate')) return { color: '#F97316', bg: '#F9731620' };
  return { color: '#9A5F10', bg: '#9A5F1020' };
}

function getActivityDot(type: string): string {
  switch (type) {
    case 'order': return '#E9A020';
    case 'report': return '#EF4444';
    case 'signup': return '#C47F14';
    case 'purchase': return '#9A5F10';
    case 'service': return '#E9A020';
    default: return '#78716C';
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'order': return Package;
    case 'report': return Flag;
    case 'signup': return UserPlus;
    case 'purchase': return ShoppingBag;
    default: return Activity;
  }
}

// ── Donut center label ──

const DONUT_COLORS = ['#E9A020', '#F5B540', '#C47F14', '#9A5F10', '#F8CB74', '#6E430E'];

// ── Preview data (shown when backend endpoints are not yet deployed) ──

function previewDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - n + 1 + i);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
}

function buildPreviewStats(): StatsData {
  const days = previewDays(14);
  return {
    total_revenue: 2847, service_fees: 1923, shop_revenue: 924,
    active_users: 156, open_reports: 3, orders_this_month: 42,
    fee_by_day: days.map((day, i) => ({ day, fees: 80 + Math.round(Math.sin(i * 0.7) * 40 + i * 8) })),
    shop_by_day: days.map((day, i) => ({ day, shop: 30 + Math.round(Math.cos(i * 0.5) * 20 + i * 5) })),
    orders_by_status: [
      { status: 'completed', count: 34 },
      { status: 'in_progress', count: 15 },
      { status: 'pending', count: 8 },
      { status: 'cancelled', count: 3 },
    ],
  };
}

function buildPreviewActivity(): ActivityEvent[] {
  return [
    { type: 'order', user_id: 1, username: 'jordan_p', first_name: 'Jordan', profile_image: '', description: 'placed an order for Logo Design', event_at: new Date(Date.now() - 15 * 60000).toISOString() },
    { type: 'signup', user_id: 2, username: 'alex_m', first_name: 'Alex', profile_image: '', description: 'created a new account', event_at: new Date(Date.now() - 45 * 60000).toISOString() },
    { type: 'purchase', user_id: 3, username: 'sam_k', first_name: 'Sam', profile_image: '', description: 'purchased Golden Frame from shop', event_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { type: 'report', user_id: 4, username: 'taylor_r', first_name: 'Taylor', profile_image: '', description: 'reported a user for spam', event_at: new Date(Date.now() - 5 * 3600000).toISOString() },
    { type: 'order', user_id: 5, username: 'chris_w', first_name: 'Chris', profile_image: '', description: 'completed an order for Math Tutoring', event_at: new Date(Date.now() - 8 * 3600000).toISOString() },
  ];
}

function buildPreviewReports(): Report[] {
  return [
    {
      id: 1, reporter_id: 2, reported_id: 5, reason: 'Spam',
      description: 'Sending unsolicited service promotions in chat',
      status: 'pending', admin_note: null,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(), resolved_at: null,
      reporter_username: 'alex_m', reporter_first_name: 'Alex', reporter_last_name: 'Morgan', reporter_image: '',
      reported_username: 'chris_w', reported_first_name: 'Chris', reported_last_name: 'Walker', reported_image: '',
      suspended_until: null, banned_at: null, ban_reason: null,
    },
    {
      id: 2, reporter_id: 3, reported_id: 6, reason: 'Inappropriate',
      description: 'Inappropriate language in service description',
      status: 'pending', admin_note: null,
      created_at: new Date(Date.now() - 4 * 86400000).toISOString(), resolved_at: null,
      reporter_username: 'sam_k', reporter_first_name: 'Sam', reporter_last_name: 'Kim', reporter_image: '',
      reported_username: 'riley_j', reported_first_name: 'Riley', reported_last_name: 'Johnson', reported_image: '',
      suspended_until: null, banned_at: null, ban_reason: null,
    },
    {
      id: 3, reporter_id: 1, reported_id: 7, reason: 'Scam',
      description: 'Charged for service but never delivered',
      status: 'acknowledged', admin_note: null,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(), resolved_at: null,
      reporter_username: 'jordan_p', reporter_first_name: 'Jordan', reporter_last_name: 'Park', reporter_image: '',
      reported_username: 'casey_d', reported_first_name: 'Casey', reported_last_name: 'Davis', reported_image: '',
      suspended_until: null, banned_at: null, ban_reason: null,
    },
  ];
}

function buildPreviewUsers(): AdminUser[] {
  return [
    { id: 1, email: 'jordan@buffalo.edu', username: 'jordan_p', first_name: 'Jordan', last_name: 'Park', university: 'University at Buffalo', profile_image: '', role: 'user', suspended_until: null, banned_at: null, ban_reason: null, created_at: '2025-09-15', last_seen_at: new Date().toISOString(), report_count: 0 },
    { id: 2, email: 'alex@buffalo.edu', username: 'alex_m', first_name: 'Alex', last_name: 'Morgan', university: 'University at Buffalo', profile_image: '', role: 'user', suspended_until: null, banned_at: null, ban_reason: null, created_at: '2025-10-03', last_seen_at: new Date(Date.now() - 86400000).toISOString(), report_count: 0 },
    { id: 3, email: 'sam@buffalo.edu', username: 'sam_k', first_name: 'Sam', last_name: 'Kim', university: 'University at Buffalo', profile_image: '', role: 'user', suspended_until: null, banned_at: null, ban_reason: null, created_at: '2025-11-20', last_seen_at: new Date(Date.now() - 2 * 86400000).toISOString(), report_count: 1 },
    { id: 4, email: 'taylor@buffalo.edu', username: 'taylor_r', first_name: 'Taylor', last_name: 'Reed', university: 'University at Buffalo', profile_image: '', role: 'user', suspended_until: null, banned_at: null, ban_reason: null, created_at: '2025-12-01', last_seen_at: new Date(Date.now() - 3 * 86400000).toISOString(), report_count: 0 },
    { id: 5, email: 'chris@buffalo.edu', username: 'chris_w', first_name: 'Chris', last_name: 'Walker', university: 'University at Buffalo', profile_image: '', role: 'user', suspended_until: null, banned_at: null, ban_reason: null, created_at: '2026-01-10', last_seen_at: new Date(Date.now() - 5 * 86400000).toISOString(), report_count: 2 },
  ];
}

function buildPreviewRevenue(): RevenueData {
  const days = previewDays(14);
  return {
    service_fees: 1923, shop_revenue: 924, total_revenue: 2847, avg_order_value: 67.79,
    fee_chart: days.map((day, i) => ({ day, fees: 80 + Math.round(Math.sin(i * 0.7) * 40 + i * 8) })),
    shop_chart: days.map((day, i) => ({ day, shop: 30 + Math.round(Math.cos(i * 0.5) * 20 + i * 5) })),
    top_items: [
      { name: 'Logo Design', type: 'service', purchases: 12, revenue: 540 },
      { name: 'Math Tutoring', type: 'service', purchases: 8, revenue: 320 },
      { name: 'Golden Frame', type: 'shop', purchases: 15, revenue: 450 },
      { name: 'Resume Review', type: 'service', purchases: 6, revenue: 180 },
      { name: 'Pro Badge', type: 'shop', purchases: 10, revenue: 200 },
    ],
    top_categories: [
      { category: 'Design', order_count: 18, fees: 810 },
      { category: 'Tutoring', order_count: 12, fees: 480 },
      { category: 'Writing', order_count: 8, fees: 320 },
      { category: 'Programming', order_count: 5, fees: 250 },
    ],
  };
}

// ── Main component ──

export default function Admin() {
  const { user, loading, refreshUser } = useAuth();
  const { refresh: refreshFeatures } = useFeatures();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'users' | 'revenue' | 'orders' | 'settings'>('overview');

  // Overview state
  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState<string>('all');
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('all');
  const [userSort, setUserSort] = useState('created_at');
  const [userSortDir, setUserSortDir] = useState<'DESC' | 'ASC'>('DESC');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userActionLoading, setUserActionLoading] = useState<number | null>(null);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  // Revenue state
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState('30d');

  // Orders state
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [debouncedOrderSearch, setDebouncedOrderSearch] = useState('');
  const [orderPeriod, setOrderPeriod] = useState('all');
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);

  // Preview mode (tracks which sections fell back to sample data)
  const [previewSections, setPreviewSections] = useState<Set<string>>(new Set());
  const markPreview = useCallback((section: string) => {
    setPreviewSections(prev => { const next = new Set(prev); next.add(section); return next; });
  }, []);

  // Settings state
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState<string | null>(null);

  // Admin account state
  const [adminPasswordData, setAdminPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [adminPasswordSaving, setAdminPasswordSaving] = useState(false);
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [showAdminOldPassword, setShowAdminOldPassword] = useState(false);
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);

  const [adminEmailData, setAdminEmailData] = useState({ newEmail: '', password: '' });
  const [adminEmailSaving, setAdminEmailSaving] = useState(false);
  const [adminEmailError, setAdminEmailError] = useState<string | null>(null);
  const [showAdminEmailPassword, setShowAdminEmailPassword] = useState(false);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'reports' as const, label: 'Reports', icon: Shield },
    { id: 'users' as const, label: 'Users', icon: UsersIcon },
    { id: 'revenue' as const, label: 'Revenue', icon: DollarSign },
    { id: 'orders' as const, label: 'Orders', icon: Package },
    { id: 'settings' as const, label: 'Settings', icon: Settings2 },
  ];

  // ── Data fetching ──

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsData, activityData] = await Promise.all([
        apiGet<StatsData>('/admin/stats.php'),
        apiGet<{ events: ActivityEvent[] }>('/admin/activity.php'),
      ]);
      setStats(statsData);
      setActivity(activityData.events?.slice(0, 10) || []);
    } catch {
      setStats(buildPreviewStats());
      setActivity(buildPreviewActivity());
      markPreview('overview');
    } finally {
      setStatsLoading(false);
    }
  }, [markPreview]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (reportFilter !== 'all') params.status = reportFilter;
      const data = await apiGet<{ reports: Report[] }>('/admin/reports.php', params);
      setReports(data.reports || []);
    } catch {
      setReports(buildPreviewReports());
      markPreview('reports');
    } finally {
      setReportsLoading(false);
    }
  }, [reportFilter, markPreview]);

  const fetchUsers = useCallback(async (p: {
    search?: string; status?: string; sort?: string; dir?: string; page?: number;
  } = {}) => {
    setUsersLoading(true);
    try {
      const q: Record<string, string> = { page: String(p.page ?? 1) };
      if (p.search) q.search = p.search;
      if (p.status && p.status !== 'all') q.status = p.status;
      if (p.sort) q.sort = p.sort;
      if (p.dir) q.dir = p.dir;
      const data = await apiGet<{ users: AdminUser[]; total: number; pages: number }>('/admin/users.php', q);
      setUsers(data.users || []);
      setUserTotalPages(data.pages || 1);
      setUserTotal(data.total || 0);
    } catch {
      setUsers(buildPreviewUsers());
      setUserTotalPages(1);
      setUserTotal(0);
      markPreview('users');
    } finally {
      setUsersLoading(false);
    }
  }, [markPreview]);

  const fetchRevenue = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const data = await apiGet<RevenueData>('/admin/revenue.php', { period: revenuePeriod });
      setRevenue(data);
    } catch {
      setRevenue(buildPreviewRevenue());
      markPreview('revenue');
    } finally {
      setRevenueLoading(false);
    }
  }, [revenuePeriod, markPreview]);

  const fetchOrders = useCallback(async (p: {
    search?: string; status?: string; period?: string; page?: number;
  }) => {
    setOrdersLoading(true);
    try {
      const q: Record<string, string> = { page: String(p.page ?? 1) };
      if (p.status && p.status !== 'all') q.status = p.status;
      if (p.period && p.period !== 'all') q.period = p.period;
      if (p.search) q.search = p.search;
      const data = await apiGet<{ orders: AdminOrder[]; total: number; pages: number }>('/admin/orders.php', q);
      setAdminOrders(data.orders || []);
      setOrderTotalPages(data.pages || 1);
      setOrderTotal(data.total || 0);
    } catch {
      setAdminOrders([]);
      setOrderTotalPages(1);
      setOrderTotal(0);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await apiGet<{ settings: { setting_key: string; setting_value: string }[] }>('/admin/settings.php');
      const map: Record<string, string> = {
        feature_requests: '1',
        feature_shop: '1',
        feature_messaging: '1',
        feature_leaderboard: '1',
        feature_docs: '1',
        mock_data: '1',
        rate_limit_enabled: '1',
        rate_limit_max_attempts: '10',
        rate_limit_window_minutes: '15',
      };
      data.settings.forEach(s => { map[s.setting_key] = s.setting_value; });
      setSystemSettings(map);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const toggleFeature = async (key: string) => {
    const newValue = systemSettings[key] === '1' ? '0' : '1';
    setSettingsSaving(key);
    try {
      await apiPatch('/admin/settings.php', { [key]: newValue === '1' });
      setSystemSettings(prev => ({ ...prev, [key]: newValue }));
      refreshFeatures();
      toast.success(`${key.replace('feature_', '').replace(/_/g, ' ')} ${newValue === '1' ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update setting');
    } finally {
      setSettingsSaving(null);
    }
  };

  // Fetch on tab switch
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'revenue') fetchRevenue();
    // users + orders: handled by dedicated effects below
  }, [activeTab, user, fetchStats, fetchReports, fetchRevenue]);

  // Debounce user search & reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
      setUserPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  // Fetch users whenever tab/filters/page/search/sort change
  useEffect(() => {
    if (activeTab !== 'users') return;
    fetchUsers({
      search: debouncedUserSearch,
      status: userStatus,
      sort: userSort,
      dir: userSortDir,
      page: userPage,
    });
  }, [activeTab, debouncedUserSearch, userStatus, userSort, userSortDir, userPage, fetchUsers]);

  // Debounce order search & reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOrderSearch(orderSearch);
      setOrderPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [orderSearch]);

  // Fetch orders whenever tab/filters/page/search change
  useEffect(() => {
    if (activeTab !== 'orders') return;
    fetchOrders({
      search: debouncedOrderSearch,
      status: orderFilter,
      period: orderPeriod,
      page: orderPage,
    });
  }, [activeTab, debouncedOrderSearch, orderFilter, orderPeriod, orderPage, fetchOrders]);

  useEffect(() => {
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, fetchSettings]);

  // ── Actions ──

  const handleReportAction = async (reportId: number, status: string, userAction?: { user_id: number; action: string; reason?: string }) => {
    setActionLoading(reportId);
    try {
      const result = await apiPatch<{ success: boolean; auto_suspended?: boolean }>('/admin/reports.php', { id: reportId, status, admin_note: `Action: ${status}` });
      if (userAction) {
        await apiPatch('/admin/users.php', userAction);
      }
      if (result.auto_suspended) {
        toast.success('User was auto-suspended based on report threshold');
      }
      await fetchReports();
      setExpandedReport(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserAction = async (userId: number, action: string, reason?: string) => {
    setUserActionLoading(userId);
    try {
      await apiPatch('/admin/users.php', { user_id: userId, action, reason });
      await fetchUsers({ search: debouncedUserSearch, status: userStatus, sort: userSort, dir: userSortDir, page: userPage });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Permanently delete user "${username}"? This cannot be undone.`)) return;
    setUserActionLoading(userId);
    try {
      await apiDelete('/admin/users.php', { user_id: userId });
      toast.success(`User "${username}" deleted`);
      await fetchUsers({ search: debouncedUserSearch, status: userStatus, sort: userSort, dir: userSortDir, page: userPage });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleImpersonate = async (userId: number) => {
    try {
      await apiPost('/admin/impersonate.php', { user_id: userId });
      await refreshUser();
      navigate('/discover');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to impersonate');
    }
  };

  // ── Access control ──

  if (loading) return null;
  if (!user || user.role !== 'admin') return <NotFound />;

  // ── Build chart data ──

  // Merge chart data by date key (arrays may have different days)
  const mergeChartData = (
    fees: { day: string; fees: number }[],
    shop: { day: string; shop: number }[],
  ) => {
    const map = new Map<string, { day: string; fees: number; shop: number }>();
    fees.forEach(f => map.set(f.day, { day: f.day, fees: f.fees, shop: 0 }));
    shop.forEach(s => {
      const existing = map.get(s.day);
      if (existing) existing.shop = s.shop;
      else map.set(s.day, { day: s.day, fees: 0, shop: s.shop });
    });
    return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day));
  };

  const revenueChartData = stats ? mergeChartData(stats.fee_by_day, stats.shop_by_day) : [];

  const donutData = stats?.orders_by_status || [];
  const totalOrders = donutData.reduce((sum, d) => sum + d.count, 0);

  // Revenue tab combined chart data
  const revenueAreaData = revenue ? mergeChartData(revenue.fee_chart, revenue.shop_chart) : [];

  // Client-side filtering for preview mode
  const displayReports = previewSections.has('reports') && reportFilter !== 'all'
    ? reports.filter(r => r.status === reportFilter)
    : reports;

  const displayUsers = users;

  const isPreview = previewSections.size > 0;

  const getAdminPasswordStrength = (password: string) => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };

  const adminStrength = getAdminPasswordStrength(adminPasswordData.newPassword);
  const adminStrengthColors = ['bg-charcoal-200', 'bg-red-500', 'bg-amber-500', 'bg-honey-500', 'bg-emerald-500'];
  const adminStrengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  const handleAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordData.newPassword.length < 8) {
      setAdminPasswordError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(adminPasswordData.newPassword)) {
      setAdminPasswordError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(adminPasswordData.newPassword)) {
      setAdminPasswordError('Password must contain at least one number');
      return;
    }
    if (adminPasswordData.newPassword !== adminPasswordData.confirmPassword) {
      setAdminPasswordError('Passwords do not match');
      return;
    }
    setAdminPasswordSaving(true);
    setAdminPasswordError(null);
    try {
      await apiPost('/auth/change-password.php', {
        old_password: adminPasswordData.oldPassword,
        new_password: adminPasswordData.newPassword,
      });
      toast.success('Password changed');
      setAdminPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setAdminPasswordError(err?.message || 'Failed to change password');
    } finally {
      setAdminPasswordSaving(false);
    }
  };

  const handleAdminEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmailData.newEmail || !adminEmailData.password) return;
    setAdminEmailSaving(true);
    setAdminEmailError(null);
    try {
      await apiPost('/auth/change-email.php', {
        new_email: adminEmailData.newEmail,
        password: adminEmailData.password,
      });
      toast.success('Email updated');
      setAdminEmailData({ newEmail: '', password: '' });
      refreshUser();
    } catch (err: any) {
      setAdminEmailError(err?.message || 'Failed to change email');
    } finally {
      setAdminEmailSaving(false);
    }
  };

  // ── Render ──

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      {/* Admin header + Tab bar */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 md:px-6 pt-8 md:pt-10 pb-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display italic text-3xl md:text-4xl text-charcoal-900">Admin Dashboard</h1>
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <Shield className="size-4 text-honey-500" />
            <span className="font-sans text-sm text-charcoal-500">{user.first_name} {user.last_name}</span>
          </div>
        </div>
      </div>
      <div className="border-b border-charcoal-100">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 md:px-6">
          <div className="-mb-px overflow-x-auto scrollbar-hide">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 pb-3 pt-2 font-sans font-bold text-sm transition-colors relative whitespace-nowrap ${
                      isActive ? 'text-charcoal-900' : 'text-charcoal-400 hover:text-charcoal-700'
                    }`}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-honey-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-6 md:px-6 py-8">

        {isPreview && (
          <div style={{
            background: '#E9A02010',
            border: '1px solid #E9A02025',
            borderRadius: '10px',
            padding: '10px 16px',
            marginBottom: '24px',
            fontSize: '12px',
            color: '#78716C',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <BarChart3 style={{ width: '14px', height: '14px', color: '#E9A020', flexShrink: 0 }} />
            Showing preview data &mdash; live data will appear once backend services are connected
          </div>
        )}

        {/* ═══════════════════════ OVERVIEW TAB ═══════════════════════ */}
        {activeTab === 'overview' && (
          <div>
            {/* Stat cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
              gap: '20px',
              marginBottom: '32px',
            }}>
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={stats?.total_revenue || 0}
                prefix="$"
                color="#E9A020"
                onClick={() => setActiveTab('revenue')}
              />
              <StatCard
                icon={UsersIcon}
                label="Active Users"
                value={stats?.active_users || 0}
                color="#E9A020"
                onClick={() => setActiveTab('users')}
              />
              <StatCard
                icon={AlertTriangle}
                label="Open Reports"
                value={stats?.open_reports || 0}
                color="#EF4444"
                onClick={() => setActiveTab('reports')}
              />
              <StatCard
                icon={Package}
                label="Orders This Month"
                value={stats?.orders_this_month || 0}
                color="#9A5F10"
                onClick={() => setActiveTab('orders')}
              />
            </div>

            {/* Charts row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
              gap: '20px',
              marginBottom: '32px',
            }}>
              {/* Revenue line chart */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E2DE',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <div className="font-bold" style={{ color: '#1C1917', fontSize: '16px', marginBottom: '20px' }}>
                  Revenue Trend
                </div>
                <div style={{ height: '260px' }}>
                  {revenueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueChartData}>
                        <XAxis
                          dataKey="day"
                          stroke="#A8A29E"
                          tick={{ fill: '#78716C', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#E5E2DE' }}
                        />
                        <YAxis
                          stroke="#A8A29E"
                          tick={{ fill: '#78716C', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="fees"
                          name="Service Fees"
                          stroke="#E9A020"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: '#E9A020' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="shop"
                          name="Shop Revenue"
                          stroke="#9A5F10"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: '#9A5F10' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center" style={{
                      height: '100%',
                      justifyContent: 'center',
                      color: '#A8A29E',
                      fontSize: '14px',
                    }}>
                      {statsLoading ? 'Loading chart data...' : 'No revenue data available'}
                    </div>
                  )}
                </div>
                <div className="flex items-center" style={{ gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
                  <div className="flex items-center" style={{ gap: '6px' }}>
                    <div style={{ width: '12px', height: '3px', background: '#E9A020', borderRadius: '2px' }} />
                    <span style={{ color: '#78716C', fontSize: '12px' }}>Service Fees</span>
                  </div>
                  <div className="flex items-center" style={{ gap: '6px' }}>
                    <div style={{ width: '12px', height: '3px', background: '#9A5F10', borderRadius: '2px' }} />
                    <span style={{ color: '#78716C', fontSize: '12px' }}>Shop Revenue</span>
                  </div>
                </div>
              </div>

              {/* Orders donut chart */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E2DE',
                borderRadius: '16px',
                padding: '24px',
              }}>
                <div className="font-bold" style={{ color: '#1C1917', fontSize: '16px', marginBottom: '20px' }}>
                  Orders by Status
                </div>
                <div style={{ height: '260px', position: 'relative' }} className="[&_.recharts-sector]:outline-none [&_.recharts-sector:focus]:outline-none">
                  {donutData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={3}
                            stroke="none"
                            cursor="default"
                            isAnimationActive={false}
                          >
                            {donutData.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: '#FFFFFF',
                              border: '1px solid #E5E2DE',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: '#1C1917',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center text overlay */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        pointerEvents: 'none',
                      }}>
                        <div className="font-mono font-bold" style={{ color: '#1C1917', fontSize: '28px', lineHeight: 1 }}>
                          {totalOrders}
                        </div>
                        <div style={{ color: '#78716C', fontSize: '11px', marginTop: '2px' }}>total</div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center" style={{
                      height: '100%',
                      justifyContent: 'center',
                      color: '#A8A29E',
                      fontSize: '14px',
                    }}>
                      {statsLoading ? 'Loading...' : 'No order data available'}
                    </div>
                  )}
                </div>
                {/* Legend */}
                <div className="flex" style={{ flexWrap: 'wrap', gap: '12px', marginTop: '12px', justifyContent: 'center' }}>
                  {donutData.map((d, i) => (
                    <div key={d.status} className="flex items-center" style={{ gap: '6px' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: DONUT_COLORS[i % DONUT_COLORS.length],
                      }} />
                      <span style={{ color: '#78716C', fontSize: '12px', textTransform: 'capitalize' }}>
                        {d.status} ({d.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity feed */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E2DE',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <div className="font-bold" style={{ color: '#1C1917', fontSize: '16px' }}>
                  Recent Activity
                </div>
                <Activity style={{ width: '16px', height: '16px', color: '#A8A29E' }} />
              </div>
              {activity.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {activity.map((event, i) => {
                    const EventIcon = getActivityIcon(event.type);
                    return (
                      <div
                        key={i}
                        className="flex items-center"
                        style={{
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#E5E2DE20'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Colored dot */}
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: getActivityDot(event.type),
                          flexShrink: 0,
                        }} />
                        {/* Avatar */}
                        <InitialsAvatar first={event.first_name} last="" size={28} />
                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ color: '#1C1917', fontSize: '13px' }}>
                            <span style={{ fontWeight: 600 }}>@{event.username}</span>
                            {' '}
                            <span style={{ color: '#78716C' }}>{event.description}</span>
                          </span>
                        </div>
                        {/* Time */}
                        <span style={{ color: '#A8A29E', fontSize: '12px', flexShrink: 0 }}>
                          {activityTime(event.event_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: '#A8A29E', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
                  {statsLoading ? 'Loading activity...' : 'No recent activity'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════ REPORTS TAB ═══════════════════════ */}
        {activeTab === 'reports' && (
          <div>
            {/* Filter bar */}
            <div className="flex" style={{ gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {['all', 'pending', 'acknowledged', 'dismissed', 'actioned'].map((f) => (
                <button
                  key={f}
                  onClick={() => setReportFilter(f)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    background: reportFilter === f ? '#E9A020' : '#FFFFFF',
                    color: reportFilter === f ? '#1C1917' : '#78716C',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (reportFilter !== f) e.currentTarget.style.background = '#E5E2DE';
                  }}
                  onMouseLeave={(e) => {
                    if (reportFilter !== f) e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Reports table */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E2DE',
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              <div className="overflow-x-auto">
              <div style={{ minWidth: '720px' }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 2fr 1fr 1fr',
                gap: '12px',
                padding: '12px 20px',
                borderBottom: '1px solid #E5E2DE',
                fontSize: '12px',
                fontWeight: 600,
                color: '#A8A29E',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                <div>Reporter / Reported</div>
                <div>Reason</div>
                <div>Description</div>
                <div>Date</div>
                <div>Status</div>
              </div>

              {reportsLoading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#A8A29E', fontSize: '14px' }}>
                  Loading reports...
                </div>
              ) : displayReports.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#A8A29E', fontSize: '14px' }}>
                  No reports found
                </div>
              ) : (
                displayReports.map((report) => {
                  const isExpanded = expandedReport === report.id;
                  const statusStyle = getReportStatusStyle(report.status);
                  const reasonStyle = getReasonStyle(report.reason);
                  const reportedStatus = getUserStatus(report);

                  return (
                    <div key={report.id}>
                      {/* Row */}
                      <div
                        onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 2fr 1fr 1fr',
                          gap: '12px',
                          padding: '14px 20px',
                          borderBottom: '1px solid #E5E2DE40',
                          cursor: 'pointer',
                          alignItems: 'center',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#E5E2DE20'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Reporter -> Reported */}
                        <div className="flex items-center" style={{ gap: '8px', minWidth: 0 }}>
                          <InitialsAvatar first={report.reporter_first_name} last={report.reporter_last_name} size={24} />
                          <span style={{ color: '#1C1917', fontSize: '13px', fontWeight: 500 }}>
                            @{report.reporter_username}
                          </span>
                          <ChevronRight style={{ width: '12px', height: '12px', color: '#A8A29E', flexShrink: 0 }} />
                          <InitialsAvatar first={report.reported_first_name} last={report.reported_last_name} size={24} bg="#EF444430" />
                          <span style={{ color: '#1C1917', fontSize: '13px', fontWeight: 500 }}>
                            @{report.reported_username}
                          </span>
                        </div>

                        {/* Reason badge */}
                        <div>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '99px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: reasonStyle.bg,
                            color: reasonStyle.color,
                          }}>
                            {report.reason}
                          </span>
                        </div>

                        {/* Description snippet */}
                        <div style={{
                          color: '#78716C',
                          fontSize: '13px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {report.description}
                        </div>

                        {/* Date */}
                        <div style={{ color: '#A8A29E', fontSize: '12px' }}>
                          {parseUTC(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>

                        {/* Status badge */}
                        <div>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '99px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            textTransform: 'capitalize',
                          }}>
                            {report.status}
                          </span>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div style={{
                          padding: '20px 20px 20px 44px',
                          borderBottom: '1px solid #E5E2DE',
                          background: '#F5F3F040',
                        }}>
                          {/* Full description */}
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ color: '#A8A29E', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                              Full Description
                            </div>
                            <div style={{ color: '#A8A29E', fontSize: '14px', lineHeight: 1.5 }}>
                              {report.description || 'No description provided.'}
                            </div>
                          </div>

                          {/* Reported user info */}
                          <div className="flex" style={{ gap: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ color: '#A8A29E', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                Reported User Status
                              </div>
                              <span style={{
                                display: 'inline-block',
                                padding: '3px 10px',
                                borderRadius: '99px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: reportedStatus.bg,
                                color: reportedStatus.color,
                              }}>
                                {reportedStatus.label}
                              </span>
                            </div>
                            {report.suspended_until && parseUTC(report.suspended_until) > new Date() && (
                              <div>
                                <div style={{ color: '#A8A29E', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                  Suspended Until
                                </div>
                                <span style={{ color: '#F59E0B', fontSize: '13px' }}>
                                  {parseUTC(report.suspended_until).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {report.ban_reason && (
                              <div>
                                <div style={{ color: '#A8A29E', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                  Ban Reason
                                </div>
                                <span style={{ color: '#EF4444', fontSize: '13px' }}>
                                  {report.ban_reason}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleReportAction(report.id, 'dismissed')}
                              disabled={actionLoading === report.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                border: '1px solid #E5E2DE',
                                background: '#FFFFFF',
                                color: '#78716C',
                                cursor: 'pointer',
                                opacity: actionLoading === report.id ? 0.5 : 1,
                              }}
                            >
                              <XCircle style={{ width: '14px', height: '14px' }} />
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, 'acknowledged')}
                              disabled={actionLoading === report.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '8px',
                                fontSize: '13px', fontWeight: 600, border: 'none',
                                background: '#C47F1420', color: '#C47F14',
                                cursor: 'pointer', opacity: actionLoading === report.id ? 0.5 : 1,
                              }}
                            >
                              <CheckCircle style={{ width: '14px', height: '14px' }} />
                              Acknowledge
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, 'actioned', {
                                user_id: report.reported_id,
                                action: 'suspend_7d',
                                reason: report.reason,
                              })}
                              disabled={actionLoading === report.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                border: 'none',
                                background: '#F59E0B20',
                                color: '#F59E0B',
                                cursor: 'pointer',
                                opacity: actionLoading === report.id ? 0.5 : 1,
                              }}
                            >
                              <Clock style={{ width: '14px', height: '14px' }} />
                              Suspend 7d
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, 'actioned', {
                                user_id: report.reported_id,
                                action: 'suspend_30d',
                                reason: report.reason,
                              })}
                              disabled={actionLoading === report.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                border: 'none',
                                background: '#F9731620',
                                color: '#F97316',
                                cursor: 'pointer',
                                opacity: actionLoading === report.id ? 0.5 : 1,
                              }}
                            >
                              <Clock style={{ width: '14px', height: '14px' }} />
                              Suspend 30d
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, 'actioned', {
                                user_id: report.reported_id,
                                action: 'ban',
                                reason: report.reason,
                              })}
                              disabled={actionLoading === report.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 600,
                                border: 'none',
                                background: '#EF444420',
                                color: '#EF4444',
                                cursor: 'pointer',
                                opacity: actionLoading === report.id ? 0.5 : 1,
                              }}
                            >
                              <Ban style={{ width: '14px', height: '14px' }} />
                              Ban
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            </div>
          </div>
          </div>
        )}

        {/* ═══════════════════════ USERS TAB ═══════════════════════ */}
        {activeTab === 'users' && (
          <div>
            {/* Search + sort row */}
            <div className="flex flex-col sm:flex-row" style={{ gap: '12px', marginBottom: '16px' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
                <Search style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  width: '18px', height: '18px', color: '#A8A29E',
                }} />
                <input
                  type="text"
                  placeholder="Search name, username, email, school (use commas to combine)..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    width: '100%', height: '44px', paddingLeft: '42px', paddingRight: '16px',
                    background: '#FFFFFF', border: '1px solid #E5E2DE', borderRadius: '10px',
                    color: '#1C1917', fontSize: '14px', outline: 'none',
                  }}
                />
              </div>

              {/* Sort */}
              <div className="flex" style={{ gap: '6px' }}>
                {[
                  { id: 'created_at', label: 'Newest' },
                  { id: 'first_name', label: 'Name' },
                  { id: 'report_count', label: 'Reports' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (userSort === s.id) {
                        setUserSortDir(d => d === 'DESC' ? 'ASC' : 'DESC');
                      } else {
                        setUserSort(s.id);
                        setUserSortDir(s.id === 'first_name' ? 'ASC' : 'DESC');
                      }
                      setUserPage(1);
                    }}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', border: '1px solid',
                      borderColor: userSort === s.id ? '#E9A020' : '#E5E2DE',
                      background: userSort === s.id ? '#E9A02015' : '#FFFFFF',
                      color: userSort === s.id ? '#C4850C' : '#78716C',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label} {userSort === s.id ? (userSortDir === 'DESC' ? '↓' : '↑') : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter pills */}
            <div className="flex" style={{ gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['all', 'active', 'suspended', 'banned'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setUserStatus(s); setUserPage(1); }}
                  style={{
                    padding: '5px 12px', borderRadius: '99px', border: '1px solid',
                    borderColor: userStatus === s ? '#E9A020' : '#E5E2DE',
                    background: userStatus === s ? '#E9A02015' : 'transparent',
                    color: userStatus === s ? '#C4850C' : '#78716C',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {s === 'all' ? 'All Users' : s}
                </button>
              ))}
            </div>

            {/* Result count */}
            <div style={{ fontSize: '12px', color: '#A8A29E', marginBottom: '12px' }}>
              {usersLoading ? 'Loading...' : `${userTotal} user${userTotal !== 1 ? 's' : ''} found`}
            </div>

            {/* Users table */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E2DE',
              borderRadius: '16px',
              overflow: 'hidden',
            }}>
              <div className="overflow-x-auto">
              <div style={{ minWidth: '680px' }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 0.8fr',
                gap: '12px',
                padding: '12px 20px',
                borderBottom: '1px solid #E5E2DE',
                background: '#FAFAF9',
              }}>
                {['User', 'University', 'Status', 'Joined', 'Reports'].map((h) => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </div>
                ))}
              </div>

              {usersLoading && displayUsers.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#A8A29E', fontSize: '14px' }}>
                  Loading users...
                </div>
              ) : displayUsers.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#A8A29E', fontSize: '14px' }}>
                  {userSearch ? 'No users match your search' : 'No users found'}
                </div>
              ) : (
                <div style={{ opacity: usersLoading ? 0.5 : 1, transition: 'opacity 0.15s ease' }}>
                {displayUsers.map((u) => {
                  const status = getUserStatus(u);
                  const isExpanded = expandedUser === u.id;
                  return (
                    <div key={u.id}>
                      <div
                        onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 0.8fr',
                          gap: '12px',
                          padding: '14px 20px',
                          borderBottom: '1px solid #E5E2DE40',
                          cursor: 'pointer',
                          alignItems: 'center',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#E5E2DE20'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* User info */}
                        <div className="flex items-center" style={{ gap: '10px', minWidth: 0 }}>
                          <InitialsAvatar first={u.first_name} last={u.last_name} size={32} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#1C1917', fontSize: '13px', fontWeight: 600 }}>
                              {u.first_name} {u.last_name}
                            </div>
                            <div style={{ color: '#A8A29E', fontSize: '12px' }}>
                              @{u.username} &middot; {u.email}
                            </div>
                          </div>
                        </div>

                        {/* University */}
                        <div style={{ color: '#78716C', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.university || '--'}
                        </div>

                        {/* Status */}
                        <div>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '99px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: status.bg,
                            color: status.color,
                          }}>
                            {status.label}
                          </span>
                        </div>

                        {/* Joined */}
                        <div style={{ color: '#A8A29E', fontSize: '12px' }}>
                          {parseUTC(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </div>

                        {/* Report count */}
                        <div style={{
                          color: u.report_count > 0 ? '#EF4444' : '#A8A29E',
                          fontSize: '13px',
                          fontWeight: u.report_count > 0 ? 600 : 400,
                        }}>
                          {u.report_count}
                        </div>
                      </div>

                      {/* Expanded actions */}
                      {isExpanded && (
                        <div style={{
                          padding: '16px 20px 16px 62px',
                          borderBottom: '1px solid #E5E2DE',
                          background: '#F5F3F040',
                        }}>
                          <div className="flex" style={{ gap: '8px', flexWrap: 'wrap' }}>
                            {!u.banned_at && (
                              <>
                                {u.suspended_until && parseUTC(u.suspended_until) > new Date() && (
                                  <button
                                    onClick={() => handleUserAction(u.id, 'unsuspend')}
                                    disabled={userActionLoading === u.id}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '6px',
                                      padding: '8px 14px', borderRadius: '8px',
                                      fontSize: '13px', fontWeight: 600, border: 'none',
                                      background: '#22C55E20', color: '#22C55E',
                                      cursor: 'pointer', opacity: userActionLoading === u.id ? 0.5 : 1,
                                    }}
                                  >
                                    <CheckCircle style={{ width: '14px', height: '14px' }} />
                                    Unsuspend
                                  </button>
                                )}
                                <button
                                  onClick={() => handleUserAction(u.id, 'suspend_7d', 'Admin action')}
                                  disabled={userActionLoading === u.id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', borderRadius: '8px',
                                    fontSize: '13px', fontWeight: 600, border: 'none',
                                    background: '#F59E0B20', color: '#F59E0B',
                                    cursor: 'pointer', opacity: userActionLoading === u.id ? 0.5 : 1,
                                  }}
                                >
                                  <Clock style={{ width: '14px', height: '14px' }} />
                                  Suspend 7d
                                </button>
                                <button
                                  onClick={() => handleUserAction(u.id, 'suspend_30d', 'Admin action')}
                                  disabled={userActionLoading === u.id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', borderRadius: '8px',
                                    fontSize: '13px', fontWeight: 600, border: 'none',
                                    background: '#F9731620', color: '#F97316',
                                    cursor: 'pointer', opacity: userActionLoading === u.id ? 0.5 : 1,
                                  }}
                                >
                                  <Clock style={{ width: '14px', height: '14px' }} />
                                  Suspend 30d
                                </button>
                                <button
                                  onClick={() => handleUserAction(u.id, 'ban', 'Admin action')}
                                  disabled={userActionLoading === u.id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', borderRadius: '8px',
                                    fontSize: '13px', fontWeight: 600, border: 'none',
                                    background: '#EF444420', color: '#EF4444',
                                    cursor: 'pointer', opacity: userActionLoading === u.id ? 0.5 : 1,
                                  }}
                                >
                                  <Ban style={{ width: '14px', height: '14px' }} />
                                  Ban
                                </button>
                              </>
                            )}
                            {u.banned_at && (
                              <button
                                onClick={() => handleUserAction(u.id, 'unban')}
                                disabled={userActionLoading === u.id}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  padding: '8px 14px', borderRadius: '8px',
                                  fontSize: '13px', fontWeight: 600, border: 'none',
                                  background: '#22C55E20', color: '#22C55E',
                                  cursor: 'pointer', opacity: userActionLoading === u.id ? 0.5 : 1,
                                }}
                              >
                                <CheckCircle style={{ width: '14px', height: '14px' }} />
                                Unban
                              </button>
                            )}
                            <button
                              onClick={() => handleImpersonate(u.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '8px',
                                fontSize: '13px', fontWeight: 600,
                                border: '1px solid #E5E2DE', background: '#FFFFFF',
                                color: '#78716C', cursor: 'pointer',
                              }}
                            >
                              <Eye style={{ width: '14px', height: '14px' }} />
                              View As
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              disabled={userActionLoading === u.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '8px',
                                fontSize: '13px', fontWeight: 600, border: 'none',
                                background: '#7F1D1D20', color: '#7F1D1D',
                                cursor: 'pointer', opacity: userActionLoading === u.id ? 0.5 : 1,
                              }}
                            >
                              <Trash2 style={{ width: '14px', height: '14px' }} />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              )}
              </div>
              </div>

              {/* Pagination */}
              {userTotalPages > 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px', borderTop: '1px solid #E5E2DE', background: '#FAFAF9',
                }}>
                  <div style={{ fontSize: '12px', color: '#A8A29E' }}>
                    Page {userPage} of {userTotalPages}
                  </div>
                  <div className="flex" style={{ gap: '6px' }}>
                    <button
                      onClick={() => setUserPage(p => Math.max(1, p - 1))}
                      disabled={userPage <= 1}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid #E5E2DE', background: '#FFFFFF',
                        cursor: userPage <= 1 ? 'default' : 'pointer',
                        opacity: userPage <= 1 ? 0.4 : 1,
                      }}
                    >
                      <ChevronLeft style={{ width: '16px', height: '16px', color: '#78716C' }} />
                    </button>
                    {Array.from({ length: Math.min(5, userTotalPages) }, (_, i) => {
                      let pageNum: number;
                      if (userTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (userPage <= 3) {
                        pageNum = i + 1;
                      } else if (userPage >= userTotalPages - 2) {
                        pageNum = userTotalPages - 4 + i;
                      } else {
                        pageNum = userPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setUserPage(pageNum)}
                          style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            border: '1px solid',
                            borderColor: userPage === pageNum ? '#E9A020' : '#E5E2DE',
                            background: userPage === pageNum ? '#E9A02015' : '#FFFFFF',
                            color: userPage === pageNum ? '#C4850C' : '#78716C',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                      disabled={userPage >= userTotalPages}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid #E5E2DE', background: '#FFFFFF',
                        cursor: userPage >= userTotalPages ? 'default' : 'pointer',
                        opacity: userPage >= userTotalPages ? 0.4 : 1,
                      }}
                    >
                      <ChevronRight style={{ width: '16px', height: '16px', color: '#78716C' }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════ REVENUE TAB ═══════════════════════ */}
        {activeTab === 'revenue' && (
          <div>
            {/* Period selector */}
            <div className="flex" style={{ gap: '8px', marginBottom: '24px' }}>
              {[
                { id: '7d', label: '7 days' },
                { id: '30d', label: '30 days' },
                { id: '90d', label: '90 days' },
                { id: 'all', label: 'All time' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRevenuePeriod(p.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: revenuePeriod === p.id ? '#E9A020' : '#FFFFFF',
                    color: revenuePeriod === p.id ? '#1C1917' : '#78716C',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (revenuePeriod !== p.id) e.currentTarget.style.background = '#E5E2DE';
                  }}
                  onMouseLeave={(e) => {
                    if (revenuePeriod !== p.id) e.currentTarget.style.background = '#FFFFFF';
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Revenue stat cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: '20px',
              marginBottom: '32px',
            }}>
              <StatCard
                icon={DollarSign}
                label="Service Fees"
                value={revenue?.service_fees || 0}
                prefix="$"
                color="#E9A020"
              />
              <StatCard
                icon={ShoppingBag}
                label="Shop Revenue"
                value={revenue?.shop_revenue || 0}
                prefix="$"
                color="#9A5F10"
              />
              <StatCard
                icon={BarChart3}
                label="Total Revenue"
                value={revenue?.total_revenue || 0}
                prefix="$"
                color="#E9A020"
              />
              <StatCard
                icon={Package}
                label="Avg Order Value"
                value={revenue?.avg_order_value || 0}
                prefix="$"
                color="#C47F14"
              />
            </div>

            {/* Stacked area chart */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E2DE',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '32px',
            }}>
              <div className="font-bold" style={{ color: '#1C1917', fontSize: '16px', marginBottom: '20px' }}>
                Revenue Breakdown
              </div>
              <div style={{ height: '300px' }}>
                {revenueAreaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueAreaData}>
                      <defs>
                        <linearGradient id="gradFees" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E9A020" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#E9A020" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradShop" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9A5F10" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#9A5F10" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        stroke="#A8A29E"
                        tick={{ fill: '#78716C', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E2DE' }}
                      />
                      <YAxis
                        stroke="#A8A29E"
                        tick={{ fill: '#78716C', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="fees"
                        name="Service Fees"
                        stroke="#E9A020"
                        strokeWidth={2}
                        fill="url(#gradFees)"
                        stackId="1"
                      />
                      <Area
                        type="monotone"
                        dataKey="shop"
                        name="Shop Revenue"
                        stroke="#9A5F10"
                        strokeWidth={2}
                        fill="url(#gradShop)"
                        stackId="1"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center" style={{
                    height: '100%',
                    justifyContent: 'center',
                    color: '#A8A29E',
                    fontSize: '14px',
                  }}>
                    {revenueLoading ? 'Loading chart...' : 'No data for selected period'}
                  </div>
                )}
              </div>
              <div className="flex items-center" style={{ gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <div style={{ width: '12px', height: '3px', background: '#E9A020', borderRadius: '2px' }} />
                  <span style={{ color: '#78716C', fontSize: '12px' }}>Service Fees</span>
                </div>
                <div className="flex items-center" style={{ gap: '6px' }}>
                  <div style={{ width: '12px', height: '3px', background: '#9A5F10', borderRadius: '2px' }} />
                  <span style={{ color: '#78716C', fontSize: '12px' }}>Shop Revenue</span>
                </div>
              </div>
            </div>

            {/* Two tables side by side */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
              gap: '20px',
            }}>
              {/* Top Shop Items */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E2DE',
                borderRadius: '16px',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '20px 20px 12px' }}>
                  <div className="font-bold" style={{ color: '#1C1917', fontSize: '16px' }}>
                    Top Items
                  </div>
                </div>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 0.8fr 1fr',
                  gap: '8px',
                  padding: '8px 20px',
                  borderBottom: '1px solid #E5E2DE',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#A8A29E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <div>Name</div>
                  <div>Type</div>
                  <div>Sales</div>
                  <div>Revenue</div>
                </div>
                {revenue?.top_items && revenue.top_items.length > 0 ? (
                  revenue.top_items.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 0.8fr 1fr',
                        gap: '8px',
                        padding: '12px 20px',
                        borderBottom: '1px solid #E5E2DE40',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ color: '#1C1917', fontSize: '13px', fontWeight: 500 }}>{item.name}</div>
                      <div>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '99px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: item.type === 'service' ? '#E9A02020' : '#9A5F1020',
                          color: item.type === 'service' ? '#E9A020' : '#9A5F10',
                          textTransform: 'capitalize',
                        }}>
                          {item.type}
                        </span>
                      </div>
                      <div style={{ color: '#78716C', fontSize: '13px' }}>{item.purchases}</div>
                      <div className="font-mono" style={{ color: '#E9A020', fontSize: '13px', fontWeight: 600 }}>
                        ${Number(item.revenue).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#A8A29E', fontSize: '13px' }}>
                    {revenueLoading ? 'Loading...' : 'No items data'}
                  </div>
                )}
              </div>

              {/* Top Categories */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E5E2DE',
                borderRadius: '16px',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '20px 20px 12px' }}>
                  <div className="font-bold" style={{ color: '#1C1917', fontSize: '16px' }}>
                    Top Categories
                  </div>
                </div>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  gap: '8px',
                  padding: '8px 20px',
                  borderBottom: '1px solid #E5E2DE',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#A8A29E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <div>Category</div>
                  <div>Orders</div>
                  <div>Fees</div>
                </div>
                {revenue?.top_categories && revenue.top_categories.length > 0 ? (
                  revenue.top_categories.map((cat, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr',
                        gap: '8px',
                        padding: '12px 20px',
                        borderBottom: '1px solid #E5E2DE40',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ color: '#1C1917', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>
                        {cat.category}
                      </div>
                      <div style={{ color: '#78716C', fontSize: '13px' }}>{cat.order_count}</div>
                      <div className="font-mono" style={{ color: '#E9A020', fontSize: '13px', fontWeight: 600 }}>
                        ${Number(cat.fees).toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', color: '#A8A29E', fontSize: '13px' }}>
                    {revenueLoading ? 'Loading...' : 'No category data'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════ ORDERS TAB ═══════════════════════ */}
        {activeTab === 'orders' && (
          <div>
            {/* Search + time filter row */}
            <div className="flex flex-col sm:flex-row" style={{ gap: '12px', marginBottom: '16px' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
                <Search style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  width: '18px', height: '18px', color: '#A8A29E',
                }} />
                <input
                  type="text"
                  placeholder="Search by service, buyer, seller, or order #..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{
                    width: '100%', height: '44px', paddingLeft: '42px', paddingRight: '16px',
                    background: '#FFFFFF', border: '1px solid #E5E2DE', borderRadius: '10px',
                    color: '#1C1917', fontSize: '14px', outline: 'none',
                  }}
                />
              </div>

              {/* Time period */}
              <div className="flex" style={{ gap: '6px' }}>
                {[
                  { id: '7d', label: '7d' },
                  { id: '30d', label: '30d' },
                  { id: '90d', label: '90d' },
                  { id: 'all', label: 'All time' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setOrderPeriod(p.id); setOrderPage(1); }}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', border: '1px solid',
                      borderColor: orderPeriod === p.id ? '#E9A020' : '#E5E2DE',
                      background: orderPeriod === p.id ? '#E9A02015' : '#FFFFFF',
                      color: orderPeriod === p.id ? '#C4850C' : '#78716C',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter pills */}
            <div className="flex" style={{ gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['all', 'pending', 'in_progress', 'awaiting_completion', 'completed', 'cancelled', 'disputed'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setOrderFilter(s); setOrderPage(1); }}
                  style={{
                    padding: '5px 12px', borderRadius: '99px', border: '1px solid',
                    borderColor: orderFilter === s ? '#E9A020' : '#E5E2DE',
                    background: orderFilter === s ? '#E9A02015' : 'transparent',
                    color: orderFilter === s ? '#C4850C' : '#78716C',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Result count */}
            <div style={{ fontSize: '12px', color: '#A8A29E', marginBottom: '12px' }}>
              {ordersLoading ? 'Loading...' : `${orderTotal} order${orderTotal !== 1 ? 's' : ''} found`}
            </div>

            {/* Orders table */}
            <div style={{
              background: '#FFFFFF', border: '1px solid #E5E2DE',
              borderRadius: '16px', overflow: 'hidden',
            }}>
              <div className="overflow-x-auto">
              <div style={{ minWidth: '800px' }}>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '0.5fr 2fr 1.5fr 1.5fr 1fr 0.8fr 1fr',
                gap: '12px', padding: '12px 20px',
                borderBottom: '1px solid #E5E2DE', background: '#FAFAF9',
              }}>
                {['ID', 'Service', 'Buyer', 'Seller', 'Status', 'Total', 'Date'].map((h) => (
                  <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {ordersLoading && adminOrders.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#A8A29E', fontSize: '14px' }}>
                  Loading orders...
                </div>
              ) : adminOrders.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: '#A8A29E', fontSize: '14px' }}>
                  {orderSearch ? 'No orders match your search' : 'No orders found'}
                </div>
              ) : (
                <div style={{ opacity: ordersLoading ? 0.5 : 1, transition: 'opacity 0.15s ease' }}>
                  {adminOrders.map((order) => {
                    const statusColors: Record<string, { bg: string; text: string }> = {
                      pending: { bg: '#FEF3C7', text: '#92400E' },
                      in_progress: { bg: '#DBEAFE', text: '#1E40AF' },
                      awaiting_completion: { bg: '#E0E7FF', text: '#3730A3' },
                      completed: { bg: '#D1FAE5', text: '#065F46' },
                      cancelled: { bg: '#FEE2E2', text: '#991B1B' },
                      disputed: { bg: '#FED7AA', text: '#9A3412' },
                    };
                    const sc = statusColors[order.status] || { bg: '#F5F5F4', text: '#57534E' };
                    const dateStr = parseUTC(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });

                    return (
                      <div
                        key={order.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '0.5fr 2fr 1.5fr 1.5fr 1fr 0.8fr 1fr',
                          gap: '12px', padding: '14px 20px',
                          borderBottom: '1px solid #F5F5F4', alignItems: 'center',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#E5E2DE20'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* ID */}
                        <div className="font-mono" style={{ color: '#A8A29E', fontSize: '12px' }}>
                          #{order.id}
                        </div>

                        {/* Service */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#1C1917', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.service_title}
                          </div>
                          <div style={{ color: '#A8A29E', fontSize: '11px', textTransform: 'capitalize' }}>
                            {order.service_category}
                          </div>
                        </div>

                        {/* Buyer */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#1C1917', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.buyer_first_name} {order.buyer_last_name}
                          </div>
                          <div style={{ color: '#A8A29E', fontSize: '11px' }}>
                            @{order.buyer_username}
                          </div>
                        </div>

                        {/* Seller */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#1C1917', fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.seller_first_name} {order.seller_last_name}
                          </div>
                          <div style={{ color: '#A8A29E', fontSize: '11px' }}>
                            @{order.seller_username}
                          </div>
                        </div>

                        {/* Status */}
                        <div>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
                            fontSize: '11px', fontWeight: 600, textTransform: 'capitalize',
                            backgroundColor: sc.bg, color: sc.text, whiteSpace: 'nowrap',
                          }}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Total */}
                        <div className="font-mono" style={{ color: '#1C1917', fontSize: '13px', fontWeight: 600 }}>
                          ⬡ {order.total}
                        </div>

                        {/* Date */}
                        <div style={{ color: '#78716C', fontSize: '12px' }}>
                          {dateStr}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
              </div>

              {/* Pagination */}
              {orderTotalPages > 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 20px', borderTop: '1px solid #E5E2DE', background: '#FAFAF9',
                }}>
                  <div style={{ fontSize: '12px', color: '#A8A29E' }}>
                    Page {orderPage} of {orderTotalPages}
                  </div>
                  <div className="flex" style={{ gap: '6px' }}>
                    <button
                      onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                      disabled={orderPage <= 1}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid #E5E2DE', background: '#FFFFFF',
                        cursor: orderPage <= 1 ? 'default' : 'pointer',
                        opacity: orderPage <= 1 ? 0.4 : 1,
                      }}
                    >
                      <ChevronLeft style={{ width: '16px', height: '16px', color: '#78716C' }} />
                    </button>
                    {/* Page number buttons — show up to 5 pages */}
                    {Array.from({ length: Math.min(5, orderTotalPages) }, (_, i) => {
                      let pageNum: number;
                      if (orderTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (orderPage <= 3) {
                        pageNum = i + 1;
                      } else if (orderPage >= orderTotalPages - 2) {
                        pageNum = orderTotalPages - 4 + i;
                      } else {
                        pageNum = orderPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setOrderPage(pageNum)}
                          style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            border: '1px solid',
                            borderColor: orderPage === pageNum ? '#E9A020' : '#E5E2DE',
                            background: orderPage === pageNum ? '#E9A02015' : '#FFFFFF',
                            color: orderPage === pageNum ? '#C4850C' : '#78716C',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setOrderPage(p => Math.min(orderTotalPages, p + 1))}
                      disabled={orderPage >= orderTotalPages}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', borderRadius: '8px',
                        border: '1px solid #E5E2DE', background: '#FFFFFF',
                        cursor: orderPage >= orderTotalPages ? 'default' : 'pointer',
                        opacity: orderPage >= orderTotalPages ? 0.4 : 1,
                      }}
                    >
                      <ChevronRight style={{ width: '16px', height: '16px', color: '#78716C' }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Feature Toggles */}
            <div style={{ background: '#FDFCFA', border: '1px solid #E5E2DE', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: '#131210', marginBottom: '4px' }}>Feature Toggles</h2>
              <p style={{ fontSize: '13px', color: '#78716C', marginBottom: '20px' }}>Enable or disable platform features. Changes take effect immediately for all users.</p>

              {settingsLoading ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#A8A29E' }}>Loading settings...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {[
                    { key: 'feature_requests', label: 'Requests', description: 'Service requests & proposals — allows users to post requests and providers to submit proposals' },
                    { key: 'feature_shop', label: 'HiveShop', description: 'Cosmetics store — users can browse and purchase frames, badges, and themes with HiveCoins' },
                    { key: 'feature_messaging', label: 'Messaging', description: 'Direct messages — users can send and receive messages in conversations' },
                    { key: 'feature_leaderboard', label: 'Leaderboard', description: 'Provider rankings — displays top providers based on ratings and activity' },
                    { key: 'feature_docs', label: 'Docs Pages', description: 'Public docs + sprint documentation pages — hides /docs and /sprints when disabled' },
                    { key: 'mock_data', label: 'Mock Data', description: 'Use static mock data for Discover page instead of live API — useful when backend endpoints are not yet deployed' },
                  ].map((feature, idx) => (
                    <div key={feature.key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 0',
                      borderBottom: idx < 5 ? '1px solid #E5E2DE' : 'none',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: '#131210' }}>{feature.label}</div>
                        <div style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px', maxWidth: '480px' }}>{feature.description}</div>
                      </div>
                      <button
                        onClick={() => toggleFeature(feature.key)}
                        disabled={settingsSaving === feature.key}
                        style={{
                          width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                          background: systemSettings[feature.key] === '1' ? '#E9A020' : '#D6D3CE',
                          position: 'relative', transition: 'background 0.2s',
                          opacity: settingsSaving === feature.key ? 0.5 : 1,
                          flexShrink: 0,
                        }}
                      >
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '10px', background: '#FFFFFF',
                          position: 'absolute', top: '2px',
                          left: systemSettings[feature.key] === '1' ? '22px' : '2px',
                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }} />
                      </button>
                    </div>
                  ))}

                  {/* Bypass Code */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid #E5E2DE' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: '#131210' }}>Universal Bypass Code</div>
                      <div style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px', maxWidth: '480px' }}>
                        Master code that works for email verification and password reset. Leave empty to disable. Useful when email delivery is unavailable.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexShrink: 0 }}>
                      <div style={{ minWidth: '120px' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          placeholder="e.g. 696969"
                          value={systemSettings['bypass_code'] ?? ''}
                          maxLength={10}
                          onChange={e => setSystemSettings(prev => ({ ...prev, bypass_code: e.target.value }))}
                          style={{
                            width: '120px', height: '36px', padding: '0 12px', borderRadius: '8px',
                            border: '1.5px solid #E5E2DE', background: '#FDFCFA', fontSize: '14px',
                            fontFamily: 'monospace', color: '#131210', outline: 'none',
                            textAlign: 'center', letterSpacing: '2px',
                          }}
                          onFocus={e => { e.target.style.borderColor = '#E9A020'; }}
                          onBlur={e => { e.target.style.borderColor = '#E5E2DE'; }}
                        />
                        <CharacterLimitHint current={(systemSettings['bypass_code'] ?? '').length} max={10} className="mt-1" />
                      </div>
                      <button
                        onClick={async () => {
                          const val = (systemSettings['bypass_code'] ?? '').trim();
                          if (val !== '' && !/^\d{4,10}$/.test(val)) {
                            toast.error('Bypass code must be 4-10 digits or empty to disable');
                            return;
                          }
                          setSettingsSaving('bypass_code');
                          try {
                            await apiPatch('/admin/settings.php', { bypass_code: val });
                            toast.success(val ? 'Bypass code updated' : 'Bypass code disabled');
                          } catch {
                            toast.error('Failed to update bypass code');
                          } finally {
                            setSettingsSaving(null);
                          }
                        }}
                        disabled={settingsSaving === 'bypass_code'}
                        style={{
                          height: '36px', padding: '0 14px', borderRadius: '8px', border: 'none',
                          background: '#E9A020', color: '#FFFFFF', fontSize: '13px', fontWeight: 600,
                          cursor: 'pointer', opacity: settingsSaving === 'bypass_code' ? 0.5 : 1,
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Rate Limiting */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid #E5E2DE' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: '#131210' }}>Rate Limiting</div>
                      <div style={{ fontSize: '12px', color: '#A8A29E', marginTop: '2px', maxWidth: '480px' }}>
                        Throttle login, signup, and password reset attempts per IP. Disable when stress testing from the same network.
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', flexShrink: 0 }}>
                      <button
                        onClick={() => toggleFeature('rate_limit_enabled')}
                        disabled={settingsSaving === 'rate_limit_enabled'}
                        style={{
                          width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                          background: systemSettings['rate_limit_enabled'] === '1' ? '#E9A020' : '#D6D3CE',
                          position: 'relative', transition: 'background 0.2s',
                          opacity: settingsSaving === 'rate_limit_enabled' ? 0.5 : 1,
                        }}
                      >
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '10px', background: '#FFFFFF',
                          position: 'absolute', top: '2px',
                          left: systemSettings['rate_limit_enabled'] === '1' ? '22px' : '2px',
                          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }} />
                      </button>
                      {systemSettings['rate_limit_enabled'] === '1' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number" min="1" max="999"
                                value={systemSettings['rate_limit_max_attempts'] ?? '10'}
                                onChange={e => setSystemSettings(prev => ({ ...prev, rate_limit_max_attempts: e.target.value }))}
                                style={{ width: '56px', height: '32px', padding: '0 6px', borderRadius: '6px', border: '1.5px solid #E5E2DE', background: '#FDFCFA', fontSize: '13px', textAlign: 'center', color: '#131210', outline: 'none' }}
                              />
                              <span style={{ fontSize: '12px', color: '#78716C' }}>attempts /</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input
                                type="number" min="1" max="1440"
                                value={systemSettings['rate_limit_window_minutes'] ?? '15'}
                                onChange={e => setSystemSettings(prev => ({ ...prev, rate_limit_window_minutes: e.target.value }))}
                                style={{ width: '56px', height: '32px', padding: '0 6px', borderRadius: '6px', border: '1.5px solid #E5E2DE', background: '#FDFCFA', fontSize: '13px', textAlign: 'center', color: '#131210', outline: 'none' }}
                              />
                              <span style={{ fontSize: '12px', color: '#78716C' }}>min</span>
                            </div>
                            <button
                              onClick={async () => {
                                const maxA = systemSettings['rate_limit_max_attempts'] ?? '10';
                                const winM = systemSettings['rate_limit_window_minutes'] ?? '15';
                                if (!/^\d+$/.test(maxA) || parseInt(maxA) < 1 || !/^\d+$/.test(winM) || parseInt(winM) < 1) {
                                  toast.error('Values must be positive integers');
                                  return;
                                }
                                setSettingsSaving('rate_limit_config');
                                try {
                                  await apiPatch('/admin/settings.php', { rate_limit_max_attempts: maxA, rate_limit_window_minutes: winM });
                                  toast.success('Rate limit config saved');
                                } catch {
                                  toast.error('Failed to update rate limit config');
                                } finally {
                                  setSettingsSaving(null);
                                }
                              }}
                              disabled={settingsSaving === 'rate_limit_config'}
                              style={{
                                height: '32px', padding: '0 12px', borderRadius: '6px', border: 'none',
                                background: '#E9A020', color: '#FFFFFF', fontSize: '12px', fontWeight: 600,
                                cursor: 'pointer', opacity: settingsSaving === 'rate_limit_config' ? 0.5 : 1,
                              }}
                            >
                              Save
                            </button>
                          </div>
                          <span style={{ fontSize: '11px', color: '#A8A29E' }}>
                            Range: 1-999 attempts, 1-1440 minutes
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Account */}
            <div style={{ background: '#FDFCFA', border: '1px solid #E5E2DE', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '16px', color: '#131210', marginBottom: '4px' }}>Admin Account</h2>
              <p style={{ fontSize: '13px', color: '#78716C', marginBottom: '20px' }}>Manage your admin email and password.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: '24px' }}>

                {/* Change Email */}
                <form onSubmit={handleAdminEmailChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: '#131210' }}>Change Email</h3>
                  <p style={{ fontSize: '12px', color: '#A8A29E' }}>Current: {user?.email}</p>
                  {adminEmailError && (
                    <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#DC2626' }}>{adminEmailError}</div>
                  )}
                  <input
                    type="email"
                    value={adminEmailData.newEmail}
                    onChange={e => setAdminEmailData(prev => ({ ...prev, newEmail: e.target.value }))}
                    placeholder="New email address"
                    maxLength={100}
                    className="w-full h-11 px-3.5 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
                  />
                  <CharacterLimitHint current={adminEmailData.newEmail.length} max={100} />
                  <div className="relative">
                    <input
                      type={showAdminEmailPassword ? 'text' : 'password'}
                      value={adminEmailData.password}
                      onChange={e => setAdminEmailData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Current password"
                      maxLength={72}
                      className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
                    />
                    <button type="button" onClick={() => setShowAdminEmailPassword(!showAdminEmailPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                      {showAdminEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <CharacterLimitHint current={adminEmailData.password.length} max={72} />
                  <button
                    type="submit"
                    disabled={adminEmailSaving || !adminEmailData.newEmail || !adminEmailData.password}
                    className="h-10 px-5 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-fit"
                  >
                    {adminEmailSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Update Email'}
                  </button>
                </form>

                {/* Change Password */}
                <form onSubmit={handleAdminPasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', color: '#131210' }}>Change Password</h3>
                  {adminPasswordError && (
                    <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', fontSize: '13px', color: '#DC2626' }}>{adminPasswordError}</div>
                  )}
                  <div className="relative">
                    <input
                      type={showAdminOldPassword ? 'text' : 'password'}
                      value={adminPasswordData.oldPassword}
                      onChange={e => setAdminPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                      placeholder="Current password"
                      maxLength={72}
                      className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
                    />
                    <button type="button" onClick={() => setShowAdminOldPassword(!showAdminOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                      {showAdminOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <CharacterLimitHint current={adminPasswordData.oldPassword.length} max={72} />
                  <div className="relative">
                    <input
                      type={showAdminNewPassword ? 'text' : 'password'}
                      value={adminPasswordData.newPassword}
                      onChange={e => setAdminPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="New password"
                      maxLength={72}
                      className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
                    />
                    <button type="button" onClick={() => setShowAdminNewPassword(!showAdminNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                      {showAdminNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <CharacterLimitHint current={adminPasswordData.newPassword.length} max={72} />
                  {adminPasswordData.newPassword && (
                    <div>
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex-1 rounded-full transition-all ${i <= adminStrength ? adminStrengthColors[adminStrength] : 'bg-charcoal-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-charcoal-500 mt-1">{adminStrengthLabels[adminStrength]} &bull; 8–72 characters, one number, one uppercase</p>
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type={showAdminConfirmPassword ? 'text' : 'password'}
                      value={adminPasswordData.confirmPassword}
                      onChange={e => setAdminPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      maxLength={72}
                      className="w-full h-11 px-3.5 pr-10 rounded-md border-[1.5px] border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none transition-all focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100"
                    />
                    <button type="button" onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600">
                      {showAdminConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <CharacterLimitHint current={adminPasswordData.confirmPassword.length} max={72} />
                  <button
                    type="submit"
                    disabled={adminPasswordSaving || !adminPasswordData.oldPassword || !adminPasswordData.newPassword || !adminPasswordData.confirmPassword}
                    className="h-10 px-5 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-fit"
                  >
                    {adminPasswordSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '11px', color: '#D6D3CE' }}>
          <Link to="/terms" style={{ color: '#D6D3CE', textDecoration: 'none' }}>Terms</Link>
          <Link to="/privacy" style={{ color: '#D6D3CE', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/team" style={{ color: '#D6D3CE', textDecoration: 'none' }}>Team</Link>
        </div>
      </div>
    </div>
  );
}
