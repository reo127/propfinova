// Manual-run sanity check for loanCategories.js — no test framework in this
// repo, so this is the one-file check instead of adding Jest.
// Run: node scripts/check-loan-categories.js
const assert = require('node:assert');
const {
  LOAN_CATEGORY_GROUPS, groupForLoanType, LOAN_TYPE_LABELS,
  EXTRA_FIELDS_BY_GROUP, DOCUMENT_SLOTS_BY_GROUP, PURPOSE_OPTIONS_BY_GROUP,
} = require('../src/lib/loanCategories.js');

assert.strictEqual(groupForLoanType('home-loan'), 'home');
assert.strictEqual(groupForLoanType('personal-loan'), 'personal');
assert.strictEqual(groupForLoanType('business-loan'), 'business');
assert.strictEqual(groupForLoanType('car-loan'), 'car');
assert.strictEqual(groupForLoanType('education-loan'), 'education');
assert.strictEqual(groupForLoanType('gold-loan'), 'gold');
assert.strictEqual(groupForLoanType('not-a-real-type'), 'other');

// Every loan type referenced by a group has a label, and every group has a
// document slot list (even if just the common ones).
for (const [group, { types }] of Object.entries(LOAN_CATEGORY_GROUPS)) {
  for (const t of types) assert.ok(LOAN_TYPE_LABELS[t], `missing label for ${t}`);
  assert.ok(Array.isArray(EXTRA_FIELDS_BY_GROUP[group]), `missing extra fields for ${group}`);
  assert.ok(Array.isArray(DOCUMENT_SLOTS_BY_GROUP[group]) && DOCUMENT_SLOTS_BY_GROUP[group].length >= 6, `missing document slots for ${group}`);
}

assert.deepStrictEqual(PURPOSE_OPTIONS_BY_GROUP.personal, ['Medical', 'Wedding', 'Travel', 'Debt consolidation', 'Other']);

console.log('loanCategories.js OK');
