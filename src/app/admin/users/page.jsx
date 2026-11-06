'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  ShieldCheck,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Check,
  Copy,
  ExternalLink,
  Target,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function AdminUsers() {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role !== 'admin') {
        router.push('/admin');
        return;
      }
    }
    fetchAgents();
  }, [router]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents?includeStats=true');
      const data = await response.json();

      if (data.success) {
        setAgents(data.data || []);
      } else {
        setError('Failed to fetch advisor directory');
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to fetch advisor directory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Advisor profile created successfully');
        setShowAddModal(false);
        setFormData({ name: '', email: '', phone: '', password: '' });
        fetchAgents();
      } else {
        setError(data.message || 'Failed to add advisor');
      }
    } catch (err) {
      console.error('Error adding agent:', err);
      setError('Failed to add advisor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAgent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/agents/${editingAgent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Advisor credentials and profile updated');
        setShowEditModal(false);
        setEditingAgent(null);
        setFormData({ name: '', email: '', phone: '', password: '' });
        fetchAgents();
      } else {
        setError(data.message || 'Failed to update advisor');
      }
    } catch (err) {
      console.error('Error updating agent:', err);
      setError('Failed to update advisor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAgent = async (agentId, agentName) => {
    if (!confirm(`Are you sure you want to permanently delete advisor "${agentName}"? Any active assigned leads should be re-assigned.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Advisor deleted successfully');
        fetchAgents();
      } else {
        setError(data.message || 'Failed to delete advisor');
      }
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError('Failed to delete advisor');
    }
  };

  const openEditModal = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      email: agent.email,
      phone: agent.phone || '',
      password: ''
    });
    setShowEditModal(true);
  };

  const handleToggleActive = async (agentId, currentStatus) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Advisor status updated to ${!currentStatus ? 'Active' : 'Inactive'}`);
        fetchAgents();
      } else {
        setError(data.message || 'Failed to update advisor status');
      }
    } catch (err) {
      console.error('Error updating agent status:', err);
      setError('Failed to update advisor status');
    }
  };

  const filteredAgents = agents.filter(agent => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      agent.name?.toLowerCase().includes(term) ||
      agent.email?.toLowerCase().includes(term) ||
      agent.phone?.toLowerCase().includes(term)
    );
  });

  const totalAssignedAcrossTeam = agents.reduce((sum, a) => sum + (a.currentAssignedCount || 0), 0);
  const totalCompletedAcrossTeam = agents.reduce((sum, a) => sum + (a.currentCompletedCount || 0), 0);
  const activeCount = agents.filter(a => a.isActive).length;

  if (loading && agents.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl border-2 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-700">Loading User Directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
              Advisor Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {agents.length} Advisors
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Manage sales representatives, account credentials, lead allocations, and active status.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => router.push('/admin/duplicate-checker')}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-surface hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
            title="Scan and resolve duplicate lead assignments"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Check Duplicates</span>
          </button>

          <button
            onClick={() => {
              setFormData({ name: '', email: '', phone: '', password: '' });
              setShowAddModal(true);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Advisor</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="p-1 text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Advisors</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{agents.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Authorized CRM agents</p>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Status</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">{activeCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Receiving automatic allocations</p>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assigned Queue</span>
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{totalAssignedAcrossTeam}</div>
          <p className="text-[11px] text-slate-500 mt-1">Active prospect assignments</p>
        </div>

        <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Calls Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{totalCompletedAcrossTeam}</div>
          <p className="text-[11px] text-slate-500 mt-1">Total completed calls logged</p>
        </div>
      </div>

      {/* Roster Container */}
      <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">Advisor Roster</h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search advisor by name, email, phone..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No advisors found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm ? 'No advisor matches your search.' : 'Add your first sales advisor to begin assigning leads.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <th className="py-3.5 px-5">Advisor Profile</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Rotation Status</th>
                  <th className="py-3.5 px-4">Pipeline Load</th>
                  <th className="py-3.5 px-4">Completion Metric</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredAgents.map((agent) => {
                  const assigned = agent.currentAssignedCount || 0;
                  const completed = agent.currentCompletedCount || 0;
                  const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

                  return (
                    <tr key={agent._id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Monogram Avatar & Name */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-700/60 shadow-2xs">
                            {agent.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                {agent.name}
                              </span>
                              {agent.email?.includes('@demo') && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Demo Seed
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Ref: #{agent._id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-4 px-4 whitespace-nowrap space-y-1">
                        <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{agent.email}</span>
                        </div>
                        {agent.phone ? (
                          <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{agent.phone}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">No phone registered</div>
                        )}
                      </td>

                      {/* Active Status Pill */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(agent._id, agent.isActive)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                            agent.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Click to toggle active status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{agent.isActive ? 'Active in Queue' : 'Paused / Inactive'}</span>
                        </button>
                      </td>

                      {/* Pipeline Load */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{assigned} Leads</div>
                        <div className="text-[11px] text-slate-400">
                          {agent.currentPendingCount !== undefined ? `${agent.currentPendingCount} pending` : 'Assigned volume'}
                        </div>
                      </td>

                      {/* Completion Metric */}
                      <td className="py-4 px-4 whitespace-nowrap space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>{completed} Handled</span>
                          <span className="text-primary">{completionRate}%</span>
                        </div>
                        <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, completionRate)}%` }}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openEditModal(agent)}
                            title="Edit Advisor Credentials"
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent._id, agent.name)}
                            title="Delete Advisor"
                            className="p-1.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Advisor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-secondary/75 backdrop-blur-xs z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-secondary text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-btn-text">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Sales Advisor</h3>
                  <p className="text-[11px] text-slate-400">Create new login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
                  placeholder="advisor@propfinova.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
                  placeholder="e.g. 9845123456"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Advisor Modal */}
      {showEditModal && editingAgent && (
        <div className="fixed inset-0 bg-secondary/75 backdrop-blur-xs z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-secondary text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-btn-text">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Edit Advisor</h3>
                  <p className="text-[11px] text-slate-400">{editingAgent.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditAgent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
                  placeholder="New password (optional)"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}