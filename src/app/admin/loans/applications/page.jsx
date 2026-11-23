'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Loader2, Search, ArrowLeft, Phone, Briefcase, Wallet,
  ChevronRight, X, Clock, FileCheck2,
} from 'lucide-react';
import { formatMoney, calculateEmi } from '@/lib/loanMath';
import { STAGES, STAGE_MAP } from '@/lib/loanStages';
import { groupForLoanType, LOAN_TYPE_LABELS, EXTRA_FIELDS_BY_GROUP } from '@/lib/loanCategories';

export default function LoanApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const token = () => localStorage.getItem('token');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filter) qs.set('status', filter);
      if (search) qs.set('search', search);
      const res = await fetch(`/api/loan-applications?${qs}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setApps(data?.success ? data.data : []);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = {};
    apps.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [apps]);

  return (
    <div className="p-6">
      <div className="mb-5">
        <Link href="/admin/loans" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" />
          Loan offers
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <FileText className="h-6 w-6 text-primary" />
          Loan Applications
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Qualify applications and move them through to the partner bank.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone or lender…"
            className="w-full rounded-xl border border-slate-200 bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary cursor-pointer"
        >
          <option value="">All stages</option>
          <option value="active">Active only</option>
          {STAGES.map(([v, l]) => (
            <option key={v} value={v}>{l}{counts[v] ? ` (${counts[v]})` : ''}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : apps.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-surface py-20 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700">No applications yet</p>
          <p className="mt-1 text-sm text-slate-500">They will appear here as customers apply.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-bold">Applicant</th>
                <th className="px-4 py-3 font-bold">Lender</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Income</th>
                <th className="px-4 py-3 font-bold">Stage</th>
                <th className="px-4 py-3 font-bold">Applied</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => (
                <tr
                  key={a._id}
                  onClick={() => setSelected(a)}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{a.applicantName}</p>
                    <p className="font-mono text-xs tabular-nums text-slate-500">{a.phone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{a.lenderNameSnapshot}</td>
                  <td className="px-4 py-3.5 font-semibold tabular-nums text-slate-800">{formatMoney(a.loanAmount)}</td>
                  <td className="px-4 py-3.5 text-xs tabular-nums text-slate-600">{formatMoney(a.monthlyIncome)}/mo</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STAGE_MAP[a.status]?.cls}`}>
                      {STAGE_MAP[a.status]?.label || a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <ChevronRight className="inline h-4 w-4 text-slate-300" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ApplicationDrawer
          application={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => { setSelected(updated); load(); }}
        />
      )}
    </div>
  );
}

