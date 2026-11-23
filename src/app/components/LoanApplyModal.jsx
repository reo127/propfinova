'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, CheckCircle2, ShieldCheck, AlertCircle, Pencil } from 'lucide-react';
import { checkEligibilityGates, formatMoney } from '@/lib/loanMath';
import { groupForLoanType, EXTRA_FIELDS_BY_GROUP, PURPOSE_OPTIONS_BY_GROUP } from '@/lib/loanCategories';
import PersonalStep from './loan-form/PersonalStep';
import EmploymentStep from './loan-form/EmploymentStep';
import DocumentsStep from './loan-form/DocumentsStep';
import { input, label } from './loan-form/styles';

const STEP_TITLES = ['Personal details', 'Employment & income', 'Loan details', 'Documents', 'Review & submit'];

const emptyForm = (prefill) => ({
  applicantName: '', phone: '', email: '',
  dateOfBirth: '', gender: '', maritalStatus: '', address: '',
  panNumber: '', aadhaarNumber: '',
  employmentType: 'salaried', employerName: '', designation: '',
  monthlyIncome: prefill.monthlyIncome || '', existingEmi: prefill.existingEmi || 0,
  workExperienceYears: '', creditScore: '',
  loanAmount: prefill.loanAmount || '', tenureYears: prefill.tenureYears || 20, purpose: '',
  propertyValue: prefill.propertyValue || '', propertyLocation: '',
  loanDetails: {},
  documents: [],
});

/**
 * Loan application — a 5-step flow (personal/KYC, employment & income, loan
 * details, documents, review) matching how PaisaBazaar-style aggregators
 * structure an application. Requires login: a signed-in user's KYC/
 * employment/document data is saved to their account (src/models/LoanProfile)
 * and prefilled here on every later application, landing straight on Review
 * instead of asking them to retype it.
 */
