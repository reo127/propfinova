import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Property from '@/models/Property';
import jwt from 'jsonwebtoken';

const verifyToken = (request) => {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const properties = await Property.find({}).sort({ createdAt: -1 });
    
    const csvHeaders = [
      'title',
      'location', 
      'price',
      'type',
      'bhk',
      'mode',
      'description',
      'squareFootage',
      'amenities',
      'nearbyAmenities', 
      'nearbyLocations',
      'parkingSpaces',
      'floorNumber',
      'totalFloors',
      'furnishingStatus',
      'availabilityDate',
      'contactNumber',
      'gallery',
      'videos'
    ].join(',');
    
    const csvRows = properties.map(property => {
      return [
        `"${(property.title || '').replace(/"/g, '""')}"`,
        `"${(property.location || '').replace(/"/g, '""')}"`,
        `"${(property.price || '').replace(/"/g, '""')}"`,
        property.type || '',
        property.bhk || '',
        property.mode || '',
        `"${(property.description || '').replace(/"/g, '""')}"`,
        property.squareFootage || '',
        `"${(property.amenities || []).join(';').replace(/"/g, '""')}"`,
        `"${(property.nearbyAmenities || []).join(';').replace(/"/g, '""')}"`,
        `"${(property.nearbyLocations || []).join(';').replace(/"/g, '""')}"`,
        property.parkingSpaces || '',
        property.floorNumber || '',
        property.totalFloors || '',
        property.furnishingStatus || '',
        property.availabilityDate ? new Date(property.availabilityDate).toISOString().split('T')[0] : '',
        property.contactNumber || '',
        `"${(property.gallery || []).join(';').replace(/"/g, '""')}"`,
        `"${(property.videos || []).join(';').replace(/"/g, '""')}"`
      ].join(',');
    });
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="properties-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
    
  } catch (error) {
    console.error('Export properties error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Export failed' },
      { status: 500 }
    );
  }
}