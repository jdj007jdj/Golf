/**
 * Course Performance Analysis Utilities
 * 
 * This module provides functions to analyze golf performance across rounds
 * for the same course, enabling historical insights and trends.
 */

/**
 * Calculate course averages from historical rounds
 * @param {Array} rounds - Array of completed rounds for a specific course
 * @param {Object} course - Course object with hole information
 * @returns {Object} Course performance averages
 */
export const calculateCourseAverages = (rounds, course) => {
  if (!rounds || rounds.length === 0) {
    return {
      totalRounds: 0,
      averageScore: 0,
      averageScoreVsPar: 0,
      coursePar: course?.holes?.reduce((sum, hole) => sum + hole.par, 0) || 72,
      completedRounds: 0,
      partialRounds: 0
    };
  }

  const coursePar = course?.holes?.reduce((sum, hole) => sum + hole.par, 0) || 72;
  
  // Filter for rounds with at least some scores
  const roundsWithScores = rounds.filter(round => 
    round.scores && Object.keys(round.scores).length > 0
  );

  if (roundsWithScores.length === 0) {
    return {
      totalRounds: rounds.length,
      averageScore: 0,
      averageScoreVsPar: 0,
      coursePar,
      completedRounds: 0,
      partialRounds: rounds.length
    };
  }

  // Calculate averages
  let totalScore = 0;
  let totalHolesPlayed = 0;
  let completedRounds = 0;
  let partialRounds = 0;

  roundsWithScores.forEach(round => {
    const scores = round.scores || {};
    const roundScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    const holesPlayed = Object.keys(scores).filter(hole => scores[hole] > 0).length;
    
    totalScore += roundScore;
    totalHolesPlayed += holesPlayed;
    
    // Check if round is complete (18 holes) or partial
    if (holesPlayed === 18) {
      completedRounds++;
    } else if (holesPlayed > 0) {
      partialRounds++;
    }
  });

  const averageScore = totalHolesPlayed > 0 ? totalScore / totalHolesPlayed : 0;
  const averageScoreVsPar = averageScore > 0 ? averageScore - (coursePar / 18) : 0;

  return {
    totalRounds: roundsWithScores.length,
    averageScore: parseFloat(averageScore.toFixed(2)),
    averageScoreVsPar: parseFloat(averageScoreVsPar.toFixed(2)),
    coursePar,
    completedRounds,
    partialRounds,
    totalHolesPlayed
  };
};

/**
 * Find best and worst rounds on a course
 * @param {Array} rounds - Array of completed rounds for a specific course
 * @param {Object} course - Course object with hole information
 * @returns {Object} Best and worst round information
 */
export const findBestWorstRounds = (rounds, course) => {
  if (!rounds || rounds.length === 0) {
    return {
      bestRound: null,
      worstRound: null,
      bestScore: null,
      worstScore: null
    };
  }

  const coursePar = course?.holes?.reduce((sum, hole) => sum + hole.par, 0) || 72;
  
  // Only consider rounds with significant scoring (at least 9 holes)
  const validRounds = rounds.filter(round => {
    const scores = round.scores || {};
    const holesPlayed = Object.keys(scores).filter(hole => scores[hole] > 0).length;
    return holesPlayed >= 9;
  }).map(round => {
    const scores = round.scores || {};
    const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    const holesPlayed = Object.keys(scores).filter(hole => scores[hole] > 0).length;
    const projectedScore = holesPlayed === 18 ? totalScore : Math.round((totalScore / holesPlayed) * 18);
    
    return {
      ...round,
      totalScore,
      holesPlayed,
      projectedScore,
      scoreToPar: projectedScore - coursePar
    };
  });

  if (validRounds.length === 0) {
    return {
      bestRound: null,
      worstRound: null,
      bestScore: null,
      worstScore: null
    };
  }

  // Sort by projected score (lower is better)
  const sortedRounds = validRounds.sort((a, b) => a.projectedScore - b.projectedScore);
  
  const bestRound = sortedRounds[0];
  const worstRound = sortedRounds[sortedRounds.length - 1];

  return {
    bestRound: {
      id: bestRound.id,
      date: bestRound.createdAt || bestRound.date,
      score: bestRound.totalScore,
      projectedScore: bestRound.projectedScore,
      scoreToPar: bestRound.scoreToPar,
      holesPlayed: bestRound.holesPlayed
    },
    worstRound: {
      id: worstRound.id,
      date: worstRound.createdAt || worstRound.date,
      score: worstRound.totalScore,
      projectedScore: worstRound.projectedScore,
      scoreToPar: worstRound.scoreToPar,
      holesPlayed: worstRound.holesPlayed
    },
    bestScore: bestRound.projectedScore,
    worstScore: worstRound.projectedScore
  };
};

/**
 * Calculate hole-by-hole performance statistics
 * @param {Array} rounds - Array of completed rounds for a specific course
 * @param {Object} course - Course object with hole information
 * @returns {Object} Hole-by-hole performance data
 */
