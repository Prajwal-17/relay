const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const { sep } = require("node:path");

const config = getDefaultConfig(__dirname);

// UniWind must be the outermost Metro wrapper.
const uniwindConfig = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  // Keep this at the project root so the React Native Reusables CLI detects UniWind.
  dtsFile: "./uniwind-types.d.ts"
});

const resolveUniwindRequest = uniwindConfig.resolver.resolveRequest;
const reactNativeEntry = require.resolve("react-native");

// pnpm can retain multiple peer-dependency copies of UniWind. Its native adapters
// must import React Native itself, even when they belong to a different copy.
uniwindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform !== "web" &&
    moduleName === "react-native" &&
    context.originModulePath.includes(`${sep}node_modules${sep}uniwind${sep}`)
  ) {
    return context.resolveRequest(context, reactNativeEntry, platform);
  }
  return resolveUniwindRequest(context, moduleName, platform);
};

module.exports = uniwindConfig;
