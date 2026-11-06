'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Users,
  Phone,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Database,
  Search,
  Filter,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Wrench
} from 'lucide-react';

export default function DuplicateCheckerPage() {
  const router = useRouter();
  const [detecting, setDetecting] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [selectedAgent, setSelectedAgent] = useState('all');

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
  }, [router]);

  const handleDetectDuplicates = async () => {
    setDetecting(true);
    setMessage('');
    setReport(null);

    try {
      const response = await fetch('/api/debug/detect-duplicates');
      const data = await response.json();

      if (data.success) {
        setReport(data);
        if (data.summary.totalDuplicatesFound === 0 && data.summary.inconsistentLeadsFound === 0) {
          setMessage('Integrity scan complete: Zero duplicates or assignment collisions detected.');
          setMessageType('success');
        } else {
          setMessage(
            `Detected ${data.summary.totalDuplicatesFound} duplicate conflicts and ${data.summary.inconsistentLeadsFound} inconsistent records.`
          );
          setMessageType('error');
        }
      } else {
        setMessage(data.message || 'Diagnostic scan failed to complete');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      setMessage('Failed to execute integrity diagnostic scan');
      setMessageType('error');
    } finally {
      setDetecting(false);
    }
  };

  const handleFixDuplicates = async (fixType) => {
    const confirmationText =
      fixType === 'all'
        ? 'Are you sure you want to resolve ALL duplicate conflicts and inconsistencies? This action normalizes active allocations.'
        : `Are you sure you want to resolve ${fixType.replace('-', ' ')}?`;

    if (!confirm(confirmationText)) {
      return;
    }

    setFixing(true);
    setMessage('');

    try {
      const response = await fetch('/api/debug/remove-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgent !== 'all' ? selectedAgent : null,
          fixType: fixType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');

        // Re-run diagnostic
        setTimeout(() => {
          handleDetectDuplicates();
        }, 1000);
      } else {
        setMessage(data.message || 'Failed to normalize duplicates');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error fixing duplicates:', error);
      setMessage('Network error while resolving database conflicts');
      setMessageType('error');
    } finally {
      setFixing(false);
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
                <span className="text-primary">Integrity Diagnostics</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <ShieldCheck className="w-7 h-7 text-primary" />
                Lead Collision & Deduplication Console
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                Scan pipeline allocations for duplicate phone numbers, cross-agent assignment collisions, and corrupted orphan pointers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/admin/crm/leads"
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Return to CRM
              </Link>
              <button
                onClick={handleDetectDuplicates}
                disabled={detecting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-btn-text text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
                {detecting ? 'Scanning Pipeline...' : 'Run Integrity Scan'}
              </button>
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
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5">
                {messageType === 'success' ? 'System Clean' : 'Discrepancy Warning'}
              </p>
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        )}

        {/* Diagnostic Scope Card */}
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Database Diagnostic Engine</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identifies multiple allocations of the same telephone record to an advisor and verifies round-robin pointer integrity.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleDetectDuplicates}
                disabled={detecting}
                className="w-full md:w-auto px-6 py-2.5 bg-secondary hover:bg-primary text-btn-text text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
                {detecting ? 'Diagnosing...' : 'Scan Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Summary Cards */}
        {report && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Advisors Inspected</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
                  {report.summary.totalAgentsChecked}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">Registered agents</div>
              </div>

              <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Affected Advisors</span>
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                </div>
                <div
                  className={`text-2xl font-black mt-2 tracking-tight ${
                    report.summary.agentsWithIssues > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {report.summary.agentsWithIssues}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">With lead collisions</div>
              </div>

              <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Duplicates</span>
                  <Phone className="w-4 h-4 text-rose-500" />
                </div>
                <div
                  className={`text-2xl font-black mt-2 tracking-tight ${
                    report.summary.totalDuplicatesFound > 0 ? 'text-primary' : 'text-emerald-600'
                  }`}
                >
                  {report.summary.totalDuplicatesFound}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">Identical contact numbers</div>
              </div>

              <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inconsistent Records</span>
                  <Wrench className="w-4 h-4 text-blue-500" />
                </div>
                <div
                  className={`text-2xl font-black mt-2 tracking-tight ${
                    report.summary.inconsistentLeadsFound > 0 ? 'text-blue-600' : 'text-emerald-600'
                  }`}
                >
                  {report.summary.inconsistentLeadsFound}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">Corrupted metadata</div>
              </div>
            </div>

            {/* Quick Resolution Action Hub */}
            {(report.summary.totalDuplicatesFound > 0 || report.summary.inconsistentLeadsFound > 0) && (
              <div className="bg-surface rounded-2xl border border-rose-200/80 p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-slate-900">Database Resolution Engine</h2>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  Automated scripts to consolidate multi-assigned leads (retaining the most recent activity timestamp) and restore pointer integrity.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {report.summary.totalDuplicatesFound > 0 && (
                    <button
                      onClick={() => handleFixDuplicates('phone-duplicates')}
                      disabled={fixing}
                      className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Phone className="w-4 h-4" />
                      Resolve Phone Collisions
                    </button>
                  )}

                  {report.summary.inconsistentLeadsFound > 0 && (
                    <button
                      onClick={() => handleFixDuplicates('inconsistent-data')}
                      disabled={fixing}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Repair Orphan Pointers
                    </button>
                  )}

                  <button
                    onClick={() => handleFixDuplicates('all')}
                    disabled={fixing}
                    className="px-4 py-3 bg-secondary hover:bg-primary text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  >
                    {fixing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Normalizing Records...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Execute Full Normalization
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Detailed Report by Agent */}
            {report.duplicateReport && report.duplicateReport.length > 0 && (
              <div className="bg-surface rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Advisor Collision Breakdown ({report.duplicateReport.length})
                  </h2>
                </div>

                <div className="space-y-4">
                  {report.duplicateReport.map((agentReport, index) => (
                    <div
                      key={index}
                      className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{agentReport.agentName}</h3>
                          <p className="text-xs text-slate-500">{agentReport.agentEmail}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pipeline</span>
                          <span className="text-sm font-extrabold text-slate-900">{agentReport.totalAssignedLeads} Leads</span>
                        </div>
                      </div>

                      {/* Phone Duplicates Breakdown */}
                      {agentReport.duplicatesByPhone && agentReport.duplicatesByPhone.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider mb-2">
                            <Phone className="w-3.5 h-3.5" />
                            Overlapping Phone Numbers ({agentReport.duplicatesByPhone.length})
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {agentReport.duplicatesByPhone.map((dup, idx) => (
                              <div
                                key={idx}
                                className="bg-surface rounded-xl p-3 border border-rose-200/70 shadow-sm"
                              >
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-extrabold text-slate-900 tracking-wide">{dup.phone}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-primary font-bold text-[10px]">
                                    {dup.count} instances
                                  </span>
                                </div>
                                <ul className="mt-2 space-y-1">
                                  {dup.leads.map((lead, leadIdx) => (
                                    <li key={leadIdx} className="text-[11px] text-slate-600 flex items-center justify-between">
                                      <span className="truncate max-w-[160px] font-medium">{lead.name || 'Unnamed'}</span>
                                      <span className="text-slate-400 font-mono text-[10px]">
                                        #{lead.leadId ? lead.leadId.toString().slice(-6) : 'N/A'}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inconsistent Lead Metadata */}
            {report.inconsistentLeads && report.inconsistentLeads.length > 0 && (
              <div className="bg-surface rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  Orphaned Assignment Records ({report.inconsistentLeads.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.inconsistentLeads.map((lead, index) => (
                    <div
                      key={index}
                      className="border border-blue-100 rounded-xl p-3 bg-blue-50/40 flex items-start justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">{lead.name || 'Lead'}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {lead.phone} • ID: #{lead.leadId ? lead.leadId.toString().slice(-8) : 'N/A'}
                        </div>
                      </div>
                      <div className="text-[10px] uppercase font-extrabold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg">
                        {lead.issue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
