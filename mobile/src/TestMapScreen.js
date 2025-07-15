import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, ActivityIndicator, ScrollView } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { mapTilerProxy } from '../utils/MapTilerProxy';
import { customTileSource } from '../utils/CustomTileSource';

// Set access token to null
MapLibreGL.setAccessToken(null);

const { width, height } = Dimensions.get('window');

const TestMapScreen = () => {
  console.log('🧪 TestMapScreen: Component mounted - Testing satellite tile loading');
  const [testTiles, setTestTiles] = useState([]);
  const [proxiedStyle, setProxiedStyle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🧪 TestMapScreen: useEffect called');
    
    // Test fetching multiple tiles
    testMultipleTileFetch();
    
    // Load proxied style
    loadProxiedStyle();
  }, []);

  const testMultipleTileFetch = async () => {
    console.log('🧪 Testing satellite tile fetching via JavaScript...');
    setLoading(true);
    
    try {
      // Fetch tiles around Augusta National at zoom 16
      const tiles = [
        { z: 16, x: 18894, y: 25806, label: 'Center' },
        { z: 16, x: 18893, y: 25806, label: 'West' },
        { z: 16, x: 18895, y: 25806, label: 'East' },
        { z: 16, x: 18894, y: 25805, label: 'North' }
      ];

      const fetchedTiles = await Promise.all(
        tiles.map(async (tile) => {
          const url = `https://api.maptiler.com/tiles/satellite-v2/${tile.z}/${tile.x}/${tile.y}.jpg?key=9VwMyrJdecjrEB6fwLGJ`;
          return {
            ...tile,
            url,
            status: 'loading'
          };
        })
      );

      setTestTiles(fetchedTiles);
      console.log('✅ Satellite tiles ready for display');
    } catch (error) {
      console.error('❌ Tile fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProxiedStyle = async () => {
    console.log('🧪 Loading MapTiler satellite style...');
    const style = await mapTilerProxy.getProxiedStyle();
    setProxiedStyle(style);
  };

  const onMapReady = () => {
    console.log('🧪 TestMapScreen: Map is ready!');
  };

  const onMapError = (error) => {
    console.error('🧪 TestMapScreen: Map error:', error);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>MapTiler Satellite Test</Text>
      
      {/* Test 1: Show satellite tiles directly */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direct Satellite Tiles (via fetch):</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2e7d32" />
        ) : (
          <View style={styles.tileGrid}>
            {testTiles.map((tile, index) => (
              <View key={index} style={styles.tileContainer}>
                <Text style={styles.tileLabel}>{tile.label}</Text>
                <Image 
                  source={{ uri: tile.url }} 
                  style={styles.tileImage}
                  resizeMode="cover"
                  onLoad={() => console.log(`✅ Tile ${tile.label} loaded`)}
                  onError={(e) => console.error(`❌ Tile ${tile.label} error:`, e.nativeEvent.error)}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Test 2: MapLibre with satellite style */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MapLibre with Satellite Style:</Text>
        {proxiedStyle ? (
          <MapLibreGL.MapView
            style={styles.mapView}
            styleJSON={JSON.stringify(proxiedStyle)}
            onDidFinishLoadingMap={onMapReady}
            onDidFailLoadingMap={onMapError}
            logoEnabled={false}
            attributionEnabled={false}
          >
            <MapLibreGL.Camera
              centerCoordinate={[-82.0206, 33.5031]}
              zoomLevel={16}
            />
          </MapLibreGL.MapView>
        ) : (
          <ActivityIndicator size="small" color="#2e7d32" />
        )}
      </View>
      
      <Text style={styles.info}>Testing MapTiler satellite imagery in React Native</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#2e7d32',
    color: 'white',
  },
  section: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tileContainer: {
    margin: 5,
    alignItems: 'center',
  },
  tileLabel: {
    fontSize: 12,
    marginBottom: 2,
    color: '#666',
  },
  tileImage: {
    width: (width - 60) / 2,
    height: (width - 60) / 2,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  mapView: {
    width: width - 20,
    height: 300,
    backgroundColor: '#ddd',
  },
  info: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
    color: '#666',
  },
});

export default TestMapScreen;