import { NextResponse } from 'next/server';

/**
 * Nominatim text geocoding. Runs server-side so both the website and the
 * mobile app hit OpenStreetMap through one place with one User-Agent, rather
 * than each client calling Nominatim directly and risking a rate-limit block.
 */
async function geocodeLocation(location) {
  if (!location) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`,
      { headers: { 'User-Agent': 'PropFinova/1.0 (+https://www.propfinova.com)' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.error('Geocode error:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    const { url, location } = await request.json();

    // Either input is enough: a Google Maps link is preferred because it pins
    // the exact spot, but a plain location string can be geocoded instead.
    if (!url && !location) {
      return NextResponse.json(
        { success: false, message: 'A map URL or a location is required' },
        { status: 400 }
      );
    }

    if (!url) {
      const geocoded = await geocodeLocation(location);
      if (geocoded) {
        return NextResponse.json(
          { success: true, coordinates: geocoded, source: 'geocode' },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { success: false, message: 'Could not geocode that location' },
        { status: 404 }
      );
    }

    let urlToCheck = url;

    // If it's a shortened URL, resolve it
    if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual' // Don't follow redirects automatically
        });

        // Get the Location header which contains the redirect URL
        const redirectUrl = response.headers.get('location');
        if (redirectUrl) {
          urlToCheck = redirectUrl;
          console.log('Resolved shortened URL:', urlToCheck);
        }
      } catch (err) {
        console.error('Failed to resolve shortened URL:', err);
        // Continue with original URL
      }
    }

    // Extract coordinates from URL
    let coordinates = null;

    // Pattern 1: ?q=lat,lng or &q=lat,lng
    let match = urlToCheck.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      coordinates = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    // Pattern 2: /@lat,lng (most common in share links)
    if (!coordinates) {
      match = urlToCheck.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        coordinates = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    }

    // Pattern 3: /place/name/@lat,lng
    if (!coordinates) {
      match = urlToCheck.match(/place\/[^/]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        coordinates = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    }

    // Pattern 4: ll=lat,lng
    if (!coordinates) {
      match = urlToCheck.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        coordinates = { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
    }

    if (coordinates) {
      return NextResponse.json(
        { success: true, coordinates, resolvedUrl: urlToCheck, source: 'link' },
        { status: 200 }
      );
    }

    // A share link that hides its coordinates (e.g. a /maps/place/ name-only
    // URL) still usually names the place — fall back to geocoding.
    const geocoded = await geocodeLocation(location);
    if (geocoded) {
      return NextResponse.json(
        { success: true, coordinates: geocoded, resolvedUrl: urlToCheck, source: 'geocode' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Could not extract coordinates from URL' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Extract coordinates error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
