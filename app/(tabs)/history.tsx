import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '@/constants/scenarioStyles';

export default function HistoryScreen() {
    return (
        <View style={styles.container}>
            <MaterialCommunityIcons name="history" size={40} color={COLORS.inkMuted} />
            <Text style={styles.title}>No sessions yet</Text>
            <Text style={styles.subtitle}>Your past practice sessions will show up here.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.ink,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.inkMuted,
        textAlign: 'center',
    },
});