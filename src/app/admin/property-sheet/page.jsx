'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Trash2,
  ShieldAlert,
  Download,
  Database,
  X,
  FileCheck
} from 'lucide-react';

export default function PropertySheetUpload() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [clearExisting, setClearExisting] = useState(true);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role !== 'admin') {
        router.push('/admin');
        return;
      }
    }
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/property-sheet/upload');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setMessage({ type: '', text: '' });
    } else {
      setMessage({ type: 'error', text: 'Please select a valid CSV file (.csv)' });
      setFile(null);
    }
  };

  const parseCSV = (text) => {
    const result = [];
    let row = [];
    let cell = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          cell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(cell.trim());
        cell = '';
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        if (cell || row.length > 0) {
          row.push(cell.trim());
          if (row.some(c => c.length > 0)) {
            result.push(row);
          }
          row = [];
          cell = '';
        }
      } else {
        cell += char;
      }
    }

    if (cell || row.length > 0) {
      row.push(cell.trim());
      if (row.some(c => c.length > 0)) {
        result.push(row);
      }
    }

    if (result.length === 0) return [];

    const headers = result[0].map(h => h.trim());
    const data = [];
    for (let i = 1; i < result.length; i++) {
      const itemRow = {};
      headers.forEach((header, index) => {
        itemRow[header] = result[i][index] || '';
      });
      data.push(itemRow);
    }

    return data;
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a CSV file first' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const text = await file.text();
      const csvData = parseCSV(text);

      const response = await fetch('/api/property-sheet/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData,
          clearExisting
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Master property inventory updated successfully! Parsed & stored ${data.count} properties.`
        });
        setFile(null);
        fetchStats();
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'CSV upload processing failed'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to upload file. Please verify CSV encoding and headers.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
              Master Property Sheet
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Database Sync
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Bulk-upload and synchronize the comprehensive property inventory used by advisors during sales calls.
          </p>
        </div>

        <button
          onClick={() => router.push('/admin/property-search')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-surface hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors self-start md:self-auto"
        >
          <Database className="w-3.5 h-3.5 text-primary" />
          <span>Open Search Terminal</span>
        </button>
      </div>

      {/* Database Telemetry Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Indexed Projects
              </div>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {stats.totalProperties}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Active in matchmaker engine</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Last Database Sync
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {stats.lastUploadDate
                  ? new Date(stats.lastUploadDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Never Synced'}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                ● Master sheet active
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Upload Box */}
      <div className="bg-surface rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Upload Master CSV</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a sanitized comma-separated (.csv) file containing complete project records.
          </p>
        </div>

        {/* Drag & Drop Visual Field */}
        <label className="relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl bg-slate-50/50 hover:bg-rose-50/30 transition-all cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-surface text-primary shadow-xs flex items-center justify-center mb-3 group-hover:scale-105 transition-transform border border-slate-200">
            <UploadCloud className="w-7 h-7" />
          </div>
          <span className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
            {file ? file.name : 'Click to select or drag & drop CSV file'}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Maximum file size: 25MB • Standard UTF-8 CSV'}
          </span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Clear Existing Checkbox */}
        <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start space-x-3">
          <input
            type="checkbox"
            id="clearExisting"
            checked={clearExisting}
            onChange={(e) => setClearExisting(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-primary rounded focus:ring-primary accent-primary"
          />
          <div className="space-y-0.5">
            <label htmlFor="clearExisting" className="text-xs font-bold text-amber-900 cursor-pointer">
              Replace entire database with this upload (Recommended)
            </label>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Clears previous entries to prevent duplicate project records and stale price points.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-3.5 px-4 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center space-x-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              <span>Parsing and Indexing Master Sheet...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Upload and Reindex Database</span>
            </>
          )}
        </button>

        {/* Format Guidelines */}
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <FileCheck className="w-4 h-4 text-primary" />
            <span>Required CSV Columns</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ensure your CSV spreadsheet contains the following standard headers in the first row:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['BUILDER NAME', 'PROJECT NAME', 'LOCATION', 'MARKET', 'CONFIGURATION', 'PRICE', 'CARPET AREA', 'POSSESSION DATE', 'USPS HIGHLIGHTS', 'CHANNEL SALES CONTACT'].map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-lg bg-surface border border-slate-200 text-[11px] font-bold text-slate-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
