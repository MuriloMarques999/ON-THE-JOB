module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup/env-unit.js'],
  collectCoverageFrom: [
    'src/config/**/*.js',
    'src/services/**/*.js',
    '!src/config/db.js',
  ],
  coverageDirectory: '<rootDir>/coverage',
};
