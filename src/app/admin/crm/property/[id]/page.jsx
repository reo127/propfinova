'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  MessageCircle,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Camera,
  Video,
  Layers,
  Compass,
  CheckCircle2,
  User,
  Tag,
  Maximize2,
  CalendarCheck
} from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';
import { getEmbedUrl, getVideoPlayerProps } from '@/utils/videoUtils';

export default function AdminPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeMediaTab, setActiveMediaTab] = useState('images');
  const [user, setUser] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (userData.role !== 'admin') {
        router.push('/admin'); // Redirect non-admin users
        return;
      }
    } else {
      router.push('/login'); // Redirect if not logged in
      return;
    }

    if (params.id) {
      fetchPropertyDetails();
    }
  }, [params.id, router]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/properties/${params.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch property details');
      }
      
      setProperty(data.data);
    } catch (error) {
      console.error('Error fetching property:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const copyPropertyId = () => {
    if (!property?._id) return;
    navigator.clipboard.writeText(property._id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Loading Property Portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-surface rounded-2xl p-8 border border-rose-200 shadow-xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Property Not Accessible</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'This property profile does not exist or has been removed.'}</p>
          <button 
            onClick={() => router.back()}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Return to Previous Screen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Executive Header */}
      <div className="bg-surface/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 md:top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                    Sales Match Dossier
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    #{property._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate max-w-md mt-0.5">
                  {property.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <Link 
                href="/admin/crm/leads"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Back to Leads
              </Link>
              <a
                href={`tel:${property.contactNumber}`}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-btn-text rounded-xl text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Owner</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Media Gallery & Property Overview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="p-6">
                {/* Title and Price Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {property.title}
                    </h2>
                    <div className="flex items-center text-sm font-medium text-slate-600 gap-1.5">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{property.location}</span>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                      {formatPrice(property.price)}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                      {property.mode === 'rent' ? 'Per Month' : 'Total Valuation'}
                    </div>
                  </div>
                </div>

                {/* Property Feature Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg capitalize">
                    {property.type}
                  </span>
                  {property.bhk && property.bhk !== 'na' && (
                    <span className="px-3 py-1 bg-rose-50 border border-rose-100 text-primary text-xs font-bold rounded-lg">
                      {property.bhk.toUpperCase()}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg capitalize">
                    For {property.mode}
                  </span>
                  {property.furnishingStatus && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg capitalize">
                      {property.furnishingStatus.replace('-', ' ')}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold rounded-lg inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Inventory
                  </span>
                </div>

                {/* Media Gallery */}
                <div className="space-y-4">
                  {/* Media Tabs */}
                  <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                    <button
                      onClick={() => setActiveMediaTab('images')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeMediaTab === 'images'
                          ? 'bg-surface text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Photography ({property.gallery?.length || 0})</span>
                    </button>
                    {property.videos && property.videos.length > 0 && (
                      <button
                        onClick={() => setActiveMediaTab('videos')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeMediaTab === 'videos'
                            ? 'bg-surface text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Video Tours ({property.videos.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Images Tab */}
                  {activeMediaTab === 'images' && property.gallery && property.gallery.length > 0 && (
                    <div>
                      {/* Main Featured Image */}
                      <div className="relative mb-3 aspect-video sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
                        <img
                          src={property.gallery[selectedImageIndex]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-3 right-3 bg-slate-950/70 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-bold">
                          {selectedImageIndex + 1} / {property.gallery.length}
                        </div>
                      </div>
                      
                      {/* Image Thumbnails Carousel */}
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {property.gallery.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all cursor-pointer ${
                              selectedImageIndex === index 
                                ? 'border-primary shadow-xs scale-98' 
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${property.title} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos Tab */}
                  {activeMediaTab === 'videos' && property.videos && property.videos.length > 0 && (
                    <div className="space-y-4">
                      {property.videos.map((videoUrl, index) => {
                        const embedUrl = getEmbedUrl(videoUrl);
                        if (embedUrl) {
                          return (
                            <div key={index} className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-black">
                              <iframe
                                src={embedUrl}
                                title={`Property Video ${index + 1}`}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                              ></iframe>
                            </div>
                          );
                        }
                        return (
                          <div key={index} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                            <p className="text-xs font-semibold text-slate-600 mb-2">Video source external link</p>
                            <a 
                              href={videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                            >
                              <span>Open Video in New Tab</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Property Description */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Property Description & Narrative
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                    {property.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - CRM Sales & Technical Dossier */}
          <div className="lg:col-span-1 space-y-6">
            {/* Critical Sales Contact Card */}
            <div className="bg-secondary text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                    Direct Owner Contact
                  </span>
                  <button
                    onClick={copyPropertyId}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    title="Copy Property ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="font-mono text-[11px]">#{property._id.slice(-6).toUpperCase()}</span>
                  </button>
                </div>

                <div className="mb-5">
                  <div className="text-xs text-slate-400 font-medium mb-1">Owner / Rep Phone</div>
                  <div className="text-xl font-bold tracking-tight text-white font-mono">
                    {property.contactNumber || 'Not available'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${property.contactNumber}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-primary hover:bg-primary-dark text-btn-text text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href={`https://wa.me/${property.contactNumber?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Property Specifications */}
            <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-2xs p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Technical Specifications
              </h3>
              <div className="divide-y divide-slate-100 text-xs font-medium">
                {property.squareFootage && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Super Built-up Area:</span>
                    <span className="font-bold text-slate-900">{property.squareFootage} sq ft</span>
                  </div>
                )}
                {property.lotSize && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Plot / Lot Size:</span>
                    <span className="font-bold text-slate-900">{property.lotSize}</span>
                  </div>
                )}
                {property.propertyCondition && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Condition:</span>
                    <span className="font-bold text-slate-900 capitalize">{property.propertyCondition.replace('-', ' ')}</span>
                  </div>
                )}
                {property.parkingSpaces && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Parking Capacity:</span>
                    <span className="font-bold text-slate-900">{property.parkingSpaces} Vehicle(s)</span>
                  </div>
                )}
                {property.floorNumber && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Floor Level:</span>
                    <span className="font-bold text-slate-900">
                      Floor {property.floorNumber}{property.totalFloors ? ` of ${property.totalFloors}` : ''}
                    </span>
                  </div>
                )}
                {property.yearBuilt && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Year Built / Delivered:</span>
                    <span className="font-bold text-slate-900">{property.yearBuilt}</span>
                  </div>
                )}
                {property.availabilityDate && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Available From:</span>
                    <span className="font-bold text-slate-900">{formatDate(property.availabilityDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-2xs p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Financial Architecture
              </h3>
              <div className="divide-y divide-slate-100 text-xs font-medium">
                <div className="flex justify-between py-2.5">
                  <span className="text-slate-500">Base Listing Price:</span>
                  <span className="font-bold text-primary">{formatPrice(property.price)}</span>
                </div>
                {property.hoa && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Maintenance / HOA:</span>
                    <span className="font-bold text-slate-900">{property.hoa}</span>
                  </div>
                )}
                {property.propertyTax && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">Annual Property Tax:</span>
                    <span className="font-bold text-slate-900">{property.propertyTax}</span>
                  </div>
                )}
                {property.schoolDistrict && (
                  <div className="flex justify-between py-2.5">
                    <span className="text-slate-500">School Zone / District:</span>
                    <span className="font-bold text-slate-900">{property.schoolDistrict}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-2xs p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  In-House Amenities ({property.amenities.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((amenity, index) => (
                    <span key={index} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Corridors Served */}
            {property.nearbyLocations && property.nearbyLocations.length > 0 && (
              <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-2xs p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Adjacent Micro-Markets Served
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {property.nearbyLocations.map((location, index) => (
                    <span key={index} className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-lg">
                      {location}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  Ideal alternative for prospects searching in these sub-zones.
                </p>
              </div>
            )}

            {/* Property System Metadata */}
            <div className="bg-slate-100/70 rounded-2xl border border-slate-200/60 p-4 text-[11px] text-slate-500 space-y-1.5">
              <div className="flex justify-between">
                <span>Created Date:</span>
                <span className="font-medium text-slate-700">{formatDate(property.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Inventory ID:</span>
                <span className="font-mono text-slate-700">{property._id}</span>
              </div>
              <div className="flex justify-between">
                <span>Listing Advisor:</span>
                <span className="font-medium text-slate-700">{property.user?.name || 'Admin'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}