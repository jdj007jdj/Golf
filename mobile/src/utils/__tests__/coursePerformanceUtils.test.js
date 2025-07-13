/**
 * Test file for course performance utilities
 * 
 * This file contains comprehensive tests for the course performance
 * calculation functions using realistic golf data scenarios.
 */

import {
  calculateCourseAverages,
  findBestWorstRounds,
  calculateHolePerformance,
  getCoursePerformanceSummary,
  filterRoundsByCourse,
  filterRoundsByDateRange,
  filterRoundsByCompletion,
  sortRounds,
  groupRoundsByPeriod,
  getRecentRounds,
  filterRoundsAdvanced,
  calculateRollingAverages,
  detectPerformanceTrends,
  calculateTrendSignificance,
  analyzeClubUsage,
  analyzeClubPerformanceCorrelation,
  getClubRecommendationsForHole,
  analyzeClubDistanceAccuracy,
  getClubInsightsForScorecard
} from '../coursePerformanceUtils';

// Sample course data
const sampleCourse = {
  id: 'course-1',
  name: 'Pine Valley Golf Club',
  holes: [
    { holeNumber: 1, par: 4 },
    { holeNumber: 2, par: 3 },
    { holeNumber: 3, par: 5 },
    { holeNumber: 4, par: 4 },
    { holeNumber: 5, par: 4 },
    { holeNumber: 6, par: 3 },
    { holeNumber: 7, par: 4 },
    { holeNumber: 8, par: 5 },
    { holeNumber: 9, par: 4 },
    { holeNumber: 10, par: 4 },
    { holeNumber: 11, par: 3 },
    { holeNumber: 12, par: 5 },
    { holeNumber: 13, par: 4 },
    { holeNumber: 14, par: 4 },
    { holeNumber: 15, par: 3 },
    { holeNumber: 16, par: 4 },
    { holeNumber: 17, par: 5 },
    { holeNumber: 18, par: 4 }
  ]
};

// Sample rounds data - realistic golf scores
const sampleRounds = [
  // Round 1: Good round (79)
  {
    id: 'round-1',
    createdAt: '2024-01-15',
    scores: {
      1: 4, 2: 3, 3: 5, 4: 4, 5: 3, 6: 2, 7: 4, 8: 5, 9: 4,
      10: 4, 11: 3, 12: 4, 13: 4, 14: 5, 15: 3, 16: 4, 17: 5, 18: 3
    }
  },
  // Round 2: Average round (85)
  {
    id: 'round-2',
    createdAt: '2024-01-22',
    scores: {
      1: 5, 2: 4, 3: 6, 4: 4, 5: 4, 6: 3, 7: 5, 8: 5, 9: 4,
      10: 4, 11: 3, 12: 5, 13: 5, 14: 4, 15: 4, 16: 4, 17: 6, 18: 5
    }
  },
  // Round 3: Bad round (92)
  {
    id: 'round-3',
    createdAt: '2024-02-01',
    scores: {
      1: 6, 2: 4, 3: 6, 4: 5, 5: 5, 6: 4, 7: 5, 8: 6, 9: 5,
      10: 5, 11: 4, 12: 6, 13: 5, 14: 5, 15: 4, 16: 5, 17: 6, 18: 5
    }
  },
  // Round 4: Front 9 only (partial round)
  {
    id: 'round-4',
    createdAt: '2024-02-08',
    scores: {
      1: 4, 2: 3, 3: 4, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4
    }
  },
  // Round 5: Back 9 only (partial round)
  {
    id: 'round-5',
    createdAt: '2024-02-15',
    scores: {
      10: 4, 11: 2, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4
    }
  }
];

// Sample rounds from multiple courses for filtering tests
const multiCourseRounds = [
  {
    id: 'round-mc1',
    courseId: 'course-1',
    createdAt: '2024-01-15',
    scores: { 1: 4, 2: 3, 3: 5, 4: 4, 5: 3, 6: 2, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 4, 13: 4, 14: 5, 15: 3, 16: 4, 17: 5, 18: 3 }
  },
  {
    id: 'round-mc2',
    courseId: 'course-2',
    createdAt: '2024-01-20',
    scores: { 1: 5, 2: 4, 3: 6, 4: 4, 5: 4, 6: 3, 7: 5, 8: 5, 9: 4, 10: 4, 11: 3, 12: 5, 13: 5, 14: 4, 15: 4, 16: 4, 17: 6, 18: 5 }
  },
  {
    id: 'round-mc3',
    courseId: 'course-1',
    createdAt: '2024-02-01',
    scores: { 1: 6, 2: 4, 3: 6, 4: 5, 5: 5, 6: 4, 7: 5, 8: 6, 9: 5 } // Front 9 only
  },
  {
    id: 'round-mc4',
    courseId: 'course-3',
    createdAt: '2024-02-15',
    scores: { 10: 4, 11: 2, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 } // Back 9 only
  },
  {
    id: 'round-mc5',
    courseId: 'course-1',
    createdAt: '2024-03-01',
    scores: { 1: 4, 2: 3, 3: 4, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 }
  }
];

