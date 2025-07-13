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
  const { roundData, course, scores, putts = {}, saveError = false } = route.params;
  
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

  // PHASE 2.2.1: Enhanced Statistics
  // Average calculations
  const averageScore = holesPlayed > 0 ? (totalScore / holesPlayed).toFixed(1) : 0;
  const averageScoreVsPar = holesPlayed > 0 ? (scoreToPar / holesPlayed).toFixed(1) : 0;
  
  // Putts statistics (if available)
  const totalPutts = Object.values(putts).reduce((sum, puttCount) => sum + (puttCount || 0), 0);
  const averagePutts = holesPlayed > 0 && totalPutts > 0 ? (totalPutts / holesPlayed).toFixed(1) : null;
  const holesWithPutts = Object.keys(putts).filter(hole => putts[hole] > 0).length;
  
  // Best and worst holes
  const holePerformances = playedHoles.map(hole => ({
    holeNumber: hole.holeNumber,
    par: hole.par,
    score: scores[hole.holeNumber],
    scoreToPar: scores[hole.holeNumber] - hole.par,
    putts: putts[hole.holeNumber] || 0
  }));
  
  const bestHoles = holePerformances
    .filter(h => h.scoreToPar <= 0)
    .sort((a, b) => a.scoreToPar - b.scoreToPar)
    .slice(0, 3);
    
  const worstHoles = holePerformances
    .filter(h => h.scoreToPar > 0)
    .sort((a, b) => b.scoreToPar - a.scoreToPar)
    .slice(0, 3);
  
  // Performance insights
  const underParHoles = holePerformances.filter(h => h.scoreToPar < 0).length;
  const atParHoles = holePerformances.filter(h => h.scoreToPar === 0).length;
  const overParHoles = holePerformances.filter(h => h.scoreToPar > 0).length;
  
  const performancePercentage = holesPlayed > 0 ? {
    underPar: Math.round((underParHoles / holesPlayed) * 100),
    atPar: Math.round((atParHoles / holesPlayed) * 100),
    overPar: Math.round((overParHoles / holesPlayed) * 100)
  } : { underPar: 0, atPar: 0, overPar: 0 };
  
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

        {/* PHASE 2.2.1: Enhanced Statistics Sections */}
        
        {/* Average Statistics */}
        <View style={styles.statisticsSection}>
          <Text style={styles.sectionTitle}>Round Statistics</Text>
          <View style={styles.statisticsGrid}>
            <View style={styles.statisticsItem}>
              <Text style={styles.statisticsValue}>{averageScore}</Text>
              <Text style={styles.statisticsLabel}>Avg Score per Hole</Text>
            </View>
            <View style={styles.statisticsItem}>
              <Text style={[
                styles.statisticsValue,
                parseFloat(averageScoreVsPar) < 0 ? styles.positiveValue : 
                parseFloat(averageScoreVsPar) > 0 ? styles.negativeValue : styles.neutralValue
              ]}>
                {averageScoreVsPar > 0 ? `+${averageScoreVsPar}` : averageScoreVsPar}
              </Text>
              <Text style={styles.statisticsLabel}>Avg vs Par</Text>
            </View>
            {averagePutts && (
              <View style={styles.statisticsItem}>
                <Text style={styles.statisticsValue}>{averagePutts}</Text>
                <Text style={styles.statisticsLabel}>Avg Putts per Hole</Text>
              </View>
            )}
            <View style={styles.statisticsItem}>
              <Text style={styles.statisticsValue}>{performancePercentage.atPar + performancePercentage.underPar}%</Text>
              <Text style={styles.statisticsLabel}>At/Under Par</Text>
            </View>
          </View>
        </View>

        {/* Best and Worst Holes */}
        {(bestHoles.length > 0 || worstHoles.length > 0) && (
          <View style={styles.performanceAnalysisSection}>
            <Text style={styles.sectionTitle}>Performance Analysis</Text>
            
            {bestHoles.length > 0 && (
              <View style={styles.bestWorstContainer}>
                <Text style={styles.bestWorstTitle}>🎯 Best Holes</Text>
                <View style={styles.bestWorstList}>
                  {bestHoles.map((hole, index) => (
                    <View key={`best-${hole.holeNumber}`} style={styles.bestWorstItem}>
                      <Text style={styles.bestWorstHole}>#{hole.holeNumber}</Text>
                      <Text style={styles.bestWorstScore}>
                        {hole.score} ({hole.scoreToPar < 0 ? hole.scoreToPar : `+${hole.scoreToPar}`})
                      </Text>
                      <Text style={styles.bestWorstLabel}>
                        {getScoreLabel(hole.score, hole.par)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {worstHoles.length > 0 && (
              <View style={styles.bestWorstContainer}>
                <Text style={styles.bestWorstTitle}>⚠️ Challenge Holes</Text>
                <View style={styles.bestWorstList}>
                  {worstHoles.map((hole, index) => (
                    <View key={`worst-${hole.holeNumber}`} style={styles.bestWorstItem}>
                      <Text style={styles.bestWorstHole}>#{hole.holeNumber}</Text>
                      <Text style={styles.bestWorstScore}>
                        {hole.score} (+{hole.scoreToPar})
                      </Text>
                      <Text style={styles.bestWorstLabel}>
                        {getScoreLabel(hole.score, hole.par)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Performance Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Round Insights</Text>
          <View style={styles.insightsList}>
            {eagles > 0 && (
              <Text style={styles.insightPositive}>
                🦅 Great job! You scored {eagles} eagle{eagles > 1 ? 's' : ''} this round!
              </Text>
            )}
            {birdies >= 3 && (
              <Text style={styles.insightPositive}>
                🐦 Excellent scoring with {birdies} birdie{birdies > 1 ? 's' : ''}!
              </Text>
            )}
            {performancePercentage.atPar + performancePercentage.underPar >= 50 && (
              <Text style={styles.insightPositive}>
                ✅ Solid round! You played {performancePercentage.atPar + performancePercentage.underPar}% of holes at or under par.
              </Text>
            )}
            {averagePutts && parseFloat(averagePutts) <= 2.0 && (
              <Text style={styles.insightPositive}>
                🎯 Great putting! {averagePutts} putts per hole average.
              </Text>
            )}
            {worstHoles.length > 0 && (
              <Text style={styles.insightNeutral}>
                💡 Focus on hole{worstHoles.length > 1 ? 's' : ''} #{worstHoles.map(h => h.holeNumber).join(', ')} for improvement.
              </Text>
            )}
            {doubleBogeys >= 3 && (
              <Text style={styles.insightNeutral}>
                🎯 Work on minimizing big numbers - you had {doubleBogeys} double bogey{doubleBogeys > 1 ? 's' : ''} or worse.
              </Text>
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
  
  // PHASE 2.2.1: Enhanced Statistics Styles
  statisticsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statisticsItem: {
    width: (width - 60) / 2, // 2 columns with padding
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statisticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statisticsLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  positiveValue: {
    color: '#4caf50',
  },
  negativeValue: {
    color: '#f44336',
  },
  neutralValue: {
    color: '#333',
  },
  
  // Performance Analysis Styles
  performanceAnalysisSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  bestWorstContainer: {
    marginBottom: 20,
  },
  bestWorstTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bestWorstList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  bestWorstItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bestWorstHole: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  bestWorstScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    flex: 1,
    textAlign: 'center',
  },
  bestWorstLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  
  // Insights Styles
  insightsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  insightsList: {
    gap: 12,
  },
  insightPositive: {
    fontSize: 15,
    color: '#2e7d32',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  insightNeutral: {
    fontSize: 15,
    color: '#333',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
});

export default RoundSummaryScreen;