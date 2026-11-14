/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List as ListIcon, MapPin, ChevronRight, SlidersHorizontal, Search as SearchIcon } from "lucide-react";
import { formatPrice } from '../../../utils/formatPrice';
import { generatePropertyUrl } from '@/utils/slugify';
import { usePropertySearchStore } from '@/stores';
import WishlistButton from '../../components/WishlistButton';
import { whatsappHref } from '@/lib/contact';

const SUGGESTED_LOCATIONS = ["Mumbai", "Pune", "Bangalore", "Delhi", "Hyderabad", "Chennai", "Navi Mumbai", "Thane"];

export default function PropertyList() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fetchPublicSearch = usePropertySearchStore((state) => state.fetchPublicSearch);

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('newest');
    const [showFilters, setShowFilters] = useState(true);
    const [filters, setFilters] = useState({
        location: "",
        mode: "",
        price: "",
        type: "",
        bhk: "",
    });
    const debounceTimer = useRef(null);
    const isFirstLoad = useRef(true);

    // Initialize filters from URL parameters and fetch properties
    useEffect(() => {
        const initialFilters = {
            location: searchParams.get('q') || searchParams.get('location') || "",
            mode: mapMode(searchParams.get('tab')) || searchParams.get('mode') || "",
            price: searchParams.get('max') || searchParams.get('price') || "",
            type: searchParams.get('type') || "",
            bhk: searchParams.get('bhk') || "",
        };
        setFilters(initialFilters);
        fetchPropertiesWithFilters(initialFilters);
        isFirstLoad.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Debounced auto-search when location changes
    useEffect(() => {
        if (isFirstLoad.current) return;
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchPropertiesWithFilters(filters);
            syncUrl(filters);
        }, 500);
        return () => clearTimeout(debounceTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.location]);

    const mapMode = (tab) => {
        const modeMap = { buy: 'buy', rent: 'rent', sell: 'sell', new: 'buy' };
        return modeMap[tab] || tab;
    };

    const syncUrl = useCallback((f) => {
        const queryParams = new URLSearchParams();
        if (f.location) queryParams.append('q', f.location);
        if (f.mode) queryParams.append('mode', f.mode);
        if (f.type) queryParams.append('type', f.type);
        if (f.bhk) queryParams.append('bhk', f.bhk);
        if (f.price) queryParams.append('price', f.price);
        router.push(`/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, { scroll: false });
    }, [router]);

    const fetchPropertiesWithFilters = async (currentFilters = filters, force = false) => {
        try {
            setLoading(true);
            const res = await fetchPublicSearch(currentFilters, { force });
            if (res.success) {
                setProperties(res.data || []);
                setError('');
            } else {
                setError(res.error || 'Failed to fetch properties');
            }
        } catch (err) {
            console.error('Error fetching properties:', err);
            setError(err.message || 'Error fetching properties');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handlePillFilter = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: prev[name] === value ? '' : value }));
    };

    const applyFilters = async () => {
        syncUrl(filters);
        await fetchPropertiesWithFilters(filters, true);
    };

    const clearFilters = () => {
        const cleared = { location: "", mode: "", price: "", type: "", bhk: "" };
        setFilters(cleared);
        router.push('/search', { scroll: false });
        fetchPropertiesWithFilters(cleared, false);
    };

    const sortedProperties = [...properties].sort((a, b) => {
        if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
        return 0;
    });

    const typeOptions = [
        { value: 'flat', label: 'Apartment' },
        { value: 'house', label: 'Villa' },
        { value: 'land', label: 'Plot' },
        { value: 'office', label: 'Commercial' },
    ];

    const bhkOptions = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK'];

    if (loading && properties.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
                    </div>
                    <p className="text-secondary/50 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        Finding properties that match...
                    </p>
                </div>
            </div>
        );
    }

    if (error && properties.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
                <div className="bg-surface border border-border rounded-2xl p-10 text-center max-w-md">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg text-secondary mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Something went wrong</h3>
                    <p className="text-secondary/55 mb-6 text-sm">{error}</p>
                    <button
                        onClick={() => fetchPropertiesWithFilters(filters, true)}
                        className="px-6 py-3 rounded-xl bg-primary text-btn-text font-semibold hover:bg-primary-dark transition-colors cursor-pointer"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: 'var(--font-body)' }} className="bg-background min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Page Header */}
                <div className="text-center mb-10">
                    <h1
                        className="text-3xl sm:text-4xl text-secondary mb-2"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        Find your perfect property
                    </h1>
                    <p className="text-secondary/55 text-sm">
                        Verified listings across India
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
                {/* Sidebar: Search & Filter Card */}
                <div className="min-w-0">
                <div className="lg:sticky lg:top-24 bg-surface rounded-2xl border border-border overflow-hidden">
                    {/* Filter Header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-border">
                        <span className="inline-flex items-center gap-2 text-secondary font-semibold text-sm">
                            <SlidersHorizontal className="w-4 h-4 text-primary" />
                            Search &amp; filter
                        </span>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-3 py-1.5 rounded-lg text-secondary/70 text-sm font-medium hover:bg-background transition-colors cursor-pointer"
                        >
                            {showFilters ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    {/* Location Search */}
                    <div className="px-6 py-5 border-b border-border">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-secondary/35" />
                            </div>
                            <input
                                type="text"
                                name="location"
                                placeholder="Search by location, area, or property name..."
                                value={filters.location}
                                onChange={handleFilterChange}
                                className="w-full pl-12 pr-10 py-3.5 text-base border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-none bg-background text-secondary"
                            />
                            {loading && (
                                <div className="absolute inset-y-0 right-4 flex items-center">
                                    <svg className="animate-spin h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="px-6 py-5 bg-background/60 space-y-5">
                            {/* Transaction Type */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-secondary/50">Transaction type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[{v:'',l:'Any'},{v:'buy',l:'Buy'},{v:'rent',l:'Rent'}].map(({v,l}) => (
                                        <button
                                            key={v}
                                            onClick={() => handlePillFilter('mode', v)}
                                            className={`py-2.5 rounded-xl text-sm font-semibold text-center transition-all border cursor-pointer ${
                                                filters.mode === v
                                                    ? 'bg-primary text-btn-text border-primary'
                                                    : 'bg-surface text-secondary/70 border-border hover:border-primary/40'
                                            }`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Max Budget */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-secondary/50">Max budget</label>
                                <div className="relative">
                                    <select
                                        name="price"
                                        value={filters.price}
                                        onChange={handleFilterChange}
                                        className="w-full appearance-none pl-4 pr-10 py-3 bg-surface border border-border rounded-xl text-secondary font-medium text-sm focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all outline-none cursor-pointer"
                                    >
                                        <option value="">No limit</option>
                                        <option value="5000000">₹50 Lacs</option>
                                        <option value="10000000">₹1 Crore</option>
                                        <option value="20000000">₹2 Crore</option>
                                        <option value="50000000">₹5 Crore+</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary/35">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Property Type Pills */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-secondary/50">Property type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {typeOptions.map(({ value, label }) => (
                                        <button
                                            key={value}
                                            onClick={() => handlePillFilter('type', value)}
                                            className={`px-2 py-2 rounded-xl text-sm font-semibold text-center truncate transition-all border cursor-pointer ${
                                                filters.type === value
                                                    ? 'bg-secondary text-white border-secondary'
                                                    : 'bg-surface text-secondary/70 border-border hover:border-secondary/30'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* BHK Pills */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-secondary/50">Configuration</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {bhkOptions.map(bhk => (
                                        <button
                                            key={bhk}
                                            onClick={() => handlePillFilter('bhk', bhk.toLowerCase())}
                                            className={`py-2 rounded-xl text-sm font-semibold text-center transition-all border cursor-pointer ${
                                                filters.bhk === bhk.toLowerCase()
                                                    ? 'bg-secondary text-white border-secondary'
                                                    : 'bg-surface text-secondary/70 border-border hover:border-secondary/30'
                                            }`}
                                        >
                                            {bhk}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 pt-1">
                                <button
                                    onClick={applyFilters}
                                    disabled={loading}
                                    className="w-full py-3 bg-primary text-btn-text font-semibold rounded-xl hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <SearchIcon className="w-4 h-4" />
                                            Search properties
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="w-full py-3 bg-surface text-secondary/70 font-semibold rounded-xl hover:bg-background border border-border transition-all text-sm cursor-pointer"
                                >
                                    Clear all
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                </div>

                {/* Results */}
                <div className="min-w-0">

                {/* Results Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                        <span className="font-semibold text-secondary text-base">
                            {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
                        </span>
                        {filters.location && (
                            <span className="text-secondary/45 text-sm">in &ldquo;{filters.location}&rdquo;</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 bg-surface border border-border rounded-xl text-sm font-medium text-secondary focus:border-primary outline-none cursor-pointer"
                            >
                                <option value="newest">Newest first</option>
                                <option value="price-low">Price: low to high</option>
                                <option value="price-high">Price: high to low</option>
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary/35">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>

                        <div className="hidden sm:flex bg-surface border border-border rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-primary text-btn-text' : 'text-secondary/40 hover:text-secondary'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-primary text-btn-text' : 'text-secondary/40 hover:text-secondary'}`}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Property Grid / List */}
                {sortedProperties.length > 0 ? (
                    <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'divide-y divide-border border-t border-border'}>
                        {sortedProperties.map((property) => (
                            viewMode === 'grid' ? (
                                <Link
                                    key={property._id}
                                    href={generatePropertyUrl(property)}
                                    className="group block overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                            src={property.gallery?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                                            alt={property.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface/90 backdrop-blur-sm text-secondary">
                                                For {property.mode}
                                            </span>
                                            {property.status === 'Ready to Move' && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-btn-text">
                                                    Ready
                                                </span>
                                            )}
                                        </div>
                                        <WishlistButton propertyId={property._id} className="absolute top-3 right-3" />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="text-base font-semibold text-secondary group-hover:text-primary transition-colors line-clamp-1">
                                            {property.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-secondary/55 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                            <span className="line-clamp-1">{property.location}</span>
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-primary/10 text-primary">
                                                Verified
                                            </span>
                                            {property.bhk && property.bhk !== 'na' && (
                                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-secondary/5 text-secondary/70">
                                                    {property.bhk}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <p className="text-lg font-semibold text-secondary tabular-nums">
                                                {property.price ? formatPrice(property.price) : 'Price on request'}
                                            </p>
                                            <span className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
                                                Details
                                                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <div key={property._id} className="group flex flex-col sm:flex-row gap-5 py-6">
                                    <Link href={generatePropertyUrl(property)} className="relative block w-full sm:w-52 h-44 sm:h-36 shrink-0 overflow-hidden rounded-xl">
                                        <img
                                            src={property.gallery?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                                            alt={property.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                        <WishlistButton propertyId={property._id} className="absolute top-2 right-2" />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <Link href={generatePropertyUrl(property)}>
                                            <span className="text-xs font-semibold text-primary">
                                                For {property.mode}
                                            </span>
                                            <h3 className="mt-1 text-lg font-semibold text-secondary group-hover:text-primary transition-colors line-clamp-1">
                                                {property.title}
                                            </h3>
                                            <p className="text-sm text-secondary/55 mt-0.5 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                {property.location}
                                            </p>
                                            <p className="mt-2 text-lg font-semibold text-secondary tabular-nums">
                                                {property.price ? formatPrice(property.price) : 'Price on request'}
                                            </p>
                                        </Link>
                                    </div>
                                    <div className="flex sm:flex-col gap-2 sm:w-36 shrink-0">
                                        <Link
                                            href={generatePropertyUrl(property)}
                                            className="flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg border border-border text-sm font-semibold text-secondary hover:border-primary hover:text-primary transition-colors"
                                        >
                                            Details
                                        </Link>
                                        <a
                                            href={whatsappHref(`Hi, I am interested in ${property.title} (${property.location})`)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-[#25D366] text-white text-sm font-semibold hover:bg-[#128C7E] transition-colors"
                                        >
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                            Chat
                                        </a>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="text-center py-20 bg-surface rounded-2xl border border-border">
                        <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
                            <svg className="w-10 h-10 text-secondary/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h3
                            className="text-xl text-secondary mb-2"
                            style={{ fontFamily: 'var(--font-heading)' }}
                        >
                            No properties found
                        </h3>
                        <p className="text-secondary/55 text-sm mb-6 max-w-xs mx-auto">
                            We couldn&apos;t find properties matching your criteria. Try a different location or adjust your filters.
                        </p>

                        {/* Suggested locations */}
                        <div className="mb-8">
                            <p className="text-sm text-secondary/45 mb-3">Try searching in</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {SUGGESTED_LOCATIONS.map(loc => (
                                    <button
                                        key={loc}
                                        onClick={() => {
                                            const newFilters = { ...filters, location: loc };
                                            setFilters(newFilters);
                                            fetchPropertiesWithFilters(newFilters);
                                            syncUrl(newFilters);
                                        }}
                                        className="px-4 py-1.5 rounded-xl bg-background border border-border text-secondary/70 text-sm font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={clearFilters}
                            className="px-8 py-3 bg-primary text-btn-text font-semibold rounded-xl hover:bg-primary-dark transition-colors text-sm cursor-pointer"
                        >
                            Clear filters &amp; see all
                        </button>
                    </div>
                )}
                </div>
                </div>
            </div>
        </div>
    );
}