export const calculateHolePerformance = (rounds, course) => {
  if (!rounds || rounds.length === 0 || !course?.holes) {
    return {};
  }

  const holeStats = {};
  
  // Initialize stats for each hole
  course.holes.forEach(hole => {
    holeStats[hole.holeNumber] = {
      holeNumber: hole.holeNumber,
      par: hole.par,
      timesPlayed: 0,
      totalScore: 0,
      averageScore: 0,
      averageVsPar: 0,
      bestScore: null,
      worstScore: null,
      scores: [],
      eagles: 0,
      birdies: 0,
      pars: 0,
      bogeys: 0,
      doubleBogeys: 0,
      worse: 0
    };
  });

  // Analyze each round
  rounds.forEach(round => {
    const scores = round.scores || {};
    
    Object.keys(scores).forEach(holeNumber => {
      const score = scores[holeNumber];
      const holeNum = parseInt(holeNumber);
      
      if (score > 0 && holeStats[holeNum]) {
        const hole = holeStats[holeNum];
        const par = hole.par;
        
        hole.timesPlayed++;
        hole.totalScore += score;
        hole.scores.push(score);
        
        // Update best/worst
        if (hole.bestScore === null || score < hole.bestScore) {
          hole.bestScore = score;
        }
        if (hole.worstScore === null || score > hole.worstScore) {
          hole.worstScore = score;
        }
        
        // Categorize score
        if (score <= par - 2) {
          hole.eagles++;
        } else if (score === par - 1) {
          hole.birdies++;
        } else if (score === par) {
          hole.pars++;
        } else if (score === par + 1) {
          hole.bogeys++;
        } else if (score === par + 2) {
          hole.doubleBogeys++;
        } else {
          hole.worse++;
        }
      }
    });
  });

  // Calculate averages for each hole
  Object.keys(holeStats).forEach(holeNumber => {
    const hole = holeStats[holeNumber];
    if (hole.timesPlayed > 0) {
      hole.averageScore = parseFloat((hole.totalScore / hole.timesPlayed).toFixed(2));
      hole.averageVsPar = parseFloat((hole.averageScore - hole.par).toFixed(2));
      
      // Calculate percentages
      hole.eaglePercentage = Math.round((hole.eagles / hole.timesPlayed) * 100);
      hole.birdiePercentage = Math.round((hole.birdies / hole.timesPlayed) * 100);
      hole.parPercentage = Math.round((hole.pars / hole.timesPlayed) * 100);
      hole.bogeyPercentage = Math.round((hole.bogeys / hole.timesPlayed) * 100);
      hole.doubleBogeyPercentage = Math.round((hole.doubleBogeys / hole.timesPlayed) * 100);
      hole.worsePercentage = Math.round((hole.worse / hole.timesPlayed) * 100);
      
      // Determine hole difficulty (relative to par)
      if (hole.averageVsPar <= -0.5) {
        hole.difficulty = 'easy'; // Scoring well below par
      } else if (hole.averageVsPar <= 0.2) {
        hole.difficulty = 'fair'; // Close to par
      } else if (hole.averageVsPar <= 0.8) {
        hole.difficulty = 'challenging'; // Above par
      } else {
        hole.difficulty = 'trouble'; // Well above par
      }
    }
  });

  return holeStats;
};

/**
 * Get course performance summary for display
 * @param {Array} rounds - Array of completed rounds for a specific course
 * @param {Object} course - Course object with hole information
 * @returns {Object} Complete course performance summary
 */
export const getCoursePerformanceSummary = (rounds, course) => {
  const averages = calculateCourseAverages(rounds, course);
  const bestWorst = findBestWorstRounds(rounds, course);
  const holePerformance = calculateHolePerformance(rounds, course);
  
  // Find strongest and weakest holes
  const holes = Object.values(holePerformance).filter(hole => hole.timesPlayed > 0);
  const strongestHoles = holes
    .sort((a, b) => a.averageVsPar - b.averageVsPar)
    .slice(0, 3);
  const weakestHoles = holes
    .sort((a, b) => b.averageVsPar - a.averageVsPar)
    .slice(0, 3);
  
  return {
    courseAverages: averages,
    bestWorstRounds: bestWorst,
    holePerformance,
    strongestHoles,
    weakestHoles,
    courseName: course?.name || 'Unknown Course',
    courseId: course?.id
  };
};

/**
 * ROUND HISTORY FILTERING UTILITIES
 * Functions to filter and organize round data for historical analysis
 */

/**
 * Filter rounds by course ID
 * @param {Array} allRounds - Array of all rounds across all courses
 * @param {String} courseId - ID of the course to filter by
 * @returns {Array} Filtered rounds for the specified course
 */
export const filterRoundsByCourse = (allRounds, courseId) => {
  if (!allRounds || !courseId) {
    return [];
  }
  
  return allRounds.filter(round => 
    round.courseId === courseId || round.course?.id === courseId
  );
};

/**
 * Filter rounds by date range
 * @param {Array} rounds - Array of rounds to filter
 * @param {String|Date} startDate - Start date (inclusive)
 * @param {String|Date} endDate - End date (inclusive)
 * @returns {Array} Filtered rounds within the date range
 */
export const filterRoundsByDateRange = (rounds, startDate, endDate) => {
  if (!rounds || rounds.length === 0) {
    return [];
  }
  
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  return rounds.filter(round => {
    const roundDate = new Date(round.createdAt || round.date || round.playedAt);
    
    // Skip invalid dates
    if (isNaN(roundDate.getTime())) {
      return false;
    }
    
    // Check start date
    if (start && roundDate < start) {
      return false;
    }
    
    // Check end date
    if (end && roundDate > end) {
      return false;
    }
    
    return true;
  });
};

/**
 * Filter rounds by completion status
 * @param {Array} rounds - Array of rounds to filter
 * @param {String} completionType - 'full', 'partial', 'front9', 'back9', or 'all'
 * @returns {Array} Filtered rounds based on completion status
 */
export const filterRoundsByCompletion = (rounds, completionType = 'all') => {
  if (!rounds || rounds.length === 0) {
    return [];
  }
  
  return rounds.filter(round => {
    const scores = round.scores || {};
    const scoredHoles = Object.keys(scores).filter(hole => scores[hole] > 0);
    const holesPlayed = scoredHoles.length;
    
    // Determine if it's front 9, back 9, or mixed
    const front9Holes = scoredHoles.filter(hole => parseInt(hole) <= 9);
    const back9Holes = scoredHoles.filter(hole => parseInt(hole) > 9);
    
    const isFront9Only = front9Holes.length === 9 && back9Holes.length === 0;
    const isBack9Only = back9Holes.length === 9 && front9Holes.length === 0;
    const isFullRound = holesPlayed === 18;
    const isPartialRound = holesPlayed > 0 && holesPlayed < 18 && !isFront9Only && !isBack9Only;
    
    switch (completionType) {
      case 'full':
        return isFullRound;
      case 'partial':
        return isPartialRound;
      case 'front9':
        return isFront9Only;
      case 'back9':
        return isBack9Only;
      case 'complete9':
        return isFront9Only || isBack9Only || isFullRound;
      case 'all':
      default:
        return holesPlayed > 0;
    }
  });
};

