import { create } from 'zustand';

const SEARCH_CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const OPTIONS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for static dropdown options

export const usePropertySearchStore = create((set, get) => ({
  // Filter options for Admin & Agent Property Sheet Search
  filterOptions: {
    builders: [],
    projects: [],
    locations: [],
    markets: [],
    configurations: [],
  },
  optionsLoaded: false,
  optionsLoading: false,
  optionsLastFetched: null,

  // Cache for public /search results
  publicSearchCache: {},

  // Cache for admin /admin/property-search & /agent/property-search results
  adminSearchCache: {},

  // Fetch distinct filter options from property-sheet
  fetchFilterOptions: async ({ force = false } = {}) => {
    const { filterOptions, optionsLastFetched, optionsLoading, optionsLoaded } = get();
    const isFresh = optionsLastFetched && (Date.now() - optionsLastFetched < OPTIONS_CACHE_TTL);

    if (!force && isFresh && optionsLoaded) {
      return filterOptions;
    }

    if (optionsLoading) return filterOptions;

    set({ optionsLoading: true });

    try {
      const fields = ['builders', 'projects', 'locations', 'markets', 'configurations'];
      const results = await Promise.all(
        fields.map((field) =>
          fetch('/api/property-sheet/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field }),
          })
            .then((r) => r.json())
            .catch(() => ({ data: [] }))
        )
      );

      const newOptions = {
        builders: results[0]?.data || [],
        projects: results[1]?.data || [],
        locations: results[2]?.data || [],
        markets: results[3]?.data || [],
        configurations: results[4]?.data || [],
      };

      set({
        filterOptions: newOptions,
        optionsLoaded: true,
        optionsLoading: false,
        optionsLastFetched: Date.now(),
      });

      return newOptions;
    } catch (err) {
      console.error('Error fetching search filter options in store:', err);
      set({ optionsLoading: false });
      return filterOptions;
    }
  },

  // Customer public property search with query cache
  fetchPublicSearch: async (currentFilters = {}, { force = false } = {}) => {
    const queryParams = new URLSearchParams();
    if (currentFilters.location) queryParams.append('location', currentFilters.location);
    if (currentFilters.mode && currentFilters.mode !== 'buy') queryParams.append('mode', currentFilters.mode);
    if (currentFilters.type) queryParams.append('type', currentFilters.type);
    if (currentFilters.bhk) queryParams.append('bhk', currentFilters.bhk);
    if (currentFilters.price) queryParams.append('price', currentFilters.price);

    const cacheKey = queryParams.toString() || 'all';
    const cached = get().publicSearchCache[cacheKey];
    const isFresh = cached && (Date.now() - cached.timestamp < SEARCH_CACHE_TTL);

    if (!force && isFresh) {
      return { success: true, data: cached.data, fromCache: true };
    }

    try {
      const url = `/api/properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch properties');

      const properties = data.data || [];

      set((state) => ({
        publicSearchCache: {
          ...state.publicSearchCache,
          [cacheKey]: {
            data: properties,
            timestamp: Date.now(),
          },
        },
      }));

      return { success: true, data: properties, fromCache: false };
    } catch (err) {
      console.error('Error in fetchPublicSearch store:', err);
      return {
        success: false,
        error: err.message,
        data: cached?.data || [],
      };
    }
  },

  // Admin / Agent property sheet search with query cache & pagination
  fetchAdminSearch: async (filters = {}, page = 1, limit = 20, { force = false } = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    params.append('page', page);
    params.append('limit', limit);

    const cacheKey = params.toString();
    const cached = get().adminSearchCache[cacheKey];
    const isFresh = cached && (Date.now() - cached.timestamp < SEARCH_CACHE_TTL);

    if (!force && isFresh) {
      return {
        success: true,
        data: cached.data,
        pagination: cached.pagination,
        fromCache: true,
      };
    }

    try {
      const response = await fetch(`/api/property-sheet/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        const pagination = data.pagination || { page, limit, total: 0, totalPages: 0 };
        const properties = data.data || [];

        set((state) => ({
          adminSearchCache: {
            ...state.adminSearchCache,
            [cacheKey]: {
              data: properties,
              pagination,
              timestamp: Date.now(),
            },
          },
        }));

        return {
          success: true,
          data: properties,
          pagination,
          fromCache: false,
        };
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (err) {
      console.error('Error in fetchAdminSearch store:', err);
      return {
        success: false,
        error: err.message,
        data: cached?.data || [],
        pagination: cached?.pagination || { page, limit, total: 0, totalPages: 0 },
      };
    }
  },

  // Invalidate search caches
  invalidateSearchCache: () => {
    set({
      publicSearchCache: {},
      adminSearchCache: {},
    });
  },
}));
