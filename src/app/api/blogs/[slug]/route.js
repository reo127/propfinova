import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Blog from '@/models/Blog';
import User from '@/models/User';
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

// GET - Fetch single blog by slug
export async function GET(request, { params }) {
  try {
    await connectToDatabase();

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    const isPreview = searchParams.get('preview') === 'true';
    
    let query = { slug };
    let requiresAuth = false;
    
    // If preview mode or admin request, check authentication
    if (isPreview || isAdmin) {
      requiresAuth = true;
    }
    
    // Verify admin token for preview/admin access
    if (requiresAuth) {
      const tokenVerification = await verifyAdminToken(request);
      if (!tokenVerification.isValid) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized access' },
          { status: 401 }
        );
      }
    } else {
      // For public requests, only show published blogs
      query.status = 'published';
    }
    
    const blog = await Blog.findOne(query).populate('author', 'name email');
    
    if (!blog) {
      return NextResponse.json(
        { success: false, message: 'Blog not found' },
        { status: 404 }
      );
    }
    
    // Increment views for public requests
    if (!isAdmin) {
      await blog.incrementViews();
    }
    
    // Get related blogs
    const relatedBlogs = await Blog.getRelatedBlogs(blog._id, blog.categories);
    
    return NextResponse.json({
      success: true,
      data: {
        blog,
        relatedBlogs
      }
    });
    
  } catch (error) {
    console.error('Error fetching blog:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch blog' },
      { status: 500 }
    );
  }
}

// PUT - Update blog (admin only)
export async function PUT(request, { params }) {
  try {
    await connectToDatabase();

    // Verify admin token
    const tokenVerification = await verifyAdminToken(request);
    if (!tokenVerification.isValid) {
      return NextResponse.json(
        { success: false, message: tokenVerification.error },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const data = await request.json();
    
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return NextResponse.json(
        { success: false, message: 'Blog not found' },
        { status: 404 }
      );
    }
    
    // Update blog fields
    Object.keys(data).forEach(key => {
      if (key !== '_id' && key !== 'slug' && key !== 'author') {
        blog[key] = data[key];
      }
    });
    
    await blog.save();
    await blog.populate('author', 'name email');
    
    return NextResponse.json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
    
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update blog' },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog (admin only)
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();

    // Verify admin token
    const tokenVerification = await verifyAdminToken(request);
    if (!tokenVerification.isValid) {
      return NextResponse.json(
        { success: false, message: tokenVerification.error },
        { status: 401 }
      );
    }

    const { slug } = await params;
    
    const blog = await Blog.findOneAndDelete({ slug });
    if (!blog) {
      return NextResponse.json(
        { success: false, message: 'Blog not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Blog deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete blog' },
      { status: 500 }
    );
  }
}