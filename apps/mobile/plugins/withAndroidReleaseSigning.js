const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("Android release signing expects a Groovy app/build.gradle file.");
    }

    let gradle = config.modResults.contents;
    const signingConfigs = "    signingConfigs {\n";
    const releaseSigning = `        release {
            if (project.hasProperty('RELAY_UPLOAD_STORE_FILE')) {
                storeFile file(project.property('RELAY_UPLOAD_STORE_FILE'))
                storePassword project.property('RELAY_UPLOAD_STORE_PASSWORD')
                keyAlias project.property('RELAY_UPLOAD_KEY_ALIAS')
                keyPassword project.property('RELAY_UPLOAD_KEY_PASSWORD')
            }
        }
`;
    const defaultReleaseSigning = "            signingConfig signingConfigs.debug\n";
    const buildTypes = gradle.indexOf("    buildTypes {\n");
    const releaseBuild = gradle.indexOf("        release {\n", buildTypes);

    if (
      gradle.indexOf(signingConfigs) === -1 ||
      buildTypes === -1 ||
      releaseBuild === -1 ||
      gradle.indexOf(defaultReleaseSigning, releaseBuild) === -1
    ) {
      throw new Error("Expo's Android Gradle template changed; review release signing.");
    }

    gradle = gradle.replace(signingConfigs, signingConfigs + releaseSigning);
    const releaseBuildAfterSigning = gradle.indexOf(
      "        release {\n",
      gradle.indexOf("    buildTypes {\n")
    );
    const releaseSigningPosition = gradle.indexOf(defaultReleaseSigning, releaseBuildAfterSigning);
    gradle =
      gradle.slice(0, releaseSigningPosition) +
      "            signingConfig signingConfigs.release\n" +
      gradle.slice(releaseSigningPosition + defaultReleaseSigning.length);

    config.modResults.contents = gradle;
    return config;
  });
};
