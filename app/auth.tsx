import { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS } from '@/constants/scenarioStyles';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'signIn' | 'signUp';

export default function AuthScreen() {
    const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
    const router = useRouter();
    const { signInWithEmail, signUpWithEmail } = useAuth();

    const [mode, setMode] = useState<Mode>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [infoMsg, setInfoMsg] = useState('');

    function handleSuccess() {
        if (returnTo) {
            router.replace(returnTo as any);
        } else {
            router.back();
        }
    }

    async function handleSubmit() {
        if (!email.trim() || !password) {
            setErrorMsg('Please fill in both fields.');
            return;
        }
        setSubmitting(true);
        setErrorMsg('');
        setInfoMsg('');

        const result =
            mode === 'signIn'
                ? await signInWithEmail(email.trim(), password)
                : await signUpWithEmail(email.trim(), password);

        setSubmitting(false);

        if (result.error) {
            setErrorMsg(result.error);
            return;
        }

        if (mode === 'signUp') {
            // Supabase varsayilani: email confirmation acik oldugunda
            // signUp basarili donse bile kullanicinin onaylanmis bir
            // session'i olmuyor. Bu yuzden direkt gecis yapmiyoruz,
            // sign-in moduna donup bilgilendiriyoruz.
            setMode('signIn');
            setPassword('');
            setInfoMsg('Account created. Check your email to confirm, then sign in.');
            return;
        }

        handleSuccess();
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Stack.Screen
                options={{
                    title: mode === 'signIn' ? 'Sign In' : 'Create Account',
                    presentation: 'modal',
                }}
            />

            <View style={styles.content}>
                <Text style={styles.title}>
                    {mode === 'signIn' ? 'Welcome back' : 'Create your account'}
                </Text>
                <Text style={styles.subtitle}>
                    {mode === 'signIn'
                        ? 'Sign in to start practicing with a scenario.'
                        : 'Create a free account to start speaking practice.'}
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={COLORS.inkMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.inkMuted}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                    value={password}
                    onChangeText={setPassword}
                />

                {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
                {!!infoMsg && <Text style={styles.infoText}>{infoMsg}</Text>}

                <Pressable style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {mode === 'signIn' ? 'Sign In' : 'Create Account'}
                        </Text>
                    )}
                </Pressable>

                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Google/Apple: Supabase dashboard + Google Cloud/Apple Developer
                    tarafinda provider kurulumu tamamlanana kadar bu butonlar
                    pasif duruyor. Kurulum bitince onPress baglanip aktif olacak. */}
                <Pressable style={[styles.oauthButton, styles.oauthButtonDisabled]} disabled>
                    <MaterialCommunityIcons name="google" size={18} color={COLORS.inkMuted} />
                    <Text style={styles.oauthButtonText}>Continue with Google (soon)</Text>
                </Pressable>
                <Pressable style={[styles.oauthButton, styles.oauthButtonDisabled]} disabled>
                    <MaterialCommunityIcons name="apple" size={18} color={COLORS.inkMuted} />
                    <Text style={styles.oauthButtonText}>Continue with Apple (soon)</Text>
                </Pressable>

                <Pressable
                    style={styles.switchModeButton}
                    onPress={() => {
                        setMode(mode === 'signIn' ? 'signUp' : 'signIn');
                        setErrorMsg('');
                        setInfoMsg('');
                    }}
                >
                    <Text style={styles.switchModeText}>
                        {mode === 'signIn'
                            ? "Don't have an account? Sign up"
                            : 'Already have an account? Sign in'}
                    </Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.ink,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.inkMuted,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 28,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.ink,
        marginBottom: 12,
    },
    errorText: {
        color: '#B23B3B',
        fontSize: 13,
        marginBottom: 12,
        textAlign: 'center',
    },
    infoText: {
        color: COLORS.inkMuted,
        fontSize: 13,
        marginBottom: 12,
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: COLORS.ink,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        gap: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        color: COLORS.inkMuted,
        fontSize: 12,
    },
    oauthButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingVertical: 13,
        marginBottom: 10,
    },
    oauthButtonDisabled: {
        opacity: 0.5,
    },
    oauthButtonText: {
        color: COLORS.inkMuted,
        fontSize: 14,
        fontWeight: '600',
    },
    switchModeButton: {
        marginTop: 12,
        alignItems: 'center',
        padding: 8,
    },
    switchModeText: {
        color: COLORS.inkMuted,
        fontSize: 13,
        fontWeight: '600',
    },
});