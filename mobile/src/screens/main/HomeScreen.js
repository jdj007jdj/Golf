import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ActiveGamesCard from '../../components/ActiveGamesCard';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [activeRound, setActiveRound] = useState(null);

  useEffect(() => {
    checkForActiveRound();
    
    // Check for active round when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      checkForActiveRound();
    });

    return unsubscribe;
  }, [navigation]);

  const checkForActiveRound = async () => {
    try {
      const activeRoundData = await AsyncStorage.getItem('golf_active_round');
      if (activeRoundData) {
        const parsedRoundData = JSON.parse(activeRoundData);
        setActiveRound(parsedRoundData);
      } else {
        setActiveRound(null);
      }
    } catch (error) {
      console.error('Error checking for active round:', error);
      setActiveRound(null);
    }
  };

  const handleResumeRound = () => {
    if (activeRound) {
      navigation.navigate('Scorecard', {
        round: activeRound.round,
        course: activeRound.course
      });
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.firstName}!</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings')} 
            style={styles.settingsButton}
          >
            <Text style={styles.settingsText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ActiveGamesCard navigation={navigation} />
      
      <View style={styles.content}>
        {activeRound && (
          <TouchableOpacity 
            style={styles.resumeButton}
            onPress={handleResumeRound}
          >
            <Text style={styles.resumeButtonText}>Resume Current Round</Text>
            <Text style={styles.resumeButtonSubtext}>
              {activeRound.course?.name} • Started {new Date(activeRound.startedAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.primaryButton, activeRound && styles.secondaryButton]}
          onPress={() => navigation.navigate('CourseList')}
        >
          <Text style={[styles.primaryButtonText, activeRound && styles.secondaryButtonText]}>
            Start New Round
          </Text>
        </TouchableOpacity>
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('RoundHistory')}
          >
            <Text style={styles.actionTitle}>Round History</Text>
            <Text style={styles.actionDescription}>View your past rounds</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Statistics')}
          >
            <Text style={styles.actionTitle}>Statistics</Text>
            <Text style={styles.actionDescription}>Track your progress</Text>
          </TouchableOpacity>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  settingsText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  primaryButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resumeButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  resumeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resumeButtonSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  secondaryButtonText: {
    color: 'white',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  comingSoon: {
    fontSize: 11,
    color: '#4caf50',
    fontStyle: 'italic',
  },
});

export default HomeScreen;