// Sample rounds showing improvement trend for trend analysis tests
const improvingTrendRounds = [
  {
    id: 'trend-1',
    courseId: 'course-1',
    createdAt: '2024-01-01',
    scores: { 1: 5, 2: 4, 3: 6, 4: 5, 5: 5, 6: 4, 7: 5, 8: 6, 9: 5, 10: 5, 11: 4, 12: 6, 13: 5, 14: 5, 15: 4, 16: 5, 17: 6, 18: 5 } // 95
  },
  {
    id: 'trend-2',
    courseId: 'course-1',
    createdAt: '2024-01-08',
    scores: { 1: 5, 2: 4, 3: 5, 4: 5, 5: 4, 6: 3, 7: 5, 8: 5, 9: 4, 10: 5, 11: 3, 12: 5, 13: 5, 14: 4, 15: 4, 16: 4, 17: 5, 18: 5 } // 90
  },
  {
    id: 'trend-3',
    courseId: 'course-1',
    createdAt: '2024-01-15',
    scores: { 1: 4, 2: 4, 3: 5, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 } // 82
  },
  {
    id: 'trend-4',
    courseId: 'course-1',
    createdAt: '2024-01-22',
    scores: { 1: 4, 2: 3, 3: 5, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 4, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 } // 80
  },
  {
    id: 'trend-5',
    courseId: 'course-1',
    createdAt: '2024-01-29',
    scores: { 1: 4, 2: 3, 3: 4, 4: 4, 5: 3, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 4, 13: 4, 14: 4, 15: 3, 16: 4, 17: 4, 18: 4 } // 77
  },
  {
    id: 'trend-6',
    courseId: 'course-1',
    createdAt: '2024-02-05',
    scores: { 1: 4, 2: 3, 3: 4, 4: 4, 5: 3, 6: 2, 7: 4, 8: 4, 9: 3, 10: 4, 11: 3, 12: 4, 13: 4, 14: 3, 15: 3, 16: 4, 17: 4, 18: 4 } // 74
  }
];

// Sample rounds with club data for club analysis tests
const clubAnalysisRounds = [
  {
    id: 'club-round-1',
    courseId: 'course-1',
    createdAt: '2024-01-01',
    scores: { 1: 4, 2: 3, 3: 5, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 },
    clubs: { 1: 'driver', 2: '8iron', 3: 'driver', 4: 'driver', 5: '7iron', 6: '9iron', 7: 'driver', 8: 'driver', 9: '6iron', 10: 'driver', 11: '9iron', 12: 'driver', 13: 'driver', 14: '8iron', 15: 'wedge', 16: 'driver', 17: 'driver', 18: '7iron' },
    distances: { 1: 280, 2: 145, 3: 285, 4: 275 },
    fairways: { 1: true, 3: false, 4: true }
  },
  {
    id: 'club-round-2',
    courseId: 'course-1',
    createdAt: '2024-01-08',
    scores: { 1: 3, 2: 3, 3: 4, 4: 4, 5: 3, 6: 2, 7: 4, 8: 4, 9: 4, 10: 4, 11: 3, 12: 4, 13: 4, 14: 3, 15: 3, 16: 4, 17: 4, 18: 4 },
    clubs: { 1: '3wood', 2: '8iron', 3: '3wood', 4: 'driver', 5: '6iron', 6: '9iron', 7: 'driver', 8: '3wood', 9: '6iron', 10: 'driver', 11: '9iron', 12: '3wood', 13: 'driver', 14: '7iron', 15: 'wedge', 16: 'driver', 17: '3wood', 18: '7iron' },
    distances: { 1: 260, 2: 150, 3: 255, 8: 250 },
    fairways: { 1: true, 3: true, 8: true }
  },
  {
    id: 'club-round-3',
    courseId: 'course-1',
    createdAt: '2024-01-15',
    scores: { 1: 4, 2: 4, 3: 5, 4: 4, 5: 4, 6: 3, 7: 5, 8: 5, 9: 4, 10: 4, 11: 3, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 },
    clubs: { 1: 'driver', 2: '7iron', 3: 'driver', 4: 'driver', 5: '7iron', 6: '9iron', 7: 'driver', 8: 'driver', 9: '6iron', 10: 'driver', 11: '8iron', 12: 'driver', 13: 'driver', 14: '7iron', 15: 'wedge', 16: 'driver', 17: 'driver', 18: '8iron' },
    distances: { 1: 290, 2: 135, 3: 295 },
    fairways: { 1: true, 3: false }
  },
  {
    id: 'club-round-4',
    courseId: 'course-1',
    createdAt: '2024-01-22',
    scores: { 1: 4, 2: 2, 3: 4, 4: 4, 5: 4, 6: 3, 7: 4, 8: 4, 9: 3, 10: 4, 11: 2, 12: 4, 13: 4, 14: 4, 15: 2, 16: 4, 17: 4, 18: 4 },
    clubs: { 1: '3wood', 2: '8iron', 3: '3wood', 4: 'driver', 5: '6iron', 6: '8iron', 7: 'driver', 8: '3wood', 9: '7iron', 10: 'driver', 11: '8iron', 12: '3wood', 13: 'driver', 14: '8iron', 15: '9iron', 16: 'driver', 17: '3wood', 18: '7iron' },
    distances: { 1: 265, 2: 148 },
    fairways: { 1: true, 3: true }
  }
];

