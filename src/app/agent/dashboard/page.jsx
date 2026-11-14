'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  PhoneCall,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  Calendar,
  Sparkles,
  ArrowRight,
  Phone,
  MapPin,
  ChevronRight,
  Target,
  Flame,
  Award,
  BookOpen,
  Activity,
  AlertCircle
} from 'lucide-react';
import { getLocationDisplayName } from '@/utils/locations';
import { useAgentStore } from '@/stores';

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const stats = useAgentStore((state) => state.dashboardStats);
  const recentLeads = useAgentStore((state) => state.recentLeads);
  const loading = useAgentStore((state) => state.dashboardLoading);
  const refreshing = useAgentStore((state) => state.dashboardRefreshing);
  const fetchDashboardData = useAgentStore((state) => state.fetchDashboardData);

  useEffect(() => {
    // Check if user is agent
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        queueMicrotask(() => {
          setUser(userData);
        });
        if (userData.role !== 'agent') {
          router.push('/admin');
          return;
        }
        fetchDashboardData(userData._id);
      } else {
        router.push('/login');
      }
    }
  }, [router, fetchDashboardData]);

  const handleRefresh = async () => {
    if (!user?._id) return;
    await fetchDashboardData(user._id, { force: true });
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'new': 'New Lead',
      'not_connected': 'Not Connected',
      'interested': 'Interested',
      'site_visit_scheduled': 'Visit Scheduled',
      'follow_up_scheduled': 'Follow-up Set',
      'visit_rescheduled': 'Visit Rescheduled',
      'site_visit_done': 'Site Visit Done',
      'not_interested': 'Not Interested',
      'call_disconnected': 'Call Disconnected',
      'location_mismatch': 'Location Mismatch',
      'budget_mismatch': 'Budget Mismatch',
      'possession_mismatch': 'Possession Mismatch',
      'do_not_disturb': 'DND'
    };
    return statusMap[status] || status;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'interested':
      case 'site_visit_done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'site_visit_scheduled':
      case 'visit_rescheduled':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'follow_up_scheduled':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'not_connected':
      case 'call_disconnected':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'not_interested':
      case 'do_not_disturb':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'new':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  if (loading && stats.totalAssigned === 0 && recentLeads.length === 0) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-6 bg-[#F8FAFC]">
        <div className="max-w-md w-full bg-surface rounded-3xl border border-slate-200/80 shadow-xl p-8 text-center space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="relative w-16 h-16 mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 animate-ping absolute inset-0" />
            <div className="w-16 h-16 rounded-2xl border-2 border-primary/20 border-t-primary animate-spin flex items-center justify-center relative z-10 bg-surface">
              <Users className="w-7 h-7 text-primary" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Advisor Live Stream</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Loading Advisor Command Center
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Synchronizing assigned leads, pipeline metrics &amp; scheduled visits...
            </p>
          </div>

          {/* Animated pulse progress line */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary-dark h-1.5 rounded-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = stats.totalAssigned > 0
    ? Math.round((stats.completed / stats.totalAssigned) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-secondary via-[#121829] to-secondary p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-serif">
              {getTimeGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">{user?.name}</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Here is your daily pipeline snapshot. You have <strong className="text-white">{stats.pending} leads</strong> pending action today.
            </p>
          </div>

          {/* Quick CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
            <Link
              href="/agent/my-leads"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-btn-text bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Start Calling Queue</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Live Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Assigned */}
        <div className="bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Assigned Pipeline</span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalAssigned}</div>
            <p className="mt-1 text-xs text-slate-600 flex items-center space-x-1">
              <span>Total leads assigned to your queue</span>
            </p>
          </div>
        </div>

        {/* Card 2: Pending Calls */}
        <div className="bg-surface rounded-2xl p-6 border border-amber-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Action</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-amber-600 tracking-tight">{stats.pending}</div>
            <p className="mt-1 text-xs text-amber-700/80 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping mr-1 inline-block"></span>
              <span>Needs follow-up or initial call</span>
            </p>
          </div>
        </div>

        {/* Card 3: Completed */}
        <div className="bg-surface rounded-2xl p-6 border border-emerald-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Calls Handled</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{stats.completed}</div>
            <p className="mt-1 text-xs text-emerald-700/80">
              {stats.totalAssigned > 0 ? `${completionPercentage}% of assigned volume` : 'No leads completed'}
            </p>
          </div>
        </div>

        {/* Card 4: Success / Conversion Rate */}
        <div className="bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Completion Rate</span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.successRate}%</div>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.successRate)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Target & Performance Bar */}
      <div className="bg-gradient-to-br from-slate-900 via-secondary to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Today&apos;s Advisory Performance Goal</h2>
              <p className="text-xs text-slate-400">
                Aim for 100% resolution on daily assigned leads for maximum conversion.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">Remaining to Call</div>
              <div className="text-lg font-black text-primary">{stats.pending} Leads</div>
            </div>
            <Link
              href="/agent/my-leads?status=new"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
            >
              Filter Pending
            </Link>
          </div>
        </div>

        {/* Progress Bar with Milestone Markers */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>Progress: {stats.completed} / {stats.totalAssigned} resolved</span>
            <span className="text-emerald-400">{completionPercentage}% Achieved</span>
          </div>

          <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-primary via-rose-500 to-emerald-500 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${stats.totalAssigned > 0 ? completionPercentage : 0}%` }}
            ></div>
          </div>

          {/* Milestone markers */}
          <div className="grid grid-cols-4 text-[11px] font-medium text-slate-400 pt-1">
            <div className="text-left">25% Starter</div>
            <div className="text-center">50% Pace</div>
            <div className="text-center">75% High Performer</div>
            <div className="text-right text-emerald-400">100% Elite Closer</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Call Queue (Left) & Quick Matchmaker / Playbook (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Assigned Leads Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-slate-900">Priority Assigned Queue</h2>
            </div>
            <Link
              href="/agent/my-leads"
              className="text-xs font-bold text-primary hover:text-primary-dark flex items-center space-x-1"
            >
              <span>View Full Pipeline</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading && recentLeads.length === 0 ? (
              <div className="divide-y divide-slate-100">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                      <div className="space-y-1.5">
                        <div className="w-32 h-4 bg-slate-200 rounded-md" />
                        <div className="w-24 h-3 bg-slate-100 rounded-md" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-7 bg-slate-100 rounded-lg" />
                      <div className="w-20 h-7 bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLeads.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No leads in your immediate queue</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  New leads will show up here once assigned by the sales administrator.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLeads.map((lead) => (
                  <div
                    key={lead._id}
                    className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {lead.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 truncate">{lead.name}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(lead.status)}`}>
                            {getStatusDisplay(lead.status)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-slate-600">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{getLocationDisplayName(lead.interestedLocation || 'Mumbai')}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{lead.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 sm:self-center shrink-0">
                      <Link
                        href={`/agent/my-leads/${lead._id}`}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
                      >
                        <span>Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rapid Launchpad & Advisor Sales Playbook */}
        <div className="space-y-6">
          {/* Inventory Matchmaker Card */}
          <div className="bg-gradient-to-br from-secondary to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-primary text-btn-text flex items-center justify-center mb-4 shadow-sm shadow-primary/30">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Live Property Matchmaker</h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Instantly find projects matching budget, BHK, and possession timelines while on a customer call.
            </p>
            <Link
              href="/agent/property-search"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all"
            >
              <span>Launch Inventory Search</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Advisor Best Practices & Sales Playbook */}
          <div className="bg-surface rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Advisor Sales Playbook</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-xs font-bold text-slate-900">The 5-Minute Follow-Up Rule</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Leads contacted within 5 minutes of assignment have an 8x higher conversion rate.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-xs font-bold text-slate-900">Always Log Call Outcomes</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Update status and detailed discussion notes after every call to preserve lead history.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="text-xs font-bold text-slate-900">Site Visit Commitments</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Confirm the client&apos;s site visit date and send Google Maps location via WhatsApp immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
