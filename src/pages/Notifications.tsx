import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell,
  CheckCheck,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Package,
  Star,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { NavBar } from '../components/NavBar';
import { useAuth } from '../lib/auth';
import { api, apiGet, apiPatch, ApiError } from '../lib/api';
import { dispatchNotificationsRefresh } from '../lib/inAppAlerts';
import { parseUTC } from '../lib/constants';

type NotificationFilter = 'all' | 'unread';

interface NotificationRecord {
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

interface NotificationResponse {
  notifications: NotificationRecord[];
  unread_count: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

const PAGE_SIZE = 30;

function notificationIcon(type: NotificationRecord['type']) {
  const cls = 'size-4 text-honey-700';
  switch (type) {
    case 'message': return <MessageCircle className={cls} />;
    case 'order': return <Package className={cls} />;
    case 'order_status': return <Package className={cls} />;
    case 'payment': return <CreditCard className={cls} />;
    case 'proposal': return <FileText className={cls} />;
    case 'review': return <Star className={cls} />;
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

export function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin' && !user?.impersonating) navigate('/admin', { replace: true });
  }, [user, navigate]);

  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (offset = 0, replace = true) => {
    if (replace) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await apiGet<NotificationResponse>('/notifications/list.php', {
        limit: PAGE_SIZE,
        offset,
        status: filter,
      });

      setNotifications((prev) => (replace ? data.notifications : [...prev, ...data.notifications]));
      setUnreadCount(data.unread_count);
      setTotal(data.pagination.total);
      if (replace) setSelectedIds(new Set());
    } catch (err) {
      if (replace) {
        setError(err instanceof ApiError ? err.message : 'Failed to load notifications');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications(0, true);
  }, [fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(0, true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const hasMore = notifications.length < total;
  const selectedCount = selectedIds.size;
  const allVisibleSelected = notifications.length > 0 && notifications.every((notif) => selectedIds.has(notif.id));

  const selectionLabel = useMemo(() => {
    if (selectedCount === 0) return 'No notifications selected';
    if (selectedCount === 1) return '1 notification selected';
    return `${selectedCount} notifications selected`;
  }, [selectedCount]);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) return new Set();
      return new Set(notifications.map((notif) => notif.id));
    });
  };

  const refreshAfterMutation = async () => {
    await fetchNotifications(0, true);
    dispatchNotificationsRefresh();
  };

  const handleMarkRead = async (target: 'all' | 'selected' | number, silent = false) => {
    if (target === 'selected' && selectedCount === 0) return;

    setActioning(`read-${target}`);
    try {
      if (target === 'all') {
        await apiPatch('/notifications/read.php', {});
      } else if (target === 'selected') {
        await apiPatch('/notifications/read.php', { ids: Array.from(selectedIds) });
      } else {
        await apiPatch('/notifications/read.php', { id: target });
      }

      await refreshAfterMutation();
      if (!silent) {
        toast.success(target === 'all' ? 'All notifications marked as read' : 'Notifications updated');
      }
    } catch (err) {
      if (!silent) toast.error(err instanceof ApiError ? err.message : 'Failed to update notifications');
    } finally {
      setActioning(null);
    }
  };

  const handleDelete = async (target: 'all' | 'selected' | number) => {
    if (target === 'selected' && selectedCount === 0) return;

    if (target === 'all' && !window.confirm('Delete all notifications?')) return;
    if (target === 'selected' && !window.confirm(`Delete ${selectedCount} selected notifications?`)) return;

    setActioning(`delete-${target}`);
    try {
      if (target === 'all') {
        await api('/notifications/delete.php', { method: 'DELETE' });
      } else if (target === 'selected') {
        await api('/notifications/delete.php', {
          method: 'DELETE',
          body: { ids: Array.from(selectedIds) },
        });
      } else {
        await api('/notifications/delete.php', {
          method: 'DELETE',
          body: { id: target },
        });
      }

      await refreshAfterMutation();
      toast.success(target === 'all' ? 'All notifications deleted' : 'Notifications deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete notifications');
    } finally {
      setActioning(null);
    }
  };

