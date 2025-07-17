(NOBRIDGE) LOG Bridgeless mode is enabled
(NOBRIDGE) LOG Running "MinimalApp" with {"rootTag":21,"initialProps":{},"fabric":true}
INFO
💡 JavaScript logs will be removed from Metro in React Native 0.77! Please use React Native DevTools as your default tool. Tip: Type j in the terminal to open (requires Google Chrome or Microsoft Edge).
(NOBRIDGE) LOG 🔐 Starting login request...
(NOBRIDGE) LOG 📍 API URL: http://192.168.0.110:3000/api/auth/login
(NOBRIDGE) LOG 📧 Email: test@golf.com
(NOBRIDGE) LOG 📡 Response received: 200
(NOBRIDGE) LOG 📡 Response ok: true
(NOBRIDGE) LOG 📦 Response data: {"data": {"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTM0Y2MyMC0xN2NmLTQ3N2UtYTBjMS0wOWI1NTQ2OTZlNGMiLCJlbWFpbCI6InRlc3RAZ29sZi5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNzUyNzgxMDgzLCJleHAiOjE3NTMzODU4ODN9.adnQ6GKILy4SKVl7GNYTKEVKDIFJ1k0lNoGESUZ5SIA", "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTM0Y2MyMC0xN2NmLTQ3N2UtYTBjMS0wOWI1NTQ2OTZlNGMiLCJlbWFpbCI6InRlc3RAZ29sZi5jb20iLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiaWF0IjoxNzUyNzgxMDgzLCJleHAiOjE3NTI4Njc0ODN9.MTuvFCQ0x1-f0CtlCz9fWJtJ7crfoTug9hdQ_XDCMiU", "user": {"email": "test@golf.com", "firstName": "Test", "handicap": 15.2, "id": "5534cc20-17cf-477e-a0c1-09b554696e4c", "lastName": "User", "preferences": [Object], "username": "testuser"}}, "success": true}
(NOBRIDGE) LOG ✅ Login successful, storing auth data...
(NOBRIDGE) LOG 🎫 Token received: yes
(NOBRIDGE) LOG 👤 User data: {"email": "test@golf.com", "firstName": "Test", "handicap": 15.2, "id": "5534cc20-17cf-477e-a0c1-09b554696e4c", "lastName": "User", "preferences": {"autoGPS": true, "defaultTeeBox": "white", "notifications": {"achievements": true, "friendRequests": true, "roundReminders": true}, "shareData": true, "units": "imperial"}, "username": "testuser"}
(NOBRIDGE) LOG Loading shots for round: f05f2329-13c8-4fd2-9c37-124162d9d161 course: bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG 🎓 Initializing CourseKnowledgeService...
(NOBRIDGE) LOG 🔄 Initializing ShotSyncService...
(NOBRIDGE) LOG 🔄 Initializing OfflineQueueService...
(NOBRIDGE) LOG ✅ OfflineQueueService initialized
(NOBRIDGE) LOG ⏰ Periodic sync started (every 15 minutes)
(NOBRIDGE) LOG ✅ ShotSyncService initialized
(NOBRIDGE) LOG 🎓 Initializing CourseKnowledgeAggregationService...
(NOBRIDGE) LOG 📡 Network status changed: offline -> online
(NOBRIDGE) LOG 📡 Network status changed: online -> online
(NOBRIDGE) LOG 📡 Network status changed: online -> online
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG ⏰ Course knowledge sync started (every 30 minutes)
(NOBRIDGE) LOG ✅ CourseKnowledgeAggregationService initialized
(NOBRIDGE) LOG 📍 basePosition updated: {"center": [-82.0206, 33.5031], "zoom": 18}
(NOBRIDGE) LOG 🚀 PersistentTileCache.initialize() called
(NOBRIDGE) LOG 📦 Tile cache database initialized
(NOBRIDGE) LOG ✅ SQLite database initialized
(NOBRIDGE) LOG MapView loading shots: 0
(NOBRIDGE) LOG Loaded shots: 0
(NOBRIDGE) LOG No shots found, adding demo shots
(NOBRIDGE) LOG Adding demo shots at Augusta National center: -82.0206, 33.5031
(NOBRIDGE) LOG Added shot 1 at: 33.5031, -82.0206
(NOBRIDGE) LOG Added shot 2 at: 33.5016, -82.0186
(NOBRIDGE) LOG Added shot 3 at: 33.500600000000006, -82.0176
(NOBRIDGE) LOG Added shot 4 at: 33.5003, -82.0174
(NOBRIDGE) LOG ⚙️ Settings loaded: enabled=true, limit=104857600
(NOBRIDGE) LOG 📦 Persistent tile cache initialized
(NOBRIDGE) LOG 📊 Persistent cache initialized: {"limit": "100MB", "memory": "0/200 tiles", "persistent": "0 tiles (NaNMB)"}
(NOBRIDGE) ERROR GPS error: {"code": 1, "message": "Location permission not granted."}
(NOBRIDGE) ERROR Error getting current distances: {"code": 1, "message": "Location permission not granted."}
(NOBRIDGE) LOG Demo shots added: 4
(NOBRIDGE) LOG Processing existing shots through course knowledge system
(NOBRIDGE) LOG 🎓 Processing complete round for course learning: 4 shots
(NOBRIDGE) LOG 🎓 Creating new course knowledge for course bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG 🎓 Round processed - Course knowledge updated
(NOBRIDGE) LOG 🎓 Course Learning Summary:
(NOBRIDGE) LOG - Course ID: bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG - Last updated: 2025-07-17T19:38:17.344Z
(NOBRIDGE) LOG - Holes with data: 1
(NOBRIDGE) LOG - Total tee boxes: 1
(NOBRIDGE) LOG - Average pin confidence: 0.50
(NOBRIDGE) LOG - Average green confidence: 0.00
(NOBRIDGE) LOG Shot tracking service initialized
(NOBRIDGE) LOG 🏌️ Initializing ClubService...
(NOBRIDGE) LOG 🏌️ Creating default club set...
(NOBRIDGE) LOG ✅ Default clubs created
(NOBRIDGE) LOG ✅ ClubService initialized with 12 clubs
(NOBRIDGE) LOG Shot tracking and club services initialized for round: f05f2329-13c8-4fd2-9c37-124162d9d161
(NOBRIDGE) LOG ✅ Location permission granted
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 4, showShots: true
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 4, showShots: true
(NOBRIDGE) LOG 📍 User location updated: {"coords": {"accuracy": 17.50200080871582, "altitude": 1371.5, "course": 0, "heading": 0, "latitude": -25.7662825, "longitude": 28.3775081, "speed": 0}, "timestamp": 1752780639338}
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 4, showShots: true
(NOBRIDGE) LOG MapView loading shots: 4
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 4, showShots: true
(NOBRIDGE) LOG MapView loading shots: 4
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG 🎓 Distance to pin: 13355430m (pin, confidence: 0.50)
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 4, showShots: true
(NOBRIDGE) LOG MapView loading shots: 4
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 4, showShots: true
(NOBRIDGE) LOG MapView loading shots: 4
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG MapView loading shots: 4
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG 🎓 Distance to pin: 13355430m (pin, confidence: 0.50)
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 4, showShots: true
(NOBRIDGE) LOG MapView loading shots: 4
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 4, showShots: true
(NOBRIDGE) LOG MapView loading shots: 4
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG MapView loading shots: 4
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG 🎓 Distance to pin: 13355429m (pin, confidence: 0.50)
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 4, showShots: true
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 4, showShots: true
(NOBRIDGE) LOG 🎓 Processing shot for course learning: 1-1
(NOBRIDGE) LOG 🎓 Shot processed - Course knowledge updated for hole 1
(NOBRIDGE) LOG 🎓 Learning progress for hole 1:
(NOBRIDGE) LOG - Tee boxes: 1 (avg confidence: 0.00)
(NOBRIDGE) LOG - Pin confidence: 0.70
(NOBRIDGE) LOG - Green confidence: 0.00 (2 samples)
(NOBRIDGE) LOG - Green area: 0 sq yards
(NOBRIDGE) LOG 🔄 Starting pending shots sync...
(NOBRIDGE) LOG Shot logged: Hole 1, Shot 1
(NOBRIDGE) LOG Shot tracked: Hole 1, Shot 1
(NOBRIDGE) LOG 🔍 Checking auth_token: not found
(NOBRIDGE) LOG 🔍 Checking token: not found
(NOBRIDGE) LOG 🔍 Checking userToken: not found
(NOBRIDGE) LOG 🔍 Checking authToken: found
(NOBRIDGE) LOG 📝 Added shot_sync to offline queue (1 items)
(NOBRIDGE) LOG 🔄 Starting sync of 1 items
(NOBRIDGE) LOG 📤 Queued 5 shots for round f05f2329-13c8-4fd2-9c37-124162d9d161
(NOBRIDGE) LOG ✅ Synced 5 shots across 1 rounds
(NOBRIDGE) LOG 🎓 Starting course knowledge sync...
(NOBRIDGE) LOG 📝 Added course_learning_sync to offline queue (2 items)
(NOBRIDGE) LOG 📤 Queued course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Synced knowledge for 1 courses
(NOBRIDGE) LOG 📤 Successfully synced all 5 shots to server
(NOBRIDGE) LOG ✅ Sync completed: 1 success, 0 failed, 1 remaining
(NOBRIDGE) LOG MapView loading shots: 5
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 5, showShots: true
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 6, showShots: true
(NOBRIDGE) LOG 🎓 Processing shot for course learning: 1-2
(NOBRIDGE) LOG 🎓 Shot processed - Course knowledge updated for hole 1
(NOBRIDGE) LOG 🎓 Learning progress for hole 1:
(NOBRIDGE) LOG - Tee boxes: 1 (avg confidence: 0.00)
(NOBRIDGE) LOG - Pin confidence: 0.90
(NOBRIDGE) LOG - Green confidence: 0.00 (3 samples)
(NOBRIDGE) LOG - Green area: 0 sq yards
(NOBRIDGE) LOG 🔄 Starting pending shots sync...
(NOBRIDGE) LOG Shot logged: Hole 1, Shot 2
(NOBRIDGE) LOG Shot tracked: Hole 1, Shot 2
(NOBRIDGE) LOG 🔍 Checking auth_token: not found
(NOBRIDGE) LOG 🔍 Checking token: not found
(NOBRIDGE) LOG 🔍 Checking userToken: not found
(NOBRIDGE) LOG 🔍 Checking authToken: found
(NOBRIDGE) LOG 📝 Added shot_sync to offline queue (2 items)
(NOBRIDGE) LOG 🔄 Starting sync of 2 items
(NOBRIDGE) LOG 📤 Queued 6 shots for round f05f2329-13c8-4fd2-9c37-124162d9d161
(NOBRIDGE) LOG ✅ Synced 6 shots across 1 rounds
(NOBRIDGE) LOG 🎓 Starting course knowledge sync...
(NOBRIDGE) LOG 📝 Added course_learning_sync to offline queue (3 items)
(NOBRIDGE) LOG 📤 Queued course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Synced knowledge for 1 courses
(NOBRIDGE) LOG 📤 Successfully synced all 6 shots to server
(NOBRIDGE) LOG 📤 Synced course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Sync completed: 2 success, 0 failed, 1 remaining
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 6, showShots: true
(NOBRIDGE) LOG 🎓 Processing shot for course learning: 1-3
(NOBRIDGE) LOG 🎓 Shot processed - Course knowledge updated for hole 1
(NOBRIDGE) LOG 🎓 Learning progress for hole 1:
(NOBRIDGE) LOG - Tee boxes: 1 (avg confidence: 0.00)
(NOBRIDGE) LOG - Pin confidence: 0.80
(NOBRIDGE) LOG - Green confidence: 0.00 (4 samples)
(NOBRIDGE) LOG - Green area: 0 sq yards
(NOBRIDGE) LOG 🔄 Starting pending shots sync...
(NOBRIDGE) LOG Shot logged: Hole 1, Shot 3
(NOBRIDGE) LOG Shot tracked: Hole 1, Shot 3
(NOBRIDGE) LOG 🔍 Checking auth_token: not found
(NOBRIDGE) LOG 🔍 Checking token: not found
(NOBRIDGE) LOG 🔍 Checking userToken: not found
(NOBRIDGE) LOG 🔍 Checking authToken: found
(NOBRIDGE) LOG 📝 Added shot_sync to offline queue (2 items)
(NOBRIDGE) LOG 🔄 Starting sync of 2 items
(NOBRIDGE) LOG 📤 Queued 7 shots for round f05f2329-13c8-4fd2-9c37-124162d9d161
(NOBRIDGE) LOG ✅ Synced 7 shots across 1 rounds
(NOBRIDGE) LOG 🎓 Starting course knowledge sync...
(NOBRIDGE) LOG 📝 Added course_learning_sync to offline queue (3 items)
(NOBRIDGE) LOG 📤 Queued course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Synced knowledge for 1 courses
(NOBRIDGE) LOG MapView loading shots: 7
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 7, showShots: true
(NOBRIDGE) LOG 🎓 Distance to pin: 12079781m (pin, confidence: 0.80)
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 8, showShots: true
(NOBRIDGE) LOG 📤 Successfully synced all 7 shots to server
(NOBRIDGE) LOG 🎓 Processing shot for course learning: 1-4
(NOBRIDGE) LOG 🎓 Shot processed - Course knowledge updated for hole 1
(NOBRIDGE) LOG 🎓 Learning progress for hole 1:
(NOBRIDGE) LOG - Tee boxes: 1 (avg confidence: 0.00)
(NOBRIDGE) LOG - Pin confidence: 1.00
(NOBRIDGE) LOG - Green confidence: 0.00 (5 samples)
(NOBRIDGE) LOG - Green area: 0 sq yards
(NOBRIDGE) LOG 🔄 Starting pending shots sync...
(NOBRIDGE) LOG Shot logged: Hole 1, Shot 4
(NOBRIDGE) LOG Shot tracked: Hole 1, Shot 4
(NOBRIDGE) LOG 🔍 Checking auth_token: not found
(NOBRIDGE) LOG 🔍 Checking token: not found
(NOBRIDGE) LOG 🔍 Checking userToken: not found
(NOBRIDGE) LOG 🔍 Checking authToken: found
(NOBRIDGE) LOG 📝 Added shot_sync to offline queue (3 items)
(NOBRIDGE) LOG 📤 Queued 8 shots for round f05f2329-13c8-4fd2-9c37-124162d9d161
(NOBRIDGE) LOG ✅ Synced 8 shots across 1 rounds
(NOBRIDGE) LOG 🎓 Starting course knowledge sync...
(NOBRIDGE) LOG 📝 Added course_learning_sync to offline queue (4 items)
(NOBRIDGE) LOG 📤 Queued course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Synced knowledge for 1 courses
(NOBRIDGE) LOG 📤 Synced course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Sync completed: 2 success, 0 failed, 3 remaining
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 8, showShots: true
(NOBRIDGE) LOG 🎓 Processing shot for course learning: 1-5
(NOBRIDGE) LOG 🎓 Shot processed - Course knowledge updated for hole 1
(NOBRIDGE) LOG 🎓 Learning progress for hole 1:
(NOBRIDGE) LOG - Tee boxes: 1 (avg confidence: 0.00)
(NOBRIDGE) LOG - Pin confidence: 1.00
(NOBRIDGE) LOG - Green confidence: 0.00 (6 samples)
(NOBRIDGE) LOG - Green area: 0 sq yards
(NOBRIDGE) LOG 🔄 Starting pending shots sync...
(NOBRIDGE) LOG Shot logged: Hole 1, Shot 5
(NOBRIDGE) LOG Shot tracked: Hole 1, Shot 5
(NOBRIDGE) LOG 🔍 Checking auth_token: not found
(NOBRIDGE) LOG 🔍 Checking token: not found
(NOBRIDGE) LOG 🔍 Checking userToken: not found
(NOBRIDGE) LOG 🔍 Checking authToken: found
(NOBRIDGE) LOG 📝 Added shot_sync to offline queue (4 items)
(NOBRIDGE) LOG 🔄 Starting sync of 4 items
(NOBRIDGE) LOG 📤 Queued 9 shots for round f05f2329-13c8-4fd2-9c37-124162d9d161
(NOBRIDGE) LOG ✅ Synced 9 shots across 1 rounds
(NOBRIDGE) LOG 🎓 Starting course knowledge sync...
(NOBRIDGE) LOG 📝 Added course_learning_sync to offline queue (5 items)
(NOBRIDGE) LOG 📤 Queued course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Synced knowledge for 1 courses
(NOBRIDGE) LOG 📤 Successfully synced all 8 shots to server
(NOBRIDGE) LOG 📤 Successfully synced all 9 shots to server
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 9, showShots: true
(NOBRIDGE) LOG 🎓 Processing shot for course learning: 1-6
(NOBRIDGE) LOG 🎓 Shot processed - Course knowledge updated for hole 1
(NOBRIDGE) LOG 🎓 Learning progress for hole 1:
(NOBRIDGE) LOG - Tee boxes: 1 (avg confidence: 0.00)
(NOBRIDGE) LOG - Pin confidence: 1.00
(NOBRIDGE) LOG - Green confidence: 0.00 (7 samples)
(NOBRIDGE) LOG - Green area: 0 sq yards
(NOBRIDGE) LOG 🔄 Starting pending shots sync...
(NOBRIDGE) LOG Shot logged: Hole 1, Shot 6
(NOBRIDGE) LOG Shot tracked: Hole 1, Shot 6
(NOBRIDGE) LOG 🔍 Checking auth_token: not found
(NOBRIDGE) LOG 📤 Synced course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG 🔍 Checking token: not found
(NOBRIDGE) LOG 🔍 Checking userToken: not found
(NOBRIDGE) LOG 🔍 Checking authToken: found
(NOBRIDGE) LOG 📝 Added shot_sync to offline queue (3 items)
(NOBRIDGE) LOG 📤 Queued 10 shots for round f05f2329-13c8-4fd2-9c37-124162d9d161
(NOBRIDGE) LOG ✅ Synced 10 shots across 1 rounds
(NOBRIDGE) LOG 🎓 Starting course knowledge sync...
(NOBRIDGE) LOG 📝 Added course_learning_sync to offline queue (4 items)
(NOBRIDGE) LOG 📤 Queued course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Synced knowledge for 1 courses
(NOBRIDGE) LOG 📤 Synced course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Sync completed: 4 success, 0 failed, 3 remaining
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 10, showShots: true
(NOBRIDGE) LOG 🎓 Processing shot for course learning: 1-7
(NOBRIDGE) LOG 🎓 Shot processed - Course knowledge updated for hole 1
(NOBRIDGE) LOG 🎓 Learning progress for hole 1:
(NOBRIDGE) LOG - Tee boxes: 1 (avg confidence: 0.00)
(NOBRIDGE) LOG - Pin confidence: 1.00
(NOBRIDGE) LOG - Green confidence: 0.00 (8 samples)
(NOBRIDGE) LOG - Green area: 0 sq yards
(NOBRIDGE) LOG 🔄 Starting pending shots sync...
(NOBRIDGE) LOG Shot logged: Hole 1, Shot 7
(NOBRIDGE) LOG Shot tracked: Hole 1, Shot 7
(NOBRIDGE) LOG 🔍 Checking auth_token: not found
(NOBRIDGE) LOG 🔍 Checking token: not found
(NOBRIDGE) LOG 🔍 Checking userToken: not found
(NOBRIDGE) LOG 🔍 Checking authToken: found
(NOBRIDGE) LOG 📝 Added shot_sync to offline queue (4 items)
(NOBRIDGE) LOG 🔄 Starting sync of 4 items
(NOBRIDGE) LOG 📤 Queued 11 shots for round f05f2329-13c8-4fd2-9c37-124162d9d161
(NOBRIDGE) LOG ✅ Synced 11 shots across 1 rounds
(NOBRIDGE) LOG 🎓 Starting course knowledge sync...
(NOBRIDGE) LOG 📝 Added course_learning_sync to offline queue (5 items)
(NOBRIDGE) LOG 📤 Queued course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Synced knowledge for 1 courses
(NOBRIDGE) LOG MapView loading shots: 11
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG 📤 Successfully synced all 10 shots to server
(NOBRIDGE) LOG 📤 Successfully synced all 11 shots to server
(NOBRIDGE) LOG 📤 Synced course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG 📤 Synced course knowledge for bec3a95b-d777-4114-8ee2-d5b39c7dbafc
(NOBRIDGE) LOG ✅ Sync completed: 4 success, 0 failed, 1 remaining
(NOBRIDGE) LOG MapView loading shots: 11
(NOBRIDGE) LOG First shot coordinates: {"accuracy": 5, "latitude": 33.5031, "longitude": -82.0206, "timestamp": "2025-07-17T19:38:17.260Z"}
(NOBRIDGE) LOG 🎓 Distance to pin: 11556977m (pin, confidence: 1.00)
(NOBRIDGE) LOG 🗺️ MapViewWithGestures: Component mounting
(NOBRIDGE) LOG Rendering shot toggle button, shots: 11, showShots: true
