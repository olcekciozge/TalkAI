import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '@/constants/scenarioStyles';
import { isPremiumUser, purchasePremium } from '@/lib/purchases';

export default function GetPremiumScreen() {
    const [checking, setChecking] = useState(true);
    const [isPremium, setIsPremium] = useState(false);
    const [purchasing, setPurchasing] = useState(false);

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

    async function handlePurchase() {
        setPurchasing(true);
        const success = await purchasePremium();
        setPurchasing(false);
        if (success) {
            setIsPremium(true);
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
            </View>
        );
    }

    return (
        <View style={styles.centered}>
            <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="star-four-points" size={40} color={COLORS.accent} />
            </View>
            <Text style={styles.title}>Unlock Everything</Text>
            <Text style={styles.subtitle}>
                Get unlimited access to every scenario, including Airport Check-in and Job
                Interview practice.
            </Text>

            <Pressable style={styles.button} onPress={handlePurchase} disabled={purchasing}>
                {purchasing ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Get Premium</Text>
                )}
            </Pressable>
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
});