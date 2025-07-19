# Golf Games & Friends Feature - Implementation Plan

## 🎯 Overview
Implement a comprehensive scoring system for playing golf with friends, supporting multiple game formats including Skins, Nassau, Stableford, Match Play, and more. This feature will allow players to track not just their own scores, but also compete with friends in various formats during the same round.

## 📋 Core Concepts

### Game Formats to Support

#### 1. **Skins**
- Each hole is worth a "skin" (point/money)
- Winner of the hole takes the skin
- Ties carry over to next hole
- Track: hole winners, carry-overs, total skins won

#### 2. **Nassau**
- Three separate bets: Front 9, Back 9, Overall 18
- Each segment is a separate match play competition
- Common format: 2-2-2 (same value for each segment)
- Track: match status for each segment

#### 3. **Stableford**
- Points-based scoring system
- Points awarded based on score relative to par:
  - Eagle or better: 4 points
  - Birdie: 3 points
  - Par: 2 points
  - Bogey: 1 point
  - Double bogey or worse: 0 points
- Modified Stableford can have different point values

#### 4. **Match Play**
- Hole-by-hole competition
- Win hole = 1 point, Tie = 0 points
- Track: current match status (e.g., "2 UP", "All Square")

#### 5. **Stroke Play**
- Traditional scoring - total strokes
- Can include handicaps for net scoring

#### 6. **Best Ball / Four Ball**
- Team format where best score counts
- Can be match play or stroke play

## 🏗️ Technical Architecture

### Data Structure
```javascript
// Friends Database (Persistent Storage)
friendsDatabase: [
  {
    id: string, // unique identifier
    name: string,
    nickname: string, // optional
    handicap: number,
    email: string, // for future online linking
    phone: string, // for invites
    isRegistered: boolean, // true if they have the app
    userId: string, // their user ID once registered
    addedDate: Date,
    lastPlayed: Date,
    roundsPlayed: number,
    averageScore: number,
    photo: string, // base64 or uri
    favorite: boolean, // for quick access
  }
]

// Friends/Players in the current round
players: [
  {
    id: string, // links to friendsDatabase id
    friendId: string, // reference to friends database
    name: string,
    handicap: number,
    isUser: boolean, // true for the app user
    isGuest: boolean, // true for one-time players
    color: string, // for UI display
  }
]

// Game configuration
gameConfig: {
  format: 'skins' | 'nassau' | 'stableford' | 'match' | 'stroke',
  teams: [], // for team games
  settings: {
    // Format-specific settings
    skinsCarryOver: boolean,
    stablefordPoints: {...},
    nassauBets: {front: 2, back: 2, overall: 2},
    useHandicaps: boolean,
  }
}

// Scoring data
gameScores: {
  // Per hole, per player scores
  holes: {
    1: {
      scores: {playerId: strokes, ...},
      winner: playerId, // for skins/match
      carried: boolean, // for skins
    }
  },
  // Running totals/status
  status: {
    skins: {playerId: count, ...},
    nassau: {front: status, back: status, overall: status},
    stableford: {playerId: points, ...},
    match: {status: '2 UP', thru: 9},
  }
}
```

## ✅ Implementation Phases

### Phase 0: Friends Database Foundation (Day 1) ✅
- [x] 0.1 Create friends storage structure in AsyncStorage
- [x] 0.2 Create FriendsService for CRUD operations
- [x] 0.3 Implement addFriend function with deduplication
- [x] 0.4 Create getFriends with sorting (favorites, recent, alphabetical)
- [x] 0.5 Add updateFriend for editing details
- [x] 0.6 Create friend statistics tracking (rounds played, scores)

### Phase 1: Player Management with Friends Integration (Day 1-2) ✅
- [x] 1.1 Create AddPlayersModal component
- [x] 1.2 Add "Select from Friends" quick picker
- [x] 1.3 Show recent/favorite friends at top
- [x] 1.4 Add "New Friend" option with full details form
- [x] 1.5 Add "Quick Add" for one-time guests
- [x] 1.6 Store players in round context with friend references
- [x] 1.7 Auto-save new friends to database
- [x] 1.8 Display players with colors and avatars

