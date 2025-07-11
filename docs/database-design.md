# Golf App Database Design

## Overview
This document outlines the database structure for both local (mobile) and cloud storage, with a focus on offline-first architecture and conflict resolution.

## Cloud Database Schema (PostgreSQL)

### Core User Management
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    handicap DECIMAL(3,1),
    profile_image_url TEXT,
    home_course_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    subscription_tier VARCHAR(20) DEFAULT 'free'
);

-- Friends/connections
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- User equipment
CREATE TABLE user_clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_type VARCHAR(20) NOT NULL, -- driver, 3wood, 5wood, hybrid, 3i-9i, pw, sw, lw, putter
    brand VARCHAR(50),
    model VARCHAR(100),
    shaft_type VARCHAR(20), -- regular, stiff, x-stiff
    avg_distance DECIMAL(5,1), -- learned average distance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Course Management
```sql
-- Golf courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    website TEXT,
    location GEOGRAPHY(POINT, 4326), -- PostGIS point
    timezone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_verified BOOLEAN DEFAULT FALSE
);

-- Course tee boxes
CREATE TABLE tee_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- Blue, White, Red, etc.
    color VARCHAR(20),
    rating DECIMAL(4,1),
    slope INTEGER,
    total_yards INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holes configuration
CREATE TABLE holes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
    par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 6),
    handicap_index INTEGER CHECK (handicap_index BETWEEN 1 AND 18),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, hole_number)
);

-- Hole details per tee box
CREATE TABLE hole_tees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hole_id UUID REFERENCES holes(id) ON DELETE CASCADE,
    tee_box_id UUID REFERENCES tee_boxes(id) ON DELETE CASCADE,
    distance_yards INTEGER NOT NULL,
    UNIQUE(hole_id, tee_box_id)
);

-- Course features (learned from users)
CREATE TABLE course_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hole_id UUID REFERENCES holes(id) ON DELETE CASCADE,
    feature_type VARCHAR(50), -- green, bunker, water, fairway, rough, tee_box
    name VARCHAR(100),
    boundary GEOGRAPHY(POLYGON, 4326), -- PostGIS polygon
    center_point GEOGRAPHY(POINT, 4326),
    created_by UUID REFERENCES users(id),
    confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0-1 based on user confirmations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pin positions (crowdsourced)
CREATE TABLE pin_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hole_id UUID REFERENCES holes(id) ON DELETE CASCADE,
    position GEOGRAPHY(POINT, 4326) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recorded_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE
);
```

### Round and Scoring Data
```sql
-- Rounds of golf
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id),
    tee_box_id UUID REFERENCES tee_boxes(id),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    weather_conditions JSONB, -- temp, wind_speed, wind_direction, conditions
    walking_riding VARCHAR(20), -- walking, riding
    round_type VARCHAR(20) DEFAULT 'casual', -- casual, tournament, practice
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Round participants
CREATE TABLE round_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_scorer BOOLEAN DEFAULT FALSE, -- who's keeping score
    playing_handicap INTEGER,
    tee_box_id UUID REFERENCES tee_boxes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(round_id, user_id)
);

-- Hole scores
CREATE TABLE hole_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_participant_id UUID REFERENCES round_participants(id) ON DELETE CASCADE,
    hole_id UUID REFERENCES holes(id),
    score INTEGER NOT NULL CHECK (score > 0),
    putts INTEGER CHECK (putts >= 0),
    fairway_hit BOOLEAN,
    green_in_regulation BOOLEAN,
    penalties INTEGER DEFAULT 0,
    sand_saves INTEGER DEFAULT 0,
    up_and_downs BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id), -- who entered this score
    sync_conflict_data JSONB, -- stores conflicting entries
    UNIQUE(round_participant_id, hole_id)
);

-- Shot tracking
CREATE TABLE shots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_participant_id UUID REFERENCES round_participants(id) ON DELETE CASCADE,
    hole_id UUID REFERENCES holes(id),
    shot_number INTEGER NOT NULL,
    club_id UUID REFERENCES user_clubs(id),
    start_position GEOGRAPHY(POINT, 4326) NOT NULL,
    end_position GEOGRAPHY(POINT, 4326) NOT NULL,
    distance_yards DECIMAL(5,1),
    shot_shape VARCHAR(20), -- straight, draw, fade, slice, hook
    lie_type VARCHAR(20), -- tee, fairway, rough, sand, recovery
    shot_type VARCHAR(20), -- full, pitch, chip, putt, penalty
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Sync and Conflict Management
```sql
-- Sync log for offline changes
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    device_id VARCHAR(255) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(20) NOT NULL, -- insert, update, delete
    record_id UUID NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    conflict_resolved BOOLEAN DEFAULT FALSE
);

