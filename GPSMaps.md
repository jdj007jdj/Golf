# Golf App GPS & Maps Implementation Plan

## 🎯 Project Overview

The GPS & Maps feature will transform the Golf app into a powerful rangefinder and course navigation tool. Users will seamlessly switch between scoring and live course view, with offline satellite imagery and precise distance measurements.

### Core Features
- **Dual View System**: Seamless switching between Scorecard and Map views
- **Offline Maps**: Download and store satellite imagery locally for each course
- **GPS Rangefinder**: Real-time distances to pin, hazards, and layup points
- **Smart Hole Detection**: Automatically detect which hole the player is on
- **Shot Tracking**: Optional GPS tracking of each shot location

### User Experience Goals
- One-tap switching between Scorecard and Map views
- Maps work perfectly offline once downloaded
- Distance updates in real-time as player moves
- Battery-efficient GPS usage
- Clean, uncluttered map interface

---

## 📋 Technical Architecture

### Map Provider Selection
After evaluating options, **MapTiler** is recommended for the following reasons:
- **Free Tier**: 100,000 tile requests/month (sufficient for ~1000 course downloads)
- **Satellite Imagery**: High-quality satellite tiles available
- **Vector Maps**: Option for lighter weight vector tiles
- **Flexible Caching**: Allows offline storage per their terms
- **No Credit Card**: Free tier doesn't require payment info

**Alternative**: Mapbox (50,000 loads/month, requires attribution)

### Key Technologies
- **react-native-maps**: Core mapping library
- **react-native-fs**: File system for storing map tiles
- **react-native-geolocation-service**: Precise GPS tracking
- **react-native-vector-icons**: Map UI icons
- **AsyncStorage**: Map metadata and download status

### Storage Strategy
```
/AppData/GolfApp/Maps/
  └── courses/
      └── {courseId}/
          ├── metadata.json
          ├── holes.json
          └── tiles/
              └── {z}/{x}/{y}.png
```

---

## 🗺️ Implementation Phases

### Phase 3.1: Map Foundation & Basic GPS

#### Step 3.1.1: Map Infrastructure Setup (4-6 hours)
**Goal**: Establish map rendering and navigation structure

- [ ] **3.1.1.1**: Install and configure react-native-maps
  - iOS: Configure Apple Maps
  - Android: Configure Google Maps renderer
  - Test: Basic map renders on both platforms

- [ ] **3.1.1.2**: Create dual-view navigation
  - Add tab bar to ScorecardScreen: [Scorecard | Map]
  - Implement smooth view transitions
  - Maintain state between view switches
  - Test: Seamless switching preserves all data

- [ ] **3.1.1.3**: Setup MapTiler integration
  - Create free MapTiler account
  - Configure API key securely
  - Implement tile URL builder
  - Test: Satellite tiles load correctly

- [ ] **3.1.1.4**: Basic map view component
  - CourseMapView.js with proper styling
  - Zoom controls and compass
  - User location blue dot
  - Test: Map is responsive and intuitive

**Deliverable**: Working map view integrated with scorecard

#### Step 3.1.2: GPS Permissions & Tracking (3-4 hours)
**Goal**: Reliable GPS tracking with proper permissions

- [ ] **3.1.2.1**: Permission management
  - iOS: NSLocationWhenInUseUsageDescription
  - Android: ACCESS_FINE_LOCATION permission
  - Graceful handling of permission denial
  - Settings redirect for denied permissions
  - Test: Permissions work on both platforms

- [ ] **3.1.2.2**: GPS service implementation
  - High-accuracy GPS configuration
  - Battery-efficient update intervals
  - Background location updates (iOS)
  - Foreground service (Android)
  - Test: Accurate location without battery drain

- [ ] **3.1.2.3**: Location state management
  - Redux slice for GPS data
  - Real-time position updates
  - GPS accuracy indicators
  - Signal strength visualization
  - Test: Location updates smoothly

