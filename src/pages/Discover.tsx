import { NavBar } from '../components/NavBar';
import { ServiceCard } from '../components/ServiceCard';
import { EmptyState } from '../components/EmptyState';
import { CustomSelect } from '../components/CustomSelect';
import { ProposalModal } from '../components/ProposalModal';
import { apiGet, apiPost, ApiError } from '../lib/api';
import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Trophy, Star, Plus, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../lib/auth';
import { useFeatures } from '../lib/features';
import { SORT_OPTIONS, PRICE_FILTER_OPTIONS, CATEGORIES, parseLocalDate, parseUTC } from '../lib/constants';
import { fetchMockServices, fetchMockRequests, fetchMockSidebar } from '../lib/data';
import { sanitizeContent } from '../lib/contentFilter';

/* ---------- API response types ---------- */

interface CosmeticsPayload {
  frame: { gradient: string; glow: string; css_animation: string | null; ring_size: number } | null;
  badge: { tag: string; bg_color: string; text_color: string; bg_gradient: string | null; css_animation: string | null } | null;
}

interface ApiService {
  id: number;
  title: string;
  category: string;
  first_name: string;
  last_name: string;
  provider_id: number;
  provider_username: string;
  price: number;
  price_unit: string;
  rating: number;
  review_count: number;
  description: string;
  thumbnail: string | null;
  cosmetics?: CosmeticsPayload;
}

