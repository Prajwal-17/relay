const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// UniWind must be the outermost Metro wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  // Keep this at the project root so the React Native Reusables CLI detects UniWind.
  dtsFile: "./uniwind-types.d.ts"
});
