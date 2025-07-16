BUNDLE ./index.js

ERROR Error: Unable to resolve module ../utils/MapTilerProxy from /home/jano/development/Golf/mobile/src/TestMapScreen.js:

None of these files exist:

- utils/MapTilerProxy(.android.js|.native.js|.js|.android.jsx|.native.jsx|.jsx|.android.json|.native.json|.json|.android.ts|.native.ts|.ts|.android.tsx|.native.tsx|.tsx)
- utils/MapTilerProxy
  2 | import { View, Text, StyleSheet, Dimensions, Image, ActivityIndicator, ScrollView } from 'react-native';
  3 | import MapLibreGL from '@maplibre/maplibre-react-native';
  > 4 | import { mapTilerProxy } from '../utils/MapTilerProxy';
      |                                ^
  5 | import { customTileSource } from '../utils/CustomTileSource';
  6 |
  7 | // Set access token to null
  at ModuleResolver.resolveDependency (/home/jano/development/Golf/mobile/node_modules/metro/src/node-haste/DependencyGraph/ModuleResolution.js:114:15)
  at DependencyGraph.resolveDependency (/home/jano/development/Golf/mobile/node_modules/metro/src/node-haste/DependencyGraph.js:248:43)
  at /home/jano/development/Golf/mobile/node_modules/metro/src/lib/transformHelpers.js:165:21
  at resolveDependencies (/home/jano/development/Golf/mobile/node_modules/metro/src/DeltaBundler/buildSubgraph.js:42:25)
  at visit (/home/jano/development/Golf/mobile/node_modules/metro/src/DeltaBundler/buildSubgraph.js:83:30)
  at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
  at async Promise.all (index 20)
  at async visit (/home/jano/development/Golf/mobile/node_modules/metro/src/DeltaBundler/buildSubgraph.js:92:5)
  at async Promise.all (index 5)
  at async visit (/home/jano/development/Golf/mobile/node_modules/metro/src/DeltaBundler/buildSubgraph.js:92:5)
