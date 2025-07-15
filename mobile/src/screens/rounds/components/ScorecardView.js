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
  Modal,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectAchievements, getClubInsightsForScorecard } from '../../../utils/coursePerformanceUtils';
import AchievementPopup from '../../../components/AchievementPopup';

const { width } = Dimensions.get('window');

const ScorecardView = ({ 
  round, 
  course, 
  holes, 
  scores, 
  setScores, 
  putts, 
  setPutts, 
  clubs, 
  setClubs,
  currentHole, 
  setCurrentHole,
  historicalData,
  clubData,
  settings,
  updateSettings,
  CLUB_OPTIONS,
  navigation,
  isSavingRound,
  setIsSavingRound,
  token,
  showClubModal,
  setShowClubModal,
  expandedCategories,
  setExpandedCategories,
  showSettings,
  setShowSettings,
  showAchievements,
  setShowAchievements,
  currentAchievements,
  setCurrentAchievements,
  courseStats,
}) => {
  const [scoreAnimation] = useState(new Animated.Value(1));
  const [statisticsCardExpanded, setStatisticsCardExpanded] = useState(true);

  // Calculate totals
  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  const totalPar = holes.reduce((sum, hole) => sum + (hole.par || 4), 0);
  const scoreToPar = totalScore - totalPar;

  // Get current hole data
  const currentHoleData = holes.find(hole => hole.holeNumber === currentHole) || holes[0];
  const currentHoleScore = scores[currentHole] || 0;
  const currentHolePutts = putts[currentHole] || 0;
  const currentHoleClub = clubs[currentHole] || null;

  // Historical data for current hole
  const currentHoleHistorical = historicalData?.[currentHole] || null;

  // Handle score change
  const handleScoreChange = (holeNumber, change) => {
    const newScore = Math.max(0, Math.min(15, (scores[holeNumber] || 0) + change));
    
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

    // Check for achievements after score change
    if (settings.scorecard?.showAchievements !== false && newScore > 0 && historicalData) {
      const achievements = detectAchievements({
        holeNumber,
        score: newScore,
        par: holes.find(h => h.holeNumber === holeNumber)?.par || 4,
        historicalData: historicalData[holeNumber],
        clubUsed: null, // We'll add club tracking in Step 2.2.3
        currentRound: { scores: { ...scores, [holeNumber]: newScore }, putts, clubs },
        settings
      });

      if (achievements.length > 0) {
        setCurrentAchievements(achievements);
        setShowAchievements(true);
      }
    }
  };

  // Handle putts change
  const handlePuttsChange = (holeNumber, change) => {
    const newPutts = Math.max(0, Math.min(10, (putts[holeNumber] || 0) + change));
    setPutts(prev => ({
      ...prev,
      [holeNumber]: newPutts
    }));
  };

  // Handle club selection
  const handleClubSelection = (holeNumber, clubId) => {
    setClubs(prev => ({
      ...prev,
      [holeNumber]: clubId
    }));
    setShowClubModal(false);
  };

  // Handle navigation between holes
  const navigateToHole = (holeNumber) => {
    if (holeNumber >= 1 && holeNumber <= 18) {
      setCurrentHole(holeNumber);
    }
  };

  // Handle finish round
  const handleFinishRound = () => {
    Alert.alert(
      'Finish Round',
      'Are you sure you want to finish this round?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Finish', onPress: finishRound }
      ]
    );
  };

  const finishRound = async () => {
    setIsSavingRound(true);
    try {
      // Navigate to round summary
      navigation.navigate('RoundSummary', {
        round: {
          ...round,
          scores,
          putts,
          clubs,
          completedAt: new Date().toISOString(),
        },
        course,
      });
    } catch (error) {
      console.error('Error finishing round:', error);
      Alert.alert('Error', 'Failed to finish round. Please try again.');
    } finally {
      setIsSavingRound(false);
    }
  };

  // Check if we should show finish button
  const playedHoles = Object.keys(scores).filter(hole => scores[hole] > 0);
  const shouldShowFinishButton = playedHoles.length >= 9; // Allow finishing after 9 holes

  return (
    <View style={styles.container}>
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

      {/* Main Scorecard Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.currentHole}>
          {/* Hole Navigation */}
          <View style={styles.holeNavigation}>
            <TouchableOpacity
              style={[styles.navButton, currentHole === 1 && styles.navButtonDisabled]}
              onPress={() => navigateToHole(currentHole - 1)}
              disabled={currentHole === 1}
            >
              <Text style={[styles.navButtonText, currentHole === 1 && styles.navButtonTextDisabled]}>
                ◀
              </Text>
            </TouchableOpacity>
            
            <View style={styles.holeInfo}>
              <Text style={styles.holeNumber}>Hole {currentHole}</Text>
              <Text style={styles.holeDetails}>
                Par {currentHoleData.par} • {currentHoleData.yardage || 'N/A'}y
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.navButton, currentHole === 18 && styles.navButtonDisabled]}
              onPress={() => navigateToHole(currentHole + 1)}
              disabled={currentHole === 18}
            >
              <Text style={[styles.navButtonText, currentHole === 18 && styles.navButtonTextDisabled]}>
                ▶
              </Text>
            </TouchableOpacity>
          </View>

          {/* Score Entry */}
          <View style={styles.scoreEntry}>
            <Text style={styles.scoreLabel}>Score</Text>
            <View style={styles.scoreControls}>
              <TouchableOpacity
                style={[styles.scoreButton, currentHoleScore <= 0 && styles.scoreButtonDisabled]}
                onPress={() => handleScoreChange(currentHole, -1)}
                disabled={currentHoleScore <= 0}
              >
                <Text style={[styles.scoreButtonText, currentHoleScore <= 0 && styles.scoreButtonTextDisabled]}>
                  -
                </Text>
              </TouchableOpacity>
              
              <Animated.View style={[styles.scoreDisplay, { transform: [{ scale: scoreAnimation }] }]}>
                <Text style={styles.scoreValue}>{currentHoleScore}</Text>
              </Animated.View>
              
              <TouchableOpacity
                style={[styles.scoreButton, currentHoleScore >= 15 && styles.scoreButtonDisabled]}
                onPress={() => handleScoreChange(currentHole, 1)}
                disabled={currentHoleScore >= 15}
              >
                <Text style={[styles.scoreButtonText, currentHoleScore >= 15 && styles.scoreButtonTextDisabled]}>
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Putts Entry */}
          <View style={styles.puttsEntry}>
            <Text style={styles.puttsLabel}>Putts</Text>
            <View style={styles.puttsControls}>
              <TouchableOpacity
                style={[styles.puttsButton, currentHolePutts <= 0 && styles.puttsButtonDisabled]}
                onPress={() => handlePuttsChange(currentHole, -1)}
                disabled={currentHolePutts <= 0}
              >
                <Text style={[styles.puttsButtonText, currentHolePutts <= 0 && styles.puttsButtonTextDisabled]}>
                  -
                </Text>
              </TouchableOpacity>
              
              <View style={styles.puttsDisplay}>
                <Text style={styles.puttsValue}>{currentHolePutts}</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.puttsButton, currentHolePutts >= 10 && styles.puttsButtonDisabled]}
                onPress={() => handlePuttsChange(currentHole, 1)}
                disabled={currentHolePutts >= 10}
              >
                <Text style={[styles.puttsButtonText, currentHolePutts >= 10 && styles.puttsButtonTextDisabled]}>
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Club Selection */}
          <View style={styles.clubSelection}>
            <Text style={styles.clubLabel}>Club Used</Text>
            <TouchableOpacity
              style={styles.clubButton}
              onPress={() => setShowClubModal(true)}
            >
              <Text style={styles.clubButtonText}>
                {currentHoleClub ? CLUB_OPTIONS.find(c => c.id === currentHoleClub)?.name : 'Select Club'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Historical Data Display */}
          {currentHoleHistorical && (
            <View style={styles.historicalSection}>
              <Text style={styles.historicalTitle}>Your Performance</Text>
              <View style={styles.historicalGrid}>
                <View style={styles.historicalItem}>
                  <Text style={styles.historicalLabel}>Average</Text>
                  <Text style={styles.historicalValue}>{currentHoleHistorical.averageScore}</Text>
                </View>
                <View style={styles.historicalItem}>
                  <Text style={styles.historicalLabel}>Best</Text>
                  <Text style={styles.historicalValue}>{currentHoleHistorical.bestScore}</Text>
                </View>
                <View style={styles.historicalItem}>
                  <Text style={styles.historicalLabel}>Played</Text>
                  <Text style={styles.historicalValue}>{currentHoleHistorical.timesPlayed}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Statistics Card - Show even without data for testing */}
          <View style={styles.statisticsCard}>
            <TouchableOpacity
              style={styles.statisticsHeader}
              onPress={() => setStatisticsCardExpanded(!statisticsCardExpanded)}
            >
              <Text style={styles.statisticsTitle}>Statistics</Text>
              <Text style={styles.statisticsToggle}>
                {statisticsCardExpanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            
            {statisticsCardExpanded && (
              <View style={styles.statisticsContent}>
                {/* Show data status for debugging */}
                <View style={styles.debugSection}>
                  <Text style={styles.debugText}>
                    Historical Data: {historicalData ? 'Available' : 'None'}
                  </Text>
                  <Text style={styles.debugText}>
                    Club Data: {clubData ? 'Available' : 'None'}
                  </Text>
                </View>

                {/* Club Insights */}
                {clubData && (
                  <View style={styles.clubInsightsSection}>
                    <Text style={styles.clubInsightsTitle}>Club Recommendations</Text>
                    {getClubInsightsForScorecard(clubData, currentHole, holes).map((insight, index) => (
                      <View key={index} style={styles.clubInsightItem}>
                        <Text style={styles.clubInsightClub}>{insight.club}</Text>
                        <Text style={styles.clubInsightText}>{insight.insight}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Show message when no data */}
                {!historicalData && !clubData && (
                  <View style={styles.noDataSection}>
                    <Text style={styles.noDataText}>
                      🎯 Play more rounds to unlock intelligent statistics and club recommendations!
                    </Text>
                    <TouchableOpacity
                      style={styles.testAchievementButton}
                      onPress={() => {
                        // Test achievement system
                        setCurrentAchievements([
                          { type: 'birdie', message: 'Great birdie!', icon: '🐦' },
                          { type: 'par', message: 'Nice par!', icon: '⭐' }
                        ]);
                        setShowAchievements(true);
                      }}
                    >
                      <Text style={styles.testAchievementButtonText}>Test Achievement System</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Finish Round Button */}
          {shouldShowFinishButton && (
            <View style={styles.finishRoundContainer}>
              <TouchableOpacity
                style={styles.finishRoundButton}
                onPress={handleFinishRound}
                disabled={isSavingRound}
              >
                <Text style={styles.finishRoundButtonText}>
                  {isSavingRound ? 'Saving...' : 'Finish Round'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsModalContent}>
            <Text style={styles.settingsModalTitle}>Scorecard Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Achievement Notifications</Text>
              <Switch
                trackColor={{ false: '#F5F5F5', true: '#81C784' }}
                thumbColor={settings.scorecard?.showAchievements !== false ? '#2E7D32' : '#F5F5F5'}
                value={settings.scorecard?.showAchievements !== false}
                onValueChange={(value) => updateSettings({
                  scorecard: { ...settings.scorecard, showAchievements: value }
                })}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Show Score Summary</Text>
              <Switch
                trackColor={{ false: '#F5F5F5', true: '#81C784' }}
                thumbColor={settings.scorecard?.showScoreSummary !== false ? '#2E7D32' : '#F5F5F5'}
                value={settings.scorecard?.showScoreSummary !== false}
                onValueChange={(value) => updateSettings({
                  scorecard: { ...settings.scorecard, showScoreSummary: value }
                })}
              />
            </View>

            <TouchableOpacity
              style={styles.settingsCloseButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.settingsCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Club Selection Modal */}
      <Modal
        visible={showClubModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClubModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Club</Text>
            <ScrollView style={styles.clubList}>
              {CLUB_OPTIONS.map(club => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.clubOption}
                  onPress={() => handleClubSelection(currentHole, club.id)}
                >
                  <Text style={styles.clubOptionText}>{club.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowClubModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Achievement Popup */}
      <AchievementPopup
        visible={showAchievements}
        achievements={currentAchievements}
        onClose={() => {
          setShowAchievements(false);
          setCurrentAchievements([]);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scoreSummary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  underPar: {
    color: '#2e7d32',
  },
  overPar: {
    color: '#d32f2f',
  },
  evenPar: {
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
  },
  currentHole: {
    padding: 20,
  },
  holeNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  holeInfo: {
    alignItems: 'center',
  },
  holeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  holeDetails: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  scoreEntry: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
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
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  scoreButtonDisabled: {
    backgroundColor: '#ccc',
  },
  scoreButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreButtonTextDisabled: {
    color: '#999',
  },
  scoreDisplay: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  puttsEntry: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  puttsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  puttsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puttsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  puttsButtonDisabled: {
    backgroundColor: '#ccc',
  },
  puttsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  puttsButtonTextDisabled: {
    color: '#999',
  },
  puttsDisplay: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  puttsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  clubSelection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clubLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  clubButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clubButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  historicalSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historicalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  historicalGrid: {
    flexDirection: 'row',
  },
  historicalItem: {
    flex: 1,
    alignItems: 'center',
  },
  historicalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  historicalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  finishRoundContainer: {
    marginTop: 20,
  },
  finishRoundButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
  },
  finishRoundButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: width * 0.8,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  clubList: {
    maxHeight: 300,
  },
  clubOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clubOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Statistics Card Styles
  statisticsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statisticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statisticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statisticsToggle: {
    fontSize: 16,
    color: '#666',
  },
  statisticsContent: {
    padding: 15,
  },
  debugSection: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  noDataSection: {
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  testAchievementButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  testAchievementButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clubInsightsSection: {
    marginBottom: 15,
  },
  clubInsightsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  clubInsightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clubInsightClub: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    minWidth: 80,
  },
  clubInsightText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  // Settings Modal Styles
  settingsModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: width * 0.9,
    maxHeight: '80%',
  },
  settingsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingsCloseButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  settingsCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScorecardView;