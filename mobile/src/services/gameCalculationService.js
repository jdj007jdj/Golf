/**
 * Game Calculation Service
 * Handles all game format calculations and scoring logic
 */

class GameCalculationService {
  /**
   * Calculate Skins game results
   * @param {Object} playerScores - { playerId: { holeNumber: score } }
   * @param {Array} players - Array of player objects
   * @param {Array} holes - Array of hole objects with par info
   * @param {Object} settings - Game settings (carryOver, skinValue)
   * @returns {Object} Skins game state
   */
  calculateSkins(playerScores, players, holes, settings = {}) {
    const { carryOver = true } = settings;
    const results = {
      holeWinners: {}, // { holeNumber: playerId or null if tied }
      skinsWon: {}, // { playerId: count }
      carriedHoles: [], // Array of hole numbers that carried
      totalCarried: 0, // Number of skins currently carried
      currentStatus: '', // Status message
    };

    // Initialize skins count for each player
    players.forEach(player => {
      results.skinsWon[player.id] = 0;
    });

    let carriedSkins = 0;

    // Process each hole
    holes.forEach((hole, index) => {
      const holeNumber = hole.holeNumber;
      const holeScores = {};
      let validScores = false;

      // Get scores for this hole
      players.forEach(player => {
        const score = playerScores[player.id]?.[holeNumber];
        if (score && score > 0) {
          holeScores[player.id] = score;
          validScores = true;
        }
      });

      // Skip if no valid scores yet
      if (!validScores) {
        return;
      }

      // Find the best score
      const scores = Object.values(holeScores);
      const bestScore = Math.min(...scores);

      // Find all players with the best score
      const winners = Object.entries(holeScores)
        .filter(([_, score]) => score === bestScore)
        .map(([playerId, _]) => playerId);

      if (winners.length === 1) {
        // Single winner
        const winnerId = winners[0];
        results.holeWinners[holeNumber] = winnerId;
        
        // Award skins (1 + any carried)
        const skinsToAward = 1 + carriedSkins;
        results.skinsWon[winnerId] += skinsToAward;
        
        // Clear carried skins
        carriedSkins = 0;
      } else {
        // Tie - no winner
        results.holeWinners[holeNumber] = null;
        
        if (carryOver) {
          // Carry the skin to next hole
          carriedSkins += 1;
          results.carriedHoles.push(holeNumber);
        }
      }
    });

    // Update total carried
    results.totalCarried = carriedSkins;

    // Generate status message
    if (carriedSkins > 0) {
      results.currentStatus = `${carriedSkins} skin${carriedSkins > 1 ? 's' : ''} carried`;
    } else {
      const leader = this.getSkinsLeader(results.skinsWon);
      if (leader) {
        results.currentStatus = `${leader.name} leads with ${leader.skins} skin${leader.skins > 1 ? 's' : ''}`;
      }
    }

    return results;
  }

  /**
   * Determine the winner of a specific hole
   * @param {Object} holeScores - { playerId: score }
   * @returns {Object} { winner: playerId or null, tied: boolean, scores: sortedScores }
   */
  determineHoleWinner(holeScores) {
    if (!holeScores || Object.keys(holeScores).length === 0) {
      return { winner: null, tied: false, scores: [] };
    }

    // Sort scores
    const sortedScores = Object.entries(holeScores)
      .filter(([_, score]) => score && score > 0)
      .sort((a, b) => a[1] - b[1])
      .map(([playerId, score]) => ({ playerId, score }));

    if (sortedScores.length === 0) {
      return { winner: null, tied: false, scores: [] };
    }

    const bestScore = sortedScores[0].score;
    const winners = sortedScores.filter(s => s.score === bestScore);

    return {
      winner: winners.length === 1 ? winners[0].playerId : null,
      tied: winners.length > 1,
      scores: sortedScores,
    };
  }

  /**
   * Get the current leader in skins
   * @param {Object} skinsWon - { playerId: count }
   * @returns {Object} { playerId, skins, name }
   */
  getSkinsLeader(skinsWon) {
    const entries = Object.entries(skinsWon);
    if (entries.length === 0) return null;

    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const maxSkins = sorted[0][1];

    if (maxSkins === 0) return null;

    return {
      playerId: sorted[0][0],
      skins: maxSkins,
    };
  }

