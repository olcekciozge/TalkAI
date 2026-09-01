import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });

        // Token yenilenmesi, baska yerden signOut vb. degisiklikleri de yakalar.
        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
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