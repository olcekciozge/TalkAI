import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        'EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY tanimli degil - .env dosyana ekle.'
    );
}

// AsyncStorage'i Supabase'in kendi oturum (session/token) saklama katmani
// olarak kullaniyoruz - boylece kullanici uygulamayi kapatip actiginda
// tekrar giris yapmasi gerekmiyor, token otomatik yenileniyor.
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});