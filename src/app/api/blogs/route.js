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

// Generate unique slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// GET - Fetch blogs (public and admin)
export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const isAdmin = searchParams.get('admin') === 'true';
    
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // If not admin request, only show published blogs
    if (!isAdmin) {
      query.status = 'published';
    } else {
      // Verify admin token for admin requests
      const tokenVerification = await verifyAdminToken(request);
      if (!tokenVerification.isValid) {
        return NextResponse.json(
          { success: false, message: tokenVerification.error },
          { status: 401 }
        );
      }
      
      if (status) {
        query.status = status;
      }
    }
    
    if (category) {
      query.categories = { $in: [category] };
    }
    
    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .select(isAdmin ? '' : '-content'); // Exclude content for public listing
    
    const totalBlogs = await Blog.countDocuments(query);
    const totalPages = Math.ceil(totalBlogs / limit);
    
    return NextResponse.json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalBlogs,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

// POST - Create new blog (admin only)
export async function POST(request) {
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
    
    const data = await request.json();
    const {
      title,
      content,
      excerpt,
      featuredImage,
      categories = [],
      tags = [],
      seo,
      status = 'draft'
    } = data;
    
    // Validate required fields
    if (!title || !content || !excerpt || !seo?.metaTitle || !seo?.metaDescription) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate unique slug
    let baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await Blog.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    const blog = new Blog({
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      categories,
      tags,
      seo,
      status,
      author: tokenVerification.userId
    });
    
    await blog.save();
    await blog.populate('author', 'name email');
    
    return NextResponse.json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating blog:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create blog' },
      { status: 500 }
    );
  }
}