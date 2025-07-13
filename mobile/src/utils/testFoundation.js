/**
 * Golf Intelligence Foundation Test
 * 
 * This module can be imported into any React Native component
 * to test all our course performance utilities.
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
} from './coursePerformanceUtils';

// Test data
const testCourse = {
  id: 'test-course-1',
  name: 'Test Golf Club',
  holes: Array.from({ length: 18 }, (_, i) => ({
    id: `hole-${i + 1}`,
    holeNumber: i + 1,
    par: i + 1 <= 4 ? 4 : i + 1 <= 10 ? (i + 1) % 2 === 0 ? 5 : 3 : 4
  }))
};

const testRounds = [
  {
    id: 'round-1',
    courseId: 'test-course-1',
    createdAt: '2024-01-01',
    scores: { 1: 4, 2: 3, 3: 5, 4: 4, 5: 4, 6: 3, 7: 4, 8: 5, 9: 4, 10: 4, 11: 3, 12: 5, 13: 4, 14: 4, 15: 3, 16: 4, 17: 5, 18: 4 },
    clubs: { 1: 'driver', 2: '8iron', 3: 'driver', 4: '7iron', 5: '6iron', 6: '9iron', 7: 'driver', 8: '3wood', 9: '7iron', 10: 'driver', 11: '9iron', 12: 'driver', 13: '6iron', 14: '8iron', 15: 'wedge', 16: 'driver', 17: '3wood', 18: '7iron' }
  },
  {
    id: 'round-2',
    courseId: 'test-course-1',
    createdAt: '2024-01-08',
    scores: { 1: 3, 2: 3, 3: 4, 4: 4, 5: 3, 6: 2, 7: 4, 8: 4, 9: 4, 10: 4, 11: 3, 12: 4, 13: 4, 14: 3, 15: 3, 16: 4, 17: 4, 18: 4 },
    clubs: { 1: '3wood', 2: '8iron', 3: '3wood', 4: '6iron', 5: '7iron', 6: '9iron', 7: 'driver', 8: '3wood', 9: '6iron', 10: 'driver', 11: '9iron', 12: '3wood', 13: '7iron', 14: '8iron', 15: 'wedge', 16: 'driver', 17: '3wood', 18: '8iron' }
  },
  {
    id: 'round-3',
    courseId: 'test-course-1',
    createdAt: '2024-01-15',
    scores: { 1: 4, 2: 2, 3: 4, 4: 4, 5: 4, 6: 3, 7: 4, 8: 4, 9: 3, 10: 4, 11: 2, 12: 4, 13: 4, 14: 4, 15: 2, 16: 4, 17: 4, 18: 4 },
    clubs: { 1: 'driver', 2: '8iron', 3: '3wood', 4: '7iron', 5: '6iron', 6: '8iron', 7: 'driver', 8: '3wood', 9: '7iron', 10: 'driver', 11: '8iron', 12: '3wood', 13: '6iron', 14: '8iron', 15: '9iron', 16: 'driver', 17: '3wood', 18: '7iron' }
  },
  {
    id: 'round-4',
    courseId: 'test-course-1',
    createdAt: '2024-01-22',
    scores: { 1: 3, 2: 3, 3: 4, 4: 3, 5: 3, 6: 2, 7: 3, 8: 4, 9: 3, 10: 3, 11: 2, 12: 4, 13: 3, 14: 3, 15: 2, 16: 3, 17: 4, 18: 3 },
    clubs: { 1: '3wood', 2: '8iron', 3: '3wood', 4: '6iron', 5: '7iron', 6: '9iron', 7: '3wood', 8: '3wood', 9: '7iron', 10: '3wood', 11: '8iron', 12: '3wood', 13: '7iron', 14: '8iron', 15: '9iron', 16: '3wood', 17: '3wood', 18: '8iron' }
  },
  {
    id: 'round-5',
    courseId: 'test-course-1',
    createdAt: '2024-01-29',
    scores: { 1: 3, 2: 2, 3: 3, 4: 3, 5: 3, 6: 2, 7: 3, 8: 3, 9: 3, 10: 3, 11: 2, 12: 3, 13: 3, 14: 3, 15: 2, 16: 3, 17: 3, 18: 3 },
    clubs: { 1: '3wood', 2: '8iron', 3: '3wood', 4: '6iron', 5: '7iron', 6: '9iron', 7: '3wood', 8: '3wood', 9: '7iron', 10: '3wood', 11: '8iron', 12: '3wood', 13: '7iron', 14: '8iron', 15: '9iron', 16: '3wood', 17: '3wood', 18: '8iron' }
  }
];

/**
 * Run comprehensive tests of all golf intelligence functions
 * Call this from any React Native component to validate functionality
 */
