import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getScenarioById } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type TranscriptEntry = {
    role: 'user' | 'ai';
    text: string;
};

type FeedbackData = {
    grammar: { score: number; comment: string };
    fluency: { score: number; comment: string };
    vocabulary: { score: number; comment: string };
    corrections: { original: string; corrected: string; explanation: string }[];
    better_expressions: { original: string; suggestion: string }[];
    summary: string;
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

            if (!res.ok) throw new Error('Feedback isteği başarısız oldu');

            const data: FeedbackData = await res.json();
            setFeedback(data);
            setScreenState('success');
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
                <View style={styles.scoreWrap}>
                    <View
                        style={[
                            styles.scoreCircle,
                            { borderColor: style?.color ?? COLORS.premium },
                        ]}
                    >
                        <Text style={styles.scoreNumber}>{overallScore}</Text>
                    </View>
                    {scenario && <Text style={styles.scenarioLabel}>{scenario.title}</Text>}
                </View>

                <Text style={styles.summary}>{feedback.summary}</Text>

                <Text style={styles.sectionLabel}>Scores</Text>
                <View style={styles.list}>
                    <ScoreRow label="Grammar" score={feedback.grammar.score} comment={feedback.grammar.comment} />
                    <ScoreRow label="Fluency" score={feedback.fluency.score} comment={feedback.fluency.comment} />
                    <ScoreRow
                        label="Vocabulary"
                        score={feedback.vocabulary.score}
                        comment={feedback.vocabulary.comment}
                    />
                </View>

                {feedback.corrections.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>Corrections</Text>
                        <View style={styles.improvementList}>
                            {feedback.corrections.map((item, i) => (
                                <View key={i} style={styles.improvementCard}>
                                    <Text style={styles.originalText}>"{item.original}"</Text>
                                    <MaterialCommunityIcons
                                        name="arrow-down"
                                        size={16}
                                        color={COLORS.inkMuted}
                                        style={{ marginVertical: 4 }}
                                    />
                                    <Text style={styles.suggestionText}>"{item.corrected}"</Text>
                                    <Text style={styles.explanationText}>{item.explanation}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {feedback.better_expressions.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>Try saying it this way</Text>
                        <View style={styles.improvementList}>
                            {feedback.better_expressions.map((item, i) => (
                                <View key={i} style={styles.improvementCard}>
                                    <Text style={styles.originalText}>"{item.original}"</Text>
                                    <MaterialCommunityIcons
                                        name="arrow-down"
                                        size={16}
                                        color={COLORS.inkMuted}
                                        style={{ marginVertical: 4 }}
                                    />
                                    <Text style={styles.suggestionText}>"{item.suggestion}"</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Pressable
                    style={[styles.doneButton, { backgroundColor: style?.color ?? COLORS.ink }]}
                    onPress={handleDone}
                >
                    <Text style={styles.doneButtonText}>Back to scenarios</Text>
                </Pressable>
            </View>
        </View>
    );
}

function ScoreRow({ label, score, comment }: { label: string; score: number; comment: string }) {
    return (
        <View style={styles.scoreRow}>
            <View style={styles.scoreRowHeader}>
                <Text style={styles.scoreRowLabel}>{label}</Text>
                <Text style={styles.scoreRowValue}>{score}/10</Text>
            </View>
            <Text style={styles.scoreRowComment}>{comment}</Text>
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
        padding: 24,
        gap: 8,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.inkMuted,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.ink,
        marginTop: 8,
    },
    errorText: {
        fontSize: 14,
        color: COLORS.inkMuted,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: COLORS.ink,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    scroll: {
        padding: 20,
        paddingBottom: 100,
        alignItems: 'center',
    },
    scoreWrap: {
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    scoreCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.ink,
    },
    scenarioLabel: {
        marginTop: 10,
        fontSize: 14,
        color: COLORS.inkMuted,
        fontWeight: '600',
    },
    summary: {
        fontSize: 15,
        color: COLORS.ink,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 8,
    },
    sectionLabel: {
        alignSelf: 'flex-start',
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.inkMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 24,
        marginBottom: 12,
    },
    list: {
        width: '100%',
        gap: 10,
    },
    scoreRow: {
        width: '100%',
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
    },
    scoreRowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    scoreRowLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.ink,
    },
    scoreRowValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.ink,
    },
    scoreRowComment: {
        fontSize: 13,
        color: COLORS.inkMuted,
        lineHeight: 18,
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    listText: {
        fontSize: 14,
        color: COLORS.ink,
        flex: 1,
    },
    improvementList: {
        width: '100%',
        gap: 12,
    },
    improvementCard: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
    },
    originalText: {
        fontSize: 14,
        color: '#B23B3B',
        textDecorationLine: 'line-through',
    },
    suggestionText: {
        fontSize: 14,
        color: COLORS.ink,
        fontWeight: '600',
    },
    explanationText: {
        fontSize: 12,
        color: COLORS.inkMuted,
        marginTop: 6,
        lineHeight: 16,
    },
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
    doneButton: {
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});