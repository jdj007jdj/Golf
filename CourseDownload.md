# Course Download Feature - Implementation Plan

## 🎯 Overview
Implement a touch-to-select tile download system for offline course maps. Users will view courses at zoom level 15 and touch areas to select zoom level 18 tiles for download.

## 📋 Technical Approach
- Display map at zoom level 15 for course overview
- Touch to select/deselect individual zoom level 18 tiles
- Visual overlay showing selected tiles
- Use existing PersistentTileCache for storage
- Track downloaded areas per course

## ✅ Implementation Tasks

### Phase 1: Core Infrastructure (Day 1)

#### 1.1 Navigation Setup
- [x] Add "Download Maps" option to course-related screens
- [x] Create navigation route to CourseDownloadScreen
- [x] Pass course center coordinates to screen
- [x] Add back navigation and title

#### 1.2 Create CourseDownloadScreen Base
- [x] Create new screen component file
- [x] Setup basic layout (header, map, footer)
- [x] Import MapViewWithGestures component
- [x] Initialize with course center at zoom 15
- [x] Add loading states and error handling

#### 1.3 Tile Calculation Utilities
- [x] Create utils/tileCalculations.js
- [x] Implement lat/lon to tile coordinate conversion
- [x] Implement tile to lat/lon bounds conversion
- [x] Calculate zoom 18 tile from zoom 15 touch point
- [x] Add tile key generation (z/x/y format)

### Phase 2: Selection System (Day 1-2)

#### 2.1 Touch Selection Logic
- [ ] Implement onPress handler for map
- [ ] Convert touch coordinates to zoom 18 tile
- [ ] Toggle tile selection state (Set data structure)
- [ ] Handle multi-touch for faster selection
- [ ] Add haptic feedback on selection

#### 2.2 Visual Tile Overlay
- [ ] Render selected tiles as map polygons
- [ ] Use semi-transparent green fill
- [ ] Add border for clarity
- [ ] Optimize rendering for many tiles
- [ ] Handle overlay updates efficiently

#### 2.3 Selection Tools
- [ ] Add "Clear All" button
- [ ] Add "Select Visible" for current viewport
- [ ] Implement undo/redo functionality
- [ ] Add selection counter display
- [ ] Calculate and show estimated download size

### Phase 3: Download Integration (Day 2)

#### 3.1 Progress Tracking
- [ ] Create download progress modal
- [ ] Track individual tile download progress
- [ ] Show overall percentage complete
- [ ] Handle download cancellation
- [ ] Implement retry logic for failures

#### 3.2 PersistentTileCache Integration
- [ ] Create batch download method
- [ ] Generate MapTiler URLs for selected tiles
- [ ] Use existing cache storage methods
- [ ] Respect storage limits from settings
- [ ] Handle storage full scenarios

#### 3.3 Download Management
- [ ] Save download metadata to AsyncStorage
- [ ] Track which tiles belong to which course
- [ ] Implement course-specific cache clearing
- [ ] Add download history/status
- [ ] Handle app suspension during download

### Phase 4: User Experience (Day 2-3)

#### 4.1 Enhanced Selection
- [ ] Add swipe-to-select multiple tiles
- [ ] Implement zoom in/out while maintaining selection
- [ ] Add grid lines option to show tile boundaries
- [ ] Color code already cached vs new tiles
- [ ] Add selection templates (front 9, back 9, etc)

#### 4.2 Course Management
- [ ] Create "My Offline Courses" screen
- [ ] List downloaded courses with storage info
- [ ] Show download completeness per course
- [ ] Add re-download missing tiles option
- [ ] Implement course data export/import

#### 4.3 Smart Features
- [ ] Auto-suggest tiles based on typical play patterns
- [ ] Detect and highlight likely fairway areas
- [ ] Add "Download along route" for walking path
- [ ] Estimate download time based on connection
- [ ] Add download scheduling options

### Phase 5: Settings Integration (Day 3)

#### 5.1 Settings Updates
- [ ] Add download preferences to Map Cache settings
- [ ] WiFi-only download option
- [ ] Auto-download quality settings
- [ ] Maximum tiles per course limit
- [ ] Background download settings

#### 5.2 Storage Management
- [ ] Show storage breakdown by course
- [ ] Add course-specific delete options
- [ ] Implement smart cleanup (remove unused courses)
- [ ] Add storage alerts and warnings
- [ ] Create backup/restore functionality

## 🎨 UI Design

### Screen Layout
```
┌─────────────────────────────┐
│ ← Back   Download Maps   ⚙️ │
├─────────────────────────────┤
│ Touch areas to download     │
│ (Zoom 18 tiles selected)    │
├─────────────────────────────┤
│                             │
│                             │
│      [Map View z15]         │
│                             │
│      ▓▓▓▓▓                 │ ← Selected tiles
│      ▓▓▓▓▓▓▓               │   shown in green
│        ▓▓▓                  │
│                             │
├─────────────────────────────┤
│ 24 tiles selected (~30 MB)  │
├─────────────────────────────┤
│ [Clear] [Select All] [Download] │
└─────────────────────────────┘
```

## 📊 Technical Specifications

### Tile Calculation Formula
```javascript
// Convert lat/lon to tile coordinates
function latLonToTile(lat, lon, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const y = Math.floor(
    (1 - Math.log(
      Math.tan(lat * Math.PI / 180) + 
      1 / Math.cos(lat * Math.PI / 180)
    ) / Math.PI) / 2 * n
  );
  return { x, y, z: zoom };
}
```

### Storage Structure
```
AsyncStorage:
  - course_download_metadata_{courseId}
    - selectedTiles: ['18/123/456', '18/123/457', ...]
    - downloadDate: timestamp
    - totalSize: bytes
    - tileCount: number

PersistentTileCache:
  - Existing SQLite storage
  - Tiles stored with metadata
  - Automatic size management
```

## 🚀 Success Metrics
- Users can select and download specific course areas
- Download size is predictable (~50KB per tile)
- Selection UI is intuitive and responsive
- Downloads work offline after initial fetch
- Storage is efficiently managed

## 📝 Notes
- Zoom 18 provides ~2-4 meter resolution
- Average 18-hole course needs 200-400 tiles
- Total size typically 10-20MB per course
- Consider adding compression in future
- May add vector data overlay later