'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  CalendarCheck,
  Target,
  Award,
  MapPin,
  Flame,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Compass,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { getLocationDisplayName } from '@/utils/locations';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('all'); // all, 30d, 7d
  const [analyticsData, setAnalyticsData] = useState({
    totalLeads: 0,
    totalProperties: 0,
    totalAgents: 0,
    interestedCount: 0,
    siteVisitsScheduled: 0,
    siteVisitsDone: 0,
    notConnectedCount: 0,
    topLocations: [],
    advisorLeaderboard: [],
    stageBreakdown: [],
    modeBreakdown: { sell: 0, rent: 0 },
    typeBreakdown: {}
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setRefreshing(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      // 1. Fetch leads sample & total
      let dateFilterParam = '';
      if (timeRange === '30d') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        dateFilterParam = `&dateFrom=${d.toISOString().split('T')[0]}`;
      } else if (timeRange === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        dateFilterParam = `&dateFrom=${d.toISOString().split('T')[0]}`;
      }

      const [leadsRes, propsRes, agentsRes] = await Promise.all([
        fetch(`/api/leads?limit=300${dateFilterParam}`).then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/properties', { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/agents?includeStats=true').then(r => r.json()).catch(() => ({ success: false }))
      ]);

      const leads = leadsRes.data || [];
      const totalLeads = leadsRes.totalCount || leads.length;
      const properties = propsRes.data || [];
      const agents = agentsRes.data || [];

      // Calculate stage counts
      let interested = 0;
      let visitsScheduled = 0;
      let visitsDone = 0;
      let notConnected = 0;
      const locationMap = {};

      leads.forEach(l => {
        if (l.status === 'interested') interested++;
        else if (l.status === 'site_visit_scheduled' || l.status === 'visit_rescheduled') visitsScheduled++;
        else if (l.status === 'site_visit_done') visitsDone++;
        else if (l.status === 'not_connected' || l.status === 'call_disconnected') notConnected++;

        if (l.interestedLocation) {
          const loc = getLocationDisplayName(l.interestedLocation);
          locationMap[loc] = (locationMap[loc] || 0) + 1;
        }
      });

      // Top requested locations
      const topLocations = Object.entries(locationMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Property modes & types
      let sellCount = 0;
      let rentCount = 0;
      const typeMap = {};
      properties.forEach(p => {
        if (p.mode === 'rent') rentCount++;
        else sellCount++;

        const t = p.type || 'apartment';
        typeMap[t] = (typeMap[t] || 0) + 1;
      });

      // Advisor leaderboard
      const advisorLeaderboard = agents
        .map(a => {
          const assigned = a.currentAssignedCount || 0;
          const completed = a.currentCompletedCount || 0;
          const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
          return {
            id: a._id,
            name: a.name,
            assigned,
            completed,
            rate
          };
        })
        .sort((a, b) => b.completed - a.completed || b.rate - a.rate);

      setAnalyticsData({
        totalLeads,
        totalProperties: properties.length,
        totalAgents: agents.length,
        interestedCount: interested,
        siteVisitsScheduled: visitsScheduled,
        siteVisitsDone: visitsDone,
        notConnectedCount: notConnected,
        topLocations,
        advisorLeaderboard,
        modeBreakdown: { sell: sellCount, rent: rentCount },
        typeBreakdown: typeMap
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const conversionRate = analyticsData.totalLeads > 0
    ? Math.round(((analyticsData.interestedCount + analyticsData.siteVisitsScheduled + analyticsData.siteVisitsDone) / analyticsData.totalLeads) * 100)
    : 0;

  const visitRatio = analyticsData.totalLeads > 0
    ? Math.round(((analyticsData.siteVisitsScheduled + analyticsData.siteVisitsDone) / analyticsData.totalLeads) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl border-2 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-700">Compiling Portfolio Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
              Intelligence &amp; Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Executive Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Real-time pipeline progression, territory demand curves, and advisor performance metrics.
          </p>
        </div>

        {/* Time range pills & refresh */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center p-1 bg-surface border border-slate-200 rounded-xl shadow-2xs">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                timeRange === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                timeRange === '30d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                timeRange === '7d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
          </div>

          <button
            onClick={loadAnalytics}
            disabled={refreshing}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-surface hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Key Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pipeline Conversion</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{conversionRate}%</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Inquiries progressing to qualified stage
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Site Visits Momentum</span>
            <CalendarCheck className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-3xl font-black text-violet-700 tracking-tight">
            {analyticsData.siteVisitsScheduled + analyticsData.siteVisitsDone}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {visitRatio}% visit conversion ratio
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Inventory</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {analyticsData.totalProperties}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {analyticsData.modeBreakdown.sell} For Sale • {analyticsData.modeBreakdown.rent} For Rent
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Inquiries</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {analyticsData.totalLeads}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all digital channels</p>
        </div>
      </div>

      {/* Visual Funnel & Territorial Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Funnel (2 Cols) */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Prospect Pipeline Funnel</h2>
              <p className="text-xs text-slate-500 mt-0.5">Stage velocity and inquiry conversion depth</p>
            </div>
            <span className="text-xs font-bold text-primary bg-rose-50 px-2.5 py-1 rounded-full">
              {analyticsData.totalLeads} Records Analyzed
            </span>
          </div>

          <div className="space-y-4">
            {/* Stage 1: Total Leads */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>1. Initial Prospect Inquiries</span>
                </span>
                <span>{analyticsData.totalLeads} (100%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full w-full transition-all duration-700"></div>
              </div>
            </div>

            {/* Stage 2: Interested */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>2. Qualified &amp; Interested Buyers</span>
                </span>
                <span>
                  {analyticsData.interestedCount}{' '}
                  ({analyticsData.totalLeads > 0 ? Math.round((analyticsData.interestedCount / analyticsData.totalLeads) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${analyticsData.totalLeads > 0 ? (analyticsData.interestedCount / analyticsData.totalLeads) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Stage 3: Site Visits */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                  <span>3. Scheduled &amp; Completed Site Tours</span>
                </span>
                <span>
                  {analyticsData.siteVisitsScheduled + analyticsData.siteVisitsDone}{' '}
                  ({visitRatio}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-violet-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${visitRatio}%` }}
                ></div>
              </div>
            </div>

            {/* Stage 4: Not Connected / Pending Attempt */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>4. Unreachable / In Progress Re-Attempt</span>
                </span>
                <span>
                  {analyticsData.notConnectedCount}{' '}
                  ({analyticsData.totalLeads > 0 ? Math.round((analyticsData.notConnectedCount / analyticsData.totalLeads) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${analyticsData.totalLeads > 0 ? (analyticsData.notConnectedCount / analyticsData.totalLeads) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Territory Demand Curve (1 Col) */}
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Compass className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-slate-900">Top Demanded Localities</h2>
          </div>

          <div className="space-y-3">
            {analyticsData.topLocations.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No location metrics logged</p>
            ) : (
              analyticsData.topLocations.map((loc, idx) => {
                const maxCount = analyticsData.topLocations[0]?.count || 1;
                const pct = Math.round((loc.count / maxCount) * 100);
                return (
                  <div key={loc.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span className="truncate max-w-[180px]">
                        {idx + 1}. {loc.name}
                      </span>
                      <span className="text-slate-500">{loc.count} leads</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-rose-400 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Advisor Performance Leaderboard */}
      <div className="bg-surface rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Advisor Performance Leaderboard</h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {analyticsData.advisorLeaderboard.length} Advisors in Rotation
          </span>
        </div>

        {analyticsData.advisorLeaderboard.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No advisor performance data available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyticsData.advisorLeaderboard.map((advisor, index) => (
              <div
                key={advisor.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between space-x-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                    index === 0
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : index === 1
                      ? 'bg-slate-300 text-slate-900'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{advisor.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {advisor.completed} / {advisor.assigned} Resolved
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-slate-900">{advisor.rate}%</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Resolution</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}