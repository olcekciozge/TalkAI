import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getScenarioById } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';

// Mock feedback — Gün 6-7'de bu, transcript'in LLM'e gönderilip
// structured JSON olarak dönmesiyle gerçek veriye bağlanacak
const MOCK_FEEDBACK = {
    score: 78,
    summary: 'Good flow overall — you kept the conversation going naturally and asked relevant follow-up questions.',
    strengths: [
        'Used natural greetings and small talk',
        'Asked a clear follow-up question about the destination',
    ],
    improvements: [
        { original: 'I go to airport', suggestion: 'I need to go to the airport' },
        { original: 'How much time it take', suggestion: 'How long will it take?' },
    ],
};

export default function FeedbackScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const scenario = getScenarioById(id);
    const style = id ? SCENARIO_STYLE[id] : undefined;

    const handleDone = () => {
        router.replace('/(tabs)');
    };

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
                        <Text style={styles.scoreNumber}>{MOCK_FEEDBACK.score}</Text>
                    </View>
                    {scenario && <Text style={styles.scenarioLabel}>{scenario.title}</Text>}
                </View>

                <Text style={styles.summary}>{MOCK_FEEDBACK.summary}</Text>

                <Text style={styles.sectionLabel}>What went well</Text>
                <View style={styles.list}>
                    {MOCK_FEEDBACK.strengths.map((s, i) => (
                        <View key={i} style={styles.listRow}>
                            <MaterialCommunityIcons name="check-circle" size={18} color="#2F9E6E" />
                            <Text style={styles.listText}>{s}</Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.sectionLabel}>Try saying it this way</Text>
                <View style={styles.improvementList}>
                    {MOCK_FEEDBACK.improvements.map((item, i) => (
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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