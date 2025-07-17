/**
 * GPS calculation utilities for golf shot tracking
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @param {string} unit - Unit of measurement ('yards' or 'meters')
 * @returns {number} Distance in specified unit
 */
export const calculateDistance = (lat1, lon1, lat2, lon2, unit = 'yards') => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInKm = R * c;
  
  // Convert to desired unit
  const distanceInMeters = distanceInKm * 1000;
  
  if (unit === 'yards') {
    return Math.round(distanceInMeters * 1.09361);
  }
  
  return Math.round(distanceInMeters);
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate bearing between two GPS coordinates
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing in degrees (0-360)
 */
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x);
  
  // Convert to degrees and normalize to 0-360
  return ((bearing * 180 / Math.PI) + 360) % 360;
};

/**
 * Calculate distances for a series of shots
 * @param {Array} shots - Array of shot objects with coordinates
 * @param {string} unit - Unit of measurement
 * @returns {Array} Shots with calculated distances
 */
export const calculateShotDistances = (shots, unit = 'yards') => {
  if (!shots || shots.length < 2) return shots;
  
  const shotsWithDistances = [...shots];
  
  for (let i = 0; i < shotsWithDistances.length - 1; i++) {
    const currentShot = shotsWithDistances[i];
    const nextShot = shotsWithDistances[i + 1];
    
    if (currentShot.coordinates && nextShot.coordinates) {
      const distance = calculateDistance(
        currentShot.coordinates.latitude,
        currentShot.coordinates.longitude,
        nextShot.coordinates.latitude,
        nextShot.coordinates.longitude,
        unit
      );
      
      currentShot.distanceToNext = distance;
    }
  }
  
  return shotsWithDistances;
};

/**
 * Calculate total distance for a hole from shots
 * @param {Array} shots - Array of shot objects for a hole
 * @param {string} unit - Unit of measurement
 * @returns {number} Total distance
 */
export const calculateHoleDistance = (shots, unit = 'yards') => {
  if (!shots || shots.length < 2) return 0;
  
  let totalDistance = 0;
  
  for (let i = 0; i < shots.length - 1; i++) {
    const currentShot = shots[i];
    const nextShot = shots[i + 1];
    
    if (currentShot.coordinates && nextShot.coordinates) {
      totalDistance += calculateDistance(
        currentShot.coordinates.latitude,
        currentShot.coordinates.longitude,
        nextShot.coordinates.latitude,
        nextShot.coordinates.longitude,
        unit
      );
    }
  }
  
  return Math.round(totalDistance);
};

/**
 * Find closest point (tee box, pin, hazard) to given coordinates
 * @param {Object} coordinates - Current GPS coordinates
 * @param {Array} points - Array of points to check
 * @returns {Object} Closest point with distance
 */
export const findClosestPoint = (coordinates, points, unit = 'yards') => {
  if (!coordinates || !points || points.length === 0) return null;
  
  let closest = null;
  let minDistance = Infinity;
  
  points.forEach(point => {
    if (point.coordinates) {
      const distance = calculateDistance(
        coordinates.latitude,
        coordinates.longitude,
        point.coordinates.latitude,
        point.coordinates.longitude,
        unit
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closest = { ...point, distance };
      }
    }
  });
  
  return closest;
};

/**
 * Detect if user is near a tee box (within threshold distance)
 * @param {Object} coordinates - Current GPS coordinates
 * @param {Array} teeBoxes - Array of tee box locations
 * @param {number} threshold - Distance threshold in yards
 * @returns {Object|null} Detected tee box or null
 */
export const detectTeeBox = (coordinates, teeBoxes, threshold = 20) => {
  const closest = findClosestPoint(coordinates, teeBoxes, 'yards');
  
  if (closest && closest.distance <= threshold) {
    return closest;
  }
  
  return null;
};

/**
 * Detect if user is near a green/pin (within threshold distance)
 * @param {Object} coordinates - Current GPS coordinates
 * @param {Object} pin - Pin location
 * @param {number} threshold - Distance threshold in yards
 * @returns {boolean} True if near pin
 */
export const detectNearPin = (coordinates, pin, threshold = 30) => {
  if (!coordinates || !pin || !pin.coordinates) return false;
  
  const distance = calculateDistance(
    coordinates.latitude,
    coordinates.longitude,
    pin.coordinates.latitude,
    pin.coordinates.longitude,
    'yards'
  );
  
  return distance <= threshold;
};

/**
 * Format distance for display
 * @param {number} distance - Distance value
 * @param {string} unit - Unit of measurement
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance, unit = 'yards') => {
  if (!distance || distance === 0) return '0 ' + unit;
  
  if (distance < 1) {
    return '< 1 ' + (unit === 'yards' ? 'yd' : 'm');
  }
  
  return `${Math.round(distance)} ${unit === 'yards' ? 'yds' : 'm'}`;
};