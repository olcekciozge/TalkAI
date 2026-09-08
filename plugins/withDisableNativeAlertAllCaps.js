const { withAndroidStyles } = require('@expo/config-plugins');

// React Native'in Alert.alert() ile actigi native Android dialog'lari
// (ornegin "Sign out?" onay penceresi), cihazin sistem diline gore
// butonlari otomatik BUYUK HARFE ceviriyor (Android'in kendi AlertDialog
// temasindaki textAllCaps ozelligi). Cihaz dili Turkce oldugunda, kucuk
// "i" harfi noktali buyuk "İ"ye donusuyor (ornek: "Sign Out" -> "SİGN OUT"),
// bu da Ingilizce arayuzde tutarsiz gorunuyor.
//
// Bu, uygulamanin kendi Text bilesenlerinden degil, Android'in native
// dialog temasindan kaynaklaniyor - o yuzden kod tarafinda (textTransform
// vb.) duzeltilemez. Cozum: uygulamanin ana temasina
// android:textAllCaps=false ekleyip bu otomatik buyutmeyi kapatmak.
module.exports = function withDisableNativeAlertAllCaps(config) {
    return withAndroidStyles(config, (config) => {
        const styles = config.modResults;
        const appTheme = styles.resources.style?.find((s) => s.$.name === 'AppTheme');

        if (appTheme) {
            if (!appTheme.item) {
                appTheme.item = [];
            }
            const alreadyHasIt = appTheme.item.some(
                (item) => item.$.name === 'android:textAllCaps'
            );
            if (!alreadyHasIt) {
                appTheme.item.push({
                    $: { name: 'android:textAllCaps' },
                    _: 'false',
                });
            }
        }

        return config;
    });
};