describe('Course Performance Utils', () => {
  
  describe('calculateCourseAverages', () => {
    test('should calculate correct averages for multiple rounds', () => {
      const result = calculateCourseAverages(sampleRounds, sampleCourse);
      
      expect(result.totalRounds).toBe(5);
      expect(result.coursePar).toBe(72);
      expect(result.completedRounds).toBe(3); // Only first 3 rounds are complete
      expect(result.partialRounds).toBe(2);
      
      // Check that averages are reasonable
      expect(result.averageScore).toBeGreaterThan(3.5);
      expect(result.averageScore).toBeLessThan(6);
      expect(result.averageScoreVsPar).toBeGreaterThan(0.5); // Above par
    });

    test('should handle empty rounds array', () => {
      const result = calculateCourseAverages([], sampleCourse);
      
      expect(result.totalRounds).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.averageScoreVsPar).toBe(0);
      expect(result.coursePar).toBe(72);
    });

    test('should handle null/undefined input', () => {
      const result = calculateCourseAverages(null, sampleCourse);
      
      expect(result.totalRounds).toBe(0);
      expect(result.averageScore).toBe(0);
    });
  });

  describe('findBestWorstRounds', () => {
    test('should identify best and worst rounds correctly', () => {
      const result = findBestWorstRounds(sampleRounds, sampleCourse);
      
      expect(result.bestRound).toBeTruthy();
      expect(result.worstRound).toBeTruthy();
      expect(result.bestScore).toBe(79); // Round 1
      expect(result.worstScore).toBe(92); // Round 3
      
      expect(result.bestRound.scoreToPar).toBe(7); // 79 - 72
      expect(result.worstRound.scoreToPar).toBe(20); // 92 - 72
    });

    test('should handle partial rounds by projecting scores', () => {
      const partialRounds = [sampleRounds[3]]; // Front 9 only
      const result = findBestWorstRounds(partialRounds, sampleCourse);
      
      expect(result.bestRound.holesPlayed).toBe(9);
      expect(result.bestRound.projectedScore).toBe(70); // 35 * 2 = 70
    });

    test('should handle empty rounds', () => {
      const result = findBestWorstRounds([], sampleCourse);
      
      expect(result.bestRound).toBeNull();
      expect(result.worstRound).toBeNull();
      expect(result.bestScore).toBeNull();
      expect(result.worstScore).toBeNull();
    });
  });

  describe('calculateHolePerformance', () => {
    test('should calculate hole statistics correctly', () => {
      const result = calculateHolePerformance(sampleRounds, sampleCourse);
      
      // Check hole 1 (par 4)
      const hole1 = result[1];
      expect(hole1.holeNumber).toBe(1);
      expect(hole1.par).toBe(4);
      expect(hole1.timesPlayed).toBe(4); // Played in 4 rounds
      expect(hole1.averageScore).toBeGreaterThan(4); // Above par
      
      // Check that categories are counted
      expect(hole1.eagles + hole1.birdies + hole1.pars + hole1.bogeys + 
             hole1.doubleBogeys + hole1.worse).toBe(hole1.timesPlayed);
    });

    test('should categorize scores correctly', () => {
      const result = calculateHolePerformance(sampleRounds, sampleCourse);
      
      // Hole 6 has scores: 2, 3, 4, 3 (par 3)
      const hole6 = result[6];
      expect(hole6.birdies).toBe(2); // Two scores of 2 (birdie on par 3)
      expect(hole6.pars).toBe(1); // One score of 3 (par on par 3)
      expect(hole6.bogeys).toBe(1); // One score of 4 (bogey on par 3)
    });

    test('should assign difficulty levels correctly', () => {
      const result = calculateHolePerformance(sampleRounds, sampleCourse);
      
      // Check that difficulty is assigned
      Object.values(result).forEach(hole => {
        if (hole.timesPlayed > 0) {
          expect(['easy', 'fair', 'challenging', 'trouble']).toContain(hole.difficulty);
        }
      });
    });
  });

  describe('getCoursePerformanceSummary', () => {
    test('should return complete performance summary', () => {
      const result = getCoursePerformanceSummary(sampleRounds, sampleCourse);
      
      expect(result.courseAverages).toBeTruthy();
      expect(result.bestWorstRounds).toBeTruthy();
      expect(result.holePerformance).toBeTruthy();
      expect(result.strongestHoles).toBeTruthy();
      expect(result.weakestHoles).toBeTruthy();
      expect(result.courseName).toBe('Pine Valley Golf Club');
      expect(result.courseId).toBe('course-1');
      
      // Check that strongest holes have better averages than weakest
      if (result.strongestHoles.length > 0 && result.weakestHoles.length > 0) {
        expect(result.strongestHoles[0].averageVsPar)
          .toBeLessThan(result.weakestHoles[0].averageVsPar);
      }
    });

    test('should handle course with no rounds', () => {
      const result = getCoursePerformanceSummary([], sampleCourse);
      
      expect(result.courseAverages.totalRounds).toBe(0);
      expect(result.bestWorstRounds.bestRound).toBeNull();
      expect(result.strongestHoles).toEqual([]);
      expect(result.weakestHoles).toEqual([]);
    });
  });

  describe('Round Filtering Utils', () => {
    
    describe('filterRoundsByCourse', () => {
      test('should filter rounds by course ID correctly', () => {
        const course1Rounds = filterRoundsByCourse(multiCourseRounds, 'course-1');
        
        expect(course1Rounds).toHaveLength(3);
        expect(course1Rounds.every(round => round.courseId === 'course-1')).toBe(true);
        expect(course1Rounds.map(r => r.id)).toContain('round-mc1');
        expect(course1Rounds.map(r => r.id)).toContain('round-mc3');
        expect(course1Rounds.map(r => r.id)).toContain('round-mc5');
      });

      test('should return empty array for non-existent course', () => {
        const result = filterRoundsByCourse(multiCourseRounds, 'non-existent');
        expect(result).toEqual([]);
      });

      test('should handle null/undefined inputs', () => {
        expect(filterRoundsByCourse(null, 'course-1')).toEqual([]);
        expect(filterRoundsByCourse(multiCourseRounds, null)).toEqual([]);
      });
    });

    describe('filterRoundsByDateRange', () => {
      test('should filter rounds by date range correctly', () => {
        const result = filterRoundsByDateRange(multiCourseRounds, '2024-01-20', '2024-02-15');
        
        expect(result).toHaveLength(3); // rounds from 1/20, 2/1, and 2/15
        expect(result.map(r => r.id)).toContain('round-mc2');
        expect(result.map(r => r.id)).toContain('round-mc3');
        expect(result.map(r => r.id)).toContain('round-mc4');
      });

      test('should handle start date only', () => {
        const result = filterRoundsByDateRange(multiCourseRounds, '2024-02-01', null);
        
        expect(result).toHaveLength(3); // rounds from 2/1, 2/15, and 3/1
      });

      test('should handle end date only', () => {
        const result = filterRoundsByDateRange(multiCourseRounds, null, '2024-01-20');
        
        expect(result).toHaveLength(2); // rounds from 1/15 and 1/20
      });
    });

    describe('filterRoundsByCompletion', () => {
      test('should filter full rounds correctly', () => {
        const result = filterRoundsByCompletion(multiCourseRounds, 'full');
        
        expect(result).toHaveLength(3); // Only full 18-hole rounds
        expect(result.every(round => {
          const holesPlayed = Object.keys(round.scores).filter(hole => round.scores[hole] > 0).length;
          return holesPlayed === 18;
        })).toBe(true);
      });

      test('should filter front 9 rounds correctly', () => {
        const result = filterRoundsByCompletion(multiCourseRounds, 'front9');
        
        expect(result).toHaveLength(1); // Only round-mc3
        expect(result[0].id).toBe('round-mc3');
      });

      test('should filter back 9 rounds correctly', () => {
        const result = filterRoundsByCompletion(multiCourseRounds, 'back9');
        
        expect(result).toHaveLength(1); // Only round-mc4
        expect(result[0].id).toBe('round-mc4');
      });
    });

    describe('sortRounds', () => {
      test('should sort rounds by date descending (default)', () => {
        const result = sortRounds(multiCourseRounds);
        
        // Should be in order: 3/1, 2/15, 2/1, 1/20, 1/15
        expect(result[0].id).toBe('round-mc5'); // Latest date
        expect(result[result.length - 1].id).toBe('round-mc1'); // Earliest date
      });

      test('should sort rounds by date ascending', () => {
        const result = sortRounds(multiCourseRounds, 'date', 'asc');
        
        expect(result[0].id).toBe('round-mc1'); // Earliest date
        expect(result[result.length - 1].id).toBe('round-mc5'); // Latest date
      });

      test('should sort rounds by score', () => {
        const fullRounds = multiCourseRounds.filter(r => Object.keys(r.scores).length === 18);
        const result = sortRounds(fullRounds, 'score', 'asc');
        
        // Should be sorted by total score (ascending = best scores first)
        const scores = result.map(round => 
          Object.values(round.scores).reduce((sum, score) => sum + score, 0)
        );
        
        for (let i = 1; i < scores.length; i++) {
          expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
        }
      });
    });

    describe('groupRoundsByPeriod', () => {
      test('should group rounds by month', () => {
        const result = groupRoundsByPeriod(multiCourseRounds, 'month');
        
        expect(result['2024-01']).toHaveLength(2); // Jan rounds
        expect(result['2024-02']).toHaveLength(2); // Feb rounds  
        expect(result['2024-03']).toHaveLength(1); // Mar rounds
      });

      test('should group rounds by year', () => {
        const result = groupRoundsByPeriod(multiCourseRounds, 'year');
        
        expect(result['2024']).toHaveLength(5); // All rounds in 2024
      });
    });

    describe('getRecentRounds', () => {
      test('should return most recent rounds', () => {
        const result = getRecentRounds(multiCourseRounds, 3);
        
        expect(result).toHaveLength(3);
        expect(result[0].id).toBe('round-mc5'); // Most recent
        expect(result[1].id).toBe('round-mc4');
        expect(result[2].id).toBe('round-mc3');
      });

      test('should handle count larger than available rounds', () => {
        const result = getRecentRounds(multiCourseRounds, 10);
        
        expect(result).toHaveLength(5); // All available rounds
      });
    });

    describe('filterRoundsAdvanced', () => {
      test('should apply multiple filters correctly', () => {
        const filters = {
          courseId: 'course-1',
          startDate: '2024-01-10',
          endDate: '2024-02-28',
          completionType: 'all',
          limit: 2
        };
        
        const result = filterRoundsAdvanced(multiCourseRounds, filters);
        
        expect(result).toHaveLength(2); // Limited to 2
        expect(result.every(round => round.courseId === 'course-1')).toBe(true);
      });

      test('should handle empty filters', () => {
        const result = filterRoundsAdvanced(multiCourseRounds, {});
        
        expect(result).toHaveLength(5); // All rounds
      });
    });
  });

  describe('Performance Trend Analysis', () => {
    
    describe('calculateRollingAverages', () => {
      test('should calculate rolling averages for different window sizes', () => {
        const result = calculateRollingAverages(improvingTrendRounds, sampleCourse, [3, 5]);
        
        expect(result[3]).toBeTruthy();
        expect(result[5]).toBeTruthy();
        expect(result[3].averageScore).toBeGreaterThan(70);
        expect(result[3].averageScore).toBeLessThan(90);
        expect(result[3].roundsCount).toBe(3);
        expect(result[5].roundsCount).toBe(5);
      });

      test('should detect improving trend in rolling averages', () => {
        const result = calculateRollingAverages(improvingTrendRounds, sampleCourse, [5]);
        
        // Should detect improvement in the trend
        expect(result[5].trend.direction).toBe('improving');
        expect(result[5].bestScore).toBeLessThan(result[5].worstScore);
      });

      test('should handle insufficient data', () => {
        const result = calculateRollingAverages(improvingTrendRounds.slice(0, 2), sampleCourse, [5]);
        
        expect(result[5]).toBeNull(); // Not enough rounds for window size 5
      });

      test('should include consistency metrics', () => {
        const result = calculateRollingAverages(improvingTrendRounds, sampleCourse, [5]);
        
        expect(result[5].consistency).toBeGreaterThan(0);
        expect(typeof result[5].consistency).toBe('number');
      });
    });

    describe('detectPerformanceTrends', () => {
      test('should detect improvement trend correctly', () => {
        const result = detectPerformanceTrends(improvingTrendRounds, sampleCourse);
        
        expect(result.trend).toBe('improving');
        expect(result.improvement).toBeGreaterThan(0); // Positive = improvement
        expect(result.totalRounds).toBe(6);
        expect(result.statistics.earlyAverage).toBeGreaterThan(result.statistics.recentAverage);
      });

      test('should calculate streaks correctly', () => {
        const result = detectPerformanceTrends(improvingTrendRounds, sampleCourse);
        
        expect(result.streaks).toBeTruthy();
        expect(result.streaks.improving).toBeGreaterThan(0);
        expect(result.streaks.current).toBe('improving');
      });

      test('should handle insufficient data', () => {
        const result = detectPerformanceTrends(improvingTrendRounds.slice(0, 2), sampleCourse);
        
        expect(result.trend).toBe('insufficient_data');
        expect(result.confidence).toBe('none');
      });

      test('should provide human-readable analysis', () => {
        const result = detectPerformanceTrends(improvingTrendRounds, sampleCourse);
        
        expect(result.analysis).toBeTruthy();
        expect(typeof result.analysis).toBe('string');
        expect(result.analysis.length).toBeGreaterThan(10);
      });

      test('should calculate timespan correctly', () => {
        const result = detectPerformanceTrends(improvingTrendRounds, sampleCourse);
        
        expect(result.timespan.days).toBeGreaterThan(30); // About 5 weeks
        expect(result.timespan.from).toBeInstanceOf(Date);
        expect(result.timespan.to).toBeInstanceOf(Date);
      });
    });

    describe('calculateTrendSignificance', () => {
      test('should detect significant improvement', () => {
        const result = calculateTrendSignificance(improvingTrendRounds, sampleCourse);
        
        expect(result.significant).toBe(true);
        expect(result.confidence).toBeTruthy();
        expect(result.factors).toBeTruthy();
        expect(result.recommendations).toBeInstanceOf(Array);
      });

      test('should handle insufficient data for significance', () => {
        const result = calculateTrendSignificance(improvingTrendRounds.slice(0, 3), sampleCourse);
        
        expect(result.significant).toBe(false);
        expect(result.reason).toBe('insufficient_data');
        expect(result.minRoundsNeeded).toBe(5);
      });

      test('should provide recommendations', () => {
        const result = calculateTrendSignificance(improvingTrendRounds, sampleCourse);
        
        expect(result.recommendations).toBeInstanceOf(Array);
        expect(result.recommendations.length).toBeGreaterThan(0);
        expect(result.recommendations.every(rec => typeof rec === 'string')).toBe(true);
      });

      test('should analyze consistency factors', () => {
        const result = calculateTrendSignificance(improvingTrendRounds, sampleCourse);
        
        expect(result.factors.consistentAcrossWindows).toBeDefined();
        expect(result.factors.significantImprovement).toBeDefined();
        expect(result.factors.strongCorrelation).toBeDefined();
        expect(result.factors.sufficientData).toBeDefined();
      });
    });

    describe('Trend Analysis Integration', () => {
      test('should work with mixed round types', () => {
        // Test with rounds including partial rounds
        const mixedRounds = [...improvingTrendRounds, ...sampleRounds.slice(3, 5)];
        const trends = detectPerformanceTrends(mixedRounds, sampleCourse);
        
        expect(trends.totalRounds).toBe(mixedRounds.length);
        expect(trends.trend).toBeTruthy();
      });

      test('should handle stable performance', () => {
        // Create rounds with stable scores
        const stableRounds = Array.from({ length: 6 }, (_, i) => ({
          id: `stable-${i}`,
          courseId: 'course-1',
          createdAt: `2024-0${Math.floor(i/2) + 1}-${(i % 2) * 15 + 1}`,
          scores: { 1: 4, 2: 3, 3: 5, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 } // Consistent 80
        }));
        
        const trends = detectPerformanceTrends(stableRounds, sampleCourse);
        
        expect(trends.trend).toBe('stable');
        expect(Math.abs(trends.improvement)).toBeLessThan(1);
      });
    });
  });

  describe('Club Performance Analysis', () => {
    
    describe('analyzeClubUsage', () => {
      test('should track club usage per hole correctly', () => {
        const result = analyzeClubUsage(clubAnalysisRounds, sampleCourse);
        
        // Check hole 1 (should have driver and 3wood usage)
        const hole1 = result[1];
        expect(hole1).toBeTruthy();
        expect(hole1.totalRounds).toBe(4);
        expect(hole1.clubs['driver']).toBeTruthy();
        expect(hole1.clubs['3wood']).toBeTruthy();
        expect(hole1.clubs['driver'].timesUsed).toBe(2);
        expect(hole1.clubs['3wood'].timesUsed).toBe(2);
      });

      test('should identify most used and best performing clubs', () => {
        const result = analyzeClubUsage(clubAnalysisRounds, sampleCourse);
        
        // Check hole 2 (par 3) - should have 8iron usage
        const hole2 = result[2];
        expect(hole2.mostUsedClub).toBeTruthy();
        expect(hole2.bestClub).toBeTruthy();
        expect(hole2.clubVariety).toBeGreaterThan(0);
      });

      test('should calculate club statistics correctly', () => {
        const result = analyzeClubUsage(clubAnalysisRounds, sampleCourse);
        
        const hole1 = result[1];
        const driverStats = hole1.clubs['driver'];
        
        expect(driverStats.averageScore).toBeGreaterThan(0);
        expect(driverStats.bestScore).toBeLessThanOrEqual(driverStats.worstScore);
        expect(driverStats.scores).toHaveLength(driverStats.timesUsed);
      });

      test('should handle empty club data', () => {
        const roundsWithoutClubs = clubAnalysisRounds.map(round => ({
          ...round,
          clubs: {}
        }));
        
        const result = analyzeClubUsage(roundsWithoutClubs, sampleCourse);
        
        Object.values(result).forEach(hole => {
          expect(hole.totalRounds).toBe(0);
          expect(Object.keys(hole.clubs)).toHaveLength(0);
        });
      });
    });

    describe('analyzeClubPerformanceCorrelation', () => {
      test('should analyze overall club performance', () => {
        const result = analyzeClubPerformanceCorrelation(clubAnalysisRounds, sampleCourse);
        
        expect(result.overallClubStats).toBeTruthy();
        expect(result.holeSpecificStats).toBeTruthy();
        expect(result.recommendations).toBeInstanceOf(Array);
        
        // Check driver statistics
        const driverStats = result.overallClubStats['driver'];
        if (driverStats) {
          expect(driverStats.totalUses).toBeGreaterThan(0);
          expect(driverStats.averageScore).toBeGreaterThan(0);
          expect(driverStats.holesUsed).toBeInstanceOf(Array);
          expect(driverStats.recommendationStrength).toBeDefined();
        }
      });

      test('should calculate consistency scores', () => {
        const result = analyzeClubPerformanceCorrelation(clubAnalysisRounds, sampleCourse);
        
        Object.values(result.overallClubStats).forEach(clubStats => {
          if (clubStats.totalUses > 1) {
            expect(clubStats.consistencyScore).toBeGreaterThanOrEqual(0);
          }
        });
      });

      test('should generate club recommendations', () => {
        const result = analyzeClubPerformanceCorrelation(clubAnalysisRounds, sampleCourse);
        
        expect(result.recommendations).toBeInstanceOf(Array);
        result.recommendations.forEach(rec => {
          expect(rec.type).toBeDefined();
          expect(rec.message).toBeTruthy();
          expect(typeof rec.message).toBe('string');
        });
      });
    });

    describe('getClubRecommendationsForHole', () => {
      test('should provide hole-specific club recommendations', () => {
        const clubUsage = analyzeClubUsage(clubAnalysisRounds, sampleCourse);
        const result = getClubRecommendationsForHole(clubUsage, 1);
        
        expect(result.holeNumber).toBe(1);
        expect(result.par).toBe(4);
        expect(result.totalRoundsPlayed).toBeGreaterThan(0);
        
        if (!result.insufficient_data) {
          expect(result.recommendations).toBeInstanceOf(Array);
          expect(result.mostUsed).toBeTruthy();
          
          result.recommendations.forEach(rec => {
            expect(rec.club).toBeTruthy();
            expect(rec.averageScore).toBeGreaterThan(0);
            expect(rec.rank).toBeGreaterThan(0);
            expect(rec.confidence).toBeDefined();
            expect(rec.recommendation).toBeTruthy();
          });
        }
      });

      test('should handle insufficient data gracefully', () => {
        const clubUsage = analyzeClubUsage(clubAnalysisRounds.slice(0, 1), sampleCourse);
        const result = getClubRecommendationsForHole(clubUsage, 1);
        
        expect(result.insufficient_data).toBe(true);
        expect(result.message).toBeTruthy();
      });

      test('should rank clubs by performance', () => {
        const clubUsage = analyzeClubUsage(clubAnalysisRounds, sampleCourse);
        const result = getClubRecommendationsForHole(clubUsage, 1);
        
        if (!result.insufficient_data && result.recommendations.length > 1) {
          // Check that clubs are ranked (rank 1 should have best or equal average score)
          const ranks = result.recommendations.map(r => r.rank);
          const scores = result.recommendations.map(r => r.averageScore);
          
          expect(ranks[0]).toBe(1);
          if (ranks.length > 1) {
            expect(scores[0]).toBeLessThanOrEqual(scores[1]);
          }
        }
      });
    });

    describe('analyzeClubDistanceAccuracy', () => {
      test('should analyze distance statistics by club', () => {
        const result = analyzeClubDistanceAccuracy(clubAnalysisRounds);
        
        Object.values(result).forEach(clubStats => {
          expect(clubStats.club).toBeTruthy();
          expect(clubStats.distances).toBeInstanceOf(Array);
          expect(clubStats.averageDistance).toBeGreaterThan(0);
          expect(clubStats.maxDistance).toBeGreaterThanOrEqual(clubStats.minDistance);
        });
      });

      test('should calculate fairway and green percentages', () => {
        const result = analyzeClubDistanceAccuracy(clubAnalysisRounds);
        
        Object.values(result).forEach(clubStats => {
          if (clubStats.fairwayAttempts > 0) {
            expect(clubStats.fairwayPercentage).toBeGreaterThanOrEqual(0);
            expect(clubStats.fairwayPercentage).toBeLessThanOrEqual(100);
          }
        });
      });

      test('should handle missing distance data', () => {
        const roundsWithoutDistances = clubAnalysisRounds.map(round => ({
          ...round,
          distances: {}
        }));
        
        const result = analyzeClubDistanceAccuracy(roundsWithoutDistances);
        expect(Object.keys(result)).toHaveLength(0);
      });
    });

    describe('getClubInsightsForScorecard', () => {
      test('should provide scorecard insights for holes with data', () => {
        const clubUsage = analyzeClubUsage(clubAnalysisRounds, sampleCourse);
        const result = getClubInsightsForScorecard(clubUsage, 1);
        
        if (result) {
          expect(result.holeNumber).toBe(1);
          expect(result.hasData).toBe(true);
          
          if (result.mostUsed) {
            expect(result.mostUsed.club).toBeTruthy();
            expect(result.mostUsed.averageScore).toBeGreaterThan(0);
            expect(result.mostUsed.timesUsed).toBeGreaterThan(0);
          }
          
          if (result.recommendation) {
            expect(result.recommendation.club).toBeTruthy();
            expect(result.recommendation.improvement).toBeGreaterThan(0);
            expect(result.recommendation.confidence).toBeDefined();
          }
        }
      });

      test('should return null for holes with insufficient data', () => {
        const clubUsage = analyzeClubUsage(clubAnalysisRounds.slice(0, 1), sampleCourse);
        const result = getClubInsightsForScorecard(clubUsage, 1);
        
        expect(result).toBeNull();
      });

      test('should identify warning clubs', () => {
        const clubUsage = analyzeClubUsage(clubAnalysisRounds, sampleCourse);
        
        // Test multiple holes to find one with a warning club
        for (let hole = 1; hole <= 18; hole++) {
          const result = getClubInsightsForScorecard(clubUsage, hole);
          if (result && result.warningClub) {
            expect(result.warningClub.club).toBeTruthy();
            expect(result.warningClub.averageScore).toBeGreaterThan(0);
            expect(result.warningClub.timesUsed).toBeGreaterThan(0);
            break; // Found at least one warning club
          }
        }
      });
    });
  });
});

