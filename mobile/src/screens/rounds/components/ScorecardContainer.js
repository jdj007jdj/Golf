import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  AppState,
  ActivityIndicator,
} from 'react-native';

console.log('🔍 ScorecardContainer: Starting imports...');

// Import dependencies with error handling
let createMaterialTopTabNavigator;
try {
  createMaterialTopTabNavigator = require('@react-navigation/material-top-tabs').createMaterialTopTabNavigator;
  console.log('✅ ScorecardContainer: Successfully imported material-top-tabs');
} catch (error) {
  console.error('❌ ScorecardContainer: Failed to import material-top-tabs:', error);
}

let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
  console.log('✅ ScorecardContainer: Successfully imported AsyncStorage');
} catch (error) {
  console.error('❌ ScorecardContainer: Failed to import AsyncStorage:', error);
}

let useAuth, useSettings;
try {
  useAuth = require('../../../contexts/AuthContext').useAuth;
  useSettings = require('../../../contexts/SettingsContext').useSettings;
  console.log('✅ ScorecardContainer: Successfully imported contexts');
} catch (error) {
  console.error('❌ ScorecardContainer: Failed to import contexts:', error);
}

let API_CONFIG;
try {
  API_CONFIG = require('../../../config/api').API_CONFIG;
  console.log('✅ ScorecardContainer: Successfully imported API_CONFIG');
} catch (error) {
  console.error('❌ ScorecardContainer: Failed to import API_CONFIG:', error);
}

let coursePerformanceUtils;
try {
  coursePerformanceUtils = require('../../../utils/coursePerformanceUtils');
  console.log('✅ ScorecardContainer: Successfully imported coursePerformanceUtils');
} catch (error) {
  console.error('❌ ScorecardContainer: Failed to import coursePerformanceUtils:', error);
}

let AchievementPopup;
try {
  AchievementPopup = require('../../../components/AchievementPopup').default;
  console.log('✅ ScorecardContainer: Successfully imported AchievementPopup');
} catch (error) {
  console.error('❌ ScorecardContainer: Failed to import AchievementPopup:', error);
}

let ScorecardView;
try {
  ScorecardView = require('./ScorecardView').default;
  console.log('✅ ScorecardContainer: Successfully imported ScorecardView');
} catch (error) {
  console.error('❌ ScorecardContainer: Failed to import ScorecardView:', error);
}

let CourseMapView;
try {
  CourseMapView = require('./MapView').default;
  console.log('✅ ScorecardContainer: Successfully imported CourseMapView');
} catch (error) {
  console.error('❌ ScorecardContainer: Failed to import CourseMapView:', error);
}

let SharedHeader;
try {
  SharedHeader = require('./SharedHeader').default;
  console.log('✅ ScorecardContainer: Successfully imported SharedHeader');
} catch (error) {
  console.error('❌ ScorecardContainer: Failed to import SharedHeader:', error);
}

const { width } = Dimensions.get('window');
let Tab;

const ScorecardContainer = ({ route, navigation }) => {
  console.log('🔍 ScorecardContainer: Starting component render...');
  
  // Check if all required imports are available
  const missingImports = [];
  if (!createMaterialTopTabNavigator) missingImports.push('material-top-tabs');
  if (!AsyncStorage) missingImports.push('AsyncStorage');
  if (!useAuth) missingImports.push('useAuth');
  if (!useSettings) missingImports.push('useSettings');
  if (!ScorecardView) missingImports.push('ScorecardView');
  if (!CourseMapView) missingImports.push('CourseMapView');
  if (!SharedHeader) missingImports.push('SharedHeader');
  
  if (missingImports.length > 0) {
    console.error('❌ ScorecardContainer: Missing imports:', missingImports);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Component Import Errors</Text>
        <Text style={styles.errorDetails}>
          Missing: {missingImports.join(', ')}
        </Text>
      </View>
    );
  }
  
  // Initialize Tab navigator
  try {
    Tab = createMaterialTopTabNavigator();
    console.log('✅ ScorecardContainer: Tab navigator initialized');
  } catch (error) {
    console.error('❌ ScorecardContainer: Failed to initialize Tab navigator:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Tab Navigator Error</Text>
        <Text style={styles.errorDetails}>{error.toString()}</Text>
      </View>
    );
  }
  
  // Get route params
  let round, course;
  try {
    ({ round, course } = route.params);
    console.log('✅ ScorecardContainer: Route params extracted:', { round: !!round, course: !!course });
  } catch (error) {
    console.error('❌ ScorecardContainer: Failed to extract route params:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Route Parameters Error</Text>
        <Text style={styles.errorDetails}>{error.toString()}</Text>
      </View>
    );
  }
  
  // Initialize contexts
  let token, settings, updateSettings;
  try {
    ({ token } = useAuth());
    ({ settings, updateSettings } = useSettings());
    console.log('✅ ScorecardContainer: Contexts initialized');
  } catch (error) {
    console.error('❌ ScorecardContainer: Failed to initialize contexts:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Context Initialization Error</Text>
        <Text style={styles.errorDetails}>{error.toString()}</Text>
      </View>
    );
  }
  
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
      console.log('🔍 ScorecardContainer: Loading historical data...');
      const roundsData = await AsyncStorage.getItem('golf_round_history');
      if (roundsData) {
        const rounds = JSON.parse(roundsData);
        console.log('✅ ScorecardContainer: Found', rounds.length, 'rounds in history');
        
        // Use the imported coursePerformanceUtils object
        const courseRounds = coursePerformanceUtils.filterRoundsByCourse(rounds, course.id);
        console.log('✅ ScorecardContainer: Found', courseRounds.length, 'rounds for this course');
        
        if (courseRounds.length > 0) {
          const holeAnalysis = {};
          holes.forEach(hole => {
            holeAnalysis[hole.holeNumber] = coursePerformanceUtils.calculateHolePerformance(courseRounds, hole.holeNumber);
          });
          
          const clubAnalysis = coursePerformanceUtils.analyzeClubUsage(courseRounds);
          
          setHistoricalData(holeAnalysis);
          setClubData(clubAnalysis);
          console.log('✅ ScorecardContainer: Historical data loaded successfully');
        }
      } else {
        console.log('ℹ️  ScorecardContainer: No historical data found');
      }
    } catch (error) {
      console.error('❌ ScorecardContainer: Error loading historical data:', error);
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

  // Shared props for both tabs
  const sharedProps = {
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ScorecardContainer;