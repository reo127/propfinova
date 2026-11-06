'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RotateCcw,
  UserX,
  UserPlus,
  Users,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRightLeft
} from 'lucide-react';

export default function CleanupAgentLeadsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  useEffect(() => {
    // Check if user is admin
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.role !== 'admin') {
        router.push('/admin');
        return;
      }
    } else {
      router.push('/login');
      return;
    }

    fetchAgents();
  }, [router]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents?includeStats=true');
      const data = await response.json();

      if (data.success) {
        setAgents(data.data);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleUnassignAll = async () => {
    if (!selectedAgent) {
      setMessage('Please select an advisor first.');
      setMessageType('error');
      return;
    }

    if (
      !confirm(
        `Critical Action: Unassign ALL ${selectedAgent.currentAssignedCount || 0} active leads from ${selectedAgent.name}? They will return to unassigned pool.`
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/leads/unassign-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgent._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message || `Successfully flushed pipeline for ${selectedAgent.name}`);
        setMessageType('success');
        fetchAgents();
        setSelectedAgent(null);
      } else {
        setMessage(data.message || 'Failed to unassign leads');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error unassigning leads:', error);
      setMessage('Failed to process unassignment request');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (count) => {
    if (!selectedAgent) {
      setMessage('Please select an advisor first.');
      setMessageType('error');
      return;
    }

    if (!confirm(`Allocate ${count} fresh, unassigned leads to ${selectedAgent.name}?`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const adminUser = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch('/api/leads/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: count,
          agentId: selectedAgent._id,
          assignedBy: adminUser._id || null,
          status: null,
          location: null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message || `Allocated ${count} leads to ${selectedAgent.name}`);
        setMessageType('success');
        fetchAgents();
      } else {
        setMessage(data.message || 'Failed to assign leads');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error assigning leads:', error);
      setMessage('Network error during batch assignment');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 antialiased">
      {/* Top Header Banner */}
      <div className="bg-secondary text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                <Link href="/admin" className="hover:text-white transition-colors">
                  Admin
                </Link>
                <span>/</span>
                <Link href="/admin/settings" className="hover:text-white transition-colors">
                  Governance
                </Link>
                <span>/</span>
                <span className="text-primary">Pipeline Rebalancing</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <ArrowRightLeft className="w-7 h-7 text-primary" />
                Advisor Pipeline Sanitizer & Rebalancer
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                Safely flush overloaded advisor pipelines back to the unassigned master pool and restock them with fresh, deduplicated prospects.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/duplicate-checker"
                className="px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-primary-light text-xs font-bold uppercase tracking-wider transition-all"
              >
                Duplicate Checker
              </Link>
              <Link
                href="/admin/crm/leads"
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider transition-all"
              >
                Return to CRM
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        {/* Status Callout Message */}
        {message && (
          <div
            className={`p-4 rounded-2xl mb-6 border shadow-sm flex items-start gap-3.5 animate-in fade-in duration-200 ${
              messageType === 'success'
                ? 'bg-emerald-50 border-emerald-200/80 text-emerald-900'
                : 'bg-rose-50 border-rose-200/80 text-rose-900'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5">
                {messageType === 'success' ? 'Action Completed' : 'Operation Notice'}
              </p>
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Advisor Selection Roster */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-surface rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Select Sales Advisor</h2>
                  <p className="text-xs text-slate-500">Pick an advisor to manage active pipeline allocations</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                  {agents.length} Advisors
                </span>
              </div>

              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {agents.map((agent) => {
                  const isSelected = selectedAgent?._id === agent._id;
                  return (
                    <div
                      key={agent._id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-rose-50/40 shadow-sm'
                          : 'border-slate-200/80 hover:border-slate-300 bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase ${
                              isSelected
                                ? 'bg-primary text-btn-text shadow-md shadow-primary/20'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {agent.name?.slice(0, 2) || 'AD'}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">{agent.name}</h3>
                            <p className="text-xs text-slate-500">{agent.email}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-slate-900 block tracking-tight">
                            {agent.currentAssignedCount || 0}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Active Leads
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            agent.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {agent.isActive ? 'Active in Rotation' : 'Inactive'}
                        </span>

                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          {isSelected ? 'Selected' : 'Click to select'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Console */}
          <div className="lg:col-span-6 space-y-4">
            {selectedAgent ? (
              <div className="bg-surface rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Advisor</span>
                  <div className="flex items-center justify-between mt-1">
                    <h2 className="text-xl font-black text-slate-900">{selectedAgent.name}</h2>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-900 text-white rounded-xl">
                      {selectedAgent.currentAssignedCount || 0} Leads Allocated
                    </span>
                  </div>
                </div>

                {/* Step 1: Flush Pipeline */}
                <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/40">
                  <div className="flex items-center gap-2 mb-1.5">
                    <UserX className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Phase 1: Release Pipeline
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Unassigns all <strong className="text-slate-900">{selectedAgent.currentAssignedCount || 0} leads</strong> currently tied to {selectedAgent.name}. They will be immediately re-cataloged as unassigned prospects.
                  </p>

                  <button
                    onClick={handleUnassignAll}
                    disabled={loading || (selectedAgent.currentAssignedCount || 0) === 0}
                    className="w-full py-3 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                  >
                    <UserX className="w-4 h-4" />
                    {loading ? 'Releasing Leads...' : `Unassign All (${selectedAgent.currentAssignedCount || 0}) Leads`}
                  </button>
                </div>

                {/* Step 2: Restock Fresh Leads */}
                <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40">
                  <div className="flex items-center gap-2 mb-1.5">
                    <UserPlus className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Phase 2: Restock Fresh Leads
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Instantly allocate clean, deduplicated prospects from the unassigned backlog to {selectedAgent.name}.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[25, 50, 100, 150].map((count) => (
                      <button
                        key={count}
                        onClick={() => handleReassign(count)}
                        disabled={loading}
                        className="py-3 bg-surface hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm disabled:opacity-40"
                      >
                        +{count} Leads
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">No Advisor Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Select an advisor from the directory on the left to review their workload and execute quota adjustments.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
