/**
 * Coordinate Parser Utility for Google Maps & GPS Coordinates
 * Supports:
 * 1. Standard Google Maps copy: "-6.2087634, 106.845599" or "-6.2087634,106.845599"
 * 2. Google Maps URLs:
 *    - https://www.google.com/maps/place/.../@-6.2087634,106.845599,17z/...
 *    - https://maps.google.com/?q=-6.2087634,106.845599
 *    - https://maps.google.com/?ll=-6.2087634,106.845599
 * 3. Indonesian comma decimal format: "-6,2087634; 106,845599"
 * 4. Degrees Minutes Seconds (DMS): 6°12'31.5"S 106°50'44.2"E
 * 5. Single decimal or comma number strings
 */

export interface ParsedCoordinates {
  latitude: number;
  longitude: number;
  formatDetected: 'PAIR' | 'GOOGLE_MAPS_URL' | 'DMS';
  formattedString: string;
}

export function parseCoordinates(input: string): ParsedCoordinates | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Check Google Maps URLs
  // Pattern A: /@(-?\d+\.\d+),(-?\d+\.\d+)
  const urlAtMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (urlAtMatch) {
    const lat = parseFloat(urlAtMatch[1]);
    const lng = parseFloat(urlAtMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        formatDetected: 'GOOGLE_MAPS_URL',
        formattedString: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
    }
  }

  // Pattern B: ?q=lat,lng or ?ll=lat,lng or &q=lat,lng or &daddr=lat,lng
  const urlQueryMatch = trimmed.match(/[?&](?:q|ll|daddr|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (urlQueryMatch) {
    const lat = parseFloat(urlQueryMatch[1]);
    const lng = parseFloat(urlQueryMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        formatDetected: 'GOOGLE_MAPS_URL',
        formattedString: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
    }
  }

  // 2. Check DMS (Degrees, Minutes, Seconds) Format: e.g. 6°12'31.5"S 106°50'44.2"E
  const dmsLatRegex = /(\d+)[°\s]+(\d+)['′\s]+(\d+(?:\.\d+)?)["″\s]*([NSns])/;
  const dmsLngRegex = /(\d+)[°\s]+(\d+)['′\s]+(\d+(?:\.\d+)?)["″\s]*([EWew])/;
  const dmsLatMatch = trimmed.match(dmsLatRegex);
  const dmsLngMatch = trimmed.match(dmsLngRegex);

  if (dmsLatMatch && dmsLngMatch) {
    let lat = parseInt(dmsLatMatch[1], 10) + parseInt(dmsLatMatch[2], 10) / 60 + parseFloat(dmsLatMatch[3]) / 3600;
    if (dmsLatMatch[4].toUpperCase() === 'S') lat = -lat;

    let lng = parseInt(dmsLngMatch[1], 10) + parseInt(dmsLngMatch[2], 10) / 60 + parseFloat(dmsLngMatch[3]) / 3600;
    if (dmsLngMatch[4].toUpperCase() === 'W') lng = -lng;

    if (isValidLatLng(lat, lng)) {
      return {
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
        formatDetected: 'DMS',
        formattedString: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
    }
  }

  // 3. Semicolon-separated format with possible comma decimals: "-6,2087634; 106,845599"
  if (trimmed.includes(';')) {
    const parts = trimmed.split(';').map((p) => p.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].replace(',', '.'));
      const lng = parseFloat(parts[1].replace(',', '.'));
      if (isValidLatLng(lat, lng)) {
        return {
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          formatDetected: 'PAIR',
          formattedString: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };
      }
    }
  }

  // 4. Standard comma-separated or space-separated pair:
  // e.g. "-6.2087634, 106.845599" or "-6.2087634,106.845599" or "-6.2087634 106.845599"
  // Handles labeled format like "lat: -6.2087634, lng: 106.845599"
  const cleanNumbersText = trimmed
    .replace(/[Ll]at(?:itude)?:/g, '')
    .replace(/[Ll]ng|[Ll]on(?:gitude)?:/g, '')
    .trim();

  // Match two decimal floats (with minus, dots) separated by comma and/or whitespace
  const pairMatch = cleanNumbersText.match(/^(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)$/);
  if (pairMatch) {
    const lat = parseFloat(pairMatch[1]);
    const lng = parseFloat(pairMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        formatDetected: 'PAIR',
        formattedString: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
    }
  }

  // Fallback: splitting by comma
  const commaParts = cleanNumbersText.split(',');
  if (commaParts.length === 2) {
    const lat = parseFloat(commaParts[0].trim());
    const lng = parseFloat(commaParts[1].trim());
    if (isValidLatLng(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        formatDetected: 'PAIR',
        formattedString: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
    }
  }

  // Fallback: splitting by whitespace
  const spaceParts = cleanNumbersText.split(/\s+/);
  if (spaceParts.length === 2) {
    const lat = parseFloat(spaceParts[0].trim());
    const lng = parseFloat(spaceParts[1].trim());
    if (isValidLatLng(lat, lng)) {
      return {
        latitude: lat,
        longitude: lng,
        formatDetected: 'PAIR',
        formattedString: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
    }
  }

  return null;
}

export function parseSingleCoordinate(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  const cleaned = input.trim().replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Creates Google Maps URL for testing or previewing the coordinates
 */
export function getGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
