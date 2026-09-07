import { init, track, identify, Identify, setUserId, reset } from '@amplitude/analytics-react-native';

const AMPLITUDE_API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY;

let initialized = false;

export function initAnalytics() {
    if (!AMPLITUDE_API_KEY) {
        console.error(
            'EXPO_PUBLIC_AMPLITUDE_API_KEY tanimli degil - .env dosyana ekle.'
        );
        return;
    }
    if (initialized) return;
    init(AMPLITUDE_API_KEY, undefined, {
        // Kullaniciyi henuz tanimlamadan (giris yapmadan) once de olay
        // gonderebilelim diye, otomatik olarak anonim bir cihaz id'si
        // kullaniliyor - Amplitude bunu kendi hallediyor.
        trackingOptions: {
            ipAddress: false,
        },
    });
    initialized = true;
}

// Kullanici giris yaptiginda Amplitude'daki kullaniciyi Supabase user id'siyle
// eslestiriyoruz - boylece giris oncesi/sonrasi olaylar ayni kullaniciya
// baglanabiliyor.
export function identifyAnalyticsUser(userId: string) {
    setUserId(userId);
}

export function resetAnalyticsUser() {
    reset();
}

export function setUserProperty(name: string, value: string | number | boolean) {
    const identifyObj = new Identify();
    identifyObj.set(name, value);
    identify(identifyObj);
}

// Tum event isimlerini tek yerde tutuyoruz - hem tutarlilik hem de
// Amplitude dashboard'unda hangi event'lerin oldugunu tek bakista gormek
// icin (event isimlerinin string olarak dagilmasini onluyor).
export const AnalyticsEvent = {
    SIGN_UP: 'Sign Up',
    SIGN_IN: 'Sign In',
    SIGN_OUT: 'Sign Out',
    SCENARIO_VIEWED: 'Scenario Viewed',
    FAVORITE_TOGGLED: 'Favorite Toggled',
    SESSION_STARTED: 'Session Started',
    SESSION_ENDED: 'Session Ended',
    FEEDBACK_VIEWED: 'Feedback Viewed',
    PAYWALL_VIEWED: 'Paywall Viewed',
    PURCHASE_COMPLETED: 'Purchase Completed',
    PURCHASE_RESTORED: 'Purchase Restored',
} as const;

export function trackEvent(
    eventName: (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent],
    properties?: Record<string, any>
) {
    track(eventName, properties);
}