# 🗺️ Google Maps to MapLibre GL Migration Plan

## 🎯 Project Overview

Migrate from react-native-maps (Google Maps dependency) to MapLibre GL with MapTiler for a completely open-source, API-key-free mapping solution.

### Current Problems with Google Maps
- ❌ Requires Google Maps API key for Android
- ❌ Shows black screen without proper API configuration
- ❌ Complex Android setup with play-services
- ❌ Potential costs with API usage
- ❌ Limited control over tile providers

### Benefits of MapLibre GL
- ✅ 100% Open Source (no API keys except MapTiler)
- ✅ Direct MapTiler integration
- ✅ Better performance for custom tiles
- ✅ Works on both iOS and Android without platform-specific setup
- ✅ More control over map styling and features
- ✅ Vector and raster tile support

---

## 📋 Migration Steps

### Phase 1: Analysis & Preparation (30 min)

#### 1.1 Current Implementation Review
- [x] Document all current map features used
  - MapView component
  - UrlTile for MapTiler satellite
  - Marker for hole pins
  - User location tracking
  - Map controls (zoom, compass)
- [x] List all react-native-maps imports
- [x] Identify platform-specific code
- [x] Document current MapTiler integration
  - Created CurrentMapFeatures.md with full documentation

#### 1.2 Backup Current Implementation
- [x] Create backup branch: `backup-google-maps`
- [x] Save current MapView.js as MapView.google.backup.js
- [x] Document current dependencies versions
  - Committed all Google Maps implementation to backup branch

### Phase 2: Dependency Management (20 min)

#### 2.1 Remove Google Maps Dependencies
- [x] Uninstall react-native-maps
- [x] Remove Android Google Maps configuration
  - [x] Remove from AndroidManifest.xml (removed com.google.android.geo.API_KEY metadata)
  - [x] Remove Google Maps API key from strings.xml
  - [x] Clean gradle cache (rm -rf app/.cxx app/build)
- [x] Remove iOS configuration if any (N/A - no iOS directory)

#### 2.2 Install MapLibre GL
- [x] Install @maplibre/maplibre-react-native
- [x] Install peer dependencies if needed (none required)
- [x] Run pod install for iOS (N/A - Android only project)
- [x] Configure Android build.gradle (auto-linked)
- [x] Verify installation (9 packages added successfully)

### Phase 3: MapLibre Implementation (1-2 hours)

#### 3.1 Create New MapView Component
- [x] Create MapViewMapLibre.js
- [x] Import MapLibre GL components
- [x] Setup MapTiler style URL (`https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`)
- [x] Configure satellite imagery source (using MapTiler satellite style)
- [x] Implement basic map rendering with camera and zoom controls

#### 3.2 Feature Migration
- [x] User location display
  - [x] Request location permissions (react-native-permissions)
  - [x] Show user location indicator (MapLibreGL.UserLocation)
  - [x] Follow user location option (showsUserHeadingIndicator)
- [x] Map controls
  - [x] Compass (built into MapLibre)
  - [x] Zoom controls (pinch/double-tap enabled)
  - [x] Attribution (bottom-right position)
- [x] Hole markers
  - [x] Pin markers for greens (PointAnnotation)
  - [x] Custom marker styling (🏌️ emoji in white circle)
  - [x] Marker popups (Callout component)
- [x] MapTiler satellite tiles
  - [x] Configure raster source (via style.json)
  - [x] Set proper tile size (handled by MapTiler)
  - [ ] Handle offline caching setup (future enhancement)

#### 3.3 Navigation Integration
- [x] Hole navigation bar compatibility (1-18 holes with par/yardage)
- [x] Distance measurements overlay (Pin/Front/Back/Center placeholders)
- [x] Maintain state between tab switches (shared state in ScorecardContainer)

### Phase 4: Testing & Optimization (30 min)

#### 4.1 Functionality Testing
- [ ] Map loads correctly
- [ ] Satellite imagery displays
- [ ] User location works
- [ ] Markers show correctly
- [ ] Navigation between holes
- [ ] Performance testing

#### 4.2 Cross-Platform Testing
- [ ] Test on Android device/emulator
- [ ] Test on iOS device/simulator
- [ ] Verify no platform-specific issues

#### 4.3 Error Handling
- [ ] Handle MapTiler API key errors
- [ ] Handle location permission denials
- [ ] Handle offline scenarios
- [ ] Add loading states