  /**
   * Calculate Nassau game results
   * @param {Object} playerScores - { playerId: { holeNumber: score } }
   * @param {Array} players - Array of player objects
   * @param {Array} holes - Array of hole objects
   * @param {Object} settings - Game settings
   * @returns {Object} Nassau game state
   */
  calculateNassau(playerScores, players, holes, settings = {}) {
    // Nassau is typically a 2-player game
    if (players.length < 2) {
      return { error: 'Nassau requires at least 2 players' };
    }

    const { useHandicaps = true, presses = false } = settings;
    
    // For simplicity, we'll handle 2-player Nassau first
    // Multi-player Nassau would involve multiple matches
    const player1 = players[0];
    const player2 = players[1];
    
    // Initialize results
    const results = {
      front: {
        holesWon: { [player1.id]: 0, [player2.id]: 0 },
        holesLost: { [player1.id]: 0, [player2.id]: 0 },
        holesTied: 0,
        status: 'All Square',
        thru: 0,
        winner: null,
      },
      back: {
        holesWon: { [player1.id]: 0, [player2.id]: 0 },
        holesLost: { [player1.id]: 0, [player2.id]: 0 },
        holesTied: 0,
        status: 'All Square',
        thru: 0,
        winner: null,
      },
      overall: {
        holesWon: { [player1.id]: 0, [player2.id]: 0 },
        holesLost: { [player1.id]: 0, [player2.id]: 0 },
        holesTied: 0,
        status: 'All Square',
        thru: 0,
        winner: null,
      },
      holeResults: {}, // { holeNumber: 'player1' | 'player2' | 'halved' }
      presses: [], // Track any presses if enabled
    };

    // Process each hole
    let frontComplete = false;
    let backComplete = false;
    
    holes.forEach((hole) => {
      const holeNumber = hole.holeNumber;
      const score1 = playerScores[player1.id]?.[holeNumber];
      const score2 = playerScores[player2.id]?.[holeNumber];
      
      // Skip if either player hasn't played this hole
      if (!score1 || !score2) return;
      
      // Apply handicap strokes if enabled
      let netScore1 = score1;
      let netScore2 = score2;
      
      if (useHandicaps && player1.handicap && player2.handicap) {
        // Simple handicap application - would need hole handicap info for proper implementation
        const handicapDiff = Math.abs(player1.handicap - player2.handicap);
        // This is simplified - proper implementation would distribute strokes across holes
        if (player1.handicap > player2.handicap) {
          netScore1 = score1 - (handicapDiff > 0 ? 1 : 0);
        } else if (player2.handicap > player1.handicap) {
          netScore2 = score2 - (handicapDiff > 0 ? 1 : 0);
        }
      }
      
      // Determine hole winner
      let holeWinner = null;
      if (netScore1 < netScore2) {
        holeWinner = player1.id;
      } else if (netScore2 < netScore1) {
        holeWinner = player2.id;
      } else {
        holeWinner = 'halved';
      }
      
      results.holeResults[holeNumber] = holeWinner;
      
      // Update segment results
      const isFront9 = holeNumber <= 9;
      const segment = isFront9 ? results.front : results.back;
      
      // Update overall results
      if (holeWinner === player1.id) {
        segment.holesWon[player1.id]++;
        segment.holesLost[player2.id]++;
        results.overall.holesWon[player1.id]++;
        results.overall.holesLost[player2.id]++;
      } else if (holeWinner === player2.id) {
        segment.holesWon[player2.id]++;
        segment.holesLost[player1.id]++;
        results.overall.holesWon[player2.id]++;
        results.overall.holesLost[player1.id]++;
      } else {
        segment.holesTied++;
        results.overall.holesTied++;
      }
      
      // Update thru count
      segment.thru++;
      results.overall.thru++;
      
      // Check if segments are complete
      if (holeNumber === 9) frontComplete = true;
      if (holeNumber === 18) backComplete = true;
    });
    
    // Calculate match status for each segment
    const calculateMatchStatus = (segment, player1, player2) => {
      const p1Holes = segment.holesWon[player1.id];
      const p2Holes = segment.holesWon[player2.id];
      const diff = p1Holes - p2Holes;
      const holesRemaining = (segment === results.front ? 9 : segment === results.back ? 9 : 18) - segment.thru;
      
      if (diff === 0) {
        segment.status = 'All Square';
      } else if (diff > 0) {
        // Check if match is dormie or won
        if (diff > holesRemaining) {
          segment.status = `${player1.name} wins ${diff}&${holesRemaining}`;
          segment.winner = player1.id;
        } else if (diff === holesRemaining) {
          segment.status = `${player1.name} ${diff} UP (dormie)`;
        } else {
          segment.status = `${player1.name} ${diff} UP`;
        }
      } else {
        const absDiff = Math.abs(diff);
        if (absDiff > holesRemaining) {
          segment.status = `${player2.name} wins ${absDiff}&${holesRemaining}`;
          segment.winner = player2.id;
        } else if (absDiff === holesRemaining) {
          segment.status = `${player2.name} ${absDiff} UP (dormie)`;
        } else {
          segment.status = `${player2.name} ${absDiff} UP`;
        }
      }
    };
    
    // Update status for each segment
    if (results.front.thru > 0) {
      calculateMatchStatus(results.front, player1, player2);
    }
    if (results.back.thru > 0) {
      calculateMatchStatus(results.back, player1, player2);
    }
    if (results.overall.thru > 0) {
      calculateMatchStatus(results.overall, player1, player2);
    }
    
    // Handle multi-player Nassau (each player plays against each other)
    if (players.length > 2) {
      results.multiPlayerMatches = [];
      for (let i = 0; i < players.length - 1; i++) {
        for (let j = i + 1; j < players.length; j++) {
          // Create a match between players[i] and players[j]
          // This would follow the same logic as above
          results.multiPlayerMatches.push({
            player1: players[i],
            player2: players[j],
            // ... match results
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Calculate Stableford points
   * @param {number} score - Player's score on the hole
   * @param {number} par - Hole par
   * @param {Object} settings - Point values for each score type
   * @param {number} handicapStrokes - Number of handicap strokes on this hole
   * @returns {number} Points earned
   */
  calculateStablefordPoints(score, par, settings = {}, handicapStrokes = 0) {
    const {
      eaglePoints = 4,
      birdiePoints = 3,
      parPoints = 2,
      bogeyPoints = 1,
    } = settings;

    if (!score || score <= 0) return 0;

    // Apply handicap strokes to get net score
    const netScore = score - handicapStrokes;
    const diff = netScore - par;

    if (diff <= -2) return eaglePoints; // Eagle or better
    if (diff === -1) return birdiePoints; // Birdie
    if (diff === 0) return parPoints; // Par
    if (diff === 1) return bogeyPoints; // Bogey
    return 0; // Double bogey or worse
  }

  /**
   * Calculate Stableford game results
   * @param {Object} playerScores - { playerId: { holeNumber: score } }
   * @param {Array} players - Array of player objects
   * @param {Array} holes - Array of hole objects
   * @param {Object} settings - Game settings including point values
   * @returns {Object} Stableford game state
   */
  calculateStableford(playerScores, players, holes, settings = {}) {
    const { useHandicaps = true } = settings;
    const results = {
      playerPoints: {}, // { playerId: totalPoints }
      holePoints: {}, // { holeNumber: { playerId: points } }
      leaderboard: [], // Sorted array of { playerId, points }
    };

    // Initialize points for each player
    players.forEach(player => {
      results.playerPoints[player.id] = 0;
    });

    // Calculate points for each hole
    holes.forEach(hole => {
      const holeNumber = hole.holeNumber;
      results.holePoints[holeNumber] = {};

      players.forEach(player => {
        const score = playerScores[player.id]?.[holeNumber];
        if (score && score > 0) {
          let handicapStrokes = 0;
          
          if (useHandicaps && player.handicap) {
            // Simple handicap distribution - in a real app, would use hole handicap index
            const strokesPerHole = player.handicap / 18;
            handicapStrokes = Math.floor(strokesPerHole);
            
            // Distribute remaining strokes to hardest holes (simplified)
            const remainingStrokes = player.handicap % 18;
            if (holeNumber <= remainingStrokes) {
              handicapStrokes += 1;
            }
          }
          
          const points = this.calculateStablefordPoints(score, hole.par, settings, handicapStrokes);
          results.holePoints[holeNumber][player.id] = points;
          results.playerPoints[player.id] += points;
        }
      });
    });

    // Create leaderboard
    results.leaderboard = Object.entries(results.playerPoints)
      .map(([playerId, points]) => ({ playerId, points }))
      .sort((a, b) => b.points - a.points);

    return results;
  }

  /**
   * Calculate Match Play results
   * @param {Object} playerScores - { playerId: { holeNumber: score } }
   * @param {Array} players - Array of player objects (assumes 2 players)
   * @param {Array} holes - Array of hole objects
   * @param {Object} settings - Game settings (useHandicaps, concessionAllowed)
   * @returns {Object} Match play state
   */
  calculateMatchPlay(playerScores, players, holes, settings = {}) {
    if (players.length !== 2) {
      return { error: 'Match play requires exactly 2 players' };
    }

    const { useHandicaps = true } = settings;
    const [player1, player2] = players;
    let player1Holes = 0;
    let player2Holes = 0;
    const holeResults = {};
    let holesPlayed = 0;
    let matchClosed = false;
    let closedAfterHole = null;

    // Calculate handicap strokes to give
    let handicapStrokes = 0;
    let strokeReceiver = null;
    if (useHandicaps && player1.handicap !== undefined && player2.handicap !== undefined) {
      const handicapDiff = Math.abs(player1.handicap - player2.handicap);
      handicapStrokes = Math.round(handicapDiff);
      strokeReceiver = player1.handicap > player2.handicap ? player1.id : player2.id;
    }

    holes.forEach((hole, index) => {
      const score1 = playerScores[player1.id]?.[hole.holeNumber];
      const score2 = playerScores[player2.id]?.[hole.holeNumber];

      if (score1 && score2 && !matchClosed) {
        holesPlayed++;
        
        // Apply handicap strokes (simplified - would use hole handicap index in real app)
        let netScore1 = score1;
        let netScore2 = score2;
        
        if (handicapStrokes > 0 && index < handicapStrokes) {
          if (strokeReceiver === player1.id) {
            netScore1 = score1 - 1;
          } else {
            netScore2 = score2 - 1;
          }
        }

        // Determine hole winner
        if (netScore1 < netScore2) {
          player1Holes++;
          holeResults[hole.holeNumber] = player1.id;
        } else if (netScore2 < netScore1) {
          player2Holes++;
          holeResults[hole.holeNumber] = player2.id;
        } else {
          holeResults[hole.holeNumber] = 'halved';
        }

        // Check if match is closed
        const currentDiff = Math.abs(player1Holes - player2Holes);
        const holesRemaining = 18 - holesPlayed;
        
        if (currentDiff > holesRemaining) {
          matchClosed = true;
          closedAfterHole = hole.holeNumber;
        }
      }
    });

    const diff = player1Holes - player2Holes;
    const holesRemaining = 18 - holesPlayed;
    let status = '';
    let winner = null;

    if (matchClosed) {
      const winMargin = Math.abs(diff);
      const holesLeft = 18 - closedAfterHole;
      if (diff > 0) {
        status = `${player1.name} wins ${winMargin}&${holesLeft}`;
        winner = player1.id;
      } else {
        status = `${player2.name} wins ${winMargin}&${holesLeft}`;
        winner = player2.id;
      }
    } else if (diff === 0) {
      status = 'All Square';
    } else if (diff > 0) {
      if (diff === holesRemaining && holesRemaining > 0) {
        status = `${player1.name} ${diff} UP (dormie)`;
      } else {
        status = `${player1.name} ${diff} UP`;
      }
    } else {
      const absDiff = Math.abs(diff);
      if (absDiff === holesRemaining && holesRemaining > 0) {
        status = `${player2.name} ${absDiff} UP (dormie)`;
      } else {
        status = `${player2.name} ${absDiff} UP`;
      }
    }

    return {
      player1Holes,
      player2Holes,
      holeResults,
      status,
      leader: diff > 0 ? player1.id : diff < 0 ? player2.id : null,
      holesPlayed,
      holesRemaining,
      matchClosed,
      winner,
      thru: holesPlayed,
      handicapStrokes,
      strokeReceiver,
    };
  }

  /**
   * Calculate Stroke Play results
   * @param {Object} playerScores - { playerId: { holeNumber: score } }
   * @param {Array} players - Array of player objects
   * @param {Array} holes - Array of hole objects
   * @param {Object} settings - Game settings (useHandicaps)
   * @returns {Object} Stroke play state
   */
  calculateStrokePlay(playerScores, players, holes, settings = {}) {
    const { useHandicaps = false } = settings;
    const results = {
      playerTotals: {}, // { playerId: { gross, net, toPar, holesPlayed } }
      leaderboard: [], // Sorted array by gross score
      netLeaderboard: [], // Sorted array by net score
    };

    // Calculate totals for each player
    players.forEach(player => {
      let grossTotal = 0;
      let holesPlayed = 0;
      let totalPar = 0;

      holes.forEach(hole => {
        const score = playerScores[player.id]?.[hole.holeNumber];
        if (score && score > 0) {
          grossTotal += score;
          holesPlayed++;
          totalPar += hole.par;
        }
      });

      // Calculate net score
      const handicapStrokes = useHandicaps && player.handicap ? 
        Math.round(player.handicap * holesPlayed / 18) : 0;
      const netTotal = grossTotal - handicapStrokes;

      results.playerTotals[player.id] = {
        gross: grossTotal,
        net: netTotal,
        toPar: grossTotal - totalPar,
        holesPlayed,
        handicapStrokes,
      };
    });

    // Create leaderboards
    results.leaderboard = Object.entries(results.playerTotals)
      .map(([playerId, totals]) => ({
        playerId,
        gross: totals.gross,
        toPar: totals.toPar,
        holesPlayed: totals.holesPlayed,
      }))
      .sort((a, b) => a.gross - b.gross);

    results.netLeaderboard = Object.entries(results.playerTotals)
      .map(([playerId, totals]) => ({
        playerId,
        net: totals.net,
        handicapStrokes: totals.handicapStrokes,
      }))
      .sort((a, b) => a.net - b.net);

    return results;
  }
}

// Export a singleton instance
export default new GameCalculationService();