import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Property from '@/models/Property';
import jwt from 'jsonwebtoken';

const verifyToken = (request) => {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

// GET - the logged-in user's saved properties
export async function GET(request) {
  try {
    await connectToDatabase();

    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Not authorized, please login' }, { status: 401 });
    }

    const user = await User.findById(decoded.id).select('wishlist').lean();
    const properties = await Property.find({ _id: { $in: user?.wishlist || [] } }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: properties.length, data: properties }, { status: 200 });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}

// POST - save a property to the logged-in user's wishlist
export async function POST(request) {
  try {
    await connectToDatabase();

    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Not authorized, please login' }, { status: 401 });
    }

    const { propertyId } = await request.json();
    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'propertyId is required' }, { status: 400 });
    }

    await User.updateOne({ _id: decoded.id }, { $addToSet: { wishlist: propertyId } });

    return NextResponse.json({ success: true, message: 'Added to wishlist' }, { status: 200 });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}
