'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  Calendar,
  CalendarCheck,
  MapPin,
  Clock,
  ArrowUpDown,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  FileText,
  Trash2,
  Edit3,
  Layers,
  FileSpreadsheet,
  FileDown,
  UserCheck,
  RotateCcw,
  Check,
  Eye
} from 'lucide-react';
import { getLocationDisplayName } from '@/utils/locations';
import BulkLeadUpload from '@/components/BulkLeadUpload';
import EditLeadModal from '@/components/EditLeadModal';
import BulkAssignModal from '@/components/BulkAssignModal';
import { useCRMStore, useDashboardStore } from '@/stores';

export default function CRMLeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Zustand CRM store for cached leads queries, persistent pipeline telemetry & agents list
  const agents = useCRMStore((state) => state.agents);
  const fetchAgents = useCRMStore((state) => state.fetchAgents);
  const pipelineStats = useCRMStore((state) => state.pipelineStats);
  const statsLoaded = useCRMStore((state) => state.statsLoaded);
  const fetchLeads = useCRMStore((state) => state.fetchLeads);
  const invalidateLeadsCache = useCRMStore((state) => state.invalidateLeadsCache);
  const updateLeadInCache = useCRMStore((state) => state.updateLeadInCache);
  const deleteLeadFromCache = useCRMStore((state) => state.deleteLeadFromCache);
  const leads = useCRMStore((state) => state.leads);
  const totalCount = useCRMStore((state) => state.totalCount);
  const totalPages = useCRMStore((state) => state.totalPages);
  const loading = useCRMStore((state) => state.loading);
  const error = useCRMStore((state) => state.error);

  const [searchInput, setSearchInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingLead, setAddingLead] = useState(false);
  const [addError, setAddError] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [visitedLeads, setVisitedLeads] = useState(new Set());
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    interestedLocation: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  // UI menu states for grouped actions
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [activeNotesPopover, setActiveNotesPopover] = useState(null);

  const exportMenuRef = useRef(null);
  const toolsMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target)) {
        setShowToolsMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Read all filter values from URL (source of truth)
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const statusFilter = searchParams.get('status') || 'all';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const assignmentFilter = searchParams.get('assignment') || 'all';
  const agentFilter = searchParams.get('agent') || 'all';

  // Helper function to update URL params
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
      assignment: assignmentFilter,
      agent: agentFilter,
    };

    const merged = { ...current, ...updates };

    if (merged.page && merged.page !== '1') params.set('page', merged.page);
    if (merged.sortBy && merged.sortBy !== 'createdAt') params.set('sortBy', merged.sortBy);
    if (merged.sortOrder && merged.sortOrder !== 'desc') params.set('sortOrder', merged.sortOrder);
    if (merged.search) params.set('search', merged.search);
    if (merged.status && merged.status !== 'all') params.set('status', merged.status);
    if (merged.dateFrom) params.set('dateFrom', merged.dateFrom);
    if (merged.dateTo) params.set('dateTo', merged.dateTo);
    if (merged.assignment && merged.assignment !== 'all') params.set('assignment', merged.assignment);
    if (merged.agent && merged.agent !== 'all') params.set('agent', merged.agent);

    if (addToHistory) {
      router.push(`/admin/crm/leads?${params.toString()}`, { scroll: false });
    } else {
      router.replace(`/admin/crm/leads?${params.toString()}`, { scroll: false });
    }
  };

  // Check admin status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setIsAdmin(user.role === 'admin');
      } catch (e) {
        console.error('Error checking admin status:', e);
        setIsAdmin(false);
      }
    }
  }, []);

  // Fetch agents list via Zustand store (cached across session)
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Sync search input
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  // Load visited leads from session storage
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

  // Search handler
  const handleSearch = () => {
    updateURLParams({ search: searchInput.trim(), page: '1' });
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Fetch leads on filter/query changes with Zustand query-level caching
  useEffect(() => {
    const fetchLeadsData = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '30',
          sortBy,
          sortOrder,
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(dateFrom && { dateFrom }),
          ...(dateTo && { dateTo }),
          ...(assignmentFilter !== 'all' && { assignmentStatus: assignmentFilter }),
          ...(agentFilter !== 'all' && { assignedTo: agentFilter })
        });

        const res = await fetchLeads(params.toString());

        if (res.success) {
          if (res.pipelineStats) {
            useDashboardStore.getState().syncPipelineStats(res.pipelineStats);
          }
          if (res.totalPages > 0 && currentPage > res.totalPages) {
            updateURLParams({ page: res.totalPages.toString() }, false);
          }
        }
      } catch (err) {
        console.error('Error in fetchLeadsData:', err);
      }
    };

    fetchLeadsData();
  }, [currentPage, searchTerm, sortBy, sortOrder, statusFilter, dateFrom, dateTo, assignmentFilter, agentFilter, fetchLeads]);

  const handleAddLead = async (e) => {
    e.preventDefault();
    setAddingLead(true);
    setAddError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add lead');
      }

      invalidateLeadsCache();
      useDashboardStore.getState().invalidateDashboard();
      updateURLParams({ page: '1' });

      setNewLead({
        name: '',
        phone: '',
        email: '',
        interestedLocation: ''
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding lead:', error);
      setAddError(error.message);
    } finally {
      setAddingLead(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setNewLead(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setNewLead(prev => ({ ...prev, [name]: value }));
    }
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

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getStatusBadgeConfig = (status) => {
    const config = {
      new: { label: 'New Lead', bg: 'bg-sky-50 text-sky-700 border-sky-200/80', dot: 'bg-sky-500' },
      not_connected: { label: 'Not Connected', bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
      interested: { label: 'Interested', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
      follow_up: { label: 'Follow Up', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200/80', dot: 'bg-cyan-500' },
      follow_up_scheduled: { label: 'Follow-up Scheduled', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200/80', dot: 'bg-cyan-500' },
      site_visit_scheduled: { label: 'Site Visit Scheduled', bg: 'bg-violet-50 text-violet-700 border-violet-200/80', dot: 'bg-violet-500' },
      visit_rescheduled: { label: 'Visit Rescheduled', bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500' },
      site_visit_done: { label: 'Site Visit Done', bg: 'bg-teal-50 text-teal-700 border-teal-200/80', dot: 'bg-teal-500' },
      not_interested: { label: 'Not Interested', bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-400' },
      call_disconnected: { label: 'Call Disconnected', bg: 'bg-orange-50 text-orange-700 border-orange-200/80', dot: 'bg-orange-400' },
      location_mismatch: { label: 'Location Mismatch', bg: 'bg-purple-50 text-purple-700 border-purple-200/80', dot: 'bg-purple-400' },
      budget_mismatch: { label: 'Budget Mismatch', bg: 'bg-pink-50 text-pink-700 border-pink-200/80', dot: 'bg-pink-400' },
      possession_mismatch: { label: 'Possession Mismatch', bg: 'bg-primary-soft text-primary-dark border-primary-light/80', dot: 'bg-primary-light' },
      do_not_disturb: { label: 'Do Not Disturb', bg: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
    };
    return config[status] || { label: status?.replace(/_/g, ' ') || 'New', bg: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400' };
  };

  const formatSubstatusText = (substatus) => {
    if (!substatus) return null;
    const substatusDisplayNames = {
      ringing: 'Ringing',
      switched_off: 'Switched Off',
      call_busy: 'Call Busy',
      call_disconnected: 'Call Disconnected',
      invalid_number: 'Invalid Number',
      site_visit_scheduled_with_date: 'Visit with Date',
      site_visit_scheduled_no_date: 'Visit (No Date)',
      follow_up: 'Follow Up',
      not_actively_searching: 'Not Active',
      require_more_than_6_months: '> 6 Months',
      not_the_right_party: 'Wrong Party',
      hang_up_while_talking: 'Hang Up',
      call_drop: 'Call Drop',
      looking_for_other_location: 'Other Location',
      looking_for_other_city: 'Other City',
      budget_is_low: 'Budget Low',
      budget_is_high: 'Budget High',
      looking_for_ready_to_move: 'Ready To Move',
      looking_for_under_construction: 'Under Construction',
      already_in_touch_with_builder: 'Direct with Builder',
      deal_closed: 'Deal Closed',
      plan_drop: 'Plan Drop',
      plan_postponed: 'Plan Postponed',
      already_purchased: 'Already Purchased',
      dnc: 'DNC',
      interested_in_revisit: 'Re-visit',
      plan_cancelled: 'Cancelled'
    };
    return substatusDisplayNames[substatus] || substatus.replace(/_/g, ' ');
  };

  const handleBulkUploadComplete = (results) => {
    if (results.createdCount > 0) {
      invalidateLeadsCache();
      useDashboardStore.getState().invalidateDashboard();
      updateURLParams({ page: '1' });
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/leads/template');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lead_upload_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to download template');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      const csvContent = 'name,phonenumber,location,email\nJohn Doe,9876543210,Koramangala,john@example.com\nJane Smith,9876543211,BTM Layout,jane@example.com';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lead_upload_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams({
        format: 'csv',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/leads/export?${params}`);
      if (!response.ok) throw new Error('Failed to download CSV');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams({
        format: 'excel',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/leads/export?${params}`);
      if (!response.ok) throw new Error('Failed to download Excel');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleEditClick = (e, lead) => {
    e.stopPropagation();
    setEditingLead(lead);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (e, leadId) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this lead?')) return;

    try {
      const response = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete lead');
      deleteLeadFromCache(leadId);
      useDashboardStore.getState().invalidateDashboard();
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead. Please try again.');
    }
  };

  const handleUpdateLead = (updatedLead) => {
    updateLeadInCache(updatedLead._id, updatedLead);
    useDashboardStore.getState().invalidateDashboard();
  };

  const handleBulkAssignComplete = () => {
    invalidateLeadsCache();
    useDashboardStore.getState().invalidateDashboard();
    updateURLParams({ page: '1' });
  };

  const onRowNavigate = (leadId) => {
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
      ...(dateTo && { dateTo }),
      ...(assignmentFilter !== 'all' && { assignment: assignmentFilter }),
      ...(agentFilter !== 'all' && { agent: agentFilter })
    });
    router.push(`/admin/crm/leads/${leadId}?${params.toString()}`);
  };

  // Active filter states for KPI pipeline strip
  const isAllActive = statusFilter === 'all' && assignmentFilter === 'all';
  const isInterestedActive = statusFilter === 'interested';
  const isSiteVisitsActive = statusFilter === 'site_visit_scheduled' || statusFilter === 'visit_rescheduled';
  const isFollowUpActive = statusFilter === 'follow_up_scheduled' || statusFilter === 'follow_up';
  const isUnassignedActive = assignmentFilter === 'unassigned';

  const handleCardClick = (cardType) => {
    switch (cardType) {
      case 'all':
        updateURLParams({ status: 'all', assignment: 'all', page: '1' });
        break;
      case 'interested':
        if (isInterestedActive) {
          updateURLParams({ status: 'all', page: '1' });
        } else {
          updateURLParams({ status: 'interested', assignment: 'all', page: '1' });
        }
        break;
      case 'site_visits':
        if (isSiteVisitsActive) {
          updateURLParams({ status: 'all', page: '1' });
        } else {
          updateURLParams({ status: 'site_visit_scheduled', assignment: 'all', page: '1' });
        }
        break;
      case 'follow_ups':
        if (isFollowUpActive) {
          updateURLParams({ status: 'all', page: '1' });
        } else {
          updateURLParams({ status: 'follow_up_scheduled', assignment: 'all', page: '1' });
        }
        break;
      case 'unassigned':
        if (isUnassignedActive) {
          updateURLParams({ assignment: 'all', page: '1' });
        } else {
          updateURLParams({ assignment: 'unassigned', status: 'all', page: '1' });
        }
        break;
      default:
        break;
    }
  };

  // Has any active filters?
  const hasActiveFilters =
    statusFilter !== 'all' ||
    assignmentFilter !== 'all' ||
    agentFilter !== 'all' ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(searchTerm);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Executive Command Header */}
      <div className="bg-surface border-b border-slate-200/80 sticky top-0 md:top-16 z-20 shadow-xs backdrop-blur-md bg-surface/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            {/* Title & Stats Pill */}
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-darker flex items-center justify-center text-btn-text shadow-md shadow-primary/20 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
                      Sales CRM &amp; Lead Intelligence
                    </h1>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 tabular-nums shrink-0">
                      {hasActiveFilters
                        ? `${totalCount.toLocaleString()} Matching Leads`
                        : `${(pipelineStats.total || totalCount).toLocaleString()} Leads`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    Prospect pipeline, advisor dispatch, and conversion timeline
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar (Clean, Unified & Non-Breaking) */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
              {/* Primary Action: Add Lead */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary hover:to-primary-darker text-btn-text text-xs font-bold shadow-sm shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Lead</span>
              </button>

              {/* Direct Action: Bulk Upload Leads */}
              <button
                type="button"
                onClick={() => setShowBulkUpload(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-surface hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-primary hover:border-primary/40 transition-all shadow-2xs cursor-pointer shrink-0"
                title="Import Leads from CSV"
              >
                <Upload className="w-4 h-4 text-primary" />
                <span>Bulk Upload</span>
              </button>

              {/* Direct Action: Bulk Assign Leads */}
              <button
                type="button"
                onClick={() => setShowBulkAssign(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-surface hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:text-primary hover:border-primary-light transition-all shadow-2xs cursor-pointer shrink-0"
                title="Dispatch Unassigned Leads to Advisors"
              >
                <UserCheck className="w-4 h-4 text-primary" />
                <span>Bulk Assign</span>
              </button>

              {/* Grouped: Export Data */}
              <div className="relative shrink-0" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(!showExportMenu);
                    setShowToolsMenu(false);
                  }}
                  disabled={downloading || totalCount === 0}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-surface hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>{downloading ? 'Exporting...' : 'Export'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${showExportMenu ? 'rotate-180 text-slate-600' : ''}`} />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-surface border border-slate-200/90 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Export as CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadExcel();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                      <span>Export as Excel</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Grouped: Data Hygiene & Tools */}
              <div className="relative shrink-0" ref={toolsMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowToolsMenu(!showToolsMenu);
                    setShowExportMenu(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-surface hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                  title="Database Integrity Tools & Templates"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tools</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${showToolsMenu ? 'rotate-180 text-slate-600' : ''}`} />
                </button>

                {showToolsMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface border border-slate-200/90 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        downloadTemplate();
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 text-blue-500" />
                      <span>Download Sample CSV</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <Link
                      href="/admin/duplicate-checker"
                      onClick={() => setShowToolsMenu(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-rose-600 flex items-center gap-2.5 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-rose-500" />
                      <span>Duplicate Checker</span>
                    </Link>
                    <Link
                      href="/admin/cleanup-agent-leads"
                      onClick={() => setShowToolsMenu(false)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-2.5 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-500" />
                      <span>Cleanup &amp; Reassign</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Interactive KPI Pipeline Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Total Leads */}
          <button
            onClick={() => handleCardClick('all')}
            title={isAllActive ? 'Showing complete pipeline' : 'Click to show all prospects'}
            className={`relative text-left p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
              isAllActive
                ? 'bg-surface border-primary shadow-md ring-2 ring-primary/25'
                : 'bg-surface/80 hover:bg-surface border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
              <span className="font-semibold text-slate-700">All Prospects</span>
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
              {isAllActive ? 'Showing all prospects' : 'Complete pipeline • Reset'}
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

          {/* Card 3: Site Visits Scheduled */}
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
              {isFollowUpActive ? 'Click to show all' : 'Attention required'}
            </p>
          </button>

          {/* Card 5: Unassigned */}
          <button
            onClick={() => handleCardClick('unassigned')}
            title={isUnassignedActive ? 'Active filter • Click to clear' : 'Click to filter by unassigned leads'}
            className={`col-span-2 sm:col-span-1 relative text-left p-4 rounded-2xl border transition-all duration-150 cursor-pointer ${
              isUnassignedActive
                ? 'bg-rose-50/80 border-rose-500 shadow-md ring-2 ring-rose-500/25'
                : 'bg-surface/80 hover:bg-surface border-slate-200/80 hover:border-rose-300 shadow-2xs hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-rose-700 mb-1">
              <span className="font-semibold">Unassigned</span>
              {isUnassignedActive ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                  <Check className="w-2.5 h-2.5" /> Filtered
                </span>
              ) : (
                <UserPlus className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <div className="text-2xl font-extrabold text-rose-900 tabular-nums">
              {statsLoaded ? (
                (pipelineStats.unassigned ?? 0).toLocaleString()
              ) : (
                <span className="inline-block w-12 h-7 bg-rose-100/60 animate-pulse rounded-md" />
              )}
            </div>
            <p className="text-[10px] text-rose-600 mt-1 font-medium">
              {isUnassignedActive ? 'Click to show all' : 'Needs advisor dispatch'}
            </p>
          </button>
        </div>

        {/* Command Search & Multi-filter Suite */}
        <div className="bg-surface rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          {/* Top Search Input Row */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by prospect name, mobile number, email address, or target location..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="w-full pl-11 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400 outline-none"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput('');
                    updateURLParams({ search: '', page: '1' });
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleSearch}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>

          {/* Filter Capsules Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
            {/* 1. Status Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Pipeline Stage
              </label>
              <select
                value={statusFilter}
                onChange={(e) => updateURLParams({ status: e.target.value, page: '1' })}
                className="w-full px-3 py-2 text-xs bg-surface border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="all">All Stages</option>
                <option value="new">New Inquiry</option>
                <option value="not_connected">Not Connected</option>
                <option value="interested">Interested (High Intent)</option>
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

            {/* 2. Assignment Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Advisor Assignment
              </label>
              <select
                value={assignmentFilter}
                onChange={(e) => updateURLParams({ assignment: e.target.value, page: '1' })}
                className="w-full px-3 py-2 text-xs bg-surface border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="assigned">Assigned Only</option>
                <option value="unassigned">Unassigned Only</option>
              </select>
            </div>

            {/* 3. Agent Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Specific Advisor
              </label>
              <select
                value={agentFilter}
                onChange={(e) => updateURLParams({ agent: e.target.value, page: '1' })}
                className="w-full px-3 py-2 text-xs bg-surface border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="all">All Advisors</option>
                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Date From */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => updateURLParams({ dateFrom: e.target.value, page: '1' })}
                className="w-full px-3 py-2 text-xs bg-surface border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            {/* 5. Date To */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => updateURLParams({ dateTo: e.target.value, page: '1' })}
                className="w-full px-3 py-2 text-xs bg-surface border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            {/* 6. Sort By & Order Toggle */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Sort Order
              </label>
              <div className="flex gap-1.5">
                <select
                  value={sortBy}
                  onChange={(e) => updateURLParams({ sortBy: e.target.value })}
                  className="flex-1 px-2.5 py-2 text-xs bg-surface border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="name">Name</option>
                  <option value="interestedLocation">Location</option>
                </select>
                <button
                  onClick={() => updateURLParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })}
                  className="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors text-xs font-bold"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Filters:
              </span>

              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                  Search: &quot;{searchTerm}&quot;
                  <button onClick={() => updateURLParams({ search: '', page: '1' })}>
                    <X className="w-3 h-3 hover:text-primary" />
                  </button>
                </span>
              )}

              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/70 shadow-2xs">
                  Stage: {getStatusBadgeConfig(statusFilter)?.label || statusFilter.replace(/_/g, ' ')}
                  <button
                    onClick={() => updateURLParams({ status: 'all', page: '1' })}
                    className="hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                    title="Remove stage filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {assignmentFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-semibold border border-purple-200/70 shadow-2xs">
                  Assignment: {assignmentFilter === 'unassigned' ? 'Unassigned Only' : 'Assigned Only'}
                  <button
                    onClick={() => updateURLParams({ assignment: 'all', page: '1' })}
                    className="hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                    title="Remove assignment filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {agentFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-soft text-primary-darker font-semibold border border-primary-light/70 shadow-2xs">
                  Advisor: {agents.find(a => a._id === agentFilter)?.name || agentFilter}
                  <button
                    onClick={() => updateURLParams({ agent: 'all', page: '1' })}
                    className="hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                    title="Remove advisor filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(dateFrom || dateTo) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200/70 shadow-2xs">
                  Date: {dateFrom || 'Start'} to {dateTo || 'End'}
                  <button
                    onClick={() => updateURLParams({ dateFrom: '', dateTo: '', page: '1' })}
                    className="hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                    title="Remove date filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={() => {
                  setSearchInput('');
                  router.replace('/admin/crm/leads', { scroll: false });
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline ml-auto cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Results Counter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 px-1">
          <div className="flex flex-wrap items-center gap-2 font-medium">
            <span className="text-slate-700">
              Showing <span className="font-bold text-slate-900">{leads.length === 0 ? 0 : ((currentPage - 1) * 30) + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(currentPage * 30, totalCount)}</span> of{' '}
              <span className="font-bold text-slate-900">{totalCount.toLocaleString()}</span> leads
            </span>
            {hasActiveFilters && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                <span>Filtered view ({pipelineStats.total ? pipelineStats.total.toLocaleString() : totalCount.toLocaleString()} total in pipeline)</span>
                <button
                  onClick={() => {
                    setSearchInput('');
                    router.replace('/admin/crm/leads', { scroll: false });
                  }}
                  className="inline-flex items-center gap-0.5 text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer ml-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Show All</span>
                </button>
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Real-time database sync</span>
          </div>
        </div>

        {/* Main CRM Leads Data Table */}
        {loading ? (
          <div className="bg-surface rounded-3xl border border-slate-200/80 shadow-sm p-16 flex flex-col items-center justify-center">
            <div className="relative w-14 h-14 mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin"></div>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Pipeline Data...</p>
          </div>
        ) : error ? (
          <div className="bg-surface rounded-3xl border border-rose-200 p-12 text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-rose-900 mb-1">Error Loading Pipeline</h3>
            <p className="text-xs text-slate-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-btn-text text-xs font-bold rounded-xl hover:bg-primary-dark transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-slate-200/80 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Leads Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              {hasActiveFilters
                ? 'No prospects match your current search or filter criteria. Try loosening your filters.'
                : 'Your sales pipeline is empty. Start capturing leads via public property portals or add manual leads.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={() => {
                  setSearchInput('');
                  router.replace('/admin/crm/leads', { scroll: false });
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
              >
                Clear All Filters
              </button>
            ) : (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-btn-text text-xs font-bold transition-colors inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add First Lead</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-surface rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    <th className="py-4 px-6">Prospect Details</th>
                    <th className="py-4 px-4">Contact &amp; Connect</th>
                    <th className="py-4 px-4">Target Location</th>
                    <th className="py-4 px-4">Stage &amp; Appointment</th>
                    <th className="py-4 px-4">Assigned Advisor</th>
                    <th className="py-4 px-4">Notes &amp; Activity</th>
                    <th className="py-4 px-4">Added</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
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
                        onClick={() => onRowNavigate(lead._id)}
                        className={`group transition-all duration-150 cursor-pointer ${
                          isVisited
                            ? 'bg-slate-50/40 hover:bg-slate-100/70 border-l-4 border-l-emerald-500'
                            : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                        }`}
                      >
                        {/* 1. Prospect Info */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800 font-black text-xs flex items-center justify-center border border-slate-200 flex-shrink-0 shadow-2xs group-hover:border-primary/40 transition-colors">
                              {lead.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                                  {lead.name}
                                </span>
                                {isVisited && (
                                  <span title="Viewed in this session">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono font-semibold text-slate-400">
                                  #{lead._id.slice(-6).toUpperCase()}
                                </span>
                                <span className="text-slate-300">•</span>
                                <span className="text-[10px] text-slate-400 capitalize">
                                  {lead.source || 'Website'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Quick Contact & Direct Action */}
                        <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {lead.phone && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span className="select-all tabular-nums">{lead.phone}</span>
                              </span>
                            )}
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}`}
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title={lead.email}
                              >
                                <Mail className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* 3. Target Location */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 font-medium max-w-[180px] truncate">
                            <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="truncate">
                              {getLocationDisplayName(lead.interestedLocation || 'Bangalore')}
                            </span>
                          </div>
                        </td>

                        {/* 4. Pipeline Stage & Schedule - ON HOVER INTEL */}
                        <td className="py-4 px-4 whitespace-nowrap relative group/stage" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                                {statusConfig.label}
                              </span>
                              {lead.notes && lead.notes.length > 0 && (
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full border border-primary/20">
                                  {lead.notes.length}
                                </span>
                              )}
                            </div>

                            {lead.substatus && (
                              <div className="text-[10px] font-medium text-slate-500 pl-1">
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

                          {/* On-Hover Notes & Schedule Popover from Stage Column */}
                          {((lead.notes && lead.notes.length > 0) || lead.followUpDate || lead.siteVisitDate || (lead.followUpHistory && lead.followUpHistory.length > 0) || (lead.visitHistory && lead.visitHistory.length > 0)) && (
                            <div
                              className={`invisible opacity-0 group-hover/stage:visible group-hover/stage:opacity-100 transition-all duration-200 absolute left-0 ${popoverPosition} w-80 sm:w-88 bg-surface/98 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4.5 z-50 pointer-events-auto text-left whitespace-normal ${bridgePosition}`}
                            >
                              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    <FileText className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900 tracking-tight">Stage & Notes Intel</h4>
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
                                  <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs">
                                    <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-0.5">
                                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                                      <span>Next Scheduled Follow-up</span>
                                    </div>
                                    <div className="text-amber-800 font-medium">
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
                                      <CalendarCheck className="w-3.5 h-3.5 text-violet-700" />
                                      <span>Scheduled Site Tour</span>
                                    </div>
                                    <div className="text-violet-800 font-medium">
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

                                {/* Visit History */}
                                {lead.visitHistory && lead.visitHistory.length > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Tour History ({lead.visitHistory.length})
                                    </div>
                                    {lead.visitHistory.slice().reverse().slice(0, 2).map((visit, idx) => (
                                      <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                                        <div className="font-semibold text-slate-700">
                                          {new Date(visit.scheduledDate).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                        {visit.reason && <div className="text-slate-500 text-[11px] mt-0.5">{visit.reason}</div>}
                                        {visit.rescheduleReason && (
                                          <div className="text-amber-600 text-[11px] mt-0.5">Rescheduled: {visit.rescheduleReason}</div>
                                        )}
                                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                                          {visit.type === 'completed' ? '✓ Completed' : visit.type === 'rescheduled' ? '↻ Rescheduled' : 'Scheduled'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Conversation Notes */}
                                {lead.notes && lead.notes.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Conversation Notes ({lead.notes.length})
                                    </div>
                                    {lead.notes.slice().reverse().map((note, idx) => (
                                      <div key={idx} className="text-xs p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 border-l-3 border-l-primary">
                                        <p className="text-slate-800 font-medium leading-relaxed">{note.content}</p>
                                        <p className="text-[10px] text-slate-400 mt-1.5 font-medium flex items-center justify-between">
                                          <span>{note.addedBy || 'Advisor'}</span>
                                          <span>{formatDate(note.addedAt)}</span>
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Hovering reveals intel</span>
                                <span
                                  onClick={() => onRowNavigate(lead._id)}
                                  className="text-primary font-bold hover:underline cursor-pointer"
                                >
                                  Open Dossier →
                                </span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 5. Assigned Advisor */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs">
                          {lead.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center border border-emerald-200">
                                {lead.assignedTo.name?.charAt(0)?.toUpperCase() || 'A'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 truncate">{lead.assignedTo.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{lead.assignedTo.email || ''}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* 6. Notes & Intel - ON HOVER NOTES */}
                        <td className="py-4 px-4 whitespace-nowrap relative" onClick={(e) => e.stopPropagation()}>
                          <div className="relative group/notes inline-block">
                            {lead.notes && lead.notes.length > 0 ? (
                              <button
                                onClick={() => setActiveNotesPopover(activeNotesPopover === lead._id ? null : lead._id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 group-hover/notes:bg-rose-50 group-hover/notes:text-primary text-slate-700 transition-colors cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-500 group-hover/notes:text-primary" />
                                <span>{lead.notes.length} {lead.notes.length === 1 ? 'Note' : 'Notes'}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-normal">No notes</span>
                            )}

                            {/* Notes Popover - Automatically visible ON HOVER OR when clicked */}
                            {lead.notes && lead.notes.length > 0 && (
                              <div
                                className={`invisible opacity-0 group-hover/notes:visible group-hover/notes:opacity-100 transition-all duration-200 absolute right-0 ${popoverPosition} w-80 sm:w-88 bg-surface/98 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4.5 z-50 pointer-events-auto text-left whitespace-normal ${bridgePosition} ${
                                  activeNotesPopover === lead._id ? '!visible !opacity-100' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                                      <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-slate-900 tracking-tight">Lead Notes History</h4>
                                      <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{lead.name}</p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {lead.notes.length} {lead.notes.length === 1 ? 'Note' : 'Notes'}
                                  </span>
                                </div>

                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                  {lead.notes.slice().reverse().map((note, idx) => (
                                    <div key={idx} className="text-xs p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/70 border-l-3 border-l-primary">
                                      <p className="text-slate-800 font-medium leading-relaxed">{note.content}</p>
                                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium flex items-center justify-between">
                                        <span>{note.addedBy || 'Advisor'}</span>
                                        <span>{formatDate(note.addedAt)}</span>
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">Hovering reveals notes</span>
                                  <span
                                    onClick={() => onRowNavigate(lead._id)}
                                    className="text-primary font-bold hover:underline cursor-pointer"
                                  >
                                    Open Dossier →
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 7. Date Added */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                          <div>{formatRelativeTime(lead.createdAt)}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {formatDate(lead.createdAt).split(',')[0]}
                          </div>
                        </td>

                        {/* 8. Row Action Suite */}
                        <td className="py-4 px-6 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            {isAdmin && (
                              <button
                                onClick={(e) => handleEditClick(e, lead)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors"
                                title="Edit Lead"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                onClick={(e) => handleDeleteClick(e, lead._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Lead"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => onRowNavigate(lead._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="View Complete Lead Profile"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Suite */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => updateURLParams({ page: Math.max(1, currentPage - 1).toString() }, true)}
                  disabled={currentPage === 1}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-surface border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {(() => {
                    const pages = [];
                    const maxVisible = 7;

                    if (totalPages <= maxVisible) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      let start = Math.max(2, currentPage - 1);
                      let end = Math.min(totalPages - 1, currentPage + 1);

                      if (currentPage <= 3) {
                        start = 2;
                        end = 5;
                      }
                      if (currentPage >= totalPages - 2) {
                        start = totalPages - 4;
                        end = totalPages - 1;
                      }

                      if (start > 2) pages.push('...');
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (end < totalPages - 1) pages.push('...');
                      pages.push(totalPages);
                    }

                    return pages.map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2.5 py-1 text-xs text-slate-400">
                            …
                          </span>
                        );
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => updateURLParams({ page: page.toString() }, true)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                            currentPage === page
                              ? 'bg-primary text-btn-text shadow-sm shadow-primary/20'
                              : 'text-slate-600 bg-surface hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}
                </div>

                <button
                  onClick={() => updateURLParams({ page: Math.min(totalPages, currentPage + 1).toString() }, true)}
                  disabled={currentPage === totalPages}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-surface border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add New Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-surface rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-secondary to-[#1E293B] text-white p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-btn-text shadow-md shadow-primary/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Create New Lead</h2>
                  <p className="text-xs text-slate-400">Capture buyer or investor inquiry details</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newLead.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone Number (10 Digits) <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="text"
                    name="phone"
                    value={newLead.phone}
                    onChange={handleInputChange}
                    required
                    maxLength="10"
                    placeholder="10-digit mobile number"
                    className="w-full pl-12 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={newLead.email}
                  onChange={handleInputChange}
                  placeholder="vikram@example.com"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Interested Location <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  name="interestedLocation"
                  value={newLead.interestedLocation}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Koramangala, Indiranagar, Whitefield"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={addingLead}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingLead || !newLead.name || !newLead.phone || !newLead.interestedLocation}
                  className="px-5 py-2.5 text-xs font-bold text-btn-text bg-gradient-to-r from-primary to-primary-dark hover:from-primary hover:to-primary-darker rounded-xl shadow-md shadow-primary/25 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {addingLead ? 'Adding...' : 'Save Prospect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkLeadUpload
          onUploadComplete={handleBulkUploadComplete}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      {/* Edit Lead Modal */}
      {showEditModal && editingLead && (
        <EditLeadModal
          lead={editingLead}
          onClose={() => {
            setShowEditModal(false);
            setEditingLead(null);
          }}
          onUpdate={handleUpdateLead}
        />
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssign && (
        <BulkAssignModal
          onClose={() => setShowBulkAssign(false)}
          onAssign={handleBulkAssignComplete}
        />
      )}
    </div>
  );
}