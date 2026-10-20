const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  testRegex: '.*\\.integration-spec\\.ts$',
  testTimeout: 15000,
};
