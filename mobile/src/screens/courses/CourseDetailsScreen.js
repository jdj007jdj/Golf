import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSettings } from '../../contexts/SettingsContext';

const CourseDetailsScreen = ({ route, navigation }) => {
  const { course } = route.params;
  const { formatDistance } = useSettings();
  
  const totalPar = course.holes?.reduce((sum, hole) => sum + hole.par, 0) || 0;
  const totalYards = course.holes?.reduce((sum, hole) => sum + (hole.yardage || 0), 0) || 0;
  const holeCount = course.holes?.length || 18;

  const handleStartRound = () => {
    navigation.navigate('StartRound', { course });
  };

  const renderHoleInfo = () => {
    if (!course.holes || course.holes.length === 0) {
      return (
        <Text style={styles.noHolesText}>
          No hole information available
        </Text>
      );
    }

    // Split holes into front 9 and back 9
    const front9 = course.holes.slice(0, 9);
    const back9 = course.holes.slice(9, 18);

    return (
      <>
        <View style={styles.nineHoles}>
          <Text style={styles.nineTitle}>Front 9</Text>
          <View style={styles.holeGrid}>
            <View style={styles.holeRow}>
              <Text style={styles.holeLabel}>Hole</Text>
              {front9.map((hole) => (
                <Text key={hole.id} style={styles.holeNumber}>
                  {hole.holeNumber}
                </Text>
              ))}
            </View>
            <View style={styles.holeRow}>
              <Text style={styles.holeLabel}>Par</Text>
              {front9.map((hole) => (
                <Text key={hole.id} style={styles.holePar}>
                  {hole.par}
                </Text>
              ))}
            </View>
            {front9.some(hole => hole.yardage) && (
              <View style={styles.holeRow}>
                <Text style={styles.holeLabel}>Distance</Text>
                {front9.map((hole) => (
                  <Text key={hole.id} style={styles.holeYards}>
                    {hole.yardage ? formatDistance(hole.yardage).split(' ')[0] : '-'}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {back9.length > 0 && (
          <View style={styles.nineHoles}>
            <Text style={styles.nineTitle}>Back 9</Text>
            <View style={styles.holeGrid}>
              <View style={styles.holeRow}>
                <Text style={styles.holeLabel}>Hole</Text>
                {back9.map((hole) => (
                  <Text key={hole.id} style={styles.holeNumber}>
                    {hole.holeNumber}
                  </Text>
                ))}
              </View>
              <View style={styles.holeRow}>
                <Text style={styles.holeLabel}>Par</Text>
                {back9.map((hole) => (
                  <Text key={hole.id} style={styles.holePar}>
                    {hole.par}
                  </Text>
                ))}
              </View>
              {back9.some(hole => hole.yardage) && (
                <View style={styles.holeRow}>
                  <Text style={styles.holeLabel}>Distance</Text>
                  {back9.map((hole) => (
                    <Text key={hole.id} style={styles.holeYards}>
                      {hole.yardage ? formatDistance(hole.yardage).split(' ')[0] : '-'}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{course.name}</Text>
        <Text style={styles.location}>
          {[course.city, course.state, course.country].filter(Boolean).join(', ') || 'Location not specified'}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{holeCount}</Text>
            <Text style={styles.statLabel}>Holes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalPar}</Text>
            <Text style={styles.statLabel}>Total Par</Text>
          </View>
          {totalYards > 0 && (
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatDistance(totalYards).split(' ')[0]}</Text>
              <Text style={styles.statLabel}>Total {formatDistance(totalYards).split(' ')[1]}</Text>
            </View>
          )}
        </View>

        {course.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{course.description}</Text>
          </View>
        )}

        <View style={styles.holesSection}>
          <Text style={styles.sectionTitle}>Course Layout</Text>
          {renderHoleInfo()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={() => navigation.navigate('CourseDownload', { 
            course: course
          })}
        >
          <Text style={styles.downloadIcon}>📥</Text>
          <Text style={styles.downloadText}>Download Maps for Offline Play</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.startButton}
          onPress={handleStartRound}
        >
          <Text style={styles.startButtonText}>Start New Round</Text>
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
    backgroundColor: '#2e7d32',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    color: 'white',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  descriptionSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  holesSection: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 100,
  },
  noHolesText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  nineHoles: {
    marginBottom: 20,
  },
  nineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  holeGrid: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  holeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  holeLabel: {
    width: 50,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  holeNumber: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  holePar: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#2e7d32',
  },
  holeYards: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  downloadIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  downloadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  startButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CourseDetailsScreen;