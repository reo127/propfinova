import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { v4 as uuidv4 } from 'uuid';

// Helper function to parse CSV data
function parseCSVData(csvText, leadSource) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  // Validate CSV headers
  const requiredHeaders = ['name', 'phonenumber', 'location'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
  }

  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(',').map(v => v.trim());
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Transform to match our lead schema
    // Source priority: CSV column > dropdown selection > fallback
    const rowSource = (row.source || '').trim();
    const leadData = {
      name: row.name,
      phone: row.phonenumber,
      interestedLocation: row.location || '',
      source: rowSource || leadSource || 'bulk_upload'
    };

    // Add email if provided and not a placeholder value
    const emailValue = (row.email || '').trim();
    const emailPlaceholders = ['na', 'n/a', 'none', 'null', 'nil', '-', '--', 'not available', 'no email'];
    if (emailValue && !emailPlaceholders.includes(emailValue.toLowerCase())) {
      leadData.email = emailValue;
    }

    data.push(leadData);
  }

  return data;
}

// Helper function to validate lead data
function validateLeadData(leadData) {
  const errors = [];

  if (!leadData.name || leadData.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!leadData.phone || leadData.phone.trim() === '') {
    errors.push('Phone number is required');
  }

  if (!leadData.interestedLocation || leadData.interestedLocation.trim() === '') {
    errors.push('Location is required');
  }

  if (leadData.email && !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(leadData.email)) {
    errors.push('Invalid email format');
  }

  return errors;
}

// POST - Bulk create leads from CSV
export async function POST(request) {
  try {
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get('csvFile');
    const leadSource = (formData.get('leadSource') || '').trim();

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No CSV file provided' },
        { status: 400 }
      );
    }

    // Read CSV file content
    const csvText = await file.text();

    if (!csvText.trim()) {
      return NextResponse.json(
        { success: false, message: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Parse CSV data
    let leadDataArray;
    try {
      leadDataArray = parseCSVData(csvText, leadSource);
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: parseError.message },
        { status: 400 }
      );
    }

    if (leadDataArray.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid lead data found in CSV' },
        { status: 400 }
      );
    }

    // Validate all leads and collect errors
    const validationResults = [];
    const validLeads = [];

    leadDataArray.forEach((leadData, index) => {
      const errors = validateLeadData(leadData);
      const result = {
        rowNumber: index + 2, // +2 because index starts at 0 and we skip header
        leadData,
        errors,
        status: errors.length > 0 ? 'invalid' : 'valid'
      };

      validationResults.push(result);

      if (errors.length === 0) {
        validLeads.push(leadData);
      }
    });

    if (validLeads.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No valid leads found in CSV',
        validationResults
      }, { status: 400 });
    }

    // Check for duplicate phone numbers in the CSV itself
    const phoneNumbers = new Set();
    const duplicatesInCSV = [];

    validLeads.forEach((lead, index) => {
      if (phoneNumbers.has(lead.phone)) {
        duplicatesInCSV.push({
          phone: lead.phone,
          name: lead.name,
          rowNumber: index + 2
        });
      } else {
        phoneNumbers.add(lead.phone);
      }
    });

    // Check for existing leads in database
    const existingPhones = await Lead.find({
      phone: { $in: Array.from(phoneNumbers) }
    }).select('phone name');

    const existingPhoneSet = new Set(existingPhones.map(lead => lead.phone));

    // Filter out leads that already exist
    const newLeads = validLeads.filter(lead => !existingPhoneSet.has(lead.phone));

    // Process results
    const results = {
      totalRows: leadDataArray.length,
      validRows: validLeads.length,
      invalidRows: leadDataArray.length - validLeads.length,
      duplicatesInCSV: duplicatesInCSV.length,
      existingInDatabase: validLeads.length - newLeads.length,
      newLeadsToCreate: newLeads.length,
      validationResults,
      duplicatesInCSV,
      existingLeads: existingPhones.map(lead => ({
        phone: lead.phone,
        name: lead.name
      }))
    };

    // Create new leads in database
    let createdLeads = [];
    if (newLeads.length > 0) {
      try {
        createdLeads = await Lead.insertMany(newLeads);
        results.createdCount = createdLeads.length;
        results.createdLeads = createdLeads;
      } catch (createError) {
        console.error('Error creating leads:', createError);
        return NextResponse.json({
          success: false,
          message: 'Error creating leads in database',
          error: createError.message,
          results
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk upload completed. ${results.createdCount || 0} leads created successfully.`,
      results
    }, { status: 201 });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}