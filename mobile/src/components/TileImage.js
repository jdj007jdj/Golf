import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, StyleSheet } from 'react-native';

const TileImage = ({ tile, style, onLoad, onError }) => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTile = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Use fetch to bypass bridgeless mode HTTP issues
        const response = await fetch(tile.url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Convert blob to base64 data URI
        const reader = new FileReader();
        reader.onloadend = () => {
          if (mounted) {
            setImageData(reader.result);
            setLoading(false);
            if (onLoad) onLoad();
          }
        };
        reader.onerror = () => {
          if (mounted) {
            setError(true);
            setLoading(false);
            if (onError) onError({ nativeEvent: { error: 'Failed to read blob' } });
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error(`Failed to load tile ${tile.key}:`, err);
        if (mounted) {
          setError(true);
          setLoading(false);
          if (onError) onError({ nativeEvent: { error: err.message } });
        }
      }
    };

    loadTile();

    return () => {
      mounted = false;
    };
  }, [tile.url, tile.key]);

  if (error) {
    return (
      <View style={[style, styles.errorContainer]}>
        {/* Empty view for failed tiles */}
      </View>
    );
  }

  if (loading || !imageData) {
    return (
      <View style={[style, styles.loadingContainer]}>
        <ActivityIndicator size="small" color="#999" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageData }}
      style={style}
      resizeMode="cover"
      fadeDuration={0}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#1a1a1a',
  },
});

export default TileImage;