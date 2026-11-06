import { create } from 'zustand';

const DASHBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache validity
const LEADS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache per query
const OPTIONS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for options map

export const useAgentStore = create((set, get) => ({
  // Agent Dashboard
  dashboardStats: {
    totalAssigned: 0,
    pending: 0,
    completed: 0,
    successRate: 0,
  },
  recentLeads: [],
  dashboardLoading: false,
  dashboardRefreshing: false,
  dashboardLastFetched: null,
  dashboardAgentId: null,

  // Agent Pipeline Telemetry (persistent across active filters)
  pipelineStats: {
    total: 0,
    interested: 0,
    siteVisits: 0,
    followUps: 0,
  },
  statsLoaded: false,

  // Active Leads View State (persists across navigation between Dashboard & CRM)
  myLeads: [],
  myLeadsTotalCount: 0,
  myLeadsTotalPages: 1,
  myLeadsCurrentParams: '',
  leadsLoading: false,
  leadsRefreshing: false,
  leadsError: null,

  // Query-keyed Cache for /agent/my-leads
  myLeadsCache: {},

  // Status/Substatus map options
  statusOptions: {},
  statusOptionsLastFetched: null,

  // Fetch Agent Dashboard (Stats + Recent Leads)
  fetchDashboardData: async (agentId, { force = false } = {}) => {
    if (!agentId) return { success: false };

    const { dashboardStats, recentLeads, dashboardLastFetched, dashboardAgentId, dashboardLoading, dashboardRefreshing } = get();
    const isSameAgent = dashboardAgentId === agentId;
    const hasData = dashboardStats.totalAssigned > 0 || recentLeads.length > 0;
    const isFresh = isSameAgent && dashboardLastFetched && (Date.now() - dashboardLastFetched < DASHBOARD_CACHE_TTL);

    // Return cached data immediately if still fresh and not a forced manual refresh
    if (!force && isFresh && hasData) {
      return { success: true, stats: dashboardStats, recentLeads, fromCache: true };
    }

    if (dashboardLoading || dashboardRefreshing) {
      return { success: true, stats: dashboardStats, recentLeads, loading: true };
    }

    const isInitial = !dashboardLastFetched || !isSameAgent || !hasData;
    if (isInitial) {
      set({ dashboardLoading: true });
    } else {
      set({ dashboardRefreshing: true });
    }

    try {
      const [agentRes, leadsRes] = await Promise.all([
        fetch(`/api/agents/${agentId}`),
        fetch(`/api/leads?assignedTo=${agentId}&limit=5&sortBy=assignedAt&sortOrder=desc`),
      ]);

      const [agentData, leadsData] = await Promise.all([
        agentRes.json().catch(() => ({ success: false })),
        leadsRes.json().catch(() => ({ success: false })),
      ]);

      let newStats = get().dashboardStats;
      if (agentData.success && agentData.data) {
        const agent = agentData.data;
        const assigned = agent.currentAssignedCount || 0;
        const completed = agent.currentCompletedCount || 0;
        const pending = agent.currentPendingCount !== undefined ? agent.currentPendingCount : Math.max(0, assigned - completed);
        const successRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

        newStats = {
          totalAssigned: assigned,
          completed: completed,
          pending: pending,
          successRate: successRate,
        };
      }

      const newRecentLeads = leadsData.success && Array.isArray(leadsData.data) ? leadsData.data : get().recentLeads;

      set({
        dashboardStats: newStats,
        recentLeads: newRecentLeads,
        dashboardLastFetched: Date.now(),
        dashboardAgentId: agentId,
        dashboardLoading: false,
        dashboardRefreshing: false,
      });

      return { success: true, stats: newStats, recentLeads: newRecentLeads, fromCache: false };
    } catch (err) {
      console.error('Error in useAgentStore.fetchDashboardData:', err);
      set({ dashboardLoading: false, dashboardRefreshing: false });
      return { success: false, stats: get().dashboardStats, recentLeads: get().recentLeads };
    }
  },

  // Fetch My Leads with query-level caching & instant view restoration
  fetchMyLeads: async (paramsString, { force = false } = {}) => {
    const { myLeadsCache, myLeadsCurrentParams, myLeads } = get();
    const cacheKey = paramsString || 'default';
    const cached = myLeadsCache[cacheKey];
    const isFresh = cached && (Date.now() - cached.timestamp < LEADS_CACHE_TTL);

    // If cached data is available for this query:
    if (cached) {
      // Immediately restore active view state in 0ms (no spinner, no skeleton)
      set({
        myLeads: cached.leads,
        myLeadsTotalCount: cached.totalCount,
        myLeadsTotalPages: cached.totalPages,
        myLeadsCurrentParams: cacheKey,
        leadsLoading: false,
        leadsError: null,
        ...(cached.pipelineStats ? { pipelineStats: cached.pipelineStats, statsLoaded: true } : {}),
      });

      // If still fresh and not force-refreshed, return immediately with zero network request!
      if (!force && isFresh) {
        return {
          success: true,
          data: cached.leads,
          totalPages: cached.totalPages,
          totalCount: cached.totalCount,
          pipelineStats: cached.pipelineStats,
          fromCache: true,
        };
      }

      // If stale, update in the background without clearing the UI (Stale-While-Revalidate)
      set({ leadsRefreshing: true });
    } else {
      // Cold query that has never been loaded before: only now show skeleton loader
      set({
        leadsLoading: true,
        leadsRefreshing: false,
        leadsError: null,
        myLeadsCurrentParams: cacheKey,
        myLeads: myLeadsCurrentParams === cacheKey ? myLeads : [],
      });
    }

    try {
      const response = await fetch(`/api/leads${paramsString ? `?${paramsString}` : ''}`);
      const data = await response.json();

      if (data.success) {
        const newPipelineStats = data.pipelineStats || get().pipelineStats;
        const queryEntry = {
          leads: data.data || [],
          totalPages: data.totalPages || 1,
          totalCount: data.totalCount || 0,
          pipelineStats: newPipelineStats,
          timestamp: Date.now(),
        };

        set((state) => ({
          myLeads: queryEntry.leads,
          myLeadsTotalCount: queryEntry.totalCount,
          myLeadsTotalPages: queryEntry.totalPages,
          myLeadsCache: {
            ...state.myLeadsCache,
            [cacheKey]: queryEntry,
          },
          pipelineStats: newPipelineStats,
          statsLoaded: true,
          leadsLoading: false,
          leadsRefreshing: false,
          leadsError: null,
        }));

        return {
          success: true,
          data: data.data || [],
          totalPages: data.totalPages || 1,
          totalCount: data.totalCount || 0,
          pipelineStats: newPipelineStats,
          fromCache: false,
        };
      } else {
        throw new Error(data.message || 'Failed to fetch agent leads');
      }
    } catch (err) {
      console.error('Error in useAgentStore.fetchMyLeads:', err);
      set({ leadsLoading: false, leadsRefreshing: false, leadsError: err.message });
      return {
        success: false,
        error: err.message,
        data: cached?.leads || get().myLeads,
        totalPages: cached?.totalPages || get().myLeadsTotalPages,
        totalCount: cached?.totalCount || get().myLeadsTotalCount,
        pipelineStats: cached?.pipelineStats || get().pipelineStats,
      };
    }
  },

  // Fetch and cache status / substatus map (30-minute TTL)
  fetchStatusOptions: async ({ force = false } = {}) => {
    const { statusOptions, statusOptionsLastFetched } = get();
    const isFresh = statusOptionsLastFetched && (Date.now() - statusOptionsLastFetched < OPTIONS_CACHE_TTL);

    if (!force && isFresh && Object.keys(statusOptions).length > 0) {
      return statusOptions;
    }

    try {
      const response = await fetch('/api/leads', { method: 'OPTIONS' });
      const data = await response.json();

      if (data.success && data.data?.statusSubstatusMap) {
        const map = data.data.statusSubstatusMap;
        set({
          statusOptions: map,
          statusOptionsLastFetched: Date.now(),
        });
        return map;
      }
      return statusOptions;
    } catch (err) {
      console.error('Error fetching status options in store:', err);
      return statusOptions;
    }
  },

  // In-place update of lead across active myLeads, recentLeads, and all cached queries
  updateLeadInCache: (leadId, updatedFields = {}) => {
    set((state) => {
      // Update in active myLeads view
      const updatedMyLeads = state.myLeads.map((lead) =>
        lead._id === leadId ? { ...lead, ...updatedFields } : lead
      );

      // Update in dashboard recentLeads
      const updatedRecentLeads = state.recentLeads.map((lead) =>
        lead._id === leadId ? { ...lead, ...updatedFields } : lead
      );

      const statusChanged = Boolean(updatedFields.status);

      // Update in all myLeadsCache queries
      const updatedCache = {};
      Object.keys(state.myLeadsCache).forEach((key) => {
        // If status changed, invalidate filtered status queries so switching to that tab re-fetches with accurate membership
        if (statusChanged && key.includes('status=') && !key.includes('status=all')) {
          return;
        }

        const entry = state.myLeadsCache[key];
        updatedCache[key] = {
          ...entry,
          leads: entry.leads.map((lead) =>
            lead._id === leadId ? { ...lead, ...updatedFields } : lead
          ),
        };
      });

      return {
        myLeads: updatedMyLeads,
        recentLeads: updatedRecentLeads,
        myLeadsCache: updatedCache,
      };
    });
  },

  // Delete lead from active view & cached queries
  deleteLeadFromCache: (leadId) => {
    set((state) => {
      const updatedMyLeads = state.myLeads.filter((l) => l._id !== leadId);
      const updatedRecentLeads = state.recentLeads.filter((l) => l._id !== leadId);
      const newTotal = Math.max(0, state.myLeadsTotalCount - 1);

      const updatedCache = {};
      Object.keys(state.myLeadsCache).forEach((key) => {
        const entry = state.myLeadsCache[key];
        updatedCache[key] = {
          ...entry,
          leads: entry.leads.filter((l) => l._id !== leadId),
          totalCount: Math.max(0, entry.totalCount - 1),
        };
      });

      return {
        myLeads: updatedMyLeads,
        recentLeads: updatedRecentLeads,
        myLeadsTotalCount: newTotal,
        myLeadsCache: updatedCache,
      };
    });
  },

  // Invalidate dashboard without wiping stats so next visit revalidates smoothly in background
  invalidateDashboard: () => {
    set({ dashboardLastFetched: 1 });
  },

  // Invalidate cache without wiping the UI so next visits revalidate smoothly in background
  invalidateMyLeadsCache: () => {
    set((state) => {
      const staleCache = {};
      Object.keys(state.myLeadsCache).forEach((key) => {
        staleCache[key] = {
          ...state.myLeadsCache[key],
          timestamp: 0,
        };
      });
      return { myLeadsCache: staleCache };
    });
  },
}));
