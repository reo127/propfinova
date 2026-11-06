'use client';

import { useState, useEffect } from 'react';
import {
  UserCheck,
  Users,
  MapPin,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useDashboardStore, useCRMStore } from '@/stores';

export default function BulkAssignModal({ onClose, onAssign }) {
  const [agents, setAgents] = useState([]);
  const [formData, setFormData] = useState({
    count: 100,
    agentId: '',
    status: 'all',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const countPresets = [25, 50, 100, 200, 500];

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents?includeStats=true');
      const data = await response.json();

      if (data.success) {
        setAgents(data.data.filter((agent) => agent.isActive));
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!formData.agentId) {
      setError('Please select an active sales advisor to receive the leads.');
      setLoading(false);
      return;
    }

    try {
      const adminUser = JSON.parse(localStorage.getItem('user') || '{}');

      const response = await fetch('/api/leads/bulk-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: parseInt(formData.count, 10),
          agentId: formData.agentId,
          assignedBy: adminUser._id || null,
          status: formData.status !== 'all' ? formData.status : null,
          location: formData.location ? formData.location.trim() : null
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Leads successfully assigned to advisor!');

        // Invalidate Zustand state caches
        useDashboardStore.getState().invalidateDashboard();
        useCRMStore.getState().invalidateLeadsCache();

        if (onAssign) {
          onAssign(data);
        }

        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setError(data.message || 'Failed to dispatch leads');
      }
    } catch (err) {
      console.error('Error assigning leads:', err);
      setError('Network communication failed while assigning leads.');
    } finally {
      setLoading(false);
    }
  };

  const selectedAgent = agents.find((a) => a._id === formData.agentId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative bg-surface rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-auto flex flex-col">
        {/* Executive Header */}
        <div className="bg-gradient-to-r from-secondary via-[#111827] to-[#1E293B] text-white p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-darker text-btn-text flex items-center justify-center shadow-lg shadow-primary/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-light bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30">
                  CRM Workflow Engine
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white mt-0.5">
                Bulk Lead Assignment
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Status Alerts */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold">Error: </span>
                {error}
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-semibold">
                {successMsg}
              </div>
            </div>
          )}

          {/* Lead Count with Preset Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Quantity to Assign *</span>
              </label>
              <span className="text-[11px] text-slate-400">Max 500 leads / batch</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                min="1"
                max="500"
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g. 100"
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Select:</span>
              {countPresets.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setFormData({ ...formData, count: preset })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    parseInt(formData.count, 10) === preset
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Allocates unassigned prospects randomly. Protects against duplicate assignments.
            </p>
          </div>

          {/* Target Agent Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Target Sales Advisor *</span>
            </label>

            <select
              required
              value={formData.agentId}
              onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="">-- Choose Sales Advisor --</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.name} • {agent.currentAssignedCount || 0} active leads
                </option>
              ))}
            </select>

            {agents.length === 0 ? (
              <p className="text-xs text-rose-600">
                No active advisors found. Please ensure agents are configured in Settings.
              </p>
            ) : selectedAgent ? (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs flex items-center justify-between">
                <span className="text-slate-600">Current Workload:</span>
                <span className="font-bold text-slate-900">
                  {selectedAgent.currentAssignedCount || 0} Leads in Queue
                </span>
              </div>
            ) : null}
          </div>

          {/* Filtering Criteria Accordion / Grid */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Filter className="w-3 h-3" />
              <span>Target Criteria (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Intake Stage
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Available Stages</option>
                  <option value="new">New Leads Only</option>
                  <option value="not_connected">Not Connected</option>
                  <option value="interested">Interested</option>
                  <option value="do_not_disturb">Do Not Disturb</option>
                  <option value="not_interested">Not Interested</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Target Locality
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g. Whitefield, Indiranagar"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Audit Notice */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Every dispatched prospect is tracked with timestamped history in the advisor audit trail.
            </p>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-surface border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || agents.length === 0}
              className="px-6 py-2.5 text-xs sm:text-sm font-bold text-btn-text bg-gradient-to-r from-primary to-primary-dark hover:from-primary hover:to-primary-darker rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching Leads...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Dispatch &amp; Assign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
