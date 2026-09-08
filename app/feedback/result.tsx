import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getScenarioById } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';
import { TAB_BAR_CLEARANCE } from '@/constants/layout';
import { saveSession, type FeedbackData, type TranscriptEntry } from '@/lib/sessionStorage';
import FeedbackView from '@/components/FeedbackView';
import TranscriptModal from '@/components/TranscriptModal';
import { trackEvent, AnalyticsEvent } from '@/lib/analytics';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type ScreenState = 'loading' | 'success' | 'error' | 'empty';

export default function FeedbackScreen() {
    const { id, transcript: transcriptParam } = useLocalSearchParams<{
        id: string;
        transcript?: string;
    }>();
    const router = useRouter();
    const scenario = getScenarioById(id);
    const style = id ? SCENARIO_STYLE[id] : undefined;

    const [screenState, setScreenState] = useState<ScreenState>('loading');
    const [feedback, setFeedback] = useState<FeedbackData | null>(null);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [showTranscript, setShowTranscript] = useState(false);

    useEffect(() => {
        fetchFeedback();
    }, []);

    async function fetchFeedback() {
        let transcriptEntries: TranscriptEntry[] = [];
        try {
            transcriptEntries = transcriptParam ? JSON.parse(transcriptParam) : [];
        } catch {
            transcriptEntries = [];
        }
        setTranscript(transcriptEntries);

        const userTurns = transcriptEntries.filter((entry) => entry.role === 'user');
        if (userTurns.length === 0) {
            setScreenState('empty');
            return;
        }

        setScreenState('loading');

        try {
            const res = await fetch(`${BACKEND_URL}/api/realtime/feedback/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({
                    scenario_id: scenario?.id,
                    scenario_level: scenario?.level,
                    transcript: transcriptEntries,
                }),
            });

            if (!res.ok) throw new Error('Feedback isteği başarısız oldu');

            const data: FeedbackData = await res.json();
            setFeedback(data);
            setScreenState('success');

            const overall = Math.round(((data.grammar.score + data.fluency.score + data.vocabulary.score) / 3) * 10);

            trackEvent(AnalyticsEvent.FEEDBACK_VIEWED, {
                scenario_id: scenario?.id ?? '',
                overall_score: overall,
                grammar_score: data.grammar.score,
                fluency_score: data.fluency.score,
                vocabulary_score: data.vocabulary.score,
            });

            saveSession({
                id: Date.now().toString(),
                scenarioId: scenario?.id ?? '',
                scenarioTitle: scenario?.title ?? 'Unknown',
                date: new Date().toISOString(),
                overallScore: overall,
                feedback: data,
                transcript: transcriptEntries,
            }).catch((err) => console.error('saveSession error:', err));
        } catch (err) {
            console.error('Feedback fetch error:', err);
            setScreenState('error');
        }
    }

    const handleDone = () => {
        router.replace('/(tabs)');
    };

    const overallScore = feedback
        ? Math.round(
            ((feedback.grammar.score + feedback.fluency.score + feedback.vocabulary.score) / 3) * 10
        )
        : 0;

    if (screenState === 'loading') {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: 'Session Feedback', headerBackVisible: false }} />
                <ActivityIndicator size="large" color={style?.color ?? COLORS.ink} />
                <Text style={styles.loadingText}>Analyzing your conversation...</Text>
            </View>
        );
    }

    if (screenState === 'empty') {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: 'Session Feedback', headerBackVisible: false }} />
                <MaterialCommunityIcons name="message-text-outline" size={40} color={COLORS.inkMuted} />
                <Text style={styles.errorTitle}>Not enough conversation</Text>
                <Text style={styles.errorText}>
                    You didn't speak long enough for feedback this time. Try again with a longer conversation!
                </Text>
                <Pressable style={styles.retryButton} onPress={handleDone}>
                    <Text style={styles.retryButtonText}>Back to scenarios</Text>
                </Pressable>
            </View>
        );
    }

    if (screenState === 'error') {
        return (
            <View style={styles.centered}>
                <Stack.Screen options={{ title: 'Session Feedback', headerBackVisible: false }} />
                <MaterialCommunityIcons name="alert-circle" size={40} color="#B23B3B" />
                <Text style={styles.errorTitle}>Couldn't load feedback</Text>
                <Text style={styles.errorText}>Something went wrong while analyzing your session.</Text>
                <Pressable style={styles.retryButton} onPress={fetchFeedback}>
                    <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
            </View>
        );
    }

    if (!feedback) return null;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Session Feedback', headerBackVisible: false }} />

            <ScrollView contentContainerStyle={styles.scroll}>
                <Pressable style={styles.transcriptLink} onPress={() => setShowTranscript(true)}>
                    <MaterialCommunityIcons name="message-text-outline" size={16} color={COLORS.inkMuted} />
                    <Text style={styles.transcriptLinkText}>View full transcript</Text>
                </Pressable>

                <FeedbackView
                    feedback={feedback}
                    overallScore={overallScore}
                    scenarioTitle={scenario?.title}
                    accentColor={style?.color ?? COLORS.premium}
                />
            </ScrollView>

            <TranscriptModal
                visible={showTranscript}
                onClose={() => setShowTranscript(false)}
                entries={transcript}
                aiRoleLabel={scenario?.aiRole}
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
        padding: 24,
        gap: 8,
    },
    loadingText: { marginTop: 12, fontSize: 14, color: COLORS.inkMuted },
    errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.ink, marginTop: 8 },
    errorText: { fontSize: 14, color: COLORS.inkMuted, textAlign: 'center' },
    retryButton: {
        marginTop: 16,
        backgroundColor: COLORS.ink,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: { color: '#fff', fontWeight: '700' },
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