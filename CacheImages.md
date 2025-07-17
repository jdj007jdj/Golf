# Persistent Tile Cache Implementation Plan

## Overview
Implement a persistent tile caching system that survives app restarts, using SQLite for storage and maintaining the existing in-memory cache for performance.

## Architecture

### Three-Tier Cache System
1. **Memory Cache (L1)** - Current LRU cache for instant access
2. **SQLite Cache (L2)** - Persistent storage for tile data
3. **Network (L3)** - Fetch from MapTiler when not cached

### Data Flow
```
Request Tile → Check Memory → Check SQLite → Fetch Network
                    ↓              ↓              ↓
                 Return      Load to Memory    Store Both
```

## Technical Design

### SQLite Schema
```sql
CREATE TABLE tile_cache (
  key TEXT PRIMARY KEY,          -- e.g., "18-71343-105149"
  data TEXT NOT NULL,            -- Base64 encoded image
  zoom INTEGER NOT NULL,         -- Zoom level for cleanup
  last_accessed INTEGER NOT NULL, -- Unix timestamp
  size INTEGER NOT NULL,         -- Size in bytes
  created_at INTEGER NOT NULL    -- Unix timestamp
);

CREATE INDEX idx_last_accessed ON tile_cache(last_accessed);
CREATE INDEX idx_zoom ON tile_cache(zoom);
```

### Storage Limits
- **Memory Cache**: 200 tiles (~20MB) - Fixed for performance
- **SQLite Cache**: User configurable
  - Default: 100MB
  - Minimum: 0MB (disable persistent cache)
  - Maximum: 1GB
  - Settings options: Off, 50MB, 100MB, 200MB, 500MB, 1GB
- **Auto-cleanup**: Remove tiles based on LRU when limit reached
- **Zoom-based cleanup**: Prioritize current zoom ±2 levels
- **Time-based cleanup**: Optional, user configurable (7, 30, 90 days, or never)

## Implementation Tasks

### Phase 1: SQLite Infrastructure
- [x] Create SQLite database service
  - [x] Database initialization with schema
  - [x] CRUD operations for tiles
  - [x] Transaction support for batch operations
  - [x] Error handling and recovery

### Phase 2: Persistent Cache Layer
- [x] Create PersistentTileCache class
  - [x] Extends current TileCache functionality
  - [x] Manages SQLite operations
  - [x] Implements storage limits
  - [x] Handles cache migrations

### Phase 3: Integration
- [x] Update TileImage component
  - [x] Check persistent cache before network
  - [x] Store successful fetches to SQLite
  - [x] Handle loading states for DB operations
  
- [x] Update cache statistics
  - [x] Track SQLite hits/misses
  - [x] Monitor storage usage
  - [x] Display in debug overlay

### Phase 4: Cache Management
- [ ] Implement cleanup strategies
  - [ ] LRU eviction for SQLite
  - [ ] Zoom-based prioritization
  - [ ] Time-based expiration
  - [ ] Storage limit enforcement

- [ ] Add cache controls
  - [ ] Storage limit selector in settings
    - [ ] Dropdown with size options (Off, 50MB, 100MB, 200MB, 500MB, 1GB)
    - [ ] Current usage display (e.g., "Using 45MB of 100MB")
    - [ ] Visual progress bar
  - [ ] Cache expiration settings
    - [ ] Options: 7 days, 30 days, 90 days, Never
    - [ ] Default: 30 days
  - [ ] Clear cache button
    - [ ] Confirmation dialog
    - [ ] Show amount to be cleared
  - [ ] Cache statistics
    - [ ] Total tiles cached
    - [ ] Storage used
    - [ ] Oldest/newest tile dates
  - [ ] Preload area functionality
    - [ ] "Download visible area" button
    - [ ] "Download current hole" option
    - [ ] Progress indicator during download

### Phase 5: Optimization
- [ ] Performance tuning
  - [ ] Batch SQLite operations
  - [ ] Async loading with priorities
  - [ ] Background cleanup tasks
  
- [ ] Offline support
  - [ ] Preload regions for offline use
  - [ ] Show cached area boundaries
  - [ ] Handle offline mode gracefully

### Phase 6: Testing & Polish
- [ ] Unit tests for cache operations
- [ ] Integration tests for three-tier system
- [ ] Performance benchmarking
- [ ] Error recovery testing
- [ ] Migration testing (app updates)

## Settings UI Design

### Cache Settings Screen
```
Offline Map Storage
├─ Storage Limit          [Dropdown: 100MB ▼]
│   └─ Currently using 45MB of 100MB [████░░░░░░]
├─ Auto-delete old tiles  [Dropdown: After 30 days ▼]
├─ Cache Statistics
│   ├─ Total tiles: 450
│   ├─ Storage used: 45MB
│   └─ Date range: Oct 15 - Jan 16
└─ Actions
    ├─ [Clear All Cache]
    └─ [Download Visible Area]
```

### Implementation in SettingsContext
```javascript
// Default settings
{
  mapCache: {
    storageLimit: 100 * 1024 * 1024, // 100MB in bytes
    expirationDays: 30, // 0 = never expire
    enabled: true
  }
}
```

## Key Decisions

### Why SQLite over AsyncStorage?
- AsyncStorage has size limits (~6MB on Android)
- SQLite handles large binary data efficiently
- Better query capabilities for cache management
- Indexed access for performance

### Why Base64 over File System?
- No additional dependencies (react-native-fs)
- Cross-platform consistency
- Simpler permission management
- Already working in our current system

### Cache Warming Strategy
- Load nearby tiles into memory on app start
- Preload tiles for current location
- Background load adjacent zoom levels
- Respect user's storage limit settings

### User Storage Management
- **Real-time monitoring**: Show current usage in settings
- **Smart eviction**: When approaching limit, remove oldest unused tiles
- **User warnings**: Notify when cache is 90% full
- **Graceful degradation**: Continue working when cache is full (network only for new tiles)

## Success Criteria
1. Tiles persist across app restarts
2. No performance degradation vs memory-only cache
3. Automatic cleanup keeps storage under control
4. Seamless offline experience for cached areas
5. Clear user feedback on cache status

## Risk Mitigation
- **Database corruption**: Implement recovery mechanism
- **Storage full**: Graceful degradation, clear old tiles
- **Migration issues**: Version database schema
- **Performance impact**: Extensive benchmarking

## Future Enhancements
- Export/import cached regions
- Cloud backup of cached areas
- Predictive caching based on user patterns
- Compression for better storage efficiency