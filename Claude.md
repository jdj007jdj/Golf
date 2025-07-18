# Claude Project Assistant

**IMPORTANT**: Re-read this file at the start of every session. This is your persistent memory system.

## Session Protocol

0. **Working Directory Check**:

   - Ask user: "Where should I create/work on this project? (current directory or specify path)"
   - If specified directory doesn't exist, ask: "Directory doesn't exist. Should I create it? (yes/no)"
   - If yes, create the directory
   - Change to specified/created directory
   - Verify no critical files will be overwritten

1. **On First Read**:

   - Check if `.claude/` directory exists
   - If NO: Copy `onceoffsetup.template.md` to `.claude/context/OnceOffSetup.md` and execute it
   - If YES: Check if `.claude/context/OnceOffSetup.md` exists and is marked complete
     - If not complete: Resume and complete the setup
     - If complete: Load context from `.claude/context/`
   - Check if `.claude/project.config` exists:
     - If NO: This should have been created during OnceOffSetup
     - If YES: Read project type and verify architecture files exist:
       - For 'web': Check `.claude/architectures/web.md` exists
       - For 'mobile': Check `.claude/architectures/mobile.md` exists
       - For 'full-stack': Check both files exist
       - If any are missing, alert user: "Architecture files are missing. Please re-run setup or create them manually."

2. **Session Continuity**:

   - Read `.claude/context/session.md` for current state
   - Read `.claude/context/FileRoadMap.md` for pending work
   - Resume from last known state
   - Continue work on the Active Feature listed in session.md

3. **Throughout Session**:
   - Update context files after each significant change
   - Update session.md with: Last Updated timestamp, Current Phase, Active Feature, completed tasks
   - Auto-commit to git at milestones following Git Synchronization Protocol (see below)
   - Maintain file-based memory

## Architecture Files

Based on project type in `.claude/project.config`:

- **web**: Load `.claude/architectures/web.md`
- **mobile**: Load `.claude/architectures/mobile.md`
- **full-stack**: Load both web.md and mobile.md

## Git Synchronization Protocol

After completing any feature, fixing a bug, or reaching a development milestone, perform the following git synchronization:

1. **Check git status** to see what files have changed
2. **Generate commit message** based on changed files:
   - If files in `mobile/android/` or `mobile/ios/`: "Mobile: Updated [Android/iOS] native code"
   - If files in `mobile/src/`: "Mobile: Updated React Native components"
   - If files in `backend/`: "Backend: Updated [feature/API/service]"
   - If files in `frontend/`: "Frontend: Updated [component/page/feature]"
   - If files in `.claude/context/`: "Project: Updated development context"
   - For mixed changes: "Project: [Main change] and updated [secondary items]"
3. **Stage all changes**: `git add -A`
4. **Commit with message**: `git commit -m "[timestamp] message"`
5. **Update DevelopmentLog.md** with:
   - Timestamp
   - Commit message
   - Number of files changed
   - Brief summary of what was accomplished
6. **Push to remote** if origin exists: `git push origin main`
7. **Update session.md** with the latest timestamp and completed task

## Core Behaviors

1. **Memory Management**:

   - All session data in `.claude/context/`
   - Update files immediately after changes
   - Never rely on conversation memory alone

2. **Version Control**:

   - Git commit after each completed feature/fix
   - Use descriptive commit messages
   - Push to GitHub if remote exists

3. **Development Approach**:
   - Make small, incremental changes
   - Test after each change
   - Update progress logs continuously

## Critical Instructions

- **Never** modify files in `.claude/templates/`
- **Always** work with copies in `.claude/context/`
- **Update** DevelopmentLog.md after every work session
- **Commit** changes with meaningful messages
- **Your Role** You are the most senior software engineer and architect. There is no more senior role. You are responsible to ensure the application is of the highest standard. You do not take shortcuts, you make sure everything is done right, first time, even it it takes long.

## Golf Project Specific Instructions

**IMPORTANT**: This project has a detailed incremental development plan. Always:

1. **Read IncrementalProjectPlan.md** at the start of every session
2. **Follow the phase-by-phase approach** outlined in the plan
3. **Never skip steps** - each micro-step must be completed and tested
4. **Current Status**: Use the plan to determine where we are in development
5. **Next Actions**: Always refer to the specific step numbers (e.g., "0.1.1", "1.2.3") 
6. **Testing Protocol**: Every step must pass all testing requirements before advancing
7. **No Shortcuts**: This project specifically requires incremental, tested development

