# Current Map Implementation Features

## react-native-maps Components Used:
1. **MapView** - Main map container
   - provider: PROVIDER_GOOGLE
   - region: lat/lng with deltas
   - mapType: "none" (for custom tiles)
   - User location features
   - Zoom/scroll controls

2. **UrlTile** - MapTiler satellite imagery
   - URL template with API key
   - Tile size: 256
   - Z-index: -1

3. **Marker** - Course features
   - Test marker at Augusta National
   - Custom pin styling
   - Popup descriptions

## Current Features:
- MapTiler satellite imagery overlay
- User location tracking
- Map controls (zoom, compass)
- Hole navigation bar
- Distance information bar (placeholder)
- MapTiler API key management
- Loading states
- Error handling

## Dependencies:
- react-native-maps
- Google Play Services (Android)
- Google Maps API key (Android)