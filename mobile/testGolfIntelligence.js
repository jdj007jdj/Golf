#!/usr/bin/env node

/**
 * Golf Intelligence Foundation Test Runner
 * 
 * This script tests all our course performance utilities to ensure
 * they're working correctly before integrating into the mobile app.
 */

const fs = require('fs');
const path = require('path');

// Mock React Native modules for Node.js testing
global.console.log = (...args) => console.log(...args);

// Import our utilities (we'll need to handle ES6 imports)
const coursePerformanceUtils = require('./src/utils/coursePerformanceUtils.js');

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
  }
];

const runTests = () => {
  console.log('🧪 Golf Intelligence Foundation Test Suite\n');
  
  let testsRun = 0;
  let testsPassed = 0;
  
  const test = (name, fn) => {
    testsRun++;
    try {
      console.log(`🔍 Testing: ${name}`);
      fn();
      testsPassed++;
      console.log(`✅ PASSED: ${name}\n`);
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}\n`);
    }
  };

  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  };

  // Test 1: Course Averages
  test('Course Averages Calculation', () => {
    const averages = coursePerformanceUtils.calculateCourseAverages(testRounds, testCourse);
    
    assert(averages.totalRounds === 3, `Expected 3 rounds, got ${averages.totalRounds}`);
    assert(averages.averageScore > 3 && averages.averageScore < 6, `Average score should be realistic: ${averages.averageScore}`);
    assert(averages.coursePar === 72, `Expected par 72, got ${averages.coursePar}`);
    assert(averages.completedRounds === 3, `Expected 3 complete rounds, got ${averages.completedRounds}`);
    
    console.log(`   📊 Total rounds: ${averages.totalRounds}`);
    console.log(`   📊 Average score: ${averages.averageScore}`);
    console.log(`   📊 Score vs par: ${averages.averageScoreVsPar > 0 ? '+' : ''}${averages.averageScoreVsPar}`);
  });

  // Test 2: Best/Worst Rounds
  test('Best/Worst Round Detection', () => {
    const bestWorst = coursePerformanceUtils.findBestWorstRounds(testRounds, testCourse);
    
    assert(bestWorst.bestRound !== null, 'Should find best round');
    assert(bestWorst.worstRound !== null, 'Should find worst round');
    assert(bestWorst.bestScore <= bestWorst.worstScore, `Best score (${bestWorst.bestScore}) should be <= worst score (${bestWorst.worstScore})`);
    
    console.log(`   🏆 Best score: ${bestWorst.bestScore}`);
    console.log(`   📉 Worst score: ${bestWorst.worstScore}`);
  });

  // Test 3: Filtering
  test('Round Filtering Functions', () => {
    const courseRounds = coursePerformanceUtils.filterRoundsByCourse(testRounds, 'test-course-1');
    const recentRounds = coursePerformanceUtils.getRecentRounds(testRounds, 2);
    const sortedRounds = coursePerformanceUtils.sortRounds(testRounds, 'score', 'asc');
    
    assert(courseRounds.length === 3, `Expected 3 course rounds, got ${courseRounds.length}`);
    assert(recentRounds.length === 2, `Expected 2 recent rounds, got ${recentRounds.length}`);
    assert(sortedRounds.length === 3, `Expected 3 sorted rounds, got ${sortedRounds.length}`);
    
    console.log(`   🔍 Course filtering: ${courseRounds.length} rounds`);
    console.log(`   📅 Recent rounds: ${recentRounds.length} rounds`);
    console.log(`   🔄 Sorting: ${sortedRounds.length} rounds`);
  });

  // Test 4: Trend Analysis
  test('Performance Trend Analysis', () => {
    const trends = coursePerformanceUtils.detectPerformanceTrends(testRounds, testCourse);
    const rollingAvgs = coursePerformanceUtils.calculateRollingAverages(testRounds, testCourse, [3]);
    
    assert(trends.trend !== undefined, 'Should detect trend direction');
    assert(trends.totalRounds === 3, `Expected 3 rounds in trends, got ${trends.totalRounds}`);
    assert(trends.analysis && trends.analysis.length > 10, 'Should provide meaningful analysis');
    
    if (rollingAvgs[3]) {
      assert(rollingAvgs[3].averageScore > 0, 'Rolling average should be positive');
      console.log(`   📈 Trend: ${trends.trend} (${trends.confidence} confidence)`);
      console.log(`   📊 Rolling avg (3): ${rollingAvgs[3].averageScore}`);
      console.log(`   💡 Analysis: ${trends.analysis.substring(0, 50)}...`);
    }
  });

  // Test 5: Club Analysis - The Game Changer!
  test('Club Performance Analysis', () => {
    const clubUsage = coursePerformanceUtils.analyzeClubUsage(testRounds, testCourse);
    const clubCorrelation = coursePerformanceUtils.analyzeClubPerformanceCorrelation(testRounds, testCourse);
    
    assert(Object.keys(clubUsage).length > 0, 'Should analyze club usage for holes');
    assert(Object.keys(clubCorrelation.overallClubStats).length > 0, 'Should have overall club stats');
    
    // Test hole 1 specifically
    const hole1 = clubUsage[1];
    if (hole1 && hole1.totalRounds > 0) {
      assert(hole1.clubs && Object.keys(hole1.clubs).length > 0, 'Hole 1 should have club data');
      console.log(`   🏌️ Hole 1: ${hole1.totalRounds} rounds, ${hole1.clubVariety} different clubs`);
      console.log(`   🎯 Most used: ${hole1.mostUsedClub?.club} (${hole1.mostUsedClub?.timesUsed} times, avg: ${hole1.mostUsedClub?.averageScore})`);
      
      if (hole1.bestClub && hole1.bestClub !== hole1.mostUsedClub) {
        const improvement = hole1.mostUsedClub.averageScore - hole1.bestClub.averageScore;
        console.log(`   ⭐ Better option: ${hole1.bestClub.club} (avg: ${hole1.bestClub.averageScore}) - ${improvement.toFixed(1)} stroke improvement!`);
      }
    }
    
    // Test club recommendations
    const hole1Recs = coursePerformanceUtils.getClubRecommendationsForHole(clubUsage, 1);
    if (!hole1Recs.insufficient_data) {
      assert(hole1Recs.recommendations.length > 0, 'Should provide club recommendations');
      console.log(`   📋 Recommendations: ${hole1Recs.recommendations.length} clubs ranked`);
    }
  });

  // Test 6: Club Insights for Scorecard
  test('Scorecard Club Insights', () => {
    const clubUsage = coursePerformanceUtils.analyzeClubUsage(testRounds, testCourse);
    const insights = coursePerformanceUtils.getClubInsightsForScorecard(clubUsage, 1);
    
    if (insights) {
      assert(insights.holeNumber === 1, 'Should return insights for hole 1');
      assert(insights.hasData === true, 'Should have data available');
      
      console.log(`   🎯 Scorecard ready: Hole ${insights.holeNumber}`);
      console.log(`   📊 Most used: ${insights.mostUsed?.club || 'N/A'}`);
      
      if (insights.recommendation) {
        console.log(`   💡 Recommendation: Try ${insights.recommendation.club} for ${insights.recommendation.improvement} stroke improvement!`);
      }
      
      if (insights.warningClub) {
        console.log(`   ⚠️  Warning: Avoid ${insights.warningClub.club} (poor performance)`);
      }
    } else {
      console.log(`   ℹ️  Insufficient data for scorecard insights`);
    }
  });

  // Test 7: Performance Summary
  test('Complete Performance Summary', () => {
    const summary = coursePerformanceUtils.getCoursePerformanceSummary(testRounds, testCourse);
    
    assert(summary.courseName === 'Test Golf Club', `Expected course name 'Test Golf Club', got '${summary.courseName}'`);
    assert(summary.courseAverages !== undefined, 'Should have course averages');
    assert(summary.bestWorstRounds !== undefined, 'Should have best/worst rounds');
    assert(summary.holePerformance !== undefined, 'Should have hole performance');
    
    console.log(`   📈 Course: ${summary.courseName}`);
    console.log(`   📊 ${summary.courseAverages.totalRounds} rounds analyzed`);
    console.log(`   🏆 Best: ${summary.bestWorstRounds.bestScore}, Worst: ${summary.bestWorstRounds.worstScore}`);
    
    if (summary.strongestHoles.length > 0) {
      console.log(`   💪 Strongest hole: ${summary.strongestHoles[0].holeNumber} (${summary.strongestHoles[0].averageVsPar > 0 ? '+' : ''}${summary.strongestHoles[0].averageVsPar})`);
    }
    
    if (summary.weakestHoles.length > 0) {
      console.log(`   🎯 Focus area: Hole ${summary.weakestHoles[0].holeNumber} (${summary.weakestHoles[0].averageVsPar > 0 ? '+' : ''}${summary.weakestHoles[0].averageVsPar})`);
    }
  });

  // Summary
  console.log('📋 TEST RESULTS SUMMARY');
  console.log('=' * 40);
  console.log(`Tests Run: ${testsRun}`);
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Success Rate: ${Math.round((testsPassed / testsRun) * 100)}%`);
  
  if (testsPassed === testsRun) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('✅ Golf Intelligence Foundation is working correctly');
    console.log('🚀 Ready to proceed with Step 2: Scorecard Integration');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('❌ Please fix issues before proceeding');
  }
  
  return testsPassed === testsRun;
};

// Handle both CommonJS require and ES6 import
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests };
}

// Run tests if called directly
if (require.main === module) {
  try {
    runTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}