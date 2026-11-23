'use client';

import { useState } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { LOAN_CATEGORY_GROUPS, LOAN_TYPE_LABELS } from '@/lib/loanCategories';

const EMPTY = {
  lenderName: '', productName: '', loanType: 'home-loan',
  interestRateMin: 8.5, interestRateMax: 9.5, rateType: 'floating',
  processingFeePercent: 0.5, processingFeeMin: 0, processingFeeMax: 0,
  minLoanAmount: 500000, maxLoanAmount: 50000000,
  minTenureYears: 1, maxTenureYears: 30, maxLtvPercent: 80,
  minMonthlyIncome: 25000, minCreditScore: 700, minAge: 21, maxAge: 65,
  eligibleEmployment: 'both',
  prepaymentCharges: 'Nil for floating rate loans',
  features: [], documentsRequired: [],
  description: '', isActive: true, isFeatured: false, displayOrder: 0,
};

export default function LoanProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product ? { ...EMPTY, ...product } : EMPTY);
  const [featureDraft, setFeatureDraft] = useState('');
  const [docDraft, setDocDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [k]: v }));
  };
  const setNum = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value === '' ? '' : Number(e.target.value) }));

  const addTo = (key, value, clear) => {
    const v = value.trim();
    if (!v) return;
    setForm((p) => ({ ...p, [key]: [...(p[key] || []), v] }));
    clear('');
  };

  const save = async () => {
    if (!form.lenderName.trim() || !form.productName.trim()) {
      setError('Lender name and product name are required.');
      return;
    }
    if (Number(form.interestRateMax) < Number(form.interestRateMin)) {
      setError('Maximum interest rate cannot be lower than the minimum.');
      return;
    }
    if (Number(form.maxLoanAmount) < Number(form.minLoanAmount)) {
      setError('Maximum loan amount cannot be lower than the minimum.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(product ? `/api/loans/${product._id}` : '/api/loans', {
        method: product ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not save');
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const input =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-surface';
  const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-base font-bold text-slate-900">
            {product ? 'Edit loan offer' : 'Add loan offer'}
          </h3>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <Section title="Lender">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label}>Lender name</label>
                <input value={form.lenderName} onChange={set('lenderName')} className={input} placeholder="State Bank of India" />
              </div>
              <div>
                <label className={label}>Product name</label>
                <input value={form.productName} onChange={set('productName')} className={input} placeholder="SBI Regular Home Loan" />
              </div>
              <div>
                <label className={label}>Loan type</label>
                <select value={form.loanType} onChange={set('loanType')} className={`${input} cursor-pointer`}>
                  {Object.entries(LOAN_CATEGORY_GROUPS).map(([group, { label: groupLabel, types }]) => (
                    <optgroup key={group} label={groupLabel}>
                      {types.map((t) => <option key={t} value={t}>{LOAN_TYPE_LABELS[t]}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Lender logo URL <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                <input value={form.lenderLogo || ''} onChange={set('lenderLogo')} className={input} placeholder="https://…" />
              </div>
            </div>
          </Section>

          <Section title="Rates &amp; fees" hint="Lenders publish a band; the customer's actual rate depends on their profile.">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={label}>Interest from (%)</label>
                <input type="number" step="0.05" value={form.interestRateMin} onChange={setNum('interestRateMin')} className={input} />
              </div>
              <div>
                <label className={label}>Interest up to (%)</label>
                <input type="number" step="0.05" value={form.interestRateMax} onChange={setNum('interestRateMax')} className={input} />
              </div>
              <div>
                <label className={label}>Rate type</label>
                <select value={form.rateType} onChange={set('rateType')} className={`${input} cursor-pointer`}>
                  <option value="floating">Floating</option>
                  <option value="fixed">Fixed</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className={label}>Processing fee (%)</label>
                <input type="number" step="0.05" value={form.processingFeePercent} onChange={setNum('processingFeePercent')} className={input} />
              </div>
              <div>
                <label className={label}>Fee minimum (₹)</label>
                <input type="number" value={form.processingFeeMin} onChange={setNum('processingFeeMin')} className={input} />
              </div>
              <div>
                <label className={label}>Fee maximum (₹)</label>
                <input type="number" value={form.processingFeeMax} onChange={setNum('processingFeeMax')} className={input} />
              </div>
            </div>
          </Section>

          <Section title="Loan limits">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={label}>Minimum amount (₹)</label>
                <input type="number" value={form.minLoanAmount} onChange={setNum('minLoanAmount')} className={input} />
              </div>
              <div>
                <label className={label}>Maximum amount (₹)</label>
                <input type="number" value={form.maxLoanAmount} onChange={setNum('maxLoanAmount')} className={input} />
              </div>
              <div>
                <label className={label}>Max tenure (years)</label>
                <input type="number" value={form.maxTenureYears} onChange={setNum('maxTenureYears')} className={input} />
              </div>
              <div>
                <label className={label}>Max LTV (%)</label>
                <input type="number" value={form.maxLtvPercent} onChange={setNum('maxLtvPercent')} className={input} />
                <p className="mt-1 text-[10px] text-slate-500">Share of property value funded</p>
              </div>
              <div>
                <label className={label}>Prepayment charges</label>
                <input value={form.prepaymentCharges} onChange={set('prepaymentCharges')} className={input} />
              </div>
            </div>
          </Section>

          <Section title="Eligibility" hint="Shown to customers before they apply, so nobody wastes time on an offer they cannot qualify for.">
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className={label}>Min income (₹/mo)</label>
                <input type="number" value={form.minMonthlyIncome} onChange={setNum('minMonthlyIncome')} className={input} />
              </div>
              <div>
                <label className={label}>Min credit score</label>
                <input type="number" value={form.minCreditScore} onChange={setNum('minCreditScore')} className={input} />
              </div>
              <div>
                <label className={label}>Min age</label>
                <input type="number" value={form.minAge} onChange={setNum('minAge')} className={input} />
              </div>
              <div>
                <label className={label}>Max age</label>
                <input type="number" value={form.maxAge} onChange={setNum('maxAge')} className={input} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Open to</label>
                <select value={form.eligibleEmployment} onChange={set('eligibleEmployment')} className={`${input} cursor-pointer`}>
                  <option value="both">Salaried &amp; self-employed</option>
                  <option value="salaried">Salaried only</option>
                  <option value="self-employed">Self-employed only</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Highlights &amp; documents">
            <TagList
              label="Key features"
              placeholder="e.g. No prepayment charges"
              items={form.features}
              draft={featureDraft}
              setDraft={setFeatureDraft}
              onAdd={() => addTo('features', featureDraft, setFeatureDraft)}
              onRemove={(i) => setForm((p) => ({ ...p, features: p.features.filter((_, x) => x !== i) }))}
            />
            <TagList
              label="Documents required"
              placeholder="e.g. 3 months salary slips"
              items={form.documentsRequired}
              draft={docDraft}
              setDraft={setDocDraft}
              onAdd={() => addTo('documentsRequired', docDraft, setDocDraft)}
              onRemove={(i) => setForm((p) => ({ ...p, documentsRequired: p.documentsRequired.filter((_, x) => x !== i) }))}
            />
            <div>
              <label className={label}>Description</label>
              <textarea value={form.description} onChange={set('description')} rows={2} className={`${input} resize-none`} placeholder="Anything a customer should know about this offer" />
            </div>
          </Section>

          <Section title="Visibility">
            <div className="flex flex-wrap items-center gap-5">
              <Toggle checked={form.isActive} onChange={set('isActive')} label="Live on the loans page" />
              <Toggle checked={form.isFeatured} onChange={set('isFeatured')} label="Mark as popular" />
              <div className="w-28">
                <label className={label}>Sort order</label>
                <input type="number" value={form.displayOrder} onChange={setNum('displayOrder')} className={input} />
              </div>
            </div>
          </Section>

          {error && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-btn-text hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {product ? 'Save changes' : 'Add offer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <section>
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900" dangerouslySetInnerHTML={{ __html: title }} />
      {hint && <p className="mb-2.5 mt-0.5 text-[11px] text-slate-500">{hint}</p>}
      <div className={hint ? 'space-y-3' : 'mt-2.5 space-y-3'}>{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-primary cursor-pointer" />
      {label}
    </label>
  );
}

function TagList({ label, placeholder, items = [], draft, setDraft, onAdd, onRemove }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-600">{label}</label>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:bg-surface"
        />
        <button type="button" onClick={onAdd} className="shrink-0 rounded-xl bg-primary px-3 text-btn-text hover:bg-primary-dark cursor-pointer">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <button
              key={`${item}-${i}`}
              type="button"
              onClick={() => onRemove(i)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 cursor-pointer"
            >
              {item}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
