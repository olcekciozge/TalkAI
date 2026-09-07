import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { OneSignal } from 'react-native-onesignal';
import { supabase } from '@/lib/supabase';
import { identifyPurchasesUser, resetPurchasesUser } from '@/lib/purchases';

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
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
            if (data.session?.user) {
                previousUserId.current = data.session.user.id;
                identifyPurchasesUser(data.session.user.id);
                // OneSignal'deki push aboneligini Supabase user id'siyle
                // eslestiriyoruz - boylece ileride kisiye ozel/segment
                // bazli bildirim gonderebiliriz.
                OneSignal.login(data.session.user.id);
            }
        });

        // Token yenilenmesi, baska yerden signOut vb. degisiklikleri de yakalar.
        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            if (newSession?.user) {
                previousUserId.current = newSession.user.id;
                identifyPurchasesUser(newSession.user.id);
                OneSignal.login(newSession.user.id);
            } else if (previousUserId.current) {
                previousUserId.current = null;
                resetPurchasesUser();
                OneSignal.logout();
            }
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    async function signUpWithEmail(email: string, password: string) {
        const { error } = await supabase.auth.signUp({ email, password });
        return { error: error?.message ?? null };
    }

    async function signInWithEmail(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error?.message ?? null };
    }

    async function signOut() {
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