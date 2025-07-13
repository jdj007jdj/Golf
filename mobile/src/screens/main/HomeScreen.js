import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.firstName}!</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Ready to play?</Text>
        
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
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>Round History</Text>
            <Text style={styles.actionDescription}>View your past rounds</Text>
            <Text style={styles.comingSoon}>Coming soon!</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>Statistics</Text>
            <Text style={styles.actionDescription}>Track your progress</Text>
            <Text style={styles.comingSoon}>Coming soon!</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.label}>Name: {user?.firstName} {user?.lastName}</Text>
          <Text style={styles.label}>Email: {user?.email}</Text>
          <Text style={styles.label}>Username: {user?.username}</Text>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 40,
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
  userInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});

export default HomeScreen;