import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const ScorecardScreen = ({ route, navigation }) => {
  const { round, course } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scorecard</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.roundInfo}>Round ID: {round?.id}</Text>
        <Text style={styles.placeholder}>Scorecard UI coming in Phase 1.4!</Text>
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  courseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 10,
  },
  roundInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  placeholder: {
    fontSize: 18,
    color: '#666',
  },
});

export default ScorecardScreen;