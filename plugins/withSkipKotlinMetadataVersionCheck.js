const { withAppBuildGradle } = require('@expo/config-plugins');

// OneSignal'in native Android JAR'lari, projenin kullandigi Kotlin Gradle
// Plugin'inden daha yeni bir Kotlin surumuyle (metadata versiyonu) derlenmis
// oluyor. Projenin genel Kotlin surumunu zorla yukseltmek Kotlin Gradle
// Plugin'in kendisini kiriyor (KotlinTopLevelExtension hatasi), o yuzden
// bunun yerine derleyiciye "bu metadata farkini gormezden gel" diyoruz.
// Bu, Gradle'in orijinal hata mesajinda da onerilen resmi bir cozum.
module.exports = function withSkipKotlinMetadataVersionCheck(config) {
    return withAppBuildGradle(config, (config) => {
        const marker = '-Xskip-metadata-version-check';
        if (config.modResults.contents.includes(marker)) {
            return config;
        }
        config.modResults.contents += `

// Added by withSkipKotlinMetadataVersionCheck plugin
tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
        freeCompilerArgs += ["-Xskip-metadata-version-check"]
    }
}
`;
        return config;
    });
};