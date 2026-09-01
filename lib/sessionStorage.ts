import { supabase } from '@/lib/supabase';

export type FeedbackData = {
    grammar: { score: number; comment: string };
    fluency: { score: number; comment: string };
    vocabulary: { score: number; comment: string };
    corrections: { original: string; corrected: string; explanation: string }[];
    better_expressions: { original: string; suggestion: string }[];
    summary: string;
};

export type TranscriptEntry = {
    role: 'user' | 'ai';
    text: string;
};

export type StoredSession = {
    id: string;
    scenarioId: string;
    scenarioTitle: string;
    date: string;
    overallScore: number;
    feedback: FeedbackData;
    transcript?: TranscriptEntry[];
};

function rowToStoredSession(row: any): StoredSession {
    return {
        id: row.id,
        scenarioId: row.scenario_id,
        scenarioTitle: row.scenario_title,
        date: row.created_at,
        overallScore: row.overall_score,
        feedback: row.feedback,
        transcript: row.transcript ?? [],
    };
}


export async function saveSession(session: StoredSession): Promise<void> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        console.error('saveSession: authenticated user yok, kayit atlandi.');
        return;
    }

    const { error } = await supabase.from('sessions').insert({
        user_id: user.id,
        scenario_id: session.scenarioId,
        scenario_title: session.scenarioTitle,
        // overall_score kolonu integer - Math.round ile garanti altina
        // aliyoruz, caller'da yuvarlama unutulmus olsa bile insert patlamasin.
        overall_score: Math.round(session.overallScore),
        feedback: session.feedback,
        transcript: session.transcript ?? [],
    });

    if (error) {
        console.error('saveSession error:', error.message);
    }
}

export async function getAllSessions(): Promise<StoredSession[]> {
    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getAllSessions error:', error.message);
        return [];
    }

    return (data ?? []).map(rowToStoredSession);
}

export async function getSessionById(id: string): Promise<StoredSession | undefined> {
    const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();

    if (error) {
        console.error('getSessionById error:', error.message);
        return undefined;
    }

    return data ? rowToStoredSession(data) : undefined;
}