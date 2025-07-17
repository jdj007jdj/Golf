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

#### Course Learning Model
```javascript
{
  courseId: string,
  holes: [{
    holeNumber: number,
    teeBoxes: [{
      color: string,
      coordinates: { lat, lng },
      confidence: number, // 0-1 based on data points
      samples: number
    }],
    pin: {
      coordinates: { lat, lng },
      confidence: number,
      samples: number,
      variations: [{ lat, lng, date }] // pin position changes
    },
    hazards: [{
      type: string,
      coordinates: [{ lat, lng }],
      confidence: number
    }]
  }]
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

### Phase 2: Map Visualization
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
- [ ] Implement shot selection/details

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

### Phase 5: Course Learning
- [ ] Implement tee box detection algorithm
- [ ] Create pin position detection
- [ ] Build confidence scoring system
- [ ] Add course update mechanism
- [ ] Create admin review interface

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