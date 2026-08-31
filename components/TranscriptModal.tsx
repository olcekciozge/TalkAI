import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '@/constants/scenarioStyles';
import { type TranscriptEntry } from '@/lib/sessionStorage';

type Props = {
    visible: boolean;
    onClose: () => void;
    entries: TranscriptEntry[];
    aiRoleLabel?: string;
};

// live.tsx, feedback/result.tsx ve history/[id].tsx AYNI transkript panelini
// kullanir - burada tek bir yerde tutuyoruz ki uc ekranda ayri ayri
// bakim gerektiren kopya kod olusmasin.
export default function TranscriptModal({ visible, onClose, entries, aiRoleLabel = 'AI' }: Props) {
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.panelOverlay}>
                <Pressable style={styles.panelBackdrop} onPress={onClose} />
                <View style={styles.panel}>
                    <View style={styles.panelHeader}>
                        <Text style={styles.panelTitle}>Transcript</Text>
                        <Pressable onPress={onClose} hitSlop={12}>
                            <MaterialCommunityIcons name="close" size={24} color={COLORS.ink} />
                        </Pressable>
                    </View>
                    <ScrollView style={styles.panelScroll} contentContainerStyle={styles.panelScrollContent}>
                        {entries.length === 0 ? (
                            <Text style={styles.panelEmpty}>No transcript available for this session.</Text>
                        ) : (
                            entries.map((entry, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.transcriptRow,
                                        entry.role === 'user' ? styles.transcriptRowUser : styles.transcriptRowAi,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.transcriptRowLabel,
                                            entry.role === 'user' && styles.transcriptRowLabelUser,
                                        ]}
                                    >
                                        {entry.role === 'user' ? 'You' : aiRoleLabel}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.transcriptRowText,
                                            entry.role === 'user' && styles.transcriptRowTextUser,
                                        ]}
                                    >
                                        {entry.text}
                                    </Text>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    panelOverlay: { flex: 1, flexDirection: 'row' },
    panelBackdrop: { flex: 1, backgroundColor: '#00000066' },
    panel: {
        width: '78%',
        maxWidth: 340,
        backgroundColor: COLORS.background,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    panelTitle: { fontSize: 20, fontWeight: '700', color: COLORS.ink },
    panelScroll: { flex: 1 },
    panelScrollContent: { gap: 12, paddingBottom: 24 },
    panelEmpty: { color: COLORS.inkMuted, fontSize: 14 },
    transcriptRow: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        maxWidth: '92%',
    },
    transcriptRowUser: { backgroundColor: COLORS.ink, alignSelf: 'flex-end' },
    transcriptRowAi: { backgroundColor: '#00000012', alignSelf: 'flex-start' },
    transcriptRowLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 2,
        opacity: 0.7,
        color: COLORS.inkMuted,
    },
    transcriptRowLabelUser: { color: '#ffffffaa' },
    transcriptRowText: { fontSize: 14, lineHeight: 20, color: COLORS.ink },
    transcriptRowTextUser: { color: '#fff' },
});