  const handleOpen = async (notif: NotificationRecord) => {
    if (!notif.link) return;
    if (!notif.is_read) {
      await handleMarkRead(notif.id, true);
    }
    navigate(notif.link);
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display italic text-3xl md:text-5xl text-charcoal-900 mb-2">
              Notifications
            </h1>
            <p className="text-charcoal-600">
              {unreadCount} unread · {total} {filter === 'unread' ? 'unread' : 'total'} notifications
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`h-10 px-4 rounded-full text-sm font-sans font-bold transition-colors ${
                filter === 'all'
                  ? 'bg-charcoal-900 text-white'
                  : 'bg-white border border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`h-10 px-4 rounded-full text-sm font-sans font-bold transition-colors ${
                filter === 'unread'
                  ? 'bg-charcoal-900 text-white'
                  : 'bg-white border border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50'
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        <div className="bg-white border border-charcoal-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-charcoal-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                aria-label="Select all visible notifications"
                className="size-4 rounded border-charcoal-300 text-honey-500 focus:ring-honey-500"
              />
              <span className="text-sm text-charcoal-700">{selectionLabel}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleMarkRead('selected')}
                disabled={selectedCount === 0 || actioning !== null}
                className="h-9 px-4 rounded-lg bg-honey-100 text-honey-800 text-sm font-sans font-bold transition-colors hover:bg-honey-200 disabled:opacity-50"
              >
                Mark Selected Read
              </button>
              <button
                onClick={() => handleDelete('selected')}
                disabled={selectedCount === 0 || actioning !== null}
                className="h-9 px-4 rounded-lg bg-red-50 text-red-700 text-sm font-sans font-bold transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                Delete Selected
              </button>
              <button
                onClick={() => handleMarkRead('all')}
                disabled={unreadCount === 0 || actioning !== null}
                className="h-9 px-4 rounded-lg bg-white border border-charcoal-200 text-charcoal-700 text-sm font-sans font-bold transition-colors hover:bg-charcoal-50 disabled:opacity-50"
              >
                Mark All Read
              </button>
              <button
                onClick={() => handleDelete('all')}
                disabled={total === 0 || actioning !== null}
                className="h-9 px-4 rounded-lg bg-white border border-red-200 text-red-700 text-sm font-sans font-bold transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Delete All
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-charcoal-500">
              <Loader2 className="size-6 animate-spin mx-auto mb-3" />
              Loading notifications...
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-600">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="size-10 text-charcoal-200 mx-auto mb-3" />
              <p className="text-charcoal-600">
                {filter === 'unread' ? 'You are all caught up.' : 'No notifications yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-charcoal-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-5 py-4 transition-colors ${notif.is_read ? 'bg-white' : 'bg-honey-50/35'}`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(notif.id)}
                      onChange={() => toggleSelection(notif.id)}
                      aria-label={`Select notification ${notif.title}`}
                      className="size-4 mt-1 rounded border-charcoal-300 text-honey-500 focus:ring-honey-500"
                    />

                    <div className="size-10 rounded-full bg-gradient-to-br from-honey-100 to-honey-200 flex items-center justify-center shrink-0">
                      {notificationIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`text-sm text-charcoal-900 ${notif.is_read ? 'font-medium' : 'font-bold'}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <span className="size-2 rounded-full bg-honey-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-charcoal-600 mt-1">{notif.body}</p>
                          {(notif.actor_first_name || notif.actor_last_name) && (
                            <p className="text-xs text-charcoal-400 mt-1">
                              From {[notif.actor_first_name, notif.actor_last_name].filter(Boolean).join(' ')}
                            </p>
                          )}
                        </div>

                        <p className="text-xs text-charcoal-400 shrink-0">{timeAgo(notif.created_at)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {notif.link && (
                          <button
                            onClick={() => void handleOpen(notif)}
                            disabled={actioning !== null}
                            className="h-9 px-4 rounded-lg bg-honey-500 text-charcoal-900 text-sm font-sans font-bold transition-colors hover:bg-honey-600 disabled:opacity-50 inline-flex items-center gap-2"
                          >
                            <ExternalLink className="size-4" />
                            Open
                          </button>
                        )}
                        {!notif.is_read && (
                          <button
                            onClick={() => void handleMarkRead(notif.id)}
                            disabled={actioning !== null}
                            className="h-9 px-4 rounded-lg bg-white border border-charcoal-200 text-charcoal-700 text-sm font-sans font-bold transition-colors hover:bg-charcoal-50 disabled:opacity-50 inline-flex items-center gap-2"
                          >
                            <CheckCheck className="size-4" />
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => void handleDelete(notif.id)}
                          disabled={actioning !== null}
                          className="h-9 px-4 rounded-lg bg-white border border-red-200 text-red-700 text-sm font-sans font-bold transition-colors hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && !loading && (
            <div className="px-5 py-4 border-t border-charcoal-100 bg-cream-50/70">
              <button
                onClick={() => fetchNotifications(notifications.length, false)}
                disabled={loadingMore || actioning !== null}
                className="w-full h-11 rounded-xl bg-white border border-charcoal-200 text-charcoal-700 font-sans font-bold text-sm transition-colors hover:bg-charcoal-50 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {loadingMore && <Loader2 className="size-4 animate-spin" />}
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
