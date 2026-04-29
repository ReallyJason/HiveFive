import { Link, useLocation, useNavigate } from 'react-router';
import { Bell, Menu, X, ShoppingBag, MessageCircle, Package, CreditCard, FileText, Star, Shield } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useFeatures } from '../lib/features';
import { apiGet, apiPatch } from '../lib/api';
import { Avatar } from './Avatar';
import { ImpersonationBanner } from './ImpersonationBanner';
import { parseUTC } from '../lib/constants';
import { toast } from 'sonner@2.0.3';
import {
  dispatchNotificationsRefresh,
  initInAppSounds,
  playAlertSound,
  subscribeNotificationsRefresh,
} from '../lib/inAppAlerts';

interface Notification {
  id: number;
  type: 'message' | 'order' | 'order_status' | 'payment' | 'proposal' | 'review';
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  actor_first_name: string | null;
  actor_last_name: string | null;
}

interface NotifResponse {
  notifications: Notification[];
  unread_count: number;
}

interface NavBarProps {
  variant?: 'logged-out' | 'logged-in';
}

export function NavBar({ variant: variantProp }: NavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const features = useFeatures();

  const variant = variantProp ?? (isLoggedIn ? 'logged-in' : 'logged-out');
  const isAdmin = user?.role === 'admin' && !user?.impersonating;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifFetchedRef = useRef(false);
  const knownNotifIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (isLoggedIn) {
      initInAppSounds();
      return;
    }

    notifFetchedRef.current = false;
    knownNotifIdsRef.current = new Set();
  }, [isLoggedIn]);

  const isNotificationContextVisible = useCallback((notif: Notification) => {
    if (!notif.link || typeof window === 'undefined') return false;

    try {
      const target = new URL(notif.link, window.location.origin);
      if (target.pathname === '/messages') {
        if (location.pathname !== '/messages') return false;

        const targetConversationId = target.searchParams.get('conversationId');
        if (!targetConversationId) return true;

        const currentConversationId = new URLSearchParams(location.search).get('conversationId');
        return currentConversationId === targetConversationId;
      }

      return location.pathname === target.pathname;
    } catch {
      return false;
    }
  }, [location.pathname, location.search]);

  const handleNotificationOpen = useCallback(async (notif: Notification, closePanel = true) => {
    if (closePanel) setShowNotifications(false);

    if (!notif.is_read) {
      try {
        const res = await apiPatch<{ unread_count: number }>('/notifications/read.php', { id: notif.id });
        setUnreadCount(res.unread_count);
        setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
      } catch { /* silent */ }
    }

    if (notif.link && notif.link.startsWith('/')) navigate(notif.link);
  }, [navigate]);

  const emitInAppAlert = useCallback((notif: Notification) => {
    if (isNotificationContextVisible(notif)) return;

    playAlertSound(notif.type === 'message' ? 'message' : 'notification');
    toast(notif.title, {
      description: notif.body,
      action: notif.link
        ? {
            label: 'Open',
            onClick: () => {
              void handleNotificationOpen(notif, false);
            },
          }
        : undefined,
    });
  }, [handleNotificationOpen, isNotificationContextVisible]);

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await apiGet<NotifResponse>('/notifications/list.php', { limit: 20 });
      const freshUnread = data.notifications.filter(
        (notif) => !notif.is_read && !knownNotifIdsRef.current.has(notif.id)
      );

      if (notifFetchedRef.current) {
        freshUnread.slice().reverse().forEach(emitInAppAlert);
      }

      data.notifications.forEach((notif) => {
        knownNotifIdsRef.current.add(notif.id);
      });
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
      notifFetchedRef.current = true;
    } catch { /* silent */ }
  }, [emitInAppAlert, isLoggedIn]);

  // Initial fetch + poll every 15s
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!notifFetchedRef.current) {
      fetchNotifications();
    }
    const interval = setInterval(fetchNotifications, 15000);
    const onVisChange = () => {
      if (document.visibilityState === 'visible') fetchNotifications();
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [isLoggedIn, fetchNotifications]);

  useEffect(() => subscribeNotificationsRefresh(fetchNotifications), [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await apiPatch<{ unread_count: number }>('/notifications/read.php', {});
      setUnreadCount(res.unread_count);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      dispatchNotificationsRefresh();
    } catch { /* silent */ }
  };

  function notifIcon(type: Notification['type']) {
    const cls = "size-3.5 text-honey-700";
    switch (type) {
      case 'message':      return <MessageCircle className={cls} />;
      case 'order':        return <Package className={cls} />;
      case 'order_status': return <Package className={cls} />;
      case 'payment':      return <CreditCard className={cls} />;
      case 'proposal':     return <FileText className={cls} />;
      case 'review':       return <Star className={cls} />;
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - parseUTC(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return parseUTC(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const isActive = (path: string) => location.pathname === path;

  const initial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'U';
  const balance = (user?.hivecoin_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

  const handleLogout = async () => {
    setShowAvatarDropdown(false);
    await logout();
    navigate('/');
  };

  return (
    <>
      <ImpersonationBanner />
      <nav className="h-16 bg-cream-50/80 backdrop-blur-md border-b border-charcoal-100 shadow-sm sticky top-0 z-50" style={{ marginTop: user?.impersonating ? 40 : 0 }}>
        <div className="flex items-center justify-between px-4 md:px-16 h-full max-w-full">
          {/* Logo */}
          <Link
            to={variant === 'logged-in' ? '/discover' : '/'}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-6 h-6 rounded-md bg-honey-500 flex items-center justify-center">
              <span className="text-charcoal-900 font-bold text-sm">H</span>
            </div>
            <span className="font-sans font-bold text-base text-charcoal-900 tracking-tight">
              hive<span className="text-[18px] text-honey-600" style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>five</span>
            </span>
          </Link>

          {variant === 'logged-out' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="text-charcoal-600 hover:text-charcoal-900 text-sm font-sans transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-honey-500 text-charcoal-900 hover:bg-honey-600 font-bold text-sm px-5 py-2 rounded-md transition-all hover:scale-[1.02]"
              >
                Get Started
              </button>
            </div>
          )}

          {variant === 'logged-in' && (
            <>
              {/* Center Nav Links - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-8">
                {user?.role === 'admin' && !user?.impersonating && (
                  <Link to="/admin" className={`text-sm font-sans relative transition-colors ${isActive('/admin') ? 'font-bold text-charcoal-900' : 'text-charcoal-400 hover:text-charcoal-700'}`}>
                    Admin
                    {isActive('/admin') && <div className="absolute" style={{ bottom: -17, left: 0, right: 0, height: 2, backgroundColor: '#E9A020' }} />}
                  </Link>
                )}
                <Link
                  to="/discover"
                  className={`text-sm font-sans relative transition-colors ${
                    isActive('/discover')
                      ? 'font-bold text-charcoal-900'
                      : 'font-normal text-charcoal-400 hover:text-charcoal-600'
                  }`}
                >
                  Discover
                  {isActive('/discover') && (
                    <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-honey-500" />
                  )}
                </Link>
                {!isAdmin && (
                  <>
                    <Link
                      to="/post-service"
                      className={`text-sm font-sans relative transition-colors whitespace-nowrap ${
                        isActive('/post-service')
                          ? 'font-bold text-charcoal-900'
                          : 'font-normal text-charcoal-400 hover:text-charcoal-600'
                      }`}
                    >
                      Post Service
                      {isActive('/post-service') && (
                        <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-honey-500" />
                      )}
                    </Link>
                    {features.messaging && (
                      <Link
                        to="/messages"
                        className={`text-sm font-sans relative transition-colors ${
                          isActive('/messages')
                            ? 'font-bold text-charcoal-900'
                            : 'font-normal text-charcoal-400 hover:text-charcoal-600'
                        }`}
                      >
                        Messages
                        {isActive('/messages') && (
                          <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-honey-500" />
                        )}
                      </Link>
                    )}
                  </>
                )}
                {features.leaderboard && (
                  <Link
                    to="/leaderboard"
                    className={`text-sm font-sans relative transition-colors ${
                      isActive('/leaderboard')
                        ? 'font-bold text-charcoal-900'
                        : 'font-normal text-charcoal-400 hover:text-charcoal-600'
                    }`}
                  >
                    Leaderboard
                    {isActive('/leaderboard') && (
                      <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-honey-500" />
                    )}
                  </Link>
                )}
              </div>

              {/* Right Cluster */}
              <div className="flex items-center gap-3 md:gap-5">
                {/* Bell Icon */}
                {!isAdmin && features.messaging && (
                  <div className="relative flex items-center">
                    <button
                      onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications) fetchNotifications(); }}
                      className="text-charcoal-400 hover:text-charcoal-600 transition-colors relative p-1"
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowNotifications(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-72 bg-cream-50 border border-charcoal-100 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="px-3 py-2 border-b border-charcoal-100 flex justify-between items-center">
                            <span className="font-sans font-bold text-xs text-charcoal-900">
                              Notifications
                            </span>
                            {unreadCount > 0 && (
                              <button onClick={handleMarkAllRead} className="text-[11px] text-honey-600 hover:text-honey-700">
                                Mark all read
                              </button>
                            )}
                          </div>
                          <div
                            className="scrollbar-hide"
                            style={{ maxHeight: 280, overflowY: 'auto' }}
                          >
                            {notifications.length === 0 ? (
                              <div className="px-3 py-6 text-center">
                                <Bell className="size-6 text-charcoal-200 mx-auto mb-1.5" />
                                <p className="text-xs text-charcoal-400">No notifications yet</p>
                              </div>
                            ) : (
                              notifications.map((notif) => (
                                <div
                                  key={notif.id}
                                  onClick={() => { void handleNotificationOpen(notif); }}
                                  className={`px-3 py-2.5 border-b border-charcoal-50 hover:bg-honey-50 cursor-pointer transition-colors ${
                                    !notif.is_read ? 'bg-honey-50/40' : ''
                                  }`}
                                >
                                  <div className="flex gap-2.5 items-start">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-honey-100 to-honey-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      {notifIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`font-sans text-xs text-charcoal-900 leading-snug ${!notif.is_read ? 'font-bold' : 'font-medium'}`}>
                                        {notif.title}
                                      </p>
                                      <p className="text-xs text-charcoal-400 line-clamp-1 mt-0.5">
                                        {notif.body}
                                      </p>
                                      <p className="text-[10px] text-charcoal-300 mt-0.5">{timeAgo(notif.created_at)}</p>
                                    </div>
                                    {!notif.is_read && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-honey-500 flex-shrink-0 mt-1.5" />
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="px-3 py-2 border-t border-charcoal-100 bg-white/70">
                            <button
                              onClick={() => {
                                setShowNotifications(false);
                                navigate('/notifications');
                              }}
                              className="w-full h-9 rounded-lg border border-charcoal-100 text-xs font-sans font-bold text-charcoal-700 transition-colors hover:bg-cream-100"
                            >
                              View All Notifications
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* HiveCoin Balance - Hidden on mobile and for admin */}
                {!isAdmin && features.shop && (
                  <button
                    onClick={() => navigate('/shop')}
                    className="hidden md:block font-mono text-sm text-charcoal-600 hover:text-charcoal-900 transition-colors"
                  >
                    ⬡ {balance}
                  </button>
                )}

                {/* Avatar */}
                <div className="relative">
                  <button
                    onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                    className="rounded-full transition-opacity hover:opacity-90"
                  >
                    <Avatar name={user?.first_name} size={32} frame={user?.cosmetics?.frame} src={user?.profile_image} />
                  </button>

                  {/* Avatar Dropdown */}
                  {showAvatarDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowAvatarDropdown(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-cream-50 border border-charcoal-100 rounded-lg shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => { navigate('/admin'); setShowAvatarDropdown(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-charcoal-600 rounded-md hover:bg-charcoal-50 transition-colors"
                            >
                              <Shield className="w-4 h-4 text-charcoal-400" />
                              Admin Dashboard
                            </button>
                            {features.shop && (
                              <button
                                onClick={() => { navigate('/shop'); setShowAvatarDropdown(false); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-charcoal-600 rounded-md hover:bg-charcoal-50 transition-colors"
                              >
                                <ShoppingBag className="w-4 h-4 text-charcoal-400" />
                                HiveShop
                              </button>
                            )}
                            <div className="my-1 h-px bg-charcoal-100" />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                              Log Out
                            </button>
                          </>
                        ) : (
                          <>
                            {user?.role === 'admin' && !user?.impersonating && (
                              <button
                                onClick={() => { navigate('/admin'); setShowAvatarDropdown(false); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-charcoal-600 rounded-md hover:bg-charcoal-50 transition-colors"
                              >
                                <Shield className="w-4 h-4 text-charcoal-400" />
                                Admin
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowAvatarDropdown(false);
                                navigate('/profile');
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-charcoal-600 rounded-md hover:bg-charcoal-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-charcoal-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              My Profile
                            </button>
                            <button
                              onClick={() => {
                                setShowAvatarDropdown(false);
                                navigate('/dashboard');
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-charcoal-600 rounded-md hover:bg-charcoal-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-charcoal-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                              </svg>
                              My Dashboard
                            </button>
                            <button
                              onClick={() => {
                                setShowAvatarDropdown(false);
                                navigate('/settings');
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-charcoal-600 rounded-md hover:bg-charcoal-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 text-charcoal-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              Settings
                            </button>
                            {features.shop && (
                              <button
                                onClick={() => {
                                  setShowAvatarDropdown(false);
                                  navigate('/shop');
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-charcoal-600 rounded-md hover:bg-charcoal-50 transition-colors"
                              >
                                <ShoppingBag className="w-4 h-4 text-charcoal-400" />
                                HiveShop
                              </button>
                            )}
                            <div className="my-1 h-px bg-charcoal-100" />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                              </svg>
                              Log Out
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Hamburger Menu - Mobile only */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden text-charcoal-600"
                  aria-label="Menu"
                >
                  {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Drawer - Outside of nav */}
      {variant === 'logged-in' && showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm z-[100] md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-72 bg-white border-l border-charcoal-200 shadow-2xl z-[101] md:hidden flex flex-col">
            {/* Header with logo */}
            <div className="h-16 px-6 flex items-center border-b border-charcoal-100 bg-cream-50">
              <div className="w-6 h-6 rounded-md bg-honey-500 flex items-center justify-center">
                <span className="text-charcoal-900 font-bold text-sm">H</span>
              </div>
              <span className="font-sans font-bold text-base text-charcoal-900 tracking-tight ml-2">
                hive<span className="text-[18px] text-honey-600" style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontWeight: 400 }}>five</span>
              </span>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-6">
              <div className="px-4 space-y-1">
                {user?.role === 'admin' && !user?.impersonating && (
                  <Link
                    to="/admin"
                    className={`group block px-4 py-3 rounded-lg transition-all ${
                      isActive('/admin')
                        ? 'bg-honey-500 text-charcoal-900 shadow-sm'
                        : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-sans text-sm ${isActive('/admin') ? 'font-bold' : 'font-medium'}`}>
                        {isAdmin ? 'Admin Dashboard' : 'Admin'}
                      </span>
                      {isActive('/admin') && (
                        <div className="w-1.5 h-1.5 rounded-full bg-charcoal-900" />
                      )}
                    </div>
                  </Link>
                )}

                <Link
                  to="/discover"
                  className={`group block px-4 py-3 rounded-lg transition-all ${
                    isActive('/discover')
                      ? 'bg-honey-500 text-charcoal-900 shadow-sm'
                      : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-sans text-sm ${isActive('/discover') ? 'font-bold' : 'font-medium'}`}>
                      Discover
                    </span>
                    {isActive('/discover') && (
                      <div className="w-1.5 h-1.5 rounded-full bg-charcoal-900" />
                    )}
                  </div>
                </Link>

                {!isAdmin && (
                  <>
                    <Link
                      to="/post-service"
                      className={`group block px-4 py-3 rounded-lg transition-all ${
                        isActive('/post-service')
                          ? 'bg-honey-500 text-charcoal-900 shadow-sm'
                          : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900'
                      }`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-sans text-sm ${isActive('/post-service') ? 'font-bold' : 'font-medium'}`}>
                          Post Service
                        </span>
                        {isActive('/post-service') && (
                          <div className="w-1.5 h-1.5 rounded-full bg-charcoal-900" />
                        )}
                      </div>
                    </Link>

                    {features.messaging && (
                      <Link
                        to="/messages"
                        className={`group block px-4 py-3 rounded-lg transition-all ${
                          isActive('/messages')
                            ? 'bg-honey-500 text-charcoal-900 shadow-sm'
                            : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900'
                        }`}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-sans text-sm ${isActive('/messages') ? 'font-bold' : 'font-medium'}`}>
                            Messages
                          </span>
                          {isActive('/messages') && (
                            <div className="w-1.5 h-1.5 rounded-full bg-charcoal-900" />
                          )}
                        </div>
                      </Link>
                    )}
                  </>
                )}

                {features.leaderboard && (
                  <Link
                    to="/leaderboard"
                    className={`group block px-4 py-3 rounded-lg transition-all ${
                      isActive('/leaderboard')
                        ? 'bg-honey-500 text-charcoal-900 shadow-sm'
                        : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-sans text-sm ${isActive('/leaderboard') ? 'font-bold' : 'font-medium'}`}>
                        Leaderboard
                      </span>
                      {isActive('/leaderboard') && (
                        <div className="w-1.5 h-1.5 rounded-full bg-charcoal-900" />
                      )}
                    </div>
                  </Link>
                )}

                {features.shop && (
                  <Link
                    to="/shop"
                    className={`group block px-4 py-3 rounded-lg transition-all ${
                      isActive('/shop')
                        ? 'bg-honey-500 text-charcoal-900 shadow-sm'
                        : 'text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-900'
                    }`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-sans text-sm ${isActive('/shop') ? 'font-bold' : 'font-medium'}`}>
                        HiveShop
                      </span>
                      {isActive('/shop') && (
                        <div className="w-1.5 h-1.5 rounded-full bg-charcoal-900" />
                      )}
                    </div>
                  </Link>
                )}
              </div>

              {!isAdmin && features.shop && (
                <>
                  {/* Divider */}
                  <div className="my-6 mx-4 h-px bg-charcoal-100" />

                  {/* HiveCoin Balance Card */}
                  <div className="px-4">
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        navigate('/shop');
                      }}
                      className="w-full bg-gradient-to-br from-honey-50 to-honey-100 border border-honey-200 rounded-xl p-4 hover:shadow-md hover:border-honey-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-xs font-sans font-medium text-charcoal-500 mb-1">
                            HiveCoin Balance
                          </div>
                          <div className="font-mono font-bold text-lg text-honey-700">
                            ⬡ {balance}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-honey-500 flex items-center justify-center">
                          <span className="text-xl">⬡</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
