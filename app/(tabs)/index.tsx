import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SCENARIOS } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';

export default function HomeScreen() {
  const router = useRouter();

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Practice today</Text>
          <Text style={styles.subtitle}>Pick a real-life moment and speak it out loud</Text>
        </View>

        <FlatList
            data={SCENARIOS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const style = SCENARIO_STYLE[item.id];
              return (
                  <Pressable
                      style={styles.card}
                      onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: item.id } })}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: style.color + '1A' }]}>
                      <MaterialCommunityIcons name={style.icon as any} size={28} color={style.color} />
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {item.isPremium && (
                            <View style={styles.premiumBadge}>
                              <MaterialCommunityIcons name="lock" size={12} color={COLORS.premium} />
                              <Text style={styles.premiumText}>Premium</Text>
                            </View>
                        )}
                      </View>
                      <Text style={styles.cardRole}>with {item.aiRole}</Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{item.levelLabel}</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{item.estimatedMinutes} min</Text>
                      </View>
                    </View>
                  </Pressable>
              );
            }}
        />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.ink,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.inkMuted,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
  },
  cardRole: {
    fontSize: 13,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  metaDot: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#C9A2271A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.premium,
  },
});