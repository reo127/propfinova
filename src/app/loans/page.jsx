'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Landmark, Percent, Clock, Wallet, Check, Loader2, ArrowRight,
  Calculator, ShieldCheck, Info,
} from 'lucide-react';
import { calculateEmi, estimateEligibility, processingFee, formatMoney } from '@/lib/loanMath';
import LoanApplyModal from '../components/LoanApplyModal';

const LOAN_TYPE_LABELS = {
  'home-loan': 'Home Loan',
  'balance-transfer': 'Balance Transfer',
  'plot-loan': 'Plot Loan',
  construction: 'Construction',
  'home-improvement': 'Home Improvement',
  'loan-against-property': 'Loan Against Property',
  'nri-home-loan': 'NRI Home Loan',
};

export default function LoansPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [applyFor, setApplyFor] = useState(null);

  // Drives both the comparison table's EMI column and the eligibility panel,
  // so the figure a customer compares on is the one they are quoted.
  const [calc, setCalc] = useState({
    loanAmount: 4000000,
    tenureYears: 20,
    monthlyIncome: 80000,
    existingEmi: 0,
    propertyValue: 5000000,
  });

  useEffect(() => {
    let active = true;
    fetch('/api/loans')
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setProducts(d?.success ? d.data : []);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const visible = useMemo(
    () => (typeFilter ? products.filter((p) => p.loanType === typeFilter) : products),
    [products, typeFilter]
  );

  const availableTypes = useMemo(
    () => [...new Set(products.map((p) => p.loanType))],
    [products]
  );

  const eligibility = useMemo(
    () =>
      estimateEligibility({
        monthlyIncome: Number(calc.monthlyIncome) || 0,
        existingEmi: Number(calc.existingEmi) || 0,
        tenureYears: Number(calc.tenureYears) || 20,
        propertyValue: Number(calc.propertyValue) || 0,
        annualRatePercent: visible[0]?.interestRateMin || 8.5,
      }),
    [calc, visible]
  );

  const setField = (key) => (e) => setCalc((p) => ({ ...p, [key]: e.target.value }));
  const numberInput =
    'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-semibold text-secondary outline-none focus:border-primary focus:bg-surface';

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-accent">
            <Landmark className="h-3.5 w-3.5" />
            Home Loans
          </span>
          <h1
            className="mt-4 max-w-2xl text-3xl text-white sm:text-4xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Compare home loan offers from trusted lenders
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Check what you qualify for, compare rates and EMIs side by side, and apply in minutes.
            Our team handles the paperwork with the bank.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
          {/* Eligibility calculator */}
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-border bg-surface p-5 shadow-xs">
              <div className="mb-4 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-secondary">What can I borrow?</h2>
              </div>

              <div className="space-y-3">
                <Field label="Monthly income (₹)">
                  <input type="number" value={calc.monthlyIncome} onChange={setField('monthlyIncome')} className={numberInput} />
                </Field>
                <Field label="Existing EMIs (₹)" hint="Car loan, personal loan, credit card EMIs">
                  <input type="number" value={calc.existingEmi} onChange={setField('existingEmi')} className={numberInput} />
                </Field>
                <Field label="Property value (₹)">
                  <input type="number" value={calc.propertyValue} onChange={setField('propertyValue')} className={numberInput} />
                </Field>
                <Field label={`Tenure — ${calc.tenureYears} years`}>
                  <input
                    type="range" min={5} max={30} step={1}
                    value={calc.tenureYears} onChange={setField('tenureYears')}
                    className="w-full accent-primary"
                  />
                </Field>
              </div>

              <div className="mt-5 rounded-2xl bg-primary p-4 text-btn-text">
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                  You could borrow up to
                </p>
                <p className="mt-1 text-3xl font-bold">{formatMoney(eligibility.eligibleAmount)}</p>
                <p className="mt-1 text-xs opacity-80">
                  Affordable EMI about {formatMoney(eligibility.affordableEmi)}/month
                </p>
              </div>

              <dl className="mt-3 space-y-2 text-xs">
                <Row label="Down payment needed" value={formatMoney(eligibility.downPaymentNeeded)} />
                <Row
                  label="Limited by"
                  value={
                    eligibility.limitedBy === 'property-value'
                      ? 'Property value'
                      : eligibility.limitedBy === 'lender-cap'
                      ? 'Lender maximum'
                      : 'Your income'
                  }
                />
              </dl>

              <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-background p-3 text-[11px] leading-relaxed text-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                An estimate based on standard lender rules. Your actual offer depends on credit
                history and the lender&apos;s assessment.
              </p>
            </div>
          </aside>

          {/* Offers */}
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl text-secondary" style={{ fontFamily: 'var(--font-heading)' }}>
                  {loading ? 'Loading offers…' : `${visible.length} ${visible.length === 1 ? 'offer' : 'offers'} available`}
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  EMI shown for {formatMoney(calc.loanAmount)} over {calc.tenureYears} years
                </p>
              </div>

              {availableTypes.length > 1 && (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-secondary outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">All loan types</option>
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>{LOAN_TYPE_LABELS[t] || t}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-5 rounded-2xl border border-border bg-surface p-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                Compare for a loan of {formatMoney(calc.loanAmount)}
              </label>
              <input
                type="range" min={500000} max={30000000} step={100000}
                value={calc.loanAmount} onChange={setField('loanAmount')}
                className="mt-2 w-full accent-primary"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-surface py-16 text-center">
                <Landmark className="mx-auto mb-3 h-9 w-9 text-secondary/25" />
                <p className="font-semibold text-secondary">No loan offers listed yet</p>
                <p className="mt-1 text-sm text-muted">Please check back shortly.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visible.map((p) => (
                  <OfferCard
                    key={p._id}
                    product={p}
                    amount={Number(calc.loanAmount)}
                    tenure={Number(calc.tenureYears)}
                    onApply={() => setApplyFor(p)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {applyFor && (
        <LoanApplyModal
          product={applyFor}
          prefill={calc}
          onClose={() => setApplyFor(null)}
        />
      )}
    </main>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-muted">{hint}</p>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-bold text-secondary">{value}</dd>
    </div>
  );
}

function OfferCard({ product, amount, tenure, onApply }) {
  const cappedTenure = Math.min(tenure, product.maxTenureYears);
  const emi = calculateEmi(amount, product.interestRateMin, cappedTenure);
  const fee = processingFee(amount, product);
  const tooLarge = amount > product.maxLoanAmount;

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xs transition-all hover:border-primary/35 hover:shadow-lg">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-secondary">{product.lenderName}</h3>
            {product.isFeatured && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Popular
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted">{product.productName}</p>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <Stat icon={Percent} label="Interest" value={`${product.interestRateMin}% – ${product.interestRateMax}%`} />
            <Stat icon={Clock} label="Max tenure" value={`${product.maxTenureYears} yrs`} />
            <Stat icon={Wallet} label="Processing fee" value={formatMoney(fee)} />
          </div>

          {product.features?.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {product.features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-center gap-1 text-xs text-muted">
                  <Check className="h-3 w-3 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-border pt-4 sm:w-52 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            EMI from
          </p>
          <p className="text-2xl font-bold tabular-nums text-secondary">
            {formatMoney(emi)}
            <span className="text-xs font-medium text-muted">/mo</span>
          </p>

          {tooLarge ? (
            <p className="mt-1 text-[11px] font-semibold text-amber-600">
              Above this lender&apos;s {formatMoney(product.maxLoanAmount)} cap
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-muted">
              over {cappedTenure} years at {product.interestRateMin}%
            </p>
          )}

          <button
            onClick={onApply}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-btn-text transition-colors hover:bg-primary-dark cursor-pointer"
          >
            Apply now
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted">
            <ShieldCheck className="h-3 w-3" />
            No fee to apply
          </p>
        </div>
      </div>
    </article>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-secondary">{value}</p>
    </div>
  );
}