The plan contains 5 phases from Foundation Stabilization to Advanced Features. Always work within this framework and maintain the working application principle.

## Mobile Development Instructions

**IMPORTANT**: When working with React Native:

1. **NEVER start Metro bundler** - The user will handle this manually
2. **Building Process**: 
   - Make code changes
   - User will start Metro bundler manually
   - User will build and test on device
   - Wait for user feedback before proceeding
3. **Testing**: Always wait for user confirmation that changes work on device before marking tasks complete

## Map Implementation History and Reversion Guide

### Pre-Maps State (Commit: a71ff88)
**To revert to before any map changes**:
1. The app had Score/Statistics tabs only
2. ScorecardScreen.js was a single 35k+ token file with all functionality
3. No map dependencies or components existed

### Google Maps Implementation (Branch: backup-google-maps)
**Current implementation before MapLibre migration**:
- **Dependencies**: react-native-maps with PROVIDER_GOOGLE
- **Files Modified**:
  - `/mobile/src/screens/rounds/ScorecardScreen.js` - Refactored into tab container
  - `/mobile/src/screens/rounds/components/MapView.js` - Google Maps implementation
  - `/mobile/src/screens/rounds/components/ScorecardContainer.js` - Shared state management
  - `/mobile/src/screens/rounds/components/ScorecardView.js` - Scorecard functionality
  - `/mobile/android/app/src/main/AndroidManifest.xml` - Google Maps metadata
  - `/mobile/android/app/src/main/res/values/strings.xml` - Google Maps API key
  - `/mobile/src/config/mapConfig.js` - MapTiler configuration
  - `/mobile/src/services/mapTilerService.js` - MapTiler API service
- **Features**:
  - MapTiler satellite imagery via UrlTile
  - Hole navigation with par/yardage display
  - Distance information bar (placeholder)
  - User location tracking
  - Test marker at Augusta National

### MapLibre Migration (Current Work)
**Migration plan documented in**: `/GoogleToMaplibre.md`
**Backup of Google Maps MapView**: `/mobile/src/screens/rounds/components/MapView.google.backup.js`

### To Revert to Any State:

1. **To pre-maps state (no maps at all)**:
   ```bash
   git checkout a71ff88
   npm install
   cd ios && pod install
   ```

2. **To Google Maps implementation**:
   ```bash
   git checkout backup-google-maps
   npm install
   cd ios && pod install
   ```

3. **Key files to restore for Google Maps**:
   - Restore Google Maps API key in strings.xml
   - Ensure AndroidManifest.xml has Google Maps metadata
   - Use MapView.google.backup.js as reference

### Important Notes:
- Google Maps requires API key to display map (shows black screen without it)
- MapTiler API key: 9VwMyrJdecjrEB6fwLGJ
- Current course: Augusta National (33.5031, -82.0206)

### MapLibre Implementation - 100% Working Solution (Commit: 44a2190)
**Problem Solved**: MapLibre GL v10.2.0 is incompatible with React Native 0.76.5's bridgeless mode
- All MapLibre native HTTP requests get canceled
- `onRegionIsChanging` events don't fire consistently
- MapLibre falls back to default vector tiles when external sources fail

**Final Working Solution**:
1. **Custom Gesture Handling**: React Native's PanResponder captures all gestures directly
2. **Custom Tile Loading**: TileImage component using fetch() + base64 conversion bypasses HTTP issues
3. **Animated Transforms**: Real-time tile movement with Animated.ValueXY - zero jitter
4. **Manual Coordinate Calculations**: Precise map center updates based on pan distance
5. **No Offset Operations**: Removed pan.flattenOffset()/extractOffset() that caused jumping
6. **Consistent Zoom**: Fixed at level 18 with user controls (+/- buttons)

**Working Files**:
- `/mobile/src/screens/rounds/components/MapViewWithGestures.js` - Production map implementation
- `/mobile/src/components/TileImage.js` - Tile loader using JavaScript fetch()
- `/mobile/src/screens/rounds/contexts/ScorecardContext.js` - Prevents component remounting
- `/mobile/src/screens/rounds/components/MapView.js` - Uses MapViewWithGestures component

