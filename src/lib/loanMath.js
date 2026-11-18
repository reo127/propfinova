/**
 * Home-loan arithmetic shared by the browse page, the application form and the
 * admin panel, so a figure quoted to a customer never disagrees with the one
 * stored against their application.
 */

/** Standard amortised EMI. */
export function calculateEmi(principal, annualRatePercent, years) {
  if (!principal || principal <= 0 || !years || years <= 0) return 0;

  const r = annualRatePercent / 12 / 100;
  const n = years * 12;

  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** Inverse of the above: the principal a given EMI can service. */
export function principalFromEmi(emi, annualRatePercent, years) {
  if (!emi || emi <= 0 || !years || years <= 0) return 0;

  const r = annualRatePercent / 12 / 100;
  const n = years * 12;

  if (r === 0) return emi * n;
  return (emi * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
}

/**
 * FOIR — Fixed Obligation to Income Ratio. Lenders cap total monthly
 * obligations at a share of net income; the band below is what Indian lenders
 * commonly apply, tightening for lower incomes.
 */
export function foirForIncome(monthlyIncome) {
  if (monthlyIncome < 30000) return 0.4;
  if (monthlyIncome < 60000) return 0.45;
  if (monthlyIncome < 150000) return 0.5;
  return 0.55;
}

/**
 * How much a lender would realistically advance.
 *
 * Two independent ceilings apply and the lower one wins: what the applicant's
 * surplus income can service, and the share of the property's value the lender
 * is willing to fund. Quoting only the income figure would overstate the offer
 * whenever the property is the binding constraint.
 */
export function estimateEligibility({
  monthlyIncome = 0,
  existingEmi = 0,
  annualRatePercent = 8.5,
  tenureYears = 20,
  propertyValue = 0,
  maxLtvPercent = 80,
  maxLoanAmount = Infinity,
}) {
  const foir = foirForIncome(monthlyIncome);
  const affordableEmi = Math.max(monthlyIncome * foir - existingEmi, 0);

  const byIncome = principalFromEmi(affordableEmi, annualRatePercent, tenureYears);
  const byProperty = propertyValue > 0 ? (propertyValue * maxLtvPercent) / 100 : Infinity;

  const eligible = Math.max(Math.min(byIncome, byProperty, maxLoanAmount), 0);

  return {
    eligibleAmount: Math.round(eligible),
    affordableEmi: Math.round(affordableEmi),
    byIncome: Math.round(Number.isFinite(byIncome) ? byIncome : 0),
    byProperty: Number.isFinite(byProperty) ? Math.round(byProperty) : null,
    foir,
    // Which ceiling is actually binding — worth telling the customer, since
    // "earn more" and "find a cheaper property" are different remedies.
    limitedBy:
      byProperty < byIncome && byProperty < maxLoanAmount
        ? 'property-value'
        : maxLoanAmount < byIncome
        ? 'lender-cap'
        : 'income',
    downPaymentNeeded:
      propertyValue > 0 ? Math.max(Math.round(propertyValue - eligible), 0) : 0,
  };
}

/** Processing fee, respecting the lender's floor and cap. */
export function processingFee(amount, { processingFeePercent = 0, processingFeeMin = 0, processingFeeMax = 0 }) {
  let fee = (amount * processingFeePercent) / 100;
  if (processingFeeMin) fee = Math.max(fee, processingFeeMin);
  if (processingFeeMax) fee = Math.min(fee, processingFeeMax);
  return Math.round(fee);
}

/** Indian-format short currency, e.g. ₹1.25 Cr / ₹45.00 L. */
export function formatMoney(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** Does this applicant clear the offer's published gates? */
export function checkEligibilityGates(product, applicant) {
  const reasons = [];

  if (product.minMonthlyIncome && applicant.monthlyIncome < product.minMonthlyIncome) {
    reasons.push(`Minimum monthly income is ${formatMoney(product.minMonthlyIncome)}`);
  }
  if (product.minCreditScore && applicant.creditScore && applicant.creditScore < product.minCreditScore) {
    reasons.push(`Minimum credit score is ${product.minCreditScore}`);
  }
  if (
    product.eligibleEmployment &&
    product.eligibleEmployment !== 'both' &&
    applicant.employmentType &&
    product.eligibleEmployment !== applicant.employmentType
  ) {
    reasons.push(`This offer is for ${product.eligibleEmployment} applicants`);
  }
  if (applicant.loanAmount) {
    if (applicant.loanAmount < product.minLoanAmount) {
      reasons.push(`Minimum loan amount is ${formatMoney(product.minLoanAmount)}`);
    }
    if (applicant.loanAmount > product.maxLoanAmount) {
      reasons.push(`Maximum loan amount is ${formatMoney(product.maxLoanAmount)}`);
    }
  }

  return { eligible: reasons.length === 0, reasons };
}
