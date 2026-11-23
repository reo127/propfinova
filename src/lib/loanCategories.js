// Loan type → category config. One place that decides which extra questions
// and document slots a category needs, so the apply form (and the admin
// offer form) don't hardcode a field list per loan type. Duplicated verbatim
// in mobile/lib/loanCategories.js — same precedent as loanMath.js.

export const LOAN_TYPE_LABELS = {
  'home-loan': 'Home Loan',
  'balance-transfer': 'Balance Transfer',
  'plot-loan': 'Plot Loan',
  construction: 'Construction',
  'home-improvement': 'Home Improvement',
  'loan-against-property': 'Loan Against Property',
  'nri-home-loan': 'NRI Home Loan',
  'personal-loan': 'Personal Loan',
  'business-loan': 'Business Loan',
  'car-loan': 'Car Loan',
  'education-loan': 'Education Loan',
  'gold-loan': 'Gold Loan',
  other: 'Other',
};

export const LOAN_CATEGORY_GROUPS = {
  home: {
    label: 'Home',
    types: [
      'home-loan', 'balance-transfer', 'plot-loan', 'construction',
      'home-improvement', 'loan-against-property', 'nri-home-loan',
    ],
  },
  personal: { label: 'Personal', types: ['personal-loan'] },
  business: { label: 'Business', types: ['business-loan'] },
  car: { label: 'Car', types: ['car-loan'] },
  education: { label: 'Education', types: ['education-loan'] },
  gold: { label: 'Gold', types: ['gold-loan'] },
  other: { label: 'Other', types: ['other'] },
};

export function groupForLoanType(loanType) {
  for (const [key, g] of Object.entries(LOAN_CATEGORY_GROUPS)) {
    if (g.types.includes(loanType)) return key;
  }
  return 'other';
}

// Step 3 "loan details" extras, per category — appended after the common
// amount/tenure/purpose fields. "home" is intentionally absent: its property
// value/location are the pre-existing top-level LoanApplication fields
// (propertyValue/propertyLocation), rendered directly by the apply form
// rather than through this generic, loanDetails-backed list.
export const EXTRA_FIELDS_BY_GROUP = {
  home: [],
  personal: [],
  business: [
    { key: 'businessName', label: 'Business name', type: 'text', placeholder: 'Business name' },
    { key: 'natureOfBusiness', label: 'Nature of business', type: 'text', placeholder: 'e.g. Retail, Manufacturing' },
    { key: 'annualTurnover', label: 'Annual turnover (₹)', type: 'number', placeholder: '2000000' },
    { key: 'businessVintageYears', label: 'Business vintage (years)', type: 'number', placeholder: '3' },
  ],
  car: [
    { key: 'vehicleCondition', label: 'New or used', type: 'select', options: ['New', 'Used'] },
    { key: 'vehicleType', label: 'Vehicle type', type: 'text', placeholder: 'Hatchback, SUV, etc.' },
    { key: 'onRoadPrice', label: 'On-road price (₹)', type: 'number', placeholder: '800000' },
  ],
  education: [
    { key: 'instituteName', label: 'Institute name', type: 'text', placeholder: 'Institute name' },
    { key: 'courseName', label: 'Course name', type: 'text', placeholder: 'Course name' },
    { key: 'courseDurationYears', label: 'Course duration (years)', type: 'number', placeholder: '4' },
    { key: 'admissionStatus', label: 'Admission status', type: 'select', options: ['Admission confirmed', 'Awaiting admission'] },
  ],
  gold: [],
  other: [],
};

// The common "purpose" field (every category has one): free text by
// default, a dropdown where a fixed option set makes more sense.
export const PURPOSE_OPTIONS_BY_GROUP = {
  personal: ['Medical', 'Wedding', 'Travel', 'Debt consolidation', 'Other'],
};

// Documents every category asks for, plus one category-specific add-on.
export const COMMON_DOCUMENT_SLOTS = [
  { type: 'pan_card', label: 'PAN card' },
  { type: 'aadhaar_front', label: 'Aadhaar (front)' },
  { type: 'aadhaar_back', label: 'Aadhaar (back)' },
  { type: 'photo', label: 'Photograph' },
  { type: 'income_proof', label: 'Income proof (salary slip / ITR)' },
  { type: 'bank_statement', label: 'Bank statement' },
];

const CATEGORY_DOCUMENT_ADDONS = {
  business: [{ type: 'business_proof', label: 'GST / business registration proof' }],
  education: [{ type: 'admission_letter', label: 'Admission letter' }],
  car: [{ type: 'vehicle_quotation', label: 'Vehicle quotation' }],
};

export const DOCUMENT_SLOTS_BY_GROUP = Object.fromEntries(
  Object.keys(LOAN_CATEGORY_GROUPS).map((g) => [
    g,
    [...COMMON_DOCUMENT_SLOTS, ...(CATEGORY_DOCUMENT_ADDONS[g] || [])],
  ])
);
