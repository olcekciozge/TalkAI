import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Linking, Platform, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '@/constants/scenarioStyles';
import { isPremiumUser, purchasePremium, restorePurchases } from '@/lib/purchases';

type Props = {
    title?: string;
    subtitle?: string;
    onUnlocked?: () => void;
    onDismiss?: () => void;
    dismissLabel?: string;
};

// Gercek abonelik iptali sadece magaza hesap ayarlarindan yapilabiliyor,
// Bu yuzden kullaniciyi ilgili magaza sayfasina yonlendiriyoruz.
const SUBSCRIPTION_MANAGEMENT_URL = Platform.select({
    ios: 'https://apps.apple.com/account/subscriptions',
    android: 'https://play.google.com/store/account/subscriptions',
    default: 'https://play.google.com/store/account/subscriptions',
}) as string;

export default function PremiumPaywall({
                                           title = 'Unlock Everything',
                                           subtitle = 'Get unlimited access to every scenario, including Airport Check-in and Job Interview practice.',
                                           onUnlocked,
                                           onDismiss,
                                           dismissLabel = 'Maybe later',
                                       }: Props) {
    const [checking, setChecking] = useState(true);
    const [isPremium, setIsPremium] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [restoring, setRestoring] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            setChecking(true);
            isPremiumUser().then((premium) => {
                if (active) {
                    setIsPremium(premium);
                    setChecking(false);
                }
            });
            return () => {
                active = false;
            };
        }, [])
    );

    async function handleUnlock() {
        setPurchasing(true);
        const success = await purchasePremium();
        setPurchasing(false);
        if (success) {
            setIsPremium(true);
            onUnlocked?.();
        }
    }

    function handleManageSubscription() {
        Linking.openURL(SUBSCRIPTION_MANAGEMENT_URL);
    }

    async function handleRestore() {
        setRestoring(true);
        const restored = await restorePurchases();
        setRestoring(false);
        if (restored) {
            setIsPremium(true);
            onUnlocked?.();
        } else {
            Alert.alert(
                'Nothing to restore',
                "We couldn't find an active purchase linked to this account."
            );
        }
    }

    if (checking) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    if (isPremium) {
        return (
            <View style={styles.centered}>
                <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name="check-decagram" size={40} color={COLORS.premium} />
                </View>
                <Text style={styles.title}>You're Premium!</Text>
                <Text style={styles.subtitle}>
                    You have full access to every scenario. Thanks for supporting TalkAI.
                </Text>

                <Pressable style={styles.manageButton} onPress={handleManageSubscription}>
                    <Text style={styles.manageButtonText}>Manage Subscription</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.centered}>
            <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="star-four-points" size={40} color={COLORS.accent} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <Pressable style={styles.button} onPress={handleUnlock} disabled={purchasing}>
                {purchasing ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Get Premium</Text>
                )}
            </Pressable>

            <Pressable style={styles.dismissButton} onPress={handleRestore} disabled={purchasing || restoring}>
                {restoring ? (
                    <ActivityIndicator color={COLORS.inkMuted} size="small" />
                ) : (
                    <Text style={styles.dismissText}>Restore Purchases</Text>
                )}
            </Pressable>

            {onDismiss && (
                <Pressable style={styles.dismissButton} onPress={onDismiss} disabled={purchasing}>
                    <Text style={styles.dismissText}>{dismissLabel}</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
        padding: 24,
        gap: 10,
    },
    iconWrap: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgb(255 255 255)',
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
        backgroundColor: COLORS.accent,
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
    dismissButton: {
        marginTop: 10,
        padding: 8,
    },
    dismissText: {
        color: COLORS.inkMuted,
        fontSize: 14,
    },
    manageButton: {
        marginTop: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
    },
    manageButtonText: {
        color: COLORS.ink,
        fontSize: 14,
        fontWeight: '700',
    },
});