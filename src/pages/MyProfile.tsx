import { useState, useEffect } from 'react';
import { NavBar } from '../components/NavBar';
import { Avatar } from '../components/Avatar';
import { ProfileBadge } from '../components/ProfileBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { StatusBadge } from '../components/StatusBadge';
import { useNavigate, Link } from 'react-router';
import { apiGet, apiDelete, apiPatch, ApiError } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import type { ThemeData } from '../lib/auth';
import { Zap, Star, MapPin, Calendar, Shield, Briefcase, Settings, Plus, Loader2, CheckCircle, Clock, Link2, Pause, Play } from 'lucide-react';
import { parseUTC } from '../lib/constants';
import { sanitizeContent } from '../lib/contentFilter';

interface Stats {
  total_earnings: number;
  total_spent: number;
  services_offered: number;
  completed_orders: number;
  buzz_score: number;
  avg_response_minutes: number | null;
}

interface Service {
  id: string;
  title: string;
  category: string;
  price: number | string;
  avg_rating?: number;
  rating?: number;
  reviews?: number;
  review_count?: number;
  isActive?: boolean;
  is_active?: boolean;
  status?: string;
}

interface Review {
  id: string;
  reviewer: string;
  reviewer_name?: string;
  reviewer_first_name?: string;
  reviewer_last_name?: string;
  profile_image?: string | null;
  rating: number;
  comment: string;
  text?: string;
  service: string;
  service_title?: string;
  date: string;
  created_at?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return 'N/A';
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `< ${hours + 1}h`;
  const days = Math.floor(hours / 24);
  return `~${days}d`;
}

