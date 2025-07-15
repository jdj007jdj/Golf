you need to undo the bridgeless mode changes you made here:

● Read(android/app/src/main/java/com/minimalapp/MainApplication.kt)
⎿ Read 45 lines (ctrl+r to expand)

● Perfect! I can see it's Kotlin. Let me add the bridgeless mode disable configuration:

● Update(android/app/src/main/java/com/minimalapp/MainApplication.kt)
⎿ Updated android/app/src/main/java/com/minimalapp/MainApplication.kt with 3 additions
28  
 29 override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
30 override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
31 +
32 + // Disable bridgeless mode to fix MapLibre HTTP requests
33 + override fun isBridgeless(): Boolean = false
34 }
35  
 36 override val reactHost: ReactHost

● Perfect! I've added override fun isBridgeless(): Boolean = false to disable bridgeless mode at the native Android
level.

Now let's update the test screen to go back to testing MapTiler satellite imagery:

● Update(src/TestMapScreen.js)
⎿ Updated src/TestMapScreen.js with 1 addition and 1 removal
8 const { width, height } = Dimensions.get('window');
9  
 10 const TestMapScreen = () => {
11 - console.log('🧪 TestMapScreen: Component mounted - Testing with bridgeless mode DISABLED');
11 + console.log('🧪 TestMapScreen: Component mounted - Testing with bridgeless mode DISABLED at native
level'); + level');
12  
 13 useEffect(() => {
14 console.log('🧪 TestMapScreen: useEffect called');

● Update(src/TestMapScreen.js)
⎿ Updated src/TestMapScreen.js with 3 additions and 18 removals
29 });
30 }, []);
31  
 32 - // Debug - let's see what style is actually being used
33 - const debugStyle = {
34 - version: 8,
35 - sources: {
36 - 'debug': {
37 - type: 'raster',
38 - tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
39 - tileSize: 256,
40 - maxzoom: 19
41 - }
42 - },
43 - layers: [{
44 - id: 'debug-layer',
45 - type: 'raster',
46 - source: 'debug'
47 - }]
48 - };
32 + // Test MapTiler satellite with bridgeless mode disabled
33 + const mapStyleURL = 'https://api.maptiler.com/maps/satellite/style.json?key=9VwMyrJdecjrEB6fwLGJ';
34  
 35 - console.log('🧪 TestMapScreen: Debug style JSON:', JSON.stringify(debugStyle, null, 2));
35 + console.log('🧪 TestMapScreen: Testing MapTiler satellite style URL:', mapStyleURL);
36  
 37 const onMapReady = () => {
38 console.log('🧪 TestMapScreen: Map is ready!');

● Update(src/TestMapScreen.js)
⎿ Updated src/TestMapScreen.js with 1 addition and 1 removal
48
49 <MapLibreGL.MapView
50 style={styles.map}
51 - styleJSON={JSON.stringify(debugStyle)}
51 + styleURL={mapStyleURL}
52 onDidFinishLoadingMap={onMapReady}
53 onDidFailLoadingMap={onMapError}
54 logoEnabled={false}
