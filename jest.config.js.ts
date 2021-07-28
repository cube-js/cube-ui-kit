/**
 * @file Jest configuration.
 */

module.exports = {
  // rootDir: 'src/test',
  // testEnvironment: 'jest-environment-jsdom',
  testRegex: '/src/.*test\\.js$',
  transform: {"\\.[jt]{0,1}sx?$": "babel-jest"},
  transformIgnorePatterns: [
    'node_modules/(?!(numl-utils))',
  ],
};
