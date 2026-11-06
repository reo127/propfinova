import { create } from 'zustand';

const DASHBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache validity

export const useDashboardStore = create((set, get) => ({
  stats: {
    totalProperties: 0,
    totalLeads: 0,
    interestedCount: 0,
    siteVisitsCount: 0,
    unassignedCount: 0,
    recentLeads: [],
  },
  loading: false,
  refreshing: false,
  lastFetched: null,
  error: null,

  fetchDashboardData: async ({ force = false } = {}) => {
    const { stats, lastFetched, loading, refreshing } = get();
    const hasData = stats.totalProperties > 0 || stats.totalLeads > 0;
    const isFresh = lastFetched && (Date.now() - lastFetched < DASHBOARD_CACHE_TTL);

    // Return cached data immediately if still fresh and not a forced manual refresh
    if (!force && isFresh && hasData) {
      return { success: true, stats, fromCache: true };
    }

    if (loading || refreshing) return { success: true, stats };

    // If we already have numbers, keep them visible (Stale-While-Revalidate)
    // Only set full loading if cold boot with zero cached stats
    if (force || hasData) {
      set({ refreshing: true });
    } else {
      set({ loading: true });
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      // 1. Fetch properties count
      const propPromise = fetch('/api/properties', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then((r) => r.json()).catch(() => ({ success: false }));

      // 2. Fetch total leads and recent leads stream (includes pipelineStats)
      const leadsPromise = fetch('/api/leads?limit=6&sortBy=createdAt&sortOrder=desc')
        .then((r) => r.json()).catch(() => ({ success: false }));

      const [propData, leadsData] = await Promise.all([propPromise, leadsPromise]);

      let interestedCount = leadsData?.pipelineStats?.interested;
      let siteVisitsCount = leadsData?.pipelineStats?.siteVisits;
      let unassignedCount = leadsData?.pipelineStats?.unassigned;

      // Fallback only if pipelineStats is missing
      if (interestedCount === undefined || siteVisitsCount === undefined || unassignedCount === undefined) {
        const [interestedData, siteVisitsData, unassignedData] = await Promise.all([
          fetch('/api/leads?limit=1&status=interested').then((r) => r.json()).catch(() => ({ success: false })),
          fetch('/api/leads?limit=1&status=site_visit_scheduled').then((r) => r.json()).catch(() => ({ success: false })),
          fetch('/api/leads?limit=1&assignmentStatus=unassigned').then((r) => r.json()).catch(() => ({ success: false })),
        ]);
        interestedCount = interestedCount ?? (interestedData?.success ? interestedData.totalCount || 0 : stats.interestedCount);
        siteVisitsCount = siteVisitsCount ?? (siteVisitsData?.success ? siteVisitsData.totalCount || 0 : stats.siteVisitsCount);
        unassignedCount = unassignedCount ?? (unassignedData?.success ? unassignedData.totalCount || 0 : stats.unassignedCount);
      }

      const newStats = {
        totalProperties: propData?.success
          ? propData.count || (propData.data ? propData.data.length : 0)
          : stats.totalProperties,
        totalLeads: leadsData?.pipelineStats?.total ?? (leadsData?.success ? leadsData.totalCount || 0 : stats.totalLeads),
        recentLeads: leadsData?.success ? leadsData.data || [] : stats.recentLeads,
        interestedCount: interestedCount ?? stats.interestedCount,
        siteVisitsCount: siteVisitsCount ?? stats.siteVisitsCount,
        unassignedCount: unassignedCount ?? stats.unassignedCount,
      };

      set({
        stats: newStats,
        lastFetched: Date.now(),
        loading: false,
        refreshing: false,
        error: null,
      });

      return { success: true, stats: newStats, fromCache: false };
    } catch (err) {
      console.error('Error fetching dashboard data in store:', err);
      set({ loading: false, refreshing: false, error: err.message });
      return { success: false, error: err.message, stats };
    }
  },

  // Instant sync when pipeline changes elsewhere in app
  syncPipelineStats: (pipelineStats) => {
    if (!pipelineStats) return;
    set((state) => ({
      stats: {
        ...state.stats,
        totalLeads: pipelineStats.total ?? state.stats.totalLeads,
        interestedCount: pipelineStats.interested ?? state.stats.interestedCount,
        siteVisitsCount: pipelineStats.siteVisits ?? state.stats.siteVisitsCount,
        unassignedCount: pipelineStats.unassigned ?? state.stats.unassignedCount,
      },
      lastFetched: Date.now(),
    }));
  },

  // Invalidate cache by forcing next visit to background revalidate without resetting numbers to 0
  invalidateDashboard: () => {
    set({ lastFetched: 1 }); // 1 ensures isFresh evaluates to false, but hasData remains true so no loading spinner
  },
}));
