import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';

// POST - Remove duplicate lead assignments
export async function POST(request) {
  try {
    await connectToDatabase();

    const data = await request.json();
    const { agentId, fixType } = data; // fixType: 'phone-duplicates', 'inconsistent-data', 'all'

    let results = {
      phoneDuplicatesFixed: 0,
      inconsistentDataFixed: 0,
      leadsUnassigned: [],
      errors: []
    };

    // Fix 1: Remove duplicate phone numbers for specific agent or all agents
    if (fixType === 'phone-duplicates' || fixType === 'all') {
      const agentFilter = agentId ? { role: 'agent', _id: agentId } : { role: 'agent' };
      const agents = await User.find(agentFilter);

      for (const agent of agents) {
        try {
          // Find all leads assigned to this agent
          const assignedLeads = await Lead.find({
            assignedTo: agent._id,
            isAssigned: true
          }).sort({ assignedAt: -1 }); // Most recent first

          // Group by phone number
          const phoneMap = {};
          for (const lead of assignedLeads) {
            if (!phoneMap[lead.phone]) {
              phoneMap[lead.phone] = [];
            }
            phoneMap[lead.phone].push(lead);
          }

          // For each phone with duplicates, keep the most recent, unassign others
          for (const [phone, leads] of Object.entries(phoneMap)) {
            if (leads.length > 1) {
              // Keep the first one (most recent due to sort), unassign the rest
              const toUnassign = leads.slice(1);

              for (const lead of toUnassign) {
                // Find the history entry and mark as unassigned
                const historyIndex = lead.assignmentHistory.findLastIndex(
                  h => h.agentId.toString() === agent._id.toString() && !h.unassignedAt
                );

                const updateData = {
                  isAssigned: false,
                  assignedTo: null,
                  assignedBy: null,
                  assignedAt: null
                };

                if (historyIndex !== -1) {
                  updateData[`assignmentHistory.${historyIndex}.unassignedAt`] = new Date();
                }

                await Lead.updateOne({ _id: lead._id }, { $set: updateData });

                results.leadsUnassigned.push({
                  leadId: lead._id,
                  name: lead.name,
                  phone: lead.phone,
                  reason: `Duplicate phone for agent ${agent.name}`,
                  keptLeadId: leads[0]._id
                });

                results.phoneDuplicatesFixed++;
              }
            }
          }

          // Update agent's lead count
          const newCount = await Lead.countDocuments({
            assignedTo: agent._id,
            isAssigned: true
          });

          await User.findByIdAndUpdate(agent._id, {
            assignedLeadsCount: newCount
          });
        } catch (error) {
          results.errors.push({
            agentId: agent._id,
            agentName: agent.name,
            error: error.message
          });
        }
      }
    }

    // Fix 2: Fix inconsistent data (isAssigned vs assignedTo mismatch)
    if (fixType === 'inconsistent-data' || fixType === 'all') {
      try {
        // Fix: isAssigned true but no assignedTo
        const result1 = await Lead.updateMany(
          {
            isAssigned: true,
            $or: [
              { assignedTo: null },
              { assignedTo: { $exists: false } }
            ]
          },
          {
            $set: { isAssigned: false }
          }
        );
        results.inconsistentDataFixed += result1.modifiedCount;

        // Fix: isAssigned false but has assignedTo
        const result2 = await Lead.updateMany(
          {
            isAssigned: false,
            assignedTo: { $exists: true, $ne: null }
          },
          {
            $set: {
              assignedTo: null,
              assignedBy: null,
              assignedAt: null
            }
          }
        );
        results.inconsistentDataFixed += result2.modifiedCount;
      } catch (error) {
        results.errors.push({
          type: 'inconsistent-data',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Fixed ${results.phoneDuplicatesFixed} phone duplicates and ${results.inconsistentDataFixed} inconsistent records.`,
      results
    });
  } catch (error) {
    console.error('Remove duplicates error:', error);
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
