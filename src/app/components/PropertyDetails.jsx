/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import LeadCaptureModal from './LeadCaptureModal';
import WishlistButton from './WishlistButton';
import EMICalculator from './EMICalculatorV2';
import LocationMap from './LocationMap';
import { formatPrice } from '../../utils/formatPrice';
import { getEmbedUrl } from '@/utils/videoUtils';
import {
    Waves,
    Dumbbell,
    Car,
    Trees,
    Shield,
    Building2,
    MoveVertical,
    Baby,
    Zap,
    Droplets,
    Wifi,
    Wrench,
    Wind,
    Gamepad2,
    MapPin,
    Home,
    Users,
    Flower2,
    Camera,
    Music,
    Utensils,
    ShoppingCart,
    GraduationCap,
    Stethoscope,
    Mountain,
    Sun,
    Moon,
    Star,
    ArrowRight,
    BadgeCheck,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Download,
    ImageIcon,
    LayoutGrid,
    Maximize2,
    Minimize2,
    Phone,
    ShieldCheck,
    Sparkles,
    TimerReset,
    Video,
    X
} from 'lucide-react';

export default function PropertyDetails({ initialData = null }) {
    const { id } = useParams();
    const [property, setProperty] = useState(initialData);
    const [loading, setLoading] = useState(initialData === null);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [hasSubmittedLead, setHasSubmittedLead] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [activeMediaTab, setActiveMediaTab] = useState('images'); // 'images' or 'videos'
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [mediaType, setMediaType] = useState('images'); // 'images' or 'videos'
    const [isZoomed, setIsZoomed] = useState(false);
    const [isSubmittingLead, setIsSubmittingLead] = useState(false);
    const [sidebarForm, setSidebarForm] = useState({
        name: '',
        phone: ''
    });
    const [visibleAmenities, setVisibleAmenities] = useState(12);
    const thumbnailStripRef = useRef(null);

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (showMediaModal) {
                switch(e.key) {
                    case 'Escape':
                        handleCloseMediaModal();
                        break;
                    case 'ArrowLeft':
                        handleMediaNavigation('prev');
                        break;
                    case 'ArrowRight':
                        handleMediaNavigation('next');
                        break;
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showMediaModal, mediaType, currentMediaIndex, isZoomed]);

    useEffect(() => {
        if (!showMediaModal) return;

        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = overflow;
        };
    }, [showMediaModal]);

    useEffect(() => {
        if (!showMediaModal || !thumbnailStripRef.current) return;

        const activeThumbnail = thumbnailStripRef.current.querySelector(`[data-thumb-index="${currentMediaIndex}"]`);
        if (!activeThumbnail) return;

        activeThumbnail.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest'
        });
    }, [currentMediaIndex, mediaType, showMediaModal]);

    useEffect(() => {
        // Check if user has already submitted lead information
        const leadSubmitted = localStorage.getItem('leadSubmitted');
        if (leadSubmitted) {
            setHasSubmittedLead(true);
        }

        // Skip client-side fetch if server already provided the data
        if (initialData) return;

        const fetchProperty = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/properties/${id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch property');
                }

                setProperty(data.data);
            } catch (error) {
                console.error('Error fetching property:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProperty();
        }
    }, [id]);

    // Fetch similar properties when main property is loaded
    useEffect(() => {
        if (property?._id) {
            fetchSimilarProperties();
        }
    }, [property?._id]);

    const openModal = (index) => {
        setSelectedImageIndex(index);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const showNextImage = () => {
        setSelectedImageIndex((prevIndex) => (prevIndex + 1) % property.gallery.length);
    };

    const showPrevImage = () => {
        setSelectedImageIndex((prevIndex) => (prevIndex - 1 + property.gallery.length) % property.gallery.length);
    };

    const handleContactClick = (e) => {
        e.preventDefault();
        if (!hasSubmittedLead) {
            setShowLeadModal(true);
        } else {
            // If lead is submitted, allow the call
            window.location.href = `tel:${property.contactNumber}`;
        }
    };

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

            // Now allow the call
            window.location.href = `tel:${property.contactNumber}`;

        } catch (error) {
            throw error;
        }
    };

    const handleCloseLeadModal = () => {
        setShowLeadModal(false);
    };

    const handleClosePriceModal = () => {
        setShowPriceModal(false);
    };

    const handlePriceClick = () => {
        setShowPriceModal(true);
    };

    const handlePriceLeadSubmit = async (leadData) => {
        try {
            // Add a note that this is a price inquiry request
            const priceInquiryData = {
                ...leadData,
                inquiryType: 'price_request',
                propertyId: property._id,
                propertyTitle: property.title
            };

            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(priceInquiryData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit lead');
            }

            setShowPriceModal(false);
            setShowPriceSuccessModal(true);

        } catch (error) {
            throw error;
        }
    };

    const [showBrochureModal, setShowBrochureModal] = useState(false);
    const [showPriceSuccessModal, setShowPriceSuccessModal] = useState(false);
    const [showBrochureSuccessModal, setShowBrochureSuccessModal] = useState(false);
    const [showSidebarSuccessModal, setShowSidebarSuccessModal] = useState(false);
    const [similarProperties, setSimilarProperties] = useState([]);
    const [loadingSimilar, setLoadingSimilar] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleBrochureClick = () => {
        setShowBrochureModal(true);
    };

    const handleBrochureLeadSubmit = async (leadData) => {
        try {
            const brochureInquiryData = {
                ...leadData,
                inquiryType: 'brochure_request',
                propertyId: property._id,
                propertyTitle: property.title
            };

            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(brochureInquiryData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit lead');
            }

            setShowBrochureModal(false);
            setShowBrochureSuccessModal(true);

        } catch (error) {
            throw error;
        }
    };


    const handleCloseBrochureModal = () => {
        setShowBrochureModal(false);
    };

    const handleClosePriceSuccessModal = () => {
        setShowPriceSuccessModal(false);
    };

    const handleCloseBrochureSuccessModal = () => {
        setShowBrochureSuccessModal(false);
    };

    const handleCloseSidebarSuccessModal = () => {
        setShowSidebarSuccessModal(false);
    };

    const handleSidebarFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmittingLead(true);
        
        try {
            if (!sidebarForm.name || !sidebarForm.phone) {
                throw new Error('Name and phone number are required');
            }

            if (sidebarForm.phone.length !== 10) {
                throw new Error('Please enter a valid 10-digit phone number');
            }

            const leadSubmissionData = {
                ...sidebarForm,
                inquiryType: 'general_inquiry',
                propertyId: property._id,
                propertyTitle: property.title,
                interestedLocation: property.location
            };

            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leadSubmissionData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit lead');
            }

            // Lead submitted successfully - show success message
            setSidebarForm({ name: '', phone: '' });
            setShowSidebarSuccessModal(true);
            
        } catch (error) {
            console.error('Error submitting lead:', error);
            alert(error.message || 'Failed to submit. Please try again.');
        } finally {
            setIsSubmittingLead(false);
        }
    };

    const fetchSimilarProperties = async () => {
        if (!property?._id) return;
        
        try {
            setLoadingSimilar(true);
            const response = await fetch(`/api/properties/similar/${property._id}`);
            const data = await response.json();

            if (response.ok) {
                setSimilarProperties(data.data || []);
            } else {
                console.error('Failed to fetch similar properties:', data.message);
            }
        } catch (error) {
            console.error('Error fetching similar properties:', error);
        } finally {
            setLoadingSimilar(false);
        }
    };

    const handleMediaNavigation = (direction) => {
        const currentMedia = mediaType === 'images' ? property.gallery : (property.videos || []);
        if (direction === 'next') {
            setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % currentMedia.length);
        } else {
            setCurrentMediaIndex((prevIndex) => (prevIndex - 1 + currentMedia.length) % currentMedia.length);
        }
        setIsZoomed(false);
    };

    const handleThumbnailClick = (index) => {
        setCurrentMediaIndex(index);
        setIsZoomed(false);
    };

    const toggleZoom = () => {
        setIsZoomed(!isZoomed);
    };


    const handleCloseMediaModal = () => {
        setShowMediaModal(false);
        setIsZoomed(false);
    };

    const nextSlide = () => {
        if (similarProperties.length > 0) {
            const maxSlides = Math.max(0, similarProperties.length - 3);
            setCurrentSlide((prev) => 
                prev >= maxSlides ? 0 : prev + 1
            );
        }
    };

    const prevSlide = () => {
        if (similarProperties.length > 0) {
            const maxSlides = Math.max(0, similarProperties.length - 3);
            setCurrentSlide((prev) => 
                prev === 0 ? maxSlides : prev - 1
            );
        }
    };

    const getAmenityIcon = (amenity) => {
        const amenityLower = amenity.toLowerCase();

        // Swimming Pool
        if (amenityLower.includes('swimming') || amenityLower.includes('pool')) {
            return <Waves size={24} />;
        }

        // Gym/Fitness
        if (amenityLower.includes('gym') || amenityLower.includes('fitness') || amenityLower.includes('exercise') || amenityLower.includes('workout')) {
            return <Dumbbell size={24} />;
        }

        // Parking
        if (amenityLower.includes('parking') || amenityLower.includes('car')) {
            return <Car size={24} />;
        }

        // Garden/Park/Landscaping
        if (amenityLower.includes('garden') || amenityLower.includes('park') || amenityLower.includes('landscape') || amenityLower.includes('green')) {
            return <Trees size={24} />;
        }

        // Security
        if (amenityLower.includes('security') || amenityLower.includes('cctv') || amenityLower.includes('guard')) {
            return <Shield size={24} />;
        }

        // Club House / Community Hall
        if (amenityLower.includes('club') || amenityLower.includes('community') || amenityLower.includes('hall')) {
            return <Building2 size={24} />;
        }

        // Elevator/Lift
        if (amenityLower.includes('elevator') || amenityLower.includes('lift')) {
            return <MoveVertical size={24} />;
        }

        // Playground/Kids Area
        if (amenityLower.includes('playground') || amenityLower.includes('kids') || amenityLower.includes('children')) {
            return <Baby size={24} />;
        }

        // Power Backup/Generator
        if (amenityLower.includes('power') || amenityLower.includes('backup') || amenityLower.includes('generator') || amenityLower.includes('electricity')) {
            return <Zap size={24} />;
        }

        // Water Supply
        if (amenityLower.includes('water') || amenityLower.includes('supply')) {
            return <Droplets size={24} />;
        }

        // Internet/WiFi
        if (amenityLower.includes('internet') || amenityLower.includes('wifi') || amenityLower.includes('broadband')) {
            return <Wifi size={24} />;
        }

        // Maintenance/Housekeeping
        if (amenityLower.includes('maintenance') || amenityLower.includes('housekeeping') || amenityLower.includes('cleaning')) {
            return <Wrench size={24} />;
        }

        // Air Conditioning
        if (amenityLower.includes('ac') || amenityLower.includes('air') || amenityLower.includes('conditioning')) {
            return <Wind size={24} />;
        }

        // Gaming/Entertainment
        if (amenityLower.includes('game') || amenityLower.includes('gaming') || amenityLower.includes('entertainment')) {
            return <Gamepad2 size={24} />;
        }

        // Location/Area specific
        if (amenityLower.includes('location') || amenityLower.includes('area')) {
            return <MapPin size={24} />;
        }

        // Hospital/Medical
        if (amenityLower.includes('hospital') || amenityLower.includes('medical') || amenityLower.includes('clinic')) {
            return <Stethoscope size={24} />;
        }

        // School/Education
        if (amenityLower.includes('school') || amenityLower.includes('education') || amenityLower.includes('college')) {
            return <GraduationCap size={24} />;
        }

        // Shopping/Mall
        if (amenityLower.includes('shop') || amenityLower.includes('mall') || amenityLower.includes('market')) {
            return <ShoppingCart size={24} />;
        }

        // Restaurant/Food
        if (amenityLower.includes('restaurant') || amenityLower.includes('food') || amenityLower.includes('cafe')) {
            return <Utensils size={24} />;
        }

        // Music/Audio
        if (amenityLower.includes('music') || amenityLower.includes('audio') || amenityLower.includes('sound')) {
            return <Music size={24} />;
        }

        // Photography/Camera
        if (amenityLower.includes('photo') || amenityLower.includes('camera')) {
            return <Camera size={24} />;
        }

        // Flowers/Landscaping
        if (amenityLower.includes('flower') || amenityLower.includes('plant')) {
            return <Flower2 size={24} />;
        }

        // Community/Social
        if (amenityLower.includes('social') || amenityLower.includes('meet') || amenityLower.includes('gathering')) {
            return <Users size={24} />;
        }

        // Views/Scenic
        if (amenityLower.includes('view') || amenityLower.includes('scenic') || amenityLower.includes('mountain')) {
            return <Mountain size={24} />;
        }

        // Balcony/Terrace/Outdoor
        if (amenityLower.includes('balcony') || amenityLower.includes('terrace') || amenityLower.includes('outdoor')) {
            return <Sun size={24} />;
        }

        // Night/Evening amenities
        if (amenityLower.includes('night') || amenityLower.includes('evening')) {
            return <Moon size={24} />;
        }

        // Premium/Luxury
        if (amenityLower.includes('premium') || amenityLower.includes('luxury') || amenityLower.includes('vip')) {
            return <Star size={24} />;
        }

        // Default fallback icon
        return <Home size={24} />;
    };

    const sections = [
        { label: "Overview", id: "overview" },
        { label: "Amenities", id: "amenities" },
        { label: "About Project", id: "about-project" },
        { label: "Location Map", id: "location-map" },
        { label: "EMI Calculator", id: "emi-calculator" },
        { label: "Ratings & Reviews", id: "ratings-reviews" },
        { label: "About Location", id: "about-location" },
        { label: "Price Trends", id: "price-trends" },
        { label: "Project Details", id: "project-details" },
        { label: "About Developer", id: "about-developer" },
    ];

    const galleryCount = property?.gallery?.length || 0;
    const videoCount = property?.videos?.length || 0;
    const displayPrice = property?.price ? formatPrice(property.price) : 'Price on Request';
    const propertyTypeLabel = property?.type ? property.type.replace(/-/g, ' ') : 'Property';
    const bhkLabel = property?.bhk ? property.bhk.toUpperCase() : 'Premium';
    const projectMetrics = [
        {
            label: 'Starting Price',
            value: displayPrice,
            icon: <CircleDollarSign size={18} />
        },
        {
            label: 'Configuration',
            value: `${bhkLabel} ${propertyTypeLabel}`,
            icon: <LayoutGrid size={18} />
        },
        {
            label: 'Possession',
            value: property?.possessionDate || 'Request details',
            icon: <CalendarDays size={18} />
        },
        {
            label: 'Project Area',
            value: property?.projectArea || `${property?.squareFootage ? `${property.squareFootage} sq.ft.` : 'Premium project'}`,
            icon: <Sparkles size={18} />
        }
    ];
    const heroHighlights = [
        property?.developer ? `Developed by ${property.developer}` : null,
        property?.totalUnits ? `${property.totalUnits}+ residences planned` : null,
        property?.totalTowers ? `${property.totalTowers} tower${property.totalTowers > 1 ? 's' : ''}` : null,
        property?.locationAdvantages?.[0] || property?.highlights?.[0] || null
    ].filter(Boolean).slice(0, 4);
    const previewBenefits = [
        'Builder-direct assistance',
        'Priority site visit scheduling',
        'Offer and price guidance',
        'Zero brokerage support'
    ];
    const quickFacts = [
        property?.squareFootage ? `${property.squareFootage} sq.ft.` : null,
        property?.parkingSpaces ? `${property.parkingSpaces} parking` : null,
        property?.furnishingStatus ? property.furnishingStatus.replace(/-/g, ' ') : null,
        property?.floorNumber ? `Floor ${property.floorNumber}${property.totalFloors ? ` of ${property.totalFloors}` : ''}` : null
    ].filter(Boolean);
    const scrollToSidebarForm = () => {
        document.getElementById('sidebar-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-btn-text bg-primary hover:bg-primary/90 transition-colors">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c2.791 0 5.3-.94 7.172-2.828M15.172 6.828a11 11 0 01-6.344 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Property not found</h2>
                    <p className="text-gray-600 mb-6">We couldn&apos;t find the property you&apos;re looking for.</p>
                    <Link href="/" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-btn-text bg-primary hover:bg-primary/90 transition-colors">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen overflow-x-hidden bg-background">
            <div className="relative">
                <img src={property.gallery[0]} alt={property.title} className="w-full h-[200px] sm:h-[250px] lg:h-[25.625rem] object-cover bg-no-repeat bg-center" />
                <div
                    className='bg-surface text-black flex items-center justify-center gap-2 w-[8rem] sm:w-[10rem] h-[2.5rem] sm:h-[3rem] rounded-[.5rem] absolute bottom-4 right-4 cursor-pointer hover:bg-gray-50 transition-colors shadow-md'
                    onClick={() => {
                        setShowMediaModal(true);
                        setCurrentMediaIndex(0);
                        setMediaType('images');
                    }}
                >
                    <svg className="w-[20px] sm:w-[27px] h-[20px] sm:h-[27px] text-gray-800 dark:text-black" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" d="M4 18V8a1 1 0 0 1 1-1h1.5l1.707-1.707A1 1 0 0 1 8.914 5h6.172a1 1 0 0 1 .707.293L17.5 7H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
                        <path stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <p className='text-xs sm:text-sm font-normal'>{galleryCount} photos</p>
                </div>
            </div>

            <div className='sticky top-0 z-30 border-b border-border bg-background/95 text-black shadow-sm backdrop-blur overflow-x-auto'>
                <div className='mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 px-4 py-3 min-w-fit sm:px-6 lg:px-10 xl:px-16'>
                    {sections.map(({ label, id }) => (
                        <button
                            key={id}
                            onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById(id);
                                if (element) {
                                    element.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'start',
                                        inline: 'nearest'
                                    });
                                }
                            }}
                            className="cursor-pointer whitespace-nowrap rounded-full border border-transparent px-3 py-2 text-xs font-semibold tracking-wide text-muted transition duration-200 hover:border-primary/15 hover:bg-surface hover:text-primary sm:text-sm"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <section className="border-b border-border bg-[linear-gradient(180deg,#fffaf3_0%,#f6f1e8_100%)]">
                <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:flex-row lg:items-start lg:px-10 xl:px-16">
                    <div className="w-full lg:w-[62%]">
                        <div className="mb-5 flex flex-wrap items-center gap-2.5 text-xs font-semibold tracking-[0.14em] text-primary-darker uppercase">
                            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
                                <BadgeCheck size={14} className="text-primary" />
                                Verified Project
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
                                <ShieldCheck size={14} className="text-primary" />
                                Zero Brokerage Assistance
                            </span>
                        </div>

                        <div className="max-w-4xl">
                            <div className="flex items-start justify-between gap-4">
                                <p className="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-primary-darker">
                                    Premium Property Showcase
                                </p>
                                <WishlistButton propertyId={property._id} />
                            </div>
                            <h1 className="text-3xl font-semibold leading-tight text-secondary sm:text-4xl lg:text-[3.2rem] lg:leading-[1.04]">
                                {property.title}
                            </h1>
                            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted sm:text-base">
                                <span className="inline-flex items-center gap-2">
                                    <MapPin size={16} className="text-primary" />
                                    {property.location}
                                </span>
                                {property.developer && (
                                    <span className="inline-flex items-center gap-2">
                                        <Building2 size={16} className="text-primary" />
                                        By {property.developer}
                                    </span>
                                )}
                                {property.possessionDate && (
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarDays size={16} className="text-primary" />
                                        Possession by {property.possessionDate}
                                    </span>
                                )}
                            </div>
                            <p className="mt-5 max-w-3xl text-sm leading-7 text-muted sm:text-base">
                                Explore a premium project with curated support for site visits, pricing, brochure access, and builder-direct negotiation. Built for serious buyers comparing top options.
                            </p>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {projectMetrics.map((metric) => (
                                <div key={metric.label} className="rounded-2xl border border-border bg-surface p-4 text-secondary shadow-sm">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f1] text-primary">
                                        {metric.icon}
                                    </div>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{metric.label}</p>
                                    <p className="mt-2 text-sm font-semibold leading-snug sm:text-base">{metric.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={scrollToSidebarForm}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-btn-text shadow-[0_18px_40px_rgba(215,36,42,0.22)] transition hover:bg-primary-dark sm:text-base"
                            >
                                Book Free Site Visit
                                <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={handleBrochureClick}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-6 py-4 text-sm font-semibold text-secondary transition hover:bg-background sm:text-base"
                            >
                                <Download size={18} />
                                Download Brochure
                            </button>
                            <button
                                onClick={handleContactClick}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-primary-soft px-6 py-4 text-sm font-semibold text-primary-darker transition hover:bg-primary-soft sm:text-base"
                            >
                                <Phone size={18} />
                                Call Property Expert
                            </button>
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            {heroHighlights.map((item) => (
                                <div key={item} className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted shadow-sm">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-[38%]">
                        <div className="lg:sticky lg:top-[5.5rem]">
                            <form id="sidebar-form" onSubmit={handleSidebarFormSubmit} className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_24px_80px_rgba(48,31,17,0.12)]">
                                <div className="bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-dark)_100%)] px-4 py-3 text-center text-white">
                                    <p className="flex items-center justify-center gap-2 text-sm font-bold tracking-wide">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-surface opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-surface"></span>
                                        </span>
                                        Limited Slots for Site Visits This Week
                                    </p>
                                </div>

                                <div className="space-y-5 p-6 sm:p-7">
                                    <div className="text-center">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-darker">Conversion Form</p>
                                        <h2 className="mt-2 text-2xl font-extrabold leading-tight text-gray-900">
                                            Book a <span className="text-primary">Premium Site Visit</span>
                                        </h2>
                                        <p className="mt-2 text-sm text-gray-500">
                                            Fill this once to get brochure help, price guidance, and a guided property tour.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                                        <div className="flex -space-x-2 flex-shrink-0">
                                            {['A', 'R', 'K'].map((initial) => (
                                                <div key={initial} className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-amber-50 bg-secondary text-xs font-semibold text-white">
                                                    {initial}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-xs font-semibold text-amber-800">
                                            High-intent buyers are actively booking visits on this listing
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {[
                                            'Free cab pickup for site visit',
                                            'Negotiate directly with the builder',
                                            'Get exclusive on-site discounts',
                                            'Zero brokerage support'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                                                <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                {item}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-gray-100"></div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="mb-1.5 block pl-1 text-xs font-bold uppercase tracking-wider text-gray-600">Your Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter your full name"
                                                value={sidebarForm.name}
                                                onChange={(e) => setSidebarForm({...sidebarForm, name: e.target.value})}
                                                required
                                                className="text-black w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition-all placeholder-gray-400 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block pl-1 text-xs font-bold uppercase tracking-wider text-gray-600">Phone Number</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">+91</span>
                                                <input
                                                    type="tel"
                                                    placeholder="98765 43210"
                                                    value={sidebarForm.phone}
                                                    onChange={(e) => {
                                                        const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                        setSidebarForm({...sidebarForm, phone: numericValue});
                                                    }}
                                                    maxLength={10}
                                                    required
                                                    className="text-black w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-12 pr-4 outline-none transition-all placeholder-gray-400 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmittingLead}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-lg font-extrabold text-btn-text shadow-lg shadow-red-600/25 transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {isSubmittingLead ? (
                                            <>
                                                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Booking...
                                            </>
                                        ) : (
                                            <>
                                                Book Free Site Visit
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>

                                    <p className="text-center text-[11px] text-gray-400">
                                        Takes 10 seconds. We call you within 2 hours.
                                    </p>

                                    <div className="flex items-center justify-center gap-5 border-t border-gray-100 pt-4">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            No Spam
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            100% Free
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            Free Pickup
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <div className="border-y border-border bg-background text-black">
                <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-3 sm:px-6 lg:px-10 xl:px-16">
                    <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-primary-darker">Why Buyers Convert Here</p>
                        <p className="mt-1 text-sm font-medium text-secondary">High-intent landing page built for ad traffic, fast lead capture, and premium positioning.</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-primary-darker">Trust Signal</p>
                        <p className="mt-1 text-sm font-medium text-secondary">Verified project details, direct assistance, and zero-brokerage consultation flow.</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-primary-darker">Best Next Step</p>
                        <p className="mt-1 text-sm font-medium text-secondary">Use the site visit form to capture paid traffic before it leaks to comparison tabs.</p>
                    </div>
                </div>
            </div>

            <div className='mx-auto mt-8 flex w-full max-w-[1440px] flex-col gap-8 px-4 pb-24 sm:mt-12 sm:px-6 lg:flex-row lg:items-start lg:px-10 lg:pb-0 xl:px-16'>
                <div className='w-full text-black lg:w-8/12 lg:pr-8'>
                    <section id="overview" className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_18px_60px_rgba(48,31,17,0.06)] sm:p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-darker">Overview</p>
                                <h2 className='mt-3 text-2xl font-semibold leading-tight text-secondary sm:text-3xl'>A premium project positioned for high-intent buyers</h2>
                                <p className='mt-4 text-sm leading-7 text-muted sm:text-base'>
                                    {property.description || `${property.title} brings together strong location value, premium planning, and assisted buyer support for site visits, brochure access, and offer discovery.`}
                                </p>
                            </div>
                            <div className="min-w-full rounded-[1.5rem] border border-border bg-background p-5 lg:min-w-[18rem]">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-darker">At a glance</p>
                                <div className="mt-4 space-y-3">
                                    {quickFacts.length > 0 ? quickFacts.map((fact) => (
                                        <div key={fact} className="flex items-center gap-3 text-sm text-secondary">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-primary shadow-sm">
                                                <BadgeCheck size={14} />
                                            </span>
                                            <span>{fact}</span>
                                        </div>
                                    )) : (
                                        <div className="text-sm text-muted">Brochure, pricing and visit support available on request.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-[1.6rem] bg-secondary p-6 text-white">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">Why this page converts</p>
                                <div className="mt-4 space-y-3">
                                    {[
                                        'Fast brochure + price access',
                                        'High-visibility site visit CTA above the fold',
                                        'Trust-focused premium presentation',
                                        'Lower-friction mobile lead capture'
                                    ].map((item) => (
                                        <div key={item} className="flex items-start gap-3 text-sm text-white/82">
                                            <Sparkles size={16} className="mt-0.5 text-primary-light" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-[1.6rem] border border-border bg-background p-6">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-darker">Best actions for serious buyers</p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        onClick={scrollToSidebarForm}
                                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-btn-text transition hover:bg-primary-dark"
                                    >
                                        Schedule visit
                                        <ArrowRight size={16} />
                                    </button>
                                    <button
                                        onClick={handleBrochureClick}
                                        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-secondary transition hover:bg-background"
                                    >
                                        Get brochure
                                    </button>
                                    <button
                                        onClick={handlePriceClick}
                                        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-secondary transition hover:bg-background"
                                    >
                                        Unlock price
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Mobile-only early CTA — form is far below on mobile, this catches users early */}
                    <div className="mt-8 rounded-[1.8rem] border border-border bg-[linear-gradient(135deg,#201b17_0%,#36271f_100%)] p-5 text-white shadow-[0_18px_60px_rgba(48,31,17,0.18)] lg:hidden">
                        <div className="text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">Fast Conversion CTA</p>
                            <p className="mt-2 text-xl font-semibold">Book a guided site visit</p>
                            <p className="mt-1 text-sm text-white/72">Capture the lead before they bounce. Minimal form, quick callback, zero brokerage.</p>
                        </div>
                        <form onSubmit={handleSidebarFormSubmit} className="mt-5 flex flex-col gap-2.5">
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={sidebarForm.name}
                                onChange={(e) => setSidebarForm({...sidebarForm, name: e.target.value})}
                                required
                                className="w-full rounded-2xl border border-white/12 bg-surface/92 px-4 py-3 text-sm text-black outline-none transition-all placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                            />
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">+91</span>
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={sidebarForm.phone}
                                    onChange={(e) => {
                                                const numericValue = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                setSidebarForm({...sidebarForm, phone: numericValue});
                                            }}
                                    maxLength={10}
                                    required
                                    className="w-full rounded-2xl border border-white/12 bg-surface/92 py-3 pl-11 pr-4 text-sm text-black outline-none transition-all placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmittingLead}
                                className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-btn-text shadow-lg shadow-red-600/20 transition-all hover:bg-primary-dark disabled:opacity-50"
                            >
                                {isSubmittingLead ? 'Booking...' : 'Book Free Site Visit →'}
                            </button>
                        </form>
                        <div className="mt-4 flex justify-center gap-4 text-[10px] text-white/52">
                            <span>No Spam</span>
                            <span>Builder Direct</span>
                            <span>Free Pickup</span>
                        </div>
                    </div>

                    <section id="amenities" className='mt-16 sm:mt-24 lg:mt-32'>
                        <div className='mb-6 flex items-center justify-between gap-4'>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-darker">Lifestyle Layer</p>
                                <div className='mt-2 text-2xl font-semibold text-secondary sm:text-3xl lg:text-[32px]'>Amenities</div>
                            </div>
                        </div>
                        {property.amenities && property.amenities.length > 0 ? (
                            <>
                                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4'>
                                    {property.amenities.slice(0, visibleAmenities).map((amenity, index) => (
                                        <div key={index} className='flex h-[86px] flex-col items-center justify-center rounded-2xl border border-border bg-surface p-2 text-black shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:h-[96px]'>
                                            <div className="mb-1 text-primary-darker">
                                                {getAmenityIcon(amenity)}
                                            </div>
                                            <p className='text-center text-xs leading-tight text-secondary sm:text-sm'>{amenity}</p>
                                        </div>
                                    ))}
                                </div>
                                {property.amenities.length > visibleAmenities && (
                                    <div className='flex justify-center mt-6'>
                                        <button
                                            onClick={() => setVisibleAmenities(prev => prev + 12)}
                                            className='cursor-pointer px-6 py-2 bg-primary text-btn-text rounded-md hover:bg-primary-dark transition-colors font-medium'
                                        >
                                            Show More Amenities ({property.amenities.length - visibleAmenities})
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className='text-muted italic'>No amenities information available</p>
                        )}
                    </section>

                    {/* Mid-content CTA */}
                    <div className="relative mt-12 overflow-hidden rounded-[1.8rem] bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary-dark)_52%,var(--primary-darker)_100%)] p-6 text-white shadow-[0_24px_60px_rgba(159,27,31,0.28)] sm:mt-16 sm:p-8">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="text-lg sm:text-xl font-extrabold">Interested? Visit the Site & Get the Best Deal</h3>
                                <p className="text-white/80 text-sm mt-1">On-site visits get exclusive discounts. Limited slots available.</p>
                            </div>
                            <a
                                href="#sidebar-form"
                                onClick={(e) => {
                                    e.preventDefault();
                                    scrollToSidebarForm();
                                }}
                                className="flex-shrink-0 bg-surface text-primary font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all shadow-lg text-sm sm:text-base"
                            >
                                Book Free Site Visit
                            </a>
                        </div>
                    </div>

                    <section id="about-project" className='mt-16 sm:mt-24 lg:mt-32'>
                        <h1 className='text-2xl sm:text-3xl lg:text-[32px] text-secondary font-bold mb-6'>About {property.title}</h1>
                        {property.description && <p className='my-6 text-sm leading-relaxed text-muted sm:my-8 sm:text-base'>{property.description}</p>}
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                            <div className='rounded-2xl border border-border bg-surface p-4 shadow-sm'>
                                <p className=' text-muted'>Project Area</p>
                                <div className='flex items-center justify-start gap-2'>
                                    <h3 className='text-xl font-semibold'>{property.projectArea || '-'}</h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler-dimension-line-icon lucide-ruler-dimension-line"><path d="M12 15v-3.014" /><path d="M16 15v-3.014" /><path d="M20 6H4" /><path d="M20 8V4" /><path d="M4 8V4" /><path d="M8 15v-3.014" /><rect x="3" y="12" width="18" height="7" rx="1" /></svg>
                                </div>
                            </div>
                            <div className='rounded-2xl border border-border bg-surface p-4 shadow-sm'>
                                <p className=' text-muted'>Launch Date</p>
                                <div className='flex items-center justify-start gap-2'>
                                    <h3 className='text-xl font-semibold'>{property.launchDate || '-'}</h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler-dimension-line-icon lucide-ruler-dimension-line"><path d="M12 15v-3.014" /><path d="M16 15v-3.014" /><path d="M20 6H4" /><path d="M20 8V4" /><path d="M4 8V4" /><path d="M8 15v-3.014" /><rect x="3" y="12" width="18" height="7" rx="1" /></svg>
                                </div>
                            </div>
                            <div className='rounded-2xl border border-border bg-surface p-4 shadow-sm'>
                                <p className=' text-muted'>Total Units</p>
                                <div className='flex items-center justify-start gap-2'>
                                    <h3 className='text-xl font-semibold'>{property.totalUnits || '-'}</h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler-dimension-line-icon lucide-ruler-dimension-line"><path d="M12 15v-3.014" /><path d="M16 15v-3.014" /><path d="M20 6H4" /><path d="M20 8V4" /><path d="M4 8V4" /><path d="M8 15v-3.014" /><rect x="3" y="12" width="18" height="7" rx="1" /></svg>
                                </div>
                            </div>
                            <div className='rounded-2xl border border-border bg-surface p-4 shadow-sm'>
                                <p className=' text-muted'>Total Towers</p>
                                <div className='flex items-center justify-start gap-2'>
                                    <h3 className='text-xl font-semibold'>{property.totalTowers || '-'}</h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler-dimension-line-icon lucide-ruler-dimension-line"><path d="M12 15v-3.014" /><path d="M16 15v-3.014" /><path d="M20 6H4" /><path d="M20 8V4" /><path d="M4 8V4" /><path d="M8 15v-3.014" /><rect x="3" y="12" width="18" height="7" rx="1" /></svg>
                                </div>
                            </div>
                            <div className='rounded-2xl border border-border bg-surface p-4 shadow-sm'>
                                <p className=' text-muted'>BHK</p>
                                <div className='flex items-center justify-start gap-2'>
                                    <h3 className='text-xl font-semibold'>{property.bhk || '-'}</h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ruler-dimension-line-icon lucide-ruler-dimension-line"><path d="M12 15v-3.014" /><path d="M16 15v-3.014" /><path d="M20 6H4" /><path d="M20 8V4" /><path d="M4 8V4" /><path d="M8 15v-3.014" /><rect x="3" y="12" width="18" height="7" rx="1" /></svg>
                                </div>
                            </div>
                        </div>

                        <h1 className='text-xl sm:text-2xl lg:text-[26px] text-secondary font-bold mt-8 sm:mt-12 lg:mt-14 mb-4'>Highlights</h1>
                        {property.highlights && property.highlights.length > 0 ? (
                            <div className='space-y-3'>
                                {property.highlights.map((highlight, index) => (
                                    <div key={index} className='flex items-center justify-start gap-3'>
                                        <svg xmlns="http://www.w3.org/2000/svg" style={{color: "green"}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-icon lucide-circle-check flex-shrink-0"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                                        <span className='text-sm sm:text-base'>{highlight}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className='text-muted italic text-sm'>No highlights information available</p>
                        )}

                        <h1 className='text-xl sm:text-2xl lg:text-[26px] text-secondary font-bold mt-8 sm:mt-12 lg:mt-14 mb-4'>Location Advantages</h1>
                        {property.locationAdvantages && property.locationAdvantages.length > 0 ? (
                            <div className='space-y-3'>
                                {property.locationAdvantages.map((advantage, index) => (
                                    <div key={index} className='flex items-center justify-start gap-3'>
                                        <svg xmlns="http://www.w3.org/2000/svg" style={{color: "green"}} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check-icon lucide-circle-check flex-shrink-0"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                                        <span className='text-sm sm:text-base'>{advantage}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className='text-muted italic text-sm'>No location advantages information available</p>
                        )}
                    </section>

                    {/* Location Map Section — OpenStreetMap tiles via Leaflet */}
                    {(property.mapLocationLink || property.location) && (
                        <section id="location-map" className='mt-16 sm:mt-24 lg:mt-32'>
                            <div className="flex items-center gap-3 mb-6">
                                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <h1 className='text-2xl sm:text-3xl lg:text-[32px] text-secondary font-bold'>
                                    Property Location
                                </h1>
                            </div>
                            <LocationMap
                                location={property.location}
                                propertyTitle={property.title}
                                mapLocationLink={property.mapLocationLink}
                            />
                        </section>
                    )}

                    {/* EMI Calculator Section */}
                    <section id="emi-calculator" className='mt-16 sm:mt-24 lg:mt-32'>
                        <h1 className='text-2xl sm:text-3xl lg:text-[32px] text-secondary font-bold mb-6'>
                            EMI Calculator
                        </h1>
                        <div className="bg-surface rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                            <EMICalculator
                                defaultPrice={(() => {
                                    if (!property.price) return 5000000;

                                    // If it's already a number
                                    if (typeof property.price === 'number') return property.price;

                                    // Try to parse string price
                                    const priceStr = property.price.toString().toLowerCase();

                                    // Check if it's a range (e.g., "1 - 2.1 Cr")
                                    if (priceStr.includes('-')) {
                                        // Extract the first number from range
                                        const firstNum = priceStr.split('-')[0].trim();
                                        const numMatch = firstNum.match(/[\d.]+/);
                                        if (numMatch) {
                                            const value = parseFloat(numMatch[0]);
                                            if (priceStr.includes('cr')) {
                                                return value * 10000000; // Convert Cr to number
                                            } else if (priceStr.includes('l')) {
                                                return value * 100000; // Convert L to number
                                            }
                                        }
                                    }

                                    // Try to extract single number
                                    const numMatch = priceStr.match(/[\d.]+/);
                                    if (numMatch) {
                                        const value = parseFloat(numMatch[0]);
                                        if (priceStr.includes('cr')) {
                                            return value * 10000000;
                                        } else if (priceStr.includes('l')) {
                                            return value * 100000;
                                        }
                                        return value; // If no unit, assume it's the actual number
                                    }

                                    return 5000000; // Default fallback
                                })()}
                                minPrice={1000000}
                                maxPrice={100000000}
                                showPriceSlider={true}
                                propertyTitle={property.title}
                                embedded={true}
                            />
                        </div>
                    </section>

                    {/* Similar Properties Section */}
                    <section className='mt-16 sm:mt-24 lg:mt-32'>
                        <h1 className='text-2xl sm:text-3xl lg:text-[32px] text-secondary font-bold mb-6'>
                            {property.mode === 'buy' ? 'More Properties' : 'Similar Properties'}
                        </h1>
                        
                        {loadingSimilar ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : similarProperties.length > 0 ? (
                            <div className="relative">
                                {/* Navigation Buttons */}
                                {similarProperties.length > 3 && (
                                    <>
                                        <button
                                            onClick={prevSlide}
                                            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-surface shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
                                            style={{ marginLeft: '-1.5rem' }}
                                        >
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={nextSlide}
                                            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-surface shadow-lg rounded-full p-3 hover:bg-gray-50 transition-colors"
                                            style={{ marginRight: '-1.5rem' }}
                                        >
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </>
                                )}

                                {/* Properties Slider */}
                                <div className="overflow-hidden">
                                    <div 
                                        className="flex transition-transform duration-300 ease-in-out gap-3 sm:gap-4 lg:gap-6"
                                        style={{ 
                                            transform: `translateX(-${currentSlide * (100 / 3)}%)`,
                                            width: `${Math.ceil(similarProperties.length / 3) * 100}%`
                                        }}
                                    >
                                        {similarProperties.map((similarProperty) => (
                                            <div key={similarProperty._id} className="flex-shrink-0 w-[20%] min-w-0">
                                                <Link href={`/property/${similarProperty._id}`} className="block group">
                                                    <div className="bg-surface rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                                                        {/* Property Image */}
                                                        <div className="relative h-32 sm:h-40 lg:h-56 overflow-hidden">
                                                            <img
                                                                src={similarProperty.gallery[0]}
                                                                alt={similarProperty.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                            {/* Media Count Badge */}
                                                            <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                                                                {similarProperty.gallery.length} {similarProperty.gallery.length === 1 ? 'photo' : 'photos'}
                                                                {similarProperty.videos && similarProperty.videos.length > 0 && (
                                                                    <span>, {similarProperty.videos.length} video{similarProperty.videos.length !== 1 ? 's' : ''}</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Property Details */}
                                                        <div className="p-2 sm:p-3 lg:p-5">
                                                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 lg:mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                                                {similarProperty.title}
                                                            </h3>
                                                            
                                                            <div className="flex items-center text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2 lg:mb-3">
                                                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <span className="truncate">{similarProperty.location}</span>
                                                            </div>

                                                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                                                <span className="bg-gray-100 px-2 py-1 sm:px-3 sm:py-2 rounded-lg font-medium text-gray-700">
                                                                    {similarProperty.bhk}
                                                                </span>
                                                                <span className="font-semibold text-primary text-xs sm:text-sm lg:text-base">
                                                                    {similarProperty.price ? formatPrice(similarProperty.price) : 'Price on Request'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className='text-muted italic text-sm'>No similar properties found</p>
                        )}
                    </section>

                    <section id="ratings-reviews"></section>
                    <section id="about-location" className='mb-12 sm:mb-24 lg:mb-32'></section>
                </div>
                <div className="w-full lg:w-4/12 lg:pl-8 mb-12">
                    <div className="sticky top-[5rem]">
                        <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_22px_80px_rgba(48,31,17,0.10)]">
                            <div className="bg-[linear-gradient(135deg,#201b17_0%,#37281f_100%)] px-6 py-6 text-white">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">Private Buying Assistance</p>
                                        <h3 className="mt-2 text-2xl font-semibold leading-tight">Get the best offer before you visit</h3>
                                    </div>
                                    <div className="rounded-full bg-white/10 p-3 text-primary-light">
                                        <TimerReset size={18} />
                                    </div>
                                </div>
                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {previewBenefits.map((item) => (
                                        <div key={item} className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3 text-sm font-medium text-white/82">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 p-6">
                                <div className="rounded-2xl bg-background px-4 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-primary-darker">Media Preview</p>
                                    <p className="mt-1 text-base font-semibold text-secondary">{galleryCount} photos{videoCount ? ` • ${videoCount} videos` : ''}</p>
                                    <button
                                        onClick={() => {
                                            setShowMediaModal(true);
                                            setCurrentMediaIndex(0);
                                            setMediaType('images');
                                        }}
                                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary-dark"
                                    >
                                        View Gallery
                                    </button>
                                </div>
                                <p className="text-sm leading-6 text-muted">
                                    Premium buyer support with project details, pricing guidance, and fast callback for serious enquiries.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modern Media Viewer Modal V2 */}
            {showMediaModal && (() => {
                const currentMedia = mediaType === 'images' ? property.gallery : (property.videos || []);
                const currentItem = currentMedia[currentMediaIndex];
                const currentCount = currentMedia.length;

                if (!currentItem) return null;

                return (
                    <div className="fixed inset-0 z-[71] bg-[radial-gradient(circle_at_top_left,rgba(197,154,88,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(215,36,42,0.12),transparent_20%),linear-gradient(180deg,#0b0b0b,#121212)] backdrop-blur-xl">
                        <div className="absolute inset-0 bg-black/40" onClick={handleCloseMediaModal}></div>
                        <div className="relative mx-auto flex h-full w-full max-w-[1700px] flex-col px-2 py-2 sm:px-4 sm:py-4">
                            <div className="mb-3 flex items-center justify-between gap-3 rounded-[1.6rem] border border-white/10 bg-white/6 px-4 py-3 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-5">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-light">
                                            {mediaType === 'images' ? <ImageIcon size={14} /> : <Video size={14} />}
                                            {mediaType === 'images' ? 'Visual Tour' : 'Video Tour'}
                                        </span>
                                        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/70">
                                            {currentMediaIndex + 1} / {currentCount}
                                        </span>
                                    </div>
                                    <h3 className="mt-2 truncate text-base font-semibold text-white sm:text-xl">{property.title}</h3>
                                    <p className="mt-0.5 truncate text-xs text-white/60 sm:text-sm">{property.location}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex rounded-full border border-white/10 bg-black/25 p-1">
                                        <button
                                            onClick={() => {
                                                setMediaType('images');
                                                setCurrentMediaIndex(0);
                                            }}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                                                mediaType === 'images'
                                                    ? 'bg-surface text-secondary shadow-sm'
                                                    : 'text-white/72 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            <ImageIcon size={16} />
                                            Images ({property.gallery?.length || 0})
                                        </button>
                                        {property.videos && property.videos.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    setMediaType('videos');
                                                    setCurrentMediaIndex(0);
                                                }}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                                                    mediaType === 'videos'
                                                        ? 'bg-surface text-secondary shadow-sm'
                                                        : 'text-white/72 hover:bg-white/10 hover:text-white'
                                                }`}
                                            >
                                                <Video size={16} />
                                                Videos ({property.videos.length})
                                            </button>
                                        )}
                                    </div>

                                    {mediaType === 'images' && (
                                        <button
                                            onClick={toggleZoom}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/14"
                                        >
                                            {isZoomed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                            {isZoomed ? 'Fit' : 'Zoom'}
                                        </button>
                                    )}

                                    <button
                                        onClick={handleCloseMediaModal}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/14"
                                    >
                                        <X size={16} />
                                        Close
                                    </button>
                                </div>
                            </div>

                            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[6.5rem_minmax(0,1fr)]">
                                <div
                                    ref={thumbnailStripRef}
                                    className="hidden overflow-y-auto rounded-[1.5rem] border border-white/8 bg-white/5 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur lg:block"
                                >
                                    <div className="flex flex-col gap-2">
                                        {currentMedia.map((item, index) => (
                                            <button
                                                key={index}
                                                data-thumb-index={index}
                                                onClick={() => handleThumbnailClick(index)}
                                                className={`group relative h-[5.5rem] w-full overflow-hidden rounded-[1.1rem] border transition ${
                                                    index === currentMediaIndex
                                                        ? 'border-primary-light shadow-[0_0_0_1px_rgba(244,201,124,0.45)]'
                                                        : 'border-white/8 hover:border-white/30'
                                                }`}
                                            >
                                                {mediaType === 'images' ? (
                                                    <img
                                                        src={item}
                                                        alt={`Thumbnail ${index + 1}`}
                                                        className={`h-full w-full object-cover transition duration-300 ${
                                                            index === currentMediaIndex ? 'scale-110' : 'group-hover:scale-105'
                                                        }`}
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#2b2b2b,#121212)]">
                                                        <Video size={20} className="text-white/80" />
                                                    </div>
                                                )}
                                                <div className={`absolute inset-0 transition ${
                                                    index === currentMediaIndex ? 'bg-gradient-to-t from-primary-light/35 to-transparent' : 'bg-black/12 group-hover:bg-black/0'
                                                }`}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative min-h-0 overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
                                    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/8 bg-gradient-to-b from-black/35 to-transparent px-4 py-3 text-white">
                                        <div className="text-xs uppercase tracking-[0.18em] text-white/58">
                                            {mediaType === 'images' ? 'Editorial gallery layout' : 'Project walkthrough'}
                                        </div>
                                        <div className="text-xs text-white/58">
                                            {currentCount} item{currentCount !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    <div className="relative flex h-[calc(100vh-150px)] min-h-0 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#121212,#090909)] px-3 py-14 sm:h-[calc(100vh-165px)] sm:px-5">
                                        {mediaType === 'images' ? (
                                            <button
                                                type="button"
                                                onClick={toggleZoom}
                                                className={`relative block max-w-full max-h-full select-none transition-transform duration-500 ${
                                                    isZoomed ? 'scale-[1.35] cursor-zoom-out' : 'cursor-zoom-in'
                                                }`}
                                            >
                                                <img
                                                    src={currentItem}
                                                    alt={`Property image ${currentMediaIndex + 1}`}
                                                    className="max-h-full w-auto max-w-full rounded-[1.25rem] object-contain shadow-[0_28px_90px_rgba(0,0,0,0.6)]"
                                                    draggable={false}
                                                />
                                            </button>
                                        ) : (
                                            <div className="relative flex h-full w-full items-center justify-center">
                                                {(() => {
                                                    const embedUrl = getEmbedUrl(currentItem);

                                                    if (embedUrl) {
                                                        return (
                                                            <div className="relative w-full max-w-6xl" style={{ aspectRatio: '16/9', maxHeight: '100%' }}>
                                                                <iframe
                                                                    src={`${embedUrl}?enablejsapi=1&origin=${window.location.origin}&rel=0&showinfo=1&controls=1&modestbranding=1&playsinline=1`}
                                                                    className="absolute inset-0 h-full w-full rounded-[1.25rem] shadow-[0_28px_90px_rgba(0,0,0,0.6)]"
                                                                    style={{ border: 'none' }}
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                                                    allowFullScreen
                                                                    title={`Property video ${currentMediaIndex + 1}`}
                                                                    loading="lazy"
                                                                    sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                                                                />
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <video
                                                            src={currentItem}
                                                            controls
                                                            className="h-full w-full rounded-[1.25rem] object-contain shadow-[0_28px_90px_rgba(0,0,0,0.6)]"
                                                            style={{ maxHeight: '100%' }}
                                                            autoPlay={false}
                                                            playsInline
                                                        />
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {currentCount > 1 && (
                                            <>
                                                <button
                                                    onClick={() => handleMediaNavigation('prev')}
                                                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/12 bg-black/45 p-3 text-white shadow-lg backdrop-blur transition hover:bg-black/65 sm:left-5"
                                                    title="Previous"
                                                >
                                                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                                                </button>
                                                <button
                                                    onClick={() => handleMediaNavigation('next')}
                                                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/12 bg-black/45 p-3 text-white shadow-lg backdrop-blur transition hover:bg-black/65 sm:right-5"
                                                    title="Next"
                                                >
                                                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                                                </button>
                                            </>
                                        )}

                                        <div className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] font-medium text-white/80 backdrop-blur sm:left-5">
                                            {mediaType === 'images' ? 'Tap to zoom image' : 'Play in full resolution'}
                                        </div>
                                    </div>

                                    <div className="border-t border-white/8 bg-white/5 px-3 py-3 backdrop-blur sm:px-5 lg:hidden">
                                        <div
                                            ref={thumbnailStripRef}
                                            className="overflow-x-auto overflow-y-hidden scrollbar-hide"
                                        >
                                            <div className="flex min-w-max items-center gap-2">
                                                {currentMedia.map((item, index) => (
                                                    <button
                                                        key={index}
                                                        data-thumb-index={index}
                                                        onClick={() => handleThumbnailClick(index)}
                                                        className={`group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-[1rem] border transition ${
                                                            index === currentMediaIndex
                                                                ? 'border-primary-light shadow-[0_0_0_1px_rgba(244,201,124,0.45)]'
                                                                : 'border-white/10 hover:border-white/30'
                                                        }`}
                                                    >
                                                        {mediaType === 'images' ? (
                                                            <img
                                                                src={item}
                                                                alt={`Thumbnail ${index + 1}`}
                                                                className={`h-full w-full object-cover transition duration-300 ${
                                                                    index === currentMediaIndex ? 'scale-110' : 'group-hover:scale-105'
                                                                }`}
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#2d2d2d,#121212)]">
                                                                <Video size={18} className="text-white/80" />
                                                            </div>
                                                        )}
                                                        <div className={`absolute inset-0 transition ${
                                                            index === currentMediaIndex ? 'bg-gradient-to-t from-primary-light/35 to-transparent' : 'bg-black/12 group-hover:bg-black/0'
                                                        }`}></div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Modern Media Viewer Modal */}
            {false && showMediaModal && (
                <div className="fixed inset-0 z-[70] bg-[radial-gradient(circle_at_top,rgba(131,92,38,0.18),transparent_30%),linear-gradient(180deg,rgba(10,10,10,0.98),rgba(18,18,18,0.96))] backdrop-blur-xl">
                    <div className="absolute inset-0 bg-black/35" onClick={handleCloseMediaModal}></div>
                    <div className="relative mx-auto flex h-full w-full max-w-[1600px] flex-col px-2 py-2 sm:px-3 sm:py-3">
                        {(() => {
                            const currentMedia = mediaType === 'images' ? property.gallery : (property.videos || []);
                            const currentItem = currentMedia[currentMediaIndex];
                            const currentCount = currentMedia.length;

                            if (!currentItem) return null;

                            return (
                                <>
                                    <div className="mb-2 flex flex-col gap-2 rounded-[1.35rem] border border-white/10 bg-white/6 px-3 py-2.5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-md sm:px-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-light">
                                                    {mediaType === 'images' ? <ImageIcon size={14} /> : <Video size={14} />}
                                                    {mediaType === 'images' ? 'Gallery View' : 'Video Tour'}
                                                </span>
                                                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/70">
                                                    {currentMediaIndex + 1} of {currentCount}
                                                </span>
                                            </div>
                                            <h3 className="mt-1.5 truncate text-sm font-semibold text-white sm:text-lg">{property.title}</h3>
                                            <p className="mt-0.5 truncate text-[11px] text-white/62 sm:text-xs">{property.location}</p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="flex rounded-full border border-white/10 bg-black/25 p-1">
                                                <button
                                                    onClick={() => {
                                                        setMediaType('images');
                                                        setCurrentMediaIndex(0);
                                                    }}
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition sm:px-3.5 sm:text-xs ${
                                                        mediaType === 'images'
                                                            ? 'bg-surface text-secondary shadow-sm'
                                                            : 'text-white/72 hover:bg-white/10 hover:text-white'
                                                    }`}
                                                >
                                                    <ImageIcon size={16} />
                                                    Images ({property.gallery?.length || 0})
                                                </button>
                                                {property.videos && property.videos.length > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setMediaType('videos');
                                                            setCurrentMediaIndex(0);
                                                        }}
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition sm:px-3.5 sm:text-xs ${
                                                            mediaType === 'videos'
                                                                ? 'bg-surface text-secondary shadow-sm'
                                                                : 'text-white/72 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                    >
                                                        <Video size={16} />
                                                        Videos ({property.videos.length})
                                                    </button>
                                                )}
                                            </div>

                                            {mediaType === 'images' && (
                                                <button
                                                    onClick={toggleZoom}
                                                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/14 sm:px-3.5 sm:text-xs"
                                                    title={isZoomed ? "Zoom Out" : "Zoom In"}
                                                >
                                                    {isZoomed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                                    {isZoomed ? 'Fit' : 'Zoom'}
                                                </button>
                                            )}

                                            <button
                                                onClick={handleCloseMediaModal}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/14 sm:px-3.5 sm:text-xs"
                                                title="Close"
                                            >
                                                <X size={16} />
                                                Close
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative min-h-0 flex-1">
                                        <div className="absolute inset-0 rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
                                            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                                        </div>

                                        <div className="relative flex h-full min-h-0 flex-col p-1.5 sm:p-2">
                                            <div className="relative flex h-[calc(100vh-150px)] min-h-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(18,18,18,0.98),rgba(10,10,10,0.98))] sm:h-[calc(100vh-160px)]">
                                                {mediaType === 'images' ? (
                                                    <button
                                                        type="button"
                                                        onClick={toggleZoom}
                                                        className={`relative block max-w-full max-h-full transition-transform duration-300 select-none ${
                                                            isZoomed ? 'scale-[1.45] cursor-zoom-out' : 'cursor-zoom-in'
                                                        }`}
                                                    >
                                                        <img
                                                            src={currentItem}
                                                            alt={`Property image ${currentMediaIndex + 1}`}
                                                            className="max-h-full w-auto max-w-full rounded-[1rem] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
                                                            draggable={false}
                                                        />
                                                    </button>
                                                ) : (
                                                    <div className="relative flex h-full w-full items-center justify-center px-1">
                                                        {(() => {
                                                            const embedUrl = getEmbedUrl(currentItem);

                                                            if (embedUrl) {
                                                                return (
                                                                    <div className="relative h-full w-full max-w-[92vw] sm:max-w-[88vw] lg:max-w-[82vw]" style={{ aspectRatio: '16/9', maxHeight: '100%' }}>
                                                                        <iframe
                                                                            src={`${embedUrl}?enablejsapi=1&origin=${window.location.origin}&rel=0&showinfo=1&controls=1&modestbranding=1&playsinline=1`}
                                                                            className="absolute inset-0 h-full w-full rounded-[1rem] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
                                                                            style={{ border: 'none' }}
                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                                                            allowFullScreen
                                                                            title={`Property video ${currentMediaIndex + 1}`}
                                                                            loading="lazy"
                                                                            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                                                                        />
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <video
                                                                    src={currentItem}
                                                                    controls
                                                                    className="h-full w-full rounded-[1rem] object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
                                                                    style={{ maxHeight: '100%' }}
                                                                    autoPlay={false}
                                                                    playsInline
                                                                />
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                {currentCount > 1 && (
                                                    <>
                                                        <button
                                                            onClick={() => handleMediaNavigation('prev')}
                                                            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/12 bg-black/45 p-2.5 text-white shadow-lg backdrop-blur transition hover:bg-black/65 sm:left-4 sm:p-3"
                                                            title="Previous"
                                                        >
                                                            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMediaNavigation('next')}
                                                            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/12 bg-black/45 p-2.5 text-white shadow-lg backdrop-blur transition hover:bg-black/65 sm:right-4 sm:p-3"
                                                            title="Next"
                                                        >
                                                            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                                                        </button>
                                                    </>
                                                )}

                                                <div className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur sm:left-4 sm:text-[11px]">
                                                    {mediaType === 'images' ? 'Tap image to zoom' : 'Swipe through video tour'}
                                                </div>
                                            </div>

                                            <div className="mt-1.5 flex items-center justify-between gap-3">
                                                <div className="text-[11px] text-white/52 sm:text-xs">
                                                    <span className="font-semibold text-white/75">← →</span> navigate, <span className="font-semibold text-white/75">ESC</span> close.
                                                </div>
                                                <div className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-primary-light">
                                                    Premium Viewer
                                                </div>
                                            </div>

                                            <div
                                                ref={thumbnailStripRef}
                                                className="mt-1.5 overflow-x-auto overflow-y-hidden scrollbar-hide"
                                            >
                                                <div className="flex min-w-max items-center gap-2 px-1 pb-0.5">
                                                    {currentMedia.map((item, index) => (
                                                        <button
                                                            key={index}
                                                            data-thumb-index={index}
                                                            onClick={() => handleThumbnailClick(index)}
                                                            className={`group relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border transition sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px] ${
                                                                index === currentMediaIndex
                                                                    ? 'border-primary-light shadow-[0_0_0_1px_rgba(244,201,124,0.5),0_16px_30px_rgba(0,0,0,0.28)]'
                                                                    : 'border-white/10 hover:border-white/35'
                                                            }`}
                                                        >
                                                            {mediaType === 'images' ? (
                                                                <img
                                                                    src={item}
                                                                    alt={`Thumbnail ${index + 1}`}
                                                                    className={`h-full w-full object-cover transition duration-300 ${
                                                                        index === currentMediaIndex ? 'scale-110' : 'group-hover:scale-105'
                                                                    }`}
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,#2d2d2d,#121212)]">
                                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                                                                        <Video size={18} />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className={`absolute inset-0 transition ${
                                                                index === currentMediaIndex ? 'bg-gradient-to-t from-primary-light/30 to-transparent' : 'bg-black/10 group-hover:bg-black/0'
                                                            }`}></div>
                                                            <div className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                                                                {index + 1}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Lead Capture Modal for Price Inquiry */}
            {showPriceModal && (
                <LeadCaptureModal
                    isOpen={showPriceModal}
                    onClose={handleClosePriceModal}
                    onSubmit={handlePriceLeadSubmit}
                    title="Get Property Price"
                    description="We'll call you within 2 hours with exclusive pricing & offers."
                    propertyTitle={property.title}
                    propertyLocation={property.location}
                />
            )}

            {/* Lead Capture Modal for Brochure Download */}
            {showBrochureModal && (
                <LeadCaptureModal
                    isOpen={showBrochureModal}
                    onClose={handleCloseBrochureModal}
                    onSubmit={handleBrochureLeadSubmit}
                    title="Download Brochure"
                    description="Get floor plans, pricing & brochure sent to your phone instantly."
                    propertyTitle={property.title}
                    propertyLocation={property.location}
                />
            )}

            {/* General Lead Capture Modal */}
            {showLeadModal && (
                <LeadCaptureModal
                    isOpen={showLeadModal}
                    onClose={handleCloseLeadModal}
                    onSubmit={handleLeadSubmit}
                    title="Book Free Site Visit"
                    description="Visit the property & negotiate the best deal directly with the builder."
                    propertyTitle={property.title}
                    propertyLocation={property.location}
                />
            )}

            {/* Price Success Modal */}
            {showPriceSuccessModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClosePriceSuccessModal}></div>
                    <div className="relative bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center mx-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                        <p className="text-gray-600 mb-6">
                            We have received your price inquiry. Our team will contact you soon with detailed pricing information.
                        </p>
                        <button
                            onClick={handleClosePriceSuccessModal}
                            className="w-full px-6 py-3 bg-primary text-btn-text font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Brochure Success Modal */}
            {showBrochureSuccessModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" id="propertiespagesuccessmessage">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCloseBrochureSuccessModal}></div>
                    <div className="relative bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center mx-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2" id="propertiespagesuccessmessageparagraph">Request Received!</h3>
                        <p className="text-gray-600 mb-6">
                            Thank you for your interest! Our team will contact you soon with the property brochure and additional details.
                        </p>
                        <button
                            onClick={handleCloseBrochureSuccessModal}
                            className="w-full px-6 py-3 bg-primary text-btn-text font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar Form Success Modal */}
            {showSidebarSuccessModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCloseSidebarSuccessModal}></div>
                    <div className="relative bg-surface rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center mx-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Site Visit Booked!</h3>
                        <p className="text-gray-600 mb-6">
                            Our team will call you within 2 hours to schedule your free site visit. Get ready to see your dream home!
                        </p>
                        <button
                            onClick={handleCloseSidebarSuccessModal}
                            className="w-full px-6 py-3 bg-primary text-btn-text font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Sticky Mobile CTA Bar */}
            <div className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/15 bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-10px_30px_rgba(32,27,23,0.12)] backdrop-blur lg:hidden">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-xs font-bold text-gray-900">{property.title}</p>
                            <p className="text-[10px] text-gray-500">Book a guided visit and get pricing help</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowLeadModal(true)}
                            className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-btn-text shadow-lg shadow-red-600/25 transition-all hover:bg-primary-dark"
                        >
                            Book Site Visit
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                    </div>
            </div>
        </div>
    );
}
