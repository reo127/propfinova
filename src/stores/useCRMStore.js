import { create } from 'zustand';

const LEADS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache per query
const AGENTS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for agents list

export const useCRMStore = create((set, get) => ({
  // Active Leads View State (persists across navigation)
  leads: [],
  totalCount: 0,
  totalPages: 1,
  currentParams: '',
  loading: false,
  refreshing: false,
  error: null,

  // Agents list
  agents: [],
  agentsLoading: false,
  agentsLastFetched: null,

  // Global persistent pipeline telemetry
  pipelineStats: {
    total: 0,
    interested: 0,
    siteVisits: 0,
    followUps: 0,
    unassigned: 0,
  },
  statsLoaded: false,

  // Query-keyed cache for paginated / filtered lead sets
  leadsQueryCache: {},

  // Fetch agents with long TTL caching
  fetchAgents: async ({ force = false } = {}) => {
    const { agents, agentsLastFetched, agentsLoading } = get();
    const isFresh = agentsLastFetched && (Date.now() - agentsLastFetched < AGENTS_CACHE_TTL);

    if (!force && isFresh && agents.length > 0) {
      return agents;
    }

    if (agentsLoading) return agents;

    set({ agentsLoading: true });

    try {
      const response = await fetch('/api/agents');
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        set({
          agents: data.data,
          agentsLastFetched: Date.now(),
          agentsLoading: false,
        });
        return data.data;
      }
      set({ agentsLoading: false });
      return agents;
    } catch (err) {
      console.error('Error fetching agents in store:', err);
      set({ agentsLoading: false });
      return agents;
    }
  },

  // Fetch leads with query-level caching & instant view restoration
  fetchLeads: async (paramsString, { force = false } = {}) => {
    const { leadsQueryCache, currentParams, leads } = get();
    const cacheKey = paramsString || 'default';
    const cached = leadsQueryCache[cacheKey];
    const isFresh = cached && (Date.now() - cached.timestamp < LEADS_CACHE_TTL);

    // If cached data is available for this query:
    if (cached) {
      // Immediately set active leads to cached version (0ms delay, zero skeleton)
      set({
        leads: cached.leads,
        totalCount: cached.totalCount,
        totalPages: cached.totalPages,
        currentParams: cacheKey,
        loading: false,
        ...(cached.pipelineStats ? { pipelineStats: cached.pipelineStats, statsLoaded: true } : {}),
      });

      // If still fresh and not force-refreshed, return immediately with zero network request!
      if (!force && isFresh) {
        return {
          success: true,
          data: cached.leads,
          totalCount: cached.totalCount,
          totalPages: cached.totalPages,
          pipelineStats: cached.pipelineStats,
          fromCache: true,
        };
      }

      // If stale, update in the background without clearing the UI (Stale-While-Revalidate)
      set({ refreshing: true });
    } else {
      // Cold query that has never been loaded before: only now show initial loader
      set({
        loading: true,
        refreshing: false,
        error: null,
        currentParams: cacheKey,
        leads: currentParams === cacheKey ? leads : [],
      });
    }

    try {
      const response = await fetch(`/api/leads${paramsString ? `?${paramsString}` : ''}`);
      const data = await response.json();

      if (data.success) {
        const queryEntry = {
          leads: data.data || [],
          totalCount: data.totalCount || 0,
          totalPages: data.totalPages || 1,
          pipelineStats: data.pipelineStats || get().pipelineStats,
          timestamp: Date.now(),
        };

        set((state) => ({
          leads: queryEntry.leads,
          totalCount: queryEntry.totalCount,
          totalPages: queryEntry.totalPages,
          leadsQueryCache: {
            ...state.leadsQueryCache,
            [cacheKey]: queryEntry,
          },
          ...(data.pipelineStats ? { pipelineStats: data.pipelineStats, statsLoaded: true } : {}),
          loading: false,
          refreshing: false,
          error: null,
        }));

        return {
          success: true,
          data: data.data || [],
          totalCount: data.totalCount || 0,
          totalPages: data.totalPages || 1,
          pipelineStats: data.pipelineStats,
          fromCache: false,
        };
      } else {
        throw new Error(data.message || 'Failed to fetch leads');
      }
    } catch (err) {
      console.error('Error fetching leads in store:', err);
      set({ loading: false, refreshing: false, error: err.message });
      return {
        success: false,
        error: err.message,
        data: cached?.leads || get().leads,
        totalCount: cached?.totalCount || get().totalCount,
        totalPages: cached?.totalPages || get().totalPages,
      };
    }
  },

  // Update a single lead optimistically across active view & all cached queries
  updateLeadInCache: (leadId, updatedFields = {}) => {
    set((state) => {
      const updatedLeads = state.leads.map((l) =>
        l._id === leadId ? { ...l, ...updatedFields } : l
      );

      const updatedCache = {};
      const statusChanged = Boolean(updatedFields.status);
      const assignmentChanged = updatedFields.isAssigned !== undefined || updatedFields.assignedTo !== undefined;

      Object.keys(state.leadsQueryCache).forEach((key) => {
        if (statusChanged && key.includes('status=') && !key.includes('status=all')) {
          return;
        }
        if (assignmentChanged && (key.includes('assignmentStatus=') || key.includes('assignedTo='))) {
          return;
        }

        const entry = state.leadsQueryCache[key];
        updatedCache[key] = {
          ...entry,
          leads: entry.leads.map((lead) =>
            lead._id === leadId ? { ...lead, ...updatedFields } : lead
          ),
        };
      });

      return {
        leads: updatedLeads,
        leadsQueryCache: updatedCache,
      };
    });
  },

  // Delete lead from active view & cached queries
  deleteLeadFromCache: (leadId) => {
    set((state) => {
      const updatedLeads = state.leads.filter((l) => l._id !== leadId);
      const newTotal = Math.max(0, state.totalCount - 1);

      const updatedCache = {};
      Object.keys(state.leadsQueryCache).forEach((key) => {
        const entry = state.leadsQueryCache[key];
        updatedCache[key] = {
          ...entry,
          leads: entry.leads.filter((l) => l._id !== leadId),
          totalCount: Math.max(0, entry.totalCount - 1),
        };
      });

      return {
        leads: updatedLeads,
        totalCount: newTotal,
        leadsQueryCache: updatedCache,
      };
    });
  },

  // Invalidate cache without wiping the UI so next visits revalidate smoothly in background
  invalidateLeadsCache: () => {
    set((state) => {
      const staleCache = {};
      Object.keys(state.leadsQueryCache).forEach((key) => {
        staleCache[key] = {
          ...state.leadsQueryCache[key],
          timestamp: 0,
        };
      });
      return { leadsQueryCache: staleCache };
    });
  },

  // Set pipeline stats directly
  setPipelineStats: (stats) => {
    if (!stats) return;
    set({ pipelineStats: stats, statsLoaded: true });
  },
}));
