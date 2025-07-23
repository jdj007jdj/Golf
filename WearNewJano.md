# Wear OS Integration Project Plan

## Overview
Complete integration of Wear OS companion app with the Golf phone app using the Google Wearable API for production-ready communication.

## Current Status
- ✅ Keystore issue fixed - both apps now use the same signing certificate
- ✅ Application ID fixed - both apps now use "com.minimalapp"
- ✅ Wearable API implementation complete in WearableModule
- ✅ Test screen with PING/Time/JSON message buttons
- ⏳ Testing Wearable API communication after fixes
- ❌ No bidirectional communication (watch to phone) yet
- ❌ No real UI implementation on watch

## Critical Fixes Applied

### 1. Keystore Fix
Previously, the phone and wear apps were using different keystores:
- Phone: `/mobile/android/app/debug.keystore`
- Wear: `~/.android/debug.keystore`
This has been fixed - both apps now use the same keystore.

### 2. Application ID Fix (Root Cause)
The apps had mismatched application IDs:
- Phone: `com.minimalapp`
- Wear: `com.golfapp.wear` ❌

**Fixed:** Wear app now uses `com.minimalapp` to enable Wearable API communication.

### Required Steps After Fix:
1. Clean and rebuild both apps
2. Uninstall both apps from devices
3. Reinstall fresh builds
4. Test with WearOSTestScreen

## Phase 1: Phone to Watch Communication (Priority: Critical)

### 1.1 Update WearableModule.kt to Send Broadcasts ✅
- [x] Add new broadcast methods to WearableModule
- [x] Implement sendBroadcastToWatch() method using ADB
- [x] Add methods for each message type (round, hole, shot, stats)
- [x] Add broadcast constants matching wear app

### 1.2 Update React Native Service Layer ✅
- [x] Update wearableService.ts to use new broadcast methods
- [x] Add new interfaces for broadcast data types
- [x] Replace Wearable API calls with broadcast fallback
- [x] Add sendTestMessage, sendHoleData, sendShotData, sendStatsData methods

### 1.3 Integration Testing (IN PROGRESS)
- [x] Update WearOSTestScreen with broadcast buttons
- [ ] Test round start broadcast
- [ ] Test hole change broadcast
- [ ] Test shot recording broadcast
- [ ] Test stats update broadcast
- [ ] Verify all data formats work correctly

## Phase 2: Watch UI Implementation (Priority: High)

### 2.1 Create Main Golf Activity
- [ ] Replace SimpleTestActivity with GolfActivity
- [ ] Design main screen layout (hole info, score, shot buttons)
- [ ] Implement Material Design for Wear OS
- [ ] Add swipe navigation between screens

### 2.2 Implement Score Display
- [ ] Show current hole number and par
- [ ] Display current score and total score
- [ ] Show shots for current hole
- [ ] Add visual indicators for score relative to par

### 2.3 Implement Shot Recording
- [ ] Add shot recording buttons
- [ ] Implement club selection screen
- [ ] Add haptic feedback for actions
- [ ] Send shot data back to phone

### 2.4 Implement Hole Navigation
- [ ] Previous/Next hole buttons
- [ ] Hole selector (1-18)
- [ ] Quick access to scorecard view
- [ ] Sync hole changes with phone

## Phase 3: Watch to Phone Communication (Priority: High)

### 3.1 Implement Watch-Side Broadcasting
- [ ] Create PhoneBroadcastSender service
- [ ] Add methods to send data to phone
- [ ] Implement retry logic for failed sends
- [ ] Add connection status monitoring

### 3.2 Update Phone to Receive Watch Broadcasts
- [ ] Create WatchBroadcastReceiver in phone app
- [ ] Register receiver in AndroidManifest.xml
- [ ] Handle incoming watch data
- [ ] Update UI based on watch actions

### 3.3 Bidirectional Testing
- [ ] Test shot recording from watch
- [ ] Test hole navigation from watch
- [ ] Test score updates from watch
- [ ] Verify sync between devices

