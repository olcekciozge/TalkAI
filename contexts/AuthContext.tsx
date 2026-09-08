import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { OneSignal } from 'react-native-onesignal';
import { supabase } from '@/lib/supabase';
import { identifyPurchasesUser, resetPurchasesUser } from '@/lib/purchases';
import { identifyAnalyticsUser, resetAnalyticsUser, trackEvent, AnalyticsEvent } from '@/lib/analytics';

type AuthContextValue = {
    session: Session | null;
    user: User | null;
    // Ilk acilista Supabase'den kayitli oturumu okurken true - bu bitmeden
    // "giris yapilmamis" sanip kullaniciyi yanlislikla auth ekranina atmamak
    // icin cagiran taraf bunu kontrol etmeli.
    loading: boolean;
    signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
    signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const previousUserId = useRef<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data }) => {
            if (data.session?.user) {
                previousUserId.current = data.session.user.id;
                // ONEMLI: identifyPurchasesUser'i (Purchases.logIn) AWAIT
                // ediyoruz, session state'ini guncellemeden once. Aksi
                // halde uygulama her acilista RevenueCat kisa bir sure
                // anonim kimlikte kaliyor - eger o pencerede bir ekran
                // isPremiumUser() cagirirsa (ornegin ust bardaki taban
                // rozeti) hesaba bagli olan premium'u goremeyip yanlislikla
                // "premium degil" gosteriyordu. Once kimlik eslesmesi
                // tamamlansin, sonra session (ve dolayisiyla "user")
                // component'lere yayilsin.
                await identifyPurchasesUser(data.session.user.id);
                // OneSignal'deki push aboneligini Supabase user id'siyle
                // eslestiriyoruz - boylece ileride kisiye ozel/segment
                // bazli bildirim gonderebiliriz.
                OneSignal.login(data.session.user.id);
                // Amplitude'da da ayni sekilde - burada sadece "kimlik
                // eslestirme" yapiyoruz, Sign In event'ini FIRLATMIYORUZ
                // (bu sadece app'i her acista degil, gercek giris aninda
                // olmali - bkz. signInWithEmail/signUpWithEmail).
                identifyAnalyticsUser(data.session.user.id);
            }
            setSession(data.session);
            setLoading(false);
        });

        // Token yenilenmesi, baska yerden signOut vb. degisiklikleri de yakalar.
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (newSession?.user) {
                previousUserId.current = newSession.user.id;
                await identifyPurchasesUser(newSession.user.id);
                OneSignal.login(newSession.user.id);
                identifyAnalyticsUser(newSession.user.id);
            } else if (previousUserId.current) {
                previousUserId.current = null;
                resetPurchasesUser();
                OneSignal.logout();
                resetAnalyticsUser();
            }
            setSession(newSession);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    async function signUpWithEmail(email: string, password: string) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (!error) {
            trackEvent(AnalyticsEvent.SIGN_UP, { method: 'email' });
        }
        return { error: error?.message ?? null };
    }

    async function signInWithEmail(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
            trackEvent(AnalyticsEvent.SIGN_IN, { method: 'email' });
        }
        return { error: error?.message ?? null };
    }

    async function signOut() {
        trackEvent(AnalyticsEvent.SIGN_OUT);
        await supabase.auth.signOut();
    }

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                loading,
                signUpWithEmail,
                signInWithEmail,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}