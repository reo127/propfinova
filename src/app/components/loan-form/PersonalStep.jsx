'use client';

import { input, label } from './styles';

/**
 * Personal / KYC fields — step 1 of the loan apply flow, and also the first
 * section of the standalone "My Loan Profile" editor. Kept as one component
 * so the two never drift apart.
 *
 * Phone/email aren't part of the reusable LoanProfile (they live on User and
 * are captured per-application instead), so `showContact` is false in the
 * standalone editor — showing them there would let someone "edit" a value
 * that's silently discarded on save.
 */
export default function PersonalStep({ form, set, showContact = true }) {
  return (
    <div className="space-y-3.5">
      <div>
        <label className={label}>Full name</label>
        <input
          value={form.applicantName}
          onChange={(e) => set('applicantName')(e.target.value)}
          className={input}
          placeholder="As on your PAN card"
        />
      </div>

      {showContact && (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Phone number</label>
          <input
            value={form.phone}
            onChange={(e) => set('phone')(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={input}
            placeholder="98765 43210"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className={label}>Email <span className="font-normal normal-case text-slate-400">(optional)</span></label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
            className={input}
            placeholder="you@example.com"
          />
        </div>
      </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Date of birth</label>
          <input
            type="date"
            value={form.dateOfBirth || ''}
            onChange={(e) => set('dateOfBirth')(e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label className={label}>Gender</label>
          <select value={form.gender} onChange={(e) => set('gender')(e.target.value)} className={`${input} cursor-pointer`}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Marital status</label>
          <select value={form.maritalStatus} onChange={(e) => set('maritalStatus')(e.target.value)} className={`${input} cursor-pointer`}>
            <option value="">Select</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={label}>PAN</label>
          <input
            value={form.panNumber}
            onChange={(e) => set('panNumber')(e.target.value.toUpperCase())}
            className={`${input} uppercase`}
            placeholder="ABCDE1234F"
            maxLength={10}
          />
        </div>
      </div>

      <div>
        <label className={label}>Aadhaar number</label>
        <input
          value={form.aadhaarNumber}
          onChange={(e) => set('aadhaarNumber')(e.target.value.replace(/\D/g, '').slice(0, 12))}
          className={input}
          placeholder="XXXX XXXX XXXX"
          inputMode="numeric"
        />
      </div>

      <div>
        <label className={label}>Address</label>
        <textarea
          value={form.address}
          onChange={(e) => set('address')(e.target.value)}
          className={input}
          rows={2}
          placeholder="House no, street, city, state, pincode"
        />
      </div>
    </div>
  );
}
