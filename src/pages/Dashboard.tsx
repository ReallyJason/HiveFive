import { useState, useEffect } from 'react';
import { NavBar } from '../components/NavBar';
import { StatusBadge } from '../components/StatusBadge';
import { useNavigate } from 'react-router';
import { apiGet } from '../lib/api';
import { useAuth } from '../lib/auth';
import { TrendingUp, DollarSign, Package, Star, Clock, ArrowRight, FileText, Users } from 'lucide-react';
import { sanitizeContent } from '../lib/contentFilter';
import { formatSchedule, parseUTC } from '../lib/constants';

interface Stats {
  total_earnings: number;
  total_spent: number;
  services_offered: number;
  completed_orders: number;
  average_rating: number;
  response_time: string;
}

interface OtherParty {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  role: string;
}

interface Order {
  id: number;
  service_title: string;
  service_category: string;
  client_id: number;
  provider_id: number;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  scheduled_utc: string | null;
  price: number;
  total: number;
  auto_complete_at: string | null;
  other_party: OtherParty;
}

interface RequestItem {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  deadline: string;
  proposal_count?: number;
  proposalsCount?: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin' && !user?.impersonating) navigate('/admin', { replace: true });
  }, [user, navigate]);

  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [myRequests, setMyRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, ordersRes, requestsRes] = await Promise.all([
          apiGet<Stats>('/users/stats.php'),
          apiGet<{ orders: Order[] }>('/orders/list.php'),
          apiGet<{ requests: RequestItem[] }>('/requests/list.php', { requester: 'me' }).catch(() => ({ requests: [] })),
        ]);

        if (cancelled) return;

        setStats(statsRes);
        setOrders(ordersRes.orders || []);
        setMyRequests(
          (requestsRes.requests || []).map((req) => ({
            ...req,
            proposalsCount: req.proposal_count ?? req.proposalsCount ?? 0,
          })),
        );
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => { cancelled = true; };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-7 w-48 bg-charcoal-100 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-charcoal-100 rounded animate-pulse" />
          </div>

          {/* Stats grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-charcoal-100 rounded-xl p-6 h-28 animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-10 bg-charcoal-100 rounded-lg" />
                  <div className="h-4 w-24 bg-charcoal-100 rounded" />
                </div>
                <div className="h-7 w-16 bg-charcoal-100 rounded" />
              </div>
            ))}
          </div>

          {/* Active Orders skeleton */}
          <div className="bg-white border border-charcoal-100 rounded-xl p-6 mb-8">
            <div className="h-6 w-40 bg-charcoal-100 rounded animate-pulse mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-charcoal-100 rounded-lg p-4 animate-pulse">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-5 w-20 bg-charcoal-100 rounded-full" />
                      </div>
                      <div className="h-5 w-48 bg-charcoal-100 rounded mb-1" />
                      <div className="h-4 w-32 bg-charcoal-100 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-charcoal-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Requests skeleton */}
          <div className="bg-white border border-charcoal-100 rounded-xl p-6 mb-8">
            <div className="h-6 w-40 bg-charcoal-100 rounded animate-pulse mb-6" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border border-charcoal-100 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-56 bg-charcoal-100 rounded" />
                    <div className="h-5 w-24 bg-charcoal-100 rounded-full" />
                  </div>
                  <div className="h-4 w-full bg-charcoal-100 rounded mb-2" />
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-20 bg-charcoal-100 rounded" />
                    <div className="h-5 w-24 bg-charcoal-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white border border-charcoal-100 h-28 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-cream-50">
        <NavBar variant="logged-in" />
        <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-16 pt-8">
          <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
            <h2 className="font-display italic text-2xl text-charcoal-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-charcoal-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeOrders = orders;
  const pendingOrders = activeOrders.filter((o) => o.status === 'pending');
  const inProgressOrders = activeOrders.filter((o) => o.status === 'in_progress');
  const awaitingOrders = activeOrders.filter((o) => o.status === 'awaiting_completion');

  const firstName = user?.first_name || 'there';
  const balance = user?.hivecoin_balance ?? 0;

  const totalEarnings = stats?.total_earnings ?? 0;
  const completedOrders = stats?.completed_orders ?? 0;
  const averageRating = stats?.average_rating ?? 0;
  const servicesOffered = stats?.services_offered ?? 0;
  const responseTime = stats?.response_time ?? '---';

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display italic text-3xl md:text-5xl text-charcoal-900 mb-2">
            Dashboard
          </h1>
          <p className="text-charcoal-600">
            Welcome back, {firstName}! Here's your activity overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {/* Total Earnings */}
          <div className="bg-white border border-charcoal-100 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 bg-honey-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="size-5 text-honey-700" />
              </div>
              <div className="font-mono text-sm text-charcoal-500">Total Earnings</div>
            </div>
            <div className="text-3xl font-display italic text-charcoal-900">
              {totalEarnings.toLocaleString()}
            </div>
            <div className="text-sm text-charcoal-500 mt-1">
              From {completedOrders} completed orders
            </div>
          </div>

          {/* Balance */}
          <div className="bg-white border border-charcoal-100 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 bg-honey-100 rounded-lg flex items-center justify-center">
                <DollarSign className="size-5 text-honey-700" />
              </div>
              <div className="font-mono text-sm text-charcoal-500">Current Balance</div>
            </div>
            <div className="text-3xl font-display italic text-charcoal-900">
              {balance.toLocaleString()}
            </div>
            <button
              onClick={() => navigate('/settings?tab=wallet')}
              className="text-sm text-honey-600 hover:text-honey-700 mt-1 flex items-center gap-1"
            >
              Manage wallet <ArrowRight className="size-3" />
            </button>
          </div>

          {/* Active Orders */}
          <div className="bg-white border border-charcoal-100 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 bg-honey-100 rounded-lg flex items-center justify-center">
                <Package className="size-5 text-honey-700" />
              </div>
              <div className="font-mono text-sm text-charcoal-500">Active Orders</div>
            </div>
            <div className="text-3xl font-display italic text-charcoal-900">
              {activeOrders.length}
            </div>
            <div className="text-sm text-charcoal-500 mt-1">
              {pendingOrders.length} pending, {inProgressOrders.length} in progress{awaitingOrders.length > 0 ? `, ${awaitingOrders.length} awaiting` : ''}
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white border border-charcoal-100 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 bg-honey-100 rounded-lg flex items-center justify-center">
                <Star className="size-5 text-honey-700" />
              </div>
              <div className="font-mono text-sm text-charcoal-500">Average Rating</div>
            </div>
            <div className="text-3xl font-display italic text-charcoal-900">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-charcoal-500 mt-1">
              From {completedOrders} reviews
            </div>
          </div>

          {/* Services Offered */}
          <div className="bg-white border border-charcoal-100 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 bg-honey-100 rounded-lg flex items-center justify-center">
                <Package className="size-5 text-honey-700" />
              </div>
              <div className="font-mono text-sm text-charcoal-500">Services Offered</div>
            </div>
            <div className="text-3xl font-display italic text-charcoal-900">
              {servicesOffered}
            </div>
            <button
              onClick={() => navigate('/post-service')}
              className="text-sm text-honey-600 hover:text-honey-700 mt-1 flex items-center gap-1"
            >
              Add new service <ArrowRight className="size-3" />
            </button>
          </div>

          {/* Response Time */}
          <div className="bg-white border border-charcoal-100 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 bg-honey-100 rounded-lg flex items-center justify-center">
                <Clock className="size-5 text-honey-700" />
              </div>
              <div className="font-mono text-sm text-charcoal-500">Response Time</div>
            </div>
            <div className="text-3xl font-display italic text-charcoal-900">
              {responseTime}
            </div>
            <div className="text-sm text-charcoal-500 mt-1">
              Average response time
            </div>
          </div>
        </div>

        {/* Active Orders Section */}
        <div className="bg-white border border-charcoal-100 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display italic text-charcoal-900">Active Orders</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-sm text-honey-600 hover:text-honey-700 flex items-center gap-1"
            >
              View all <ArrowRight className="size-4" />
            </button>
          </div>

          {activeOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="size-12 text-charcoal-300 mx-auto mb-3" />
              <p className="text-charcoal-500 mb-4">No active orders</p>
              <button
                onClick={() => navigate('/discover')}
                className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order) => {
                const type = order.client_id === user?.id ? 'buyer' : 'seller';
                const otherName = `${order.other_party.first_name} ${order.other_party.last_name}`;
                const sched = formatSchedule(order.scheduled_utc, order.scheduled_date, order.scheduled_time);

                return (
                  <div
                    key={order.id}
                    className="border border-charcoal-100 rounded-lg p-4 hover:border-charcoal-200 transition-colors cursor-pointer"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={order.status} />
                          <span className="font-mono text-xs text-charcoal-400">
                            {type === 'buyer' ? 'Purchasing' : 'Selling'}
                          </span>
                        </div>
                        <h3 className="font-sans font-bold text-charcoal-900 mb-1">
                          {order.service_title}
                        </h3>
                        <p className="text-sm text-charcoal-600 mb-2">
                          {type === 'buyer' ? `Provider: ${otherName}` : `Client: ${otherName}`}
                        </p>
                        {sched && (
                          <div className="flex items-center gap-4 text-sm text-charcoal-500">
                            <span className="flex items-center gap-1">
                              <Clock className="size-4" />
                              {sched.full}
                            </span>
                          </div>
                        )}
                        {order.status === 'awaiting_completion' && order.auto_complete_at && (
                          <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1">
                            <Clock className="size-3" />
                            Auto-completes {parseUTC(order.auto_complete_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg text-charcoal-900">
                          ⬡ {order.price}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Requests Section */}
        <div className="bg-white border border-charcoal-100 rounded-xl p-4 sm:p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="size-6 text-honey-600" />
              <h2 className="text-2xl font-display italic text-charcoal-900">My Requests</h2>
            </div>
            <button
              onClick={() => navigate('/post-request')}
              className="text-sm text-honey-600 hover:text-honey-700 flex items-center gap-1"
            >
              Post new request <ArrowRight className="size-4" />
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="size-12 text-charcoal-300 mx-auto mb-3" />
              <p className="text-charcoal-500 mb-4">No active requests</p>
              <button
                onClick={() => navigate('/post-request')}
                className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
              >
                Post a Request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((request) => {
                const proposalsCount = request.proposalsCount ?? request.proposal_count ?? 0;

                return (
                  <div
                    key={request.id}
                    className="border border-charcoal-100 rounded-lg p-3 sm:p-4 hover:border-charcoal-200 transition-colors cursor-pointer"
                    onClick={() => navigate(`/request/${request.id}`)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0" style={{ flexBasis: '200px' }}>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-sans font-bold text-charcoal-900">
                            {sanitizeContent(request.title)}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full whitespace-nowrap">
                            <Users className="size-3" />
                            {proposalsCount} proposal{proposalsCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-sm text-charcoal-600 mb-2 line-clamp-1">
                          {sanitizeContent(request.description)}
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3 text-sm text-charcoal-500 flex-wrap">
                          <span className="inline-block px-2 py-0.5 bg-honey-100 text-honey-700 text-xs font-medium rounded whitespace-nowrap">
                            {request.category}
                          </span>
                          <span className="whitespace-nowrap">Budget: {request.budget}</span>
                          {request.deadline !== 'Ongoing' && (
                            <span className="whitespace-nowrap">Due: {request.deadline}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/request/${request.id}`);
                        }}
                        className="h-9 px-4 bg-honey-500 text-charcoal-900 rounded-lg font-sans font-bold text-sm whitespace-nowrap transition-all hover:bg-honey-600 hover:scale-105 shadow-sm shrink-0"
                      >
                        View Proposals
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/post-service')}
            className="bg-white border border-charcoal-200 rounded-xl p-6 hover:border-honey-500 transition-colors text-left group"
          >
            <div className="size-12 bg-honey-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-honey-200 transition-colors">
              <Package className="size-6 text-honey-700" />
            </div>
            <h3 className="font-sans font-bold text-charcoal-900 mb-1">Post a Service</h3>
            <p className="text-sm text-charcoal-600">
              Offer your skills and start earning HiveCoins
            </p>
          </button>

          <button
            onClick={() => navigate('/discover')}
            className="bg-white border border-charcoal-200 rounded-xl p-6 hover:border-honey-500 transition-colors text-left group"
          >
            <div className="size-12 bg-honey-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-honey-200 transition-colors">
              <Star className="size-6 text-honey-700" />
            </div>
            <h3 className="font-sans font-bold text-charcoal-900 mb-1">Browse Services</h3>
            <p className="text-sm text-charcoal-600">
              Find talented students to help with your needs
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
