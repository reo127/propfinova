// The loan application pipeline stages, shared between the admin queue
// (src/app/admin/loans/applications/page.jsx) and the customer's own
// "My Loan Applications" list (src/app/user/page.jsx) so the two never show
// different labels/colors for the same status.
export const STAGES = [
  ['submitted', 'Submitted', 'bg-slate-100 text-slate-700'],
  ['under_review', 'Under review', 'bg-blue-50 text-blue-700'],
  ['documents_pending', 'Documents pending', 'bg-amber-50 text-amber-700'],
  ['sent_to_lender', 'Sent to lender', 'bg-indigo-50 text-indigo-700'],
  ['verification', 'Bank verification', 'bg-violet-50 text-violet-700'],
  ['sanctioned', 'Sanctioned', 'bg-emerald-50 text-emerald-700'],
  ['disbursed', 'Disbursed', 'bg-emerald-100 text-emerald-800'],
  ['rejected', 'Rejected', 'bg-rose-50 text-rose-700'],
  ['withdrawn', 'Withdrawn', 'bg-slate-200 text-slate-600'],
];

export const STAGE_MAP = Object.fromEntries(STAGES.map(([v, l, c]) => [v, { label: l, cls: c }]));
