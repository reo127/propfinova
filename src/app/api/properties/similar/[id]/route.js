import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';

// GET similar properties for a specific property ID
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { id } = await params;
    
    // Check if ID is valid
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: 'Invalid property ID format' },
        { status: 400 }
      );
    }
    
    // Get the current property to understand its location and mode
    const currentProperty = await Property.findById(id);
    
    if (!currentProperty) {
      return NextResponse.json(
        { success: false, message: 'Property not found' },
        { status: 404 }
      );
    }
    
    const { location, mode } = currentProperty;
    const limit = 6;
    let similarProperties = [];

    // Base filter to only show approved properties (or old ones without status field)
    const statusFilter = {
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }
      ]
    };

    // Step 1: Try to find properties in the same exact location with same mode
    if (similarProperties.length < limit) {
      const sameLocationProps = await Property.find({
        _id: { $ne: id }, // Exclude current property
        location: location,
        mode: mode,
        ...statusFilter
      })
      .limit(limit - similarProperties.length)
      .sort({ createdAt: -1 });

      similarProperties.push(...sameLocationProps);
    }

    // Step 2: If not enough, try partial location matching (same city/area)
    if (similarProperties.length < limit) {
      // Extract keywords from location for broader matching
      const locationKeywords = location.toLowerCase().split(/[,\s]+/).filter(word => word.length > 2);
      const regexPattern = locationKeywords.join('|');

      const partialLocationProps = await Property.find({
        _id: {
          $ne: id,
          $nin: similarProperties.map(prop => prop._id) // Exclude already found properties
        },
        location: { $regex: regexPattern, $options: 'i' },
        mode: mode,
        ...statusFilter
      })
      .limit(limit - similarProperties.length)
      .sort({ createdAt: -1 });

      similarProperties.push(...partialLocationProps);
    }

    // Step 3: If still not enough, get random properties from Bangalore with same mode
    if (similarProperties.length < limit) {
      const bangaloreProps = await Property.find({
        _id: {
          $ne: id,
          $nin: similarProperties.map(prop => prop._id) // Exclude already found properties
        },
        location: { $regex: 'bangalore', $options: 'i' },
        mode: mode,
        ...statusFilter
      })
      .limit(limit - similarProperties.length)
      .sort({ createdAt: -1 });

      similarProperties.push(...bangaloreProps);
    }

    // Step 4: If still not enough, get any random properties with same mode (last resort)
    if (similarProperties.length < limit) {
      const anyProps = await Property.find({
        _id: {
          $ne: id,
          $nin: similarProperties.map(prop => prop._id) // Exclude already found properties
        },
        mode: mode,
        ...statusFilter
      })
      .limit(limit - similarProperties.length)
      .sort({ createdAt: -1 });

      similarProperties.push(...anyProps);
    }
    
    // Limit to exactly 6 properties
    similarProperties = similarProperties.slice(0, limit);
    
    return NextResponse.json(
      { 
        success: true, 
        count: similarProperties.length, 
        data: similarProperties,
        basedOn: {
          location: currentProperty.location,
          mode: currentProperty.mode
        }
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Get similar properties error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}