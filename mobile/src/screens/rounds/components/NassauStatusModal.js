import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const NassauStatusModal = ({ visible, onClose, gameResults, players, gameConfig }) => {
  if (!gameResults || gameResults.error) return null;

  const renderSegmentStatus = (segment, title) => {
    const player1 = players[0];
    const player2 = players[1];
    const p1Holes = segment.holesWon[player1.id] || 0;
    const p2Holes = segment.holesWon[player2.id] || 0;
    
    return (
      <View style={styles.segmentCard}>
        <Text style={styles.segmentTitle}>{title}</Text>
        <View style={styles.matchStatus}>
          <Text style={[styles.statusText, segment.winner && styles.winnerText]}>
            {segment.status}
          </Text>
          {segment.thru > 0 && !segment.winner && (
            <Text style={styles.thruText}>Thru {segment.thru}</Text>
          )}
        </View>
        
        <View style={styles.playerScores}>
          <View style={styles.playerRow}>
            <Text style={[styles.playerName, segment.winner === player1.id && styles.winnerName]}>
              {player1.name}
            </Text>
            <Text style={[styles.holesWon, segment.winner === player1.id && styles.winnerScore]}>
              {p1Holes} {p1Holes === 1 ? 'hole' : 'holes'}
            </Text>
          </View>
          <View style={styles.playerRow}>
            <Text style={[styles.playerName, segment.winner === player2.id && styles.winnerName]}>
              {player2.name}
            </Text>
            <Text style={[styles.holesWon, segment.winner === player2.id && styles.winnerScore]}>
              {p2Holes} {p2Holes === 1 ? 'hole' : 'holes'}
            </Text>
          </View>
          {segment.holesTied > 0 && (
            <Text style={styles.tiedHoles}>
              {segment.holesTied} {segment.holesTied === 1 ? 'hole' : 'holes'} halved
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderBetValues = () => {
    const { frontBet, backBet, overallBet } = gameConfig.settings;
    return (
      <View style={styles.betValues}>
        <Text style={styles.betTitle}>Bet Values</Text>
        <View style={styles.betRow}>
          <Text style={styles.betLabel}>Front 9:</Text>
          <Text style={styles.betAmount}>${frontBet}</Text>
        </View>
        <View style={styles.betRow}>
          <Text style={styles.betLabel}>Back 9:</Text>
          <Text style={styles.betAmount}>${backBet}</Text>
        </View>
        <View style={styles.betRow}>
          <Text style={styles.betLabel}>Overall:</Text>
          <Text style={styles.betAmount}>${overallBet}</Text>
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
            <Text style={styles.title}>Nassau Status</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {renderSegmentStatus(gameResults.front, 'Front 9')}
            {renderSegmentStatus(gameResults.back, 'Back 9')}
            {renderSegmentStatus(gameResults.overall, 'Overall (18 Holes)')}
            {renderBetValues()}
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
    maxHeight: '80%',
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
  segmentCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  segmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  matchStatus: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  winnerText: {
    color: '#1976d2',
  },
  thruText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  playerScores: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerName: {
    fontSize: 16,
    color: '#333',
  },
  winnerName: {
    fontWeight: '600',
    color: '#1976d2',
  },
  holesWon: {
    fontSize: 16,
    color: '#666',
  },
  winnerScore: {
    fontWeight: '600',
    color: '#1976d2',
  },
  tiedHoles: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  betValues: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  betTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  betRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  betLabel: {
    fontSize: 15,
    color: '#666',
  },
  betAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2e7d32',
  },
});

export default NassauStatusModal;