import React, { useState, useEffect, useMemo } from 'react';
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
import CourseMapView from './MapViewMapLibre';
import SharedHeader from './SharedHeader';

const { width } = Dimensions.get('window');
const Tab = createMaterialTopTabNavigator();

const ScorecardContainer = ({ route, navigation }) => {
  const { round, course } = route.params;
  const { token } = useAuth();
  const { settings, updateSettings } = useSettings();
  
  // All shared state that both Scorecard and Map need
  const [scores, setScores] = useState({});
  const [putts, setPutts] = useState({});
  const [clubs, setClubs] = useState({});
  const [currentHole, setCurrentHole] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingRound, setIsSavingRound] = useState(false);
  const [historicalData, setHistoricalData] = useState(null);
  const [clubData, setClubData] = useState(null);
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

  // Initialize component
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
        saveScores();
      } else if (nextAppState === 'active') {
        loadScores();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Load scores from AsyncStorage
  const loadScores = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setScores(parsedData.scores || {});
        setPutts(parsedData.putts || {});
        setClubs(parsedData.clubs || {});
        setCurrentHole(parsedData.currentHole || 1);
      }
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
        scores,
        putts,
        clubs,
        currentHole,
        lastUpdated: new Date().toISOString(),
      };
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

  // Handle settings modal
  const handleSettings = () => {
    setShowSettings(true);
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
    showSettings,
    setShowSettings,
    isSavingRound,
    setIsSavingRound,
    historicalData,
    clubData,
    showAchievements,
    setShowAchievements,
    currentAchievements,
    setCurrentAchievements,
    courseStats,
    showClubModal,
    setShowClubModal,
    expandedCategories,
    setExpandedCategories,
    CLUB_OPTIONS,
    navigation,
    token,
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
    showSettings,
    isSavingRound,
    historicalData,
    clubData,
    showAchievements,
    currentAchievements,
    courseStats,
    showClubModal,
    expandedCategories,
    navigation,
    token,
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

  return (
    <View style={styles.container}>
      <SharedHeader
        navigation={navigation}
        onSettingsPress={handleSettings}
        title="Scorecard"
      />
      
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2e7d32',
          tabBarInactiveTintColor: '#666',
          tabBarIndicatorStyle: { backgroundColor: '#2e7d32' },
          tabBarStyle: { backgroundColor: '#fff' },
          tabBarLabelStyle: { fontSize: 16, fontWeight: 'bold' },
        }}
      >
        <Tab.Screen 
          name="Score"
          children={() => <ScorecardView {...sharedProps} />}
        />
        <Tab.Screen 
          name="Map"
          children={() => <CourseMapView {...sharedProps} />}
        />
      </Tab.Navigator>
      
      {/* Achievement Popup */}
      <AchievementPopup
        visible={showAchievements}
        achievements={currentAchievements}
        onClose={() => setShowAchievements(false)}
      />
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ScorecardContainer;