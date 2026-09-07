import { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getScenarioById } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';
import { FOOTER_BOTTOM_OFFSET } from '@/constants/layout';
import { isPremiumUser } from '@/lib/purchases';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { trackEvent, AnalyticsEvent } from '@/lib/analytics';

export default function ScenarioDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const scenario = getScenarioById(id);
    const style = SCENARIO_STYLE[id];
    const { user } = useAuth();
    const { favoriteIds, toggleFavorite } = useFavorites();

    useEffect(() => {
        if (scenario) {
            trackEvent(AnalyticsEvent.SCENARIO_VIEWED, {
                scenario_id: scenario.id,
                scenario_title: scenario.title,
                is_premium: scenario.isPremium,
            });
        }
    }, [scenario?.id]);

    if (!scenario) {
        return (
            <View style={styles.centered}>
                <Text style={styles.notFound}>Scenario not found.</Text>
            </View>
        );
    }

    const isFavorite = favoriteIds.includes(scenario.id);

    function handleToggleFavorite() {
        if (!user) return;
        trackEvent(AnalyticsEvent.FAVORITE_TOGGLED, {
            scenario_id: scenario!.id,
            favorited: !isFavorite,
        });
        toggleFavorite(scenario!.id);
    }

    const goToLive = () => {
        router.push({ pathname: '/scenario/live', params: { id: scenario.id } });
    };

    const handleStart = async () => {
        if (!user) {
            router.push({
                pathname: '/auth',
                params: { returnTo: `/scenario/${scenario.id}` },
            });
            return;
        }
        if (!scenario.isPremium) {
            goToLive();
            return;
        }
        const premium = await isPremiumUser();
        if (premium) {
            goToLive();
        } else {
            trackEvent(AnalyticsEvent.PAYWALL_VIEWED, {
                trigger: 'scenario_locked',
                scenario_id: scenario.id,
            });
            router.push({ pathname: '/paywall', params: { returnScenarioId: scenario.id } });
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: scenario.title }} />

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.iconRow}>
                    <View style={[styles.iconWrap, { backgroundColor: style.color + '1A' }]}>
                        <MaterialCommunityIcons name={style.icon as any} size={40} color={style.color} />
                    </View>
                    <Pressable style={styles.favoriteButton} onPress={handleToggleFavorite} hitSlop={8}>
                        <MaterialCommunityIcons
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={22}
                            color={isFavorite ? COLORS.accent : COLORS.inkMuted}
                        />
                    </Pressable>
                </View>

                <Text style={styles.title}>{scenario.title}</Text>
                <Text style={styles.role}>with {scenario.aiRole}</Text>

                <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>{scenario.levelLabel}</Text>
                    </View>
                    <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>{scenario.estimatedMinutes} min</Text>
                    </View>
                    {scenario.isPremium && (
                        <View style={[styles.metaChip, styles.premiumChip]}>
                            <MaterialCommunityIcons name="lock" size={12} color={COLORS.premium} />
                            <Text style={[styles.metaChipText, { color: COLORS.premium }]}>Premium</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.summary}>{scenario.summary}</Text>

                {/* "What you'll practice" yerine dogrudan buyuk harfle
                    yaziyoruz - textTransform:'uppercase' Turkce locale'de
                    kucuk "i"yi "İ" yapan bilinen bir React Native hatasina
                    yol aciyordu (bkz. FeedbackView.tsx'teki ayni duzeltme). */}
                <Text style={styles.sectionLabel}>WHAT YOU'LL PRACTICE</Text>
                <View style={styles.taskList}>
                    {scenario.tasks.map((task, i) => (
                        <View key={i} style={styles.taskRow}>
                            <View style={[styles.taskDot, { backgroundColor: style.color }]} />
                            <Text style={styles.taskText}>{task}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Pressable style={[styles.startButton, { backgroundColor: style.color }]} onPress={handleStart}>
                    <MaterialCommunityIcons name={user ? 'microphone' : 'login'} size={20} color="#fff" />
                    <Text style={styles.startButtonText}>
                        {user ? 'Start speaking' : 'Sign in to start speaking'}
                    </Text>
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
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    notFound: {
        fontSize: 16,
        color: COLORS.inkMuted,
    },
    scroll: {
        padding: 20,
        paddingBottom: 100,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    favoriteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: COLORS.ink,
    },
    role: {
        fontSize: 15,
        color: COLORS.inkMuted,
        marginTop: 4,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 14,
    },
    metaChip: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    premiumChip: {
        backgroundColor: '#C9A2271A',
        borderColor: 'transparent',
    },
    metaChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.inkMuted,
    },
    summary: {
        fontSize: 15,
        color: COLORS.ink,
        lineHeight: 22,
        marginTop: 20,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.inkMuted,
        letterSpacing: 0.5,
        marginTop: 28,
        marginBottom: 12,
    },
    taskList: {
        gap: 10,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    taskDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    taskText: {
        fontSize: 14,
        color: COLORS.ink,
    },
    footer: {
        position: 'absolute',
        bottom: FOOTER_BOTTOM_OFFSET,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});