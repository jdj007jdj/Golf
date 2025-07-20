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
import gameCalculationService from '../../../services/gameCalculationService';
import gamePersistenceService from '../../../services/gamePersistenceService';
import NassauStatusModal from './NassauStatusModal';
import StablefordLeaderboardModal from './StablefordLeaderboardModal';
import MatchPlayStatusModal from './MatchPlayStatusModal';
import GameStatusModal from './GameStatusModal';

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
    round,
    token,
    isLocalAccount,
  } = useScorecardContext();
  
  const [playerScores, setPlayerScores] = useState({});
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [gameResults, setGameResults] = useState(null);
  const [showNassauModal, setShowNassauModal] = useState(false);
  const [showStablefordModal, setShowStablefordModal] = useState(false);
  const [showMatchPlayModal, setShowMatchPlayModal] = useState(false);
  const [showGameStatusModal, setShowGameStatusModal] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Initialize player scores and load saved game data
  useEffect(() => {
    const initializeGame = async () => {
      // Try to load existing game data
      const savedGameData = await gamePersistenceService.loadGameData(round?.id);
      
      if (savedGameData && savedGameData.playerScores) {
        // Use saved scores
        setPlayerScores(savedGameData.playerScores);
        console.log('✅ Loaded saved game data');
      } else {
        // Initialize new scores
        const initialScores = {};
        players.forEach(player => {
          initialScores[player.id] = {};
          holes.forEach(hole => {
            initialScores[player.id][hole.holeNumber] = player.isUser ? 
              (scores[hole.holeNumber] || '') : '';
          });
        });
        setPlayerScores(initialScores);
      }
    };
    
    initializeGame();
  }, [players, holes, round]);

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

  // Calculate game results whenever scores change
  useEffect(() => {
    if (gameConfig && playerScores && Object.keys(playerScores).length > 0) {
      let results = null;
      
      switch (gameConfig.format) {
        case 'skins':
          results = gameCalculationService.calculateSkins(
            playerScores,
            players,
            holes,
            gameConfig.settings
          );
          break;
        case 'nassau':
          results = gameCalculationService.calculateNassau(
            playerScores,
            players,
            holes,
            gameConfig.settings
          );
          break;
        case 'stableford':
          results = gameCalculationService.calculateStableford(
            playerScores,
            players,
            holes,
            gameConfig.settings
          );
          break;
        case 'match':
          results = gameCalculationService.calculateMatchPlay(
            playerScores,
            players,
            holes,
            gameConfig.settings
          );
          break;
        case 'stroke':
          results = gameCalculationService.calculateStrokePlay(
            playerScores,
            players,
            holes,
            gameConfig.settings
          );
          break;
        // Add other game formats as needed
      }
      
      setGameResults(results);
      
      // Save game data whenever results change
      if (round?.id && results) {
        const gameData = {
          gameConfig,
          players,
          playerScores,
          gameResults: results,
          currentHole,
        };
        gamePersistenceService.saveGameData(round.id, gameData);
      }
    }
  }, [playerScores, gameConfig, players, holes, round, currentHole]);

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

  // Set up periodic sync to backend (only for online accounts)
  useEffect(() => {
    if (!round?.id || !token || isLocalAccount) return;

    // Sync immediately when component mounts
    const syncNow = async () => {
      const success = await gamePersistenceService.syncGameToBackendWithQueue(token, round.id);
      if (success) {
        setLastSyncTime(new Date());
      }
    };
    syncNow();

    // Set up periodic sync every 30 seconds
    const syncInterval = setInterval(() => {
      syncNow();
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [round, token, isLocalAccount]);

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
    
    // Get game-specific info for this player
    let gameInfo = null;
    if (gameResults && gameConfig) {
      if (gameConfig.format === 'skins') {
        const skinsWon = gameResults.skinsWon?.[player.id] || 0;
        const isHoleWinner = gameResults.holeWinners?.[currentHole] === player.id;
        gameInfo = { skinsWon, isHoleWinner };
      } else if (gameConfig.format === 'nassau' && !gameResults.error) {
        const currentSegment = currentHole <= 9 ? gameResults.front : gameResults.back;
        const holesWon = currentSegment.holesWon?.[player.id] || 0;
        const overallWon = gameResults.overall.holesWon?.[player.id] || 0;
        const isHoleWinner = gameResults.holeResults?.[currentHole] === player.id;
        gameInfo = { 
          segmentHolesWon: holesWon,
          overallHolesWon: overallWon,
          isHoleWinner,
          currentSegmentStatus: currentSegment.status
        };
      } else if (gameConfig.format === 'stableford') {
        const totalPoints = gameResults.playerPoints?.[player.id] || 0;
        const holePoints = gameResults.holePoints?.[currentHole]?.[player.id] || 0;
        const position = gameResults.leaderboard?.findIndex(p => p.playerId === player.id) + 1 || 0;
        gameInfo = { 
          totalPoints,
          holePoints,
          position,
          isLeader: position === 1 && totalPoints > 0
        };
      } else if (gameConfig.format === 'match' && !gameResults.error) {
        const isPlayer1 = player.id === players[0].id;
        const holesWon = isPlayer1 ? gameResults.player1Holes : gameResults.player2Holes;
        const isHoleWinner = gameResults.holeResults?.[currentHole] === player.id;
        const isLeader = gameResults.leader === player.id;
        const isWinner = gameResults.winner === player.id;
        gameInfo = { 
          holesWon,
          isHoleWinner,
          isLeader,
          isWinner,
          matchStatus: gameResults.status,
          strokesReceived: gameResults.strokeReceiver === player.id ? gameResults.handicapStrokes : 0
        };
      } else if (gameConfig.format === 'stroke') {
        const totals = gameResults.playerTotals?.[player.id];
        const position = gameResults.leaderboard?.findIndex(p => p.playerId === player.id) + 1 || 0;
        gameInfo = {
          gross: totals?.gross || 0,
          toPar: totals?.toPar || 0,
          position,
          isLeader: position === 1 && totals?.gross > 0
        };
      }
      // Add other game format info as needed
    }

    return (
      <View key={player.id} style={[
        styles.playerRow,
        gameInfo?.isHoleWinner && styles.winnerRow
      ]}>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>
            {player.name}
            {gameInfo?.isHoleWinner && ' 🏆'}
            {gameInfo?.isLeader && gameConfig.format !== 'match' && ' 👑'}
            {gameInfo?.isWinner && ' 🏆👑'}
          </Text>
          <View style={styles.playerStatsRow}>
            <Text style={styles.playerHandicap}>HCP {player.handicap || 'N/A'}</Text>
            {gameInfo && gameConfig.format === 'skins' && gameInfo.skinsWon > 0 && (
              <Text style={styles.skinsCount}>Skins: {gameInfo.skinsWon}</Text>
            )}
            {gameInfo && gameConfig.format === 'nassau' && (
              <Text style={styles.nassauCount}>
                {currentHole <= 9 ? 'F9' : 'B9'}: {gameInfo.segmentHolesWon} | Total: {gameInfo.overallHolesWon}
              </Text>
            )}
            {gameInfo && gameConfig.format === 'stableford' && (
              <Text style={styles.stablefordCount}>
                Points: {gameInfo.totalPoints} {gameInfo.position > 0 && `(#${gameInfo.position})`}
              </Text>
            )}
            {gameInfo && gameConfig.format === 'match' && (
              <View style={styles.matchStatsContainer}>
                <Text style={styles.matchCount}>
                  Holes Won: {gameInfo.holesWon}
                </Text>
                {gameInfo.strokesReceived > 0 && (
                  <Text style={styles.matchHandicap}>
                    ({gameInfo.strokesReceived} strokes)
                  </Text>
                )}
              </View>
            )}
            {gameInfo && gameConfig.format === 'stroke' && (
              <Text style={styles.strokeCount}>
                Total: {gameInfo.gross} {gameInfo.toPar !== 0 && `(${gameInfo.toPar > 0 ? '+' : ''}${gameInfo.toPar})`}
              </Text>
            )}
          </View>
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
            {score && gameInfo && gameConfig.format === 'stableford' && gameInfo.holePoints > 0 && (
              <Text style={styles.holePoints}>
                +{gameInfo.holePoints} pts
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
        <View style={styles.gameInfoLeft}>
          <Text style={styles.gameType}>{gameConfig.name}</Text>
          {gameConfig.format === 'skins' && gameResults && (
            <Text style={styles.gameStatus}>
              {gameResults.totalCarried > 0 
                ? `${gameResults.totalCarried} skin${gameResults.totalCarried > 1 ? 's' : ''} carried`
                : `$${gameConfig.settings.skinValue} per skin`
              }
            </Text>
          )}
          {gameConfig.format === 'nassau' && gameResults && !gameResults.error && (
            <Text style={styles.gameStatus}>
              {currentHole <= 9 
                ? `Front: ${gameResults.front.status}`
                : `Back: ${gameResults.back.status}`
              }
            </Text>
          )}
          {gameConfig.format === 'stableford' && gameResults && (
            <Text style={styles.gameStatus}>
              Leader: {gameResults.leaderboard?.[0]?.points || 0} points
            </Text>
          )}
          {gameConfig.format === 'match' && gameResults && !gameResults.error && (
            <Text style={styles.gameStatus}>
              {gameResults.status} {gameResults.thru > 0 && !gameResults.matchClosed && `(thru ${gameResults.thru})`}
            </Text>
          )}
          {gameConfig.format === 'stroke' && gameResults && (
            <Text style={styles.gameStatus}>
              Leader: {gameResults.leaderboard?.[0]?.gross || 0} strokes
            </Text>
          )}
        </View>
        {gameConfig.format === 'nassau' && gameResults && !gameResults.error && (
          <TouchableOpacity 
            style={styles.statusButton}
            onPress={() => setShowNassauModal(true)}
          >
            <Text style={styles.statusButtonText}>View All</Text>
          </TouchableOpacity>
        )}
        {gameConfig.format === 'stableford' && gameResults && (
          <TouchableOpacity 
            style={styles.statusButton}
            onPress={() => setShowStablefordModal(true)}
          >
            <Text style={styles.statusButtonText}>Leaderboard</Text>
          </TouchableOpacity>
        )}
        {gameConfig.format === 'match' && gameResults && !gameResults.error && (
          <TouchableOpacity 
            style={styles.statusButton}
            onPress={() => setShowMatchPlayModal(true)}
          >
            <Text style={styles.statusButtonText}>Details</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Player Scores */}
      <ScrollView style={styles.playersContainer}>
        {players.map(renderPlayerScoreRow)}
      </ScrollView>

      {/* Bottom Container for Button and Hole Navigation */}
      <View style={styles.bottomContainer}>
        {/* Game Status Button */}
        <TouchableOpacity 
          style={styles.gameStatusButton}
          onPress={() => setShowGameStatusModal(true)}
        >
          <Text style={styles.gameStatusButtonText}>View Full Game Status</Text>
        </TouchableOpacity>

        {/* Hole Navigation Dots */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.holeDotsContainer}
          contentContainerStyle={styles.holeDotsContent}
        >
          {holes.map((hole) => {
            const isCarried = gameConfig?.format === 'skins' && 
                             gameResults?.carriedHoles?.includes(hole.holeNumber);
            
            let holeWinnerIndicator = null;
            if ((gameConfig?.format === 'nassau' || gameConfig?.format === 'match') && gameResults?.holeResults) {
              const winner = gameResults.holeResults[hole.holeNumber];
              if (winner && winner !== 'halved') {
                const winnerPlayer = players.find(p => p.id === winner);
                holeWinnerIndicator = winnerPlayer?.isUser ? '●' : '○';
              }
            }
            
            return (
              <TouchableOpacity
                key={hole.holeNumber}
                style={[
                  styles.holeDot,
                  currentHole === hole.holeNumber && styles.holeDotActive,
                  isCarried && styles.holeDotCarried
                ]}
                onPress={() => setCurrentHole(hole.holeNumber)}
              >
                <Text style={[
                  styles.holeDotText,
                  currentHole === hole.holeNumber && styles.holeDotTextActive
                ]}>
                  {hole.holeNumber}
                </Text>
                {isCarried && (
                  <View style={styles.carriedIndicator} />
                )}
                {holeWinnerIndicator && (
                  <Text style={styles.holeWinnerIndicator}>{holeWinnerIndicator}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Nassau Status Modal */}
      {gameConfig?.format === 'nassau' && (
        <NassauStatusModal
          visible={showNassauModal}
          onClose={() => setShowNassauModal(false)}
          gameResults={gameResults}
          players={players}
          gameConfig={gameConfig}
        />
      )}

      {/* Stableford Leaderboard Modal */}
      {gameConfig?.format === 'stableford' && (
        <StablefordLeaderboardModal
          visible={showStablefordModal}
          onClose={() => setShowStablefordModal(false)}
          gameResults={gameResults}
          players={players}
          gameConfig={gameConfig}
          holes={holes}
        />
      )}

      {/* Match Play Status Modal */}
      {gameConfig?.format === 'match' && (
        <MatchPlayStatusModal
          visible={showMatchPlayModal}
          onClose={() => setShowMatchPlayModal(false)}
          gameResults={gameResults}
          players={players}
          gameConfig={gameConfig}
          holes={holes}
        />
      )}

      {/* Comprehensive Game Status Modal */}
      <GameStatusModal
        visible={showGameStatusModal}
        onClose={() => setShowGameStatusModal(false)}
        gameConfig={gameConfig}
        gameResults={gameResults}
        players={players}
        holes={holes}
        playerScores={playerScores}
      />
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
  gameInfoLeft: {
    flex: 1,
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
  statusButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  statusButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  playersContainer: {
    flex: 1,
    paddingBottom: 150, // Space for bottom container
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
    gap: 12,
  },
  playerInfo: {
    flex: 1,
    marginRight: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  playerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 12,
  },
  playerHandicap: {
    fontSize: 14,
    color: '#666',
  },
  skinsCount: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  nassauCount: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  stablefordCount: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  matchStatsContainer: {
    flexDirection: 'column',
    gap: 2,
  },
  matchCount: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  matchHandicap: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  strokeCount: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  winnerRow: {
    borderWidth: 2,
    borderColor: '#ffd700',
    backgroundColor: '#fffef0',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
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
  holePoints: {
    fontSize: 12,
    marginTop: 2,
    color: '#4caf50',
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameStatusButton: {
    backgroundColor: '#2e7d32',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  gameStatusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  holeDotsContainer: {
    backgroundColor: 'transparent',
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
  holeDotCarried: {
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  carriedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9800',
  },
  holeWinnerIndicator: {
    position: 'absolute',
    bottom: -8,
    fontSize: 10,
    color: '#2e7d32',
  },
});

export default GameScoringView;