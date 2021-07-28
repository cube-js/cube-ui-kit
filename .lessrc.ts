const VARIABLES = require('./src/less-variables');

const LESS_VARIABLES = {};

// Create LESS variable map.
Object.keys(VARIABLES)
  .forEach((key) => {
    LESS_VARIABLES[`@${key}`] = VARIABLES[key];
  });


module.exports = {
  modifyVars: LESS_VARIABLES,
  javascriptEnabled: true,
};
