# PostGIS Transform Implementation Plan

## Overview
Create a transformation layer to bridge the gap between the mobile app's coordinate format and the backend's PostGIS format, allowing seamless synchronization while maintaining database integrity.

## Problem Statement
- **Mobile App**: Uses nested coordinate objects with `latitude`, `longitude` fields
- **Backend Database**: Uses PostGIS strings like `POINT(longitude latitude)`
- **Need**: Bidirectional transformation without changing either system

## Architecture Decision
We will implement adapter functions in the sync endpoints that:
1. Accept mobile app's JSON format
2. Transform to PostGIS format for database storage
3. Transform back to JSON format when retrieving data
4. Handle all coordinate-based fields across different models

## Technical Implementation

### Coordinate Format Examples
```javascript
// Mobile App Format
{
  coordinates: {
    latitude: 33.5031,
    longitude: -82.0206,
    accuracy: 5,
    timestamp: "2025-01-17T15:33:07.655Z"
  }
}

// PostGIS Format (Note: longitude comes first)
{
  position: "POINT(-82.0206 33.5031)"
}
```

### Models Requiring Transformation

#### 1. Shot Model
- Mobile: `coordinates` → PostGIS: `startPosition` and `endPosition`
- Need to determine shot endpoints from GPS tracking data

#### 2. CourseFeature Model  
- Mobile: `coordinates` → PostGIS: `centerPoint`
- Mobile: `boundary[]` → PostGIS: `boundary` (polygon)

#### 3. PinPosition Model
- Mobile: `coordinates` → PostGIS: `position`

## Implementation Tasks

### Phase 1: Utility Functions
- [x] Create `/backend/src/utils/postgisTransform.ts`
  - [x] `coordinatesToPoint(lat, lng): string` - Convert to POINT
  - [x] `pointToCoordinates(point): {lat, lng}` - Convert from POINT
  - [x] `coordinatesToPolygon(coords[]): string` - Convert to POLYGON
  - [x] `polygonToCoordinates(polygon): coords[]` - Convert from POLYGON
  - [x] `validateCoordinates(lat, lng): boolean` - Validate GPS coordinates
  - [x] Add error handling for invalid formats

### Phase 2: Update Sync Routes
- [x] Update `/backend/src/routes/syncRoutes.ts`
  - [x] Import transformation utilities
  - [x] Create POST `/api/sync/shots` endpoint
    - [x] Accept mobile shot format
    - [x] Transform coordinates to PostGIS points
    - [x] Handle shot trajectory (start/end positions)
    - [x] Save using Prisma with correct schema
  - [x] Create POST `/api/sync/course-learning` endpoint
    - [x] Accept mobile course knowledge format
    - [x] Transform tee box coordinates
    - [x] Transform pin positions
    - [x] Transform green boundaries
    - [x] Handle data aggregation/conflict resolution

### Phase 3: Data Validation & Error Handling
- [ ] Add validation middleware
  - [ ] Validate coordinate ranges (-90 to 90 lat, -180 to 180 lng)
  - [ ] Validate required fields
  - [ ] Validate data types
- [ ] Add comprehensive error responses
  - [ ] Invalid coordinate format
  - [ ] Missing required fields
  - [ ] Database constraints

### Phase 4: Testing & Verification
- [ ] Test shot sync with mobile app
  - [ ] Verify coordinates are transformed correctly
  - [ ] Check database storage
  - [ ] Confirm mobile app receives data
- [ ] Test course learning sync
  - [ ] Verify all geometric types work
  - [ ] Test data aggregation
  - [ ] Confirm round-trip transformation

### Phase 5: Documentation
- [ ] Document API endpoints
  - [ ] Request/response formats
  - [ ] Transformation examples
  - [ ] Error codes
- [ ] Add inline code comments
- [ ] Update mobile app documentation

## API Endpoint Specifications

### POST /api/sync/shots
**Request:**
```json
{
  "shots": [{
    "roundId": "uuid",
    "holeNumber": 1,
    "shotNumber": 1,
    "coordinates": {
      "latitude": 33.5031,
      "longitude": -82.0206,
      "accuracy": 5
    },
    "clubId": "driver",
    "distanceToNext": 250
  }]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 1,
    "errors": []
  }
}
```

### POST /api/sync/course-learning
**Request:**
```json
{
  "courseId": "uuid",
  "knowledge": {
    "holes": [{
      "holeNumber": 1,
      "teeBoxes": [{
        "color": "white",
        "coordinates": {
          "latitude": 33.5031,
          "longitude": -82.0206
        },
        "confidence": 0.8
      }],
      "pin": {
        "current": {
          "latitude": 33.5051,
          "longitude": -82.0186
        }
      },
      "green": {
        "boundary": [
          {"latitude": 33.5051, "longitude": -82.0186},
          {"latitude": 33.5052, "longitude": -82.0185},
          {"latitude": 33.5051, "longitude": -82.0184}
        ]
      }
    }]
  }
}
```

## Error Handling Strategy
1. Validate input format before transformation
2. Catch PostGIS format errors
3. Provide meaningful error messages
4. Log transformation failures for debugging
5. Graceful fallbacks for missing data

## Future Considerations
- Add support for PostGIS geographic queries
- Implement geofencing for course boundaries
- Add elevation data support
- Consider GeoJSON format for complex geometries