import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
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

// DELETE - remove a property from the logged-in user's wishlist
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();

    const decoded = verifyToken(request);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Not authorized, please login' }, { status: 401 });
    }

    const { propertyId } = await params;
    await User.updateOne({ _id: decoded.id }, { $pull: { wishlist: propertyId } });

    return NextResponse.json({ success: true, message: 'Removed from wishlist' }, { status: 200 });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server Error' }, { status: 500 });
  }
}
