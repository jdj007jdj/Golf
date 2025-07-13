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
  Modal,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { API_CONFIG } from '../../config/api';

const { width } = Dimensions.get('window');

const ScorecardScreen = ({ route, navigation }) => {
  const { round, course } = route.params;
  const { token } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  // Initialize scores state - one score per hole
  const [scores, setScores] = useState({});
  const [putts, setPutts] = useState({});
  const [currentHole, setCurrentHole] = useState(1);
  const [scoreAnimation] = useState(new Animated.Value(1));
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingRound, setIsSavingRound] = useState(false);
  
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
  }, [scores, putts, isLoading]);

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
        setScores(parsedScores.scores || parsedScores); // Support old format
        setPutts(parsedScores.putts || {});
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
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ scores, putts }));
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

  const updateScore = async (holeNumber, newScore) => {
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

    // Update local state first
    setScores(prev => ({
      ...prev,
      [holeNumber]: newScore
    }));

    // Save to backend if score > 0 (only save actual scores, not clears)
    if (newScore > 0) {
      await saveScoreToBackend(holeNumber, newScore, putts[holeNumber]);
    }
  };

  const updatePutts = async (holeNumber, newPutts) => {
    // Putts validation: must be between 0-10
    if (newPutts < 0) newPutts = 0;
    if (newPutts > 10) newPutts = 10;
    
    // Update local state
    setPutts(prev => ({ ...prev, [holeNumber]: newPutts }));

    // Save to backend if score exists
    if (scores[holeNumber] > 0) {
      await saveScoreToBackend(holeNumber, scores[holeNumber], newPutts);
    }
  };

  const saveScoreToBackend = async (holeNumber, score, puttCount = null) => {
    try {
      const hole = holes.find(h => h.holeNumber === holeNumber);
      if (!hole || !round?.id) {
        console.log('Missing hole or round data, skipping backend save');
        return;
      }

      const requestBody = {
        holeId: hole.id,
        strokes: score,
        putts: puttCount
      };
      
      console.log('Saving score to backend:', {
        url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROUNDS}/${round.id}/scores`,
        body: requestBody,
        holeNumber: hole.holeNumber,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROUNDS}/${round.id}/scores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save score to backend:', errorData);
        // Don't show alert for save errors as it would be disruptive during play
      } else {
        console.log(`Score saved to backend: Hole ${holeNumber} = ${score}`);
      }
    } catch (error) {
      console.error('Error saving score to backend:', error);
      // Silently fail - local storage will preserve the score
    }
  };

  const getCurrentHoleData = () => {
    const hole = holes.find(hole => hole.holeNumber === currentHole) || holes[0];
    
    // Extract distance from holeTees based on selected teeBox
    let distance = null;
    if (hole.holeTees && round?.teeBoxId) {
      const holeTee = hole.holeTees.find(ht => ht.teeBoxId === round.teeBoxId);
      if (holeTee) {
        distance = holeTee.distanceYards;
      }
    }
    
    return {
      ...hole,
      yardage: distance
    };
  };

  const currentHoleData = getCurrentHoleData();
  const currentScore = scores[currentHole] || 0;
  const currentPutts = putts[currentHole] || 0;

  // Calculate running total
  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  const playedHoles = holes.filter(hole => scores[hole.holeNumber] > 0);
  const totalPar = playedHoles.reduce((sum, hole) => sum + hole.par, 0);
  const scoreToPar = totalScore - totalPar;
  
  // Check round completion status
  const holesCompleted = Object.keys(scores).filter(hole => scores[hole] > 0).length;
  const isRoundComplete = holesCompleted === holes.length;
  
  // Check if front 9, back 9, or all 18 holes are complete
  const front9Complete = holes.slice(0, 9).every(hole => scores[hole.holeNumber] > 0);
  const back9Complete = holes.slice(9, 18).every(hole => scores[hole.holeNumber] > 0);
  const canFinishRound = front9Complete || back9Complete || isRoundComplete;

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

  const handleFinishRound = () => {
    let roundType = '';
    if (isRoundComplete) {
      roundType = 'Full Round (18 holes)';
    } else if (front9Complete && back9Complete) {
      roundType = 'Full Round (18 holes)';
    } else if (front9Complete) {
      roundType = 'Front 9';
    } else if (back9Complete) {
      roundType = 'Back 9';
    }

    const totalCoursePar = isRoundComplete 
      ? holes.reduce((sum, hole) => sum + hole.par, 0)
      : playedHoles.reduce((sum, hole) => sum + hole.par, 0);
    const finalScore = totalScore;
    const finalScoreToPar = finalScore - totalCoursePar;
    
    Alert.alert(
      'Finish Round?',
      `Are you sure you want to finish this ${roundType}?\n\nFinal Score: ${finalScore}\nPar: ${totalCoursePar}\nScore: ${finalScoreToPar === 0 ? 'E' : finalScoreToPar > 0 ? `+${finalScoreToPar}` : finalScoreToPar}\n\nHoles Completed: ${holesCompleted}/${holes.length}`,
      [
        {
          text: 'Continue Playing',
          style: 'cancel',
        },
        {
          text: 'Finish Round',
          style: 'destructive',
          onPress: async () => {
            // Show loading state
            setIsSavingRound(true);
            
            try {
              // Save round to backend
              const result = await completeRoundInBackend();
              
              if (!result.success) {
                setIsSavingRound(false);
                Alert.alert(
                  'Save Failed', 
                  `Could not save your round to the server: ${result.error}\n\nYour scores are saved locally. Try again later or contact support.`,
                  [
                    {
                      text: 'Continue Anyway',
                      onPress: () => {
                        clearActiveRound();
                        navigation.navigate('RoundSummary', {
                          roundData: round,
                          course: course,
                          scores: scores,
                          roundType: roundType,
                          holesCompleted: holesCompleted,
                          saveError: true
                        });
                      }
                    },
                    { text: 'Try Again', onPress: () => {} }
                  ]
                );
                return;
              }
              
              // Success - clear active round and navigate
              await clearActiveRound();
              navigation.navigate('RoundSummary', {
                roundData: result.data || round,
                course: course,
                scores: scores,
                roundType: roundType,
                holesCompleted: holesCompleted,
                saveError: false
              });
            } catch (error) {
              console.error('Error finishing round:', error);
              setIsSavingRound(false);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
          },
        },
      ]
    );
  };


  const completeRoundInBackend = async () => {
    try {
      if (!round?.id) {
        console.log('No round ID, skipping backend completion');
        return { success: true }; // Allow local completion
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROUNDS}/${round.id}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to complete round in backend:', data);
        return { success: false, error: data.message || 'Failed to save round' };
      }

      console.log('Round completed in backend:', data);
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error completing round in backend:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const clearActiveRound = async () => {
    try {
      await AsyncStorage.removeItem('golf_active_round');
      console.log('Active round cleared');
    } catch (error) {
      console.error('Error clearing active round:', error);
    }
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  const handleEndRound = () => {
    setShowSettings(false); // Close the modal first
    
    Alert.alert(
      'End Round Early',
      'Are you sure you want to end this round? Your progress will be saved.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Round',
          style: 'destructive',
          onPress: async () => {
            // Show loading state
            setIsSavingRound(true);
            
            try {
              // Save round to backend
              const result = await completeRoundInBackend();
              
              if (!result.success) {
                setIsSavingRound(false);
                Alert.alert(
                  'Save Failed', 
                  `Could not save your round to the server: ${result.error}\n\nYour scores are saved locally. Try again later or contact support.`,
                  [
                    {
                      text: 'Continue Anyway',
                      onPress: () => {
                        clearActiveRound();
                        navigation.navigate('RoundSummary', {
                          roundData: round,
                          course: course,
                          scores: scores,
                          roundType: 'Incomplete Round',
                          holesCompleted: Object.keys(scores).length,
                          saveError: true
                        });
                      }
                    },
                    { text: 'Try Again', onPress: () => {} }
                  ]
                );
                return;
              }
              
              // Success - clear active round and navigate
              await clearActiveRound();
              navigation.navigate('RoundSummary', {
                roundData: result.data || round,
                course: course,
                scores: scores,
                roundType: 'Incomplete Round',
                holesCompleted: Object.keys(scores).length,
                saveError: false
              });
            } catch (error) {
              console.error('Error finishing round:', error);
              setIsSavingRound(false);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderSettingsModal = () => (
    <Modal
      visible={showSettings}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseSettings}
    >
      <View style={styles.settingsModal}>
        <View style={styles.settingsHeader}>
          <TouchableOpacity onPress={handleCloseSettings}>
            <Text style={styles.settingsCloseButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.settingsTitle}>Scorecard Settings</Text>
          <View style={styles.settingsHeaderSpacer} />
        </View>
        
        <ScrollView style={styles.settingsContent}>
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Display Options</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Score Summary</Text>
                <Text style={styles.settingDescription}>Show running total and score to par</Text>
              </View>
              <Switch
                value={settings.scorecard?.showScoreSummary !== false}
                onValueChange={(value) => {
                  updateSettings({
                    scorecard: { ...settings.scorecard, showScoreSummary: value }
                  });
                }}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.scorecard?.showScoreSummary !== false ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Hole Distance</Text>
                <Text style={styles.settingDescription}>Show distance to pin on each hole</Text>
              </View>
              <Switch
                value={settings.scorecard?.showHoleDistance !== false}
                onValueChange={(value) => {
                  updateSettings({
                    scorecard: { ...settings.scorecard, showHoleDistance: value }
                  });
                }}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.scorecard?.showHoleDistance !== false ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Handicap Index</Text>
                <Text style={styles.settingDescription}>Show hole difficulty rating</Text>
              </View>
              <Switch
                value={settings.scorecard?.showHandicapIndex !== false}
                onValueChange={(value) => {
                  updateSettings({
                    scorecard: { ...settings.scorecard, showHandicapIndex: value }
                  });
                }}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.scorecard?.showHandicapIndex !== false ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Quick Score Buttons</Text>
                <Text style={styles.settingDescription}>Show birdie/par/bogey buttons</Text>
              </View>
              <Switch
                value={settings.scorecard?.showQuickScoreButtons !== false}
                onValueChange={(value) => {
                  updateSettings({
                    scorecard: { ...settings.scorecard, showQuickScoreButtons: value }
                  });
                }}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.scorecard?.showQuickScoreButtons !== false ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Track Putts</Text>
                <Text style={styles.settingDescription}>Show putt entry on scorecard</Text>
              </View>
              <Switch
                value={settings.showPutts}
                onValueChange={(value) => {
                  updateSettings({ showPutts: value });
                }}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.showPutts ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Hole Progress Bar</Text>
                <Text style={styles.settingDescription}>Show completed holes at bottom</Text>
              </View>
              <Switch
                value={settings.scorecard?.showHoleProgress !== false}
                onValueChange={(value) => {
                  updateSettings({
                    scorecard: { ...settings.scorecard, showHoleProgress: value }
                  });
                }}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.scorecard?.showHoleProgress !== false ? '#2E7D32' : '#F5F5F5'}
              />
            </View>
          </View>
          
          {/* Round Actions Section */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Round Actions</Text>
            
            <TouchableOpacity 
              style={styles.endRoundButton}
              onPress={handleEndRound}
            >
              <Text style={styles.endRoundButtonText}>End Round Early</Text>
              <Text style={styles.endRoundButtonSubtext}>Finish and save your current progress</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

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
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={handleSettings}
        >
          <Text style={styles.settingsText}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Score Summary */}
      {settings.scorecard?.showScoreSummary !== false && (
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
      )}

      {/* Current Hole */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
            <View style={styles.holeMainInfo}>
              <Text style={styles.holeNumber}>Hole {currentHole}</Text>
              <Text style={styles.holePar}>Par {currentHoleData.par}</Text>
            </View>
            <View style={styles.holeDetailsInfo}>
              {settings.scorecard?.showHoleDistance !== false && currentHoleData.yardage && (
                <Text style={styles.holeDistance}>
                  {settings.measurementSystem === 'metric' 
                    ? `${Math.round(currentHoleData.yardage * 0.9144)}m` 
                    : `${currentHoleData.yardage}yds`}
                </Text>
              )}
              {settings.scorecard?.showHandicapIndex !== false && currentHoleData.handicapIndex && (
                <Text style={styles.holeHandicap}>HCP {currentHoleData.handicapIndex}</Text>
              )}
            </View>
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
        {settings.scorecard?.showQuickScoreButtons !== false && (
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
        )}

        {/* Putts Entry */}
        {settings.showPutts && (
          <View style={styles.puttsSection}>
            <Text style={styles.puttsLabel}>Putts</Text>
            <View style={styles.puttsControls}>
              <TouchableOpacity 
                style={[
                  styles.puttsButton, 
                  currentPutts <= 0 && styles.puttsButtonDisabled
                ]}
                onPress={() => currentPutts > 0 && updatePutts(currentHole, currentPutts - 1)}
                disabled={currentPutts <= 0}
                activeOpacity={currentPutts <= 0 ? 1 : 0.7}
              >
                <Text style={[
                  styles.puttsButtonText,
                  currentPutts <= 0 && styles.puttsButtonTextDisabled
                ]}>−</Text>
              </TouchableOpacity>
              
              <View style={styles.puttsDisplay}>
                <Text style={styles.puttsValue}>{currentPutts || '0'}</Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.puttsButton, 
                  currentPutts >= 10 && styles.puttsButtonDisabled
                ]}
                onPress={() => currentPutts < 10 && updatePutts(currentHole, currentPutts + 1)}
                disabled={currentPutts >= 10}
                activeOpacity={currentPutts >= 10 ? 1 : 0.7}
              >
                <Text style={[
                  styles.puttsButtonText,
                  currentPutts >= 10 && styles.puttsButtonTextDisabled
                ]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        </View>
      </ScrollView>

      {/* Hole Progress */}
      {settings.scorecard?.showHoleProgress !== false && (
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
                  <View style={styles.progressScoreContainer}>
                    <Text style={styles.progressHoleScore}>{scores[hole.holeNumber]}</Text>
                    {settings.showPutts && putts[hole.holeNumber] > 0 && (
                      <Text style={styles.progressHolePutts}>{putts[hole.holeNumber]}p</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Finish Round Button - Only show for front 9, back 9, or full round complete */}
      {canFinishRound && (
        <View style={styles.finishRoundContainer}>
          <TouchableOpacity 
            style={[
              styles.finishRoundButton,
              !isRoundComplete && styles.finishRoundButtonIncomplete
            ]}
            onPress={handleFinishRound}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.finishRoundButtonText,
              !isRoundComplete && styles.finishRoundButtonTextIncomplete
            ]}>
              {isRoundComplete ? 'Finish Full Round' : 
               front9Complete && !back9Complete ? 'Finish Front 9' :
               back9Complete && !front9Complete ? 'Finish Back 9' :
               'Finish Round'}
            </Text>
            <Text style={styles.finishRoundSubtext}>
              Score: {totalScore} ({scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar}) • {holesCompleted} holes
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Saving Round Overlay */}
      {isSavingRound && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingContainer}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.savingText}>Saving Round</Text>
            <Text style={styles.savingSubtext}>Please wait while we save your round...</Text>
          </View>
        </View>
      )}
      
      {/* Settings Modal */}
      {renderSettingsModal()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flex: 1,
  },
  backText: {
    color: 'white',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    flex: 2,
    textAlign: 'center',
  },
  settingsButton: {
    flex: 1,
    alignItems: 'flex-end',
  },
  settingsText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
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
  
  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  
  // Current Hole
  currentHole: {
    padding: 20,
    minHeight: 600, // Ensure enough space for content
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
  holeMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  holeDetailsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
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
  holeDistance: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  holeHandicap: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
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
  
  // Putts Section
  puttsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  puttsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  puttsControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  puttsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  puttsButtonDisabled: {
    backgroundColor: '#f8f8f8',
  },
  puttsButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  puttsButtonTextDisabled: {
    color: '#ccc',
  },
  puttsDisplay: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  puttsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  progressScoreContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  progressHoleScore: {
    fontSize: 10,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  progressHolePutts: {
    fontSize: 8,
    color: '#666',
    marginTop: 1,
  },
  
  // Finish Round Button
  finishRoundContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  finishRoundButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  finishRoundButtonIncomplete: {
    backgroundColor: '#ff9800',
  },
  finishRoundButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  finishRoundButtonTextIncomplete: {
    fontSize: 16,
  },
  finishRoundSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  
  // Saving Overlay
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  savingContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  savingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  savingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // Settings Modal
  settingsModal: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingsCloseButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  settingsHeaderSpacer: {
    width: 24,
  },
  settingsContent: {
    flex: 1,
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    paddingVertical: 8,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  endRoundButton: {
    margin: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    alignItems: 'center',
  },
  endRoundButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 4,
  },
  endRoundButtonSubtext: {
    fontSize: 12,
    color: '#F44336',
    textAlign: 'center',
  },
});

export default ScorecardScreen;