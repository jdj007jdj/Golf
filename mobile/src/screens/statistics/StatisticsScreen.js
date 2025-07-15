import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { API_CONFIG } from '../../config/api';
import {
  calculateCourseAverages,
  findBestWorstRounds,
  calculateRollingAverages,
  detectPerformanceTrends,
  analyzeClubUsage,
  analyzeClubPerformanceCorrelation,
  getCoursePerformanceSummary,
} from '../../utils/coursePerformanceUtils';

const { width } = Dimensions.get('window');

const StatisticsScreen = ({ navigation }) => {
  const { token } = useAuth();
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [rounds, setRounds] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [dateRange, setDateRange] = useState('all'); // all, last30, last90, thisYear
  const [showDateModal, setShowDateModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [clubStats, setClubStats] = useState(null);
  const [performanceTrends, setPerformanceTrends] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (rounds.length > 0) {
      calculateStatistics();
    }
  }, [rounds, selectedCourse, dateRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load rounds from API
      const roundsResponse = await fetch(`${API_CONFIG.BASE_URL}/rounds`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (roundsResponse.ok) {
        const roundsData = await roundsResponse.json();
        console.log('API Response:', roundsData); // Debug log
        
        // Handle the API response format (success/data structure)
        let roundsList = [];
        if (roundsData.success && roundsData.data) {
          roundsList = roundsData.data;
        } else if (roundsData.rounds) {
          roundsList = roundsData.rounds;
        } else if (Array.isArray(roundsData)) {
          roundsList = roundsData;
        }
        
        console.log('Rounds list:', roundsList); // Debug log
        setRounds(roundsList);
        
        // Extract unique courses
        const uniqueCourses = roundsList.reduce((acc, round) => {
          if (round.course && !acc.find(c => c.id === round.course.id)) {
            acc.push(round.course);
          }
          return acc;
        }, []);
        setCourses(uniqueCourses);
      } else {
        console.error('API Error:', roundsResponse.status, roundsResponse.statusText);
        // Try to get error message
        try {
          const errorData = await roundsResponse.json();
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('API URL:', `${API_CONFIG.BASE_URL}/rounds`);
      
      // Try to load from local storage as fallback
      try {
        const localRounds = await AsyncStorage.getItem('golf_round_history');
        if (localRounds) {
          const parsedRounds = JSON.parse(localRounds);
          console.log('Loaded from local storage:', parsedRounds.length, 'rounds');
          setRounds(parsedRounds);
          
          // Extract unique courses from local data
          const uniqueCourses = parsedRounds.reduce((acc, round) => {
            if (round.course && !acc.find(c => c.id === round.course.id)) {
              acc.push(round.course);
            }
            return acc;
          }, []);
          setCourses(uniqueCourses);
        }
      } catch (localError) {
        console.error('Error loading from local storage:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredRounds = () => {
    let filtered = [...rounds];
    
    // Filter by course
    if (selectedCourse) {
      filtered = filtered.filter(round => round.course?.id === selectedCourse.id);
    }
    
    // Filter by date range
    const now = new Date();
    switch (dateRange) {
      case 'last30':
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        filtered = filtered.filter(round => new Date(round.createdAt) >= thirtyDaysAgo);
        break;
      case 'last90':
        const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
        filtered = filtered.filter(round => new Date(round.createdAt) >= ninetyDaysAgo);
        break;
      case 'thisYear':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        filtered = filtered.filter(round => new Date(round.createdAt) >= startOfYear);
        break;
    }
    
    return filtered;
  };

  const calculateStatistics = () => {
    const filteredRounds = getFilteredRounds();
    
    if (filteredRounds.length === 0) {
      setStatistics(null);
      setClubStats(null);
      setPerformanceTrends(null);
      return;
    }
    
    // Calculate overall statistics
    const totalScore = filteredRounds.reduce((sum, round) => {
      const roundTotal = Object.values(round.holes || {}).reduce((total, score) => total + (score || 0), 0);
      return sum + roundTotal;
    }, 0);
    
    const averageScore = totalScore / filteredRounds.length;
    
    // Calculate course-specific stats if a course is selected
    let courseStats = null;
    if (selectedCourse) {
      courseStats = getCoursePerformanceSummary(filteredRounds, selectedCourse);
    }
    
    // Calculate performance trends
    const trends = selectedCourse 
      ? detectPerformanceTrends(filteredRounds, selectedCourse)
      : null;
    
    // Calculate club statistics
    const clubAnalysis = selectedCourse
      ? analyzeClubPerformanceCorrelation(filteredRounds, selectedCourse)
      : null;
    
    setStatistics({
      totalRounds: filteredRounds.length,
      averageScore,
      bestRound: Math.min(...filteredRounds.map(r => Object.values(r.holes || {}).reduce((sum, s) => sum + (s || 0), 0))),
      worstRound: Math.max(...filteredRounds.map(r => Object.values(r.holes || {}).reduce((sum, s) => sum + (s || 0), 0))),
      courseStats,
    });
    
    setPerformanceTrends(trends);
    setClubStats(clubAnalysis);
  };

  const renderDateRangeButton = () => {
    const dateRangeLabels = {
      all: 'All Time',
      last30: 'Last 30 Days',
      last90: 'Last 90 Days',
      thisYear: 'This Year',
    };
    
    return (
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setShowDateModal(true)}
      >
        <Text style={styles.filterButtonText}>{dateRangeLabels[dateRange]}</Text>
        <Text style={styles.filterButtonIcon}>▼</Text>
      </TouchableOpacity>
    );
  };

  const renderCourseButton = () => {
    return (
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setShowCourseModal(true)}
      >
        <Text style={styles.filterButtonText}>
          {selectedCourse ? selectedCourse.name : 'All Courses'}
        </Text>
        <Text style={styles.filterButtonIcon}>▼</Text>
      </TouchableOpacity>
    );
  };

  const renderStatisticsCard = (title, value, subtitle = null, trend = null) => {
    return (
      <View style={styles.statCard}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        {trend && (
          <View style={styles.trendContainer}>
            <Text style={[styles.trendText, { color: trend > 0 ? '#d32f2f' : '#2e7d32' }]}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Statistics</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.filterContainer}>
        {renderDateRangeButton()}
        {renderCourseButton()}
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {statistics && statistics.totalRounds > 0 ? (
          <>
            {/* Overview Stats */}
            <View style={styles.overviewSection}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statsGrid}>
                {renderStatisticsCard(
                  'Rounds Played',
                  statistics.totalRounds.toString(),
                  dateRange === 'all' ? 'All time' : null
                )}
                {renderStatisticsCard(
                  'Average Score',
                  statistics.averageScore.toFixed(1),
                  null,
                  performanceTrends?.improvement
                )}
                {renderStatisticsCard(
                  'Best Round',
                  statistics.bestRound.toString(),
                  null
                )}
                {renderStatisticsCard(
                  'Worst Round',
                  statistics.worstRound.toString(),
                  null
                )}
              </View>
            </View>
            
            {/* Performance Trends */}
            {performanceTrends && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance Trends</Text>
                <View style={styles.trendCard}>
                  <Text style={styles.trendLabel}>
                    Current Trend: {performanceTrends.trend}
                  </Text>
                  {performanceTrends.improvement !== 0 && (
                    <Text style={[
                      styles.trendValue,
                      { color: performanceTrends.improvement > 0 ? '#d32f2f' : '#2e7d32' }
                    ]}>
                      {performanceTrends.improvement > 0 ? '+' : ''}{performanceTrends.improvement.toFixed(1)} strokes
                    </Text>
                  )}
                  <Text style={styles.trendDescription}>
                    {performanceTrends.description}
                  </Text>
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>Confidence: </Text>
                    <Text style={[
                      styles.confidenceValue,
                      { color: performanceTrends.confidenceRating === 'high' ? '#2e7d32' : 
                               performanceTrends.confidenceRating === 'medium' ? '#ff9800' : '#f44336' }
                    ]}>
                      {performanceTrends.confidenceRating.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Club Performance */}
            {clubStats && clubStats.overallClubStats && Object.keys(clubStats.overallClubStats).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Club Performance</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Object.entries(clubStats.overallClubStats)
                    .sort((a, b) => b[1].totalUses - a[1].totalUses)
                    .slice(0, 5)
                    .map(([club, stats]) => (
                      <View key={club} style={styles.clubCard}>
                        <Text style={styles.clubName}>{club.toUpperCase()}</Text>
                        <Text style={styles.clubStat}>Avg: {stats.averageScore.toFixed(1)}</Text>
                        <Text style={styles.clubUses}>{stats.totalUses} uses</Text>
                      </View>
                    ))}
                </ScrollView>
              </View>
            )}
            
            {/* Course-specific Stats */}
            {statistics.courseStats && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Course Performance</Text>
                <View style={styles.courseStatsContainer}>
                  <View style={styles.courseStatRow}>
                    <Text style={styles.courseStatLabel}>Course Average:</Text>
                    <Text style={styles.courseStatValue}>
                      {statistics.courseStats.averageScore.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.courseStatRow}>
                    <Text style={styles.courseStatLabel}>Best Holes:</Text>
                    <Text style={styles.courseStatValue}>
                      {statistics.courseStats.bestHoles.map(h => `#${h.holeNumber}`).join(', ')}
                    </Text>
                  </View>
                  <View style={styles.courseStatRow}>
                    <Text style={styles.courseStatLabel}>Worst Holes:</Text>
                    <Text style={styles.courseStatValue}>
                      {statistics.courseStats.worstHoles.map(h => `#${h.holeNumber}`).join(', ')}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No statistics available</Text>
            <Text style={styles.emptySubtext}>
              {selectedCourse 
                ? `No rounds found for ${selectedCourse.name} in this time period`
                : 'Start playing rounds to see your statistics'}
            </Text>
            <TouchableOpacity 
              style={styles.startRoundButton}
              onPress={() => navigation.navigate('CourseList')}
            >
              <Text style={styles.startRoundButtonText}>Start a Round</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      {/* Date Range Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowDateModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            {['all', 'last30', 'last90', 'thisYear'].map((range) => (
              <TouchableOpacity
                key={range}
                style={[
                  styles.modalOption,
                  dateRange === range && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setDateRange(range);
                  setShowDateModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  dateRange === range && styles.modalOptionTextSelected
                ]}>
                  {range === 'all' && 'All Time'}
                  {range === 'last30' && 'Last 30 Days'}
                  {range === 'last90' && 'Last 90 Days'}
                  {range === 'thisYear' && 'This Year'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Course Selection Modal */}
      <Modal
        visible={showCourseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCourseModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowCourseModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Course</Text>
            <TouchableOpacity
              style={[
                styles.modalOption,
                !selectedCourse && styles.modalOptionSelected
              ]}
              onPress={() => {
                setSelectedCourse(null);
                setShowCourseModal(false);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                !selectedCourse && styles.modalOptionTextSelected
              ]}>
                All Courses
              </Text>
            </TouchableOpacity>
            {courses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.modalOption,
                  selectedCourse?.id === course.id && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setSelectedCourse(course);
                  setShowCourseModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedCourse?.id === course.id && styles.modalOptionTextSelected
                ]}>
                  {course.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  filterButtonIcon: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  overviewSection: {
    padding: 20,
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 50) / 2,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  statSubtitle: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  trendContainer: {
    marginTop: 5,
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  trendCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  trendValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  trendDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  confidenceContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  clubCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clubName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  clubStat: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  clubUses: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  courseStatsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  courseStatRow: {
    borderBottomWidth: 0,
  },
  courseStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  courseStatValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
  },
  startRoundButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startRoundButtonText: {
    color: 'white',
    fontSize: 16,
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
    borderRadius: 10,
    padding: 20,
    width: width * 0.8,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalOptionSelected: {
    backgroundColor: '#e8f5e9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOptionTextSelected: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
});

export default StatisticsScreen;