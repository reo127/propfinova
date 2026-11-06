// Bangalore locations with nearby relationships for real estate CRM
export const BANGALORE_LOCATIONS = {
  'sarjapura': {
    name: 'Sarjapura',
    nearby: ['electronic-city', 'hsr-layout', 'bommanahalli', 'begur']
  },
  'electronic-city': {
    name: 'Electronic City',
    nearby: ['sarjapura', 'bommanahalli', 'hsr-layout', 'bannerghatta']
  },
  'whitefield': {
    name: 'Whitefield',
    nearby: ['marathahalli', 'brookefield', 'kadugodi', 'varthur']
  },
  'hsr-layout': {
    name: 'HSR Layout',
    nearby: ['sarjapura', 'electronic-city', 'bommanahalli', 'koramangala']
  },
  'koramangala': {
    name: 'Koramangala',
    nearby: ['hsr-layout', 'btm-layout', 'jayanagar', 'bommanahalli']
  },
  'indiranagar': {
    name: 'Indiranagar',
    nearby: ['koramangala', 'ulsoor', 'cv-raman-nagar', 'jeevanbheemanagar']
  },
  'marathahalli': {
    name: 'Marathahalli',
    nearby: ['whitefield', 'brookefield', 'kundalahalli', 'varthur']
  },
  'bannerghatta': {
    name: 'Bannerghatta',
    nearby: ['electronic-city', 'bommanahalli', 'jayanagar', 'jp-nagar']
  },
  'bommanahalli': {
    name: 'Bommanahalli',
    nearby: ['electronic-city', 'hsr-layout', 'btm-layout', 'bannerghatta']
  },
  'btm-layout': {
    name: 'BTM Layout',
    nearby: ['koramangala', 'bommanahalli', 'jayanagar', 'jp-nagar']
  },
  'jayanagar': {
    name: 'Jayanagar',
    nearby: ['btm-layout', 'bannerghatta', 'jp-nagar', 'basavanagudi']
  },
  'jp-nagar': {
    name: 'JP Nagar',
    nearby: ['jayanagar', 'bannerghatta', 'btm-layout', 'uttarahalli']
  },
  'rajajinagar': {
    name: 'Rajajinagar',
    nearby: ['basavanagudi', 'vijayanagar', 'mahalakshmi-layout', 'malleshwaram']
  },
  'malleshwaram': {
    name: 'Malleshwaram',
    nearby: ['rajajinagar', 'sadashivanagar', 'seshadripuram', 'gandhinagar']
  },
  'yelahanka': {
    name: 'Yelahanka',
    nearby: ['hebbal', 'thanisandra', 'jakkur', 'bagalur']
  },
  'hebbal': {
    name: 'Hebbal',
    nearby: ['yelahanka', 'rt-nagar', 'thanisandra', 'sahakarnagar']
  },
  'bellandur': {
    name: 'Bellandur',
    nearby: ['marathahalli', 'sarjapura', 'varthur', 'kadubeesanahalli']
  },
  'varthur': {
    name: 'Varthur',
    nearby: ['whitefield', 'bellandur', 'marathahalli', 'kundalahalli']
  }
};

// Get nearby locations for a given location
export function getNearbyLocations(location) {
  if (!location || typeof location !== 'string') {
    return [];
  }
  const normalizedLocation = location.toLowerCase().replace(/\s+/g, '-');
  return BANGALORE_LOCATIONS[normalizedLocation]?.nearby || [];
}

// Get all locations for dropdown
export function getAllLocations() {
  return Object.values(BANGALORE_LOCATIONS).map(loc => loc.name).sort();
}

// Normalize location name for database storage
export function normalizeLocationName(location) {
  if (!location || typeof location !== 'string') {
    return '';
  }
  return location.toLowerCase().replace(/\s+/g, '-');
}

// Get display name for location
export function getLocationDisplayName(location) {
  if (!location || typeof location !== 'string') {
    return 'Unknown Location';
  }
  const normalizedLocation = location.toLowerCase().replace(/\s+/g, '-');
  return BANGALORE_LOCATIONS[normalizedLocation]?.name || location;
}