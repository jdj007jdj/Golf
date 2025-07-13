/**
 * Test runner for course performance utilities
 * This file can be run to validate the course performance calculations
 */

// Import the test runner
const { runManualTests } = require('./src/utils/__tests__/coursePerformanceUtils.test.js');

// Run the tests
console.log('Starting Course Performance Utils Test...\n');
const success = runManualTests();

if (success) {
  console.log('\n✅ All course performance calculations are working correctly!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please check the implementation.');
  process.exit(1);
}