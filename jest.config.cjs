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
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm/)?react-hotkeys-hook)',
  ],
  // Enable React act environment as early as possible
  setupFiles: ['./src/test/setup-act-env.ts'],
  setupFilesAfterEnv: ['./src/test/setup.ts'],
};

module.exports = config;
