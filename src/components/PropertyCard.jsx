/* eslint-disable @next/next/no-img-element */
"use client";

import Link from 'next/link';
import { formatPrice } from '@/utils/formatPrice';
import { generatePropertyUrl } from '@/utils/slugify';
import { useState } from 'react';

const PropertyCard = ({ property, viewMode = 'grid', isNearby = false }) => {
  const [imageError, setImageError] = useState(false);
  
  // Helper function to get location display name
  const getLocationDisplayName = (location) => {
    if (!location) return 'Location not specified';
    
    // Handle different location formats
    if (typeof location === 'string') {
      // If it's already a string, return it
      return location;
    }
    
    // If it's an object with different properties
    if (typeof location === 'object') {
      return location.name || location.address || 'Location not specified';
    }
    
    return 'Location not specified';
  };

  // Format dimension for display
  const formatDimension = (dimension) => {
    if (!dimension) return null;
    return dimension.includes('x') || dimension.includes('X') ? dimension : `${dimension} sq ft`;
  };

  // Get property status badges
  const getPropertyBadges = () => {
    const badges = [];
    
    // Always show verified badge for now (you can add logic to check actual verification status)
    badges.push({
      type: 'verified',
      label: '✓ Verified',
      color: 'bg-gradient-to-r from-primary to-primary-dark',
      textColor: 'text-white',
      icon: '✓'
    });
    
    // Add BHK badge
    if (property.bhk && property.bhk !== 'na') {
      badges.push({
        type: 'bhk',
        label: property.bhk.toUpperCase(),
        color: 'bg-gradient-to-r from-blue-500 to-blue-600',
        textColor: 'text-white',
        icon: '🏠'
      });
    }
    
    // Add furnishing status
    if (property.furnishingStatus) {
      const furnishingLabels = {
        'furnished': '🪑 Furnished',
        'semi-furnished': '🪑 Semi-Furnished',
        'unfurnished': '🏠 Unfurnished'
      };
      badges.push({
        type: 'furnishing',
        label: furnishingLabels[property.furnishingStatus] || property.furnishingStatus,
        color: 'bg-gradient-to-r from-purple-500 to-purple-600',
        textColor: 'text-white',
        icon: '🪑'
      });
    }
    
    // Add property condition
    if (property.propertyCondition) {
      badges.push({
        type: 'condition',
        label: `🏗️ ${property.propertyCondition}`,
        color: 'bg-gradient-to-r from-orange-500 to-orange-600',
        textColor: 'text-white',
        icon: '🏗️'
      });
    }
    
    return badges;
  };

  // Get property specifications
  const getSpecifications = () => {
    const specs = [];
    
    // Add dimension/plot size
    if (property.dimension) {
      specs.push({
        icon: '📐',
        label: formatDimension(property.dimension),
        type: 'dimension'
      });
    } else if (property.squareFootage) {
      specs.push({
        icon: '📐',
        label: `${property.squareFootage} sq ft`,
        type: 'area'
      });
    }
    
    // Add carpet area
    if (property.carpetArea) {
      specs.push({
        icon: '🏠',
        label: `Carpet: ${property.carpetArea}`,
        type: 'carpet'
      });
    }
    
    // Add superbuilt area
    if (property.superbuiltArea) {
      specs.push({
        icon: '🏢',
        label: `Super: ${property.superbuiltArea}`,
        type: 'superbuilt'
      });
    }
    
    // Add floor info
    if (property.floorNumber) {
      specs.push({
        icon: '🏢',
        label: `Floor ${property.floorNumber}${property.totalFloors ? `/${property.totalFloors}` : ''}`,
        type: 'floor'
      });
    }
    
    // Add parking
    if (property.parkingSpaces) {
      specs.push({
        icon: '🚗',
        label: `${property.parkingSpaces} Parking`,
        type: 'parking'
      });
    }
    
    // Add year built
    if (property.yearBuilt) {
      specs.push({
        icon: '📅',
        label: `Built ${property.yearBuilt}`,
        type: 'year'
      });
    }
    
    return specs;
  };

  const badges = getPropertyBadges();
  const specifications = getSpecifications();

  const cardContent = (
    <div className={`group bg-surface rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
      viewMode === 'list' ? 'flex' : ''
    }`}>
      {/* Image Section */}
      <div className={`relative ${viewMode === 'list' ? 'w-80 flex-shrink-0' : 'h-64'}`}>
        <img
          src={!imageError && property.gallery?.[0] ? property.gallery[0] : 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
        />
        
        {/* Status Badges - Top Left */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="px-3 py-1 bg-gradient-to-r from-primary to-primary/90 text-btn-text text-sm font-bold rounded-full shadow-lg">
            🔥 For {property.mode}
          </span>
          {isNearby && (
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold rounded-full shadow-lg">
              📍 Nearby
            </span>
          )}
        </div>
        
        {/* Media Count - Top Right */}
        <div className="absolute top-4 right-4 flex flex-col gap-1">
          {property.gallery && property.gallery.length > 1 && (
            <span className="px-2 py-1 bg-black/80 text-white text-xs font-semibold rounded-md backdrop-blur-sm">
              📸 {property.gallery.length}
            </span>
          )}
          {property.videos && property.videos.length > 0 && (
            <span className="px-2 py-1 bg-purple-600/90 text-white text-xs font-semibold rounded-md backdrop-blur-sm">
              🎬 {property.videos.length}
            </span>
          )}
        </div>
        
        {/* Price Tag - Bottom Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            💰 {property.price ? formatPrice(property.price) : 'Price on Request'}
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-6 flex-1">
        {/* Title and Location */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {property.title}
          </h3>
          <p className="text-gray-600 flex items-center text-sm">
            <svg className="w-4 h-4 mr-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {getLocationDisplayName(property.location)}
          </p>
        </div>
        
        {/* Eye-catching Feature Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {badges.map((badge, index) => (
            <span
              key={index}
              className={`px-3 py-1 ${badge.color} ${badge.textColor} text-xs font-bold rounded-full shadow-md transform hover:scale-105 transition-transform`}
            >
              {badge.icon} {badge.label}
            </span>
          ))}
        </div>
        
        {/* Property Specifications */}
        {specifications.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Specifications
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {specifications.map((spec, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-lg">{spec.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{spec.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Property Type and Basic Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-xs font-bold rounded-full border border-primary/20">
              {property.type}
            </span>
            {property.developer && (
              <span className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                🏗️ {property.developer}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {new Date(property.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        {/* Action Button */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Listed by {property.user?.name || 'Owner'}
            </span>
            <span className="text-primary font-bold group-hover:text-primary/80 flex items-center gap-1">
              View Details 
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Wrap in Link for navigation
  return (
    <Link href={generatePropertyUrl(property)}>
      {cardContent}
    </Link>
  );
};

export default PropertyCard;