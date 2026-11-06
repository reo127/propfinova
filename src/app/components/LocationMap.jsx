"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red marker icon with better styling
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [32, 52],
    iconAnchor: [16, 52],
    popupAnchor: [0, -52],
    shadowSize: [52, 52]
});

// Helper function to extract coordinates from Google Maps URL via backend
const extractCoordinatesFromUrl = async (url) => {
    if (!url) return null;

    try {
        // Use our backend API to resolve shortened URLs and extract coordinates
        const response = await fetch('/api/maps/extract-coordinates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.coordinates) {
                return data.coordinates;
            }
        }

        // Fallback: Try to extract directly from URL (works for non-shortened URLs)
        // Pattern 1: ?q=lat,lng or &q=lat,lng
        const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
        let match = url.match(qPattern);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        // Pattern 2: /@lat,lng (most common in share links)
        const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
        match = url.match(atPattern);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        // Pattern 3: /place/name/@lat,lng
        const placePattern = /place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
        match = url.match(placePattern);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        // Pattern 4: ll=lat,lng
        const llPattern = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
        match = url.match(llPattern);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }

        return null;
    } catch (err) {
        console.error('Error extracting coordinates from URL:', err);
        return null;
    }
};

export default function LocationMap({ location, propertyTitle, mapLocationLink }) {
    const [coordinates, setCoordinates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMapLink, setUsingMapLink] = useState(false);

    useEffect(() => {
        const geocodeLocation = async () => {
            if (!location && !mapLocationLink) {
                setError('No location provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // PRIORITY 1: Try to extract coordinates from Google Maps link if provided
                if (mapLocationLink) {
                    const extractedCoords = await extractCoordinatesFromUrl(mapLocationLink);
                    if (extractedCoords) {
                        setCoordinates(extractedCoords);
                        setUsingMapLink(true);
                        setLoading(false);
                        return;
                    } else {
                        // If map link provided but couldn't extract, show warning
                        setError('Could not extract coordinates from map link. Using text location instead.');
                    }
                }

                // PRIORITY 2: Fall back to text-based geocoding
                if (location) {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
                        {
                            headers: {
                                'User-Agent': 'PropFinova-PropertyApp/1.0'
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error('Failed to geocode location');
                    }

                    const data = await response.json();

                    if (data && data.length > 0) {
                        setCoordinates({
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon)
                        });
                        setUsingMapLink(false);
                    } else {
                        // Fallback to default coordinates (India center) if geocoding fails
                        setCoordinates({
                            lat: 20.5937,
                            lng: 78.9629
                        });
                        setError('Location not found precisely. Showing approximate area.');
                    }
                } else {
                    throw new Error('No valid location data');
                }
            } catch (err) {
                console.error('Geocoding error:', err);
                setError('Failed to load map location');
                // Fallback coordinates
                setCoordinates({
                    lat: 20.5937,
                    lng: 78.9629
                });
            } finally {
                setLoading(false);
            }
        };

        geocodeLocation();
    }, [location, mapLocationLink]);

    if (loading) {
        return (
            <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading map...</p>
                </div>
            </div>
        );
    }

    if (!coordinates) {
        return (
            <div className="w-full h-96 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
                <div className="text-center p-6">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-gray-600 font-medium">Unable to load map</p>
                    <p className="text-gray-500 text-sm mt-2">{error || 'Location not available'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {error && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                </div>
            )}
            <div className="w-full h-96 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                <MapContainer
                    center={[coordinates.lat, coordinates.lng]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                    zoomControl={true}
                >
                    {/* CartoDB Voyager - Modern, clean map style */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        maxZoom={20}
                    />
                    <Marker position={[coordinates.lat, coordinates.lng]} icon={redIcon}>
                        <Popup>
                            <div className="text-center p-2">
                                <p className="font-semibold text-gray-900 mb-1">{propertyTitle || 'Property Location'}</p>
                                <p className="text-sm text-gray-600">{location}</p>
                                {mapLocationLink && (
                                    <a
                                        href={mapLocationLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline mt-2 inline-block"
                                    >
                                        View on Google Maps →
                                    </a>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>
            <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Interactive map - Click and drag to explore the area. Click the red marker for property details.</p>
                </div>
                {mapLocationLink && (
                    <a
                        href={mapLocationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Open in Google Maps
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                )}
            </div>
        </div>
    );
}
