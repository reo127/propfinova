'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Download,
  Upload,
  Edit3,
  Trash2,
  CheckCircle2,
  MapPin,
  FileSpreadsheet,
  AlertCircle,
  X,
  Eye
} from 'lucide-react';
import EditPropertyModal from '@/app/components/EditPropertyModal';
import { generatePropertyUrl } from '@/utils/slugify';
import { formatPrice } from '@/utils/formatPrice';
import { usePropertyStore, useDashboardStore } from '@/stores';

export default function AdminProperties() {
  const adminProperties = usePropertyStore((state) => state.adminProperties);
  const fetchAdminProperties = usePropertyStore((state) => state.fetchAdminProperties);
  const removePropertyStore = usePropertyStore((state) => state.removeProperty);
  const updatePropertyStore = usePropertyStore((state) => state.updateProperty);
  const invalidateDashboard = useDashboardStore((state) => state.invalidateDashboard);

  const [loading, setLoading] = useState(!adminProperties?.length);
  const [properties, setProperties] = useState(adminProperties || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProperty, setEditingProperty] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResults, setImportResults] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async (force = false) => {
    try {
      if (!properties.length) setLoading(true);
      const res = await fetchAdminProperties({ force });

      if (res.success && Array.isArray(res.data)) {
        setProperties(res.data);
        setError('');
      } else if (res.error) {
        setError(res.error || 'Failed to fetch properties');
      }
    } catch (err) {
      setError('Error connecting to property portfolio database');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setError('');
    setSuccess('');
  };

  const handleDelete = (property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/properties/${propertyToDelete._id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Property removed from portfolio successfully');
        setProperties(prev => prev.filter(p => p._id !== propertyToDelete._id));
        removePropertyStore(propertyToDelete._id);
        invalidateDashboard();
        setShowDeleteModal(false);
        setPropertyToDelete(null);
      } else {
        setError(data.message || 'Failed to delete property');
      }
    } catch (err) {
      setError('Error deleting property');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateProperty = (updatedProperty) => {
    setProperties(prev => prev.map(p =>
      p._id === updatedProperty._id ? updatedProperty : p
    ));
    updatePropertyStore(updatedProperty._id, updatedProperty);
    invalidateDashboard();
    setSuccess('Property listing updated successfully');
    setEditingProperty(null);
  };


  const handleExport = async () => {
    setExporting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/properties/export', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `properties-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        setSuccess('Properties exported to CSV successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Export failed');
      }
    } catch (err) {
      setError('Error exporting property data');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a valid .csv file');
      return;
    }

    setImporting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('csvFile', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/properties/import', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setImportResults(data.results);
        setSuccess(data.message || 'CSV imported successfully');
        invalidateDashboard();
        fetchProperties(true);
        setShowImportModal(true);
      } else {
        setError(data.message || 'Import failed');
      }
    } catch (err) {
      setError('Error importing properties CSV');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const filteredProperties = properties.filter((property) =>
    !searchTerm ||
    property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl border-2 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-700">Loading Property Portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Executive Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
              Property Portfolio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {properties.length} Listings
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Curate luxury residences, commercial suites, and direct owner listings across Mumbai & NCR.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/api/properties/template"
            download="properties-template.csv"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-surface hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Template</span>
          </a>

          <label className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-surface hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>{importing ? 'Importing...' : 'Import CSV'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExport}
            disabled={exporting || properties.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-surface hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <Link
            href="/list-property"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="p-1 text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-xs p-4 flex justify-end">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or locality..."
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-primary focus:bg-surface transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Properties Table */}
      {filteredProperties.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-16 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No properties matched criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Try searching with a different locality or property name.'
              : 'Add your first property listing to begin curating the portfolio.'}
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-700">
                  <th className="py-3.5 px-5">Property Title &amp; Details</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Price / Rent</th>
                  <th className="py-3.5 px-4">Type / Mode</th>
                  <th className="py-3.5 px-4">Listed Date</th>
                  <th className="py-3.5 px-5 text-right">Portfolio Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProperties.map((property) => (
                  <tr
                    key={property._id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Thumbnail & Title */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center space-x-3.5">
                        <div className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                          {property.gallery && property.gallery[0] ? (
                            <img
                              src={property.gallery[0]}
                              alt={property.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate max-w-xs">
                            {property.title}
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                            {property.bhk && property.bhk !== 'na' && (
                              <span className="font-semibold text-slate-700">
                                {property.bhk.toUpperCase()}
                              </span>
                            )}
                            {property.furnishingStatus && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{property.furnishingStatus.replace('-', ' ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{property.location}</span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-black text-slate-900">
                        ₹{formatPrice(property.price)}
                      </div>
                      {property.mode === 'rent' && (
                        <div className="text-[10px] text-slate-600 font-semibold">per month</div>
                      )}
                    </td>

                    {/* Type & Mode */}
                    <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 uppercase tracking-wider">
                          {property.type}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          property.mode === 'rent'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          For {property.mode}
                        </span>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {new Date(property.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          href={generatePropertyUrl(property)}
                          target="_blank"
                          title="View Live Listing"
                          className="p-1.5 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleEdit(property)}
                          title="Edit Listing Specs"
                          className="p-1.5 text-slate-600 hover:text-white bg-slate-100 hover:bg-slate-900 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(property)}
                          title="Delete Property"
                          className="p-1.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Property Modal Component */}
      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onUpdate={handleUpdateProperty}
        />
      )}

      {/* Import CSV Results Modal */}
      {showImportModal && importResults && (
        <div className="fixed inset-0 bg-secondary/75 backdrop-blur-xs z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">CSV Import Summary</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResults(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importResults.success?.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-800">
                  Imported Successfully ({importResults.success.length})
                </div>
                <div className="max-h-36 overflow-y-auto bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
                  {importResults.success.map((item) => (
                    <div key={item.id} className="font-medium">
                      Row {item.row}: {item.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResults.errors?.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-rose-800">
                  Parsing Errors ({importResults.errors.length})
                </div>
                <div className="max-h-36 overflow-y-auto bg-rose-50/60 p-3 rounded-xl border border-rose-100 text-xs text-rose-800 space-y-1">
                  {importResults.errors.map((item, index) => (
                    <div key={index}>
                      Row {item.row}: {item.title || 'Unknown'} — {item.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResults(null);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-secondary/75 backdrop-blur-xs z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Remove Listing</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete &quot;{propertyToDelete?.title}&quot;? This action cannot be reversed.
              </p>
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPropertyToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}