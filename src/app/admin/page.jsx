'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  CalendarCheck,
  UserPlus,
  ArrowUpRight,
  ArrowRight,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Sparkles,
  Search,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  UploadCloud
} from 'lucide-react';
import { getLocationDisplayName } from '@/utils/locations';
import { useDashboardStore } from '@/stores';
import BulkLeadUpload from '@/components/BulkLeadUpload';

export default function AdminDashboard() {
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const stats = useDashboardStore((state) => state.stats);
  const loading = useDashboardStore((state) => state.loading);
  const refreshing = useDashboardStore((state) => state.refreshing);
  const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      new: { label: 'New Lead', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
      interested: { label: 'Interested', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      site_visit_scheduled: { label: 'Site Visit Scheduled', bg: 'bg-violet-50 text-violet-700 border-violet-200' },
      follow_up: { label: 'Follow Up', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
      not_connected: { label: 'Not Connected', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
      not_interested: { label: 'Not Interested', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
      site_visit_done: { label: 'Site Visit Done', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
    };
    const current = statusMap[status] || { label: status?.replace('_', ' ') || 'New', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${current.bg} capitalize`}>
        {current.label}
      </span>
    );
  };

  const actionHub = [
    {
      title: 'Sales CRM & Pipeline',
      description: 'Manage incoming prospects, advisor assignments & multi-stage deals',
      href: '/admin/crm/leads',
      tag: 'Core System',
      icon: Users,
      accent: 'from-primary to-primary-darker',
      bgTint: 'group-hover:border-primary/40 hover:shadow-primary/5',
    },
    {
      title: 'Property Portfolio',
      description: 'Curate luxury residences, commercial suites & residential listings',
      href: '/admin/properties',
      tag: 'Inventory',
      icon: Building2,
      accent: 'from-blue-600 to-primary-dark',
      bgTint: 'group-hover:border-blue-500/40 hover:shadow-blue-500/5',
    },
    {
      title: 'Business Analytics',
      description: 'Review lead velocity, agent closing rates & channel conversion',
      href: '/admin/analytics',
      tag: 'Reports',
      icon: BarChart3,
      accent: 'from-purple-600 to-violet-700',
      bgTint: 'group-hover:border-purple-500/40 hover:shadow-purple-500/5',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary via-[#111827] to-[#1E293B] text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-800">
        {/* Decorative background glow elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wide text-white/90">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>PROPFINOVA • EXECUTIVE PLATFORM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Real Estate Intelligence &amp; Sales CRM
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Unified command center monitoring active portfolio assets, client acquisition pipelines, and luxury tour conversions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchDashboardData({ force: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all backdrop-blur-sm disabled:opacity-50 cursor-pointer"
              title="Refresh Platform Metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => setShowBulkUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all backdrop-blur-sm cursor-pointer shadow-sm hover:scale-[1.02]"
              title="Import Prospects from CSV"
            >
              <UploadCloud className="w-4 h-4 text-primary-light" />
              <span>Bulk Upload Leads</span>
            </button>

            <Link
              href="/admin/crm/leads"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-primary hover:to-primary-darker text-btn-text text-xs font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]"
            >
              <Users className="w-4 h-4" />
              <span>Launch Sales CRM</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Total Portfolio */}
        <div className="group bg-surface rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <TrendingUp className="w-3 h-3" /> Active
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Portfolio Properties</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {loading ? '...' : stats.totalProperties}
            </h3>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
              <span>Verified Listings</span>
              <Link href="/admin/properties" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                View All <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Metric 2: Total Leads */}
        <div className="group bg-surface rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary flex items-center justify-center border border-primary/20">
              <Users className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <TrendingUp className="w-3 h-3" /> Growth
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Leads Pipeline</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {loading ? '...' : stats.totalLeads}
            </h3>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowBulkUploadModal(true)}
                className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                title="Import Leads CSV"
              >
                <UploadCloud className="w-3 h-3" />
                <span>Bulk Upload</span>
              </button>
              <Link href="/admin/crm/leads" className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1">
                Open CRM <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Metric 3: Site Visits */}
        <div className="group bg-surface rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200/60">
              High Intent
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Site Visits Scheduled</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {loading ? '...' : stats.siteVisitsCount}
            </h3>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
              <span>Physical Showings</span>
              <Link href="/admin/crm/leads?status=site_visit_scheduled" className="text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1">
                View Visits <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Metric 4: Unassigned Leads */}
        <div className="group bg-surface rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <UserPlus className="w-6 h-6" />
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              stats.unassignedCount > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200/80 animate-pulse'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {stats.unassignedCount > 0 ? 'Requires Action' : 'All Assigned'}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unassigned Intake</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {loading ? '...' : stats.unassignedCount}
            </h3>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
              <span>Fresh Prospects</span>
              <Link href="/admin/crm/leads?assignment=unassigned" className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1">
                Assign Now <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Live Sales Inquiries Stream & Quick Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Real-time Inquiries Table */}
        <div className="lg:col-span-2 bg-surface rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Recent Sales Inquiries</h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Live incoming buyer &amp; investor inquiries</p>
            </div>
            <Link
              href="/admin/crm/leads"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-dark bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              <span>Manage In CRM</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {stats.recentLeads.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">No customer inquiries yet</p>
                <Link
                  href="/admin/crm/leads"
                  className="mt-3 inline-block text-xs font-semibold text-primary hover:underline"
                >
                  Create your first lead in CRM &rarr;
                </Link>
              </div>
            ) : (
              <table className="w-full text-left divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="bg-slate-50/70 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    <th className="py-3.5 px-6">Prospect</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Stage</th>
                    <th className="py-3.5 px-4">Advisor</th>
                    <th className="py-3.5 px-6 text-right">Connect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {stats.recentLeads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                            {lead.name
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2) || 'L'}
                          </div>
                          <div>
                            <Link
                              href={`/admin/crm/leads/${lead._id}`}
                              className="font-bold text-slate-900 group-hover:text-primary transition-colors block"
                            >
                              {lead.name}
                            </Link>
                            <span className="text-[11px] text-slate-400 font-normal">
                              {formatRelativeTime(lead.createdAt)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{getLocationDisplayName(lead.interestedLocation || 'Any Location')}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(lead.status)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        {lead.assignedTo ? (
                          <span className="text-slate-700 font-medium">
                            {lead.assignedTo.name || 'Assigned'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200/80">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title={`Call ${lead.name}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {lead.phone && (
                            <a
                              href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                              title="WhatsApp Message"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <Link
                            href={`/admin/crm/leads/${lead._id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
                            title="Open Lead Profile"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right 1 Col: Pipeline Funnel & Operational Health */}
        <div className="space-y-6">
          {/* Pipeline Conversion Stage */}
          <div className="bg-surface rounded-3xl p-6 border border-slate-200/80 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">Pipeline Distribution</h2>
            <p className="text-xs text-slate-500 mb-6">Stage velocity from discovery to closing</p>

            <div className="space-y-4">
              {/* Stage: Total Leads */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-700">1. Total Inquiries</span>
                  <span className="text-slate-900">{stats.totalLeads}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-600 h-2.5 rounded-full w-full"></div>
                </div>
              </div>

              {/* Stage: Qualified / Interested */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-700">2. Qualified / Interested</span>
                  <span className="text-slate-900">{stats.interestedCount}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.totalLeads > 0 ? Math.min(100, Math.round((stats.interestedCount / stats.totalLeads) * 100)) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Stage: Site Visits */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-700">3. Scheduled Tours</span>
                  <span className="text-slate-900">{stats.siteVisitsCount}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-violet-600 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.totalLeads > 0 ? Math.min(100, Math.round((stats.siteVisitsCount / stats.totalLeads) * 100)) : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <Link
                href="/admin/crm/leads?status=interested"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors"
              >
                <span>Filter Hot Prospects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Real Estate Playbook Card */}
          <div className="bg-gradient-to-br from-secondary to-[#1a2234] text-white rounded-3xl p-6 border border-slate-800 shadow-md">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Advisor Best Practice</span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              High-Value Lead Velocity
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Prospects contacted within 15 minutes of submission convert at an 8x higher rate for in-person property walkthroughs.
            </p>
            <Link
              href="/admin/crm/leads?assignment=unassigned"
              className="inline-flex items-center gap-2 text-xs font-bold text-btn-text bg-primary hover:bg-primary-dark px-4 py-2 rounded-xl shadow-md transition-colors"
            >
              <span>Triage Fresh Leads</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Module Matrix */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Operational Command Hub</h2>
          <p className="text-xs text-slate-500">Jump directly into specialized real estate management tools</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionHub.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group bg-surface rounded-2xl p-6 border border-slate-200/80 shadow-sm transition-all duration-200 flex flex-col justify-between ${item.bgTint}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.accent} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                  <span>Enter Suite</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <BulkLeadUpload
          onUploadComplete={(results) => {
            if (results?.createdCount > 0) {
              fetchDashboardData({ force: true });
            }
          }}
          onClose={() => setShowBulkUploadModal(false)}
        />
      )}
    </div>
  );
}