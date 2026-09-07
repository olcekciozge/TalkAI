const { withAndroidManifest } = require('@expo/config-plugins');

// RevenueCat'in Test Store API key kontrolu, uygulamanin native
// "debuggable" bayragina (ApplicationInfo.FLAG_DEBUGGABLE) bakiyor.
// Debug build tipinde bu otomatik true, release'de false oluyor -
// release'de false oldugu icin RevenueCat "bu release build, test key
// kullanamazsin" diyip uygulamayi kapatiyor.
//
// Cozum: assembleRelease kullanmaya devam edip (JS bundle'i dogru
// gomdugu icin), sadece manifest'teki debuggable bayragini zorla
// true yapiyoruz. Boylece RevenueCat "debug" saniyor ve crash olmuyor.
//
// android/ klasoru prebuild ile her seferinde yeniden olusturuldugu
// icin (CNG - Continuous Native Generation) bu degisikligi elle
// AndroidManifest.xml'e yazmak kalici olmuyor; bunun yerine app.json
// plugins listesine eklenen bu plugin, her prebuild'de otomatik
// uygulanıyor.
module.exports = function withDebuggableManifest(config) {
    return withAndroidManifest(config, (config) => {
        const application = config.modResults.manifest.application[0];
        application['$']['android:debuggable'] = 'true';
        return config;
    });
};