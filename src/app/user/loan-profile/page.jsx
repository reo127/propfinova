'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import PersonalStep from '../../components/loan-form/PersonalStep';
import EmploymentStep from '../../components/loan-form/EmploymentStep';
import DocumentsStep from '../../components/loan-form/DocumentsStep';

const EMPTY = {
  applicantName: '',
  dateOfBirth: '', gender: '', maritalStatus: '', address: '',
  panNumber: '', aadhaarNumber: '',
  employmentType: 'salaried', employerName: '', designation: '',
  monthlyIncome: '', existingEmi: 0, workExperienceYears: '', creditScore: '',
  documents: [],
};

/**
 * Standalone editor for the reusable loan KYC/employment/document profile —
 * the same data a loan application prefills from, viewable and editable
 * outside of any specific application. Reuses the same step components as
 * LoanApplyModal (src/app/components/loan-form/*) so the two never drift.
 */
export default function LoanProfilePage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    let storedUser = null;
    try { storedUser = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}

    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);

    fetch('/api/loan-profile', { headers: { Authorization: `Bearer ${storedToken}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) return;
        const p = d.data;
        setForm((prev) => ({
          ...prev,
          applicantName: p.fullName || storedUser?.name || '',
          dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '',
          gender: p.gender || '',
          maritalStatus: p.maritalStatus || '',
          address: p.address || '',
          panNumber: p.panNumber || '',
          aadhaarNumber: p.aadhaarNumber || '',
          employmentType: p.employmentType || 'salaried',
          employerName: p.employerName || '',
          designation: p.designation || '',
          monthlyIncome: p.monthlyIncome || '',
          existingEmi: p.existingEmi || 0,
          workExperienceYears: p.workExperienceYears || '',
          creditScore: p.creditScore ?? '',
          documents: p.documents || [],
        }));
      })
      .finally(() => setLoading(false));
  }, [router]);

  const set = (key) => (value) => setForm((p) => ({ ...p, [key]: value }));
  const setDocuments = (updater) =>
    setForm((p) => ({ ...p, documents: typeof updater === 'function' ? updater(p.documents) : updater }));

  const save = async () => {
    setError('');
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/loan-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: form.applicantName.trim(),
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender,
          maritalStatus: form.maritalStatus,
          address: form.address.trim(),
          panNumber: form.panNumber.trim(),
          aadhaarNumber: form.aadhaarNumber.trim(),
          employmentType: form.employmentType,
          employerName: form.employerName.trim(),
          designation: form.designation.trim(),
          monthlyIncome: Number(form.monthlyIncome) || 0,
          existingEmi: Number(form.existingEmi) || 0,
          workExperienceYears: Number(form.workExperienceYears) || 0,
          creditScore: form.creditScore ? Number(form.creditScore) : null,
          documents: form.documents,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not save your profile');
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/user" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" />
        My Account
      </Link>
      <h1 className="mt-2 text-3xl font-bold text-secondary mb-2">My Loan Profile</h1>
      <p className="text-muted mb-8">
        Saved once, reused on every loan application so you don&apos;t have to retype it.
      </p>

      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-bold text-secondary">Personal details</h2>
          <PersonalStep form={form} set={set} showContact={false} />
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-bold text-secondary">Employment & income</h2>
          <EmploymentStep form={form} set={set} />
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-sm font-bold text-secondary">Documents</h2>
          <DocumentsStep group="other" documents={form.documents} setDocuments={setDocuments} token={token} />
        </section>

        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-btn-text transition-colors hover:bg-primary-dark disabled:opacity-60 cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}
