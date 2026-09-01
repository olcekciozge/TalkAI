import { useCallback, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Pressable,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';
import { SCENARIOS } from '@/constants/scenarios';
import { TAB_BAR_CLEARANCE } from '@/constants/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { getProfile, updateProfile, getSessionStats, type Profile, type SessionStats } from '@/lib/profile';

export default function AccountScreen() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const { favoriteIds, toggleFavorite } = useFavorites();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<SessionStats | null>(null);

    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState('');
    const [savingName, setSavingName] = useState(false);

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

    function startEditingName() {
        setNameDraft(profile?.displayName ?? '');
        setEditingName(true);
    }

    async function saveName() {
        if (!profile) return;
        const trimmed = nameDraft.trim();
        setSavingName(true);
        setProfile({ ...profile, displayName: trimmed || null });
        const { error } = await updateProfile({ displayName: trimmed || null });
        setSavingName(false);
        setEditingName(false);
        if (error) console.error('updateProfile (name) error:', error);
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

    const favoriteScenarios = SCENARIOS.filter((s) => favoriteIds.includes(s.id));

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Profile' }} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatarWrap}>
                            <MaterialCommunityIcons name="account-circle" size={64} color={COLORS.accent} />
                        </View>

                        {editingName ? (
                            <View style={styles.nameEditRow}>
                                <TextInput
                                    style={styles.nameInput}
                                    value={nameDraft}
                                    onChangeText={setNameDraft}
                                    placeholder="Your name"
                                    placeholderTextColor={COLORS.inkMuted}
                                    autoFocus
                                    onSubmitEditing={saveName}
                                    returnKeyType="done"
                                />
                                <Pressable onPress={saveName} disabled={savingName} hitSlop={10}>
                                    {savingName ? (
                                        <ActivityIndicator size="small" color={COLORS.ink} />
                                    ) : (
                                        <MaterialCommunityIcons name="check" size={22} color={COLORS.accent} />
                                    )}
                                </Pressable>
                            </View>
                        ) : (
                            <Pressable style={styles.nameRow} onPress={startEditingName}>
                                <Text style={styles.name}>{profile.displayName || 'Add your name'}</Text>
                                <MaterialCommunityIcons
                                    name="pencil-outline"
                                    size={14}
                                    color={COLORS.inkMuted}
                                    style={styles.namePencil}
                                />
                            </Pressable>
                        )}
                        <Text style={styles.email}>{profile.email}</Text>
                    </View>

                    <View style={styles.avgScoreWrap}>
                        <View style={styles.avgScoreCircle}>
                            <Text style={styles.avgScoreNumber}>
                                {stats.averageScore !== null ? stats.averageScore : '—'}
                            </Text>
                        </View>
                        <Text style={styles.avgScoreLabel}>Average Score</Text>
                    </View>
                </View>

                <Text style={styles.sectionLabel}>YOUR STATS</Text>
                <View style={styles.statsGrid}>
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

                <Text style={styles.sectionLabel}>FAVORITE LIST</Text>
                {favoriteScenarios.length === 0 ? (
                    <Text style={styles.emptyFavoritesText}>
                        No favorites yet — tap the heart on a scenario to add one.
                    </Text>
                ) : (
                    <View style={styles.favoritesList}>
                        {favoriteScenarios.map((scenario) => {
                            const style = SCENARIO_STYLE[scenario.id];
                            return (
                                <Pressable
                                    key={scenario.id}
                                    style={styles.favoriteRow}
                                    onPress={() =>
                                        router.push({ pathname: '/scenario/[id]', params: { id: scenario.id } })
                                    }
                                >
                                    <View style={styles.favoriteRowLeft}>
                                        <View
                                            style={[
                                                styles.favoriteIconWrap,
                                                { backgroundColor: style.color + '1A' },
                                            ]}
                                        >
                                            <MaterialCommunityIcons
                                                name={style.icon as any}
                                                size={18}
                                                color={style.color}
                                            />
                                        </View>
                                        <Text style={styles.favoriteRowText}>{scenario.title}</Text>
                                    </View>
                                    <Pressable onPress={() => toggleFavorite(scenario.id)} hitSlop={10}>
                                        <MaterialCommunityIcons name="heart" size={20} color={COLORS.accent} />
                                    </Pressable>
                                </Pressable>
                            );
                        })}
                    </View>
                )}

                <Pressable
                    style={styles.linkRow}
                    onPress={() => router.push('/(tabs)/profile')}
                >
                    <View style={styles.linkRowLeft}>
                        <MaterialCommunityIcons name="history" size={20} color={COLORS.ink} />
                        <Text style={styles.linkRowText}>History</Text>
                    </View>
                    <View style={styles.linkRowRight}>
                        <Text style={styles.linkRowCount}>
                            {stats.totalSessions} {stats.totalSessions === 1 ? 'session' : 'sessions'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.inkMuted} />
                    </View>
                </Pressable>

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
    scroll: { padding: 20, paddingBottom: TAB_BAR_CLEARANCE },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
        width: '100%',
        marginTop: 8,
    },
    headerLeft: {
        alignItems: 'center',
    },
    avatarWrap: { marginBottom: 6 },
    nameRow: {
        position: 'relative',
        alignItems: 'center',
    },
    namePencil: {
        position: 'absolute',
        right: -18,
        top: 3,
    },
    name: { fontSize: 18, fontWeight: '700', color: COLORS.ink },
    nameEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        maxWidth: 260,
    },
    nameInput: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.ink,
        paddingVertical: 4,
        textAlign: 'center',
    },
    email: { fontSize: 12, color: COLORS.inkMuted, marginTop: 4, marginBottom: 20 },
    sectionLabel: {
        alignSelf: 'flex-start',
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.inkMuted,
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
    avgScoreWrap: { alignItems: 'center', marginBottom: 20 },
    avgScoreCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        borderColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avgScoreNumber: { fontSize: 28, fontWeight: '700', color: COLORS.ink },
    avgScoreLabel: { marginTop: 10, fontSize: 13, color: COLORS.inkMuted, fontWeight: '600' },
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
    emptyFavoritesText: {
        fontSize: 13,
        color: COLORS.inkMuted,
        alignSelf: 'flex-start',
        lineHeight: 18,
    },
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
    favoriteRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    favoriteIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 14,
        marginTop: 28,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    linkRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    linkRowText: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
    linkRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    linkRowCount: { fontSize: 13, color: COLORS.inkMuted, fontWeight: '600' },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 18,
        paddingBottom: 6,
        width: '100%',
    },
    signOutButtonText: { color: '#B23B3B', fontWeight: '700', fontSize: 14 },
});