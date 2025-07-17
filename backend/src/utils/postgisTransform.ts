/**
 * @file utils/postgisTransform.ts
 * @description Utility functions for transforming between mobile app coordinate format and PostGIS format
 */

/**
 * Convert latitude and longitude to PostGIS POINT format
 * @param latitude - Latitude value (-90 to 90)
 * @param longitude - Longitude value (-180 to 180)
 * @returns PostGIS POINT string format: "POINT(longitude latitude)"
 */
export function coordinatesToPoint(latitude: number, longitude: number): string {
  if (!validateCoordinates(latitude, longitude)) {
    throw new Error(`Invalid coordinates: lat=${latitude}, lng=${longitude}`);
  }
  // PostGIS uses longitude first, then latitude
  return `POINT(${longitude} ${latitude})`;
}

/**
 * Convert PostGIS POINT format to coordinate object
 * @param point - PostGIS POINT string (e.g., "POINT(-82.0206 33.5031)")
 * @returns Coordinate object with latitude and longitude
 */
export function pointToCoordinates(point: string): { latitude: number; longitude: number } {
  if (!point || typeof point !== 'string') {
    throw new Error('Invalid point format');
  }

  // Match POINT(longitude latitude) format
  const match = point.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!match) {
    throw new Error(`Invalid POINT format: ${point}`);
  }

  const longitude = parseFloat(match[1]);
  const latitude = parseFloat(match[2]);

  if (!validateCoordinates(latitude, longitude)) {
    throw new Error(`Invalid coordinates in point: ${point}`);
  }

  return { latitude, longitude };
}

/**
 * Convert array of coordinates to PostGIS POLYGON format
 * @param coordinates - Array of coordinate objects
 * @returns PostGIS POLYGON string format
 */
export function coordinatesToPolygon(coordinates: Array<{ latitude: number; longitude: number }>): string {
  if (!coordinates || coordinates.length < 3) {
    throw new Error('Polygon requires at least 3 coordinates');
  }

  // Validate all coordinates
  coordinates.forEach((coord, index) => {
    if (!validateCoordinates(coord.latitude, coord.longitude)) {
      throw new Error(`Invalid coordinate at index ${index}: lat=${coord.latitude}, lng=${coord.longitude}`);
    }
  });

  // Convert to PostGIS format (longitude first)
  const points = coordinates.map(coord => `${coord.longitude} ${coord.latitude}`);
  
  // Close the polygon by repeating the first point if not already closed
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  if (firstPoint !== lastPoint) {
    points.push(firstPoint);
  }

  return `POLYGON((${points.join(', ')}))`;
}

/**
 * Convert PostGIS POLYGON format to array of coordinates
 * @param polygon - PostGIS POLYGON string
 * @returns Array of coordinate objects
 */
export function polygonToCoordinates(polygon: string): Array<{ latitude: number; longitude: number }> {
  if (!polygon || typeof polygon !== 'string') {
    throw new Error('Invalid polygon format');
  }

  // Match POLYGON((points)) format
  const match = polygon.match(/POLYGON\(\((.*)\)\)/);
  if (!match) {
    throw new Error(`Invalid POLYGON format: ${polygon}`);
  }

  const pointsString = match[1];
  const points = pointsString.split(',').map(point => {
    const [lng, lat] = point.trim().split(' ').map(parseFloat);
    return { latitude: lat, longitude: lng };
  });

  // Remove the closing point if it duplicates the first point
  if (points.length > 1 && 
      points[0].latitude === points[points.length - 1].latitude &&
      points[0].longitude === points[points.length - 1].longitude) {
    points.pop();
  }

  return points;
}

/**
 * Validate GPS coordinates
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @returns True if coordinates are valid
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param lat1 - First point latitude
 * @param lon1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lon2 - Second point longitude
 * @returns Distance in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Transform mobile shot data to database format
 * @param mobileShot - Shot data from mobile app
 * @param previousShot - Previous shot for calculating end position
 * @returns Transformed shot data for database
 */
export function transformShotData(mobileShot: any, previousShot?: any): any {
  const { coordinates, distanceToNext, clubId, ...rest } = mobileShot;
  
  // Start position is current shot coordinates
  const startPosition = coordinatesToPoint(coordinates.latitude, coordinates.longitude);
  
  // For end position, we need to estimate based on next shot or use same as start
  // In a real implementation, this would come from the next shot's coordinates
  let endPosition = startPosition;
  
  // If we have distance to next, we could calculate approximate end position
  // For now, we'll use the same position and rely on the mobile app's distance calculation
  
  return {
    ...rest,
    startPosition,
    endPosition,
    distanceYards: distanceToNext ? distanceToNext * 1.09361 : 0, // Convert meters to yards
    clubId: clubId || null,
    // Default values for required fields not in mobile data
    lieType: 'fairway',
    shotType: 'full',
    shotShape: 'straight'
  };
}