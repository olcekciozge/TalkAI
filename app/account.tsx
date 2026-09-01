import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '@/constants/scenarioStyles';
import { SCENARIOS, type Level } from '@/constants/scenarios';
import { TAB_BAR_CLEARANCE } from '@/constants/layout';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, updateProfile, getSessionStats, type Profile, type SessionStats } from '@/lib/profile';

const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2'];

export default function AccountScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<SessionStats | null>(null);
    const [savingLevel, setSavingLevel] = useState(false);
    const [savingFavorite, setSavingFavorite] = useState<string | null>(null);

    // useFocusEffect: her profile ekranina donuste (mesela yeni bir session
    // tamamlayip geri gelince) istatistikler guncel gelsin diye, sadece
    // ilk mount'ta degil.
    useFocusEffect(
        useCallback(() => {
            let active = true;
            setLoading(true);
            Promise.all([getProfile(), getSessionStats()]).then(([p, s]) => {
                if (!active) return;
                setProfile(p);
                setStats(s);
                setLoading(false);
            });
            return () => {
                active = false;
            };
        }, [])
    );

    async function handleSelectLevel(level: Level) {
        if (!profile) return;
        const newLevel = profile.targetLevel === level ? null : level;
        setSavingLevel(true);
        setProfile({ ...profile, targetLevel: newLevel });
        const { error } = await updateProfile({ targetLevel: newLevel });
        setSavingLevel(false);
        if (error) {
            console.error('updateProfile (level) error:', error);
        }
    }

    async function handleToggleFavorite(scenarioId: string) {
        if (!profile) return;
        const isFavorite = profile.favoriteScenarioIds.includes(scenarioId);
        const newFavorites = isFavorite
            ? profile.favoriteScenarioIds.filter((id) => id !== scenarioId)
            : [...profile.favoriteScenarioIds, scenarioId];

        setSavingFavorite(scenarioId);
        setProfile({ ...profile, favoriteScenarioIds: newFavorites });
        const { error } = await updateProfile({ favoriteScenarioIds: newFavorites });
        setSavingFavorite(null);
        if (error) {
            console.error('updateProfile (favorites) error:', error);
        }
    }

    function handleSignOut() {
        Alert.alert('Sign out?', 'You can sign back in anytime with the same account.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await signOut();
                    router.replace('/(tabs)');
                },
            },
        ]);
    }

    if (!user) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: 'Profile' }} />
                <MaterialCommunityIcons name="account-circle-outline" size={40} color={COLORS.inkMuted} />
                <Text style={styles.notSignedInText}>You're not signed in.</Text>
                <Pressable style={styles.signInButton} onPress={() => router.push('/auth')}>
                    <Text style={styles.signInButtonText}>Sign In</Text>
                </Pressable>
            </View>
        );
    }

    if (loading || !profile || !stats) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: 'Profile' }} />
                <ActivityIndicator size="large" color={COLORS.ink} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Profile' }} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.avatarWrap}>
                    <MaterialCommunityIcons name="account-circle" size={64} color={COLORS.accent} />
                </View>
                <Text style={styles.email}>{profile.email}</Text>

                <Text style={styles.sectionLabel}>Your Stats</Text>
                <View style={styles.statsGrid}>
                    <StatCard label="Sessions" value={String(stats.totalSessions)} />
                    <StatCard
                        label="Avg. Score"
                        value={stats.averageScore !== null ? String(stats.averageScore) : '—'}
                    />
                    <StatCard
                        label="Grammar"
                        value={stats.averageGrammar !== null ? `${stats.averageGrammar}/10` : '—'}
                    />
                    <StatCard
                        label="Fluency"
                        value={stats.averageFluency !== null ? `${stats.averageFluency}/10` : '—'}
                    />
                    <StatCard
                        label="Vocabulary"
                        value={stats.averageVocabulary !== null ? `${stats.averageVocabulary}/10` : '—'}
                    />
                </View>

                <Text style={styles.sectionLabel}>Target Level</Text>
                <View style={styles.chipRow}>
                    {LEVELS.map((level) => {
                        const selected = profile.targetLevel === level;
                        return (
                            <Pressable
                                key={level}
                                style={[styles.levelChip, selected && styles.levelChipSelected]}
                                onPress={() => handleSelectLevel(level)}
                                disabled={savingLevel}
                            >
                                <Text style={[styles.levelChipText, selected && styles.levelChipTextSelected]}>
                                    {level}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <Text style={styles.sectionLabel}>Favorite Scenarios</Text>
                <View style={styles.favoritesList}>
                    {SCENARIOS.map((scenario) => {
                        const isFavorite = profile.favoriteScenarioIds.includes(scenario.id);
                        const isSaving = savingFavorite === scenario.id;
                        return (
                            <Pressable
                                key={scenario.id}
                                style={styles.favoriteRow}
                                onPress={() => handleToggleFavorite(scenario.id)}
                                disabled={isSaving}
                            >
                                <Text style={styles.favoriteRowText}>{scenario.title}</Text>
                                {isSaving ? (
                                    <ActivityIndicator size="small" color={COLORS.inkMuted} />
                                ) : (
                                    <MaterialCommunityIcons
                                        name={isFavorite ? 'heart' : 'heart-outline'}
                                        size={20}
                                        color={isFavorite ? COLORS.accent : COLORS.inkMuted}
                                    />
                                )}
                            </Pressable>
                        );
                    })}
                </View>

                <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                    <MaterialCommunityIcons name="logout" size={18} color="#B23B3B" />
                    <Text style={styles.signOutButtonText}>Sign Out</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
        padding: 24,
        gap: 10,
    },
    notSignedInText: { fontSize: 15, color: COLORS.inkMuted },
    signInButton: {
        marginTop: 8,
        backgroundColor: COLORS.ink,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    signInButtonText: { color: '#fff', fontWeight: '700' },
    scroll: { padding: 20, paddingBottom: TAB_BAR_CLEARANCE, alignItems: 'center' },
    avatarWrap: { marginTop: 8, marginBottom: 6 },
    email: { fontSize: 16, fontWeight: '700', color: COLORS.ink, marginBottom: 20 },
    sectionLabel: {
        alignSelf: 'flex-start',
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.inkMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 20,
        marginBottom: 12,
    },
    statsGrid: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statCard: {
        flexBasis: '31%',
        flexGrow: 1,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    statValue: { fontSize: 20, fontWeight: '700', color: COLORS.ink },
    statLabel: { fontSize: 11, color: COLORS.inkMuted, marginTop: 4, textAlign: 'center' },
    chipRow: { flexDirection: 'row', gap: 10, width: '100%' },
    levelChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.card,
    },
    levelChipSelected: {
        backgroundColor: COLORS.ink,
        borderColor: COLORS.ink,
    },
    levelChipText: { fontWeight: '700', color: COLORS.ink },
    levelChipTextSelected: { color: '#fff' },
    favoritesList: { width: '100%', gap: 8 },
    favoriteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    favoriteRowText: { fontSize: 14, color: COLORS.ink, fontWeight: '600' },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 28,
        borderWidth: 1,
        borderColor: '#B23B3B44',
        borderRadius: 12,
        paddingVertical: 13,
        width: '100%',
    },
    signOutButtonText: { color: '#B23B3B', fontWeight: '700', fontSize: 14 },
});