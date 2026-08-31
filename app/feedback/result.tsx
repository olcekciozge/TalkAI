import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getScenarioById } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';
import { TAB_BAR_CLEARANCE } from '@/constants/layout';
import { saveSession, type FeedbackData } from '@/lib/sessionStorage';
import FeedbackView from '@/components/FeedbackView';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type TranscriptEntry = {
    role: 'user' | 'ai';
    text: string;
};

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

        // Doküman kuralı: boş transcript'le hiç istek atma
        if (transcriptEntries.length === 0) {
            setScreenState('empty');
            return;
        }

        setScreenState('loading');

        try {
            const res = await fetch(`${BACKEND_URL}/api/realtime/feedback/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scenario_id: scenario?.id,
                    scenario_level: scenario?.level,
                    transcript: transcriptEntries,
                }),
            });

            if (!res.ok) throw new Error('Feedback request failed');

            const data: FeedbackData = await res.json();
            setFeedback(data);
            setScreenState('success');

            const overall = Math.round(((data.grammar.score + data.fluency.score + data.vocabulary.score) / 3) * 10);
            saveSession({
                id: Date.now().toString(),
                scenarioId: scenario?.id ?? '',
                scenarioTitle: scenario?.title ?? 'Unknown',
                date: new Date().toISOString(),
                overallScore: overall,
                feedback: data,
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
                <FeedbackView
                    feedback={feedback}
                    overallScore={overallScore}
                    scenarioTitle={scenario?.title}
                    accentColor={style?.color ?? COLORS.premium}
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
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    doneButton: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});