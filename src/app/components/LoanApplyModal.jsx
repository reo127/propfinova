'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { checkEligibilityGates, formatMoney } from '@/lib/loanMath';

/**
 * Loan application form.
 *
 * Open to guests on purpose — the same reasoning as property enquiries, where
 * requiring an account first would simply lose applications. If the visitor
 * happens to be signed in the token is sent, which links the application to
 * their account so they can track it.
 */
export default function LoanApplyModal({ product, prefill = {}, onClose }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    applicantName: '',
    phone: '',
    email: '',
    panNumber: '',
    employmentType: 'salaried',
    employerName: '',
    monthlyIncome: prefill.monthlyIncome || '',
    existingEmi: prefill.existingEmi || 0,
    creditScore: '',
    loanAmount: prefill.loanAmount || '',
    tenureYears: prefill.tenureYears || 20,
    propertyValue: prefill.propertyValue || '',
    propertyLocation: '',
  });

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const gates = checkEligibilityGates(product, {
    monthlyIncome: Number(form.monthlyIncome) || 0,
    creditScore: Number(form.creditScore) || null,
    employmentType: form.employmentType,
    loanAmount: Number(form.loanAmount) || 0,
  });

  const validateStep1 = () => {
    if (!form.applicantName.trim()) return 'Please enter your full name.';
    if (!/^\d{10}$/.test(form.phone)) return 'Please enter a valid 10-digit phone number.';
    return '';
  };

  const submit = async () => {
    if (!form.monthlyIncome || Number(form.monthlyIncome) <= 0) {
      setError('Please enter your monthly income.');
      return;
    }
    if (!form.loanAmount || Number(form.loanAmount) <= 0) {
      setError('Please enter the loan amount you need.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/loan-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          loanProduct: product._id,
          applicantName: form.applicantName.trim(),
          phone: form.phone,
          email: form.email.trim(),
          panNumber: form.panNumber.trim(),
          employmentType: form.employmentType,
          employerName: form.employerName.trim(),
          monthlyIncome: Number(form.monthlyIncome),
          existingEmi: Number(form.existingEmi) || 0,
          creditScore: form.creditScore ? Number(form.creditScore) : null,
          loanAmount: Number(form.loanAmount),
          tenureYears: Number(form.tenureYears),
          propertyValue: Number(form.propertyValue) || 0,
          propertyLocation: form.propertyLocation.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not submit application');
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const input =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder-slate-400 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10';
  const label = 'mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-600';

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl">
        {done ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Application submitted</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
              Our loan team will call you within one working day to collect documents and take
              this forward with {product.lenderName}.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold text-btn-text transition-colors hover:bg-primary-dark cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-slate-900">
                  Apply · {product.lenderName}
                </h3>
                <p className="truncate text-xs text-slate-500">
                  {product.productName} · from {product.interestRateMin}% p.a.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-1.5 px-5 pt-3">
              {[1, 2].map((n) => (
                <span
                  key={n}
                  className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-primary' : 'bg-slate-200'}`}
                />
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {step === 1 ? (
                <div className="space-y-3.5">
                  <div>
                    <label className={label}>Full name</label>
                    <input value={form.applicantName} onChange={set('applicantName')} className={input} placeholder="As on your PAN card" />
                  </div>
                  <div>
                    <label className={label}>Phone number</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">+91</span>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        className={`${input} pl-12`}
                        placeholder="98765 43210"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Email <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                      <input type="email" value={form.email} onChange={set('email')} className={input} placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className={label}>PAN <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                      <input value={form.panNumber} onChange={set('panNumber')} className={`${input} uppercase`} placeholder="ABCDE1234F" maxLength={10} />
                    </div>
                  </div>

                  <div>
                    <label className={label}>I am</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { v: 'salaried', l: 'Salaried' },
                        { v: 'self-employed', l: 'Self-employed' },
                      ].map(({ v, l }) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, employmentType: v }))}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                            form.employmentType === v
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-slate-200 bg-surface text-slate-700 hover:border-primary/40'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Monthly income (₹)</label>
                      <input type="number" value={form.monthlyIncome} onChange={set('monthlyIncome')} className={input} placeholder="80000" />
                    </div>
                    <div>
                      <label className={label}>Existing EMIs (₹)</label>
                      <input type="number" value={form.existingEmi} onChange={set('existingEmi')} className={input} placeholder="0" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Loan needed (₹)</label>
                      <input type="number" value={form.loanAmount} onChange={set('loanAmount')} className={input} placeholder="4000000" />
                    </div>
                    <div>
                      <label className={label}>Tenure (years)</label>
                      <input type="number" value={form.tenureYears} onChange={set('tenureYears')} className={input} min={1} max={product.maxTenureYears} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Property value (₹)</label>
                      <input type="number" value={form.propertyValue} onChange={set('propertyValue')} className={input} placeholder="5000000" />
                    </div>
                    <div>
                      <label className={label}>Credit score <span className="font-normal normal-case text-slate-400">(if known)</span></label>
                      <input type="number" value={form.creditScore} onChange={set('creditScore')} className={input} placeholder="750" />
                    </div>
                  </div>

                  <div>
                    <label className={label}>Property location</label>
                    <input value={form.propertyLocation} onChange={set('propertyLocation')} className={input} placeholder="Whitefield, Bangalore" />
                  </div>

                  {form.employmentType === 'salaried' && (
                    <div>
                      <label className={label}>Employer <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                      <input value={form.employerName} onChange={set('employerName')} className={input} placeholder="Company name" />
                    </div>
                  )}

                  {/* Surfaced before submission so a customer is not left waiting
                      on a call to be told they never met a published cut-off. */}
                  {!gates.eligible && gates.reasons.length > 0 && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="text-xs text-amber-800">
                        <p className="font-bold">This offer may not fit</p>
                        <ul className="mt-1 list-inside list-disc space-y-0.5">
                          {gates.reasons.map((r) => <li key={r}>{r}</li>)}
                        </ul>
                        <p className="mt-1.5">You can still apply — we will suggest alternatives.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <div className="flex gap-2.5">
                {step === 2 && (
                  <button
                    onClick={() => { setStep(1); setError(''); }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    if (step === 1) {
                      const err = validateStep1();
                      if (err) { setError(err); return; }
                      setError('');
                      setStep(2);
                    } else {
                      submit();
                    }
                  }}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-btn-text transition-colors hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {step === 1 ? 'Continue' : submitting ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                No fee to apply · We never share your details without consent
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
