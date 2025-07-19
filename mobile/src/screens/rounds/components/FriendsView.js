import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useScorecardContext } from '../contexts/ScorecardContext';
import AddPlayersModal from './AddPlayersModal';
import GameSelectionModal from './GameSelectionModal';
import GameScoringView from './GameScoringView';

const FriendsView = () => {
  const { round, course } = useScorecardContext();
  const [players, setPlayers] = useState([]);
  const [showAddPlayersModal, setShowAddPlayersModal] = useState(false);
  const [showGameSelectionModal, setShowGameSelectionModal] = useState(false);
  const [gameConfig, setGameConfig] = useState(null);

  // Initialize with the current user as a player
  useEffect(() => {
    setPlayers([{
      id: 'user',
      name: 'You',
      handicap: 15, // TODO: Get from user profile
      isUser: true,
      scores: {},
    }]);
  }, []);

  const handleAddPlayers = (selectedFriends) => {
    const newPlayers = selectedFriends.map(friend => ({
      id: friend.id,
      friendId: friend.id,
      name: friend.name,
      handicap: friend.handicap,
      isGuest: friend.isGuest || false,
      scores: {},
    }));

    setPlayers(prev => [...prev, ...newPlayers]);
  };

  const handleRemovePlayer = (playerId) => {
    if (playerId === 'user') return; // Can't remove yourself
    
    Alert.alert(
      'Remove Player',
      'Are you sure you want to remove this player?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setPlayers(prev => prev.filter(p => p.id !== playerId))
        }
      ]
    );
  };

  const handleStartGame = () => {
    if (players.length < 2) {
      Alert.alert('Add Players', 'Add at least one friend to start a game');
      return;
    }
    
    setShowGameSelectionModal(true);
  };

  const handleSelectGame = (config) => {
    setGameConfig(config);
    Alert.alert(
      'Game Started!', 
      `${config.name} game has been started with ${players.length} players.`,
      [{ text: 'OK' }]
    );
  };

  const renderPlayerCard = (player) => (
    <View key={player.id} style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>
          {player.name} {player.isUser && '(You)'}
        </Text>
        <Text style={styles.playerDetails}>
          Handicap: {player.handicap || 'N/A'}
        </Text>
      </View>
      
      {!player.isUser && !gameConfig && (
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemovePlayer(player.id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // If game is started, show the scoring interface
  if (gameConfig) {
    return (
      <View style={styles.container}>
        <GameScoringView 
          players={players}
          gameConfig={gameConfig}
          onUpdateScore={(playerId, hole, score) => {
            // Handle score updates if needed
          }}
        />
      </View>
    );
  }

  // Otherwise show the player setup interface
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Players Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Players ({players.length}/4)</Text>
              {!gameConfig && players.length < 4 && (
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => setShowAddPlayersModal(true)}
                >
                  <Text style={styles.addButtonText}>+ Add Player</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {players.map(renderPlayerCard)}
          </View>

          {/* Game Status */}
          {!gameConfig && players.length > 1 && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.startGameButton}
                onPress={handleStartGame}
              >
                <Text style={styles.startGameButtonText}>Select Game Format</Text>
              </TouchableOpacity>
              <Text style={styles.helpText}>
                Choose from Skins, Nassau, Stableford, Match Play, and more
              </Text>
            </View>
          )}

          {/* Round Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Round Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Course:</Text>
              <Text style={styles.infoValue}>{course?.name || 'Unknown'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(round?.date || Date.now()).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Format:</Text>
              <Text style={styles.infoValue}>
                {gameConfig ? gameConfig.name : 'No game selected'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Players Modal */}
      <AddPlayersModal
        visible={showAddPlayersModal}
        onClose={() => setShowAddPlayersModal(false)}
        onAddPlayers={handleAddPlayers}
        currentPlayers={players}
      />

      {/* Game Selection Modal */}
      <GameSelectionModal
        visible={showGameSelectionModal}
        onClose={() => setShowGameSelectionModal(false)}
        onSelectGame={handleSelectGame}
        players={players}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  playerDetails: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#e53935',
  },
  startGameButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  startGameButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
});

export default FriendsView;