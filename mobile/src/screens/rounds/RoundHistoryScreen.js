import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { API_CONFIG } from '../../config/api';

const RoundHistoryScreen = ({ navigation }) => {
  const { token } = useAuth();
  const [rounds, setRounds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'active'

  useEffect(() => {
    loadRounds();
  }, [filter]);

  const loadRounds = async () => {
    try {
      setIsLoading(true);
      
      // First try to load from backend
      if (token) {
        try {
          const url = filter === 'all' 
            ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROUNDS}`
            : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ROUNDS}?status=${filter}`;
            
          console.log('Fetching rounds from:', url);
          
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setRounds(data.data);
              console.log(`Loaded ${data.data.length} rounds from backend`);
              
              // Save to local storage for offline access
              await AsyncStorage.setItem('golf_round_history', JSON.stringify(data.data));
            }
          } else {
            throw new Error('Failed to fetch rounds');
          }
        } catch (error) {
          console.error('Error loading rounds from backend:', error);
          // Fall back to local storage
          await loadLocalRounds();
        }
      } else {
        // No token, load from local storage
        await loadLocalRounds();
      }
    } catch (error) {
      console.error('Error in loadRounds:', error);
      Alert.alert('Error', 'Failed to load round history');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadLocalRounds = async () => {
    try {
      const localRounds = await AsyncStorage.getItem('golf_round_history');
      if (localRounds) {
        const parsedRounds = JSON.parse(localRounds);
        setRounds(parsedRounds);
        console.log(`Loaded ${parsedRounds.length} rounds from local storage`);
      }
    } catch (error) {
      console.error('Error loading local rounds:', error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRounds();
  };

  const navigateToRoundDetail = (round) => {
    // Navigate to round summary or detail screen
    navigation.navigate('RoundSummary', {
      roundData: round,
      course: round.course,
      scores: round.participants?.[0]?.holeScores || [],
      fromHistory: true,
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTotalScore = (round) => {
    const scores = round.participants?.[0]?.holeScores || [];
    const totalStrokes = scores.reduce((sum, score) => sum + score.score, 0);
    const totalPar = scores.reduce((sum, score) => sum + (score.hole?.par || 0), 0);
    
    if (scores.length === 0) return { totalStrokes: 0, totalPar: 0, scoreToPar: 0 };
    
    return {
      totalStrokes,
      totalPar,
      scoreToPar: totalStrokes - totalPar,
      holesPlayed: scores.length,
    };
  };

  const renderRoundItem = ({ item }) => {
    const { totalStrokes, scoreToPar, holesPlayed } = calculateTotalScore(item);
    const isCompleted = item.finishedAt !== null;
    
    return (
      <TouchableOpacity
        style={[styles.roundCard, !isCompleted && styles.activeRoundCard]}
        onPress={() => navigateToRoundDetail(item)}
      >
        <View style={styles.roundHeader}>
          <Text style={styles.courseName}>{item.course?.name || 'Unknown Course'}</Text>
          <View style={[styles.statusBadge, isCompleted ? styles.completedBadge : styles.activeBadge]}>
            <Text style={styles.statusText}>{isCompleted ? 'Completed' : 'Active'}</Text>
          </View>
        </View>
        
        <Text style={styles.courseLocation}>
          {item.course?.location || item.course?.city || 'Location unknown'}
        </Text>
        
        <View style={styles.roundDetails}>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>
              {totalStrokes > 0 ? totalStrokes : '-'}
            </Text>
          </View>
          
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>To Par</Text>
            <Text style={[
              styles.scoreValue,
              scoreToPar < 0 && styles.underPar,
              scoreToPar > 0 && styles.overPar,
            ]}>
              {totalStrokes > 0 ? (scoreToPar > 0 ? `+${scoreToPar}` : scoreToPar) : '-'}
            </Text>
          </View>
          
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreLabel}>Holes</Text>
            <Text style={styles.scoreValue}>{holesPlayed || 0}</Text>
          </View>
        </View>
        
        <Text style={styles.dateText}>
          {formatDate(item.startedAt)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filterValue, label) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterValue && styles.activeFilter]}
      onPress={() => setFilter(filterValue)}
    >
      <Text style={[styles.filterText, filter === filterValue && styles.activeFilterText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No rounds found</Text>
      <Text style={styles.emptySubtext}>
        {filter === 'active' 
          ? 'You have no active rounds'
          : filter === 'completed'
          ? 'You have no completed rounds'
          : 'Start a new round to see it here'}
      </Text>
      <TouchableOpacity
        style={styles.startRoundButton}
        onPress={() => navigation.navigate('StartRound')}
      >
        <Text style={styles.startRoundText}>Start New Round</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading rounds...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Round History</Text>
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('completed', 'Completed')}
          {renderFilterButton('active', 'Active')}
        </View>
      </View>
      
      <FlatList
        data={rounds}
        renderItem={renderRoundItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2E7D32']}
          />
        }
        ListEmptyComponent={renderEmptyList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  activeFilter: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  filterText: {
    fontSize: 14,
    color: '#666666',
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  roundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeRoundCard: {
    borderWidth: 2,
    borderColor: '#FFA726',
  },
  roundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
  },
  activeBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  courseLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  roundDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 12,
  },
  scoreInfo: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  underPar: {
    color: '#2E7D32',
  },
  overPar: {
    color: '#D32F2F',
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999999',
    marginBottom: 24,
    textAlign: 'center',
  },
  startRoundButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startRoundText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoundHistoryScreen;