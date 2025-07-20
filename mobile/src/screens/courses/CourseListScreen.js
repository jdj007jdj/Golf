import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_CONFIG } from '../../config/api';

const CourseListScreen = ({ navigation }) => {
  const { token, isLocalAccount } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setError(null);
      
      if (isLocalAccount) {
        // For local accounts, provide a default set of courses
        const defaultCourses = [
          {
            id: 'local-course-1',
            name: 'Local Golf Course',
            city: 'Your City',
            state: 'Your State',
            country: 'Your Country',
            holes: Array.from({ length: 18 }, (_, i) => ({
              id: `hole-${i + 1}`,
              holeNumber: i + 1,
              par: i % 3 === 0 ? 5 : (i % 3 === 1 ? 3 : 4), // Mix of par 3, 4, and 5
              handicapIndex: i + 1,
            })),
            teeBoxes: [
              { id: 'white', name: 'White', color: '#FFFFFF' },
              { id: 'blue', name: 'Blue', color: '#0066CC' },
              { id: 'red', name: 'Red', color: '#CC0000' },
            ],
            _count: { rounds: 0 }
          }
        ];
        setCourses(defaultCourses);
      } else {
        // For online accounts, fetch from API
        const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.COURSES, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setCourses(data.data || []);
        } else {
          setError(data.error?.message || 'Failed to load courses');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const handleCoursePress = (course) => {
    navigation.navigate('CourseDetails', { course });
  };

  const renderCourse = ({ item }) => {
    const totalPar = item.holes?.reduce((sum, hole) => sum + hole.par, 0) || 0;
    const holeCount = item.holes?.length || 18;

    return (
      <TouchableOpacity 
        style={styles.courseCard} 
        onPress={() => handleCoursePress(item)}
      >
        <View style={styles.courseHeader}>
          <Text style={styles.courseName}>{item.name}</Text>
          <Text style={styles.courseLocation}>
            {[item.city, item.state, item.country].filter(Boolean).join(', ') || 'Location not specified'}
          </Text>
        </View>
        
        <View style={styles.courseStats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Holes</Text>
            <Text style={styles.statValue}>{holeCount}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Par</Text>
            <Text style={styles.statValue}>{totalPar}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Rounds</Text>
            <Text style={styles.statValue}>{item._count?.rounds || 0}</Text>
          </View>
        </View>
        
        <View style={styles.courseFooter}>
          <Text style={styles.playButton}>Play Round →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCourses}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Golf Courses</Text>
        <Text style={styles.subtitle}>Select a course to play</Text>
      </View>

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No courses available</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourse}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2e7d32']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#2e7d32',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  listContent: {
    padding: 16,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    marginBottom: 12,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  courseLocation: {
    fontSize: 14,
    color: '#666',
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  courseFooter: {
    alignItems: 'flex-end',
  },
  playButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default CourseListScreen;