import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import SharedHeader from '../rounds/components/SharedHeader';
import MapViewWithGestures from '../rounds/components/MapViewWithGestures';
import shotTrackingService from '../../services/shotTrackingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MapScreen = ({ route, navigation }) => {
  const { round, course } = route.params;
  const { token, isLocalAccount } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  // Map-specific state
  const [currentHole, setCurrentHole] = useState(1);
  const [shots, setShots] = useState([]);
  const [scores, setScores] = useState({});
  
  // Get holes from course data
  const holes = course.holes || Array.from({ length: 18 }, (_, i) => ({
    id: `default-${i + 1}`,
    holeNumber: i + 1,
    par: i + 1 <= 4 ? 4 : i + 1 <= 10 ? (i + 1) % 2 === 0 ? 5 : 3 : 4,
  }));

  // Load scores from AsyncStorage
  useEffect(() => {
    const loadScores = async () => {
      try {
        const STORAGE_KEY = `golf_round_${round?.id || 'temp'}_scores`;
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setScores(parsedData.scores || {});
          setCurrentHole(parsedData.currentHole || 1);
        }
      } catch (error) {
        console.error('Error loading scores:', error);
      }
    };
    
    loadScores();
  }, [round?.id]);

  // Load shots periodically
  useEffect(() => {
    const loadShots = async () => {
      if (round?.id) {
        const allShots = await shotTrackingService.getAllShots();
        setShots(allShots);
      }
    };

    loadShots();
    const shotInterval = setInterval(loadShots, 5000); // Update every 5 seconds
    
    return () => clearInterval(shotInterval);
  }, [round?.id]);

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <SharedHeader
          navigation={navigation}
          onSettingsPress={handleSettings}
          onBackPress={handleBack}
          title="Course Map"
        />
      </View>
      
      <View style={styles.mapContainer}>
        <MapViewWithGestures
          course={course}
          holes={holes}
          currentHole={currentHole}
          setCurrentHole={setCurrentHole}
          round={round}
          shots={shots}
          scores={scores}
          settings={settings}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    position: 'relative',
    zIndex: 1001,
    elevation: 11,
    backgroundColor: '#2e7d32', // Ensure solid background
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
});

export default MapScreen;