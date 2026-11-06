import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';

export async function POST(request) {
  try {
    await connectToDatabase();

    // Update all leads that don't have isAssigned field set
    const result = await Lead.updateMany(
      {
        $or: [
          { isAssigned: { $exists: false } },
          { assignedTo: { $exists: false } }
        ]
      },
      {
        $set: {
          isAssigned: false,
          assignedTo: null,
          assignedBy: null,
          assignedAt: null
        }
      }
    );

    // Count after migration
    const totalLeads = await Lead.countDocuments();
    const unassignedLeads = await Lead.countDocuments({ isAssigned: false });
    const assignedLeads = await Lead.countDocuments({ isAssigned: true });

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      updated: result.modifiedCount,
      stats: {
        totalLeads,
        assignedLeads,
        unassignedLeads
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
