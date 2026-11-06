import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';
import jwt from 'jsonwebtoken';

// Helper function to verify token (same as working upload API)
const verifyToken = (request) => {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return null;
    }
    
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// GET all properties with filtering
export async function GET(request) {
  try {
    await connectToDatabase();

    // Verify token to check if user is admin
    const decoded = verifyToken(request);

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const mode = searchParams.get('mode');
    const type = searchParams.get('type');
    const bhk = searchParams.get('bhk');
    const price = searchParams.get('price');

    // Build filter object
    const filter = {};
    const andConditions = [];

    // Only show approved properties to non-admin users; admins see all (for admin panel)
    if (!decoded || decoded.role !== 'admin') {
      andConditions.push({
        $or: [
          { status: 'approved' },
          { status: { $exists: false } }  // Include old properties without status field
        ]
      });
    }

    if (location) {
      // Search in multiple fields: title, location, developer
      andConditions.push({
        $or: [
          { title: { $regex: location, $options: 'i' } },
          { location: { $regex: location, $options: 'i' } },
          { developer: { $regex: location, $options: 'i' } }
        ]
      });
    }

    if (mode) {
      filter.mode = mode;
    }

    if (type) {
      filter.type = type;
    }

    if (bhk) {
      filter.bhk = bhk;
    }

    if (price) {
      // For string prices, we can do text search or regex matching
      // Convert to number if it's a numeric string, otherwise use text search
      const numericPrice = parseInt(price);
      if (!isNaN(numericPrice)) {
        // If price is numeric, still support numeric comparison for backward compatibility
        andConditions.push({
          $or: [
            { price: { $lte: numericPrice } }, // For old numeric prices
            { price: { $regex: price, $options: 'i' } } // For string prices containing the number
          ]
        });
      } else {
        // For non-numeric price strings, use text search
        filter.price = { $regex: price, $options: 'i' };
      }
    }

    // Combine all conditions
    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }
    
    const properties = await Property.find(filter).sort({ createdAt: -1 });
    
    return NextResponse.json(
      { success: true, count: properties.length, data: properties },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get properties error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}

// POST create a new property
export async function POST(request) {
  try {
    await connectToDatabase();
    
    // Verify token (same as working upload API)
    const decoded = verifyToken(request);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Not authorized, please login' },
        { status: 401 }
      );
    }

    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Only admins can add properties' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Add user ID to property data
    data.user = decoded.id;
    data.status = 'approved';

    // Create property
    const property = await Property.create(data);
    
    return NextResponse.json(
      { success: true, data: property },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create property error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}