const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");

const config = getDefaultConfig(__dirname);

// Expo SQLite's web worker needs its Wasm binary and cross-origin isolation.
config.resolver.assetExts.push("wasm");
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  return middleware(request, response, next);
};

// UniWind must be the outermost Metro wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./src/uniwind-types.d.ts"
});
