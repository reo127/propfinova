import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import LoanApplication, { APPLICATION_STATUSES } from '@/models/LoanApplication';
import '@/models/User';
import { requireAuth, authError } from '@/lib/apiAuth';

// GET - one application (admin only)
export async function GET(request, { params }) {
  try {
    const check = requireAuth(request, ['admin']);
    if (!check.ok) return authError(check);

    await connectToDatabase();
    const { id } = await params;

    const application = await LoanApplication.findById(id).populate('loanProduct').lean();
    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: application });
  } catch (error) {
    console.error('Get loan application error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT - move the file along, or attach a note (admin only)
export async function PUT(request, { params }) {
  try {
    const check = requireAuth(request, ['admin']);
    if (!check.ok) return authError(check);

    await connectToDatabase();
    const { id } = await params;
    const { action, status, note, rejectionReason, sanctionedAmount, sanctionedRate } =
      await request.json();

    const application = await LoanApplication.findById(id);
    if (!application) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }

    if (action === 'addNote') {
      if (!note) {
        return NextResponse.json(
          { success: false, message: 'Note content is required' },
          { status: 400 }
        );
      }
      application.notes.push({ content: note, addedBy: 'admin' });
    } else if (action === 'updateStatus') {
      if (!APPLICATION_STATUSES.includes(status)) {
        return NextResponse.json({ success: false, message: 'Unknown status' }, { status: 400 });
      }

      const previous = application.status;
      application.statusHistory.push({ from: previous, to: status, note: note || '' });
      application.status = status;

      if (note) application.notes.push({ content: note, addedBy: 'admin' });

      // Timestamps and figures the partner bank reports back.
      if (status === 'sanctioned') {
        application.sanctionedAt = new Date();
        if (sanctionedAmount != null) application.sanctionedAmount = sanctionedAmount;
        if (sanctionedRate != null) application.sanctionedRate = sanctionedRate;
      }
      if (status === 'disbursed') application.disbursedAt = new Date();
      if (status === 'rejected') application.rejectionReason = rejectionReason || note || '';
    } else {
      return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
    }

    await application.save();
    const populated = await LoanApplication.findById(id).populate('loanProduct').lean();

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    console.error('Update loan application error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
