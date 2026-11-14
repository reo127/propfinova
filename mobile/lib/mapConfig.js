/**
 * Which map renders the property location, mirroring src/lib/mapConfig.js on
 * the web so both surfaces stay in step.
 *
 * Switching to Google later is a one-line env change — no component edits:
 *   EXPO_PUBLIC_MAP_PROVIDER=google
 *   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
 */
export const MAP_PROVIDER = process.env.EXPO_PUBLIC_MAP_PROVIDER || "osm";
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export const OSM_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const OSM_ATTRIBUTION = "&copy; OpenStreetMap contributors &copy; CARTO";

export function googleEmbedUrl({ lat, lng, zoom = 15 }) {
  if (!GOOGLE_MAPS_API_KEY) return null;
  return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${lat},${lng}&zoom=${zoom}`;
}

export function externalMapUrl({ lat, lng, location, mapLocationLink }) {
  if (mapLocationLink) return mapLocationLink;
  if (lat != null && lng != null) {
    return MAP_PROVIDER === "google"
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  }
  const q = encodeURIComponent(location || "");
  return MAP_PROVIDER === "google"
    ? `https://www.google.com/maps/search/?api=1&query=${q}`
    : `https://www.openstreetmap.org/search?query=${q}`;
}

/** Minimal Leaflet page for the WebView — same tiles and pin as the website. */
export function leafletHtml({ lat, lng, title, location }) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;background:#f3faf6}
.leaflet-popup-content{font-family:-apple-system,system-ui,sans-serif;font-size:13px;margin:10px 12px}
.leaflet-popup-content b{color:#10251b}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map').setView([${lat}, ${lng}], 15);
  L.tileLayer('${OSM_TILE_URL}', { attribution: '${OSM_ATTRIBUTION}', maxZoom: 20 }).addTo(map);
  var icon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });
  L.marker([${lat}, ${lng}], { icon: icon }).addTo(map)
    .bindPopup(${JSON.stringify(`<b>${title || "Property"}</b><br/>${location || ""}`)});
</script></body></html>`;
}
