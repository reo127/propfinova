'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { isValidVideoUrl, getThumbnailUrl, getPlatformName } from '@/utils/videoUtils';
import { getAllLocations } from '@/utils/locations';
import { ACCEPT_IMAGES, ACCEPT_VIDEOS } from '@/lib/uploadTypes';

const inputClass = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/10 transition-colors placeholder:text-slate-400 placeholder:font-normal";
const labelClass = "block text-[11px] font-bold text-slate-600 uppercase tracking-wide mb-1.5";
const sectionCardClass = "bg-surface rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden";

function SectionHeader({ icon, title, expanded, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-2 text-sm font-bold text-slate-900 px-6 sm:px-8 py-5 cursor-pointer hover:bg-slate-50/60 transition-colors"
    >
      <span className="flex items-center gap-2">
        {icon}
        {title}
      </span>
      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </button>
  );
}

export default function ListProperty() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    mapLocationLink: '',
    priceFrom: '',
    priceTo: '',
    type: '',
    bhk: '',
    mode: '',
    description: '',
    contactNumber: '',
    gallery: [],
    videos: [],
    // Additional real estate fields
    yearBuilt: '',
    squareFootage: '',
    lotSize: '',
    amenities: [],
    propertyCondition: '',
    nearbyAmenities: [],
    schoolDistrict: '',
    hoa: '',
    propertyTax: '',
    parkingSpaces: '',
    floorNumber: '',
    totalFloors: '',
    furnishingStatus: '',
    availabilityDate: '',
    carpetArea: '',
    superbuiltArea: '',
    // PropertyDetails specific fields
    developer: '',
    possessionDate: '',
    projectArea: '',
    projectSize: '',
    launchDate: '',
    totalUnits: '',
    totalTowers: '',
    bank: '',
    possession: '',
    dimension: '',
    highlights: [],
    locationAdvantages: []
  });

  const [previewImages, setPreviewImages] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [previewVideos, setPreviewVideos] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  const [nearbyAmenityInput, setNearbyAmenityInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [locationAdvantageInput, setLocationAdvantageInput] = useState('');
  const [bhkConfigs, setBhkConfigs] = useState([]);
  const [currentBhk, setCurrentBhk] = useState('');
  const [currentBhkPrice, setCurrentBhkPrice] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    basics: true,
    specifications: false,
    amenities: false,
    financial: false,
    media: false,
    project: false,
    highlights: false
  });
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      const userData = JSON.parse(storedUser);
      // Brokers/builders list their own properties too; their submissions go
      // in as `pending` for admin review (see POST /api/properties).
      if (userData.role !== 'admin' && userData.role !== 'builder') {
        router.push('/');
        return;
      }
      setUser(userData);
    } else {
      router.push('/login');
    }

    setLoading(false);
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for phone number
    if (name === 'contactNumber') {
      // Only allow numbers and limit to 10 digits
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    setUploadingImages(true);
    setError('');

    // Create preview URLs
    const newPreviewImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isUrl: false
    }));

    setPreviewImages([...previewImages, ...newPreviewImages]);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('You must be logged in');
      }

      const uploadedUrls = [];

      // Upload each image to the server's upload folder
      for (const item of newPreviewImages) {
        const formData = new FormData();
        formData.append('file', item.file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to upload image');
        }

        uploadedUrls.push(data.url);
      }

      // Update form data with new image URLs
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...uploadedUrls]
      }));

    } catch (error) {
      setError(error.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    // Remove from preview
    const newPreviewImages = [...previewImages];
    newPreviewImages.splice(index, 1);
    setPreviewImages(newPreviewImages);

    // Remove from form data
    const newGallery = [...formData.gallery];
    newGallery.splice(index, 1);
    setFormData({ ...formData, gallery: newGallery });
  };

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      setError('Please enter a valid image URL');
      return;
    }

    // Add URL to preview images
    const newPreviewImage = {
      preview: imageUrl,
      isUrl: true
    };

    setPreviewImages([...previewImages, newPreviewImage]);

    // Add URL to form data gallery
    setFormData(prev => ({
      ...prev,
      gallery: [...prev.gallery, imageUrl]
    }));

    // Clear input
    setImageUrl('');
    setError('');
  };

  // Video handling functions
  const handleAddVideoUrl = () => {
    if (!videoUrl.trim()) {
      setError('Please enter a valid video URL');
      return;
    }

    if (!isValidVideoUrl(videoUrl)) {
      setError('Please enter a valid YouTube, Vimeo, Dailymotion, or direct video URL');
      return;
    }

    // Add URL to preview videos
    const newPreviewVideo = {
      url: videoUrl,
      thumbnail: getThumbnailUrl(videoUrl),
      platform: getPlatformName(videoUrl)
    };

    setPreviewVideos([...previewVideos, newPreviewVideo]);

    // Add URL to form data videos
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, videoUrl]
    }));

    // Clear input
    setVideoUrl('');
    setError('');
  };

  // Upload a video file to the server's upload folder and store its URL
  const handleVideoFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingVideos(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in');
      }

      for (const file of files) {
        const body = new FormData();
        body.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to upload video');
        }

        setPreviewVideos((prev) => [
          ...prev,
          { url: data.url, thumbnail: null, platform: 'Uploaded' },
        ]);
        setFormData((prev) => ({ ...prev, videos: [...prev.videos, data.url] }));
      }
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploadingVideos(false);
      e.target.value = '';
    }
  };

  const removeVideo = (index) => {
    // Remove from preview
    const newPreviewVideos = [...previewVideos];
    newPreviewVideos.splice(index, 1);
    setPreviewVideos(newPreviewVideos);

    // Remove from form data
    const newVideos = [...formData.videos];
    newVideos.splice(index, 1);
    setFormData({ ...formData, videos: newVideos });
  };

  // Amenity management functions
  const addAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const addNearbyAmenity = () => {
    if (nearbyAmenityInput.trim() && !formData.nearbyAmenities.includes(nearbyAmenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        nearbyAmenities: [...prev.nearbyAmenities, nearbyAmenityInput.trim()]
      }));
      setNearbyAmenityInput('');
    }
  };

  const removeNearbyAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      nearbyAmenities: prev.nearbyAmenities.filter(a => a !== amenity)
    }));
  };

  // Highlights management functions
  const addHighlight = () => {
    if (highlightInput.trim() && !formData.highlights.includes(highlightInput.trim())) {
      setFormData(prev => ({
        ...prev,
        highlights: [...prev.highlights, highlightInput.trim()]
      }));
      setHighlightInput('');
    }
  };

  const removeHighlight = (highlight) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter(h => h !== highlight)
    }));
  };

  // Location Advantages management functions
  const addLocationAdvantage = () => {
    if (locationAdvantageInput.trim() && !formData.locationAdvantages.includes(locationAdvantageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        locationAdvantages: [...prev.locationAdvantages, locationAdvantageInput.trim()]
      }));
      setLocationAdvantageInput('');
    }
  };

  const removeLocationAdvantage = (advantage) => {
    setFormData(prev => ({
      ...prev,
      locationAdvantages: prev.locationAdvantages.filter(a => a !== advantage)
    }));
  };

  // BHK Configuration management
  const addBhkConfig = () => {
    if (currentBhk && currentBhkPrice.trim()) {
      const newConfig = {
        bhk: currentBhk,
        price: currentBhkPrice.trim()
      };

      // Check if BHK already exists
      if (bhkConfigs.some(config => config.bhk === currentBhk)) {
        setError('This BHK type is already added');
        return;
      }

      setBhkConfigs([...bhkConfigs, newConfig]);
      setCurrentBhk('');
      setCurrentBhkPrice('');
      setError('');
    } else {
      setError('Please select BHK and enter price');
    }
  };

  const removeBhkConfig = (bhk) => {
    setBhkConfigs(bhkConfigs.filter(config => config.bhk !== bhk));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('You must be logged in');
      }

      // Combine price range into single price field for backend compatibility
      const submitData = { ...formData };

      // Add BHK configurations if available
      if (bhkConfigs.length > 0) {
        submitData.bhkConfigurations = bhkConfigs;
        // Set bhk field to comma-separated list for search/filter compatibility
        submitData.bhk = bhkConfigs.map(c => c.bhk).join(', ');
      }

      if (formData.priceFrom || formData.priceTo) {
        if (formData.priceFrom && formData.priceTo) {
          submitData.price = `${formData.priceFrom} - ${formData.priceTo}`;
        } else if (formData.priceFrom) {
          submitData.price = `Start from ${formData.priceFrom}`;
        } else {
          submitData.price = `Up to ${formData.priceTo}`;
        }
      }

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create property');
      }

      setSuccess('Property listed successfully!');

      // Reset form
      setFormData({
        title: '',
        location: '',
        mapLocationLink: '',
        priceFrom: '',
        priceTo: '',
        type: '',
        bhk: '',
        mode: '',
        description: '',
        contactNumber: '',
        gallery: [],
        videos: [],
        yearBuilt: '',
        squareFootage: '',
        lotSize: '',
        amenities: [],
        propertyCondition: '',
        nearbyAmenities: [],
        schoolDistrict: '',
        hoa: '',
        propertyTax: '',
        parkingSpaces: '',
        floorNumber: '',
        totalFloors: '',
        furnishingStatus: '',
        availabilityDate: '',
        carpetArea: '',
        superbuiltArea: '',
        developer: '',
        possessionDate: '',
        projectArea: '',
        projectSize: '',
        launchDate: '',
        totalUnits: '',
        totalTowers: '',
        bank: '',
        possession: '',
        dimension: '',
        highlights: [],
        locationAdvantages: []
      });
      setPreviewImages([]);
      setImageUrl('');
      setPreviewVideos([]);
      setVideoUrl('');
      setAmenityInput('');
      setNearbyAmenityInput('');
      setBhkConfigs([]);
      setCurrentBhk('');
      setCurrentBhkPrice('');

    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Add New Property</h1>
          <p className="text-xs text-slate-500 mt-1">
            All fields below are optional — fill in what you have, publish, and refine later.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm font-semibold flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-sm font-semibold flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basics */}
          <div className={sectionCardClass}>
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v12M13 7a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="Basics"
              expanded={expandedSections.basics}
              onToggle={() => toggleSection('basics')}
            />
            {expandedSections.basics && (
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-5 border-t border-slate-100 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className={labelClass}>Property Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Modern 2BHK Apartment"
                />
              </div>

              <div>
                <label htmlFor="location" className={labelClass}>Location</label>
                {/* A datalist gives the dropdown of known localities while
                    still allowing a custom one to be typed in. */}
                <input
                  type="text"
                  id="location"
                  name="location"
                  list="known-locations"
                  value={formData.location}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Pick a locality or type your own"
                  autoComplete="off"
                />
                <datalist id="known-locations">
                  {getAllLocations().map((loc) => (
                    <option key={loc} value={`${loc}, Bangalore`} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-slate-500">
                  Choose from the list or enter any other area.
                </p>
              </div>

              <div>
                <label htmlFor="mapLocationLink" className={labelClass}>
                  Map Location Link <span className="text-slate-400 font-normal normal-case">(optional — pins the map exactly)</span>
                </label>
                <input
                  type="url"
                  id="mapLocationLink"
                  name="mapLocationLink"
                  value={formData.mapLocationLink}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Paste a Google Maps share link"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Leave blank and the map falls back to geocoding the location text above.
                </p>
              </div>

              <div>
                <label className={labelClass}>Price Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    id="priceFrom"
                    name="priceFrom"
                    value={formData.priceFrom || ''}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Start from (e.g. 50 lakhs)"
                  />
                  <input
                    type="text"
                    id="priceTo"
                    name="priceTo"
                    value={formData.priceTo || ''}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Up to (e.g. 1 cr)"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="type" className={labelClass}>Property Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select type</option>
                  <option value="apartments">Apartments</option>
                  <option value="independent-house">Independent House</option>
                  <option value="villas">Villas</option>
                  <option value="gated-communities">Gated Communities</option>
                  <option value="plots">Plots</option>
                  <option value="villa-plot">Villa Plot</option>
                  <option value="farm-house">Farm House</option>
                  <option value="farm-land">Farm Land</option>
                  <option value="builders-floors">Builders Floors</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="cottage">Cottage</option>
                  <option value="duplex-house">Duplex House</option>
                  <option value="commercial-space">Commercial Space</option>
                  <option value="industrial-land">Industrial Land</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Dimensions</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    id="carpetArea"
                    name="carpetArea"
                    value={formData.carpetArea}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Carpet area (sq ft)"
                  />
                  <input
                    type="text"
                    id="superbuiltArea"
                    name="superbuiltArea"
                    value={formData.superbuiltArea}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Superbuilt area (sq ft)"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mode" className={labelClass}>Mode</label>
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select mode</option>
                  <option value="buy">Buy</option>
                  <option value="rent">Rent</option>
                  <option value="sell">Sell</option>
                </select>
              </div>

              {(formData.type === 'apartments' || formData.type === 'independent-house' || formData.type === 'villas' || formData.type === 'gated-communities' || formData.type === 'builders-floors' || formData.type === 'penthouse' || formData.type === 'cottage' || formData.type === 'duplex-house' || formData.type === 'villa-plot' || formData.type === 'farm-house' || formData.type === 'farm-land') && (
                <div className="md:col-span-2 pt-2">
                  <label className={labelClass}>BHK Configurations <span className="text-slate-400 font-normal normal-case">(add multiple BHK types with prices)</span></label>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">BHK type</label>
                        <select
                          value={currentBhk}
                          onChange={(e) => setCurrentBhk(e.target.value)}
                          className={`${inputClass} text-sm py-2`}
                        >
                          <option value="">Select BHK</option>
                          <option value="1bhk">1 BHK</option>
                          <option value="2bhk">2 BHK</option>
                          <option value="2.5bhk">2.5 BHK</option>
                          <option value="3bhk">3 BHK</option>
                          <option value="3.5bhk">3.5 BHK</option>
                          <option value="4bhk">4 BHK</option>
                          <option value="4.5bhk">4.5 BHK</option>
                          <option value="5bhk">5 BHK</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Price</label>
                        <input
                          type="text"
                          value={currentBhkPrice}
                          onChange={(e) => setCurrentBhkPrice(e.target.value)}
                          placeholder="e.g. 50 lakhs - 60 lakhs"
                          className={`${inputClass} text-sm py-2`}
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addBhkConfig}
                          className="w-full px-4 py-2.5 bg-primary text-btn-text rounded-xl hover:bg-primary-dark transition-colors text-sm font-bold cursor-pointer"
                        >
                          Add BHK
                        </button>
                      </div>
                    </div>
                  </div>

                  {bhkConfigs.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {bhkConfigs.map((config, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900">{config.bhk.toUpperCase()}</p>
                            <p className="text-xs text-slate-500">{config.price}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBhkConfig(config.bhk)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={inputClass}
                placeholder="Describe the property in detail..."
              />
            </div>

            <div>
              <label htmlFor="contactNumber" className={labelClass}>Contact Number</label>
              <input
                type="text"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g. 9876543210"
              />
            </div>
            </div>
            )}
          </div>

          {/* Specifications */}
          <div className={sectionCardClass}>
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }
              title="Specifications"
              expanded={expandedSections.specifications}
              onToggle={() => toggleSection('specifications')}
            />
            {expandedSections.specifications && (
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-5 border-t border-slate-100 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="yearBuilt" className={labelClass}>Year Built</label>
                <input
                  type="number"
                  id="yearBuilt"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className={inputClass}
                  placeholder="e.g. 2020"
                />
              </div>

              <div>
                <label htmlFor="squareFootage" className={labelClass}>Square Footage</label>
                <input
                  type="number"
                  id="squareFootage"
                  name="squareFootage"
                  value={formData.squareFootage}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 1200"
                />
              </div>

              <div>
                <label htmlFor="lotSize" className={labelClass}>Lot Size</label>
                <input
                  type="text"
                  id="lotSize"
                  name="lotSize"
                  value={formData.lotSize}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 0.25 acres"
                />
              </div>

              <div>
                <label htmlFor="propertyCondition" className={labelClass}>Property Condition</label>
                <select
                  id="propertyCondition"
                  name="propertyCondition"
                  value={formData.propertyCondition}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select condition</option>
                  <option value="new">New</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="needs-renovation">Needs Renovation</option>
                </select>
              </div>

              <div>
                <label htmlFor="parkingSpaces" className={labelClass}>Parking Spaces</label>
                <input
                  type="number"
                  id="parkingSpaces"
                  name="parkingSpaces"
                  value={formData.parkingSpaces}
                  onChange={handleChange}
                  min="0"
                  className={inputClass}
                  placeholder="e.g. 2"
                />
              </div>

              <div>
                <label htmlFor="furnishingStatus" className={labelClass}>Furnishing Status</label>
                <select
                  id="furnishingStatus"
                  name="furnishingStatus"
                  value={formData.furnishingStatus}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select status</option>
                  <option value="furnished">Furnished</option>
                  <option value="semi-furnished">Semi-furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>

            {(formData.type === 'apartments' || formData.type === 'commercial-space' || formData.type === 'builders-floors' || formData.type === 'penthouse') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="floorNumber" className={labelClass}>Floor Number</label>
                  <input
                    type="number"
                    id="floorNumber"
                    name="floorNumber"
                    value={formData.floorNumber}
                    onChange={handleChange}
                    min="0"
                    className={inputClass}
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label htmlFor="totalFloors" className={labelClass}>Total Floors in Building</label>
                  <input
                    type="number"
                    id="totalFloors"
                    name="totalFloors"
                    value={formData.totalFloors}
                    onChange={handleChange}
                    min="1"
                    className={inputClass}
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="availabilityDate" className={labelClass}>Available From</label>
              <input
                type="date"
                id="availabilityDate"
                name="availabilityDate"
                value={formData.availabilityDate}
                onChange={handleChange}
                className={`${inputClass} max-w-xs`}
              />
            </div>
            </div>
            )}
          </div>

          {/* Amenities */}
          <div className={sectionCardClass}>
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
              title="Amenities"
              expanded={expandedSections.amenities}
              onToggle={() => toggleSection('amenities')}
            />
            {expandedSections.amenities && (
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-5 border-t border-slate-100 pt-5">
            <div>
              <label className={labelClass}>Property Amenities</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Swimming Pool, Gym, Security"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="px-4 py-2 bg-primary text-btn-text rounded-xl hover:bg-primary-dark transition-colors text-sm font-bold cursor-pointer whitespace-nowrap"
                >
                  Add
                </button>
              </div>
              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(amenity)}
                        className="ml-2 hover:text-secondary cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Nearby Amenities</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={nearbyAmenityInput}
                  onChange={(e) => setNearbyAmenityInput(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Metro Station, Hospital, School"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNearbyAmenity())}
                />
                <button
                  type="button"
                  onClick={addNearbyAmenity}
                  className="px-4 py-2 bg-primary text-btn-text rounded-xl hover:bg-primary-dark transition-colors text-sm font-bold cursor-pointer whitespace-nowrap"
                >
                  Add
                </button>
              </div>
              {formData.nearbyAmenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.nearbyAmenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeNearbyAmenity(amenity)}
                        className="ml-2 hover:text-secondary cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            </div>
            )}
          </div>

          {/* Financial & Location Information */}
          <div className={sectionCardClass}>
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Financial & Location Information"
              expanded={expandedSections.financial}
              onToggle={() => toggleSection('financial')}
            />
            {expandedSections.financial && (
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-5 border-t border-slate-100 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="schoolDistrict" className={labelClass}>School District</label>
                <input
                  type="text"
                  id="schoolDistrict"
                  name="schoolDistrict"
                  value={formData.schoolDistrict}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. District 5, Bangalore"
                />
              </div>

              <div>
                <label htmlFor="hoa" className={labelClass}>HOA/Maintenance Fee</label>
                <input
                  type="text"
                  id="hoa"
                  name="hoa"
                  value={formData.hoa}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. ₹5,000/month"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="propertyTax" className={labelClass}>Property Tax (Annual)</label>
                <input
                  type="text"
                  id="propertyTax"
                  name="propertyTax"
                  value={formData.propertyTax}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. ₹15,000/year"
                />
              </div>
            </div>
            </div>
            )}
          </div>

          {/* Media */}
          <div className={sectionCardClass}>
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 8a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2v-8a2 2 0 00-2-2M4 8a2 2 0 012-2h12a2 2 0 012 2" />
                </svg>
              }
              title="Media"
              expanded={expandedSections.media}
              onToggle={() => toggleSection('media')}
            />
            {expandedSections.media && (
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-5 border-t border-slate-100 pt-5">
            <div>
              <label className={labelClass}>Property Images</label>
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-10 w-10 text-slate-300" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-slate-500 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer font-bold text-primary hover:text-primary-dark">
                      <span>Upload images</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept={ACCEPT_IMAGES}
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>

              {uploadingImages && (
                <div className="mt-3 text-sm text-slate-500 flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading images...
                </div>
              )}

              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Or add image URLs</p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL here"
                    className={`${inputClass} bg-surface`}
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 bg-primary text-btn-text rounded-xl hover:bg-primary-dark transition-colors text-sm font-bold cursor-pointer whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </div>

              {previewImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {previewImages.map((image, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200">
                      <img
                        src={image.preview}
                        alt={`Preview ${index}`}
                        className="h-24 w-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                        }}
                      />
                      <div className="absolute top-1.5 left-1.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          image.isUrl ? 'bg-surface/90 text-slate-700' : 'bg-primary text-btn-text'
                        }`}>
                          {image.isUrl ? 'URL' : 'File'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Property Videos</label>
              <p className="text-xs text-slate-400 mb-2">Upload a video file, or paste a YouTube, Vimeo, Dailymotion or direct video URL</p>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Enter video URL"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleAddVideoUrl}
                  disabled={!videoUrl.trim()}
                  className="px-4 py-2 bg-primary text-btn-text rounded-xl hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-bold cursor-pointer whitespace-nowrap"
                >
                  Add Video
                </button>
              </div>

              <label className={`mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary transition-colors ${uploadingVideos ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>
                {uploadingVideos ? 'Uploading video…' : 'Upload video file'}
                <input
                  type="file"
                  onChange={handleVideoFileUpload}
                  accept={ACCEPT_VIDEOS}
                  multiple
                  className="hidden"
                  disabled={uploadingVideos}
                />
              </label>
              <p className="text-xs text-slate-400 mt-1">MP4, WebM, MOV or M4V — up to 50MB each</p>

              {previewVideos.length > 0 && (
                <div className="mt-4 space-y-2">
                  {previewVideos.map((video, index) => (
                    <div key={index} className="flex items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-shrink-0 mr-3">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={`Video ${index + 1} thumbnail`}
                            className="h-12 w-20 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="h-12 w-20 bg-primary/10 rounded-lg flex items-center justify-center"
                          style={{display: video.thumbnail ? 'none' : 'flex'}}
                        >
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                            {video.platform}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">Video {index + 1}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 truncate">{video.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="flex-shrink-0 ml-3 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
            )}
          </div>

          {/* Project Information */}
          <div className={sectionCardClass}>
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v12M13 7a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="Project Information"
              expanded={expandedSections.project}
              onToggle={() => toggleSection('project')}
            />
            {expandedSections.project && (
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-5 border-t border-slate-100 pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="developer" className={labelClass}>Developer/Builder</label>
                <input
                  type="text"
                  id="developer"
                  name="developer"
                  value={formData.developer}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Prestige Group, Brigade Group"
                />
              </div>

              <div>
                <label htmlFor="possessionDate" className={labelClass}>Possession Date</label>
                <input
                  type="text"
                  id="possessionDate"
                  name="possessionDate"
                  value={formData.possessionDate}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Dec 2026, Ready to Move"
                />
              </div>

              <div>
                <label htmlFor="projectArea" className={labelClass}>Project Area</label>
                <input
                  type="text"
                  id="projectArea"
                  name="projectArea"
                  value={formData.projectArea}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 4 Acre, 2.5 Acre"
                />
              </div>

              <div>
                <label htmlFor="launchDate" className={labelClass}>Launch Date</label>
                <input
                  type="text"
                  id="launchDate"
                  name="launchDate"
                  value={formData.launchDate}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Jul 2023, Jan 2024"
                />
              </div>

              <div>
                <label htmlFor="totalUnits" className={labelClass}>Total Units</label>
                <input
                  type="number"
                  id="totalUnits"
                  name="totalUnits"
                  value={formData.totalUnits}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 410, 250"
                />
              </div>

              <div>
                <label htmlFor="totalTowers" className={labelClass}>Total Towers/Buildings</label>
                <input
                  type="number"
                  id="totalTowers"
                  name="totalTowers"
                  value={formData.totalTowers}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 2, 5"
                />
              </div>

              <div>
                <label htmlFor="projectSize" className={labelClass}>Project Size</label>
                <input
                  type="text"
                  id="projectSize"
                  name="projectSize"
                  value={formData.projectSize}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 5 Acres, 10,000 sq ft"
                />
              </div>

              <div>
                <label htmlFor="bank" className={labelClass}>Bank Approved</label>
                <input
                  type="text"
                  id="bank"
                  name="bank"
                  value={formData.bank}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. SBI, HDFC, ICICI"
                />
              </div>

              <div>
                <label htmlFor="possession" className={labelClass}>Possession Status</label>
                <input
                  type="text"
                  id="possession"
                  name="possession"
                  value={formData.possession}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Ready to Move, Under Construction"
                />
              </div>

              <div>
                <label htmlFor="dimension" className={labelClass}>Dimension</label>
                <input
                  type="text"
                  id="dimension"
                  name="dimension"
                  value={formData.dimension}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. 30x40, 1200 sq ft"
                />
              </div>
            </div>
            </div>
            )}
          </div>

          {/* Highlights & Location Advantages */}
          <div className={sectionCardClass}>
            <SectionHeader
              icon={
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
              title="Highlights & Location Advantages"
              expanded={expandedSections.highlights}
              onToggle={() => toggleSection('highlights')}
            />
            {expandedSections.highlights && (
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-5 border-t border-slate-100 pt-5">
            <div>
              <label className={labelClass}>Key Features &amp; Highlights</label>
              <p className="text-xs text-slate-400 mb-2">Standout features that make this property special</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={highlightInput}
                  onChange={(e) => setHighlightInput(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Vastu Compliant, Premium Amenities"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                />
                <button
                  type="button"
                  onClick={addHighlight}
                  className="px-4 py-2 bg-primary text-btn-text rounded-xl hover:bg-primary-dark transition-colors text-sm font-bold cursor-pointer whitespace-nowrap"
                >
                  Add
                </button>
              </div>
              {formData.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.highlights.map((highlight, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary"
                    >
                      {highlight}
                      <button
                        type="button"
                        onClick={() => removeHighlight(highlight)}
                        className="ml-2 hover:text-secondary cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Location Benefits &amp; Connectivity</label>
              <p className="text-xs text-slate-400 mb-2">Nearby facilities with travel time</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={locationAdvantageInput}
                  onChange={(e) => setLocationAdvantageInput(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Metro Station - 5 mins, IT Parks - 15 mins"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocationAdvantage())}
                />
                <button
                  type="button"
                  onClick={addLocationAdvantage}
                  className="px-4 py-2 bg-primary text-btn-text rounded-xl hover:bg-primary-dark transition-colors text-sm font-bold cursor-pointer whitespace-nowrap"
                >
                  Add
                </button>
              </div>
              {formData.locationAdvantages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.locationAdvantages.map((advantage, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary"
                    >
                      {advantage}
                      <button
                        type="button"
                        onClick={() => removeLocationAdvantage(advantage)}
                        className="ml-2 hover:text-secondary cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || uploadingImages}
            className="w-full flex justify-center items-center py-3.5 px-4 rounded-2xl text-sm font-bold uppercase tracking-wider text-btn-text bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : 'List Property'}
          </button>
        </form>
      </div>
    </div>
  );
}
