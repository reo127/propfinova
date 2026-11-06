import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { saveUpload } from '@/lib/saveUpload';

// Helper function to verify token
const verifyToken = (request) => {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return null;
    }

    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

// POST - store a property image or video on the server's upload folder
export async function POST(request) {
  try {
    const decoded = verifyToken(request);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Not authorized' },
        { status: 401 }
      );
    }

    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    const saved = await saveUpload(file, { allowVideo: true });

    return NextResponse.json(
      {
        success: true,
        url: saved.url,
        public_id: saved.fileName,
        size: saved.size,
        type: saved.type,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
