'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  CalendarCheck,
  MapPin,
  Clock,
  ArrowUpDown,
  FileText,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Check,
  RefreshCw
} from 'lucide-react';
import { getLocationDisplayName } from '@/utils/locations';
import { useAgentStore } from '@/stores';

export default function AgentLeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pipelineStats = useAgentStore((state) => state.pipelineStats);
  const statsLoaded = useAgentStore((state) => state.statsLoaded);
  const fetchMyLeads = useAgentStore((state) => state.fetchMyLeads);
  const leads = useAgentStore((state) => state.myLeads);
  const totalPages = useAgentStore((state) => state.myLeadsTotalPages);
  const totalCount = useAgentStore((state) => state.myLeadsTotalCount);
  const loading = useAgentStore((state) => state.leadsLoading);
  const refreshing = useAgentStore((state) => state.leadsRefreshing);
  const error = useAgentStore((state) => state.leadsError);

  const [user, setUser] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [visitedLeads, setVisitedLeads] = useState(new Set());

  // Read all filter values from URL (source of truth)
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'assignedAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const statusFilter = searchParams.get('status') || 'all';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  // Helper function to update URLParams
  const updateURLParams = (updates, addToHistory = false) => {
    const params = new URLSearchParams();

    const current = {
      page: currentPage.toString(),
      sortBy: sortBy,
      sortOrder: sortOrder,
      search: searchTerm,
      status: statusFilter,
      dateFrom: dateFrom,
      dateTo: dateTo,
    };

    const merged = { ...current, ...updates };

    if (merged.page && merged.page !== '1') params.set('page', merged.page);
    if (merged.sortBy && merged.sortBy !== 'assignedAt') params.set('sortBy', merged.sortBy);
    if (merged.sortOrder && merged.sortOrder !== 'desc') params.set('sortOrder', merged.sortOrder);
    if (merged.search) params.set('search', merged.search);
    if (merged.status && merged.status !== 'all') params.set('status', merged.status);
    if (merged.dateFrom) params.set('dateFrom', merged.dateFrom);
    if (merged.dateTo) params.set('dateTo', merged.dateTo);

    if (addToHistory) {
      router.push(`/agent/my-leads?${params.toString()}`, { scroll: false });
    } else {
      router.replace(`/agent/my-leads?${params.toString()}`, { scroll: false });
    }
  };

  // Initialize searchInput from URL
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  // Load visited leads from session storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVisited = sessionStorage.getItem('visitedLeads');
      if (savedVisited) {
        try {
          setVisitedLeads(new Set(JSON.parse(savedVisited)));
        } catch (e) {
          console.error('Error loading visited leads:', e);
        }
      }
    }
  }, []);

  // Load user and fetch leads with Zustand caching
  useEffect(() => {
    const loadUserAndLeads = async () => {
      if (typeof window === 'undefined') return;

      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        router.push('/login');
        return;
      }

      const userData = JSON.parse(storedUser);

      if (userData.role !== 'agent') {
        router.push('/admin');
        return;
      }

      setUser(userData);

      if (!userData._id) {
        setSessionError('Invalid user session. Please sign in again.');
        return;
      }

      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '30',
          sortBy: sortBy,
          sortOrder: sortOrder,
          assignedTo: userData._id,
        });

        if (searchTerm) params.set('search', searchTerm);
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);

        const res = await fetchMyLeads(params.toString());

        if (res.success) {
          if (res.totalPages > 0 && currentPage > res.totalPages) {
            updateURLParams({ page: res.totalPages.toString() }, false);
          }
        }
      } catch (err) {
        console.error('Error fetching leads:', err);
      }
    };

    loadUserAndLeads();
  }, [currentPage, searchTerm, sortBy, sortOrder, statusFilter, dateFrom, dateTo, router, fetchMyLeads]);

  const handleSearch = () => {
    updateURLParams({ search: searchInput, page: '1' });
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRowClick = (leadId) => {
    const newVisited = new Set(visitedLeads);
    newVisited.add(leadId);
    setVisitedLeads(newVisited);
    sessionStorage.setItem('visitedLeads', JSON.stringify([...newVisited]));

    const params = new URLSearchParams({
      sortBy,
      sortOrder,
      page: currentPage.toString(),
      ...(searchTerm && { search: searchTerm }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo })
    });
    router.push(`/agent/my-leads/${leadId}?${params.toString()}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'new': 'New',
      'not_connected': 'Not Connected',
      'interested': 'Interested',
      'site_visit_scheduled': 'Site Visit Scheduled',
      'follow_up_scheduled': 'Follow-up Scheduled',
      'visit_rescheduled': 'Visit Rescheduled',
      'site_visit_done': 'Site Visit Done',
      'not_interested': 'Not Interested',
      'call_disconnected': 'Call Disconnected',
      'location_mismatch': 'Location Mismatch',
      'budget_mismatch': 'Budget Mismatch',
      'possession_mismatch': 'Possession Mismatch',
      'do_not_disturb': 'Do Not Disturb'
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeConfig = (status) => {
    switch (status) {
      case 'interested':
      case 'site_visit_done':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500'
        };
      case 'site_visit_scheduled':
      case 'visit_rescheduled':
        return {
          pill: 'bg-purple-50 text-purple-700 border-purple-200/80',
          dot: 'bg-purple-500'
        };
      case 'follow_up_scheduled':
        return {
          pill: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
          dot: 'bg-cyan-500'
        };
      case 'not_connected':
      case 'call_disconnected':
        return {
          pill: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dot: 'bg-amber-500'
        };
      case 'not_interested':
      case 'do_not_disturb':
      case 'location_mismatch':
      case 'budget_mismatch':
      case 'possession_mismatch':
        return {
          pill: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dot: 'bg-rose-500'
        };
      case 'new':
      default:
        return {
          pill: 'bg-blue-50 text-blue-700 border-blue-200/80',
          dot: 'bg-blue-500'
        };
    }
  };

  const formatSubstatusText = (substatus) => {
    if (!substatus) return null;
    const substatusDisplayNames = {
      'ringing': 'Ringing',
      'switched_off': 'Switched Off',
      'call_busy': 'Call Busy',
      'call_disconnected': 'Call Disconnected',
      'invalid_number': 'Invalid Number',
      'site_visit_scheduled_with_date': 'Visit (With Date)',
      'site_visit_scheduled_no_date': 'Visit (No Date)',
      'follow_up': 'Follow Up',
      'not_actively_searching': 'Not Actively Searching',
      'require_more_than_6_months': '> 6 Months',
      'not_the_right_party': 'Wrong Party',
      'hang_up_while_talking': 'Hang Up',
      'call_drop': 'Call Drop',
      'looking_for_other_location': 'Other Location',
      'looking_for_other_city': 'Other City',
      'budget_is_low': 'Budget Low',
      'budget_is_high': 'Budget High',
      'looking_for_ready_to_move': 'Ready to Move',
      'looking_for_under_construction': 'Under Construction',
      'already_in_touch_with_builder': 'In Touch With Builder',
      'deal_closed': 'Deal Closed',
      'plan_drop': 'Plan Dropped',
      'plan_postponed': 'Plan Postponed',
      'already_purchased': 'Purchased',
      'dnc': 'DNC',
      'interested_in_revisit': 'Interested in Revisit',
      'plan_cancelled': 'Plan Cancelled'
    };
    return substatusDisplayNames[substatus] || substatus;
  };

  const cleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '').slice(-10);
  };

  const hasActiveFilters = statusFilter !== 'all' || dateFrom || dateTo || searchTerm || searchInput;

  // Active filter states for KPI pipeline strip
  const isAllActive = statusFilter === 'all';
  const isInterestedActive = statusFilter === 'interested';
  const isSiteVisitsActive = statusFilter === 'site_visit_scheduled' || statusFilter === 'visit_rescheduled';
  const isFollowUpActive = statusFilter === 'follow_up_scheduled' || statusFilter === 'follow_up';

  const handleCardClick = (cardType) => {
    switch (cardType) {
      case 'all':
        updateURLParams({ status: 'all', page: '1' });
        break;
      case 'interested':
        if (isInterestedActive) {
          updateURLParams({ status: 'all', page: '1' });
        } else {
          updateURLParams({ status: 'interested', page: '1' });
        }
        break;
      case 'site_visits':
        if (isSiteVisitsActive) {
          updateURLParams({ status: 'all', page: '1' });
        } else {
          updateURLParams({ status: 'site_visit_scheduled', page: '1' });
        }
        break;
      case 'follow_ups':
        if (isFollowUpActive) {
          updateURLParams({ status: 'all', page: '1' });
        } else {
          updateURLParams({ status: 'follow_up_scheduled', page: '1' });
        }
        break;
      default:
        break;
    }
  };

  const quickFilterPills = [
    { label: 'All Leads', value: 'all' },
    { label: 'New', value: 'new' },
    { label: 'Interested', value: 'interested' },
    { label: 'Visit Scheduled', value: 'site_visit_scheduled' },
    { label: 'Follow-Up', value: 'follow_up_scheduled' },
    { label: 'Not Connected', value: 'not_connected' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Pipeline Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
              My Assigned Leads
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 tabular-nums">
              {hasActiveFilters
                ? `${totalCount.toLocaleString()} Matching Leads`
                : `${(pipelineStats.total || totalCount).toLocaleString()} Total Assigned`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Prioritize calling new and pending leads. Hover over stages & notes for instant intel.
          </p>
        </div>

        {/* Quick Jump Bar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (user?._id) {
                const params = new URLSearchParams({
                  page: currentPage.toString(),
                  limit: '30',
                  sortBy,
                  sortOrder,
                  assignedTo: user._id,
                  ...(searchTerm && { search: searchTerm }),
                  ...(statusFilter !== 'all' && { status: statusFilter }),
                  ...(dateFrom && { dateFrom }),
                  ...(dateTo && { dateTo }),
                });
                fetchMyLeads(params.toString(), { force: true });
              }
            }}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:text-slate-900 bg-surface hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Force Refresh Leads"
          >
            <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/agent/property-search"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-surface hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-primary" />
            <span>Search Inventory</span>
          </Link>
        </div>
      </div>

      {/* Interactive KPI Pipeline Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Leads */}
        <button
          onClick={() => handleCardClick('all')}
          title={isAllActive ? 'Showing complete assigned queue' : 'Click to show all assigned leads'}
          className={`relative text-left p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
            isAllActive
              ? 'bg-surface border-primary shadow-md ring-2 ring-primary/25'
              : 'bg-surface/80 hover:bg-surface border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">All Leads</span>
            {isAllActive ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-btn-text">
                <Check className="w-2.5 h-2.5" /> All
              </span>
            ) : (
              <Users className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
            {statsLoaded ? (
              (pipelineStats.total ?? totalCount).toLocaleString()
            ) : (
              <span className="inline-block w-14 h-7 bg-slate-100 animate-pulse rounded-md" />
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            {isAllActive ? 'Showing all leads' : 'Complete queue • Reset'}
          </p>
        </button>

        {/* Card 2: Interested (Hot) */}
        <button
          onClick={() => handleCardClick('interested')}
          title={isInterestedActive ? 'Active filter • Click to clear' : 'Click to filter by interested buyers'}
          className={`relative text-left p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
            isInterestedActive
              ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/25'
              : 'bg-surface/80 hover:bg-surface border-slate-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-emerald-700 mb-1">
            <span className="font-semibold">High Intent</span>
            {isInterestedActive ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                <Check className="w-2.5 h-2.5" /> Filtered
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Hot
              </span>
            )}
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 tabular-nums">
            {statsLoaded ? (
              (pipelineStats.interested ?? 0).toLocaleString()
            ) : (
              <span className="inline-block w-10 h-7 bg-emerald-100/60 animate-pulse rounded-md" />
            )}
          </div>
          <p className="text-[10px] text-emerald-600 mt-1 font-medium">
            {isInterestedActive ? 'Click to show all' : 'Interested buyers'}
          </p>
        </button>

        {/* Card 3: Site Visits */}
        <button
          onClick={() => handleCardClick('site_visits')}
          title={isSiteVisitsActive ? 'Active filter • Click to clear' : 'Click to filter by scheduled site visits'}
          className={`relative text-left p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
            isSiteVisitsActive
              ? 'bg-violet-50/80 border-violet-500 shadow-md ring-2 ring-violet-500/25'
              : 'bg-surface/80 hover:bg-surface border-slate-200/80 hover:border-violet-300 shadow-2xs hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-violet-700 mb-1">
            <span className="font-semibold">Site Visits</span>
            {isSiteVisitsActive ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-600 text-white">
                <Check className="w-2.5 h-2.5" /> Filtered
              </span>
            ) : (
              <CalendarCheck className="w-4 h-4 text-violet-500" />
            )}
          </div>
          <div className="text-2xl font-extrabold text-violet-900 tabular-nums">
            {statsLoaded ? (
              (pipelineStats.siteVisits ?? 0).toLocaleString()
            ) : (
              <span className="inline-block w-10 h-7 bg-violet-100/60 animate-pulse rounded-md" />
            )}
          </div>
          <p className="text-[10px] text-violet-600 mt-1 font-medium">
            {isSiteVisitsActive ? 'Click to show all' : 'Scheduled showings'}
          </p>
        </button>

        {/* Card 4: Follow Ups */}
        <button
          onClick={() => handleCardClick('follow_ups')}
          title={isFollowUpActive ? 'Active filter • Click to clear' : 'Click to filter by scheduled follow-ups'}
          className={`relative text-left p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
            isFollowUpActive
              ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-500/25'
              : 'bg-surface/80 hover:bg-surface border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-amber-700 mb-1">
            <span className="font-semibold">Follow-ups</span>
            {isFollowUpActive ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                <Check className="w-2.5 h-2.5" /> Filtered
              </span>
            ) : (
              <Clock className="w-4 h-4 text-amber-500" />
            )}
          </div>
          <div className="text-2xl font-extrabold text-amber-900 tabular-nums">
            {statsLoaded ? (
              (pipelineStats.followUps ?? 0).toLocaleString()
            ) : (
              <span className="inline-block w-10 h-7 bg-amber-100/60 animate-pulse rounded-md" />
            )}
          </div>
          <p className="text-[10px] text-amber-600 mt-1 font-medium">
            {isFollowUpActive ? 'Click to show all' : 'Pending callback'}
          </p>
        </button>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {quickFilterPills.map((pill) => {
          const isSelected = statusFilter === pill.value;
          return (
            <button
              key={pill.value}
              onClick={() => updateURLParams({ status: pill.value, page: '1' })}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-surface text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200/80'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Modern Search & Comprehensive Filter Control */}
      <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        {/* Search Bar Row */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by prospect name, phone number, email, or preferred locality..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-surface text-slate-900 placeholder:text-slate-600 text-sm font-medium rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-none"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  updateURLParams({ search: '', page: '1' });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        {/* Detailed Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Status Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Pipeline Stage
            </label>
            <select
              value={statusFilter}
              onChange={(e) => updateURLParams({ status: e.target.value, page: '1' })}
              className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 focus:border-primary focus:bg-surface outline-none transition-colors"
            >
              <option value="all">All Stages</option>
              <option value="new">New</option>
              <option value="not_connected">Not Connected</option>
              <option value="interested">Interested</option>
              <option value="site_visit_scheduled">Site Visit Scheduled</option>
              <option value="follow_up_scheduled">Follow-up Scheduled</option>
              <option value="visit_rescheduled">Visit Rescheduled</option>
              <option value="site_visit_done">Site Visit Done</option>
              <option value="not_interested">Not Interested</option>
              <option value="call_disconnected">Call Disconnected</option>
              <option value="location_mismatch">Location Mismatch</option>
              <option value="budget_mismatch">Budget Mismatch</option>
              <option value="possession_mismatch">Possession Mismatch</option>
              <option value="do_not_disturb">Do Not Disturb</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Assigned From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => updateURLParams({ dateFrom: e.target.value, page: '1' })}
              className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 focus:border-primary focus:bg-surface outline-none transition-colors"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Assigned To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => updateURLParams({ dateTo: e.target.value, page: '1' })}
              className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 focus:border-primary focus:bg-surface outline-none transition-colors"
            />
          </div>

          {/* Sorting */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sort Prospects
            </label>
            <div className="flex gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => updateURLParams({ sortBy: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 focus:border-primary focus:bg-surface outline-none transition-colors"
              >
                <option value="assignedAt">Recently Assigned</option>
                <option value="createdAt">Date Created</option>
                <option value="name">Name (A-Z)</option>
                <option value="interestedLocation">Location</option>
              </select>
              <button
                onClick={() => updateURLParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
                className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
            <span className="text-slate-500 font-medium">Active filters applied</span>
            <button
              onClick={() => {
                setSearchInput('');
                router.replace('/agent/my-leads', { scroll: false });
              }}
              className="text-primary hover:text-primary-dark font-bold inline-flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Leads Table Container */}
      {(error || sessionError) ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold text-rose-900">Failed to Load Leads</h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto">{error || sessionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : loading ? (
        <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Executive Loading Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Syncing Assigned Prospects...
                </h4>
                <p className="text-[11px] text-slate-500">
                  Retrieving your personal CRM portfolio &amp; contact activity
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Advisor Live Feed</span>
            </div>
          </div>

          {/* Skeleton Rows */}
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="w-36 h-4 bg-slate-200 rounded-md" />
                    <div className="w-24 h-3 bg-slate-100 rounded-md" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-28 h-7 bg-slate-100 rounded-lg" />
                  <div className="w-24 h-7 bg-slate-100 rounded-lg" />
                  <div className="w-32 h-8 bg-slate-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No leads match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try clearing some of your search filters to view more leads.'
              : 'You do not have any leads assigned to you yet. Check with your sales administrator.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchInput('');
                router.replace('/agent/my-leads', { scroll: false });
              }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-xs overflow-visible">
          {/* Table Scroller */}
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <th className="py-3.5 px-5">Prospect Details</th>
                  <th className="py-3.5 px-4">Contact Channels</th>
                  <th className="py-3.5 px-4">Pipeline Stage &amp; Appointment</th>
                  <th className="py-3.5 px-4">Notes &amp; Activity</th>
                  <th className="py-3.5 px-4">Assigned On</th>
                  <th className="py-3.5 px-5 text-right">Dossier Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {leads.map((lead, index) => {
                  const isVisited = visitedLeads.has(lead._id);
                  const statusConfig = getStatusBadgeConfig(lead.status);
                  const isNearBottom = index >= leads.length - 3 && leads.length > 3;
                  const popoverPosition = isNearBottom ? "bottom-full mb-2" : "top-full mt-2";
                  const bridgePosition = isNearBottom
                    ? "before:absolute before:-bottom-3 before:left-0 before:w-full before:h-4 before:content-['']"
                    : "before:absolute before:-top-3 before:left-0 before:w-full before:h-4 before:content-['']";

                  return (
                    <tr
                      key={lead._id}
                      onClick={() => handleRowClick(lead._id)}
                      className={`group transition-all duration-150 cursor-pointer ${
                        isVisited
                          ? 'bg-slate-50/40 hover:bg-slate-100/70 border-l-4 border-l-emerald-500'
                          : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* 1. Prospect Dossier */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 font-black text-xs flex items-center justify-center border border-slate-200 shrink-0 shadow-2xs group-hover:border-primary/40 transition-colors">
                            {lead.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2) || 'PR'}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                              {lead.name}
                            </div>
                            <div className="text-xs text-slate-600 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{getLocationDisplayName(lead.interestedLocation || 'Mumbai')}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Channels */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="select-all">{lead.phone}</span>
                            </span>
                          </div>
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-[11px] text-slate-600 hover:text-slate-700 flex items-center space-x-1 truncate max-w-[170px]"
                              title={lead.email}
                            >
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* 3. Stage & Appointment (with On-Hover Intel Popover) */}
                      <td className="py-4 px-4 whitespace-nowrap relative group/stage">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.pill}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                              <span>{getStatusDisplay(lead.status || 'new')}</span>
                            </span>
                          </div>

                          {lead.substatus && (
                            <div className="text-[11px] font-semibold text-slate-600 pl-1">
                              ↳ {formatSubstatusText(lead.substatus)}
                            </div>
                          )}

                          {lead.siteVisitDate && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200/80 px-2 py-0.5 rounded-md">
                              <CalendarCheck className="w-3 h-3" />
                              <span>
                                Visit:{' '}
                                {new Date(lead.siteVisitDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}

                          {lead.followUpDate && !lead.siteVisitDate && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200/80 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3" />
                              <span>
                                Follow-up:{' '}
                                {new Date(lead.followUpDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* On-Hover Stage & Notes Intel Popover */}
                        {((lead.notes && lead.notes.length > 0) || lead.followUpDate || lead.siteVisitDate || (lead.followUpHistory && lead.followUpHistory.length > 0) || (lead.visitHistory && lead.visitHistory.length > 0)) && (
                          <div
                            className={`invisible opacity-0 group-hover/stage:visible group-hover/stage:opacity-100 transition-all duration-200 absolute left-0 ${popoverPosition} w-80 sm:w-88 bg-surface/98 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4 z-50 pointer-events-auto text-left whitespace-normal ${bridgePosition}`}
                          >
                            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 tracking-tight">Stage &amp; Notes Intel</h4>
                                  <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{lead.name}</p>
                                </div>
                              </div>
                              {lead.notes && lead.notes.length > 0 && (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {lead.notes.length} {lead.notes.length === 1 ? 'Note' : 'Notes'}
                                </span>
                              )}
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                              {/* Next Scheduled Follow-up */}
                              {lead.followUpDate && (
                                <div className="p-2.5 bg-cyan-50/80 border border-cyan-200/80 rounded-xl text-xs">
                                  <div className="font-bold text-cyan-900 flex items-center gap-1.5 mb-0.5">
                                    <Clock className="w-3.5 h-3.5 text-cyan-600" />
                                    <span>Next Scheduled Follow-up</span>
                                  </div>
                                  <div className="text-cyan-800 font-semibold pl-5">
                                    {new Date(lead.followUpDate).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Next Site Visit */}
                              {lead.siteVisitDate && (
                                <div className="p-2.5 bg-violet-50/80 border border-violet-200/80 rounded-xl text-xs">
                                  <div className="font-bold text-violet-900 flex items-center gap-1.5 mb-0.5">
                                    <CalendarCheck className="w-3.5 h-3.5 text-violet-600" />
                                    <span>Scheduled Site Visit</span>
                                  </div>
                                  <div className="text-violet-800 font-semibold pl-5">
                                    {new Date(lead.siteVisitDate).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Notes Timeline */}
                              {lead.notes && lead.notes.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Conversation History
                                  </div>
                                  {lead.notes.slice().reverse().map((note, noteIdx) => (
                                    <div key={noteIdx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                                      <p className="text-slate-800 font-medium leading-relaxed">{note.content}</p>
                                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40">
                                        <span className="font-semibold text-slate-600">{note.addedBy || 'Advisor'}</span>
                                        <span>{formatDate(note.addedAt)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 4. Notes & Activity Column (with On-Hover Popover) */}
                      <td className="py-4 px-4 whitespace-nowrap relative group/notes">
                        {lead.notes && lead.notes.length > 0 ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 group-hover/notes:bg-rose-50 group-hover/notes:text-primary text-slate-700 transition-colors">
                              <FileText className="w-3.5 h-3.5 text-slate-400 group-hover/notes:text-primary" />
                              <span>{lead.notes.length} {lead.notes.length === 1 ? 'Note' : 'Notes'}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 truncate max-w-[180px] block">
                              {lead.notes[lead.notes.length - 1]?.content || '—'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No notes logged</span>
                        )}

                        {/* Popover on notes hover */}
                        {lead.notes && lead.notes.length > 0 && (
                          <div
                            className={`invisible opacity-0 group-hover/notes:visible group-hover/notes:opacity-100 transition-all duration-200 absolute right-0 ${popoverPosition} w-80 sm:w-88 bg-surface/98 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4 z-50 pointer-events-auto text-left whitespace-normal ${bridgePosition}`}
                          >
                            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                              <span className="text-xs font-bold text-slate-900">Recent Discussion Logs</span>
                              <span className="text-[10px] font-bold text-primary bg-rose-50 px-2 py-0.5 rounded-full">
                                {lead.notes.length} Total
                              </span>
                            </div>
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {lead.notes.slice().reverse().map((note, noteIdx) => (
                                <div key={noteIdx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                                  <p className="text-slate-800 font-medium leading-relaxed">{note.content}</p>
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40">
                                    <span className="font-semibold text-slate-600">{note.addedBy || 'Advisor'}</span>
                                    <span>{formatDate(note.addedAt)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 5. Assigned On */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                        <div className="font-medium text-slate-800">
                          {formatDate(lead.assignedAt || lead.createdAt).split(',')[0]}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {formatDate(lead.assignedAt || lead.createdAt).split(',')[1] || ''}
                        </div>
                      </td>

                      {/* 6. Action: View & Call */}
                      <td className="py-4 px-5 whitespace-nowrap text-right text-xs font-bold">
                        <Link
                          href={`/agent/my-leads/${lead._id}?page=${currentPage}&sortBy=${sortBy}&sortOrder=${sortOrder}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-primary text-btn-text transition-all shadow-2xs group/btn"
                        >
                          <span>Open Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Executive Pagination Toolbar */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600">
                Showing <strong className="text-slate-900">{leads.length}</strong> of{' '}
                <strong className="text-slate-900">{totalCount}</strong> assigned leads • Page{' '}
                <strong className="text-slate-900">{currentPage}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => updateURLParams({ page: Math.max(1, currentPage - 1).toString() }, true)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-surface border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Number Chips */}
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;

                  if (totalPages <= maxVisiblePages) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    let startPage = Math.max(2, currentPage - 1);
                    let endPage = Math.min(totalPages - 1, currentPage + 1);

                    if (currentPage <= 2) {
                      startPage = 2;
                      endPage = 4;
                    }
                    if (currentPage >= totalPages - 1) {
                      startPage = totalPages - 3;
                      endPage = totalPages - 1;
                    }

                    if (startPage > 2) pages.push('...');
                    for (let i = startPage; i <= endPage; i++) pages.push(i);
                    if (endPage < totalPages - 1) pages.push('...');
                    pages.push(totalPages);
                  }

                  return pages.map((page, idx) => {
                    if (page === '...') {
                      return (
                        <span key={`el-${idx}`} className="px-2 py-1 text-xs text-slate-400">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => updateURLParams({ page: page.toString() }, true)}
                        className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all ${
                          currentPage === page
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-surface text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}

                <button
                  onClick={() => updateURLParams({ page: Math.min(totalPages, currentPage + 1).toString() }, true)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-surface border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
