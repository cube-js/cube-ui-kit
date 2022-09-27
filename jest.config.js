/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  coverageDirectory: './coverage/',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2021',
          loose: true,
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'automatic' } },
        },
      },
    ],
  },
  setupFilesAfterEnv: ['./src/test/setup.ts'],
};

module.exports = config;
