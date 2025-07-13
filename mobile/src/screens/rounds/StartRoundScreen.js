import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_CONFIG } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StartRoundScreen = ({ route, navigation }) => {
  const { course } = route.params || {};
  const { token } = useAuth();
  
  const [roundType, setRoundType] = useState('practice');
  const [selectedTeeBox, setSelectedTeeBox] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use tee boxes from the course data, fallback to default options
  const teeBoxOptions = course.teeBoxes && course.teeBoxes.length > 0 
    ? course.teeBoxes 
    : [
        { id: 'default-white', name: 'White', color: '#FFFFFF' },
        { id: 'default-blue', name: 'Blue', color: '#0066CC' },
        { id: 'default-red', name: 'Red', color: '#CC0000' },
      ];

  // Set default tee box when component mounts
  React.useEffect(() => {
    if (teeBoxOptions.length > 0 && !selectedTeeBox) {
      // Default to White tee or first available
      const defaultTee = teeBoxOptions.find(tee => tee.name.toLowerCase() === 'white') || teeBoxOptions[0];
      setSelectedTeeBox(defaultTee.id);
    }
  }, [teeBoxOptions, selectedTeeBox]);

  const handleStartRound = async () => {
    if (!selectedTeeBox) {
      Alert.alert('Error', 'Please select a tee box');
      return;
    }

    setLoading(true);
    try {
      const roundData = {
        courseId: course.id,
        teeBoxId: selectedTeeBox,
        roundType,
        startTime: new Date().toISOString(),
      };

      // Create AbortController for request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.ROUNDS, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roundData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok && data.success) {
        // Save active round data for resumption
        const activeRoundData = {
          round: data.data,
          course: course,
          startedAt: new Date().toISOString()
        };
        
        try {
          await AsyncStorage.setItem('golf_active_round', JSON.stringify(activeRoundData));
        } catch (error) {
          console.error('Error saving active round:', error);
        }
        
        // Navigate to scorecard with the new round data
        navigation.navigate('Scorecard', { 
          round: data.data,
          course: course 
        });
      } else {
        Alert.alert(
          'Error',
          data.error?.message || data.message || 'Failed to start round. Please try again.'
        );
      }
    } catch (error) {
      console.error('CATCH: Error starting round:', error);
      if (error.name === 'AbortError') {
        Alert.alert(
          'Request Timeout',
          'The request timed out. Please check your connection and try again.'
        );
      } else {
        Alert.alert(
          'Error',
          'Network error. Please check your connection and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Start New Round</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{course.name}</Text>
          <Text style={styles.courseLocation}>
            {[course.city, course.state, course.country].filter(Boolean).join(', ')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Round Type</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.option,
                roundType === 'practice' && styles.optionSelected
              ]}
              onPress={() => setRoundType('practice')}
            >
              <Text style={[
                styles.optionText,
                roundType === 'practice' && styles.optionTextSelected
              ]}>
                Practice Round
              </Text>
              <Text style={styles.optionDescription}>
                Casual round for practice
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                roundType === 'official' && styles.optionSelected
              ]}
              onPress={() => setRoundType('official')}
            >
              <Text style={[
                styles.optionText,
                roundType === 'official' && styles.optionTextSelected
              ]}>
                Official Round
              </Text>
              <Text style={styles.optionDescription}>
                Counts toward handicap
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tee Box</Text>
          <View style={styles.teeBoxContainer}>
            {teeBoxOptions.map((tee) => (
              <TouchableOpacity
                key={tee.id}
                style={[
                  styles.teeBox,
                  selectedTeeBox === tee.id && styles.teeBoxSelected,
                  { borderColor: (tee.color === '#FFFFFF' || !tee.color) ? '#DDD' : tee.color }
                ]}
                onPress={() => setSelectedTeeBox(tee.id)}
              >
                <View
                  style={[
                    styles.teeBoxColor,
                    { 
                      backgroundColor: tee.color || '#FFFFFF',
                      borderWidth: selectedTeeBox === tee.id ? 2 : (tee.color === '#FFFFFF' || !tee.color) ? 1 : 0,
                      borderColor: selectedTeeBox === tee.id ? 'white' : '#DDD'
                    }
                  ]}
                />
                <Text style={[
                  styles.teeBoxText,
                  selectedTeeBox === tee.id && styles.teeBoxTextSelected
                ]}>
                  {tee.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.roundInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>
              {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, loading && styles.startButtonDisabled]}
          onPress={handleStartRound}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.startButtonText}>Start Round</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2e7d32',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    color: 'white',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  courseInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  courseLocation: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: '#2e7d32',
    backgroundColor: '#f0f9f0',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  optionTextSelected: {
    color: '#2e7d32',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  teeBoxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  teeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  teeBoxSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#1b5e20',
    borderWidth: 3,
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  teeBoxColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  teeBoxText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  teeBoxTextSelected: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 17,
  },
  roundInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 100,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  startButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StartRoundScreen;