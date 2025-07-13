import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const RoundSummaryScreen = ({ route, navigation }) => {
  const { roundData, course, scores, saveError = false } = route.params;
  
  // Calculate round statistics
  const holes = course.holes || Array.from({ length: 18 }, (_, i) => ({
    id: `default-${i + 1}`,
    holeNumber: i + 1,
    par: i + 1 <= 4 ? 4 : i + 1 <= 10 ? (i + 1) % 2 === 0 ? 5 : 3 : 4,
  }));
  
  const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
  const playedHoles = holes.filter(hole => scores[hole.holeNumber] > 0);
  const totalPar = playedHoles.reduce((sum, hole) => sum + hole.par, 0);
  const scoreToPar = totalScore - totalPar;
  const holesPlayed = playedHoles.length;
  
  // Determine round type
  const front9Complete = holes.slice(0, 9).every(hole => scores[hole.holeNumber] > 0);
  const back9Complete = holes.slice(9, 18).every(hole => scores[hole.holeNumber] > 0);
  const isFullRound = front9Complete && back9Complete;
  
  let roundType = '';
  if (isFullRound) {
    roundType = 'Full Round (18 holes)';
  } else if (front9Complete) {
    roundType = 'Front 9';
  } else if (back9Complete) {
    roundType = 'Back 9';
  } else {
    roundType = `Partial Round (${holesPlayed} holes)`;
  }
  
  // Calculate statistics
  const birdies = playedHoles.filter(hole => scores[hole.holeNumber] === hole.par - 1).length;
  const eagles = playedHoles.filter(hole => scores[hole.holeNumber] <= hole.par - 2).length;
  const pars = playedHoles.filter(hole => scores[hole.holeNumber] === hole.par).length;
  const bogeys = playedHoles.filter(hole => scores[hole.holeNumber] === hole.par + 1).length;
  const doubleBogeys = playedHoles.filter(hole => scores[hole.holeNumber] >= hole.par + 2).length;
  
  const getScoreColor = (holeScore, holePar) => {
    if (holeScore <= holePar - 2) return '#4caf50'; // Eagle or better
    if (holeScore === holePar - 1) return '#66bb6a'; // Birdie
    if (holeScore === holePar) return '#333'; // Par
    if (holeScore === holePar + 1) return '#ff9800'; // Bogey
    return '#f44336'; // Double bogey or worse
  };
  
  const getScoreLabel = (holeScore, holePar) => {
    if (holeScore <= holePar - 3) return 'Albatross';
    if (holeScore === holePar - 2) return 'Eagle';
    if (holeScore === holePar - 1) return 'Birdie';
    if (holeScore === holePar) return 'Par';
    if (holeScore === holePar + 1) return 'Bogey';
    if (holeScore === holePar + 2) return 'Double';
    if (holeScore === holePar + 3) return 'Triple';
    return `+${holeScore - holePar}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backText}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Round Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Course Info */}
        <View style={styles.courseInfo}>
          <Text style={styles.courseName}>{course.name}</Text>
          <Text style={styles.courseLocation}>
            {[course.city, course.state, course.country].filter(Boolean).join(', ')}
          </Text>
          <Text style={styles.roundTypeText}>{roundType}</Text>
          {saveError && (
            <View style={styles.saveErrorBanner}>
              <Text style={styles.saveErrorText}>⚠️ Round saved locally only</Text>
              <Text style={styles.saveErrorSubtext}>Could not sync with server</Text>
            </View>
          )}
        </View>

        {/* Score Summary */}
        <View style={styles.scoreSummary}>
          <View style={styles.mainScore}>
            <Text style={styles.totalScoreLabel}>Total Score</Text>
            <Text style={styles.totalScore}>{totalScore}</Text>
            <Text style={[
              styles.scoreToPar,
              scoreToPar < 0 ? styles.underPar : scoreToPar > 0 ? styles.overPar : styles.evenPar
            ]}>
              {scoreToPar === 0 ? 'Even Par' : scoreToPar > 0 ? `${scoreToPar} Over Par` : `${Math.abs(scoreToPar)} Under Par`}
            </Text>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Par:</Text>
              <Text style={styles.statValue}>{totalPar}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Holes:</Text>
              <Text style={styles.statValue}>{holesPlayed}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Date:</Text>
              <Text style={styles.statValue}>{new Date().toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* Performance Breakdown */}
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>Performance Breakdown</Text>
          <View style={styles.performanceGrid}>
            {eagles > 0 && (
              <View style={styles.performanceItem}>
                <Text style={styles.performanceCount}>{eagles}</Text>
                <Text style={styles.performanceLabel}>Eagle{eagles !== 1 ? 's' : ''}</Text>
              </View>
            )}
            {birdies > 0 && (
              <View style={styles.performanceItem}>
                <Text style={styles.performanceCount}>{birdies}</Text>
                <Text style={styles.performanceLabel}>Birdie{birdies !== 1 ? 's' : ''}</Text>
              </View>
            )}
            <View style={styles.performanceItem}>
              <Text style={styles.performanceCount}>{pars}</Text>
              <Text style={styles.performanceLabel}>Par{pars !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceCount}>{bogeys}</Text>
              <Text style={styles.performanceLabel}>Bogey{bogeys !== 1 ? 's' : ''}</Text>
            </View>
            {doubleBogeys > 0 && (
              <View style={styles.performanceItem}>
                <Text style={styles.performanceCount}>{doubleBogeys}</Text>
                <Text style={styles.performanceLabel}>Double+</Text>
              </View>
            )}
          </View>
        </View>

        {/* Hole-by-Hole Review */}
        <View style={styles.holeReviewSection}>
          <Text style={styles.sectionTitle}>Hole-by-Hole Review</Text>
          <View style={styles.holeGrid}>
            {playedHoles.map((hole) => (
              <View key={hole.holeNumber} style={styles.holeReviewItem}>
                <View style={styles.holeHeader}>
                  <Text style={styles.holeNumber}>{hole.holeNumber}</Text>
                  <Text style={styles.holePar}>Par {hole.par}</Text>
                </View>
                <Text style={[
                  styles.holeScore,
                  { color: getScoreColor(scores[hole.holeNumber], hole.par) }
                ]}>
                  {scores[hole.holeNumber]}
                </Text>
                <Text style={[
                  styles.holeScoreLabel,
                  { color: getScoreColor(scores[hole.holeNumber], hole.par) }
                ]}>
                  {getScoreLabel(scores[hole.holeNumber], hole.par)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('CourseList')}
          >
            <Text style={styles.primaryButtonText}>Play Another Round</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  placeholder: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  
  // Course Info
  courseInfo: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  courseLocation: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  roundTypeText: {
    fontSize: 18,
    color: '#2e7d32',
    fontWeight: '600',
  },
  saveErrorBanner: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  saveErrorText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  saveErrorSubtext: {
    fontSize: 12,
    color: '#856404',
  },
  
  // Score Summary
  scoreSummary: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
  },
  mainScore: {
    flex: 2,
    alignItems: 'center',
    paddingRight: 20,
  },
  totalScoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  totalScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  scoreToPar: {
    fontSize: 18,
    fontWeight: 'bold',
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
  summaryStats: {
    flex: 1,
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Performance Breakdown
  performanceSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
    marginBottom: 16,
    minWidth: 80,
  },
  performanceCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  // Hole Review
  holeReviewSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  holeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  holeReviewItem: {
    width: (width - 60) / 3, // 3 columns with padding
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  holeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  holeNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  holePar: {
    fontSize: 12,
    color: '#666',
  },
  holeScore: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  holeScoreLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Actions
  actionsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2e7d32',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RoundSummaryScreen;