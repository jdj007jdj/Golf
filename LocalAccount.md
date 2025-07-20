# Local Account Implementation Plan

## Overview
Implement a hybrid account system that allows users to start using the app immediately with a local-only account, then optionally convert to an online account later with full data sync.

## Core Principles
- Don't change existing component versions
- Don't add new unnecessary components  
- Maintain backward compatibility
- Keep existing online functionality intact
- Implement changes incrementally and test thoroughly

## Architecture Design

### Account Types
1. **Local Account**: Data stored only on device, no network required
2. **Online Account**: Current implementation with backend sync
3. **Hybrid State**: Local account in process of converting to online

### Data Storage Strategy
- Local accounts use same AsyncStorage keys with `local_` prefix
- Online accounts continue using existing storage
- Migration process copies local data to online storage

## Implementation Phases

### Phase 1: Local Account Infrastructure
- [ ] Update Prisma schema with account type fields
- [ ] Run database migration for schema changes
- [x] Create localAuthService.js for local authentication
- [x] Add account type field to auth context
- [x] Modify login screen to show local account option
- [x] Implement local user creation and storage

### Phase 2: Data Isolation
- [x] Update all data services to check account type
- [x] Implement local-only storage for rounds, shots, games
- [x] Ensure offline queue doesn't run for local accounts
- [x] Prevent sync attempts for local accounts

### Phase 3: Settings Integration
- [x] Add "Account Type" section to Settings screen
- [x] Show current account type (Local/Online)
- [x] Add "Convert to Online Account" button
- [x] Display data that will be synced

