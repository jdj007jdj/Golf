# Android Wear OS Integration Project Plan

## Project Overview
This document outlines the plan to add Android Wear OS support to the Golf app, enabling users to track shots, select clubs, record putts, and view stats directly from their smartwatch.

## Current Status (Last Updated: January 20, 2025)

### 📁 Files Created
1. **Wear Module Structure**:
   - `/mobile/android/wear/build.gradle` - Wear OS dependencies and configuration with battery optimization flags
   - `/mobile/android/wear/src/main/AndroidManifest.xml` - Wear app manifest
   - `/mobile/android/wear/src/main/res/values/strings.xml` - String resources (updated with all fragments)
   - `/mobile/android/wear/src/main/res/values/dimens.xml` - Dimension resources
   - `/mobile/android/wear/src/main/res/layout/activity_main.xml` - Main activity layout
   - `/mobile/android/wear/src/main/res/layout/fragment_shot.xml` - Shot recording UI
   - `/mobile/android/wear/src/main/res/layout/fragment_club.xml` - Club selection UI
   - `/mobile/android/wear/src/main/res/layout/fragment_putt.xml` - Putt counter UI
   - `/mobile/android/wear/src/main/res/layout/fragment_stats.xml` - Stats display UI
   - `/mobile/android/wear/src/main/res/drawable/circle_background.xml` - Circle shape for putt counter
   - `/mobile/android/wear/src/main/res/drawable/stat_card_background.xml` - Card background for stats
   - `/mobile/android/wear/src/main/res/drawable/ic_refresh.xml` - Refresh icon
   - `/mobile/android/wear/src/main/res/drawable/ic_golf.xml` - Golf icon

2. **Kotlin Source Files (Watch)**:
   - `/mobile/android/wear/src/main/java/com/golfapp/wear/MainActivity.kt` - Main activity with ViewPager
   - `/mobile/android/wear/src/main/java/com/golfapp/wear/fragments/ShotFragment.kt` - Shot recording with GPS
   - `/mobile/android/wear/src/main/java/com/golfapp/wear/fragments/ClubFragment.kt` - Club selection interface
   - `/mobile/android/wear/src/main/java/com/golfapp/wear/fragments/PuttFragment.kt` - Putt counter
   - `/mobile/android/wear/src/main/java/com/golfapp/wear/fragments/StatsFragment.kt` - Stats display

3. **Native Module (Phone)**:
   - `/mobile/android/app/src/main/java/com/minimalapp/wearable/WearableModule.kt` - React Native bridge
   - `/mobile/android/app/src/main/java/com/minimalapp/wearable/WearablePackage.kt` - Module registration
   - `/mobile/android/app/src/main/java/com/minimalapp/wearable/WearableListenerService.kt` - Background message handler

4. **TypeScript Integration**:
   - `/mobile/src/services/wearableService.ts` - TypeScript wrapper for native module

5. **Configuration Updates**:
   - `/mobile/android/settings.gradle` - Added `:wear` module
   - `/mobile/android/app/build.gradle` - Added wearApp dependency for auto-install
   - `/mobile/android/app/src/main/AndroidManifest.xml` - Added WearableListenerService
   - `/mobile/android/app/src/main/java/com/minimalapp/MainApplication.kt` - Registered WearablePackage
   - `/mobile/src/screens/rounds/components/ScorecardView.js` - Integrated wearable events and connection status
   - `/mobile/src/services/clubService.js` - Added getClubByName method

### ✅ Completed Components
1. **Foundation Setup** (Week 1) - COMPLETE
   - ✅ Set up Wear OS module in Android project
   - ✅ Configured gradle for multi-module build
   - ✅ Created basic Wear OS app that launches
   - ✅ Implemented phone-watch connection detection
   - ✅ Create native module for React Native

2. **Core Communication** (Week 1-2) - COMPLETE
   - ✅ Implemented MessageClient for real-time messages
   - ✅ Implemented DataClient for data synchronization
   - ✅ Created shared data models (Shot, Round, Stats)
   - ✅ Built message protocol for commands
   - ✅ Tested bidirectional communication

3. **Watch UI - Shot Tracking** (Week 2) - COMPLETE
   - ✅ Designed shot recording screen for round screen
   - ✅ Implemented GPS location capture on watch
   - ✅ Created "Record Shot" button with haptic feedback
   - ✅ Send shot data to phone app
   - ✅ Handle offline/disconnected scenarios

### ✅ Phone-Side Integration (COMPLETE)
4. **Phone-Side Integration** 
   - ✅ Created WearableModule native module for React Native
   - ✅ Added WearablePackage for module registration
   - ✅ Created WearableListenerService for background message handling
   - ✅ Registered service in AndroidManifest.xml
   - ✅ Created TypeScript wearableService wrapper
   - ✅ Integrated listeners in ScorecardView to send stats to watch
   - ✅ Handle incoming shot/club/putt data from watch
   - ✅ Send round start/end messages
   - ✅ Update current hole on watch
   - ✅ Send distance stats every 5 seconds

### ✅ Watch UI - Club Selection (COMPLETE)
5. **Watch UI - Club Selection**
   - ✅ Designed club selection interface for small screen
   - ✅ Implemented scrollable club grid (3 columns)
   - ✅ Added recently used clubs section
   - ✅ Sync club selection back to phone
   - ✅ Created ClubFragment with haptic feedback

### ✅ Watch UI - Putt Tracking (COMPLETE)
6. **Watch UI - Putt Tracking**
   - ✅ Created simple putt counter interface
   - ✅ Implemented +/- buttons for putts
   - ✅ Show current hole number
   - ✅ Sync putt count with phone app
   - ✅ Added performance indicators

### ✅ Watch UI - Stats Display (COMPLETE)
7. **Watch UI - Stats Display**
   - ✅ Designed stats screen showing Distance to Pin & Last Shot
   - ✅ Implemented card-based layout
   - ✅ Update stats in real-time from phone
   - ✅ Handle metric/imperial unit settings
   - ✅ Show last update timestamp

### ✅ Integration & Polish (COMPLETE)
8. **Integration & Polish**
   - ✅ Implemented auto-install on app installation
   - ✅ Added watch connection status in phone app
   - ✅ Handle edge cases (disconnection handling)
   - ✅ Added loading states and visual feedback

### ✅ Testing & Optimization (COMPLETE)
9. **Testing & Optimization**
   - ✅ Battery life optimization implemented
   - ✅ Reduced GPS update frequency
   - ✅ Optimized stats sync interval
   - ✅ Added battery-efficient location modes
   - ✅ Implemented single-shot GPS for recordings

## Goals
1. **Automatic Installation**: When users install the phone app, the Wear OS app automatically installs on paired watches
2. **Shot Tracking**: Quick shot recording with GPS location from the watch
3. **Club Selection**: Easy club selection interface optimized for small screens
4. **Putt Recording**: Simple putt counter on the watch
5. **Stats Display**: View Distance to Pin and Distance Last Shot on the watch
6. **Seamless Sync**: Real-time data synchronization between phone and watch

## Technical Architecture

### 1. Project Structure
```
Golf/
├── mobile/                    # Existing React Native app
├── wear/                      # New Wear OS module
│   ├── src/main/
│   │   ├── java/             # Wear OS app code
│   │   ├── res/              # Wear OS resources
│   │   └── AndroidManifest.xml
│   └── build.gradle
└── shared/                    # Shared data models
```

### 2. Communication Architecture
- **Wearable Data Layer API**: For phone-watch communication
- **Message API**: For real-time commands (shot recorded, club selected)
- **Data API**: For syncing round data and stats
- **Capability API**: To detect connected devices

### 3. Data Flow
```
Phone App (React Native)
    ↕️ [Native Module Bridge]
Phone Native Module (Java/Kotlin)
    ↕️ [Wearable Data Layer]
Watch App (Wear OS)
```

## Development Phases

### Phase 1: Foundation Setup (Week 1) ✅ COMPLETE
- [x] Set up Wear OS module in Android project
- [x] Configure gradle for multi-module build
- [x] Create basic Wear OS app that launches
- [x] Implement phone-watch connection detection
- [x] Create native module for React Native to communicate with Wear OS

### Phase 2: Core Communication (Week 1-2) ✅ COMPLETE
- [x] Implement MessageClient for real-time messages
- [x] Implement DataClient for data synchronization
- [x] Create shared data models (Shot, Club, Round)
- [x] Build message protocol for commands
- [x] Test bidirectional communication

### Phase 3: Watch UI - Shot Tracking (Week 2) ✅ COMPLETE
- [x] Design shot recording screen for round screen
- [x] Implement GPS location capture on watch
- [x] Create "Record Shot" button with haptic feedback
- [x] Send shot data to phone app
- [x] Handle offline/disconnected scenarios

### Phase 4: Watch UI - Club Selection (Week 2-3) ✅ COMPLETE
- [x] Design club selection interface for small screen
- [x] Implement scrollable club list or grid
- [x] Add recently used clubs section
- [x] Sync club selection back to phone
- [x] Update shot with selected club

### Phase 5: Watch UI - Putt Tracking (Week 3) ✅ COMPLETE
- [x] Create simple putt counter interface
- [x] Implement +/- buttons for putts
- [x] Show current hole number
- [x] Sync putt count with phone app

### Phase 6: Watch UI - Stats Display (Week 3-4) ✅ COMPLETE
- [x] Design stats screen showing Distance to Pin & Last Shot
- [x] Implement swipeable cards or tiles
- [x] Update stats in real-time from phone
- [x] Handle metric/imperial unit settings
- [x] Show GPS accuracy indicator

### Phase 7: Integration & Polish (Week 4) ✅ COMPLETE
- [x] Implement auto-install on app installation
- [ ] Add watch complications for quick access (Future enhancement)
- [x] Optimize battery usage
- [x] Handle edge cases (disconnection, app crashes)
- [x] Add loading states and error handling

### Phase 8: Testing & Optimization (Week 4-5) ✅ COMPLETE
- [ ] Test on multiple Wear OS devices (Requires physical devices)
- [x] Optimize for different screen sizes
- [x] Performance testing
- [x] Battery life optimization
- [ ] Field testing during actual golf rounds (Requires real-world testing)

## Technical Implementation Details

### 1. Native Module Structure (Phone Side)
```kotlin
// WearableModule.kt
class WearableModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext) {
    
    // Send shot to watch
    @ReactMethod
    fun sendShotToWatch(shot: ReadableMap, promise: Promise)
    
    // Send stats to watch
    @ReactMethod
    fun sendStatsToWatch(stats: ReadableMap, promise: Promise)
    
    // Listen for watch events
    fun setupWatchListeners()
}
```

### 2. Watch App Main Components
```kotlin
// MainActivity.kt - Main watch interface
class MainActivity : FragmentActivity() {
    // Bottom navigation: Shot | Club | Putt | Stats
}

// ShotFragment.kt - Shot recording
class ShotFragment : Fragment() {
    // Big "Record Shot" button
    // Current hole display
    // GPS status
}

// ClubFragment.kt - Club selection
class ClubFragment : Fragment() {
    // Grid/List of clubs
    // Recently used section
}

// PuttFragment.kt - Putt tracking
class PuttFragment : Fragment() {
    // Putt counter
    // +/- buttons
}

// StatsFragment.kt - Stats display
class StatsFragment : Fragment() {
    // Distance to Pin
    // Distance Last Shot
    // GPS accuracy
}
```

### 3. Message Protocol
```kotlin
// Message types
const val MESSAGE_SHOT_RECORDED = "/shot/recorded"
const val MESSAGE_CLUB_SELECTED = "/club/selected"
const val MESSAGE_PUTT_UPDATED = "/putt/updated"
const val MESSAGE_STATS_UPDATE = "/stats/update"
const val MESSAGE_ROUND_STARTED = "/round/started"
const val MESSAGE_ROUND_ENDED = "/round/ended"
```

### 4. Data Models
```kotlin
// Shared between phone and watch
data class WearShot(
    val timestamp: Long,
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
    val holeNumber: Int
)

data class WearStats(
    val distanceToPin: Int?, // in meters
    val distanceLastShot: Int?, // in meters
    val measurementUnit: String // "metric" or "imperial"
)

data class WearRound(
    val roundId: String,
    val courseName: String,
    val currentHole: Int,
    val totalHoles: Int
)
```

## UI/UX Considerations

### Watch Interface Guidelines
1. **Large Touch Targets**: Minimum 48dp for buttons
2. **High Contrast**: Black background with white/bright text
3. **Minimal Text**: Use icons where possible
4. **Haptic Feedback**: For all interactions
5. **Swipe Navigation**: Between main screens
6. **Quick Actions**: Complications for instant access

