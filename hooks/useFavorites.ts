import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, updateProfile } from '@/lib/profile';

// index.tsx (kartlar), scenario/[id].tsx (detay) ve account.tsx
// (Favorite List) AYNI favori listesini kullaniyor - burada tek yerde
// tutuyoruz ki her ekran ayri ayri Supabase'e sorup senkron kalmaya
// calismasin.
export function useFavorites() {
    const { user } = useAuth();
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [loaded, setLoaded] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!user) {
                setFavoriteIds([]);
                setLoaded(true);
                return;
            }
            let active = true;
            getProfile().then((p) => {
                if (!active) return;
                setFavoriteIds(p?.favoriteScenarioIds ?? []);
                setLoaded(true);
            });
            return () => {
                active = false;
            };
        }, [user])
    );

    async function toggleFavorite(scenarioId: string) {
        const isFav = favoriteIds.includes(scenarioId);
        const next = isFav
            ? favoriteIds.filter((id) => id !== scenarioId)
            : [...favoriteIds, scenarioId];

        setFavoriteIds(next);
        const { error } = await updateProfile({ favoriteScenarioIds: next });
        if (error) {
            console.error('toggleFavorite error:', error);
            setFavoriteIds(favoriteIds);
        }
    }

    return { favoriteIds, toggleFavorite, loaded };
}