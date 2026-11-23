import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LoanApplication, { CLOSED_STATUSES } from '@/models/LoanApplication';
import LoanProduct from '@/models/LoanProduct';
import LoanProfile from '@/models/LoanProfile';
import '@/models/User';
import { requireAuth, authError, optionalAuth } from '@/lib/apiAuth';

// GET - applications. `mine=true` lets a signed-in customer track their own
// files; everything else is the admin queue.
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const mine = searchParams.get('mine') === 'true';
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter = {};

    if (mine) {
      const user = optionalAuth(request);
      if (!user) {
        return NextResponse.json(
          { success: false, message: 'Not authorized, please login' },
          { status: 401 }
        );
      }
      filter.user = user.id;
    } else {
      const check = requireAuth(request, ['admin']);
      if (!check.ok) return authError(check);
    }

    if (status === 'active') filter.status = { $nin: CLOSED_STATUSES };
    else if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { applicantName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { lenderNameSnapshot: { $regex: search, $options: 'i' } },
      ];
    }

    const applications = await LoanApplication.find(filter)
      .populate('loanProduct', 'lenderName productName interestRateMin interestRateMax loanType')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    console.error('List loan applications error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - apply. Requires login (unlike property leads) so the applicant has
// an account the KYC/employment profile below can be saved against and
// prefilled from next time.
export async function POST(request) {
  try {
    const check = requireAuth(request);
    if (!check.ok) return authError(check);
    const user = check.user;

    await connectToDatabase();
    const data = await request.json();

    const product = await LoanProduct.findById(data.loanProduct);
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'That loan offer is no longer available' },
        { status: 400 }
      );
    }

    // Save/update the reusable profile from whatever was just submitted, so
    // the next application opens prefilled without a separate save step.
    await LoanProfile.findOneAndUpdate(
      { user: user.id },
      {
        $set: {
          fullName: data.applicantName,
          dateOfBirth: data.dateOfBirth || null,
          gender: data.gender || '',
          maritalStatus: data.maritalStatus || '',
          address: data.address || '',
          panNumber: data.panNumber || '',
          aadhaarNumber: data.aadhaarNumber || '',
          employmentType: data.employmentType,
          employerName: data.employerName || '',
          designation: data.designation || '',
          monthlyIncome: Number(data.monthlyIncome) || 0,
          existingEmi: Number(data.existingEmi) || 0,
          workExperienceYears: Number(data.workExperienceYears) || 0,
          creditScore: data.creditScore ? Number(data.creditScore) : null,
          ...(Array.isArray(data.documents) && data.documents.length ? { documents: data.documents } : {}),
        },
      },
      { upsert: true, runValidators: true }
    );

    // Explicit allowlist rather than spreading the raw body — the pipeline
    // fields below (status, sanctionedAmount, notes, ...) are admin-only and
    // must never be settable from a client-submitted application.
    const {
      applicantName, phone, email, dateOfBirth, gender, maritalStatus, address,
      panNumber, aadhaarNumber, employmentType, employerName, designation,
      monthlyIncome, existingEmi, workExperienceYears, creditScore,
      loanAmount, tenureYears, purpose, propertyValue, propertyLocation, property,
      loanDetails, documents,
    } = data;

    const application = await LoanApplication.create({
      loanProduct: data.loanProduct,
      applicantName, phone, email, dateOfBirth, gender, maritalStatus, address,
      panNumber, aadhaarNumber, employmentType, employerName, designation,
      monthlyIncome, existingEmi, workExperienceYears, creditScore,
      loanAmount, tenureYears, purpose, propertyValue, propertyLocation, property,
      loanDetails, documents,
      user: user.id,
      // Copied so the application still reads correctly if the offer is
      // edited or withdrawn later, or if the profile above is later changed.
      lenderNameSnapshot: product.lenderName,
      productNameSnapshot: product.productName,
      status: 'submitted',
      statusHistory: [{ to: 'submitted', note: 'Application received', changedBy: 'system' }],
    });

    return NextResponse.json(
      {
        success: true,
        data: { _id: application._id, status: application.status },
        message: 'Application submitted. Our team will call you shortly.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create loan application error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
