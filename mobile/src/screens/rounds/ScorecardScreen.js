import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
  AppState,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ScorecardScreen = ({ route, navigation }) => {
  const { round, course } = route.params;
  
  // Initialize scores state - one score per hole
  const [scores, setScores] = useState({});
  const [currentHole, setCurrentHole] = useState(1);
  const [scoreAnimation] = useState(new Animated.Value(1));
  const [isLoading, setIsLoading] = useState(true);
  
  // Storage key for this specific round
  const STORAGE_KEY = `golf_round_${round?.id || 'temp'}_scores`;
  
  // Get holes from course data, fallback to default 18 holes
  const holes = course.holes || Array.from({ length: 18 }, (_, i) => ({
    id: `default-${i + 1}`,
    holeNumber: i + 1,
    par: i + 1 <= 4 ? 4 : i + 1 <= 10 ? (i + 1) % 2 === 0 ? 5 : 3 : 4, // Mixed pars
  }));

  // Load scores from AsyncStorage on component mount
  useEffect(() => {
    loadScores();
  }, []);

  // Save scores to AsyncStorage whenever scores change
  useEffect(() => {
    if (!isLoading) {
      saveScores();
    }
  }, [scores, isLoading]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background, save scores
        console.log('App backgrounding, saving scores...');
        saveScores();
      } else if (nextAppState === 'active') {
        // App is coming to foreground, reload scores
        console.log('App foregrounding, reloading scores...');
        loadScores();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [scores]);

  const loadScores = async () => {
    try {
      const savedScores = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedScores) {
        const parsedScores = JSON.parse(savedScores);
        setScores(parsedScores);
        console.log('Loaded saved scores:', parsedScores);
      }
    } catch (error) {
      console.error('Error loading scores:', error);
      Alert.alert(
        'Load Error',
        'Failed to load saved scores. Starting fresh.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const saveScores = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
      console.log('Scores saved successfully');
    } catch (error) {
      console.error('Error saving scores:', error);
      // Don't show alert for save errors as it would be too disruptive
    }
  };

  const clearSavedScores = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('Saved scores cleared');
    } catch (error) {
      console.error('Error clearing saved scores:', error);
    }
  };

  const updateScore = (holeNumber, newScore) => {
    // Score validation: must be between 1-15 strokes
    if (newScore < 0) newScore = 0;
    if (newScore > 15) newScore = 15;
    
    // Visual feedback only (vibration removed to avoid permission issues)
    
    // Animate score change
    Animated.sequence([
      Animated.timing(scoreAnimation, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scoreAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setScores(prev => ({
      ...prev,
      [holeNumber]: newScore
    }));
  };

  const getCurrentHoleData = () => {
    return holes.find(hole => hole.holeNumber === currentHole) || holes[0];
  };

  const currentHoleData = getCurrentHoleData();
  const currentScore = scores[currentHole] || 0;

  // Calculate running total
  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  const totalPar = holes.slice(0, currentHole).reduce((sum, hole) => sum + hole.par, 0);
  const scoreToPar = totalScore - totalPar;

  const nextHole = () => {
    if (currentHole < holes.length) {
      setCurrentHole(currentHole + 1);
    }
  };

  const prevHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  // Show loading indicator while loading scores
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading scorecard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scorecard</Text>
      </View>

      {/* Score Summary */}
      <View style={styles.scoreSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{totalScore}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Par</Text>
          <Text style={styles.summaryValue}>{totalPar}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Score</Text>
          <Text style={[
            styles.summaryValue,
            scoreToPar < 0 ? styles.underPar : scoreToPar > 0 ? styles.overPar : styles.evenPar
          ]}>
            {scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar}
          </Text>
        </View>
      </View>

      {/* Current Hole */}
      <View style={styles.currentHole}>
        <View style={styles.holeNavigation}>
          <TouchableOpacity 
            style={[styles.navButton, currentHole === 1 && styles.navButtonDisabled]}
            onPress={prevHole}
            disabled={currentHole === 1}
          >
            <Text style={[styles.navButtonText, currentHole === 1 && styles.navButtonTextDisabled]}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.holeInfo}>
            <Text style={styles.holeNumber}>Hole {currentHole}</Text>
            <Text style={styles.holePar}>Par {currentHoleData.par}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.navButton, currentHole === holes.length && styles.navButtonDisabled]}
            onPress={nextHole}
            disabled={currentHole === holes.length}
          >
            <Text style={[styles.navButtonText, currentHole === holes.length && styles.navButtonTextDisabled]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Score Entry */}
        <View style={styles.scoreEntry}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            {currentScore > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => updateScore(currentHole, 0)}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.scoreControls}>
            <TouchableOpacity 
              style={[
                styles.scoreButton, 
                styles.decrementButton,
                currentScore <= 0 && styles.scoreButtonDisabled
              ]}
              onPress={() => currentScore > 0 && updateScore(currentHole, currentScore - 1)}
              disabled={currentScore <= 0}
              activeOpacity={currentScore <= 0 ? 1 : 0.7}
            >
              <Text style={[
                styles.scoreButtonText,
                currentScore <= 0 && styles.scoreButtonTextDisabled
              ]}>−</Text>
            </TouchableOpacity>
            
            <Animated.View style={[
              styles.scoreDisplay,
              { transform: [{ scale: scoreAnimation }] }
            ]}>
              <Text style={[
                styles.scoreValue,
                currentScore > currentHoleData.par + 4 && styles.extremeScore
              ]}>{currentScore || '−'}</Text>
              {currentScore > 0 && (
                <Text style={[
                  styles.scoreDifference,
                  currentScore < currentHoleData.par ? styles.underPar :
                  currentScore > currentHoleData.par + 3 ? styles.extremeScore :
                  currentScore > currentHoleData.par ? styles.overPar : styles.evenPar
                ]}>
                  {currentScore === currentHoleData.par ? 'Par' :
                   currentScore === currentHoleData.par - 1 ? 'Birdie' :
                   currentScore === currentHoleData.par - 2 ? 'Eagle' :
                   currentScore === currentHoleData.par - 3 ? 'Albatross' :
                   currentScore === currentHoleData.par + 1 ? 'Bogey' :
                   currentScore === currentHoleData.par + 2 ? 'Double' :
                   currentScore === currentHoleData.par + 3 ? 'Triple' :
                   currentScore > currentHoleData.par + 3 ? `${currentScore - currentHoleData.par} over par` :
                   currentScore < currentHoleData.par ? `${currentHoleData.par - currentScore} under` :
                   `${currentScore - currentHoleData.par} over`}
                </Text>
              )}
            </Animated.View>
            
            <TouchableOpacity 
              style={[
                styles.scoreButton, 
                styles.incrementButton,
                currentScore >= 15 && styles.scoreButtonDisabled
              ]}
              onPress={() => currentScore < 15 && updateScore(currentHole, currentScore + 1)}
              disabled={currentScore >= 15}
              activeOpacity={currentScore >= 15 ? 1 : 0.7}
            >
              <Text style={[
                styles.scoreButtonText,
                currentScore >= 15 && styles.scoreButtonTextDisabled
              ]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Score Limit Warning */}
        {(currentScore >= 15 || currentScore <= 0) && (
          <View style={styles.limitWarning}>
            <Text style={styles.limitWarningText}>
              {currentScore >= 15 ? 'Maximum score: 15 strokes' : 
               currentScore <= 0 ? 'Minimum score: 1 stroke' : ''}
            </Text>
          </View>
        )}

        {/* Quick Score Buttons */}
        <View style={styles.quickScores}>
          <Text style={styles.quickScoreLabel}>Quick Entry</Text>
          <View style={styles.quickScoreButtons}>
            {[currentHoleData.par - 1, currentHoleData.par, currentHoleData.par + 1, currentHoleData.par + 2]
              .filter(score => score >= 1 && score <= 15) // Only show valid scores
              .map((score) => (
              <TouchableOpacity
                key={score}
                style={[
                  styles.quickButton,
                  currentScore === score && styles.quickButtonSelected
                ]}
                onPress={() => updateScore(currentHole, score)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.quickButtonText,
                  currentScore === score && styles.quickButtonTextSelected
                ]}>
                  {score}
                </Text>
                <Text style={[
                  styles.quickButtonLabel,
                  currentScore === score && styles.quickButtonLabelSelected
                ]}>
                  {score === currentHoleData.par - 1 ? 'Birdie' :
                   score === currentHoleData.par ? 'Par' :
                   score === currentHoleData.par + 1 ? 'Bogey' :
                   'Double'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Hole Progress */}
      <View style={styles.holeProgress}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.progressContainer}
        >
          {holes.map((hole) => (
            <TouchableOpacity
              key={hole.holeNumber}
              style={[
                styles.progressHole,
                hole.holeNumber === currentHole && styles.progressHoleCurrent,
                scores[hole.holeNumber] > 0 && styles.progressHoleCompleted
              ]}
              onPress={() => setCurrentHole(hole.holeNumber)}
            >
              <Text style={[
                styles.progressHoleNumber,
                hole.holeNumber === currentHole && styles.progressHoleNumberCurrent,
                scores[hole.holeNumber] > 0 && styles.progressHoleNumberCompleted
              ]}>
                {hole.holeNumber}
              </Text>
              {scores[hole.holeNumber] > 0 && (
                <Text style={styles.progressHoleScore}>{scores[hole.holeNumber]}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  
  // Score Summary
  scoreSummary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  underPar: {
    color: '#4caf50',
  },
  overPar: {
    color: '#f44336',
  },
  evenPar: {
    color: '#333',
  },
  extremeScore: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  
  // Current Hole
  currentHole: {
    flex: 1,
    padding: 20,
  },
  holeNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  holeInfo: {
    alignItems: 'center',
  },
  holeNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  holePar: {
    fontSize: 16,
    color: '#666',
  },
  
  // Score Entry
  scoreEntry: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  decrementButton: {
    backgroundColor: '#f44336',
  },
  incrementButton: {
    backgroundColor: '#4caf50',
  },
  scoreButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.5,
  },
  scoreButtonText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreButtonTextDisabled: {
    color: '#999999',
  },
  scoreDisplay: {
    marginHorizontal: 40,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2e7d32',
    minWidth: 80,
    textAlign: 'center',
  },
  scoreDifference: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  
  // Score Limit Warning
  limitWarning: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  limitWarningText: {
    fontSize: 14,
    color: '#f57c00',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Quick Scores
  quickScores: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  quickScoreLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  quickScoreButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  quickButtonSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  quickButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  quickButtonTextSelected: {
    color: '#4caf50',
  },
  quickButtonLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickButtonLabelSelected: {
    color: '#4caf50',
  },
  
  // Hole Progress
  holeProgress: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressContainer: {
    paddingHorizontal: 20,
  },
  progressHole: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  progressHoleCurrent: {
    backgroundColor: '#2e7d32',
    borderColor: '#1b5e20',
  },
  progressHoleCompleted: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  progressHoleNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  progressHoleNumberCurrent: {
    color: 'white',
  },
  progressHoleNumberCompleted: {
    color: '#4caf50',
  },
  progressHoleScore: {
    fontSize: 10,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 2,
  },
});

export default ScorecardScreen;