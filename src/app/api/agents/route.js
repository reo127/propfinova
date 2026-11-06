import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

// GET - Get all agents
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    // Find all users with role 'agent'
    const agents = await User.find({ role: 'agent' }).select('-password');

    // If stats requested, add lead counts
    let agentsWithStats = agents;
    if (includeStats) {
      const Lead = (await import('@/models/Lead')).default;

      agentsWithStats = await Promise.all(
        agents.map(async (agent) => {
          const assignedCount = await Lead.countDocuments({
            assignedTo: agent._id,
            isAssigned: true
          });

          // Handled/contacted leads (any status other than initial 'new')
          const completedCount = await Lead.countDocuments({
            assignedTo: agent._id,
            isAssigned: true,
            status: { $ne: 'new' }
          });

          // Fresh leads waiting to be called
          const pendingCount = await Lead.countDocuments({
            assignedTo: agent._id,
            isAssigned: true,
            status: 'new'
          });

          // Converted / high-intent pipeline leads
          const convertedCount = await Lead.countDocuments({
            assignedTo: agent._id,
            isAssigned: true,
            status: { $in: ['interested', 'site_visit_scheduled', 'site_visit_done', 'follow_up_scheduled'] }
          });

          return {
            ...agent.toObject(),
            currentAssignedCount: assignedCount,
            currentCompletedCount: completedCount,
            currentPendingCount: pendingCount,
            currentConvertedCount: convertedCount
          };
        })
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: agentsWithStats.length,
        data: agentsWithStats
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}

// POST - Create a new agent
export async function POST(request) {
  try {
    await connectToDatabase();

    const data = await request.json();
    const { name, email, phone, password } = data;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if agent already exists
    const existingAgent = await User.findOne({ email });
    if (existingAgent) {
      return NextResponse.json(
        { success: false, message: 'An agent with this email already exists' },
        { status: 400 }
      );
    }

    // Create new agent
    const agent = await User.create({
      name,
      email,
      phone: phone || null,
      password,
      role: 'agent',
      isActive: true,
      assignedLeadsCount: 0,
      completedLeadsCount: 0
    });

    // Remove password from response
    const agentResponse = agent.toObject();
    delete agentResponse.password;

    return NextResponse.json(
      { success: true, data: agentResponse, message: 'Agent created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
