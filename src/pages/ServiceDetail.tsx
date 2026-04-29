import { NavBar } from '../components/NavBar';
import { useParams, useNavigate } from 'react-router';
import { apiGet, apiDelete, ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner@2.0.3';
import { useState, useEffect } from 'react';
import { CategoryBadge } from '../components/CategoryBadge';
import { Avatar } from '../components/Avatar';
import { DatePicker } from '../components/DatePicker';
import { TimePicker } from '../components/TimePicker';
import { Star, Check, BadgeCheck, Award, Loader2, Pencil, Trash2, Hexagon, Link2, ArrowRight } from 'lucide-react';
import { parseLocalDate, parseUTC } from '../lib/constants';
import { resolveAssetUrl, nextServiceLibraryFallbackUrl } from '../lib/assetUrl';
import { sanitizeContent } from '../lib/contentFilter';

/* ---------- API response types ---------- */

interface ApiReview {
  id: number;
  reviewer_first_name: string;
  reviewer_last_name: string;
  reviewer_username: string;
  reviewer_profile_image: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

interface CosmeticsPayload {
  frame: { gradient: string; glow: string; css_animation: string | null; ring_size: number } | null;
  badge: { tag: string; bg_color: string; text_color: string; bg_gradient: string | null; css_animation: string | null } | null;
}

interface ApiServiceDetail {
  id: number;
  title: string;
  category: string;
  description: string;
  price: number;
  price_unit: string;
  rating: number;
  review_count: number;
  included: string[];
  provider_id: number;
  provider_first_name: string;
  provider_last_name: string;
  provider_username: string;
  provider_bio: string | null;
  provider_major: string;
  provider_university: string;
  provider_profile_image: string | null;
  cosmetics?: CosmeticsPayload;
  images: string[];
  reviews: ApiReview[];
  provider_verified_recently: boolean;
  created_at: string;
  avg_response_minutes: number | null;
}

interface ServiceResponse {
  service: ApiServiceDetail;
}

/* ---------- Helpers ---------- */

function formatPrice(price: number, unit?: string): string {
  if (unit) return `\u2B21 ${price}/${unit}`;
  return `\u2B21 ${price}`;
}

function formatReviewDate(dateStr: string): string {
  const d = parseUTC(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatResponseTime(minutes: number | null): string | null {
  if (minutes === null) return null;
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `< ${hours + 1}h`;
  const days = Math.floor(hours / 24);
  return `~${days}d`;
}

/* ---------- Component ---------- */

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const [service, setService] = useState<ApiServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [imgError, setImgError] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [matchingRequests, setMatchingRequests] = useState<{ total: number; requests: { id: number; title: string; budget: string }[] }>({ total: 0, requests: [] });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const fetchService = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const data = await apiGet<ServiceResponse>('/services/get.php', { id });
        if (!cancelled) {
          setService(data.service);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load service');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchService();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!service?.category) return;
    apiGet<{ requests: { id: number; title: string; budget: string }[]; pagination: { total: number } }>('/requests/list.php', {
      category: service.category,
      status: 'open',
      limit: 3,
    })
      .then((data) => setMatchingRequests({ total: data.pagination.total, requests: data.requests }))
      .catch(() => {});
  }, [service?.category]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/service/${id}`);
      setLinkCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { toast.error('Failed to copy link'); }
  };

  const handleDelete = async () => {
    if (!service || deleting) return;
    setDeleting(true);
    try {
      await apiDelete('/services/delete.php', { id: String(service.id) });
      toast.success('Service deleted');
      navigate('/profile');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete service');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const coverImage = resolveAssetUrl(service?.images?.[0] ?? null);

  /* --- Loading state --- */
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
          {/* Breadcrumb */}
          <div className="flex gap-2 mb-6">
            <div className="h-3 w-16 bg-charcoal-100 rounded animate-pulse" />
            <div className="h-3 w-4 bg-charcoal-100 rounded animate-pulse" />
            <div className="h-3 w-24 bg-charcoal-100 rounded animate-pulse" />
          </div>

          {/* 2-column layout */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column */}
            <div className="flex-1">
              {/* Image */}
              <div className="h-80 rounded-xl bg-charcoal-100 animate-pulse mb-6" />
              {/* Title */}
              <div className="h-7 w-3/4 bg-charcoal-100 rounded animate-pulse mb-3" />
              {/* Category badge */}
              <div className="h-5 w-24 rounded-full bg-charcoal-100 animate-pulse mb-3" />
              {/* Price / rating row */}
              <div className="flex gap-4 mb-4">
                <div className="h-5 w-20 bg-charcoal-100 rounded animate-pulse" />
                <div className="h-5 w-16 bg-charcoal-100 rounded animate-pulse" />
              </div>
              {/* Description lines */}
              <div className="mb-6">
                <div className="h-4 w-full bg-charcoal-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-charcoal-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-charcoal-100 rounded animate-pulse" />
              </div>
              {/* CTA button */}
              <div className="h-12 w-full rounded-lg bg-charcoal-100 animate-pulse" />
            </div>

            {/* Right column */}
            <div className="lg:w-80">
              {/* Provider card */}
              <div className="bg-white border border-charcoal-100 rounded-xl p-6">
                <div className="size-16 rounded-full bg-charcoal-100 animate-pulse mx-auto mb-4" />
                <div className="h-5 w-32 mx-auto bg-charcoal-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-charcoal-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-charcoal-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-full bg-charcoal-100 rounded animate-pulse mb-2" />
                <div className="h-10 w-full rounded-lg bg-charcoal-100 animate-pulse mt-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --- 404 state --- */
  if (notFound) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-16 pt-16 pb-16 text-center">
          <h1 className="font-display italic text-3xl text-charcoal-900 mb-4">Service not found</h1>
          <p className="text-charcoal-600 mb-6">The service you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/discover')}
            className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
          >
            Browse Services
          </button>
        </div>
      </div>
    );
  }

  /* --- Error state --- */
  if (error || !service) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-16 pt-16 pb-16 text-center">
          <h1 className="font-display italic text-3xl text-charcoal-900 mb-4">Something went wrong</h1>
          <p className="text-charcoal-600 mb-6">{error || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* --- Derived values --- */
  const providerName = `${service.provider_first_name} ${service.provider_last_name}`;
  const priceFormatted = formatPrice(service.price, service.price_unit);
  const reviewCount = service.review_count;
  const reviews = service.reviews || [];
  const memberSince = service.created_at
    ? parseUTC(service.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';
  const isOwner = user?.id === service.provider_id;
  const isAdmin = user?.role === 'admin' && !user?.impersonating;

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        {/* Breadcrumb */}
        <div className="text-sm text-charcoal-400 mb-6">
          <button onClick={() => navigate('/discover')} className="hover:text-honey-600 transition-colors">
            Discover
          </button>
          {' > '}
          <button onClick={() => navigate(`/discover?category=${encodeURIComponent(service.category)}`)} className="hover:text-honey-600 transition-colors">{service.category}</button>
          {' > '}
          <span className="text-charcoal-600">{service.title}</span>
        </div>

        {isOwner && (
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(`/edit-service/${service.id}`)}
              className="h-10 px-4 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600 flex items-center gap-2"
            >
              <Pencil className="size-4" />
              Edit Service
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="h-10 px-4 bg-red-50 text-red-700 border border-red-200 rounded-md font-sans font-bold text-sm transition-all hover:bg-red-100 flex items-center gap-2"
              >
                <Trash2 className="size-4" />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 font-medium">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="h-10 px-4 bg-red-500 text-white rounded-md font-sans font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="h-10 px-4 bg-charcoal-100 text-charcoal-700 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Column */}
          <div className="flex-1">
            {/* Image Gallery */}
            {coverImage && !imgError ? (
              <div className="h-80 rounded-xl overflow-hidden">
                <img
                  src={coverImage}
                  alt={service.title}
                  className="w-full h-full"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    const current = e.currentTarget.currentSrc || e.currentTarget.src;
                    const fallback = nextServiceLibraryFallbackUrl(current);
                    if (fallback && fallback !== current) {
                      e.currentTarget.src = fallback;
                      return;
                    }
                    setImgError(true);
                  }}
                />
              </div>
            ) : (
              <div className="h-80 rounded-xl overflow-hidden bg-gradient-to-br from-honey-100 via-cream-100 to-charcoal-50 flex items-center justify-center">
                <Hexagon className="w-16 h-16 text-charcoal-300" />
              </div>
            )}

            <h1 className="font-sans font-bold text-2xl text-charcoal-900 mt-6">{sanitizeContent(service.title)}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-charcoal-500">by</span>
              <Avatar size={24} initial={providerName[0]} frame={service.cosmetics?.frame ?? null} src={service.provider_profile_image} />
              <button
                onClick={() => navigate(`/${service.provider_username}`)}
                className="text-sm text-honey-600 hover:text-honey-700 font-medium"
              >
                {providerName}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <CategoryBadge category={service.category} linked />
              {service.provider_verified_recently && (
                <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-honey-100 text-honey-800 flex items-center gap-1" style={{ fontSize: '10px' }}>
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
              {service.rating >= 4.7 && service.review_count >= 5 && (
                <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-emerald-50 text-emerald-700 flex items-center gap-1" style={{ fontSize: '10px' }}>
                  <Award className="w-3 h-3" />
                  Top Rated
                </span>
              )}
            </div>

            <div className="mt-8">
              <h2 className="font-sans font-bold text-lg text-charcoal-900 mb-3">About this service</h2>
              <div className="space-y-3 text-base text-charcoal-600 leading-relaxed">
                {service.description.split(/\n\s*\n/).map((paragraph, i) => {
                  const trimmed = paragraph.trim();
                  return trimmed ? <p key={i}>{sanitizeContent(trimmed)}</p> : null;
                })}
              </div>
            </div>

            {service.included && service.included.length > 0 && (
              <div className="mt-6">
                <h2 className="font-sans font-bold text-lg text-charcoal-900 mb-3">What's included</h2>
                <div className="space-y-1.5">
                  {service.included.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-semantic-success mt-0.5 flex-shrink-0" />
                      <span className="text-base text-charcoal-600">{sanitizeContent(item)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Requests — only visible to the service provider */}
            {isOwner && matchingRequests.total > 0 && (
              <div className="mt-8 bg-honey-50 border border-honey-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans font-bold text-sm text-charcoal-900">
                    {matchingRequests.total === 1
                      ? '1 student is looking for'
                      : `${matchingRequests.total} students are looking for`}{' '}
                    {service.category} services
                  </h3>
                  <button
                    onClick={() => navigate(`/discover?tab=requests&category=${encodeURIComponent(service.category)}`)}
                    className="text-xs font-bold text-honey-700 hover:text-honey-800 flex items-center gap-1"
                  >
                    View all
                    <ArrowRight className="size-3" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {matchingRequests.requests.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => navigate(`/request/${req.id}`)}
                      className="w-full text-left bg-white rounded-lg px-3.5 py-2.5 border border-honey-100 hover:border-honey-300 transition-all flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-charcoal-800 font-medium truncate">{req.title}</span>
                      <span className="text-xs text-charcoal-500 shrink-0">{req.budget}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="mt-8">
              <h2 className="font-sans font-bold text-lg text-charcoal-900 mb-4">
                Reviews ({reviewCount})
              </h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="font-mono text-5xl font-bold text-charcoal-900">{service.rating}</div>
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i <= Math.floor(service.rating)
                            ? 'fill-honey-500 text-honey-500 stroke-0'
                            : 'text-charcoal-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-charcoal-400">from {reviewCount} reviews</div>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => {
                    const reviewerName = `${review.reviewer_first_name} ${review.reviewer_last_name}`;
                    return (
                      <div key={review.id} className="bg-cream-100 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <button onClick={() => navigate(`/${review.reviewer_username}`)} className="shrink-0 hover:opacity-80 transition-opacity">
                            <Avatar size={36} initial={reviewerName[0]} src={review.reviewer_profile_image} />
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <button onClick={() => navigate(`/${review.reviewer_username}`)} className="font-sans font-bold text-sm text-charcoal-900 hover:text-honey-600 transition-colors">{reviewerName}</button>
                              <span className="text-xs text-charcoal-400">{formatReviewDate(review.created_at)}</span>
                            </div>
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i <= review.rating
                                      ? 'fill-honey-500 text-honey-500 stroke-0'
                                      : 'text-charcoal-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-charcoal-600 mt-2 leading-relaxed">{sanitizeContent(review.comment)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-charcoal-400">No reviews yet.</p>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-80 lg:sticky lg:top-24 lg:self-start space-y-5">
            {/* Booking Card */}
            <div className="bg-cream-50 border border-charcoal-100 rounded-xl shadow-lg p-6">
              <div className="font-mono text-3xl font-bold text-charcoal-900 mb-2">{priceFormatted}</div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i <= Math.floor(service.rating)
                          ? 'fill-honey-500 text-honey-500 stroke-0'
                          : 'text-charcoal-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-sm text-charcoal-700">{service.rating}</span>
                <span className="text-sm text-charcoal-400">({reviewCount} reviews)</span>
              </div>

              {isOwner ? (
                <div className="mt-4 text-center">
                  <p className="text-sm text-charcoal-500">This is your service</p>
                </div>
              ) : (
                <>
                  <div className="h-px bg-charcoal-100 my-4" />

                  <div className="space-y-3">
                    <div>
                      <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                        Select date
                      </label>
                      <DatePicker
                        value={selectedDate}
                        onChange={setSelectedDate}
                        placeholder="Choose a date"
                        minDate={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block font-sans font-medium text-sm text-charcoal-700 mb-1.5">
                        Select time
                      </label>
                      <TimePicker
                        value={selectedTime}
                        onChange={setSelectedTime}
                        selectedDate={selectedDate}
                        placeholder="Choose a time"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const params = new URLSearchParams({ serviceId: String(service.id) });
                      if (selectedDate) params.set('date', selectedDate);
                      if (selectedTime) params.set('time', selectedTime);
                      navigate(`/book?${params.toString()}`);
                    }}
                    disabled={isAdmin}
                    className={`w-full mt-4 h-11 px-6 rounded-md font-sans font-bold text-sm transition-all ${
                      isAdmin
                        ? 'bg-charcoal-100 text-charcoal-400 cursor-not-allowed'
                        : 'bg-honey-500 text-charcoal-900 hover:bg-honey-600 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(233,160,32,0.25),0_0_60px_rgba(233,160,32,0.08)]'
                    }`}
                  >
                    Book Now
                  </button>

                  <button
                    onClick={() => navigate(`/messages?userId=${service.provider_id}&ctxType=service&ctxId=${service.id}&ctxTitle=${encodeURIComponent(service.title)}`)}
                    disabled={isAdmin}
                    className={`w-full mt-2 h-11 px-6 rounded-md font-sans font-bold text-sm transition-all ${
                      isAdmin
                        ? 'bg-charcoal-100 text-charcoal-400 cursor-not-allowed border border-charcoal-100'
                        : 'bg-transparent text-charcoal-800 border border-charcoal-200 hover:bg-charcoal-50'
                    }`}
                  >
                    Message Provider
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="w-full mt-2 h-11 px-6 bg-transparent text-charcoal-800 border border-charcoal-200 rounded-md font-sans font-bold text-sm transition-all hover:bg-charcoal-50 flex items-center justify-center gap-2"
                  >
                    <Link2 className="size-4" />
                    {linkCopied ? 'Copied!' : 'Copy Link'}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-charcoal-400 mt-3">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    You'll pay with HiveCoins
                  </div>
                </>
              )}
            </div>

            {/* Provider Card */}
            <div className="bg-cream-50 border border-charcoal-100 rounded-xl p-5">
              <div className="flex flex-col items-center">
                <button onClick={() => navigate(`/${service.provider_username}`)} className="hover:opacity-80 transition-opacity">
                  <Avatar size={56} initial={providerName[0]} frame={service.cosmetics?.frame ?? null} src={service.provider_profile_image} />
                </button>
                <button onClick={() => navigate(`/${service.provider_username}`)} className="font-sans font-bold text-base text-charcoal-900 mt-3 text-center hover:text-honey-600 transition-colors">
                  {providerName}
                </button>
                <div className="text-sm text-charcoal-400 text-center">
                  {service.provider_university || 'State University'}
                </div>
                {service.provider_bio && (
                  <p className="text-xs text-charcoal-500 text-center mt-2 leading-relaxed line-clamp-3">
                    {sanitizeContent(service.provider_bio)}
                  </p>
                )}
                <div className="flex justify-center gap-4 mt-3 text-xs text-charcoal-500">
                  <span>&#11088; {service.rating}</span>
                  <span>&#128230; {reviewCount} jobs</span>
                  {memberSince && <span>&#128197; {memberSince}</span>}
                </div>
                <button
                  onClick={() => navigate(`/${service.provider_username}`)}
                  className="text-honey-600 font-medium text-sm mt-3 hover:text-honey-700"
                >
                  View Profile
                </button>
                {formatResponseTime(service.avg_response_minutes) && (
                  <div className="flex items-center gap-2 text-xs text-charcoal-400 mt-2 text-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Usually responds in {formatResponseTime(service.avg_response_minutes)}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
