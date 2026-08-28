import { Stack } from 'expo-router';


export default function TabsGroupLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="get-premium" />
            <Stack.Screen name="profile" />
        </Stack>
    );
}