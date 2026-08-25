import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { initPurchases } from '@/lib/purchases';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // GUN 11: RevenueCat SDK'sini uygulama acilir acilmaz, BIR KERE baslatiyoruz.
  useEffect(() => {
    initPurchases();
  }, []);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scenario/[id]" options={{ title: 'Scenario' }} />
          <Stack.Screen name="scenario/live" options={{ headerShown: false }} />
          <Stack.Screen name="feedback/result" options={{ title: 'Feedback' }} />
          <Stack.Screen name="history/[id]" options={{ title: 'Session Detail' }} />
          <Stack.Screen name="paywall" options={{ title: 'Premium', presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
  );
}