import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const MatchPlayStatusModal = ({ visible, onClose, gameResults, players, gameConfig, holes }) => {
  if (!gameResults || gameResults.error) return null;

  const player1 = players[0];
  const player2 = players[1];

  const renderMatchStatus = () => {
    return (
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Match Status</Text>
        <Text style={[styles.mainStatus, gameResults.matchClosed && styles.closedStatus]}>
          {gameResults.status}
        </Text>
        {!gameResults.matchClosed && gameResults.holesPlayed > 0 && (
          <Text style={styles.thruText}>
            Through {gameResults.holesPlayed} holes • {gameResults.holesRemaining} to play
          </Text>
        )}
      </View>
    );
  };

  const renderPlayerStats = () => {
    const p1Holes = gameResults.player1Holes || 0;
    const p2Holes = gameResults.player2Holes || 0;
    const halvedHoles = gameResults.holesPlayed - p1Holes - p2Holes;

    return (
      <View style={styles.playerStatsSection}>
        <Text style={styles.sectionTitle}>Player Statistics</Text>
        
        <View style={[styles.playerStatRow, gameResults.leader === player1.id && styles.leaderRow]}>
          <Text style={[styles.playerName, gameResults.winner === player1.id && styles.winnerName]}>
            {player1.name}
          </Text>
          <View style={styles.statDetails}>
            <Text style={styles.holesWon}>{p1Holes} holes won</Text>
            {gameResults.strokeReceiver === player1.id && (
              <Text style={styles.handicapInfo}>
                Receiving {gameResults.handicapStrokes} strokes
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.playerStatRow, gameResults.leader === player2.id && styles.leaderRow]}>
          <Text style={[styles.playerName, gameResults.winner === player2.id && styles.winnerName]}>
            {player2.name}
          </Text>
          <View style={styles.statDetails}>
            <Text style={styles.holesWon}>{p2Holes} holes won</Text>
            {gameResults.strokeReceiver === player2.id && (
              <Text style={styles.handicapInfo}>
                Receiving {gameResults.handicapStrokes} strokes
              </Text>
            )}
          </View>
        </View>

        {halvedHoles > 0 && (
          <Text style={styles.halvedText}>
            {halvedHoles} {halvedHoles === 1 ? 'hole' : 'holes'} halved
          </Text>
        )}
      </View>
    );
  };

  const renderHoleByHole = () => {
    const playedHoles = holes.filter(hole => gameResults.holeResults[hole.holeNumber]);
    
    if (playedHoles.length === 0) return null;

    return (
      <View style={styles.holeByHoleSection}>
        <Text style={styles.sectionTitle}>Hole-by-Hole Results</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.holeGrid}>
            {playedHoles.map(hole => {
              const result = gameResults.holeResults[hole.holeNumber];
              const isHalved = result === 'halved';
              const winner = isHalved ? null : players.find(p => p.id === result);
              
              return (
                <View key={hole.holeNumber} style={styles.holeResult}>
                  <Text style={styles.holeNumber}>H{hole.holeNumber}</Text>
                  <Text style={styles.holePar}>Par {hole.par}</Text>
                  <View style={[
                    styles.resultIndicator,
                    isHalved && styles.halvedIndicator,
                    winner?.id === player1.id && styles.player1Indicator,
                    winner?.id === player2.id && styles.player2Indicator,
                  ]}>
                    <Text style={styles.resultText}>
                      {isHalved ? '½' : winner?.name?.charAt(0)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderHandicapInfo = () => {
    if (!gameConfig.settings.useHandicaps || gameResults.handicapStrokes === 0) return null;

    return (
      <View style={styles.handicapSection}>
        <Text style={styles.handicapTitle}>Handicap Information</Text>
        <Text style={styles.handicapText}>
          {gameResults.strokeReceiver === player1.id ? player1.name : player2.name} receives{' '}
          {gameResults.handicapStrokes} {gameResults.handicapStrokes === 1 ? 'stroke' : 'strokes'}
        </Text>
        <Text style={styles.handicapNote}>
          Applied to the {gameResults.handicapStrokes} hardest holes
        </Text>
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
            <Text style={styles.title}>Match Play Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {renderMatchStatus()}
            {renderPlayerStats()}
            {renderHoleByHole()}
            {renderHandicapInfo()}
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
  statusCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  mainStatus: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
  },
  closedStatus: {
    color: '#1976d2',
  },
  thruText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  playerStatsSection: {
    marginBottom: 24,
  },
  playerStatRow: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  leaderRow: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  winnerName: {
    color: '#1976d2',
  },
  statDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  holesWon: {
    fontSize: 14,
    color: '#666',
  },
  handicapInfo: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  halvedText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  holeByHoleSection: {
    marginBottom: 24,
  },
  holeGrid: {
    flexDirection: 'row',
  },
  holeResult: {
    width: 60,
    marginRight: 8,
    alignItems: 'center',
  },
  holeNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  holePar: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resultIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halvedIndicator: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  player1Indicator: {
    backgroundColor: '#4caf50',
  },
  player2Indicator: {
    backgroundColor: '#2196f3',
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  handicapSection: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 16,
  },
  handicapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  handicapText: {
    fontSize: 14,
    color: '#555',
  },
  handicapNote: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default MatchPlayStatusModal;