import { supabase } from '@/lib/supabase';
import type { Level } from '@/constants/scenarios';

export type Profile = {
    id: string;
    email: string | null;
    targetLevel: Level | null;
    favoriteScenarioIds: string[];
};

export type SessionStats = {
    totalSessions: number;
    averageScore: number | null;
    averageGrammar: number | null;
    averageFluency: number | null;
    averageVocabulary: number | null;
};

function rowToProfile(row: any): Profile {
    return {
        id: row.id,
        email: row.email,
        targetLevel: row.target_level,
        favoriteScenarioIds: row.favorite_scenario_ids ?? [],
    };
}

export async function getProfile(): Promise<Profile | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

    if (error) {
        console.error('getProfile error:', error.message);
        return null;
    }
    return rowToProfile(data);
}

export async function updateProfile(patch: {
    targetLevel?: Level | null;
    favoriteScenarioIds?: string[];
}): Promise<{ error: string | null }> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Not signed in.' };

    const updatePayload: Record<string, any> = {};
    if (patch.targetLevel !== undefined) updatePayload.target_level = patch.targetLevel;
    if (patch.favoriteScenarioIds !== undefined) {
        updatePayload.favorite_scenario_ids = patch.favoriteScenarioIds;
    }

    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);
    return { error: error?.message ?? null };
}

// Ayri bir "stats" tablosu tutmuyoruz - sessions tablosundan anlik
// hesapliyoruz. MVP olcegi icin (kullanici basina onlarca-yuzlerce satir)
// bu client-side aggregate performans acisindan sorun degil; ileride
// veri buyurse bir Postgres view/RPC'ye tasinabilir.
export async function getSessionStats(): Promise<SessionStats> {
    const { data, error } = await supabase.from('sessions').select('overall_score, feedback');

    if (error || !data || data.length === 0) {
        return {
            totalSessions: 0,
            averageScore: null,
            averageGrammar: null,
            averageFluency: null,
            averageVocabulary: null,
        };
    }

    const total = data.length;
    const avgOverall = data.reduce((sum, r: any) => sum + (r.overall_score ?? 0), 0) / total;
    const avgGrammar = data.reduce((sum, r: any) => sum + (r.feedback?.grammar?.score ?? 0), 0) / total;
    const avgFluency = data.reduce((sum, r: any) => sum + (r.feedback?.fluency?.score ?? 0), 0) / total;
    const avgVocabulary =
        data.reduce((sum, r: any) => sum + (r.feedback?.vocabulary?.score ?? 0), 0) / total;

    return {
        totalSessions: total,
        averageScore: Math.round(avgOverall),
        averageGrammar: Math.round(avgGrammar * 10) / 10,
        averageFluency: Math.round(avgFluency * 10) / 10,
        averageVocabulary: Math.round(avgVocabulary * 10) / 10,
    };
}