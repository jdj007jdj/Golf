import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const StablefordLeaderboardModal = ({ visible, onClose, gameResults, players, gameConfig, holes }) => {
  if (!gameResults) return null;

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  };

  const renderLeaderboard = () => {
    return gameResults.leaderboard.map((entry, index) => {
      const player = players.find(p => p.id === entry.playerId);
      const isLeader = index === 0 && entry.points > 0;
      
      return (
        <View key={entry.playerId} style={[styles.leaderboardRow, isLeader && styles.leaderRow]}>
          <View style={styles.positionContainer}>
            <Text style={[styles.position, isLeader && styles.leaderText]}>
              {index + 1}
            </Text>
          </View>
          <View style={styles.playerSection}>
            <Text style={[styles.playerName, isLeader && styles.leaderText]}>
              {player?.name} {isLeader && '👑'}
            </Text>
            <Text style={styles.handicap}>HCP: {player?.handicap || 'N/A'}</Text>
          </View>
          <View style={styles.pointsSection}>
            <Text style={[styles.totalPoints, isLeader && styles.leaderText]}>
              {entry.points}
            </Text>
            <Text style={styles.pointsLabel}>points</Text>
          </View>
        </View>
      );
    });
  };

  const renderHoleBreakdown = () => {
    const playedHoles = holes.filter(hole => {
      return Object.values(gameResults.holePoints[hole.holeNumber] || {}).some(points => points > 0);
    });

    if (playedHoles.length === 0) return null;

    return (
      <View style={styles.breakdownSection}>
        <Text style={styles.breakdownTitle}>Hole-by-Hole Points</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header Row */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownCell}>
                <Text style={styles.breakdownHeader}>Player</Text>
              </View>
              {playedHoles.map(hole => (
                <View key={hole.holeNumber} style={styles.breakdownCell}>
                  <Text style={styles.breakdownHeader}>H{hole.holeNumber}</Text>
                  <Text style={styles.breakdownSubheader}>Par {hole.par}</Text>
                </View>
              ))}
              <View style={styles.breakdownCell}>
                <Text style={styles.breakdownHeader}>Total</Text>
              </View>
            </View>
            
            {/* Player Rows */}
            {players.map(player => (
              <View key={player.id} style={styles.breakdownRow}>
                <View style={styles.breakdownCell}>
                  <Text style={styles.breakdownPlayerName}>{player.name}</Text>
                </View>
                {playedHoles.map(hole => {
                  const points = gameResults.holePoints[hole.holeNumber]?.[player.id] || 0;
                  return (
                    <View key={hole.holeNumber} style={styles.breakdownCell}>
                      <Text style={[
                        styles.breakdownPoints,
                        points > 0 && styles.breakdownPointsEarned
                      ]}>
                        {points || '-'}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.breakdownCell}>
                  <Text style={styles.breakdownTotal}>
                    {gameResults.playerPoints[player.id] || 0}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderPointValues = () => {
    const settings = gameConfig.settings;
    return (
      <View style={styles.pointValuesSection}>
        <Text style={styles.pointValuesTitle}>Point Values</Text>
        <View style={styles.pointValueRow}>
          <Text style={styles.pointValueLabel}>Eagle or better:</Text>
          <Text style={styles.pointValue}>{settings.eaglePoints} points</Text>
        </View>
        <View style={styles.pointValueRow}>
          <Text style={styles.pointValueLabel}>Birdie:</Text>
          <Text style={styles.pointValue}>{settings.birdiePoints} points</Text>
        </View>
        <View style={styles.pointValueRow}>
          <Text style={styles.pointValueLabel}>Par:</Text>
          <Text style={styles.pointValue}>{settings.parPoints} points</Text>
        </View>
        <View style={styles.pointValueRow}>
          <Text style={styles.pointValueLabel}>Bogey:</Text>
          <Text style={styles.pointValue}>{settings.bogeyPoints} point</Text>
        </View>
        <View style={styles.pointValueRow}>
          <Text style={styles.pointValueLabel}>Double bogey+:</Text>
          <Text style={styles.pointValue}>0 points</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Stableford Leaderboard</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.leaderboardSection}>
              {renderLeaderboard()}
            </View>
            
            {renderHoleBreakdown()}
            {renderPointValues()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  scrollContent: {
    padding: 20,
  },
  leaderboardSection: {
    marginBottom: 24,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  leaderRow: {
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  positionContainer: {
    width: 40,
    alignItems: 'center',
  },
  position: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  leaderText: {
    color: '#2e7d32',
  },
  playerSection: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  handicap: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  pointsSection: {
    alignItems: 'center',
  },
  totalPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownSection: {
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  breakdownCell: {
    width: 60,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownCell: {
    width: 60,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  breakdownSubheader: {
    fontSize: 10,
    color: '#999',
  },
  breakdownPlayerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  breakdownPoints: {
    fontSize: 14,
    color: '#666',
  },
  breakdownPointsEarned: {
    color: '#4caf50',
    fontWeight: '600',
  },
  breakdownTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  pointValuesSection: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 16,
  },
  pointValuesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  pointValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  pointValueLabel: {
    fontSize: 14,
    color: '#666',
  },
  pointValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
});

export default StablefordLeaderboardModal;