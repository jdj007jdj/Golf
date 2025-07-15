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
import { calculateHolePerformance, filterRoundsByCourse, analyzeClubUsage, getClubInsightsForScorecard, detectAchievements, getCourseStats } from '../../utils/coursePerformanceUtils';
import AchievementPopup from '../../components/AchievementPopup';

const { width } = Dimensions.get('window');

const ScorecardScreen = ({ route, navigation }) => {
  const { round, course } = route.params;
  const { token } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  // Initialize scores state - one score per hole
  const [scores, setScores] = useState({});
  const [putts, setPutts] = useState({});
  const [clubs, setClubs] = useState({}); // Track club used per hole
  const [currentHole, setCurrentHole] = useState(1);
  const [scoreAnimation] = useState(new Animated.Value(1));
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingRound, setIsSavingRound] = useState(false);
  const [historicalData, setHistoricalData] = useState(null);
  const [clubData, setClubData] = useState(null);
  const [statisticsCardExpanded, setStatisticsCardExpanded] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);
  const [currentAchievements, setCurrentAchievements] = useState([]);
  const [courseStats, setCourseStats] = useState(null);
  const [showClubModal, setShowClubModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // Storage key for this specific round
  const STORAGE_KEY = `golf_round_${round?.id || 'temp'}_scores`;
  
  // Get holes from course data, fallback to default 18 holes
  const holes = course.holes || Array.from({ length: 18 }, (_, i) => ({
    id: `default-${i + 1}`,
    holeNumber: i + 1,
    par: i + 1 <= 4 ? 4 : i + 1 <= 10 ? (i + 1) % 2 === 0 ? 5 : 3 : 4, // Mixed pars
  }));

  // Club selection options
  const CLUB_OPTIONS = [
    { id: 'driver', name: 'Driver', category: 'woods' },
    { id: '3wood', name: '3 Wood', category: 'woods' },
    { id: '5wood', name: '5 Wood', category: 'woods' },
    { id: 'hybrid', name: 'Hybrid', category: 'hybrids' },
    { id: '3iron', name: '3 Iron', category: 'irons' },
    { id: '4iron', name: '4 Iron', category: 'irons' },
    { id: '5iron', name: '5 Iron', category: 'irons' },
    { id: '6iron', name: '6 Iron', category: 'irons' },
    { id: '7iron', name: '7 Iron', category: 'irons' },
    { id: '8iron', name: '8 Iron', category: 'irons' },
    { id: '9iron', name: '9 Iron', category: 'irons' },
    { id: 'pwedge', name: 'PW', category: 'wedges' },
    { id: 'awedge', name: 'AW', category: 'wedges' },
    { id: 'swedge', name: 'SW', category: 'wedges' },
    { id: 'lwedge', name: 'LW', category: 'wedges' },
    { id: 'putter', name: 'Putter', category: 'putter' }
  ];

  // Load scores and historical data on component mount
  useEffect(() => {
    loadScores();
    loadHistoricalData();
    loadCourseSettings();
  }, []);

  // Save scores to AsyncStorage whenever scores change
  useEffect(() => {
    if (!isLoading) {
      saveScores();
    }
  }, [scores, putts, clubs, isLoading]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background, save scores
        saveScores();
      } else if (nextAppState === 'active') {
        // App is coming to foreground, reload scores
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
        setClubs(parsedScores.clubs || {}); // Load club selections
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
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ scores, putts, clubs }));
    } catch (error) {
      console.error('Error saving scores:', error);
      // Don't show alert for save errors as it would be too disruptive
    }
  };

  const clearSavedScores = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing saved scores:', error);
    }
  };

  const loadHistoricalData = async () => {
    try {
      if (!course?.id || !token) {
        return;
      }


      // Fetch historical rounds from backend API
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROUNDS}?status=completed`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch historical rounds:', response.status);
        setHistoricalData(null);
        return;
      }

      const roundsData = await response.json();
      
      if (roundsData.success && roundsData.data && roundsData.data.length > 0) {
        const rounds = roundsData.data;
        
        // Transform API data to match our coursePerformanceUtils format
        const transformedRounds = rounds.map(round => {
          
          // Extract scores from participants -> holeScores
          let scores = {};
          if (round.participants && round.participants.length > 0) {
            // Find the current user's participant record
            const userParticipant = round.participants.find(p => p.userId === round.participants[0].userId); // Assuming single participant for now
            
            if (userParticipant && userParticipant.holeScores) {
              scores = userParticipant.holeScores.reduce((acc, scoreData) => {
                if (scoreData.hole && scoreData.hole.holeNumber && scoreData.score !== null && scoreData.score !== undefined) {
                  acc[scoreData.hole.holeNumber] = scoreData.score;
                }
                return acc;
              }, {});
            }
          }
          
          
          // For testing: Add mock club data to demonstrate functionality
          const mockClubs = {};
          Object.keys(scores).forEach(holeNumber => {
            const holeNum = parseInt(holeNumber);
            if (holeNum <= 3) {
              mockClubs[holeNumber] = Math.random() > 0.7 ? 'driver' : '3wood';
            } else if (holeNum <= 6) {
              mockClubs[holeNumber] = Math.random() > 0.5 ? '7iron' : '8iron';
            } else if (holeNum <= 12) {
              mockClubs[holeNumber] = Math.random() > 0.6 ? '9iron' : 'pwedge';
            } else {
              mockClubs[holeNumber] = Math.random() > 0.4 ? '7iron' : '6iron';
            }
          });

          return {
            id: round.id,
            courseId: round.courseId,
            date: round.startedAt,
            scores: scores,
            clubs: mockClubs, // Add mock club data
            isCompleted: round.finishedAt !== null
          };
        });
        
        
        // Filter for completed rounds with scores on this specific course
        let completedRounds = transformedRounds.filter(round => {
          const hasScores = Object.keys(round.scores).length > 0;
          const isCorrectCourse = round.courseId === course.id;
          const isCompleted = round.isCompleted;
          
          
          return isCompleted && isCorrectCourse && hasScores;
        });
        
        // Apply historical timeframe filter
        const timeframe = settings.scorecard?.historicalTimeframe || '10';
        if (timeframe !== 'all') {
          const limit = parseInt(timeframe);
          completedRounds = completedRounds.slice(0, limit);
        }
        
        if (completedRounds.length > 0) {
          
          // Calculate hole performance for this course
          const holePerformance = calculateHolePerformance(completedRounds, course);
          
          
          // Calculate club usage data
          const clubUsageData = analyzeClubUsage(completedRounds, course);
          
          // Calculate course statistics
          const stats = getCourseStats(completedRounds, course.id);
          setCourseStats(stats);
          
          setHistoricalData({
            rounds: completedRounds,
            holePerformance,
            totalRounds: completedRounds.length
          });
          
          setClubData(clubUsageData);
        } else {
          setHistoricalData(null);
        }
      } else {
        setHistoricalData(null);
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
      setHistoricalData(null);
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

  const updateClub = (holeNumber, club) => {
    setClubs(prev => ({
      ...prev,
      [holeNumber]: club
    }));
  };

  const toggleCategoryExpansion = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
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

  const getCurrentHoleHistoricalData = () => {
    if (!historicalData?.holePerformance) {
      return null;
    }
    
    const holeStats = historicalData.holePerformance[currentHole];
    
    if (!holeStats || holeStats.timesPlayed === 0) {
      return null;
    }
    
    return holeStats;
  };

  const getCurrentHoleClubInsights = () => {
    if (!clubData) {
      return null;
    }
    
    const clubInsights = getClubInsightsForScorecard(clubData, currentHole);
    
    return clubInsights;
  };

  const getSmartClubRecommendations = () => {
    // Check if club recommendations are enabled
    if (settings.scorecard?.enableClubRecommendations === false) {
      return [];
    }
    
    const confidenceThreshold = settings.scorecard?.clubConfidenceThreshold || 'medium';
    const confidenceLevels = { low: 1, medium: 2, high: 3, default: 0 };
    
    if (!clubData || !clubData[currentHole]) {
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
    
    return filteredRecommendations.slice(0, 4); // Limit to top 4 recommendations
  };

  const getExpandedInsights = () => {
    if (!currentHoleHistorical || !currentHoleClubInsights) {
      return null;
    }

    const insights = [];
    const holeStats = currentHoleHistorical;
    const clubStats = currentHoleClubInsights;

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

    // Club-specific insights
    if (clubStats.hasData && clubStats.recommendation) {
      insights.push({
        type: 'club',
        title: 'Club Performance',
        message: `When you use ${clubStats.recommendation.club}, you average ${clubStats.recommendation.averageScore.toFixed(1)} vs ${clubStats.mostUsed.averageScore.toFixed(1)} with ${clubStats.mostUsed.club}.`
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

  const currentHoleData = getCurrentHoleData();
  const currentHoleHistorical = getCurrentHoleHistoricalData();
  const currentHoleClubInsights = getCurrentHoleClubInsights();
  const expandedInsightsData = getExpandedInsights();
  const smartClubRecommendations = getSmartClubRecommendations();
  const currentScore = scores[currentHole] || 0;
  const currentPutts = putts[currentHole] || 0;
  const currentClub = clubs[currentHole] || null;

  // Calculate running total
  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  const playedHoles = holes.filter(hole => scores[hole.holeNumber] > 0);
  const totalPar = playedHoles.reduce((sum, hole) => sum + hole.par, 0);
  const scoreToPar = totalScore - totalPar;
  
  // Calculate course progress tracking
  const getCourseProgressData = () => {
    if (!historicalData?.rounds || historicalData.rounds.length === 0 || playedHoles.length === 0) {
      return null;
    }
    
    // Calculate historical course average
    const historicalScores = historicalData.rounds.map(round => {
      const roundScore = Object.values(round.scores).reduce((sum, score) => sum + (score || 0), 0);
      const roundHoles = Object.keys(round.scores).filter(hole => round.scores[hole] > 0).length;
      return roundHoles === 18 ? roundScore : Math.round((roundScore / roundHoles) * 18);
    });
    
    const avgHistoricalScore = historicalScores.reduce((sum, score) => sum + score, 0) / historicalScores.length;
    const bestHistoricalScore = Math.min(...historicalScores);
    
    // Calculate projected score based on current pace
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
  
  const courseProgress = getCourseProgressData();
  
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

  // Load course-specific settings if enabled
  const loadCourseSettings = async () => {
    try {
      if (settings.scorecard?.rememberCourseSettings !== false && course?.id) {
        const savedSettings = await AsyncStorage.getItem(`course_settings_${course.id}`);
        if (savedSettings) {
          const courseSettings = JSON.parse(savedSettings);
          // Apply course-specific settings
          updateSettings({
            scorecard: {
              ...settings.scorecard,
              ...courseSettings
            }
          });
        }
      }
    } catch (error) {
      console.log('Error loading course settings:', error);
    }
  };

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
      if (settings.scorecard?.showAchievementNotifications !== false && scores[currentHole] > 0 && historicalData) {
        const achievements = detectAchievements({
          holeNumber: currentHole,
          score: scores[currentHole],
          holePerformance: historicalData.holePerformance,
          courseStats: courseStats,
          clubUsed: clubs[currentHole], // Live club tracking for achievements
          clubData: clubData,
          currentRoundScores: scores
        });
        
        if (achievements.length > 0) {
          setCurrentAchievements(achievements);
          setShowAchievements(true);
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
                          clubs: clubs,
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
                clubs: clubs,
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

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error completing round in backend:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  };

  const clearActiveRound = async () => {
    try {
      await AsyncStorage.removeItem('golf_active_round');
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
                          clubs: clubs,
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
                clubs: clubs,
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

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Historical Insights</Text>
                <Text style={styles.settingDescription}>Show your averages and records on each hole</Text>
              </View>
              <Switch
                value={settings.scorecard?.showHistoricalInsights !== false}
                onValueChange={(value) => {
                  updateSettings({
                    scorecard: { ...settings.scorecard, showHistoricalInsights: value }
                  });
                }}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.scorecard?.showHistoricalInsights !== false ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            {/* Historical Insights Subsection */}
            {settings.scorecard?.showHistoricalInsights !== false && (
              <View style={styles.settingSubsection}>
                <View style={styles.settingRow}>
                  <View style={styles.settingLabelContainer}>
                    <Text style={styles.settingLabel}>Show Averages</Text>
                    <Text style={styles.settingDescription}>Display your average scores</Text>
                  </View>
                  <Switch
                    value={settings.scorecard?.showHistoricalAverages !== false}
                    onValueChange={(value) => {
                      updateSettings({
                        scorecard: { ...settings.scorecard, showHistoricalAverages: value }
                      });
                    }}
                    trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                    thumbColor={settings.scorecard?.showHistoricalAverages !== false ? '#2E7D32' : '#F5F5F5'}
                  />
                </View>

                <View style={styles.settingRowCompact}>
                  <Text style={styles.settingLabel}>Detail Level</Text>
                  <Text style={styles.settingDescription}>Amount of information to display</Text>
                  <View style={styles.insightLevelSelector}>
                    {['minimal', 'standard', 'detailed'].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.insightLevelOption,
                          (settings.scorecard?.insightDetailLevel || 'standard') === level && styles.insightLevelOptionSelected
                        ]}
                        onPress={() => {
                          updateSettings({
                            scorecard: { ...settings.scorecard, insightDetailLevel: level }
                          });
                        }}
                      >
                        <Text style={[
                          styles.insightLevelText,
                          (settings.scorecard?.insightDetailLevel || 'standard') === level && styles.insightLevelTextSelected
                        ]}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingLabelContainer}>
                    <Text style={styles.settingLabel}>Remember by Course</Text>
                    <Text style={styles.settingDescription}>Save settings for each course</Text>
                  </View>
                  <Switch
                    value={settings.scorecard?.rememberCourseSettings !== false}
                    onValueChange={(value) => {
                      updateSettings({
                        scorecard: { ...settings.scorecard, rememberCourseSettings: value }
                      });
                      // If enabled, save current settings for this course
                      if (value && course?.id) {
                        const courseSettings = {
                          showHistoricalInsights: settings.scorecard?.showHistoricalInsights !== false,
                          showHistoricalAverages: settings.scorecard?.showHistoricalAverages !== false,
                          insightDetailLevel: settings.scorecard?.insightDetailLevel || 'standard',
                          showAchievementNotifications: settings.scorecard?.showAchievementNotifications !== false,
                          showSmartClubTracking: settings.scorecard?.showSmartClubTracking !== false,
                          enableClubRecommendations: settings.scorecard?.enableClubRecommendations !== false,
                          clubConfidenceThreshold: settings.scorecard?.clubConfidenceThreshold || 'medium',
                          autoSuggestByDistance: settings.scorecard?.autoSuggestByDistance !== false,
                          clubTrackingReminder: settings.scorecard?.clubTrackingReminder !== false,
                          comparisonMode: settings.scorecard?.comparisonMode || 'personal',
                          historicalTimeframe: settings.scorecard?.historicalTimeframe || '10',
                          highTrendSensitivity: settings.scorecard?.highTrendSensitivity === true,
                        };
                        AsyncStorage.setItem(`course_settings_${course.id}`, JSON.stringify(courseSettings));
                      }
                    }}
                    trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                    thumbColor={settings.scorecard?.rememberCourseSettings !== false ? '#2E7D32' : '#F5F5F5'}
                  />
                </View>

                <View style={styles.settingDivider} />

                <Text style={styles.settingSubheading}>Performance Comparison</Text>

                <View style={styles.settingRowCompact}>
                  <Text style={styles.settingLabel}>Compare To</Text>
                  <Text style={styles.settingDescription}>Select your performance baseline</Text>
                  <View style={styles.insightLevelSelector}>
                    {['personal', 'course', 'handicap'].map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          styles.insightLevelOption,
                          (settings.scorecard?.comparisonMode || 'personal') === mode && styles.insightLevelOptionSelected
                        ]}
                        onPress={() => {
                          updateSettings({
                            scorecard: { ...settings.scorecard, comparisonMode: mode }
                          });
                        }}
                      >
                        <Text style={[
                          styles.insightLevelText,
                          (settings.scorecard?.comparisonMode || 'personal') === mode && styles.insightLevelTextSelected
                        ]}>
                          {mode === 'personal' ? 'Personal' : mode === 'course' ? 'Course' : 'Handicap'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.settingRowCompact}>
                  <Text style={styles.settingLabel}>Historical Timeframe</Text>
                  <Text style={styles.settingDescription}>Rounds to include in calculations</Text>
                  <View style={styles.insightLevelSelector}>
                    {['5', '10', 'all'].map((timeframe) => (
                      <TouchableOpacity
                        key={timeframe}
                        style={[
                          styles.insightLevelOption,
                          (settings.scorecard?.historicalTimeframe || '10') === timeframe && styles.insightLevelOptionSelected
                        ]}
                        onPress={() => {
                          updateSettings({
                            scorecard: { ...settings.scorecard, historicalTimeframe: timeframe }
                          });
                        }}
                      >
                        <Text style={[
                          styles.insightLevelText,
                          (settings.scorecard?.historicalTimeframe || '10') === timeframe && styles.insightLevelTextSelected
                        ]}>
                          {timeframe === 'all' ? 'All' : `Last ${timeframe}`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingLabelContainer}>
                    <Text style={styles.settingLabel}>Trend Sensitivity</Text>
                    <Text style={styles.settingDescription}>How quickly trends are detected</Text>
                  </View>
                  <Switch
                    value={settings.scorecard?.highTrendSensitivity === true}
                    onValueChange={(value) => {
                      updateSettings({
                        scorecard: { ...settings.scorecard, highTrendSensitivity: value }
                      });
                    }}
                    trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                    thumbColor={settings.scorecard?.highTrendSensitivity === true ? '#2E7D32' : '#F5F5F5'}
                  />
                </View>
              </View>
            )}

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Achievement Notifications</Text>
                <Text style={styles.settingDescription}>Show achievements when moving between holes</Text>
              </View>
              <Switch
                value={settings.scorecard?.showAchievementNotifications !== false}
                onValueChange={(value) => {
                  updateSettings({
                    scorecard: { ...settings.scorecard, showAchievementNotifications: value }
                  });
                }}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.scorecard?.showAchievementNotifications !== false ? '#2E7D32' : '#F5F5F5'}
              />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Text style={styles.settingLabel}>Smart Club Tracking</Text>
                <Text style={styles.settingDescription}>Track and recommend clubs during play</Text>
              </View>
              <Switch
                value={settings.scorecard?.showSmartClubTracking !== false}
                onValueChange={(value) => {
                  updateSettings({
                    scorecard: { ...settings.scorecard, showSmartClubTracking: value }
                  });
                }}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={settings.scorecard?.showSmartClubTracking !== false ? '#2E7D32' : '#F5F5F5'}
              />
            </View>

            {/* Smart Club Tracking Subsection */}
            {settings.scorecard?.showSmartClubTracking !== false && (
              <View style={styles.settingSubsection}>
                <View style={styles.settingRow}>
                  <View style={styles.settingLabelContainer}>
                    <Text style={styles.settingLabel}>Club Recommendations</Text>
                    <Text style={styles.settingDescription}>Show club suggestions for each hole</Text>
                  </View>
                  <Switch
                    value={settings.scorecard?.enableClubRecommendations !== false}
                    onValueChange={(value) => {
                      updateSettings({
                        scorecard: { ...settings.scorecard, enableClubRecommendations: value }
                      });
                    }}
                    trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                    thumbColor={settings.scorecard?.enableClubRecommendations !== false ? '#2E7D32' : '#F5F5F5'}
                  />
                </View>

                <View style={styles.settingRowCompact}>
                  <Text style={styles.settingLabel}>Recommendation Confidence</Text>
                  <Text style={styles.settingDescription}>Minimum confidence level for club suggestions</Text>
                  <View style={styles.insightLevelSelector}>
                    {['low', 'medium', 'high'].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.insightLevelOption,
                          (settings.scorecard?.clubConfidenceThreshold || 'medium') === level && styles.insightLevelOptionSelected
                        ]}
                        onPress={() => {
                          updateSettings({
                            scorecard: { ...settings.scorecard, clubConfidenceThreshold: level }
                          });
                        }}
                      >
                        <Text style={[
                          styles.insightLevelText,
                          (settings.scorecard?.clubConfidenceThreshold || 'medium') === level && styles.insightLevelTextSelected
                        ]}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingLabelContainer}>
                    <Text style={styles.settingLabel}>Auto-Suggest by Distance</Text>
                    <Text style={styles.settingDescription}>Suggest clubs based on hole distance</Text>
                  </View>
                  <Switch
                    value={settings.scorecard?.autoSuggestByDistance !== false}
                    onValueChange={(value) => {
                      updateSettings({
                        scorecard: { ...settings.scorecard, autoSuggestByDistance: value }
                      });
                    }}
                    trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                    thumbColor={settings.scorecard?.autoSuggestByDistance !== false ? '#2E7D32' : '#F5F5F5'}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingLabelContainer}>
                    <Text style={styles.settingLabel}>Club Tracking Reminder</Text>
                    <Text style={styles.settingDescription}>Remind to select club if not entered</Text>
                  </View>
                  <Switch
                    value={settings.scorecard?.clubTrackingReminder !== false}
                    onValueChange={(value) => {
                      updateSettings({
                        scorecard: { ...settings.scorecard, clubTrackingReminder: value }
                      });
                    }}
                    trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                    thumbColor={settings.scorecard?.clubTrackingReminder !== false ? '#2E7D32' : '#F5F5F5'}
                  />
                </View>
              </View>
            )}
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
      
      {/* Statistics Card */}
      {settings.scorecard?.showHistoricalInsights !== false && settings.scorecard?.showHistoricalAverages !== false && (currentHoleHistorical || currentHoleClubInsights || (courseProgress && playedHoles.length >= 3)) && (
        <View style={[
          styles.statisticsCard,
          !statisticsCardExpanded && styles.statisticsCardCollapsed
        ]}>
          <TouchableOpacity 
            style={styles.statisticsHeader}
            onPress={() => setStatisticsCardExpanded(!statisticsCardExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.statisticsHeaderContent}>
              <Text style={styles.statisticsTitle}>Statistics</Text>
              <Text style={styles.statisticsSubtitle}>
                Hole {currentHole} • Par {currentHoleData.par}
                {!statisticsCardExpanded && currentHoleHistorical && (
                  ` • Avg: ${currentHoleHistorical.averageScore}`
                )}
              </Text>
            </View>
            <Text style={styles.statisticsToggleIcon}>
              {statisticsCardExpanded ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {statisticsCardExpanded && (
            <View style={styles.statisticsContent}>
          
          {/* Hole Historical Data - Show in all detail levels */}
          {currentHoleHistorical && (
            <View style={styles.statisticsSection}>
              <Text style={styles.statisticsSectionTitle}>
                {settings.scorecard?.comparisonMode === 'course' ? 'Course Comparison' :
                 settings.scorecard?.comparisonMode === 'handicap' ? 'Handicap Performance' :
                 'Your Performance'}
              </Text>
              <View style={styles.statisticsGrid}>
                <View style={styles.statisticsItem}>
                  <Text style={styles.statisticsLabel}>Average Score</Text>
                  <Text style={styles.statisticsValue}>{currentHoleHistorical.averageScore}</Text>
                  <Text style={[
                    styles.statisticsVsPar,
                    currentHoleHistorical.averageVsPar < 0 ? styles.underPar :
                    currentHoleHistorical.averageVsPar > 0 ? styles.overPar : styles.evenPar
                  ]}>
                    ({currentHoleHistorical.averageVsPar > 0 ? '+' : ''}{currentHoleHistorical.averageVsPar} vs par)
                  </Text>
                </View>
                
                <View style={styles.statisticsItem}>
                  <Text style={styles.statisticsLabel}>Difficulty</Text>
                  <View style={styles.difficultyContainer}>
                    <Text style={styles.difficultyIcon}>
                      {currentHoleHistorical.difficulty === 'easy' ? '🟢' :
                       currentHoleHistorical.difficulty === 'fair' ? '🟡' :
                       currentHoleHistorical.difficulty === 'challenging' ? '🟠' : '🔴'}
                    </Text>
                    <Text style={styles.difficultyText}>
                      {currentHoleHistorical.difficulty.charAt(0).toUpperCase() + currentHoleHistorical.difficulty.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.statisticsItem}>
                  <Text style={styles.statisticsLabel}>Times Played</Text>
                  <Text style={styles.statisticsValue}>{currentHoleHistorical.timesPlayed}</Text>
                  {currentHoleHistorical.birdiePercentage > 0 && (
                    <Text style={styles.statisticsDetail}>🐦 {currentHoleHistorical.birdiePercentage}%</Text>
                  )}
                </View>
              </View>
            </View>
          )}
          
          {/* Club Recommendations - Show in standard and detailed levels */}
          {(settings.scorecard?.insightDetailLevel || 'standard') !== 'minimal' && currentHoleClubInsights && currentHoleClubInsights.hasData && (
            <View style={styles.statisticsSection}>
              <Text style={styles.statisticsSectionTitle}>Club Recommendations</Text>
              <View style={styles.clubRecommendations}>
                {currentHoleClubInsights.mostUsed && (
                  <View style={styles.clubRecommendationItem}>
                    <Text style={styles.clubLabel}>Usually:</Text>
                    <Text style={styles.clubName}>{currentHoleClubInsights.mostUsed.club}</Text>
                    <Text style={styles.clubStats}>
                      ({currentHoleClubInsights.mostUsed.averageScore.toFixed(1)} avg, {currentHoleClubInsights.mostUsed.timesUsed}x)
                    </Text>
                  </View>
                )}
                
                {currentHoleClubInsights.recommendation && (
                  <View style={styles.clubRecommendationItem}>
                    <Text style={styles.clubLabel}>⭐ Best:</Text>
                    <Text style={[styles.clubName, styles.clubRecommended]}>{currentHoleClubInsights.recommendation.club}</Text>
                    <Text style={styles.clubImprovement}>
                      (-{currentHoleClubInsights.recommendation.improvement} strokes)
                    </Text>
                    <View style={[
                      styles.confidenceBadge,
                      currentHoleClubInsights.recommendation.confidence === 'high' ? styles.confidenceHigh : styles.confidenceMedium
                    ]}>
                      <Text style={styles.confidenceText}>
                        {currentHoleClubInsights.recommendation.confidence}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* Course Progress - Show in standard and detailed levels */}
          {(settings.scorecard?.insightDetailLevel || 'standard') !== 'minimal' && courseProgress && playedHoles.length >= 3 && (
            <View style={styles.statisticsSection}>
              <Text style={styles.statisticsSectionTitle}>Course Progress</Text>
              <View style={styles.statisticsGrid}>
                <View style={styles.statisticsItem}>
                  <Text style={styles.statisticsLabel}>On Pace For</Text>
                  <Text style={[
                    styles.statisticsValue,
                    courseProgress.improvement ? styles.underPar : styles.evenPar
                  ]}>
                    {courseProgress.projectedScore}
                  </Text>
                  <Text style={styles.statisticsDetail}>
                    ({courseProgress.vsHistoricalAvg > 0 ? '+' : ''}{courseProgress.vsHistoricalAvg} vs avg)
                  </Text>
                </View>
                
                <View style={styles.statisticsItem}>
                  <Text style={styles.statisticsLabel}>Your Average</Text>
                  <Text style={styles.statisticsValue}>{courseProgress.avgHistoricalScore}</Text>
                  <Text style={styles.statisticsDetail}>({historicalData.totalRounds} rounds)</Text>
                </View>
                
                <View style={styles.statisticsItem}>
                  <Text style={styles.statisticsLabel}>Personal Best</Text>
                  <Text style={[
                    styles.statisticsValue,
                    courseProgress.isOnPaceForPB ? styles.underPar : styles.evenPar
                  ]}>
                    {courseProgress.bestHistoricalScore}
                  </Text>
                  {courseProgress.isOnPaceForPB && (
                    <Text style={styles.statisticsDetail}>🎯 PB Chance!</Text>
                  )}
                </View>
              </View>
              
              {courseProgress.remainingHoles > 0 && courseProgress.neededForPB > 0 && courseProgress.neededForPB <= 6 && (
                <View style={styles.progressPBInfo}>
                  <Text style={styles.progressPBText}>
                    Average {courseProgress.neededForPB.toFixed(1)} on remaining {courseProgress.remainingHoles} holes for personal best!
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Detailed Insights - Show only in detailed level */}
          {(settings.scorecard?.insightDetailLevel || 'standard') === 'detailed' && expandedInsightsData && (
            <View style={styles.statisticsSection}>
              <Text style={styles.statisticsSectionTitle}>Detailed Insights</Text>
              <View style={styles.detailedInsights}>
                {expandedInsightsData.map((insight, index) => (
                  <View key={index} style={[
                    styles.insightItem,
                    styles[`insight${insight.type.charAt(0).toUpperCase()}${insight.type.slice(1)}`]
                  ]}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightIcon}>
                        {insight.type === 'warning' ? '⚠️' :
                         insight.type === 'opportunity' ? '🎯' :
                         insight.type === 'club' ? '🏌️' :
                         insight.type === 'tip' ? '💡' :
                         insight.type === 'strategy' ? '🧠' : '📊'}
                      </Text>
                      <Text style={styles.insightTitle}>{insight.title}</Text>
                    </View>
                    <Text style={styles.insightMessage}>{insight.message}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
            </View>
          )}
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

        {/* Club Selection */}
        {settings.scorecard?.showSmartClubTracking !== false && (
          <View style={styles.clubSelectionCompact}>
            <TouchableOpacity 
              style={[styles.clubSelectButton, currentClub && styles.clubSelectButtonSelected]}
              onPress={() => setShowClubModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.clubSelectButtonContent}>
                <Text style={[styles.clubSelectButtonText, currentClub && styles.clubSelectButtonTextSelected]}>
                  {currentClub ? 
                    `🏌️ ${CLUB_OPTIONS.find(c => c.id === currentClub)?.name || currentClub}` : 
                    '🏌️ Select Club'
                  }
                </Text>
                {smartClubRecommendations.length > 0 && !currentClub && (
                  <Text style={styles.clubSelectHint}>
                    Recommended: {smartClubRecommendations[0]?.name}
                  </Text>
                )}
              </View>
              <Text style={styles.clubSelectArrow}>▸</Text>
            </TouchableOpacity>
          </View>
        )}

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
                  setClubs(prev => ({ ...prev, [currentHole]: null }));
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
      
      {/* Achievement Popup */}
      <AchievementPopup
        visible={showAchievements}
        achievements={currentAchievements}
        onClose={() => {
          setShowAchievements(false);
          setCurrentAchievements([]);
        }}
      />

      {/* Club Selection Modal */}
      <Modal
        visible={showClubModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClubModal(false)}
        onShow={() => {
          // Auto-expand categories with recommendations or current selection
          const categoriesToExpand = {};
          
          // Check which category has the current selection
          if (currentClub) {
            const selectedClub = CLUB_OPTIONS.find(c => c.id === currentClub);
            if (selectedClub) {
              categoriesToExpand[selectedClub.category] = true;
            }
          }
          
          // Check which categories have recommendations
          smartClubRecommendations.forEach(rec => {
            const club = CLUB_OPTIONS.find(c => c.id === rec.id);
            if (club) {
              categoriesToExpand[club.category] = true;
            }
          });
          
          setExpandedCategories(categoriesToExpand);
        }}
      >
        <View style={styles.clubModalContainer}>
          <View style={styles.clubModalHeader}>
            <TouchableOpacity 
              style={styles.clubModalCloseButton}
              onPress={() => setShowClubModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.clubModalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.clubModalTitle}>
              Select Club - Hole {currentHole}
            </Text>
            <View style={styles.clubModalHeaderSpacer} />
          </View>

          <ScrollView style={styles.clubModalContent} showsVerticalScrollIndicator={false}>
            {/* Hole Context */}
            <View style={styles.clubModalHoleInfo}>
              <Text style={styles.clubModalHoleTitle}>
                Hole {currentHole} • Par {currentHoleData.par}
              </Text>
              {currentHoleData.yardage && (
                <Text style={styles.clubModalHoleDistance}>
                  {settings.measurementSystem === 'metric' 
                    ? `${Math.round(currentHoleData.yardage * 0.9144)}m`
                    : `${currentHoleData.yardage} yards`
                  }
                </Text>
              )}
            </View>

            {/* Smart Insights */}
            {smartClubRecommendations.length > 0 && (
              <View style={styles.clubModalInsights}>
                <Text style={styles.clubModalInsightsTitle}>💡 Shot Analysis</Text>
                
                {smartClubRecommendations[0]?.isUsual && (
                  <View style={styles.clubModalInsightCard}>
                    <Text style={styles.clubModalInsightText}>
                      You usually use <Text style={styles.clubModalInsightBold}>{smartClubRecommendations[0].name}</Text> on this hole
                    </Text>
                    <Text style={styles.clubModalInsightSubtext}>
                      Average: {smartClubRecommendations.find(r => r.isUsual)?.reason.match(/\d+\.\d+/)?.[0]} strokes
                    </Text>
                  </View>
                )}

                {smartClubRecommendations.find(r => r.isBest) && (
                  <View style={styles.clubModalInsightCard}>
                    <Text style={styles.clubModalInsightText}>
                      ⭐ Best performer: <Text style={styles.clubModalInsightBold}>{smartClubRecommendations.find(r => r.isBest)?.name}</Text>
                    </Text>
                    <Text style={styles.clubModalInsightSubtext}>
                      {smartClubRecommendations.find(r => r.isBest)?.reason}
                    </Text>
                  </View>
                )}

                {/* Generic advice based on par */}
                <View style={styles.clubModalInsightCard}>
                  <Text style={styles.clubModalInsightText}>
                    💭 Strategy: {
                      currentHoleData.par === 3 ? 'Accuracy over distance - aim for the center of the green' :
                      currentHoleData.par === 4 ? 'Position for your approach shot' :
                      'Distance helps - set up for a manageable second shot'
                    }
                  </Text>
                </View>
              </View>
            )}

            {/* Club Categories */}
            <View style={styles.clubModalCategories}>
              {['woods', 'hybrids', 'irons', 'wedges', 'putter'].map(category => {
                const categoryClubs = CLUB_OPTIONS.filter(club => club.category === category);
                if (categoryClubs.length === 0) return null;

                const isExpanded = expandedCategories[category];
                const categoryEmojis = {
                  woods: '🏌️',
                  hybrids: '⛳',
                  irons: '🏌️‍♂️',
                  wedges: '🎯',
                  putter: '⚪'
                };

                // Count selections and recommendations in this category
                const categoryHasSelection = categoryClubs.some(club => club.id === currentClub);
                const categoryHasRecommendation = categoryClubs.some(club => 
                  smartClubRecommendations.find(r => r.id === club.id)
                );

                return (
                  <View key={category} style={styles.clubModalCategory}>
                    <TouchableOpacity 
                      style={[
                        styles.clubModalCategoryHeader,
                        categoryHasSelection && styles.clubModalCategoryHeaderSelected,
                        categoryHasRecommendation && styles.clubModalCategoryHeaderRecommended
                      ]}
                      onPress={() => toggleCategoryExpansion(category)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.clubModalCategoryHeaderLeft}>
                        <Text style={styles.clubModalCategoryEmoji}>{categoryEmojis[category]}</Text>
                        <Text style={[
                          styles.clubModalCategoryTitle,
                          categoryHasSelection && styles.clubModalCategoryTitleSelected
                        ]}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                        {categoryHasRecommendation && (
                          <View style={styles.clubModalCategoryBadge}>
                            <Text style={styles.clubModalCategoryBadgeText}>★</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.clubModalCategoryArrow,
                        isExpanded && styles.clubModalCategoryArrowExpanded
                      ]}>
                        ▶
                      </Text>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.clubModalCategoryClubs}>
                        {categoryClubs.map(club => {
                          const recommendation = smartClubRecommendations.find(r => r.id === club.id);
                          const isSelected = currentClub === club.id;
                          
                          return (
                            <TouchableOpacity
                              key={club.id}
                              style={[
                                styles.clubModalClubButton,
                                isSelected && styles.clubModalClubButtonSelected,
                                recommendation?.isBest && styles.clubModalClubButtonBest,
                                recommendation?.isUsual && styles.clubModalClubButtonUsual
                              ]}
                              onPress={() => {
                                updateClub(currentHole, club.id);
                                setShowClubModal(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <View style={styles.clubModalClubButtonContent}>
                                <Text style={[
                                  styles.clubModalClubButtonText,
                                  isSelected && styles.clubModalClubButtonTextSelected
                                ]}>
                                  {club.name}
                                </Text>
                                {recommendation && (
                                  <View style={styles.clubModalClubBadges}>
                                    {recommendation.isBest && <Text style={styles.clubModalClubBadge}>⭐</Text>}
                                    {recommendation.isUsual && <Text style={styles.clubModalClubBadge}>📈</Text>}
                                  </View>
                                )}
                              </View>
                              {recommendation && (
                                <Text style={styles.clubModalClubReason}>
                                  {recommendation.reason}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Clear Selection */}
            {currentClub && (
              <TouchableOpacity 
                style={styles.clubModalClearButton}
                onPress={() => {
                  updateClub(currentHole, null);
                  setShowClubModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.clubModalClearButtonText}>No Club Selected</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
      
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
  
  // Statistics Card Styles
  statisticsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statisticsCardCollapsed: {
    backgroundColor: '#f8f9fa',
  },
  statisticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statisticsHeaderContent: {
    flex: 1,
  },
  statisticsToggleIcon: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statisticsContent: {
    marginTop: 16,
  },
  statisticsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statisticsSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statisticsSection: {
    marginBottom: 16,
  },
  statisticsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 12,
  },
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statisticsItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 80,
  },
  statisticsLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  statisticsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statisticsVsPar: {
    fontSize: 11,
    fontWeight: '600',
  },
  statisticsDetail: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginTop: 2,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  difficultyIcon: {
    fontSize: 12,
  },
  difficultyText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  clubRecommendations: {
    gap: 8,
  },
  clubRecommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  clubStats: {
    fontSize: 11,
    color: '#666',
  },
  progressPBInfo: {
    backgroundColor: '#fff3e0',
    borderRadius: 6,
    padding: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
  },
  progressPBText: {
    fontSize: 12,
    color: '#f57c00',
    fontWeight: '600',
    textAlign: 'center',
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
  
  
  // Club Styles (within Statistics Card)
  clubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
    minWidth: 50,
  },
  clubName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  clubRecommended: {
    color: '#2e7d32',
  },
  clubWarning: {
    color: '#d32f2f',
  },
  clubImprovement: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
  },
  clubWarningText: {
    fontSize: 11,
    color: '#d32f2f',
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  confidenceHigh: {
    backgroundColor: '#e8f5e8',
  },
  confidenceMedium: {
    backgroundColor: '#fff3e0',
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  
  // Detailed Insights Styles (within Statistics Card)
  detailedInsights: {
    gap: 8,
  },
  insightItem: {
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  insightIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  insightMessage: {
    fontSize: 12,
    color: '#555',
    lineHeight: 16,
  },
  // Insight type styles
  insightWarning: {
    backgroundColor: '#fff3e0',
    borderLeftColor: '#ff9800',
  },
  insightOpportunity: {
    backgroundColor: '#e8f5e8',
    borderLeftColor: '#4caf50',
  },
  insightClub: {
    backgroundColor: '#e3f2fd',
    borderLeftColor: '#2196f3',
  },
  insightTip: {
    backgroundColor: '#f3e5f5',
    borderLeftColor: '#9c27b0',
  },
  insightStrategy: {
    backgroundColor: '#fce4ec',
    borderLeftColor: '#e91e63',
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
    marginBottom: 6,
    marginTop: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  settingRowCompact: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  settingSubsection: {
    backgroundColor: '#f8f8f8',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingVertical: 4,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  settingSubheading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
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
  insightLevelSelector: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  insightLevelOption: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  insightLevelOptionSelected: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  insightLevelText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  insightLevelTextSelected: {
    color: '#2e7d32',
    fontWeight: '600',
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

  // Club Selection Styles
  clubSelectionCompact: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  clubSelectButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clubSelectButtonSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  clubSelectButtonContent: {
    flex: 1,
  },
  clubSelectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  clubSelectButtonTextSelected: {
    color: '#28a745',
  },
  clubSelectHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  clubSelectArrow: {
    fontSize: 18,
    color: '#666',
    marginLeft: 12,
  },

  // Club Modal Styles
  clubModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  clubModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  clubModalCloseButton: {
    padding: 8,
  },
  clubModalCloseText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  clubModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clubModalHeaderSpacer: {
    width: 60,
  },
  clubModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clubModalHoleInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  clubModalHoleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  clubModalHoleDistance: {
    fontSize: 14,
    color: '#666',
  },
  clubModalInsights: {
    marginBottom: 24,
  },
  clubModalInsightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  clubModalInsightCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  clubModalInsightText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  clubModalInsightBold: {
    fontWeight: '600',
    color: '#ff9800',
  },
  clubModalInsightSubtext: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  clubModalCategories: {
    marginBottom: 20,
  },
  clubModalCategory: {
    marginBottom: 8,
  },
  clubModalCategoryHeader: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clubModalCategoryHeaderSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#28a745',
  },
  clubModalCategoryHeaderRecommended: {
    borderColor: '#ff9800',
    borderWidth: 2,
  },
  clubModalCategoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clubModalCategoryEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  clubModalCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  clubModalCategoryTitleSelected: {
    color: '#28a745',
  },
  clubModalCategoryBadge: {
    backgroundColor: '#ff9800',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  clubModalCategoryBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  clubModalCategoryArrow: {
    fontSize: 16,
    color: '#666',
    transform: [{ rotate: '0deg' }],
  },
  clubModalCategoryArrowExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  clubModalCategoryClubs: {
    paddingTop: 8,
    paddingLeft: 16,
    gap: 8,
  },
  clubModalClubButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clubModalClubButtonSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  clubModalClubButtonBest: {
    borderColor: '#ff9800',
    borderWidth: 2,
  },
  clubModalClubButtonUsual: {
    borderColor: '#2196f3',
    borderWidth: 2,
  },
  clubModalClubButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clubModalClubButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clubModalClubButtonTextSelected: {
    color: '#28a745',
  },
  clubModalClubBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  clubModalClubBadge: {
    fontSize: 16,
  },
  clubModalClubReason: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  clubModalClearButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  clubModalClearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default ScorecardScreen;