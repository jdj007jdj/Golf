import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Share,
  Alert,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const GameStatusModal = ({ visible, onClose, gameConfig, gameResults, players, holes, playerScores }) => {
  const [activeTab, setActiveTab] = useState('standings');
  const totalPar = holes?.reduce((sum, hole) => sum + hole.par, 0) || 0;

  if (!gameConfig || !gameResults) return null;

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  };

  const calculateStrokePlayTotals = () => {
    return players.map(player => {
      let totalStrokes = 0;
      let holesPlayed = 0;
      
      holes.forEach(hole => {
        const score = playerScores[player.id]?.[hole.holeNumber];
        if (score && score > 0) {
          totalStrokes += score;
          holesPlayed++;
        }
      });

      const netScore = player.handicap ? totalStrokes - Math.round(player.handicap * holesPlayed / 18) : totalStrokes;

      return {
        player,
        totalStrokes,
        netScore,
        holesPlayed,
        toPar: totalStrokes - holes.slice(0, holesPlayed).reduce((sum, h) => sum + h.par, 0),
      };
    }).sort((a, b) => a.totalStrokes - b.totalStrokes);
  };

  const generateExportText = () => {
    let text = `${gameConfig.name} Game Results\n`;
    text += `${new Date().toLocaleDateString()}\n\n`;

    // Add standings
    text += 'STANDINGS\n';
    text += '---------\n';
    
    if (gameConfig.format === 'skins' && gameResults) {
      players.forEach(player => {
        const skinsWon = gameResults.skinsWon?.[player.id] || 0;
        const value = skinsWon * (gameConfig.settings?.skinValue || 1);
        text += `${player.name}: ${skinsWon} skins ($${value})\n`;
      });
      text += `\nCarried skins: ${gameResults.totalCarried || 0}\n`;
    } else if (gameConfig.format === 'nassau' && gameResults && !gameResults.error) {
      text += `Front 9: ${gameResults.front.status}\n`;
      text += `Back 9: ${gameResults.back.status}\n`;
      text += `Overall: ${gameResults.overall.status}\n`;
    } else if (gameConfig.format === 'stableford' && gameResults) {
      gameResults.leaderboard?.forEach((entry, index) => {
        const player = players.find(p => p.id === entry.playerId);
        text += `${index + 1}. ${player?.name}: ${entry.points} points\n`;
      });
    } else if (gameConfig.format === 'match' && gameResults && !gameResults.error) {
      text += `${gameResults.status}\n`;
      if (gameResults.winner) {
        const winner = players.find(p => p.id === gameResults.winner);
        text += `Winner: ${winner?.name}\n`;
      }
    } else if (gameConfig.format === 'stroke' && gameResults) {
      gameResults.leaderboard?.forEach((entry, index) => {
        const toPar = entry.toPar;
        const parText = toPar === 0 ? 'E' : toPar > 0 ? `+${toPar}` : `${toPar}`;
        text += `${index + 1}. ${entry.playerName}: ${entry.gross} (${parText})\n`;
      });
    }

    // Add hole-by-hole scores
    text += `\n\nHOLE-BY-HOLE SCORES\n`;
    text += `-----------------\n`;
    
    holes.forEach(hole => {
      text += `\nHole ${hole.holeNumber} (Par ${hole.par}):\n`;
      players.forEach(player => {
        const score = playerScores[player.id]?.[hole.holeNumber];
        if (score) {
          const diff = score - hole.par;
          const diffText = diff === 0 ? '' : diff > 0 ? ` (+${diff})` : ` (${diff})`;
          text += `  ${player.name}: ${score}${diffText}\n`;
        }
      });
    });

    return text;
  };

  const handleExport = async () => {
    try {
      const exportText = generateExportText();
      
      await Share.share({
        message: exportText,
        title: `${gameConfig.name} Game Results`,
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export game results');
      console.error('Export error:', error);
    }
  };

  const renderStandings = () => {
    switch (gameConfig.format) {
      case 'skins':
        return renderSkinsStandings();
      case 'nassau':
        return renderNassauStandings();
      case 'stableford':
        return renderStablefordStandings();
      case 'match':
        return renderMatchPlayStandings();
      case 'stroke':
        return renderStrokePlayStandings();
      default:
        return <Text style={styles.noData}>No standings available</Text>;
    }
  };

  const renderSkinsStandings = () => {
    const sortedPlayers = Object.entries(gameResults.skinsWon || {})
      .map(([playerId, skins]) => ({
        player: players.find(p => p.id === playerId),
        skins,
      }))
      .sort((a, b) => b.skins - a.skins);

    return (
      <View style={styles.standingsContainer}>
        <Text style={styles.standingsTitle}>Skins Leaderboard</Text>
        {gameResults.totalCarried > 0 && (
          <Text style={styles.carriedInfo}>
            {gameResults.totalCarried} skin{gameResults.totalCarried > 1 ? 's' : ''} carried to next hole
          </Text>
        )}
        {sortedPlayers.map((entry, index) => (
          <View key={entry.player.id} style={[styles.standingRow, index === 0 && entry.skins > 0 && styles.leaderRow]}>
            <Text style={styles.standingPosition}>{index + 1}</Text>
            <Text style={styles.standingName}>{entry.player.name}</Text>
            <Text style={styles.standingScore}>{entry.skins} 🏆</Text>
            {gameConfig.settings.skinValue && (
              <Text style={styles.standingValue}>${entry.skins * gameConfig.settings.skinValue}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderNassauStandings = () => {
    const { front, back, overall } = gameResults;
    const player1 = players[0];
    const player2 = players[1];

    const renderSegment = (segment, title, value) => (
      <View style={styles.nassauSegment}>
        <Text style={styles.nassauSegmentTitle}>{title} (${value})</Text>
        <Text style={[styles.nassauStatus, segment.winner && styles.closedMatch]}>
          {segment.status}
        </Text>
        <View style={styles.nassauScores}>
          <Text style={[styles.nassauPlayer, segment.winner === player1.id && styles.winnerText]}>
            {player1.name}: {segment.holesWon[player1.id]} holes
          </Text>
          <Text style={[styles.nassauPlayer, segment.winner === player2.id && styles.winnerText]}>
            {player2.name}: {segment.holesWon[player2.id]} holes
          </Text>
        </View>
      </View>
    );

    return (
      <View style={styles.standingsContainer}>
        <Text style={styles.standingsTitle}>Nassau Status</Text>
        {renderSegment(front, 'Front 9', gameConfig.settings.frontBet)}
        {renderSegment(back, 'Back 9', gameConfig.settings.backBet)}
        {renderSegment(overall, 'Overall', gameConfig.settings.overallBet)}
      </View>
    );
  };

  const renderStablefordStandings = () => {
    return (
      <View style={styles.standingsContainer}>
        <Text style={styles.standingsTitle}>Stableford Leaderboard</Text>
        {gameResults.leaderboard.map((entry, index) => {
          const player = players.find(p => p.id === entry.playerId);
          return (
            <View key={entry.playerId} style={[styles.standingRow, index === 0 && entry.points > 0 && styles.leaderRow]}>
              <Text style={styles.standingPosition}>{index + 1}</Text>
              <Text style={styles.standingName}>{player?.name}</Text>
              <Text style={styles.standingScore}>{entry.points} pts</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderMatchPlayStandings = () => {
    return (
      <View style={styles.standingsContainer}>
        <Text style={styles.standingsTitle}>Match Play Status</Text>
        <Text style={[styles.matchStatus, gameResults.matchClosed && styles.closedMatch]}>
          {gameResults.status}
        </Text>
        {!gameResults.matchClosed && (
          <Text style={styles.matchProgress}>
            Through {gameResults.holesPlayed} • {gameResults.holesRemaining} to play
          </Text>
        )}
      </View>
    );
  };

  const renderStrokePlayStandings = () => {
    const standings = calculateStrokePlayTotals();
    
    return (
      <View style={styles.standingsContainer}>
        <Text style={styles.standingsTitle}>Stroke Play Leaderboard</Text>
        {standings.map((entry, index) => (
          <View key={entry.player.id} style={[styles.standingRow, index === 0 && styles.leaderRow]}>
            <Text style={styles.standingPosition}>{index + 1}</Text>
            <Text style={styles.standingName}>{entry.player.name}</Text>
            <View style={styles.strokeScores}>
              <Text style={styles.standingScore}>{entry.totalStrokes}</Text>
              <Text style={[styles.toPar, entry.toPar < 0 ? styles.underPar : entry.toPar > 0 ? styles.overPar : styles.evenPar]}>
                {entry.toPar === 0 ? 'E' : entry.toPar > 0 ? `+${entry.toPar}` : entry.toPar}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderStatistics = () => {
    return (
      <ScrollView style={styles.statsContainer}>
        {players.map(player => {
          const stats = calculatePlayerStats(player);
          return (
            <View key={player.id} style={styles.playerStatsCard}>
              <Text style={styles.playerStatsName}>{player.name}</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Scoring Avg</Text>
                  <Text style={styles.statValue}>{stats.scoringAvg.toFixed(1)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Eagles</Text>
                  <Text style={styles.statValue}>{stats.eagles}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Birdies</Text>
                  <Text style={styles.statValue}>{stats.birdies}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Pars</Text>
                  <Text style={styles.statValue}>{stats.pars}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Bogeys</Text>
                  <Text style={styles.statValue}>{stats.bogeys}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Others</Text>
                  <Text style={styles.statValue}>{stats.others}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const calculatePlayerStats = (player) => {
    let totalStrokes = 0;
    let holesPlayed = 0;
    let eagles = 0;
    let birdies = 0;
    let pars = 0;
    let bogeys = 0;
    let others = 0;

    holes.forEach(hole => {
      const score = playerScores[player.id]?.[hole.holeNumber];
      if (score && score > 0) {
        totalStrokes += score;
        holesPlayed++;
        
        const diff = score - hole.par;
        if (diff <= -2) eagles++;
        else if (diff === -1) birdies++;
        else if (diff === 0) pars++;
        else if (diff === 1) bogeys++;
        else others++;
      }
    });

    return {
      scoringAvg: holesPlayed > 0 ? totalStrokes / holesPlayed : 0,
      eagles,
      birdies,
      pars,
      bogeys,
      others,
      holesPlayed,
    };
  };

  const renderSummary = () => {
    const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
    
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Round Summary</Text>
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Game Format</Text>
          <Text style={styles.summaryValue}>{gameConfig.name}</Text>
        </View>
        <View style={styles.summarySection}>
          <Text style={styles.summaryLabel}>Course Par</Text>
          <Text style={styles.summaryValue}>{totalPar}</Text>
        </View>
        {gameConfig.format === 'skins' && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Total Skins</Text>
            <Text style={styles.summaryValue}>
              {Object.values(gameResults.skinsWon || {}).reduce((sum, skins) => sum + skins, 0)}
            </Text>
          </View>
        )}
        {gameConfig.format === 'stableford' && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Winner</Text>
            <Text style={styles.summaryValue}>
              {getPlayerName(gameResults.leaderboard[0]?.playerId)} ({gameResults.leaderboard[0]?.points} pts)
            </Text>
          </View>
        )}
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
            <Text style={styles.title}>Game Status</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
                <Text style={styles.exportText}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'standings' && styles.activeTab]}
              onPress={() => setActiveTab('standings')}
            >
              <Text style={[styles.tabText, activeTab === 'standings' && styles.activeTabText]}>
                Standings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'statistics' && styles.activeTab]}
              onPress={() => setActiveTab('statistics')}
            >
              <Text style={[styles.tabText, activeTab === 'statistics' && styles.activeTabText]}>
                Statistics
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
              onPress={() => setActiveTab('summary')}
            >
              <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>
                Summary
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'standings' && renderStandings()}
            {activeTab === 'statistics' && renderStatistics()}
            {activeTab === 'summary' && renderSummary()}
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
    width: '95%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportButton: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  exportText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  title: {
    fontSize: 22,
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#2e7d32',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  standingsContainer: {
    marginBottom: 20,
  },
  standingsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  standingRow: {
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
  standingPosition: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    width: 30,
  },
  standingName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  standingScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
  },
  standingValue: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  carriedInfo: {
    fontSize: 14,
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  nassauSegment: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  nassauSegmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  nassauStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 8,
  },
  closedMatch: {
    color: '#1976d2',
  },
  nassauScores: {
    marginTop: 8,
  },
  nassauPlayer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  winnerText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  matchStatus: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginVertical: 20,
  },
  matchProgress: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  strokeScores: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toPar: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  underPar: {
    color: '#2e7d32',
  },
  overPar: {
    color: '#d32f2f',
  },
  evenPar: {
    color: '#666',
  },
  statsContainer: {
    flex: 1,
  },
  playerStatsCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  playerStatsName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2e7d32',
  },
  summaryContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  noData: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default GameStatusModal;