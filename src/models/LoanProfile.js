import mongoose from 'mongoose';

/**
 * A customer's reusable KYC/employment/income/document profile — saved once,
 * then prefilled into every future loan application so they never retype PAN,
 * Aadhaar, income, or re-upload documents. Kept as its own sidecar model
 * (rather than fields on User) so the auth/admin-user-list paths that load
 * User don't also carry loan KYC along for the ride.
 *
 * PAN/Aadhaar are stored as plain values, by deliberate choice for this
 * iteration — no field-level encryption/masking yet.
 */

export const DOCUMENT_TYPES = [
  'pan_card',
  'aadhaar_front',
  'aadhaar_back',
  'photo',
  'income_proof',
  'bank_statement',
  'business_proof',
  'admission_letter',
  'vehicle_quotation',
  'other',
];

const LoanProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    // ---- personal / KYC -------------------------------------------------
    fullName: { type: String, default: '', trim: true },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    maritalStatus: { type: String, enum: ['single', 'married', 'other', ''], default: '' },
    address: { type: String, default: '', trim: true },
    panNumber: { type: String, default: '', trim: true, uppercase: true },
    aadhaarNumber: { type: String, default: '', trim: true },

    // ---- employment & income ---------------------------------------------
    employmentType: { type: String, enum: ['salaried', 'self-employed', ''], default: '' },
    // Doubles as "business name" when self-employed — the form swaps the label.
    employerName: { type: String, default: '', trim: true },
    // Doubles as "nature of business" when self-employed.
    designation: { type: String, default: '', trim: true },
    monthlyIncome: { type: Number, default: 0, min: 0 },
    existingEmi: { type: Number, default: 0, min: 0 },
    workExperienceYears: { type: Number, default: 0, min: 0 },
    creditScore: { type: Number, default: null },

    documents: [
      {
        type: { type: String, enum: DOCUMENT_TYPES, required: true },
        label: { type: String, required: true },
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.LoanProfile ||
  mongoose.model('LoanProfile', LoanProfileSchema);
