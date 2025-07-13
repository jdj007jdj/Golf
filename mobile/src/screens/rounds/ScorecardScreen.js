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
    
    const oldPutts = putts[holeNumber] || 0;
    const currentScore = scores[holeNumber] || 0;
    const puttsDifference = newPutts - oldPutts;
    
    // Update putts state
    setPutts(prev => ({ ...prev, [holeNumber]: newPutts }));
    
    // Auto-increment score when putts are added
    if (puttsDifference !== 0) {
      const newScore = Math.max(0, currentScore + puttsDifference);
      setScores(prev => ({ ...prev, [holeNumber]: newScore }));
      
      // Save to backend with new total score
      if (newScore > 0) {
        await saveScoreToBackend(holeNumber, newScore, newPutts);
      }
    } else if (currentScore > 0) {
      // Just update putts if score already exists and putts didn't change count
      await saveScoreToBackend(holeNumber, currentScore, newPutts);
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
  
  // Check if any holes have been played in each 9
  const front9HasScores = holes.slice(0, 9).some(hole => scores[hole.holeNumber] > 0);
  const back9HasScores = holes.slice(9, 18).some(hole => scores[hole.holeNumber] > 0);
  
  // Determine if we can finish and what type of finish is available
  const canFinishFront9 = front9Complete && !back9HasScores; // Only if no back 9 scores entered
  const canFinishBack9 = back9Complete && !front9HasScores; // Only if no front 9 scores entered
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
    } else if (canFinishFront9) {
      roundType = 'Front 9';
    } else if (canFinishBack9) {
      roundType = 'Back 9';
    } else {
      roundType = 'Partial Round';
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

  // ENHANCEMENT: Dynamic Quick Score Buttons (EASILY REVERTIBLE)
  // This function creates smarter quick entry buttons based on hole par
  const getEnhancedQuickScores = (hole) => {
    const par = hole.par;
    let scores = [];
    
    if (par === 3) {
      // Par 3: Show Hole-in-one, Eagle, Birdie, Par, Bogey, Double
      scores = [1, par - 2, par - 1, par, par + 1, par + 2];
    } else if (par === 4) {
      // Par 4: Show Eagle, Birdie, Par, Bogey, Double, Triple
      scores = [par - 2, par - 1, par, par + 1, par + 2, par + 3];
    } else if (par === 5) {
      // Par 5: Show Eagle, Birdie, Par, Bogey, Double, Triple
      scores = [par - 2, par - 1, par, par + 1, par + 2, par + 3];
    } else {
      // Fallback to original logic
      scores = [par - 1, par, par + 1, par + 2];
    }
    
    // Remove duplicates and sort to ensure unique keys
    const uniqueScores = [...new Set(scores)].sort((a, b) => a - b);
    return uniqueScores.filter(score => score >= 1 && score <= 15);
  };

  // Enhanced label function for better score names
  const getScoreLabel = (score, par) => {
    const diff = score - par;
    if (score === 1) return 'Ace';
    if (diff <= -3) return 'Albatross';
    if (diff === -2) return 'Eagle';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double';
    if (diff === 3) return 'Triple';
    return `+${diff}`;
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
            <View style={styles.scoreLabelContainer}>
              <Text style={styles.scoreLabel}>Your Score</Text>
              {settings.showPutts && currentScore > 0 && currentPutts > 0 && (
                <Text style={styles.puttsBreakdown}>
                  {currentScore} of which {currentPutts} putt{currentPutts !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
            {currentScore > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  updateScore(currentHole, 0);
                  setPutts(prev => ({ ...prev, [currentHole]: 0 }));
                }}
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

          {/* Putts Controls - integrated within Your Score section */}
          {settings.showPutts && (
            <View style={styles.puttsControlsIntegrated}>
              <Text style={styles.puttsLabelIntegrated}>Putts</Text>
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

        {/* Score Limit Warning */}
        {(currentScore >= 15 || currentScore <= 0) && (
          <View style={styles.limitWarning}>
            <Text style={styles.limitWarningText}>
              {currentScore >= 15 ? 'Maximum score: 15 strokes' : 
               currentScore <= 0 ? 'Minimum score: 1 stroke' : ''}
            </Text>
          </View>
        )}


        {/* Quick Score Buttons - ENHANCED */}
        {settings.scorecard?.showQuickScoreButtons !== false && (
          <View style={styles.quickScores}>
            <Text style={styles.quickScoreLabel}>Quick Entry</Text>
            <View style={styles.quickScoreButtons}>
              {getEnhancedQuickScores(currentHoleData).map((score) => (
                <TouchableOpacity
                  key={score}
                  style={[
                    styles.quickButton,
                    currentScore === score && styles.quickButtonSelected,
                    // Enhanced styling for special scores
                    score === 1 && styles.quickButtonAce,
                    score - currentHoleData.par <= -2 && score !== 1 && styles.quickButtonEagle,
                  ]}
                  onPress={() => updateScore(currentHole, score)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.quickButtonText,
                    currentScore === score && styles.quickButtonTextSelected,
                    // Enhanced text styling for special scores
                    score === 1 && styles.quickButtonTextAce,
                    score - currentHoleData.par <= -2 && score !== 1 && styles.quickButtonTextEagle,
                  ]}>
                    {score}
                  </Text>
                  <Text style={[
                    styles.quickButtonLabel,
                    currentScore === score && styles.quickButtonLabelSelected,
                    score === 1 && styles.quickButtonLabelAce,
                    score - currentHoleData.par <= -2 && score !== 1 && styles.quickButtonLabelEagle,
                  ]}>
                    {getScoreLabel(score, currentHoleData.par)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Enhanced info for special holes */}
            {currentHoleData.par === 3 && (
              <Text style={styles.quickScoreHint}>Par 3: Ace opportunity!</Text>
            )}
            {currentHoleData.par === 5 && (
              <Text style={styles.quickScoreHint}>Par 5: Eagle chance!</Text>
            )}
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
            {holes.map((hole) => {
              const holeScore = scores[hole.holeNumber] || 0;
              const scoreToPar = holeScore - hole.par;
              
              // Determine color style based on score vs par
              let scoreColorStyle = null;
              if (holeScore > 0) {
                if (scoreToPar < 0) {
                  scoreColorStyle = styles.progressRectUnderPar;
                } else if (scoreToPar > 0) {
                  scoreColorStyle = styles.progressRectOverPar;
                } else {
                  scoreColorStyle = styles.progressRectEvenPar;
                }
              }

              return (
                <TouchableOpacity
                  key={hole.holeNumber}
                  style={[
                    styles.progressRect,
                    scores[hole.holeNumber] > 0 && styles.progressRectCompleted,
                    scoreColorStyle,
                    // Only apply current style if hole has no score, otherwise keep score-based color
                    hole.holeNumber === currentHole && scores[hole.holeNumber] === 0 && styles.progressRectCurrent
                  ]}
                  onPress={() => setCurrentHole(hole.holeNumber)}
                >
                  {/* Hole header with number and par */}
                  <View style={styles.progressRectHeader}>
                    <Text style={[
                      styles.progressRectNumber,
                      hole.holeNumber === currentHole && scores[hole.holeNumber] === 0 && styles.progressRectNumberCurrent
                    ]}>
                      {hole.holeNumber}
                    </Text>
                    <Text style={[
                      styles.progressRectPar,
                      hole.holeNumber === currentHole && scores[hole.holeNumber] === 0 && styles.progressRectParCurrent
                    ]}>
                      Par {hole.par}
                    </Text>
                  </View>

                  {/* Score and putts info */}
                  {holeScore > 0 ? (
                    <View style={styles.progressRectScoreInfo}>
                      <Text style={[
                        styles.progressRectScore
                        // No white text override for scores since they should remain visible
                      ]}>
                        {holeScore}
                      </Text>
                      {settings.showPutts && putts[hole.holeNumber] > 0 && (
                        <Text style={[
                          styles.progressRectPutts
                          // No white text override for putts since they should remain visible
                        ]}>
                          {putts[hole.holeNumber]}p
                        </Text>
                      )}
                      {/* Score to par indicator */}
                      <Text style={[
                        styles.progressRectToPar,
                        scoreToPar < 0 && styles.progressRectToParUnder,
                        scoreToPar > 0 && styles.progressRectToParOver,
                        scoreToPar === 0 && styles.progressRectToParEven
                        // No white text override for score-to-par since background is score-based colored
                      ]}>
                        {scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.progressRectEmpty}>
                      <Text style={[
                        styles.progressRectEmptyText,
                        hole.holeNumber === currentHole && scores[hole.holeNumber] === 0 && styles.progressRectEmptyTextCurrent
                      ]}>
                        —
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
               canFinishFront9 ? 'Finish Front 9' :
               canFinishBack9 ? 'Finish Back 9' :
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
  scoreLabelContainer: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  puttsBreakdown: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
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
  // ENHANCED QUICK BUTTON STYLES (EASILY REVERTIBLE)
  quickButtonAce: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
    borderWidth: 2,
  },
  quickButtonTextAce: {
    color: '#f57c00',
    fontWeight: '900',
  },
  quickButtonLabelAce: {
    color: '#f57c00',
    fontWeight: 'bold',
  },
  quickButtonEagle: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1.5,
  },
  quickButtonTextEagle: {
    color: '#1976d2',
    fontWeight: '800',
  },
  quickButtonLabelEagle: {
    color: '#1976d2',
    fontWeight: '600',
  },
  quickScoreHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Putts Section
  puttsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  // Integrated Putts Controls (within Your Score section)
  puttsControlsIntegrated: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  puttsLabelIntegrated: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
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
  // Rectangular Progress Holes
  progressRect: {
    width: 80,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  progressRectCurrent: {
    backgroundColor: '#2e7d32',
    borderColor: '#1b5e20',
    borderWidth: 2,
  },
  progressRectCompleted: {
    borderWidth: 1.5,
  },
  progressRectUnderPar: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  progressRectEvenPar: {
    backgroundColor: '#f0f0f0',
    borderColor: '#999',
  },
  progressRectOverPar: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  // Rectangle Header (Hole number and Par)
  progressRectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressRectNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressRectNumberCurrent: {
    color: 'white',
  },
  progressRectPar: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  progressRectParCurrent: {
    color: 'rgba(255,255,255,0.8)',
  },
  // Rectangle Score Info
  progressRectScoreInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  progressRectScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  progressRectScoreCurrent: {
    color: 'white',
  },
  progressRectPutts: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  progressRectPuttsCurrent: {
    color: 'rgba(255,255,255,0.7)',
  },
  progressRectToPar: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressRectToParUnder: {
    color: '#4caf50',
  },
  progressRectToParEven: {
    color: '#666',
  },
  progressRectToParOver: {
    color: '#f44336',
  },
  progressRectToParCurrent: {
    color: 'white',
  },
  // Empty Rectangle (no score yet)
  progressRectEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  progressRectEmptyText: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: 'bold',
  },
  progressRectEmptyTextCurrent: {
    color: 'rgba(255,255,255,0.6)',
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