interface ApiRequest {
  id: number;
  title: string;
  category: string;
  description: string;
  budget: string;
  budget_range: string;
  deadline: string | null;
  status: string;
  requester_first_name: string;
  requester_last_name: string;
  requester_id: number;
  requester_username: string;
  requester_profile_image?: string | null;
  proposal_count: number;
  user_proposed?: boolean;
  cosmetics?: CosmeticsPayload;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface SidebarCategory {
  name: string;
  count: number;
}

interface SidebarProvider {
  rank: number;
  id: number;
  name: string;
  username: string;
  rating: number;
  profile_image?: string | null;
  cosmetics?: CosmeticsPayload;
}

interface SidebarResponse {
  categories: SidebarCategory[];
  request_categories?: SidebarCategory[];
  top_providers: SidebarProvider[];
}

interface ServicesResponse {
  services: ApiService[];
  pagination: Pagination;
}

interface RequestsResponse {
  requests: ApiRequest[];
  pagination: Pagination;
}

/* ---------- Helpers ---------- */

function formatPrice(price: number, unit?: string): string {
  if (unit) return `\u2B21 ${price}/${unit}`;
  return `\u2B21 ${price}`;
}

function timeAgo(dateStr: string): string {
  const date = parseUTC(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'Ongoing';
  const d = parseLocalDate(deadline);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ---------- Pagination Controls ---------- */

function PaginationControls({
  pagination,
  currentPage,
  onPageChange,
}: {
  pagination: Pagination;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const { total_pages } = pagination;
  if (total_pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-10">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-9 px-4 flex items-center gap-1.5 rounded-full font-sans text-sm font-medium transition-all text-charcoal-600 hover:bg-charcoal-100 disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeft className="size-3.5" />
        Prev
      </button>

      <span className="font-mono text-xs text-charcoal-400 tabular-nums">
        {currentPage} / {total_pages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= total_pages}
        className="h-9 px-4 flex items-center gap-1.5 rounded-full font-sans text-sm font-medium transition-all text-charcoal-600 hover:bg-charcoal-100 disabled:opacity-0 disabled:pointer-events-none"
      >
        Next
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

/* ---------- Filter/Sort mapping ---------- */

const REQUEST_SORT_OPTIONS = ['Newest First', 'Oldest First'] as const;
const REQUEST_BUDGET_FILTER_OPTIONS = [
  'Under ⬡50',
  '⬡50-100',
  '⬡100-200',
  '⬡200-500',
  'Over ⬡500',
  'Flexible',
] as const;

function serviceSortToParam(label: string | undefined): string | undefined {
  switch (label) {
    case 'Newest First':
      return 'newest';
    case 'Oldest First':
      return 'oldest';
    case 'Price: Low to High':
      return 'price_asc';
    case 'Price: High to Low':
      return 'price_desc';
    case 'Rating: High to Low':
      return 'rating_desc';
    case 'Most Popular':
      return 'reviews';
    default:
      return undefined;
  }
}

function requestSortToParam(label: string | undefined): string | undefined {
  switch (label) {
    case 'Newest First':
      return 'newest';
    case 'Oldest First':
      return 'oldest';
    default:
      return undefined;
  }
}

function requestBudgetToParam(label: string | undefined): string | undefined {
  switch (label) {
    case 'Under ⬡50':
      return 'under-50';
    case '⬡50-100':
      return '50-100';
    case '⬡100-200':
      return '100-200';
    case '⬡200-500':
      return '200-500';
    case 'Over ⬡500':
      return 'over-500';
    case 'Flexible':
      return 'flexible';
    default:
      return undefined;
  }
}

/* ---------- Component ---------- */

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTabRaw] = useState<'services' | 'requests'>(tabParam === 'requests' ? 'requests' : 'services');

  const setActiveTab = (tab: 'services' | 'requests') => {
    setActiveTabRaw(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'services') next.delete('tab');
      else next.set('tab', tab);
      return next;
    }, { replace: true });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(searchParams.get('category') || undefined);
  const [selectedServiceSort, setSelectedServiceSort] = useState<string | undefined>(undefined);
  const [selectedRequestSort, setSelectedRequestSort] = useState<string | undefined>(undefined);
  const [selectedPrice, setSelectedPrice] = useState<string | undefined>(undefined);
  const [selectedRating, setSelectedRating] = useState<string | undefined>(undefined);
  const [mySchoolOnly, setMySchoolOnly] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Services state
  const [services, setServices] = useState<ApiService[]>([]);
  const [servicesPagination, setServicesPagination] = useState<Pagination | null>(null);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Requests state
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [requestsPagination, setRequestsPagination] = useState<Pagination | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  // Sidebar state
  const [sidebarCategories, setSidebarCategories] = useState<SidebarCategory[]>([]);
  const [sidebarRequestCategories, setSidebarRequestCategories] = useState<SidebarCategory[]>([]);
  const [sidebarProviders, setSidebarProviders] = useState<SidebarProvider[]>([]);

  // Proposal state
  const [selectedRequest, setSelectedRequest] = useState<{
    id: string;
    title: string;
    description: string;
    category: string;
    budget: string;
    deadline: string;
    requester: string;
  } | null>(null);
  const [submittedProposals, setSubmittedProposals] = useState<Set<string>>(new Set());

  const navigate = useNavigate();
  const { user } = useAuth();
  const features = useFeatures();
  const isAdmin = user?.role === 'admin' && !user?.impersonating;
  const searchPlaceholder = activeTab === 'requests'
    ? 'Search requests, users, or university...'
    : 'Search services, users, or university...';

  /* --- Fetch services --- */
  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError(null);
    try {
      // Parse price filter
      let min_price: number | undefined;
      let max_price: number | undefined;
      if (selectedPrice === 'Under \u2B21 25') { max_price = 25; }
      else if (selectedPrice === '\u2B21 25\u201350') { min_price = 25; max_price = 50; }
      else if (selectedPrice === '\u2B21 50\u2013100') { min_price = 50; max_price = 100; }
      else if (selectedPrice === '\u2B21 100\u2013500') { min_price = 100; max_price = 500; }
      else if (selectedPrice === 'Over \u2B21 500') { min_price = 500; }

      // Parse rating filter
      let min_rating: number | undefined;
      if (selectedRating === '4.5+ stars') { min_rating = 4.5; }
      else if (selectedRating === '4.0+ stars') { min_rating = 4.0; }

      const params = {
        category: selectedCategory,
        search: searchQuery || undefined,
        sort: serviceSortToParam(selectedServiceSort),
        school_scope: mySchoolOnly ? 'my_school' : undefined,
        min_price,
        max_price,
        min_rating,
        page,
        limit: 12,
      };
      const data = features.mock_data
        ? await fetchMockServices({ ...params, viewer_university: user?.university })
        : await apiGet<ServicesResponse>('/services/list.php', params);
      setServices(data.services);
      setServicesPagination(data.pagination);
    } catch (err) {
      if (err instanceof ApiError) {
        setServicesError(err.message);
      } else {
        setServicesError('Failed to load services');
      }
    } finally {
      setServicesLoading(false);
    }
  }, [selectedCategory, searchQuery, selectedServiceSort, mySchoolOnly, selectedPrice, selectedRating, page, features.mock_data, user?.university]);

  /* --- Fetch requests --- */
  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    setRequestsError(null);
    try {
      const rParams = {
        category: selectedCategory,
        search: searchQuery || undefined,
        sort: requestSortToParam(selectedRequestSort),
        budget_range: requestBudgetToParam(selectedBudget),
        school_scope: mySchoolOnly ? 'my_school' : undefined,
        status: 'open',
        page,
        limit: 6,
      };
      const data = features.mock_data
        ? await fetchMockRequests({ ...rParams, viewer_university: user?.university })
        : await apiGet<RequestsResponse>('/requests/list.php', rParams);
      setRequests(data.requests);
      setRequestsPagination(data.pagination);
    } catch (err) {
      if (err instanceof ApiError) {
        setRequestsError(err.message);
      } else {
        setRequestsError('Failed to load requests');
      }
    } finally {
      setRequestsLoading(false);
    }
  }, [selectedCategory, searchQuery, selectedRequestSort, selectedBudget, mySchoolOnly, page, features.mock_data, user?.university]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  /* --- Fetch sidebar data (once) --- */
  useEffect(() => {
    const fetchSidebar = features.mock_data
      ? fetchMockSidebar()
      : apiGet<SidebarResponse>('/discover/sidebar.php');
    fetchSidebar
      .then((data) => {
        setSidebarCategories(data.categories);
        setSidebarRequestCategories(data.request_categories ?? data.categories);
        setSidebarProviders(data.top_providers);
      })
      .catch(() => {}); // sidebar is non-critical
  }, [features.mock_data]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery, selectedServiceSort, selectedRequestSort, selectedPrice, selectedRating, mySchoolOnly, selectedBudget, activeTab]);

  useEffect(() => {
    if (!features.requests && activeTab === 'requests') {
      setActiveTab('services');
    }
  }, [features.requests, activeTab]);

  const handleProposalSubmit = async (proposal: {
    requestId: string;
    price: string;
    message: string;
    scheduledDate: string;
    scheduledTime: string;
  }) => {
    try {
      await apiPost('/requests/proposals.php', {
        request_id: proposal.requestId,
        price: proposal.price,
        message: proposal.message,
        scheduled_date: proposal.scheduledDate,
        scheduled_time: proposal.scheduledTime,
      });
      setSubmittedProposals((prev) => new Set(prev).add(proposal.requestId));
    } catch {
      // Toast error is handled by ProposalModal
      console.error('Failed to submit proposal');
    }
  };

  const handleCategorySelect = (value: string | undefined) => {
    setSelectedCategory(value);
  };

  // Map API request to shape the ProposalModal expects
  const toModalRequest = (req: ApiRequest) => ({
    id: String(req.id),
    title: req.title,
    description: req.description,
    category: req.category,
    budget: req.budget,
    deadline: formatDeadline(req.deadline),
    requester: `${req.requester_first_name} ${req.requester_last_name}`,
  });

  const visibleSidebarCategories = activeTab === 'requests' ? sidebarRequestCategories : sidebarCategories;

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-6xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        <h1 className="font-display italic text-3xl md:text-4xl text-charcoal-900">Discover</h1>

        {/* Search Bar */}
        <div className="flex gap-0 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (activeTab === 'requests') fetchRequests();
                  else fetchServices();
                }
              }}
              className="w-full h-11 pl-10 pr-3.5 rounded-l-md border-[1.5px] border-r-0 border-charcoal-200 bg-cream-50 font-sans text-[15px] text-charcoal-900 placeholder:text-charcoal-400 outline-none focus:border-honey-500 focus:ring-[3px] focus:ring-honey-100 transition-all"
            />
          </div>
          <button
            onClick={() => {
              if (activeTab === 'requests') fetchRequests();
              else fetchServices();
            }}
            className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-r-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
          >
            Search
          </button>
        </div>

        {/* Tabs */}
        {features.requests && (
        <div className="bg-charcoal-100 rounded-full p-1 w-fit mt-4">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-5 py-2 text-sm font-sans rounded-full transition-all ${
              activeTab === 'services'
                ? 'bg-honey-500 text-charcoal-900 font-bold shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-5 py-2 text-sm font-sans rounded-full transition-all ${
              activeTab === 'requests'
                ? 'bg-honey-500 text-charcoal-900 font-bold shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
          >
            Requests
          </button>
        </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 mt-4 mb-8">
          <CustomSelect
            label="All Categories"
            options={CATEGORIES}
            compact
            className="w-40"
            onChange={handleCategorySelect}
          />
          {activeTab === 'services' ? (
            <>
              <CustomSelect
                label="Any Price"
                options={PRICE_FILTER_OPTIONS}
                compact
                className="w-40"
                onChange={(value) => setSelectedPrice(value)}
              />
              <CustomSelect
                label="Any Rating"
                options={['4.5+ stars', '4.0+ stars']}
                compact
                className="w-36"
                onChange={(value) => setSelectedRating(value)}
              />
              <CustomSelect
                label="Sort: Relevant"
                options={SORT_OPTIONS}
                compact
                className="w-44"
                onChange={(value) => setSelectedServiceSort(value)}
              />
            </>
          ) : (
            <>
              <CustomSelect
                label="Any Budget"
                options={[...REQUEST_BUDGET_FILTER_OPTIONS]}
                compact
                className="w-40"
                onChange={(value) => setSelectedBudget(value)}
              />
              <CustomSelect
                label="Sort: Newest"
                options={[...REQUEST_SORT_OPTIONS]}
                compact
                className="w-44"
                onChange={(value) => setSelectedRequestSort(value)}
              />
            </>
          )}
          <label className={`h-9 inline-flex items-center gap-2 px-1 font-sans text-sm select-none cursor-pointer ${
            mySchoolOnly ? 'text-charcoal-900' : 'text-charcoal-700'
          }`}>
            <input
              type="checkbox"
              checked={mySchoolOnly}
              onChange={(e) => setMySchoolOnly(e.target.checked)}
              className="size-4 rounded border-charcoal-300 cursor-pointer focus:ring-honey-300"
              style={{ accentColor: '#E9A020' }}
            />
            <span className="whitespace-nowrap">My School Only</span>
          </label>
        </div>

        <div className="flex gap-8 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'services' ? (
              servicesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white border border-charcoal-100 rounded-xl overflow-hidden">
                      <div className="h-36 bg-charcoal-100 animate-pulse" />
                      <div className="p-4">
                        <div className="h-5 w-3/4 bg-charcoal-100 rounded animate-pulse mb-2" />
                        <div className="h-4 w-20 bg-charcoal-100 rounded-full animate-pulse mb-3" />
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-16 bg-charcoal-100 rounded animate-pulse" />
                          <div className="h-4 w-12 bg-charcoal-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : servicesError ? (
                <EmptyState
                  icon={Search}
                  title="Something went wrong"
                  description={servicesError}
                  action={
                    <button
                      onClick={() => fetchServices()}
                      className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
                    >
                      Retry
                    </button>
                  }
                />
              ) : services.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        id={String(service.id)}
                        title={service.title}
                        category={service.category}
                        provider={`${service.first_name} ${service.last_name}`}
                        price={formatPrice(service.price, service.price_unit)}
                        rating={service.rating}
                        reviews={service.review_count}
                        image={service.thumbnail}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {servicesPagination && (
                    <PaginationControls
                      pagination={servicesPagination}
                      currentPage={page}
                      onPageChange={setPage}
                    />
                  )}
                </>
              ) : (
                <EmptyState
                  icon={Search}
                  title="No services found"
                  description="Try adjusting your search or filters"
                  action={
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(undefined);
                        setSelectedServiceSort(undefined);
                        setMySchoolOnly(false);
                      }}
                      className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
                    >
                      Clear Search
                    </button>
                  }
                />
              )
            ) : requestsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-charcoal-100 rounded-xl p-6 animate-pulse">
                    <div className="h-5 w-2/3 bg-charcoal-100 rounded animate-pulse mb-3" />
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-5 w-20 bg-charcoal-100 rounded-full" />
                      <div className="h-5 w-20 bg-charcoal-100 rounded-full" />
                      <div className="h-5 w-20 bg-charcoal-100 rounded-full" />
                    </div>
                    <div className="h-4 w-full bg-charcoal-100 rounded animate-pulse mb-1" />
                    <div className="h-4 w-3/4 bg-charcoal-100 rounded animate-pulse mb-4" />
                    <div className="flex items-center justify-between pt-3 border-t border-charcoal-100">
                      <div className="flex items-center gap-3">
                        <div className="size-8 bg-charcoal-100 rounded-full" />
                        <div className="h-4 w-24 bg-charcoal-100 rounded" />
                      </div>
                      <div className="h-9 w-28 bg-charcoal-100 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : requestsError ? (
              <EmptyState
                icon={Search}
                title="Something went wrong"
                description={requestsError}
                action={
                  <button
                    onClick={() => fetchRequests()}
                    className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
                  >
                    Retry
                  </button>
                }
              />
            ) : requests.length > 0 ? (
              <>
                <div className="space-y-4">
                  {requests.map((request) => {
                    const hasSubmitted = request.user_proposed || submittedProposals.has(String(request.id));
                    const isOwnRequest = user?.id === request.requester_id;
                    const requesterName = `${request.requester_first_name} ${request.requester_last_name}`;
                    const budget = request.budget;
                    const deadline = formatDeadline(request.deadline);
                    const postedDate = timeAgo(request.created_at);

                    return (
                      <div
                        key={request.id}
                        onClick={() => navigate(`/request/${request.id}`)}
                        className="bg-white border border-charcoal-100 rounded-xl p-4 sm:p-6 hover:border-honey-400 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="mb-3">
                          <div className="flex items-start gap-2 mb-2 flex-wrap">
                            <h3 className="font-sans font-bold text-base sm:text-lg text-charcoal-900">
                              {sanitizeContent(request.title)}
                            </h3>
                            {hasSubmitted && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                                <CheckCircle2 className="size-3" />
                                Proposal Submitted
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-block px-3 py-1 bg-honey-100 text-honey-700 text-xs font-medium rounded-full">
                              {request.category}
                            </span>
                            <span className="inline-block px-3 py-1 bg-charcoal-100 text-charcoal-700 text-xs font-medium rounded-full">
                              Budget: {budget}
                            </span>
                            {deadline !== 'Ongoing' && (
                              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                                Due: {deadline}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-charcoal-600 leading-relaxed line-clamp-2 mb-4">
                          {sanitizeContent(request.description)}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-charcoal-100">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); navigate(`/${request.requester_username}`); }}
                            >
                              <Avatar size={32} initial={requesterName.charAt(0)} frame={request.cosmetics?.frame ?? null} src={request.requester_profile_image} />
                              <div>
                                <div className="text-xs text-charcoal-500">Posted by</div>
                                <div className="text-sm font-medium text-charcoal-900 hover:text-honey-600 transition-colors">{requesterName}</div>
                              </div>
                            </div>
                            <div className="text-xs text-charcoal-400">{postedDate}</div>
                          </div>
                          {isOwnRequest ? (
                            <span className="h-9 px-4 rounded-lg font-sans font-medium text-sm text-charcoal-400 flex items-center">
                              Your request
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRequest(toModalRequest(request));
                              }}
                              disabled={hasSubmitted || isAdmin}
                              className={`h-9 px-4 rounded-lg font-sans font-bold text-sm whitespace-nowrap transition-all ${
                                hasSubmitted || isAdmin
                                  ? 'bg-charcoal-100 text-charcoal-400 cursor-not-allowed'
                                  : 'bg-honey-500 text-charcoal-900 hover:bg-honey-600 hover:scale-105 shadow-sm'
                              }`}
                            >
                              {hasSubmitted ? 'Submitted' : 'Submit Proposal'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {requestsPagination && (
                  <PaginationControls
                    pagination={requestsPagination}
                    currentPage={page}
                    onPageChange={setPage}
                  />
                )}
              </>
            ) : (
              <EmptyState
                icon={FileText}
                title="No open requests"
                description="Check back later or post your own request"
                action={
                  <button
                    onClick={() => navigate('/post-request')}
                    className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
                  >
                    Post a Request
                  </button>
                }
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 self-start space-y-5">
            {/* Popular Categories */}
            <div className="bg-cream-50 border border-charcoal-100 rounded-lg p-5">
              <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-4">
                Popular Categories
              </h3>
              <div className="space-y-0">
                {visibleSidebarCategories.map((cat, idx) => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategorySelect(cat.name)}
                    className={`w-full py-2.5 flex justify-between items-center hover:text-honey-600 transition-colors ${
                      idx < visibleSidebarCategories.length - 1 ? 'border-b border-charcoal-100' : ''
                    }`}
                  >
                    <span className="text-sm text-charcoal-700">{cat.name}</span>
                    <span className="font-mono text-xs text-charcoal-400">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Providers */}
            <div className="bg-cream-50 border border-charcoal-100 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-honey-500" />
                <h3 className="font-sans font-bold text-sm text-charcoal-900">
                  Top Providers This Month
                </h3>
              </div>
              <div className="space-y-3">
                {sidebarProviders.length === 0 ? (
                  <p className="text-xs text-charcoal-400">No activity this week</p>
                ) : sidebarProviders.map((provider) => (
                  <button
                    key={provider.rank}
                    onClick={() => navigate(`/${provider.username}`)}
                    className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
                  >
                    <span className="font-mono text-sm text-charcoal-400 w-4">
                      {provider.rank}
                    </span>
                    <Avatar size={36} initial={provider.name.charAt(0)} frame={provider.cosmetics?.frame ?? null} src={provider.profile_image} />
                    <div className="flex-1 min-w-0">
                      <div className="font-sans font-bold text-sm text-charcoal-900 truncate">
                        {provider.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-honey-500 text-honey-500 stroke-0" />
                        <span className="font-mono text-xs text-charcoal-600">
                          {provider.rating}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {features.leaderboard && (
              <button
                onClick={() => navigate('/leaderboard')}
                className="text-honey-600 text-sm font-medium mt-3 hover:text-honey-700 transition-colors"
              >
                View Full Leaderboard →
              </button>
              )}
            </div>

            {/* CTA Card */}
            {!isAdmin && features.requests && (
              <div className="bg-honey-50 border border-honey-200 rounded-lg p-5">
                <h3 className="font-sans font-bold text-sm text-charcoal-900">
                  Can't find what you need?
                </h3>
                <p className="text-sm text-charcoal-600 mt-2">
                  Post a request and let providers come to you.
                </p>
                <button
                  onClick={() => navigate('/post-request')}
                  className="w-full mt-4 h-[34px] px-[14px] bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-xs transition-all hover:bg-honey-600"
                >
                  Post a Request
                </button>
              </div>
            )}
          </aside>
        </div>

        {/* Mobile-only sidebar content goes after listings/pagination */}
        <div className="md:hidden mt-8 space-y-4">
          <div className="bg-cream-50 border border-charcoal-100 rounded-lg p-5">
            <h3 className="font-sans font-bold text-sm text-charcoal-900 mb-4">
              Popular Categories
            </h3>
            <div className="space-y-0">
              {visibleSidebarCategories.map((cat, idx) => (
                <button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`w-full py-2.5 flex justify-between items-center hover:text-honey-600 transition-colors ${
                    idx < visibleSidebarCategories.length - 1 ? 'border-b border-charcoal-100' : ''
                  }`}
                >
                  <span className="text-sm text-charcoal-700">{cat.name}</span>
                  <span className="font-mono text-xs text-charcoal-400">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-cream-50 border border-charcoal-100 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-honey-500" />
              <h3 className="font-sans font-bold text-sm text-charcoal-900">
                Top Providers This Month
              </h3>
            </div>
            <div className="space-y-3">
              {sidebarProviders.length === 0 ? (
                <p className="text-xs text-charcoal-400">No activity this week</p>
              ) : sidebarProviders.map((provider) => (
                <button
                  key={provider.rank}
                  onClick={() => navigate(`/${provider.username}`)}
                  className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity"
                >
                  <span className="font-mono text-sm text-charcoal-400 w-4">
                    {provider.rank}
                  </span>
                  <Avatar size={36} initial={provider.name.charAt(0)} frame={provider.cosmetics?.frame ?? null} src={provider.profile_image} />
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-bold text-sm text-charcoal-900 truncate">
                      {provider.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-honey-500 text-honey-500 stroke-0" />
                      <span className="font-mono text-xs text-charcoal-600">
                        {provider.rating}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {features.leaderboard && (
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-honey-600 text-sm font-medium mt-3 hover:text-honey-700 transition-colors"
            >
              View Full Leaderboard →
            </button>
            )}
          </div>

          {!isAdmin && features.requests && (
            <div className="bg-honey-50 border border-honey-200 rounded-lg p-5">
              <h3 className="font-sans font-bold text-sm text-charcoal-900">
                Can't find what you need?
              </h3>
              <p className="text-sm text-charcoal-600 mt-2">
                Post a request and let providers come to you.
              </p>
              <button
                onClick={() => navigate('/post-request')}
                className="w-full mt-4 h-[34px] px-[14px] bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-xs transition-all hover:bg-honey-600"
              >
                Post a Request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      {!isAdmin && features.requests && (
      <button
        onClick={() => navigate('/post-request')}
        className="fixed bottom-8 right-8 size-14 bg-gradient-to-br from-honey-500 to-honey-600 text-charcoal-900 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center group z-40"
        title="Post a Request"
      >
        <Plus className="size-6" />
        <span className="absolute right-full mr-3 bg-charcoal-900 text-cream-50 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Post a Request
        </span>
      </button>
      )}

      {/* Proposal Modal */}
      {selectedRequest && (
        <ProposalModal
          request={selectedRequest}
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSubmit={handleProposalSubmit}
        />
      )}
    </div>
  );
}
