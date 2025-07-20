# Local Account API Endpoints Implementation Plan

## Overview
Complete the backend implementation for the hybrid local/online account system. This includes creating API endpoints for account conversion, data upload, and progress tracking.

## Current Status
### ✅ Completed
- Frontend local authentication service
- UI screens for local login and conversion
- Account conversion service (frontend)
- Prisma schema updates (User.accountType, AccountConversion model)
- Data isolation for local accounts

### ❌ Missing
- Backend API endpoints for conversion process
- Username availability checking
- Batch data upload endpoints
- Conversion progress tracking
- Security middleware for conversion endpoints
- Error handling and validation

## Core Principles
- Reuse existing authentication patterns
- Leverage existing data validation
- Maintain data integrity during conversion
- Proper error handling with rollback capability
- Security-first approach
- Comprehensive logging for debugging

## API Endpoints Required

### 1. Check Username Availability
`GET /api/auth/check-username/:username`
- Verify username is not taken before conversion
- Return suggestions if username exists
- Case-insensitive checking

### 2. Convert Account
`POST /api/auth/convert-account`
- Create online account from local credentials
- Initialize AccountConversion record
- Return auth token and conversion ID
- Handle existing email conflicts

### 3. Upload Conversion Data
`POST /api/conversion/upload-data`
- Accept batched data (rounds, shots, games)
- Validate data integrity
- Update conversion progress
- Support partial uploads/resume

### 4. Get Conversion Status
`GET /api/conversion/:id/status`
- Return current conversion progress
- Include detailed error information
- Support polling from frontend

### 5. Update Conversion Status
`PUT /api/conversion/:id/status`
- Update conversion progress/status
- Record completion or failure
- Clean up on success

## Implementation Tasks

### Phase 1: Core Conversion Endpoints
- [x] Create auth conversion controller (`/backend/src/controllers/authConversionController.ts`)
- [x] Implement username availability check endpoint
- [x] Implement main account conversion endpoint
- [x] Add validation for conversion requests
- [x] Create conversion service layer (integrated in controller)
- [x] Add password hashing for converted accounts
- [x] Generate JWT token for new online account

### Phase 2: Data Upload Infrastructure
- [x] Create conversion data controller (`/backend/src/controllers/conversionDataController.ts`)
- [x] Implement batch upload endpoint for rounds
- [x] Implement batch upload endpoint for shots
- [x] Implement batch upload endpoint for games
- [x] Add data validation using existing validators
- [x] Implement transaction support for data integrity
- [x] Add progress tracking for each batch

### Phase 3: Progress Tracking
- [x] Create conversion status endpoints
- [x] Implement real-time progress updates
- [x] Add error recovery mechanisms
- [ ] Implement cleanup for failed conversions
- [ ] Add timeout handling for stalled conversions

### Phase 4: Security & Validation
- [x] Add rate limiting for conversion endpoints
- [x] Implement device ID validation
- [x] Add conversion token validation
- [x] Ensure data ownership verification
- [ ] Add audit logging for conversions
- [ ] Implement rollback for failed conversions

### Phase 5: Integration & Testing
- [ ] Update existing auth middleware to handle converted accounts
- [ ] Add integration tests for conversion flow
- [ ] Test partial conversion recovery
- [ ] Test concurrent conversion attempts
- [ ] Test large data set conversions
- [ ] Add monitoring and alerts

## Technical Implementation Details

### 1. Database Transactions
```typescript
// Use Prisma transactions for atomic operations
await prisma.$transaction(async (tx) => {
  // Create user
  // Create conversion record
  // Update related data
});
```

### 2. Validation Schema
```typescript
// Reuse existing validation patterns
const convertAccountSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  deviceId: z.string(),
  localData: z.object({
    rounds: z.number(),
    shots: z.number(),
    games: z.number()
  })
});
```

### 3. Error Handling
```typescript
// Consistent error responses
class ConversionError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}
```

### 4. Progress Tracking
```typescript
// Real-time progress updates
interface ConversionProgress {
  conversionId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  roundsProcessed: number;
  totalRounds: number;
  shotsProcessed: number;
  totalShots: number;
  gamesProcessed: number;
  totalGames: number;
  errors: ConversionError[];
}
```

## Security Considerations

### Authentication
- Validate device ID matches original local account
- Ensure username hasn't been taken during conversion
- Generate secure tokens for converted accounts
- Implement session management for conversion process

### Data Validation
- Validate all uploaded data against schemas
- Ensure data ownership (user can only convert their own data)
- Prevent duplicate conversions
- Validate data timestamps are reasonable

### Rate Limiting
- Limit conversion attempts per device
- Implement progressive delays for failed attempts
- Monitor for suspicious conversion patterns

## Error Scenarios

### 1. Username Taken
- Suggest alternative usernames
- Allow user to choose different username
- Preserve original local username reference

### 2. Email Already Exists
- Check if it's the same user
- Offer account recovery options
- Prevent account hijacking

### 3. Partial Conversion Failure
- Save progress state
- Allow resume from last successful point
- Provide detailed error information

### 4. Network Interruption
- Support resumable uploads
- Implement idempotent operations
- Clean up incomplete data

### 5. Data Validation Errors
- Provide specific error messages
- Log problematic data for debugging
- Allow skipping invalid records

## Monitoring & Logging

### Metrics to Track
- Conversion success rate
- Average conversion time
- Data volumes processed
- Error frequencies by type
- Abandonment rate

### Logging Requirements
- Log all conversion attempts
- Track progress milestones
- Record validation failures
- Monitor performance bottlenecks
- Audit security events

## Testing Checklist

### Unit Tests
- [ ] Username availability checking
- [ ] Account creation validation
- [ ] Data upload validation
- [ ] Progress tracking accuracy
- [ ] Error handling paths

### Integration Tests
- [ ] Full conversion flow
- [ ] Partial failure recovery
- [ ] Concurrent conversions
- [ ] Large data sets
- [ ] Network interruption handling

### Security Tests
- [ ] SQL injection attempts
- [ ] Rate limiting effectiveness
- [ ] Token validation
- [ ] Data ownership verification
- [ ] Session hijacking prevention

## Rollback Plan

### If Conversion Fails
1. Mark AccountConversion as failed
2. Keep original local data intact
3. Clean up partial online data
4. Log failure details
5. Notify user with actionable error

### Database Cleanup
```sql
-- Clean up failed conversions older than 30 days
DELETE FROM account_conversions 
WHERE status = 'failed' 
AND created_at < NOW() - INTERVAL '30 days';
```

## Success Criteria

1. **Reliability**: 99%+ conversion success rate
2. **Performance**: < 30s for average conversion
3. **Security**: No data leaks or unauthorized access
4. **User Experience**: Clear progress and error messages
5. **Data Integrity**: 100% data accuracy post-conversion

## Implementation Order

1. Start with auth conversion endpoints (most critical)
2. Add data upload infrastructure
3. Implement progress tracking
4. Add security layers
5. Comprehensive testing
6. Monitoring and alerts

## Notes

- Keep local data intact until conversion is 100% complete
- Use database transactions for all critical operations
- Implement comprehensive audit logging
- Plan for future: bulk conversions, admin tools
- Consider implementing webhook notifications for conversion status