import mongoose from 'mongoose';

/**
 * A loan offer (any type — home, personal, business, car, education, gold…)
 * from a partner bank or NBFC, as listed on the marketplace.
 *
 * PropFinova does not lend — it lists partner offers, collects applications and
 * hands qualified ones to the lender, which is how every comparable Indian
 * portal operates. Nothing here models repayment or money movement.
 *
 * Field choices follow what Indian lenders actually publish: a rate *range*
 * rather than one number (the rate offered depends on credit profile), a
 * processing fee expressed as a percentage with a floor and cap, and an LTV
 * ceiling (lenders fund 75–90% of property value, never all of it).
 */

export const LOAN_TYPES = [
  'home-loan',
  'balance-transfer',
  'plot-loan',
  'construction',
  'home-improvement',
  'loan-against-property',
  'nri-home-loan',
  'personal-loan',
  'business-loan',
  'car-loan',
  'education-loan',
  'gold-loan',
  'other',
];

export const EMPLOYMENT_TYPES = ['salaried', 'self-employed', 'both'];

const LoanProductSchema = new mongoose.Schema(
  {
    lenderName: {
      type: String,
      required: [true, 'Please provide the lender name'],
      trim: true,
    },
    lenderLogo: { type: String, default: '' },

    productName: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
    },

    loanType: {
      type: String,
      enum: LOAN_TYPES,
      default: 'home-loan',
    },

    // Lenders quote a band; the applicant's actual rate depends on their
    // credit profile, so storing a single number would be misleading.
    interestRateMin: {
      type: Number,
      required: [true, 'Please provide the minimum interest rate'],
      min: 0,
      max: 30,
    },
    interestRateMax: {
      type: Number,
      required: [true, 'Please provide the maximum interest rate'],
      min: 0,
      max: 30,
    },
    rateType: {
      type: String,
      enum: ['floating', 'fixed', 'both'],
      default: 'floating',
    },

    // Typically 0.25–1% of the sanctioned amount, usually with a floor and cap.
    processingFeePercent: { type: Number, default: 0.5, min: 0, max: 5 },
    processingFeeMin: { type: Number, default: 0 },
    processingFeeMax: { type: Number, default: 0 },

    minLoanAmount: { type: Number, required: true },
    maxLoanAmount: { type: Number, required: true },

    minTenureYears: { type: Number, default: 1, min: 1, max: 40 },
    maxTenureYears: { type: Number, default: 30, min: 1, max: 40 },

    // Loan-to-value ceiling. No lender funds 100% of a property.
    maxLtvPercent: { type: Number, default: 80, min: 10, max: 100 },

    // Eligibility gates, shown to the applicant before they apply so they do
    // not waste time on an offer they cannot qualify for.
    minMonthlyIncome: { type: Number, default: 0 },
    minCreditScore: { type: Number, default: 700 },
    minAge: { type: Number, default: 21 },
    maxAge: { type: Number, default: 65 },
    eligibleEmployment: {
      type: String,
      enum: EMPLOYMENT_TYPES,
      default: 'both',
    },

    prepaymentCharges: { type: String, default: 'Nil for floating rate loans' },
    partPaymentAllowed: { type: Boolean, default: true },

    features: { type: [String], default: [] },
    documentsRequired: { type: [String], default: [] },

    description: { type: String, default: '', trim: true },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// The browse page always filters to active offers and sorts the same way.
LoanProductSchema.index({ isActive: 1, displayOrder: 1, interestRateMin: 1 });

LoanProductSchema.pre('validate', function (next) {
  if (this.interestRateMax < this.interestRateMin) {
    return next(new Error('Maximum interest rate cannot be lower than the minimum'));
  }
  if (this.maxLoanAmount < this.minLoanAmount) {
    return next(new Error('Maximum loan amount cannot be lower than the minimum'));
  }
  if (this.maxTenureYears < this.minTenureYears) {
    return next(new Error('Maximum tenure cannot be shorter than the minimum'));
  }
  next();
});

export default mongoose.models.LoanProduct ||
  mongoose.model('LoanProduct', LoanProductSchema);
