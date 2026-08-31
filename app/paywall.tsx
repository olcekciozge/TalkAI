import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { COLORS } from '@/constants/scenarioStyles';
import PremiumPaywall from '@/components/PremiumPaywall';

export default function PaywallScreen() {
    const { returnScenarioId } = useLocalSearchParams<{ returnScenarioId?: string }>();
    const router = useRouter();

    function handleUnlocked() {
        if (returnScenarioId) {
            router.replace({ pathname: '/scenario/live', params: { id: returnScenarioId } });
        } else {
            router.back();
        }
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Premium', presentation: 'modal' }} />
            <PremiumPaywall
                onUnlocked={handleUnlocked}
                onDismiss={() => router.back()}
                dismissLabel="Maybe later"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
});