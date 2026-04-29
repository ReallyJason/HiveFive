import { useState, useEffect, useCallback } from 'react';
import { NavBar } from '../components/NavBar';
import { ServiceCard } from '../components/ServiceCard';
import { CustomSelect } from '../components/CustomSelect';
import { useNavigate, useSearchParams } from 'react-router';
import { apiGet, ApiError } from '../lib/api';
import { SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES } from '../lib/constants';

interface SearchService {
  id: string;
  title: string;
  category: string;
  provider: string;
  provider_id: string;
  price: string;
  rating: number;
  reviews: number;
  description: string;
}

interface SearchRequest {
  id: string;
  title: string;
  category: string;
  requester: string;
  budget: string;
  deadline: string;
  description: string;
  posted_date: string;
}

interface SearchResponse {
  services: SearchService[];
  requests: SearchRequest[];
  total: number;
}

const categoriesWithAll = ['All', ...CATEGORIES];

const priceRanges = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under ⬡20', min: 0, max: 20 },
  { label: '⬡20 - ⬡40', min: 20, max: 40 },
  { label: '⬡40 - ⬡60', min: 40, max: 60 },
  { label: 'Over ⬡60', min: 60, max: Infinity },
];

const sortOptions = [
  { label: 'Most Popular', value: 'popular' },
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Lowest Price', value: 'price-asc' },
  { label: 'Highest Price', value: 'price-desc' },
];

export function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const searchType = searchParams.get('type') || undefined;

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(priceRanges[0]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  const [services, setServices] = useState<SearchService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchResults = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<SearchResponse>('/search.php', {
        q: query || undefined,
        type: searchType,
      });
      setServices(data.services || []);
      setTotal(data.total ?? (data.services?.length || 0));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [searchType]);

  useEffect(() => {
    fetchResults(initialQuery);
  }, [initialQuery, fetchResults]);

  // Client-side filtering of API results
  let filteredServices = services.filter((service) => {
    // Local search refinement
    if (
      searchQuery &&
      !service.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !service.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !service.category.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Category
    if (selectedCategory !== 'All' && service.category !== selectedCategory) {
      return false;
    }

    // Price range
    const price = parseFloat(service.price.replace(/[⬡,/hr/session]/g, '').trim());
    if (price < selectedPriceRange.min || price > selectedPriceRange.max) {
      return false;
    }

    // Rating
    if (service.rating < minRating) {
      return false;
    }

    return true;
  });

  // Sort services
  filteredServices = [...filteredServices].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'popular') return b.reviews - a.reviews;

    const priceA = parseFloat(a.price.replace(/[⬡,/hr/session]/g, '').trim());
    const priceB = parseFloat(b.price.replace(/[⬡,/hr/session]/g, '').trim());

    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;

    return 0;
  });

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedPriceRange.label !== 'All Prices' ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedPriceRange(priceRanges[0]);
    setMinRating(0);
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <NavBar variant="logged-in" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-16 pt-8 pb-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display italic text-3xl md:text-5xl text-charcoal-900 mb-2">
            {searchQuery ? `Search results for "${searchQuery}"` : 'All Services'}
          </h1>
          <p className="text-charcoal-600">
            {loading
              ? 'Searching...'
              : `${filteredServices.length} service${filteredServices.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search services..."
            className="w-full h-12 px-4 bg-white border border-charcoal-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-honey-500"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-4 bg-white border border-charcoal-100 rounded-lg font-sans font-bold text-sm text-charcoal-900 hover:border-charcoal-200 transition-colors flex items-center gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="size-5 bg-honey-500 text-charcoal-900 rounded-full text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <CustomSelect
            value={sortBy}
            onChange={(value) => setSortBy(value)}
            options={['Most Popular', 'Highest Rated', 'Lowest Price', 'Highest Price']}
            label="Most Popular"
            compact
            className="min-w-[160px]"
          />

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="h-10 px-4 bg-red-50 border border-red-200 text-red-600 rounded-lg font-sans font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <X className="size-4" />
              Clear filters
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-charcoal-100 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-sans font-bold text-charcoal-900 mb-3 text-sm">
                  Category
                </h3>
                <div className="space-y-2">
                  {categoriesWithAll.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category}
                        onChange={() => setSelectedCategory(category)}
                        className="size-4 text-honey-500 focus:ring-honey-500"
                      />
                      <span className="text-sm text-charcoal-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-sans font-bold text-charcoal-900 mb-3 text-sm">
                  Price Range
                </h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <label
                      key={range.label}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="price"
                        checked={selectedPriceRange.label === range.label}
                        onChange={() => setSelectedPriceRange(range)}
                        className="size-4 text-honey-500 focus:ring-honey-500"
                      />
                      <span className="text-sm text-charcoal-700">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h3 className="font-sans font-bold text-charcoal-900 mb-3 text-sm">
                  Minimum Rating
                </h3>
                <div className="space-y-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <label
                      key={rating}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="rating"
                        checked={minRating === rating}
                        onChange={() => setMinRating(rating)}
                        className="size-4 text-honey-500 focus:ring-honey-500"
                      />
                      <span className="text-sm text-charcoal-700">
                        {rating === 0 ? 'Any rating' : `${rating}+ stars`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center mb-6">
            <h3 className="font-sans font-bold text-red-900 mb-2">Something went wrong</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
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
        )}

        {/* Results Grid */}
        {!loading && !error && filteredServices.length === 0 ? (
          <div className="bg-white border border-charcoal-100 rounded-xl p-12 text-center">
            <h3 className="font-display italic text-2xl text-charcoal-900 mb-2">
              No services found
            </h3>
            <p className="text-charcoal-600 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearFilters}
              className="h-11 px-6 bg-honey-500 text-charcoal-900 rounded-md font-sans font-bold text-sm transition-all hover:bg-honey-600"
            >
              Clear All Filters
            </button>
          </div>
        ) : !loading && !error ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                {...service}
                onClick={() => navigate(`/service/${service.id}`)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