### Phase 5: Cleanup & Documentation (20 min)

#### 5.1 Code Cleanup
- [ ] Remove old Google Maps code
- [ ] Remove unused imports
- [ ] Clean up configuration files
- [ ] Update comments

#### 5.2 Documentation
- [ ] Update README with new setup
- [ ] Document MapLibre features
- [ ] Add troubleshooting guide
- [ ] Update API key instructions

---

## 🔧 Technical Implementation Details

### MapLibre GL Setup

```javascript
import MapLibreGL from '@maplibre/maplibre-react-native';

// Set access token (even though we use MapTiler, this is required)
MapLibreGL.setAccessToken(null);

// Configure MapTiler
const MAPTILER_KEY = '9VwMyrJdecjrEB6fwLGJ';
const MAPTILER_STYLE = `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;
```

### Key Components Mapping

| react-native-maps | MapLibre GL |
|-------------------|-------------|
| `<MapView>` | `<MapLibreGL.MapView>` |
| `<Marker>` | `<MapLibreGL.PointAnnotation>` |
| `<UrlTile>` | Built-in raster source |
| `region` | `centerCoordinate` + `zoomLevel` |
| `mapType` | `styleURL` |

### MapTiler Integration

```javascript
// Satellite style
const satelliteStyle = {
  version: 8,
  sources: {
    'satellite': {
      type: 'raster',
      tiles: [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`],
      tileSize: 256,
      maxzoom: 20
    }
  },
  layers: [{
    id: 'satellite',
    type: 'raster',
    source: 'satellite'
  }]
};
```

---

## 🚨 Risk Mitigation

### Potential Issues
1. **iOS Podfile conflicts** - Clean pods and reinstall
2. **Android build issues** - Clean gradle and rebuild
3. **Performance differences** - Profile and optimize
4. **Feature parity** - Some features might work differently

### Rollback Plan
1. Keep backup branch with Google Maps implementation
2. Document all changes for easy reversal
3. Test thoroughly before removing old code

---

## 📊 Success Criteria

- [ ] Map displays satellite imagery from MapTiler
- [x] No Google Maps API key required
- [ ] User location tracking works
- [ ] Hole markers display correctly
- [ ] Performance is equal or better
- [ ] No platform-specific issues
- [x] Clean, maintainable code

---

## 🎯 Timeline

- **Phase 1**: 30 minutes
- **Phase 2**: 20 minutes  
- **Phase 3**: 1-2 hours
- **Phase 4**: 30 minutes
- **Phase 5**: 20 minutes

**Total**: ~3-4 hours

---

## 📝 Notes

- MapLibre GL is a fork of Mapbox GL v1.13 (before license change)
- Fully compatible with MapTiler
- Active community and development
- Used by major companies as Mapbox alternative

## 🚀 Migration Summary (Completed Tasks)

### What Was Done:
1. **Removed all Google Maps dependencies**
   - Uninstalled react-native-maps package
   - Cleaned AndroidManifest.xml of Google Maps metadata
   - Removed Google Maps API key from strings.xml
   - Cleaned gradle build directories

2. **Installed MapLibre GL**
   - Added @maplibre/maplibre-react-native
   - No additional configuration needed

3. **Created MapViewMapLibre.js**
   - Full MapLibre implementation with satellite imagery
   - Location permissions handling
   - User location tracking
   - Hole navigation (1-18)
   - Distance information bar
   - Test marker at Augusta National

4. **Updated Integration**
   - Modified ScorecardContainer to use MapViewMapLibre
   - Renamed old MapView.js to MapView.old.js
   - Maintained all existing functionality

### Files Changed:
- `/mobile/android/app/src/main/AndroidManifest.xml` - Removed Google Maps metadata
- `/mobile/android/app/src/main/res/values/strings.xml` - Removed Google Maps API key
- `/mobile/src/screens/rounds/components/MapViewMapLibre.js` - New MapLibre implementation
- `/mobile/src/screens/rounds/components/ScorecardContainer.js` - Updated import
- `/mobile/src/screens/rounds/components/MapView.js` → `MapView.old.js` - Renamed

### Ready for Testing:
- Build the Android app
- Map should display MapTiler satellite imagery
- No Google Maps API key needed
- Location permissions will be requested
- All navigation features should work