**Deliverable**: Reliable GPS tracking with proper battery management

#### Step 3.1.3: Offline Map Download System (6-8 hours)
**Goal**: Download and store course maps for offline use

- [ ] **3.1.3.1**: Download manager
  - Calculate tiles needed for course bounds
  - Progress tracking and pause/resume
  - Bandwidth-efficient batch downloading
  - Error handling and retry logic
  - Test: Downloads are reliable

- [ ] **3.1.3.2**: Tile storage system
  - Save tiles to device file system
  - Implement file naming convention
  - Storage space calculation
  - Cleanup old/unused tiles
  - Test: Tiles persist across app restarts

- [ ] **3.1.3.3**: Offline map renderer
  - Custom tile provider for local files
  - Fallback to online if needed
  - Seamless online/offline switching
  - Missing tile handling
  - Test: Maps work fully offline

- [ ] **3.1.3.4**: Download UI/UX
  - Course list shows download status
  - Download progress indicators
  - Storage space warnings
  - Bulk download options
  - Test: Clear download management

**Deliverable**: Complete offline map system with download management

#### Step 3.1.4: Course Data Integration (4-5 hours)
**Goal**: Overlay course data on satellite imagery

- [ ] **3.1.4.1**: Hole boundary mapping
  - Define tee box locations
  - Green boundaries and pin positions
  - Fairway boundaries
  - Hazard locations (bunkers, water)
  - Test: Accurate course overlay

- [ ] **3.1.4.2**: Visual course elements
  - Tee markers
  - Green with pin location
  - Hazard highlighting
  - Yardage markers (100, 150, 200)
  - Test: Clear visual hierarchy

- [ ] **3.1.4.3**: Hole detection system
  - GPS-based hole detection
  - Manual hole selection option
  - Automatic progression logic
  - Hole transition notifications
  - Test: Correct hole detection

**Deliverable**: Satellite maps with accurate course overlays

---

### Phase 3.2: Distance Measurements & Rangefinder

#### Step 3.2.1: Distance Calculation Engine (3-4 hours)
**Goal**: Accurate distance measurements in yards/meters

- [ ] **3.2.1.1**: GPS distance algorithms
  - Haversine formula implementation
  - Elevation adjustment calculations
  - Unit conversion (yards/meters)
  - Distance caching for performance
  - Test: Sub-yard accuracy

- [ ] **3.2.1.2**: Key distance points
  - Distance to pin (center/front/back)
  - Distance to hazards
  - Layup distances (100, 150, 200)
  - Distance to green edges
  - Test: All distances accurate

- [ ] **3.2.1.3**: Real-time updates
  - Distance updates as player moves
  - Smooth number transitions
  - Update frequency optimization
  - Battery-efficient calculations
  - Test: Smooth, real-time updates

**Deliverable**: Professional-grade distance measurements

#### Step 3.2.2: Rangefinder UI (4-5 hours)
**Goal**: Clean, glanceable distance display

- [ ] **3.2.2.1**: Distance overlay design
  - Primary distance (to pin) prominent
  - Secondary distances below
  - High contrast for sunlight
  - Adjustable text size
  - Test: Readable in all conditions

- [ ] **3.2.2.2**: Interactive measurements
  - Tap anywhere for distance
  - Drag to measure between points
  - Distance arc visualization
  - Clear measurement UI
  - Test: Intuitive interaction

- [ ] **3.2.2.3**: Smart suggestions
  - Club recommendations based on distance
  - Consider elevation changes
  - Factor in wind (future)
  - Historical performance data
  - Test: Helpful recommendations

**Deliverable**: Professional rangefinder functionality

#### Step 3.2.3: Shot Tracking Integration (4-5 hours)
**Goal**: Optional GPS tracking of every shot

- [ ] **3.2.3.1**: Shot recording UI
  - "Mark Shot" button on map
  - Automatic shot detection (future)
  - Club selection per shot
  - Shot type markers
  - Test: Easy shot marking

