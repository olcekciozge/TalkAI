import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '@/constants/scenarioStyles';
import type { FeedbackData } from '@/lib/sessionStorage';

type Props = {
    feedback: FeedbackData;
    overallScore: number;
    scenarioTitle?: string;
    accentColor: string;
};

// NOT: Bu bileşen kendi ScrollView'ini içermiyor, çağıran ekranın
// ScrollView'i içine yerleştirilmesi bekleniyor (result.tsx ve
// history/[id].tsx'te olduğu gibi).
export default function FeedbackView({ feedback, overallScore, scenarioTitle, accentColor }: Props) {
    return (
        <>
            <View style={styles.scoreWrap}>
                <View style={[styles.scoreCircle, { borderColor: accentColor }]}>
                    <Text style={styles.scoreNumber}>{overallScore}</Text>
                </View>
                {scenarioTitle && <Text style={styles.scenarioLabel}>{scenarioTitle}</Text>}
            </View>

            <Text style={styles.summary}>{feedback.summary}</Text>

            <Text style={styles.sectionLabel}>SCORES</Text>
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
                    <Text style={styles.sectionLabel}>CORRECTIONS</Text>
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
                    <Text style={styles.sectionLabel}>TRY SAYING IT THIS WAY</Text>
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
        </>
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
    scoreWrap: { alignItems: 'center', marginTop: 12, marginBottom: 24 },
    scoreCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreNumber: { fontSize: 28, fontWeight: '700', color: COLORS.ink },
    scenarioLabel: { marginTop: 10, fontSize: 14, color: COLORS.inkMuted, fontWeight: '600' },
    summary: { fontSize: 15, color: COLORS.ink, lineHeight: 22, textAlign: 'center', marginBottom: 8 },
    sectionLabel: {
        alignSelf: 'flex-start',
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.inkMuted,
        letterSpacing: 0.5,
        marginTop: 24,
        marginBottom: 12,
    },
    list: { width: '100%', gap: 10 },
    scoreRow: {
        width: '100%',
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
    },
    scoreRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    scoreRowLabel: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
    scoreRowValue: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
    scoreRowComment: { fontSize: 13, color: COLORS.inkMuted, lineHeight: 18 },
    improvementList: { width: '100%', gap: 12 },
    improvementCard: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
    },
    originalText: { fontSize: 14, color: '#B23B3B', textDecorationLine: 'line-through' },
    suggestionText: { fontSize: 14, color: COLORS.ink, fontWeight: '600' },
    explanationText: { fontSize: 12, color: COLORS.inkMuted, marginTop: 6, lineHeight: 16 },
});