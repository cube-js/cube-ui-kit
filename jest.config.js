// @TODO: move to .swcrc when main build moved to swc
const config = {
  sourceMaps: true,

  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
    },

    target: 'es2021',

    transform: {
      react: {
        runtime: 'automatic',
      },
    },
  },
};

module.exports = {
  verbose: true,
  coverageDirectory: './coverage/',
  testEnvironment: '@happy-dom/jest-environment',
  transform: { '^.+\\.(t|j)sx?$': ['@swc/jest', config] },
  setupFilesAfterEnv: ['./src/test/setup.ts'],
};
