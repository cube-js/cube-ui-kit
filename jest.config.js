process.env.SC_DISABLE_SPEEDY = 'false';

/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  coverageDirectory: './coverage/',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          target: 'es2021',
          transform: { react: { runtime: 'automatic' } },
        },
      },
    ],
  },
  setupFilesAfterEnv: ['./src/test/setup.ts'],
};

module.exports = config;
