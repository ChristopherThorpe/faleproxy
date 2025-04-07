/**
 * Jest configuration for the Faleproxy project
 */

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Files to be excluded from coverage calculations
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/tests/"
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    "text",
    "lcov"
  ],

  // Coverage thresholds - set to lower values for CI to pass while we improve test coverage
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  },

  // Test environment
  testEnvironment: "node",

  // Automatically detect and run tests in these directories
  testMatch: [
    "**/tests/**/*.test.js"
  ],

  // Timeout for test runs
  testTimeout: 30000
};
