import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';

// GET - Detect duplicate lead assignments across all agents
export async function GET(request) {
  try {
    await connectToDatabase();

    // Get all agents
    const agents = await User.find({ role: 'agent' });

    const duplicateReport = [];
    let totalDuplicates = 0;

    for (const agent of agents) {
      // Find leads currently assigned to this agent
      const assignedLeads = await Lead.find({
        assignedTo: agent._id,
        isAssigned: true
      }).select('_id name phone assignedAt assignmentHistory');

      // Check for duplicate phone numbers (same person assigned multiple times)
      const phoneMap = {};
      const duplicatesByPhone = [];

      for (const lead of assignedLeads) {
        if (!phoneMap[lead.phone]) {
          phoneMap[lead.phone] = [];
        }
        phoneMap[lead.phone].push({
          leadId: lead._id,
          name: lead.name,
          phone: lead.phone,
          assignedAt: lead.assignedAt
        });
      }

      // Find phones with multiple leads
      for (const [phone, leads] of Object.entries(phoneMap)) {
        if (leads.length > 1) {
          duplicatesByPhone.push({
            phone,
            count: leads.length,
            leads: leads
          });
          totalDuplicates += leads.length - 1; // Count extras as duplicates
        }
      }

      // Check for leads that appear in history multiple times
      const historyDuplicates = [];
      for (const lead of assignedLeads) {
        if (lead.assignmentHistory && lead.assignmentHistory.length > 0) {
          const agentHistoryCount = lead.assignmentHistory.filter(
            h => h.agentId.toString() === agent._id.toString()
          ).length;

          if (agentHistoryCount > 1) {
            historyDuplicates.push({
              leadId: lead._id,
              name: lead.name,
              phone: lead.phone,
              timesAssigned: agentHistoryCount
            });
          }
        }
      }

      if (duplicatesByPhone.length > 0 || historyDuplicates.length > 0) {
        duplicateReport.push({
          agentId: agent._id,
          agentName: agent.name,
          agentEmail: agent.email,
          totalAssignedLeads: assignedLeads.length,
          duplicatesByPhone: duplicatesByPhone,
          historyDuplicates: historyDuplicates,
          issuesFound: duplicatesByPhone.length + historyDuplicates.length
        });
      }
    }

    // Also check for leads with inconsistent data
    const inconsistentLeads = await Lead.find({
      $or: [
        // isAssigned true but no assignedTo
        { isAssigned: true, assignedTo: null },
        { isAssigned: true, assignedTo: { $exists: false } },
        // isAssigned false but has assignedTo
        { isAssigned: false, assignedTo: { $exists: true, $ne: null } }
      ]
    }).select('_id name phone isAssigned assignedTo');

    return NextResponse.json({
      success: true,
      summary: {
        totalAgentsChecked: agents.length,
        agentsWithIssues: duplicateReport.length,
        totalDuplicatesFound: totalDuplicates,
        inconsistentLeadsFound: inconsistentLeads.length
      },
      duplicateReport,
      inconsistentLeads: inconsistentLeads.map(lead => ({
        leadId: lead._id,
        name: lead.name,
        phone: lead.phone,
        isAssigned: lead.isAssigned,
        assignedTo: lead.assignedTo,
        issue: lead.isAssigned && !lead.assignedTo
          ? 'Marked as assigned but no agent'
          : 'Marked as unassigned but has agent'
      }))
    });
  } catch (error) {
    console.error('Detect duplicates error:', error);
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
