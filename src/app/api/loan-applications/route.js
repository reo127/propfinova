import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LoanApplication, { CLOSED_STATUSES } from '@/models/LoanApplication';
import LoanProduct from '@/models/LoanProduct';
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
      .populate('loanProduct', 'lenderName productName interestRateMin interestRateMax')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return NextResponse.json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    console.error('List loan applications error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - apply. Deliberately open to guests: requiring an account before a
// customer can enquire would lose applications, exactly as it would for leads.
export async function POST(request) {
  try {
    await connectToDatabase();
    const data = await request.json();

    const product = await LoanProduct.findById(data.loanProduct);
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'That loan offer is no longer available' },
        { status: 400 }
      );
    }

    const user = optionalAuth(request);

    const application = await LoanApplication.create({
      ...data,
      user: user?.id || null,
      // Copied so the application still reads correctly if the offer is
      // edited or withdrawn later.
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
