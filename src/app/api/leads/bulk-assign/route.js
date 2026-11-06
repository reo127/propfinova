import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';
import mongoose from 'mongoose';

// POST - Bulk assign random leads to an agent
export async function POST(request) {
  try {
    await connectToDatabase();

    const data = await request.json();
    const { count, agentId, assignedBy, status, location } = data;

    // Validate required fields
    if (!count || count <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid count is required' },
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

    // Build filter query for unassigned leads
    // IMPORTANT: Prevent duplicates by checking both current assignment AND history
    const filter = {
      $and: [
        // Must be unassigned
        {
          $or: [
            { isAssigned: false },
            { isAssigned: { $exists: false } }
          ]
        },
        // Must not have assignedTo value (truly available)
        {
          $or: [
            { assignedTo: null },
            { assignedTo: { $exists: false } }
          ]
        },
        // CRITICAL: Never assigned to this agent before (checks history)
        // Using $not with $elemMatch to correctly check array - ensures NO element matches
        {
          $or: [
            // Either no assignment history at all
            { assignmentHistory: { $exists: false } },
            { assignmentHistory: { $size: 0 } },
            // Or agent NOT in history (correct array query)
            {
              assignmentHistory: {
                $not: {
                  $elemMatch: { agentId: agentObjectId }
                }
              }
            }
          ]
        }
      ]
    };

    // Apply optional filters
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (location) {
      filter.interestedLocation = { $regex: location, $options: 'i' };
    }

    // Get random unassigned leads using aggregation for true randomization
    const leads = await Lead.aggregate([
      { $match: filter },
      { $sample: { size: count } }
    ]);

    if (leads.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No unassigned leads found matching the criteria. All available leads may already be assigned to ${agent.name}.`
        },
        { status: 404 }
      );
    }

    const leadIds = leads.map(lead => lead._id);

    // Assign leads to agent and add to assignment history
    const assignmentDate = new Date();
    const result = await Lead.updateMany(
      { _id: { $in: leadIds } },
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

    return NextResponse.json(
      {
        success: true,
        message: `Successfully assigned ${result.modifiedCount} leads to ${agent.name}${
          result.modifiedCount < count
            ? ` (${count - result.modifiedCount} fewer than requested - only ${leads.length} unassigned leads were available)`
            : ''
        }`,
        data: {
          requestedCount: count,
          assignedCount: result.modifiedCount,
          availableCount: leads.length,
          agentName: agent.name,
          agentId: agent._id
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk assign leads error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
