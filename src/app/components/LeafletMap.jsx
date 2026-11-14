'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '@/lib/mapConfig';

// Leaflet reaches for `window` as soon as it is imported, so this file must
// only ever load in the browser. LocationMap pulls it in via next/dynamic
// with `ssr: false` — importing it directly anywhere server-rendered will
// crash the route with "window is not defined".
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Brand-green pin instead of Leaflet's default blue.
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function LeafletMap({ coordinates, propertyTitle, location, height = 384 }) {
  return (
    <MapContainer
      center={[coordinates.lat, coordinates.lng]}
      zoom={15}
      style={{ height, width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} maxZoom={20} />
      <Marker position={[coordinates.lat, coordinates.lng]} icon={greenIcon}>
        <Popup>
          <div className="text-center">
            <p className="font-semibold text-slate-900">{propertyTitle || 'Property location'}</p>
            {location && <p className="mt-0.5 text-sm text-slate-600">{location}</p>}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
