import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Round, Score } from '@/types';

interface RoundSummaryParams {
  round: Round;
}

const RoundSummaryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { round } = route.params as RoundSummaryParams;

  const calculateRoundStats = () => {
    if (!round.scores || round.scores.length === 0) {
      return {
        totalStrokes: 0,
        totalPar: 0,
        scoreToPar: 0,
        totalPutts: 0,
        averagePutts: 0,
        birdies: 0,
        pars: 0,
        bogeys: 0,
        doubleBogeys: 0,
        others: 0,
      };
    }

    const totalStrokes = round.scores.reduce((sum, score) => sum + score.strokes, 0);
    const totalPar = round.scores.reduce((sum, score) => sum + score.hole.par, 0);
    const totalPutts = round.scores.reduce((sum, score) => sum + (score.putts || 0), 0);
    const scoreToPar = totalStrokes - totalPar;

    let birdies = 0, pars = 0, bogeys = 0, doubleBogeys = 0, others = 0;

    round.scores.forEach((score) => {
      const diff = score.strokes - score.hole.par;
      if (diff <= -2) others++;
      else if (diff === -1) birdies++;
      else if (diff === 0) pars++;
      else if (diff === 1) bogeys++;
      else if (diff === 2) doubleBogeys++;
      else others++;
    });

    return {
      totalStrokes,
      totalPar,
      scoreToPar,
      totalPutts,
      averagePutts: round.scores.length > 0 ? totalPutts / round.scores.length : 0,
      birdies,
      pars,
      bogeys,
      doubleBogeys,
      others,
    };
  };

  const formatScoreToPar = (scoreToPar: number) => {
    if (scoreToPar === 0) return 'Even';
    return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
  };

  const getScoreColor = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff <= -2) return '#ff9800'; // Eagle or better
    if (diff === -1) return '#4caf50'; // Birdie
    if (diff === 0) return '#2196f3'; // Par
    if (diff === 1) return '#ff5722'; // Bogey
    return '#f44336'; // Double bogey or worse
  };

  const getScoreText = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (diff <= -2) return diff === -2 ? 'Eagle' : 'Albatross';
    if (diff === -1) return 'Birdie';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double';
    return `+${diff}`;
  };

  const stats = calculateRoundStats();

  const renderScoreCard = () => (
    <View style={styles.scoreCard}>
      <Text style={styles.sectionTitle}>Scorecard</Text>
      <View style={styles.scoreTable}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.headerCell]}>Hole</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Par</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Score</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>Putts</Text>
          <Text style={[styles.tableCell, styles.headerCell]}>+/-</Text>
        </View>
        
        {round.scores?.sort((a, b) => a.hole.number - b.hole.number).map((score) => (
          <View key={score.holeId} style={styles.tableRow}>
            <Text style={styles.tableCell}>{score.hole.number}</Text>
            <Text style={styles.tableCell}>{score.hole.par}</Text>
            <Text style={[
              styles.tableCell,
              styles.scoreText,
              { color: getScoreColor(score.strokes, score.hole.par) }
            ]}>
              {score.strokes}
            </Text>
            <Text style={styles.tableCell}>{score.putts || '-'}</Text>
            <Text style={[
              styles.tableCell,
              { color: getScoreColor(score.strokes, score.hole.par) }
            ]}>
              {formatScoreToPar(score.strokes - score.hole.par)}
            </Text>
          </View>
        ))}
        
        <View style={[styles.tableRow, styles.totalRow]}>
          <Text style={[styles.tableCell, styles.totalText]}>Total</Text>
          <Text style={[styles.tableCell, styles.totalText]}>{stats.totalPar}</Text>
          <Text style={[styles.tableCell, styles.totalText]}>{stats.totalStrokes}</Text>
          <Text style={[styles.tableCell, styles.totalText]}>{stats.totalPutts}</Text>
          <Text style={[styles.tableCell, styles.totalText]}>
            {formatScoreToPar(stats.scoreToPar)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsCard}>
      <Text style={styles.sectionTitle}>Round Statistics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalStrokes}</Text>
          <Text style={styles.statLabel}>Total Strokes</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue,
            { color: stats.scoreToPar === 0 ? '#666' : stats.scoreToPar > 0 ? '#f44336' : '#4caf50' }
          ]}>
            {formatScoreToPar(stats.scoreToPar)}
          </Text>
          <Text style={styles.statLabel}>Score to Par</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalPutts}</Text>
          <Text style={styles.statLabel}>Total Putts</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.averagePutts.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Putts</Text>
        </View>
      </View>
      
      <View style={styles.scoreBreakdown}>
        <Text style={styles.breakdownTitle}>Score Breakdown</Text>
        <View style={styles.breakdownGrid}>
          {stats.birdies > 0 && (
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownValue, { color: '#4caf50' }]}>{stats.birdies}</Text>
              <Text style={styles.breakdownLabel}>Birdies</Text>
            </View>
          )}
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownValue, { color: '#2196f3' }]}>{stats.pars}</Text>
            <Text style={styles.breakdownLabel}>Pars</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownValue, { color: '#ff5722' }]}>{stats.bogeys}</Text>
            <Text style={styles.breakdownLabel}>Bogeys</Text>
          </View>
          {stats.doubleBogeys > 0 && (
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownValue, { color: '#f44336' }]}>{stats.doubleBogeys}</Text>
              <Text style={styles.breakdownLabel}>Doubles</Text>
            </View>
          )}
          {stats.others > 0 && (
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownValue, { color: '#9c27b0' }]}>{stats.others}</Text>
              <Text style={styles.breakdownLabel}>Others</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.courseName}>{round.course.name}</Text>
        <Text style={styles.roundDate}>
          {new Date(round.startedAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        {round.completedAt && (
          <Text style={styles.completedDate}>
            Completed: {new Date(round.completedAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.mainScore}>{stats.totalStrokes}</Text>
          <Text style={styles.scoreDescription}>
            {formatScoreToPar(stats.scoreToPar)} Par
          </Text>
        </View>

        {renderStats()}
        {renderScoreCard()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('RoundHistory')}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5234',
    marginBottom: 4,
  },
  roundDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  completedDate: {
    fontSize: 14,
    color: '#888',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2c5234',
  },
  scoreDescription: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5234',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5234',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scoreBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c5234',
    marginBottom: 12,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  breakdownItem: {
    alignItems: 'center',
    marginBottom: 8,
    minWidth: '20%',
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  scoreCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
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
  scoreTable: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalRow: {
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 0,
  },
  tableCell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    fontSize: 12,
    color: '#333',
  },
  headerCell: {
    fontWeight: '600',
    color: '#2c5234',
  },
  scoreText: {
    fontWeight: '600',
  },
  totalText: {
    fontWeight: 'bold',
    color: '#2c5234',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  doneButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoundSummaryScreen;