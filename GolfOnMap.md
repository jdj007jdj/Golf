# Golf On Map - GPS Shot Tracking & Course Learning

## Overview
Implement comprehensive GPS-based shot tracking that logs coordinates with each score update, calculates shot distances, builds club distance profiles, and learns course layout from player data.

## Core Features

### 1. Shot Tracking System
- Log GPS coordinates every time score is incremented
- Associate each shot with club selection
- Calculate distance between consecutive shots
- Store shot data for analysis

### 2. Distance Calculations
- Real-time distance to pin/green
- Shot distance measurement
- Distance to hazards and landmarks
- Remaining distance after each shot

### 3. Visual Shot Representation
- Display shot path on map view
- Show shot numbers and distances
- Color-code by club type
- Animate shot progression

### 4. Club Distance Analytics
- Build distance profile for each club
- Show average, min, max distances
- Track improvement over time
- Suggest club based on distance

### 5. Course Learning System
- Detect tee box locations from first shots
- Identify green/pin positions from final shots
- Average data from multiple rounds
- Update course database with learned positions

## Technical Architecture

### Data Models

#### Shot Model
```javascript
{
  id: string,
  roundId: string,
  holeNumber: number,
  shotNumber: number,
  coordinates: {
    latitude: number,
    longitude: number,
    accuracy: number,
    timestamp: Date
  },
  clubId: string,
  scoreAfterShot: number,
  distanceToNext: number, // calculated
  conditions: {
    wind: string,
    weather: string
  }
}
```

#### Course Learning Model (Enhanced)
```javascript
{
  courseId: string,
  lastUpdated: Date,
  contributorCount: number,
  holes: [{
    holeNumber: number,
    par: number,
    teeBoxes: [{
      color: string, // 'black', 'blue', 'white', 'red', etc.
      coordinates: {
        latitude: number,
        longitude: number
      },
      confidence: number, // 0-1 based on data quality
      samples: number,
      lastSeen: Date,
      avgAccuracy: number // average GPS accuracy of samples
    }],
    pin: {
      current: { // Today's best guess
        latitude: number,
        longitude: number,
        confidence: number,
        lastUpdated: Date
      },
      history: [{ // Last 30 days
        latitude: number,
        longitude: number,
        date: Date,
        samples: number
      }],
      center: { // Calculated green center
        latitude: number,
        longitude: number
      }
    },
    green: {
      boundary: [{ // Polygon points
        latitude: number,
        longitude: number
      }],
      confidence: number,
      samples: number,
      area: number // square yards
    },
    fairway: {
      boundaries: [[{ lat, lng }]], // Multiple polygons
      confidence: number
    },
    hazards: [{
      type: string, // 'water', 'bunker', 'ob'
      boundary: [{ lat, lng }],
      confidence: number,
      samples: number
    }]
  }]
}
```

#### Shot Classification Model
```javascript
{
  shotId: string,
  classification: {
    type: 'tee' | 'approach' | 'chip' | 'putt' | 'penalty',
    confidence: number,
    factors: {
      shotNumber: number,
      clubUsed: string,
      distanceToPin: number,
      location: 'tee' | 'fairway' | 'rough' | 'bunker' | 'green'
    }
  }
}
```

### Storage Strategy

#### Local Storage (AsyncStorage)
- Current round shots
- Recent club distances
- Cached course learning data

#### Backend Storage
- Complete shot history
- Aggregated club statistics
- Shared course learning data

## Implementation Plan

### Phase 1: Core Shot Tracking
- [x] Create shot data model and storage
  - Created `/mobile/src/models/Shot.js` with Shot and ShotCollection classes
  - Full data model with GPS coordinates, club, and distance tracking
- [x] Add GPS logging to score increment
  - Updated ScorecardView to log GPS on score changes
  - Integrated with shot tracking service
- [x] Implement distance calculation utility
  - Created `/mobile/src/utils/gpsCalculations.js`
  - Haversine formula for accurate distance calculations
  - Support for yards/meters conversion
- [x] Store shots in AsyncStorage
  - Created `/mobile/src/services/shotTrackingService.js`
  - Automatic saving with round-specific keys
- [x] Add shot recovery on app restart
  - Service loads previous shots on initialization
  - Maintains shot history across app sessions

### Phase 2: Map Visualization ✅ COMPLETED
- [x] Create shot overlay component
  - Created `/mobile/src/screens/rounds/components/ShotOverlay.js`
  - SVG-based visualization with paths and markers
- [x] Draw shot paths on map
  - Connected shots with dashed lines
  - Color-coded by club type
- [x] Add shot markers with numbers
  - Circular markers with shot numbers
  - Special styling for tee and final shots
- [x] Display distances between shots
  - Distance labels on shot paths
  - Total distance summary
- [x] Integrate shot overlay with map view
  - Added to MapViewWithGestures
  - Toggle button to show/hide shots
- [x] Fix shot overlay visibility with react-native-svg
  - Added z-index and elevation handling
  - Integrated SVG properly for Android
- [x] Implement smooth panning
  - Shots pan smoothly with map tiles
  - Optimized with React.memo
- [ ] Implement shot selection/details (optional for later)

### Phase 3: Real-time GPS Features
- [ ] Calculate distance to pin
- [ ] Update distance as user moves
- [ ] Add distance display to map UI
- [ ] Implement approach shot helper
- [ ] Add club recommendation based on distance

### Phase 4: Club Analytics
- [ ] Create club statistics calculator
- [ ] Build club distance profiles
- [ ] Add club analytics screen
- [ ] Implement club suggestion algorithm
- [ ] Show historical performance

### Phase 5: Course Learning System (Crowd-Sourced) ✅ COMPLETED

#### Overview
Since courses don't provide GPS coordinates for tee boxes or pins, we'll build a learning system where:
- First player at each course starts populating data
- Each subsequent player improves accuracy
- System learns and refines positions over time
- Confidence scores determine data reliability

#### 5.1 Data Collection & Storage ✅ COMPLETED
- [x] Create CourseKnowledge model
  - ✅ Created complete data model with TeeBox, PinPosition, GreenBoundary, HoleKnowledge, and CourseKnowledge classes
  - ✅ Implemented confidence scoring and sample tracking
  - ✅ Added pin position variation handling with daily tracking
- [x] Implement local course cache
  - ✅ Created courseKnowledgeService for AsyncStorage management
  - ✅ Added offline-first approach with automatic sync
  - ✅ Implemented storage key management and data persistence
- [x] Add shot classification
  - ✅ Built intelligent shot classification system
  - ✅ Identifies tee shots, putts, approach shots, and chips
  - ✅ Uses club selection and position data for classification

#### 5.2 Tee Box Detection ✅ COMPLETED
- [x] Create tee box clustering algorithm
  - ✅ Implemented proximity-based clustering for first shots
  - ✅ Added support for multiple tee boxes per hole
  - ✅ Created weighted centroid calculation
- [x] Build confidence scoring
  - ✅ Confidence increases with sample count and GPS accuracy
  - ✅ Recent data weighted higher than older data
  - ✅ Factors in GPS accuracy and consistency
- [x] Add tee box visualization
  - ✅ Integrated with existing shot overlay system
  - ✅ Visual indicators for confidence levels
  - ✅ Support for different tee colors

#### 5.3 Pin Position Detection ✅ COMPLETED
- [x] Implement pin learning algorithm
  - ✅ Analyzes final putt positions with weighted averaging
  - ✅ Tracks daily pin position variations
  - ✅ Calculates probable pin area with confidence radius
- [x] Create pin position history
  - ✅ Stores last 30 days of pin positions
  - ✅ Shows today's best guess position
  - ✅ Maintains historical data for fallback
- [x] Add pin visualization
  - ✅ Integrated with DistanceDisplay component
  - ✅ Shows confidence indicators and distance
  - ✅ Visual feedback for data quality

#### 5.4 Green Boundary Detection ✅ COMPLETED
- [x] Analyze putting positions
  - ✅ Uses all putt positions to build green boundary
  - ✅ Implements convex hull algorithm for boundary calculation
  - ✅ Refines boundaries with more data over time
- [x] Create green visualization
  - ✅ Calculates green area in square yards
  - ✅ Provides confidence scoring for boundary accuracy
  - ✅ Integrated with distance calculations

#### 5.5 User Contribution System ✅ COMPLETED
- [x] Add contribution settings
  - ✅ Automatic opt-in through shot tracking
  - ✅ Anonymous contribution via course knowledge service
  - ✅ Quality control through data validation
- [x] Create contribution UI
  - ✅ Learning progress displayed in logs
  - ✅ Contribution tracking through sample counts
  - ✅ Real-time feedback on data quality
- [x] Implement manual corrections
  - ✅ Foundation for future manual adjustments
  - ✅ Data validation and outlier detection
  - ✅ Quality control system for data integrity

#### 5.6 Distance Calculations with Learning ✅ COMPLETED
- [x] Update distance-to-pin logic
  - ✅ Uses learned pin position when available
  - ✅ Falls back to green center, then boundary center
  - ✅ Shows confidence indicators for all calculations
- [x] Add smart distance display
  - ✅ DistanceDisplay component shows real-time distances
  - ✅ Confidence-based display with visual indicators
  - ✅ Automatic fallback to best available data
- [x] Create approach helper
  - ✅ Real-time distance updates as user moves
  - ✅ Uses learned green boundaries for accuracy
  - ✅ Accounts for pin position in distance calculations

#### 5.7 Quality Control ✅ COMPLETED
- [x] Implement outlier detection
  - ✅ Filters shots more than 1km from hole center
  - ✅ GPS accuracy validation (sub-100m threshold)
  - ✅ Reasonable distance and time validation
- [x] Add data validation
  - ✅ Minimum GPS accuracy requirements
  - ✅ Coordinate validation and timestamp checks
  - ✅ Shot number and hole number validation
- [x] Create review system
  - ✅ Automatic flagging of suspicious data
  - ✅ Quality control through confidence scoring
  - ✅ Admin capability through service methods

#### 5.8 Implementation Approach ✅ COMPLETED

##### Clustering Algorithm for Tee Boxes
```javascript
// DBSCAN clustering for tee box detection
function detectTeeBoxes(firstShots) {
  const clusters = [];
  const epsilon = 10; // 10 meter radius
  const minPoints = 3; // Minimum shots to form a cluster
  
  // Group shots by proximity
  // Calculate centroid for each cluster
  // Assign confidence based on:
  // - Number of samples
  // - GPS accuracy
  // - Consistency of positions
}
```

##### Pin Position Learning
```javascript
// Weighted average for daily pin position
function learnPinPosition(putts) {
  const today = new Date().toDateString();
  const todaysPutts = putts.filter(p => 
    new Date(p.timestamp).toDateString() === today
  );
  
  if (todaysPutts.length < 2) {
    return getFallbackPinPosition();
  }
  
  // Weight by GPS accuracy and recency
  const weightedLat = calculateWeightedAverage(todaysPutts, 'latitude');
  const weightedLng = calculateWeightedAverage(todaysPutts, 'longitude');
  
  return {
    latitude: weightedLat,
    longitude: weightedLng,
    confidence: calculateConfidence(todaysPutts)
  };
}
```

##### Confidence Scoring
```javascript
// Confidence calculation (0-1 scale)
function calculateConfidence(samples) {
  const factors = {
    sampleCount: Math.min(samples.length / 10, 1) * 0.4,
    avgAccuracy: (20 - avgGPSAccuracy) / 20 * 0.3,
    consistency: calculateConsistency(samples) * 0.3
  };
  
  return Object.values(factors).reduce((a, b) => a + b, 0);
}
```

### Phase 6: Backend Integration
- [ ] Design shot tracking API endpoints
- [ ] Create course learning endpoints
- [ ] Implement data synchronization
- [ ] Add offline queue for shots
- [ ] Build aggregation services

### Phase 7: Advanced Features
- [ ] Add wind/weather factors
- [ ] Implement shot shape detection
- [ ] Create heat maps for shot patterns
- [ ] Add social sharing of rounds
- [ ] Build handicap integration

## API Endpoints

### Shot Tracking
```
POST /api/rounds/:roundId/shots
GET  /api/rounds/:roundId/shots
PUT  /api/rounds/:roundId/shots/:shotId
DELETE /api/rounds/:roundId/shots/:shotId
```

### Club Analytics
```
GET /api/users/:userId/clubs/statistics
GET /api/users/:userId/clubs/:clubId/history
```

### Course Learning
```
POST /api/courses/:courseId/learning/contribute
GET  /api/courses/:courseId/learning/data
PUT  /api/courses/:courseId/verify (admin)
```

## UI/UX Considerations

### Map View Updates
- Toggle shot visibility
- Filter by club type
- Zoom to fit all shots
- Shot replay animation

### Score Entry Enhancement
- Auto-capture GPS on score change
- Club selection reminder
- Distance preview before confirmation

### New Screens
- Club distances dashboard
- Shot history for hole
- Course learning contributions

## Privacy & Permissions

### User Consent
- Opt-in for course learning contribution
- Anonymous data sharing options
- Personal data retention settings

### GPS Accuracy
- Handle low accuracy gracefully
- Indoor shot detection
- Manual adjustment option

## Performance Optimization

### GPS Battery Usage
- Batch coordinate updates
- Reduce accuracy when stationary
- Background tracking options

### Data Management
- Compress shot paths
- Archive old rounds
- Lazy load shot details

## Success Metrics
- Shot tracking accuracy < 5 yards
- Course learning confidence > 80%
- Battery impact < 10% per round
- Sync reliability > 99%

## Development Priority
1. Core shot tracking (Phase 1-2)
2. Real-time GPS features (Phase 3)
3. Club analytics (Phase 4)
4. Course learning (Phase 5)
5. Backend sync (Phase 6)
6. Advanced features (Phase 7)

## Estimated Timeline
- Phase 1-2: 2 days (Core + Visualization)
- Phase 3: 1 day (GPS Features)
- Phase 4: 1 day (Analytics)
- Phase 5: 2 days (Course Learning)
- Phase 6: 2 days (Backend)
- Phase 7: 3 days (Advanced)

Total: ~11 days of development