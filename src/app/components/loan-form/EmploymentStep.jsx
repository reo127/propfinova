'use client';

import { input, label } from './styles';

/**
 * Employment & income fields — step 2 of the loan apply flow and the second
 * section of the standalone "My Loan Profile" editor. Employer/designation
 * labels swap to business-flavored copy for self-employed applicants rather
 * than being two separate field sets.
 */
export default function EmploymentStep({ form, set }) {
  const selfEmployed = form.employmentType === 'self-employed';

  return (
    <div className="space-y-3.5">
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
              onClick={() => set('employmentType')(v)}
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>
            {selfEmployed ? 'Business name' : 'Employer'} <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>
          <input
            value={form.employerName}
            onChange={(e) => set('employerName')(e.target.value)}
            className={input}
            placeholder={selfEmployed ? 'Business name' : 'Company name'}
          />
        </div>
        <div>
          <label className={label}>
            {selfEmployed ? 'Nature of business' : 'Designation'} <span className="font-normal normal-case text-slate-400">(optional)</span>
          </label>
          <input
            value={form.designation}
            onChange={(e) => set('designation')(e.target.value)}
            className={input}
            placeholder={selfEmployed ? 'e.g. Retail, Manufacturing' : 'e.g. Manager'}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Monthly income (₹)</label>
          <input type="number" value={form.monthlyIncome} onChange={(e) => set('monthlyIncome')(e.target.value)} className={input} placeholder="80000" />
        </div>
        <div>
          <label className={label}>Existing EMIs (₹)</label>
          <input type="number" value={form.existingEmi} onChange={(e) => set('existingEmi')(e.target.value)} className={input} placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>{selfEmployed ? 'Years in business' : 'Work experience (years)'}</label>
          <input
            type="number"
            value={form.workExperienceYears}
            onChange={(e) => set('workExperienceYears')(e.target.value)}
            className={input}
            placeholder="3"
          />
        </div>
        <div>
          <label className={label}>Credit score <span className="font-normal normal-case text-slate-400">(if known)</span></label>
          <input type="number" value={form.creditScore} onChange={(e) => set('creditScore')(e.target.value)} className={input} placeholder="750" />
        </div>
      </div>
    </div>
  );
}
