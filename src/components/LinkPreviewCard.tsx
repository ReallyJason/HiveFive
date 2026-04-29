import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { apiGet } from '../lib/api';
import { resolveAssetUrl, nextServiceLibraryFallbackUrl } from '../lib/assetUrl';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LinkPreviewProps =
  | { type: 'service'; id: number }
  | { type: 'request'; id: number }
  | { type: 'user'; username: string };

interface ServiceData {
  id: number;
  title: string;
  category: string;
  price: number;
  pricing_type: string;
  custom_price_unit: string;
  images: string[];
  provider_first_name: string;
  provider_last_name: string;
}

interface RequestData {
  id: number;
  title: string;
  category: string;
  budget: number;
  status: string;
  proposal_count: number;
}

interface UserData {
  username: string;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  major: string;
  bio: string;
}

interface UserStats {
  buzz_score: number;
  active_services: number;
}

// ---------------------------------------------------------------------------
// Module-level caches
// ---------------------------------------------------------------------------

const previewCache = new Map<string, any>();
const pendingFetches = new Map<string, Promise<any>>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cacheKey(props: LinkPreviewProps): string {
  if (props.type === 'user') return `user:${props.username}`;
  return `${props.type}:${props.id}`;
}

function formatPrice(price: number, pricingType: string, unit: string): string {
  if (pricingType === 'hourly') return `⬡ ${price}/hr`;
  if (pricingType === 'custom' && unit) return `⬡ ${price}/${unit}`;
  return `⬡ ${price}`;
}

