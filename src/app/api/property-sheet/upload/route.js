import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import PropertySheet from '@/models/PropertySheet';

// Helper function to parse price string to number
function parsePrice(priceStr) {
  if (!priceStr) return null;

  // Remove all non-numeric characters except decimal point
  const cleanStr = priceStr.toString().replace(/[^0-9.]/g, '');
  const num = parseFloat(cleanStr);

  // Check if the original string contains 'Cr' or 'CR'
  if (priceStr.toString().toUpperCase().includes('CR')) {
    return num * 10000000; // Convert Cr to actual number
  }
  // Check if the original string contains 'L' for Lakhs
  if (priceStr.toString().toUpperCase().includes('L')) {
    return num * 100000; // Convert L to actual number
  }

  return num;
}

// POST - Upload CSV data
export async function POST(request) {
  try {
    await connectToDatabase();

    const data = await request.json();
    const { csvData, clearExisting } = data;

    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json(
        { success: false, message: 'Invalid CSV data' },
        { status: 400 }
      );
    }

    // Clear existing data if requested
    if (clearExisting) {
      await PropertySheet.deleteMany({});
    }

    // Transform CSV data to match schema
    const properties = csvData.map(row => ({
      builderName: row['BUILDER NAME'] || '',
      projectName: row['PROJECT NAME'] || '',
      location: row['LOCATION'] || '',
      projectDetails: row['PROJECT DETAILS'] || '',
      configuration: row['CONFIGURATION'] || '',
      carpetArea: row['CARPET AREA'] || '',
      superbuiltArea: row['SUPERBUILT AREA'] || '',
      price: row['PRICE'] || '',
      launchDate: row['LAUNCH DATE'] || '',
      possessionDate: row['POSSESSION DATE'] || '',
      amenities: row['AMENITIES'] || '',
      uspsHighlights: row["USP'S & HIGHLIGHTS"] || '',
      locationAdvantage: row['LOCATION ADVANTAGE'] || '',
      offers: row['OFFERS'] || '',
      channelSalesContact: row['CHANNEL SALES NAME & CONTACT'] || '',
      market: row['Market'] || '',
      priceMin: parsePrice(row['PRICE (MIN)']),
      priceMax: parsePrice(row['PRICE (MAX)'])
    }));

    // Bulk insert
    const result = await PropertySheet.insertMany(properties, { ordered: false });

    return NextResponse.json(
      {
        success: true,
        message: `Successfully uploaded ${result.length} properties`,
        count: result.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}

// GET - Get upload stats
export async function GET() {
  try {
    await connectToDatabase();

    const count = await PropertySheet.countDocuments();
    const lastUpload = await PropertySheet.findOne()
      .sort({ createdAt: -1 })
      .select('createdAt');

    return NextResponse.json(
      {
        success: true,
        data: {
          totalProperties: count,
          lastUploadDate: lastUpload?.createdAt || null
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
