import mongoose from 'mongoose';

/**
 * A customer's application against a listed loan offer.
 *
 * The stages mirror the real Indian home-loan journey — application, document
 * collection, verification, sanction letter, disbursal — so the pipeline a
 * caller sees matches what the bank actually tells the customer. Sanction and
 * disbursal are recorded here because the partner bank reports them back; the
 * platform never moves money itself.
 */

export const APPLICATION_STATUSES = [
  'submitted',          // customer has applied, nobody has looked yet
  'under_review',       // our team is qualifying it
  'documents_pending',  // waiting on the applicant for paperwork
  'sent_to_lender',     // handed to the partner bank
  'verification',       // bank running credit / legal / technical checks
  'sanctioned',         // bank issued a sanction letter
  'disbursed',          // money released to the customer
  'rejected',
  'withdrawn',
];

/** Stages where the file is finished and should drop out of active queues. */
export const CLOSED_STATUSES = ['disbursed', 'rejected', 'withdrawn'];

const LoanApplicationSchema = new mongoose.Schema(
  {
    // ---- which offer ---------------------------------------------------
    loanProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LoanProduct',
      required: true,
    },
    // Lender and product names are copied in at submission time on purpose:
    // an admin may later edit or delete the offer, and an application must
    // still show what the customer actually applied for.
    lenderNameSnapshot: { type: String, default: '' },
    productNameSnapshot: { type: String, default: '' },

    // ---- applicant -----------------------------------------------------
    applicantName: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => /^\d{10}$/.test(v),
        message: 'Please provide a 10-digit phone number',
      },
    },
    email: { type: String, default: '', trim: true, lowercase: true },
    dateOfBirth: { type: Date, default: null },
    panNumber: { type: String, default: '', trim: true, uppercase: true },

    // Set when a signed-in user applies, so they can track their own file.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ---- employment & income ------------------------------------------
    employmentType: {
      type: String,
      enum: ['salaried', 'self-employed'],
      required: true,
    },
    employerName: { type: String, default: '', trim: true },
    monthlyIncome: { type: Number, required: true, min: 0 },
    // Drives the FOIR check — lenders cap total EMIs at roughly half of income.
    existingEmi: { type: Number, default: 0, min: 0 },
    workExperienceYears: { type: Number, default: 0, min: 0 },
    creditScore: { type: Number, default: null },

    // ---- the request ---------------------------------------------------
    loanAmount: { type: Number, required: true, min: 0 },
    tenureYears: { type: Number, required: true, min: 1, max: 40 },
    propertyValue: { type: Number, default: 0, min: 0 },
    propertyLocation: { type: String, default: '', trim: true },
    // Set when the application starts from a specific listing.
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null },

    // ---- pipeline ------------------------------------------------------
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'submitted',
    },
    rejectionReason: { type: String, default: '' },

    // Reported back by the partner bank once it decides.
    sanctionedAmount: { type: Number, default: null },
    sanctionedRate: { type: Number, default: null },
    sanctionedAt: { type: Date, default: null },
    disbursedAt: { type: Date, default: null },

    documents: [
      {
        label: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    notes: [
      {
        content: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
        addedBy: { type: String, default: 'admin' },
      },
    ],

    // Every status change is appended so the file has an audit trail rather
    // than only its current state.
    statusHistory: [
      {
        from: { type: String, default: '' },
        to: { type: String, required: true },
        note: { type: String, default: '' },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, default: 'admin' },
      },
    ],
  },
  { timestamps: true }
);

LoanApplicationSchema.index({ status: 1, createdAt: -1 });
LoanApplicationSchema.index({ phone: 1 });

export default mongoose.models.LoanApplication ||
  mongoose.model('LoanApplication', LoanApplicationSchema);
