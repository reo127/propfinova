import { NextResponse } from 'next/server';

// GET - Download CSV template for bulk lead upload
export async function GET(request) {
  try {
    // CSV template headers and sample data
    const csvTemplate = `name,phonenumber,location,email,source
Rahul Sharma,9876543210,Whitefield,rahul@example.com,DS-Max
Priya Mehta,9845123456,Electronic City,,NoBroker
Amit Verma,9900012345,Sarjapur Road,amit@example.com,99acres`;

    // Create response with CSV content
    const response = new NextResponse(csvTemplate);

    // Set headers for file download
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', 'attachment; filename="lead_upload_template.csv"');

    return response;
  } catch (error) {
    console.error('Template download error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}