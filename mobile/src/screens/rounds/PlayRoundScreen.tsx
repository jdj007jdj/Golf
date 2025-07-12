import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setCurrentRound, updateScore } from '@/store/slices/roundSlice';
import { apiWrapper } from '@/services/api/apiWrapper';
import { Round, Score } from '@/types';

interface PlayRoundParams {
  roundId: string;
}

const PlayRoundScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { roundId } = route.params as PlayRoundParams;
  const { currentRound } = useSelector((state: RootState) => state.round);
  
  const [round, setRound] = useState<Round | null>(null);
  const [currentHoleIndex, setCurrentHoleIndex] = useState(0);
  const [scores, setScores] = useState<{ [holeId: string]: { strokes: string; putts: string } }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRound();
  }, [roundId]);

  const loadRound = async () => {
    try {
      setIsLoading(true);
      const response = await apiWrapper.get(`/rounds/${roundId}`);
      if (response.success && response.data) {
        setRound(response.data);
        dispatch(setCurrentRound(response.data));
        
        // Initialize scores from existing data
        const existingScores: { [holeId: string]: { strokes: string; putts: string } } = {};
        response.data.scores?.forEach((score: Score) => {
          existingScores[score.holeId] = {
            strokes: score.strokes.toString(),
            putts: score.putts?.toString() || '',
          };
        });
        setScores(existingScores);
      } else {
        Alert.alert('Error', 'Failed to load round');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (holeId: string, field: 'strokes' | 'putts', value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, '');
    setScores(prev => ({
      ...prev,
      [holeId]: {
        ...prev[holeId],
        [field]: numericValue,
      },
    }));
  };

  const saveScore = async (holeId: string) => {
    const holeScore = scores[holeId];
    if (!holeScore?.strokes || parseInt(holeScore.strokes) < 1) {
      Alert.alert('Error', 'Please enter a valid number of strokes');
      return;
    }

    try {
      setIsSaving(true);
      const scoreData = {
        holeId,
        strokes: parseInt(holeScore.strokes),
        putts: holeScore.putts ? parseInt(holeScore.putts) : undefined,
      };

      const response = await apiWrapper.post(`/rounds/${roundId}/scores`, scoreData);
      if (response.success && response.data) {
        dispatch(updateScore(response.data));
        // Move to next hole if not the last hole
        if (round && round.course && currentHoleIndex < round.course.holes!.length - 1) {
          setCurrentHoleIndex(currentHoleIndex + 1);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to save score');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteRound = async () => {
    Alert.alert(
      'Complete Round',
      'Are you sure you want to complete this round?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await apiWrapper.put(`/rounds/${roundId}/complete`);
              if (response.success && response.data) {
                Alert.alert('Success', 'Round completed successfully!', [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('RoundSummary', { round: response.data }),
                  },
                ]);
              } else {
                Alert.alert('Error', response.error || 'Failed to complete round');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAbandonRound = async () => {
    Alert.alert(
      'Abandon Round',
      'Are you sure you want to abandon this round? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await apiWrapper.put(`/rounds/${roundId}/abandon`);
              if (response.success) {
                navigation.navigate('Home');
              } else {
                Alert.alert('Error', response.error || 'Failed to abandon round');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading || !round) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading round...</Text>
      </View>
    );
  }

  const currentHole = round.course?.holes?.[currentHoleIndex];
  if (!currentHole) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading hole data...</Text>
      </View>
    );
  }
  
  const currentScore = scores[currentHole.id] || { strokes: '', putts: '' };
  const totalStrokes = Object.values(scores).reduce((sum, score) => {
    return sum + (score.strokes ? parseInt(score.strokes) : 0);
  }, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.courseName}>{round.course.name}</Text>
        <Text style={styles.roundInfo}>
          Started: {new Date(round.startedAt).toLocaleDateString()}
        </Text>
        {totalStrokes > 0 && (
          <Text style={styles.totalScore}>Total Strokes: {totalStrokes}</Text>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.holeNavigation}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.holeButtons}
          >
            {round.course?.holes?.map((hole, index) => {
              const holeScore = scores[hole.id];
              const hasScore = holeScore?.strokes && parseInt(holeScore.strokes) > 0;
              
              return (
                <TouchableOpacity
                  key={hole.id}
                  style={[
                    styles.holeButton,
                    index === currentHoleIndex && styles.activeHoleButton,
                    hasScore && styles.completedHoleButton,
                  ]}
                  onPress={() => setCurrentHoleIndex(index)}
                >
                  <Text
                    style={[
                      styles.holeButtonText,
                      index === currentHoleIndex && styles.activeHoleButtonText,
                      hasScore && styles.completedHoleButtonText,
                    ]}
                  >
                    {hole.number}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.holeCard}>
          <View style={styles.holeHeader}>
            <Text style={styles.holeTitle}>Hole {currentHole.number}</Text>
            <Text style={styles.holePar}>Par {currentHole.par}</Text>
          </View>
          
          {currentHole.name && currentHole.name !== `Hole ${currentHole.number}` && (
            <Text style={styles.holeName}>{currentHole.name}</Text>
          )}

          <View style={styles.scoreInputs}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Strokes *</Text>
              <TextInput
                style={styles.scoreInput}
                value={currentScore.strokes}
                onChangeText={(value) => handleScoreChange(currentHole.id, 'strokes', value)}
                placeholder="0"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Putts</Text>
              <TextInput
                style={styles.scoreInput}
                value={currentScore.putts}
                onChangeText={(value) => handleScoreChange(currentHole.id, 'putts', value)}
                placeholder="0"
                keyboardType="numeric"
                maxLength={2}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={() => saveScore(currentHole.id)}
            disabled={isSaving || !currentScore.strokes}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Score'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Round Progress</Text>
          <Text style={styles.progressText}>
            Hole {currentHoleIndex + 1} of {round.course?.holes?.length || 0}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentHoleIndex + 1) / (round.course?.holes?.length || 1)) * 100}%` },
              ]}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.abandonButton} onPress={handleAbandonRound}>
          <Text style={styles.abandonButtonText}>Abandon</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.completeButton, isLoading && styles.disabledButton]}
          onPress={handleCompleteRound}
          disabled={isLoading}
        >
          <Text style={styles.completeButtonText}>Complete Round</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5234',
    marginBottom: 4,
  },
  roundInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
  },
  content: {
    flex: 1,
  },
  holeNavigation: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  holeButtons: {
    paddingHorizontal: 16,
    gap: 8,
  },
  holeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeHoleButton: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  completedHoleButton: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  holeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeHoleButtonText: {
    color: '#fff',
  },
  completedHoleButtonText: {
    color: '#2e7d32',
  },
  holeCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
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
  holeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  holeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5234',
  },
  holePar: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4caf50',
  },
  holeName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  scoreInputs: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  scoreInput: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressCard: {
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
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c5234',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  abandonButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  abandonButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 2,
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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

export default PlayRoundScreen;