import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';
import mongoose from 'mongoose';

// POST - Assign leads to an agent
export async function POST(request) {
  try {
    await connectToDatabase();

    const data = await request.json();
    const { leadIds, agentId, assignedBy } = data;

    // Validate required fields
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Lead IDs array is required' },
        { status: 400 }
      );
    }

    if (!agentId) {
      return NextResponse.json(
        { success: false, message: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Verify agent exists and has role 'agent'
    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Invalid agent ID or agent not found' },
        { status: 404 }
      );
    }

    // Convert agentId to ObjectId for consistent comparison
    const agentObjectId = new mongoose.Types.ObjectId(agentId);

    // Filter out leads already assigned to this agent or in their history
    // Using $not with $elemMatch for correct array query
    const leadsToAssign = await Lead.find({
      _id: { $in: leadIds },
      $or: [
        // No history at all
        { assignmentHistory: { $exists: false } },
        { assignmentHistory: { $size: 0 } },
        // Agent NOT in history (correct array check)
        {
          assignmentHistory: {
            $not: {
              $elemMatch: { agentId: agentObjectId }
            }
          }
        }
      ]
    }).select('_id');

    const validLeadIds = leadsToAssign.map(l => l._id);

    if (validLeadIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'All selected leads have already been assigned to this agent before'
        },
        { status: 400 }
      );
    }

    // Update leads and add to assignment history
    const assignmentDate = new Date();
    const result = await Lead.updateMany(
      { _id: { $in: validLeadIds } },
      {
        $set: {
          assignedTo: agentId,
          assignedBy: assignedBy || null,
          assignedAt: assignmentDate,
          isAssigned: true
        },
        $push: {
          assignmentHistory: {
            agentId: agentId,
            agentName: agent.name,
            assignedAt: assignmentDate,
            unassignedAt: null,
            assignedBy: assignedBy || null
          }
        }
      }
    );

    // Update agent's assigned leads count
    const newAssignedCount = await Lead.countDocuments({
      assignedTo: agentId,
      isAssigned: true
    });

    await User.findByIdAndUpdate(agentId, {
      assignedLeadsCount: newAssignedCount
    });

    const skippedCount = leadIds.length - validLeadIds.length;

    return NextResponse.json(
      {
        success: true,
        message: `Successfully assigned ${result.modifiedCount} leads to ${agent.name}${
          skippedCount > 0
            ? ` (${skippedCount} leads were skipped as they were previously assigned to this agent)`
            : ''
        }`,
        data: {
          requestedCount: leadIds.length,
          assignedCount: result.modifiedCount,
          skippedCount: skippedCount,
          agentName: agent.name,
          agentId: agent._id
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Assign leads error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
