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
  const [isShotTrackingEnabled, setIsShotTrackingEnabled] = useState(true);

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
    const clubId = clubs[currentHole];
    if (clubId) {
      const club = clubService.getClub(clubId);
      setSelectedClub(club);
    } else {
      setSelectedClub(null);
    }
  }, [currentHole, clubs]);

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
  const handleScoreChange = async (holeNumber, change) => {
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

  // Handle putts change
  const handlePuttsChange = (holeNumber, change) => {
    const newPutts = Math.max(0, Math.min(10, (putts[holeNumber] || 0) + change));
    setPutts(prev => ({
      ...prev,
      [holeNumber]: newPutts
    }));
  };

  // Handle club selection with smart selector
  const handleClubSelection = async (clubId) => {
    setClubs(prev => ({
      ...prev,
      [currentHole]: clubId
    }));
    
    // Update selected club display
    const club = clubService.getClub(clubId);
    setSelectedClub(club);
    
    setShowSmartClubSelector(false);
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
      {/* GPS Tracking Indicator */}
      <View style={styles.gpsTrackingContainer}>
        <View style={styles.gpsTrackingRow}>
          <Text style={styles.gpsTrackingLabel}>GPS Shot Tracking</Text>
          <Switch
            value={isShotTrackingEnabled}
            onValueChange={setIsShotTrackingEnabled}
            trackColor={{ false: '#E0E0E0', true: '#81C784' }}
            thumbColor={isShotTrackingEnabled ? '#2E7D32' : '#f4f3f4'}
          />
        </View>
        {isShotTrackingEnabled && (
          <Text style={styles.gpsTrackingHint}>
            GPS coordinates will be logged with each shot
          </Text>
        )}
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

          {/* Smart Club Selection */}
          <View style={styles.clubSelection}>
            <TouchableOpacity
              style={styles.smartClubButton}
              onPress={() => setShowSmartClubSelector(true)}
            >
              <View style={styles.clubButtonContent}>
                <Text style={styles.clubButtonLabel}>Club</Text>
                <Text style={styles.clubButtonText}>
                  {selectedClub ? selectedClub.getShortName() : 'Select'}
                </Text>
              </View>
              <Text style={styles.clubButtonArrow}>🏌️</Text>
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

      {/* Smart Club Selection Modal */}
      <SmartClubSelector
        visible={showSmartClubSelector}
        onClose={() => setShowSmartClubSelector(false)}
        onClubSelect={handleClubSelection}
        holeNumber={currentHole}
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
  gpsTrackingContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  gpsTrackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsTrackingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  gpsTrackingHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
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