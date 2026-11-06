import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';

// GET - Get a single lead by ID
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const lead = await Lead.findById(id).populate('assignedTo', 'name email');

    if (!lead) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: lead },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get lead by ID error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}

// PUT - Update lead information (name, email, phone, location)
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const data = await request.json();
    const { name, email, phone, interestedLocation } = data;

    const lead = await Lead.findById(id);

    if (!lead) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (name) lead.name = name;
    if (email !== undefined) lead.email = email;
    if (phone) lead.phone = phone;
    if (interestedLocation) lead.interestedLocation = interestedLocation;

    const updatedLead = await lead.save();

    return NextResponse.json(
      { success: true, data: updatedLead, message: 'Lead updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a lead by ID
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Lead deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
