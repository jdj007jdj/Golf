-23 20:02:55.547 654 2395 D CoreBackPreview: Window{bfdd7d1 u0 com.minimalapp/com.minimalapp.wear.MainActivity}:
Setting back callback OnBackInvokedCallbackInfo{mCallback=android.window.IOnBackInvokedCallback$Stub$Proxy@34acbc2,
mPriority=-1, mIsAnimationCallback=false}
07-23 20:02:55.585 654 2395 V WindowManager: Relayout Window{bfdd7d1 u0
com.minimalapp/com.minimalapp.wear.MainActivity}: viewVisibility=0 req=450x450 ty=1 d0
07-23 20:02:55.586 592 775 I SurfaceFlinger: id=696 createSurf flag=44004,
com.minimalapp/com.minimalapp.wear.MainActivity#696
07-23 20:02:55.586 654 2395 D WindowManager: makeSurface duration=2
name=com.minimalapp/com.minimalapp.wear.MainActivity
07-23 20:02:55.588 654 2395 V WindowManager: Changing focus from null to Window{bfdd7d1 u0
com.minimalapp/com.minimalapp.wear.MainActivity} displayId=0
Callers=com.android.server.wm.RootWindowContainer.updateFocusedWindowLocked:464
com.android.server.wm.WindowManagerService.updateFocusedWindowLocked:6404
com.android.server.wm.WindowManagerService.relayoutWindow:2534 com.android.server.wm.Session.relayout:302
07-23 20:02:55.620 592 635 D SurfaceFlinger: [input] setFocusedWindow: bfdd7d1
com.minimalapp/com.minimalapp.wear.MainActivity
07-23 20:02:55.623 654 2521 D InputDispatcher: Focus request (0): bfdd7d1
com.minimalapp/com.minimalapp.wear.MainActivity but waiting because NOT_VISIBLE
07-23 20:02:55.711 654 2395 D WindowManager: finishDrawingWindow: Window{bfdd7d1 u0
com.minimalapp/com.minimalapp.wear.MainActivity} mDrawState=DRAW_PENDING seqId=0
07-23 20:02:55.717 654 721 V WindowManager: Finish starting ActivityRecord{adbfe75 u0
com.minimalapp/.wear.MainActivity t11754}: first real window is shown, no animation
07-23 20:02:55.717 654 721 V WindowManager: Schedule remove starting ActivityRecord{adbfe75 u0
com.minimalapp/.wear.MainActivity t11754} startingWindow=Window{7d099f3 u0 Splash Screen com.minimalapp} animate=true
Callers=com.android.server.wm.ActivityRecord.removeStartingWindow:2973
com.android.server.wm.ActivityRecord.onFirstWindowDrawn:6979 com.android.server.wm.WindowState.performShowLocked:4414
com.android.server.wm.WindowStateAnimator.commitFinishDrawingLocked:254
com.android.server.wm.DisplayContent.lambda$new$8:1033
07-23 20:02:55.718   654   721 V WindowManager: performShowLocked: mDrawState=HAS_DRAWN in Window{bfdd7d1 u0
com.minimalapp/com.minimalapp.wear.MainActivity}
07-23 20:02:55.720   654   717 W ziparchive: Unable to open
'/data/app/~~wvt9rnFEVoeE0iTFCZV0yQ==/com.minimalapp-tHYOTkZ1JcHta7GLcl4qxw==/base.dm': No such file or directory
07-23 20:02:55.733   592   592 I Layer   : Layer [com.minimalapp/com.minimalapp.wear.MainActivity#696] hidden!! flag(0)
07-23 20:02:55.737   592   592 D SurfaceFlinger:      DEVICE | 0xe6cb7300 | 0102 | RGBA_8888    |    0.0    0.0  450.0
 450.0 |    0    0  450  450 | com.minimalapp/com.minimalapp.wear.MainActivity#696
07-23 20:02:55.737   592   592 D SurfaceFlinger:      DEVICE | 0xe6cb8200 | 0100 | RGBA_8888    |    0.0    0.0  450.0
 450.0 |    0    0  450  450 | Splash Screen com.minimalapp#690
07-23 20:02:55.738   654  2521 V WindowManager: Relayout Window{7d099f3 u0 Splash Screen com.minimalapp}:
viewVisibility=8 req=450x450 ty=3 d0
07-23 20:02:55.739   654  2395 D InputDispatcher: Focus entered window (0): bfdd7d1
com.minimalapp/com.minimalapp.wear.MainActivity
07-23 20:02:55.745  1229  1346 I ViewRootImpl@565988e[minimalapp]: Relayout returned: old=(0,0,450,450)
new=(0,0,450,450) req=(450,450)8 dur=9 res=0x2 s={false 0x0} ch=true seqId=0
07-23 20:02:55.746   654  2395 I ImeTracker: com.minimalapp:478bafb3: onRequestHide at ORIGIN_SERVER reason
HIDE_UNSPECIFIED_WINDOW fromUser false
07-23 20:02:55.746   654  2395 I ImeTracker: com.minimalapp:478bafb3: onCancelled at PHASE_SERVER_SHOULD_HIDE
07-23 20:02:55.747  1229  1346 I ViewRootImpl@565988e[minimalapp]: dispatchDetachedFromWindow
07-23 20:02:55.749   654  1381 D WindowManager: Starting window removed Window{7d099f3 u0 Splash Screen com.minimalapp}
07-23 20:02:55.749   654  1381 W InputManager-JNI: Input channel object '7d099f3 Splash Screen com.minimalapp
(client)' was disposed without first being removed with the input manager!
07-23 20:02:55.752   654  1381 V WindowManager: Remove Window{7d099f3 u0 Splash Screen com.minimalapp}:
mSurfaceController=Surface(name=Splash Screen com.minimalapp)/@0xa3674ae mAnimatingExit=false mRemoveOnExit=false
mHasSurface=true surfaceShowing=false animating=false app-animation=false mDisplayFrozen=false
callers=com.android.server.wm.WindowManagerService.removeClientToken:2029 com.android.server.wm.Session.remove:284
android.view.IWindowSession$Stub.onTransact:690 com.android.server.wm.Session.onTransact:216
android.os.Binder.execTransactInternal:1500 android.os.Binder.execTransact:1444
07-23 20:02:55.752 654 717 I PkgPredictorService-SecIpmManagerServiceImpl: reportToNAP uid:10215
com.minimalapp/com.minimalapp.wear.MainActivity thisTime:1071
07-23 20:02:55.752 654 1381 I WindowManager: Destroying surface Surface(name=Splash Screen
com.minimalapp)/@0xa3674ae called by com.android.server.wm.WindowStateAnimator.destroySurface:660
com.android.server.wm.WindowStateAnimator.destroySurfaceLocked:372
com.android.server.wm.WindowState.removeImmediately:2334 com.android.server.wm.WindowState.removeIfPossible:2525
com.android.server.wm.WindowManagerService.removeClientToken:2029 com.android.server.wm.Session.remove:284
android.view.IWindowSession$Stub.onTransact:690 com.android.server.wm.Session.onTransact:216
07-23 20:02:55.753   654  2051 D PkgPredictorService-IpmCollector: save record(<launchTime:2025-07-23 20:02:55 hour:20
day:4 previous:[com.minimalapp, com.minimalapp, com.minimalapp] running:com.minimalapp/unknown apkVersion:1.1.0
userId:0 screenOrientation:0 wifi:3 bt:0 predictTime:0 launching Time:-1 predicted:false prediction:[] preloaded:false
preloading:[]>)
07-23 20:02:55.763   654   717 I ActivityTaskManager: Displayed com.minimalapp/.wear.MainActivity for user 0: +1s71ms
07-23 20:02:55.763   654   717 I Pageboost: Launch time gathered : pid 14822 com.minimalapp 1071
07-23 20:02:55.766   654  2051 D PkgPredictorService-IpmNapPreloadController: handleProcessForegroundFinish:
<launchTime:2025-07-23 20:02:55 hour:20 day:4 previous:[com.minimalapp, com.minimalapp, com.minimalapp]
running:com.minimalapp/com.minimalapp.wear.MainActivity apkVersion:1.1.0 userId:0 screenOrientation:0 wifi:3 bt:0
predictTime:0 launching Time:1071 predicted:false prediction:[] preloaded:false preloading:[]>
07-23 20:02:55.767   592   592 I Layer   : id=689 removeFromCurrentState 7d099f3 Splash Screen com.minimalapp#689 (82)
07-23 20:02:55.767   592   592 I Layer   : id=690 removeFromCurrentState Splash Screen com.minimalapp#690 (82)
07-23 20:02:55.767   592   592 I Layer   : Layer [Splash Screen com.minimalapp#690] hidden!! flag(1)
07-23 20:02:55.767   592   592 I Layer   : id=690 removeFromCurrentState Splash Screen com.minimalapp#690 (82)
07-23 20:02:55.768   592   592 I SurfaceFlinger: id=690 Removed Splash Screen com.minimalapp#690 (82)
07-23 20:02:55.768   592   592 I SurfaceFlinger: id=689 Removed 7d099f3 Splash Screen com.minimalapp#689 (82)
07-23 20:02:55.770   592   592 D SurfaceFlinger:      DEVICE | 0xe6cb7300 | 0102 | RGBA_8888    |    0.0    0.0  450.0
 450.0 |    0    0  450  450 | com.minimalapp/com.minimalapp.wear.MainActivity#696
07-23 20:02:55.784   592   592 I Layer   : id=690 Destroyed Splash Screen com.minimalapp#690
07-23 20:02:55.785   592   592 I Layer   : id=689 Destroyed 7d099f3 Splash Screen com.minimalapp#689
07-23 20:02:58.781   654  2051 D PkgPredictorService-NapPredictor:  (<launchTime:2025-07-23 20:02:55 hour:20 day:4
previous:[com.minimalapp, com.minimalapp, com.minimalapp] running:com.minimalapp/com.minimalapp.wear.MainActivity
apkVersion:1.1.0 userId:0 screenOrientation:0 wifi:3 bt:0 predictTime:0 launching Time:1071 predicted:false
prediction:[] preloaded:false preloading:[]>)
07-23 20:02:59.517 14822 14878 D ProfileInstaller: Installing profile for com.minimalapp
07-23 20:03:02.286   654  2529 W ProcessStats: Tracking association SourceState{1d209d9 com.minimalapp/10215 BTop
#10843} whose proc state 2 is better than process ProcessState{400b86d com.google.android.gms.persistent/10119
pkg=com.google.android.gms} proc state 5 (233 skipped)
07-23 20:03:09.800   654  1381 W ActivityManager: Permission Denial: Accessing service
com.minimalapp/.wear.services.WearableListenerService from pid=10119, uid=10119 requires
android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
07-23 20:03:09.804  1307  2901 W WearableService: bind: Permission denied connecting to
ServiceRecord[com.minimalapp.wear.services.WearableListenerService, events=1, bound=false, [Event[11972804:
onMessageReceived, event=requestId=16802, action=/stats/update, dataSize=64, source=236fb467]]]
07-23 20:03:09.804  1307  2901 W WearableService: java.lang.SecurityException: Not allowed to bind to service Intent {
act=com.google.android.gms.wearable.MESSAGE_RECEIVED dat=wear://236fb467/... pkg=com.minimalapp
cmp=com.minimalapp/.wear.services.WearableListenerService }
07-23 20:03:09.830 14822 14822 E MinimalWearService: Package: com.minimalapp
07-23 20:03:09.835 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:09.836 14822 14822 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-23 20:03:09.836 14822 14822 D GolfWearMain: Path: /stats/update
07-23 20:03:09.836 14822 14822 D GolfWearMain: From: 236fb467
07-23 20:03:09.836 14822 14822 D GolfWearMain: Data: {"distanceToPin":3,"measurementUnit":"imperial","currentHole":1}
07-23 20:03:09.836 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:09.847   654  2527 W ActivityManager: Permission Denial: Accessing service
com.minimalapp/.wear.services.WearableListenerService from pid=10119, uid=10119 requires
android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
07-23 20:03:09.848  1307  2901 W WearableService: bind: Permission denied connecting to
ServiceRecord[com.minimalapp.wear.services.WearableListenerService, events=1, bound=false, [Event[36558249:
dataChanged, event=DataWearableServiceEvent(/stats/data)]]]
07-23 20:03:09.848  1307  2901 W WearableService: java.lang.SecurityException: Not allowed to bind to service Intent {
act=com.google.android.gms.wearable.MESSAGE_RECEIVED dat=wear://236fb467/... pkg=com.minimalapp
cmp=com.minimalapp/.wear.services.WearableListenerService }
07-23 20:03:09.883 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:09.883 14822 14822 D GolfWearMain: DATA CHANGED IN MAINACTIVITY!
07-23 20:03:09.884 14822 14822 D GolfWearMain: Data event path: /stats/data
07-23 20:03:09.885 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:09.962 14822 14834 I com.minimalapp: Background concurrent copying GC freed 3697KB AllocSpace bytes,
4(144KB) LOS objects, 49% free, 3439KB/6878KB, paused 322us,80us total 147.260ms
07-23 20:03:13.190 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:13.191 14822 14822 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-23 20:03:13.191 14822 14822 D GolfWearMain: Path: /round/end
07-23 20:03:13.191 14822 14822 D GolfWearMain: From: 236fb467
07-23 20:03:13.192 14822 14822 D GolfWearMain: Data:
07-23 20:03:13.192 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:13.198   654  2521 W ActivityManager: Permission Denial: Accessing service
com.minimalapp/.wear.services.WearableListenerService from pid=10119, uid=10119 requires
android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
07-23 20:03:13.199  1307  2901 W WearableService: bind: Permission denied connecting to
ServiceRecord[com.minimalapp.wear.services.WearableListenerService, events=1, bound=false, [Event[155020806:
onMessageReceived, event=requestId=16803, action=/round/end, dataSize=0, source=236fb467]]]
07-23 20:03:13.199  1307  2901 W WearableService: java.lang.SecurityException: Not allowed to bind to service Intent {
act=com.google.android.gms.wearable.MESSAGE_RECEIVED dat=wear://236fb467/... pkg=com.minimalapp
cmp=com.minimalapp/.wear.services.WearableListenerService }
07-23 20:03:13.210 14822 14822 V Toast   : show: caller =
com.minimalapp.wear.MainActivity.handleRoundEnded$lambda$13:332
07-23 20:03:13.213   654  1381 W ProcessStats: Tracking association SourceState{1d209d9 com.minimalapp/10215 BTop
#10858} whose proc state 2 is better than process ProcessState{400b86d com.google.android.gms.persistent/10119
pkg=com.google.android.gms} proc state 5 (39 skipped)
07-23 20:03:13.295 14822 14822 E MinimalWearService: Package: com.minimalapp
07-23 20:03:13.300   654   721 V WindowManager: Loading animations: layout params pkg=com.minimalapp resId=0x1030004
07-23 20:03:13.309   654   721 D PowerManagerService: [api] acquire WakeLock SCREEN_BRIGHT_WAKE_LOCK
'WindowManager/displayId:0' ON_AFTER_RELEASE (uid=1000 pid=654 pkg=android ws=WorkSource{10215 com.minimalapp}
displayId=0 lock=a5952ce)
07-23 20:03:13.315   654  2521 W ActivityManager: Permission Denial: Accessing service
com.minimalapp/.wear.services.WearableListenerService from pid=10119, uid=10119 requires
android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
07-23 20:03:13.316  1307  2901 W WearableService: bind: Permission denied connecting to
ServiceRecord[com.minimalapp.wear.services.WearableListenerService, events=1, bound=false, [Event[87188626:
dataChanged, event=DataWearableServiceEvent(/round/data)]]]
07-23 20:03:13.316  1307  2901 W WearableService: java.lang.SecurityException: Not allowed to bind to service Intent {
act=com.google.android.gms.wearable.MESSAGE_RECEIVED dat=wear://236fb467/... pkg=com.minimalapp
cmp=com.minimalapp/.wear.services.WearableListenerService }
07-23 20:03:13.326 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:13.327 14822 14822 D GolfWearMain: DATA CHANGED IN MAINACTIVITY!
07-23 20:03:13.327 14822 14822 D GolfWearMain: Data event path: /round/data
07-23 20:03:13.328 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:13.355   592   592 D SurfaceFlinger:      DEVICE | 0xe6cb7300 | 0102 | RGBA_8888    |    0.0    0.0  450.0
 450.0 |    0    0  450  450 | com.minimalapp/com.minimalapp.wear.MainActivity#696
07-23 20:03:15.237   654  2521 V WindowManager: Loading animations: layout params pkg=com.minimalapp resId=0x1030004
07-23 20:03:15.243   654  1381 W NotificationService: Toast already killed. pkg=com.minimalapp
token=android.os.BinderProxy@85a94f6
07-23 20:03:15.781   592   592 D SurfaceFlinger:      DEVICE | 0xe6cb7300 | 0102 | RGBA_8888    |    0.0    0.0  450.0
 450.0 |    0    0  450  450 | com.minimalapp/com.minimalapp.wear.MainActivity#696
07-23 20:03:15.790   654   721 D PowerManagerService: [api] release WakeLock SCREEN_BRIGHT_WAKE_LOCK
'WindowManager/displayId:0' ON_AFTER_RELEASE ACQ=-2s480ms (uid=1000 pid=654 pkg=android ws=WorkSource{10215
com.minimalapp} displayId=0 lock=a5952ce)
07-23 20:03:15.791   654   721 D PowerManagerService: [api] applyWakeLockFlagsOnReleaseLocked :
userActivityNoUpdateLocked is called : SCREEN_BRIGHT_WAKE_LOCK        'WindowManager/displayId:0' ON_AFTER_RELEASE
DISABLED (uid=1000 pid=654 pkg=android ws=WorkSource{10215 com.minimalapp} displayId=0 lock=a5952ce)
07-23 20:03:17.236   654   720 V WindowManager: Loading animations: layout params pkg=com.minimalapp resId=0x1030004
07-23 20:03:20.848   654  2521 W ActivityManager: Permission Denial: Accessing service
com.minimalapp/.wear.services.WearableListenerService from pid=10119, uid=10119 requires
android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
07-23 20:03:20.852  1307  2901 W WearableService: bind: Permission denied connecting to
ServiceRecord[com.minimalapp.wear.services.WearableListenerService, events=1, bound=false, [Event[63474828:
onMessageReceived, event=requestId=16804, action=/hole/change, dataSize=17, source=236fb467]]]
07-23 20:03:20.852  1307  2901 W WearableService: java.lang.SecurityException: Not allowed to bind to service Intent {
act=com.google.android.gms.wearable.MESSAGE_RECEIVED dat=wear://236fb467/... pkg=com.minimalapp
cmp=com.minimalapp/.wear.services.WearableListenerService }
07-23 20:03:20.858 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:20.858 14822 14822 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-23 20:03:20.858 14822 14822 D GolfWearMain: Path: /hole/change
07-23 20:03:20.858 14822 14822 D GolfWearMain: From: 236fb467
07-23 20:03:20.858 14822 14822 D GolfWearMain: Data: {"currentHole":1}
07-23 20:03:20.858 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:20.866 14822 14822 E MinimalWearService: Package: com.minimalapp
07-23 20:03:20.882 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:20.883 14822 14822 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-23 20:03:20.883 14822 14822 D GolfWearMain: Path: /stats/update
07-23 20:03:20.883 14822 14822 D GolfWearMain: From: 236fb467
07-23 20:03:20.883 14822 14822 D GolfWearMain: Data: {"measurementUnit":"imperial","currentHole":1}
07-23 20:03:20.883 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:20.886   654  2529 W ActivityManager: Permission Denial: Accessing service
com.minimalapp/.wear.services.WearableListenerService from pid=10119, uid=10119 requires
android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
07-23 20:03:20.889  1307  2901 W WearableService: bind: Permission denied connecting to
ServiceRecord[com.minimalapp.wear.services.WearableListenerService, events=1, bound=false, [Event[129492344:
onMessageReceived, event=requestId=16805, action=/stats/update, dataSize=46, source=236fb467]]]
07-23 20:03:20.889  1307  2901 W WearableService: java.lang.SecurityException: Not allowed to bind to service Intent {
act=com.google.android.gms.wearable.MESSAGE_RECEIVED dat=wear://236fb467/... pkg=com.minimalapp
cmp=com.minimalapp/.wear.services.WearableListenerService }
07-23 20:03:20.924   654  2521 I ActivityTaskManager: START u0 {act=com.minimalapp.wear.ROUND_STARTED flg=0x30000000
cmp=com.minimalapp/.wear.MainActivity (has extras)} with LAUNCH_MULTIPLE from uid 10215 (BAL_ALLOW_VISIBLE_WINDOW)
result code=3
07-23 20:03:20.924   654  2521 D ActivityTaskManager: act=com.minimalapp.wear.ROUND_STARTED flg=0x30000000
cmp=com.minimalapp/.wear.MainActivity (has extras)
07-23 20:03:20.929   654  2529 W ActivityManager: Permission Denial: Accessing service
com.minimalapp/.wear.services.WearableListenerService from pid=10119, uid=10119 requires
android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
07-23 20:03:20.932  1307  2901 W WearableService: bind: Permission denied connecting to
ServiceRecord[com.minimalapp.wear.services.WearableListenerService, events=1, bound=false, [Event[225014959:
onMessageReceived, event=requestId=16806, action=/round/start, dataSize=130, source=236fb467]]]
07-23 20:03:20.932  1307  2901 W WearableService: java.lang.SecurityException: Not allowed to bind to service Intent {
act=com.google.android.gms.wearable.MESSAGE_RECEIVED dat=wear://236fb467/... pkg=com.minimalapp
cmp=com.minimalapp/.wear.services.WearableListenerService }
07-23 20:03:20.934 14822 14822 D GolfWearMain: Round started from intent with data:
{"roundId":"local_round_1753293800251","courseName":"Local Golf
Course","currentHole":1,"totalHoles":18,"timestamp":1753293800483}
07-23 20:03:20.941 14822 14822 V Toast   : show: caller = com.minimalapp.wear.MainActivity.handleIntent$lambda$1:113
07-23 20:03:20.953 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:20.953 14822 14822 D GolfWearMain: MESSAGE RECEIVED IN MAINACTIVITY!
07-23 20:03:20.953 14822 14822 D GolfWearMain: Path: /round/start
07-23 20:03:20.953 14822 14822 D GolfWearMain: From: 236fb467
07-23 20:03:20.953 14822 14822 D GolfWearMain: Data: {"roundId":"local_round_1753293800251","courseName":"Local Golf
Course","currentHole":1,"totalHoles":18,"timestamp":1753293800483}
07-23 20:03:20.953 14822 14822 D GolfWearMain: ===============================================
07-23 20:03:20.954 14822 14822 D GolfWearMain: Round started with data:
{"roundId":"local_round_1753293800251","courseName":"Local Golf
Course","currentHole":1,"totalHoles":18,"timestamp":1753293800483}
07-23 20:03:20.955 14822 14822 D GolfWearMain: RoundId: local_round_1753293800251, CurrentHole: 1
07-23 20:03:20.964 14822 14822 V Toast   : show: caller =
com.minimalapp.wear.MainActivity.handleRoundStarted$lambda$11:315
07-23 20:03:20.972   654  2521 V WindowManager: Relayout Window{bfdd7d1 u0
com.minimalapp/com.minimalapp.wear.MainActivity}: viewVisibility=0 req=450x450 ty=1 d0
07-23 20:03:21.013   654  2529 W ActivityManager: Permission Denial: Accessing service
com.minimalapp/.wear.services.WearableListenerService from pid=10119, uid=10119 requires
android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
07-23 20:03:21.014  1307  2901 W WearableService: bind: Permission denied connecting to
ServiceRecord[com.minimalapp.wear.services.WearableListenerService, events=1, bound=false, [Event[151795781:
dataChanged, event=DataWearableServiceEvent(/stats/data)]]]
07-23 20:03:21.014  1307  2901 W WearableService: java.lang.SecurityException: Not allowed to bind to service Intent {
act=com.google.android.gms.wearable.MESSAGE_RECEIVED dat=wear://236fb467/... pkg=com.minimalapp
cmp=com.minimalapp/.wear.services.WearableListenerService }
07-23 20:03:21.024   654  2529 W ActivityManager: Permission Denial: Accessing service
com.minimalapp/.wear.services.WearableListenerService from pid=10119, uid=10119 requires
android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
07-23 20:03:21.025  1307  2901 W WearableService: bind: Permission denied connecting to
ServiceRecord[com.minimalapp.wear.services.WearableListenerService, events=1, bound=false, [Event[262905000:
dataChanged, event=DataWearableServiceEvent(/round/data)]]]
07-23 20:03:21.025  1307  2901 W WearableService: java.lang.SecurityException: Not allowed to bind to service Intent {
act=com.google.android.gms.wearable.MESSAGE_RECEIVED dat=wear://236fb467/... pkg=com.minimalapp
cmp=com.minimalapp/.wear.services.WearableListenerService }
07-23 20:03:21.178 14822 14822 W com.minimalapp: Accessing hidden method
Landroid/view/View;->computeFitSystemWindows(Landroid/graphics/Rect;Landroid/graphics/Rect;)Z (unsupported,
reflection, allowed)
07-23 20:03:21.197 14822 14822 D AndroidRuntime: Shutting down VM
07-23 20:03:21.214 14822 14822 E AndroidRuntime: FATAL EXCEPTION: main
07-23 20:03:21.214 14822 14822 E AndroidRuntime: Process: com.minimalapp, PID: 14822
07-23 20:03:21.214 14822 14822 E AndroidRuntime: android.view.InflateException: Binary XML file line #37 in
com.minimalapp:layout/fragment_shot: Binary XML file line #37 in com.minimalapp:layout/fragment_shot: Error inflating
class com.google.android.material.button.MaterialButton
07-23 20:03:21.214 14822 14822 E AndroidRuntime: Caused by: android.view.InflateException: Binary XML file line #37 in
com.minimalapp:layout/fragment_shot: Error inflating class com.google.android.material.button.MaterialButton
07-23 20:03:21.214 14822 14822 E AndroidRuntime: Caused by: java.lang.reflect.InvocationTargetException
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at java.lang.reflect.Constructor.newInstance0(Native Method)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at java.lang.reflect.Constructor.newInstance(Constructor.java:343)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at android.view.LayoutInflater.createView(LayoutInflater.java:760)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
android.view.LayoutInflater.createViewFromTag(LayoutInflater.java:912)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
android.view.LayoutInflater.createViewFromTag(LayoutInflater.java:867)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at android.view.LayoutInflater.rInflate(LayoutInflater.java:1029)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
android.view.LayoutInflater.rInflateChildren(LayoutInflater.java:990)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at android.view.LayoutInflater.inflate(LayoutInflater.java:576)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at android.view.LayoutInflater.inflate(LayoutInflater.java:468)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
com.minimalapp.databinding.FragmentShotBinding.inflate(FragmentShotBinding.java:60)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
com.minimalapp.wear.fragments.ShotFragment.onCreateView(ShotFragment.kt:53)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.fragment.app.Fragment.performCreateView(Fragment.java:3114)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.fragment.app.FragmentStateManager.createView(FragmentStateManager.java:557)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.fragment.app.FragmentStateManager.moveToExpectedState(FragmentStateManager.java:272)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.fragment.app.FragmentManager.executeOpsTogether(FragmentManager.java:1943)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.fragment.app.FragmentManager.removeRedundantOperationsAndExecute(FragmentManager.java:1839)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.fragment.app.FragmentManager.execSingleAction(FragmentManager.java:1751)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.fragment.app.BackStackRecord.commitNow(BackStackRecord.java:317)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.viewpager2.adapter.FragmentStateAdapter.placeFragmentInViewHolder(FragmentStateAdapter.java:343)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.viewpager2.adapter.FragmentStateAdapter.onViewAttachedToWindow(FragmentStateAdapter.java:274)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.viewpager2.adapter.FragmentStateAdapter.onViewAttachedToWindow(FragmentStateAdapter.java:74)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.recyclerview.widget.RecyclerView.dispatchChildAttached(RecyclerView.java:8377)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.recyclerview.widget.RecyclerView$5.addView(RecyclerView.java:954)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.recyclerview.widget.ChildHelper.addView(ChildHelper.java:131)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.recyclerview.widget.RecyclerView$LayoutManager.addViewInt(RecyclerView.java:9430)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at
androidx.recyclerview.widget.RecyclerView$LayoutManager.addView(RecyclerView.java:9388)
07-23 20:03:21.214 14822 14822 E AndroidRuntime:        at
androidx.recyclerview.widget.RecyclerView$LayoutManager.addView(RecyclerView.java:9375)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at
androidx.recyclerview.widget.LinearLayoutManager.layoutChunk(LinearLayoutManager.java:1676)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at
androidx.recyclerview.widget.LinearLayoutManager.fill(LinearLayoutManager.java:1622)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at
androidx.recyclerview.widget.LinearLayoutManager.onLayoutChildren(LinearLayoutManager.java:687)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at
androidx.recyclerview.widget.RecyclerView.dispatchLayoutStep2(RecyclerView.java:4645)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at
androidx.recyclerview.widget.RecyclerView.dispatchLayout(RecyclerView.java:4348)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at
androidx.recyclerview.widget.RecyclerView.onLayout(RecyclerView.java:4919)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.view.View.layout(View.java:25465)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.view.ViewGroup.layout(ViewGroup.java:6460)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at
androidx.viewpager2.widget.ViewPager2.onLayout(ViewPager2.java:535)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.view.View.layout(View.java:25465)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.view.ViewGroup.layout(ViewGroup.java:6460)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.widget.FrameLayout.layoutChildren(FrameLayout.java:332)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.widget.FrameLayout.onLayout(FrameLayout.java:270)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.view.View.layout(View.java:25465)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.view.ViewGroup.layout(ViewGroup.java:6460)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.widget.FrameLayout.layoutChildren(FrameLayout.java:332)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.widget.FrameLayout.onLayout(FrameLayout.java:270)
07-23 20:03:21.214 14822 14822 E AndroidRuntime: at android.view.View.layout(View.java:25465)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.view.ViewGroup.layout(ViewGroup.java:6460)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.widget.FrameLayout.layoutChildren(FrameLayout.java:332)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.widget.FrameLayout.onLayout(FrameLayout.java:270)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.view.View.layout(View.java:25465)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.view.ViewGroup.layout(ViewGroup.java:6460)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.widget.LinearLayout.setChildFrame(LinearLayout.java:1891)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.widget.LinearLayout.layoutVertical(LinearLayout.java:1729)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.widget.LinearLayout.onLayout(LinearLayout.java:1638)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.view.View.layout(View.java:25465)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.view.ViewGroup.layout(ViewGroup.java:6460)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.widget.FrameLayout.layoutChildren(FrameLayout.java:332)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.widget.FrameLayout.onLayout(FrameLayout.java:270)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at com.android.internal.policy.DecorView.onLayout(DecorView.java:811)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.view.View.layout(View.java:25465)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.view.ViewGroup.layout(ViewGroup.java:6460)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.view.ViewRootImpl.performLayout(ViewRootImpl.java:4760)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at
android.view.ViewRootImpl.performTraversals(ViewRootImpl.java:4002)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.view.ViewRootImpl.doTraversal(ViewRootImpl.java:2848)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at
android.view.ViewRootImpl$TraversalRunnable.run(ViewRootImpl.java:10331)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at
android.view.Choreographer$CallbackRecord.run(Choreographer.java:1461)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at
android.view.Choreographer$CallbackRecord.run(Choreographer.java:1470)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at android.view.Choreographer.doCallbacks(Choreographer.java:1038)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at android.view.Choreographer.doFrame(Choreographer.java:968)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at
android.view.Choreographer$FrameDisplayEventReceiver.run(Choreographer.java:1444)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.os.Handler.handleCallback(Handler.java:959)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.os.Handler.dispatchMessage(Handler.java:100)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.os.Looper.loopOnce(Looper.java:256)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.os.Looper.loop(Looper.java:341)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at android.app.ActivityThread.main(ActivityThread.java:8699)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at java.lang.reflect.Method.invoke(Native Method)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: at
com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:582)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:982)
07-23 20:03:21.229 14822 14822 E AndroidRuntime: Caused by: java.lang.IllegalArgumentException: The style on this
component requires your app theme to be Theme.MaterialComponents (or a descendant).
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at
com.google.android.material.internal.ThemeEnforcement.checkTheme(ThemeEnforcement.java:247)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at
com.google.android.material.internal.ThemeEnforcement.checkMaterialTheme(ThemeEnforcement.java:216)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at
com.google.android.material.internal.ThemeEnforcement.checkCompatibleTheme(ThemeEnforcement.java:144)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at
com.google.android.material.internal.ThemeEnforcement.obtainStyledAttributes(ThemeEnforcement.java:76)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at
com.google.android.material.button.MaterialButton.<init>(MaterialButton.java:239)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        at
com.google.android.material.button.MaterialButton.<init>(MaterialButton.java:230)
07-23 20:03:21.229 14822 14822 E AndroidRuntime:        ... 77 more
07-23 20:03:21.262   654  2521 D Debug   : low && ship && 3rdparty app crash, do not dump
07-23 20:03:21.263   654  2521 W ActivityTaskManager:   Force finishing activity com.minimalapp/.wear.MainActivity
07-23 20:03:21.263   654 14889 I DropBoxManagerService: add tag=data_app_crash isTagEnabled=true flags=0x2
07-23 20:03:21.263   654  2521 W WindowManager: Prepare app transition: mNextAppTransitionRequests=[TRANSIT_CLOSE],
mNextAppTransitionFlags=TRANSIT_FLAG_APP_CRASHED, displayId: 0
Callers=com.android.server.wm.DisplayContent.prepareAppTransition:5747
com.android.server.wm.DisplayContent.requestTransitionAndLegacyPrepare:5769
com.android.server.wm.DisplayContent.requestTransitionAndLegacyPrepare:5763
com.android.server.wm.Task.finishTopCrashedActivityLocked:5479
com.android.server.wm.RootWindowContainer.lambda$finishTopCrashedActivities$16:2370
07-23 20:03:21.265   654  2521 I DisplayOffload: [OffloadLayoutManager] -$$Nest$mtaskChangedForDisplayOffload(70) >
Current TaskInfo(11754): topActivity(ComponentInfo{com.minimalapp/com.minimalapp.wear.MainActivity}),baseActivity(Compo
nentInfo{com.minimalapp/com.minimalapp.wear.MainActivity})
07-23 20:03:21.267 654 2521 W WindowManager: Prepare app transition: mNextAppTransitionRequests=[TRANSIT_CLOSE,
TRANSIT_CLOSE], mNextAppTransitionFlags=TRANSIT_FLAG_APP_CRASHED, displayId: 0
Callers=com.android.server.wm.DisplayContent.prepareAppTransition:5747
com.android.server.wm.DisplayContent.prepareAppTransition:5738
com.android.server.wm.ActivityRecord.finishIfPossible:3782 com.android.server.wm.ActivityRecord.finishIfPossible:3695
com.android.server.wm.Task.finishTopCrashedActivityLocked:5480
07-23 20:03:21.269 592 592 D SurfaceFlinger: copyLayers for present -
com.minimalapp/com.minimalapp.wear.MainActivity#696
07-23 20:03:21.314 654 2529 D InputDispatcher: Focus left window (0): bfdd7d1
com.minimalapp/com.minimalapp.wear.MainActivity
07-23 20:03:21.373 654 2395 I ImeTracker: com.minimalapp:7ccd302d: onRequestHide at ORIGIN_SERVER reason
HIDE_REMOVE_CLIENT fromUser false
07-23 20:03:21.373 654 2395 I ImeTracker: com.minimalapp:7ccd302d: onCancelled at PHASE_SERVER_SHOULD_HIDE
07-23 20:03:21.375 654 1381 I ActivityManager: Process com.minimalapp (pid 14822) has died: fg TOP (80,258)
07-23 20:03:21.377 654 2521 I WindowManager: WIN DEATH: Window{bfdd7d1 u0
com.minimalapp/com.minimalapp.wear.MainActivity}
07-23 20:03:21.377 654 2521 W InputManager-JNI: Input channel object 'bfdd7d1
com.minimalapp/com.minimalapp.wear.MainActivity (client)' was disposed without first being removed with the input
manager!
07-23 20:03:21.378 654 2521 V WindowManager: Remove Window{bfdd7d1 u0
com.minimalapp/com.minimalapp.wear.MainActivity}:
mSurfaceController=Surface(name=com.minimalapp/com.minimalapp.wear.MainActivity)/@0xe05d10 mAnimatingExit=false
mRemoveOnExit=false mHasSurface=true surfaceShowing=true animating=true app-animation=true mDisplayFrozen=false
callers=com.android.server.wm.Session.binderDied:242 android.os.IBinder$DeathRecipient.binderDied:320
android.os.BinderProxy.sendDeathNotice:742 <bottom of call stack> <bottom of call stack> <bottom of call stack>
07-23 20:03:21.378   654  2521 V WindowManager: Loading animations: layout params pkg=com.minimalapp resId=0x10302fc
07-23 20:03:21.378   654  1381 W ActivityManager: Scheduling restart of crashed service
com.minimalapp/.wear.services.DirectMessageService in 3600000ms for start-requested
07-23 20:03:21.378   654  1381 W ActivityManager: Scheduling restart of crashed service
com.minimalapp/.wear.GlobalListenerService in 1000ms for start-requested
07-23 20:03:21.378   654  1381 W ActivityManager: Scheduling restart of crashed service
com.minimalapp/.wear.services.BroadcastMessageService in 11000ms for start-requested
07-23 20:03:21.378   654  2521 V WindowManager: Changing focus from Window{bfdd7d1 u0
com.minimalapp/com.minimalapp.wear.MainActivity EXITING} to null displayId=0
Callers=com.android.server.wm.RootWindowContainer.updateFocusedWindowLocked:464
com.android.server.wm.WindowManagerService.updateFocusedWindowLocked:6404
com.android.server.wm.WindowState.setupWindowForRemoveOnExit:2552
com.android.server.wm.WindowState.removeIfPossible:2514
07-23 20:03:21.378   654  1381 W ActivityManager: Scheduling restart of crashed service
com.minimalapp/.wear.services.WearableListenerService in 3609999ms for start-requested
07-23 20:03:21.379   654  1381 W ActivityManager: Scheduling restart of crashed service
com.minimalapp/.wear.services.MinimalWearableService in 21000ms for connection
07-23 20:03:21.402   654  1381 W WindowManager: Prepare app transition: mNextAppTransitionRequests=[TRANSIT_CLOSE,
TRANSIT_CLOSE, TRANSIT_OPEN], mNextAppTransitionFlags=TRANSIT_FLAG_APP_CRASHED, displayId: 0
Callers=com.android.server.wm.DisplayContent.prepareAppTransition:5747
com.android.server.wm.DisplayContent.prepareAppTransition:5738
com.android.server.wm.TaskFragment.resumeTopActivity:1500 com.android.server.wm.Task.resumeTopActivityInnerLocked:5198
com.android.server.wm.Task.resumeTopActivityUncheckedLocked:5128
07-23 20:03:21.419   654  1381 W WindowManager: Execute app transition: mNextAppTransitionRequests=[TRANSIT_CLOSE,
TRANSIT_CLOSE, TRANSIT_OPEN], mNextAppTransitionFlags=TRANSIT_FLAG_APP_CRASHED, displayId: 0
Callers=com.android.server.wm.RootWindowContainer.executeAppTransitionForAllDisplay:2305
com.android.server.wm.ActivityTaskSupervisor.reportResumedActivityLocked:2068
com.android.server.wm.ActivityRecord.completeResumeLocked:6583
com.android.server.wm.TaskFragment.resumeTopActivity:1676 com.android.server.wm.Task.resumeTopActivityInnerLocked:5198
07-23 20:03:21.525   654   721 D WindowManager: Loading animation for app transition.
transit=TRANSIT_OLD_CRASHING_ACTIVITY_CLOSE enter=true frame=Rect(0, 0 - 450, 450) insets=Rect(0, 0 - 0, 0)
surfaceInsets=Rect(0, 0 - 0, 0)
07-23 20:03:21.525   654   721 D WindowManager: Loading animation for app transition.
transit=TRANSIT_OLD_CRASHING_ACTIVITY_CLOSE enter=false frame=Rect(0, 0 - 450, 450) insets=Rect(0, 0 - 0, 0)
surfaceInsets=Rect(0, 0 - 0, 0)
07-23 20:03:21.536   654   721 V WindowManager: Setting visibility of Window{bfdd7d1 u0
com.minimalapp/com.minimalapp.wear.MainActivity EXITING}: false,
caller=com.android.server.wm.WindowContainer.sendAppVisibilityToClients:1320
com.android.server.wm.WindowToken.setClientVisible:403 com.android.server.wm.ActivityRecord.setClientVisible:7196
com.android.server.wm.ActivityRecord.onAnimationFinished:8032
com.android.server.wm.ActivityRecord.postApplyAnimation:5888
07-23 20:03:21.537   654   721 W WindowManager: Exception thrown during dispatchAppVisibility Window{bfdd7d1 u0
com.minimalapp/com.minimalapp.wear.MainActivity EXITING}
07-23 20:03:21.538   654   721 E WindowManager: win=Window{bfdd7d1 u0 com.minimalapp/com.minimalapp.wear.MainActivity
EXITING} destroySurfaces: appStopped=false cleanupOnResume=false win.mWindowRemovalAllowed=true win.mRemoveOnExit=true
win.mViewVisibility=0 caller=com.android.server.wm.ActivityRecord.destroySurfaces:6167
com.android.server.wm.ActivityRecord.destroySurfaces:6148 com.android.server.wm.WindowState.onExitAnimationDone:4828
com.android.server.wm.ActivityRecord$$ExternalSyntheticLambda12.accept:0 java.util.ArrayList.forEach:1613
com.android.server.wm.ActivityRecord.onAnimationFinished:8050
com.android.server.wm.ActivityRecord.postApplyAnimation:5888
07-23 20:03:21.539   654   721 I WindowManager: Destroying surface
Surface(name=com.minimalapp/com.minimalapp.wear.MainActivity)/@0xe05d10 called by
com.android.server.wm.WindowStateAnimator.destroySurface:660
com.android.server.wm.WindowStateAnimator.destroySurfaceLocked:372
com.android.server.wm.WindowState.destroySurfaceUnchecked:3384 com.android.server.wm.WindowState.destroySurface:3358
com.android.server.wm.ActivityRecord.destroySurfaces:6167 com.android.server.wm.ActivityRecord.destroySurfaces:6148
com.android.server.wm.WindowState.onExitAnimationDone:4828
com.android.server.wm.ActivityRecord$$ExternalSyntheticLambda12.accept:0
07-23 20:03:21.543 592 592 I Layer : id=696 removeFromCurrentState
com.minimalapp/com.minimalapp.wear.MainActivity#696 (81)
07-23 20:03:21.554 592 604 I SurfaceFlinger: id=694 Removed ab12e0a ActivityRecordInputSink
com.minimalapp/.wear.MainActivity#694 (81)
07-23 20:03:21.560 592 592 I Layer : Layer [com.minimalapp/com.minimalapp.wear.MainActivity#696] hidden!! flag(1)
07-23 20:03:21.560 592 592 I Layer : id=695 removeFromCurrentState bfdd7d1
com.minimalapp/com.minimalapp.wear.MainActivity#695 (82)
07-23 20:03:21.560 592 592 I Layer : id=688 removeFromCurrentState ActivityRecord{adbfe75 u0
com.minimalapp/.wear.MainActivity t11754}#688 (82)
07-23 20:03:21.560 592 592 I Layer : id=694 removeFromCurrentState ab12e0a ActivityRecordInputSink
com.minimalapp/.wear.MainActivity#694 (82)
07-23 20:03:21.562 592 592 I SurfaceFlinger: id=688 Removed ActivityRecord{adbfe75 u0
com.minimalapp/.wear.MainActivity t11754}#688 (82)
07-23 20:03:21.562 592 592 I SurfaceFlinger: id=695 Removed bfdd7d1
com.minimalapp/com.minimalapp.wear.MainActivity#695 (82)
07-23 20:03:21.562 592 592 I SurfaceFlinger: id=696 Removed com.minimalapp/com.minimalapp.wear.MainActivity#696
(82)
07-23 20:03:21.577 592 592 I Layer : id=696 Destroyed com.minimalapp/com.minimalapp.wear.MainActivity#696
07-23 20:03:21.577 592 592 I Layer : id=695 Destroyed bfdd7d1 com.minimalapp/com.minimalapp.wear.MainActivity#695
07-23 20:03:21.577 592 592 I Layer : id=688 Destroyed ActivityRecord{adbfe75 u0
com.minimalapp/.wear.MainActivity t11754}#688
07-23 20:03:21.577 592 592 I Layer : id=694 Destroyed ab12e0a ActivityRecordInputSink
com.minimalapp/.wear.MainActivity#694
07-23 20:03:21.765 654 720 W ActivityTaskManager: Activity top resumed state loss timeout for
ActivityRecord{adbfe75 u0 com.minimalapp/.wear.MainActivity t-1 f}}
07-23 20:03:22.473 654 745 I ActivityManager: Start proc 14902:com.minimalapp/u0a215 for service
{com.minimalapp/com.minimalapp.wear.GlobalListenerService}
07-23 20:03:22.513 14902 14902 I com.minimalapp: Late-enabling -Xcheck:jni
07-23 20:03:22.558 14902 14902 I com.minimalapp: Using CollectorTypeCC GC.
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{c4bd808 com.monotype.android.font.rosemary/10094} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{64d9ba1 com.android.cts.priv.ctsshim/10012} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{3fc81c6 com.sec.location.nfwlocationprivacy/10114} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{731c587 com.samsung.android.watch.watchface.gradientfont/10068} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{7ca6cb4 com.google.android.ext.shared/10107} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{58750dd com.samsung.android.watch.watchface.analoguefont/10097} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{d2ef452 com.android.virtualmachine.res/10189} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{4db3323 com.samsung.android.watch.watchface.simplecomplication/10058} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{afba020 com.samsung.android.watch.watchface.infomodular/10006} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{ad1dd9 com.samsung.android.watch.watchface.weather/10037} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{7a4039e com.samsung.android.watch.watchface.boldindex/10059} BLOCKED
07-23 20:03:22.729 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{423de7f com.samsung.sree/10131} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{64a9e4c com.samsung.android.watch.budscontroller/10130} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{4c8be95 com.samsung.android.watch.watchface.premiumanalog/10048} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{fc8bbaa com.whatsapp/10001} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{121e39b com.samsung.android.watch.watchface.myphoto/10018} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{3a95338 com.samsung.android.watch.watchface.mystyle/10075} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{23e6321 com.google.android.apps.messaging/10116} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{bc3af11 com.samsung.android.watch.watchface.healthmodular/10042} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{9cee876 com.monotype.android.font.foundation/10079} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{9311e77 com.sec.android.app.samsungapps/10016} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{83c6ae4 com.samsung.android.watch.findmyphone/10103} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{aa32b4d com.samsung.android.watch.watchface.basicdashboard/10014} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{9391602 com.google.android.configupdater/10004} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{98f2b13 com.google.android.overlay.modules.permissioncontroller/10152} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{4c75150 com.samsung.android.timezone.data_W/10099} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{7842f49 com.samsung.android.watch.watchface.livewallpaper/10034} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{526904e com.sds.emm.cloud.knox.samsung/10142} BLOCKED
07-23 20:03:22.730 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{bb7656f com.bosenko.watchface.marinecommander/10140} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{d8327c com.android.modulemetadata/10121} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{3577705 io.homeassistant.companion.android/10141} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{55f635a com.google.android.overlay.modules.cellbroadcastreceiver/10000} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{b7ee98b com.google.android.wearable.app.overlay.refsysui.default/10003} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{cb3fa68 com.google.android.deskclock/10149} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{35d7e81 com.samsung.android.watch.watchface.basicclock/10095} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{4205b26 com.monotype.android.font.samsungone/10098} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{2f09367 com.microsoft.office.outlook/10138} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{6025514 com.android.wearable.resources/10078} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{66281bd com.samsung.android.watch.watchface.simpleclassic/10019} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{a703b2 com.samsung.sree.countdown/10133} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{7e8ff03 com.samsung.android.watch.watchface.dualwatch/10032} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{b39ae80 com.samsung.android.wifi.resources/10160} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{1ba7cb9 com.android.rkpdapp/10188} BLOCKED
07-23 20:03:22.731 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{e7da8fe com.samsung.android.app.contacts/10036} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{772885f allterco.bg.shelly/10145} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{9cb32ac com.google.android.wearable.protolayout.renderer/10168} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{1fd2b75 android.auto_generated_characteristics_rro/10086} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{d87570a com.samsung.android.watch.watchface.together/10072} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{ae14b7b com.samsung.android.watch.watchface.typography/10090} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{30ecd98 com.samsung.android.watch.watchface.large/10110} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{b8209f1 com.samsung.android.watch.watchface.animal/10052} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{6cbd9d6 com.google.android.gsmediator/10167} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{2af2457 com.google.android.apps.maps/10115} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{3ef2b44 com.samsung.sree.classic/10129} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{69c542d com.google.android.apps.fitness/10040} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{a03bd62 com.android.phone.auto_generated_characteristics_rro/10073} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{317aef3 android.autoinstalls.config.samsung/10165} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{b55b7b0 com.google.android.apps.walletnfcrel/10148} BLOCKED
07-23 20:03:22.732 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{3970629 com.samsung.android.watch.watchface.dynamicfont/10061} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{7e44dae com.google.android.partnersetup/10045} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{e74474f com.samsung.android.watch.watchface.schooltime/10181} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{b569edc com.samsung.android.watch.watchface.aremoji/10039} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{270dbe5 com.samsung.android.watch.watchface.analogmodular/10011} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{52b96ba com.google.android.clockwork.refsysui.default/10150} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{958096b com.monotype.android.font.chococooky/10101} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{11cccc8 com.samsung.sree.spin/10134} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{a585161 com.samsung.android.watch.watchface.emergency/10028} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{26c6486 com.samsung.android.watch.watchface.simpleanalogue/10064} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{46bd147 com.google.android.wearable.overlay.home.merlot/10002} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{f95ed74 com.android.devicediagnostics/10179} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{ce7a29d com.samsung.android.wear.calculator/10132} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{49a4312 com.google.android.wearable.healthservices/10024} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{80a3ae3 com.samsung.sree.digital/10135} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{8de6ce0 com.samsung.android.wear.voicerecorder/10136} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{120cb99 com.google.android.apps.wearable.retailattractloop/10050} BLOCKED
07-23 20:03:22.733 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{a557e5e com.samsung.android.oneconnect/10176} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{d9ba23f com.google.android.wearable.assistant/10009} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{26d770c com.samsung.android.wearable.music/10137} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{2298855 com.samsung.android.watch.watchface.bespoke/10080} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{9f7226a com.samsung.android.watch.watchface.bitmoji/10071} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{2b2235b com.samsung.android.watch.watchface.mypebble/10015} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{f7f8 com.google.android.apps.chromecast.app/10146} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{4427600 com.android.cts.ctsshim/10164} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{dc754d1 com.google.android.wearable.overlay.wear.services.merlot/10151} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{45cfb36 com.samsung.android.watch.watchface.digitalmodular/10013} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{1e59a37 com.samsung.android.watch.watchface.superfiction/10069} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{1499ba4 com.android.companiondevicemanager.auto_generated_characteristics_rro/10092} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{e9b6d0d com.monotype.android.font.cooljazz/10082} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{87594c2 com.google.android.apps.youtube.music/10143} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{d6fa2d3 com.samsung.android.watch.watchface.digitalfont/10029} BLOCKED
07-23 20:03:22.734 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{e56ce10 com.samsung.android.watch.watchface.flowergarden/10027} BLOCKED
07-23 20:03:22.735 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{e1ecd09 com.bshg.homeconnect.watch/10144} BLOCKED
07-23 20:03:22.735 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{38c3b0e com.samsung.android.watch.watchface.endangeredanimal/10025} BLOCKED
07-23 20:03:22.735 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{787992f com.benoitletondor.pixelminimalwatchface/10139} BLOCKED
07-23 20:03:22.735 654 864 I AppsFilter: interaction: PackageSetting{8f8fa50 com.minimalapp/10215} ->
PackageSetting{ec2bb3c com.samsung.android.overlay.modules.packageinstaller/10153} BLOCKED
07-23 20:03:22.745 14902 14902 D nativeloader: Configuring clns-4 for other apk
/system/framework/com.google.android.wearable.jar. target_sdk_version=34, uses_libraries=ALL,
library_path=/data/app/~~wvt9rnFEVoeE0iTFCZV0yQ==/com.minimalapp-tHYOTkZ1JcHta7GLcl4qxw==/lib/arm,
permitted_path=/data:/mnt/expand:/data/user/0/com.minimalapp
07-23 20:03:22.754 14902 14902 W ziparchive: Unable to open
'/data/app/~~wvt9rnFEVoeE0iTFCZV0yQ==/com.minimalapp-tHYOTkZ1JcHta7GLcl4qxw==/base.dm': No such file or directory
07-23 20:03:22.755 14902 14902 W ziparchive: Unable to open
'/data/app/~~wvt9rnFEVoeE0iTFCZV0yQ==/com.minimalapp-tHYOTkZ1JcHta7GLcl4qxw==/base.dm': No such file or directory
07-23 20:03:22.945 654 654 W NotificationService: Object died trying to hide custom toast
android.os.BinderProxy@4793078 in package com.minimalapp
