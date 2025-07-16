// Custom tile fetcher for MapLibre to work around bridgeless mode issues
import MapLibreGL from '@maplibre/maplibre-react-native';

// Store for ongoing tile requests to prevent duplicates
const tileRequests = new Map();

// Custom fetch implementation for tiles
const fetchTile = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching tile:', error);
    throw error;
  }
};

// Intercept and replace MapLibre's tile requests
export const patchMapLibreTileFetcher = () => {
  if (MapLibreGL.setTileRequestInterceptor) {
    MapLibreGL.setTileRequestInterceptor(async (tileUrl) => {
      // Check if we already have this request in progress
      if (tileRequests.has(tileUrl)) {
        return tileRequests.get(tileUrl);
      }

      // Create new request
      const requestPromise = fetchTile(tileUrl)
        .finally(() => {
          // Clean up after request completes
          tileRequests.delete(tileUrl);
        });

      tileRequests.set(tileUrl, requestPromise);
      return requestPromise;
    });
    console.log('✅ MapLibre tile fetcher patched for bridgeless mode');
  } else {
    console.warn('⚠️ MapLibre tile request interceptor not available');
  }
};

export default {
  patchMapLibreTileFetcher
};