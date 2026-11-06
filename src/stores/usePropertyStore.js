import { create } from 'zustand';

const PROPERTY_CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache validity
const BANNER_CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache validity

export const usePropertyStore = create((set, get) => ({
  properties: [],
  loading: false,
  error: null,
  lastFetched: null,

  // Admin portfolio state (includes pending, approved, and rejected listings)
  adminProperties: [],
  adminLoading: false,
  adminError: null,
  adminLastFetched: null,

  banners: [],
  bannersLoading: false,
  bannersLastFetched: null,

  heroImage: null,
  heroImageLoading: false,
  heroImageLastFetched: null,

  // Set properties from SSR or initial payload
  setProperties: (initialProperties) => {
    if (Array.isArray(initialProperties) && initialProperties.length > 0) {
      set({
        properties: initialProperties,
        lastFetched: Date.now(),
        loading: false,
        error: null,
      });
    }
  },

  // Fetch properties for public/matching with smart TTL caching
  fetchProperties: async ({ force = false } = {}) => {
    const { properties, lastFetched, loading } = get();
    const isFresh = lastFetched && (Date.now() - lastFetched < PROPERTY_CACHE_TTL);

    // Return cached data if still fresh and not forced
    if (!force && isFresh && properties.length > 0) {
      return { success: true, data: properties, fromCache: true };
    }

    if (loading) return { success: true, data: properties, loading: true };

    set({ loading: true, error: null });

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/properties', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        set({
          properties: data.data,
          lastFetched: Date.now(),
          loading: false,
          error: null,
        });
        return { success: true, data: data.data, fromCache: false };
      } else {
        throw new Error(data.message || 'Failed to load properties');
      }
    } catch (err) {
      console.error('Error fetching properties in store:', err);
      set({ loading: false, error: err.message });
      return { success: false, error: err.message, data: properties };
    }
  },

  // Fetch full property portfolio for Admin management (includes all statuses)
  fetchAdminProperties: async ({ force = false } = {}) => {
    const { adminProperties, adminLastFetched, adminLoading } = get();
    const isFresh = adminLastFetched && (Date.now() - adminLastFetched < PROPERTY_CACHE_TTL);

    if (!force && isFresh && adminProperties.length > 0) {
      return { success: true, data: adminProperties, fromCache: true };
    }

    if (adminLoading) return { success: true, data: adminProperties, loading: true };

    set({ adminLoading: true, adminError: null });

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/properties', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        set({
          adminProperties: data.data,
          adminLastFetched: Date.now(),
          adminLoading: false,
          adminError: null,
        });
        return { success: true, data: data.data, fromCache: false };
      } else {
        throw new Error(data.message || 'Failed to load admin properties');
      }
    } catch (err) {
      console.error('Error fetching admin properties in store:', err);
      set({ adminLoading: false, adminError: err.message });
      return { success: false, error: err.message, data: adminProperties };
    }
  },

  // Fetch banners with caching
  fetchBanners: async ({ force = false } = {}) => {
    const { banners, bannersLastFetched } = get();
    const isFresh = bannersLastFetched && (Date.now() - bannersLastFetched < BANNER_CACHE_TTL);

    if (!force && isFresh && banners.length > 0) {
      return banners;
    }

    set({ bannersLoading: true });

    try {
      const response = await fetch('/api/banners');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load banners');
      }

      set({
        banners: data.data,
        bannersLastFetched: Date.now(),
        bannersLoading: false,
      });

      return data.data;
    } catch (err) {
      console.error('Error fetching banners:', err);
      set({ bannersLoading: false });
      return banners;
    }
  },

  // Fetch hero image with caching
  fetchHeroImage: async ({ force = false } = {}) => {
    const { heroImage, heroImageLastFetched } = get();
    const isFresh = heroImageLastFetched && (Date.now() - heroImageLastFetched < BANNER_CACHE_TTL);

    if (!force && isFresh && heroImage) {
      return heroImage;
    }

    set({ heroImageLoading: true });

    try {
      const response = await fetch('/api/hero-image');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to load hero image');
      }

      set({
        heroImage: data.data,
        heroImageLastFetched: Date.now(),
        heroImageLoading: false,
      });

      return data.data;
    } catch (err) {
      console.error('Error fetching hero image:', err);
      set({ heroImageLoading: false });
      return heroImage;
    }
  },

  // Invalidate cache when mutations occur
  invalidateProperties: () => {
    set({ lastFetched: null, adminLastFetched: null });
  },

  invalidateAdminProperties: () => {
    set({ adminLastFetched: null });
  },

  invalidateBanners: () => {
    set({ bannersLastFetched: null });
  },

  invalidateHeroImage: () => {
    set({ heroImageLastFetched: null });
  },

  // In-place optimistic updates across both admin and public property collections
  addProperty: (newProp) => {
    set((state) => ({
      adminProperties: [newProp, ...state.adminProperties],
      properties: newProp.status === 'approved' || !newProp.status
        ? [newProp, ...state.properties]
        : state.properties,
      lastFetched: Date.now(),
      adminLastFetched: Date.now(),
    }));
  },

  updateProperty: (id, updatedFields) => {
    set((state) => ({
      adminProperties: state.adminProperties.map((p) =>
        p._id === id ? { ...p, ...updatedFields } : p
      ),
      properties: state.properties.map((p) =>
        p._id === id ? { ...p, ...updatedFields } : p
      ),
    }));
  },

  removeProperty: (id) => {
    set((state) => ({
      adminProperties: state.adminProperties.filter((p) => p._id !== id),
      properties: state.properties.filter((p) => p._id !== id),
    }));
  },
}));
