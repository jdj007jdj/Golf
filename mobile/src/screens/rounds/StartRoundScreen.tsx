import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCourses } from '@/store/slices/courseSlice';
import { setCurrentRound } from '@/store/slices/roundSlice';
import { apiWrapper } from '@/services/api/apiWrapper';
import { Course } from '@/types';

const StartRoundScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { courses } = useSelector((state: RootState) => state.course);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const response = await apiWrapper.get('/courses');
      if (response.success && response.data) {
        dispatch(setCourses(response.data));
      } else {
        Alert.alert('Error', 'Failed to load courses');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartRound = async () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiWrapper.post('/rounds', {
        courseId: selectedCourse.id,
        tees: 'Regular',
      });

      if (response.success && response.data) {
        dispatch(setCurrentRound(response.data));
        navigation.navigate('PlayRound', { roundId: response.data.id });
      } else {
        Alert.alert('Error', response.error || 'Failed to start round');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCourseItem = ({ item }: { item: Course }) => {
    const isSelected = selectedCourse?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.courseCard, isSelected && styles.selectedCourseCard]}
        onPress={() => setSelectedCourse(item)}
      >
        <View style={styles.courseInfo}>
          <Text style={[styles.courseName, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
          {item.location && (
            <Text style={[styles.courseLocation, isSelected && styles.selectedText]}>
              {item.location}
            </Text>
          )}
          <Text style={[styles.courseHoles, isSelected && styles.selectedText]}>
            {item.holes?.length || 0} holes
          </Text>
        </View>
        <View style={styles.selectionIndicator}>
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Courses Available</Text>
      <Text style={styles.emptySubtitle}>
        Create a course first to start playing
      </Text>
      <TouchableOpacity
        style={styles.createCourseButton}
        onPress={() => navigation.navigate('CourseList')}
      >
        <Text style={styles.createCourseButtonText}>Manage Courses</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && courses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Start New Round</Text>
        <Text style={styles.subtitle}>Select a course to begin</Text>
      </View>

      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={courses.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmptyState}
      />

      {courses.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.startButton,
              (!selectedCourse || isLoading) && styles.disabledButton,
            ]}
            onPress={handleStartRound}
            disabled={!selectedCourse || isLoading}
          >
            <Text style={styles.startButtonText}>
              {isLoading ? 'Starting...' : 'Start Round'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5234',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  courseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedCourseCard: {
    borderColor: '#4caf50',
    backgroundColor: '#f8fff8',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5234',
    marginBottom: 4,
  },
  courseLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  courseHoles: {
    fontSize: 12,
    color: '#888',
  },
  selectedText: {
    color: '#2e7d32',
  },
  selectionIndicator: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 24,
    height: 24,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  createCourseButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createCourseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  startButton: {
    flex: 2,
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default StartRoundScreen;