### Phase 4: Conversion Process
- [x] Study existing offlineQueueService.js implementation
- [x] Study existing shotSyncService.js patterns
- [x] Study existing gamePersistenceService sync methods
- [x] Create account conversion service using SAME queue patterns
- [x] Reuse existing sync infrastructure (don't reinvent)
- [x] Implement backend API endpoint for conversion
- [x] Create AccountConversion record to track progress
- [x] Implement data migration queue using offlineQueueService patterns
- [x] Handle username/email conflicts
- [x] Progress indicator for sync process
- [x] Update user record with converted status

### Phase 5: Testing & Polish
- [ ] Test local account creation flow
- [ ] Test data isolation between account types
- [ ] Test conversion process with various data sizes
- [ ] Handle edge cases and errors

## Technical Implementation Details

### 1. Database Schema Updates (`schema.prisma`)
```prisma
// Add to User model:
model User {
  // ... existing fields ...
  accountType      String    @default("online") @map("account_type") // "local" or "online"
  localDeviceId    String?   @map("local_device_id") // Original device ID for converted accounts
  convertedAt      DateTime? @map("converted_at") // When account was converted
  // ... rest of model ...
}

// Add new model for tracking conversions:
model AccountConversion {
  id               String   @id @default(uuid()) @db.Uuid
  userId           String   @map("user_id") @db.Uuid
  localDeviceId    String   @map("local_device_id")
  dataSnapshot     Json     @map("data_snapshot") // Backup of what was converted
  roundsConverted  Int      @map("rounds_converted")
  shotsConverted   Int      @map("shots_converted")
  gamesConverted   Int      @map("games_converted")
  status           String   @default("pending") // pending, in_progress, completed, failed
  startedAt        DateTime @default(now()) @map("started_at")
  completedAt      DateTime? @map("completed_at")
  error            String?
  
  user User @relation(fields: [userId], references: [id])
  
  @@map("account_conversions")
}
```

### 2. Local Auth Service (`localAuthService.js`)
```javascript
// Key functions needed:
- createLocalUser(username, password)
- authenticateLocal(username, password) 
- isLocalAccount()
- getLocalUserId()
- hashPassword(password) // Use crypto-js or similar
```

### 2. Auth Context Modifications
```javascript
// Add to AuthContext:
- accountType: 'local' | 'online'
- isLocalAccount: boolean
- convertToOnline: async function
```

### 3. Storage Keys Structure
```
Local Account:
- local_user_data
- local_auth_token (generated locally)
- local_rounds_[userId]
- local_shots_[userId]
- local_games_[userId]

Online Account (existing):
- authToken
- userData
- golf_round_history
- golf_shots_[roundId]
- golf_games_[roundId]
```

### 4. Login Screen Changes
- Add "Continue Without Account" button
- Local account creation form (username + password only)
- Toggle between local/online login modes

### 5. Data Service Modifications
Each service needs to check account type:
- shotTrackingService.js
- gamePersistenceService.js  
- offlineQueueService.js (disable for local)
- syncServices (disable for local)

### 6. Backend API Changes
```typescript
// New endpoints needed:
POST /api/auth/convert-account
- Accepts: local credentials + device ID
- Creates user with accountType: 'online'
- Returns: auth token + conversion ID

GET /api/auth/check-username/:username
- Check if username available before conversion

POST /api/conversion/upload-data
- Accepts: rounds, shots, games in batches
- Updates AccountConversion progress
- Returns: success/failure status

GET /api/conversion/:id/status
- Returns: conversion progress and status
```

### 7. Existing Sync Services to Reuse

**IMPORTANT: The app already has comprehensive sync services. We MUST reuse these patterns:**

1. **offlineQueueService.js**
   - Already handles queueing operations when offline
   - Has retry logic and error handling
   - Use for conversion data queueing
   
2. **shotSyncService.js**
   - Syncs shots with proper error handling
   - Has partial sync support
   - Use same patterns for conversion shots
   
3. **gamePersistenceService.js**
   - Has syncToBackend() method
   - Handles game data sync
   - Reuse for game conversion
   
4. **syncResultTracker.js**
   - Tracks sync success/failure
   - Use for conversion progress

**Conversion MUST use these services, not create new ones!**

### 8. Conversion Process Flow
1. Check username availability via API
2. Validate local credentials  
3. Create online account with same username
4. Create AccountConversion record
5. Get new auth token
6. Use offlineQueueService to queue all local data
7. Let existing sync services handle upload
8. syncResultTracker monitors progress
9. Update AccountConversion status based on sync results
10. Update account type to 'online' only after full success
11. Clear local-only data
12. Switch to online storage keys

## UI/UX Considerations

### Login Screen
- Clear messaging about local vs online benefits
- "Why create an online account?" explanation
- Simple toggle or separate buttons

### Settings Screen
```
Account Settings
├─ Account Type: Local Device Only
├─ Username: john_doe
├─ [Convert to Online Account] button
└─ Data to sync: 15 rounds, 247 shots, 3 games
```

### Conversion Dialog
```
Convert to Online Account?

This will:
✓ Backup all your data to the cloud
✓ Enable access from multiple devices
✓ Allow sharing with friends
✓ Protect against data loss

Data to upload:
- 15 rounds
- 247 shots  
- 3 games

[Cancel] [Convert & Sync]
```

## Error Handling

### Conversion Errors
- Network timeout → Retry queue
- Username taken → Suggest alternatives
- Server error → Keep local data intact
- Partial sync → Resume from last success

### Data Integrity
- Never delete local data until sync confirmed
- Implement rollback if conversion fails
- Keep backup of local data during process

## Testing Checklist

### Local Account Tests
- [ ] Create local account offline
- [ ] Login with local account offline  
- [ ] Play rounds completely offline
- [ ] All features work without network
- [ ] Data persists after app restart

### Conversion Tests
- [ ] Convert empty account
- [ ] Convert with 1 round
- [ ] Convert with 50+ rounds
- [ ] Convert with active game
- [ ] Handle network interruption
- [ ] Handle username conflict
- [ ] Verify all data synced correctly

### Edge Cases
- [ ] Convert while in active round
- [ ] Convert with offline queue items
- [ ] Multiple conversion attempts
- [ ] App crash during conversion
- [ ] Storage full scenarios

## Critical Implementation Notes

### Reusing Existing Sync Infrastructure

**DO NOT create new sync mechanisms. The app already has:**

```javascript
// offlineQueueService.js already provides:
- queueShot(token, shot)
- queueRoundCompletion(token, roundId, summary)
- processQueue()
- getQueueStatus()

// For conversion, ADD new methods:
- queueLocalDataForConversion(token, localData)
- processConversionQueue()

// shotSyncService.js already provides:
- syncPendingShots()
- forceSyncShots()
- getSyncStatus()

// gamePersistenceService.js already provides:
- syncToBackend(token, roundId)
- syncAllActiveGames(token)
```

**Conversion service should:**
1. Transform local data to match online format
2. Queue using existing offlineQueueService patterns
3. Let existing sync services handle the actual upload
4. Monitor progress using syncResultTracker

## Implementation Order

1. **Start with Auth** (Phase 1)
   - Most critical piece
   - Enables testing other features
   
2. **Data Isolation** (Phase 2)
   - Prevents data mixing
   - Maintains system integrity
   
3. **UI Integration** (Phase 3)
   - User-facing changes
   - Settings screen updates
   
4. **Conversion Logic** (Phase 4)
   - MUST reuse existing sync services
   - Study existing code first
   - Complex but isolated feature
   - Can be tested thoroughly
   
5. **Polish & Edge Cases** (Phase 5)
   - Refinements based on testing
   - Error handling improvements

## Success Criteria

- User can create account and play without internet
- All existing features work in local mode
- Conversion process is reliable and clear
- No data loss during conversion
- Online accounts still work exactly as before
- Clean code with no hacks or workarounds

## Notes

- Keep existing services intact, add conditional logic
- Use feature flags if needed for gradual rollout
- Document all new storage keys and formats
- Consider data export feature for manual backup
- Plan for future: import data from other devices