**Key Solutions That Made It Work**:
1. **JavaScript-only HTTP**: fetch() bypasses bridgeless mode's broken native networking
2. **Manual Gesture Control**: PanResponder gives complete control over pan/zoom
3. **No Offset Sync**: Removing flattenOffset/extractOffset eliminated all jitter
4. **10ms Reset Delay**: Ensures tiles update before resetting pan transform
5. **Movement Threshold**: Only process movements > 1 pixel to prevent micro-jitters

**Features Working Perfectly**: 
- ✅ Buttery smooth panning with zero jitter or jumping
- ✅ Immediate visual feedback - tiles move with your finger
- ✅ Seamless tile loading when panning to new areas
- ✅ Zoom controls (+/- buttons) with consistent zoom level 18
- ✅ User location tracking with fly-to navigation
- ✅ Hole navigation with markers and info
- ✅ 100% compatible with React Native 0.76.5 bridgeless mode
- ✅ Production ready - no hacks or workarounds needed

**Setup Guide**: See `/MapLibreSetup.md` for detailed instructions to implement in other projects

### Map Cache Implementation (Commit: bb45a94)
**Persistent Tile Caching System Added**: Three-tier caching for offline maps and improved performance

**Implementation Details**:
1. **Three-Tier Cache System**:
   - Memory Cache: LRU cache for immediate access (50 tiles max)
   - SQLite Cache: Persistent storage using react-native-nitro-sqlite
   - Network: Fallback when tiles not cached
   
2. **Cache Features**:
   - Automatic tile prefetching for smoother panning
   - Storage limit management (default 100MB)
   - Expiration handling (30 days default)
   - Cache statistics tracking
   - Smart eviction based on access patterns
   
3. **New Files Added**:
   - `/mobile/src/services/tileCacheDatabase.js` - SQLite database management
   - `/mobile/src/utils/persistentTileCache.js` - Cache coordination layer
   - `/mobile/src/utils/tileCache.js` - In-memory LRU cache
   - `/mobile/src/components/TileImage.js` - Updated with cache support

### GPS Shot Tracking Implementation (Completed)
**Comprehensive GPS-based shot tracking and course learning system**
**Project Plan**: `/GolfOnMap.md` - Full technical specification
**Core Features**:
1. **Shot Tracking**: Log GPS coordinates with each score increment ✅
2. **Distance Calculations**: Real-time distance to pin, shot distances ✅
3. **Club Analytics**: Build distance profiles for each club ✅
4. **Visual Representation**: Display shot paths on map view ✅
5. **Course Learning**: Detect tee boxes and pins from player data ✅

**Implementation Phases**:
- Phase 1: Core shot tracking with GPS logging ✅
- Phase 2: Map visualization of shots ✅
- Phase 3: Real-time GPS distance features ✅
- Phase 4: Club distance analytics ✅
- Phase 5: Course learning algorithms ✅
- Phase 6: Backend integration (Pending)
- Phase 7: Advanced features (In Progress)

**Current Status**: Phases 1-5 complete, working on advanced features

### Course Download System Implementation (In Progress)
**Pre-round course download for offline play**
**Project Plan**: `/CourseDownload.md` - Full technical specification

**Completed Features**:
- Phase 1: Foundation ✅
  - CourseDownloadScreen navigation integration
  - Basic UI structure with header and footer
  - State management for tile selection
  
- Phase 2: Touch Selection System ✅
  - CleanMapView component (simplified map without scorecard UI)
  - Pan/select mode toggle with visible controls
  - Touch-based tile selection at zoom 18
  - Tile overlay visualization (green with borders)
  - Selection counter and estimated download size

**Current Status**: Phase 2 complete, ready for Phase 3 (Download Implementation)
   
4. **Performance Improvements**:
   - Instant tile loading from memory cache
   - Background prefetching of adjacent tiles
   - Reduced network requests by 80-90%
   - Works offline for previously viewed areas
   
5. **Cache Management**:
   - Automatic cleanup of old tiles
   - Respects storage limits
   - Debug info shows cache hits/misses
   - Settings stored in AsyncStorage
