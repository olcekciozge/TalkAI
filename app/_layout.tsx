import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { initPurchases } from '@/lib/purchases';
import { COLORS } from '@/constants/scenarioStyles';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { AuthProvider } from '@/contexts/AuthContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

// Ust ve alt bar AYNI boyutta olacak sekilde ortak sabitler.
const BAR_HEIGHT = 56;
const BAR_RADIUS = 28;
const BAR_MARGIN = 16;

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

  useEffect(() => {
    initPurchases();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
      <AuthProvider>
        <SearchProvider>
          <RootLayoutNav />
        </SearchProvider>
      </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  const isLiveScreen = pathname?.startsWith('/scenario/live');

  return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
          <View style={styles.root}>
            {!isLiveScreen && <GlobalTopBar />}

            <View style={styles.content}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="scenario/[id]" />
                <Stack.Screen name="scenario/live" />
                <Stack.Screen name="feedback/result" />
                <Stack.Screen name="history/[id]" />
                <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
                <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
                <Stack.Screen name="account" />
              </Stack>
            </View>

            {!isLiveScreen && <GlobalBottomBar pathname={pathname} />}
          </View>
        </SafeAreaProvider>
      </ThemeProvider>
  );
}

function GlobalTopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery } = useSearch();
  const isHome = pathname === '/' || pathname === '/(tabs)' || pathname === '/index';

  function handleSearchPress() {
    if (!isHome) {
      setSearchOpen(true);
      router.replace('/(tabs)');
      return;
    }
    if (searchOpen) setSearchQuery('');
    setSearchOpen(!searchOpen);
  }

  return (
      <View style={[styles.topBarWrap, { paddingTop: insets.top + 20 }]}>
        <View style={styles.bar}>
          {searchOpen && isHome ? (
              <TextInput
                  style={styles.searchInputInline}
                  placeholder="Search scenarios..."
                  placeholderTextColor="#ffffff88"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
              />
          ) : (
              <Text style={styles.logoText}>
                TALK<Text style={styles.logoAccent}>.AI</Text>
              </Text>
          )}
          <View style={styles.topBarActions}>
            <Pressable style={styles.iconButton} onPress={handleSearchPress}>
              <MaterialCommunityIcons
                  name={searchOpen && isHome ? 'close' : 'magnify'}
                  size={20}
                  color={COLORS.ink}
              />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => router.push('/paywall')}>
              <MaterialCommunityIcons name="star-four-points" size={19} color={COLORS.accent} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => router.push('/account')}>
              <MaterialCommunityIcons name="account-circle-outline" size={20} color={COLORS.ink} />
            </Pressable>
          </View>
        </View>
      </View>
  );
}

function GlobalBottomBar({ pathname }: { pathname: string | null }) {
  const router = useRouter();

  const tabs = [
    { label: 'Homepage', path: '/(tabs)', match: ['/', '/(tabs)', '/index'] },
    { label: 'History', path: '/(tabs)/profile', match: ['/(tabs)/profile', '/profile'] },
  ];

  return (
      <View style={styles.bottomBarWrap}>
        <View style={styles.bar}>
          {tabs.map((tab) => {
            const active = pathname ? tab.match.includes(pathname) : false;
            return (
                <Pressable
                    key={tab.path}
                    style={styles.tabButton}
                    onPress={() => router.replace(tab.path as any)}
                >
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                </Pressable>
            );
          })}
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  topBarWrap: {
    backgroundColor: COLORS.background,
  },
  bottomBarWrap: {
    paddingBottom: 20,
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.ink,
    marginHorizontal: BAR_MARGIN,
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  logoAccent: {
    color: COLORS.accent,
  },
  searchInputInline: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    padding: 0,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e0e0e0',
  },
  tabLabelActive: {
    color: COLORS.accent,
  },
});