'use client';

import { useState, useEffect } from 'react';
import { isValidVideoUrl, getThumbnailUrl, getPlatformName } from '@/utils/videoUtils';
import { ACCEPT_IMAGES, ACCEPT_VIDEOS } from '@/lib/uploadTypes';

export default function EditPropertyModal({ property, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    priceFrom: '',
    priceTo: '',
    price: '',
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
    nearbyLocations: [],
    schoolDistrict: '',
    hoa: '',
    propertyTax: '',
    parkingSpaces: '',
    floorNumber: '',
    totalFloors: '',
    furnishingStatus: '',
    availabilityDate: '',
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
    carpetArea: '',
    superbuiltArea: '',
    highlights: [],
    locationAdvantages: []
  });
  
  const [previewImages, setPreviewImages] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [previewVideos, setPreviewVideos] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  const [nearbyAmenityInput, setNearbyAmenityInput] = useState('');
  const [nearbyLocationInput, setNearbyLocationInput] = useState('');
  const [highlightInput, setHighlightInput] = useState('');
  const [locationAdvantageInput, setLocationAdvantageInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [bhkConfigs, setBhkConfigs] = useState([]);
  const [currentBhk, setCurrentBhk] = useState('');
  const [currentBhkPrice, setCurrentBhkPrice] = useState('');

  useEffect(() => {
    if (property) {
      // Parse price range if it exists
      let priceFrom = '';
      let priceTo = '';
      const price = property.price || '';

      if (price.includes(' - ')) {
        const [from, to] = price.split(' - ');
        priceFrom = from;
        priceTo = to;
      } else if (price.startsWith('Start from ')) {
        priceFrom = price.replace('Start from ', '');
      } else if (price.startsWith('Up to ')) {
        priceTo = price.replace('Up to ', '');
      }

      setFormData({
        title: property.title || '',
        location: property.location || '',
        priceFrom: priceFrom,
        priceTo: priceTo,
        price: property.price || '',
        type: property.type || '',
        bhk: property.bhk || '',
        mode: property.mode || '',
        description: property.description || '',
        contactNumber: property.contactNumber || '',
        gallery: property.gallery || [],
        videos: property.videos || [],
        // Additional real estate fields
        yearBuilt: property.yearBuilt || '',
        squareFootage: property.squareFootage || '',
        lotSize: property.lotSize || '',
        amenities: property.amenities || [],
        propertyCondition: property.propertyCondition || '',
        nearbyAmenities: property.nearbyAmenities || [],
        nearbyLocations: property.nearbyLocations || [],
        schoolDistrict: property.schoolDistrict || '',
        hoa: property.hoa || '',
        propertyTax: property.propertyTax || '',
        parkingSpaces: property.parkingSpaces || '',
        floorNumber: property.floorNumber || '',
        totalFloors: property.totalFloors || '',
        furnishingStatus: property.furnishingStatus || '',
        availabilityDate: property.availabilityDate ? property.availabilityDate.split('T')[0] : '',
        // PropertyDetails specific fields
        developer: property.developer || '',
        possessionDate: property.possessionDate || '',
        projectArea: property.projectArea || '',
        projectSize: property.projectSize || '',
        launchDate: property.launchDate || '',
        totalUnits: property.totalUnits || '',
        totalTowers: property.totalTowers || '',
        bank: property.bank || '',
        possession: property.possession || '',
        dimension: property.dimension || '',
        carpetArea: property.carpetArea || '',
        superbuiltArea: property.superbuiltArea || '',
        highlights: property.highlights || [],
        locationAdvantages: property.locationAdvantages || []
      });

      // Set preview images from existing gallery
      const existingImages = (property.gallery || []).map(url => ({
        preview: url,
        isUrl: true
      }));
      setPreviewImages(existingImages);

      // Set preview videos from existing videos
      const existingVideos = (property.videos || []).map(url => ({
        url: url,
        thumbnail: getThumbnailUrl(url),
        platform: getPlatformName(url)
      }));
      setPreviewVideos(existingVideos);

      // Parse existing BHK configurations
      if (property.bhkConfigurations && property.bhkConfigurations.length > 0) {
        setBhkConfigs(property.bhkConfigurations);
      }
    }
  }, [property]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'contactNumber') {
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

      for (const item of newPreviewImages) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', item.file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadFormData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to upload image');
        }

        uploadedUrls.push(data.url);
      }

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
    const newPreviewImages = [...previewImages];
    newPreviewImages.splice(index, 1);
    setPreviewImages(newPreviewImages);

    const newGallery = [...formData.gallery];
    newGallery.splice(index, 1);
    setFormData({ ...formData, gallery: newGallery });
  };

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      setError('Please enter a valid image URL');
      return;
    }

    const newPreviewImage = {
      preview: imageUrl,
      isUrl: true
    };

    setPreviewImages([...previewImages, newPreviewImage]);

    setFormData(prev => ({
      ...prev,
      gallery: [...prev.gallery, imageUrl]
    }));

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

    const newPreviewVideo = {
      url: videoUrl,
      thumbnail: getThumbnailUrl(videoUrl),
      platform: getPlatformName(videoUrl)
    };

    setPreviewVideos([...previewVideos, newPreviewVideo]);

    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, videoUrl]
    }));

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
    const newPreviewVideos = [...previewVideos];
    newPreviewVideos.splice(index, 1);
    setPreviewVideos(newPreviewVideos);

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

  const addNearbyLocation = () => {
    if (nearbyLocationInput.trim() && !formData.nearbyLocations.includes(nearbyLocationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        nearbyLocations: [...prev.nearbyLocations, nearbyLocationInput.trim()]
      }));
      setNearbyLocationInput('');
    }
  };

  const removeNearbyLocation = (location) => {
    setFormData(prev => ({
      ...prev,
      nearbyLocations: prev.nearbyLocations.filter(l => l !== location)
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

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('You must be logged in');
      }

      if (formData.gallery.length === 0) {
        throw new Error('Please provide at least one image');
      }

      // Clean form data - remove empty strings for enum fields and other optional fields
      const cleanFormData = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        // Skip empty strings, null, and undefined values, but keep arrays even if empty
        if (value !== '' && value !== null && value !== undefined) {
          cleanFormData[key] = value;
        } else if (Array.isArray(value)) {
          cleanFormData[key] = value;
        }
      });

      // Always sync BHK data from bhkConfigs state (overrides any stale formData.bhk)
      cleanFormData.bhkConfigurations = bhkConfigs;
      if (bhkConfigs.length > 0) {
        cleanFormData.bhk = bhkConfigs.map(c => c.bhk).join(', ');
      } else {
        cleanFormData.bhk = null; // explicit null tells backend to unset this field
      }

      // Combine price range into single price field for backend compatibility
      if (formData.priceFrom || formData.priceTo) {
        if (formData.priceFrom && formData.priceTo) {
          cleanFormData.price = `${formData.priceFrom} - ${formData.priceTo}`;
        } else if (formData.priceFrom) {
          cleanFormData.price = `Start from ${formData.priceFrom}`;
        } else if (formData.priceTo) {
          cleanFormData.price = `Up to ${formData.priceTo}`;
        }
      }

      const response = await fetch(`/api/properties/${property._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanFormData)
      });

      console.log('=== DEBUG: Response from API ===');
      console.log('Response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update property');
      }

      onUpdate(data.data);
      onClose();

    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!property) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-surface rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-blue-700 text-white py-4 px-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Edit Property</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6 text-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  placeholder="e.g. Modern 2BHK Apartment"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location*
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  placeholder="e.g. Koramangala, Bangalore"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range*
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    id="priceFrom"
                    name="priceFrom"
                    value={formData.priceFrom || ''}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="Start from (e.g. 50 lakhs)"
                  />
                  <input
                    type="text"
                    id="priceTo"
                    name="priceTo"
                    value={formData.priceTo || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    placeholder="Up to (e.g. 1 cr)"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Property Type*
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value="">Select Type</option>
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

              {(formData.type === 'apartments' || formData.type === 'independent-house' || formData.type === 'villas' || formData.type === 'gated-communities' || formData.type === 'builders-floors' || formData.type === 'penthouse' || formData.type === 'cottage' || formData.type === 'duplex-house' || formData.type === 'villa-plot' || formData.type === 'farm-house' || formData.type === 'farm-land') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    BHK Configurations{(formData.type === 'villa-plot' || formData.type === 'farm-house' || formData.type === 'farm-land') ? <span className="text-gray-500 font-normal"> (Optional)</span> : '*'} <span className="text-gray-400">(Add multiple BHK types with prices)</span>
                  </label>

                  {/* Add BHK Form */}
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">BHK Type</label>
                        <select
                          value={currentBhk}
                          onChange={(e) => setCurrentBhk(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
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
                        <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                        <input
                          type="text"
                          value={currentBhkPrice}
                          onChange={(e) => setCurrentBhkPrice(e.target.value)}
                          placeholder="e.g. 50 lakhs - 60 lakhs"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addBhkConfig}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Add BHK
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Display Added BHK Configurations */}
                  {bhkConfigs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-medium">Added Configurations:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {bhkConfigs.map((config, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
                          >
                            <div>
                              <p className="text-sm font-semibold text-green-900">{config.bhk.toUpperCase()}</p>
                              <p className="text-xs text-green-700">{config.price}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeBhkConfig(config.bhk)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      id="carpetArea"
                      name="carpetArea"
                      value={formData.carpetArea || ''}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="Carpet Area (sq ft)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      id="superbuiltArea"
                      name="superbuiltArea"
                      value={formData.superbuiltArea || ''}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="Superbuilt Area (sq ft)"
                    />
                  </div>
                </div>
              </div>


              <div>
                <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">
                  Mode*
                </label>
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value="">Select Mode</option>
                  <option value="buy">Buy</option>
                  <option value="rent">Rent</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                placeholder="Describe your property in detail..."
              />
            </div>

            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number*
              </label>
              <input
                type="text"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                placeholder="e.g. 9876543210"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Images*
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-surface">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload-edit" className="relative cursor-pointer bg-surface rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload new images</span>
                      <input
                        id="file-upload-edit"
                        name="file-upload-edit"
                        type="file"
                        className="sr-only"
                        multiple
                        accept={ACCEPT_IMAGES}
                        onChange={handleImageUpload}
                        disabled={uploadingImages}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>

              {uploadingImages && (
                <div className="mt-2 text-sm text-gray-500 flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading images...
                </div>
              )}

              <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Or Add Image URL</h3>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste image URL here"
                    className="flex-1 p-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {previewImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {previewImages.map((image, index) => (
                    <div key={index} className="relative group rounded-md overflow-hidden shadow-sm">
                      <img
                        src={image.preview}
                        alt={`Preview ${index}`}
                        className="h-24 w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-xs text-gray-500" style={{ display: 'none' }}>
                        Image Not Found
                      </div>
                      <div className="absolute top-1 left-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${image.isUrl ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                          {image.isUrl ? 'URL' : 'File'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
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

            {/* Video Gallery Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Videos <span className="text-gray-400">(Optional)</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">Upload a video file, or add a YouTube, Vimeo, Dailymotion or direct video URL</p>

              <label className={`mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-gray-300 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-colors ${uploadingVideos ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>
                {uploadingVideos ? 'Uploading video…' : 'Upload video file (MP4, WebM, MOV — up to 50MB)'}
                <input
                  type="file"
                  onChange={handleVideoFileUpload}
                  accept={ACCEPT_VIDEOS}
                  multiple
                  className="hidden"
                  disabled={uploadingVideos}
                />
              </label>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddVideoUrl}
                  disabled={!videoUrl.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Add Video
                </button>
              </div>

              {previewVideos.length > 0 && (
                <div className="mt-4 space-y-3">
                  {previewVideos.map((video, index) => (
                    <div key={index} className="flex items-center p-3 bg-surface rounded-lg border">
                      <div className="flex-shrink-0 mr-3">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={`Video ${index + 1} thumbnail`}
                            className="h-12 w-20 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="h-12 w-20 bg-purple-100 rounded flex items-center justify-center"
                          style={{ display: video.thumbnail ? 'none' : 'flex' }}
                        >
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {video.platform}
                          </span>
                          <span className="text-sm font-medium text-gray-900">Video {index + 1}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{video.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="flex-shrink-0 ml-3 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Property Specifications Section */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v12M13 7a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Property Specifications
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Year Built */}
                <div>
                  <label htmlFor="edit-yearBuilt" className="block text-sm font-medium text-gray-700 mb-1">
                    Year Built
                  </label>
                  <input
                    type="number"
                    id="edit-yearBuilt"
                    name="yearBuilt"
                    value={formData.yearBuilt}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 2020"
                  />
                </div>

                {/* Square Footage */}
                <div>
                  <label htmlFor="edit-squareFootage" className="block text-sm font-medium text-gray-700 mb-1">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    id="edit-squareFootage"
                    name="squareFootage"
                    value={formData.squareFootage}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 1200"
                  />
                </div>

                {/* Lot Size */}
                <div>
                  <label htmlFor="edit-lotSize" className="block text-sm font-medium text-gray-700 mb-1">
                    Lot Size
                  </label>
                  <input
                    type="text"
                    id="edit-lotSize"
                    name="lotSize"
                    value={formData.lotSize}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 0.25 acres or 5000 sq ft"
                  />
                </div>

                {/* Property Condition */}
                <div>
                  <label htmlFor="edit-propertyCondition" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Condition
                  </label>
                  <select
                    id="edit-propertyCondition"
                    name="propertyCondition"
                    value={formData.propertyCondition}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select Condition</option>
                    <option value="new">New</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="needs-renovation">Needs Renovation</option>
                  </select>
                </div>

                {/* Parking Spaces */}
                <div>
                  <label htmlFor="edit-parkingSpaces" className="block text-sm font-medium text-gray-700 mb-1">
                    Parking Spaces
                  </label>
                  <input
                    type="number"
                    id="edit-parkingSpaces"
                    name="parkingSpaces"
                    value={formData.parkingSpaces}
                    onChange={handleChange}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 2"
                  />
                </div>

                {/* Furnishing Status */}
                <div>
                  <label htmlFor="edit-furnishingStatus" className="block text-sm font-medium text-gray-700 mb-1">
                    Furnishing Status
                  </label>
                  <select
                    id="edit-furnishingStatus"
                    name="furnishingStatus"
                    value={formData.furnishingStatus}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="furnished">Furnished</option>
                    <option value="semi-furnished">Semi-furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </div>
              </div>

              {/* Floor Information - Only for apartments, commercial spaces etc */}
              {(formData.type === 'apartments' || formData.type === 'commercial-space' || formData.type === 'builders-floors' || formData.type === 'penthouse') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="edit-floorNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Floor Number
                    </label>
                    <input
                      type="number"
                      id="edit-floorNumber"
                      name="floorNumber"
                      value={formData.floorNumber}
                      onChange={handleChange}
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-totalFloors" className="block text-sm font-medium text-gray-700 mb-1">
                      Total Floors in Building
                    </label>
                    <input
                      type="number"
                      id="edit-totalFloors"
                      name="totalFloors"
                      value={formData.totalFloors}
                      onChange={handleChange}
                      min="1"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="e.g. 10"
                    />
                  </div>
                </div>
              )}

              {/* Availability Date */}
              <div className="mt-4">
                <label htmlFor="edit-availabilityDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Available From
                </label>
                <input
                  type="date"
                  id="edit-availabilityDate"
                  name="availabilityDate"
                  value={formData.availabilityDate}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Property Amenities
              </h3>

              {/* Property Amenities */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Amenities
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Swimming Pool, Gym, Security"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
                {formData.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(amenity)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Nearby Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nearby Amenities
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={nearbyAmenityInput}
                    onChange={(e) => setNearbyAmenityInput(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Metro Station, Hospital, School"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNearbyAmenity())}
                  />
                  <button
                    type="button"
                    onClick={addNearbyAmenity}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
                {formData.nearbyAmenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.nearbyAmenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeNearbyAmenity(amenity)}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Nearby Locations Section */}
            <div className="bg-purple-50 p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                CRM Nearby Locations
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nearby Locations <span className="text-gray-400">(for CRM matching)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Add nearby locations to help sales team find alternative properties</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={nearbyLocationInput}
                    onChange={(e) => setNearbyLocationInput(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. BTM Layout, HSR Layout, Electronic City"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNearbyLocation())}
                  />
                  <button
                    type="button"
                    onClick={addNearbyLocation}
                    className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
                {formData.nearbyLocations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.nearbyLocations.map((location, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                      >
                        {location}
                        <button
                          type="button"
                          onClick={() => removeNearbyLocation(location)}
                          className="ml-1 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Financial & Location Details */}
            <div className="bg-green-50 p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Financial & Location Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* School District */}
                <div>
                  <label htmlFor="edit-schoolDistrict" className="block text-sm font-medium text-gray-700 mb-1">
                    School District
                  </label>
                  <input
                    type="text"
                    id="edit-schoolDistrict"
                    name="schoolDistrict"
                    value={formData.schoolDistrict}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. District 5, Bangalore"
                  />
                </div>

                {/* HOA */}
                <div>
                  <label htmlFor="edit-hoa" className="block text-sm font-medium text-gray-700 mb-1">
                    HOA/Maintenance Fee
                  </label>
                  <input
                    type="text"
                    id="edit-hoa"
                    name="hoa"
                    value={formData.hoa}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. ₹5,000/month"
                  />
                </div>

                {/* Property Tax */}
                <div className="md:col-span-2">
                  <label htmlFor="edit-propertyTax" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Tax (Annual)
                  </label>
                  <input
                    type="text"
                    id="edit-propertyTax"
                    name="propertyTax"
                    value={formData.propertyTax}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. ₹15,000/year"
                  />
                </div>
              </div>
            </div>

            {/* Project Details Section */}
            <div className="bg-orange-50 p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a2 2 0 012-2h2a2 2 0 012 2v12M13 7a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Project Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Developer */}
                <div>
                  <label htmlFor="edit-developer" className="block text-sm font-medium text-gray-700 mb-1">
                    Developer/Builder
                  </label>
                  <input
                    type="text"
                    id="edit-developer"
                    name="developer"
                    value={formData.developer}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Prestige Group, Brigade Group"
                  />
                </div>

                {/* Possession Date */}
                <div>
                  <label htmlFor="edit-possessionDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Possession Date
                  </label>
                  <input
                    type="text"
                    id="edit-possessionDate"
                    name="possessionDate"
                    value={formData.possessionDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Dec 2026, Ready to Move"
                  />
                </div>

                {/* Project Area */}
                <div>
                  <label htmlFor="edit-projectArea" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Area
                  </label>
                  <input
                    type="text"
                    id="edit-projectArea"
                    name="projectArea"
                    value={formData.projectArea}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 4 Acre, 2.5 Acre"
                  />
                </div>

                {/* Launch Date */}
                <div>
                  <label htmlFor="edit-launchDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Launch Date
                  </label>
                  <input
                    type="text"
                    id="edit-launchDate"
                    name="launchDate"
                    value={formData.launchDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Jul 2023, Jan 2024"
                  />
                </div>

                {/* Total Units */}
                <div>
                  <label htmlFor="edit-totalUnits" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Units
                  </label>
                  <input
                    type="number"
                    id="edit-totalUnits"
                    name="totalUnits"
                    value={formData.totalUnits}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 410, 250"
                  />
                </div>

                {/* Total Towers */}
                <div>
                  <label htmlFor="edit-totalTowers" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Towers/Buildings
                  </label>
                  <input
                    type="number"
                    id="edit-totalTowers"
                    name="totalTowers"
                    value={formData.totalTowers}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 2, 5"
                  />
                </div>

                {/* Project Size */}
                <div>
                  <label htmlFor="edit-projectSize" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Size
                  </label>
                  <input
                    type="text"
                    id="edit-projectSize"
                    name="projectSize"
                    value={formData.projectSize}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 5 Acres, 10,000 sq ft"
                  />
                </div>

                {/* Bank */}
                <div>
                  <label htmlFor="edit-bank" className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Approved
                  </label>
                  <input
                    type="text"
                    id="edit-bank"
                    name="bank"
                    value={formData.bank}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. SBI, HDFC, ICICI"
                  />
                </div>
              </div>

              {/* Additional Fields Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Possession */}
                <div>
                  <label htmlFor="edit-possession" className="block text-sm font-medium text-gray-700 mb-1">
                    Possession Status
                  </label>
                  <input
                    type="text"
                    id="edit-possession"
                    name="possession"
                    value={formData.possession}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Ready to Move, Under Construction"
                  />
                </div>

                {/* Dimension */}
                <div>
                  <label htmlFor="edit-dimension" className="block text-sm font-medium text-gray-700 mb-1">
                    Dimension
                  </label>
                  <input
                    type="text"
                    id="edit-dimension"
                    name="dimension"
                    value={formData.dimension}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 30x40, 1200 sq ft"
                  />
                </div>
              </div>
            </div>

            {/* Property Highlights Section */}
            <div className="bg-yellow-50 p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Property Highlights
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Features & Highlights
                </label>
                <p className="text-xs text-gray-500 mb-2">Add standout features that make this property special</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Vastu Compliant, Premium Amenities, Great Ventilation"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
                {formData.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.highlights.map((highlight, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800"
                      >
                        {highlight}
                        <button
                          type="button"
                          onClick={() => removeHighlight(highlight)}
                          className="ml-1 text-yellow-600 hover:text-yellow-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location Advantages Section */}
            <div className="bg-teal-50 p-4 rounded-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location Advantages
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Benefits & Connectivity
                </label>
                <p className="text-xs text-gray-500 mb-2">Add location advantages like nearby facilities with travel time</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={locationAdvantageInput}
                    onChange={(e) => setLocationAdvantageInput(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Metro Station - 5 mins, IT Parks - 15 mins, Hospital - 10 mins"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocationAdvantage())}
                  />
                  <button
                    type="button"
                    onClick={addLocationAdvantage}
                    className="px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
                {formData.locationAdvantages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.locationAdvantages.map((advantage, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-800"
                      >
                        {advantage}
                        <button
                          type="button"
                          onClick={() => removeLocationAdvantage(advantage)}
                          className="ml-1 text-teal-600 hover:text-teal-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImages}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}