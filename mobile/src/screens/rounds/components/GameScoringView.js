import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { useScorecardContext } from '../contexts/ScorecardContext';

const { width: screenWidth } = Dimensions.get('window');

const GameScoringView = ({ players, gameConfig, onUpdateScore }) => {
  const { 
    currentHole, 
    setCurrentHole, 
    holes, 
    scores, 
    setScores,
    putts,
    setPutts,
  } = useScorecardContext();
  
  const [playerScores, setPlayerScores] = useState({});
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Initialize player scores
  useEffect(() => {
    const initialScores = {};
    players.forEach(player => {
      initialScores[player.id] = {};
      holes.forEach(hole => {
        initialScores[player.id][hole.holeNumber] = player.isUser ? 
          (scores[hole.holeNumber] || '') : '';
      });
    });
    setPlayerScores(initialScores);
  }, [players, holes]);

  // Sync user's score with main scorecard
  useEffect(() => {
    if (playerScores['user']) {
      const userScore = playerScores['user'][currentHole];
      if (userScore !== scores[currentHole]) {
        setScores(prev => ({ ...prev, [currentHole]: userScore }));
      }
    }
  }, [playerScores, currentHole]);

  // Sync main scorecard score to player scores
  useEffect(() => {
    if (scores[currentHole] !== undefined && playerScores['user']) {
      setPlayerScores(prev => ({
        ...prev,
        user: {
          ...prev.user,
          [currentHole]: scores[currentHole]
        }
      }));
    }
  }, [scores, currentHole]);

  const currentHoleData = holes.find(h => h.holeNumber === currentHole) || holes[0];

  const handleScoreChange = (playerId, value) => {
    const numValue = value === '' ? '' : parseInt(value);
    if (value !== '' && (isNaN(numValue) || numValue < 1 || numValue > 15)) return;

    setPlayerScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [currentHole]: numValue
      }
    }));

    // If it's the user, update the main scorecard
    if (playerId === 'user') {
      setScores(prev => ({ ...prev, [currentHole]: numValue }));
    }
  };

  const adjustScore = (playerId, delta) => {
    const currentScore = playerScores[playerId]?.[currentHole] || currentHoleData.par;
    const newScore = Math.max(1, Math.min(15, currentScore + delta));
    handleScoreChange(playerId, newScore.toString());
  };

  const navigateHole = (direction) => {
    const newHole = currentHole + direction;
    if (newHole >= 1 && newHole <= holes.length) {
      setCurrentHole(newHole);
      setEditingPlayer(null);
    }
  };

  const getScoreStatus = (score, par) => {
    if (!score) return '';
    const diff = score - par;
    if (diff === 0) return 'par';
    if (diff === -1) return 'birdie';
    if (diff === -2) return 'eagle';
    if (diff < -2) return 'albatross';
    if (diff === 1) return 'bogey';
    if (diff === 2) return 'double';
    return `+${diff}`;
  };

  const getScoreColor = (score, par) => {
    if (!score) return '#999';
    const diff = score - par;
    if (diff === 0) return '#333';
    if (diff < 0) return '#2e7d32';
    if (diff === 1) return '#f57c00';
    if (diff === 2) return '#d32f2f';
    return '#b71c1c';
  };

  const renderPlayerScoreRow = (player) => {
    const score = playerScores[player.id]?.[currentHole];
    const isEditing = editingPlayer === player.id;
    const scoreColor = getScoreColor(score, currentHoleData.par);
    const scoreStatus = getScoreStatus(score, currentHoleData.par);

    return (
      <View key={player.id} style={styles.playerRow}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerHandicap}>HCP {player.handicap || 'N/A'}</Text>
        </View>

        <View style={styles.scoreSection}>
          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => adjustScore(player.id, -1)}
          >
            <Text style={styles.adjustButtonText}>−</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.scoreInputContainer}
            onPress={() => setEditingPlayer(isEditing ? null : player.id)}
          >
            {isEditing ? (
              <TextInput
                style={[styles.scoreInput, { color: scoreColor }]}
                value={score?.toString() || ''}
                onChangeText={(value) => handleScoreChange(player.id, value)}
                keyboardType="numeric"
                maxLength={2}
                autoFocus
                onBlur={() => setEditingPlayer(null)}
                selectTextOnFocus
              />
            ) : (
              <Text style={[styles.scoreDisplay, { color: scoreColor }]}>
                {score || '-'}
              </Text>
            )}
            {score && scoreStatus && (
              <Text style={[styles.scoreStatus, { color: scoreColor }]}>
                {scoreStatus}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => adjustScore(player.id, 1)}
          >
            <Text style={styles.adjustButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hole Navigation Header */}
      <View style={styles.holeHeader}>
        <TouchableOpacity 
          style={[styles.navButton, currentHole === 1 && styles.navButtonDisabled]}
          onPress={() => navigateHole(-1)}
          disabled={currentHole === 1}
        >
          <Text style={[styles.navButtonText, currentHole === 1 && styles.navButtonTextDisabled]}>
            ◀
          </Text>
        </TouchableOpacity>

        <View style={styles.holeInfo}>
          <Text style={styles.holeNumber}>Hole {currentHole}</Text>
          <Text style={styles.holePar}>Par {currentHoleData.par}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.navButton, currentHole === holes.length && styles.navButtonDisabled]}
          onPress={() => navigateHole(1)}
          disabled={currentHole === holes.length}
        >
          <Text style={[styles.navButtonText, currentHole === holes.length && styles.navButtonTextDisabled]}>
            ▶
          </Text>
        </TouchableOpacity>
      </View>

      {/* Game Info Bar */}
      <View style={styles.gameInfoBar}>
        <Text style={styles.gameType}>{gameConfig.name}</Text>
        {gameConfig.format === 'skins' && (
          <Text style={styles.gameStatus}>
            ${gameConfig.settings.skinValue} per hole
          </Text>
        )}
      </View>

      {/* Player Scores */}
      <ScrollView style={styles.playersContainer}>
        {players.map(renderPlayerScoreRow)}
      </ScrollView>

      {/* Hole Navigation Dots */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.holeDotsContainer}
        contentContainerStyle={styles.holeDotsContent}
      >
        {holes.map((hole) => (
          <TouchableOpacity
            key={hole.holeNumber}
            style={[
              styles.holeDot,
              currentHole === hole.holeNumber && styles.holeDotActive
            ]}
            onPress={() => setCurrentHole(hole.holeNumber)}
          >
            <Text style={[
              styles.holeDotText,
              currentHole === hole.holeNumber && styles.holeDotTextActive
            ]}>
              {hole.holeNumber}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  holeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  holeInfo: {
    alignItems: 'center',
  },
  holeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  holePar: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  gameInfoBar: {
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  gameStatus: {
    fontSize: 14,
    color: '#fff',
  },
  playersContainer: {
    flex: 1,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  playerHandicap: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  scoreInputContainer: {
    minWidth: 80,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  scoreInput: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 60,
  },
  scoreDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreStatus: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  holeDotsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  holeDotsContent: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  holeDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  holeDotActive: {
    backgroundColor: '#2e7d32',
  },
  holeDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  holeDotTextActive: {
    color: '#fff',
  },
});

export default GameScoringView;