export default function LoanApplyModal({ product, prefill = {}, onClose }) {
  const group = groupForLoanType(product.loanType);
  const extraFields = EXTRA_FIELDS_BY_GROUP[group] || [];
  const purposeOptions = PURPOSE_OPTIONS_BY_GROUP[group];

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [form, setForm] = useState(() => emptyForm(prefill));
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Seed from the account first (name/phone/email), then layer the saved
  // loan profile on top if one exists — and if it does, skip straight to
  // Review instead of making the applicant retype everything.
  useEffect(() => {
    let storedUser = null;
    try { storedUser = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}
    if (storedUser) {
      setForm((p) => ({
        ...p,
        applicantName: storedUser.name || p.applicantName,
        phone: storedUser.phone || p.phone,
        email: storedUser.email || p.email,
      }));
    }

    if (!token) return;
    let active = true;
    fetch('/api/loan-profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d?.success) return;
        const p = d.data;
        const hasProfile = Boolean(p?.fullName || p?.panNumber || p?.monthlyIncome || p?.documents?.length);
        if (!hasProfile) return;
        setForm((prev) => ({
          ...prev,
          applicantName: p.fullName || prev.applicantName,
          dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '',
          gender: p.gender || '',
          maritalStatus: p.maritalStatus || '',
          address: p.address || '',
          panNumber: p.panNumber || '',
          aadhaarNumber: p.aadhaarNumber || '',
          employmentType: p.employmentType || 'salaried',
          employerName: p.employerName || '',
          designation: p.designation || '',
          monthlyIncome: p.monthlyIncome || prev.monthlyIncome,
          existingEmi: p.existingEmi || prev.existingEmi,
          workExperienceYears: p.workExperienceYears || '',
          creditScore: p.creditScore ?? '',
          documents: p.documents || [],
        }));
        setStep(5);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [token]);

  const set = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));
  const setDetail = (key) => (value) => setForm((p) => ({ ...p, loanDetails: { ...p.loanDetails, [key]: value } }));
  const setDocuments = (updater) =>
    setForm((p) => ({ ...p, documents: typeof updater === 'function' ? updater(p.documents) : updater }));

  const gates = checkEligibilityGates(product, {
    monthlyIncome: Number(form.monthlyIncome) || 0,
    creditScore: Number(form.creditScore) || null,
    employmentType: form.employmentType,
    loanAmount: Number(form.loanAmount) || 0,
  });

  const validateStep = (n) => {
    if (n === 1) {
      if (!form.applicantName.trim()) return 'Please enter your full name.';
      if (!/^\d{10}$/.test(form.phone)) return 'Please enter a valid 10-digit phone number.';
    }
    if (n === 2) {
      if (!form.monthlyIncome || Number(form.monthlyIncome) <= 0) return 'Please enter your monthly income.';
    }
    if (n === 3) {
      if (!form.loanAmount || Number(form.loanAmount) <= 0) return 'Please enter the loan amount you need.';
    }
    return '';
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, 5));
  };

  const submit = async () => {
    for (const n of [1, 2, 3]) {
      const err = validateStep(n);
      if (err) { setError(err); setStep(n); return; }
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/loan-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          loanProduct: product._id,
          applicantName: form.applicantName.trim(),
          phone: form.phone,
          email: form.email.trim(),
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender,
          maritalStatus: form.maritalStatus,
          address: form.address.trim(),
          panNumber: form.panNumber.trim(),
          aadhaarNumber: form.aadhaarNumber.trim(),
          employmentType: form.employmentType,
          employerName: form.employerName.trim(),
          designation: form.designation.trim(),
          monthlyIncome: Number(form.monthlyIncome),
          existingEmi: Number(form.existingEmi) || 0,
          workExperienceYears: Number(form.workExperienceYears) || 0,
          creditScore: form.creditScore ? Number(form.creditScore) : null,
          loanAmount: Number(form.loanAmount),
          tenureYears: Number(form.tenureYears),
          purpose: form.purpose,
          propertyValue: Number(form.propertyValue) || 0,
          propertyLocation: form.propertyLocation.trim(),
          loanDetails: form.loanDetails,
          documents: form.documents,
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
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`h-1 flex-1 rounded-full ${n <= step ? 'bg-primary' : 'bg-slate-200'}`} />
              ))}
            </div>
            <p className="px-5 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Step {step} of 5 · {STEP_TITLES[step - 1]}
            </p>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {step === 1 && <PersonalStep form={form} set={set} />}
              {step === 2 && <EmploymentStep form={form} set={set} />}

              {step === 3 && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={label}>Loan needed (₹)</label>
                      <input type="number" value={form.loanAmount} onChange={(e) => set('loanAmount')(e.target.value)} className={input} placeholder="4000000" />
                    </div>
                    <div>
                      <label className={label}>Tenure (years)</label>
                      <input
                        type="number"
                        value={form.tenureYears}
                        onChange={(e) => set('tenureYears')(e.target.value)}
                        className={input}
                        min={1}
                        max={product.maxTenureYears}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={label}>Purpose</label>
                    {purposeOptions ? (
                      <select value={form.purpose} onChange={(e) => set('purpose')(e.target.value)} className={`${input} cursor-pointer`}>
                        <option value="">Select</option>
                        {purposeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input value={form.purpose} onChange={(e) => set('purpose')(e.target.value)} className={input} placeholder="What is this loan for?" />
                    )}
                  </div>

                  {group === 'home' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={label}>Property value (₹)</label>
                        <input type="number" value={form.propertyValue} onChange={(e) => set('propertyValue')(e.target.value)} className={input} placeholder="5000000" />
                      </div>
                      <div>
                        <label className={label}>Property location</label>
                        <input value={form.propertyLocation} onChange={(e) => set('propertyLocation')(e.target.value)} className={input} placeholder="Whitefield, Bangalore" />
                      </div>
                    </div>
                  )}

                  {extraFields.map((f) => (
                    <div key={f.key}>
                      <label className={label}>{f.label}</label>
                      {f.type === 'select' ? (
                        <select
                          value={form.loanDetails[f.key] || ''}
                          onChange={(e) => setDetail(f.key)(e.target.value)}
                          className={`${input} cursor-pointer`}
                        >
                          <option value="">Select</option>
                          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          value={form.loanDetails[f.key] || ''}
                          onChange={(e) => setDetail(f.key)(e.target.value)}
                          className={input}
                          placeholder={f.placeholder}
                        />
                      )}
                    </div>
                  ))}

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

              {step === 4 && <DocumentsStep group={group} documents={form.documents} setDocuments={setDocuments} token={token} />}

              {step === 5 && (
                <ReviewStep
                  form={form}
                  group={group}
                  extraFields={extraFields}
                  product={product}
                  onEdit={setStep}
                />
              )}

              {error && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              <div className="flex gap-2.5">
                {step > 1 && (
                  <button
                    onClick={() => { setStep((s) => s - 1); setError(''); }}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={step === 5 ? submit : goNext}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-btn-text transition-colors hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {step === 5 ? (submitting ? 'Submitting…' : 'Confirm & submit') : 'Continue'}
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

function ReviewStep({ form, group, extraFields, product, onEdit }) {
  const row = (l, v) => (v ? <p className="text-sm text-slate-700"><span className="text-slate-500">{l}: </span>{v}</p> : null);

  return (
    <div className="space-y-4">
      <Section title="Personal details" onEdit={() => onEdit(1)}>
        {row('Name', form.applicantName)}
        {row('Phone', form.phone)}
        {row('Email', form.email)}
        {row('Date of birth', form.dateOfBirth)}
        {row('PAN', form.panNumber)}
        {row('Aadhaar', form.aadhaarNumber)}
        {row('Address', form.address)}
      </Section>

      <Section title="Employment & income" onEdit={() => onEdit(2)}>
        {row('Employment type', form.employmentType === 'self-employed' ? 'Self-employed' : 'Salaried')}
        {row(form.employmentType === 'self-employed' ? 'Business' : 'Employer', form.employerName)}
        {row('Monthly income', form.monthlyIncome ? formatMoney(Number(form.monthlyIncome)) : '')}
        {row('Existing EMIs', form.existingEmi ? formatMoney(Number(form.existingEmi)) : '')}
      </Section>

      <Section title="Loan details" onEdit={() => onEdit(3)}>
        {row('Lender', `${product.lenderName} · ${product.productName}`)}
        {row('Loan amount', form.loanAmount ? formatMoney(Number(form.loanAmount)) : '')}
        {row('Tenure', form.tenureYears ? `${form.tenureYears} years` : '')}
        {row('Purpose', form.purpose)}
        {group === 'home' && row('Property value', form.propertyValue ? formatMoney(Number(form.propertyValue)) : '')}
        {group === 'home' && row('Property location', form.propertyLocation)}
        {extraFields.map((f) => row(f.label, form.loanDetails[f.key]))}
      </Section>

      <Section title="Documents" onEdit={() => onEdit(4)}>
        {form.documents.length ? (
          <p className="text-sm text-slate-700">{form.documents.length} document{form.documents.length > 1 ? 's' : ''} attached</p>
        ) : (
          <p className="text-sm text-amber-700">No documents uploaded yet</p>
        )}
      </Section>
    </div>
  );
}

function Section({ title, onEdit, children }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <button onClick={onEdit} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer">
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
