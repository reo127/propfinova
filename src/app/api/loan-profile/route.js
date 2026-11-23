import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LoanProfile from '@/models/LoanProfile';
import { requireAuth, authError } from '@/lib/apiAuth';

const EMPTY_PROFILE = {
  fullName: '', dateOfBirth: null, gender: '', maritalStatus: '', address: '',
  panNumber: '', aadhaarNumber: '', employmentType: '', employerName: '',
  designation: '', monthlyIncome: 0, existingEmi: 0, workExperienceYears: 0,
  creditScore: null, documents: [],
};

// GET - the caller's own reusable KYC/employment/income/document profile,
// used to prefill a loan application. Returns an empty shape if none exists
// yet so the client never needs a null-branch.
export async function GET(request) {
  try {
    const check = requireAuth(request);
    if (!check.ok) return authError(check);

    await connectToDatabase();
    const profile = await LoanProfile.findOne({ user: check.user.id }).lean();

    return NextResponse.json({ success: true, data: profile || EMPTY_PROFILE });
  } catch (error) {
    console.error('Get loan profile error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT - create or update the caller's loan profile directly (the standalone
// "My Loan Profile" editor). Applying also upserts this same document, so
// this endpoint is only needed when editing outside of an application.
export async function PUT(request) {
  try {
    const check = requireAuth(request);
    if (!check.ok) return authError(check);

    await connectToDatabase();
    const { user: _ignoredUser, _id: _ignoredId, ...data } = await request.json();

    const profile = await LoanProfile.findOneAndUpdate(
      { user: check.user.id },
      { $set: data },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Save loan profile error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
