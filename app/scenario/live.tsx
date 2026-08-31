import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Linking, Alert, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { mediaDevices, MediaStream, RTCPeerConnection, RTCSessionDescription } from 'react-native-webrtc';
import { getScenarioById } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';
import { SCENARIO_BACKGROUND } from '@/constants/scenarioBackgrounds';
import { type TranscriptEntry } from '@/lib/sessionStorage';
import TranscriptModal from '@/components/TranscriptModal';
import InCallManager from 'react-native-incall-manager';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'permission-denied';

export default function LiveSessionScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const scenario = getScenarioById(id);
    const style = id ? SCENARIO_STYLE[id] : undefined;

    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const [showTranscript, setShowTranscript] = useState(false);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<any>(null);
    const localStream = useRef<any>(null);
    const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    // pc.addTrack'in dondurdugu RTCRtpSender'i tutuyoruz - mikrofonu gercekten
    // susturmak icin track.enabled yerine sender.replaceTrack(null)/replaceTrack(track)
    // kullaniyoruz. Bazi react-native-webrtc surumlerinde track.enabled=false
    // native tarafta RTP gonderimini garanti kesmiyor; replaceTrack ise
    // encoder'i tamamen ayirdigi icin kesin sonuc veriyor.
    const audioSenderRef = useRef<any>(null);

    useEffect(() => {
        connect();
        return () => cleanup();
    }, []);

    async function connect() {
        if (!scenario) return;

        cleanup();

        setConnectionState('connecting');
        setErrorMessage('');
        setTranscriptEntries([]);

        InCallManager.start({ media: 'audio' });

        try {
            // 1. Django'dan geçici (ephemeral) token al
            const tokenRes = await fetch(`${BACKEND_URL}/api/realtime/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenario_id: scenario.id }),
            });
            if (!tokenRes.ok) throw new Error('Backend token request failed');
            const tokenData = await tokenRes.json();
            const ephemeralKey = tokenData.value;

            // 2. Mikrofon erisimi iste
            let stream: MediaStream;
            try {
                stream = await mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });
            } catch (permErr: any) {
                // Mikrofon izni reddedildiyse ozel bir ekran goster
                console.log('MIC PERMISSION ERROR:', permErr?.name, permErr?.message);
                setConnectionState('permission-denied');
                return;
            }
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

            // Baglanti ortasinda kopma (network kaybi, sunucu tarafli kapama vb.) durumunu yakala
            pc.addEventListener('iceconnectionstatechange', () => {
                console.log('ICE CONNECTION STATE:', pc.iceConnectionState);
                if (
                    pc.iceConnectionState === 'disconnected' ||
                    pc.iceConnectionState === 'failed' ||
                    pc.iceConnectionState === 'closed'
                ) {
                    setConnectionState('error');
                    setErrorMessage('Connection lost. You can try again.');
                }
            });

            stream.getTracks().forEach((track: any) => {
                const sender = pc.addTrack(track, stream);
                audioSenderRef.current = sender;
            });

            setMicActive(false);

            const dc = pc.createDataChannel('oai-events');
            dataChannel.current = dc;

            dc.addEventListener('open', () => {
                console.log('DATA CHANNEL OPENED');
                setConnectionState('connected');
                startTimer();

                dc.send(
                    JSON.stringify({
                        type: 'session.update',
                        session: {
                            type: 'realtime',
                            instructions: scenario.systemPrompt,
                            audio: {
                                input: {
                                    transcription: {
                                        model: 'gpt-4o-mini-transcribe',
                                    },
                                    turn_detection: null,
                                },
                            },
                        },
                    })
                );

                // AI'nin ilk sozu soylemesini tetikle
                dc.send(JSON.stringify({ type: 'response.create' }));
            });

            dc.addEventListener('message', (event: any) => {
                const data = JSON.parse(event.data);
                console.log('DC MESSAGE:', data);

                // DEBUG: error tipi mesajlarin icerigini tam olarak gorelim
                if (data.type === 'error') {
                    console.log('ERROR DETAY:', JSON.stringify(data));
                }

                if (data.type === 'session.updated') {
                    console.log('SESSION UPDATED - kabul edildi:', JSON.stringify(data.session?.audio?.input));
                }

                if (data.type === 'response.created') setIsAiSpeaking(true);
                if (data.type === 'response.done') setIsAiSpeaking(false);

                // AI'nin soyledigi cumle bittiginde buffer'a ekle
                if (data.type === 'response.output_audio_transcript.done') {
                    setTranscriptEntries((prev) => [...prev, { role: 'ai', text: data.transcript }]);
                }
                if (data.type === 'conversation.item.input_audio_transcription.completed') {
                    setTranscriptEntries((prev) => [...prev, { role: 'user', text: data.transcript }]);
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

            if (!sdpRes.ok) throw new Error('Could not connect to OpenAI');

            const answerSdp = await sdpRes.text();
            await pc.setRemoteDescription(
                new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
            );
        } catch (err: any) {
            console.error('Connection error:', err);
            setConnectionState('error');
            setErrorMessage(err.message || 'Connection failed');
        }
    }

    function cleanup() {
        stopTimer();
        audioSenderRef.current = null;
        if (dataChannel.current) {
            dataChannel.current.close();
            dataChannel.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream.current) {
            localStream.current.getTracks().forEach((t: any) => t.stop());
            localStream.current = null;
        }
    }

    function startTimer() {
        stopTimer();
        const totalSeconds = (scenario?.estimatedMinutes ?? 5) * 60;
        setSecondsLeft(totalSeconds);

        timerInterval.current = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev === null) return null;
                if (prev <= 1) {
                    // Sure doldu, session'i otomatik bitir
                    stopTimer();
                    handleEnd();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }
    }

    function formatTime(totalSeconds: number) {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // track.enabled=false yerine bunu kullaniyoruz: sender'dan track'i tamamen
    // sokup (replaceTrack(null)) geri takmak, native tarafta RTP gonderiminin
    // gercekten durdugunu garanti eden daha kesin bir yontem.
    async function setMicActive(active: boolean) {
        if (!audioSenderRef.current || !localStream.current) return;
        try {
            if (active) {
                const audioTrack = localStream.current.getTracks()[0];
                await audioSenderRef.current.replaceTrack(audioTrack);
            } else {
                await audioSenderRef.current.replaceTrack(null);
            }
        } catch (err) {
            console.log('setMicActive error:', err);
        }
    }

    async function handlePressIn() {
        if (isAiSpeaking || connectionState !== 'connected') return;
        setIsRecording(true);
        if (dataChannel.current) {
            dataChannel.current.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
        }
        await setMicActive(true);
    }

    async function handlePressOut() {
        if (!isRecording) return;
        setIsRecording(false);
        await setMicActive(false);
        if (dataChannel.current) {
            dataChannel.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
            dataChannel.current.send(JSON.stringify({ type: 'response.create' }));
        }
    }

    function handleEnd() {
        cleanup();
        router.push({
            pathname: '/feedback/result',
            params: {
                id: scenario?.id ?? '',
                transcript: JSON.stringify(transcriptEntries),
            },
        });
    }

    function confirmEndSession() {
        Alert.alert(
            'End this conversation?',
            'Your progress in this session will be saved, but the call will end.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'End Session', style: 'destructive', onPress: handleEnd },
            ]
        );
    }

    function handleOpenSettings() {
        Linking.openSettings();
    }

    if (!scenario || !style) {
        return (
            <View style={styles.centered}>
                <Text style={styles.notFound}>Scenario not found.</Text>
            </View>
        );
    }

    if (connectionState === 'permission-denied') {
        return (
            <View style={styles.centered}>
                <MaterialCommunityIcons name="microphone-off" size={40} color="#B23B3B" />
                <Text style={styles.errorTitle}>Microphone permission required</Text>
                <Text style={styles.errorText}>
                    You need to allow microphone access to practice speaking.
                    Please enable it in Settings and try again.
                </Text>
                <Pressable style={styles.retryButton} onPress={handleOpenSettings}>
                    <Text style={styles.retryButtonText}>Open Settings</Text>
                </Pressable>
                <Pressable style={[styles.retryButton, styles.secondaryButton]} onPress={connect}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>
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
        <ImageBackground
            source={id ? SCENARIO_BACKGROUND[id] : undefined}
            style={[styles.container, { backgroundColor: style.color }]}
            resizeMode="cover"
        >
            {/* Karartma katmani: gorsel ne kadar acik/koyu olursa olsun
                ustundeki beyaz metin/butonlar her zaman okunakli kalsin diye. */}
            <View style={styles.scrim} pointerEvents="none" />

            <View style={styles.topBar}>
                <Text style={styles.timer}>
                    {connectionState === 'connecting'
                        ? 'Connecting...'
                        : secondsLeft !== null
                            ? formatTime(secondsLeft)
                            : 'Live'}
                </Text>
                <Text style={styles.roleLabel}>{scenario.aiRole}</Text>
            </View>

            <View style={styles.center}>
                {connectionState === 'connecting' && <ActivityIndicator size="large" color="#fff" />}

                <Text style={styles.turnLabel}>
                    {connectionState === 'connecting'
                        ? 'Setting up the session...'
                        : isAiSpeaking
                            ? `${scenario.aiRole} is speaking...`
                            : isRecording
                                ? 'Listening... release to send'
                                : 'Hold the mic button to talk'}
                </Text>

            </View>

            <View style={styles.controls}>
                <Pressable
                    style={[
                        styles.controlButton,
                        isRecording && styles.controlButtonRecording,
                        (isAiSpeaking || connectionState !== 'connected') && styles.controlButtonDisabled,
                    ]}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={isAiSpeaking || connectionState !== 'connected'}
                >
                    <MaterialCommunityIcons
                        name={isRecording ? 'microphone' : 'microphone-outline'}
                        size={26}
                        color="#fff"
                    />
                </Pressable>

                <Pressable style={styles.endButton} onPress={confirmEndSession}>
                    <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
                </Pressable>

                <Pressable
                    style={styles.controlButton}
                    onPress={() => setShowTranscript(true)}
                >
                    <MaterialCommunityIcons name="message-text-outline" size={24} color="#fff" />
                </Pressable>
            </View>

            <TranscriptModal
                visible={showTranscript}
                onClose={() => setShowTranscript(false)}
                entries={transcriptEntries}
                aiRoleLabel={scenario.aiRole}
            />
        </ImageBackground>
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
    scrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(8, 10, 18, 0.45)',
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
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.border,
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
    controlButtonRecording: {
        backgroundColor: '#E5484D',
        transform: [{ scale: 1.1 }],
    },
    controlButtonDisabled: {
        opacity: 0.4,
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