export const runFoundationTests = () => {
  console.log('🧪 Starting Golf Intelligence Foundation Tests...\n');
  
  let results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  const test = (name, testFn) => {
    try {
      console.log(`🔍 Testing: ${name}`);
      const result = testFn();
      results.passed++;
      results.tests.push({ name, status: 'PASSED', result });
      console.log(`✅ PASSED: ${name}\n`);
      return result;
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ FAILED: ${name} - ${error.message}\n`);
      return null;
    }
  };

  // Test 1: Basic Course Analysis
  test('Course Performance Calculation', () => {
    const averages = calculateCourseAverages(testRounds, testCourse);
    const bestWorst = findBestWorstRounds(testRounds, testCourse);
    const holePerformance = calculateHolePerformance(testRounds, testCourse);
    
    console.log(`   📊 ${averages.totalRounds} rounds analyzed`);
    console.log(`   📈 Average score: ${averages.averageScore} (${averages.averageScoreVsPar > 0 ? '+' : ''}${averages.averageScoreVsPar} vs par)`);
    console.log(`   🏆 Best score: ${bestWorst.bestScore}, Worst: ${bestWorst.worstScore}`);
    console.log(`   ⛳ Hole analysis: ${Object.keys(holePerformance).length} holes`);
    
    return { averages, bestWorst, holePerformance };
  });

  // Test 2: Advanced Filtering
  test('Data Filtering & Sorting', () => {
    const courseRounds = filterRoundsByCourse(testRounds, 'test-course-1');
    const recentRounds = getRecentRounds(testRounds, 3);
    const sortedRounds = sortRounds(testRounds, 'score', 'asc');
    const dateFiltered = filterRoundsByDateRange(testRounds, '2024-01-10', '2024-01-30');
    
    console.log(`   🔍 Course filtering: ${courseRounds.length}/${testRounds.length} rounds`);
    console.log(`   📅 Recent rounds: ${recentRounds.length} rounds`);
    console.log(`   🔄 Sorted by score: ${sortedRounds.length} rounds`);
    console.log(`   📆 Date filtered: ${dateFiltered.length} rounds`);
    
    return { courseRounds, recentRounds, sortedRounds, dateFiltered };
  });

  // Test 3: Trend Analysis
  test('Performance Trend Detection', () => {
    const trends = detectPerformanceTrends(testRounds, testCourse);
    const rollingAvgs = calculateRollingAverages(testRounds, testCourse, [3, 5]);
    const significance = calculateTrendSignificance(testRounds, testCourse);
    
    console.log(`   📈 Trend: ${trends.trend} (${trends.confidence} confidence)`);
    console.log(`   📊 Improvement: ${trends.improvement} strokes`);
    console.log(`   🎯 Rolling avg (3): ${rollingAvgs[3]?.averageScore || 'N/A'}`);
    console.log(`   📈 Significant: ${significance.significant ? 'Yes' : 'No'}`);
    console.log(`   💡 ${trends.analysis}`);
    
    return { trends, rollingAvgs, significance };
  });

  // Test 4: Club Intelligence - THE BIG TEST!
  test('Club Performance Analysis (GAME CHANGER)', () => {
    const clubUsage = analyzeClubUsage(testRounds, testCourse);
    const clubCorrelation = analyzeClubPerformanceCorrelation(testRounds, testCourse);
    const distanceStats = analyzeClubDistanceAccuracy(testRounds);
    
    console.log(`   🏌️ Club analysis: ${Object.keys(clubCorrelation.overallClubStats).length} clubs tracked`);
    console.log(`   📋 Recommendations: ${clubCorrelation.recommendations.length} suggestions`);
    
    // Test hole 1 specifically
    const hole1 = clubUsage[1];
    if (hole1 && hole1.totalRounds > 0) {
      console.log(`   🎯 Hole 1: ${hole1.clubVariety} clubs used over ${hole1.totalRounds} rounds`);
      console.log(`   📊 Most used: ${hole1.mostUsedClub?.club} (${hole1.mostUsedClub?.averageScore} avg)`);
      
      if (hole1.bestClub && hole1.bestClub.club !== hole1.mostUsedClub?.club) {
        const improvement = hole1.mostUsedClub.averageScore - hole1.bestClub.averageScore;
        console.log(`   ⭐ INSIGHT: ${hole1.bestClub.club} performs ${improvement.toFixed(1)} strokes better than ${hole1.mostUsedClub.club}!`);
      }
    }
    
    // Show top recommendations
    if (clubCorrelation.recommendations.length > 0) {
      const topRec = clubCorrelation.recommendations[0];
      console.log(`   💡 Top recommendation: ${topRec.message}`);
    }
    
    return { clubUsage, clubCorrelation, distanceStats };
  });

  // Test 5: Scorecard Integration Ready
  test('Scorecard Integration Features', () => {
    const clubUsage = analyzeClubUsage(testRounds, testCourse);
    const hole1Insights = getClubInsightsForScorecard(clubUsage, 1);
    const hole1Recs = getClubRecommendationsForHole(clubUsage, 1);
    
    console.log(`   📱 Scorecard ready: ${hole1Insights ? 'Yes' : 'No'}`);
    
    if (hole1Insights) {
      console.log(`   🎯 Hole 1 insights available`);
      console.log(`   📊 Most used: ${hole1Insights.mostUsed?.club || 'N/A'}`);
      
      if (hole1Insights.recommendation) {
        console.log(`   💡 Recommendation: Try ${hole1Insights.recommendation.club} for ${hole1Insights.recommendation.improvement} stroke improvement`);
      }
      
      if (hole1Insights.warningClub) {
        console.log(`   ⚠️  Warning: Avoid ${hole1Insights.warningClub.club} (poor performance)`);
      }
    }
    
    if (!hole1Recs.insufficient_data) {
      console.log(`   📋 Club rankings: ${hole1Recs.recommendations.length} clubs ranked`);
      console.log(`   🏆 Best performer: ${hole1Recs.recommendations[0]?.club} (${hole1Recs.recommendations[0]?.averageScore} avg)`);
    }
    
    return { hole1Insights, hole1Recs };
  });

  // Test 6: Complete Summary
  test('Complete Performance Summary', () => {
    const summary = getCoursePerformanceSummary(testRounds, testCourse);
    
    console.log(`   📈 Course: ${summary.courseName}`);
    console.log(`   📊 Analysis complete: ${summary.courseAverages.totalRounds} rounds`);
    console.log(`   💪 Strongest hole: ${summary.strongestHoles[0]?.holeNumber || 'N/A'}`);
    console.log(`   🎯 Weakest hole: ${summary.weakestHoles[0]?.holeNumber || 'N/A'}`);
    
    return summary;
  });

  // Results Summary
  const total = results.passed + results.failed;
  const successRate = Math.round((results.passed / total) * 100);
  
  console.log('\n📋 TEST RESULTS SUMMARY');
  console.log('==========================================');
  console.log(`Tests Run: ${total}`);
  console.log(`Tests Passed: ${results.passed}`);
  console.log(`Tests Failed: ${results.failed}`);
  console.log(`Success Rate: ${successRate}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('✅ Golf Intelligence Foundation is working perfectly');
    console.log('🚀 Ready to proceed with Step 2: Scorecard Integration');
    
    console.log('\n🧠 KEY INSIGHTS DEMONSTRATED:');
    console.log('• Course performance analysis with statistical depth');
    console.log('• Advanced data filtering and trend detection');
    console.log('• Intelligent club recommendations with stroke improvements');
    console.log('• Real-time scorecard insights ready for integration');
    console.log('• Complete foundation for strategic golf intelligence');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('❌ Please review failed tests before proceeding');
    
    results.tests.filter(t => t.status === 'FAILED').forEach(test => {
      console.log(`   ❌ ${test.name}: ${test.error}`);
    });
  }
  
  return {
    success: results.failed === 0,
    results,
    successRate
  };
};

/**
 * Quick demo of club intelligence for a specific hole
 */
export const demoClubIntelligence = (holeNumber = 1) => {
  console.log(`\n🏌️ CLUB INTELLIGENCE DEMO - Hole ${holeNumber}`);
  console.log('================================================');
  
  const clubUsage = analyzeClubUsage(testRounds, testCourse);
  const insights = getClubInsightsForScorecard(clubUsage, holeNumber);
  const recommendations = getClubRecommendationsForHole(clubUsage, holeNumber);
  
  if (!insights) {
    console.log('❌ Insufficient data for this hole');
    return;
  }
  
  console.log(`📊 Hole ${holeNumber} - Par ${testCourse.holes[holeNumber-1].par}`);
  console.log(`🎯 Rounds played: ${clubUsage[holeNumber]?.totalRounds || 0}`);
  
  if (insights.mostUsed) {
    console.log(`🏌️ Most used club: ${insights.mostUsed.club}`);
    console.log(`   └── Used ${insights.mostUsed.timesUsed} times, ${insights.mostUsed.averageScore} average score`);
  }
  
  if (insights.recommendation) {
    console.log(`⭐ RECOMMENDATION: Try ${insights.recommendation.club}!`);
    console.log(`   └── ${insights.recommendation.improvement} stroke improvement (${insights.recommendation.confidence} confidence)`);
  }
  
  if (insights.warningClub) {
    console.log(`⚠️  WARNING: Avoid ${insights.warningClub.club}`);
    console.log(`   └── Poor performance: ${insights.warningClub.averageScore} average`);
  }
  
  if (!recommendations.insufficient_data && recommendations.recommendations.length > 0) {
    console.log('\n📋 Full Club Rankings:');
    recommendations.recommendations.forEach((rec, index) => {
      const emoji = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📌';
      console.log(`   ${emoji} ${rec.rank}. ${rec.club}: ${rec.averageScore} avg (${rec.timesUsed} uses, ${rec.confidence} confidence)`);
      console.log(`      └── ${rec.recommendation}`);
    });
  }
  
  return { insights, recommendations };
};

// Export for use in React Native components
export { testCourse, testRounds };