import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';
import mongoose from 'mongoose';

// POST - Unassign all leads from a specific agent
export async function POST(request) {
  try {
    await connectToDatabase();

    const data = await request.json();
    const { agentId } = data;

    if (!agentId) {
      return NextResponse.json(
        { success: false, message: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Verify agent exists
    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Agent not found' },
        { status: 404 }
      );
    }

    // Convert agentId to ObjectId for consistent comparison
    const agentObjectId = new mongoose.Types.ObjectId(agentId);

    // Count leads before unassigning
    const leadsCount = await Lead.countDocuments({
      assignedTo: agentObjectId,
      isAssigned: true
    });

    if (leadsCount === 0) {
      return NextResponse.json(
        { success: false, message: `No leads assigned to ${agent.name}` },
        { status: 404 }
      );
    }

    // Get all leads assigned to this agent to update their history
    const leadsToUnassign = await Lead.find({
      assignedTo: agentObjectId,
      isAssigned: true
    });

    const unassignmentDate = new Date();

    // Update each lead's assignment history and unassign
    const bulkOps = leadsToUnassign.map(lead => {
      // Find the last history entry for this agent (should be the current one)
      // Safety check: ensure assignmentHistory exists and is an array
      let historyIndex = -1;
      if (lead.assignmentHistory && Array.isArray(lead.assignmentHistory) && lead.assignmentHistory.length > 0) {
        historyIndex = lead.assignmentHistory.findLastIndex(
          h => h.agentId && h.agentId.toString() === agentObjectId.toString() && !h.unassignedAt
        );
      }

      const updateOp = {
        updateOne: {
          filter: { _id: lead._id },
          update: {
            $set: {
              isAssigned: false,
              assignedTo: null,
              assignedBy: null,
              assignedAt: null
            }
          }
        }
      };

      // If we found an open history entry, update it with unassignedAt
      if (historyIndex !== -1) {
        updateOp.updateOne.update.$set[`assignmentHistory.${historyIndex}.unassignedAt`] = unassignmentDate;
      }

      return updateOp;
    });

    // Execute bulk update
    let result = { modifiedCount: 0 };
    if (bulkOps.length > 0) {
      result = await Lead.bulkWrite(bulkOps);
    }

    // Update agent's assigned leads count
    await User.findByIdAndUpdate(agentId, {
      assignedLeadsCount: 0
    });

    const unassignedCount = result.modifiedCount || leadsCount;

    return NextResponse.json(
      {
        success: true,
        message: `Successfully unassigned ${unassignedCount} leads from ${agent.name}`,
        data: {
          agentName: agent.name,
          agentId: agent._id,
          unassignedCount: unassignedCount
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unassign all leads error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
