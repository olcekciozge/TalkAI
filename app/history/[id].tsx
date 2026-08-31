import { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { COLORS, SCENARIO_STYLE } from '@/constants/scenarioStyles';
import { TAB_BAR_CLEARANCE } from '@/constants/layout';
import { getSessionById, type StoredSession } from '@/lib/sessionStorage';
import FeedbackView from '@/components/FeedbackView';

export default function HistoryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [session, setSession] = useState<StoredSession | null | undefined>(undefined);

    useEffect(() => {
        getSessionById(id).then((result) => setSession(result ?? null));
    }, [id]);

    if (session === undefined) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: 'Session Detail' }} />
                <ActivityIndicator size="large" color={COLORS.ink} />
            </View>
        );
    }

    if (!session) {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: 'Session Detail' }} />
                <Text style={styles.notFound}>Session not found.</Text>
            </View>
        );
    }

    const scenarioStyle = SCENARIO_STYLE[session.scenarioId];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: session.scenarioTitle }} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <FeedbackView
                    feedback={session.feedback}
                    overallScore={session.overallScore}
                    scenarioTitle={session.scenarioTitle}
                    accentColor={scenarioStyle?.color ?? COLORS.premium}
                />
            </ScrollView>
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
    },
    notFound: { fontSize: 16, color: COLORS.inkMuted },
    scroll: { padding: 20, paddingBottom: TAB_BAR_CLEARANCE, alignItems: 'center' },
});