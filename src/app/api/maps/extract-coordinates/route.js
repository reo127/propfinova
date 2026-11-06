import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
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
        { success: true, coordinates, resolvedUrl: urlToCheck },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Could not extract coordinates from URL' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Extract coordinates error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server Error' },
      { status: 500 }
    );
  }
}
