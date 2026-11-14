'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, ExternalLink } from 'lucide-react';
import { MAP_PROVIDER, googleEmbedUrl, externalMapUrl } from '@/lib/mapConfig';

// Leaflet touches `window` at import time, so it can never be server-rendered.
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

/**
 * Shows where a property is. The admin/broker pastes a Google Maps share link
 * on the listing form; this resolves that link to coordinates server-side and
 * renders the pin on whichever provider is configured (OpenStreetMap today,
 * Google Maps by flipping NEXT_PUBLIC_MAP_PROVIDER).
 */
export default function LocationMap({ location, propertyTitle, mapLocationLink }) {
  const [coordinates, setCoordinates] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | failed

  // Derived rather than pushed into state, so the effect never has to call
  // setState synchronously just to report "nothing to resolve".
  const canResolve = Boolean(location || mapLocationLink);

  useEffect(() => {
    if (!canResolve) return;

    // No `setStatus('loading')` reset here: it already starts as 'loading',
    // and resetting it synchronously inside the effect triggers a cascading
    // render. A property's location never changes after mount in practice.
    let active = true;

    // One request handles both paths: pull coordinates out of the Maps link,
    // else geocode the location text. Server-side so Nominatim sees a single
    // well-identified caller.
    fetch('/api/maps/extract-coordinates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: mapLocationLink || undefined, location: location || undefined }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d?.success && d.coordinates) {
          setCoordinates(d.coordinates);
          setStatus('ready');
        } else {
          setStatus('failed');
        }
      })
      .catch(() => active && setStatus('failed'));

    return () => {
      active = false;
    };
  }, [location, mapLocationLink, canResolve]);

  const openUrl = externalMapUrl({
    lat: coordinates?.lat,
    lng: coordinates?.lng,
    location,
    mapLocationLink,
  });

  const googleUrl = coordinates && MAP_PROVIDER === 'google' ? googleEmbedUrl(coordinates) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {canResolve && status === 'loading' && (
        <div className="flex h-96 items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted">Loading map…</p>
          </div>
        </div>
      )}

      {canResolve && status === 'ready' && coordinates && (
        googleUrl ? (
          <iframe
            title={`Map of ${propertyTitle || location}`}
            src={googleUrl}
            className="h-96 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          <LeafletMap
            coordinates={coordinates}
            propertyTitle={propertyTitle}
            location={location}
          />
        )
      )}

      {(!canResolve || status === 'failed') && (
        <div className="flex h-32 items-center justify-center gap-2 bg-background">
          <MapPin className="h-4 w-4 text-muted" />
          <p className="text-sm text-muted">{location || 'Location unavailable'}</p>
        </div>
      )}

      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 border-t border-border py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-background"
      >
        Open in {MAP_PROVIDER === 'google' ? 'Google Maps' : 'OpenStreetMap'}
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
