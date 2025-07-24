C:\WINDOWS\system32>adb -s 192.168.0.159:32783 logcat \*:S GolfWearMain:V
--------- beginning of main
07-24 17:05:33.408 10336 10336 D GolfWearMain: Registering message and data listeners
07-24 17:05:33.438 10336 10336 D GolfWearMain: updateUIForRoundStatus - Connect button: com.google.android.material.button.MaterialButton{4f8d21d VFED..C.. ......I. 0,0-0,0 #7f0a0088 app:id/connect_round_button}, enabled: true
07-24 17:05:33.439 10336 10336 D GolfWearMain: Connect button found: com.google.android.material.button.MaterialButton{4f8d21d VFED..C.. ......I. 0,0-0,0 #7f0a0088 app:id/connect_round_button}
07-24 17:05:33.440 10336 10336 D GolfWearMain: Button visibility: 0, enabled: true
07-24 17:05:33.440 10336 10336 D GolfWearMain: Setting up connect button
07-24 17:05:33.440 10336 10336 D GolfWearMain: Connect button listener set
07-24 17:05:33.444 10336 10336 D GolfWearMain: Manually started WearableListenerService
07-24 17:05:33.447 10336 10336 D GolfWearMain: Started DirectMessageService as backup
07-24 17:05:33.588 10336 10336 D GolfWearMain: onResume called
07-24 17:05:33.599 10336 10336 D GolfWearMain: No active round on resume, checking for active round on phone
07-24 17:05:34.401 10336 10336 D GolfWearMain: requestActiveRound called
07-24 17:05:34.422 10336 10397 D GolfWearMain: Getting connected nodes...
07-24 17:05:34.470 10336 10397 D GolfWearMain: Found 1 connected nodes
07-24 17:05:34.470 10336 10397 D GolfWearMain: Sending round request to node: Jano's Z Fold4
07-24 17:05:34.531 10336 10397 D GolfWearMain: Round request sent successfully to Jano's Z Fold4
07-24 17:05:34.631 10336 10336 D GolfWearMain: ===============================================
07-24 17:05:34.631 10336 10336 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-24 17:05:34.631 10336 10336 D GolfWearMain: Path: /round/response
07-24 17:05:34.631 10336 10336 D GolfWearMain: From: 236fb467
07-24 17:05:34.631 10336 10336 D GolfWearMain: Data: NO_ACTIVE_ROUND
07-24 17:05:34.631 10336 10336 D GolfWearMain: ===============================================
07-24 17:05:34.632 10336 10336 D GolfWearMain: handleRoundResponse called with data size: 15
07-24 17:05:34.632 10336 10336 D GolfWearMain: Round response: NO_ACTIVE_ROUND
07-24 17:05:34.632 10336 10336 D GolfWearMain: No active round on phone
07-24 17:05:39.538 10336 10336 D GolfWearMain: Timeout - no round response received
07-24 17:05:44.206 10336 10336 D GolfWearMain: ===============================================
07-24 17:05:44.206 10336 10336 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-24 17:05:44.207 10336 10336 D GolfWearMain: Path: /hole/change
07-24 17:05:44.207 10336 10336 D GolfWearMain: From: 236fb467
07-24 17:05:44.207 10336 10336 D GolfWearMain: Data: {"currentHole":1}
07-24 17:05:44.207 10336 10336 D GolfWearMain: ===============================================
07-24 17:05:44.251 10336 10336 D GolfWearMain: ===============================================
07-24 17:05:44.251 10336 10336 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-24 17:05:44.252 10336 10336 D GolfWearMain: Path: /round/start
07-24 17:05:44.252 10336 10336 D GolfWearMain: From: 236fb467
07-24 17:05:44.252 10336 10336 D GolfWearMain: Data: {"roundId":"local_round_1753369544169","courseName":"Local Golf Course","currentHole":1,"totalHoles":18,"timestamp":1753369544394}
07-24 17:05:44.252 10336 10336 D GolfWearMain: ===============================================
07-24 17:05:44.254 10336 10336 D GolfWearMain: Round started with data: {"roundId":"local_round_1753369544169","courseName":"Local Golf Course","currentHole":1,"totalHoles":18,"timestamp":1753369544394}
07-24 17:05:44.255 10336 10336 D GolfWearMain: RoundId: local_round_1753369544169, CurrentHole: 1
07-24 17:05:45.080 10336 10336 D GolfWearMain: Round started from intent with data: {"roundId":"local_round_1753369544169","courseName":"Local Golf Course","currentHole":1,"totalHoles":18,"timestamp":1753369544394}
07-24 17:05:45.092 10336 10336 D GolfWearMain: onResume called
07-24 17:05:58.949 10336 10336 D GolfWearMain: onResume called
07-24 17:06:02.562 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:02.562 10336 10336 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-24 17:06:02.562 10336 10336 D GolfWearMain: Path: /stats/update
07-24 17:06:02.562 10336 10336 D GolfWearMain: From: 236fb467
07-24 17:06:02.562 10336 10336 D GolfWearMain: Data: {"distanceToPin":3,"measurementUnit":"imperial","currentHole":1}
07-24 17:06:02.562 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:02.641 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:02.641 10336 10336 D GolfWearMain: DATA CHANGED IN MAINACTIVITY!
07-24 17:06:02.645 10336 10336 D GolfWearMain: Data event path: /stats/data
07-24 17:06:02.646 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:02.656 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:02.656 10336 10336 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-24 17:06:02.656 10336 10336 D GolfWearMain: Path: /stats/update
07-24 17:06:02.657 10336 10336 D GolfWearMain: From: 236fb467
07-24 17:06:02.657 10336 10336 D GolfWearMain: Data: {"distanceToPin":3,"measurementUnit":"imperial","currentHole":1}
07-24 17:06:02.657 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:06.005 10336 10336 D GolfWearMain: Removed message and data listeners
07-24 17:06:08.518 10336 10336 D GolfWearMain: Registering message and data listeners
07-24 17:06:08.520 10336 10336 D GolfWearMain: updateUIForRoundStatus - Connect button: com.google.android.material.button.MaterialButton{65c62cb VFED..C.. ......I. 0,0-0,0 #7f0a0088 app:id/connect_round_button}, enabled: true
07-24 17:06:08.520 10336 10336 D GolfWearMain: Connect button found: com.google.android.material.button.MaterialButton{65c62cb VFED..C.. ......I. 0,0-0,0 #7f0a0088 app:id/connect_round_button}
07-24 17:06:08.520 10336 10336 D GolfWearMain: Button visibility: 0, enabled: true
07-24 17:06:08.521 10336 10336 D GolfWearMain: Setting up connect button
07-24 17:06:08.521 10336 10336 D GolfWearMain: Connect button listener set
07-24 17:06:08.532 10336 10336 D GolfWearMain: Manually started WearableListenerService
07-24 17:06:08.546 10336 10336 D GolfWearMain: Started DirectMessageService as backup
07-24 17:06:08.569 10336 10336 D GolfWearMain: onResume called
07-24 17:06:08.570 10336 10336 D GolfWearMain: No active round on resume, checking for active round on phone
07-24 17:06:09.089 10336 10336 D GolfWearMain: requestActiveRound called
07-24 17:06:09.098 10336 10397 D GolfWearMain: Getting connected nodes...
07-24 17:06:09.111 10336 10397 D GolfWearMain: Found 1 connected nodes
07-24 17:06:09.112 10336 10397 D GolfWearMain: Sending round request to node: Jano's Z Fold4
07-24 17:06:09.138 10336 10397 D GolfWearMain: Round request sent successfully to Jano's Z Fold4
07-24 17:06:09.723 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:09.723 10336 10336 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-24 17:06:09.724 10336 10336 D GolfWearMain: Path: /round/response
07-24 17:06:09.724 10336 10336 D GolfWearMain: From: 236fb467
07-24 17:06:09.725 10336 10336 D GolfWearMain: Data: NO_ACTIVE_ROUND
07-24 17:06:09.725 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:09.725 10336 10336 D GolfWearMain: handleRoundResponse called with data size: 15
07-24 17:06:09.726 10336 10336 D GolfWearMain: Round response: NO_ACTIVE_ROUND
07-24 17:06:09.726 10336 10336 D GolfWearMain: No active round on phone
07-24 17:06:11.495 10336 10336 D GolfWearMain: Connect button touched! Event: MotionEvent { action=ACTION_DOWN, actionButton=0, id[0]=0, x[0]=147.0, y[0]=27.0, toolType[0]=TOOL_TYPE_FINGER, buttonState=0, classification=NONE, metaState=0, flags=0x0, edgeFlags=0x0, pointerCount=1, historySize=0, eventTime=2180631, downTime=2180631, deviceId=5, source=0x1002, displayId=0, eventId=924225151 }
07-24 17:06:11.575 10336 10336 D GolfWearMain: Connect button touched! Event: MotionEvent { action=ACTION_CANCEL, actionButton=0, id[0]=0, x[0]=201.375, y[0]=307.37305, toolType[0]=TOOL_TYPE_FINGER, buttonState=0, classification=NONE, metaState=0, flags=0x20, edgeFlags=0x0, pointerCount=1, historySize=2, eventTime=2180720, downTime=2180631, deviceId=5, source=0x1002, displayId=0, eventId=470589819 }
07-24 17:06:14.148 10336 10336 D GolfWearMain: Timeout - no round response received
07-24 17:06:19.167 10336 10336 D GolfWearMain: Connect button touched! Event: MotionEvent { action=ACTION_DOWN, actionButton=0, id[0]=0, x[0]=135.0, y[0]=91.0, toolType[0]=TOOL_TYPE_FINGER, buttonState=0, classification=NONE, metaState=0, flags=0x0, edgeFlags=0x0, pointerCount=1, historySize=0, eventTime=2188312, downTime=2188312, deviceId=5, source=0x1002, displayId=0, eventId=689419708 }
07-24 17:06:19.214 10336 10336 D GolfWearMain: Connect button touched! Event: MotionEvent { action=ACTION_CANCEL, actionButton=0, id[0]=0, x[0]=187.5, y[0]=298.5, toolType[0]=TOOL_TYPE_FINGER, buttonState=0, classification=NONE, metaState=0, flags=0x20, edgeFlags=0x0, pointerCount=1, historySize=2, eventTime=2188357, downTime=2188312, deviceId=5, source=0x1002, displayId=0, eventId=1046201743 }
07-24 17:06:20.372 10336 10336 D GolfWearMain: Connect button touched! Event: MotionEvent { action=ACTION_DOWN, actionButton=0, id[0]=0, x[0]=142.0, y[0]=61.0, toolType[0]=TOOL_TYPE_FINGER, buttonState=0, classification=NONE, metaState=0, flags=0x0, edgeFlags=0x0, pointerCount=1, historySize=0, eventTime=2189518, downTime=2189518, deviceId=5, source=0x1002, displayId=0, eventId=963829291 }
07-24 17:06:20.658 10336 10336 D GolfWearMain: Connect button touched! Event: MotionEvent { action=ACTION_UP, actionButton=0, id[0]=0, x[0]=142.0, y[0]=61.0, toolType[0]=TOOL_TYPE_FINGER, buttonState=0, classification=NONE, metaState=0, flags=0x0, edgeFlags=0x0, pointerCount=1, historySize=0, eventTime=2189645, downTime=2189518, deviceId=5, source=0x1002, displayId=0, eventId=244001605 }
07-24 17:06:20.666 10336 10336 D GolfWearMain: Connect button clicked!
07-24 17:06:20.666 10336 10336 D GolfWearMain: requestActiveRound called
07-24 17:06:20.677 10336 10397 D GolfWearMain: Getting connected nodes...
07-24 17:06:20.697 10336 10397 D GolfWearMain: Found 1 connected nodes
07-24 17:06:20.697 10336 10397 D GolfWearMain: Sending round request to node: Jano's Z Fold4
07-24 17:06:20.711 10336 10397 D GolfWearMain: Round request sent successfully to Jano's Z Fold4
07-24 17:06:21.156 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:21.157 10336 10336 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-24 17:06:21.157 10336 10336 D GolfWearMain: Path: /stats/update
07-24 17:06:21.157 10336 10336 D GolfWearMain: From: 236fb467
07-24 17:06:21.158 10336 10336 D GolfWearMain: Data: {"distanceToPin":2,"measurementUnit":"imperial","currentHole":1}
07-24 17:06:21.158 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:21.215 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:21.215 10336 10336 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-24 17:06:21.215 10336 10336 D GolfWearMain: Path: /round/response
07-24 17:06:21.215 10336 10336 D GolfWearMain: From: 236fb467
07-24 17:06:21.216 10336 10336 D GolfWearMain: Data: NO_ACTIVE_ROUND
07-24 17:06:21.216 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:21.216 10336 10336 D GolfWearMain: handleRoundResponse called with data size: 15
07-24 17:06:21.216 10336 10336 D GolfWearMain: Round response: NO_ACTIVE_ROUND
07-24 17:06:21.216 10336 10336 D GolfWearMain: No active round on phone
07-24 17:06:21.250 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:21.250 10336 10336 D GolfWearMain: DATA CHANGED IN MAINACTIVITY!
07-24 17:06:21.251 10336 10336 D GolfWearMain: Data event path: /stats/data
07-24 17:06:21.252 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:25.716 10336 10336 D GolfWearMain: Timeout - no round response received
07-24 17:06:31.075 10336 10397 D GolfWearMain: ===============================================
07-24 17:06:31.076 10336 10397 D GolfWearMain: SENDING TEST MESSAGE FROM WATCH
07-24 17:06:31.083 10336 10397 D GolfWearMain: Found 1 connected nodes
07-24 17:06:31.083 10336 10397 D GolfWearMain: Sending to node: Jano's Z Fold4 (236fb467)
07-24 17:06:31.108 10336 10397 D GolfWearMain: Message sent successfully!
07-24 17:06:31.109 10336 10397 D GolfWearMain: ===============================================
07-24 17:06:36.062 10336 10336 D GolfWearMain: ===============================================
07-24 17:06:36.063 10336 10336 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-24 17:06:36.063 10336 10336 D GolfWearMain: Path: /stats/update
07-24 17:06:36.064 10336 10336 D GolfWearMain: From: 236fb467
07-24 17:06:36.065 10336 10336 D GolfWearMain: Data: {"distanceToPin":2,"measurementUnit":"imperial","currentHole":1}
07-24 17:06:36.065 10336 10336 D GolfWearMain: ===============================================
