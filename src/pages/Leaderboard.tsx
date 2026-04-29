import { useState, useEffect } from 'react';
import { NavBar } from '../components/NavBar';
import { Avatar } from '../components/Avatar';
import { ProfileBadge } from '../components/ProfileBadge';
import { useNavigate, Link } from 'react-router';
import { apiGet, ApiError } from '../lib/api';
import type { FrameData, BadgeData } from '../lib/auth';
import { CATEGORIES, CATEGORY_COLORS } from '../lib/constants';
import { Trophy, Star, Award, Loader2, Zap } from 'lucide-react';

interface CosmeticsPayload {
  frame: FrameData | null;
  badge: BadgeData | null;
}

interface LeaderboardEntry {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  role?: string;
  buzz_score: number;
  completed_orders: number;
  avg_rating: number;
  review_count: number;
  profile_image?: string | null;
  cosmetics?: CosmeticsPayload;
}

const categoriesWithAll = ['All', ...CATEGORIES];

// Color for "All" category (not in shared constants)
const allCategoryColor = { bg: '#F4F4F5', text: '#3F3F46' };

const categoryColorsWithAll: Record<string, { bg: string; text: string }> = {
  All: allCategoryColor,
  ...CATEGORY_COLORS,
};

export function Leaderboard() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'month' | 'year' | 'alltime'>('month');
  const [category, setCategory] = useState('All');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string> = { period: timeframe };
        if (category !== 'All') params.category = category;
        const data = await apiGet<{ leaderboard: LeaderboardEntry[] }>('/leaderboard.php', params);
        if (cancelled) return;
        // TODO: backend should exclude admin from leaderboard; filtering here as fallback
        setEntries(data.leaderboard.filter(e => e.role !== 'admin'));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load leaderboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => { cancelled = true; };
  }, [timeframe, category]);

  // Map entries to display format
  const leaderboardData = entries.map((entry, index) => ({
    rank: index + 1,
    id: entry.id,
    username: entry.username,
    name: `${entry.first_name} ${entry.last_name}`,
    buzzScore: entry.buzz_score,
    completedOrders: entry.completed_orders,
    rating: entry.avg_rating,
    reviewCount: entry.review_count,
    profileImage: entry.profile_image,
    cosmetics: entry.cosmetics,
  }));

  const topThree = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    return '';
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="font-display italic text-3xl md:text-5xl text-charcoal-900 mb-2">
            Leaderboard
          </h1>
          <p className="text-charcoal-600">
            Top members on HiveFive ranked by Buzz Score
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-8">
          {/* Timeframe */}
          <div className="flex gap-2">
            {([['month', 'This Month'], ['year', 'This Year'], ['alltime', 'All Time']] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTimeframe(value)}
                className={`h-10 px-4 rounded-lg font-sans font-bold text-sm transition-all ${
                  timeframe === value
                    ? 'bg-honey-500 text-charcoal-900'
                    : 'bg-white border border-charcoal-100 text-charcoal-700 hover:border-charcoal-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category */}
          <div className="flex gap-2 flex-wrap">
            {categoriesWithAll.map((cat) => {
              const colors = categoryColorsWithAll[cat] || categoryColorsWithAll.Other;
              const isActive = category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="h-9 px-3 rounded-full font-sans text-sm font-bold transition-all hover:opacity-80"
                  style={isActive
                    ? { backgroundColor: colors.text, color: '#FFFFFF' }
                    : { backgroundColor: colors.bg, color: colors.text }
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center mb-6">
            <h3 className="font-sans font-bold text-red-900 mb-2">Something went wrong</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Content area with loading overlay */}
        <div className="relative" style={{ minHeight: '200px' }}>
          {/* Loading skeleton */}
          {loading && (
            <div className="absolute inset-0 z-10 bg-cream-50 rounded-xl">
              {/* Header */}
              <div className="mb-6">
                <div className="h-7 w-48 bg-charcoal-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-charcoal-100 rounded animate-pulse" />
              </div>
              {/* Timeframe filter pills */}
              <div className="flex gap-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-9 w-24 rounded-full bg-charcoal-100 animate-pulse" />
                ))}
              </div>
              {/* Category pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-20 rounded-full bg-charcoal-100 animate-pulse" />
                ))}
              </div>
              {/* Top 3 hero cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white border border-charcoal-100 rounded-xl p-6 flex flex-col items-center">
                    <div className="size-20 rounded-full bg-charcoal-100 animate-pulse mb-3" />
                    <div className="h-5 w-28 bg-charcoal-100 rounded animate-pulse mb-2" />
                    <div className="h-4 w-20 bg-charcoal-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
              {/* Table rows */}
              <div>
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-charcoal-100">
                    <div className="h-5 w-8 bg-charcoal-100 rounded animate-pulse" />
                    <div className="size-10 rounded-full bg-charcoal-100 animate-pulse" />
                    <div className="h-4 w-32 bg-charcoal-100 rounded animate-pulse flex-1" />
                    <div className="h-4 w-16 bg-charcoal-100 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-charcoal-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ opacity: loading ? 0.4 : 1, transition: 'opacity 300ms ease' }}>
            {/* Empty state */}
            {!loading && !error && leaderboardData.length === 0 && (
              <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
                <p className="text-charcoal-500">No providers found for this timeframe and category.</p>
              </div>
            )}

            {/* Top 3 — Mobile list */}
            {topThree.length >= 3 && (
              <div className="md:hidden mb-6">
                <div className="bg-white border border-charcoal-100 rounded-xl overflow-hidden divide-y divide-charcoal-100">
                  {topThree.map((user) => (
                    <button
                      key={user.rank}
                      onClick={() => navigate(`/${user.username}`)}
                      className="w-full p-4 hover:bg-cream-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-full bg-gradient-to-br ${getMedalColor(user.rank)} flex items-center justify-center shrink-0`}>
                          <span className="font-display italic text-white text-sm">{user.rank}</span>
                        </div>
                        <div className="relative shrink-0">
                          <Avatar name={user.name} size="md" frame={user.cosmetics?.frame ?? null} src={user.profileImage} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-sans font-bold text-charcoal-900 truncate">{user.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <ProfileBadge badge={user.cosmetics?.badge ?? null} size="sm" />
                            {category !== 'All' && (
                              <span className="text-xs text-charcoal-500">
                                {user.completedOrders}{' '}orders{' '}&middot;{' '}{user.rating.toFixed(1)} &#9733;
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono text-lg text-charcoal-900 flex items-center gap-1">
                            <Zap className="size-4 text-honey-500" />
                            {user.buzzScore}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Top 3 — Desktop podium */}
            {topThree.length >= 3 && (
              <div className="hidden md:block mb-12 pt-4">
                <div className="grid grid-cols-3 gap-6 mb-8" style={{ overflow: 'visible' }}>
                  {/* 2nd Place */}
                  <button
                    onClick={() => navigate(`/${topThree[1].username}`)}
                    className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ paddingTop: 60, overflow: 'visible' }}
                  >
                    <div className="relative inline-block mb-4" style={{ overflow: 'visible' }}>
                      <Avatar name={topThree[1].name} size="lg" frame={topThree[1].cosmetics?.frame ?? null} src={topThree[1].profileImage} />
                      <div className={`absolute -bottom-2 -right-2 size-10 bg-gradient-to-br ${getMedalColor(2)} rounded-full flex items-center justify-center border-2 border-white shadow-lg`}>
                        <span className="font-display italic text-white text-lg">2</span>
                      </div>
                    </div>
                    <h3 className="font-sans font-bold text-charcoal-900 mb-1">
                      {topThree[1].name}
                    </h3>
                    <div className="flex justify-center mb-2" style={{ minHeight: 24 }}>
                      <ProfileBadge badge={topThree[1].cosmetics?.badge ?? null} size="sm" />
                    </div>
                    <div className="font-mono text-2xl text-charcoal-900 flex items-center justify-center gap-1">
                      <Zap className="size-5 text-honey-500" />
                      {topThree[1].buzzScore}
                    </div>
                    {category !== 'All' && (
                      <div className="text-sm text-charcoal-500 mt-1.5">
                        {topThree[1].completedOrders}{' '}orders{' '}&middot;{' '}{topThree[1].rating.toFixed(1)} &#9733;
                      </div>
                    )}
                  </button>

                  {/* 1st Place */}
                  <button
                    onClick={() => navigate(`/${topThree[0].username}`)}
                    className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ overflow: 'visible' }}
                  >
                    <div className="mb-2 flex justify-center">
                      <Trophy className="size-8 text-yellow-500" />
                    </div>
                    <div className="relative inline-block mb-4" style={{ overflow: 'visible' }}>
                      <Avatar name={topThree[0].name} size="xl" frame={topThree[0].cosmetics?.frame ?? null} src={topThree[0].profileImage} />
                      <div className={`absolute -bottom-2 -right-2 size-12 bg-gradient-to-br ${getMedalColor(1)} rounded-full flex items-center justify-center border-2 border-white shadow-lg`}>
                        <span className="font-display italic text-white text-2xl">1</span>
                      </div>
                    </div>
                    <h3 className="font-sans font-bold text-xl text-charcoal-900 mb-1">
                      {topThree[0].name}
                    </h3>
                    <div className="flex justify-center mb-2" style={{ minHeight: 24 }}>
                      <ProfileBadge badge={topThree[0].cosmetics?.badge ?? null} />
                    </div>
                    <div className="font-mono text-3xl text-charcoal-900 flex items-center justify-center gap-1">
                      <Zap className="size-7 text-honey-500" />
                      {topThree[0].buzzScore}
                    </div>
                    {category !== 'All' && (
                      <div className="text-sm text-charcoal-500 mt-1.5">
                        {topThree[0].completedOrders}{' '}orders{' '}&middot;{' '}{topThree[0].rating.toFixed(1)} &#9733;
                      </div>
                    )}
                  </button>

                  {/* 3rd Place */}
                  <button
                    onClick={() => navigate(`/${topThree[2].username}`)}
                    className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                    style={{ paddingTop: 60, overflow: 'visible' }}
                  >
                    <div className="relative inline-block mb-4" style={{ overflow: 'visible' }}>
                      <Avatar name={topThree[2].name} size="lg" frame={topThree[2].cosmetics?.frame ?? null} src={topThree[2].profileImage} />
                      <div className={`absolute -bottom-2 -right-2 size-10 bg-gradient-to-br ${getMedalColor(3)} rounded-full flex items-center justify-center border-2 border-white shadow-lg`}>
                        <span className="font-display italic text-white text-lg">3</span>
                      </div>
                    </div>
                    <h3 className="font-sans font-bold text-charcoal-900 mb-1">
                      {topThree[2].name}
                    </h3>
                    <div className="flex justify-center mb-2" style={{ minHeight: 24 }}>
                      <ProfileBadge badge={topThree[2].cosmetics?.badge ?? null} size="sm" />
                    </div>
                    <div className="font-mono text-2xl text-charcoal-900 flex items-center justify-center gap-1">
                      <Zap className="size-5 text-honey-500" />
                      {topThree[2].buzzScore}
                    </div>
                    {category !== 'All' && (
                      <div className="text-sm text-charcoal-500 mt-1.5">
                        {topThree[2].completedOrders}{' '}orders{' '}&middot;{' '}{topThree[2].rating.toFixed(1)} &#9733;
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Rest of Leaderboard */}
            {rest.length > 0 && (
              <div className="bg-white border border-charcoal-100 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-charcoal-100">
                  <h2 className="text-xl font-display italic text-charcoal-900">
                    Full Rankings
                  </h2>
                </div>

                <div className="divide-y divide-charcoal-100">
                  {rest.map((user) => (
                    <button
                      key={user.rank}
                      onClick={() => navigate(`/${user.username}`)}
                      className="w-full p-4 hover:bg-cream-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="w-12 text-center">
                          <div className="font-display italic text-2xl text-charcoal-400">
                            {user.rank}
                          </div>
                        </div>

                        {/* Avatar & Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar name={user.name} size="md" frame={user.cosmetics?.frame ?? null} src={user.profileImage} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <h3 className="font-sans font-bold text-charcoal-900 truncate">
                                {user.name}
                              </h3>
                              <div className="hidden md:block">
                                <ProfileBadge badge={user.cosmetics?.badge ?? null} size="sm" />
                              </div>
                            </div>
                            <div className="md:hidden">
                              <ProfileBadge badge={user.cosmetics?.badge ?? null} size="sm" />
                            </div>
                          </div>
                        </div>

                        {/* Stats — desktop */}
                        <div className="hidden md:flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-charcoal-500 mb-1">
                              <Zap className="size-4" />
                              <span className="font-mono text-xs">Buzz</span>
                            </div>
                            <div className="font-mono text-charcoal-900 font-bold">
                              {user.buzzScore}
                            </div>
                          </div>

                          {category !== 'All' && (
                            <>
                              <div className="text-center">
                                <div className="flex items-center gap-1 text-charcoal-500 mb-1">
                                  <Award className="size-4" />
                                  <span className="font-mono text-xs">Orders</span>
                                </div>
                                <div className="font-mono text-charcoal-900">
                                  {user.completedOrders}
                                </div>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center gap-1 text-charcoal-500 mb-1">
                                  <Star className="size-4" />
                                  <span className="font-mono text-xs">Rating</span>
                                </div>
                                <div className="font-mono text-charcoal-900">
                                  {user.rating.toFixed(1)}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Stats — mobile */}
                        <div className="md:hidden text-right">
                          <div className="font-mono text-lg text-charcoal-900 flex items-center justify-end gap-1">
                            <Zap className="size-4 text-honey-500" />
                            {user.buzzScore}
                          </div>
                          {category !== 'All' && (
                            <div className="text-xs text-charcoal-500">
                              {user.completedOrders}{' '}orders{' '}&middot;{' '}{user.rating.toFixed(1)} &#9733;
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Buzz Score info link */}
        <div className="mt-6 text-center">
          <Link
            to="/buzz-score"
            className="inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-honey-600 transition-colors font-sans"
          >
            <Zap className="size-3.5" />
            How is Buzz Score calculated?
          </Link>
        </div>
      </div>
    </div>
  );
}
