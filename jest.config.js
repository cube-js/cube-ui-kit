// const fs = require('fs')

// const config = JSON.parse(fs.readFileSync(`${__dirname}/.swcrc`, 'utf-8'))

// @TODO: move to .swcrc when main build moved to swc
const config = {
  sourceMaps: true,

  jsc: {
    parser: {
      syntax: 'typescript',
      tsx: true,
    },

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
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      { ...config /* custom configuration in jest */ },
    ],
  },
};