export function MyProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin' && !user?.impersonating) navigate('/admin', { replace: true });
  }, [user, navigate]);

  const [activeTab, setActiveTab] = useState<'services' | 'reviews'>('services');

  const [stats, setStats] = useState<Stats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [profileCopied, setProfileCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function fetchProfileData() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, servicesRes, reviewsRes] = await Promise.all([
          apiGet<Stats>('/users/stats.php'),
          apiGet<{ services: Service[] }>('/services/mine.php'),
          apiGet<{ reviews: Review[] }>('/services/reviews.php', { provider_id: String(user.id) }).catch(() => ({ reviews: [] })),
        ]);

        if (cancelled) return;

        setStats(statsRes);
        setServices(servicesRes.services || []);
        setReviews(reviewsRes.reviews || []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfileData();
    return () => { cancelled = true; };
  }, [user]);

  const handleDeleteService = async (serviceId: string) => {
    if (deletingId) return;
    setDeletingId(serviceId);
    try {
      await apiDelete('/services/delete.php', { id: serviceId });
      setServices((prev) => prev.filter((s) => String(s.id) !== serviceId));
      toast.success('Service deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete service');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (serviceId: string, currentlyActive: boolean) => {
    if (togglingId) return;
    setTogglingId(serviceId);
    try {
      const res = await apiPatch<{ id: number; is_active: boolean }>('/services/toggle-active.php', { service_id: serviceId });
      setServices((prev) =>
        prev.map((s) =>
          String(s.id) === serviceId
            ? { ...s, is_active: res.is_active, isActive: res.is_active }
            : s
        )
      );
      toast.success(res.is_active ? 'Service activated' : 'Service paused');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update service');
    } finally {
      setTogglingId(null);
    }
  };

  const handleShareService = async (serviceId: string) => {
    const url = window.location.origin + '/service/' + serviceId;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(serviceId);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareProfile = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${user?.username}`);
      setProfileCopied(true);
      toast.success('Profile link copied');
      setTimeout(() => setProfileCopied(false), 2000);
    } catch { toast.error('Failed to copy link'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
          {/* Profile header card */}
          <div className="bg-white border border-charcoal-100 rounded-xl overflow-hidden mb-8">
            {/* Banner */}
            <div className="h-[180px] bg-charcoal-100 animate-pulse" />
            {/* Content below banner */}
            <div className="px-8 pb-8">
              <div className="flex items-end gap-6" style={{ marginTop: -48 }}>
                <div className="size-24 rounded-full bg-charcoal-200 animate-pulse border-4 border-white shrink-0" />
                <div className="flex-1 pt-14">
                  <div className="h-7 w-48 bg-charcoal-100 rounded animate-pulse mb-2" />
                  <div className="h-4 w-32 bg-charcoal-100 rounded animate-pulse mb-2" />
                  <div className="h-4 w-64 bg-charcoal-100 rounded animate-pulse" />
                </div>
              </div>
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-lg bg-cream-50 p-3">
                    <div className="h-3 w-16 bg-charcoal-100 rounded animate-pulse mb-1" />
                    <div className="h-6 w-12 bg-charcoal-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-charcoal-100">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="pb-3 px-2">
                <div className="h-4 w-20 bg-charcoal-100 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Service card skeletons */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-charcoal-100 rounded-xl p-6">
                <div className="h-4 w-20 rounded-full bg-charcoal-100 animate-pulse mb-2" />
                <div className="h-5 w-3/4 bg-charcoal-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-charcoal-100 rounded animate-pulse mb-3" />
                <div className="flex items-center">
                  <div className="h-4 w-16 bg-charcoal-100 rounded animate-pulse" />
                  <div className="h-5 w-20 bg-charcoal-100 rounded animate-pulse ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-16 pt-8">
          <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
            <h2 className="font-display italic text-2xl text-charcoal-900 mb-2">Something went wrong</h2>
            <p className="text-charcoal-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm hover:bg-honey-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = user ? `${user.first_name} ${user.last_name}` : '';
  const university = user?.university || '';
  const memberSinceShort = user?.created_at
    ? parseUTC(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  const buzzScore = stats?.buzz_score ?? 0;
  const completedOrders = stats?.completed_orders ?? 0;
  const avgResponseMinutes = stats?.avg_response_minutes ?? null;

  const theme: ThemeData | null = user?.cosmetics?.theme ?? null;
  const accent = theme?.accent_color || '#E9A020';
  const hasTheme = !!theme;

  const normalizedServices = services.map((s) => ({
    ...s,
    isActive: s.isActive ?? s.is_active ?? (s.status === 'active'),
    rating: s.rating ?? s.avg_rating ?? 0,
    reviews: s.reviews ?? s.review_count ?? 0,
    price: typeof s.price === 'number' ? s.price : s.price,
  }));

  const normalizedReviews = reviews.map((r) => ({
    ...r,
    reviewer: r.reviewer || r.reviewer_name || (r.reviewer_first_name && r.reviewer_last_name ? `${r.reviewer_first_name} ${r.reviewer_last_name}` : 'Anonymous'),
    profile_image: r.profile_image ?? null,
    comment: r.comment || r.text || '',
    service: r.service || r.service_title || '',
    date: r.date || r.created_at || '',
  }));

  const statItems = [
    { icon: Zap, label: 'Buzz Score', value: String(buzzScore) },
    { icon: CheckCircle, label: 'Completed', value: String(completedOrders) },
    { icon: Clock, label: 'Response', value: formatResponseTime(avgResponseMinutes) },
    { icon: Calendar, label: 'Member Since', value: memberSinceShort },
  ];

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">

        {/* ── Profile Header ── */}
        <div
          className="rounded-xl overflow-hidden mb-8"
          style={{
            backgroundColor: hasTheme ? hexToRgba(accent, 0.03) : '#FFFFFF',
            border: hasTheme
              ? `1px solid ${hexToRgba(accent, 0.15)}`
              : '1px solid var(--charcoal-100)',
          }}
        >
          {/* Banner — always visible */}
          <div
            className={`relative ${theme?.css_animation || ''}`}
            style={{
              height: 180,
              background: hasTheme
                ? theme.banner_gradient
                : 'linear-gradient(135deg, var(--honey-400), var(--honey-600))',
            }}
          >
            <div
              className="absolute inset-x-0 bottom-0 h-24"
              style={{
                background: hasTheme
                  ? `linear-gradient(to top, ${hexToRgba(accent, 0.12)}, transparent)`
                  : 'linear-gradient(to top, rgba(255,255,255,0.15), transparent)',
              }}
            />
          </div>

          {/* Content below banner */}
          <div
            className="px-4 md:px-8"
            style={{
              paddingBottom: 32,
              ...(hasTheme ? {
                background: `linear-gradient(to bottom, ${hexToRgba(accent, 0.06)}, transparent 70%)`,
              } : {}),
            }}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start gap-3 md:gap-6" style={{ marginTop: -48 }}>
              <div className="shrink-0">
                <Avatar name={displayName} size="xl" frame={user?.cosmetics?.frame} src={user?.profile_image} />
              </div>

              <div className="w-full md:flex-1 md:min-w-0 pt-3 md:pt-14">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                  <div className="min-w-0 md:flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h1 className="font-display italic text-2xl md:text-3xl text-charcoal-900">
                        {displayName}
                      </h1>
                      <ProfileBadge badge={user?.cosmetics?.badge} />
                    </div>
                    <div className="text-sm text-charcoal-600 mb-3 space-y-1">
                      {user?.job && (
                        <div className="flex items-center" style={{ gap: 4 }}>
                          {user.job} {user.is_student ? '• Student' : ''}
                        </div>
                      )}
                      {!user?.job && user?.is_student && (
                        <div className="flex items-center" style={{ gap: 4 }}>
                          Student
                        </div>
                      )}
                      {university && (
                        <div className="flex items-center" style={{ gap: 4 }}>
                          <MapPin className="size-4" />
                          {university}
                        </div>
                      )}
                      {user?.verified && (
                        <div
                          className={`flex items-center ${hasTheme ? '' : 'text-green-600'}`}
                          style={{ gap: 4, ...(hasTheme ? { color: accent } : {}) }}
                        >
                          <Shield className="size-4" />
                          Verified
                        </div>
                      )}
                    </div>
                    {user?.bio && (
                      <p className="text-sm md:text-base text-charcoal-700 max-w-2xl">{sanitizeContent(user.bio)}</p>
                    )}
                  </div>

                  {/* Edit Profile + Share Profile buttons */}
                  <div className="flex gap-2" style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => navigate('/settings')}
                      className="flex-1 sm:flex-initial font-sans font-bold text-sm transition-all"
                      style={{
                        height: 40,
                        padding: '0 20px',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        color: '#1F1D1A',
                        backgroundColor: hasTheme ? hexToRgba(accent, 0.08) : '#F5F3F0',
                        border: hasTheme ? `1px solid ${hexToRgba(accent, 0.15)}` : '1px solid #e5e2de',
                      }}
                    >
                      <Settings className="size-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={handleShareProfile}
                      className="font-sans font-bold text-sm transition-all"
                      title={profileCopied ? 'Copied!' : 'Share profile link'}
                      style={{
                        height: 40,
                        padding: '0 12px',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        color: hasTheme ? accent : '#78716c',
                        backgroundColor: 'transparent',
                        border: `1px solid ${hasTheme ? hexToRgba(accent, 0.15) : '#e5e2de'}`,
                      }}
                    >
                      <Link2 className="size-4" />
                      <span className="hidden sm:inline">{profileCopied ? 'Copied!' : 'Share Profile'}</span>
                    </button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {statItems.map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="rounded-lg p-3"
                      style={hasTheme ? {
                        backgroundColor: hexToRgba(accent, 0.07),
                        borderLeft: `3px solid ${hexToRgba(accent, 0.6)}`,
                        boxShadow: `inset 0 1px 0 ${hexToRgba(accent, 0.08)}, 0 1px 3px ${hexToRgba(accent, 0.06)}`,
                      } : {
                        backgroundColor: 'var(--cream-50)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className={`size-4 ${hasTheme ? '' : 'text-honey-600'}`}
                          style={hasTheme ? { color: accent } : undefined}
                        />
                        <span className="font-mono text-xs text-charcoal-500">{label}</span>
                      </div>
                      <div className="text-xl font-display italic text-charcoal-900">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 border-b border-charcoal-100">
          {(['services', 'reviews'] as const).map((tab) => {
            const active = activeTab === tab;
            const label = tab === 'services' ? 'My Services' : `Reviews (${normalizedReviews.length})`;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 font-sans font-bold text-sm transition-colors relative ${
                  active ? 'text-charcoal-900' : 'text-charcoal-400 hover:text-charcoal-700'
                }`}
              >
                {label}
                {active && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: hasTheme ? accent : 'var(--honey-500)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Services Tab ── */}
        {activeTab === 'services' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-display italic text-charcoal-900">
                Services I Offer
              </h2>
              <button
                onClick={() => navigate('/post-service')}
                className="h-10 px-5 rounded-lg font-sans font-bold text-sm transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                style={hasTheme ? {
                  backgroundColor: accent,
                  color: theme.text_color,
                } : {
                  backgroundColor: 'var(--honey-500)',
                  color: 'var(--charcoal-900)',
                }}
              >
                <Plus className="size-4" />
                Add Service
              </button>
            </div>

            {normalizedServices.length === 0 ? (
              <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
                <Briefcase className="size-10 text-charcoal-300 mx-auto mb-3" />
                <h3 className="font-sans font-bold text-charcoal-700 mb-1">No services yet</h3>
                <p className="text-sm text-charcoal-500 mb-4">Start offering your skills to the hive</p>
                <button
                  onClick={() => navigate('/post-service')}
                  className="h-9 px-4 rounded-lg font-sans font-bold text-sm"
                  style={hasTheme ? {
                    backgroundColor: hexToRgba(accent, 0.1),
                    color: accent,
                    border: `1px solid ${hexToRgba(accent, 0.2)}`,
                  } : {
                    backgroundColor: 'var(--honey-50)',
                    color: 'var(--honey-700)',
                    border: '1px solid var(--honey-200)',
                  }}
                >
                  Post a Service
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {normalizedServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white border border-charcoal-100 rounded-xl p-5 hover:border-charcoal-200 transition-all group"
                    style={!service.isActive ? { opacity: 0.6 } : undefined}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CategoryBadge category={service.category} />
                          <StatusBadge status={service.isActive ? 'active' : 'inactive'} />
                          {!service.isActive && (
                            <span
                              className="text-xs font-sans font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
                            >
                              Paused
                            </span>
                          )}
                        </div>
                        <h3 className="font-sans font-bold text-base text-charcoal-900 mb-1.5 truncate">
                          <Link
                            to={`/service/${service.id}`}
                            className="hover:underline transition-colors"
                            style={{ color: hasTheme ? accent : 'var(--charcoal-900)' }}
                          >
                            {sanitizeContent(service.title)}
                          </Link>
                        </h3>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="size-3.5 text-honey-500 fill-honey-500" />
                          <span className="text-charcoal-900 font-medium">
                            {Number(service.rating).toFixed(1)}
                          </span>
                          <span className="text-charcoal-400">
                            ({service.reviews} reviews)
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-lg text-charcoal-900 mb-2">
                          ⬡ {typeof service.price === 'number' ? service.price.toLocaleString() : service.price}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium">
                          <button
                            onClick={() => handleShareService(String(service.id))}
                            className="transition-colors flex items-center gap-1"
                            style={{ color: 'var(--charcoal-500)' }}
                            title="Copy service link"
                          >
                            <Link2 className="size-3.5" />
                            {copiedId === String(service.id) ? 'Copied!' : 'Share'}
                          </button>
                          <button
                            onClick={() => handleToggleActive(String(service.id), !!service.isActive)}
                            disabled={togglingId === String(service.id)}
                            className="transition-colors flex items-center gap-1 disabled:opacity-50"
                            style={{ color: service.isActive ? 'var(--charcoal-500)' : 'var(--honey-600)' }}
                            title={service.isActive ? 'Pause this service' : 'Activate this service'}
                          >
                            {service.isActive ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                            {togglingId === String(service.id)
                              ? '...'
                              : service.isActive
                                ? 'Deactivate'
                                : 'Activate'}
                          </button>
                          <button
                            onClick={() => navigate(`/edit-service/${service.id}`)}
                            className="transition-colors"
                            style={{ color: hasTheme ? accent : 'var(--honey-600)' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteService(String(service.id))}
                            disabled={deletingId === String(service.id)}
                            className="text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            {deletingId === String(service.id) ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Reviews Tab ── */}
        {activeTab === 'reviews' && (
          <div>
            {normalizedReviews.length === 0 ? (
              <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
                <Star className="size-10 text-charcoal-300 mx-auto mb-3" />
                <h3 className="font-sans font-bold text-charcoal-700 mb-1">No reviews yet</h3>
                <p className="text-sm text-charcoal-500">Complete orders to start receiving reviews</p>
              </div>
            ) : (
              <div className="space-y-3">
                {normalizedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-white border border-charcoal-100 rounded-xl p-5"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar name={review.reviewer} size="md" src={review.profile_image} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div>
                            <h3 className="font-sans font-bold text-sm text-charcoal-900">
                              {review.reviewer}
                            </h3>
                            <p className="text-xs text-charcoal-400">{review.date}</p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`size-3.5 ${
                                  i < review.rating
                                    ? 'text-honey-500 fill-honey-500'
                                    : 'text-charcoal-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-charcoal-700 mb-1.5">{sanitizeContent(review.comment)}</p>
                        <p className="text-xs text-charcoal-400">
                          Service: {review.service}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
