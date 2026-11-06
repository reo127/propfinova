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

const parseCSV = (csvText) => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          currentValue += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    if (values.length === headers.length) {
      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[header] = values[index] || '';
      });
      rows.push(rowObj);
    }
  }
  
  return rows;
};

export async function POST(request) {
  try {
    await connectToDatabase();
    
    const decoded = verifyToken(request);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('csvFile');
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No CSV file provided' },
        { status: 400 }
      );
    }
    
    const csvText = await file.text();
    const rows = parseCSV(csvText);
    
    const results = {
      success: [],
      errors: []
    };
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        const propertyData = {
          title: row.title,
          location: row.location,
          price: row.price,
          type: row.type,
          bhk: row.bhk || 'na',
          mode: row.mode,
          description: row.description,
          squareFootage: row.squareFootage ? parseInt(row.squareFootage) : undefined,
          amenities: row.amenities ? row.amenities.split(';').filter(a => a.trim()) : [],
          nearbyAmenities: row.nearbyAmenities ? row.nearbyAmenities.split(';').filter(a => a.trim()) : [],
          nearbyLocations: row.nearbyLocations ? row.nearbyLocations.split(';').filter(a => a.trim()) : [],
          parkingSpaces: row.parkingSpaces ? parseInt(row.parkingSpaces) : undefined,
          floorNumber: row.floorNumber ? parseInt(row.floorNumber) : undefined,
          totalFloors: row.totalFloors ? parseInt(row.totalFloors) : undefined,
          furnishingStatus: row.furnishingStatus || undefined,
          availabilityDate: row.availabilityDate ? new Date(row.availabilityDate) : undefined,
          contactNumber: row.contactNumber,
          gallery: row.gallery ? row.gallery.split(';').filter(g => g.trim()) : ['https://via.placeholder.com/300x200?text=No+Image'],
          videos: row.videos ? row.videos.split(';').filter(v => v.trim()) : [],
          user: decoded.id
        };
        
        Object.keys(propertyData).forEach(key => {
          if (propertyData[key] === undefined || propertyData[key] === '') {
            delete propertyData[key];
          }
        });
        
        if (!propertyData.gallery || propertyData.gallery.length === 0) {
          propertyData.gallery = ['https://via.placeholder.com/300x200?text=No+Image'];
        }
        
        const property = await Property.create(propertyData);
        results.success.push({
          row: i + 1,
          title: property.title,
          id: property._id
        });
        
      } catch (error) {
        results.errors.push({
          row: i + 1,
          title: row.title || 'Unknown',
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.success.length} properties created, ${results.errors.length} errors`,
      results
    });
    
  } catch (error) {
    console.error('Import properties error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Import failed' },
      { status: 500 }
    );
  }
}