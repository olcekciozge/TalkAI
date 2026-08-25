import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '@/constants/scenarioStyles';
import { purchasePremium } from '@/lib/purchases';

// GUN 12 (yedek plan): Superwall'in deprecated SDK'si native crash veriyordu
// (bakim edilmeyen paket, ic senkronizasyon hatasi). Onun yerine RevenueCat'in
// zaten calisan (Gun 11) purchasePremium() fonksiyonunu kullanan kendi basit
// paywall ekranimizi yaziyoruz. Superwall'in "kod degistirmeden tasarim
// guncelleme" ozelligini kaybediyoruz ama cokme riski olmayan, kontrolumuzde
// bir cozume sahip oluyoruz.
export default function PaywallScreen() {
    const { returnScenarioId } = useLocalSearchParams<{ returnScenarioId?: string }>();
    const router = useRouter();
    const [purchasing, setPurchasing] = useState(false);

    async function handleUnlock() {
        setPurchasing(true);
        const success = await purchasePremium();
        setPurchasing(false);

        if (success) {
            if (returnScenarioId) {
                // Satin alma basarili, kullaniciyi direkt gitmek istedigi senaryoya gonder
                router.replace({ pathname: '/scenario/live', params: { id: returnScenarioId } });
            } else {
                router.back();
            }
        }
        // Basarisiz ya da iptal edilirse hicbir sey yapmiyoruz,
        // kullanici bu ekranda kalip tekrar deneyebilir.
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Premium', presentation: 'modal' }} />
            <View style={styles.content}>
                <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name="lock-open-variant" size={40} color={COLORS.premium} />
                </View>

                <Text style={styles.title}>Unlock Premium Scenarios</Text>
                <Text style={styles.subtitle}>
                    Get access to advanced practice scenarios like Professor, Football, and Job Interview.
                </Text>

                <Pressable style={styles.button} onPress={handleUnlock} disabled={purchasing}>
                    {purchasing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Unlock Premium</Text>
                    )}
                </Pressable>

                <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={purchasing}>
                    <Text style={styles.cancelText}>Maybe later</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 10,
    },
    iconWrap: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#C9A2271A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.ink,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.inkMuted,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 12,
    },
    button: {
        marginTop: 20,
        backgroundColor: COLORS.premium,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
        minWidth: 220,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButton: {
        marginTop: 10,
        padding: 8,
    },
    cancelText: {
        color: COLORS.inkMuted,
        fontSize: 14,
    },
});