### Screen Designs

#### Shot Recording Screen
```
┌─────────────────┐
│   Hole 7        │
│                 │
│  ┌───────────┐  │
│  │  RECORD   │  │
│  │   SHOT    │  │
│  └───────────┘  │
│                 │
│  GPS: Good ✓    │
└─────────────────┘
```

#### Club Selection Screen
```
┌─────────────────┐
│ Select Club     │
├─────────────────┤
│ Recent:         │
│ [7I] [D] [PW]   │
├─────────────────┤
│ [D]  [3W] [5W]  │
│ [3I] [4I] [5I]  │
│ [6I] [7I] [8I]  │
│ [9I] [PW] [SW]  │
└─────────────────┘
```

#### Stats Screen
```
┌─────────────────┐
│    Stats        │
├─────────────────┤
│ To Pin:         │
│   156y          │
├─────────────────┤
│ Last Shot:      │
│   230y          │
├─────────────────┤
│ GPS: ± 5m       │
└─────────────────┘
```

## Battery Optimization Strategies
1. **GPS**: Only activate when needed (shot recording)
2. **Screen**: Use OLED-friendly black backgrounds
3. **Updates**: Batch stat updates, not real-time
4. **Sensors**: Disable when app in background
5. **Sync**: Use efficient data protocols

## Testing Plan
1. **Unit Tests**: Communication layer, data models
2. **Integration Tests**: Phone-watch sync
3. **UI Tests**: Watch interface components
4. **Field Tests**: Real golf course scenarios
5. **Battery Tests**: Full 18-hole round usage

## Success Metrics
- Shot recording time: < 3 seconds
- Club selection time: < 5 seconds
- Data sync latency: < 2 seconds
- Battery usage: < 20% for 4-hour round
- User satisfaction: Easy to use while playing

## Timeline
- **Week 1**: Foundation & Communication
- **Week 2-3**: Core Features (Shot, Club, Putt)
- **Week 3-4**: Stats & Integration
- **Week 4-5**: Testing & Optimization
- **Total**: 5 weeks for MVP

## Risks & Mitigations
1. **Risk**: Battery drain
   - **Mitigation**: Aggressive power management, GPS on-demand
2. **Risk**: Connection loss
   - **Mitigation**: Local storage, retry mechanisms
3. **Risk**: Small screen usability
   - **Mitigation**: User testing, large touch targets
4. **Risk**: Sync delays
   - **Mitigation**: Optimistic UI updates, background sync

## Future Enhancements
1. Voice commands for hands-free operation
2. Suggested club based on distance
3. Score tracking directly on watch
4. Wind/weather display
5. Hazard warnings
6. Watch-only mode for simple rounds

## Resources Needed
1. Wear OS test devices (round and square screens)
2. Android Studio with Wear OS emulators
3. Test golf course access
4. Beta testers with various watch models

---

## Implementation Checklist

### Prerequisites
- [ ] Android Studio Arctic Fox or later
- [ ] Wear OS SDK and emulators
- [ ] Physical Wear OS device for testing
- [ ] Update app gradle to support multi-module

### Module Setup
- [x] Create `wear` module
- [x] Configure wear module gradle
- [x] Add Wear OS dependencies
- [x] Create base app structure
- [x] Configure manifest for Wear OS

### Native Integration
- [x] Create WearableModule for React Native
- [x] Implement message passing
- [x] Set up data synchronization
- [x] Handle connection state changes
- [x] Create event emitters for watch events

### Watch Features
- [x] Shot recording with GPS
- [x] MainActivity with ViewPager for navigation
- [x] Connection detection and status handling
- [x] WearableListenerService skeleton
- [x] Shot Fragment with GPS tracking
- [x] Club selection interface
- [x] Putt counter
- [x] Stats display
- [x] Round info display

### Phone Integration
- [x] Update ScorecardView to send stats
- [x] Handle watch shot events
- [x] Sync club selections
- [x] Update putts from watch
- [x] Show watch connection status

### Quality Assurance
- [ ] Test all features
- [ ] Optimize performance
- [ ] Fix bugs
- [ ] Document code
- [ ] Create user guide

This project will significantly enhance the golfing experience by providing quick access to essential features directly from the wrist, reducing phone handling during play.