import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend'in döndürdüğü feedback şeması.
// Burada tek bir yerde tanımlıyoruz ki result.tsx ve history ekranları birbirinden farklı tipler kullanıp karışıklık çıkarmasın.
export type FeedbackData = {
    grammar: { score: number; comment: string };
    fluency: { score: number; comment: string };
    vocabulary: { score: number; comment: string };
    corrections: { original: string; corrected: string; explanation: string }[];
    better_expressions: { original: string; suggestion: string }[];
    summary: string;
};

export type StoredSession = {
    id: string;
    scenarioId: string;
    scenarioTitle: string;
    date: string;
    overallScore: number;
    feedback: FeedbackData;
};

const STORAGE_KEY = 'talkai_sessions';

export async function saveSession(session: StoredSession): Promise<void> {
    const existing = await getAllSessions();
    const updated = [session, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

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

export async function getSessionById(id: string): Promise<StoredSession | undefined> {
    const all = await getAllSessions();
    return all.find((s) => s.id === id);
}