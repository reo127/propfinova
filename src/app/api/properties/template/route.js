import { NextResponse } from 'next/server';

export async function GET() {
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
  
  const sampleRow = [
    '"Sample 2BHK Apartment"',
    '"Mumbai, Maharashtra"',
    '"50000"',
    'flat',
    '2bhk',
    'rent',
    '"Beautiful 2BHK apartment with modern amenities"',
    '1200',
    '"Gym;Swimming Pool;Parking"',
    '"Metro Station;Shopping Mall;Hospital"',
    '"Bandra;Kurla;Andheri"',
    '1',
    '3',
    '10',
    'semi-furnished',
    '2024-01-01',
    '9876543210',
    '"https://example.com/image1.jpg;https://example.com/image2.jpg"',
    '"https://youtube.com/watch?v=sample"'
  ].join(',');
  
  const csvContent = [
    csvHeaders,
    sampleRow
  ].join('\n');
  
  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="properties-template.csv"'
    }
  });
}