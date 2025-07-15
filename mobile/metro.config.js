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
  // Add detailed logging
  reporter: {
    update: (event) => {
      console.log('Metro event:', event.type);
      if (event.type === 'transform_cache_reset') {
        console.log('Metro cache reset');
      }
      if (event.type === 'bundle_build_done') {
        console.log('Bundle build complete');
      }
      if (event.type === 'bundle_transform_progressed') {
        console.log(`Transform progress: ${event.transformedFileCount}/${event.totalFileCount}`);
      }
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
