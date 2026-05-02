import { useState, useEffect } from 'react';
import { NavBar } from '../components/NavBar';
import { Avatar } from '../components/Avatar';
import { ProfileBadge } from '../components/ProfileBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { useNavigate, useParams } from 'react-router';
import { apiGet, apiPost, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { CosmeticData, ThemeData } from '../lib/auth';
import { CustomSelect } from '../components/CustomSelect';
import { Zap, MapPin, Calendar, MessageCircle, Shield, Loader2, Star, CheckCircle, Clock, Link2, Flag, Eye, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { parseUTC } from '../lib/constants';
import NotFound from './NotFound';
import { CharacterLimitHint } from '../components/CharacterLimitHint';
import { sanitizeContent } from '../lib/contentFilter';

interface ProviderData {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  role?: string;
  university: string;
  job: string;
  is_student: boolean;
  bio: string | null;
  profile_image: string | null;
  member_since: string;
  verified: boolean;
  cosmetics?: CosmeticData;
}

interface ProviderStats {
  buzz_score: number;
  completed_orders: number;
  avg_response_minutes: number | null;
  active_services: number;
}

interface ApiService {
  id: number;
  title: string;
  category: string;
  price: number;
  price_unit: string | null;
  rating: number;
  review_count: number;
  description: string;
  thumbnail: string | null;
}

interface ApiReview {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_first_name: string;
  reviewer_last_name: string;
  profile_image: string | null;
  service_title: string;
}

/** Convert hex accent color to rgba for tinting */
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

const REPORT_REASON_MAP: Record<string, string> = {
  'Harassment or threats': 'harassment',
  'Academic dishonesty': 'academic_dishonesty',
  'Scam or fraud': 'scam_fraud',
  'Inappropriate content': 'inappropriate_content',
  'Spam': 'spam',
  'Impersonation': 'impersonation',
  'Other': 'other',
};
const REPORT_REASON_OPTIONS = Object.keys(REPORT_REASON_MAP);

export function UserProfile() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'services' | 'reviews'>('services');

  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [services, setServices] = useState<ApiService[]>([]);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Redirect to /profile if viewing your own username
  useEffect(() => {
    if (currentUser?.username && username && currentUser.username === username) {
      navigate('/profile', { replace: true });
    }
  }, [currentUser, username, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function fetchProvider() {
      if (!username) {
        setError('No user specified');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const profileRes = await apiGet<{ user: ProviderData; stats: ProviderStats }>('/users/profile.php', { username });
        if (cancelled) return;

        // Admins are hidden from non-admin users via backend role field
        if (profileRes.user.role === 'admin' && currentUser?.role !== 'admin') {
          setError('not_found');
          setLoading(false);
          return;
        }

        setProvider(profileRes.user);
        setStats(profileRes.stats);

        const userId = profileRes.user.id;
        const [servicesRes, reviewsRes] = await Promise.all([
          apiGet<{ services: ApiService[] }>('/services/list.php', { provider_id: userId, limit: 50 }),
          apiGet<{ reviews: ApiReview[] }>('/services/reviews.php', { provider_id: userId, limit: 20 }),
        ]);
        if (cancelled) return;
        setServices(servicesRes.services || []);
        setReviews(reviewsRes.reviews || []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProvider();
    return () => { cancelled = true; };
  }, [username]);

  useEffect(() => {
    if (currentUser && provider && currentUser.id !== provider.id) {
      apiGet<{ has_pending_report: boolean }>('/reports/check.php', { user_id: provider.id })
        .then(d => setHasReported(d.has_pending_report))
        .catch(() => {});
    }
  }, [currentUser, provider]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
          {/* Profile header card */}
          <div className="rounded-xl overflow-hidden mb-8 bg-white border border-charcoal-100">
            {/* Banner */}
            <div className="h-[180px] bg-charcoal-100 animate-pulse" />
            {/* Content below banner */}
            <div className="px-4 md:px-8 pb-8">
              <div style={{ marginTop: -48 }}>
                {/* Avatar */}
                <div className="size-24 rounded-full bg-charcoal-200 animate-pulse border-4 border-white" />
              </div>
              {/* Info */}
              <div className="mt-4">
                <div className="h-7 w-48 bg-charcoal-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-charcoal-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-charcoal-100 rounded animate-pulse mb-4" />
                {/* Buttons */}
                <div className="flex gap-2">
                  <div className="h-10 w-28 rounded-lg bg-charcoal-100 animate-pulse" />
                  <div className="h-10 w-20 rounded-lg bg-charcoal-100 animate-pulse" />
                </div>
              </div>
              {/* Stats */}
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
            <div className="pb-3 px-2">
              <div className="h-4 w-24 bg-charcoal-100 rounded animate-pulse" />
            </div>
            <div className="pb-3 px-2">
              <div className="h-4 w-24 bg-charcoal-100 rounded animate-pulse" />
            </div>
          </div>

          {/* Service cards */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-charcoal-100 rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="h-4 w-20 rounded-full bg-charcoal-100 animate-pulse mb-2" />
                    <div className="h-5 w-3/4 bg-charcoal-100 rounded animate-pulse mb-2" />
                    <div className="h-4 w-full bg-charcoal-100 rounded animate-pulse mb-3" />
                    <div className="h-4 w-16 bg-charcoal-100 rounded animate-pulse" />
                  </div>
                  <div className="h-5 w-20 bg-charcoal-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error === 'not_found') return <NotFound />;

  if (error || !provider || !stats) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <h3 className="font-sans font-bold text-red-900 mb-2">Something went wrong</h3>
            <p className="text-sm text-red-700">{error || 'User not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const providerName = `${provider.first_name} ${provider.last_name}`;
  const memberSinceLabel = parseUTC(provider.member_since).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const memberSinceShort = parseUTC(provider.member_since).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const theme: ThemeData | null = provider.cosmetics?.theme ?? null;
  const accent = theme?.accent_color || '#E9A020';

  function formatPrice(price: number, unit: string | null): string {
    if (unit) return `⬡ ${price}/${unit}`;
    return `⬡ ${price}`;
  }

  function formatReviewDate(dateStr: string): string {
    const d = parseUTC(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${provider.username}`);
      setLinkCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { toast.error('Failed to copy link'); }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-5xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        {/* Profile Header Card */}
        <div
          className="rounded-xl overflow-hidden mb-8"
          style={{
            backgroundColor: theme ? hexToRgba(accent, 0.03) : '#FFFFFF',
            border: theme ? `1px solid ${hexToRgba(accent, 0.15)}` : '1px solid var(--charcoal-100)',
          }}
        >
          {/* Banner — tall, immersive, with bottom fade */}
          <div
            className={`relative ${theme?.css_animation || ''}`}
            style={{
              height: 180,
              background: theme
                ? theme.banner_gradient
                : 'linear-gradient(135deg, var(--honey-400), var(--honey-600))',
            }}
          >
            <div
              className="absolute inset-x-0 bottom-0 h-24"
              style={{
                background: theme
                  ? `linear-gradient(to top, ${hexToRgba(accent, 0.12)}, transparent)`
                  : 'linear-gradient(to top, rgba(255,255,255,0.15), transparent)',
              }}
            />
          </div>

          {/* Content below banner — themed info zone */}
          <div
            className="px-4 md:px-8"
            style={{
              paddingBottom: 32,
              ...(theme ? {
                background: `linear-gradient(to bottom, ${hexToRgba(accent, 0.06)}, transparent 70%)`,
              } : {}),
            }}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start gap-3 md:gap-6" style={{ marginTop: -48 }}>
              <div className="shrink-0">
                <Avatar name={providerName} size="xl" frame={provider.cosmetics?.frame} src={provider.profile_image} />
              </div>

              <div className="w-full md:flex-1 md:min-w-0 pt-3 md:pt-14">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                  <div className="min-w-0 md:flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h1 className="font-display italic text-2xl md:text-3xl text-charcoal-900">
                        {providerName}
                      </h1>
                      <ProfileBadge badge={provider.cosmetics?.badge} />
                    </div>
                    <div className="text-sm text-charcoal-600 mb-3 space-y-1">
                      {provider.job && (
                        <div className="flex items-center" style={{ gap: 4 }}>
                          {provider.job} {provider.is_student ? '• Student' : ''}
                        </div>
                      )}
                      {!provider.job && provider.is_student && (
                        <div className="flex items-center" style={{ gap: 4 }}>
                          Student
                        </div>
                      )}
                      {provider.university && (
                        <div className="flex items-center" style={{ gap: 4 }}>
                          <MapPin className="size-4" />
                          {provider.university}
                        </div>
                      )}
                      {provider.verified && (
                        <div
                          className={`flex items-center ${theme ? '' : 'text-green-600'}`}
                          style={{ gap: 4, ...(theme ? { color: accent } : {}) }}
                        >
                          <Shield className="size-4" />
                          Verified
                        </div>
                      )}
                    </div>
                    {provider.bio && (
                      <p className="text-sm md:text-base text-charcoal-700 max-w-2xl">{sanitizeContent(provider.bio)}</p>
                    )}
                  </div>

                  {/* Send Message + Share buttons */}
                  <div className="flex gap-2" style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => navigate(`/messages?userId=${provider.id}`)}
                      className={`flex-1 sm:flex-initial font-sans font-bold text-sm transition-all ${
                        theme ? 'hover:opacity-90' : 'bg-honey-500 text-charcoal-900 hover:bg-honey-600'
                      }`}
                      style={{
                        height: 40,
                        padding: '0 20px',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        ...(theme ? {
                          backgroundColor: accent,
                          color: theme.text_color,
                        } : {}),
                      }}
                    >
                      <MessageCircle className="size-4" />
                      Message
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="font-sans font-bold text-sm transition-all"
                      title={linkCopied ? 'Copied!' : 'Share profile link'}
                      style={{
                        height: 40,
                        padding: '0 12px',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        color: theme ? accent : '#78716c',
                        backgroundColor: 'transparent',
                        border: `1px solid ${theme ? accent + '40' : '#e5e2de'}`,
                      }}
                    >
                      <Link2 className="size-4" />
                      <span className="hidden sm:inline">{linkCopied ? 'Copied!' : 'Share'}</span>
                    </button>
                    {currentUser && currentUser.id !== provider.id && currentUser.role !== 'admin' && (
                      <button
                        onClick={() => setShowReportModal(true)}
                        disabled={hasReported}
                        title={hasReported ? 'Already reported' : 'Report user'}
                        style={{
                          height: 40, padding: '0 12px', borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          border: '1px solid #D6D3D1', background: 'transparent',
                          color: hasReported ? '#A8A29E' : '#78756E',
                          fontSize: 14, fontWeight: 600, cursor: hasReported ? 'default' : 'pointer',
                          opacity: hasReported ? 0.6 : 1,
                        }}
                      >
                        <Flag style={{ width: 16, height: 16 }} />
                        <span className="hidden sm:inline">{hasReported ? 'Reported' : 'Report'}</span>
                      </button>
                    )}
                    {currentUser?.role === 'admin' && currentUser.id !== provider.id && (
                      <button
                        onClick={async () => {
                          await apiPost('/admin/impersonate.php', { user_id: provider.id });
                          window.location.href = '/discover';
                        }}
                        style={{
                          height: 40, padding: '0 16px', borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          border: '1px solid #E9A020', background: 'rgba(233,160,32,0.1)',
                          color: '#C4850C', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <Eye style={{ width: 16, height: 16 }} />
                        View As
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats — premium glass cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Zap, label: 'Buzz Score', value: String(stats.buzz_score), sub: undefined },
                    { icon: CheckCircle, label: 'Completed', value: String(stats.completed_orders), sub: 'orders' },
                    { icon: Clock, label: 'Response', value: formatResponseTime(stats.avg_response_minutes), sub: undefined },
                    { icon: Calendar, label: 'Member Since', value: memberSinceShort, sub: undefined },
                  ].map(({ icon: Icon, label, value, sub }) => (
                    <div
                      key={label}
                      className="rounded-lg p-3"
                      style={theme ? {
                        backgroundColor: hexToRgba(accent, 0.07),
                        borderLeft: `3px solid ${hexToRgba(accent, 0.6)}`,
                        boxShadow: `inset 0 1px 0 ${hexToRgba(accent, 0.08)}, 0 1px 3px ${hexToRgba(accent, 0.06)}`,
                      } : {
                        backgroundColor: 'var(--cream-50)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className={`size-4 ${theme ? '' : 'text-honey-600'}`}
                          style={theme ? { color: accent } : undefined}
                        />
                        <span className="font-mono text-xs text-charcoal-500">{label}</span>
                      </div>
                      <div className="text-xl font-display italic text-charcoal-900">
                        {value}
                      </div>
                      {sub && (
                        <div className="text-xs text-charcoal-500">{sub}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs — accent-colored underline */}
        <div className="flex gap-4 mb-6 border-b border-charcoal-100">
          <button
            onClick={() => setActiveTab('services')}
            className={`pb-3 px-2 font-sans font-bold text-sm transition-colors relative ${
              activeTab === 'services' ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
          >
            Services ({services.length})
            {activeTab === 'services' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: theme ? accent : 'var(--honey-500)' }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-2 font-sans font-bold text-sm transition-colors relative ${
              activeTab === 'reviews' ? 'text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
          >
            Reviews ({reviews.length})
            {activeTab === 'reviews' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: theme ? accent : 'var(--honey-500)' }}
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/service/${service.id}`)}
                className="bg-white border border-charcoal-100 rounded-xl p-6 hover:border-honey-500 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CategoryBadge category={service.category} />
                    <h3 className="font-sans font-bold text-lg text-charcoal-900 mt-2 mb-2">
                      {sanitizeContent(service.title)}
                    </h3>
                    <p className="text-sm text-charcoal-600 mb-3 line-clamp-2">
                      {sanitizeContent(service.description)}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="size-4 text-honey-500 fill-honey-500" />
                      <span className="text-charcoal-900 font-medium text-sm">
                        {(service.rating ?? 0).toFixed(1)}
                      </span>
                      <span className="text-charcoal-500 text-sm">
                        ({service.review_count} reviews)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl text-charcoal-900">
                      {formatPrice(service.price, service.price_unit)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {services.length === 0 && (
              <div className="bg-white border border-charcoal-100 rounded-xl p-8 text-center">
                <p className="text-charcoal-500">No active services yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.map((review) => {
              const reviewerName = `${review.reviewer_first_name} ${review.reviewer_last_name}`.trim();
              return (
                <div
                  key={review.id}
                  className="bg-white border border-charcoal-100 rounded-xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <Avatar name={reviewerName} size="md" src={review.profile_image} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-sans font-bold text-charcoal-900">
                            {reviewerName}
                          </h3>
                          <p className="text-sm text-charcoal-500">{formatReviewDate(review.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-4 ${
                                i < review.rating
                                  ? 'text-honey-500 fill-honey-500'
                                  : 'text-charcoal-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-charcoal-700 mb-2">{sanitizeContent(review.comment)}</p>
                      <p className="text-sm text-charcoal-500">
                        Service: {review.service_title}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {reviews.length === 0 && (
              <div className="bg-white border border-charcoal-100 rounded-xl p-8 text-center">
                <p className="text-charcoal-500">No reviews yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showReportModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          {/* Backdrop click to close */}
          <div style={{ position: 'absolute', inset: 0 }} onClick={() => setShowReportModal(false)} />

          {/* Modal card */}
          <div style={{
            position: 'relative', zIndex: 1, width: '100%', maxWidth: 480,
            margin: '0 16px', padding: 24, borderRadius: 12,
            backgroundColor: '#FFFFFF', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle style={{ width: 20, height: 20, color: '#F59E0B' }} />
                <h3 className="font-sans font-bold text-lg" style={{ color: '#1C1917' }}>
                  Report @{provider.username}
                </h3>
              </div>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X style={{ width: 20, height: 20, color: '#A8A29E' }} />
              </button>
            </div>

            {/* Reason select */}
            <label className="font-sans font-bold text-sm" style={{ display: 'block', color: '#57534E', marginBottom: 6 }}>Reason</label>
            <div style={{ marginBottom: 16 }}>
              <CustomSelect
                value={reportReason}
                onChange={setReportReason}
                options={REPORT_REASON_OPTIONS}
                placeholder="Select a reason..."
                compact
              />
            </div>

            {/* Description */}
            <label className="font-sans font-bold text-sm" style={{ display: 'block', color: '#57534E', marginBottom: 6 }}>Description</label>
            <textarea
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Describe the issue in detail (min 20 characters)..."
              maxLength={1000}
              className="w-full min-h-[120px] px-4 py-3 text-sm bg-white border-2 border-charcoal-200 rounded-xl text-charcoal-900 placeholder:text-charcoal-400 resize-vertical font-sans shadow-sm transition-all focus:border-honey-500 focus:ring-4 focus:ring-honey-100 focus:outline-none"
              style={{ marginBottom: 4 }}
            />
            <CharacterLimitHint current={reportDescription.length} max={1000} min={20} className="mb-5" />

            {/* Submit */}
            <button
              onClick={async () => {
                if (!reportReason || reportDescription.length < 20) return;
                setReportSubmitting(true);
                try {
                  await apiPost('/reports/create.php', {
                    reported_id: provider.id,
                    reason: REPORT_REASON_MAP[reportReason] || reportReason,
                    description: reportDescription,
                  });
                  setHasReported(true);
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                  toast.success('Report submitted. Our team will review it.');
                } catch (err: any) {
                  toast.error(err.message || 'Failed to submit report');
                } finally {
                  setReportSubmitting(false);
                }
              }}
              disabled={!reportReason || reportDescription.length < 20 || reportSubmitting}
              style={{
                width: '100%', height: 44, borderRadius: 8, border: 'none',
                backgroundColor: (!reportReason || reportDescription.length < 20) ? '#D6D3D1' : '#E9A020',
                color: (!reportReason || reportDescription.length < 20) ? '#A8A29E' : '#1C1917',
                fontSize: 14, fontWeight: 700, cursor: (!reportReason || reportDescription.length < 20) ? 'default' : 'pointer',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {reportSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
