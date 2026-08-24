import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { mediaDevices, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import { getScenarioById } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';
import InCallManager from 'react-native-incall-manager';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

export default function LiveSessionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const scenario = getScenarioById(id);
    const style = id ? SCENARIO_STYLE[id] : undefined;

    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<any>(null);
    const localStream = useRef<any>(null);

    useEffect(() => {
        connect();
        return () => cleanup();
    }, []);

    async function connect() {
        if (!scenario) return;
        setConnectionState('connecting');
        setErrorMessage('');

        InCallManager.start({ media: 'audio' });

        try {
            // 1. Django'dan geçici (ephemeral) token al
            const tokenRes = await fetch(`${BACKEND_URL}/api/realtime/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario_id: scenario.id }),
            });
            if (!tokenRes.ok) throw new Error('Backend token isteği basarisiz oldu');
            const tokenData = await tokenRes.json();
            const ephemeralKey = tokenData.value;

            // 2. Mikrofon erisimi iste
            const stream = await mediaDevices.getUserMedia({ audio: true });
            localStream.current = stream;

            // 3. WebRTC baglantisi kur
            const pc = new RTCPeerConnection();
            peerConnection.current = pc;

            pc.addEventListener('track', () => {
                console.log('REMOTE TRACK RECEIVED');
                // Uzak ses (AI sesi) gelince speaker'i zorla ac.
                // Bunu track gelmeden yapmak native tarafta yaris durumuna
                // (race condition) yol acip sesin bazen kesilmesine sebep olabiliyordu.
                InCallManager.setForceSpeakerphoneOn(true);
            });

            stream.getTracks().forEach((track: any) => pc.addTrack(track, stream));

            const dc = pc.createDataChannel('oai-events');
            dataChannel.current = dc;

            dc.addEventListener('open', () => {
                console.log('DATA CHANNEL OPENED');
                setConnectionState('connected');

                // Senaryoya ozel system prompt'u gonder
                // NOT: OpenAI Realtime GA API'si artik session objesi icinde
                // "type": "realtime" alanini zorunlu tutuyor, eskiden gerekmiyordu.
                dc.send(
                    JSON.stringify({
                        type: 'session.update',
                        session: {
                            type: 'realtime',
                            instructions: scenario.systemPrompt,
                        },
                    })
                );

                // AI'nin ilk sozu soylemesini tetikle
                dc.send(JSON.stringify({ type: 'response.create' }));
            });

            dc.addEventListener('message', (event: any) => {
                const data = JSON.parse(event.data);
                console.log('DC MESSAGE:', data.type);

                // DEBUG: error tipi mesajlarin icerigini tam olarak gorelim
                if (data.type === 'error') {
                    console.log('ERROR DETAY:', JSON.stringify(data));
                }

                if (data.type === 'response.created') setIsAiSpeaking(true);
                if (data.type === 'response.done') setIsAiSpeaking(false);

                // DUZELTME: dogru event adi 'response.output_audio_transcript.done'
                if (data.type === 'response.output_audio_transcript.done') {
                    setTranscript(data.transcript);
                }
            });

            // 4. SDP offer olustur ve OpenAI'ye gonder
            const offer = await pc.createOffer({});
            await pc.setLocalDescription(offer);

            const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${ephemeralKey}`,
                    'Content-Type': 'application/sdp',
                },
            });

            if (!sdpRes.ok) throw new Error('OpenAI baglantisi kurulamadi');

            const answerSdp = await sdpRes.text();
            await pc.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
            );
        } catch (err: any) {
            console.error('Connection error:', err);
            setConnectionState('error');
            setErrorMessage(err.message || 'Baglanti kurulamadi');
        }
    }

    function cleanup() {
        if (dataChannel.current) dataChannel.current.close();
        if (peerConnection.current) peerConnection.current.close();
        if (localStream.current) {
            localStream.current.getTracks().forEach((t: any) => t.stop());
        }
    }

    function toggleMute() {
        if (!localStream.current) return;
        const audioTrack = localStream.current.getTracks()[0];
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
    }

    function handleEnd() {
        cleanup();
        router.push({ pathname: '/feedback/result', params: { id: scenario?.id ?? '' } });
    }

    if (!scenario || !style) {
        return (
            <View style={styles.centered}>
                <Text style={styles.notFound}>Scenario not found.</Text>
            </View>
        );
    }

    if (connectionState === 'error') {
        return (
            <View style={styles.centered}>
                <MaterialCommunityIcons name="alert-circle" size={40} color="#B23B3B" />
                <Text style={styles.errorTitle}>Connection failed</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Pressable style={styles.retryButton} onPress={connect}>
                    <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: style.color }]}>
            <View style={styles.topBar}>
                <Text style={styles.timer}>
                    {connectionState === 'connecting' ? 'Connecting...' : 'Live'}
                </Text>
                <Text style={styles.roleLabel}>{scenario.aiRole}</Text>
            </View>

            <View style={styles.center}>
                {connectionState === 'connecting' ? (
                    <ActivityIndicator size="large" color="#fff" />
                ) : (
                    <View style={styles.avatarWrap}>
                        <MaterialCommunityIcons name={style.icon as any} size={56} color="#fff" />
                    </View>
                )}

                <Text style={styles.turnLabel}>
                    {connectionState === 'connecting'
                        ? 'Setting up the session...'
                        : isAiSpeaking
                            ? `${scenario.aiRole} is speaking...`
                            : 'Your turn to speak'}
                </Text>

                {transcript ? (
                    <View style={styles.transcriptBox}>
                        <Text style={styles.transcriptText}>"{transcript}"</Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.controls}>
                <Pressable style={styles.controlButton} onPress={toggleMute}>
                    <MaterialCommunityIcons
                        name={isMuted ? 'microphone-off' : 'microphone'}
                        size={26}
                        color="#fff"
                    />
                </Pressable>

                <Pressable style={styles.endButton} onPress={handleEnd}>
                    <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
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
        padding: 24,
        gap: 8,
    },
    notFound: {
        fontSize: 16,
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
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timer: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
        textAlign: 'center',
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