- [ ] **3.2.3.2**: Shot visualization
  - Shot trails on map
  - Distance measurements per shot
  - Shot dispersion patterns
  - Color coding by club
  - Test: Clear shot history

- [ ] **3.2.3.3**: Round replay
  - Animated round replay
  - Shot-by-shot breakdown
  - Statistics per hole
  - Export shot data
  - Test: Insightful replay

**Deliverable**: Complete shot tracking system

---

## 🎨 UI/UX Design Specifications

### Map View Layout
```
┌─────────────────────────────┐
│  [Scorecard]    [Map]       │ <- Tab Bar (Active: Map)
├─────────────────────────────┤
│                             │
│      [Satellite Map]        │
│                             │
│         • (You)            │ <- User Location
│          ↓ 156y            │ <- Distance to Pin
│                             │
│         🚩 (Pin)           │
│                             │
│  ◀ Hole 7 ▶   Par 4, 389y  │ <- Hole Info Bar
├─────────────────────────────┤
│ Pin: 156y │ Front: 148y     │ <- Distance Bar
│ Bunker: 127y │ Water: 95y   │
└─────────────────────────────┘
```

### Download Management Screen
```
┌─────────────────────────────┐
│     Course Map Downloads     │
├─────────────────────────────┤
│ Augusta National            │
│ ✓ Downloaded (45 MB)        │
│ [Delete]                    │
├─────────────────────────────┤
│ Pebble Beach               │
│ ○ Not downloaded           │
│ [Download - 52 MB]         │
├─────────────────────────────┤
│ St Andrews                 │
│ ↓ Downloading... 65%       │
│ [Pause]                    │
├─────────────────────────────┤
│ Storage: 142 MB / 500 MB   │
└─────────────────────────────┘
```

---

## 🔧 Technical Implementation Details

### Map Tile Calculation
```javascript
// Calculate tiles needed for a course
function calculateTilesForCourse(bounds, minZoom = 15, maxZoom = 18) {
  const tiles = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const minTile = latLonToTile(bounds.south, bounds.west, z);
    const maxTile = latLonToTile(bounds.north, bounds.east, z);
    
    for (let x = minTile.x; x <= maxTile.x; x++) {
      for (let y = minTile.y; y <= maxTile.y; y++) {
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}
```

### Distance Calculation
```javascript
// Haversine formula for GPS distance
function calculateDistance(lat1, lon1, lat2, lon2, unit = 'yards') {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const meters = R * c;
  return unit === 'yards' ? meters * 1.09361 : meters;
}
```

---

## 📊 Performance Considerations

### Battery Optimization
- GPS updates every 5 seconds when stationary
- GPS updates every 1 second when moving >2mph
- Reduce accuracy when battery <20%
- Stop GPS when app backgrounded >5 minutes

### Storage Management
- Maximum 500MB for map storage by default
- Automatic cleanup of courses not played in 6 months
- Option to increase storage limit in settings
- Clear storage space warnings

### Network Usage
- Download maps only on WiFi by default
- Option to download on cellular
- Pause downloads when switching to cellular
- Resume downloads automatically on WiFi

---

## 🧪 Testing Strategy

### GPS Testing
- Test in urban areas (tall buildings)
- Test in rural areas (weak signal)
- Test with airplane mode (offline)
- Test rapid movement (cart/car)
- Verify accuracy within 3 yards

### Map Testing
- Download interruption recovery
- Offline mode verification
- Different zoom levels
- Pan/scroll performance
- Memory usage monitoring

### Cross-Platform Testing
- iOS 14+ and Android 8+
- Different screen sizes
- Portrait and landscape
- Light and dark themes
- Various GPS chipsets

---

## 📅 Timeline Estimate

### Phase 3.1: Foundation (2-3 weeks)
- Week 1: Map infrastructure and GPS setup
- Week 2: Offline download system
- Week 3: Course data integration and testing

