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

    // Enhanced achievement detection after score change
    if (settings.scorecard?.showAchievements !== false && newScore > 0 && historicalData) {
      const holeData = holes.find(h => h.holeNumber === holeNumber);
      const currentHoleHistorical = historicalData[holeNumber];
      
      if (holeData && currentHoleHistorical) {
        const achievements = detectAchievements({
          holeNumber,
          score: newScore,
          par: holeData.par,
          holePerformance: currentHoleHistorical,
          courseStats: courseStats,
          clubUsed: clubs[holeNumber],
          clubData: clubData,
          currentRoundScores: { ...scores, [holeNumber]: newScore },
          settings
        });

        if (achievements.length > 0) {
          setCurrentAchievements(achievements);
          setShowAchievements(true);
        }
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

  // Enhanced hole navigation with achievement detection
  const nextHole = () => {
    if (currentHole < holes.length) {
      // Check if club tracking reminder is enabled and club not selected
      if (settings.scorecard?.clubTrackingReminder !== false && 
          settings.scorecard?.showSmartClubTracking !== false && 
          scores[currentHole] > 0 && 
          !clubs[currentHole]) {
        Alert.alert(
          'Club Not Selected',
          'Would you like to record which club you used on this hole?',
          [
            { text: 'Skip', style: 'cancel' },
            { 
              text: 'Select Club', 
              onPress: () => setShowClubModal(true)
            }
          ]
        );
        return;
      }
      
      // Check for achievements if the setting is enabled and we have a score for current hole
      if (settings.scorecard?.showAchievements !== false && scores[currentHole] > 0 && historicalData) {
        const holeData = holes.find(h => h.holeNumber === currentHole);
        const currentHoleHistorical = historicalData[currentHole];
        
        if (holeData && currentHoleHistorical) {
          const achievements = detectAchievements({
            holeNumber: currentHole,
            score: scores[currentHole],
            par: holeData.par,
            holePerformance: currentHoleHistorical,
            courseStats: courseStats,
            clubUsed: clubs[currentHole],
            clubData: clubData,
            currentRoundScores: scores,
            settings
          });
          
          if (achievements.length > 0) {
            setCurrentAchievements(achievements);
            setShowAchievements(true);
          }
        }
      }
      
      setCurrentHole(currentHole + 1);
    }
  };

  const prevHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  // Get smart club recommendations with confidence levels
  const getSmartClubRecommendations = () => {
    if (settings.scorecard?.enableClubRecommendations === false || !clubData) {
      return [];
    }
    
    const confidenceThreshold = settings.scorecard?.clubConfidenceThreshold || 'medium';
    const confidenceLevels = { low: 1, medium: 2, high: 3, default: 0 };
    
    if (!clubData[currentHole]) {
      // Return default suggestions based on hole par
      const par = currentHoleData.par;
      if (par === 3) {
        return [
          { id: '7iron', name: '7 Iron', reason: 'Par 3 - typical mid-iron choice', confidence: 'default' },
          { id: '8iron', name: '8 Iron', reason: 'Shorter par 3', confidence: 'default' },
          { id: '9iron', name: '9 Iron', reason: 'Short par 3', confidence: 'default' }
        ];
      } else if (par === 4) {
        return [
          { id: 'driver', name: 'Driver', reason: 'Par 4 - distance off tee', confidence: 'default' },
          { id: '3wood', name: '3 Wood', reason: 'Controlled distance', confidence: 'default' },
          { id: 'hybrid', name: 'Hybrid', reason: 'Versatile option', confidence: 'default' }
        ];
      } else if (par === 5) {
        return [
          { id: 'driver', name: 'Driver', reason: 'Par 5 - maximum distance', confidence: 'default' },
          { id: '3wood', name: '3 Wood', reason: 'Safe distance option', confidence: 'default' }
        ];
      }
      return [];
    }

    const holeStats = clubData[currentHole];
    const recommendations = [];

    // Add most used club
    if (holeStats.mostUsedClub) {
      recommendations.push({
        id: holeStats.mostUsedClub.club,
        name: CLUB_OPTIONS.find(c => c.id === holeStats.mostUsedClub.club)?.name || holeStats.mostUsedClub.club,
        reason: `Your usual choice (${holeStats.mostUsedClub.averageScore.toFixed(1)} avg)`,
        confidence: 'high',
        isUsual: true
      });
    }

    // Add best performing club if different
    if (holeStats.bestClub && holeStats.bestClub.club !== holeStats.mostUsedClub?.club) {
      recommendations.push({
        id: holeStats.bestClub.club,
        name: CLUB_OPTIONS.find(c => c.id === holeStats.bestClub.club)?.name || holeStats.bestClub.club,
        reason: `Best performer (${holeStats.bestClub.averageScore.toFixed(1)} avg)`,
        confidence: holeStats.bestClub.timesUsed >= 3 ? 'high' : 'medium',
        isBest: true
      });
    }

    // Add other frequently used clubs
    const otherClubs = Object.values(holeStats.clubs || {})
      .filter(club => 
        club.timesUsed >= 2 && 
        club.club !== holeStats.mostUsedClub?.club && 
        club.club !== holeStats.bestClub?.club
      )
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 2);

    otherClubs.forEach(club => {
      recommendations.push({
        id: club.club,
        name: CLUB_OPTIONS.find(c => c.id === club.club)?.name || club.club,
        reason: `Alternative (${club.averageScore.toFixed(1)} avg)`,
        confidence: 'medium'
      });
    });

    // Filter recommendations based on confidence threshold
    const filteredRecommendations = recommendations.filter(rec => {
      const recConfidenceLevel = confidenceLevels[rec.confidence] || 0;
      const thresholdLevel = confidenceLevels[confidenceThreshold];
      return recConfidenceLevel >= thresholdLevel;
    });
    
    return filteredRecommendations.slice(0, 4);
  };

  // Get course progress tracking data
  const getCourseProgressData = () => {
    if (!historicalData || !playedHoles.length) {
      return null;
    }
    
    // Calculate historical course average
    const historicalScores = historicalData.rounds?.map(round => {
      const roundScore = Object.values(round.scores || {}).reduce((sum, score) => sum + (score || 0), 0);
      const roundHoles = Object.keys(round.scores || {}).filter(hole => round.scores[hole] > 0).length;
      return roundHoles === 18 ? roundScore : Math.round((roundScore / roundHoles) * 18);
    }) || [];
    
    if (historicalScores.length === 0) return null;
    
    const avgHistoricalScore = historicalScores.reduce((sum, score) => sum + score, 0) / historicalScores.length;
    const bestHistoricalScore = Math.min(...historicalScores);
    
    // Calculate projected score based on current pace
    const playedHoles = Object.keys(scores).filter(hole => scores[hole] > 0);
    const currentPace = totalScore / playedHoles.length;
    const projectedScore = Math.round(currentPace * 18);
    
    // Calculate comparison to historical average
    const vsHistoricalAvg = projectedScore - avgHistoricalScore;
    
    // Calculate remaining holes average needed for personal best
    const remainingHoles = 18 - playedHoles.length;
    const neededForPB = remainingHoles > 0 ? (bestHistoricalScore - totalScore) / remainingHoles : 0;
    
    return {
      projectedScore,
      avgHistoricalScore: Math.round(avgHistoricalScore),
      bestHistoricalScore,
      vsHistoricalAvg: Math.round(vsHistoricalAvg * 10) / 10,
      currentPace: Math.round(currentPace * 10) / 10,
      neededForPB: Math.round(neededForPB * 10) / 10,
      remainingHoles,
      isOnPaceForPB: projectedScore <= bestHistoricalScore,
      improvement: vsHistoricalAvg < 0
    };
  };

  // Get expanded insights for current hole
  const getExpandedInsights = () => {
    if (!historicalData || !currentHole) {
      return null;
    }

    const insights = [];
    const holeStats = historicalData[currentHole];
    
    if (!holeStats || holeStats.timesPlayed === 0) {
      return null;
    }

    // Performance pattern insights
    if (holeStats.doubleBogeyPercentage >= 20) {
      insights.push({
        type: 'warning',
        title: 'Trouble Spot',
        message: `You score double bogey or worse ${holeStats.doubleBogeyPercentage}% of the time here. Focus on course management.`
      });
    }

    if (holeStats.birdiePercentage >= 25) {
      insights.push({
        type: 'opportunity',
        title: 'Birdie Opportunity',
        message: `You score birdie ${holeStats.birdiePercentage}% of the time. Attack this hole!`
      });
    }

    // Scoring pattern insights
    if (holeStats.timesPlayed >= 5) {
      const consistency = holeStats.worstScore - holeStats.bestScore;
      if (consistency >= 4) {
        insights.push({
          type: 'tip',
          title: 'Consistency Tip',
          message: `Your scores range from ${holeStats.bestScore} to ${holeStats.worstScore}. Focus on playing within your abilities.`
        });
      }
    }

    // Difficulty-based tips
    if (holeStats.difficulty === 'trouble' && holeStats.averageVsPar > 1) {
      insights.push({
        type: 'strategy',
        title: 'Strategic Approach',
        message: `This is your toughest hole (+${holeStats.averageVsPar.toFixed(1)} avg). Consider a more conservative strategy.`
      });
    } else if (holeStats.difficulty === 'easy' && holeStats.averageVsPar < -0.3) {
      insights.push({
        type: 'opportunity',
        title: 'Scoring Hole',
        message: `You typically score well here (${holeStats.averageVsPar.toFixed(1)} vs par). Be aggressive!`
      });
    }

    return insights.length > 0 ? insights : null;
  };

  // Calculate various data points for the Statistics card
  const smartClubRecommendations = getSmartClubRecommendations();
  const courseProgress = getCourseProgressData();
  const expandedInsights = getExpandedInsights();
  const playedHoles = Object.keys(scores).filter(hole => scores[hole] > 0);

  // Calculate round completion status and validation
  const getRoundCompletionStatus = () => {
    const holesCompleted = Object.keys(scores).filter(hole => scores[hole] > 0).length;
    const isRoundComplete = holesCompleted === holes.length;
    
    // Check if front 9, back 9, or all 18 holes are complete
    const front9Complete = holes.slice(0, 9).every(hole => scores[hole.holeNumber] > 0);
    const back9Complete = holes.slice(9, 18).every(hole => scores[hole.holeNumber] > 0);
    
    // Check if any holes have been played in each 9
    const front9HasScores = holes.slice(0, 9).some(hole => scores[hole.holeNumber] > 0);
    const back9HasScores = holes.slice(9, 18).some(hole => scores[hole.holeNumber] > 0);
    
    // Determine round type and validation
    const canFinishFront9 = front9Complete && !back9HasScores;
    const canFinishBack9 = back9Complete && !front9HasScores;
    const canFinishRound = front9Complete || back9Complete || isRoundComplete;

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

    return {
      holesCompleted,
      isRoundComplete,
      front9Complete,
      back9Complete,
      canFinishRound,
      roundType,
      totalCoursePar,
      finalScore,
      finalScoreToPar
    };
  };

  // Handle finish round with comprehensive validation
  const handleFinishRound = () => {
    const completionStatus = getRoundCompletionStatus();
    
    Alert.alert(
      'Finish Round?',
      `Are you sure you want to finish this ${completionStatus.roundType}?\n\nFinal Score: ${completionStatus.finalScore}\nPar: ${completionStatus.totalCoursePar}\nScore: ${completionStatus.finalScoreToPar === 0 ? 'E' : completionStatus.finalScoreToPar > 0 ? `+${completionStatus.finalScoreToPar}` : completionStatus.finalScoreToPar}\n\nHoles Completed: ${completionStatus.holesCompleted}/${holes.length}`,
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
                          clubs: clubs,
                          roundType: completionStatus.roundType,
                          holesCompleted: completionStatus.holesCompleted,
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
                clubs: clubs,
                roundType: completionStatus.roundType,
                holesCompleted: completionStatus.holesCompleted,
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

  // Complete round in backend with comprehensive error handling
  const completeRoundInBackend = async () => {
    try {
      if (!round?.id || !token) {
        return { success: true }; // Allow local completion
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/rounds/${round.id}/complete`, {
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

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error completing round in backend:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  };

  // Clear active round data
  const clearActiveRound = async () => {
    try {
      const STORAGE_KEY = `golf_round_${round?.id || 'temp'}_scores`;
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing active round:', error);
    }
  };

  // Check if we should show finish button using comprehensive completion status
  const completionStatus = getRoundCompletionStatus();
  const shouldShowFinishButton = completionStatus.canFinishRound;

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

          {/* Statistics Card - Comprehensive Performance Analytics */}
          <View style={styles.statisticsCard}>
            <TouchableOpacity
              style={styles.statisticsHeader}
              onPress={() => setStatisticsCardExpanded(!statisticsCardExpanded)}
            >
              <Text style={styles.statisticsTitle}>Performance Analytics</Text>
              <Text style={styles.statisticsToggle}>
                {statisticsCardExpanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            
            {statisticsCardExpanded && (
              <View style={styles.statisticsContent}>
                {/* Course Progress Tracking */}
                {courseProgress && (
                  <View style={styles.progressSection}>
                    <Text style={styles.sectionTitle}>📊 Round Progress</Text>
                    <View style={styles.progressGrid}>
                      <View style={styles.progressItem}>
                        <Text style={styles.progressLabel}>Projected</Text>
                        <Text style={[styles.progressValue, courseProgress.improvement ? styles.improvementText : styles.worseText]}>
                          {courseProgress.projectedScore}
                        </Text>
                      </View>
                      <View style={styles.progressItem}>
                        <Text style={styles.progressLabel}>Your Avg</Text>
                        <Text style={styles.progressValue}>{courseProgress.avgHistoricalScore}</Text>
                      </View>
                      <View style={styles.progressItem}>
                        <Text style={styles.progressLabel}>Personal Best</Text>
                        <Text style={styles.progressValue}>{courseProgress.bestHistoricalScore}</Text>
                      </View>
                      <View style={styles.progressItem}>
                        <Text style={styles.progressLabel}>vs Avg</Text>
                        <Text style={[styles.progressValue, courseProgress.improvement ? styles.improvementText : styles.worseText]}>
                          {courseProgress.vsHistoricalAvg > 0 ? '+' : ''}{courseProgress.vsHistoricalAvg}
                        </Text>
                      </View>
                    </View>
                    {courseProgress.isOnPaceForPB && (
                      <View style={styles.pbAlertContainer}>
                        <Text style={styles.pbAlertText}>🎯 On pace for personal best!</Text>
                        <Text style={styles.pbAlertSubtext}>
                          Need {courseProgress.neededForPB.toFixed(1)} avg on remaining {courseProgress.remainingHoles} holes
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Current Hole Performance */}
                {currentHoleHistorical && (
                  <View style={styles.holePerformanceSection}>
                    <Text style={styles.sectionTitle}>🏌️ Hole {currentHole} Performance</Text>
                    <View style={styles.holeStatsGrid}>
                      <View style={styles.holeStatItem}>
                        <Text style={styles.holeStatLabel}>Average</Text>
                        <Text style={styles.holeStatValue}>{currentHoleHistorical.averageScore.toFixed(1)}</Text>
                      </View>
                      <View style={styles.holeStatItem}>
                        <Text style={styles.holeStatLabel}>Best</Text>
                        <Text style={styles.holeStatValue}>{currentHoleHistorical.bestScore}</Text>
                      </View>
                      <View style={styles.holeStatItem}>
                        <Text style={styles.holeStatLabel}>Played</Text>
                        <Text style={styles.holeStatValue}>{currentHoleHistorical.timesPlayed}</Text>
                      </View>
                      <View style={styles.holeStatItem}>
                        <Text style={styles.holeStatLabel}>Difficulty</Text>
                        <Text style={[styles.holeStatValue, 
                          currentHoleHistorical.difficulty === 'easy' ? styles.easyText : 
                          currentHoleHistorical.difficulty === 'trouble' ? styles.troubleText : 
                          styles.mediumText
                        ]}>
                          {currentHoleHistorical.difficulty}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.scoreDistribution}>
                      <Text style={styles.distributionTitle}>Score Distribution:</Text>
                      <View style={styles.distributionRow}>
                        {currentHoleHistorical.birdiePercentage > 0 && (
                          <Text style={styles.distributionItem}>🐦 {currentHoleHistorical.birdiePercentage}%</Text>
                        )}
                        {currentHoleHistorical.parPercentage > 0 && (
                          <Text style={styles.distributionItem}>⭐ {currentHoleHistorical.parPercentage}%</Text>
                        )}
                        {currentHoleHistorical.bogeyPercentage > 0 && (
                          <Text style={styles.distributionItem}>📈 {currentHoleHistorical.bogeyPercentage}%</Text>
                        )}
                        {currentHoleHistorical.doubleBogeyPercentage > 0 && (
                          <Text style={styles.distributionItem}>⚠️ {currentHoleHistorical.doubleBogeyPercentage}%</Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Smart Club Recommendations */}
                {smartClubRecommendations.length > 0 && (
                  <View style={styles.clubRecommendationsSection}>
                    <Text style={styles.sectionTitle}>🏌️‍♂️ Club Recommendations</Text>
                    {smartClubRecommendations.map((rec, index) => (
                      <View key={index} style={styles.clubRecommendationItem}>
                        <View style={styles.clubRecommendationHeader}>
                          <Text style={[styles.clubRecommendationName, 
                            rec.isUsual ? styles.usualClub : 
                            rec.isBest ? styles.bestClub : styles.alternativeClub
                          ]}>
                            {rec.name}
                            {rec.isUsual && ' (Usual)'}
                            {rec.isBest && ' (Best)'}
                          </Text>
                          <View style={[styles.confidenceBadge, 
                            rec.confidence === 'high' ? styles.highConfidence : 
                            rec.confidence === 'medium' ? styles.mediumConfidence : styles.lowConfidence
                          ]}>
                            <Text style={styles.confidenceText}>{rec.confidence}</Text>
                          </View>
                        </View>
                        <Text style={styles.clubRecommendationReason}>{rec.reason}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Performance Insights */}
                {expandedInsights && expandedInsights.length > 0 && (
                  <View style={styles.insightsSection}>
                    <Text style={styles.sectionTitle}>💡 Performance Insights</Text>
                    {expandedInsights.map((insight, index) => (
                      <View key={index} style={[styles.insightItem, 
                        insight.type === 'warning' ? styles.warningInsight : 
                        insight.type === 'opportunity' ? styles.opportunityInsight : 
                        insight.type === 'tip' ? styles.tipInsight : styles.strategyInsight
                      ]}>
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                        <Text style={styles.insightMessage}>{insight.message}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Historical Data Summary */}
                {historicalData && (
                  <View style={styles.historicalSummarySection}>
                    <Text style={styles.sectionTitle}>📈 Historical Summary</Text>
                    <Text style={styles.historicalSummaryText}>
                      Based on {historicalData.totalRounds || historicalData.rounds?.length || 0} completed rounds at {course.name}
                    </Text>
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
  // New Performance Analytics Styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressGrid: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  improvementText: {
    color: '#2e7d32',
  },
  worseText: {
    color: '#d32f2f',
  },
  pbAlertContainer: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  pbAlertText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 2,
  },
  pbAlertSubtext: {
    fontSize: 12,
    color: '#666',
  },
  holePerformanceSection: {
    marginBottom: 20,
  },
  holeStatsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  holeStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  holeStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  holeStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  easyText: {
    color: '#2e7d32',
  },
  troubleText: {
    color: '#d32f2f',
  },
  mediumText: {
    color: '#f57c00',
  },
  scoreDistribution: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
  },
  distributionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  distributionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  distributionItem: {
    fontSize: 12,
    color: '#666',
    marginRight: 12,
    marginBottom: 2,
  },
  clubRecommendationsSection: {
    marginBottom: 20,
  },
  clubRecommendationItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  clubRecommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clubRecommendationName: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  usualClub: {
    color: '#2e7d32',
  },
  bestClub: {
    color: '#1976d2',
  },
  alternativeClub: {
    color: '#666',
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  highConfidence: {
    backgroundColor: '#2e7d32',
  },
  mediumConfidence: {
    backgroundColor: '#f57c00',
  },
  lowConfidence: {
    backgroundColor: '#666',
  },
  confidenceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  clubRecommendationReason: {
    fontSize: 12,
    color: '#666',
  },
  insightsSection: {
    marginBottom: 20,
  },
  insightItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  warningInsight: {
    backgroundColor: '#ffebee',
    borderLeftColor: '#d32f2f',
  },
  opportunityInsight: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#2e7d32',
  },
  tipInsight: {
    backgroundColor: '#fff3e0',
    borderLeftColor: '#f57c00',
  },
  strategyInsight: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#1976d2',
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  historicalSummarySection: {
    marginBottom: 10,
  },
  historicalSummaryText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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