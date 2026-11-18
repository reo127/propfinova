'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Landmark, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, FileText, Star,
} from 'lucide-react';
import { formatMoney } from '@/lib/loanMath';
import LoanProductModal from '@/app/components/LoanProductModal';

export default function AdminLoansPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // product object, or 'new'
  const [busyId, setBusyId] = useState(null);

  const token = () => localStorage.getItem('token');

  const load = useCallback(async () => {
    try {
      // `all=true` includes paused offers, which the public list hides.
      const res = await fetch('/api/loans?all=true', {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setProducts(data?.success ? data.data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (p) => {
    setBusyId(p._id);
    try {
      await fetch(`/api/loans/${p._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Remove "${p.lenderName} — ${p.productName}"? Applications already submitted against it are kept.`)) return;
    setBusyId(p._id);
    try {
      await fetch(`/api/loans/${p._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Landmark className="h-6 w-6 text-primary" />
            Loan Offers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Partner bank and NBFC products shown to customers on the loans page.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/loans/applications"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-surface px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-primary hover:text-primary"
          >
            <FileText className="h-4 w-4" />
            Applications
          </Link>
          <button
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-btn-text transition-colors hover:bg-primary-dark cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add offer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-surface py-20 text-center">
          <Landmark className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700">No loan offers yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Add the bank products you want customers to compare and apply for.
          </p>
          <button
            onClick={() => setEditing('new')}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-btn-text hover:bg-primary-dark cursor-pointer"
          >
            Add your first offer
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3 font-bold">Lender &amp; product</th>
                <th className="px-4 py-3 font-bold">Interest</th>
                <th className="px-4 py-3 font-bold">Loan range</th>
                <th className="px-4 py-3 font-bold">Max tenure</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p._id} className={p.isActive ? '' : 'bg-slate-50/60'}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{p.lenderName}</span>
                      {p.isFeatured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    </div>
                    <p className="text-xs text-slate-500">{p.productName}</p>
                  </td>
                  <td className="px-4 py-3.5 font-semibold tabular-nums text-slate-700">
                    {p.interestRateMin}% – {p.interestRateMax}%
                  </td>
                  <td className="px-4 py-3.5 text-xs tabular-nums text-slate-600">
                    {formatMoney(p.minLoanAmount)} – {formatMoney(p.maxLoanAmount)}
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-slate-700">{p.maxTenureYears} yrs</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {p.isActive ? 'Live' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleActive(p)}
                        disabled={busyId === p._id}
                        title={p.isActive ? 'Hide from customers' : 'Show to customers'}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                      >
                        {p.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setEditing(p)}
                        title="Edit"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(p)}
                        disabled={busyId === p._id}
                        title="Remove"
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <LoanProductModal
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
