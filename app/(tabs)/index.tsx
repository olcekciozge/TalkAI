import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SCENARIOS } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';
import { TAB_BAR_CLEARANCE } from '@/constants/layout';
import { useSearch } from '@/contexts/SearchContext';

type LevelFilter = 'all' | 'beginner' | 'intermediate';

export default function HomeScreen() {
  const router = useRouter();
  const { searchQuery } = useSearch();

  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  const filteredScenarios = useMemo(() => {
    let list = SCENARIOS;

    if (levelFilter === 'beginner') {
      list = list.filter((s) => s.level === 'A1' || s.level === 'A2');
    } else if (levelFilter === 'intermediate') {
      list = list.filter((s) => s.level === 'B1' || s.level === 'B2');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
          (s) => s.title.toLowerCase().includes(q) || s.aiRole.toLowerCase().includes(q)
      );
    }

    return list;
  }, [levelFilter, searchQuery]);

  const paddedScenarios = useMemo(() => {
    if (filteredScenarios.length % 2 !== 0) {
      return [...filteredScenarios, { id: '__placeholder__' } as any];
    }
    return filteredScenarios;
  }, [filteredScenarios]);

  return (
      <View style={styles.container}>
        <FlatList
            data={paddedScenarios}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.filterRow}>
                <FilterChip
                    label="All"
                    active={levelFilter === 'all'}
                    onPress={() => setLevelFilter('all')}
                />
                <FilterChip
                    label="Beginner"
                    active={levelFilter === 'beginner'}
                    onPress={() => setLevelFilter('beginner')}
                />
                <FilterChip
                    label="Intermediate"
                    active={levelFilter === 'intermediate'}
                    onPress={() => setLevelFilter('intermediate')}
                />
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="text-search" size={32} color={COLORS.inkMuted} />
                <Text style={styles.emptyText}>No scenarios match your search.</Text>
              </View>
            }
            renderItem={({ item }) => {
              if (item.id === '__placeholder__') {
                return <View style={[styles.card, styles.cardPlaceholder]} />;
              }
              const style = SCENARIO_STYLE[item.id];
              return (
                  <Pressable
                      style={styles.card}
                      onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: item.id } })}
                  >
                    {item.isPremium && (
                        <View style={styles.premiumBadge}>
                          <MaterialCommunityIcons name="lock" size={11} color="#fff" />
                        </View>
                    )}

                    <View style={[styles.iconWrap, { backgroundColor: style.color }]}>
                      <MaterialCommunityIcons name={style.icon as any} size={34} color="#fff" />
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardRole} numberOfLines={1}>
                      with {item.aiRole}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>{item.levelLabel}</Text>
                      <Text style={styles.metaDot}>•</Text>
                      <Text style={styles.metaText}>{item.estimatedMinutes} min</Text>
                    </View>
                  </Pressable>
              );
            }}
        />
      </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
      <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.inkMuted,
  },
  chipTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 12,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  gridRow: {
    gap: 12,
    paddingHorizontal: 4,
    justifyContent: 'flex-start',
  },
  card: {
    width: '48%',
    aspectRatio: 0.82,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  cardPlaceholder: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.premium,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrap: {
    width: '100%',
    height: '52%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },
  cardRole: {
    fontSize: 12,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.inkMuted,
    fontWeight: '600',
  },
  metaDot: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.inkMuted,
  },
});