function ApplicationDrawer({ application, onClose, onUpdated }) {
  const [status, setStatus] = useState(application.status);
  const [note, setNote] = useState('');
  const [sanctionedAmount, setSanctionedAmount] = useState(application.sanctionedAmount || '');
  const [sanctionedRate, setSanctionedRate] = useState(application.sanctionedRate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const emi = calculateEmi(application.loanAmount, application.sanctionedRate || 8.5, application.tenureYears);
  const group = groupForLoanType(application.loanProduct?.loanType);
  const loanTypeLabel = LOAN_TYPE_LABELS[application.loanProduct?.loanType];
  const extraFields = EXTRA_FIELDS_BY_GROUP[group] || [];
  const extraLabel = (key) => extraFields.find((f) => f.key === key)?.label || key;

  const act = async (body) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/loan-applications/${application._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not update');
      onUpdated(data.data);
      setNote('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const timeline = [...(application.statusHistory || [])].reverse();

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-lg flex-col overflow-hidden bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-slate-900">{application.applicantName}</h3>
            <p className="text-xs text-slate-500">
              {application.lenderNameSnapshot} · {application.productNameSnapshot}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Tile icon={Wallet} label="Loan requested" value={formatMoney(application.loanAmount)} />
            <Tile icon={Clock} label="Tenure" value={`${application.tenureYears} years`} />
            <Tile icon={Briefcase} label="Monthly income" value={formatMoney(application.monthlyIncome)} />
            <Tile icon={Wallet} label="Indicative EMI" value={formatMoney(emi)} />
          </div>

          <a
            href={`tel:${application.phone}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-black"
          >
            <Phone className="h-4 w-4" />
            {application.phone}
          </a>

          <Detail title="KYC">
            {application.dateOfBirth && <Row k="Date of birth" v={new Date(application.dateOfBirth).toLocaleDateString('en-IN')} />}
            {application.gender && <Row k="Gender" v={application.gender} />}
            {application.maritalStatus && <Row k="Marital status" v={application.maritalStatus} />}
            {application.email && <Row k="Email" v={application.email} />}
            {application.panNumber && <Row k="PAN" v={application.panNumber} />}
            {application.aadhaarNumber && <Row k="Aadhaar" v={application.aadhaarNumber} />}
            {application.address && <Row k="Address" v={application.address} />}
          </Detail>

          <Detail title="Employment & income">
            <Row k="Employment" v={application.employmentType === 'salaried' ? 'Salaried' : 'Self-employed'} />
            {application.employerName && (
              <Row k={application.employmentType === 'self-employed' ? 'Business' : 'Employer'} v={application.employerName} />
            )}
            {application.designation && (
              <Row k={application.employmentType === 'self-employed' ? 'Nature of business' : 'Designation'} v={application.designation} />
            )}
            <Row k="Existing EMIs" v={formatMoney(application.existingEmi || 0)} />
            {application.creditScore && <Row k="Credit score" v={application.creditScore} />}
          </Detail>

          <Detail title={`Loan details${loanTypeLabel ? ` · ${loanTypeLabel}` : ''}`}>
            {application.purpose && <Row k="Purpose" v={application.purpose} />}
            {group === 'home' && <Row k="Property value" v={formatMoney(application.propertyValue || 0)} />}
            {group === 'home' && application.propertyLocation && <Row k="Property location" v={application.propertyLocation} />}
            {Object.entries(application.loanDetails || {})
              .filter(([, v]) => v !== '' && v != null)
              .map(([k, v]) => <Row key={k} k={extraLabel(k)} v={v} />)}
          </Detail>

          {application.documents?.length > 0 && (
            <Detail title={`Documents (${application.documents.length})`}>
              <ul className="space-y-1.5">
                {application.documents.map((d, i) => (
                  <li key={i}>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                    >
                      <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
                      {d.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Detail>
          )}

          {application.status === 'sanctioned' || application.status === 'disbursed' ? (
            <Detail title="Sanction">
              <Row k="Amount" v={formatMoney(application.sanctionedAmount)} />
              <Row k="Rate" v={application.sanctionedRate ? `${application.sanctionedRate}%` : '—'} />
            </Detail>
          ) : null}

          {/* Move the file along */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-600">Update stage</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary cursor-pointer"
            >
              {STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            {status === 'sanctioned' && (
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <input
                  type="number" value={sanctionedAmount} onChange={(e) => setSanctionedAmount(e.target.value)}
                  placeholder="Sanctioned amount"
                  className="rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                  type="number" step="0.05" value={sanctionedRate} onChange={(e) => setSanctionedRate(e.target.value)}
                  placeholder="Rate %"
                  className="rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            )}

            <textarea
              value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="Add a note (optional)"
              className="mt-2.5 w-full resize-none rounded-xl border border-slate-200 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />

            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => act({
                  action: 'updateStatus', status, note,
                  sanctionedAmount: sanctionedAmount ? Number(sanctionedAmount) : undefined,
                  sanctionedRate: sanctionedRate ? Number(sanctionedRate) : undefined,
                })}
                disabled={saving || status === application.status}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-btn-text hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving…' : 'Update stage'}
              </button>
              <button
                onClick={() => act({ action: 'addNote', note })}
                disabled={saving || !note.trim()}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Note only
              </button>
            </div>

            {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
          </div>

          <Detail title={`History (${timeline.length})`}>
            <ol className="space-y-2.5">
              {timeline.map((h, i) => (
                <li key={i} className="border-l-2 border-primary/30 pl-3">
                  <p className="text-xs font-bold text-slate-800">
                    {STAGE_MAP[h.to]?.label || h.to}
                    {h.from && <span className="font-normal text-slate-400"> · from {STAGE_MAP[h.from]?.label || h.from}</span>}
                  </p>
                  {h.note && <p className="mt-0.5 text-xs text-slate-600">{h.note}</p>}
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {new Date(h.changedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </li>
              ))}
            </ol>
          </Detail>

          {application.notes?.length > 0 && (
            <Detail title={`Notes (${application.notes.length})`}>
              <ol className="space-y-2">
                {[...application.notes].reverse().map((n, i) => (
                  <li key={i} className="rounded-xl bg-slate-50 p-2.5">
                    <p className="text-xs text-slate-800">{n.content}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {new Date(n.addedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {n.addedBy}
                    </p>
                  </li>
                ))}
              </ol>
            </Detail>
          )}
        </div>
      </aside>
    </div>
  );
}

function Tile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function Detail({ title, children }) {
  return (
    <section>
      <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h4>
      {children}
    </section>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-1.5 text-xs last:border-0">
      <span className="text-slate-500">{k}</span>
      <span className="font-semibold text-slate-800">{v}</span>
    </div>
  );
}