// Manual test runner for React Native environment
export const runManualTests = () => {
  console.log('🧪 Running Course Performance Utils Tests...');
  
  try {
    // Import multi-course rounds for filtering tests
    const multiCourseRounds = [
      {
        id: 'round-mc1',
        courseId: 'course-1',
        createdAt: '2024-01-15',
        scores: { 1: 4, 2: 3, 3: 5, 4: 4, 5: 3, 6: 2, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 4, 13: 4, 14: 5, 15: 3, 16: 4, 17: 5, 18: 3 }
      },
      {
        id: 'round-mc2',
        courseId: 'course-2',
        createdAt: '2024-01-20',
        scores: { 1: 5, 2: 4, 3: 6, 4: 4, 5: 4, 6: 3, 7: 5, 8: 5, 9: 4, 10: 4, 11: 3, 12: 5, 13: 5, 14: 4, 15: 4, 16: 4, 17: 6, 18: 5 }
      },
      {
        id: 'round-mc3',
        courseId: 'course-1',
        createdAt: '2024-02-01',
        scores: { 1: 6, 2: 4, 3: 6, 4: 5, 5: 5, 6: 4, 7: 5, 8: 6, 9: 5 }
      },
      {
        id: 'round-mc4',
        courseId: 'course-3',
        createdAt: '2024-02-15',
        scores: { 10: 4, 11: 2, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 }
      },
      {
        id: 'round-mc5',
        courseId: 'course-1',
        createdAt: '2024-03-01',
        scores: { 1: 4, 2: 3, 3: 4, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 }
      }
    ];
    // Test 1: Course Averages
    console.log('\n📊 Testing Course Averages...');
    const averages = calculateCourseAverages(sampleRounds, sampleCourse);
    console.log('✅ Course Averages:', averages);
    
    // Test 2: Best/Worst Rounds
    console.log('\n🏆 Testing Best/Worst Rounds...');
    const bestWorst = findBestWorstRounds(sampleRounds, sampleCourse);
    console.log('✅ Best/Worst Rounds:', bestWorst);
    
    // Test 3: Hole Performance
    console.log('\n⛳ Testing Hole Performance...');
    const holePerf = calculateHolePerformance(sampleRounds, sampleCourse);
    console.log('✅ Hole 1 Performance:', holePerf[1]);
    console.log('✅ Hole 6 Performance:', holePerf[6]);
    
    // Test 4: Complete Summary
    console.log('\n📈 Testing Complete Summary...');
    const summary = getCoursePerformanceSummary(sampleRounds, sampleCourse);
    console.log('✅ Course Summary:', {
      courseName: summary.courseName,
      totalRounds: summary.courseAverages.totalRounds,
      averageScore: summary.courseAverages.averageScore,
      bestScore: summary.bestWorstRounds.bestScore,
      strongestHole: summary.strongestHoles[0]?.holeNumber,
      weakestHole: summary.weakestHoles[0]?.holeNumber
    });
    
    // Test 5: Filtering Functions
    console.log('\n🔍 Testing Filtering Functions...');
    
    // Test course filtering
    const course1Rounds = filterRoundsByCourse(multiCourseRounds, 'course-1');
    console.log('✅ Course 1 Rounds:', course1Rounds.length, 'rounds');
    
    // Test date filtering  
    const recentRounds = filterRoundsByDateRange(multiCourseRounds, '2024-02-01', null);
    console.log('✅ Rounds since Feb 1:', recentRounds.length, 'rounds');
    
    // Test completion filtering
    const fullRounds = filterRoundsByCompletion(multiCourseRounds, 'full');
    const front9Rounds = filterRoundsByCompletion(multiCourseRounds, 'front9');
    console.log('✅ Full rounds:', fullRounds.length, '| Front 9 only:', front9Rounds.length);
    
    // Test sorting
    const sortedByDate = sortRounds(multiCourseRounds, 'date', 'desc');
    console.log('✅ Latest round ID:', sortedByDate[0]?.id);
    
    // Test grouping
    const groupedByMonth = groupRoundsByPeriod(multiCourseRounds, 'month');
    console.log('✅ Rounds by month:', Object.keys(groupedByMonth).length, 'months');
    
    // Test recent rounds
    const last3Rounds = getRecentRounds(multiCourseRounds, 3);
    console.log('✅ Last 3 rounds:', last3Rounds.map(r => r.id));
    
    // Test advanced filtering
    const advancedFilter = filterRoundsAdvanced(multiCourseRounds, {
      courseId: 'course-1',
      completionType: 'all',
      limit: 2
    });
    console.log('✅ Advanced filter result:', advancedFilter.length, 'rounds');
    
    // Test 6: Trend Analysis Functions
    console.log('\n📈 Testing Trend Analysis Functions...');
    
    // Create improving trend test data
    const improvingTrendRounds = [
      {
        id: 'trend-1',
        courseId: 'course-1',
        createdAt: '2024-01-01',
        scores: { 1: 5, 2: 4, 3: 6, 4: 5, 5: 5, 6: 4, 7: 5, 8: 6, 9: 5, 10: 5, 11: 4, 12: 6, 13: 5, 14: 5, 15: 4, 16: 5, 17: 6, 18: 5 }
      },
      {
        id: 'trend-2',
        courseId: 'course-1',
        createdAt: '2024-01-08',
        scores: { 1: 5, 2: 4, 3: 5, 4: 5, 5: 4, 6: 3, 7: 5, 8: 5, 9: 4, 10: 5, 11: 3, 12: 5, 13: 5, 14: 4, 15: 4, 16: 4, 17: 5, 18: 5 }
      },
      {
        id: 'trend-3',
        courseId: 'course-1',
        createdAt: '2024-01-15',
        scores: { 1: 4, 2: 4, 3: 5, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 }
      },
      {
        id: 'trend-4',
        courseId: 'course-1',
        createdAt: '2024-01-22',
        scores: { 1: 4, 2: 3, 3: 5, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 4, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 }
      },
      {
        id: 'trend-5',
        courseId: 'course-1',
        createdAt: '2024-01-29',
        scores: { 1: 4, 2: 3, 3: 4, 4: 4, 5: 3, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 4, 13: 4, 14: 4, 15: 3, 16: 4, 17: 4, 18: 4 }
      }
    ];
    
    // Test rolling averages
    const rollingAvgs = calculateRollingAverages(improvingTrendRounds, sampleCourse, [3, 5]);
    console.log('✅ Rolling averages (last 3):', rollingAvgs[3]?.averageScore, 'trend:', rollingAvgs[3]?.trend?.direction);
    console.log('✅ Rolling averages (last 5):', rollingAvgs[5]?.averageScore, 'trend:', rollingAvgs[5]?.trend?.direction);
    
    // Test performance trends
    const trends = detectPerformanceTrends(improvingTrendRounds, sampleCourse);
    console.log('✅ Performance trend:', trends.trend, 'improvement:', trends.improvement, 'strokes');
    console.log('✅ Trend analysis:', trends.analysis);
    
    // Test trend significance
    const significance = calculateTrendSignificance(improvingTrendRounds, sampleCourse);
    console.log('✅ Trend significant:', significance.significant, 'confidence:', significance.confidence);
    console.log('✅ Recommendations:', significance.recommendations.slice(0, 2));
    
    // Test 7: Club Analysis Functions
    console.log('\n🏌️ Testing Club Analysis Functions...');
    
    // Create club analysis test data
    const clubAnalysisRounds = [
      {
        id: 'club-round-1',
        courseId: 'course-1',
        createdAt: '2024-01-01',
        scores: { 1: 4, 2: 3, 3: 5, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4 },
        clubs: { 1: 'driver', 2: '8iron', 3: 'driver', 4: 'driver', 5: '7iron', 6: '9iron', 7: 'driver', 8: 'driver', 9: '6iron' },
        distances: { 1: 280, 2: 145, 3: 285 }
      },
      {
        id: 'club-round-2',
        courseId: 'course-1',
        createdAt: '2024-01-08',
        scores: { 1: 3, 2: 3, 3: 4, 4: 4, 5: 3, 6: 2, 7: 4, 8: 4, 9: 4 },
        clubs: { 1: '3wood', 2: '8iron', 3: '3wood', 4: 'driver', 5: '6iron', 6: '9iron', 7: 'driver', 8: '3wood', 9: '6iron' },
        distances: { 1: 260, 2: 150, 3: 255 }
      },
      {
        id: 'club-round-3',
        courseId: 'course-1',
        createdAt: '2024-01-15',
        scores: { 1: 4, 2: 4, 3: 5, 4: 4, 5: 4, 6: 3, 7: 5, 8: 5, 9: 4 },
        clubs: { 1: 'driver', 2: '7iron', 3: 'driver', 4: 'driver', 5: '7iron', 6: '9iron', 7: 'driver', 8: 'driver', 9: '6iron' },
        distances: { 1: 290, 2: 135, 3: 295 }
      }
    ];
    
    // Test club usage analysis
    const clubUsage = analyzeClubUsage(clubAnalysisRounds, sampleCourse);
    const hole1Stats = clubUsage[1];
    console.log('✅ Hole 1 club usage:', hole1Stats?.totalRounds, 'rounds, most used:', hole1Stats?.mostUsedClub?.club);
    console.log('✅ Hole 1 club variety:', hole1Stats?.clubVariety, 'different clubs');
    
    // Test club performance correlation
    const clubCorrelation = analyzeClubPerformanceCorrelation(clubAnalysisRounds, sampleCourse);
    const driverStats = clubCorrelation.overallClubStats['driver'];
    console.log('✅ Driver overall stats:', driverStats?.totalUses, 'uses, avg score:', driverStats?.averageScore);
    console.log('✅ Club recommendations:', clubCorrelation.recommendations.length, 'recommendations');
    
    // Test hole-specific recommendations
    const hole1Recs = getClubRecommendationsForHole(clubUsage, 1);
    if (!hole1Recs.insufficient_data) {
      console.log('✅ Hole 1 recommendations:', hole1Recs.recommendations.length, 'clubs ranked');
      console.log('✅ Best club for hole 1:', hole1Recs.recommendations[0]?.club, 'avg:', hole1Recs.recommendations[0]?.averageScore);
    } else {
      console.log('✅ Hole 1 recommendations: Insufficient data');
    }
    
    // Test distance analysis
    const distanceStats = analyzeClubDistanceAccuracy(clubAnalysisRounds);
    const driverDistance = distanceStats['driver'];
    if (driverDistance) {
      console.log('✅ Driver distance stats: avg', driverDistance.averageDistance, 'yards, max', driverDistance.maxDistance);
    }
    
    // Test scorecard insights
    const scorecardInsight = getClubInsightsForScorecard(clubUsage, 1);
    if (scorecardInsight) {
      console.log('✅ Scorecard insight hole 1: most used', scorecardInsight.mostUsed?.club);
      if (scorecardInsight.recommendation) {
        console.log('✅ Recommendation: try', scorecardInsight.recommendation.club, 'for', scorecardInsight.recommendation.improvement, 'stroke improvement');
      }
    } else {
      console.log('✅ Scorecard insight hole 1: No data available');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};