/**
 * Sort rounds by various criteria
 * @param {Array} rounds - Array of rounds to sort
 * @param {String} sortBy - 'date', 'score', 'scoreToPar', or 'holesPlayed'
 * @param {String} order - 'asc' or 'desc'
 * @returns {Array} Sorted rounds
 */
export const sortRounds = (rounds, sortBy = 'date', order = 'desc') => {
  if (!rounds || rounds.length === 0) {
    return [];
  }
  
  const sortedRounds = [...rounds].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.createdAt || a.date || a.playedAt);
        bValue = new Date(b.createdAt || b.date || b.playedAt);
        break;
        
      case 'score':
        aValue = Object.values(a.scores || {}).reduce((sum, score) => sum + (score || 0), 0);
        bValue = Object.values(b.scores || {}).reduce((sum, score) => sum + (score || 0), 0);
        break;
        
      case 'scoreToPar':
        const aScore = Object.values(a.scores || {}).reduce((sum, score) => sum + (score || 0), 0);
        const bScore = Object.values(b.scores || {}).reduce((sum, score) => sum + (score || 0), 0);
        const aHoles = Object.keys(a.scores || {}).filter(hole => a.scores[hole] > 0).length;
        const bHoles = Object.keys(b.scores || {}).filter(hole => b.scores[hole] > 0).length;
        
        // Estimate par based on holes played (assume par 4 average)
        const aEstimatedPar = aHoles * 4;
        const bEstimatedPar = bHoles * 4;
        
        aValue = aScore - aEstimatedPar;
        bValue = bScore - bEstimatedPar;
        break;
        
      case 'holesPlayed':
        aValue = Object.keys(a.scores || {}).filter(hole => a.scores[hole] > 0).length;
        bValue = Object.keys(b.scores || {}).filter(hole => b.scores[hole] > 0).length;
        break;
        
      default:
        aValue = new Date(a.createdAt || a.date || a.playedAt);
        bValue = new Date(b.createdAt || b.date || b.playedAt);
    }
    
    if (order === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
  
  return sortedRounds;
};

/**
 * Group rounds by time period
 * @param {Array} rounds - Array of rounds to group
 * @param {String} groupBy - 'week', 'month', 'quarter', or 'year'
 * @returns {Object} Grouped rounds with period labels as keys
 */
