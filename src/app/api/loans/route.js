import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LoanProduct from '@/models/LoanProduct';
import { requireAuth, authError, optionalAuth } from '@/lib/apiAuth';

// GET - list loan offers. Public sees active ones; an admin sees everything
// so drafts and paused offers remain manageable.
export async function GET(request) {
  try {
    await connectToDatabase();

    const user = optionalAuth(request);
    const { searchParams } = new URL(request.url);
    const loanType = searchParams.get('loanType');
    const includeInactive = searchParams.get('all') === 'true' && user?.role === 'admin';

    const filter = {};
    if (!includeInactive) filter.isActive = true;
    if (loanType) filter.loanType = loanType;

    const products = await LoanProduct.find(filter)
      .sort({ isFeatured: -1, displayOrder: 1, interestRateMin: 1 })
      .lean();

    return NextResponse.json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('List loan products error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}

// POST - add a loan offer (admin only)
export async function POST(request) {
  try {
    const check = requireAuth(request, ['admin']);
    if (!check.ok) return authError(check);

    await connectToDatabase();
    const data = await request.json();

    const product = await LoanProduct.create(data);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('Create loan product error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 400 }
    );
  }
}
