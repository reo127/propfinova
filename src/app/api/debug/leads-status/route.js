import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';

export async function GET(request) {
  try {
    await connectToDatabase();

    const totalLeads = await Lead.countDocuments();
    const assignedLeads = await Lead.countDocuments({ isAssigned: true });
    const unassignedLeads = await Lead.countDocuments({ isAssigned: false });
    const noFieldLeads = await Lead.countDocuments({ isAssigned: { $exists: false } });

    // Sample a few leads
    const sampleLeads = await Lead.find().limit(5).select('name isAssigned assignedTo');

    return NextResponse.json({
      success: true,
      stats: {
        totalLeads,
        assignedLeads,
        unassignedLeads,
        noFieldLeads
      },
      sampleLeads
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