export const groupRoundsByPeriod = (rounds, groupBy = 'month') => {
  if (!rounds || rounds.length === 0) {
    return {};
  }
  
  const grouped = {};
  
  rounds.forEach(round => {
    const roundDate = new Date(round.createdAt || round.date || round.playedAt);
    
    if (isNaN(roundDate.getTime())) {
      return; // Skip invalid dates
    }
    
    let periodKey;
    
    switch (groupBy) {
      case 'week':
        // Get the Monday of the week
        const monday = new Date(roundDate);
        monday.setDate(roundDate.getDate() - roundDate.getDay() + 1);
        periodKey = `${monday.getFullYear()}-W${Math.ceil((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
        break;
        
      case 'month':
        periodKey = `${roundDate.getFullYear()}-${String(roundDate.getMonth() + 1).padStart(2, '0')}`;
        break;
        
      case 'quarter':
        const quarter = Math.floor(roundDate.getMonth() / 3) + 1;
        periodKey = `${roundDate.getFullYear()}-Q${quarter}`;
        break;
        
      case 'year':
        periodKey = roundDate.getFullYear().toString();
        break;
        
      default:
        periodKey = `${roundDate.getFullYear()}-${String(roundDate.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!grouped[periodKey]) {
      grouped[periodKey] = [];
    }
    
    grouped[periodKey].push(round);
  });
  
  return grouped;
};

/**
 * Get recent rounds (last N rounds)
 * @param {Array} rounds - Array of rounds to filter
 * @param {Number} count - Number of recent rounds to return
 * @returns {Array} Most recent rounds, sorted by date (newest first)
 */
export const getRecentRounds = (rounds, count = 5) => {
  if (!rounds || rounds.length === 0) {
    return [];
  }
  
  const sortedRounds = sortRounds(rounds, 'date', 'desc');
  return sortedRounds.slice(0, count);
};

/**
 * Advanced filtering with multiple criteria
 * @param {Array} rounds - Array of rounds to filter
 * @param {Object} filters - Filter criteria object
 * @returns {Array} Filtered rounds
 */
export const filterRoundsAdvanced = (rounds, filters = {}) => {
  if (!rounds || rounds.length === 0) {
    return [];
  }
  
  let filteredRounds = [...rounds];
  
  // Filter by course
  if (filters.courseId) {
    filteredRounds = filterRoundsByCourse(filteredRounds, filters.courseId);
  }
  
  // Filter by date range
  if (filters.startDate || filters.endDate) {
    filteredRounds = filterRoundsByDateRange(filteredRounds, filters.startDate, filters.endDate);
  }
  
  // Filter by completion status
  if (filters.completionType) {
    filteredRounds = filterRoundsByCompletion(filteredRounds, filters.completionType);
  }
  
  // Filter by score range
  if (filters.minScore || filters.maxScore) {
    filteredRounds = filteredRounds.filter(round => {
      const totalScore = Object.values(round.scores || {}).reduce((sum, score) => sum + (score || 0), 0);
      
      if (filters.minScore && totalScore < filters.minScore) {
        return false;
      }
      
      if (filters.maxScore && totalScore > filters.maxScore) {
        return false;
      }
      
      return true;
    });
  }
  
  // Sort if specified
  if (filters.sortBy) {
    filteredRounds = sortRounds(filteredRounds, filters.sortBy, filters.sortOrder || 'desc');
  }
  
  // Limit count if specified
  if (filters.limit) {
    filteredRounds = filteredRounds.slice(0, filters.limit);
  }
  
  return filteredRounds;
};

/**
 * PERFORMANCE TREND ANALYSIS UTILITIES
 * Functions to analyze performance trends and improvements over time
 */

/**
 * Calculate rolling averages for performance metrics
 * @param {Array} rounds - Array of rounds sorted by date (newest first)
 * @param {Object} course - Course object with hole information
 * @param {Array} windowSizes - Array of window sizes to calculate (e.g., [5, 10, 20])
 * @returns {Object} Rolling averages for different window sizes
 */
export const calculateRollingAverages = (rounds, course, windowSizes = [5, 10, 20]) => {
  if (!rounds || rounds.length === 0) {
    return {};
  }

  const coursePar = course?.holes?.reduce((sum, hole) => sum + hole.par, 0) || 72;
  
  // Sort rounds by date (newest first)
  const sortedRounds = sortRounds(rounds, 'date', 'desc');
  
  // Only consider rounds with meaningful data (at least 9 holes)
  const validRounds = sortedRounds.filter(round => {
    const scores = round.scores || {};
    const holesPlayed = Object.keys(scores).filter(hole => scores[hole] > 0).length;
    return holesPlayed >= 9;
  }).map(round => {
    const scores = round.scores || {};
    const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    const holesPlayed = Object.keys(scores).filter(hole => scores[hole] > 0).length;
    const projectedScore = holesPlayed === 18 ? totalScore : Math.round((totalScore / holesPlayed) * 18);
    
    return {
      ...round,
      totalScore,
      holesPlayed,
      projectedScore,
      scoreToPar: projectedScore - coursePar,
      date: new Date(round.createdAt || round.date || round.playedAt)
    };
  });

  const rollingAverages = {};

  windowSizes.forEach(windowSize => {
    if (validRounds.length < windowSize) {
      rollingAverages[windowSize] = null;
      return;
    }

    const windowRounds = validRounds.slice(0, windowSize);
    const avgScore = windowRounds.reduce((sum, round) => sum + round.projectedScore, 0) / windowSize;
    const avgScoreToPar = windowRounds.reduce((sum, round) => sum + round.scoreToPar, 0) / windowSize;
    
    // Calculate trend within this window
    const scores = windowRounds.map(round => round.projectedScore);
    const trend = calculateLinearTrend(scores);
    
    rollingAverages[windowSize] = {
      averageScore: parseFloat(avgScore.toFixed(2)),
      averageScoreToPar: parseFloat(avgScoreToPar.toFixed(2)),
      roundsCount: windowSize,
      trend: {
        direction: trend.slope < -0.1 ? 'improving' : trend.slope > 0.1 ? 'declining' : 'stable',
        slope: parseFloat(trend.slope.toFixed(3)),
        confidence: trend.rSquared > 0.5 ? 'high' : trend.rSquared > 0.2 ? 'medium' : 'low',
        rSquared: parseFloat(trend.rSquared.toFixed(3))
      },
      bestScore: Math.min(...scores),
      worstScore: Math.max(...scores),
      consistency: calculateConsistency(scores),
      dateRange: {
        from: windowRounds[windowRounds.length - 1].date,
        to: windowRounds[0].date
      }
    };
  });

  return rollingAverages;
};

/**
 * Detect improvement or decline patterns in performance
 * @param {Array} rounds - Array of rounds sorted by date
 * @param {Object} course - Course object
 * @returns {Object} Improvement/decline analysis
 */
export const detectPerformanceTrends = (rounds, course) => {
  if (!rounds || rounds.length < 3) {
    return {
      trend: 'insufficient_data',
      confidence: 'none',
      analysis: 'Need at least 3 rounds for trend analysis'
    };
  }

  const coursePar = course?.holes?.reduce((sum, hole) => sum + hole.par, 0) || 72;
  const sortedRounds = sortRounds(rounds, 'date', 'asc'); // Oldest first for trend analysis
  
  // Prepare score data
  const scoreData = sortedRounds.map((round, index) => {
    const scores = round.scores || {};
    const totalScore = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    const holesPlayed = Object.keys(scores).filter(hole => scores[hole] > 0).length;
    const projectedScore = holesPlayed === 18 ? totalScore : Math.round((totalScore / holesPlayed) * 18);
    
    return {
      roundIndex: index,
      score: projectedScore,
      scoreToPar: projectedScore - coursePar,
      date: new Date(round.createdAt || round.date || round.playedAt)
    };
  });

  // Calculate overall trend
  const scores = scoreData.map(d => d.score);
  const trend = calculateLinearTrend(scores);
  
  // Calculate recent vs early performance
  const halfPoint = Math.floor(scoreData.length / 2);
  const earlyRounds = scoreData.slice(0, halfPoint);
  const recentRounds = scoreData.slice(halfPoint);
  
  const earlyAvg = earlyRounds.reduce((sum, d) => sum + d.score, 0) / earlyRounds.length;
  const recentAvg = recentRounds.reduce((sum, d) => sum + d.score, 0) / recentRounds.length;
  const improvement = earlyAvg - recentAvg; // Positive = improvement
  
  // Determine trend significance
  let significance = 'none';
  if (Math.abs(improvement) >= 2.0 && trend.rSquared > 0.3) {
    significance = 'significant';
  } else if (Math.abs(improvement) >= 1.0 && trend.rSquared > 0.2) {
    significance = 'moderate';
  } else if (Math.abs(improvement) >= 0.5) {
    significance = 'slight';
  }
  
  // Determine trend direction and confidence
  let direction = 'stable';
  let confidence = 'low';
  
  if (trend.slope < -0.2) {
    direction = 'improving';
  } else if (trend.slope > 0.2) {
    direction = 'declining';
  }
  
  if (trend.rSquared > 0.6) {
    confidence = 'high';
  } else if (trend.rSquared > 0.3) {
    confidence = 'medium';
  }
  
  // Calculate streaks
  const streaks = calculateStreaks(scoreData, coursePar);
  
  return {
    trend: direction,
    confidence,
    significance,
    improvement: parseFloat(improvement.toFixed(2)),
    totalRounds: rounds.length,
    timespan: {
      days: Math.ceil((scoreData[scoreData.length - 1].date - scoreData[0].date) / (1000 * 60 * 60 * 24)),
      from: scoreData[0].date,
      to: scoreData[scoreData.length - 1].date
    },
    statistics: {
      earlyAverage: parseFloat(earlyAvg.toFixed(2)),
      recentAverage: parseFloat(recentAvg.toFixed(2)),
      slope: parseFloat(trend.slope.toFixed(3)),
      rSquared: parseFloat(trend.rSquared.toFixed(3))
    },
    streaks,
    analysis: generateTrendAnalysis(direction, confidence, improvement, streaks)
  };
};

/**
 * Calculate statistical significance of trends
 * @param {Array} rounds - Array of rounds
 * @param {Object} course - Course object
 * @returns {Object} Statistical analysis of trends
 */
export const calculateTrendSignificance = (rounds, course) => {
  if (!rounds || rounds.length < 5) {
    return {
      significant: false,
      reason: 'insufficient_data',
      minRoundsNeeded: 5
    };
  }

  const trends = detectPerformanceTrends(rounds, course);
  const rollingAvgs = calculateRollingAverages(rounds, course, [5, 10]);
  
  // Check for consistent improvement across different window sizes
  const consistentImprovement = rollingAvgs[5]?.trend?.direction === 'improving' && 
                                 rollingAvgs[10]?.trend?.direction === 'improving';
  
  const significantImprovement = Math.abs(trends.improvement) >= 1.5;
  const strongCorrelation = trends.statistics.rSquared >= 0.4;
  const sufficientData = rounds.length >= 8;
  
  const significant = (consistentImprovement || significantImprovement) && 
                     strongCorrelation && 
                     sufficientData;
  
  return {
    significant,
    confidence: trends.confidence,
    factors: {
      consistentAcrossWindows: consistentImprovement,
      significantImprovement,
      strongCorrelation,
      sufficientData
    },
    recommendations: generateSignificanceRecommendations(significant, trends, rollingAvgs)
  };
};

/**
 * Calculate linear trend using least squares regression
 * @param {Array} values - Array of numerical values
 * @returns {Object} Trend analysis with slope and R-squared
 */
const calculateLinearTrend = (values) => {
  if (values.length < 2) {
    return { slope: 0, rSquared: 0 };
  }

  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  
  // Calculate means
  const meanX = xValues.reduce((sum, x) => sum + x, 0) / n;
  const meanY = values.reduce((sum, y) => sum + y, 0) / n;
  
  // Calculate slope
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - meanX) * (values[i] - meanY);
    denominator += (xValues[i] - meanX) ** 2;
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator;
  
  // Calculate R-squared
  let totalSumSquares = 0;
  let residualSumSquares = 0;
  
  for (let i = 0; i < n; i++) {
    const predicted = meanY + slope * (xValues[i] - meanX);
    totalSumSquares += (values[i] - meanY) ** 2;
    residualSumSquares += (values[i] - predicted) ** 2;
  }
  
  const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
  
  return {
    slope,
    rSquared: Math.max(0, rSquared) // Ensure non-negative
  };
};

/**
 * Calculate consistency metric (lower is more consistent)
 * @param {Array} scores - Array of scores
 * @returns {Number} Consistency score (standard deviation)
 */
const calculateConsistency = (scores) => {
  if (scores.length < 2) return 0;
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
  
  return parseFloat(Math.sqrt(variance).toFixed(2));
};

/**
 * Calculate performance streaks
 * @param {Array} scoreData - Array of score data with dates
 * @param {Number} coursePar - Course par
 * @returns {Object} Streak analysis
 */
const calculateStreaks = (scoreData, coursePar) => {
  if (scoreData.length < 2) {
    return { improving: 0, declining: 0, current: 'none' };
  }

  let currentStreak = 0;
  let currentType = 'none';
  let maxImprovingStreak = 0;
  let maxDecliningStreak = 0;
  
  for (let i = 1; i < scoreData.length; i++) {
    const prev = scoreData[i - 1].score;
    const curr = scoreData[i].score;
    
    if (curr < prev) {
      // Improvement
      if (currentType === 'improving') {
        currentStreak++;
      } else {
        currentType = 'improving';
        currentStreak = 1;
      }
    } else if (curr > prev) {
      // Decline
      if (currentType === 'declining') {
        currentStreak++;
      } else {
        currentType = 'declining';
        currentStreak = 1;
      }
    } else {
      // No change - maintain current streak type but don't increment
    }
    
    if (currentType === 'improving') {
      maxImprovingStreak = Math.max(maxImprovingStreak, currentStreak);
    } else if (currentType === 'declining') {
      maxDecliningStreak = Math.max(maxDecliningStreak, currentStreak);
    }
  }
  
  return {
    improving: maxImprovingStreak,
    declining: maxDecliningStreak,
    current: currentType,
    currentLength: currentStreak
  };
};

/**
 * Generate human-readable trend analysis
 * @param {String} direction - Trend direction
 * @param {String} confidence - Confidence level
 * @param {Number} improvement - Improvement amount
 * @param {Object} streaks - Streak data
 * @returns {String} Analysis text
 */
const generateTrendAnalysis = (direction, confidence, improvement, streaks) => {
  const absImprovement = Math.abs(improvement);
  
  if (direction === 'improving') {
    if (absImprovement >= 3) {
      return `Excellent improvement! You've dropped ${absImprovement.toFixed(1)} strokes on average. Keep up the great work!`;
    } else if (absImprovement >= 1.5) {
      return `Good improvement trend - you're getting ${absImprovement.toFixed(1)} strokes better on average.`;
    } else {
      return `Steady improvement - small but consistent gains of ${absImprovement.toFixed(1)} strokes.`;
    }
  } else if (direction === 'declining') {
    if (absImprovement >= 2) {
      return `Scores have increased by ${absImprovement.toFixed(1)} strokes recently. Consider focusing on fundamentals.`;
    } else {
      return `Slight upward trend in scores. This is normal - golf has ups and downs.`;
    }
  } else {
    return `Consistent performance with stable scoring patterns.`;
  }
};

/**
 * Generate recommendations based on trend significance
 * @param {Boolean} significant - Whether trends are significant
 * @param {Object} trends - Trend analysis
 * @param {Object} rollingAvgs - Rolling averages
 * @returns {Array} Array of recommendation strings
 */
const generateSignificanceRecommendations = (significant, trends, rollingAvgs) => {
  const recommendations = [];
  
  if (significant && trends.trend === 'improving') {
    recommendations.push("Your improvement is statistically significant - you're on the right track!");
    recommendations.push("Continue your current practice routine and course management strategy.");
  } else if (significant && trends.trend === 'declining') {
    recommendations.push("The decline in scores is concerning. Consider working with a pro or adjusting your approach.");
    recommendations.push("Focus on course management and playing within your abilities.");
  } else if (!significant) {
    recommendations.push("Play more rounds to establish clearer performance trends.");
    if (trends.totalRounds < 10) {
      recommendations.push("Track at least 10 rounds on this course for meaningful insights.");
    }
  }
  
  // Add consistency recommendations
  if (rollingAvgs[5]?.consistency > 8) {
    recommendations.push("Work on consistency - your scores vary widely between rounds.");
  } else if (rollingAvgs[5]?.consistency < 3) {
    recommendations.push("Great consistency! Your scores are very predictable.");
  }
  
  return recommendations;
};

/**
 * CLUB PERFORMANCE ANALYSIS UTILITIES
 * Functions to analyze club usage and performance for intelligent recommendations
 */

/**
 * Track club usage per hole and shot
 * @param {Array} rounds - Array of rounds with club data
 * @param {Object} course - Course object with hole information
 * @returns {Object} Club usage statistics by hole
 */
export const analyzeClubUsage = (rounds, course) => {
  if (!rounds || rounds.length === 0) {
    return {};
  }

  const holeClubUsage = {};
  
  // Initialize usage tracking for each hole
  course?.holes?.forEach(hole => {
    holeClubUsage[hole.holeNumber] = {
      holeNumber: hole.holeNumber,
      par: hole.par,
      totalRounds: 0,
      clubs: {},
      mostUsedClub: null,
      clubVariety: 0,
      averageScore: 0,
      bestClub: null,
      worstClub: null
    };
  });

  // Analyze each round for club usage
  rounds.forEach(round => {
    const scores = round.scores || {};
    const clubs = round.clubs || {}; // Expected format: { 1: 'driver', 2: '7iron', etc. }
    
    Object.keys(scores).forEach(holeNumber => {
      const holeNum = parseInt(holeNumber);
      const score = scores[holeNumber];
      const club = clubs[holeNumber];
      
      if (score > 0 && club && holeClubUsage[holeNum]) {
        const holeStats = holeClubUsage[holeNum];
        holeStats.totalRounds++;
        holeStats.averageScore = ((holeStats.averageScore * (holeStats.totalRounds - 1)) + score) / holeStats.totalRounds;
        
        // Track club usage
        if (!holeStats.clubs[club]) {
          holeStats.clubs[club] = {
            club,
            timesUsed: 0,
            totalScore: 0,
            averageScore: 0,
            bestScore: null,
            worstScore: null,
            scores: []
          };
        }
        
        const clubStats = holeStats.clubs[club];
        clubStats.timesUsed++;
        clubStats.totalScore += score;
        clubStats.scores.push(score);
        clubStats.averageScore = clubStats.totalScore / clubStats.timesUsed;
        
        if (clubStats.bestScore === null || score < clubStats.bestScore) {
          clubStats.bestScore = score;
        }
        if (clubStats.worstScore === null || score > clubStats.worstScore) {
          clubStats.worstScore = score;
        }
      }
    });
  });

  // Calculate derived statistics for each hole
  Object.values(holeClubUsage).forEach(holeStats => {
    if (holeStats.totalRounds > 0) {
      const clubs = Object.values(holeStats.clubs);
      
      // Find most used club
      if (clubs.length > 0) {
        holeStats.mostUsedClub = clubs.reduce((prev, curr) => 
          curr.timesUsed > prev.timesUsed ? curr : prev
        );
        
        // Find best performing club (lowest average score, minimum 2 uses)
        const eligibleClubs = clubs.filter(club => club.timesUsed >= 2);
        if (eligibleClubs.length > 0) {
          holeStats.bestClub = eligibleClubs.reduce((prev, curr) =>
            curr.averageScore < prev.averageScore ? curr : prev
          );
          
          holeStats.worstClub = eligibleClubs.reduce((prev, curr) =>
            curr.averageScore > prev.averageScore ? curr : prev
          );
        }
        
        holeStats.clubVariety = clubs.length;
      }
    }
  });

  return holeClubUsage;
};

/**
 * Calculate club performance correlation with scoring
 * @param {Array} rounds - Array of rounds with club and score data
 * @param {Object} course - Course object
 * @returns {Object} Club performance analysis
 */
export const analyzeClubPerformanceCorrelation = (rounds, course) => {
  if (!rounds || rounds.length === 0) {
    return { overallClubStats: {}, holeSpecificStats: {}, recommendations: [] };
  }

  const overallClubStats = {};
  const holeClubUsage = analyzeClubUsage(rounds, course);
  
  // Aggregate overall club performance across all holes
  rounds.forEach(round => {
    const scores = round.scores || {};
    const clubs = round.clubs || {};
    
    Object.keys(scores).forEach(holeNumber => {
      const score = scores[holeNumber];
      const club = clubs[holeNumber];
      const hole = course?.holes?.find(h => h.holeNumber === parseInt(holeNumber));
      
      if (score > 0 && club && hole) {
        if (!overallClubStats[club]) {
          overallClubStats[club] = {
            club,
            totalUses: 0,
            totalScore: 0,
            averageScore: 0,
            scoreToPar: 0,
            holesUsed: new Set(),
            parBreakdown: { 3: [], 4: [], 5: [] }, // Scores by par
            consistencyScore: 0,
            recommendationStrength: 'low'
          };
        }
        
        const clubStats = overallClubStats[club];
        clubStats.totalUses++;
        clubStats.totalScore += score;
        clubStats.holesUsed.add(parseInt(holeNumber));
        
        // Track performance by par
        if (clubStats.parBreakdown[hole.par]) {
          clubStats.parBreakdown[hole.par].push(score - hole.par);
        }
        
        // Recalculate averages
        clubStats.averageScore = clubStats.totalScore / clubStats.totalUses;
        
        // Calculate average score to par for this club
        const totalParDiff = Object.values(clubStats.parBreakdown).flat().reduce((sum, diff) => sum + diff, 0);
        clubStats.scoreToPar = totalParDiff / clubStats.totalUses;
      }
    });
  });

  // Calculate consistency and recommendation strength for each club
  Object.values(overallClubStats).forEach(clubStats => {
    const allParDiffs = Object.values(clubStats.parBreakdown).flat();
    
    if (allParDiffs.length > 1) {
      // Calculate consistency (lower standard deviation = more consistent)
      const mean = allParDiffs.reduce((sum, diff) => sum + diff, 0) / allParDiffs.length;
      const variance = allParDiffs.reduce((sum, diff) => sum + (diff - mean) ** 2, 0) / allParDiffs.length;
      clubStats.consistencyScore = Math.sqrt(variance);
      
      // Determine recommendation strength based on usage and performance
      if (clubStats.totalUses >= 5) {
        if (clubStats.scoreToPar <= -0.3 && clubStats.consistencyScore <= 1.0) {
          clubStats.recommendationStrength = 'high';
        } else if (clubStats.scoreToPar <= 0 || clubStats.consistencyScore <= 1.5) {
          clubStats.recommendationStrength = 'medium';
        }
      }
    }
    
    // Convert holesUsed Set to array for JSON serialization
    clubStats.holesUsed = Array.from(clubStats.holesUsed);
  });

  return {
    overallClubStats,
    holeSpecificStats: holeClubUsage,
    recommendations: generateClubRecommendations(overallClubStats, holeClubUsage)
  };
};

/**
 * Generate intelligent club recommendations based on historical performance
 * @param {Object} holeClubUsage - Hole-specific club usage data
 * @param {Number} holeNumber - Specific hole to get recommendations for
 * @param {Object} options - Options for recommendations (distance, conditions, etc.)
 * @returns {Object} Club recommendations for the hole
 */
export const getClubRecommendationsForHole = (holeClubUsage, holeNumber, options = {}) => {
  const holeStats = holeClubUsage[holeNumber];
  
  if (!holeStats || holeStats.totalRounds < 2) {
    return {
      holeNumber,
      insufficient_data: true,
      message: 'Play this hole a few more times for club recommendations',
      suggestions: []
    };
  }

  const clubs = Object.values(holeStats.clubs);
  const eligibleClubs = clubs.filter(club => club.timesUsed >= 2);
  
  if (eligibleClubs.length === 0) {
    return {
      holeNumber,
      insufficient_data: true,
      message: 'Need more data with consistent club usage',
      suggestions: []
    };
  }

  // Sort clubs by performance (average score)
  const sortedClubs = eligibleClubs.sort((a, b) => a.averageScore - b.averageScore);
  
  const recommendations = {
    holeNumber,
    par: holeStats.par,
    totalRoundsPlayed: holeStats.totalRounds,
    mostUsed: holeStats.mostUsedClub,
    recommendations: []
  };

  // Generate recommendations
  sortedClubs.forEach((club, index) => {
    const performanceVsMostUsed = holeStats.mostUsedClub ? 
      club.averageScore - holeStats.mostUsedClub.averageScore : 0;
    
    const recommendation = {
      club: club.club,
      averageScore: parseFloat(club.averageScore.toFixed(2)),
      timesUsed: club.timesUsed,
      bestScore: club.bestScore,
      worstScore: club.worstScore,
      rank: index + 1,
      performanceVsMostUsed: parseFloat(performanceVsMostUsed.toFixed(2)),
      confidence: club.timesUsed >= 5 ? 'high' : club.timesUsed >= 3 ? 'medium' : 'low',
      recommendation: ''
    };

    // Generate recommendation text
    if (index === 0 && club !== holeStats.mostUsedClub) {
      recommendation.recommendation = `Best performer - ${Math.abs(performanceVsMostUsed).toFixed(1)} strokes better than your usual ${holeStats.mostUsedClub.club}`;
    } else if (club === holeStats.mostUsedClub) {
      recommendation.recommendation = `Your go-to club (used ${club.timesUsed} times)`;
    } else if (performanceVsMostUsed < -0.3) {
      recommendation.recommendation = `Strong alternative - ${Math.abs(performanceVsMostUsed).toFixed(1)} strokes better than usual`;
    } else if (performanceVsMostUsed > 0.3) {
      recommendation.recommendation = `Consider avoiding - ${performanceVsMostUsed.toFixed(1)} strokes worse than usual`;
    } else {
      recommendation.recommendation = `Similar performance to your usual club`;
    }

    recommendations.recommendations.push(recommendation);
  });

  return recommendations;
};

/**
 * Analyze distance and accuracy by club (if distance data available)
 * @param {Array} rounds - Array of rounds with club and distance data
 * @returns {Object} Distance and accuracy analysis by club
 */
export const analyzeClubDistanceAccuracy = (rounds) => {
  if (!rounds || rounds.length === 0) {
    return {};
  }

  const clubDistanceStats = {};

  rounds.forEach(round => {
    const clubs = round.clubs || {};
    const distances = round.distances || {}; // Expected: { 1: 285, 2: 150, etc. }
    const fairways = round.fairways || {}; // Expected: { 1: true, 2: false, etc. }
    const greens = round.greensInRegulation || {}; // Expected: { 1: true, 2: false, etc. }

    Object.keys(clubs).forEach(holeNumber => {
      const club = clubs[holeNumber];
      const distance = distances[holeNumber];
      const hitFairway = fairways[holeNumber];
      const hitGreen = greens[holeNumber];

      if (club && distance) {
        if (!clubDistanceStats[club]) {
          clubDistanceStats[club] = {
            club,
            distances: [],
            averageDistance: 0,
            maxDistance: 0,
            minDistance: Infinity,
            fairwayHits: 0,
            fairwayAttempts: 0,
            greenHits: 0,
            greenAttempts: 0,
            consistency: 0
          };
        }

        const stats = clubDistanceStats[club];
        stats.distances.push(distance);
        
        if (distance > stats.maxDistance) stats.maxDistance = distance;
        if (distance < stats.minDistance) stats.minDistance = distance;

        if (hitFairway !== undefined) {
          stats.fairwayAttempts++;
          if (hitFairway) stats.fairwayHits++;
        }

        if (hitGreen !== undefined) {
          stats.greenAttempts++;
          if (hitGreen) stats.greenHits++;
        }
      }
    });
  });

  // Calculate derived statistics
  Object.values(clubDistanceStats).forEach(stats => {
    if (stats.distances.length > 0) {
      stats.averageDistance = stats.distances.reduce((sum, d) => sum + d, 0) / stats.distances.length;
      
      // Calculate consistency (coefficient of variation)
      const mean = stats.averageDistance;
      const variance = stats.distances.reduce((sum, d) => sum + (d - mean) ** 2, 0) / stats.distances.length;
      stats.consistency = Math.sqrt(variance) / mean * 100; // Percentage
      
      // Calculate percentages
      stats.fairwayPercentage = stats.fairwayAttempts > 0 ? 
        Math.round((stats.fairwayHits / stats.fairwayAttempts) * 100) : null;
      stats.greenPercentage = stats.greenAttempts > 0 ? 
        Math.round((stats.greenHits / stats.greenAttempts) * 100) : null;
    }
  });

  return clubDistanceStats;
};

/**
 * Generate comprehensive club recommendations based on all analysis
 * @param {Object} overallClubStats - Overall club performance statistics
 * @param {Object} holeClubUsage - Hole-specific club usage
 * @returns {Array} Array of recommendation objects
 */
const generateClubRecommendations = (overallClubStats, holeClubUsage) => {
  const recommendations = [];
  
  // Overall club performance recommendations
  const clubs = Object.values(overallClubStats);
  const bestClubs = clubs
    .filter(club => club.totalUses >= 3)
    .sort((a, b) => a.scoreToPar - b.scoreToPar)
    .slice(0, 3);

  bestClubs.forEach((club, index) => {
    if (club.scoreToPar <= 0) {
      recommendations.push({
        type: 'overall_performance',
        club: club.club,
        message: `${club.club} is performing well overall (${club.scoreToPar > 0 ? '+' : ''}${club.scoreToPar.toFixed(1)} vs par average)`,
        strength: club.recommendationStrength,
        usage: club.totalUses
      });
    }
  });

  // Hole-specific opportunities
  Object.values(holeClubUsage).forEach(holeStats => {
    if (holeStats.bestClub && holeStats.mostUsedClub && 
        holeStats.bestClub.club !== holeStats.mostUsedClub.club &&
        holeStats.bestClub.averageScore < holeStats.mostUsedClub.averageScore - 0.3) {
      
      const improvement = holeStats.mostUsedClub.averageScore - holeStats.bestClub.averageScore;
      recommendations.push({
        type: 'hole_specific',
        hole: holeStats.holeNumber,
        currentClub: holeStats.mostUsedClub.club,
        recommendedClub: holeStats.bestClub.club,
        improvement: parseFloat(improvement.toFixed(1)),
        message: `On hole ${holeStats.holeNumber}, try ${holeStats.bestClub.club} instead of ${holeStats.mostUsedClub.club} - could save ${improvement.toFixed(1)} strokes on average`,
        confidence: holeStats.bestClub.timesUsed >= 3 ? 'high' : 'medium'
      });
    }
  });

  return recommendations.slice(0, 10); // Limit to top 10 recommendations
};

/**
 * Get club performance insights for scorecard display
 * @param {Object} holeClubUsage - Hole-specific club usage data
 * @param {Number} holeNumber - Current hole number
 * @returns {Object} Insights for current hole
 */
export const getClubInsightsForScorecard = (holeClubUsage, holeNumber) => {
  const holeStats = holeClubUsage[holeNumber];
  
  if (!holeStats || holeStats.totalRounds < 2) {
    return null;
  }

  const insight = {
    holeNumber,
    hasData: true,
    mostUsed: null,
    bestPerformer: null,
    recommendation: null,
    warningClub: null
  };

  // Most used club
  if (holeStats.mostUsedClub) {
    insight.mostUsed = {
      club: holeStats.mostUsedClub.club,
      averageScore: holeStats.mostUsedClub.averageScore,
      timesUsed: holeStats.mostUsedClub.timesUsed
    };
  }

  // Best performer (if different from most used)
  if (holeStats.bestClub && holeStats.bestClub.club !== holeStats.mostUsedClub?.club) {
    const improvement = holeStats.mostUsedClub.averageScore - holeStats.bestClub.averageScore;
    
    if (improvement >= 0.3) {
      insight.recommendation = {
        club: holeStats.bestClub.club,
        averageScore: holeStats.bestClub.averageScore,
        improvement: parseFloat(improvement.toFixed(1)),
        confidence: holeStats.bestClub.timesUsed >= 3 ? 'high' : 'medium'
      };
    }
  }

  // Warning about worst performer
  if (holeStats.worstClub && holeStats.worstClub.averageScore > holeStats.averageScore + 0.5) {
    insight.warningClub = {
      club: holeStats.worstClub.club,
      averageScore: holeStats.worstClub.averageScore,
      timesUsed: holeStats.worstClub.timesUsed
    };
  }

  return insight;
};