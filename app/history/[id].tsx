import { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Text, Pressable } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SCENARIO_STYLE } from '@/constants/scenarioStyles';
import { TAB_BAR_CLEARANCE } from '@/constants/layout';
import { getSessionById, type StoredSession } from '@/lib/sessionStorage';
import FeedbackView from '@/components/FeedbackView';
import TranscriptModal from '@/components/TranscriptModal';

export default function HistoryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
    const [showTranscript, setShowTranscript] = useState(false);

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
    // Eski (bu ozellikten once kaydedilmis) session'larda transcript
    // olmayabilir - o durumda modal bos state'i kendi icinde gosteriyor.
    const transcript = session.transcript ?? [];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: session.scenarioTitle }} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <Pressable style={styles.transcriptLink} onPress={() => setShowTranscript(true)}>
                    <MaterialCommunityIcons name="message-text-outline" size={16} color={COLORS.inkMuted} />
                    <Text style={styles.transcriptLinkText}>View full transcript</Text>
                </Pressable>

                <FeedbackView
                    feedback={session.feedback}
                    overallScore={session.overallScore}
                    scenarioTitle={session.scenarioTitle}
                    accentColor={scenarioStyle?.color ?? COLORS.premium}
                />
            </ScrollView>

            <TranscriptModal
                visible={showTranscript}
                onClose={() => setShowTranscript(false)}
                entries={transcript}
            />
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
    transcriptLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-end',
        marginBottom: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    transcriptLinkText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.inkMuted,
    },
});