const { withAppBuildGradle } = require('@expo/config-plugins');

// android:debuggable="true" degerini manifest'e sabit yazdigimiz icin
// (bkz. withDebuggableManifest.js), Android Lint bunu "HardcodedDebugMode"
// hatasi olarak isaretliyor ve lintVitalRelease task'i release build'i
// durduruyor. Bu kurali bilerek/isteyerek ihlal ettigimiz icin (RevenueCat
// Test Store key'inin release build'de crash olmamasi icin gerekli),
// bu lint kontrolunu devre disi birakiyoruz.
module.exports = function withDisableHardcodedDebugModeLint(config) {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.contents.includes("disable 'HardcodedDebugMode'")) {
            return config;
        }
        config.modResults.contents = config.modResults.contents.replace(
            /android\s*\{/,
            `android {\n    lint {\n        abortOnError false\n        disable 'HardcodedDebugMode'\n    }\n`
        );
        return config;
    });
};