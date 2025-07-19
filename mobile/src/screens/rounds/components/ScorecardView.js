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
import shotTrackingService from '../../../services/shotTrackingService';
import SmartClubSelector from '../../../components/SmartClubSelector';
import clubService from '../../../services/clubService';
import gamePersistenceService from '../../../services/gamePersistenceService';

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
  // CLUB_OPTIONS removed - using clubService now
  navigation,
  isSavingRound,
  setIsSavingRound,
  token,
  // showClubModal and setShowClubModal removed - using SmartClubSelector now
  expandedCategories,
  setExpandedCategories,
}) => {
  const [scoreAnimation] = useState(new Animated.Value(1));
  const [showSmartClubSelector, setShowSmartClubSelector] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [statisticsCardExpanded, setStatisticsCardExpanded] = useState(true);
  const [selectingForShot, setSelectingForShot] = useState(null);
  const [showClubReminders, setShowClubReminders] = useState(settings?.scorecard?.showClubReminders ?? true);
  const [clubTrackingDisabledForRound, setClubTrackingDisabledForRound] = useState(false);
  const [animationTimeouts, setAnimationTimeouts] = useState([]);
  
  // Get GPS tracking setting from settings context
  const isShotTrackingEnabled = settings?.shotTracking?.enabled ?? true;

  // Cleanup timeouts on unmount
  useEffect(() => {
    console.log('[ScorecardView] Component mounting');
    
    return () => {
      console.log('[ScorecardView] Component unmounting - cleaning up timeouts');
      console.log('[ScorecardView] Modal states on unmount:', {
        showSmartClubSelector,
        selectingForShot,
        animationTimeouts: animationTimeouts.length
      });
      animationTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [animationTimeouts]);

  // Initialize shot tracking service and club service
  useEffect(() => {
    const initializeServices = async () => {
      if (round?.id) {
        try {
          await shotTrackingService.initialize(round.id, course?.id);
          await clubService.initialize();
          console.log('Shot tracking and club services initialized for round:', round.id);
        } catch (error) {
          console.error('Error initializing services:', error);
        }
      }
    };

    initializeServices();
  }, [round?.id, course?.id]);

  // Update selected club when hole changes
  useEffect(() => {
    const currentShot = scores[currentHole] || 0;
    const clubId = clubs[`${currentHole}-${currentShot}`];
    if (clubId) {
      const club = clubService.getClub(clubId);
      setSelectedClub(club);
    } else {
      setSelectedClub(null);
    }
  }, [currentHole, clubs, scores]);

  // Calculate totals
  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  const totalPar = holes.reduce((sum, hole) => sum + (hole.par || 4), 0);
  
  // Calculate par for only played holes
  const playedHolesPar = Object.keys(scores)
    .filter(holeNum => scores[holeNum] > 0)
    .reduce((sum, holeNum) => {
      const hole = holes.find(h => h.holeNumber === parseInt(holeNum));
      return sum + (hole?.par || 4);
    }, 0);
  
  const scoreToPar = totalScore - playedHolesPar;

  // Get current hole data
  const currentHoleData = holes.find(hole => hole.holeNumber === currentHole) || holes[0];
  const currentHoleScore = scores[currentHole] || 0;
  const currentHolePutts = putts[currentHole] || 0;
  const currentHoleClub = clubs[currentHole] || null;

  // Historical data for current hole
  const currentHoleHistorical = historicalData?.[currentHole] || null;

  // Handle score change
  const handleScoreChange = async (holeNumber, change) => {
    const currentScore = scores[holeNumber] || 0;
    const currentPutts = putts[holeNumber] || 0;
    const newScore = Math.max(0, Math.min(15, currentScore + change));
    
    // When incrementing score (adding a shot)
    if (change > 0 && showClubReminders && !clubTrackingDisabledForRound) {
      // Check if we should auto-open club selector
      const currentShotClub = clubs[`${holeNumber}-${newScore}`] || null;
      
      // Auto-open club selector if no club selected for this shot yet
      if (!currentShotClub) {
        // Automatically open club selector for this shot
        const timeout = setTimeout(() => {
          setShowSmartClubSelector(true);
          setSelectingForShot(newScore);
        }, 300); // Small delay to let score animation complete
        
        setAnimationTimeouts(prev => [...prev, timeout]);
      }
    }
    
    // When decrementing score, check if we need to adjust putts
    if (change < 0 && currentScore > 0) {
      // If the current score equals the number of putts, we're removing a putt
      if (currentPutts > 0 && currentScore <= currentPutts) {
        // Decrement putts instead of just score
        setPutts(prev => ({
          ...prev,
          [holeNumber]: Math.max(0, currentPutts - 1)
        }));
      }
    }
    
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

    // Log shot with GPS if score increased (shot was taken)
    if (isShotTrackingEnabled && change > 0 && newScore > 0) {
      try {
        const shotNumber = newScore; // Shot number equals the score
        const clubId = clubs[`${holeNumber}-${shotNumber}`] || null;
        
        await shotTrackingService.logShot(
          holeNumber,
          shotNumber,
          newScore,
          clubId
        );
        
        console.log(`Shot tracked: Hole ${holeNumber}, Shot ${shotNumber}`);
      } catch (error) {
        console.error('Failed to track shot:', error);
        // Don't show error to user - shot tracking is optional
      }
    }
  };

  // Handle putts change - putts are part of the score
  const handlePuttsChange = async (holeNumber, change) => {
    const currentPutts = putts[holeNumber] || 0;
    const currentScore = scores[holeNumber] || 0;
    
    // Calculate new putts value
    const newPutts = currentPutts + change;
    
    // Validation
    if (newPutts < 0 || newPutts > 10) {
      return; // Don't allow negative putts or more than 10
    }
    
    if (change > 0) {
      // Adding a putt - always increment score
      // Update putts first
      setPutts(prev => ({
        ...prev,
        [holeNumber]: newPutts
      }));
      
      // Auto-select putter for putts
      const allClubs = clubService.getAllClubs();
      const putterClub = allClubs.find(club => club.clubType === 'putter');
      if (putterClub) {
        const newScore = (currentScore || 0) + 1;
        setClubs(prev => ({
          ...prev,
          [`${holeNumber}-${newScore}`]: putterClub.id
        }));
      }
      
      // Then increment score WITHOUT triggering club reminder
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

      const newScore = (currentScore || 0) + 1;
      setScores(prev => ({
        ...prev,
        [holeNumber]: newScore
      }));
      
      // Handle GPS tracking directly for putts
      if (isShotTrackingEnabled) {
        try {
          const clubId = putterClub?.id || null;
          
          await shotTrackingService.logShot(
            holeNumber,
            newScore,
            newScore,
            clubId
          );
          
          console.log(`Putt tracked: Hole ${holeNumber}, Shot ${newScore}`);
        } catch (error) {
          console.error('Failed to track putt:', error);
        }
      }
    } else if (change < 0) {
      // Removing a putt
      if (currentPutts <= 0) {
        return; // Can't remove putts if there are none
      }
      
      // Update putts first
      setPutts(prev => ({
        ...prev,
        [holeNumber]: newPutts
      }));
      
      // Decrement score only if score > 0
      if (currentScore > 0) {
        await handleScoreChange(holeNumber, -1);
      }
    }
  };

  // Handle club selection with smart selector
  const handleClubSelection = async (clubId) => {
    const shotNumber = selectingForShot || (scores[currentHole] || 0);
    
    setClubs(prev => ({
      ...prev,
      [`${currentHole}-${shotNumber}`]: clubId
    }));
    
    // Update selected club display
    const club = clubService.getClub(clubId);
    setSelectedClub(club);
    
    setShowSmartClubSelector(false);
    setSelectingForShot(null);
  };

  // Handle navigation between holes
  const navigateToHole = (holeNumber) => {
    if (holeNumber >= 1 && holeNumber <= 18) {
      setCurrentHole(holeNumber);
    }
  };

  // Handle finish round
  const handleFinishRound = () => {
    // Close any open modals first
    setShowSmartClubSelector(false);
    
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
      // Check if there's an active game to complete
      if (round?.id) {
        const gameData = await gamePersistenceService.loadGameData(round.id);
        if (gameData && gameData.gameResults) {
          // Complete the game and move to history
          await gamePersistenceService.completeGame(round.id, gameData.gameResults);
          console.log('✅ Game completed and moved to history');
        }
      }
      
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
  
  // Calculate last 2 holes scores with detailed info
  const lastTwoHoles = [];
  if (currentHole > 1 && scores[currentHole - 1]) {
    const holeData = holes.find(h => h.holeNumber === currentHole - 1);
    const score = scores[currentHole - 1];
    const par = holeData?.par || 4;
    const diff = score - par;
    lastTwoHoles.push({ 
      hole: currentHole - 1, 
      score, 
      par,
      diff,
      label: diff === 0 ? 'Par' : diff > 0 ? `+${diff}` : `${diff}`
    });
  }
  if (currentHole > 2 && scores[currentHole - 2]) {
    const holeData = holes.find(h => h.holeNumber === currentHole - 2);
    const score = scores[currentHole - 2];
    const par = holeData?.par || 4;
    const diff = score - par;
    lastTwoHoles.push({ 
      hole: currentHole - 2, 
      score, 
      par,
      diff,
      label: diff === 0 ? 'Par' : diff > 0 ? `+${diff}` : `${diff}`
    });
  }
  
  // Calculate total shots played
  const totalShotsPlayed = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  const holesPlayed = Object.keys(scores).filter(hole => scores[hole] > 0).length;

  return (
    <View style={styles.container}>
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

          {/* Combined Score and Putts Entry */}
          <View style={styles.scorePuttsCard}>
            {/* GPS Tracking Notification */}
            {isShotTrackingEnabled && (
              <View style={styles.gpsNotification}>
                <Text style={styles.gpsNotificationText}>📍 GPS Shot Tracking</Text>
              </View>
            )}
            
            {/* Score Section */}
            <View style={styles.scoreSection}>
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
                  {currentHolePutts > 0 && currentHoleScore > 0 && (
                    <Text style={styles.scoreBreakdown}>
                      {currentHoleScore - currentHolePutts}+{currentHolePutts}
                    </Text>
                  )}
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
            
            {/* Divider */}
            <View style={styles.divider} />
            
            {/* Putts Section */}
            <View style={styles.puttsSection}>
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
      
      {/* Bottom Score Summary */}
      {settings.scorecard?.showScoreSummary !== false && (
        <View style={styles.bottomSummary}>
          {/* Last 2 Holes */}
          {lastTwoHoles.length > 0 && (
            <View style={styles.recentHolesContainer}>
              {lastTwoHoles.map((hole) => (
                <View key={hole.hole} style={styles.recentHoleCard}>
                  <Text style={styles.recentHoleNumber}>Hole {hole.hole}</Text>
                  <View style={styles.recentHoleInfo}>
                    <Text style={styles.recentHoleScore}>{hole.score}</Text>
                    <Text style={[
                      styles.recentHoleDiff,
                      hole.diff < 0 ? styles.underPar : hole.diff > 0 ? styles.overPar : styles.evenPar
                    ]}>
                      {hole.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* Summary Stats */}
          <View style={styles.summaryStats}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shots</Text>
              <Text style={styles.summaryValue}>{totalShotsPlayed}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Holes</Text>
              <Text style={styles.summaryValue}>{holesPlayed}/18</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Score</Text>
              <Text style={[
                styles.summaryValue,
                styles.summaryScore,
                scoreToPar < 0 ? styles.underPar : scoreToPar > 0 ? styles.overPar : styles.evenPar
              ]}>
                {scoreToPar === 0 ? 'E' : scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Smart Club Selection Modal */}
      <SmartClubSelector
        visible={showSmartClubSelector}
        onClose={() => setShowSmartClubSelector(false)}
        onClubSelect={handleClubSelection}
        onDisableForRound={() => setClubTrackingDisabledForRound(true)}
        holeNumber={currentHole}
        shotNumber={selectingForShot}
        courseId={course?.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gpsNotification: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  gpsNotificationText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '500',
  },
  bottomSummary: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentHolesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  recentHoleCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recentHoleNumber: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  recentHoleInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  recentHoleScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recentHoleDiff: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 20,
  },
  summaryRow: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryScore: {
    fontSize: 24,
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
  scorePuttsCard: {
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
  scoreSection: {
    paddingBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: -20,
    marginVertical: 0,
  },
  puttsSection: {
    paddingTop: 15,
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
  scoreBreakdown: {
    fontSize: 11,
    color: '#666',
    marginTop: -4,
    fontWeight: '500',
  },
  puttsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  puttsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puttsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  puttsButtonDisabled: {
    backgroundColor: '#ccc',
  },
  puttsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  puttsButtonTextDisabled: {
    color: '#999',
  },
  puttsDisplay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  puttsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  clubSelection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  smartClubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clubButtonContent: {
    flex: 1,
  },
  clubButtonLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  clubButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  clubButtonArrow: {
    fontSize: 20,
    marginLeft: 12,
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
  // Old modal styles removed - using SmartClubSelector now
  // modalCloseButton styles removed - using SmartClubSelector now
});

export default ScorecardView;