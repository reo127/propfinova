'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  User,
  CalendarCheck,
  Edit3,
  Layers,
  Sparkles,
  UserCheck,
  X,
  Check,
  FileText,
  AlertCircle
} from 'lucide-react';
import AssignmentHistory from '@/components/AssignmentHistory';
import LeadPropertyPanel from '@/app/components/LeadPropertyPanel';
import { getLocationDisplayName } from '@/utils/locations';
import { useCRMStore, useDashboardStore, useAgentStore } from '@/stores';

/** "2 days ago" — lets a caller judge staleness without parsing a date. */
function relativeTime(dateString) {
  if (!dateString) return '';
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

const stamp = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

/**
 * Merges notes, follow-ups and site visits into ONE list sorted newest-first.
 *
 * The previous version grouped by record type and labelled the result
 * "Chronological", which it was not — a note from today appeared below a
 * follow-up from last month. A caller reconstructing the story needs true
 * recency order.
 */
function buildTimeline(lead) {
  if (!lead) return [];
  const items = [];

  (lead.notes || []).forEach((note) =>
    items.push({
      kind: 'note',
      at: note.addedAt,
      title: 'Note logged',
      body: note.content,
      by: note.addedBy,
    })
  );

  (lead.followUpHistory || []).forEach((f) =>
    items.push({
      kind: 'followup',
      at: f.addedAt || f.scheduledDate,
      title: f.completed ? 'Follow-up completed' : 'Follow-up scheduled',
      body: f.notes,
      when: f.scheduledDate,
    })
  );

  (lead.visitHistory || []).forEach((v) =>
    items.push({
      kind: 'visit',
      at: v.addedAt || v.scheduledDate,
      title:
        v.type === 'completed'
          ? 'Site visit completed'
          : v.type === 'rescheduled'
          ? 'Site visit rescheduled'
          : v.type === 'cancelled'
          ? 'Site visit cancelled'
          : 'Site visit scheduled',
      body: v.rescheduleReason ? `Rescheduled: ${v.rescheduleReason}` : v.reason,
      when: v.scheduledDate,
    })
  );

  return items
    .filter((i) => i.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

/** One label/value row in the reference rail. */
function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0">
      <dt className="flex shrink-0 items-center gap-2 text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {label}
      </dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

const TIMELINE_STYLES = {
  note: { dot: 'bg-primary', chip: 'bg-primary/10 text-primary', label: 'Note' },
  followup: { dot: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700', label: 'Follow-up' },
  visit: { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700', label: 'Site visit' },
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();

  const fetchLeadsStore = useCRMStore((state) => state.fetchLeads);
  const fetchStatusOptionsStore = useAgentStore((state) => state.fetchStatusOptions);

  const [lead, setLead] = useState(null);
  const [allLeads, setAllLeads] = useState([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [urlParams, setUrlParams] = useState({});
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateSubstatus, setUpdateSubstatus] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [siteVisitDate, setSiteVisitDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [visitReason, setVisitReason] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [statusOptions, setStatusOptions] = useState({});
  const [availableSubstatuses, setAvailableSubstatuses] = useState([]);
  const [visitedLeads, setVisitedLeads] = useState(new Set());

  useEffect(() => {
    // Parse URL parameters from the current URL
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const parsedParams = {
        sortBy: searchParams.get('sortBy') || 'createdAt',
        sortOrder: searchParams.get('sortOrder') || 'desc',
        page: searchParams.get('page') || '1',
        search: searchParams.get('search') || '',
        status: searchParams.get('status') || '',
        dateFrom: searchParams.get('dateFrom') || '',
        dateTo: searchParams.get('dateTo') || ''
      };
      setUrlParams(parsedParams);

      // Load visited leads from session storage
      const savedVisited = sessionStorage.getItem('visitedLeads');
      if (savedVisited) {
        try {
          setVisitedLeads(new Set(JSON.parse(savedVisited)));
        } catch (e) {
          console.error('Error loading visited leads:', e);
        }
      }

      // Mark current lead as visited
      const currentLeadId = params.id;
      if (currentLeadId) {
        const newVisited = savedVisited ? new Set(JSON.parse(savedVisited)) : new Set();
        newVisited.add(currentLeadId);
        setVisitedLeads(newVisited);
        sessionStorage.setItem('visitedLeads', JSON.stringify([...newVisited]));
      }
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id && Object.keys(urlParams).length > 0) {
      fetchLeadDetails();
      fetchAllLeadsForNavigation();
    }
  }, [params.id, urlParams]);

  useEffect(() => {
    fetchStatusOptions();
  }, []);

  useEffect(() => {
    if (updateStatus && statusOptions[updateStatus]) {
      setAvailableSubstatuses(statusOptions[updateStatus] || []);
      // Clear substatus if it's not valid for the new status
      if (updateSubstatus && !statusOptions[updateStatus].includes(updateSubstatus)) {
        setUpdateSubstatus('');
      }
    } else {
      setAvailableSubstatuses([]);
      setUpdateSubstatus('');
    }
  }, [updateStatus, statusOptions]);

  const fetchLeadDetails = async () => {
    try {
      // Fetch the specific lead by ID
      const response = await fetch(`/api/leads/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setLead(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch lead details');
      }
    } catch (error) {
      console.error('Error fetching lead:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLeadsForNavigation = async () => {
    try {
      // Use the same sorting/filtering/pagination params from the leads list page
      const queryParams = new URLSearchParams({
        limit: '30', // Match the leads list page limit for consistency
        page: urlParams.page || '1', // Respect the current page
        sortBy: urlParams.sortBy || 'createdAt',
        sortOrder: urlParams.sortOrder || 'desc',
        ...(urlParams.search && { search: urlParams.search }),
        ...(urlParams.status && { status: urlParams.status }),
        ...(urlParams.dateFrom && { dateFrom: urlParams.dateFrom }),
        ...(urlParams.dateTo && { dateTo: urlParams.dateTo })
      });

      const res = await fetchLeadsStore(queryParams.toString());

      if (res.success) {
        setAllLeads(res.data || []);
        setTotalLeadsCount(res.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching leads for navigation:', error);
      // Non-critical error, don't block the page
    }
  };

  const fetchStatusOptions = async () => {
    try {
      const map = await fetchStatusOptionsStore();
      if (map) {
        setStatusOptions(map);
      }
    } catch (error) {
      console.error('Error fetching status options:', error);
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();

    if (!updateStatus && !updateNote.trim()) {
      setUpdateError('Please provide either a status update or a note');
      return;
    }

    setIsUpdating(true);
    setUpdateError('');

    try {
      let action;
      if (updateStatus && updateNote.trim()) {
        if (updateSubstatus) {
          action = 'updateStatusSubstatusAndNote';
        } else {
          action = 'updateStatusAndNote';
        }
      } else if (updateStatus) {
        if (updateSubstatus) {
          action = 'updateStatusAndSubstatus';
        } else {
          action = 'updateStatus';
        }
      } else {
        action = 'addNote';
      }

      const requestBody = {
        leadId: lead._id,
        action,
        status: updateStatus || undefined,
        substatus: updateSubstatus || undefined,
        note: updateNote.trim() || undefined,
        siteVisitDate: (updateStatus === 'site_visit_scheduled' && siteVisitDate) ? siteVisitDate : undefined,
        followUpDate: (updateStatus === 'follow_up_scheduled' && followUpDate) ? followUpDate : undefined,
        visitReason: ((updateStatus === 'site_visit_scheduled' || updateStatus === 'visit_rescheduled') && visitReason) ? visitReason : undefined,
        rescheduleReason: (updateStatus === 'visit_rescheduled' && rescheduleReason) ? rescheduleReason : undefined
      };

      const response = await fetch('/api/leads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update lead');
      }

      // Update the local lead state
      setLead(data.data);

      // Update the lead in allLeads array too
      setAllLeads(prevLeads =>
        prevLeads.map(l => l._id === lead._id ? data.data : l)
      );

      // Sync across Zustand stores
      useCRMStore.getState().updateLeadInCache(lead._id, data.data);
      useDashboardStore.getState().invalidateDashboard();
      useAgentStore.getState().updateLeadInCache(lead._id, data.data);
      useAgentStore.getState().invalidateDashboard();

      // Reset form and close modal
      setUpdateStatus('');
      setUpdateSubstatus('');
      setUpdateNote('');
      setSiteVisitDate('');
      setShowUpdateModal(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'not_connected': 'bg-yellow-100 text-yellow-800',
      'interested': 'bg-green-100 text-green-800',
      'site_visit_scheduled': 'bg-purple-100 text-purple-800',
      'follow_up_scheduled': 'bg-cyan-100 text-cyan-800',
      'visit_rescheduled': 'bg-orange-100 text-orange-800',
      'site_visit_done': 'bg-emerald-100 text-emerald-800',
      'not_interested': 'bg-red-100 text-red-800',
      'call_disconnected': 'bg-orange-100 text-orange-800',
      'location_mismatch': 'bg-purple-100 text-purple-800',
      'budget_mismatch': 'bg-pink-100 text-pink-800',
      'possession_mismatch': 'bg-primary-light text-primary-darker',
      'do_not_disturb': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatusText = (status) => {
    const statusDisplayNames = {
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
    return statusDisplayNames[status] || 'New';
  };

  const formatSubstatusText = (substatus) => {
    if (!substatus) return null;

    const substatusDisplayNames = {
      // Not Connected
      'ringing': 'Ringing',
      'switched_off': 'Switched Off',
      'call_busy': 'Call Busy',
      'call_disconnected': 'Call Disconnected',
      'invalid_number': 'Invalid Number',

      // Interested
      'site_visit_scheduled_with_date': 'Site Visit Scheduled (With Date)',
      'site_visit_scheduled_no_date': 'Site Visit Scheduled (No Date)',
      'follow_up': 'Follow Up',

      // Not Interested
      'not_actively_searching': 'Not Actively Searching',
      'require_more_than_6_months': 'Require More Than 6 Months',
      'not_the_right_party': 'Not The Right Party',

      // Call Disconnected
      'hang_up_while_talking': 'Hang Up While Talking',
      'call_drop': 'Call Drop',

      // Location Mismatch
      'looking_for_other_location': 'Looking For Other Location',
      'looking_for_other_city': 'Looking For Other City',

      // Budget Mismatch
      'budget_is_low': 'Budget Is Low',
      'budget_is_high': 'Budget Is High',

      // Possession Mismatch
      'looking_for_ready_to_move': 'Looking For Ready To Move',
      'looking_for_under_construction': 'Looking For Under Construction',

      // Do Not Disturb
      'already_in_touch_with_builder': 'Already In Touch With Builder',
      'deal_closed': 'Deal Closed',
      'plan_drop': 'Plan Drop',
      'plan_postponed': 'Plan Postponed',
      'already_purchased': 'Already Purchased',
      'dnc': 'DNC',

      // Site Visit Done
      'interested_in_revisit': 'Interested In Re-visit',
      'plan_cancelled': 'Plan Cancelled'
    };

    return substatusDisplayNames[substatus] || substatus;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-primary mb-2">Error Loading Lead</h2>
            <p className="text-primary/80">{error || 'Lead not found'}</p>
            <div className="mt-4 space-x-4">
              <button 
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              {error && (
                <button 
                  onClick={fetchLeadDetails}
                  className="px-4 py-2 bg-primary text-btn-text rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getCurrentLeadIndex = () => {
    return allLeads.findIndex(l => l._id === params.id);
  };

  const getCurrentLeadActualPosition = () => {
    const currentPage = parseInt(urlParams.page || '1');
    const indexInCurrentPage = getCurrentLeadIndex();
    if (indexInCurrentPage === -1) return 0;
    return ((currentPage - 1) * 30) + indexInCurrentPage + 1;
  };

  const navigateToLead = (leadId) => {
    // Preserve URL params when navigating to next/previous lead
    const queryParams = new URLSearchParams({
      sortBy: urlParams.sortBy || 'createdAt',
      sortOrder: urlParams.sortOrder || 'desc',
      page: urlParams.page || '1',
      ...(urlParams.search && { search: urlParams.search }),
      ...(urlParams.status && { status: urlParams.status }),
      ...(urlParams.dateFrom && { dateFrom: urlParams.dateFrom }),
      ...(urlParams.dateTo && { dateTo: urlParams.dateTo })
    });
    router.push(`/admin/crm/leads/${leadId}?${queryParams.toString()}`);
  };

  const getNextLead = () => {
    const currentIndex = getCurrentLeadIndex();
    if (currentIndex < allLeads.length - 1) {
      return allLeads[currentIndex + 1];
    }
    return null;
  };

  const getPreviousLead = () => {
    const currentIndex = getCurrentLeadIndex();
    if (currentIndex > 0) {
      return allLeads[currentIndex - 1];
    }
    return null;
  };

  const timeline = buildTimeline(lead);
  const openUpdateModal = () => {
    setUpdateStatus('');
    setUpdateSubstatus('');
    setUpdateNote('');
    setSiteVisitDate('');
    setUpdateError('');
    setShowUpdateModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Leads Navigation Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-88 max-w-[85vw] bg-surface shadow-2xl border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="bg-secondary text-white p-5 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-btn-text shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Active Page Queue</h3>
                  <p className="text-[11px] text-slate-400">
                    {allLeads.length} leads loaded • {totalLeadsCount} total
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Leads List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-100">
            {allLeads.map((leadItem) => {
              const isActive = leadItem._id === params.id;
              const isVisited = visitedLeads.has(leadItem._id);
              return (
                <div
                  key={leadItem._id}
                  onClick={() => {
                    navigateToLead(leadItem._id);
                    setSidebarOpen(false);
                  }}
                  className={`pt-2 first:pt-0 p-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-rose-50/70 border border-primary/30 text-slate-900 shadow-2xs'
                      : isVisited
                      ? 'bg-slate-50/60 hover:bg-slate-100/80 border border-transparent text-slate-700'
                      : 'hover:bg-slate-50 border border-transparent text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${
                      isActive ? 'bg-primary text-btn-text' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {leadItem.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className={`text-xs font-bold truncate ${
                          isActive ? 'text-primary' : 'text-slate-900'
                        }`}>
                          {leadItem.name}
                        </div>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{getLocationDisplayName(leadItem.interestedLocation)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{leadItem.phone}</span>
                        <span>{formatDate(leadItem.createdAt).split(',')[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Lead {getCurrentLeadActualPosition()} of {totalLeadsCount}</span>
              <div className="flex space-x-1.5">
                <button
                  onClick={() => {
                    const prev = getPreviousLead();
                    if (prev) {
                      navigateToLead(prev._id);
                      setSidebarOpen(false);
                    }
                  }}
                  disabled={!getPreviousLead()}
                  className="p-1.5 rounded-lg bg-surface border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const next = getNextLead();
                    if (next) {
                      navigateToLead(next._id);
                      setSidebarOpen(false);
                    }
                  }}
                  disabled={!getNextLead()}
                  className="p-1.5 rounded-lg bg-surface border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sticky Header */}
      <div className="bg-surface/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 md:top-16 z-30 shadow-2xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
              {/* Back to CRM */}
              <Link
                href={`/admin/crm/leads?${new URLSearchParams({
                  sortBy: urlParams.sortBy || 'createdAt',
                  sortOrder: urlParams.sortOrder || 'desc',
                  page: urlParams.page || '1',
                  ...(urlParams.search && { search: urlParams.search }),
                  ...(urlParams.status && urlParams.status !== 'all' && { status: urlParams.status }),
                  ...(urlParams.dateFrom && { dateFrom: urlParams.dateFrom }),
                  ...(urlParams.dateTo && { dateTo: urlParams.dateTo })
                }).toString()}`}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center flex-shrink-0"
                title="Back to Leads CRM"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              {/* Leads Navigation Drawer Toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors flex items-center gap-1.5 text-xs font-bold flex-shrink-0"
                title="Browse All Page Leads"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Lead Queue</span>
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                    {lead.name}
                  </h1>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    #{lead._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${getStatusColor(lead.status || 'new')}`}>
                    {formatStatusText(lead.status || 'new')}
                  </span>
                  <span className="text-xs font-mono font-semibold tabular-nums text-slate-600">
                    {lead.phone}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
            {/* Quick Next/Prev Navigation */}
              {allLeads.length > 0 ? (
                <>
                  <button
                    onClick={() => {
                      const prev = getPreviousLead();
                      if (prev) navigateToLead(prev._id);
                    }}
                    disabled={!getPreviousLead()}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-surface border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
                    title={getPreviousLead() ? `Previous: ${getPreviousLead().name}` : 'No previous lead'}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <button
                    onClick={() => {
                      const next = getNextLead();
                      if (next) navigateToLead(next._id);
                    }}
                    disabled={!getNextLead()}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-btn-text bg-primary hover:bg-primary-dark rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-primary/20"
                    title={getNextLead() ? `Next: ${getNextLead().name}` : 'No more leads'}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* Lead Position Indicator */}
                  <div className="ml-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold tabular-nums border border-slate-200">
                    {getCurrentLeadActualPosition()} / {totalLeadsCount}
                  </div>
                </>
              ) : (
                <div className="px-3 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-medium">
                  Loading queue...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        {/* Two columns on desktop: the work surface on the left, reference
            material in a sticky rail on the right. The old layout stacked
            everything into one 768px column, so a caller had to scroll past
            the whole profile to reach inventory or history. */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_370px]">

          {/* ================= WORK SURFACE ================= */}
          <div className="min-w-0 space-y-6">

            {/* Commitments surface above everything — these are the things a
                caller must not miss, and they used to be buried in the
                timeline. */}
            {(lead.followUpDate || lead.siteVisitDate) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {lead.followUpDate && (
                  <div className="flex items-start gap-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">Next follow-up</p>
                      <p className="mt-0.5 text-sm font-bold text-cyan-900">{stamp(lead.followUpDate)}</p>
                      <p className="text-[11px] text-cyan-700">{relativeTime(lead.followUpDate)}</p>
                    </div>
                  </div>
                )}
                {lead.siteVisitDate && (
                  <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4">
                    <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">Site visit</p>
                      <p className="mt-0.5 text-sm font-bold text-violet-900">{stamp(lead.siteVisitDate)}</p>
                      <p className="text-[11px] text-violet-700">{relativeTime(lead.siteVisitDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* On-call inventory: nearby areas + free-form search */}
            <LeadPropertyPanel lead={lead} onLeadUpdated={setLead} />

            {/* Activity — one true chronological stream, no inner scrollbar */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-surface shadow-xs">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Activity</h3>
                  <p className="text-xs text-slate-500">
                    {timeline.length} {timeline.length === 1 ? 'entry' : 'entries'} · newest first
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openUpdateModal}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-primary hover:text-primary cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Add note
                </button>
              </div>

              <div className="px-5 py-5 sm:px-6">
                {timeline.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
                    <FileText className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No activity logged yet</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Log a call note or schedule a follow-up to start the history.
                    </p>
                  </div>
                ) : (
                  <ol className="relative space-y-5 border-l border-slate-200 pl-6">
                    {timeline.map((item, index) => {
                      const style = TIMELINE_STYLES[item.kind] || TIMELINE_STYLES.note;
                      return (
                        <li key={`${item.kind}-${index}`} className="relative">
                          <span
                            className={`absolute -left-[1.655rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${style.dot}`}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.chip}`}>
                              {style.label}
                            </span>
                            <span className="text-sm font-bold text-slate-900">{item.title}</span>
                            <span className="text-[11px] text-slate-400">{relativeTime(item.at)}</span>
                          </div>

                          {item.when && (
                            <p className="mt-1 text-xs font-semibold text-slate-600">For {stamp(item.when)}</p>
                          )}
                          {item.body && (
                            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                              {item.body}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] text-slate-400">
                            {formatDate(item.at)}
                            {item.by ? ` · ${item.by}` : ''}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </section>
          </div>

          {/* ================= REFERENCE RAIL ================= */}
          <aside className="space-y-4 xl:sticky xl:top-32">

            {/* Stage + the single primary action (previously duplicated as a
                pencil icon and a full-width button doing the same thing) */}
            <section className="rounded-3xl border border-slate-200/80 bg-surface p-5 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current stage</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${getStatusColor(lead.status || 'new')}`}>
                  {formatStatusText(lead.status || 'new')}
                </span>
                {lead.substatus && (
                  <span className="text-xs font-semibold text-slate-600">{formatSubstatusText(lead.substatus)}</span>
                )}
              </div>

              <button
                type="button"
                onClick={openUpdateModal}
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-btn-text shadow-md shadow-primary/25 transition-colors hover:bg-primary-dark"
              >
                <Edit3 className="h-4 w-4" />
                Update status &amp; add note
              </button>

              <div className="mt-4 border-t border-slate-100 pt-3">
                {lead.assignedTo ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <UserCheck className="h-3.5 w-3.5" />
                    Assigned to {lead.assignedTo.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Unassigned
                  </span>
                )}
              </div>
            </section>

            {/* Contact + context. Phone is shown as selectable text — agents
                dial from their own phone/softphone, not from the CRM. */}
            <section className="rounded-3xl border border-slate-200/80 bg-surface p-5 shadow-xs">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                  <span className="text-sm font-black tracking-tight text-primary">
                    {lead.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{lead.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    #{lead._id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>

              <dl className="space-y-0.5 text-xs">
                <DetailRow icon={Phone} label="Phone">
                  <span className="select-all font-mono font-bold tabular-nums text-slate-900">
                    {lead.phone}
                  </span>
                </DetailRow>

                {lead.email && (
                  <DetailRow icon={Mail} label="Email">
                    <a href={`mailto:${lead.email}`} className="block max-w-[190px] truncate font-semibold text-slate-800 hover:text-primary">
                      {lead.email}
                    </a>
                  </DetailRow>
                )}

                <DetailRow icon={MapPin} label="Looking in">
                  <span className="font-bold text-slate-900">{getLocationDisplayName(lead.interestedLocation)}</span>
                </DetailRow>

                <DetailRow icon={Calendar} label="Enquired">
                  <span className="font-medium tabular-nums text-slate-700">
                    {formatDate(lead.createdAt).split(',')[0]}
                    <span className="ml-1.5 text-slate-400">({relativeTime(lead.createdAt)})</span>
                  </span>
                </DetailRow>

                <DetailRow icon={Sparkles} label="Source">
                  <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    {lead.source || 'Website'}
                  </span>
                </DetailRow>
              </dl>
            </section>

            {/* Assignment History */}
            {lead.assignmentHistory && lead.assignmentHistory.length > 0 && (
              <section className="rounded-3xl border border-slate-200/80 bg-surface p-5 shadow-xs">
                <AssignmentHistory history={lead.assignmentHistory} />
              </section>
            )}

            {/* Queue shortcut. Prev/next already live in the sticky header, so
                this is just the full-queue entry point. */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-900 px-3.5 py-3 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-slate-800"
            >
              <Layers className="h-4 w-4 text-slate-400 transition-colors group-hover:text-white" />
              Browse lead queue ({allLeads.length})
            </button>
          </aside>
        </div>
      </div>

      {/* Update Status & Add Note Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="relative bg-surface rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-secondary text-white p-5 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-btn-text shadow-xs">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight">Update Lead Pipeline</h2>
                    <p className="text-xs text-slate-400">
                      Modifying dossier for <span className="text-slate-200 font-semibold">{lead.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUpdateModal(false);
                    setUpdateError('');
                    setUpdateStatus('');
                    setUpdateNote('');
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {updateError && (
              <div className="mx-6 mt-4 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateLead} className="p-6 space-y-4 text-slate-900">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pipeline Stage / Status
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-medium text-slate-900 shadow-2xs"
                >
                  <option value="">-- Select Status --</option>
                  {Object.keys(statusOptions).map((status) => (
                    <option key={status} value={status}>
                      {formatStatusText(status)}
                    </option>
                  ))}
                </select>
                {updateStatus && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(updateStatus)}`}>
                      {formatStatusText(updateStatus)}
                    </span>
                  </div>
                )}
              </div>

              {/* Substatus Field */}
              {updateStatus && availableSubstatuses.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Substatus <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <select
                    value={updateSubstatus}
                    onChange={(e) => setUpdateSubstatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-medium text-slate-900 shadow-2xs"
                  >
                    <option value="">-- Select Substatus --</option>
                    {availableSubstatuses.map((substatus) => (
                      <option key={substatus} value={substatus}>
                        {formatSubstatusText(substatus)}
                      </option>
                    ))}
                  </select>
                  {updateSubstatus && (
                    <div className="mt-2">
                      <span className="text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md font-medium">
                        {formatSubstatusText(updateSubstatus)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Site Visit Scheduled Fields */}
              {updateStatus === 'site_visit_scheduled' && (
                <div className="space-y-3 p-3.5 bg-violet-50/60 rounded-xl border border-violet-100">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-violet-900 mb-1">
                      Site Visit Date & Time <span className="text-primary">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={siteVisitDate}
                      onChange={(e) => setSiteVisitDate(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-400 text-xs font-medium text-slate-900 shadow-2xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-violet-900 mb-1">
                      Visit Reason / Tour Agenda <span className="text-primary">*</span>
                    </label>
                    <textarea
                      value={visitReason}
                      onChange={(e) => setVisitReason(e.target.value)}
                      rows="2"
                      placeholder="e.g., Client requested inspection of 3BHK corner unit, amenities..."
                      className="w-full p-2.5 bg-surface border border-violet-200 rounded-xl focus:ring-2 focus:ring-violet-400 text-xs font-medium text-slate-900 shadow-2xs"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Follow-up Scheduled Fields */}
              {updateStatus === 'follow_up_scheduled' && (
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 mb-1">
                    Follow-up Date & Time <span className="text-primary">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-400 text-xs font-medium text-slate-900 shadow-2xs"
                    required
                  />
                  <p className="text-[11px] text-amber-700 mt-1.5 font-medium">
                    Add conversation objectives in the notes box below
                  </p>
                </div>
              )}

              {/* Visit Rescheduled Fields */}
              {updateStatus === 'visit_rescheduled' && (
                <div className="space-y-3 p-3.5 bg-rose-50/60 rounded-xl border border-rose-100">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-rose-900 mb-1">
                      New Visit Date & Time <span className="text-primary">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={siteVisitDate}
                      onChange={(e) => setSiteVisitDate(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-rose-200 rounded-xl focus:ring-2 focus:ring-primary/20 text-xs font-medium text-slate-900 shadow-2xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-rose-900 mb-1">
                      Reschedule Rationale <span className="text-primary">*</span>
                    </label>
                    <textarea
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      rows="2"
                      placeholder="e.g., Client requested weekend slot due to travel..."
                      className="w-full p-2.5 bg-surface border border-rose-200 rounded-xl focus:ring-2 focus:ring-primary/20 text-xs font-medium text-slate-900 shadow-2xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={visitReason}
                      onChange={(e) => setVisitReason(e.target.value)}
                      rows="2"
                      placeholder="Any logistical or property details for the updated schedule..."
                      className="w-full p-2.5 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 text-xs font-medium text-slate-900 shadow-2xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Append CRM Log Note
                </label>
                <textarea
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  rows="3"
                  placeholder="Record summary of call, client preference shifts, next touchpoints..."
                  className="w-full p-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-medium text-slate-900 shadow-2xs resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateModal(false);
                    setUpdateError('');
                    setUpdateStatus('');
                    setUpdateSubstatus('');
                    setUpdateNote('');
                    setSiteVisitDate('');
                    setFollowUpDate('');
                    setVisitReason('');
                    setRescheduleReason('');
                    setFollowUpNotes('');
                  }}
                  disabled={isUpdating}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || (!updateStatus && !updateNote.trim()) ||
                    (updateStatus === 'site_visit_scheduled' && (!siteVisitDate || !visitReason)) ||
                    (updateStatus === 'follow_up_scheduled' && !followUpDate) ||
                    (updateStatus === 'visit_rescheduled' && (!siteVisitDate || !rescheduleReason))}
                  className="px-5 py-2.5 text-xs font-bold text-btn-text bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating Dossier...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Commit Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}