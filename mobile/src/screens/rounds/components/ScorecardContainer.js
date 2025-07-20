import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../contexts/AuthContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { API_CONFIG } from '../../../config/api';
import { 
  calculateHolePerformance, 
  filterRoundsByCourse, 
  analyzeClubUsage, 
  getClubInsightsForScorecard, 
  detectAchievements, 
  getCourseStats 
} from '../../../utils/coursePerformanceUtils';
import AchievementPopup from '../../../components/AchievementPopup';
import ScorecardView from './ScorecardView';
import FriendsView from './FriendsView';
import SharedHeader from './SharedHeader';
import { ScorecardProvider, useScorecardContext } from '../contexts/ScorecardContext';

const { width } = Dimensions.get('window');
const Tab = createMaterialTopTabNavigator();

// Create stable component references for tabs
const ScorecardTab = React.memo(() => {
  const contextValue = useScorecardContext();
  return <ScorecardView {...contextValue} />;
});

const FriendsTab = React.memo(() => {
  return <FriendsView />;
});

const ScorecardContainer = ({ route, navigation }) => {
  const { round, course } = route.params;
  const { token, isLocalAccount } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  // All shared state that both Scorecard and Map need
  const [scores, setScores] = useState({});
  const [putts, setPutts] = useState({});
  const [clubs, setClubs] = useState({});
  const [currentHole, setCurrentHole] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRound, setIsSavingRound] = useState(false);
  const [historicalData, setHistoricalData] = useState(null);
  const [clubData, setClubData] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [currentAchievements, setCurrentAchievements] = useState([]);
  const [courseStats, setCourseStats] = useState(null);
  // showClubModal removed - using SmartClubSelector now
  const [expandedCategories, setExpandedCategories] = useState({});
  const [stateRestored, setStateRestored] = useState(false);
  
  // Refs to track latest state values for saving
  const scoresRef = useRef(scores);
  const puttsRef = useRef(putts);
  const clubsRef = useRef(clubs);
  const currentHoleRef = useRef(currentHole);
  
  // Update refs when state changes
  useEffect(() => {
    scoresRef.current = scores;
    puttsRef.current = putts;
    clubsRef.current = clubs;
    currentHoleRef.current = currentHole;
  }, [scores, putts, clubs, currentHole]);
  
  // Storage keys for this specific round
  const STORAGE_KEY = `golf_round_${round?.id || 'temp'}_scores`;
  const STATE_STORAGE_KEY = `golf_round_${round?.id || 'temp'}_state`;
  
  // Get holes from course data, fallback to default 18 holes
  const holes = course.holes || Array.from({ length: 18 }, (_, i) => ({
    id: `default-${i + 1}`,
    holeNumber: i + 1,
    par: i + 1 <= 4 ? 4 : i + 1 <= 10 ? (i + 1) % 2 === 0 ? 5 : 3 : 4, // Mixed pars
  }));

  // Club selection options moved to clubService

  // Initialize component
  useEffect(() => {
    console.log('[ScorecardContainer] Component mounting');
    // Always try to load saved state first
    const initializeState = async () => {
      await loadScores();
      await loadHistoricalData();
      await loadCourseSettings();
    };
    initializeState();
    
    return () => {
      console.log('[ScorecardContainer] Component unmounting');
      // Force save state before unmounting using refs
      saveScores();
    };
  }, [round?.id]); // Re-initialize if round ID changes

  // Save scores to AsyncStorage whenever scores change
  useEffect(() => {
    if (!isLoading && stateRestored) {
      saveScores();
    }
  }, [scores, putts, clubs, currentHole, isLoading, stateRestored]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('[ScorecardContainer] App going to background, saving state');
        saveScores();
      } else if (nextAppState === 'active') {
        console.log('[ScorecardContainer] App coming to foreground, loading state');
        loadScores();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Reload state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[ScorecardContainer] Screen focused, reloading state');
      loadScores();
      return () => {
        console.log('[ScorecardContainer] Screen losing focus, saving state');
        saveScores();
      };
    }, [])
  );

  // Load scores from AsyncStorage
  const loadScores = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Only update state if we have actual data or if current state is empty
        const hasCurrentScores = Object.keys(scoresRef.current).length > 0;
        const hasSavedScores = Object.keys(parsedData.scores || {}).length > 0;
        
        // Don't overwrite existing scores with empty saved data
        if (!hasCurrentScores || hasSavedScores) {
          setScores(parsedData.scores || {});
          setPutts(parsedData.putts || {});
          setClubs(parsedData.clubs || {});
          setCurrentHole(parsedData.currentHole || 1);
          
          console.log('[ScorecardContainer] Restored state:', {
            currentHole: parsedData.currentHole || 1,
            scoresCount: Object.keys(parsedData.scores || {}).length,
            puttsCount: Object.keys(parsedData.putts || {}).length,
            hadCurrentScores: hasCurrentScores,
            hasSavedScores: hasSavedScores
          });
        } else {
          console.log('[ScorecardContainer] Skipped restore - would overwrite existing scores with empty data');
        }
      }
      setStateRestored(true);
    } catch (error) {
      console.error('Error loading scores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save scores to AsyncStorage
  const saveScores = async () => {
    try {
      const dataToSave = {
        scores: scoresRef.current,
        putts: puttsRef.current,
        clubs: clubsRef.current,
        currentHole: currentHoleRef.current,
        lastUpdated: new Date().toISOString(),
      };
      console.log('[ScorecardContainer] Saving state:', {
        currentHole: currentHoleRef.current,
        scoresCount: Object.keys(scoresRef.current).length,
        puttsCount: Object.keys(puttsRef.current).length
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving scores:', error);
    }
  };

  // Load historical data for insights
  const loadHistoricalData = async () => {
    try {
      const roundsData = await AsyncStorage.getItem('golf_round_history');
      if (roundsData) {
        const rounds = JSON.parse(roundsData);
        const courseRounds = filterRoundsByCourse(rounds, course.id);
        
        if (courseRounds.length > 0) {
          const holeAnalysis = {};
          holes.forEach(hole => {
            holeAnalysis[hole.holeNumber] = calculateHolePerformance(courseRounds, hole.holeNumber);
          });
          
          const clubAnalysis = analyzeClubUsage(courseRounds);
          
          setHistoricalData(holeAnalysis);
          setClubData(clubAnalysis);
        }
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  };

  // Load course-specific settings
  const loadCourseSettings = async () => {
    try {
      const statsData = await AsyncStorage.getItem('golf_course_stats');
      if (statsData) {
        const stats = JSON.parse(statsData);
        setCourseStats(stats[course.id] || null);
      }
    } catch (error) {
      console.error('Error loading course settings:', error);
    }
  };

  // Handle settings navigation
  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  // Handle map navigation
  const handleMapPress = () => {
    navigation.navigate('Map', { round, course });
  };

  // Shared props for both tabs - memoized to prevent unnecessary re-renders
  const sharedProps = useMemo(() => ({
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
    isLoading,
    isSavingRound,
    setIsSavingRound,
    historicalData,
    clubData,
    showAchievements,
    setShowAchievements,
    currentAchievements,
    setCurrentAchievements,
    courseStats,
    // showClubModal and setShowClubModal removed - using SmartClubSelector now
    expandedCategories,
    setExpandedCategories,
    // CLUB_OPTIONS removed - using clubService now
    navigation,
    token,
    isLocalAccount,
    settings,
    updateSettings,
  }), [
    round,
    course,
    holes,
    scores,
    putts,
    clubs,
    currentHole,
    isLoading,
    isSavingRound,
    historicalData,
    clubData,
    showAchievements,
    currentAchievements,
    courseStats,
    // showClubModal removed - using SmartClubSelector now
    expandedCategories,
    navigation,
    token,
    isLocalAccount,
    settings
  ]);


  // Show loading indicator while loading scores
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading scorecard...</Text>
      </View>
    );
  }

  console.log('[ScorecardContainer] Rendering with props:', {
    round: round?.id,
    course: course?.id,
    isLoading,
    hasScores: Object.keys(scores).length > 0
  });

  return (
    <ScorecardProvider value={sharedProps}>
      <View style={styles.container}>
        <SharedHeader
          navigation={navigation}
          onSettingsPress={handleSettings}
          onMapPress={handleMapPress}
          showMapButton={true}
          title="Scorecard"
        />
        
        <Tab.Navigator
          key={round?.id || 'scorecard-tabs'}
          initialRouteName="Score"
          screenOptions={{
            tabBarActiveTintColor: '#2e7d32',
            tabBarInactiveTintColor: '#666',
            tabBarIndicatorStyle: { backgroundColor: '#2e7d32' },
            tabBarStyle: { backgroundColor: '#fff' },
            tabBarLabelStyle: { fontSize: 16, fontWeight: 'bold' },
            animationEnabled: false, // Disable animations to prevent view hierarchy issues
          }}
          screenListeners={{
            state: (e) => {
              console.log('[ScorecardContainer] Tab navigation state changed:', e.data.state);
            },
          }}
        >
          <Tab.Screen 
            name="Friends"
            component={FriendsTab}
            options={{ lazy: true }}
          />
          <Tab.Screen 
            name="Score"
            component={ScorecardTab}
            options={{ lazy: true }}
          />
        </Tab.Navigator>
        
        {/* Achievement Popup */}
        <AchievementPopup
          visible={showAchievements}
          achievements={currentAchievements}
          onClose={() => setShowAchievements(false)}
        />
      </View>
    </ScorecardProvider>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ScorecardContainer;