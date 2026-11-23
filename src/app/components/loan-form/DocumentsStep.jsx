'use client';

import { useState } from 'react';
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import { DOCUMENT_SLOTS_BY_GROUP } from '@/lib/loanCategories';

/**
 * Document upload slots — step 4 of the apply flow, and the documents
 * section of the standalone "My Loan Profile" editor. Slots already present
 * in `documents` (matched by `type`) render as uploaded, so a returning
 * applicant never re-uploads what's already on file — only "Replace" if
 * they want to swap it.
 */
export default function DocumentsStep({ group, documents, setDocuments, token }) {
  const slots = DOCUMENT_SLOTS_BY_GROUP[group] || DOCUMENT_SLOTS_BY_GROUP.other;
  const [uploadingType, setUploadingType] = useState('');
  const [error, setError] = useState('');

  const docFor = (type) => documents.find((d) => d.type === type);

  const upload = async (type, slotLabel, file) => {
    if (!file) return;
    setError('');
    setUploadingType(type);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not upload file');
      setDocuments((prev) => [
        ...prev.filter((d) => d.type !== type),
        { type, label: slotLabel, url: data.url, uploadedAt: new Date().toISOString() },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingType('');
    }
  };

  return (
    <div className="space-y-2.5">
      {slots.map(({ type, label: slotLabel }) => {
        const doc = docFor(type);
        const uploading = uploadingType === type;
        return (
          <div key={type} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              {doc ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <UploadCloud className="h-5 w-5 shrink-0 text-slate-400" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">{slotLabel}</p>
                {doc && <p className="truncate text-xs text-slate-500">Uploaded</p>}
              </div>
            </div>
            <label className="shrink-0 cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : doc ? 'Replace' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => upload(type, slotLabel, e.target.files?.[0])}
              />
            </label>
          </div>
        );
      })}
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
}
