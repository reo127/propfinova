import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { saveUpload } from '@/lib/saveUpload';

// Helper function to verify admin token
async function verifyAdminToken(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return { isValid: false, error: 'Your session has expired. Please log in again.' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return { isValid: false, error: 'Only admins can upload images.' };
    }

    return { isValid: true, userId: decoded.id };
  } catch {
    return { isValid: false, error: 'Your session has expired. Please log in again.' };
  }
}

// POST - Upload an image (admin only). Stored on the server's upload folder.
export async function POST(request) {
  try {
    const tokenVerification = await verifyAdminToken(request);
    if (!tokenVerification.isValid) {
      return NextResponse.json(
        { success: false, message: tokenVerification.error },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image');

    const saved = await saveUpload(file);

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: saved,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Something went wrong while uploading. Please try again.',
      },
      { status: 400 }
    );
  }
}