### Phase 3.2: Rangefinder (1-2 weeks)
- Week 4: Distance calculations and UI
- Week 5: Shot tracking and polish

**Total: 4-5 weeks for complete GPS/Maps implementation**

---

## 🚀 Future Enhancements

### Phase 3.3 (Future)
- Elevation profiles
- Wind speed/direction integration
- 3D course flyovers
- AR distance overlay (camera view)
- Social features (see friends on course)
- Live tournament tracking
- Pace of play optimization
- AI caddie suggestions

### Phase 3.4 (Future)
- Course condition updates
- Pin position sharing
- Hazard warnings
- Cart path notifications
- Food/beverage ordering
- Score betting/games
- Virtual coach overlay

---

## ✅ Success Criteria

1. **Accuracy**: GPS distances within 3 yards of laser rangefinder
2. **Performance**: Map loads in <2 seconds, smooth 60fps scrolling
3. **Reliability**: Works offline after initial download
4. **Battery**: <10% battery drain per 18-hole round
5. **Storage**: <100MB per course for map data
6. **Usability**: Users can get distances with one tap

---

## 🎯 Implementation Decisions (2025-01-15)

### **Final Architecture Decisions**
1. **Navigation**: Material Design - `@react-navigation/material-top-tabs`
2. **Refactoring**: Option A - Split massive ScorecardScreen into multiple components
3. **Map Provider**: MapTiler - 100k tiles/month free tier with excellent satellite imagery
4. **Implementation**: Step-by-step approach with continuous testing

### **Current ScorecardScreen Analysis**
- **File Size**: 35,000+ tokens - requires refactoring
- **Dependencies**: `react-native-maps` already installed ✅
- **Navigation**: Currently uses stack navigation only
- **State Management**: Extensive state for scores, clubs, holes, statistics
- **No existing map code**: Clean slate for integration

### **Refactoring Strategy**
```
screens/rounds/
├── ScorecardScreen.js (becomes tab container)
├── components/
│   ├── ScorecardView.js (extracted current scorecard UI)
│   ├── MapView.js (new map component)
│   ├── SharedHeader.js (header with back/settings)
│   └── TabContainer.js (manages shared state)
```

## 🎯 Implementation Progress

### **Phase 3.1.1: Map Infrastructure Setup**
- [x] **3.1.1.1**: Install and configure react-native-maps
  - ✅ @react-navigation/material-top-tabs installed
  - ✅ react-native-maps already available
  - ✅ react-native-permissions for location access
- [x] **3.1.1.2**: Create dual-view navigation with Material Design tabs
  - ✅ Created ScorecardContainer.js with Material Design tabs
  - ✅ Refactored original ScorecardScreen (35k+ tokens → clean structure)
  - ✅ Created SharedHeader.js for common navigation
  - ✅ Created ScorecardView.js with extracted scorecard logic
  - ✅ Created MapView.js with basic map functionality
- [ ] **3.1.1.3**: Setup MapTiler integration
- [ ] **3.1.1.4**: Basic map view component enhancements

**Current Status**: Step 3.1.1.2 Complete - Fixed component issues, ready for testing

### **Recent Fixes Applied**:
- ✅ Fixed MapView import and component naming conflicts
- ✅ Cleaned up unnecessary fallback logic (MapView imports correctly)
- ✅ Added SafeAreaView to SharedHeader for proper layout  
- ✅ Corrected tab navigation component references
- ✅ Removed excessive console logging

**Testing Status**: Ready for dual-view functionality testing

## 🎯 Next Immediate Steps

1. **Git Commit**: Save current working state with "Working Before GPSMaps"
2. **Install Dependencies**: `@react-navigation/material-top-tabs`
3. **Refactor ScorecardScreen**: Extract components for better maintainability
4. **Create MapTiler Account**: Setup API key and test satellite tiles
5. **Basic Map Integration**: Add tab navigation and basic map view

Remember: This is a premium feature that will differentiate the app. Take time to get the UX perfect - golfers will use this dozens of times per round.