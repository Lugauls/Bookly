const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  testPathIgnorePatterns: [],
  testRegex: '.*\\.integration-spec\\.ts$',
  testTimeout: 15000,
};
