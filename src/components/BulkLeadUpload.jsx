'use client';

import { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Users
} from 'lucide-react';
import { useDashboardStore, useCRMStore } from '@/stores';

const LEAD_SOURCES = [
  'DS-Max',
  'NoBroker',
  '99acres',
  'MagicBricks',
  'Housing.com',
  'CommonFloor',
  'JustDial',
  'Walk-in',
  'Referral',
  'Facebook Ads',
  'Google Ads',
  'Other',
];

export default function BulkLeadUpload({ onUploadComplete, onClose }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [leadSource, setLeadSource] = useState('');
  const [customSource, setCustomSource] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'errors' | 'existing'

  const handleFileSelect = (selectedFile) => {
    setError('');
    setUploadResults(null);

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid CSV file (.csv format)');
      return;
    }

    // Validate file size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB maximum limit');
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to begin ingestion');
      return;
    }

    const resolvedSource = leadSource === 'Other' ? customSource.trim() : leadSource;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('leadSource', resolvedSource);

      const response = await fetch('/api/leads/bulk', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadResults(data.results);

        // Invalidate Zustand caches so dashboard and CRM leads refresh seamlessly
        if (data.results?.createdCount > 0) {
          useDashboardStore.getState().invalidateDashboard();
          useCRMStore.getState().invalidateLeadsCache();
        }

        if (onUploadComplete) {
          onUploadComplete(data.results);
        }
      } else {
        setError(data.message || 'Bulk upload encountered an error');
        if (data.results) {
          setUploadResults(data.results);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Network communication failed during CSV ingestion.');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/leads/template');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lead_upload_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Server template unavailable');
      }
    } catch (err) {
      console.warn('Falling back to client-side template generation:', err);
      const csvContent =
        'name,phonenumber,location,email,source\nRahul Sharma,9876543210,Whitefield,rahul@example.com,DS-Max\nPriya Mehta,9845123456,Electronic City,,NoBroker\nAmit Verma,9900012345,Sarjapur Road,amit@example.com,99acres';
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lead_upload_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResults(null);
    setError('');
    setActiveTab('summary');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative bg-surface rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Executive Header */}
        <div className="bg-gradient-to-r from-secondary via-[#111827] to-[#1E293B] text-white p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-darker text-btn-text flex items-center justify-center shadow-lg shadow-primary/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-light bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30">
                  CRM Ingestion Engine
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white mt-0.5">
                Bulk Lead Importer
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {!uploadResults ? (
            <>
              {/* Collapsible Format Requirements & Template Download */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all">
                <div
                  onClick={() => setShowGuide(!showGuide)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/60 select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      CSV File Format &amp; Column Requirements
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {showGuide ? 'Hide details' : 'Show details'}
                    </span>
                    {showGuide ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {showGuide && (
                  <div className="p-4 pt-0 border-t border-slate-200/60 space-y-3.5 text-xs text-slate-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div className="bg-surface p-3 rounded-xl border border-emerald-100 shadow-sm">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                          Mandatory Columns
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            name
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            phonenumber
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            location
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                          * 10-digit phone number, full prospect name, and primary interested area.
                        </p>
                      </div>

                      <div className="bg-surface p-3 rounded-xl border border-sky-100 shadow-sm">
                        <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block mb-1">
                          Optional Columns
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                            email
                          </span>
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                            source
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                          * If source column is left blank, default source dropdown below is assigned.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-slate-200/80">
                      <div className="text-[11px] text-slate-600">
                        <span className="font-bold text-slate-800">Duplicate Protection: </span>
                        Duplicate phone numbers (within sheet or already in database) are safely skipped to avoid spam.
                      </div>

                      <button
                        type="button"
                        onClick={downloadTemplate}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download CSV Template</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Default Lead Source Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span>Default Lead Source</span>
                  <span className="text-slate-400 font-normal normal-case text-[11px]">
                    (Applied when row source is empty)
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={leadSource}
                    onChange={(e) => {
                      setLeadSource(e.target.value);
                      setCustomSource('');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">-- Select Default Channel Source --</option>
                    {LEAD_SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>

                  {leadSource === 'Other' && (
                    <input
                      type="text"
                      placeholder="Specify custom channel name (e.g., Luxury Expo 2026)"
                      value={customSource}
                      onChange={(e) => setCustomSource(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  )}
                </div>
              </div>

              {/* Drag and Drop Upload Zone */}
              <div
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all ${
                  dragActive
                    ? 'border-primary bg-red-50/50 scale-[1.005]'
                    : file
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/40'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <FileCheck2 className="w-7 h-7" />
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready For Ingestion</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 truncate max-w-md mx-auto">
                        {file.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Size: {(file.size / 1024).toFixed(1)} KB &bull; Type: CSV Spreadsheet
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={resetUpload}
                      className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors underline underline-offset-4 cursor-pointer"
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>

                    <div>
                      <p className="text-sm sm:text-base font-bold text-slate-800">
                        Drag and drop your lead spreadsheet here
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports UTF-8 formatted CSV files up to 5MB
                      </p>
                    </div>

                    <div className="pt-2">
                      <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-[1.02]">
                        <UploadCloud className="w-4 h-4 text-primary-light" />
                        <span>Browse from Computer</span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Alert Display */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs flex items-start gap-3 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <span className="font-bold">Error: </span>
                    {error}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Upload Results Screen */
            <div className="space-y-6 animate-fadeIn">
              {/* Status Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-emerald-950">
                    Lead Ingestion Process Completed
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {uploadResults.createdCount || 0} fresh leads were successfully inserted into the CRM pipeline.
                  </p>
                </div>
              </div>

              {/* High-Level KPI Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Rows
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
                    {uploadResults.totalRows || 0}
                  </div>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-center">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                    Created
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1 tabular-nums">
                    {uploadResults.createdCount || 0}
                  </div>
                </div>

                <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 text-center">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                    Already Exists
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1 tabular-nums">
                    {uploadResults.existingInDatabase || 0}
                  </div>
                </div>

                <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 text-center">
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                    Invalid Rows
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1 tabular-nums">
                    {uploadResults.invalidRows || 0}
                  </div>
                </div>
              </div>

              {/* Tabs for Detailed Breakdown */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="flex border-b border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setActiveTab('summary')}
                    className={`px-4 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
                      activeTab === 'summary'
                        ? 'border-primary text-slate-900 bg-surface'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Ingestion Summary
                  </button>

                  {uploadResults.validationResults?.some((r) => r.errors?.length > 0) && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('errors')}
                      className={`px-4 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'errors'
                          ? 'border-rose-500 text-rose-700 bg-surface'
                          : 'border-transparent text-slate-500 hover:text-rose-600'
                      }`}
                    >
                      <span>Row Errors</span>
                      <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.5 rounded-full">
                        {uploadResults.validationResults.filter((r) => r.errors?.length > 0).length}
                      </span>
                    </button>
                  )}

                  {uploadResults.existingLeads?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('existing')}
                      className={`px-4 py-3 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                        activeTab === 'existing'
                          ? 'border-amber-500 text-amber-700 bg-surface'
                          : 'border-transparent text-slate-500 hover:text-amber-600'
                      }`}
                    >
                      <span>Skipped Duplicates</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full">
                        {uploadResults.existingLeads.length}
                      </span>
                    </button>
                  )}
                </div>

                <div className="p-4 max-h-56 overflow-y-auto">
                  {activeTab === 'summary' && (
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Total Parsed Rows:</span>
                        <span className="font-bold text-slate-900">{uploadResults.totalRows}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 text-emerald-700">
                        <span>Successfully Inserted into CRM:</span>
                        <span className="font-bold">{uploadResults.createdCount || 0}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 text-amber-700">
                        <span>Skipped Phone Duplicates (in Database):</span>
                        <span className="font-bold">{uploadResults.existingInDatabase || 0}</span>
                      </div>
                      {uploadResults.duplicatesInCSV > 0 && (
                        <div className="flex justify-between py-1 border-b border-slate-100 text-amber-700">
                          <span>Skipped Duplicate Rows within CSV:</span>
                          <span className="font-bold">{uploadResults.duplicatesInCSV}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1 text-rose-700">
                        <span>Invalid / Corrupt Rows:</span>
                        <span className="font-bold">{uploadResults.invalidRows || 0}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'errors' && (
                    <div className="space-y-2">
                      {uploadResults.validationResults
                        ?.filter((r) => r.errors?.length > 0)
                        .map((res, i) => (
                          <div
                            key={i}
                            className="bg-rose-50/70 border border-rose-100 rounded-xl p-2.5 text-xs text-rose-800 flex items-start gap-2"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Row {res.rowNumber}: </span>
                              <span>{res.errors.join(' &bull; ')}</span>
                              {res.leadData?.name && (
                                <span className="text-[11px] text-rose-600 block mt-0.5">
                                  Entry: &quot;{res.leadData.name}&quot; ({res.leadData.phone || 'No phone'})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {activeTab === 'existing' && (
                    <div className="divide-y divide-slate-100 text-xs">
                      {uploadResults.existingLeads?.map((lead, i) => (
                        <div key={i} className="py-2 flex items-center justify-between text-slate-700">
                          <span className="font-medium text-slate-900">{lead.name || 'Unnamed Prospect'}</span>
                          <span className="font-mono text-slate-500">{lead.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          {!uploadResults ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-surface border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading || (leadSource === 'Other' && !customSource.trim())}
                className="px-6 py-2.5 text-xs sm:text-sm font-bold text-btn-text bg-gradient-to-r from-primary to-primary-dark hover:from-primary hover:to-primary-darker rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Ingesting &amp; Validating Leads...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Ingest Leads Now</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={resetUpload}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-surface border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Upload Another Sheet
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete &amp; Return</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}