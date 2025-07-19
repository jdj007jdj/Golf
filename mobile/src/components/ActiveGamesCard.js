import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import gamePersistenceService from '../services/gamePersistenceService';

const ActiveGamesCard = ({ navigation }) => {
  const [activeGames, setActiveGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActiveGames();
  }, []);

  const loadActiveGames = async () => {
    try {
      const activeGameIds = await gamePersistenceService.getActiveGames();
      const games = [];

      for (const roundId of activeGameIds) {
        const gameData = await gamePersistenceService.loadGameData(roundId);
        if (gameData) {
          // Try to get round info
          const roundsData = await AsyncStorage.getItem('golf_round_history');
          const rounds = roundsData ? JSON.parse(roundsData) : [];
          const round = rounds.find(r => r.id === roundId);

          games.push({
            roundId,
            gameConfig: gameData.gameConfig,
            players: gameData.players,
            startedAt: gameData.startedAt,
            lastUpdated: gameData.lastUpdated,
            courseName: round?.courseName || 'Unknown Course',
            date: round?.date || gameData.startedAt,
          });
        }
      }

      // Sort by last updated, most recent first
      games.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
      setActiveGames(games);
    } catch (error) {
      console.error('Error loading active games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeGame = (game) => {
    Alert.alert(
      'Resume Game',
      `Resume ${game.gameConfig.name} at ${game.courseName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Resume', 
          onPress: () => {
            // Navigate to round with the game data
            // This assumes the round is still available
            navigation.navigate('Scorecard', {
              round: { id: game.roundId },
              course: { name: game.courseName },
              resumeGame: true,
            });
          }
        }
      ]
    );
  };

  const handleDeleteGame = (game) => {
    Alert.alert(
      'Delete Game',
      'Are you sure you want to delete this game? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await gamePersistenceService.completeGame(game.roundId, null);
            loadActiveGames();
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderGame = ({ item }) => {
    const playerNames = item.players
      .filter(p => !p.isUser)
      .map(p => p.name)
      .join(', ');

    return (
      <TouchableOpacity
        style={styles.gameCard}
        onPress={() => handleResumeGame(item)}
        onLongPress={() => handleDeleteGame(item)}
      >
        <View style={styles.gameHeader}>
          <Text style={styles.gameType}>{item.gameConfig.name}</Text>
          <Text style={styles.gameDate}>{formatDate(item.lastUpdated)}</Text>
        </View>
        <Text style={styles.courseName}>{item.courseName}</Text>
        <Text style={styles.playerNames}>
          {playerNames ? `Playing with: ${playerNames}` : 'Solo game'}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return null;
  }

  if (activeGames.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Games</Text>
      <FlatList
        data={activeGames}
        renderItem={renderGame}
        keyExtractor={(item) => item.roundId}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      <Text style={styles.helpText}>Tap to resume • Long press to delete</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 12,
  },
  gameCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    width: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  gameDate: {
    fontSize: 12,
    color: '#666',
  },
  courseName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  playerNames: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
});

export default ActiveGamesCard;