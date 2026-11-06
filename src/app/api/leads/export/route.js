import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import * as XLSX from 'xlsx';

// Format date for export
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Format notes for export
const formatNotes = (notes) => {
  if (!notes || notes.length === 0) return '';

  return notes.map((note, index) => {
    const noteDate = formatDate(note.addedAt);
    const addedBy = note.addedBy || 'admin';
    return `[${index + 1}] ${note.content} (Added by: ${addedBy}, Date: ${noteDate})`;
  }).join('\n\n');
};

// Format status display
const formatStatus = (status) => {
  const statusMap = {
    'new': 'New',
    'not_connected': 'Not Connected',
    'interested': 'Interested',
    'site_visit_scheduled': 'Site Visit Scheduled',
    'visit_rescheduled': 'Visit Rescheduled',
    'follow_up_scheduled': 'Follow-up Scheduled',
    'follow_up': 'Follow Up',
    'not_interested': 'Not Interested',
    'call_disconnected': 'Call Disconnected',
    'location_mismatch': 'Location Mismatch',
    'budget_mismatch': 'Budget Mismatch',
    'possession_mismatch': 'Possession Mismatch',
    'do_not_disturb': 'Do Not Disturb',
    'site_visit_done': 'Site Visit Done'
  };
  return statusMap[status] || status || 'New';
};

// Format substatus display
const formatSubstatus = (substatus) => {
  if (!substatus) return '';

  const substatusMap = {
    'ringing': 'Ringing',
    'switched_off': 'Switched Off',
    'call_busy': 'Call Busy',
    'call_disconnected': 'Call Disconnected',
    'invalid_number': 'Invalid Number',
    'site_visit_scheduled_with_date': 'Site Visit Scheduled (With Date)',
    'site_visit_scheduled_no_date': 'Site Visit Scheduled (No Date)',
    'follow_up': 'Follow Up',
    'not_actively_searching': 'Not Actively Searching',
    'require_more_than_6_months': 'Require More Than 6 Months',
    'not_the_right_party': 'Not The Right Party',
    'hang_up_while_talking': 'Hang Up While Talking',
    'call_drop': 'Call Drop',
    'looking_for_other_location': 'Looking For Other Location',
    'looking_for_other_city': 'Looking For Other City',
    'budget_is_low': 'Budget Is Low',
    'budget_is_high': 'Budget Is High',
    'looking_for_ready_to_move': 'Looking For Ready To Move',
    'looking_for_under_construction': 'Looking For Under Construction',
    'already_in_touch_with_builder': 'Already In Touch With Builder',
    'deal_closed': 'Deal Closed',
    'plan_drop': 'Plan Drop',
    'plan_postponed': 'Plan Postponed',
    'already_purchased': 'Already Purchased',
    'dnc': 'DNC',
    'interested_in_revisit': 'Interested In Re-visit',
    'plan_cancelled': 'Plan Cancelled'
  };

  return substatusMap[substatus] || substatus;
};

// GET - Export leads to CSV or Excel
export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query
    let query = {};

    // Apply status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Apply search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { interestedLocation: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Fetch leads
    const leads = await Lead.find(query).sort({ createdAt: -1 });

    if (leads.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No leads found to export' },
        { status: 404 }
      );
    }

    // Prepare data for export
    const exportData = leads.map((lead, index) => ({
      'Sr. No.': index + 1,
      'Lead ID': lead._id.toString().slice(-8),
      'Name': lead.name || '',
      'Phone': lead.phone || '',
      'Email': lead.email || '',
      'Interested Location': lead.interestedLocation || '',
      'Status': formatStatus(lead.status),
      'Sub-Status': formatSubstatus(lead.substatus),
      'Site Visit Date': lead.siteVisitDate ? formatDate(lead.siteVisitDate) : '',
      'Follow-up Date': lead.followUpDate ? formatDate(lead.followUpDate) : '',
      'Source': lead.source || 'website',
      'Date Added': formatDate(lead.createdAt),
      'Last Updated': formatDate(lead.updatedAt),
      'Notes': formatNotes(lead.notes),
      'Total Notes': (lead.notes || []).length
    }));

    if (format === 'excel') {
      // Generate Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 8 },   // Sr. No.
        { wch: 12 },  // Lead ID
        { wch: 20 },  // Name
        { wch: 15 },  // Phone
        { wch: 25 },  // Email
        { wch: 20 },  // Interested Location
        { wch: 18 },  // Status
        { wch: 25 },  // Sub-Status
        { wch: 20 },  // Site Visit Date
        { wch: 20 },  // Follow-up Date
        { wch: 12 },  // Source
        { wch: 18 },  // Date Added
        { wch: 18 },  // Last Updated
        { wch: 50 },  // Notes
        { wch: 12 }   // Total Notes
      ];
      worksheet['!cols'] = columnWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

      // Generate buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Return Excel file
      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=leads_export_${new Date().toISOString().split('T')[0]}.xlsx`
        }
      });

    } else {
      // Generate CSV file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);

      // Return CSV file
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=leads_export_${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }

  } catch (error) {
    console.error('Export leads error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
