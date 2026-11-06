import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Banner from '@/models/Banner';
import jwt from 'jsonwebtoken';

// Helper function to verify admin token
async function verifyAdminToken(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return { isValid: false, error: 'No token provided' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return { isValid: false, error: 'Admin access required' };
    }

    return { isValid: true, userId: decoded.id };
  } catch (error) {
    return { isValid: false, error: 'Invalid token' };
  }
}

// PUT - Update banner (admin only)
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();

    const tokenVerification = await verifyAdminToken(request);
    if (!tokenVerification.isValid) {
      return NextResponse.json(
        { success: false, message: tokenVerification.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await request.json();
    const { image, title, subtitle, link, alt } = data;

    const banner = await Banner.findByIdAndUpdate(
      id,
      { image, title, subtitle, link, alt },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return NextResponse.json(
        { success: false, message: 'Banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });

  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update banner' },
      { status: 500 }
    );
  }
}

// DELETE - Delete banner (admin only)
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();

    const tokenVerification = await verifyAdminToken(request);
    if (!tokenVerification.isValid) {
      return NextResponse.json(
        { success: false, message: tokenVerification.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      return NextResponse.json(
        { success: false, message: 'Banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
