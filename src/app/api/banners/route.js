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

// GET - Fetch all banners (public)
export async function GET() {
  try {
    await connectToDatabase();

    const banners = await Banner.find({}).sort({ createdAt: 1 });

    return NextResponse.json({
      success: true,
      data: banners
    });

  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

// POST - Create new banner (admin only)
export async function POST(request) {
  try {
    await connectToDatabase();

    const tokenVerification = await verifyAdminToken(request);
    if (!tokenVerification.isValid) {
      return NextResponse.json(
        { success: false, message: tokenVerification.error },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { image, title, subtitle, link, alt } = data;

    if (!image) {
      return NextResponse.json(
        { success: false, message: 'Image is required' },
        { status: 400 }
      );
    }

    const banner = await Banner.create({ image, title, subtitle, link, alt });

    return NextResponse.json({
      success: true,
      message: 'Banner created successfully',
      data: banner
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create banner' },
      { status: 500 }
    );
  }
}
