'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  Building2,
  MapPin,
  Calendar,
  IndianRupee,
  Phone,
  Copy,
  Check,
  ChevronDown,
  X,
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
  Tag,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { usePropertySearchStore } from '@/stores';

// Searchable Select Component with Executive Styling
function SearchableSelect({ value, onChange, options = [], placeholder, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeOptions = Array.isArray(options) ? options : [];
  const filteredOptions = safeOptions.filter(option =>
    option && option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const displayValue = value || placeholder;

  return (
    <div ref={wrapperRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/15 focus:border-primary cursor-pointer text-xs font-semibold flex justify-between items-center transition-colors"
      >
        <span className={value ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium truncate'}>
          {displayValue}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-surface border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
            <div
              onClick={() => handleSelect('')}
              className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs text-slate-600 italic"
            >
              {placeholder}
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`px-3 py-2 hover:bg-rose-50 hover:text-primary cursor-pointer text-xs transition-colors ${
                    value === option ? 'bg-primary/10 text-primary font-bold' : 'text-slate-800 font-medium'
                  }`}
                >
                  {option}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-slate-400 text-xs">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentPropertySearch() {
  const router = useRouter();
  const filterOptions = usePropertySearchStore((state) => state.filterOptions);
  const fetchFilterOptions = usePropertySearchStore((state) => state.fetchFilterOptions);
  const fetchAdminSearch = usePropertySearchStore((state) => state.fetchAdminSearch);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [copiedNote, setCopiedNote] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    builder: '',
    project: '',
    location: '',
    market: '',
    configuration: '',
    minPrice: '',
    maxPrice: '',
    possessionDate: '',
    launchDate: '',
    propertyType: '',
    amenities: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    // Check if user is agent
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role !== 'agent') {
        router.push('/');
        return;
      }
    }
    fetchFilterOptions();
    searchProperties(1);
  }, [router]);

  const searchProperties = async (page = 1, currentFilters = filters, force = false) => {
    setLoading(true);
    try {
      const result = await fetchAdminSearch(currentFilters, page, pagination.limit, { force });
      if (result.success) {
        setProperties(result.data || []);
        setPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    searchProperties(1, filters, true);
  };

  const handleClearFilters = () => {
    const cleared = {
      search: '',
      builder: '',
      project: '',
      location: '',
      market: '',
      configuration: '',
      minPrice: '',
      maxPrice: '',
      possessionDate: '',
      launchDate: '',
      propertyType: '',
      amenities: ''
    };
    setFilters(cleared);
    searchProperties(1, cleared, false);
  };

  const handleCopyPitch = (property) => {
    const pitchText = `*${property.projectName}* by ${property.builderName}
📍 Location: ${property.location} (${property.market || 'Mumbai'})
🏢 Configuration: ${property.configuration || 'Available on request'}
💰 Price: ${property.price || 'Contact for price'}
🔑 Possession: ${property.possessionDate || 'Under Construction'}
✨ Highlights: ${property.uspsHighlights || property.projectDetails || 'Premium luxury residential project'}`;

    navigator.clipboard.writeText(pitchText);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-serif">
              On-Call Inventory Matchmaker
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              Instant Lookup
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Access verified real-time builder pricing, carpet areas, and USPs while on active prospect phone calls.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-600 font-semibold">
            {pagination.total} Verified Inventory Items
          </span>
        </div>
      </div>

      {/* Primary Search Terminal */}
      <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by project name, builder, micromarket, or amenities..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-surface text-slate-900 placeholder:text-slate-600 text-sm font-medium rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-none"
            />
            {filters.search && (
              <button
                onClick={() => {
                  handleFilterChange('search', '');
                  handleSearch();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        {/* Collapsible Advanced Filters */}
        <details className="group">
          <summary className="flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-primary cursor-pointer select-none py-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Advanced Search Filters (Builder, Location, Budget, BHK)</span>
            <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform text-slate-400" />
          </summary>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 mt-2 border-t border-slate-100">
            {/* Builder */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Developer / Builder
              </label>
              <SearchableSelect
                value={filters.builder}
                onChange={(value) => handleFilterChange('builder', value)}
                options={filterOptions.builders}
                placeholder="All Builders"
                label="Builder"
              />
            </div>

            {/* Project */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Project Name
              </label>
              <SearchableSelect
                value={filters.project}
                onChange={(value) => handleFilterChange('project', value)}
                options={filterOptions.projects}
                placeholder="All Projects"
                label="Project"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Micromarket / Locality
              </label>
              <SearchableSelect
                value={filters.location}
                onChange={(value) => handleFilterChange('location', value)}
                options={filterOptions.locations}
                placeholder="All Locations"
                label="Location"
              />
            </div>

            {/* Configuration */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Configuration (BHK)
              </label>
              <SearchableSelect
                value={filters.configuration}
                onChange={(value) => handleFilterChange('configuration', value)}
                options={filterOptions.configurations}
                placeholder="All BHKs"
                label="Configuration"
              />
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Min Price (₹ Lakhs)
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 focus:border-primary focus:bg-surface outline-none transition-colors"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Max Price (₹ Lakhs)
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="e.g. 350"
                className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 focus:border-primary focus:bg-surface outline-none transition-colors"
              />
            </div>

            {/* Possession */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Possession Timeline
              </label>
              <input
                type="text"
                value={filters.possessionDate}
                onChange={(e) => handleFilterChange('possessionDate', e.target.value)}
                placeholder="e.g. Dec 2026, Ready"
                className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 focus:border-primary focus:bg-surface outline-none transition-colors"
              />
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Key Amenities
              </label>
              <input
                type="text"
                value={filters.amenities}
                onChange={(e) => handleFilterChange('amenities', e.target.value)}
                placeholder="e.g. Clubhouse, Pool"
                className="w-full px-3 py-2 bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 focus:border-primary focus:bg-surface outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-3 mt-3 border-t border-slate-100">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              Apply All Filters
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </details>
      </div>

      {/* Search Results */}
      {loading ? (
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-16 text-center">
          <div className="w-10 h-10 rounded-2xl border-2 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-700">Querying live inventory matchmaker...</p>
        </div>
      ) : properties.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span>
              Showing <strong className="text-slate-900">{properties.length}</strong> of{' '}
              <strong className="text-slate-900">{pagination.total}</strong> matching projects
            </span>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>

          {/* Luxury Property Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((property) => (
              <div
                key={property._id}
                className="bg-surface rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-base font-bold text-slate-900 hover:text-primary transition-colors">
                        {property.projectName}
                      </div>
                      <div className="text-xs font-semibold text-primary flex items-center space-x-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span>{property.builderName}</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                      {property.price || 'Price on Request'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center space-x-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{property.location}</span>
                    {property.market && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-semibold">{property.market}</span>
                      </>
                    )}
                  </div>

                  {/* Spec Pills Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs mb-4">
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Configuration</div>
                      <div className="font-bold text-slate-800">{property.configuration || 'Multiple'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-600 uppercase font-bold">Possession</div>
                      <div className="font-bold text-slate-800">{property.possessionDate || 'Enquire'}</div>
                    </div>
                  </div>

                  {/* Highlights preview */}
                  {property.uspsHighlights && (
                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-4 leading-relaxed italic">
                      &quot;{property.uspsHighlights}&quot;
                    </p>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyPitch(property)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="Copy quick summary for client"
                  >
                    {copiedNote ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNote ? 'Copied!' : 'Copy Pitch'}</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {property.channelSalesContact && (
                      <a
                        href={`tel:${property.channelSalesContact}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        title={`Call Builder POC: ${property.channelSalesContact}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call POC</span>
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedProperty(property)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-btn-text bg-slate-900 hover:bg-primary transition-colors shadow-2xs"
                    >
                      View Specs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Toolbar */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 pt-6">
              <button
                onClick={() => searchProperties(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-surface border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <span className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-surface border border-slate-200">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => searchProperties(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-surface border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-slate-200/80 p-16 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No properties matched your search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your price range, configuration, or location filters to discover available inventory.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Luxury Specs Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-secondary text-white p-6 rounded-t-3xl flex justify-between items-start z-10 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-btn-text uppercase tracking-wider">
                    Verified Sheet
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{selectedProperty.builderName}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight">
                  {selectedProperty.projectName}
                </h2>
                <p className="text-xs text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{selectedProperty.location}</span>
                </p>
              </div>

              <button
                onClick={() => setSelectedProperty(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Specs Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Key Project Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Pricing</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedProperty.price || 'N/A'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Configuration</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedProperty.configuration || 'N/A'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Carpet Area</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedProperty.carpetArea || 'N/A'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Possession</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{selectedProperty.possessionDate || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* USPs & Pitch Notes */}
              {selectedProperty.uspsHighlights && (
                <div className="p-4 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-1.5">
                  <div className="text-xs font-bold text-primary flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Advisor Pitch USPs &amp; Key Differentiators</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {selectedProperty.uspsHighlights}
                  </p>
                </div>
              )}

              {/* Detailed Description */}
              {selectedProperty.projectDetails && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Project Overview
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {selectedProperty.projectDetails}
                  </p>
                </div>
              )}

              {/* Amenities */}
              {selectedProperty.amenities && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Amenities &amp; Features
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {selectedProperty.amenities}
                  </p>
                </div>
              )}

              {/* Location Advantage */}
              {selectedProperty.locationAdvantage && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Location Advantage &amp; Connectivity
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {selectedProperty.locationAdvantage}
                  </p>
                </div>
              )}

              {/* Special Offers */}
              {selectedProperty.offers && (
                <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl space-y-1">
                  <div className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Special Promotional Offers</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    {selectedProperty.offers}
                  </p>
                </div>
              )}

              {/* Builder Channel Sales Contact */}
              {selectedProperty.channelSalesContact && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Developer Channel Sales Representative
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {selectedProperty.channelSalesContact}
                    </div>
                  </div>
                  <a
                    href={`tel:${selectedProperty.channelSalesContact}`}
                    className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Sales POC</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
