import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getScenarioById } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';

export default function LiveSessionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const scenario = getScenarioById(id);
    const style = id ? SCENARIO_STYLE[id] : undefined;

    // Mock state — Gün 4-5'te gerçek WebRTC/Realtime API bağlantısı bu state'lerin yerini alacak
    const [isMuted, setIsMuted] = useState(false);
    const [turn, setTurn] = useState<'user' | 'ai'>('ai');

    if (!scenario || !style) {
        return (
            <View style={styles.centered}>
                <Text style={styles.notFound}>Scenario not found.</Text>
            </View>
        );
    }

    const handleEnd = () => {
        router.push({ pathname: '/feedback/result', params: { id: scenario.id } });
    };

    return (
        <View style={[styles.container, { backgroundColor: style.color }]}>
            <View style={styles.topBar}>
                <Text style={styles.timer}>02:14</Text>
                <Text style={styles.roleLabel}>{scenario.aiRole}</Text>
            </View>

            <View style={styles.center}>
                <View style={styles.avatarWrap}>
                    <MaterialCommunityIcons name={style.icon as any} size={56} color="#fff" />
                </View>
                <Text style={styles.turnLabel}>
                    {turn === 'ai' ? `${scenario.aiRole} is speaking...` : 'Your turn to speak'}
                </Text>

                {/* Mock transcript preview — Gün 4-5'te gerçek transcript buffer buraya bağlanacak */}
                <View style={styles.transcriptBox}>
                    <Text style={styles.transcriptText}>
                        "Hi there! Where are you headed today?"
                    </Text>
                </View>
            </View>

            <View style={styles.controls}>
                <Pressable
                    style={styles.controlButton}
                    onPress={() => setIsMuted((m) => !m)}
                >
                    <MaterialCommunityIcons
                        name={isMuted ? 'microphone-off' : 'microphone'}
                        size={26}
                        color="#fff"
                    />
                </Pressable>

                <Pressable style={styles.endButton} onPress={handleEnd}>
                    <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
                </Pressable>

                <Pressable
                    style={styles.controlButton}
                    onPress={() => setTurn((t) => (t === 'ai' ? 'user' : 'ai'))}
                >
                    <MaterialCommunityIcons name="swap-horizontal" size={26} color="#fff" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
        justifyContent: 'space-between',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    notFound: {
        fontSize: 16,
        color: COLORS.inkMuted,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timer: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    roleLabel: {
        color: '#ffffffcc',
        fontSize: 14,
        fontWeight: '600',
    },
    center: {
        alignItems: 'center',
        gap: 20,
    },
    avatarWrap: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#ffffff26',
        alignItems: 'center',
        justifyContent: 'center',
    },
    turnLabel: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    transcriptBox: {
        backgroundColor: '#ffffff1f',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        maxWidth: '90%',
    },
    transcriptText: {
        color: '#fff',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
    },
    controlButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ffffff26',
        alignItems: 'center',
        justifyContent: 'center',
    },
    endButton: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#E5484D',
        alignItems: 'center',
        justifyContent: 'center',
    },
});