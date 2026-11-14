/**
 * Which map renders the property location.
 *
 * Switching to Google later is a one-line env change — no component edits:
 *   NEXT_PUBLIC_MAP_PROVIDER=google
 *   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
 *
 * Both providers consume the same { lat, lng }, so the coordinate-resolution
 * path (Google Maps link -> /api/maps/extract-coordinates -> geocode
 * fallback) is identical either way.
 */
export const MAP_PROVIDER = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'osm';
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// OpenStreetMap data served as CartoDB Voyager raster tiles — no key needed.
export const OSM_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Google Maps Embed API URL — works in an <iframe> and in a WebView alike. */
export function googleEmbedUrl({ lat, lng, zoom = 15 }) {
  if (!GOOGLE_MAPS_API_KEY) return null;
  return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=${zoom}`;
}

/** "Open in maps" deep link, matched to the active provider. */
export function externalMapUrl({ lat, lng, location, mapLocationLink }) {
  if (mapLocationLink) return mapLocationLink;
  if (lat != null && lng != null) {
    return MAP_PROVIDER === 'google'
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  }
  const q = encodeURIComponent(location || '');
  return MAP_PROVIDER === 'google'
    ? `https://www.google.com/maps/search/?api=1&query=${q}`
    : `https://www.openstreetmap.org/search?query=${q}`;
}
