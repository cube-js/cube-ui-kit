const webpack = require("webpack");

module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  webpackFinal: async (config) => {
    config.plugins.push(
      // Removing Speedy so the static storybook styling doesn't break
      new webpack.DefinePlugin({
        SC_DISABLE_SPEEDY: true
      })
    );

    return config;
  },
}
