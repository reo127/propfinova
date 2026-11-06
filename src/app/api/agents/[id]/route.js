import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

// GET - Get a single agent by ID
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const agent = await User.findOne({
      _id: id,
      role: 'agent'
    }).select('-password');

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get lead statistics
    const Lead = (await import('@/models/Lead')).default;

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

    return NextResponse.json(
      {
        success: true,
        data: {
          ...agent.toObject(),
          currentAssignedCount: assignedCount,
          currentCompletedCount: completedCount,
          currentPendingCount: pendingCount,
          currentConvertedCount: convertedCount
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get agent by ID error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}

// PUT - Update agent information
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const data = await request.json();
    const { name, email, phone, isActive, password } = data;

    const agent = await User.findOne({
      _id: id,
      role: 'agent'
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Agent not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (name !== undefined) agent.name = name;
    if (email !== undefined) {
      // Check if email is already in use by another user
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Email is already in use' },
          { status: 400 }
        );
      }
      agent.email = email;
    }
    if (phone !== undefined) agent.phone = phone;
    if (isActive !== undefined) agent.isActive = isActive;

    // Update password if provided
    if (password && password.trim() !== '') {
      agent.password = password;
    }

    const updatedAgent = await agent.save();

    // Remove password from response
    const agentResponse = updatedAgent.toObject();
    delete agentResponse.password;

    return NextResponse.json(
      { success: true, data: agentResponse, message: 'Agent updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update agent error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an agent
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const agent = await User.findOne({
      _id: id,
      role: 'agent'
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, message: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if agent has assigned leads
    const Lead = (await import('@/models/Lead')).default;
    const assignedLeadsCount = await Lead.countDocuments({
      assignedTo: agent._id,
      isAssigned: true
    });

    if (assignedLeadsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete agent with ${assignedLeadsCount} assigned leads. Please reassign leads first.`
        },
        { status: 400 }
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: 'Agent deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete agent error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