## Phase 4: Data Persistence & Sync (Priority: Medium)

### 4.1 Implement Watch-Side Storage
- [ ] Add SharedPreferences for current round data
- [ ] Store last known state
- [ ] Implement recovery after app restart
- [ ] Cache critical data locally

### 4.2 Implement Sync Protocol
- [ ] Define sync message format
- [ ] Implement full state sync on connect
- [ ] Add incremental updates
- [ ] Handle conflict resolution

### 4.3 Offline Support
- [ ] Queue actions when phone disconnected
- [ ] Replay queued actions on reconnect
- [ ] Show connection status on watch
- [ ] Implement timeout handling

## Phase 5: Advanced Features (Priority: Low)

### 5.1 GPS Features on Watch
- [ ] Show distance to pin
- [ ] Display shot distances
- [ ] Add GPS accuracy indicator
- [ ] Implement location-based features

### 5.2 Complications
- [ ] Create complication for watch face
- [ ] Show current score/hole
- [ ] Quick launch to app
- [ ] Update in real-time

### 5.3 Health Integration
- [ ] Add heart rate during round
- [ ] Calculate calories burned
- [ ] Step counting
- [ ] Export to Google Fit

## Phase 6: Polish & Optimization (Priority: Low)

### 6.1 Performance
- [ ] Optimize battery usage
- [ ] Reduce message frequency
- [ ] Implement smart updates
- [ ] Profile and fix bottlenecks

### 6.2 UI/UX Polish
- [ ] Add animations
- [ ] Improve touch targets
- [ ] Optimize for round watch faces
- [ ] Add ambient mode support

### 6.3 Error Handling
- [ ] Add user-friendly error messages
- [ ] Implement crash reporting
- [ ] Add debug mode
- [ ] Create troubleshooting guide

## Technical Details

### Broadcast Actions
```
com.golfapp.wear.ROUND_DATA - Round start/update
com.golfapp.wear.HOLE_DATA - Hole information
com.golfapp.wear.SHOT_DATA - Shot recording
com.golfapp.wear.STATS_DATA - Statistics update
com.golfapp.wear.SYNC_REQUEST - Full sync request
com.golfapp.wear.CONNECTION_STATUS - Connection updates
```

### Data Formats
All data sent as JSON strings in the "data" extra:
```json
{
  "type": "round_data",
  "courseName": "Pebble Beach",
  "currentHole": 5,
  "totalScore": 42,
  "timestamp": 1737432000000
}
```

### Key Files to Modify

#### Phone App
- `/mobile/android/app/src/main/java/com/minimalapp/wearable/WearableModule.kt`
- `/mobile/android/app/src/main/AndroidManifest.xml`
- `/mobile/src/services/wearableService.ts`
- `/mobile/src/screens/rounds/components/ScorecardView.js`

#### Wear App
- `/mobile/android/wear/src/main/java/com/golfapp/wear/MainActivity.kt`
- `/mobile/android/wear/src/main/AndroidManifest.xml`
- `/mobile/android/wear/src/main/res/layout/activity_main.xml`
- Create new: `PhoneBroadcastSender.kt`
- Create new: `GolfDataManager.kt`

## Success Criteria
- [ ] Phone can send all round data to watch
- [ ] Watch displays current hole and score
- [ ] User can record shots from watch
- [ ] Data syncs bidirectionally
- [ ] Works offline with queue/sync
- [ ] Battery life acceptable (4+ hour round)

## Timeline Estimate
- Phase 1: 2-3 hours (Critical - Do First)
- Phase 2: 4-6 hours (High Priority)
- Phase 3: 3-4 hours (High Priority)
- Phase 4: 3-4 hours (Medium Priority)
- Phase 5: 4-6 hours (Low Priority)
- Phase 6: 2-3 hours (Low Priority)

Total: 18-26 hours of development

---
*Created: 2025-07-22*
*Status: Starting Phase 1.1*