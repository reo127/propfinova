import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import HeroImage from '@/models/HeroImage';
import jwt from 'jsonwebtoken';

const DEFAULT_HERO_IMAGE = {
  image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=900&h=1125&fit=crop&crop=center',
  alt: "Bangalore skyline, one of the cities PropFinova lists properties in",
  statLabel: 'Across six cities, right now',
  statValue: 'New listings added weekly',
  aboutImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=600&fit=crop&crop=center',
  aboutTitle: 'About *PropFinova*',
  aboutSubtitle: 'Your trusted partner in real estate excellence, connecting dreams with reality since our inception.',
  topCities: ["Bangalore", "Mumbai", "Pune", "Hyderabad", "Chennai", "Delhi NCR"],
  popularLocalities: [
    "Whitefield, Bengaluru",
    "Baner, Pune",
    "Andheri, Mumbai",
    "Gachibowli, Hyderabad",
    "Noida Sector 150",
    "Velachery, Chennai"
  ]
};

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

// GET - Fetch the hero image (public)
export async function GET() {
  try {
    await connectToDatabase();

    const heroImage = await HeroImage.findOne({});

    return NextResponse.json({
      success: true,
      data: heroImage || DEFAULT_HERO_IMAGE
    });

  } catch (error) {
    console.error('Error fetching hero image:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch hero image' },
      { status: 500 }
    );
  }
}

// PUT - Create or update the hero image (admin only, singleton)
export async function PUT(request) {
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
    const { image, alt, statLabel, statValue, topCities, popularLocalities, aboutImage, aboutTitle, aboutSubtitle } = data;

    if (!image) {
      return NextResponse.json(
        { success: false, message: 'Image is required' },
        { status: 400 }
      );
    }

    const heroImage = await HeroImage.findOneAndUpdate(
      {},
      { $set: { image, alt, statLabel, statValue, topCities, popularLocalities, aboutImage, aboutTitle, aboutSubtitle } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Hero image updated successfully',
      data: heroImage
    });

  } catch (error) {
    console.error('Error updating hero image:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update hero image' },
      { status: 500 }
    );
  }
}
