import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SCENARIO_STYLE } from '@/constants/scenarioStyles';
import { getAllSessions, type StoredSession } from '@/lib/sessionStorage';


export default function HistoryScreen() {
    const router = useRouter();
    const [sessions, setSessions] = useState<StoredSession[]>([]);
    const [loaded, setLoaded] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            getAllSessions().then((data) => {
                if (active) {
                    setSessions(data);
                    setLoaded(true);
                }
            });
            return () => {
                active = false;
            };
        }, [])
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>History</Text>
                <Text style={styles.headerSubtitle}>Your practice history</Text>
            </View>

            {loaded && sessions.length === 0 ? (
                <View style={styles.centered}>
                    <MaterialCommunityIcons name="history" size={40} color={COLORS.inkMuted} />
                    <Text style={styles.emptyTitle}>No sessions yet</Text>
                    <Text style={styles.emptySubtitle}>Your past practice sessions will show up here.</Text>
                </View>
            ) : (
                <FlatList
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const scenarioStyle = SCENARIO_STYLE[item.scenarioId];
                        const date = new Date(item.date);
                        const dateLabel = date.toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        });
                        return (
                            <Pressable
                                style={styles.card}
                                onPress={() =>
                                    router.push({ pathname: '/history/[id]', params: { id: item.id } })
                                }
                            >
                                <View
                                    style={[
                                        styles.iconWrap,
                                        { backgroundColor: (scenarioStyle?.color ?? COLORS.premium) + '1A' },
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name={(scenarioStyle?.icon as any) ?? 'chat'}
                                        size={22}
                                        color={scenarioStyle?.color ?? COLORS.premium}
                                    />
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>{item.scenarioTitle}</Text>
                                    <Text style={styles.cardDate}>{dateLabel}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.scoreBadge,
                                        { borderColor: scenarioStyle?.color ?? COLORS.premium },
                                    ]}
                                >
                                    <Text style={styles.scoreBadgeText}>{item.overallScore}</Text>
                                </View>
                            </Pressable>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: COLORS.ink,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.inkMuted,
        marginTop: 4,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 8,
    },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.ink },
    emptySubtitle: { fontSize: 13, color: COLORS.inkMuted, textAlign: 'center' },
    list: { flex: 1 },
    listContent: { padding: 16, gap: 12 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
    cardDate: { fontSize: 12, color: COLORS.inkMuted, marginTop: 2 },
    scoreBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreBadgeText: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
});