-- Conflict resolution history
CREATE TABLE sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    conflicting_data JSONB NOT NULL, -- array of conflicting versions
    resolution_method VARCHAR(50), -- auto_latest, auto_consensus, manual
    resolved_data JSONB,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id)
);
```

### Analytics and ML Data
```sql
-- Club performance analytics
CREATE TABLE club_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID REFERENCES user_clubs(id) ON DELETE CASCADE,
    conditions JSONB, -- wind, temp, elevation
    avg_distance DECIMAL(5,1),
    accuracy_percentage DECIMAL(5,2),
    sample_size INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course recommendations cache
CREATE TABLE course_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hole_id UUID REFERENCES holes(id) ON DELETE CASCADE,
    from_position GEOGRAPHY(POINT, 4326),
    to_target VARCHAR(50), -- green_center, layup_point, etc
    distance_yards DECIMAL(5,1),
    recommended_club VARCHAR(20),
    confidence_score DECIMAL(3,2),
    factors JSONB, -- wind, elevation, hazards considered
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Local Database Schema (SQLite - Mobile App)

The local database mirrors the cloud structure but with additional fields for sync management:

```sql
-- Add to each table:
-- local_id INTEGER PRIMARY KEY AUTOINCREMENT (for offline record creation)
-- cloud_id UUID (maps to cloud database id)
-- is_synced BOOLEAN DEFAULT FALSE
-- last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- sync_version INTEGER DEFAULT 1

-- Example: Local rounds table
CREATE TABLE local_rounds (
    local_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cloud_id TEXT, -- UUID as text
    course_id TEXT,
    tee_box_id TEXT,
    started_at TEXT, -- ISO 8601 format
    finished_at TEXT,
    weather_conditions TEXT, -- JSON
    walking_riding TEXT,
    round_type TEXT DEFAULT 'casual',
    is_synced INTEGER DEFAULT 0, -- SQLite uses 0/1 for boolean
    last_modified TEXT DEFAULT CURRENT_TIMESTAMP,
    sync_version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Offline queue for changes
CREATE TABLE offline_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL, -- insert, update, delete
    record_local_id INTEGER,
    record_cloud_id TEXT,
    data TEXT NOT NULL, -- JSON
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT
);

-- Cached map tiles
CREATE TABLE map_tiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id TEXT NOT NULL,
    zoom_level INTEGER NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    tile_data BLOB NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_accessed TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, zoom_level, x, y)
);

-- Cached satellite imagery
CREATE TABLE satellite_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id TEXT NOT NULL,
    hole_number INTEGER,
    image_type TEXT, -- overview, hole_detail
    image_data BLOB NOT NULL,
    resolution TEXT,
    bounds TEXT, -- JSON with lat/lng bounds
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT
);
```

## Sync Strategy

### Conflict Resolution Rules

1. **Score Conflicts**: 
   - If multiple users enter the same player's score:
     - If the player themselves entered a score, use theirs
     - If scores match from 2+ users, accept it
     - If scores differ, flag for manual resolution
   
2. **Shot Tracking**:
   - Player's own shots always take precedence
   - GPS data timestamps determine order
   
3. **Course Mapping**:
   - Aggregate multiple user inputs
   - Use confidence scoring based on:
     - Number of confirmations
     - User reputation/accuracy history
     - Recency of data

4. **General Rules**:
   - Last-write-wins for user preferences
   - Additive for new records (shots, rounds)
   - Version vectors for complex objects

## Indexes for Performance

```sql
-- Cloud database indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_rounds_user_date ON rounds(started_at DESC);
CREATE INDEX idx_shots_round_hole ON shots(round_participant_id, hole_id, shot_number);
CREATE INDEX idx_course_location ON courses USING GIST(location);
CREATE INDEX idx_features_hole ON course_features(hole_id);
CREATE INDEX idx_sync_queue_user_device ON sync_queue(user_id, device_id, synced_at);

-- Local database indexes
CREATE INDEX idx_local_rounds_sync ON local_rounds(is_synced, last_modified);
CREATE INDEX idx_offline_queue_retry ON offline_queue(retry_count, created_at);
CREATE INDEX idx_map_tiles_course ON map_tiles(course_id, last_accessed);
```