async function fetchPreview(props: LinkPreviewProps): Promise<any> {
  const key = cacheKey(props);

  if (previewCache.has(key)) return previewCache.get(key);

  // Deduplicate concurrent fetches for the same key
  if (pendingFetches.has(key)) return pendingFetches.get(key)!;

  const promise = (async () => {
    try {
      if (props.type === 'service') {
        const data = await apiGet<{ service: ServiceData }>('/services/get.php', { id: props.id });
        const result = { type: 'service' as const, service: data.service };
        previewCache.set(key, result);
        return result;
      }

      if (props.type === 'request') {
        const data = await apiGet<{ request: RequestData }>('/requests/get.php', { id: props.id });
        const result = { type: 'request' as const, request: data.request };
        previewCache.set(key, result);
        return result;
      }

      // user
      const data = await apiGet<{ user: UserData; stats: UserStats }>('/users/profile.php', {
        username: props.username,
      });
      const result = { type: 'user' as const, user: data.user, stats: data.stats };
      previewCache.set(key, result);
      return result;
    } catch {
      previewCache.set(key, null);
      return null;
    } finally {
      pendingFetches.delete(key);
    }
  })();

  pendingFetches.set(key, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Shared inline styles
// ---------------------------------------------------------------------------

const cardStyle: React.CSSProperties = {
  maxWidth: 280,
  background: '#ffffff',
  border: '1px solid #e5e2de',
  borderRadius: 8,
  padding: '10px 12px',
  cursor: 'pointer',
  transition: 'background 150ms ease',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const cardHoverBg = '#faf8f5';

const titleStyle: React.CSSProperties = {
  color: '#1F1D1A',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const metaStyle: React.CSSProperties = {
  color: '#78716c',
  fontSize: 11,
  lineHeight: 1.4,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const categoryStyle: React.CSSProperties = {
  color: '#b45309',
  fontWeight: 500,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div
      style={{
        maxWidth: 280,
        background: '#ffffff',
        border: '1px solid #e5e2de',
        borderRadius: 8,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Loader2
        size={16}
        style={{ color: '#78716c', animation: 'spin 1s linear infinite' }}
      />
      <span style={{ ...metaStyle, fontSize: 12 }}>Loading preview…</span>
    </div>
  );
}

function ServicePreview({
  service,
  onClick,
}: {
  service: ServiceData;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageSrc = resolveAssetUrl(service.images?.[0] ?? null);
  const hasImage = !!imageSrc && !imgError;
  const providerName = `${service.provider_first_name} ${service.provider_last_name}`;
  const priceLabel = formatPrice(service.price, service.pricing_type, service.custom_price_unit);

  return (
    <div
      style={{ ...cardStyle, background: hovered ? cardHoverBg : '#ffffff' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Thumbnail */}
      {hasImage ? (
        <img
          src={imageSrc ?? undefined}
          alt=""
          onError={(e) => {
            const current = e.currentTarget.currentSrc || e.currentTarget.src;
            const fallback = nextServiceLibraryFallbackUrl(current);
            if (fallback && fallback !== current) {
              e.currentTarget.src = fallback;
              return;
            }
            setImgError(true);
          }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 6,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 6,
            flexShrink: 0,
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#b45309',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {service.category ? service.category.charAt(0) : 'S'}
        </div>
      )}

      {/* Text content */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={titleStyle}>{service.title}</div>
        <div style={metaStyle}>
          <span style={{ color: '#b45309', fontWeight: 500 }}>{priceLabel}</span>
          {service.category && (
            <>
              <span style={{ margin: '0 4px' }}>·</span>
              <span style={categoryStyle}>{service.category}</span>
            </>
          )}
        </div>
        <div style={metaStyle}>by {providerName}</div>
      </div>
    </div>
  );
}

function RequestPreview({
  request,
  onClick,
}: {
  request: RequestData;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const isOpen = request.status?.toLowerCase() === 'open';
  const statusDotColor = isOpen ? '#16a34a' : '#9ca3af';
  const statusLabel = request.status || 'Unknown';
  const proposals =
    request.proposal_count === 1
      ? '1 proposal'
      : `${request.proposal_count ?? 0} proposals`;

  return (
    <div
      style={{ ...cardStyle, background: hovered ? cardHoverBg : '#ffffff' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Icon */}
      <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>📋</span>

      {/* Text content */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={titleStyle}>{request.title}</div>
        <div style={{ ...metaStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
          {request.budget != null && (
            <>
              <span>⬡&nbsp;{request.budget}</span>
              <span>·</span>
            </>
          )}
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusDotColor,
              flexShrink: 0,
            }}
          />
          <span>{statusLabel}</span>
          <span>·</span>
          <span>{proposals}</span>
        </div>
      </div>
    </div>
  );
}

function UserPreview({
  user,
  stats,
  onClick,
}: {
  user: UserData;
  stats: UserStats;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fullName = `${user.first_name} ${user.last_name}`;
  const hasImage = user.profile_image && !imgError;
  const initial = user.first_name ? user.first_name.charAt(0).toUpperCase() : '?';

  return (
    <div
      style={{ ...cardStyle, background: hovered ? cardHoverBg : '#ffffff' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Avatar */}
      {hasImage ? (
        <img
          src={user.profile_image!}
          alt=""
          onError={() => setImgError(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #fde68a, #f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#78350f',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {initial}
        </div>
      )}

      {/* Text content */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={titleStyle}>{fullName}</div>
        <div style={metaStyle}>
          <span>@{user.username}</span>
          {user.major && (
            <>
              <span style={{ margin: '0 4px' }}>·</span>
              <span>{user.major}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LinkPreviewCard(props: LinkPreviewProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<any | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const key = cacheKey(props);

  useEffect(() => {
    let cancelled = false;

    // Synchronous cache hit — skip loading state entirely
    if (previewCache.has(key)) {
      setData(previewCache.get(key));
      setLoading(false);
      return;
    }

    setLoading(true);

    fetchPreview(props).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <LoadingSkeleton />;
  if (data === null || data === undefined) return null;

  if (data.type === 'service') {
    return (
      <ServicePreview
        service={data.service}
        onClick={() => navigate(`/service/${data.service.id}`)}
      />
    );
  }

  if (data.type === 'request') {
    return (
      <RequestPreview
        request={data.request}
        onClick={() => navigate(`/request/${data.request.id}`)}
      />
    );
  }

  if (data.type === 'user') {
    return (
      <UserPreview
        user={data.user}
        stats={data.stats}
        onClick={() => navigate(`/${data.user.username}`)}
      />
    );
  }

  return null;
}
