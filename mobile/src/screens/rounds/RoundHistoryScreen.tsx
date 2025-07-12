import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiWrapper } from '@/services/api/apiWrapper';
import { Round } from '@/types';

const RoundHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRounds();
  }, []);

  const loadRounds = async () => {
    try {
      setIsLoading(true);
      const response = await apiWrapper.get('/rounds');
      if (response.success && response.data) {
        setRounds(response.data);
      } else {
        Alert.alert('Error', 'Failed to load rounds');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRounds();
    setRefreshing(false);
  };

  const handleRoundPress = (round: Round) => {
    if (round.status === 'active') {
      navigation.navigate('PlayRound', { roundId: round.id });
    } else {
      navigation.navigate('RoundSummary', { round });
    }
  };

  const calculateScore = (round: Round) => {
    if (!round.scores || round.scores.length === 0) return null;
    
    const totalStrokes = round.scores.reduce((sum, score) => sum + score.strokes, 0);
    const totalPar = round.scores.reduce((sum, score) => sum + score.hole.par, 0);
    const scoreToPar = totalStrokes - totalPar;
    
    return { totalStrokes, totalPar, scoreToPar };
  };

  const formatScoreToPar = (scoreToPar: number) => {
    if (scoreToPar === 0) return 'E';
    return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'completed':
        return '#2196f3';
      case 'abandoned':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'abandoned':
        return 'Abandoned';
      default:
        return status;
    }
  };

  const renderRoundItem = ({ item }: { item: Round }) => {
    const score = calculateScore(item);
    
    return (
      <TouchableOpacity
        style={styles.roundCard}
        onPress={() => handleRoundPress(item)}
      >
        <View style={styles.roundHeader}>
          <Text style={styles.courseName}>{item.course?.name || 'Unknown Course'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        
        <Text style={styles.roundDate}>
          {new Date(item.startedAt).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        
        {item.course?.location && (
          <Text style={styles.courseLocation}>{item.course.location}</Text>
        )}
        
        {score && (
          <View style={styles.scoreContainer}>
            <Text style={styles.totalScore}>{score.totalStrokes} strokes</Text>
            <Text style={[
              styles.scoreToPar,
              score.scoreToPar === 0 ? styles.evenPar :
              score.scoreToPar > 0 ? styles.overPar : styles.underPar
            ]}>
              {formatScoreToPar(score.scoreToPar)}
            </Text>
          </View>
        )}
        
        <View style={styles.roundStats}>
          <Text style={styles.statsText}>
            {item.scores?.length || 0} of {item.course?.holes?.length || 0} holes
          </Text>
          {item.tees && (
            <Text style={styles.statsText}>Tees: {item.tees}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Rounds Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start your first round to see your golf history
      </Text>
      <TouchableOpacity
        style={styles.startRoundButton}
        onPress={() => navigation.navigate('StartRound')}
      >
        <Text style={styles.startRoundButtonText}>Start Round</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Round History</Text>
        <TouchableOpacity
          style={styles.newRoundButton}
          onPress={() => navigation.navigate('StartRound')}
        >
          <Text style={styles.newRoundButtonText}>+ New Round</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rounds}
        renderItem={renderRoundItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={rounds.length === 0 ? styles.emptyContainer : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5234',
  },
  newRoundButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newRoundButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  roundCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    color: '#2c5234',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  roundDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  courseLocation: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scoreToPar: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  evenPar: {
    color: '#666',
  },
  overPar: {
    color: '#f44336',
  },
  underPar: {
    color: '#4caf50',
  },
  roundStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c5234',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  startRoundButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startRoundButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoundHistoryScreen;