'use client';
/* app/page.tsx */
import Link from "next/link";
import { useState, useEffect } from "react";
import { LayoutGrid, List as ListIcon, MapPin, ChevronRight, ImageIcon } from "lucide-react";
import Footer from "./Footer";
import LeadCaptureModal from "./LeadCaptureModal";
import Banner from "./Banner";
import MobileStickyCTA from "./MobileStickyCTA";
import { formatPrice } from '../../utils/formatPrice';
import { generatePropertyUrl } from '@/utils/slugify';
import { usePropertyStore, useCRMStore, useDashboardStore } from '@/stores';
import { whatsappHref } from '@/lib/contact';

const DEFAULT_TOP_CITIES = ["Bangalore", "Mumbai", "Pune", "Hyderabad", "Chennai", "Delhi NCR"];
const DEFAULT_POPULAR_LOCALITIES = [
    "Whitefield, Bengaluru",
    "Baner, Pune",
    "Andheri, Mumbai",
    "Gachibowli, Hyderabad",
    "Noida Sector 150",
    "Velachery, Chennai",
];
const QUICK_FILTERS = ["Ready to move", "Under construction", "Verified only", "No brokerage"];

export default function Home({ initialProperties = null }) {
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [hasSubmittedLead, setHasSubmittedLead] = useState(false);
    const [visibleProperties, setVisibleProperties] = useState(30);
    const [showLeadSuccessModal, setShowLeadSuccessModal] = useState(false);
    const [activeTab, setActiveTab] = useState('buy');
    const [viewMode, setViewMode] = useState('card');

    // Zustand persistent store to prevent re-fetching on repeat visits
    const storeProperties = usePropertyStore((state) => state.properties);
    const storeLoading = usePropertyStore((state) => state.loading);
    const storeBanners = usePropertyStore((state) => state.banners);
    const storeHeroImage = usePropertyStore((state) => state.heroImage);
    const fetchProperties = usePropertyStore((state) => state.fetchProperties);
    const fetchBanners = usePropertyStore((state) => state.fetchBanners);
    const fetchHeroImage = usePropertyStore((state) => state.fetchHeroImage);
    const setProperties = usePropertyStore((state) => state.setProperties);

    const properties = storeProperties.length > 0 ? storeProperties : (initialProperties || []);
    const loading = storeLoading && properties.length === 0;
    const banners = storeBanners.length > 0 ? storeBanners : [];
    const topCities = storeHeroImage?.topCities?.length > 0 ? storeHeroImage.topCities : DEFAULT_TOP_CITIES;
    const popularLocalities = storeHeroImage?.popularLocalities?.length > 0 ? storeHeroImage.popularLocalities : DEFAULT_POPULAR_LOCALITIES;

    useEffect(() => {
        // Check if user has already submitted lead information
        const leadSubmitted = localStorage.getItem('leadSubmitted');
        if (leadSubmitted) {
            setHasSubmittedLead(true);
        } else {
            // Show modal after 3 seconds delay
            const timer = setTimeout(() => {
                setShowLeadModal(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        // Initialize from SSR initialProperties or retrieve from store cache
        if (initialProperties && initialProperties.length > 0 && storeProperties.length === 0) {
            setProperties(initialProperties);
        } else if (storeProperties.length === 0) {
            fetchProperties();
        }

        // fetchBanners/fetchHeroImage check their own cache freshness internally,
        // so calling them on every mount picks up admin edits without extra network cost.
        fetchBanners();
        fetchHeroImage();
    }, [initialProperties, storeProperties.length, setProperties, fetchProperties, fetchBanners, fetchHeroImage]);

    const handleLeadSubmit = async (leadData) => {
        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leadData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit lead');
            }

            // Store lead info in localStorage
            localStorage.setItem('leadSubmitted', 'true');
            localStorage.setItem('leadData', JSON.stringify(leadData));
            setHasSubmittedLead(true);
            setShowLeadModal(false);
            setShowLeadSuccessModal(true);

            // Invalidate CRM and Dashboard stores so admin sees updated counts immediately
            useCRMStore.getState().invalidateLeadsCache();
            useDashboardStore.getState().invalidateDashboard();

        } catch (error) {
            throw error;
        }
    };

    const handleCloseModal = () => {
        setShowLeadModal(false);
    };

    const handleCloseLeadSuccessModal = () => {
        setShowLeadSuccessModal(false);
    };

    const handleSeeMore = () => {
        setVisibleProperties(prev => prev + 30);
    };

    const visibleList = properties.slice(0, visibleProperties);
    const [featured, ...rest] = visibleList;

    return (
        <main className={`min-h-screen bg-background text-secondary pb-20 lg:pb-0`} style={{ fontFamily: 'var(--font-body)' }}>
            {/* Mobile Sticky CTA */}
            <MobileStickyCTA />

            {/* Banner Section */}
            <Banner banners={banners} />

            {/* Hero */}
            <section className="relative overflow-hidden">
                {/* Ambient accent wash — gives the flat light canvas some depth
                    without a background image. Purely decorative. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-accent/25 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-56 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl"
                />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16">
                    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
                        {/* Copy */}
                        <div className="lg:pt-6">
                            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                Every listing site-verified
                            </p>
                            <h1
                                className="text-4xl sm:text-5xl lg:text-[3.3rem] leading-[1.08] tracking-[-0.02em] text-secondary text-balance"
                                style={{ fontFamily: 'var(--font-heading)' }}
                            >
                                A home search built on what&apos;s actually true about the property.
                            </h1>
                            <p className="mt-5 text-base sm:text-lg leading-relaxed text-secondary/70 max-w-md">
                                Every listing on PropFinova is site-verified before it goes live, and every builder deal comes direct — no brokerage layered on top.
                            </p>

                            {/* Search card */}
                            <div className="mt-8 bg-surface rounded-2xl border border-border shadow-lg overflow-hidden">
                                <div className="flex border-b border-border">
                                    {[
                                        { key: "buy", label: "Buy" },
                                        { key: "rent", label: "Rent" },
                                        { key: "new", label: "New" },
                                    ].map((t) => (
                                        <button
                                            key={t.key}
                                            type="button"
                                            onClick={() => setActiveTab(t.key)}
                                            className={`flex-1 py-3.5 text-sm font-semibold transition-colors cursor-pointer ${activeTab === t.key
                                                ? "text-primary border-b-2 border-primary bg-primary/5"
                                                : "text-secondary/50 hover:text-secondary border-b-2 border-transparent"
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                <form action="/search" className="p-4 space-y-3">
                                    <input type="hidden" name="tab" value={activeTab} />

                                    <div className="relative">
                                        <label htmlFor="q" className="sr-only">Search</label>
                                        <input
                                            id="q"
                                            name="q"
                                            type="text"
                                            placeholder="City, locality or project name"
                                            className="w-full h-12 px-4 rounded-xl bg-background border border-transparent focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors outline-none text-secondary placeholder-secondary/40"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            id="type"
                                            name="type"
                                            className="h-12 px-4 rounded-xl bg-background border border-transparent focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors outline-none text-secondary cursor-pointer"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Property type</option>
                                            <option value="flat">Apartment</option>
                                            <option value="house">Villa / house</option>
                                            <option value="land">Plot / land</option>
                                            <option value="office">Commercial</option>
                                        </select>

                                        <select
                                            id="max"
                                            name="max"
                                            className="h-12 px-4 rounded-xl bg-background border border-transparent focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors outline-none text-secondary cursor-pointer"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Budget</option>
                                            <option value="5000000">Up to ₹50 lacs</option>
                                            <option value="10000000">Up to ₹1 crore</option>
                                            <option value="20000000">Up to ₹2 crore</option>
                                            <option value="50000000">₹5 crore+</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full h-12 rounded-xl bg-primary text-btn-text font-semibold hover:bg-primary-dark transition-colors cursor-pointer"
                                    >
                                        Search properties
                                    </button>
                                </form>

                                <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-secondary/45 whitespace-nowrap">Try:</span>
                                    {QUICK_FILTERS.map((chip) => (
                                        <Link
                                            key={chip}
                                            href={`/search?tab=${activeTab}&q=${encodeURIComponent(chip)}`}
                                            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-secondary/70 hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                                        >
                                            {chip}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Photo */}
                        <div className="relative hidden lg:block">
                            <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-border shadow-xl">
                                <img
                                    src={storeHeroImage?.image || "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=900&h=1125&fit=crop&crop=center"}
                                    alt={storeHeroImage?.alt || "Bangalore skyline, one of the cities PropFinova lists properties in"}
                                    className="h-full w-full object-cover"
                                    loading="eager"
                                />
                            </div>
                            <div className="absolute -bottom-6 -left-8 right-10 rounded-2xl bg-secondary px-6 py-5 shadow-xl">
                                <p className="text-sm text-background/70">{storeHeroImage?.statLabel || 'Across six cities, right now'}</p>
                                <p className="mt-1 text-2xl text-background" style={{ fontFamily: 'var(--font-heading)' }}>
                                    {storeHeroImage?.statValue || 'New listings added weekly'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="mt-16 max-w-2xl text-base leading-relaxed text-secondary/60">
                        We&apos;ve guided more than five thousand families to a home they didn&apos;t have to second-guess, with every listing checked against the title and the site before it&apos;s published.
                    </p>
                </div>
            </section>

            {/* Search by location */}
            <section className="border-t border-border py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    <div>
                        <span className="text-sm text-secondary/50">Top cities</span>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {topCities.map((city) => (
                                <Link
                                    key={city}
                                    href={`/search?tab=buy&q=${encodeURIComponent(city)}`}
                                    className="px-4 py-2 rounded-full border border-border bg-surface text-sm font-medium text-secondary/80 hover:border-primary hover:text-primary transition-colors"
                                >
                                    {city}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-sm text-secondary/50">Popular localities</span>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {popularLocalities.map((loc) => (
                                <Link
                                    key={loc}
                                    href={`/search?tab=buy&q=${encodeURIComponent(loc)}`}
                                    className="px-4 py-2 rounded-full border border-border bg-surface text-sm font-medium text-secondary/80 hover:border-primary hover:text-primary transition-colors"
                                >
                                    {loc}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="py-12 sm:py-14 border-t border-border">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <h2 className="text-2xl sm:text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>
                            Handpicked for you
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center rounded-lg border border-border bg-surface p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('card')}
                                    aria-label="Card view"
                                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors cursor-pointer ${viewMode === 'card' ? 'bg-primary text-btn-text' : 'text-secondary/50 hover:text-secondary'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    aria-label="List view"
                                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-primary text-btn-text' : 'text-secondary/50 hover:text-secondary'}`}
                                >
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <Link href="/search" className="text-primary text-sm font-semibold hover:text-secondary whitespace-nowrap">
                                View all listings
                            </Link>
                        </div>
                    </div>

                    {loading && properties.length === 0 ? (
                        viewMode === 'card' ? (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="border border-border rounded-2xl overflow-hidden animate-pulse">
                                        <div className="aspect-[4/3] bg-border"></div>
                                        <div className="p-5 space-y-3">
                                            <div className="h-4 bg-border rounded w-2/3"></div>
                                            <div className="h-3 bg-border rounded w-1/3"></div>
                                            <div className="h-4 bg-border rounded w-1/4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-5 border border-border rounded-2xl p-4 animate-pulse">
                                        <div className="w-40 h-32 bg-border rounded-xl shrink-0"></div>
                                        <div className="flex-1 space-y-3 py-1">
                                            <div className="h-4 bg-border rounded w-2/3"></div>
                                            <div className="h-3 bg-border rounded w-1/3"></div>
                                            <div className="h-4 bg-border rounded w-1/4"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : properties.length === 0 ? (
                        <div className="text-center py-14 border border-dashed border-border rounded-2xl">
                            <p className="text-secondary/60">No properties yet. New listings will appear here as soon as they&apos;re added.</p>
                        </div>
                    ) : viewMode === 'card' ? (
                        <>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {visibleList.map((property) => (
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
                                            {property.gallery?.length > 1 && (
                                                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-black/55 text-white backdrop-blur-sm">
                                                    <ImageIcon className="w-3 h-3" />
                                                    {property.gallery.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-base font-semibold text-secondary group-hover:text-primary transition-colors line-clamp-1">
                                                {property.title}
                                            </h3>
                                            <p className="mt-1 text-sm text-secondary/55 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                <span className="line-clamp-1">{property.location}</span>
                                            </p>
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
                                ))}
                            </div>

                            {properties.length > visibleProperties && (
                                <div className="mt-10 text-center">
                                    <button
                                        onClick={handleSeeMore}
                                        className="px-6 py-3 rounded-xl border border-primary text-primary font-semibold hover:bg-primary hover:text-btn-text transition-colors cursor-pointer"
                                    >
                                        Show {Math.min(30, properties.length - visibleProperties)} more
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {featured && (
                                <Link
                                    href={generatePropertyUrl(featured)}
                                    className="group grid sm:grid-cols-2 gap-0 border border-border rounded-2xl overflow-hidden mb-8"
                                >
                                    <div className="h-64 sm:h-full overflow-hidden">
                                        <img
                                            src={featured.gallery?.[0] || 'https://via.placeholder.com/800x600?text=No+Image'}
                                            alt={featured.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="p-6 sm:p-8 flex flex-col">
                                        <span className="text-sm font-semibold text-primary">
                                            For {featured.mode}{featured.status === 'Ready to Move' ? ' · Ready to move' : ''}
                                        </span>
                                        <h3 className="mt-2 text-xl sm:text-2xl group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
                                            {featured.title}
                                        </h3>
                                        <p className="mt-2 text-secondary/60">{featured.location}</p>
                                        <p className="mt-4 text-2xl font-semibold text-secondary tabular-nums">
                                            {featured.price ? formatPrice(featured.price) : 'Price on request'}
                                        </p>
                                        <span className="mt-auto pt-6 text-sm font-semibold text-primary inline-flex items-center gap-1.5">
                                            View details
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </Link>
                            )}

                            <div className="divide-y divide-border border-t border-border">
                                {rest.map((property) => (
                                    <div key={property._id} className="group flex flex-col sm:flex-row gap-5 py-6">
                                        <Link href={generatePropertyUrl(property)} className="block w-full sm:w-44 h-40 sm:h-32 shrink-0 overflow-hidden rounded-xl">
                                            <img
                                                src={property.gallery?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                                                alt={property.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        </Link>
                                        <div className="flex-1 min-w-0">
                                            <Link href={generatePropertyUrl(property)}>
                                                <span className="text-xs font-semibold text-primary">
                                                    For {property.mode}
                                                </span>
                                                <h3 className="mt-1 text-lg font-semibold text-secondary group-hover:text-primary transition-colors line-clamp-1">
                                                    {property.title}
                                                </h3>
                                                <p className="text-sm text-secondary/55 mt-0.5">{property.location}</p>
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
                                ))}
                            </div>

                            {properties.length > visibleProperties && (
                                <div className="mt-10 text-center">
                                    <button
                                        onClick={handleSeeMore}
                                        className="px-6 py-3 rounded-xl border border-primary text-primary font-semibold hover:bg-primary hover:text-btn-text transition-colors cursor-pointer"
                                    >
                                        Show {Math.min(30, properties.length - visibleProperties)} more
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Lead-gen band */}
            <section className="py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div
                        className="relative overflow-hidden rounded-2xl bg-secondary px-6 py-12 sm:px-14 sm:py-16"
                        style={{
                            backgroundImage: `repeating-linear-gradient(0deg, rgba(247,244,236,0.05) 0px, rgba(247,244,236,0.05) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, rgba(247,244,236,0.05) 0px, rgba(247,244,236,0.05) 1px, transparent 1px, transparent 48px)`
                        }}
                    >
                        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-10">
                            <div className="max-w-xl text-center lg:text-left">
                                <h3 className="text-3xl sm:text-4xl text-background" style={{ fontFamily: 'var(--font-heading)' }}>
                                    Talk to someone who knows the street, not just the listing.
                                </h3>
                                <p className="mt-4 text-background/70 text-lg">
                                    Leave your number and one of our advisors will call you back with options that fit your budget and timeline.
                                </p>
                            </div>
                            <div className="w-full lg:w-auto">
                                <form
                                    action="/lead"
                                    className="flex flex-col sm:flex-row gap-3"
                                >
                                    <label htmlFor="phone-band" className="sr-only">Phone</label>
                                    <input
                                        id="phone-band"
                                        name="phone"
                                        type="tel"
                                        placeholder="Your phone number"
                                        className="h-14 w-full sm:w-72 px-5 rounded-xl bg-background text-secondary placeholder-secondary/40 focus:ring-2 focus:ring-background/40 outline-none"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="h-14 px-7 rounded-xl bg-background text-secondary font-semibold hover:bg-surface transition-colors cursor-pointer"
                                    >
                                        Get a call back
                                    </button>
                                </form>
                                <p className="mt-3 text-center lg:text-left text-xs text-background/50">
                                    We&apos;ll only call about properties — no spam.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />

            {/* Lead Capture Modal */}
            <LeadCaptureModal
                isOpen={showLeadModal}
                onClose={handleCloseModal}
                onSubmit={handleLeadSubmit}
                title="Welcome! Get Exclusive Property Access"
            />

            {/* Lead Submit Success Modal */}
            {showLeadSuccessModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" id="successmodalhomepage">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCloseLeadSuccessModal}></div>
                    <div className="relative bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center mx-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
                        <p className="text-gray-600 mb-6" id="successmodalhomepageparagraph">
                            We&apos;ve received your inquiry. Our team will reach out shortly with property details and next steps.
                        </p>
                        <button
                            onClick={handleCloseLeadSuccessModal}
                            className="w-full px-6 py-3 bg-primary text-btn-text font-semibold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