### Phase 2: Game Selection (Day 1-2) ✅
- [x] 2.1 Create GameSelectionModal component
- [x] 2.2 Design game format selection UI
- [x] 2.3 Add format-specific settings (carry-over, points, etc.)
- [x] 2.4 Create game configuration storage
- [x] 2.5 Add "Start Game" functionality
- [x] 2.6 Show selected game in Friends tab header

### Phase 3: Basic Scoring Interface (Day 2)
- [ ] 3.1 Redesign Friends tab to show all players
- [ ] 3.2 Create score input for each player per hole
- [ ] 3.3 Sync with main scorecard (user's score)
- [ ] 3.4 Add quick score entry buttons (+/- for each player)
- [ ] 3.5 Show current hole prominently
- [ ] 3.6 Add swipe navigation between holes

### Phase 4: Skins Game Implementation (Day 2-3)
- [ ] 4.1 Create skins calculation logic
- [ ] 4.2 Determine hole winners
- [ ] 4.3 Implement carry-over logic
- [ ] 4.4 Create skins status display
- [ ] 4.5 Show skins won per player
- [ ] 4.6 Add visual indicators for carried holes

### Phase 5: Nassau Implementation (Day 3)
- [ ] 5.1 Create Nassau scoring logic
- [ ] 5.2 Track match play status for each segment
- [ ] 5.3 Calculate holes won/lost/tied
- [ ] 5.4 Create Nassau status display
- [ ] 5.5 Show "2 UP", "All Square", etc.
- [ ] 5.6 Handle press/automatic press rules

### Phase 6: Stableford Implementation (Day 3-4)
- [ ] 6.1 Create Stableford points calculation
- [ ] 6.2 Add configurable point values
- [ ] 6.3 Handle handicap adjustments
- [ ] 6.4 Create points leaderboard display
- [ ] 6.5 Show points per hole breakdown
- [ ] 6.6 Add modified Stableford option

### Phase 7: Match Play Implementation (Day 4)
- [ ] 7.1 Create match play scoring logic
- [ ] 7.2 Track match status and holes remaining
- [ ] 7.3 Handle conceded holes
- [ ] 7.4 Create match status display
- [ ] 7.5 Show detailed match progress
- [ ] 7.6 Add team match play support

### Phase 8: Game Status & Leaderboard (Day 4-5)
- [ ] 8.1 Create GameStatusModal component
- [ ] 8.2 Design comprehensive leaderboard view
- [ ] 8.3 Show game-specific standings
- [ ] 8.4 Add detailed statistics per player
- [ ] 8.5 Create end-of-round summary
- [ ] 8.6 Add share functionality

### Phase 9: Data Persistence (Day 5)
- [ ] 9.1 Save game data to AsyncStorage
- [ ] 9.2 Sync with backend when online
- [ ] 9.3 Handle offline/online transitions
- [ ] 9.4 Create game history storage
- [ ] 9.5 Add resume game functionality
- [ ] 9.6 Export game results

### Phase 10: UI Polish & Features (Day 5-6)
- [ ] 10.1 Add animations for score updates
- [ ] 10.2 Create color-coded player system
- [ ] 10.3 Add quick game templates
- [ ] 10.4 Implement side games (closest to pin, longest drive)
- [ ] 10.5 Add game statistics and analytics
- [ ] 10.6 Create game result sharing

### Phase 11: Online Friends Integration (Future)
- [ ] 11.1 Add "Invite Friend" via email/SMS
- [ ] 11.2 Create friend request system
- [ ] 11.3 Link local friends to registered users
- [ ] 11.4 Sync friend data across devices
- [ ] 11.5 Show online/offline status
- [ ] 11.6 Enable real-time score sharing
- [ ] 11.7 Add friend discovery (by username/email)
- [ ] 11.8 Create privacy controls
- [ ] 11.9 Implement friend groups/lists
- [ ] 11.10 Add social features (comments, reactions)

## 🎨 UI/UX Design Principles

### Friends Selection UI
```
┌─────────────────────────────┐
│     Add Players to Round    │
├─────────────────────────────┤
│ 🌟 Favorites                │
│ ✓ John Smith (HCP 12)      │
│ ○ Mike Johnson (HCP 8)     │
├─────────────────────────────┤
│ 🕐 Recent                   │
│ ○ Sarah Davis (HCP 15)     │
│ ○ Tom Wilson (HCP 20)      │
├─────────────────────────────┤
│ 👥 All Friends (12)         │
│ ○ Anna Brown (HCP 10)      │
│ ○ Bob Miller (HCP 18)      │
├─────────────────────────────┤
│ [+ Add New Friend]          │
│ [+ Quick Add Guest]         │
└─────────────────────────────┘
```

### Friends Tab Layout (During Play)
```
┌─────────────────────────────┐
│ Game: Skins ($5)      [End] │
├─────────────────────────────┤
│ Hole 7 - Par 4              │
├─────────────────────────────┤
│ Player      Score    Skins  │
│ You          [ 4 ]     3 🏆  │
│ John         [ 5 ]     2 🏆  │
│ Mike         [ 6 ]     1 🏆  │
│ Sarah        [ 4 ]     2 🏆  │
├─────────────────────────────┤
│ 🏆 Tied - Carrying to Hole 8 │
├─────────────────────────────┤
│ [< Prev] [Leaderboard] [Next >] │
└─────────────────────────────┘
```

### Key UI Elements
1. **Quick Score Entry**: Tap to edit, +/- buttons for quick adjustment
2. **Visual Feedback**: Colors, animations for winners
3. **Status Bar**: Show current game status prominently
4. **Easy Navigation**: Swipe between holes, quick access to leaderboard
5. **Clear Winners**: Visual indicators for hole/game winners

## 📊 Implementation Priority

### MVP (Week 1)
1. Player management
2. Basic multi-player scoring
3. Skins game (most popular format)
4. Data persistence

### Phase 2 (Week 2)
1. Nassau format
2. Stableford scoring
3. Enhanced UI/UX
4. Game statistics

### Phase 3 (Future)
1. Match play variations
2. Team games
3. Custom game formats
4. Social features (invites, sharing)

## 🔧 Technical Considerations

### State Management
- Extend ScorecardContext to include game data
- Create separate GameContext for complex game logic
- Ensure sync between main score and game scores

### Performance
- Optimize for 4-player scoring updates
- Efficient calculation of game status
- Smooth animations without lag

### Data Integrity
- Validate all score entries
- Handle edge cases (tied holes, concessions)
- Ensure consistency between game formats

### Offline Support
- Full offline functionality
- Queue sync when connection restored
- Conflict resolution for multi-device scenarios

## 📝 Testing Checklist

### Functional Tests
- [ ] Add/remove players
- [ ] Select different game formats
- [ ] Enter scores for all players
- [ ] Calculate winners correctly
- [ ] Handle tied holes
- [ ] Save and restore game state

### Edge Cases
- [ ] Player drops out mid-round
- [ ] Tied games
- [ ] Maximum scores
- [ ] Handicap calculations
- [ ] Offline/online transitions

### User Experience
- [ ] Intuitive score entry
- [ ] Clear game status
- [ ] Easy navigation
- [ ] Responsive performance
- [ ] Helpful error messages

## 🚀 Success Metrics
- Players can track multiple game formats simultaneously
- Score entry is quick and error-free
- Game calculations are accurate
- UI clearly shows game status
- Data persists across sessions
- Friends enjoy playing together with the app

## 📅 Timeline
- Week 1: Core functionality (Phases 1-4)
- Week 2: Additional formats and polish (Phases 5-10)
- Ongoing: User feedback and iterations

## 🎯 Next Steps
1. Start with Phase 1.1 - Create AddPlayersScreen
2. Build incrementally, test each phase
3. Get user feedback early and often
4. Iterate based on real-world usage