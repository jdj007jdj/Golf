const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Add more detailed logging for resolver issues
    resolverMainFields: ['react-native', 'browser', 'main'],
    platforms: ['ios', 'android', 'native', 'web'],
  },
  transformer: {
    // Enable more detailed transformation logging
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  // Add detailed logging with error tracking
  reporter: {
    update: (event) => {
      // Log all events with timestamps
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 📦 Metro event: ${event.type}`);
      
      if (event.type === 'transform_cache_reset') {
        console.log('🔄 Metro cache reset');
      }
      if (event.type === 'bundle_build_done') {
        console.log('✅ Bundle build complete');
      }
      if (event.type === 'bundle_transform_progressed') {
        console.log(`🔄 Transform progress: ${event.transformedFileCount}/${event.totalFileCount}`);
      }
      if (event.type === 'bundle_build_failed') {
        console.error('❌ Bundle build failed:', event.error);
      }
      if (event.type === 'transform_cache_reset') {
        console.log('🔄 Transform cache reset');
      }
      if (event.type === 'dep_graph_loaded') {
        console.log('📊 Dependency graph loaded');
      }
      if (event.type === 'bundle_transform_progressed_throttled') {
        console.log(`⏱️  Transform throttled: ${event.transformedFileCount}/${event.totalFileCount}`);
      }
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
