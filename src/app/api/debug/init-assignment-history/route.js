import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';

// POST - Initialize assignment history for all existing assigned leads
// This is a one-time migration script
export async function POST(request) {
  try {
    await connectToDatabase();

    // Find all leads that are currently assigned but have no history
    const assignedLeadsWithoutHistory = await Lead.find({
      isAssigned: true,
      assignedTo: { $exists: true, $ne: null },
      $or: [
        { assignmentHistory: { $exists: false } },
        { assignmentHistory: { $size: 0 } }
      ]
    }).populate('assignedTo', 'name');

    console.log(`Found ${assignedLeadsWithoutHistory.length} leads with assignments but no history`);

    let updatedCount = 0;
    let errorCount = 0;

    // Update each lead to add its current assignment to history
    for (const lead of assignedLeadsWithoutHistory) {
      try {
        if (lead.assignedTo) {
          await Lead.updateOne(
            { _id: lead._id },
            {
              $push: {
                assignmentHistory: {
                  agentId: lead.assignedTo._id,
                  agentName: lead.assignedTo.name || 'Unknown',
                  assignedAt: lead.assignedAt || lead.createdAt,
                  unassignedAt: null,
                  assignedBy: lead.assignedBy || null
                }
              }
            }
          );
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error updating lead ${lead._id}:`, error);
        errorCount++;
      }
    }

    // Also check for leads with history but missing current assignment entry
    const leadsWithIncompleteHistory = await Lead.find({
      isAssigned: true,
      assignedTo: { $exists: true, $ne: null },
      assignmentHistory: { $exists: true, $not: { $size: 0 } }
    }).populate('assignedTo', 'name');

    let fixedHistoryCount = 0;

    for (const lead of leadsWithIncompleteHistory) {
      // Check if there's already a history entry for current assignment
      const hasCurrentEntry = lead.assignmentHistory.some(
        h => h.agentId.toString() === lead.assignedTo._id.toString() && !h.unassignedAt
      );

      if (!hasCurrentEntry) {
        try {
          await Lead.updateOne(
            { _id: lead._id },
            {
              $push: {
                assignmentHistory: {
                  agentId: lead.assignedTo._id,
                  agentName: lead.assignedTo.name || 'Unknown',
                  assignedAt: lead.assignedAt || new Date(),
                  unassignedAt: null,
                  assignedBy: lead.assignedBy || null
                }
              }
            }
          );
          fixedHistoryCount++;
        } catch (error) {
          console.error(`Error fixing history for lead ${lead._id}:`, error);
          errorCount++;
        }
      }
    }

    // Get final statistics
    const totalLeads = await Lead.countDocuments();
    const assignedLeads = await Lead.countDocuments({ isAssigned: true });
    const leadsWithHistory = await Lead.countDocuments({
      assignmentHistory: { $exists: true, $not: { $size: 0 } }
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment history initialization completed',
      stats: {
        totalLeads,
        assignedLeads,
        leadsWithHistory,
        newHistoryEntriesCreated: updatedCount,
        fixedIncompleteHistory: fixedHistoryCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('Init assignment history error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Server Error',
        error: error.toString()
      },
      { status: 500 }
    );
  }
}
