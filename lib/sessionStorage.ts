import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend'in (Gün 8) döndürdüğü feedback şeması.
// Burada tek bir yerde tanımlıyoruz ki result.tsx ve history ekranları
// birbirinden farklı tipler kullanıp karışıklık çıkarmasın.
export type FeedbackData = {
    grammar: { score: number; comment: string };
    fluency: { score: number; comment: string };
    vocabulary: { score: number; comment: string };
    corrections: { original: string; corrected: string; explanation: string }[];
    better_expressions: { original: string; suggestion: string }[];
    summary: string;
};

// Telefonda saklayacağımız her bir session kaydının şekli.
export type StoredSession = {
    id: string;
    scenarioId: string;
    scenarioTitle: string;
    date: string; // ISO string, ör: "2026-08-24T10:15:00.000Z"
    overallScore: number;
    feedback: FeedbackData;
};

// AsyncStorage'da tüm session'ları TEK bir anahtar altında, bir array
// (liste) olarak saklıyoruz. Alternatif olarak her session'a ayrı bir
// anahtar da verilebilirdi, ama az sayıda kayıt (bir kaç düzine session)
// beklediğimiz için tek liste daha basit ve yeterli.
const STORAGE_KEY = 'talkai_sessions';

// Yeni bir session'ı kaydeder. Mevcut listeyi okuyup başına ekliyoruz
// (en yeni session en üstte olsun diye).
export async function saveSession(session: StoredSession): Promise<void> {
    const existing = await getAllSessions();
    const updated = [session, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// Tüm kayıtlı session'ları, en yeniden en eskiye sıralı şekilde döner.
export async function getAllSessions(): Promise<StoredSession[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed: StoredSession[] = JSON.parse(raw);
        return parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (err) {
        console.error('getAllSessions error:', err);
        return [];
    }
}

// Tek bir session'ı id'sine göre bulur (history detay ekranı için).
export async function getSessionById(id: string): Promise<StoredSession | undefined> {
    const all = await getAllSessions();
    return all.find((s) => s.id === id);
}