import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
// Side-effect import: populating assignedTo needs the User schema registered
// on this Mongoose connection, otherwise the query throws MissingSchemaError.
import '@/models/User';
import jwt from 'jsonwebtoken';

/**
 * Follow-ups that have come due, for the reminder popup.
 *
 * Returns anything scheduled at or before now that has not been actioned, so
 * a reminder missed while logged out still surfaces on the next visit rather
 * than being silently skipped.
 *
 * Scope follows the CRM's existing permissions: an admin sees every lead, an
 * agent only the ones assigned to them.
 */
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    if (!['admin', 'agent'].includes(decoded.role)) {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to do that' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const filter = {
      followUpDate: { $ne: null, $lte: new Date() },
      // A lead that reached a terminal stage no longer needs chasing.
      status: { $nin: ['not_interested', 'do_not_disturb', 'site_visit_done'] },
    };

    if (decoded.role === 'agent') {
      filter.assignedTo = decoded.id;
    }

    const leads = await Lead.find(filter)
      .select('name phone interestedLocation status followUpDate assignedTo')
      .populate('assignedTo', 'name')
      .sort({ followUpDate: 1 })
      .limit(20)
      .lean();

    return NextResponse.json({ success: true, count: leads.length, data: leads }, { status: 200 });
  } catch (error) {
    console.error('Due follow-ups error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
