import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LoanProduct from '@/models/LoanProduct';
import { requireAuth, authError } from '@/lib/apiAuth';

// GET - a single offer. Public: the browse page links straight to it.
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const product = await LoanProduct.findById(id).lean();
    if (!product) {
      return NextResponse.json({ success: false, message: 'Loan offer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Get loan product error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT - edit an offer (admin only)
export async function PUT(request, { params }) {
  try {
    const check = requireAuth(request, ['admin']);
    if (!check.ok) return authError(check);

    await connectToDatabase();
    const { id } = await params;
    const data = await request.json();

    const product = await LoanProduct.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return NextResponse.json({ success: false, message: 'Loan offer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error('Update loan product error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

// DELETE - remove an offer (admin only)
export async function DELETE(request, { params }) {
  try {
    const check = requireAuth(request, ['admin']);
    if (!check.ok) return authError(check);

    await connectToDatabase();
    const { id } = await params;

    const product = await LoanProduct.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json({ success: false, message: 'Loan offer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Loan offer removed' });
  } catch (error) {
    console.error('Delete loan product error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
